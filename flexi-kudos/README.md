# flexi-kudos

Muro de reconocimientos de equipo. Cualquiera le da un kudo a un compañero eligiendo una
categoría y escribiendo un mensaje; todo el equipo ve el muro de tarjetas.

Monorepo Nx generado con [`@e-burgos/sdd-harness`](https://www.npmjs.com/package/@e-burgos/sdd-harness)
`0.10.3` y construido con un ciclo SDD completo. El proceso, los gates y las reglas duras
están en [AGENTS.md](AGENTS.md) (symlink a `sdd/dual-harness/AGENTS.md`).

| Pieza                | Qué es                                                     |
| -------------------- | ---------------------------------------------------------- |
| `apps/api`           | NestJS 11 + Prisma 7 + PostgreSQL 16 — REST `/v1/*`        |
| `apps/webapp`        | React 19 + Vite 8 + Tailwind 4 — muro y formulario de alta  |
| `libs/shared-types`  | DTOs compartidos, importados como `@shared-types`          |
| `sdd/`               | Specs, ciclos, tasks, contexto y memoria del proyecto      |

---

## Requisitos

| Requisito | Versión  | Por qué                                        |
| --------- | -------- | ---------------------------------------------- |
| Node      | `>=22`   | Declarado en `engines`                         |
| pnpm      | `>=10`   | Pinneado en `packageManager` (`pnpm@10.14.0`)  |
| Docker    | cualquiera con `docker compose` | Levanta el Postgres |

> **pnpm es el único package manager.** Nunca `npm install` ni `yarn` acá: generan un
> lockfile rival y Nx infiere el package manager del lockfile. `npx` queda solo para
> invocar la CLI del kit.

---

## Levantar el proyecto

```bash
cd flexi-kudos
pnpm install
cp apps/api/.env.example .env   # .env está gitignoreado: en un clon nuevo no existe
pnpm dev
```

`pnpm dev` hace todo en un comando, en este orden:

```
dev → db:up      docker compose up -d --wait   (espera el healthcheck de pg_isready)
    → db:migrate prisma migrate deploy         (aplica las migraciones pendientes)
    → db:seed    prisma db seed                (6 miembros, idempotente vía upsert)
    → nx run-many -t serve -p api webapp --parallel=2
```

El `--wait` es lo que evita la carrera clásica: `migrate deploy` nunca corre contra un
Postgres que todavía no acepta conexiones. Es re-ejecutable: la segunda corrida imprime
`No pending migrations to apply` y el seed no duplica nada.

### Puertos

| Servicio        | URL                              | Definido en                          |
| --------------- | -------------------------------- | ------------------------------------ |
| API             | http://localhost:3000            | `.env` → `PORT` (fallback 3000)      |
| Webapp          | http://localhost:4200            | `apps/webapp/vite.config.ts`         |
| PostgreSQL      | `localhost:5432`                 | `docker-compose.yml`                 |
| Visor SDD       | http://127.0.0.1:4310/sdd/docs/  | `sdd/docs/serve.mjs`                 |

### Verificar que quedó andando

```bash
curl localhost:3000/healthz        # {"status":"ok"}
curl localhost:3000/v1/members     # 6 miembros del seed
curl localhost:3000/v1/categories  # 6 categorías
curl localhost:3000/v1/kudos       # {"items":[...],"next_cursor":null}
open http://localhost:4200
```

La API habilita CORS solo para `CORS_ORIGIN` (fallback `http://localhost:4200`). Si servís
la webapp en otro puerto, seteá esa variable o el preflight `OPTIONS` vuelve 404.

---

## Base de datos

| Comando           | Qué hace                                                          |
| ----------------- | ----------------------------------------------------------------- |
| `pnpm db:up`      | `docker compose up -d --wait` — Postgres 16 en `:5432`            |
| `pnpm db:migrate` | `prisma migrate deploy` — aplica migraciones, no las genera       |
| `pnpm db:seed`    | Siembra 6 miembros (idempotente)                                  |
| `pnpm db:setup`   | Los tres de arriba en orden                                       |
| `pnpm db:down`    | Baja el contenedor, **conserva** el volumen                       |
| `pnpm db:reset`   | `docker compose down -v` — **borra el volumen y todos los datos** |

Config de Prisma en [prisma.config.ts](prisma.config.ts) (Prisma 7 lo exige): schema,
carpeta de migraciones, comando de seed y `DATABASE_URL`.

### Si `pnpm dev` muere con `P3009`

```
Error: P3009
migrate found failed migrations in the target database
```

El volumen quedó con un historial de migraciones que no coincide con
`apps/api/prisma/migrations/` — pasa cuando un ciclo SDD regenera las migraciones sobre una
base vieja. `migrate deploy` **no se auto-recupera** de ese estado. Solución:

```bash
pnpm db:reset && pnpm dev
```

---

## Visor SDD (`sdd:docs`)

Explorador web de todo lo que produjo el proceso: specs, ciclos, tasks, contratos de API,
schema de datos, memoria y el dashboard de Costos.

```bash
pnpm sdd:docs
# → http://127.0.0.1:4310/sdd/docs/
```

El comando imprime la URL exacta al arrancar. Detalles:

- Puerto configurable: `pnpm sdd:docs --port 4400` o `SDD_DOCS_PORT=4400 pnpm sdd:docs`.
- Escucha en `127.0.0.1`, no en `0.0.0.0`.
- Servidor estático sin build: lee `sdd/` del disco, así que refrescar el browser alcanza
  para ver cambios.
- La raíz `/` redirige (301) a `/sdd/docs/` — entrar por la URL completa.
- Las tarifas del dashboard de Costos se editan en [sdd/pricing.json](sdd/pricing.json).

---

## Tests y validación

```bash
pnpm test:api        # 24 tests (unit + e2e con supertest)
pnpm test:webapp     # 12 tests (vitest + React Testing Library)
pnpm nx test shared-types   # 4 tests
pnpm sdd:validate    # valida los registros de sdd/ contra sus JSON Schema
```

`pnpm sdd:validate` en rojo es un commit inválido y es paso obligatorio del cierre de
ciclo. **Ojo:** este proyecto todavía no tiene el workflow de CI que lo automatiza
(`.github/workflows/sdd-validate.yml` no existe acá) — hoy la validación es manual.
El e2e de la API corre contra la base de desarrollo, así que necesita `pnpm db:up`.

Otros scripts: `pnpm api` / `pnpm webapp` (servir uno solo), `pnpm build:api` /
`pnpm build:webapp`, `pnpm lint:api` / `pnpm lint:webapp`.

---

## Cómo se generó esta app

Los cuatro pasos reales, en orden: **el comando de CLI y el prompt** de cada uno. El
estado que dejaron es verificable en [sdd/kit.json](sdd/kit.json),
[sdd/global.json](sdd/global.json) y [sdd/specs/index.json](sdd/specs/index.json).

Los prompts están reconstruidos desde los artefactos que produjeron (el objetivo del
`brief.yaml`, el encabezado de la spec, `pending_modules`, `sdd/fixes.json`) y desde las
plantillas canónicas de [sdd/prompts/](sdd/prompts/). Reproducen el resultado; no son la
transcripción literal de una sesión.

### 1. Scaffolding del workspace

`init` no interactivo desde el directorio **padre** (aborta si la carpeta destino ya
existe). El archivo de config es lo que hace el init reproducible, sin wizard:

```bash
cat > harness.config.json <<'JSON'
{
  "mode": "nx",
  "project": {
    "name": "flexi-kudos",
    "description": "Muro de reconocimientos de equipo",
    "packageScope": "@flexi-kudos"
  },
  "apps": [
    { "name": "api", "type": "nestjs" },
    { "name": "webapp", "type": "react" }
  ],
  "libs": [{ "name": "shared-types", "type": "shared-types" }],
  "services": [{ "type": "postgres" }]
}
JSON

npx -y @e-burgos/sdd-harness@0.10.3 init --config ./harness.config.json
```

Esto crea el workspace Nx, instala dependencias, escribe `sdd/` completo, los symlinks
`AGENTS.md` / `CLAUDE.md` / `GEMINI.md` y los agentes en `.claude/`, `.github/`, `.gemini/`.
El bootstrap de Nx deja **su propio repo git adentro**: hay que borrarlo con
`rm -rf flexi-kudos/.git` o el editor ve dos repositorios.

Verificación de que quedó sano: `pnpm sdd:validate` en verde y los agentes `sdd-*`
visibles en el cliente de AI.

**Prompt de control — el SPEC GATE.** Con el workspace recién creado y ninguna spec
todavía, pedirle implementación directa:

```
Implementá el muro de kudos: quiero poder darle un kudo a un compañero y ver el muro
con las tarjetas.
```

El agente **se niega**: corre el SPEC GATE de [AGENTS.md](AGENTS.md), detecta que no
existe la spec ni el módulo en `pending_modules` de `sdd/global.json`, y responde qué
falta en lugar de escribir código. Es el comportamiento esperado, no un error.

### 2. Crear la spec

El dev aporta **el objetivo en una frase** y aprueba; no redacta requisitos. Prompt:

```
/sdd-steward

Arranquemos una spec nueva en flexi-kudos. Objetivo: muro de reconocimientos del equipo
— cualquiera le da un kudo a un compañero eligiendo una categoría, y todo el equipo ve
el muro de tarjetas.

Antes de redactar, leé sdd/global.json y sdd/specs/index.json para ver el estado real
del proyecto: las dependencias de la spec salen de ahí, no de lo que yo te diga.

El workspace ya está montado (Nx, apps/api en NestJS, apps/webapp en React,
libs/shared-types y Postgres en docker-compose), así que no hace falta descubrimiento de
stack: quiero solo la FASE 4, sembrar el backlog.

- Creá la spec con `harness add spec` (author eburgos-flx, app apps/api).
- Redactala completa desde el objetivo: RF, RNF, dependencias y criterios de aceptación,
  incluidos los casos borde y los supuestos que asumas.
- Registrá el módulo en pending_modules de sdd/global.json.
- Pará en el checkpoint para que la aprobemos. No implementes nada todavía.
```

`/sdd-steward` es un **router**: no escribe la spec, la delega a la skill `sdd-hermes`.
Por eso el prompt nombra la **FASE 4** ("sembrar el backlog") — sin eso, Hermes arranca
por FASE 1 (descubrimiento) y FASE 2 (decisión de stack), que acá ya están resueltas.

El comando que el agente ejecuta:

```bash
npx -y @e-burgos/sdd-harness@0.10.3 add spec kudos-wall \
  --author eburgos-flx \
  --title "Muro de kudos" \
  --app apps/api
```

> La CLI deja **plantillas vacías** con secciones `[...]`: crea el esqueleto y lo registra
> en `sdd/specs/index.json`, no escribe contenido. Todo el cuerpo (RF, RNF, dependencias,
> los 15 criterios de aceptación y los supuestos S-1..S-9) lo escribe Hermes.

Resultado: [`sdd/specs/spec-eburgos-flx-001-kudos-wall/`](sdd/specs/spec-eburgos-flx-001-kudos-wall/)
y el módulo `kudos-wall` registrado en `pending_modules` de `sdd/global.json`.

### 3. Correr el ciclo SDD

Con la spec aprobada (su encabezado sale de `draft — esperando aprobación humana`), se le
pide al orquestador arrancar el ciclo. La plantilla canónica es
[sdd/prompts/start-sdd-cycle.prompt.md](sdd/prompts/start-sdd-cycle.prompt.md), completada
con los valores de este proyecto:

```
Iniciá el Ciclo 1 del proyecto flexi-kudos siguiendo el flujo SDD.

Módulo a desarrollar: kudos-wall
Spec en: sdd/specs/spec-eburgos-flx-001-kudos-wall/spec-eburgos-flx-001-kudos-wall.spec.md

Antes de empezar:
1. Ejecutar el SPEC GATE
2. Leer sdd/global.json para verificar el estado actual
3. Confirmar que el módulo tiene spec y está en pending_modules
```

Da igual cómo se entre: el slash command `/start-sdd-cycle.prompt` o lenguaje natural
("arrancá el ciclo SDD del módulo kudos-wall") llegan al mismo lugar. Ahora el gate **deja
pasar** — la spec existe y el módulo está registrado.

El ciclo produce, en `sdd/specs/spec-eburgos-flx-001-kudos-wall/cycles/cycle-01/`:

| Documento       | Contenido                                                  |
| --------------- | ---------------------------------------------------------- |
| `brief.yaml`    | El objetivo del ciclo en una pantalla                      |
| `functional.md` | Historias de usuario con criterios de aceptación           |
| `planner.md`    | Descomposición y secuencia                                 |
| `architect.md`  | Decisiones técnicas (`D-01` fue el cambio TypeORM → Prisma) |
| `tasks.json`    | 20 tasks atómicas BE/FE, cada una con su definición de done |
| `cycle.json`    | Estado auditable: archivos tocados, tests, CA, consumo      |

`cycle-01` cerró con 20/20 tasks, 55 story points y 40 tests verdes.

### 4. Un fix por FIX GATE

El happy path andaba por `curl` pero no desde el browser: faltaba CORS y el preflight
`OPTIONS /v1/kudos` volvía 404. Un ciclo entero para una línea no era proporcional, así
que entró por el FIX GATE. El prefijo entre corchetes es lo que dispara el bypass:

```
[BUGFIX] El muro no carga desde el navegador. La webapp en :4200 pide a la API en :3000
y el preflight OPTIONS /v1/kudos vuelve 404, porque main.ts nunca llama a enableCors().
Desde curl anda, así que CA-001 quedó PASS sin detectarlo.

Registralo por FIX GATE, no reabras el ciclo-01.
```

Los cuatro prefijos válidos son `[HOTFIX]`, `[BUGFIX]`, `[FIX]` e `[IMPROVEMENT]`
(ver [AGENTS.md](AGENTS.md) → FIX GATE). El fix quedó registrado en
[`sdd/fixes.json`](sdd/fixes.json) y documentado en
[`fix-eburgos-flx-001-001.md`](sdd/specs/spec-eburgos-flx-001-kudos-wall/fixes/fix-eburgos-flx-001-001.md).

---

## Estado actual

| Ítem                | Valor                                              |
| ------------------- | -------------------------------------------------- |
| Spec                | `spec-eburgos-flx-001-kudos-wall` — `completed`    |
| Ciclos completados  | 1                                                  |
| Módulos en progreso | ninguno                                            |
| Endpoints           | `GET /healthz`, `GET /v1/categories`, `GET /v1/members`, `POST /v1/kudos`, `GET /v1/kudos` |
| Tablas              | `members`, `kudos`                                 |

Los follow-ups para `cycle-02` (benchmark de p95, auth mínima, testcontainers, carga
optimista del feed) están listados en `reviewer_report.follow_ups` de
[`cycle.json`](sdd/specs/spec-eburgos-flx-001-kudos-wall/cycles/cycle-01/cycle.json).
