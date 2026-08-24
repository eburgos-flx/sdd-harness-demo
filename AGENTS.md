# AGENTS.md — sdd-harness-demo

> Repo del **material de demo comercial** de la CLI `@e-burgos/sdd-harness`.
> No es el repo del CLI: acá no se desarrolla el kit ni se publica nada a npm.

## Qué es este repo

Sirve para preparar y correr una **sesión práctica de 1 h 30** frente a devs, CTOs y
funcionales de una empresa que evalúa adoptar la herramienta. Contiene el guion de la
sesión y los **proyectos de prueba** sobre los que se demuestra la CLI en vivo.

El repo tiene dos capas y no hay que mezclarlas:

| Capa | Qué es | Estado en git |
| --- | --- | --- |
| `demo/` | Guion, los tres escenarios y la presentación de soporte | **gitignoreado** — material propio, no se publica |
| `legacy-shop/`, `flexi-kudos/`, `quick-polls/` | Los proyectos que se muestran andando | versionados |
| `memory/` | Aprendizajes del laburo sobre este repo | versionado (ver abajo) |

### Los tres proyectos de prueba

| Carpeta | Escenario | Stack | Estado |
| --- | --- | --- | --- |
| `legacy-shop/` | 3 — adopción sobre proyecto existente | Fastify + React (Vite), pnpm | **listo**, sin rastro de SDD (así tiene que estar) |
| `flexi-kudos/` | 1 — Nx desde cero, ciclo SDD completo en vivo | Nx + NestJS + React + Postgres | pendiente: lo genera `harness init` |
| `quick-polls/` | 2 — standalone desde cero | Next.js | pendiente: lo genera `harness init --standalone` |

Los escenarios 1 y 2 **no se construyen a mano**: los genera la CLI en vivo (o pre-horneados
en su branch). El escenario 3 sí es una app escrita a mano, porque el punto es adoptar SDD
sobre código que ya existía.

## Reglas duras

1. **No "arreglar" los proyectos de demo.** La deuda técnica de `legacy-shop` (sin tests,
   checkout largo en `index.js`, dos estilos de rutas conviviendo, constante duplicada) es
   **decorado guionado**: es lo que el presentador señala en vivo y lo que el kit va a leer
   para armar el contexto. Tocarla rompe la demo. Lo mismo con sus comentarios viejos.
2. **`demo/` es privado.** Está gitignoreado a propósito. No lo commitees, no copies su
   contenido a archivos versionados y no lo pegues en servicios externos.
3. **`legacy-shop/` no puede tener rastro de SDD** hasta que la demo corra
   `configure sdd` en vivo. Nada de `sdd/`, `AGENTS.md`, `CLAUDE.md` ni `.claude/` ahí
   adentro antes de tiempo: el momento de venta es el `git status` que muestra que el kit
   agregó todo eso sin tocar una línea de código.
4. **Nada de repos git anidados.** Un `.git` dentro de un proyecto se pushea como gitlink
   vacío y el material se pierde en el remoto. Un solo repo, carpetas hermanas.
5. **Todos los proyectos usan `pnpm`.** Sin excepción, tanto los que genera la CLI como los
   escritos a mano: `pnpm install` / `pnpm dev`, `packageManager` fijo en `package.json`,
   `pnpm-lock.yaml` como único lockfile. Si aparece un `package-lock.json` o un
   `yarn.lock`, es un error: borralo y reinstalá con pnpm. Los scripts que llaman a otros
   scripts usan `pnpm run <script>`, no `npm run`.
   *Única excepción:* invocar la CLI del kit con `npx @e-burgos/sdd-harness@<version> …`,
   que es como el guion la pinea y la pre-cachea — eso no se toca.
6. **Los comandos de cada escenario se corren parados en la carpeta del proyecto**
   (`cd legacy-shop && pnpm dev`), no en la raíz.
7. **Cuando un proyecto adopte el kit**, ese proyecto va a tener su propio
   `AGENTS.md`/`CLAUDE.md` y sus gates: adentro de esa carpeta mandan **ésos**, no este
   archivo.

## Branches de checkpoint

Los tres escenarios comparten repo, así que los checkpoints van **prefijados por proyecto**
(antes colisionaban entre sí):

| Escenario 1 — kudos | Escenario 2 — polls | Escenario 3 — shop |
| --- | --- | --- |
| `kudos/1-init-done` | `polls/1-init-done` | `shop/0-legacy` |
| `kudos/2-seed-cycle01` | `polls/2-seed-cycle01` | `shop/1-sdd-adopted` |
| `kudos/3-spec-leaderboard` | `polls/3-spec-close` | `shop/2-spec-coupons` |
| `kudos/4-cycle02-done` | `polls/4-cycle02-done` | `shop/3-coupons-done` |

`main` es el estado consolidado. Si `main` avanza, re-apuntar los checkpoints que hagan
falta (`git branch -f shop/0-legacy main`) antes de la sesión.

## Memoria del repo

`memory/` es la memoria versionada de este repo: lo que aprendimos preparando la demo y no
se deduce leyendo el código.

- **Al empezar**, leé `memory/MEMORY.md` (índice de una línea por entrada) y abrí las
  entradas que apliquen a la tarea.
- **Al cerrar una tarea**, si quedó un aprendizaje no obvio —una decisión de estructura y su
  porqué, algo que probamos y descartamos, una restricción del entorno, un ensayo con
  tiempos reales— escribí o actualizá una entrada. Un archivo por hecho.
- **Actualizá la entrada existente** en vez de crear una duplicada; borrá lo que quedó falso.
- **No guardes** lo que el repo ya dice (estructura de carpetas, historia de git, lo que ya
  está en este archivo) ni contenido del guion: eso vive en `demo/`, que es privado.
- Las entradas reflejan lo que era cierto cuando se escribieron: si una nombra un archivo,
  un comando o una versión, verificá que siga existiendo antes de recomendarla.

Formato de cada entrada (`memory/<slug>.md`):

```markdown
---
name: <slug-en-kebab-case>
description: <una línea; es lo que se lee en el índice para decidir si abrirla>
type: decision | fixture | gotcha | ops
date: YYYY-MM-DD
---

<el hecho, en dos o tres frases>

**Por qué:** <la razón que no se deduce del código>
**Cómo aplicarlo:** <qué hacer la próxima vez>
```

Después de escribirla, agregá la línea al índice: `- [Título](slug.md) — gancho`.

## ⚙️ Selección de modelo y esfuerzo (OBLIGATORIO — optimización de tokens/contexto)

> [!IMPORTANT]
> **Antes de encarar CUALQUIER tarea nueva —sin importar con qué modelo estés corriendo en
> ese momento— decidí explícitamente qué modelo y qué nivel de esfuerzo conviene, para el
> trabajo propio y para CADA subagente/workflow que dispares.** El objetivo es gastar el
> mínimo de tokens y contexto sin bajar la calidad. No arranques a ejecutar sin esta decisión.

**Regla base:** elegí el modelo/esfuerzo más barato que aún cumple la tarea con calidad.
Escalá de tier sólo cuando la tarea lo justifique (ambigüedad, razonamiento cross-cutting,
riesgo de error alto). Ante la duda entre dos tiers, probá el más barato primero y escalá si
el resultado no alcanza.

**Modelos disponibles** (`model`): `haiku` · `sonnet` · `opus` · `fable`.
**Esfuerzo** (`effort`): `low` · `medium` · `high` · `xhigh` · `max`.

| Tipo de tarea | Modelo sugerido | Esfuerzo |
| --- | --- | --- |
| Lectura de estado, formateo, edición mecánica/puntual, respuestas cortas, grep/glob dirigido | `haiku` | `low`–`medium` |
| Implementación estándar (una task acotada), tests, edición multi-archivo simple, la mayoría de subagentes ejecutores | `sonnet` | `medium` |
| Arquitectura, decisiones cross-cutting, debugging complejo, síntesis | `opus` | `high`–`xhigh` |
| Sólo el paso más difícil (verify adversarial, judge, diseño crítico) | según tarea | `xhigh`–`max` |

**Cómo aplicarlo en este repo:**

- **Subagentes (`Agent`) y workflows (`Workflow`):** pasá `model` y `effort` explícitos en
  cada llamada, acordes a la tabla. Un fan-out de lectores/mecánicos va en `haiku`/`low`;
  el paso de verificación o síntesis en `opus`/`high`. Nunca dispares todo un fleet en el
  tier más caro por defecto.
- **Cambios que tocan el guion de la sesión** (estructura del repo, branches de checkpoint,
  qué se muestra en vivo) son de la fila `opus`/`high`: si salen mal, se descubren frente al
  cliente.
- **Trabajo propio (main loop):** si la tarea es trivial, bajá el esfuerzo; no quemes
  contexto releyendo lo ya establecido ni narrando opciones que no vas a seguir.
- **Si el repo tiene índice de graphify o de codebase-memory**, consultalo antes de pagar
  lecturas a ciegas: es parte de la misma optimización de tokens.

## Verificación

Este repo no tiene test suite y `legacy-shop` no tiene tests **a propósito**. La
verificación es que la app se vea andando:

```bash
cd legacy-shop && pnpm dev         # web 5173 · api 3001
```

Para verificar UI sin depender del bridge de Playwright MCP (que en esta máquina no
levanta), ver la entrada de `memory/` sobre Chrome headless.

Antes de cerrar cualquier tarea que toque un proyecto de demo: levantarlo, mirarlo, y
confirmar que `git status` sigue mostrando lo que el escenario espera.

## Estilo

- Código, identificadores, commits y comentarios de código: **inglés**. Docs de usuario y
  material de la demo: **español rioplatense** (es el idioma de la sesión).
- En código propio, comentarios solo para restricciones que el código no puede expresar.
  Excepción: los comentarios "viejos" de `legacy-shop` son parte del decorado — no se
  limpian (regla dura 1).
- Nada de emojis en código ni en commits.
