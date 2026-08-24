---
name: invocacion-de-la-cli
description: Cómo invocar el CLI del kit; instalarlo en el root del repo no sirve
type: ops
date: 2026-08-24
---

`@e-burgos/sdd-harness` (0.10.3 al 2026-08-24) expone el bin `harness`. Probado en sandbox
con la lib como devDependency en la raíz del repo y `pnpm install` hecho, parado en el
subproyecto:

| Invocación | Resultado |
| --- | --- |
| `harness …` | ❌ command not found |
| `pnpm exec harness …` | ❌ pnpm no resuelve bins fuera de un workspace |
| `npx harness …` | ✅ npx camina hacia arriba por node_modules |
| `npx -y @e-burgos/sdd-harness@0.10.3 …` | ✅ sin instalar nada |

**Por qué:** instalar la lib en el root no da el comando corto `harness` y suma
`package.json` + `node_modules` + lockfile a la raíz. Para tener `harness` de verdad hay que
instalarlo **global** (`pnpm add -g @e-burgos/sdd-harness@<version>`); el global bin dir de
pnpm ya está en el PATH de esta máquina.

**Cómo aplicarlo:** `init` y `configure sdd` se muestran con `npx …@<version>` (el mensaje es
"no instalás nada"); los comandos repetitivos (`add spec`, `update sdd`) con el `harness`
global. `add spec` y `configure sdd` corren **no-interactivos** con los flags del escenario.

**Dato clave verificado:** el CLI opera estrictamente sobre `cwd`. Con un `package.json` en
el directorio padre, `configure sdd` no lo tocó: mergeó los scripts `sdd:*` y
`ajv`/`ajv-formats` solo en el `package.json` del proyecto. Y el `git status` posterior
agrega, además de `sdd/` + `AGENTS.md` + `CLAUDE.md`: `GEMINI.md`, `.claude/`, `.github/`,
`.gemini/`, `.agent/` y `.agents/`.
