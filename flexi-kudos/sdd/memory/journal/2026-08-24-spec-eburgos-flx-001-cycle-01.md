# spec-eburgos-flx-001-kudos-wall cycle-01 — 2026-08-24

## Qué pasó

- Prisma 7 (default cuando pedís `pnpm add prisma@latest`) tiene 3 breaking changes que
  rompen el flujo "instalar + generar + migrar" en el primer intento: (1) `datasource.url`
  ya no vive en `schema.prisma`, va a `prisma.config.ts`; (2) el generator default cambió
  a `prisma-client` con `output` obligatorio y ESM por default (hay que setear
  `moduleFormat = "cjs"` para NestJS); (3) el driver adapter (`@prisma/adapter-pg` + `pg`)
  es obligatorio para SQL — el `PrismaClient()` sin adapter tira error en runtime.
- Nx 23 con `@nx/webpack:webpack` executor exige `webpackConfig` apuntando a un archivo
  `webpack.config.js` real; la forma "options.main + options.tsConfig" del scaffold antiguo
  hace que webpack resuelva `./src` desde el cwd equivocado y falle con `Can't resolve './src'`.
- `pnpm 10+` bloquea build scripts (`postinstall`) por default; hay que declararlos en
  `pnpm-workspace.yaml → onlyBuiltDependencies` — sin eso Prisma no descarga los engines
  y `prisma generate` falla silenciosamente o queda incompleto.
- Un volumen de Postgres persistente con credenciales viejas hace que
  `pg_isready` responda OK pero la app tire `P1000: Authentication failed`. Reset con
  `docker compose down -v` es la única salida.
- `jest.config.ts` requiere `ts-node`; en un monorepo con solo `tsx` es más simple usar
  `jest.config.js` (CJS) apuntando al `tsconfig.spec.json`.

## Lección

- **Cuando adoptás una lib mayor nueva (Prisma 7, Vite 8, etc.), leé el upgrade guide
  antes de instalar** — no confíes en que "add + generate" funcione como en la major
  anterior. La skill `prisma-upgrade-v7` de Claude ahorró 30 min de debugging.
- **Nx 23 exige un `webpack.config.js` explícito para NestJS** — no dejes que el executor
  arme el bundle solo con `options.main`. Costo evitable: un webpack error críptico +
  15 min de bisección de la config.
- **Un volumen Docker sobrevive a `docker compose down` — usá `-v` cuando cambiás las
  credenciales del servicio en el compose file.**
- **`onlyBuiltDependencies` en `pnpm-workspace.yaml` es un gate silencioso de pnpm 10** —
  cualquier lib con `postinstall` (Prisma engines, esbuild, @swc/core) tiene que estar en
  esa lista o rompe en runtime sin errores de instalación.

## Costo evitable

- ~40 min entre debugging del `prisma generate` (Prisma 7 breaking changes), el webpack
  de Nx 23 y el volumen Postgres cacheado. Con este journal ya destilado a `lessons.md`,
  el próximo ciclo debería tocar Prisma+Nx sin fricción.
