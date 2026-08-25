# SPEC-eburgos-flx-001: Cupón de descuento en checkout

> Autor: `eburgos-flx` | Subproyecto: `apps/legacy-shop` | Creada: 2026-08-24
> Estado: en checkpoint de aprobación — sin ciclo abierto.

## Resumen Ejecutivo

Permitir que quien compra ingrese un **código de cupón** en el checkout y obtenga un
**descuento porcentual** sobre el subtotal del pedido. El cupón se valida contra el
catálogo de cupones **antes de confirmar la compra** (previsualización del descuento) y
se **revalida en el servidor** al confirmar, de modo que el total facturado nunca dependa
de lo que mande el front.

Es una funcionalidad aditiva sobre `legacy-shop`, la tienda interna de accesorios de
escritorio. **No es un refactor**: el código existente de catálogo, carrito y checkout se
toca lo mínimo indispensable para engancharle el descuento.

## Contexto de Negocio

- **Problema:** hoy no hay ninguna forma de aplicar promociones. Las campañas internas
  (onboarding, aniversarios, liquidación de stock) se resuelven a mano, corrigiendo el
  precio después de la compra o publicando productos con precio bajado.
- **Usuarios afectados:** el equipo de Flexibility que compra en la tienda interna
  (comprador final) y quien administra el catálogo, que hoy define los cupones editando
  `server/data/store.json` — mismo mecanismo con el que ya administra productos y
  settings.
- **Impacto esperado:** una campaña se define agregando una entrada en el JSON del store,
  sin tocar código ni precios de productos, y el descuento queda registrado en la orden.

## Alcance del primer ciclo (cycle-01)

**Dentro:**

1. Catálogo de cupones como dato del store (`server/data/store.json`), leído por los
   accessors de `server/src/store.js` — mismo patrón que `products` y `settings`.
2. Endpoint de **validación previa** del cupón: dado un `cartId` y un `code`, devuelve si
   el cupón aplica y cuánto descuenta, sin modificar el carrito ni confirmar nada.
3. **Aplicación del cupón en `POST /checkout`**: el código viaja en el body, el server lo
   revalida contra el catálogo y recalcula los totales incluyendo el descuento.
4. La **orden confirmada** registra el cupón aplicado y el monto descontado.
5. En el **front**, campo de cupón dentro de `CheckoutForm.jsx`: aplicar, ver el descuento
   reflejado en el bloque de totales, ver el error si el cupón no aplica, y quitarlo.

**Fuera (explícito, no es olvido):**

- Alta/baja/edición de cupones por UI o API — se administran editando el JSON del store,
  igual que el catálogo.
- Límites de uso (por persona, por cupón, cupón de un solo uso): el server no tiene
  persistencia ni identidad de usuario; los contadores se perderían en cada reinicio.
- Cupones de **monto fijo**, envío gratis, 2x1 o restricciones por producto/categoría:
  este ciclo cubre **sólo porcentaje sobre el subtotal**.
- Mostrar el descuento en el carrito lateral (`CartDrawer`): el cupón vive en el paso de
  checkout, no en el carrito. Los totales del drawer siguen saliendo tal cual de
  `calcTotals()` y no cambian.
- Arreglar la deuda técnica del checkout (ver **Restricciones**). El descuento se suma a
  la lógica que ya está; no se aprovecha el ciclo para reordenarla.

## Restricciones del legacy (INVIOLABLES en este ciclo)

Vienen del README y del código actual. Un cambio que las viole no pasa la revisión:

1. **Los totales se calculan siempre en el server.** El front sólo formatea. El descuento
   que se previsualiza es informativo: el número que vale es el que recalcula `/checkout`.
2. **Todo acceso a datos pasa por `server/src/store.js`.** Los cupones se leen con un
   accessor nuevo del mismo estilo que `findProduct(id)`; ningún handler lee el JSON por
   su cuenta.
3. **No se inventa un tercer estilo de rutas.** Conviven dos: `routes/products.js`
   (plugin `async`/`await`) y `routes/cart.js` (callbacks + `reply.send()`). Lo nuevo se
   escribe en el estilo de `routes/products.js`, que es el vigente; `routes/cart.js` no
   se migra.
4. **Se respeta el envelope de error existente**: `{ error: '<codigo_snake>', message }`,
   con `422 + { error: 'validation_error', errors: {...} }` para errores de formulario, y
   `409` para conflictos de estado (como ya hace `no_stock` / `product_gone`).
5. **`GET /settings` sigue devolviendo el objeto whitelisteado** (`storeName`, `currency`,
   `shippingFlat`, `freeShippingOver`). El catálogo de cupones **no** se agrega ahí.
6. **Deuda conocida que NO se toca:** `POST /checkout` vive entero en
   `server/src/index.js`, duplica el cálculo de totales de `calcTotals()` y tiene el envío
   hardcodeado (`4500` / `250000`) además de estar en `settings`. El descuento se agrega
   sobre esa lógica tal como está. Queda registrada como deuda para un fix/ciclo posterior
   — no se arrastra a este.
7. **Los importes son enteros en pesos** (el front formatea con
   `maximumFractionDigits: 0`). El descuento se redondea a entero, no se propagan
   centavos.

## Requisitos Funcionales (RF)

- **RF-1 — Catálogo de cupones.** `server/data/store.json` incorpora una colección
  `coupons`. Cada cupón declara al menos: código, porcentaje de descuento, si está activo,
  fecha de vencimiento y subtotal mínimo requerido. Se lee con un accessor de `store.js`.
- **RF-2 — Validación previa.** Existe un endpoint que, dado el carrito y un código,
  responde si el cupón aplica. Si aplica, devuelve el porcentaje, el monto de descuento y
  los totales resultantes. Si no aplica, devuelve el motivo con un código de error
  específico. Este endpoint **no** modifica el carrito ni crea la orden.
- **RF-3 — Códigos insensibles a mayúsculas y espacios.** `  primavera25 ` y
  `PRIMAVERA25` resuelven al mismo cupón.
- **RF-4 — Reglas de rechazo.** Un cupón se rechaza, con motivo diferenciado, cuando: no
  existe, está inactivo, está vencido, o el subtotal del carrito no llega al mínimo
  exigido. El mensaje que ve la persona indica cuál de los cuatro casos es.
- **RF-5 — Un cupón por orden.** No se acumulan descuentos. Aplicar un cupón nuevo
  reemplaza al anterior.
- **RF-6 — Cálculo del descuento.** El descuento es `porcentaje` aplicado sobre el
  **subtotal de productos**, redondeado a entero. El envío no se descuenta.
- **RF-7 — Envío inalterado por el cupón.** El umbral de envío gratis se evalúa contra el
  subtotal **previo al descuento**: un cupón nunca le saca a la persona un beneficio de
  envío que ya se había ganado. *(supuesto — ver Supuestos S-2)*
- **RF-8 — Total final.** `total = subtotal - descuento + envío`, y nunca es negativo.
- **RF-9 — Revalidación al confirmar.** `POST /checkout` acepta el código en el body y lo
  **vuelve a validar** con las mismas reglas antes de confirmar. Si en el intervalo el
  cupón dejó de aplicar (venció, se desactivó, cambió el carrito y ya no llega al mínimo),
  el checkout **no se confirma** y responde el motivo. El front nunca envía el monto de
  descuento: envía el código.
- **RF-10 — Checkout sin cupón.** El body sin código de cupón se comporta exactamente como
  hoy: mismos totales, misma respuesta, mismos códigos de error.
- **RF-11 — La orden registra el cupón.** La orden confirmada guarda el código aplicado,
  el porcentaje y el monto descontado, y sus totales incluyen el descuento. Sin cupón, el
  registro queda vacío/nulo.
- **RF-12 — UI del cupón en el checkout.** `CheckoutForm.jsx` suma un campo de cupón con
  acción de aplicar. Al aplicar con éxito, el bloque de totales muestra una línea de
  descuento (con el código) y el total actualizado. Al fallar, muestra el mensaje del
  server bajo el campo, con el mismo tratamiento visual que los errores de los otros
  campos (`field__error`).
- **RF-13 — Quitar el cupón.** Se puede quitar el cupón aplicado y los totales vuelven a
  los originales sin recargar la página.
- **RF-14 — Error de cupón al confirmar.** Si `/checkout` rechaza el cupón, la persona
  vuelve al formulario con el mensaje visible y **sin** haber perdido el carrito ni los
  datos que ya cargó.

## Requisitos No-Funcionales (RNF)

- **RNF-1 — Cero refactor.** El diff no reformatea ni reordena código existente. Los
  archivos actuales se tocan sólo en las líneas que el descuento necesita. `routes/cart.js`
  y `calcTotals()` no cambian de firma ni de estilo.
- **RNF-2 — Sin dependencias nuevas.** Nada que agregue paquetes a `package.json`. Node
  >= 20, Fastify 5, React 18, pnpm.
- **RNF-3 — Sin fuga del catálogo de cupones.** Ningún endpoint expone la lista de
  cupones ni permite enumerarlos. La validación responde sólo sobre el código consultado.
- **RNF-4 — Sin secretos en el repo.** Los cupones son datos de negocio en el JSON del
  store; no se agregan claves, tokens ni datos personales.
- **RNF-5 — Verificación manual reproducible.** El repo no tiene framework de tests
  («no hay tests, nunca hubo») y este ciclo **no lo introduce**: cada CA se verifica con
  comandos `curl` documentados en el ciclo más el recorrido en la UI. Montar testing es
  una decisión propia, no un efecto colateral de esta spec.
- **RNF-6 — Código sin comentarios narrativos** (regla del repo SDD): nombres
  declarativos y funciones cortas en el código nuevo. Los comentarios del legacy que se
  crucen en el camino se dejan como están.

## Dependencias

- Subproyecto principal: `apps/legacy-shop` (repo standalone: el código vive en la raíz —
  `server/`, `client/`).
- Sin módulos SDD previos: es la primera spec del proyecto.
- Sin APIs externas. Sin base de datos: el store sigue siendo `server/data/store.json` +
  estado en memoria.
- Piezas del legacy que la implementación toca o consume:
  `server/data/store.json`, `server/src/store.js`, `server/src/index.js` (handler de
  `/checkout`), `server/src/routes/` (ruta nueva), `client/src/api.js`,
  `client/src/components/CheckoutForm.jsx`.

## Supuestos

Asumidos para no bloquear la spec. Se confirman en el checkpoint; si alguno cambia, cambia
el RF asociado.

- **S-1 — Descuento sobre el subtotal de productos**, no sobre `subtotal + envío`
  (RF-6). Es el comportamiento estándar y evita descontar el flete.
- **S-2 — El umbral de envío gratis se evalúa antes del descuento** (RF-7). La alternativa
  —evaluarlo sobre el subtotal ya descontado— puede hacer que aplicar un cupón agregue
  $4.500 de envío y el total suba; se descarta por hostil.
- **S-3 — Un solo cupón por orden** (RF-5), sin acumulación ni prioridades.
- **S-4 — Cupones definidos a mano en el JSON**, versionados con el repo. No hay ABM.
- **S-5 — Sin límite de usos.** Un cupón vigente lo puede usar cualquiera las veces que
  quiera hasta que venza o se desactive. Limitarlo exige persistencia, que este repo no
  tiene.
- **S-6 — Vencimiento por fecha (día completo)**, comparado en el server contra la fecha
  actual; sin manejo de zonas horarias más allá de lo que ya hace el resto del código
  (`new Date().toISOString()`).
- **S-7 — Los cupones de ejemplo que se agreguen al store son de prueba** y el equipo los
  reemplaza por los reales de campaña.

## Criterios de Aceptación

- **CA-001** — Con un cupón vigente del 15% y un carrito de subtotal $100.000, la
  validación previa responde que aplica, con descuento $15.000 y total $89.500
  (envío $4.500). El carrito no se modifica.
- **CA-002** — Confirmar ese mismo checkout devuelve `201` con una orden cuyos totales son
  subtotal $100.000, descuento $15.000, envío $4.500, total $89.500, y que registra el
  código del cupón y el 15%.
- **CA-003** — El mismo código en minúsculas, con espacios alrededor, produce idéntico
  resultado que en mayúsculas.
- **CA-004** — Un código inexistente, uno inactivo, uno vencido y uno cuyo mínimo no se
  alcanza devuelven **cuatro motivos distinguibles**, cada uno con su código de error y su
  mensaje, y ninguno confirma la compra.
- **CA-005** — `POST /checkout` sin campo de cupón devuelve exactamente los mismos totales
  y la misma forma de respuesta que antes de esta spec (regresión cero).
- **CA-006** — Con subtotal por encima de `freeShippingOver` ($250.000), aplicar un cupón
  que deja el subtotal descontado por debajo del umbral **mantiene el envío en $0** y el
  total nunca sube al aplicar el cupón.
- **CA-007** — Si el cupón vence o se desactiva entre la previsualización y la
  confirmación, `/checkout` rechaza la compra con el motivo correspondiente, **el carrito
  no se vacía** y no se crea ninguna orden.
- **CA-008** — En la UI: aplicar un cupón válido muestra la línea de descuento con el
  código en el bloque de totales; aplicar uno inválido muestra el mensaje bajo el campo;
  quitarlo restaura los totales originales. Todo sin recargar la página.
- **CA-009** — `GET /settings` devuelve las mismas cuatro claves de siempre; no aparece
  ninguna información de cupones en ninguna respuesta que no sea la validación del código
  consultado.
- **CA-010** — El diff no cambia la firma ni el estilo de `calcTotals()` ni de
  `routes/cart.js`, no agrega dependencias a `package.json`, y `pnpm dev` levanta front y
  API sin errores nuevos en consola.
- **CA-011** — `pnpm sdd:validate` en verde y contexto/memoria del subproyecto
  actualizados como fragmento aditivo al cerrar el ciclo.

## Preguntas abiertas para el checkpoint

1. ¿Se confirman **S-1** y **S-2** (descuento sobre subtotal; envío gratis evaluado
   pre-descuento)?
2. ¿Alcanza con cupones de **porcentaje**, o el primer ciclo tiene que cubrir también
   monto fijo?
3. ¿Hace falta un **tope de descuento** en pesos por cupón (por ejemplo, 20% hasta
   $50.000)? Hoy no está contemplado.
