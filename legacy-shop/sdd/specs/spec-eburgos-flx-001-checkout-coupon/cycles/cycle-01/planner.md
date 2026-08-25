# Sprint Plan — Cycle 1: checkout-coupon

> **Input:** sdd/specs/spec-eburgos-flx-001-checkout-coupon/cycles/cycle-01/functional.md
> **Output:** sdd/specs/spec-eburgos-flx-001-checkout-coupon/cycles/cycle-01/planner.md
> **Generado por:** sdd-planner

---

## Resumen del ciclo

| Campo       | Valor                          |
| ----------- | ------------------------------ |
| Ciclo       | 1                              |
| Módulo      | checkout-coupon                |
| App         | apps/legacy-shop (repo standalone: `server/`, `client/`) |
| Duración    | 1 semana                       |
| Tasks       | 9 (4 backend · 3 frontend · 2 verificación) |
| Estimación  | 19 h · 20 SP                   |

### Nota sobre la regla de tests

La regla 7 del planner pide una task de tests por HU. La spec lo restringe: RNF-5 fija que
este repo no tiene framework de tests y que **este ciclo no lo introduce** — montar testing
es una decisión propia, no un efecto colateral del cupón. Se cumple el espíritu de la regla
con **TASK-008 y TASK-009**, que producen verificación *reproducible y versionada* (un
script de `curl` y un recorrido de UI documentado, ambos en `cycle-01/artifacts/`) en vez
de una suite. Cada CA queda con evidencia ejecutable para el Reviewer.

---

## Tasks backend

### TASK-001: Colección `coupons` en el store y accessor `findCoupon`

- **Descripción:** agregar la colección `coupons` a `server/data/store.json` con cupones de
  prueba que cubran los cuatro motivos de rechazo (vigente, inactivo, vencido, con mínimo
  alto), y el accessor `findCoupon(code)` en `server/src/store.js` calcado de
  `findProduct(id)`, con la normalización de RN-06 adentro (AD-01, AD-02).
- **Archivos a crear/modificar:**
  - `server/data/store.json`
  - `server/src/store.js`
- **Criterio de done:**
  - [ ] Cada cupón tiene `code`, `percentOff`, `active`, `expiresAt`, `minSubtotal`
  - [ ] Hay al menos un cupón para cada uno de: vigente, inactivo, vencido, mínimo alto
  - [ ] `findCoupon` resuelve igual con mayúsculas, minúsculas y espacios de borde
  - [ ] `findCoupon('')` y `findCoupon(undefined)` devuelven `null` sin reventar
  - [ ] `store.js` no importa nada de `utils.js` (no se crea ciclo de imports)
- **Dependencias:** ninguna

### TASK-002: Reglas del cupón en `utils.js`

- **Descripción:** `calcCouponDiscount(subtotal, percentOff)` y `resolveCoupon(couponCode,
  subtotal)` con las siete condiciones de RN-07 y los códigos de error de AD-05. Es la
  única función de resolución: la usan la previsualización y `/checkout`, así RN-09/RN-10
  se cumplen por construcción (AD-03).
- **Archivos a crear/modificar:**
  - `server/src/utils.js`
- **Criterio de done:**
  - [ ] El descuento es entero: `Math.round(subtotal * percentOff / 100)` (RN-02)
  - [ ] Los cuatro rechazos devuelven códigos distinguibles; `coupon_min_subtotal` incluye
        `minSubtotal` (CE-02..CE-05)
  - [ ] El vencimiento compara `YYYY-MM-DD` e incluye el día del vencimiento (RN-08, AD-04)
  - [ ] `calcTotals()`, `shortId()`, `isEmail()` y `formatMoney()` quedan sin cambios (RNF-1)
- **Dependencias:** TASK-001

### TASK-003: Endpoint `POST /coupons/validate`

- **Descripción:** `server/src/routes/coupons.js` en el estilo plugin `async/await` de
  `routes/products.js`, registrado en `index.js`. Devuelve el contrato EP-001: cupón +
  totales con descuento, calculados con `calcTotals(cart.items)` para que el envío quede
  sobre el subtotal previo al descuento (AD-06, AD-08). No muta el carrito.
- **Archivos a crear/modificar:**
  - `server/src/routes/coupons.js` (nuevo)
  - `server/src/index.js` (solo el `register`)
- **Criterio de done:**
  - [ ] 400 `bad_request` sin `cartId` o con `couponCode` vacío (CE-01)
  - [ ] 400 `empty_cart` con carrito inexistente o sin líneas (CE-06)
  - [ ] 409 con el código correspondiente en los cuatro rechazos
  - [ ] 200 con `coupon.code` tal como está en el store y totales enteros (CA-012)
  - [ ] Dos llamadas seguidas devuelven lo mismo y el carrito queda igual (CA-013)
  - [ ] `routes/cart.js` no se toca
- **Dependencias:** TASK-002

### TASK-004: Descuento en `POST /checkout`

- **Descripción:** aceptar `couponCode` en el body, resolverlo con `resolveCoupon()` en la
  posición de AD-07 —después de la revalidación de stock, antes de `pushOrder()`—, y sumar
  `totals.discount` y `order.coupon` (AD-09). El bloque de envío queda donde está y como
  está (AD-08, Restricción 6).
- **Archivos a crear/modificar:**
  - `server/src/index.js`
- **Criterio de done:**
  - [ ] Sin `couponCode`: misma respuesta que antes del ciclo, con `discount: 0` y
        `coupon: null` (CA-005)
  - [ ] `total = subtotal - discount + shipping`, nunca negativo (RN-04, CA-017)
  - [ ] El envío se evalúa sobre el subtotal previo al descuento (CA-006)
  - [ ] Cupón rechazado ⇒ no se crea orden, no se vacía el carrito (CE-07, CA-007)
  - [ ] Errores de formulario (422) y de stock (409) siguen prevaleciendo (CE-08, CE-09)
  - [ ] La orden registra `code`, `percentOff` y `amount` (CA-002)
- **Dependencias:** TASK-002

## Tasks frontend

### TASK-005: Cliente HTTP del cupón

- **Descripción:** `validateCoupon(cartId, couponCode)` en `client/src/api.js` y tercer
  parámetro opcional `couponCode` en `checkout()` (AD-10). El front nunca manda importes.
- **Archivos a crear/modificar:**
  - `client/src/api.js`
- **Criterio de done:**
  - [ ] Ambas funciones usan el helper `post()` existente
  - [ ] `checkout(cartId, customer)` sin tercer argumento sigue funcionando igual
  - [ ] El body no incluye ningún campo de descuento
- **Dependencias:** TASK-003, TASK-004

### TASK-006: Campo de cupón y línea de descuento en `CheckoutForm`

- **Descripción:** estado local del cupón (`couponCode`, `appliedCoupon`, `couponError`,
  `checkingCoupon`), campo con acción de aplicar y quitar, y línea de descuento en el
  bloque de totales con el código aplicado (AD-11).
- **Archivos a crear/modificar:**
  - `client/src/components/CheckoutForm.jsx`
  - `client/src/styles.css` (solo si hace falta una clase nueva)
- **Criterio de done:**
  - [ ] El error del cupón se muestra con `field__error`, igual que los otros campos (CA-008)
  - [ ] Mientras valida, el botón de aplicar no permite un segundo envío (CA-019)
  - [ ] Aplicar otro cupón reemplaza el descuento, no lo suma (CA-020)
  - [ ] Quitarlo restaura los totales originales sin recargar (CA-008)
  - [ ] Los importes se muestran con `formatPrice()`
- **Dependencias:** TASK-005

### TASK-007: Wiring de `CartDrawer` y `App`

- **Descripción:** pasar `cartId` a `CheckoutForm`, propagar `couponCode` en
  `onSubmit(customer, couponCode)` hasta `api.checkout()`, y mostrar el rechazo del cupón
  al confirmar sin perder carrito ni datos cargados (CE-07, CA-018, CA-022).
- **Archivos a crear/modificar:**
  - `client/src/components/CartDrawer.jsx`
  - `client/src/App.jsx`
- **Criterio de done:**
  - [ ] Un 409 `coupon_*` al confirmar deja la persona en el formulario con el mensaje
        visible y el carrito intacto (CA-007, CA-018)
  - [ ] Reintentar sin cupón confirma la compra normalmente (CA-022)
  - [ ] Los totales del carrito lateral no cambian respecto de antes del ciclo (CA-021)
- **Dependencias:** TASK-006

## Tasks de verificación

### TASK-008: Script de verificación de la API

- **Descripción:** script `curl` versionado que ejercita EP-001 y EP-002 y deja evidencia
  PASS/FAIL por CA de backend: CA-001..CA-007, CA-009, CA-012..CA-017, CA-022.
- **Archivos a crear/modificar:**
  - `sdd/specs/spec-eburgos-flx-001-checkout-coupon/cycles/cycle-01/artifacts/verify-api.sh`
- **Criterio de done:**
  - [ ] Corre contra el server levantado con `pnpm dev:server` sin configuración extra
  - [ ] Imprime PASS/FAIL por CA y sale con código distinto de 0 si algo falla
  - [ ] Cubre el caso de `GET /settings` sin información de cupones (CA-009)
  - [ ] Referenciado en `cycle.json["artifacts"]`
- **Dependencias:** TASK-004

### TASK-009: Recorrido de UI documentado

- **Descripción:** guion paso a paso del recorrido en la interfaz con el resultado esperado
  de cada paso, para los CA que solo se verifican en pantalla: CA-008, CA-018, CA-019,
  CA-020, CA-021.
- **Archivos a crear/modificar:**
  - `sdd/specs/spec-eburgos-flx-001-checkout-coupon/cycles/cycle-01/artifacts/verify-ui.md`
- **Criterio de done:**
  - [ ] Cada paso indica qué hacer y qué tiene que verse
  - [ ] Cada CA de UI queda cubierto por al menos un paso
  - [ ] Referenciado en `cycle.json["artifacts"]`
- **Dependencias:** TASK-007

## Orden de ejecución

```
TASK-001 → TASK-002 → ┬→ TASK-003 → ┬→ TASK-005 → TASK-006 → TASK-007 → TASK-009
                      └→ TASK-004 → ┘
                                    └→ TASK-008
```

Camino crítico: **TASK-001 → 002 → 004 → 005 → 006 → 007 → 009** (14 h). TASK-003 corre en
paralelo con TASK-004 y TASK-008 en paralelo con el frontend.

---

## Pendiente de documentar en contexto

Desviaciones detectadas al implementar, para que el Reviewer las evalúe al cerrar:

1. **CA-001 y CA-002 usan un subtotal irreproducible.** La spec los redacta sobre un
   carrito de subtotal $100.000, pero con el catálogo real de `store.json` **no existe
   ninguna combinación de productos que dé exactamente $100.000** (verificado por
   fuerza bruta sobre las 12 líneas del catálogo). `verify-api.sh` los comprueba con
   `p-1002 x1` (subtotal $142.500) y la misma relación: descuento $21.375, envío $4.500,
   total $125.625. La regla verificada es idéntica; el número del enunciado, no.
   Si se quiere el enunciado literal, hay que agregar un producto de precio redondo al
   catálogo — decisión de producto, no del ciclo.

2. **CA-021 se verifica también por API.** El CA está redactado como observación de
   pantalla, pero la parte sustantiva —que los totales del carrito no incluyan descuento—
   se comprueba sin navegador en `verify-api.sh` (`GET /cart` no trae `discount`). El paso
   visual queda igual en `verify-ui.md`.

3. **Los CA de pantalla quedaron sin ejecutar.** CA-008, CA-018, CA-019 y CA-020 solo se
   verifican en la interfaz y el entorno de implementación no tenía navegador manejable.
   `verify-ui.md` deja el guion listo con la columna de resultado vacía. **No cuentan como
   verificados** hasta que un humano lo corra: el Reviewer debe marcarlos `PENDING`, no
   `PASS`.

4. **`App.jsx` endurece el acceso a `err.payload`.** El `catch` de `handleCheckout` leía
   `err.payload.errors` directo; ahora hace `const failure = err.payload || {}` porque la
   rama nueva de cupón consulta `failure.error` y un error de red (CE-10) llega sin
   `payload`. Es una línea preexistente tocada dentro del bloque que el ciclo ya modificaba.
