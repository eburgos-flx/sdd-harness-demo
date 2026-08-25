# SPEC-eburgos-003: Cerrar la encuesta

## Resumen Ejecutivo

Endpoint idempotente para cerrar una encuesta, más botón en la vista de admin. El acceso se gatea con el `adminToken` devuelto al crear.

## Contexto de Negocio

El creador tiene el link secreto `/p/:id/manage?t=[adminToken]`. Desde ahí puede cerrar la encuesta y ver el link público para compartir. Cerrada = no acepta más votos.

## Requisitos Funcionales (RF)

- RF-1: `POST /api/polls/:id/close` con body `{ adminToken: string }`.
- RF-2: Idempotente: cerrar una encuesta ya cerrada → 200 (no error).
- RF-3: `adminToken` inválido → 403.
- RF-4: Página `/p/:id/manage?t=[token]` muestra la encuesta, el link público y el botón "Cerrar encuesta".
- RF-5: Sin `?t=` o token inválido en la página → 404 (no leakear existencia).

## Requisitos No-Funcionales (RNF)

- RNF-1: Comparación de token con `crypto.timingSafeEqual` para evitar timing attacks.

## Dependencias

- Subproyecto principal: `apps/quick-polls`
- Depende de: spec-eburgos-001 (store, adminToken en el modelo).

## Criterios de Aceptación

- CA-001: Close con token válido → 200 y encuesta pasa a `status: "closed"`.
- CA-002: Close con token inválido → 403.
- CA-003: Close a encuesta cerrada → 200 (idempotente).
- CA-004: Después de cerrar, `POST /api/polls/:id/vote` devuelve 410.
