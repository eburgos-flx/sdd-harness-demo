# SPEC-eburgos-001: Crear encuesta con 2-5 opciones

## Resumen Ejecutivo

Endpoint + formulario para crear una encuesta pública anónima con una pregunta y entre 2 y 5 opciones. Al crearla se emite un `id` público y un `adminToken` opaco que permite gestionar/cerrar la encuesta desde una URL secreta.

## Contexto de Negocio

Encuestas rápidas sin cuentas de usuario. Cualquier persona crea y comparte. La UX prioriza fricción cero: sin login, sin email.

## Requisitos Funcionales (RF)

- RF-1: `POST /api/polls` acepta `{ question: string, options: string[] }`.
- RF-2: Formulario en `/` para armar la encuesta (pregunta + inputs dinámicos 2..5).
- RF-3: Respuesta `{ id, adminToken, publicUrl, adminUrl }` — ambos URLs relativos.
- RF-4: Persistencia en `data/polls.json` con lock por rename atómico.

## Requisitos No-Funcionales (RNF)

- RNF-1: `id` legible (`nanoid(8)`), `adminToken` opaco (32 chars).
- RNF-2: Validación con Zod; rechaza <2 o >5 opciones, opciones vacías o duplicadas, pregunta vacía o > 200 chars.
- RNF-3: El archivo `data/polls.json` no se versiona (`.gitignore`).

## Dependencias

- Subproyecto principal: `apps/quick-polls`
- Ninguna spec previa (es el módulo base — trae también `lib/store.ts`).

## Criterios de Aceptación

- CA-001: `POST /api/polls` con payload válido devuelve 201 y persiste en disco.
- CA-002: Payload inválido devuelve 400 con detalle Zod.
- CA-003: Después de crear, `GET /api/polls/:id` devuelve la encuesta con `status: "open"` y `votes` array de ceros.
- CA-004: El formulario en `/` permite agregar/quitar opciones entre 2 y 5, y al submit redirige a `/p/[id]/manage?t=[adminToken]`.
