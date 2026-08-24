---
name: ramas-de-la-demo
description: Tres ramas (escenario-1/2/3), sin checkpoints; el escenario 2 vive fuera del repo
type: decision
date: 2026-08-24
---

La demo usa **tres ramas y nada más**: `escenario-1` (flexi-kudos, generado en vivo por
`harness init`), `escenario-2` (destino opcional de quick-polls) y `escenario-3`
(legacy-shop). Dentro de cada una se commitea secuencialmente a medida que avanza la sesión.
No hay branches checkpoint ni fast-forwards: todo se construye delante de la audiencia.

**Por qué:** el esquema anterior (`kudos/1..4`, `polls/1..4`, `shop/0..3`) existía para
saltar a estados pre-horneados. Al pasar la demo a construirse punta a punta en vivo, esos
checkpoints dejaron de tener sentido. Además había un choque real: el init en vivo genera
`flexi-kudos/` sin trackear, y un `git checkout` a una rama que ya tenía esa carpeta aborta
con *"untracked working tree files would be overwritten"* — reproducido.

**Cómo aplicarlo:** el escenario 2 se genera en `~/demos/quick-polls`, **fuera de este repo y
con su propio git**, porque lo conduce `/sdd-hermes` en modo autónomo y commitea cada ciclo:
adentro del repo sus commits se mezclarían con la rama en la que está trabajando el
presentador. Si algún proyecto generado trae su propio `.git` (el bootstrap de Nx suele
dejarlo), borrarlo antes de commitear — ver [[un-solo-repo-sin-git-anidados]].
