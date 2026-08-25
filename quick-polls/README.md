# quick-polls

App standalone en Next.js 15 de encuestas rápidas: crear una encuesta con 2–5 opciones, votar una vez por navegador, cerrarla y ver los resultados con un gráfico de barras. Persistencia en archivo JSON (`data/`), sin base de datos.

Generada de punta a punta con [`@e-burgos/sdd-harness`](https://www.npmjs.com/package/@e-burgos/sdd-harness) (v0.10.3) y el loop agéntico `sdd-hermes` — ver [Cómo se generó esta app](#cómo-se-generó-esta-app). Nadie escribió una línea de código a mano.

## Requisitos

- Node.js 20+
- pnpm (único package manager permitido en este repo)

## Levantar la app

```bash
pnpm install
pnpm dev
```

Abrir http://localhost:3000.

## Visor de docs SDD

```bash
pnpm sdd:docs
```

Abrir http://localhost:4310 (se cambia con `--port` o `SDD_DOCS_PORT`). Renderiza specs, ciclos, tasks, fixes y la vista **Costos** (cuánto salió el loop entero) a partir de `sdd/`.

Otros scripts SDD:

```bash
pnpm sdd:validate              # valida todos los registros SDD contra sdd/schemas/
pnpm sdd:rebuild-tasks-index   # regenera sdd/tasks.json desde los tasks.json por ciclo
```

## Cómo se generó esta app

Orden clave: **`init` primero, `idea` después**. En una carpeta vacía `idea` solo deja archivos sueltos y Claude Code no ve la skill `sdd-hermes`; con el workspace ya montado, `idea` entra en modo `sdd-workspace` y registra el protocolo contra el stack instalado. El CLI nunca se instala localmente (`npx` solamente).

**1. Config escrita a mano** (parado en la carpeta padre — el `init` crea `quick-polls/`, no la crees vos):

```bash
cat > quick-polls.config.json <<'JSON'
{
  "mode": "standalone",
  "project": {
    "name": "quick-polls",
    "description": "Encuestas rapidas: crear, votar una vez por navegador, cerrar y ver resultados",
    "packageScope": "@quick-polls"
  },
  "apps": [{ "name": "quick-polls", "type": "nextjs" }],
  "libs": [],
  "services": []
}
JSON
```

**2. Generar el workspace:**

```bash
npx -y @e-burgos/sdd-harness@0.10.3 init --config ./quick-polls.config.json
```

Deja `quick-polls/` con la app Next.js, `sdd/`, los tres arneses (Claude / Gemini / Copilot) y `git init` + commit inicial.

**3. Registrar la idea, ya adentro del workspace:**

```bash
cd quick-polls
npx -y @e-burgos/sdd-harness@0.10.3 idea "encuestas rapidas: crear una encuesta con 2 a 5 opciones, votar una vez por navegador, cerrar la encuesta y ver los resultados con un grafico"
```

**4. El único prompt** — abrir Claude Code (`claude`) en este directorio y pegar:

```text
/sdd-hermes

La idea ya está registrada en harness.idea.md, en la raíz de este workspace. El stack ya está
montado con harness init (standalone, una sola app Next.js, sin Docker): las FASES 2 y 3 ya
están resueltas. Arrancá en descubrimiento y seguí derecho a sembrar el backlog.

Quiero el loop punta a punta en modo full-auto: aprobame las specs en bloque en un único
checkpoint y seguí sin volver a preguntar, salvo que aparezca una decisión de producto que la
spec no cubra.

Restricciones:
- No agregues apps ni servicios: una sola app Next.js. La persistencia va a un archivo JSON
  en disco.
- Backlog: crear encuesta con 2 a 5 opciones · votar una vez por navegador · cerrar la
  encuesta · vista de resultados con gráfico de barras.
- Para la UI usá la skill /design-taste-frontend.
- Declará el tier de modelo y esfuerzo de cada fase ANTES de ejecutarla, en voz alta.
- Al cerrar cada ciclo, dejá el commit hecho y seguí con el módulo siguiente.

Si te frenás por cualquier motivo, reportá en qué punto del backlog quedaste.
```

Si el loop se corta a mitad de camino, se retoma con `/hermes-resume.prompt` — no se relanza desde cero.

**5. Lo que hizo hermes** — descubrimiento sobre `harness.idea.md`, sembró una spec por módulo (aprobadas en bloque en un único checkpoint humano) y corrió un ciclo SDD por spec con la cadena orquestador → funcional → planner ∥ arquitecto → implementadores → reviewer, bajo el SPEC GATE de [CLAUDE.md](CLAUDE.md):

| Spec | Módulo | Qué entregó |
| --- | --- | --- |
| `spec-eburgos-001-poll-create` | poll-create | `POST /api/polls`, `GET /api/polls/:id`, store JSON con lock por rename atómico, form de creación |
| `spec-eburgos-002-poll-vote` | poll-vote | `POST /api/polls/:id/vote` con idempotencia por cookie httpOnly, página SSR `/p/:id` |
| `spec-eburgos-003-poll-close` | poll-close | `POST /api/polls/:id/close` con token verificado por `timingSafeEqual`, página `/p/:id/manage` |
| `spec-eburgos-004-poll-results` | poll-results | `/p/:id/results` con BarChart de recharts + polling de 3s mientras está abierta |

**6. Verificación del resultado:**

```bash
git log --oneline           # el commit inicial del init + uno por ciclo cerrado
cat sdd/global.json         # módulos completed
pnpm sdd:validate           # en verde
pnpm dev                    # crear encuesta, votar, cerrarla, ver el gráfico
pnpm sdd:docs               # vista Costos: cuánto salió el loop entero
```

La trazabilidad completa (briefs, docs funcional/planner/arquitecto, tasks y métricas de consumo) vive en [sdd/specs/](sdd/specs/) y se navega con `pnpm sdd:docs`.
