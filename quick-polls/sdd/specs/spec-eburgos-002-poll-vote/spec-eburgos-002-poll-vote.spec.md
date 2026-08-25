# SPEC-eburgos-002: Votar una vez por navegador

## Resumen Ejecutivo

Endpoint + página pública de votación. Un navegador puede votar exactamente una vez por encuesta; el bloqueo se aplica del lado del servidor mediante cookie httpOnly.

## Contexto de Negocio

Sin login, la única señal de identidad es el navegador. Cookie httpOnly per-poll es suficiente para el caso de "encuesta rápida" (no pretende ser antifraude industrial).

## Requisitos Funcionales (RF)

- RF-1: `POST /api/polls/:id/vote` con body `{ optionIndex: number }`.
- RF-2: Página `/p/:id` renderiza server-side la encuesta y un formulario con las opciones (radio).
- RF-3: Si la cookie `voted_[id]=1` existe → 409 y la página muestra "Ya votaste" con link a `/p/:id/results`.
- RF-4: Si `status === "closed"` → 410 y la página muestra "Encuesta cerrada".
- RF-5: Al votar OK, setea `voted_[id]=1` (httpOnly, sameSite=lax, maxAge=1y) y redirige a `/p/:id/results`.

## Requisitos No-Funcionales (RNF)

- RNF-1: Escritura de voto atómica: read-modify-write bajo el mismo lock del store.
- RNF-2: `optionIndex` validado con Zod (entero >=0, < options.length).

## Dependencias

- Subproyecto principal: `apps/quick-polls`
- Depende de: spec-eburgos-001 (store, endpoint GET, tipo Poll).

## Criterios de Aceptación

- CA-001: Primer voto válido → 204 y cookie seteada.
- CA-002: Segundo voto desde el mismo navegador → 409.
- CA-003: Voto a encuesta cerrada → 410.
- CA-004: `optionIndex` inválido → 400.
- CA-005: El conteo se refleja en `GET /api/polls/:id` después del voto.
