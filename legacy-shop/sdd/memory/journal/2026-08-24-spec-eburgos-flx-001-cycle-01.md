# spec-eburgos-flx-001-checkout-coupon cycle-01 — 2026-08-24

## Qué pasó

1. `pnpm sdd:validate` no corría en el repo: el kit SDD había agregado `ajv` y `ajv-formats`
   a `package.json` sin regenerar `pnpm-lock.yaml`. Se descubrió al intentar validar el
   primer registro escrito, con el ciclo ya empezado. Además rompía el gate de CI para
   cualquier PR sobre `sdd/**`. Se resolvió con FIX-eburgos-flx-001.
2. Los CA de la spec fijaban montos literales ($100.000 de subtotal) que **ningún carrito
   posible arma** con el catálogo real de 12 productos. Se detectó recién al escribir el
   script de verificación, con el código ya implementado.
3. Un `kill %1` entre dos invocaciones de shell no mató el server de prueba: la segunda
   instancia falló por puerto ocupado y las verificaciones corrieron contra el binario
   viejo, dando un falso negativo que parecía un bug de la implementación.

## Lección

1. Correr `pnpm sdd:validate` como primera acción de la sesión, antes de escribir el primer
   registro — si está roto, arreglarlo es más barato antes que a mitad de ciclo.
2. Un CA con un monto literal solo vale si ese monto es reproducible con los datos reales
   del repo: verificarlo al redactar el functional, no al verificar.
3. Matar procesos de prueba por puerto (`lsof -ti tcp:PORT | xargs kill -9`), nunca por job
   control: el shell no persiste entre llamadas y un server viejo devuelve resultados que
   parecen bugs del código nuevo.

## Costo evitable

Las tres cuestan lo mismo: una vuelta de diagnóstico sobre un síntoma que no era el
problema. La (3) fue la peor — se investigó un "bug" en el handler de `/checkout` que
estaba bien escrito desde el principio.

---

## Qué pasó (4)

El CONTEXTO GATE pide agregar la fila del subproyecto a las tablas de
`sdd/context/constitution.md` y `context_prompt.md`, pero `pnpm sdd:validate` lo rechaza:
el kit prohíbe que cualquier archivo de `sdd/` escriba el `project` de `global.json`, para
que `sdd/` se pueda copiar a otro repo sin editar nada. En un repo **standalone** el
subproyecto se llama igual que el proyecto, así que nombrarlo en la tabla es
indistinguible de un leak.

## Lección (4)

En repos standalone, las tablas globales de contexto no nombran al subproyecto: apuntan a
`sdd/global.json` → `monorepo.apps`. El CONTEXTO GATE se cumple igual con el fragmento
aditivo en `updates/`, que sí puede nombrarlo (vive fuera del kit portable).

## Costo evitable (4)

Dos vueltas de edición y un `sdd:validate` en rojo a mitad del cierre del ciclo.
