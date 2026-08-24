# CLAUDE.md — sdd-harness-demo

> **Fuente única de reglas: [AGENTS.md](AGENTS.md).** Leerlo antes de tocar cualquier cosa:
> ahí están qué es este repo, las reglas duras de los proyectos de demo, el esquema de
> branches y el protocolo de memoria.

Notas específicas para Claude Code:

- **Este repo no corre el ciclo SDD** (no hay `sdd/` en la raíz): es el material de demo del
  CLI que lo instala. No apliques SPEC GATE ni busques specs acá. Dentro de un proyecto que
  ya adoptó el kit, sí: ahí manda el `AGENTS.md` de esa carpeta.
- **Al empezar, leé [memory/MEMORY.md](memory/MEMORY.md)** y abrí las entradas que apliquen.
  Al cerrar una tarea con un aprendizaje no obvio, escribí o actualizá la entrada — el
  formato está en `AGENTS.md`.
- **`demo/` es material propio y está gitignoreado.** Se puede leer para entender el guion,
  pero no se commitea, no se copia a archivos versionados ni se manda a servicios externos.
  El banco de pruebas son los proyectos (`legacy-shop/` y los que genere la CLI), no `demo/`.
- **Verificación antes de cerrar:** levantar el proyecto y mirarlo andando
  (`cd legacy-shop && pnpm dev`). No hay test suite, y en `legacy-shop` la ausencia de tests
  es parte del decorado. Para UI, ver `memory/verificacion-visual-chrome-headless.md`
  (el bridge de Playwright MCP no levanta en esta máquina).
- **Todos los proyectos usan pnpm** (regla dura 5 de `AGENTS.md`). `npx` queda solo para
  invocar la CLI del kit.
- **Antes de encarar cualquier tarea:** aplicar la sección **⚙️ Selección de modelo y
  esfuerzo** de `AGENTS.md` — decidir tier propio y de cada subagente/workflow antes de
  ejecutar.
