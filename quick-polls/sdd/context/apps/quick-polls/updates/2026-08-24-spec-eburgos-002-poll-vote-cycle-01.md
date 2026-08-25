# spec-eburgos-002-poll-vote cycle-01 — 2026-08-24

## Estado
- Módulo `poll-vote` completo: 1 voto por navegador vía cookie httpOnly `voted_[id]`.

## Estructura
- `app/api/polls/[id]/vote/route.ts` — POST, chequea cookie antes de parsear, muta con `updatePoll`.
- `app/p/[id]/page.tsx` — SSR: consulta cookie con `next/headers` para decidir formulario / mensaje / redirect.
- `app/p/[id]/vote-form.tsx` — client, POST + push `/p/:id/results`.

## Dependencias
- Reusa `updatePoll` de spec-001 (serializa mutaciones).

## Qué sigue
- spec-003: verificación de `adminToken` con `timingSafeEqual` + página manage.
- spec-004: results page consumirá poll + votes ya expuestos por `GET /api/polls/:id`.
