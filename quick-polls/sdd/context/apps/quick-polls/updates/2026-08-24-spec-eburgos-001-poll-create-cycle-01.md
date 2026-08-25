# spec-eburgos-001-poll-create cycle-01 — 2026-08-24

## Estado
- Módulo `poll-create` completo: crea encuestas con 2..5 opciones, persistidas en `data/polls.json`.

## Estructura
- `lib/store.ts` — single-source atomic JSON store (rename temp file + serialized write chain).
- `lib/schemas.ts` — Zod schemas: `createPollSchema`, `voteSchema`, `closeSchema`.
- `app/api/polls/route.ts` — POST create.
- `app/api/polls/[id]/route.ts` — GET public poll (strips `adminToken`).
- `app/page.tsx` + `app/create-poll-form.tsx` — home form.

## Dependencias
- Runtime: `zod`, `nanoid`.
- Path alias `@/*` en `tsconfig.json`.
- `data/` ignorado por git.

## Qué sigue
- spec-002 (voto): reusar `updatePoll` para mutar `votes[]` atómicamente + set cookie httpOnly.
- spec-003 (close): reusar `updatePoll` + verificar `adminToken` con `timingSafeEqual`. Renderizar `/p/:id/manage?t=`.
- spec-004 (results): página `/p/:id/results` con `recharts` (dynamic import ssr:false) + polling 3s si `status=open`.
