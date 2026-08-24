---
name: checkpoints-prefijados-por-proyecto
description: Los checkpoints van kudos/*, polls/* y shop/* porque demo/N-* colisionaba entre escenarios
type: decision
date: 2026-08-24
---

Las branches de checkpoint se renombraron a `kudos/*`, `polls/*` y `shop/*`. Los tres
escenarios están actualizados.

**Por qué:** los escenarios 1 y 2 definían literalmente las mismas branches
(`demo/1-init-done`, `demo/2-seed-cycle01`, `demo/4-cycle02-done`) y el 3 pisaba
`demo/1..3` con otro significado. Con tres repos separados no molestaba; en un repo único
se pisan el namespace y un `git checkout` en vivo te deja en el escenario equivocado.

**Cómo aplicarlo:** al hornear un checkpoint nuevo, prefijarlo con el proyecto. Si `main`
avanza después de crear un checkpoint, re-apuntarlo antes de la sesión
(`git branch -f shop/0-legacy main`), porque si no esa branch no va a tener los otros dos
proyectos y se nota si mostrás el árbol del repo.

Ver [[un-solo-repo-sin-git-anidados]].
