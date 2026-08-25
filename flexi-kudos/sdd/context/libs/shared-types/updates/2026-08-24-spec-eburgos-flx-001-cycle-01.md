# spec-eburgos-flx-001-kudos-wall cycle-01 — 2026-08-24

## Estado

`libs/shared-types` pasa de barrel vacío a lib de tipos que sirve como contrato único
entre `apps/api` y `apps/webapp`. 4 tests verdes que fijan el contrato de `CategoryKey` y
`ErrorCode`.

## Estructura

- `libs/shared-types/src/`
  - `index.ts` — barrel export de todos los módulos
  - `lib/category.dto.ts` — `type CategoryKey` (union de 6 literales),
    `const CATEGORY_KEYS: readonly CategoryKey[]`, `interface CategoryDto { key, label }`
  - `lib/member.dto.ts` — `interface MemberDto { id, full_name, handle }`
  - `lib/kudo.dto.ts` — `interface KudoDto`, `interface CreateKudoRequest`,
    `interface KudoListResponse { items, next_cursor }`
  - `lib/error.dto.ts` — `type ErrorCode` (union de 8 literales, incluye `INTERNAL_ERROR`),
    `interface ErrorDetails`, `interface ErrorEnvelope { error: { code, message, details? } }`
  - `lib/category.dto.spec.ts` + `lib/error.dto.spec.ts` — tests de contrato
- `libs/shared-types/jest.config.js` — jest con `ts-jest`; tsconfig.spec.json apunta al
  jest.config CJS (evita el "ts-node required" que aparece con jest.config.ts)
- `libs/shared-types/project.json` — target `test` con `@nx/jest:jest` (además del `lint`
  existente)

## Dependencias

- Ninguna nueva en la lib (es puros tipos)
- Consumidores: `apps/api` (via `moduleNameMapper` en jest y `paths` en tsconfig.base) y
  `apps/webapp` (via `resolve.alias` en vite.config + `paths`)

## Qué sigue

- Si aparecen nuevos endpoints, los DTO viven acá — nunca duplicar tipos en api/webapp
- Considerar un test que garantice que `CATEGORY_KEYS` y `CategoryDto[key]` no divergen
  (hoy el compilador ya lo asegura, pero un test explícito no está de más)
