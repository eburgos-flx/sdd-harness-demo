---
name: un-solo-repo-sin-git-anidados
description: Los tres proyectos de demo van como carpetas del mismo repo; nada de .git anidados
type: decision
date: 2026-08-24
---

`legacy-shop/` arrancó con su propio `.git` (y una historia backdateada de 2023-2024 para
que se viera "vieja"). Se descartó: los tres proyectos son carpetas hermanas de este repo.

**Por qué:** el repo tiene remote (`github.com/eburgos-flx/sdd-harness-demo`). Un `.git`
anidado no se pushea: al commitear la carpeta desde la raíz, git guarda un *gitlink* de
submódulo sin URL y en el remoto queda una carpeta gris vacía. El material de la
presentación se perdería justo en el escenario que más pesa en la decisión de compra.
La historia falsa además no aportaba: el guion nunca corre `git log`, corre `git status`.

**Cómo aplicarlo:** si algún proyecto generado por la CLI trae su propio `.git`
(`init` de Nx lo hace), borrarlo antes de commitear. El efecto "proyecto viejo" se cuenta
con el código y el README del proyecto, no con la historia de git.

Ver [[checkpoints-prefijados-por-proyecto]].
