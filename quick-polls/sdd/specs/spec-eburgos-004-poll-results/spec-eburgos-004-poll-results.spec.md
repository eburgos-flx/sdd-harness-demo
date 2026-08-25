# SPEC-eburgos-004: Vista de resultados con gráfico de barras

## Resumen Ejecutivo

Página pública `/p/:id/results` que muestra las opciones y sus votos como bar chart, incluyendo total, porcentajes y estado (open/closed). Si `open`, la página hace polling cada 3s.

## Contexto de Negocio

Es la vista final que se comparte una vez que la encuesta terminó (o se está siguiendo en vivo). Debe ser instantáneamente comprensible.

## Requisitos Funcionales (RF)

- RF-1: Página server-rendered inicial con datos de `GET /api/polls/:id`.
- RF-2: Bar chart con `recharts` (BarChart + tooltip) mostrando conteo por opción.
- RF-3: Encima del chart: total de votos, timestamp de creación, chip de estado (Open/Closed).
- RF-4: Si `status === "open"`: componente client-side hace `fetch` a `/api/polls/:id` cada 3s y actualiza el chart.
- RF-5: Cada barra muestra el % (relativo al total) y el absoluto.

## Requisitos No-Funcionales (RNF)

- RNF-1: SSR-safe: `recharts` se importa via `dynamic(..., { ssr: false })` para evitar hydration mismatch.
- RNF-2: `/api/polls/:id` responde en < 50ms desde el JSON local.

## Dependencias

- Subproyecto principal: `apps/quick-polls`
- Depende de: spec-eburgos-001 (endpoint GET), spec-eburgos-002 (voto acumulado), spec-eburgos-003 (estado closed).

## Criterios de Aceptación

- CA-001: `/p/:id/results` renderiza chart con datos actuales al primer paint.
- CA-002: Si `open`, polling actualiza sin recargar la página.
- CA-003: Si `closed`, no hay polling y aparece el chip "Closed".
- CA-004: Porcentaje calculado bien (redondeo entero, 0% cuando total=0 en vez de NaN).
