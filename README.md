# sdd-harness-demo

Proyectos de ejemplo de la sesión de **[@e-burgos/sdd-harness](https://www.npmjs.com/package/@e-burgos/sdd-harness)**,
el kit que instala Spec-Driven Development (SDD) en un repo: agentes con roles, artefactos
obligatorios por ciclo y gates automáticos, versionados dentro de tu propio proyecto.

Este repo es el banco de pruebas de la demo, ya corrida de punta a punta: las tres apps
están construidas y cada una documenta en su README los comandos y prompts exactos con los
que se generó. Podés levantarlas, mirarlas y romperlas.

## Las tres apps

| Escenario | Carpeta | Qué muestra | README |
| --- | --- | --- | --- |
| 1 | [flexi-kudos/](flexi-kudos/) | Monorepo Nx generado desde cero con `init`, un ciclo SDD completo | [flexi-kudos/README.md](flexi-kudos/README.md) |
| 2 | [quick-polls/](quick-polls/) | Standalone Next.js generada punta a punta por el loop `sdd-hermes` | [quick-polls/README.md](quick-polls/README.md) |
| 3 | [legacy-shop/](legacy-shop/) | Adopción del kit sobre una app existente con `configure sdd` | [legacy-shop/README.md](legacy-shop/README.md) |

### Escenario 1 — flexi-kudos: proyecto nuevo, ciclo SDD completo

Muro de reconocimientos de equipo. Monorepo Nx generado con
`npx @e-burgos/sdd-harness init` (modo `nx`): NestJS 11 + Prisma 7 + PostgreSQL 16 en
`apps/api`, React 19 + Vite 8 + Tailwind 4 en `apps/webapp`, DTOs compartidos en
`libs/shared-types`. Acá se ve el **SPEC GATE rechazando código sin spec** en un workspace
recién creado, y después el ciclo completo: spec `spec-eburgos-flx-001-kudos-wall`
aprobada → cadena orquestador → funcional → planner ∥ arquitecto → implementadores →
reviewer → MVP end-to-end commiteado (módulo `kudos-wall` completado, más un fix de CORS
registrado por FIX GATE).

### Escenario 2 — quick-polls: de una idea a producto, sin escribir código

Encuestas rápidas en Next.js 15 (standalone, persistencia en archivo JSON). Flujo:
`init` con config escrita a mano → `idea` registrada ya dentro del workspace → **un único
prompt** a la skill `/sdd-hermes` en modo full-auto. Hermes sembró cuatro specs
(`poll-create`, `poll-vote`, `poll-close`, `poll-results`), las aprobó en un solo
checkpoint humano y corrió un ciclo SDD por spec, con un commit por ciclo cerrado. Nadie
escribió una línea de código a mano. El prompt verbatim y cada paso están en su README.

### Escenario 3 — legacy-shop: adoptar el kit en código que ya existe

Tienda interna (Fastify + React 18, escrita a mano en 2023, sin tests — a propósito).
Sobre ese código se corrió `npx @e-burgos/sdd-harness configure sdd`, que **no toca
`client/` ni `server/`**: solo agrega `sdd/`, las superficies para los agentes y los
scripts del kit. Después se redactó `spec-eburgos-flx-001-checkout-coupon` (cupón de
descuento porcentual en el checkout) y se implementó su cycle-01, dejado **abierto a
propósito** para mostrar cómo se ve un ciclo en curso.

## Levantar cada app

Requisitos comunes: Node 20+ y [pnpm](https://pnpm.io) (único package manager en las tres;
`npx` queda solo para invocar la CLI del kit). flexi-kudos suma Docker para el Postgres.

```bash
cd flexi-kudos && pnpm install && pnpm dev    # api :3000 · webapp :4200 (ver su README: pide .env y Docker)
cd quick-polls && pnpm install && pnpm dev    # app :3000
cd legacy-shop && pnpm install && pnpm dev    # front :5173 · api :3001
```

En cualquiera de las tres, `pnpm sdd:docs` levanta el visor SDD (:4310): specs, ciclos,
tasks, fixes y la vista de costos. `pnpm sdd:validate` valida todos los registros SDD.

## Probar el kit en tu propio repo

```bash
npx @e-burgos/sdd-harness@0.10.3 --help          # ver los comandos
npx @e-burgos/sdd-harness@0.10.3 configure sdd   # adoptarlo en un proyecto existente
npx @e-burgos/sdd-harness@0.10.3 init            # arrancar un proyecto nuevo
```

`configure sdd` no toca tu código: agrega la carpeta `sdd/`, las superficies para los
agentes y los scripts del kit en tu `package.json`.

Más ejemplos de salida real del kit, sin instalar nada:
[e-burgos/sdd-harness-examples](https://github.com/e-burgos/sdd-harness-examples).
