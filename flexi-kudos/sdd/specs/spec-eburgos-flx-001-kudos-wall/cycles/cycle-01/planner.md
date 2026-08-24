# Sprint Plan — Cycle 01: kudos-wall

> **Input:** sdd/specs/spec-eburgos-flx-001-kudos-wall/cycles/cycle-01/functional.md
> **Output:** sdd/specs/spec-eburgos-flx-001-kudos-wall/cycles/cycle-01/planner.md + tasks.json
> **Generado por:** sdd-planner
> **Fecha:** 2026-08-24

---

## Resumen del ciclo

| Campo             | Valor                                                    |
| ----------------- | -------------------------------------------------------- |
| Ciclo             | 01                                                       |
| Módulo            | kudos-wall                                               |
| Fase              | core-e2e                                                 |
| Duración estimada | 1.5 semanas (≈ 55 h desarrollo)                          |
| Apps              | apps/api, apps/webapp, libs/shared-types                 |
| Total tasks       | 20                                                       |
| Total story points| 55                                                       |
| Total horas       | 54.5                                                     |

### Distribución por subproyecto

| Subproyecto         | Tasks | SP  | Horas |
| ------------------- | ----- | --- | ----- |
| libs/shared-types   | 2     | 4   | 3.5   |
| apps/api            | 11    | 32  | 32    |
| apps/webapp         | 6     | 15  | 15    |
| infra/repo          | 1     | 4   | 4     |

---

## Fases del ciclo

1. **Fundaciones (TASK-001..004):** docker-compose Postgres + shared-types DTOs + scaffolding NestJS y app Nest de base.
2. **Persistencia y datos (TASK-005..007):** entidades, migración, seed de miembros.
3. **Endpoints API (TASK-008..012):** members, categories, POST kudos, GET kudos con cursor, health.
4. **Guarda y errores (TASK-013..014):** rate limit + formato uniforme de error.
5. **Tests backend (TASK-015):** unitarios de validación + e2e supertest.
6. **Frontend (TASK-016..019):** api-client, muro, formulario, formateo de fecha.
7. **Tests frontend (TASK-020):** render del muro + validación del formulario.

---

## Tasks — libs/shared-types

### TASK-001: Publicar DTOs compartidos (MemberDto, CategoryDto, KudoDto, CreateKudoRequest, KudoListResponse, ErrorEnvelope)

- **Descripción:** Definir en `libs/shared-types/src/lib/` los tipos que consumen tanto la API como el webapp. Incluir la unión literal de `CategoryKey`, la forma del error envelope y el tipo del cursor opaco (string). Exportar todo desde el barrel `index.ts` de la lib.
- **HUs cubiertas:** HU-11
- **Archivos a crear/modificar:**
  - `libs/shared-types/src/lib/member.dto.ts`
  - `libs/shared-types/src/lib/category.dto.ts`
  - `libs/shared-types/src/lib/kudo.dto.ts`
  - `libs/shared-types/src/lib/error.dto.ts`
  - `libs/shared-types/src/index.ts`
- **Criterio de done:** el `pnpm nx build shared-types` compila; `apps/api` y `apps/webapp` pueden importar los tipos.
- **Dependencias:** ninguna.
- **Estimación:** 2 h / 2 SP.

### TASK-002: Test de contrato para CategoryKey y códigos de error

- **Descripción:** Agregar tests puros de tipos (o unitarios) que verifican que `CategoryKey` es la unión exacta de las 6 categorías y que la unión `ErrorCode` cubre los 7 códigos definidos (`VALIDATION_ERROR`, `MEMBER_NOT_FOUND`, `SELF_KUDO_FORBIDDEN`, `INVALID_CATEGORY`, `MESSAGE_TOO_LONG`, `INVALID_CURSOR`, `RATE_LIMITED`).
- **HUs cubiertas:** HU-02, HU-04
- **Archivos:** `libs/shared-types/src/lib/*.spec.ts`
- **Criterio de done:** `pnpm nx test shared-types` verde.
- **Dependencias:** TASK-001.
- **Estimación:** 1.5 h / 2 SP.

---

## Tasks — infra / repo

### TASK-003: docker-compose de Postgres y variables de entorno

- **Descripción:** Agregar servicio Postgres 16 al `docker-compose.yml` de la raíz (o crear el archivo si no existe), con volumen persistente y usuario/db dedicado (`kudos`). Documentar en `apps/api/.env.example` la connection string. Verificar que `harness add service postgres` no rompa el flujo del kit.
- **HUs cubiertas:** HU-11
- **Archivos:** `docker-compose.yml`, `apps/api/.env.example`
- **Criterio de done:** `docker compose up -d postgres` levanta la base y `psql` conecta.
- **Dependencias:** ninguna.
- **Estimación:** 4 h / 5 SP (incluye troubleshooting inicial y verificación de que el kit no lo pise).
- **App:** infra.

---

## Tasks — apps/api

### TASK-004: Scaffolding del NestJS + módulos del dominio + PrismaModule

- **Descripción:** Levantar el módulo raíz de NestJS con `AppModule`, `HealthModule`, `KudosModule`, `MembersModule`, `CategoriesModule` y `PrismaModule` (`@Global()` con `PrismaService extends PrismaClient`). Cargar `DATABASE_URL` de la env (TASK-003). Incorporar el `ValidationPipe` global con whitelist y forbidNonWhitelisted, y la integración de `nestjs-pino` para logs estructurados con `request_id`.
- **HUs cubiertas:** HU-09, HU-11
- **Archivos:**
  - `apps/api/src/main.ts`
  - `apps/api/src/app/app.module.ts`
  - `apps/api/src/kudos/kudos.module.ts`
  - `apps/api/src/members/members.module.ts`
  - `apps/api/src/categories/categories.module.ts`
  - `apps/api/src/health/health.module.ts`
  - `apps/api/src/prisma/prisma.module.ts`
  - `apps/api/src/prisma/prisma.service.ts`
- **Criterio de done:** `pnpm nx serve api` levanta el server contra la base local sin errores.
- **Dependencias:** TASK-003.
- **Estimación:** 3 h / 3 SP.

### TASK-005: Prisma schema (members, kudos) + migración inicial SQL

- **Descripción:** Definir modelos Prisma `Member` y `Kudo` en `apps/api/prisma/schema.prisma` según la spec, con índice compuesto `(created_at desc, id desc)` (declarado con `@@index([created_at(sort: Desc), id(sort: Desc)])`) y check-constraints escritos como SQL raw dentro de la migración inicial (`category IN (...)`, `giver_id <> receiver_id`, `char_length(message) BETWEEN 1 AND 1120`). Escribir la migración inicial en `apps/api/prisma/migrations/20260824000000_init/migration.sql`. `is_active` default `true`. `provider = "postgresql"`.
- **HUs cubiertas:** HU-11, HU-12
- **Archivos:**
  - `apps/api/prisma/schema.prisma`
  - `apps/api/prisma/migrations/20260824000000_init/migration.sql`
  - `apps/api/prisma/migrations/migration_lock.toml`
- **Criterio de done:** correr las migraciones sobre base vacía crea ambas tablas y el índice; `pnpm nx test api` que apunta a base de test no falla en el bootstrap.
- **Dependencias:** TASK-004.
- **Estimación:** 4 h / 5 SP.

### TASK-006: Seed de miembros (mínimo 6) vía `prisma db seed`

- **Descripción:** Script `apps/api/prisma/seed.ts` idempotente (`prisma.member.upsert` por `handle`) que inserta al menos 6 miembros del equipo (`eburgos`, `gcostabile`, `mvago`, `apresta`, `rda`, `vuribe`). Registrar en el `package.json` raíz el bloque `"prisma": { "seed": "tsx apps/api/prisma/seed.ts" }` para que `pnpm prisma db seed` lo ejecute. Agregar target Nx `api:seed` que corre el mismo comando.
- **HUs cubiertas:** HU-01
- **Archivos:**
  - `apps/api/prisma/seed.ts`
  - `apps/api/project.json` (target `seed`)
  - `package.json` (bloque `prisma.seed`)
- **Criterio de done:** `pnpm nx run api:seed` corre dos veces sin duplicar miembros; `GET /v1/members` los devuelve.
- **Dependencias:** TASK-005.
- **Estimación:** 2 h / 2 SP.

### TASK-007: Endpoint GET /v1/members

- **Descripción:** Controller + service que devuelve todos los `members` con `is_active = true` ordenados por `full_name` asc (case-insensitive). Cachear en memoria opcionalmente; en v1 basta con query directo.
- **HUs cubiertas:** HU-01
- **Archivos:**
  - `apps/api/src/members/members.controller.ts`
  - `apps/api/src/members/members.service.ts`
- **Criterio de done:** `curl /v1/members` devuelve la lista seedeada ordenada; test unitario del service verde.
- **Dependencias:** TASK-006.
- **Estimación:** 2 h / 2 SP.

### TASK-008: Endpoint GET /v1/categories

- **Descripción:** Controller que devuelve el enum fijo con `key` + `label` en español. El array se construye en un módulo estático (no en base). Consumido por el frontend.
- **HUs cubiertas:** HU-02
- **Archivos:**
  - `apps/api/src/categories/categories.controller.ts`
  - `apps/api/src/categories/categories.constants.ts`
- **Criterio de done:** `curl /v1/categories` devuelve las 6 con label en español (`{ key: "teamwork", label: "Trabajo en equipo" }`, etc.).
- **Dependencias:** TASK-004.
- **Estimación:** 1 h / 1 SP.

### TASK-009: Endpoint POST /v1/kudos con validación de negocio

- **Descripción:** Controller + service para crear kudos. Valida con class-validator (`CreateKudoDto`): UUIDs de giver/receiver, `category` in enum, `message` no vacío después de trim y ≤280 code points (validador custom `IsMessageLength`). Business rules: `giver_id !== receiver_id`, ambos miembros existen y están activos, `created_at` server-side. Devuelve el DTO expandido (`giver`, `receiver`, `category` con `label`).
- **HUs cubiertas:** HU-03, HU-04
- **Archivos:**
  - `apps/api/src/kudos/kudos.controller.ts`
  - `apps/api/src/kudos/kudos.service.ts`
  - `apps/api/src/kudos/dto/create-kudo.dto.ts`
  - `apps/api/src/kudos/validators/message-length.validator.ts`
- **Criterio de done:** happy path 201 devuelve DTO expandido; los 4 casos de error (self, member not found, invalid category, message too long) devuelven 422 con los códigos correctos.
- **Dependencias:** TASK-005, TASK-007, TASK-008.
- **Estimación:** 4 h / 5 SP.

### TASK-010: Endpoint GET /v1/kudos con paginación por cursor

- **Descripción:** Controller + service que devuelve `KudoListResponse` con paginación por cursor opaco. El cursor codifica `(created_at, id)` como base64 JSON con firma HMAC-SHA256 corta (previene cursors de otras bases: fail con `INVALID_CURSOR` si la firma no matchea). `limit` default 20, cap 50, no error si excede. Include join eager de `giver` y `receiver`. Orden `created_at DESC, id DESC`.
- **HUs cubiertas:** HU-05
- **Archivos:**
  - `apps/api/src/kudos/kudos.controller.ts` (append)
  - `apps/api/src/kudos/kudos.service.ts` (append)
  - `apps/api/src/kudos/dto/list-kudos.query.ts`
  - `apps/api/src/kudos/cursor.util.ts`
- **Criterio de done:** con 55 seeds, 3 páginas de 20/20/15 sin duplicados; `limit=100` acota a 50; cursor corrupto → 400 `INVALID_CURSOR`.
- **Dependencias:** TASK-009.
- **Estimación:** 5 h / 5 SP.

### TASK-011: Endpoint GET /healthz

- **Descripción:** Controller mínimo que devuelve `{ status: "ok" }` con 200. Sin dependencias externas; el objetivo es que el kit y CI puedan chequear que el servicio responde.
- **HUs cubiertas:** HU-09
- **Archivos:** `apps/api/src/health/health.controller.ts`
- **Criterio de done:** `curl /healthz` → 200 con payload esperado.
- **Dependencias:** TASK-004.
- **Estimación:** 0.5 h / 1 SP.

### TASK-012: Rate limit por IP en POST /v1/kudos

- **Descripción:** Configurar `@nestjs/throttler` con storage in-memory: 60 req/min por IP, aplicado únicamente al `POST /v1/kudos` (usando `@Throttle()` y `@SkipThrottle()` para el resto). El 61° request devuelve 429 con `code: "RATE_LIMITED"` en el envelope estándar.
- **HUs cubiertas:** HU-10
- **Archivos:**
  - `apps/api/src/app.module.ts` (append import)
  - `apps/api/src/common/throttler.guard.ts` (custom guard para preservar el envelope)
  - `apps/api/src/kudos/kudos.controller.ts` (append decorator)
- **Criterio de done:** e2e supertest emula 61 requests consecutivos desde la misma IP; el 61° devuelve 429 `RATE_LIMITED`.
- **Dependencias:** TASK-009.
- **Estimación:** 2 h / 2 SP.

### TASK-013: Filtro global de excepciones + envelope de error uniforme

- **Descripción:** `HttpExceptionFilter` global que envuelve TODA respuesta de error en `{ error: { code, message, details? } }`. Traduce excepciones de class-validator a `VALIDATION_ERROR`, excepciones custom del dominio (`SelfKudoForbiddenException`, `MemberNotFoundException`, `InvalidCategoryException`, `MessageTooLongException`, `InvalidCursorException`) a sus códigos. Rate limit exception → `RATE_LIMITED`.
- **HUs cubiertas:** HU-04
- **Archivos:**
  - `apps/api/src/common/filters/http-exception.filter.ts`
  - `apps/api/src/common/exceptions/*.ts`
  - `apps/api/src/main.ts` (append `app.useGlobalFilters`)
- **Criterio de done:** todos los tests de errores del ciclo devuelven el envelope; ningún error del framework se filtra sin envelope.
- **Dependencias:** TASK-009.
- **Estimación:** 3 h / 3 SP.

### TASK-014: Tests unitarios de servicios + e2e supertest

- **Descripción:** Suite unitaria de `KudosService` (mocks de repos): happy path, self-kudo, member not found (giver/receiver), invalid category, message too long, message vacío después de trim. Suite e2e (`test/kudos.e2e-spec.ts`) usando `@nestjs/testing` + supertest + base de test sqlite/postgres: happy path POST + GET paginado con 3 páginas + los 4 errores + rate limit (61°) + `/healthz`.
- **HUs cubiertas:** HU-13
- **Archivos:**
  - `apps/api/src/kudos/kudos.service.spec.ts`
  - `apps/api/test/kudos.e2e-spec.ts`
  - `apps/api/test/jest-e2e.json`
- **Criterio de done:** `pnpm nx test api` verde, `pnpm nx e2e api` verde.
- **Dependencias:** TASK-010, TASK-011, TASK-012, TASK-013.
- **Estimación:** 5 h / 5 SP.

---

## Tasks — apps/webapp

### TASK-015: Api-client tipado + configuración de fetch base

- **Descripción:** Módulo `apiClient` en `apps/webapp/src/api/` con funciones `listMembers`, `listCategories`, `listKudos({ limit, cursor })`, `createKudo(dto)`. Consume tipos de `@flexi-kudos/shared-types`. Base URL desde `import.meta.env.VITE_API_URL` con default a `http://localhost:3000/v1`. Traduce error envelope del backend en excepciones tipadas (`KudosApiError` con `code` y `details`).
- **HUs cubiertas:** HU-01, HU-02, HU-03, HU-05
- **Archivos:**
  - `apps/webapp/src/api/kudos-client.ts`
  - `apps/webapp/src/api/errors.ts`
- **Criterio de done:** el cliente tipa correctamente; los métodos compilan sin `any`.
- **Dependencias:** TASK-001.
- **Estimación:** 2 h / 2 SP.

### TASK-016: Vista del muro (ruta `/`) con grilla, estado vacío y "Cargar más"

- **Descripción:** Página `KudosWallPage` en ruta `/` que carga `listKudos()`, renderiza tarjetas en grilla responsive (Tailwind o CSS Modules, según decida el architect). Tarjeta = componente `KudoCard` (receptor destacado, categoría con chip de color por `key`, mensaje escapado, giver, fecha relativa con tooltip). Botones "Refrescar" y "Cargar más" (usa `next_cursor`). Estado vacío con CTA a `/nuevo`.
- **HUs cubiertas:** HU-05, HU-07, HU-08
- **Archivos:**
  - `apps/webapp/src/pages/KudosWallPage.tsx`
  - `apps/webapp/src/components/KudoCard.tsx`
  - `apps/webapp/src/components/EmptyState.tsx`
  - `apps/webapp/src/components/CategoryChip.tsx`
- **Criterio de done:** manualmente + test de render (TASK-020) muestran grilla con datos mockeados; estado vacío se renderiza cuando `items.length === 0`.
- **Dependencias:** TASK-015.
- **Estimación:** 4 h / 5 SP.

### TASK-017: Utilidades de formato de fecha (relativa + absoluta AR)

- **Descripción:** Hook `useRelativeTime(date)` y helper `formatAbsoluteAr(date)`. Usar `Intl.RelativeTimeFormat('es-AR')` para el relativo y `Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', ... })` para el absoluto. Sin dependencias externas.
- **HUs cubiertas:** HU-08
- **Archivos:**
  - `apps/webapp/src/utils/date.ts`
  - `apps/webapp/src/utils/date.spec.ts`
- **Criterio de done:** test unitario que fija ahora en un valor conocido y verifica los outputs para 5 min / 3 h / 2 días.
- **Dependencias:** ninguna (paralelizable con TASK-016).
- **Estimación:** 1.5 h / 2 SP.

### TASK-018: Formulario de alta (ruta `/nuevo`) con validación cliente

- **Descripción:** Página `NewKudoPage` con selects (giver, receiver, categoría — todas populadas desde la API), textarea con contador de caracteres (medido por code points: `[...msg].length`). Botón submit habilitado solo cuando: 4 campos completos, `giver !== receiver` y mensaje entre 1 y 280 code points después de trim. Mensaje inline "no podés darte un kudo a vos mismo" cuando aplica. Al submit exitoso → `navigate('/')` con el nuevo kudo insertado como primero. Al error → banner con `message` del envelope.
- **HUs cubiertas:** HU-06
- **Archivos:**
  - `apps/webapp/src/pages/NewKudoPage.tsx`
  - `apps/webapp/src/components/KudoForm.tsx`
  - `apps/webapp/src/hooks/useCreateKudo.ts`
- **Criterio de done:** flujo end-to-end manual funciona; test (TASK-020) verifica deshabilitación del submit.
- **Dependencias:** TASK-015, TASK-016.
- **Estimación:** 4 h / 5 SP.

### TASK-019: Router + layout + estado global mínimo (contexto de listas)

- **Descripción:** Configurar React Router con rutas `/` y `/nuevo`. Layout base con header ("Muro de kudos") y contenedor. Context `MembersCategoriesProvider` que carga miembros y categorías una vez y los expone; se actualiza tras crear un kudo empujando la tarjeta nueva al feed.
- **HUs cubiertas:** HU-05, HU-06, HU-07
- **Archivos:**
  - `apps/webapp/src/App.tsx`
  - `apps/webapp/src/router.tsx`
  - `apps/webapp/src/context/MembersCategoriesProvider.tsx`
- **Criterio de done:** navegación `/` ↔ `/nuevo` funciona; los selects del formulario ya no re-fetchan al volver a entrar.
- **Dependencias:** TASK-016, TASK-018.
- **Estimación:** 2 h / 2 SP.

### TASK-020: Tests frontend (render del muro + validación del formulario)

- **Descripción:** Con `@testing-library/react` + Vitest (o Jest, según scaffold del webapp). Test 1: render de `KudosWallPage` con `apiClient` mockeado devolviendo 3 kudos y verifica que se pintan las tarjetas con giver/receiver/categoría/mensaje. Test 2: render del formulario, verifica que el submit está deshabilitado cuando falta campo, cuando `giver === receiver` y cuando el mensaje excede 280 code points.
- **HUs cubiertas:** HU-13
- **Archivos:**
  - `apps/webapp/src/pages/KudosWallPage.spec.tsx`
  - `apps/webapp/src/components/KudoForm.spec.tsx`
- **Criterio de done:** `pnpm nx test webapp` verde.
- **Dependencias:** TASK-016, TASK-018, TASK-019.
- **Estimación:** 3 h / 3 SP.

---

## Orden de ejecución (DAG topológico)

```
Camino crítico:
TASK-001 (shared-types DTOs)
  → TASK-002 (tests contrato)
  → TASK-015 (api-client)  [paralelo con TASK-016..019]

TASK-003 (docker-compose)
  → TASK-004 (scaffold Nest)
    → TASK-005 (entities + migración)
      → TASK-006 (seed)
        → TASK-007 (GET /members)
        → TASK-008 (GET /categories)  [paralelo con TASK-007, depende solo de TASK-004]
          → TASK-009 (POST /kudos)
            → TASK-010 (GET /kudos + cursor)
            → TASK-012 (rate limit)
            → TASK-013 (error filter)
              → TASK-014 (tests backend)
    → TASK-011 (healthz)  [paralelo con TASK-005]

TASK-015 (api-client)
  → TASK-016 (muro)
    → TASK-018 (formulario)  [paralelo con TASK-017]
      → TASK-019 (router + context)
        → TASK-020 (tests frontend)

TASK-017 (utils fecha)  [independiente, paralelizable]
```

### Tasks paralelizables (mismo momento del sprint)

- Después de TASK-001: TASK-002 y TASK-015 pueden avanzar en paralelo.
- Después de TASK-004: TASK-005 y TASK-011 en paralelo.
- Después de TASK-006: TASK-007 y TASK-008 en paralelo (TASK-008 solo depende de TASK-004; se agrupa por conveniencia).
- Después de TASK-009: TASK-010, TASK-012, TASK-013 pueden avanzar en paralelo.
- TASK-017 es independiente y se puede hacer en cualquier hueco.

---

## Riesgos identificados

| Riesgo                                                                                          | Mitigación                                                                                             |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Elección ORM (TypeORM vs Prisma) impacta TASK-005/006/007/010                                    | Resuelto: architect D-01 (updated 2026-08-24) fija Prisma ORM 5 + Prisma Migrate. |
| Cursor con HMAC exige una `CURSOR_SECRET` env var; en dev puede quedar fija.                    | Documentar en `.env.example` y en el architect.md; test verifica que un secret distinto invalida el cursor. |
| `class-validator` no cuenta code points correctamente para emojis.                              | Validador custom `IsMessageLength` implementado en TASK-009 usa `[...msg].length`.                       |
| Rate limit por IP detrás de proxies (X-Forwarded-For) puede confundirse en local vs deploy.     | En v1 se usa la IP del socket directo; documentado en architect.md.                                     |
| El seed depende del scaffold del webapp para nombres reales; podría requerir ajuste posterior.  | Lista inicial usa handles del org de Flexibility; puede editarse por fix menor si aparece un nombre mal. |
