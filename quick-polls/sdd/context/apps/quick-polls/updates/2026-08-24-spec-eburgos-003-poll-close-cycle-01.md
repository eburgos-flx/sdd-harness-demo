# spec-eburgos-003-poll-close cycle-01 — 2026-08-24

## Estado
- Módulo `poll-close` completo: cierre idempotente vía adminToken.

## Estructura
- `app/api/polls/[id]/close/route.ts` — POST, valida token con `timingSafeEqual`.
- `app/p/[id]/manage/page.tsx` — página gated por `?t=`. Sin token / inválido → `notFound()`.
- `app/p/[id]/manage/close-button.tsx` — client, `confirm()` + POST + `router.refresh()`.

## Dependencias
- Reusa `getPoll` y `updatePoll` de spec-001.

## Qué sigue
- spec-004: results page consumirá `GET /api/polls/:id` y renderizará barras con recharts.
