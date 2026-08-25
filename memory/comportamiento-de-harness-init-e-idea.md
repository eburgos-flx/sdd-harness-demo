---
name: comportamiento-de-harness-init-e-idea
description: init crea la carpeta y aborta si existe; idea tiene dos modos y la skill sdd-hermes solo existe post-init
type: gotcha
date: 2026-08-25
---

Verificado leyendo el bundle de `@e-burgos/sdd-harness@0.10.3` (`dist/cli.js`):

- **`init`** resuelve `<cwd>/<project.name>` y lanza `Error: El directorio "<name>" ya existe`
  si esa carpeta está. Se corre **desde la carpeta padre**, nunca desde adentro ni después de
  un `mkdir`. Al terminar corre `git init` + `git add -A` + commit inicial dentro del proyecto,
  en modo `nx` y en `standalone` por igual.
- **`idea`** escribe en `cwd`, en la raíz (no en una subcarpeta): `harness.idea.md` siempre, y
  además `harness.config.json` + `harness.config.schema.json` **solo** si NO existe
  `sdd/global.json`. Con `sdd/` ya instalado entra en modo `sdd-workspace` y el protocolo que
  escribe es gap analysis contra el stack instalado, no descubrimiento de stack.

**Por qué:** la skill `sdd-hermes` vive en `sdd/skills/` y se expone en `.claude/skills/` recién
cuando el kit está instalado. En una carpeta vacía, `idea` solo deja archivos sueltos: Claude
Code **no ve** `/sdd-hermes` y el escenario 2 no arranca.

**Cómo aplicarlo:** el orden del escenario 2 es **`init` → `idea` → `/sdd-hermes`**, con el
`idea` corrido ya adentro del workspace. Ver
[[carpetas-aisladas-de-la-demo]] e [[invocacion-de-la-cli]].
