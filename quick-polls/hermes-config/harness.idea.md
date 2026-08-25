# Idea — entrada del punta-a-punta hermes

> Registrada: 2026-08-24 | Estado: pendiente de descubrimiento (FASE 1 de sdd-hermes)

## La idea (verbatim)

encuestas rapidas: crear una encuesta con 2 a 5 opciones, votar una vez por navegador, cerrar la encuesta y ver los resultados con un grafico

## Protocolo (repo vacío → producto)

> Entregale este archivo a tu agente AI. El protocolo completo es la skill
> **sdd-hermes** (`sdd/skills/sdd-hermes/SKILL.md` una vez instalado el kit).

1. **Descubrimiento** — extraer de la idea: dominio y usuarios, 3–7 módulos core con
   nombre propio, y necesidades técnicas (persistencia, tiempo real, colas, archivos,
   auth, UI, API pública). UNA ronda de preguntas máximo, solo si algo bloquea el stack.
2. **Stack** — completar `harness.config.json` (validable con
   `harness.config.schema.json`): una sola app → `"mode": "standalone"`; front + back o
   multi-servicio → `"mode": "nx"`. Ante la duda, la pieza más simple. **Checkpoint
   humano: el stack se aprueba antes de generar.**
3. **Generar** — `npx @e-burgos/sdd-harness init --config ./harness.config.json`
   (cero prompts). Verificar `pnpm sdd:validate` en verde dentro del workspace.
4. **Continuar dentro del workspace** — invocar la skill `sdd-hermes` desde su FASE 4:
   una spec por módulo (`harness add spec`) con checkpoint humano, y el loop de ciclos
   SDD hasta agotar el backlog.
