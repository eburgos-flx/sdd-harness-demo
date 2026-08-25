# Memoria del repo

Índice de aprendizajes de este repo: una línea por entrada. Leelo al empezar y abrí lo que
aplique. El protocolo y el formato de las entradas están en [AGENTS.md](../AGENTS.md).

- [Carpetas aisladas de la demo](carpetas-aisladas-de-la-demo.md) — los tres proyectos viven fuera de este repo, cada uno con su git.
- [Cómo se comportan init e idea](comportamiento-de-harness-init-e-idea.md) — init aborta si la carpeta existe; sin init no hay skill sdd-hermes.
- [Las imperfecciones de legacy-shop son guionadas](legacy-shop-imperfecciones-guionadas.md) — qué NO refactorizar y por qué.
- [Imágenes del catálogo](imagenes-del-catalogo.md) — ids de picsum elegidos a mano y el fallback offline.
- [Verificación visual con Chrome headless](verificacion-visual-chrome-headless.md) — el bridge de Playwright MCP no levanta acá.
- [La CLI deja plantillas vacías](la-cli-deja-plantillas-vacias.md) — `add spec` y `configure sdd` generan placeholders, no contenido.
- [Quién escribe las specs](quien-escribe-las-specs.md) — el steward no; es `sdd-hermes` en FASE 4.
- [Invocación del CLI del kit](invocacion-de-la-cli.md) — por qué no se instala en el root y qué toca `configure sdd`.
- [pnpm en todos los proyectos](pnpm-en-todos-los-proyectos.md) — la migración y el `onlyBuiltDependencies` de esbuild.
