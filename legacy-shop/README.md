# Legacy Shop

Catalogo de productos con carrito y checkout. Es la tienda interna que arrancamos
en 2023 para vender accesorios de escritorio al equipo.

- `client/` — React 18 + Vite. Grilla de catalogo, carrito lateral y checkout de un paso.
- `server/` — Fastify. API REST sin base de datos: el catalogo sale de un JSON en disco
  (`server/data/store.json`) y los carritos viven en memoria.
- `sdd/` — kit `@e-burgos/sdd-harness` adoptado encima, sin tocar el codigo de la app.
  Ver [Adopcion de SDD](#adopcion-de-sdd) mas abajo.

## Levantarlo

Requisitos: Node ≥ 20 (`.nvmrc` fija `22`), pnpm `10.14.0` (`packageManager` en `package.json`).

```bash
pnpm install
pnpm dev
```

| Servicio | URL |
| --- | --- |
| Front (Vite) | http://localhost:5173 |
| API (Fastify) | http://localhost:3001 |
| Doc SDD (`sdd:docs`) | http://127.0.0.1:4310/sdd/docs/ |

`pnpm dev` levanta los dos con concurrently. Tambien estan `pnpm dev:server`,
`pnpm dev:client`, `pnpm build` (deja el bundle en `dist/`) y `pnpm start` (solo la API).
El puerto de la API se cambia con `PORT=…`.

El proyecto usa **pnpm** (`packageManager` fijo en `package.json`). El lockfile que vale es
`pnpm-lock.yaml`; no generes `package-lock.json`.

## Endpoints

| Metodo | Ruta | Que hace |
| --- | --- | --- |
| GET | `/products?category=&q=` | Catalogo, con filtro por categoria y busqueda |
| GET | `/products/:id` | Detalle de un producto |
| GET | `/cart?cartId=` | Carrito actual con totales |
| POST | `/cart` | Agrega un producto (crea el carrito si no existe) |
| POST | `/cart/update` | Setea la cantidad de una linea (0 la elimina) |
| POST | `/cart/remove` | Saca una linea (endpoint viejo, lo usa el boton "Quitar") |
| POST | `/coupons/validate` | Valida un cupon sin mutar el carrito (`EP-001`) |
| POST | `/checkout` | Valida, aplica el cupon, recalcula totales, arma la orden y vacia el carrito (`EP-002`) |
| GET | `/orders` | Ordenes de la sesion actual (solo para mirar desde la terminal) |
| GET | `/settings` | Nombre de la tienda, moneda y reglas de envio |

Los precios estan en pesos y los totales **siempre** se calculan en el server; el front
solo formatea. El envio es gratis a partir del monto que define
`settings.freeShippingOver` en `server/data/store.json`.

## Pendientes conocidos

- No hay tests. Nunca hubo.
- Los carritos y las ordenes estan en memoria: se pierden cuando reinicia el server.
- El handler de `/checkout` esta todo en `server/src/index.js` y duplica el calculo de
  totales de `server/src/utils.js`.
- Conviven dos estilos de rutas: `routes/products.js` usa el estilo plugin con async/await
  y `routes/cart.js` sigue con callbacks y `reply.send()`.
- El monto de envio gratis esta hardcodeado en el checkout ademas de estar en el JSON.
- Las fotos de los productos son de picsum.photos, no son fotos reales del catalogo.

---

# Adopcion de SDD

Runbook de esta carpeta: que hay, como levantar la doc del kit, y los comandos y prompts
**exactos** con los que se genero la feature de cupones.

## Que es esta carpeta

`legacy-shop` **despues** de correr el escenario 3 completo:

1. La app existente (Fastify + React, escrita a mano, sin SDD) — todo lo de arriba.
2. `@e-burgos/sdd-harness@0.10.3` adoptado encima (`configure sdd`), sin tocar `client/` ni `server/`.
3. `spec-eburgos-flx-001-checkout-coupon` redactada y su **cycle-01 implementado**: cupon de
   descuento porcentual en el checkout.

Estado real del ciclo (no esta cerrado, a proposito):

| Item | Valor |
| --- | --- |
| Spec | `spec-eburgos-flx-001-checkout-coupon` — `status: in-progress` |
| Tasks | 9 / 9 done |
| CA | 18 PASS · 4 PENDING (`CA-008`, `CA-018`, `CA-019`, `CA-020` — solo verificables en pantalla) |
| Reviewer | `approved: false` — falta correr `artifacts/verify-ui.md` |
| Fix | `FIX-eburgos-flx-001` — `validated` |
| `pnpm sdd:validate` | verde (`10 files valid, cross-checks passed`) |

## Levantar la doc del kit (`sdd:docs`)

```bash
pnpm sdd:docs
```

Levanta `node sdd/docs/serve.mjs` en `127.0.0.1:4310` y imprime la URL. `/` redirige (301) a
`/sdd/docs/`, asi que **la URL a abrir es** http://127.0.0.1:4310/sdd/docs/ — es un explorador
de todo lo que hay en `sdd/`: specs, ciclos, tasks, contratos, fixes, journal.

Flags que acepta el server:

```bash
node sdd/docs/serve.mjs --port 4400        # otro puerto
node sdd/docs/serve.mjs --root /otro/repo  # servir el sdd/ de otro repo
```

Si el puerto queda tomado entre pruebas, matarlo por puerto (nunca por job control):

```bash
lsof -ti tcp:4310 | xargs kill -9
```

## Scripts SDD disponibles

| Comando | Que hace |
| --- | --- |
| `pnpm sdd:validate` | Valida todos los JSON de `sdd/` contra sus schemas + cross-checks. Salida en verde: `[validate-sdd] OK — 10 files valid, cross-checks passed` |
| `pnpm sdd:docs` | Server de doc (ver arriba) |
| `pnpm sdd:rebuild-tasks-index` | Regenera `sdd/tasks.json` desde los `cycles/*/tasks.json` |
| `pnpm sdd:rebuild-catalog` | Regenera `sdd/catalog.json` |
| `pnpm setup:agents` | Rearma el harness dual: `.claude/`, `.github/`, `.gemini/`, `.agent/`, `.agents/` como symlinks a `sdd/` |

> `sdd:validate` necesita `ajv` y `ajv-formats`, que el kit agrego a `devDependencies`. Sin
> `pnpm install` previo corta con `ERR_MODULE_NOT_FOUND: Cannot find package 'ajv'`. Eso fue
> exactamente `FIX-eburgos-flx-001`.

## Probar el cupon (lo que este ciclo agrego)

Endpoints (registrados en `sdd/api.json`):

| ID | Endpoint | Que hace |
| --- | --- | --- |
| `EP-001` | `POST /coupons/validate` | Valida sin mutar el carrito. Body: `{ cartId, couponCode }` |
| `EP-002` | `POST /checkout` | Acepta `couponCode`, **revalida en el server** y recalcula totales |

Cupones sembrados en `server/data/store.json` (fijos, se editan a mano):

| Codigo | % | Estado esperado |
| --- | --- | --- |
| `PRIMAVERA15` | 15 | ✅ aplica siempre |
| `BIENVENIDA10` | 10 | ✅ desde $150.000 de subtotal · debajo → `coupon_min_subtotal` |
| `VERANO20` | 20 | ⛔ `coupon_inactive` (`active: false`) |
| `INVIERNO25` | 25 | ⛔ `coupon_expired` (vence 2026-06-30) |
| `PRUEBA100` | 100 | ✅ deja el total en el costo de envio |

Cualquier otro codigo → `coupon_not_found`. Los cuatro rechazos responden **409**; codigo vacio
o en blanco, **400 `bad_request`**.

Smoke test por consola (verificado):

```bash
pnpm dev:server   # en otra terminal

CART=$(curl -s -X POST http://localhost:3001/cart \
  -H 'content-type: application/json' -d '{"productId":"p-1001"}')
CID=$(node -pe "JSON.parse(process.argv[1]).cartId" "$CART")

curl -s -X POST http://localhost:3001/coupons/validate \
  -H 'content-type: application/json' \
  -d "{\"cartId\":\"$CID\",\"couponCode\":\" primavera15 \"}"
```

Salida real (el codigo se normaliza: trim + uppercase):

```json
{"coupon":{"code":"PRIMAVERA15","percentOff":15},
 "totals":{"subtotal":189900,"discount":28485,"shipping":4500,"total":165915,"freeShippingOver":250000}}
```

Verificacion completa del ciclo (23 checks, sale 0 si todos pasan):

```bash
pnpm dev:server   # en otra terminal
BASE=http://localhost:3001 bash sdd/specs/spec-eburgos-flx-001-checkout-coupon/cycles/cycle-01/artifacts/verify-api.sh
```

Los 4 CA que quedaron `PENDING` son de UI y su guion esta en
`…/cycle-01/artifacts/verify-ui.md` — hay que correrlo a mano en el navegador.

---

## Como se genero esta app — comandos y prompts exactos

Todo se corrio **parado en la raiz de esta carpeta**. Version del kit: `0.10.3`
(fijada en `sdd/kit.json`, `installed_at: 2026-08-24`).

### Paso 1 — Adopcion del kit

```bash
npx -y @e-burgos/sdd-harness@0.10.3 configure sdd \
  --name legacy-shop \
  --description "Catálogo con carrito existente"

pnpm install          # ajv + ajv-formats que agregó el merge de package.json
pnpm setup:agents     # harness dual desde una sola fuente
pnpm sdd:validate
```

Lo que agrega: `sdd/`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` (symlinks a
`sdd/dual-harness/`), `.claude/`, `.github/`, `.gemini/`, `.agent/`, `.agents/`, y los
scripts `sdd:*` en `package.json`. **No toca `client/` ni `server/`.**

Via alternativa por prompt (equivalente, en Claude Code):

```
/sdd-steward

Este repositorio es una tienda en Fastify + React que no tiene SDD montado. Instalámelo sin
tocar el código: proyecto legacy-shop, descripción "Catálogo con carrito existente".

Después del install, dejá los arneses listos y decime qué agregó exactamente, archivo por
archivo, para que lo mostremos.
```

### Paso 2 — Reservar el lugar de la spec

```bash
npx -y @e-burgos/sdd-harness@0.10.3 add spec checkout-coupon \
  --author eburgos-flx \
  --title "Cupón de descuento en checkout" \
  --app apps/legacy-shop
```

Esto **no escribe la spec**: crea `sdd/specs/spec-eburgos-flx-001-checkout-coupon/` con
`cycles/` y `fixes/`, registra la entrada en `sdd/specs/index.json` (`status: in-progress`) y
deja un `.spec.md` que es puro placeholder. El `--title` solo alimenta el encabezado.

### Paso 3 — La spec la redacta el agente (prompt usado, textual)

```
/sdd-hermes

Solo FASE 4 (sembrar el backlog) sobre este repo. NO arranques el loop de ciclos, NO escribas
código, NO toques client/ ni server/. Terminás en el checkpoint de aprobación de la spec.

La spec ya está creada y registrada, vacía: sdd/specs/spec-eburgos-flx-001-checkout-coupon/
Módulo: checkout-coupon · subproyecto: apps/legacy-shop

Objetivo: que quien compra pueda ingresar un código de cupón en el checkout y obtenga un
descuento porcentual sobre el subtotal — validado antes de confirmar y revalidado en el server
al confirmar, para que el total facturado nunca dependa de lo que mande el front.

Antes de redactar, leé el código real. No asumas nada:
- README.md, sobre todo "Pendientes conocidos": ahí está la deuda técnica declarada.
- server/src/index.js (el handler de /checkout), server/src/store.js, server/src/utils.js,
  server/src/routes/products.js y server/src/routes/cart.js.
- server/data/store.json, client/src/api.js y client/src/components/CheckoutForm.jsx.
- OJO: sdd/context/apps/legacy-shop/constitution.md está en blanco — es la plantilla que dejó
  configure sdd. No es fuente de verdad. La fuente es el código.

Este proyecto NO nació con SDD y no lo vamos a refactorizar. De esa lectura tenés que sacar, y
escribir explícitamente, una sección "Restricciones del legacy (INVIOLABLES)": los dos estilos
de rutas que conviven y cuál se usa para lo nuevo, cómo se accede a los datos, el envelope de
error vigente, dónde se calculan los totales, y qué deuda conocida NO se toca en este ciclo.

La spec tiene que quedar completa y decidible. Además de las secciones del template:
- Alcance del primer ciclo, separado en "Dentro" y "Fuera (explícito, no es olvido)".
- Restricciones del legacy (INVIOLABLES).
- RF numerados, con los casos borde: normalización del código, motivos de rechazo
  diferenciados, interacción con el envío gratis, checkout SIN cupón (regresión cero), y qué
  pasa si el cupón deja de aplicar entre la previsualización y la confirmación.
- Supuestos numerados y marcados como tales, cada uno con la alternativa que descartaste y por
  qué la descartaste.
- Criterios de aceptación verificables, con números concretos —montos, porcentajes, códigos de
  estado—, no "funciona bien".
- Preguntas abiertas para el checkpoint: lo que decidiste vos y querés que confirme yo.

Registrá el módulo en pending_modules de sdd/global.json (module, spec, apps, description) y
dejá pnpm sdd:validate en verde. Después pará: quiero leerla antes de que se implemente nada.
```

Salida: `sdd/specs/spec-eburgos-flx-001-checkout-coupon/spec-eburgos-flx-001-checkout-coupon.spec.md`
(14 RF, 22 CA, seccion "Restricciones del legacy (INVIOLABLES)") + el modulo en `pending_modules`.

### Paso 4 — Arrancar el ciclo (prompt usado, textual)

```
Iniciá el Ciclo 1 del proyecto legacy-shop siguiendo el flujo SDD.

Módulo a desarrollar: checkout-coupon
Spec en: sdd/specs/spec-eburgos-flx-001-checkout-coupon/spec-eburgos-flx-001-checkout-coupon.spec.md

Antes de empezar:
1. Ejecutar el SPEC GATE
2. Leer sdd/global.json para verificar el estado actual
3. Confirmar que el módulo tiene spec y está en pending_modules

Respetá al pie de la letra la sección "Restricciones del legacy (INVIOLABLES)" de la spec:
este proyecto no nació con SDD y el ciclo no es una excusa para refactorizarlo. Si una task
necesita violar una restricción, frenala y avisá en vez de decidir por tu cuenta.
```

El ciclo corrio `sdd-orchestrator` → `functional` → `planner` → `architect` →
`implementor-back` → `implementor-front` → `reviewer`, y dejo en
`sdd/specs/spec-eburgos-flx-001-checkout-coupon/cycles/cycle-01/`:
`brief.yaml`, `functional.md`, `planner.md`, `architect.md`, `tasks.json`, `cycle.json` y
`artifacts/{verify-api.sh,verify-ui.md}`.

### Paso 5 — El fix de camino (FIX-eburgos-flx-001)

A mitad de ciclo, `pnpm sdd:validate` abortaba con `ERR_MODULE_NOT_FOUND: Cannot find package 'ajv'`:
el merge de `package.json` del kit sumo `ajv` + `ajv-formats` pero `pnpm-lock.yaml` no se regenero.
Se resolvio por la via de bypass del gate (es la herramienta de verificacion del propio SDD, no
una feature):

```bash
pnpm install
pnpm install --frozen-lockfile   # reproduce la condición de CI → "Lockfile is up to date"
pnpm sdd:validate
```

Registrado en `sdd/fixes/fix-eburgos-flx-001.md` y `sdd/fixes.json`, revisado y `validated` al
cierre del ciclo. El prompt del kit para esta via es `/hotfix-bypass-gate`
(`sdd/prompts/hotfix-bypass-gate.prompt.md`).

### Archivos que toco el ciclo (de `cycle.json`)

Creados:

- `server/src/routes/coupons.js`
- `…/cycle-01/artifacts/verify-api.sh`, `…/cycle-01/artifacts/verify-ui.md`

Modificados:

- Back: `server/data/store.json`, `server/src/store.js`, `server/src/utils.js`, `server/src/index.js`
- Front: `client/src/api.js`, `client/src/components/CheckoutForm.jsx`,
  `client/src/components/CartDrawer.jsx`, `client/src/App.jsx`, `client/src/styles.css`

Intactos por restriccion de la spec: `server/src/routes/cart.js` (0 lineas de cambio),
`calcTotals()` (sin cambio de firma), `package.json` (0 dependencias nuevas).

---

## Diferencias con el guion de la demo

El guion (`demo/escenario-3-existente-shop.md`) se escribio antes de la corrida real. Lo que
quedo en el codigo es esto:

| Guion | Real |
| --- | --- |
| slug `discount-coupons` | slug **`checkout-coupon`** |
| cupones `DEMO10` / `FLEXI20` | **`PRIMAVERA15`, `BIENVENIDA10`, `VERANO20`, `INVIERNO25`, `PRUEBA100`** |
| spec redactada por `/sdd-steward` | la escribe **`/sdd-hermes` FASE 4** (el steward rutea, no redacta) |
| 5 RF / 4 CA de plan B | 14 RF / 22 CA |

**Para demo en vivo: el cupon que aplica es `PRIMAVERA15`, no `FLEXI20`.**

## Pendientes del ciclo (de `cycle.json → follow_ups`)

1. Correr `artifacts/verify-ui.md` y completar su columna de resultado. Con `CA-008`, `CA-018`,
   `CA-019` y `CA-020` en PASS: `cycle.json → completed`, modulo a `completed_modules`, spec a
   `completed`.
2. Decidir si `CA-001`/`CA-002` se reescriben con un monto reproducible con el catalogo real
   (los $100.000 del enunciado no los arma ninguna combinacion de los 12 productos).
3. Fix propio para la deuda de `POST /checkout`: sacarlo de `index.js`, usar `calcTotals()` y
   leer `shippingFlat`/`freeShippingOver` de settings en vez de los `4500`/`250000` hardcodeados.
4. Reemplazar los cupones de prueba por los de campana real antes de usar esto de verdad.
5. Consolidar el fragmento de `sdd/context/apps/legacy-shop/updates/` en la constitution del
   subproyecto, que sigue siendo la plantilla vacia del kit.
