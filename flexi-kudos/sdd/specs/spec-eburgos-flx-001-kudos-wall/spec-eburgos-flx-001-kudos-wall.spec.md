# SPEC-eburgos-flx-001: Muro de kudos

> **Estado:** draft (esperando aprobación humana antes de arrancar el ciclo)
> **Autor:** eburgos-flx
> **App principal:** apps/api (NestJS) — consumida por apps/webapp (React) vía libs/shared-types
> **Fecha:** 2026-08-24

## Resumen Ejecutivo

Muro público del equipo donde cualquier integrante puede reconocer a un compañero
otorgándole un **kudo**: un mensaje corto asociado a una **categoría** predefinida
(ej. _teamwork_, _ownership_). Todo el equipo ve el muro como un feed de tarjetas
ordenadas por fecha de creación descendente.

El módulo entrega **una API REST** (`apps/api`) para crear y listar kudos, **los DTOs
compartidos** (`libs/shared-types`) y **la vista de muro + el formulario de alta**
(`apps/webapp`). Los datos se persisten en Postgres del `docker-compose` del monorepo.

## Contexto de Negocio

- **Problema:** los reconocimientos entre pares se pierden en Slack/DMs y no acumulan
  visibilidad. Un muro compartido baja la fricción de reconocer y sirve de memoria del
  equipo.
- **Usuarios:** integrantes del equipo Flexibility (público interno). No hay roles
  diferenciados en esta primera iteración.
- **Impacto esperado (MVP):** que el flujo "dar un kudo → verlo en el muro" funcione
  de punta a punta sin fricción, con datos que persisten entre sesiones.

## Alcance y supuestos (fijados en esta spec — revisar antes de aprobar)

Estos supuestos definen el MVP. **Cualquier objeción cambia el alcance antes de arrancar
el ciclo:**

- **S-1 (Identidad).** Todavía no hay sistema de auth. El _giver_ y el _receiver_ se
  eligen desde una **lista fija de miembros** del equipo, seedeada en la base como parte
  del bootstrap del módulo. Cada miembro tiene `id`, `full_name`, `handle`. No hay login.
- **S-2 (Categorías).** Lista **cerrada y fija** en esta spec (no editable por UI):
  `teamwork`, `ownership`, `innovation`, `delivery`, `kindness`, `learning`. Se guardan
  como enum en base y viajan tipadas en `shared-types`.
- **S-3 (Mensaje).** Texto libre, 1–280 caracteres, sin markdown ni HTML (se guarda y
  se muestra como texto plano; el frontend hace escape).
- **S-4 (Anti auto-kudo).** `giver_id !== receiver_id`. Regla dura, validada en API.
- **S-5 (Sin edición ni borrado en v1).** Kudo creado es inmutable. No hay soft-delete
  ni endpoint de update/delete. Si aparece contenido inapropiado, se resuelve por SQL
  manual (fuera del MVP).
- **S-6 (Sin real-time).** El muro se refresca al cargar la vista o al presionar
  "Refrescar". Sin WebSockets ni polling automático.
- **S-7 (Sin multi-equipo).** Un solo equipo, un solo muro.
- **S-8 (Sin rate limit por usuario en v1).** No hay auth para atarlo. Sí hay rate
  limit por IP a nivel global del endpoint POST (RNF-4).
- **S-9 (Timezone).** Timestamps en UTC en base; el frontend los formatea a
  `America/Argentina/Buenos_Aires`.

## Requisitos Funcionales (RF)

### RF-1 — Listar miembros del equipo

- `GET /v1/members` devuelve la lista completa de miembros habilitados para dar y
  recibir kudos (`id`, `full_name`, `handle`), ordenada por `full_name` ascendente.
- Alimenta los selectores de _giver_ y _receiver_ del formulario en el frontend.

### RF-2 — Listar categorías

- `GET /v1/categories` devuelve la lista fija de categorías (S-2) con su `key` técnica
  y un `label` presentable ("Trabajo en equipo", "Ownership", etc.).
- El frontend nunca hardcodea las categorías: siempre las lee de la API.

### RF-3 — Crear un kudo

- `POST /v1/kudos` recibe `giver_id`, `receiver_id`, `category`, `message`.
- Valida: ambos IDs existen en `members`, `giver_id !== receiver_id`, `category`
  pertenece al enum, `message` respeta el largo (S-3).
- Persiste con `id` (uuid), `created_at` (UTC, server-side, inmutable) y devuelve la
  tarjeta ya expandida (con `giver` y `receiver` como objetos, listo para renderizar).
- Respuesta 201 con el DTO completo del kudo.

### RF-4 — Listar el muro de kudos

- `GET /v1/kudos?limit=&cursor=` devuelve las tarjetas ordenadas por `created_at`
  descendente (más nuevo primero), con paginación por cursor.
- Cada tarjeta incluye: `id`, `giver` (`id`, `full_name`, `handle`), `receiver`
  (idem), `category` (`key` + `label`), `message`, `created_at`.
- Valores por defecto: `limit=20`, máximo permitido `limit=50`.
- Cursor opaco basado en `(created_at, id)`.

### RF-5 — Vista del muro (frontend)

- Ruta `/` (raíz del webapp) muestra el muro como grilla responsive de tarjetas.
- Cada tarjeta muestra: nombre del receptor destacado, categoría con color/etiqueta,
  mensaje, nombre del giver y fecha relativa (ej. "hace 3 h") + tooltip con fecha
  absoluta.
- Estado vacío: mensaje "Todavía no hay kudos, ¡empezá vos!" con CTA al formulario.
- Botón "Refrescar" recarga la primera página.
- **Sin scroll infinito en v1**: solo botón "Cargar más" al final de la lista mientras
  haya `next_cursor`.

### RF-6 — Formulario de alta (frontend)

- Ruta `/nuevo` (o modal desde el muro; queda a criterio del architect) con campos:
  giver (select), receiver (select), categoría (select), mensaje (textarea con
  contador de caracteres).
- Deshabilita el submit si falta cualquier campo, si `giver === receiver` o si el
  mensaje excede 280 caracteres.
- Al éxito: vuelve al muro y muestra el kudo recién creado como primera tarjeta.
- Al error de API: banner con el mensaje del backend.

## Requisitos No-Funcionales (RNF)

- **RNF-1 — Performance.** p95 < 300 ms para `GET /v1/kudos` y `POST /v1/kudos` medidos
  en local con base cargada con 500 kudos seed.
- **RNF-2 — Persistencia.** Postgres del `docker-compose` del monorepo. Migraciones
  versionadas en el subproyecto `apps/api` (mecanismo lo elige el architect entre las
  opciones estándar del stack — TypeORM migrations, Prisma migrate, etc.).
- **RNF-3 — Tipado end-to-end.** `libs/shared-types` publica los DTOs (`MemberDto`,
  `CategoryDto`, `KudoDto`, `CreateKudoRequest`, `KudoListResponse`). API y webapp
  los consumen; sin tipos duplicados.
- **RNF-4 — Robustez de entrada.** Validación con `class-validator` en la API. Rate
  limit global en `POST /v1/kudos` (60 req/min por IP) usando el módulo estándar de
  NestJS. Sanitización explícita del mensaje (trim + reject de caracteres de control).
- **RNF-5 — Errores predecibles.** Respuestas de error uniformes: `{ error: { code,
  message, details? } }` con códigos `VALIDATION_ERROR`, `MEMBER_NOT_FOUND`,
  `SELF_KUDO_FORBIDDEN`, `INVALID_CATEGORY`, `MESSAGE_TOO_LONG`, `RATE_LIMITED`.
- **RNF-6 — Observabilidad mínima.** Logs estructurados (JSON) en la API con
  `request_id` correlacionado; health check en `GET /healthz`.
- **RNF-7 — Testing.**
  - Backend: tests unitarios de servicios de validación y un e2e (supertest) que cubre
    POST + GET happy path + tres errores clave (self-kudo, member inexistente, mensaje
    fuera de rango).
  - Frontend: al menos un test de render del muro con datos mockeados y un test del
    formulario que verifica la deshabilitación del submit.
- **RNF-8 — Accesibilidad básica.** Labels asociados a inputs, contraste AA en las
  tarjetas, foco visible, navegación por teclado del formulario.
- **RNF-9 — Estilo del código.** Sin comentarios narrativos (regla del repo). Nombres
  autoexplicativos, funciones cortas.

## Modelo de datos (referencia — el architect confirma en cycle-01)

- `members(id uuid pk, full_name text, handle text unique, created_at timestamptz)`
  — seedeada.
- `kudos(id uuid pk, giver_id uuid fk→members, receiver_id uuid fk→members, category text check-in-enum, message text ≤280, created_at timestamptz default now())`
  — índice compuesto `(created_at desc, id desc)` para el cursor.
- Categorías como `text` con constraint check, no tabla, porque son fijas (S-2).

## Contratos de API (referencia — el architect los formaliza en `sdd/api.json`)

- `GET /v1/members` → `MemberDto[]`
- `GET /v1/categories` → `CategoryDto[]`
- `POST /v1/kudos` (body `CreateKudoRequest`) → `KudoDto` (201) | error (400/422/429)
- `GET /v1/kudos?limit=&cursor=` → `KudoListResponse { items: KudoDto[], next_cursor: string|null }`
- `GET /healthz` → `{ status: "ok" }`

## Dependencias

- **Subproyecto principal:** `apps/api` (NestJS).
- **Subproyectos secundarios:** `apps/webapp` (React), `libs/shared-types`.
- **Servicios externos:** ninguno.
- **Infraestructura local:** Postgres levantado vía `docker-compose` del monorepo
  (configurado en la instalación del kit; si el servicio no existe todavía, se agrega
  como parte de este ciclo con `harness add service`).
- **Módulos SDD previos requeridos:** ninguno — es el ciclo inicial del proyecto.

## Criterios de Aceptación

Cada CA es verificable con evidencia concreta (test, curl, captura o comando).

- **CA-001 (Happy path e2e).** Un usuario abre el webapp en `/`, ve el muro vacío,
  entra a `/nuevo`, elige giver y receiver distintos, categoría y mensaje válido,
  envía, vuelve al muro y ve la tarjeta como primera del feed. Evidencia: test e2e
  automatizado o video/screenshot del flujo.
- **CA-002 (RF-3 — anti self-kudo).** `POST /v1/kudos` con `giver_id === receiver_id`
  devuelve `422` con `code: "SELF_KUDO_FORBIDDEN"`.
- **CA-003 (RF-3 — miembro inexistente).** `POST /v1/kudos` con `receiver_id` que no
  existe devuelve `422` con `code: "MEMBER_NOT_FOUND"` y `details.field: "receiver_id"`.
- **CA-004 (RF-3 — categoría inválida).** `POST /v1/kudos` con `category: "foo"`
  devuelve `422` con `code: "INVALID_CATEGORY"` y `details.allowed` con las categorías
  permitidas.
- **CA-005 (RF-3 — mensaje fuera de rango).** Mensaje vacío o >280 chars devuelve
  `422` con `code: "MESSAGE_TOO_LONG"` (o `VALIDATION_ERROR` con `details.field:
"message"` si es vacío).
- **CA-006 (RF-4 — orden y paginación).** Seed de 55 kudos con timestamps espaciados.
  `GET /v1/kudos?limit=20` devuelve exactamente 20 items ordenados por `created_at`
  desc y un `next_cursor` no nulo. Siguiendo el cursor 2 veces más se llega a
  `next_cursor: null` sin duplicados ni faltantes.
- **CA-007 (RF-4 — límites).** `GET /v1/kudos?limit=100` acota a 50 (no error).
- **CA-008 (RF-5 — estado vacío).** Base vacía → el muro muestra el mensaje de estado
  vacío y NO renderiza tarjetas.
- **CA-009 (RF-6 — validación cliente).** Con giver y receiver iguales, el botón de
  submit del formulario queda deshabilitado y aparece un mensaje inline "no podés
  darte un kudo a vos mismo".
- **CA-010 (RNF-1 — performance).** Con 500 kudos seed, `ab -n 200 -c 10 GET /v1/kudos`
  reporta p95 < 300 ms en local.
- **CA-011 (RNF-3 — tipado E2E).** Al eliminar temporalmente un campo de `KudoDto` en
  `libs/shared-types`, el build de `apps/api` y el de `apps/webapp` fallan ambos
  (evidencia: log de `pnpm build` de los dos).
- **CA-012 (RNF-4 — rate limit).** 61 requests seguidas al `POST /v1/kudos` desde la
  misma IP: la última devuelve `429` con `code: "RATE_LIMITED"`.
- **CA-013 (RNF-6 — health).** `GET /healthz` responde `200 { status: "ok" }`.
- **CA-014 (RNF-7 — tests).** `pnpm nx test api` y `pnpm nx test webapp` pasan en
  verde; `pnpm nx e2e api` cubre los 4 casos de CA-002 a CA-005 más el happy path.
- **CA-015 (SDD gate).** `pnpm sdd:validate` queda en verde al cierre del ciclo, con
  `apps/api` y `apps/webapp` con sus `updates/` correspondientes y `cycle.json` en
  `completed`.

## Casos borde (documentados; deben quedar cubiertos)

- Mensaje con solo espacios en blanco → `trim` a vacío → `VALIDATION_ERROR`.
- Mensaje con emojis multibyte que llevan el string exacto a 280 code units en JS pero
  a más en otras cuentas de longitud → contar por code points (`[...msg].length`),
  documentado en el architect.
- Cursor recibido corrupto o de otra base → devolver `400` con `code:
"INVALID_CURSOR"`, sin filtrar contenido de la base.
- Colisión de `created_at` (dos kudos en el mismo ms): el orden desempata por `id`
  desc (por eso el índice compuesto de RNF-2).
- Miembro dado de baja lógica en el futuro (fuera de v1): el schema deja
  `members.is_active` reservado; la lista solo devuelve activos. En v1 todos activos.

## Ciclos previstos

- **cycle-01 — Núcleo end-to-end (esta spec).** API + shared-types + muro y formulario
  del webapp + docker-compose de Postgres + seed. Cubre RF-1 a RF-6 y todos los RNF.
  Al cierre, el CA-001 (happy path) tiene que estar verde.

Si en la implementación aparecen recortes de alcance necesarios, se registran como
notas de cierre y se planifica un cycle-02.

## Fuera de alcance (v1)

- Auth / login / SSO.
- Roles (admin, moderador).
- Edición o borrado de kudos.
- Reacciones o comentarios sobre kudos existentes.
- Notificaciones (mail, Slack).
- Multi-equipo / multi-tenant.
- Real-time / websockets.
- Métricas agregadas (ranking de más kudeados, categorías más usadas).
- i18n (solo español rioplatense).

## Checkpoint humano

⛔ **NO implementar todavía.** Esta spec queda en estado `draft` esperando aprobación
explícita del equipo. Al aprobar:

1. El módulo `kudos-wall` ya está registrado en `pending_modules` de
   `sdd/global.json` (con `depends_on: []`).
2. El `sdd-orchestrator` arranca cycle-01 con esta spec como input y sigue el flujo
   normal (functional → planner + architect en paralelo → implementadores → reviewer).
