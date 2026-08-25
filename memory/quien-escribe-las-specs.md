---
name: quien-escribe-las-specs
description: El steward NO escribe specs; el dueño es sdd-hermes en su FASE 4
type: decision
date: 2026-08-25
---

Para redactar una spec nueva en un workspace que ya tiene SDD montado, el agente correcto es
**`/sdd-hermes` acotado a su FASE 4** ("sembrar el backlog": `harness add spec` → redactar el
`.spec.md` → registrar el módulo en `pending_modules` → parar en el checkpoint humano).

**Por qué:** `sdd-steward` es un router, y su propia skill lo dice: _"El steward no decide
stack ni escribe specs"_, con una tabla de ruteo que manda "feature nueva" a
`sdd-orchestrator` y "idea en lenguaje natural" a `sdd-hermes`. Pedirle una spec al steward,
como hacía el guion en los escenarios 1 y 3, lo más probable es que devuelva un ruteo en vez
del artefacto — y en vivo eso se lee como que el sistema no entendió el pedido.

**Cómo aplicarlo:** el prompt tiene que acotar a FASE 4 explícitamente ("NO arranques el loop,
NO escribas código, pará en el checkpoint"), fijar slug/author/title/app para que la ruta del
`.spec.md` sea predecible, y **pedir por nombre las secciones que el template no trae**
(alcance dentro/fuera, restricciones del legacy, supuestos con la alternativa descartada,
CA con números concretos, preguntas abiertas). Sin pedirlas, sale el template pelado — ver
[[la-cli-deja-plantillas-vacias]].

**Referencia de calidad:** `legacy-shop/sdd/specs/spec-eburgos-flx-001-checkout-coupon/`
es una corrida real y completa del escenario 3; su `.spec.md` es el estándar contra el que
comparar lo que salga en vivo.
