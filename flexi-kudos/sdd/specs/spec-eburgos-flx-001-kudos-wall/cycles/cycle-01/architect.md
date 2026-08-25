# Architect — Cycle 01: kudos-wall

> **Input:** sdd/specs/spec-eburgos-flx-001-kudos-wall/cycles/cycle-01/functional.md
> **Output:** sdd/specs/spec-eburgos-flx-001-kudos-wall/cycles/cycle-01/architect.md
> **Generado por:** sdd-architect
> **Fecha:** 2026-08-24

---

## 1. Decisiones técnicas

### D-01 — Stack backend: NestJS 11 + Prisma 7 + Postgres 16

- **Framework:** NestJS 11 sobre Node 22 (versiones ya presentes en `package.json` raíz).
- **ORM:** **Prisma ORM 7** (decisión humana registrada 2026-08-24, override sobre la propuesta original de TypeORM; instalado como `@prisma/client` 7.9.x + `prisma` CLI 7.9.x, alineado con Node 22). Se elige Prisma por: (a) type-safety del cliente generado (`prisma generate`) que elimina el desalineo entre entity y query, (b) migraciones declarativas con `prisma migrate dev` / `prisma migrate deploy` y SQL versionado bajo `apps/api/prisma/migrations/<timestamp>_<name>/migration.sql`, (c) seed nativo vía `prisma db seed`.
- **Integración con Nest:** `PrismaService` que extiende `PrismaClient` y implementa `OnModuleInit`/`OnModuleDestroy` (patrón oficial de la doc de Prisma con NestJS). Se expone desde `PrismaModule` (`@Global()`) para inyección directa en `MembersService`, `KudosService` y `CategoriesService` (este último no lo usa, pero el módulo global no obliga).
- **Schema y client:** `apps/api/prisma/schema.prisma` con generador cliente por defecto en `node_modules/@prisma/client` (sin `output` custom en v1). `datasource db` toma `DATABASE_URL` de la env.
- **Migración inicial:** `apps/api/prisma/migrations/20260824000000_init/migration.sql` — crea `members`, `kudos`, índices y check-constraints. Convención de nombre `<YYYYMMDDHHMMSS>_<name>` es la nativa de Prisma Migrate.
- **Seed:** script `apps/api/prisma/seed.ts` registrado en el `package.json` raíz como `"prisma": { "seed": "ts-node apps/api/prisma/seed.ts" }` (o `tsx apps/api/prisma/seed.ts` si preferimos evitar `ts-node`). Se dispara con `pnpm prisma db seed` o desde un target Nx `api:seed` que ejecute el mismo comando.
- **Validación:** `class-validator` + `class-transformer` a través del `ValidationPipe` global de Nest con `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- **Logs:** `nestjs-pino` con `pino-http` para propagar `request_id` (header `x-request-id` o UUID v4 generado en el interceptor).
- **Rate limit:** `@nestjs/throttler` v6, storage in-memory (single-instance en v1).

### D-02 — Stack frontend: React 18 + Vite + React Router 6

- **Framework:** React 18 con TypeScript, servido por Vite (el scaffold Nx `@nx/react:app` que ya generó `apps/webapp`).
- **Router:** React Router 6.
- **HTTP:** `fetch` nativo envuelto en `kudos-client.ts`. No se suma librería adicional (axios, tanstack-query) en v1: el estado del muro es simple (una lista con paginación por cursor) y el context provider alcanza.
- **Estilos:** CSS Modules (default Nx). Sin dependencia de Tailwind en v1 para mantener el bundle chico; se puede migrar a Tailwind en un cycle posterior si aparece un design system.

### D-03 — Cursor opaco firmado con HMAC-SHA256

- **Formato:** `base64url(<json>).<sig>` donde `<json>` = `{ "t": "<created_at ISO>", "i": "<id>" }` y `<sig>` = `base64url(hmacSha256(json, CURSOR_SECRET)).slice(0, 16)`.
- **Motivación:** el cursor es opaco al cliente (no expone timestamps ni IDs a simple vista), y la firma con `CURSOR_SECRET` (env var, distinta por deploy) hace que un cursor de otra base falle validación → `INVALID_CURSOR`.
- **Verificación:** decodificar → recomputar HMAC → comparar en tiempo constante. Si falla cualquier paso (base64, JSON parse, mismatch de firma) → `InvalidCursorException` (400 `INVALID_CURSOR`).
- **Query WHERE:** `WHERE (created_at, id) < ($t, $i) ORDER BY created_at DESC, id DESC LIMIT $limit`.

### D-04 — Conteo de `message` por code points

- La longitud del mensaje se mide con `[...msg].length` (code points), no con `msg.length` (code units UTF-16).
- Validador custom `IsMessageLength` en `apps/api/src/kudos/validators/message-length.validator.ts` que:
  1. Aplica `trim()`.
  2. Rechaza si `trimmed.length === 0` con `VALIDATION_ERROR` (`details.field: "message"`).
  3. Rechaza si `[...trimmed].length > 280` con `MESSAGE_TOO_LONG`.
- El frontend replica exactamente esta lógica en `KudoForm` para deshabilitar el submit antes del envío.

### D-05 — Envelope de error uniforme

- **Forma:** `{ "error": { "code": string, "message": string, "details"?: object } }`.
- **Implementación:** `HttpExceptionFilter` global (registrado en `main.ts` con `app.useGlobalFilters`).
- **Códigos y mapeo:**
  | Excepción interna | HTTP | code |
  | ------------------------------- | ---- | ---------------------- |
  | `BadRequestException` (class-validator) | 422 | `VALIDATION_ERROR` |
  | `SelfKudoForbiddenException` | 422 | `SELF_KUDO_FORBIDDEN` |
  | `MemberNotFoundException` | 422 | `MEMBER_NOT_FOUND` |
  | `InvalidCategoryException` | 422 | `INVALID_CATEGORY` |
  | `MessageTooLongException` | 422 | `MESSAGE_TOO_LONG` |
  | `InvalidCursorException` | 400 | `INVALID_CURSOR` |
  | `ThrottlerException` | 429 | `RATE_LIMITED` |
  | Cualquier otra `HttpException` no mapeada | passthrough | `code: "INTERNAL_ERROR"` en 500 |
- **Nota semántica:** todos los errores de validación de dominio son **422 Unprocessable Entity** (no 400) porque el request es sintácticamente correcto pero viola una regla de negocio. `400` queda reservado para request malformado (JSON inválido, cursor corrupto).

### D-06 — Rate limit: sólo POST /v1/kudos, 60 req/min por IP

- Config global de `@nestjs/throttler` con `ttl: 60_000`, `limit: 60`.
- Guard aplicado sólo al endpoint de creación (`@UseGuards(ThrottlerGuard)` + `@Throttle({ default: { limit: 60, ttl: 60_000 } })` a nivel handler). El resto de endpoints usa `@SkipThrottle()`.
- **Custom guard** `KudosThrottlerGuard` extiende `ThrottlerGuard` para: (a) tomar la IP del socket (`req.socket.remoteAddress`) sin confiar en `X-Forwarded-For` en v1 (sin proxy configurado), (b) al superar el límite tirar `ThrottlerException` que el filtro global convierte en el envelope estándar.

### D-07 — Estrategia de tests

- **Unitario backend:** Jest (default Nx) + `PrismaService` mockeado (jest.mock del cliente). `KudosService.spec.ts` cubre las 6 combinaciones de validación de creación.
- **E2E backend:** `@nestjs/testing` + `supertest`, corriendo contra la misma base Postgres del docker-compose con `beforeEach` que trunca `kudos` y re-seedea `members`. `testcontainers` queda como opción futura si aparece paralelismo real de CI. Cubre CA-401..CA-406, CA-505, CA-506, CA-1002, CA-901.
- **Frontend:** Vitest + `@testing-library/react` con `apiClient` mockeado vía `vi.mock`.

### D-08 — Seed de miembros

- Script `apps/api/src/seed/seed.ts` invocado por `pnpm nx run api:seed`.
- Lista inicial (handles + full names ficticios plausibles para el demo):
  ```ts
  const SEED_MEMBERS = [
    { handle: 'eburgos',   full_name: 'Esteban Burgos' },
    { handle: 'gcostabile', full_name: 'Gaston Costabile' },
    { handle: 'mvago',     full_name: 'Martin Vago' },
    { handle: 'apresta',   full_name: 'Ariel Presta' },
    { handle: 'rda',       full_name: 'Romina D Amato' },
    { handle: 'vuribe',    full_name: 'Valeria Uribe' },
  ];
  ```
- Idempotencia por `UPSERT ON CONFLICT (handle) DO NOTHING`.

### D-09 — Zona horaria y formato de fecha

- `created_at` viaja **siempre en UTC ISO-8601** (`2026-08-24T15:30:00.000Z`).
- El frontend usa `Intl.RelativeTimeFormat('es-AR')` para el relativo y `Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'medium', timeStyle: 'short' })` para el tooltip absoluto. Sin dependencia externa (día.js, moment).

### D-10 — Handling de `X-Forwarded-For` y proxies

- En v1 (sin ingress) el rate limit toma la IP del socket. Si en un ciclo posterior se pone un proxy delante, habrá que setear `app.set('trust proxy', 1)` en Express y usar `req.ip`. Documentado como riesgo en el planner.md.

---

## 2. Cambios en schema (sdd/schema.json)

> App-key: `api` (backend NestJS del monorepo, path `apps/api`).

### Tabla nueva: `members`

| Columna     | Tipo         | Constraints                                                       | Notas                                                    |
| ----------- | ------------ | ----------------------------------------------------------------- | -------------------------------------------------------- |
| id          | UUID         | PRIMARY KEY, DEFAULT gen_random_uuid()                            | Identificador del miembro                                |
| full_name   | TEXT         | NOT NULL                                                          | Nombre completo (usado para ordenar y mostrar)           |
| handle      | TEXT         | NOT NULL, UNIQUE                                                  | Alias corto único (usado en la UI)                       |
| is_active   | BOOLEAN      | NOT NULL, DEFAULT TRUE                                            | Soft-flag para futuras iteraciones (todos true en v1)    |
| created_at  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                                           | Auditoría                                                |

- **Índices adicionales:** `UNIQUE INDEX uk_members_handle` (implícito por UNIQUE), `INDEX idx_members_active_name (is_active, full_name)` para la lista ordenada.
- **Migración:** `apps/api/prisma/migrations/20260824000000_init/migration.sql` (crea `members` + `kudos` en la misma migración, ver abajo).

### Tabla nueva: `kudos`

| Columna     | Tipo         | Constraints                                                                                  | Notas                                                    |
| ----------- | ------------ | -------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| id          | UUID         | PRIMARY KEY, DEFAULT gen_random_uuid()                                                       | Identificador del kudo                                   |
| giver_id    | UUID         | NOT NULL, REFERENCES members(id) ON DELETE RESTRICT                                          | Miembro que da el kudo                                   |
| receiver_id | UUID         | NOT NULL, REFERENCES members(id) ON DELETE RESTRICT                                          | Miembro que recibe                                       |
| category    | TEXT         | NOT NULL, CHECK (category IN ('teamwork','ownership','innovation','delivery','kindness','learning')) | Categoría cerrada (S-2)                          |
| message     | TEXT         | NOT NULL, CHECK (char_length(message) BETWEEN 1 AND 1120)                                   | Texto plano ≤280 code points (cap por bytes 4/char)      |
| created_at  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()                                                                      | Server-side, inmutable                                   |

- **Constraint adicional:** `CHECK (giver_id <> receiver_id)` — RN-02 respaldada a nivel base (defensa en profundidad).
- **Índices:**
  - `INDEX idx_kudos_feed (created_at DESC, id DESC)` — soporta el orden del cursor (RN-09, CA-1203).
  - `INDEX idx_kudos_giver (giver_id)` — reservado para futuras vistas por giver.
  - `INDEX idx_kudos_receiver (receiver_id)` — idem.
- **Migración:** `apps/api/prisma/migrations/20260824000000_init/migration.sql`.
- **Nota sobre el CHECK del mensaje:** Postgres no cuenta code points nativamente en un `CHECK`. La regla de 280 code points se aplica en la aplicación (D-04); el `CHECK(char_length BETWEEN 1 AND 1120)` funciona como red de seguridad (1120 = 280 × 4 bytes máximo por code point UTF-8).

---

## 3. Contratos de API (sdd/api.json)

> App-key: `api`. Todos los endpoints con prefijo `/v1` excepto `/healthz`. Formato de error uniforme (D-05).

### EP-001 — `GET /v1/members`

**Request:** sin body, sin path params, sin query params obligatorios.

**Response 200:**
```json
[
  {
    "id": "e4a1b2c3-...",
    "full_name": "Esteban Burgos",
    "handle": "eburgos"
  }
]
```

**Errores:** 500 (`INTERNAL_ERROR`) si falla la base.

### EP-002 — `GET /v1/categories`

**Request:** sin parámetros.

**Response 200:**
```json
[
  { "key": "teamwork",   "label": "Trabajo en equipo" },
  { "key": "ownership",  "label": "Ownership" },
  { "key": "innovation", "label": "Innovación" },
  { "key": "delivery",   "label": "Entrega" },
  { "key": "kindness",   "label": "Amabilidad" },
  { "key": "learning",   "label": "Aprendizaje" }
]
```

**Errores:** ninguno propio (constante en memoria).

### EP-003 — `POST /v1/kudos`

**Request body:**
```json
{
  "giver_id": "uuid",
  "receiver_id": "uuid",
  "category": "teamwork | ownership | innovation | delivery | kindness | learning",
  "message": "string (1..280 code points después de trim)"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "giver":    { "id": "uuid", "full_name": "...", "handle": "..." },
  "receiver": { "id": "uuid", "full_name": "...", "handle": "..." },
  "category": { "key": "teamwork", "label": "Trabajo en equipo" },
  "message":  "string",
  "created_at": "2026-08-24T15:30:00.000Z"
}
```

**Errores:**
- 422 `VALIDATION_ERROR` — mensaje vacío después de trim (o request malformado no cubierto por otro código).
- 422 `SELF_KUDO_FORBIDDEN` — `giver_id === receiver_id`.
- 422 `MEMBER_NOT_FOUND` — con `details.field: "giver_id" | "receiver_id"`.
- 422 `INVALID_CATEGORY` — con `details.allowed: [...]`.
- 422 `MESSAGE_TOO_LONG` — mensaje > 280 code points.
- 429 `RATE_LIMITED` — 61° request en la ventana de 60 s desde la misma IP.
- 500 `INTERNAL_ERROR`.

### EP-004 — `GET /v1/kudos`

**Query params:**
- `limit` (opcional, default 20, cap 50).
- `cursor` (opcional, string opaco firmado — ver D-03).

**Response 200:**
```json
{
  "items": [
    {
      "id": "uuid",
      "giver":    { "id": "uuid", "full_name": "...", "handle": "..." },
      "receiver": { "id": "uuid", "full_name": "...", "handle": "..." },
      "category": { "key": "teamwork", "label": "Trabajo en equipo" },
      "message":  "string",
      "created_at": "2026-08-24T15:30:00.000Z"
    }
  ],
  "next_cursor": "eyJ0IjoiMjAyNi0uLiJ9.abc123 | null"
}
```

**Errores:**
- 400 `INVALID_CURSOR` — cursor corrupto o firma incorrecta.
- 500 `INTERNAL_ERROR`.

### EP-005 — `GET /healthz`

**Request:** sin parámetros.

**Response 200:**
```json
{ "status": "ok" }
```

**Errores:** ninguno intencional. Si el service no responde, el HTTP layer devuelve 5xx.

---

## 4. Componentes frontend (sdd/components.json)

> App-key: `apps/webapp`.

| ID       | Nombre                        | Type      | Path                                            | Consume                     |
| -------- | ----------------------------- | --------- | ----------------------------------------------- | --------------------------- |
| COMP-001 | KudosWallPage                 | page      | src/pages/KudosWallPage.tsx                     | EP-004                      |
| COMP-002 | NewKudoPage                   | page      | src/pages/NewKudoPage.tsx                       | EP-001, EP-002, EP-003      |
| COMP-003 | KudoCard                      | component | src/components/KudoCard.tsx                     | —                           |
| COMP-004 | KudoForm                      | component | src/components/KudoForm.tsx                     | EP-003                      |
| COMP-005 | CategoryChip                  | component | src/components/CategoryChip.tsx                 | —                           |
| COMP-006 | EmptyState                    | component | src/components/EmptyState.tsx                   | —                           |
| COMP-007 | MembersCategoriesProvider     | component | src/context/MembersCategoriesProvider.tsx       | EP-001, EP-002              |
| COMP-008 | useRelativeTime               | hook      | src/utils/date.ts                               | —                           |

---

## 5. Dependencias externas

### Nuevas en `apps/api`
- `@prisma/client` ^7, `prisma` ^7 (dev) — persistencia + generador de cliente + CLI de migraciones.
- `class-validator` ^0.14, `class-transformer` ^0.5 — validación.
- `nestjs-pino` ^4, `pino-http` ^10, `pino-pretty` ^11 — logs estructurados.
- `@nestjs/throttler` ^6 — rate limit.
- `crypto.randomUUID` nativo (Node 22) para IDs de request en el interceptor.
- **Dev:** `supertest`, `tsx` (o `ts-node`) para ejecutar `prisma/seed.ts`.

### Nuevas en `apps/webapp`
- `react-router-dom` ^6 — routing.
- **Dev:** `@testing-library/react`, `@testing-library/user-event`, `vitest` (o el que use el scaffold Nx del webapp).

### Nuevas en `libs/shared-types`
- Ninguna dependencia runtime — es un lib de tipos puros. Configuración TypeScript hereda del root.

### Infraestructura
- Postgres 16 en `docker-compose.yml` de la raíz del monorepo.
- Env vars (`apps/api/.env.example`):
  - `DATABASE_URL=postgres://kudos:kudos@localhost:5432/kudos`
  - `CURSOR_SECRET=change-me-in-production` (fija en dev, distinta en cada deploy).
  - `RATE_LIMIT_TTL_MS=60000`
  - `RATE_LIMIT_MAX=60`
  - `PORT=3000`

---

## 6. Casos borde — resolución técnica

| Caso                                             | Resolución                                                                                                     |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Mensaje solo con whitespace                      | `trim()` → si vacío → `VALIDATION_ERROR` con `details.field: "message"` (CA-406).                              |
| Emojis multibyte (280 code points, más units)    | Contar con `[...msg].length` (D-04). Validador custom, no el `@MaxLength` de class-validator.                    |
| Dos kudos en el mismo ms                         | Índice `(created_at DESC, id DESC)` (D-01 tabla `kudos`); cursor incluye `id` (D-03).                            |
| Cursor corrupto o de otra base                   | Firma HMAC no matchea → `InvalidCursorException` → 400 `INVALID_CURSOR` (D-03).                                 |
| Miembro `is_active = false` (futuro)             | `GET /v1/members` filtra `WHERE is_active = TRUE`. Creación de kudo también valida `is_active` de ambos IDs.    |
| Cliente envía `created_at` en el body            | `ValidationPipe` con `whitelist: true` lo remueve antes de llegar al service (RN-07 / CA-303).                   |
| `limit` > 50 en el feed                          | `Math.min(limit, 50)` en el service (D-01 endpoints, CA-503).                                                    |
| Rate limit detrás de proxy                       | En v1 IP del socket; documentado en planner.md como follow-up para deploy.                                       |

---

## 7. Follow-ups para ciclos posteriores

- **cycle-02 (potencial):** auth mínima (magic link email) + reemplazo del rate limit por IP por rate limit por user + soft-delete de kudos.
- **cycle-03 (potencial):** métricas agregadas (leaderboard, categorías más usadas), notificaciones (Slack o email al receiver).
- **Deuda técnica registrada:** el CHECK de `message` en base cuenta bytes, no code points. La regla real vive en la app (D-04). Si en el futuro se necesita reforzar a nivel base, migrar a Postgres 17 con extensión de code points o a un trigger que use `array_length(regexp_split_to_array(message, ''), 1)`.
