# FIX-eburgos-001 — Visual redesign with Tailwind + Framer Motion

- **Type:** `[IMPROVEMENT]`
- **Severity:** medium
- **Created:** 2026-08-24
- **Scope:** repo-level (touches all 4 pages of the app)
- **Related modules:** poll-create, poll-vote, poll-close, poll-results

## Justification

The 4 pages were shipped with inline styles + `system-ui` as a functional baseline. Product is complete but the surface reads like a scaffolded prototype. Elevating the UI is a cross-cutting concern that would fragment 4 separate cycles unnecessarily — a single `[IMPROVEMENT]` fix keeps the change atomic and traceable.

## What changes

- Adds `tailwindcss@4` + `@tailwindcss/postcss` + `framer-motion` + `@phosphor-icons/react` + `geist` font (via `next/font`).
- Rewrites the styling of every page using the design-taste-frontend baseline: `DESIGN_VARIANCE=8`, `MOTION_INTENSITY=6`, `VISUAL_DENSITY=4`.
- Palette: `#f9fafb` background · `zinc-950` off-black · single accent (Electric Blue `#2563eb` desaturated). No lila, no neon glows.
- Typography: Geist sans + Geist mono, `tracking-tighter` for headers, `text-base leading-relaxed` for body.
- Motion: spring physics on interactive elements, staggered reveal for option lists, tactile `-translate-y-[1px]` on `:active`.
- Materiality: `rounded-[2.5rem]` cards with 1px `zinc-200/50` border + diffusion shadow. No emojis anywhere.

## What does NOT change

- No API contracts, no store shape, no persistence, no schemas, no route paths.
- All CAs of the 4 existing specs remain green.

## Test reference

- `pnpm build` compiling all routes.
- Re-run of the E2E smoke sequence from spec-004 verify.

## Follow-ups

- Optional: extract a token file (colors, spacing, radii) if a second surface (email, embed, share card) is added later.
