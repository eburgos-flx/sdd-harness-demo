# spec-eburgos-004-poll-results cycle-01 — 2026-08-24

## Estado
- Módulo `poll-results` completo: `/p/:id/results` con bar chart + polling 3s.

## Estructura
- `app/p/[id]/results/page.tsx` — SSR page: hidrata `ResultsView` con datos iniciales.
- `app/p/[id]/results/results-view.tsx` — client, `setInterval` que consulta `/api/polls/:id` mientras `status=open`.
- `app/p/[id]/results/bar-chart.tsx` — `dynamic(..., { ssr: false })`, recharts `BarChart` + tooltip.

## Dependencias
- Nueva runtime: `recharts`.
- Reusa `GET /api/polls/:id` de spec-001.

## Qué sigue
- Backlog original agotado. Próximos ciclos según nueva idea o mejoras UX (sharing, themes, poll expiry).
