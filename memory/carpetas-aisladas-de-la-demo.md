---
name: carpetas-aisladas-de-la-demo
description: Los tres proyectos de la demo viven fuera de este repo, en presentacion/, cada uno con su propio git
type: decision
date: 2026-08-25
---

Los tres proyectos de la demo **no viven en este repo**: se generan en
`~/clientes/flexibility/github/presentacion/`, una carpeta aislada donde `legacy-shop/` es lo
único preparado de antes y `flexi-kudos/` y `quick-polls/` los crea `harness init` en vivo.
Cada proyecto es su propio repositorio. Este repo queda solo con el material de la demo.

**Por qué:** reemplaza el esquema anterior de tres ramas (`escenario-1/2/3`) dentro de este
repo. Aquel chocaba por dos lados: `harness init` **siempre** deja un `git init` + commit
inicial adentro del proyecto (verificado en el binario 0.10.3, no es cosa del bootstrap de
Nx), así que había que borrar el `.git` antes de commitear o quedaba un gitlink de submódulo
vacío en el remoto; y los commits automáticos de `/sdd-hermes` en el escenario 2 se mezclaban
con la rama en la que estaba trabajando el presentador. Con carpetas hermanas fuera del repo
los dos problemas desaparecen y el `.git` que deja el init pasa a ser lo que queremos.

**Cómo aplicarlo:** el guion (`demo/presentacion/speaker-notes.html`) ya apunta a esas rutas.
No commitear proyectos generados dentro de este repo, no crear ramas por escenario, y no
hacer `mkdir` de la carpeta del proyecto antes del init — ver
[[comportamiento-de-harness-init-e-idea]].
