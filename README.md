# sdd-harness-demo

Proyectos de ejemplo de la sesión de **[@e-burgos/sdd-harness](https://www.npmjs.com/package/@e-burgos/sdd-harness)**,
el kit que instala Spec-Driven Development (SDD) en un repo: agentes con roles, artefactos
obligatorios por ciclo y gates automáticos, versionados dentro de tu propio proyecto.

Este repo es el banco de pruebas de la demo. Podés levantarlo, mirarlo y romperlo.

## Qué hay acá

| Carpeta | Qué muestra | Estado |
| --- | --- | --- |
| `legacy-shop/` | **Adopción sobre un proyecto que ya existe.** Tienda con catálogo, carrito y checkout, escrita sin el kit. Sobre este código se corre `configure sdd` en vivo. | En el repo |
| `flexi-kudos/` | Monorepo Nx (NestJS + React + Postgres) generado desde cero, con un ciclo SDD completo. | Se genera durante la sesión |
| `quick-polls/` | App standalone (Next.js) generada desde cero. | Se genera durante la sesión |

## Probar la tienda

Requisitos: Node 20 o superior y [pnpm](https://pnpm.io).

```bash
cd legacy-shop
pnpm install
pnpm dev
```

| | |
| --- | --- |
| Front | http://localhost:5173 |
| API | http://localhost:3001 |

El detalle de la app (endpoints, cómo está armada, qué le falta) está en
[legacy-shop/README.md](legacy-shop/README.md).

## Probar el kit en tu propio repo

```bash
npx @e-burgos/sdd-harness@0.10.3 --help      # ver los comandos
npx @e-burgos/sdd-harness@0.10.3 configure sdd   # adoptarlo en un proyecto existente
npx @e-burgos/sdd-harness@0.10.3 init            # arrancar un proyecto nuevo
```

`configure sdd` no toca tu código: agrega la carpeta `sdd/`, las superficies para los
agentes y los scripts del kit en tu `package.json`.

Más ejemplos de salida real del kit, sin instalar nada:
[e-burgos/sdd-harness-examples](https://github.com/e-burgos/sdd-harness-examples).
