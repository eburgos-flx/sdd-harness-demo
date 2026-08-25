# Architect — Cycle 1: checkout-coupon

> **Input:** sdd/specs/spec-eburgos-flx-001-checkout-coupon/cycles/cycle-01/functional.md
> **Output:** sdd/specs/spec-eburgos-flx-001-checkout-coupon/cycles/cycle-01/architect.md
> **Generado por:** sdd-architect

---

## Decisiones técnicas

### AD-01: Los cupones son un dato más del store, no una entidad nueva

`server/data/store.json` gana una colección `coupons` hermana de `products` y `settings`.
Se lee con `readStore()` como todo lo demás.

**Por qué:** el repo no tiene base de datos y la spec deja el ABM explícitamente fuera de
alcance (S-4). Una campaña se define agregando una entrada al JSON y versionándola con el
repo, que es exactamente cómo se administra hoy el catálogo.

**Forma de un cupón:**

| Campo         | Tipo             | Regla                                                        |
| ------------- | ---------------- | ------------------------------------------------------------ |
| `code`        | string           | Identificador visible. Se compara normalizado (RN-06)        |
| `percentOff`  | number (entero)  | 1..100. Porcentaje sobre el subtotal de productos            |
| `active`      | boolean          | `false` desactiva el cupón sin borrarlo del historial        |
| `expiresAt`   | string `YYYY-MM-DD` | Último día en que vale, inclusive (RN-08)                 |
| `minSubtotal` | number (entero)  | Subtotal mínimo. `0` = sin mínimo                            |

No hay contador de usos: sin persistencia, un contador en memoria se perdería en cada
reinicio y mentiría (RN-11, S-5).

### AD-02: `findCoupon(code)` vive en `store.js` y es un calco de `findProduct(id)`

```js
export function findCoupon(code) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return null;
  return readStore().coupons.find((c) => c.code.toUpperCase() === normalized) || null;
}
```

**Por qué:** la Restricción 2 de la spec obliga a que todo acceso a datos pase por
`store.js`. La normalización (RN-06) se resuelve acá adentro, en una expresión, para no
crear un helper que obligue a `utils.js` a importar `store.js` y a `store.js` a importar
`utils.js` — un ciclo de imports que hoy no existe (`utils.js → store.js`, nunca al revés).

### AD-03: Las reglas del cupón van en `utils.js`, junto a `calcTotals()`

Se agregan dos funciones exportadas. **Ninguna firma existente cambia** (RNF-1).

```js
export function calcCouponDiscount(subtotal, percentOff)
// → Math.round(subtotal * percentOff / 100)   (RN-02)

export function resolveCoupon(couponCode, subtotal)
// → { coupon, discount }                                   cuando aplica
// → { error, message }                                     cuando no
// → { error: 'coupon_min_subtotal', message, minSubtotal }  caso con dato extra
```

**Por qué acá y no en un módulo nuevo:** `utils.js` ya contiene la otra regla de negocio
del dominio de precios — el umbral de envío gratis dentro de `calcTotals()`. Un
`server/src/coupons.js` sería más prolijo en abstracto, pero introduce una capa que este
server no tiene y la Restricción 1 pide seguir el patrón existente, no mejorarlo.
Evaluado y descartado a propósito.

**Una sola función de resolución para los dos consumidores.** El endpoint de
previsualización y el handler de `/checkout` llaman a `resolveCoupon()`. Así RN-09 y RN-10
son estructuralmente ciertos: la previsualización no puede divergir de la confirmación
porque ejecutan el mismo código.

### AD-04: Vencimiento por comparación de fechas `YYYY-MM-DD`

`new Date().toISOString().slice(0, 10) <= coupon.expiresAt`.

**Por qué:** comparación lexicográfica de strings ISO, que para ese formato equivale a
comparación cronológica. Da RN-08 (vale todo el día del vencimiento) sin aritmética de
fechas ni zonas horarias, y usa `toISOString()`, que es lo que ya usan `store.js` e
`index.js` para todos los timestamps. La consecuencia —el corte es a medianoche UTC, 21 h
en Argentina— es aceptable para cupones cuya granularidad es el día.

### AD-05: Los cuatro rechazos son `409`, con código propio cada uno

| Código                 | Situación                        | Campos extra  |
| ---------------------- | -------------------------------- | ------------- |
| `coupon_not_found`     | CE-02 — el código no existe      | —             |
| `coupon_inactive`      | CE-03 — `active: false`          | —             |
| `coupon_expired`       | CE-04 — venció                   | —             |
| `coupon_min_subtotal`  | CE-05 — no llega al mínimo       | `minSubtotal` |

**Por qué 409 y no 422:** el `422` de este server tiene una forma tomada,
`{ error: 'validation_error', errors: { campo: mensaje } }`, y es para errores de
formulario. Un cupón vencido no es un campo mal escrito: es el estado del mundo que no
permite la operación — exactamente lo que `/checkout` ya reporta con `409` para `no_stock`
y `product_gone`, incluido el patrón de agregar un dato al payload (`available` allá,
`minSubtotal` acá). Un solo status para la familia entera le da al front un único camino
de manejo, y mantiene CE-09/CE-18 separados: los errores de formulario siguen llegando
como `422` y nunca se mezclan con el cupón.

`coupon_not_found` también es `409`, no `404`: el `404` de este server significa "la URL
apunta a un recurso que no existe" (`/products/:id`), y acá el recurso que no existe es un
dato del body, no la ruta.

### AD-06: Ruta nueva en el estilo de `routes/products.js`

`server/src/routes/coupons.js`, plugin `export default async function`, registrado en
`index.js` con `await app.register(couponRoutes)` junto a los otros dos.

**Por qué:** la Restricción 3 prohíbe inventar un tercer estilo. De los dos que conviven,
`routes/products.js` es el vigente («las únicas que quedaron en el estilo plugin después
de la limpieza de 2024»). `routes/cart.js` no se toca.

### AD-07: El descuento entra en `/checkout` después de la revalidación de stock

Orden de verificaciones del handler, con el cupón insertado en un solo punto:

```
cartId ausente        → 400 bad_request
carrito vacío         → 400 empty_cart
datos del cliente     → 422 validation_error          ← CE-09 prevalece
loop de líneas        → 409 product_gone | no_stock   ← CE-08 prevalece
envío                 → (lógica actual, intacta)
▶ cupón               → 409 coupon_*                  ← nuevo, acá
orden + clearCart     → 201
```

**Por qué en esa posición:** el cupón necesita el `subtotal` ya revalidado contra el
catálogo, así que no puede ir antes del loop; y tiene que ir antes de `pushOrder()` /
`clearCart()` para que CE-07 se cumpla —rechazo sin crear orden y sin vaciar el carrito—
sin necesidad de compensar nada.

### AD-08: El envío se calcula sobre el subtotal previo al descuento

Se conserva el bloque tal cual está hoy en `index.js`, incluidos el `4500` y el `250000`
hardcodeados, **y se lo deja donde está: antes del cupón**. RN-03 y CA-006 salen de esa
posición, sin código adicional.

**Deuda que este ciclo NO arregla** (Restricción 6): ese bloque duplica `calcTotals()` y
repite dos valores que ya viven en `settings`. El cupón se apoya encima sin tocarla. Queda
como candidata a fix posterior — moverla ahora ampliaría el diff justo en el handler más
delicado del server.

### AD-09: `totals.discount` y `order.coupon` son campos aditivos

```jsonc
"totals": { "subtotal": 100000, "discount": 15000, "shipping": 4500, "total": 89500 },
"coupon": { "code": "PRIMAVERA15", "percentOff": 15, "amount": 15000 }  // null sin cupón
```

**Por qué aditivo:** `CartDrawer.jsx` lee `order.totals.total` y `CheckoutForm.jsx` lee
`subtotal`/`shipping`/`total`. Agregar claves no rompe ninguno de los dos (CA-005,
CA-021). Sin cupón, `discount` es `0` y `coupon` es `null`.

### AD-10: El front manda el código, nunca el importe

`client/src/api.js` gana `validateCoupon(cartId, couponCode)` y suma un tercer parámetro
opcional a `checkout(cartId, customer, couponCode)`. El body de `/checkout` no acepta
ningún campo de descuento: si llegara, se ignora — el server recalcula (RN-09).

El nombre del campo es `couponCode` en los dos endpoints, no `code` en uno y `couponCode`
en el otro.

### AD-11: El estado del cupón vive en `CheckoutForm`

`CheckoutForm.jsx` ya es el componente con estado propio (`customer`). Suma
`couponCode`, `appliedCoupon`, `couponError` y `checkingCoupon`, y recibe `cartId` de
`CartDrawer` para poder validar. Al enviar, pasa el código a `onSubmit(customer, couponCode)`.

**Por qué no en `App.jsx`:** el cupón no existe fuera del paso de checkout — el carrito
lateral no lo muestra (fuera de alcance, CA-021). Subirlo a `App` obligaría a limpiarlo en
cada transición de vista sin ganar nada.

---

## Cambios en schema (sdd/schema.json)

**Ninguno.** `legacy-shop` no tiene base de datos: el catálogo es un JSON en disco y los
carritos y órdenes viven en memoria (`server/src/store.js`). La colección `coupons` de
AD-01 es un archivo de datos, no una tabla, y `sdd/schema.json` registra tablas. Se deja
sin tocar a propósito.

---

## Contratos de API (sdd/api.json)

App-key: `legacy-shop`.

### `POST /coupons/validate` — EP-001 (nuevo)

Previsualiza el descuento. No muta el carrito, no crea orden, es idempotente (CA-013).

**Request:**

```json
{ "cartId": "c_k3f9x2", "couponCode": "primavera15" }
```

**Response 200:**

```json
{
  "coupon": { "code": "PRIMAVERA15", "percentOff": 15 },
  "totals": {
    "subtotal": 100000,
    "discount": 15000,
    "shipping": 4500,
    "total": 89500,
    "freeShippingOver": 250000
  }
}
```

`totals` sale de `calcTotals(cart.items)` más `discount`; `shipping` por lo tanto ya está
calculado sobre el subtotal previo al descuento (AD-08). `coupon.code` se devuelve como
está en el store, no como lo tipeó la persona.

**Errores:**

| Status | `error`               | Cuándo                                          |
| ------ | --------------------- | ----------------------------------------------- |
| 400    | `bad_request`         | Falta `cartId`, o `couponCode` vacío (CE-01)    |
| 400    | `empty_cart`          | El carrito no existe o no tiene líneas (CE-06)  |
| 409    | `coupon_not_found`    | CE-02                                           |
| 409    | `coupon_inactive`     | CE-03                                           |
| 409    | `coupon_expired`      | CE-04                                           |
| 409    | `coupon_min_subtotal` | CE-05 — incluye `minSubtotal` en el payload     |

> El endpoint responde **solo sobre el código consultado**. No existe `GET /coupons`
> ni ninguna otra forma de enumerar el catálogo (RN-12, CA-009, CA-016).

### `POST /checkout` — EP-002 (existente, contrato ampliado)

**Request (delta):** el body acepta `couponCode` opcional. `cartId` y `customer` no
cambian.

```json
{
  "cartId": "c_k3f9x2",
  "customer": { "name": "...", "email": "...", "address": "...", "city": "...", "notes": "" },
  "couponCode": "PRIMAVERA15"
}
```

**Response 201 (delta):** `order.totals` gana `discount`; `order` gana `coupon`.

```json
{
  "order": {
    "id": "ord_a1b2c3",
    "createdAt": "2026-08-24T18:00:00.000Z",
    "status": "confirmed",
    "customer": { "...": "..." },
    "items": [],
    "totals": { "subtotal": 100000, "discount": 15000, "shipping": 4500, "total": 89500 },
    "coupon": { "code": "PRIMAVERA15", "percentOff": 15, "amount": 15000 }
  },
  "cart": { "cartId": "c_k3f9x2", "items": [], "totals": {} }
}
```

Sin `couponCode`: `discount: 0`, `coupon: null`, y el resto de la respuesta idéntica a
antes de este ciclo (CA-005).

**Errores:** los actuales (400 `bad_request`, 400 `empty_cart`, 422 `validation_error`,
409 `product_gone`, 409 `no_stock`) **más** los cuatro `409 coupon_*` de AD-05, evaluados
en la posición de AD-07.

---

## Dependencias externas

**Ninguna.** No se agrega ni un paquete: `package.json` no cambia (RNF-2). Todo se resuelve
con Fastify 5 y React 18, que ya están.
