#!/usr/bin/env bash
# Verificacion de EP-001 y EP-002 — spec-eburgos-flx-001-checkout-coupon cycle-01.
# Uso:  pnpm dev:server   (en otra terminal)
#       BASE=http://localhost:3001 bash verify-api.sh
# Sale 0 si todos los CA pasan, 1 si alguno falla.

set -uo pipefail
BASE="${BASE:-http://localhost:3001}"
CUSTOMER='{"name":"Ana Perez","email":"ana@flexibility.com.ar","address":"Av Siempreviva 742","city":"CABA"}'

PASS=0
FAIL=0

jget() {
  node -pe "process.argv[2].split('.').reduce((a,k)=>(a==null?a:a[k]), JSON.parse(process.argv[1])) ?? ''" "$1" "$2"
}

post() {
  curl -s -w '\n%{http_code}' -X POST "$BASE$1" -H 'content-type: application/json' -d "$2"
}

get() {
  curl -s -w '\n%{http_code}' "$BASE$1"
}

body_of() { sed '$d' <<<"$1"; }
status_of() { tail -n1 <<<"$1"; }

check() {
  local ca="$1" desc="$2" expected="$3" actual="$4"
  if [ "$expected" = "$actual" ]; then
    printf '  PASS  %-8s %s\n' "$ca" "$desc"
    PASS=$((PASS + 1))
  else
    printf '  FAIL  %-8s %s\n        esperado: %s\n        obtenido: %s\n' "$ca" "$desc" "$expected" "$actual"
    FAIL=$((FAIL + 1))
  fi
}

new_cart() {
  local cart=''
  local pair
  for pair in "$@"; do
    local resp
    resp=$(post /cart "{\"cartId\":\"$cart\",\"productId\":\"${pair%:*}\",\"quantity\":${pair#*:}}")
    cart=$(jget "$(body_of "$resp")" cartId)
  done
  echo "$cart"
}

echo "verify-api — $BASE"
echo

if [ "$(status_of "$(get /health)")" != "200" ]; then
  echo "El server no responde en $BASE. Levantalo con: pnpm dev:server"
  exit 1
fi

# ---------------------------------------------------------------- EP-001
echo "EP-001  POST /coupons/validate"

CART=$(new_cart p-1002:1)                                  # subtotal 142500
R=$(post /coupons/validate "{\"cartId\":\"$CART\",\"couponCode\":\"PRIMAVERA15\"}")
B=$(body_of "$R")
check CA-001 "aplica y devuelve el descuento del 15%" \
  "200|142500|21375|4500|125625" \
  "$(status_of "$R")|$(jget "$B" totals.subtotal)|$(jget "$B" totals.discount)|$(jget "$B" totals.shipping)|$(jget "$B" totals.total)"

check CA-012 "los importes son enteros" "true" \
  "$(node -pe "['totals.subtotal','totals.discount','totals.shipping','totals.total'].every(p=>Number.isInteger(p.split('.').reduce((a,k)=>a[k],JSON.parse(process.argv[1]))))" "$B")"

R2=$(post /coupons/validate "{\"cartId\":\"$CART\",\"couponCode\":\"  primavera15  \"}")
check CA-003 "minusculas y espacios dan el mismo resultado" "$B" "$(body_of "$R2")"

R3=$(post /coupons/validate "{\"cartId\":\"$CART\",\"couponCode\":\"PRIMAVERA15\"}")
CARTNOW=$(body_of "$(get "/cart?cartId=$CART")")
check CA-013 "es idempotente y no toca el carrito" "$B|142500" \
  "$(body_of "$R3")|$(jget "$CARTNOW" totals.subtotal)"

check CA-021 "los totales del carrito no incluyen descuento" "" "$(jget "$CARTNOW" totals.discount)"

for CASE in "NOEXISTE:coupon_not_found" "VERANO20:coupon_inactive" "INVIERNO25:coupon_expired"; do
  R=$(post /coupons/validate "{\"cartId\":\"$CART\",\"couponCode\":\"${CASE%:*}\"}")
  check CA-004 "${CASE%:*} rechazado como ${CASE#*:}" "409|${CASE#*:}" \
    "$(status_of "$R")|$(jget "$(body_of "$R")" error)"
done

CART_CHICO=$(new_cart p-1006:1)                            # subtotal 63200
R=$(post /coupons/validate "{\"cartId\":\"$CART_CHICO\",\"couponCode\":\"BIENVENIDA10\"}")
B=$(body_of "$R")
check CA-004 "BIENVENIDA10 rechazado por minimo" "409|coupon_min_subtotal" \
  "$(status_of "$R")|$(jget "$B" error)"
check CA-015 "el rechazo por minimo informa el monto requerido" "150000|true" \
  "$(jget "$B" minSubtotal)|$(node -pe "/150\.000/.test(JSON.parse(process.argv[1]).message)" "$B")"
check CA-016 "el rechazo no revela otros cupones" "true" \
  "$(node -pe "const m=JSON.parse(process.argv[1]).message;!/PRIMAVERA|VERANO|INVIERNO|PRUEBA/.test(m)" "$B")"

R=$(post /coupons/validate "{\"cartId\":\"$CART\",\"couponCode\":\"   \"}")
check CA-014 "codigo vacio se rechaza sin consultar el catalogo" "400|bad_request" \
  "$(status_of "$R")|$(jget "$(body_of "$R")" error)"

R=$(post /coupons/validate '{"cartId":"c_inexistente","couponCode":"PRIMAVERA15"}')
check CE-06 "carrito inexistente se rechaza" "400|empty_cart" \
  "$(status_of "$R")|$(jget "$(body_of "$R")" error)"

B=$(body_of "$(get /settings)")
check CA-009 "GET /settings no expone cupones" "storeName,currency,shippingFlat,freeShippingOver" \
  "$(node -pe "Object.keys(JSON.parse(process.argv[1])).join(',')" "$B")"
check CA-009 "no existe forma de listar el catalogo de cupones" "404" \
  "$(status_of "$(get /coupons)")"

echo

# ---------------------------------------------------------------- EP-002
echo "EP-002  POST /checkout"

CART=$(new_cart p-1002:1)                                  # subtotal 142500
R=$(post /checkout "{\"cartId\":\"$CART\",\"customer\":$CUSTOMER,\"couponCode\":\"primavera15\"}")
B=$(body_of "$R")
check CA-002 "confirma con el descuento aplicado" \
  "201|142500|21375|4500|125625|PRIMAVERA15|15|21375" \
  "$(status_of "$R")|$(jget "$B" order.totals.subtotal)|$(jget "$B" order.totals.discount)|$(jget "$B" order.totals.shipping)|$(jget "$B" order.totals.total)|$(jget "$B" order.coupon.code)|$(jget "$B" order.coupon.percentOff)|$(jget "$B" order.coupon.amount)"

CART=$(new_cart p-1002:1)
R=$(post /checkout "{\"cartId\":\"$CART\",\"customer\":$CUSTOMER}")
B=$(body_of "$R")
check CA-005 "sin cupon: mismos totales que antes del ciclo" "201|142500|4500|147000|0|null" \
  "$(status_of "$R")|$(jget "$B" order.totals.subtotal)|$(jget "$B" order.totals.shipping)|$(jget "$B" order.totals.total)|$(jget "$B" order.totals.discount)|$(node -pe "JSON.stringify(JSON.parse(process.argv[1]).order.coupon)" "$B")"

CART=$(new_cart p-1009:1 p-1011:1)                         # subtotal 291600, envio gratis
R=$(post /checkout "{\"cartId\":\"$CART\",\"customer\":$CUSTOMER,\"couponCode\":\"PRIMAVERA15\"}")
B=$(body_of "$R")
check CA-006 "el envio gratis se mantiene aunque el descuento baje del umbral" \
  "291600|43740|0|247860" \
  "$(jget "$B" order.totals.subtotal)|$(jget "$B" order.totals.discount)|$(jget "$B" order.totals.shipping)|$(jget "$B" order.totals.total)"

CART=$(new_cart p-1006:1)                                  # subtotal 63200
R=$(post /checkout "{\"cartId\":\"$CART\",\"customer\":$CUSTOMER,\"couponCode\":\"PRUEBA100\"}")
B=$(body_of "$R")
check CA-017 "un cupon del 100% deja el total en el importe del envio" "63200|63200|4500|4500" \
  "$(jget "$B" order.totals.subtotal)|$(jget "$B" order.totals.discount)|$(jget "$B" order.totals.shipping)|$(jget "$B" order.totals.total)"

ORDERS_ANTES=$(node -pe "JSON.parse(process.argv[1]).items.length" "$(body_of "$(get /orders)")")
CART=$(new_cart p-1002:1)
R=$(post /checkout "{\"cartId\":\"$CART\",\"customer\":$CUSTOMER,\"couponCode\":\"INVIERNO25\"}")
CARTNOW=$(body_of "$(get "/cart?cartId=$CART")")
ORDERS_DESPUES=$(node -pe "JSON.parse(process.argv[1]).items.length" "$(body_of "$(get /orders)")")
check CA-007 "cupon vencido al confirmar: 409, carrito intacto, sin orden" \
  "409|coupon_expired|142500|$ORDERS_ANTES" \
  "$(status_of "$R")|$(jget "$(body_of "$R")" error)|$(jget "$CARTNOW" totals.subtotal)|$ORDERS_DESPUES"

R=$(post /checkout "{\"cartId\":\"$CART\",\"customer\":$CUSTOMER}")
B=$(body_of "$R")
check CA-022 "reintentar sin cupon confirma la compra" "201|142500|147000" \
  "$(status_of "$R")|$(jget "$B" order.totals.subtotal)|$(jget "$B" order.totals.total)"

CART=$(new_cart p-1002:1)
R=$(post /checkout "{\"cartId\":\"$CART\",\"customer\":{\"name\":\"x\",\"email\":\"nope\"},\"couponCode\":\"INVIERNO25\"}")
check CE-09 "los errores de formulario prevalecen sobre el cupon" "422|validation_error" \
  "$(status_of "$R")|$(jget "$(body_of "$R")" error)"

CART=$(new_cart p-1004:4)
post /cart/update "{\"cartId\":\"$CART\",\"productId\":\"p-1004\",\"quantity\":9}" > /dev/null
R=$(post /checkout "{\"cartId\":\"$CART\",\"customer\":$CUSTOMER,\"couponCode\":\"INVIERNO25\"}")
check CE-08 "la falta de stock prevalece sobre el cupon" "409|no_stock" \
  "$(status_of "$R")|$(jget "$(body_of "$R")" error)"

echo
echo "  $PASS PASS · $FAIL FAIL"
[ "$FAIL" -eq 0 ]
