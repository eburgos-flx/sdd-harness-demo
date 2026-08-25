# spec-eburgos-flx-001-checkout-coupon cycle-01 — 2026-08-24

## Estado

Primer ciclo SDD sobre esta app, que **preexistía a SDD** (tienda interna desde 2023). El
código vive en la **raíz del repo**, no en `apps/legacy-shop/`: `server/` (Fastify 5, API
REST sin base de datos) y `client/` (React 18 + Vite 6). pnpm, Node ≥ 20, sin Nx.

Queda implementado el módulo **checkout-coupon**: cupón de descuento porcentual sobre el
subtotal, previsualizable antes de confirmar y revalidado en el server al confirmar.
Backend verificado 23/23 con `verify-api.sh`; los CA de pantalla quedaron **pendientes de
ejecución humana** (`verify-ui.md`).

## Estructura

Patrones vigentes de la app, confirmados y respetados por este ciclo:

- **Datos:** todo acceso pasa por `server/src/store.js`. El catálogo es
  `server/data/store.json` cacheado en memoria (`readStore()`); carritos y órdenes viven en
  `Map`/array en memoria y se pierden al reiniciar. Nuevo: colección `coupons` y accessor
  `findCoupon(code)`, calcado de `findProduct(id)`, con la normalización del código adentro.
- **Reglas de precio:** viven en `server/src/utils.js`, junto a `calcTotals()`. Nuevo:
  `calcCouponDiscount()`, `resolveCoupon()` y `calcDiscountedTotal()`. `resolveCoupon()` es
  la **única** resolución del cupón — la usan la previsualización y `/checkout`, así los dos
  no pueden divergir.
- **Rutas:** conviven dos estilos. `routes/products.js` es el vigente (plugin
  `export default async function`) y es el que se usa para lo nuevo;
  `routes/cart.js` sigue en callbacks + `reply.send()` y **no se migra**. Nuevo:
  `server/src/routes/coupons.js`.
- **Errores:** envelope `{ error: '<codigo_snake>', message }`. `400` bad_request/empty_cart,
  `404` recurso de la URL inexistente, `409` conflicto de estado (`no_stock`, `product_gone`
  y ahora `coupon_not_found` / `coupon_inactive` / `coupon_expired` / `coupon_min_subtotal`),
  `422` `validation_error` con mapa `errors` **solo** para campos de formulario.
- **Totales:** se calculan **siempre** en el server; el front solo formatea (`format.js`).
- **Front:** SPA sin router. `App.jsx` tiene todo el estado; `CartDrawer` es el panel y
  `CheckoutForm` el único componente con estado propio — ahora también dueño del estado del
  cupón. El front transmite el **código**, nunca el importe del descuento.

## Dependencias

Ninguna nueva. Fastify 5, `@fastify/cors`, React 18, Vite 6 — `package.json` sin cambios.

## Deuda conocida (no tocada por este ciclo, a propósito)

- `POST /checkout` sigue entero en `server/src/index.js`, duplica el cálculo de
  `calcTotals()` y hardcodea `4500` / `250000` además de tenerlos en `settings`. El cupón se
  apoya encima sin arreglarla. **Candidata a fix o ciclo propio.**
- No hay framework de tests («no hay tests, nunca hubo»). La verificación de este ciclo es
  un script de `curl` y un guion de UI en `cycles/cycle-01/artifacts/`.
- Sin persistencia: por eso el cupón no tiene límite de usos ni contador de canjes.

## Qué sigue

- Correr `artifacts/verify-ui.md` y completar su columna de resultado — CA-008, CA-018,
  CA-019 y CA-020 están sin verificar.
- Si el negocio pide cupones de monto fijo, tope de descuento en pesos o límite de usos,
  hace falta una spec nueva; lo último exige persistencia.
- Los cupones del store son de prueba: reemplazarlos por los de campaña real antes de usarlo.
