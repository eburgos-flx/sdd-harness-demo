# spec-eburgos-flx-001-kudos-wall cycle-01 — 2026-08-24

## Estado

`apps/webapp` pasa de starter React vacío a SPA funcional con muro de kudos y formulario
de alta. Consume la API de `apps/api` vía `fetch` + tipos importados de
`@shared-types`. 12 tests verdes (vitest + RTL). Build de producción emite 239 KB min
(76 KB gzip). Verificado en Chrome headless: layout, empty state y CTAs renderizan
correctamente.

## Estructura

- `apps/webapp/src/`
  - `main.tsx` — entrypoint React 19 con StrictMode
  - `app/app.tsx` — `BrowserRouter` + `MembersCategoriesProvider` global + rutas `/` y
    `/nuevo` (con `Navigate to="/"` como catch-all)
  - `api/kudos-client.ts` — cliente tipado (`listMembers`, `listCategories`, `listKudos`,
    `createKudo`); base URL desde `import.meta.env.VITE_API_URL` con default
    `http://localhost:3000`
  - `api/errors.ts` — `KudosApiError` con `code`, `status`, `details`, y helper
    `isErrorEnvelope` para el parsing type-safe del backend
  - `context/MembersCategoriesProvider.tsx` — carga miembros y categorías al montar el
    provider una sola vez; expone `reload()` para futuros ciclos
  - `pages/KudosWallPage.tsx` — ruta `/`, grid responsive (`auto-fill minmax(280px, 1fr)`),
    Refrescar + "Dar un kudo" en el header, "Cargar más" al pie cuando `next_cursor`
  - `pages/NewKudoPage.tsx` — ruta `/nuevo`, consume el provider, submit vía
    `kudosApi.createKudo`, banner de error con el `message` del envelope, navigate a `/`
    en success
  - `components/KudoForm.tsx` — form controlado; conteo de code points con `[...msg].length`;
    submit deshabilitado si (a) falta un campo, (b) giver === receiver (con inline error),
    (c) mensaje fuera de 1..280 code points después de trim
  - `components/KudoCard.tsx` — tarjeta con receptor destacado, mensaje escapado (React lo
    hace por default), giver + fecha relativa con tooltip absoluto
  - `components/CategoryChip.tsx` — chip coloreado por `key` (mapa hardcodeado de 6 pares
    bg/fg — cambiar solo si se agregan categorías al backend)
  - `components/EmptyState.tsx` — CTA a `/nuevo` cuando el feed está vacío
  - `utils/date.ts` — `formatRelativeAr` (Intl.RelativeTimeFormat es-AR, numeric: auto —
    devuelve "anteayer" para -2 días, etc.) + `formatAbsoluteAr` (Intl.DateTimeFormat en
    zona `America/Argentina/Buenos_Aires`)
  - `test-setup.ts` — `@testing-library/jest-dom/vitest`
- `apps/webapp/vite.config.ts` — plugins `tailwindcss()` y `react()` (Tailwind está
  instalado pero no usado en v1 — solo Vite lo procesa vacío); alias `@shared-types` →
  `libs/shared-types/src/index.ts`; bloque `test` con `environment: 'jsdom'`

## Dependencias

- Runtime existentes: `react` 19, `react-dom` 19, `react-router-dom` 7 (ya en el root)
- Dev nuevas: `@testing-library/react` ^16.3, `@testing-library/user-event` ^14.6,
  `@testing-library/jest-dom` ^7, `jsdom` ^30, `happy-dom` ^20 (instalado pero se usa
  jsdom por defecto)
- Sin dependencias runtime nuevas — se aprovecha lo ya instalado en el root

## Qué sigue

- Skeleton loaders durante fetches (hoy hay "Cargando…" plano)
- Optimistic update: agregar el kudo al feed sin refetch después del POST
- Tailwind real: hoy los estilos están inline; migrar a `tailwind` o CSS Modules
- Accessibility audit — el label del CategoryChip no está asociado a nada por a11y-tree
- Scroll infinito real (RN-04 pide "Cargar más" explícito en v1, pero el ciclo-02 podría
  agregar IntersectionObserver como upgrade)
