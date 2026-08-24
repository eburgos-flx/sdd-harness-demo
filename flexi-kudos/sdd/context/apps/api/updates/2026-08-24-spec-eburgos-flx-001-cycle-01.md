# spec-eburgos-flx-001-kudos-wall cycle-01 — 2026-08-24

## Estado

`apps/api` pasa de scaffold vacío a NestJS 11 productivo con endpoints REST de kudos
(POST/GET), members (GET), categories (GET) y healthz. Corre contra Postgres 16 vía
docker-compose. 24 tests verdes (unitarios + e2e supertest). El happy path CA-001 del spec
se verificó punta a punta.

## Estructura

- `apps/api/src/`
  - `main.ts` — bootstrap Nest con `ValidationPipe` global (whitelist + forbidNonWhitelisted,
    `errorHttpStatusCode: 422`), `HttpExceptionFilter` global, `nestjs-pino` como logger,
    carga `.env` con `dotenv/config`
  - `app.module.ts` — declara `PrismaModule` (global), `HealthModule`, `CategoriesModule`,
    `MembersModule`, `KudosModule`; registra `ThrottlerModule` (60 req/min por IP) con
    `ThrottlerGuard` como `APP_GUARD`
  - `prisma/` — `PrismaService extends PrismaClient` con `PrismaPg` adapter (driver adapter
    obligatorio en Prisma 7), `PrismaModule` `@Global()`
  - `kudos/` — controller + service, DTO `CreateKudoDto` (class-validator + validador custom
    `IsMessageLength` por code points), `ListKudosQuery` con `limit`/`cursor`, utilidad
    `cursor.util.ts` (HMAC-SHA256, encode/decode con firma de 16 chars)
  - `members/` — controller + service (`listActive` + `findActiveById`); orden por
    `full_name` con `localeCompare('es')` case-insensitive
  - `categories/` — controller + `categories.constants.ts` (enum fijo de 6 keys en español)
  - `health/` — controller `/healthz` con `@SkipThrottle()`
  - `common/exceptions/domain.exceptions.ts` — `DomainException` base + 5 concretas
    (`SelfKudoForbidden`, `MemberNotFound`, `InvalidCategory`, `MessageTooLong`, `InvalidCursor`)
  - `common/filters/http-exception.filter.ts` — mapea excepciones + `ThrottlerException` +
    `HttpException` genérica al envelope `{ error: { code, message, details? } }`
  - `generated/prisma/` — cliente Prisma generado (checked-in por el generator, no editar)
- `apps/api/prisma/`
  - `schema.prisma` — modelos `Member` + `Kudo`, generator `prisma-client` con
    `output = "../src/generated/prisma"` y `moduleFormat = "cjs"` (Nest es CJS)
  - `migrations/20260824183851_init/migration.sql` — creación de tablas + índices
  - `migrations/20260824183900_add_check_constraints/migration.sql` — 3 check-constraints
    de Postgres (categoría, giver<>receiver, message length ≤ 1120 bytes) como defensa en
    profundidad
  - `seed.ts` — upsert idempotente por `handle` de los 6 miembros del equipo
- `apps/api/webpack.config.js` — NxAppWebpackPlugin explícito (obligatorio en Nx 23; el
  fallback declarativo del ejecutor no arma el bundle correctamente)
- `apps/api/test/kudos.e2e-spec.ts` — suite supertest contra Postgres real; limpia `kudos`
  antes de cada test, semilla propia de 2 miembros con prefijo `e2e-`

## Dependencias

- Runtime nuevas: `@prisma/client` ^7.9.1, `@prisma/adapter-pg` ^7.9.1, `pg` ^8.23,
  `@nestjs/throttler` ^6, `class-validator` ^0.15, `class-transformer` ^0.5, `nestjs-pino`
  ^4.6, `pino-http` ^11, `pino-pretty` ^13, `dotenv` ^17
- Dev nuevas: `prisma` ^7.9.1 (CLI), `tsx` ^4.23 (runner del seed), `supertest` ^7,
  `@types/supertest`, `@types/pg`
- `prisma.config.ts` en la raíz del monorepo (obligatorio en Prisma 7 — el `datasource.url`
  ya no vive en el schema)
- `.env` en la raíz con `DATABASE_URL`, `CURSOR_SECRET`, `RATE_LIMIT_TTL_MS`,
  `RATE_LIMIT_MAX`, `PORT` (documentado en `apps/api/.env.example`)

## Qué sigue

- Auth mínima (magic link o SSO) — sin ella el rate limit por IP es endeble en
  ambientes con NAT/proxy compartido
- `X-Forwarded-For` correcto cuando aparezca un ingress delante (`app.set('trust proxy', 1)`)
- Métricas Prometheus + `/metrics` (Prisma 7 removió las metrics preview)
- Testcontainers para paralelismo real en CI (hoy la suite e2e comparte la db de dev)
