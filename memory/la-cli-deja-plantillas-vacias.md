---
name: la-cli-deja-plantillas-vacias
description: add spec y configure sdd generan plantillas con placeholders, no contenido; el cuerpo lo escribe el agente
type: gotcha
date: 2026-08-25
---

Lo que la CLI genera son **formularios en blanco**, no contenido. Verificado en el bundle de
`@e-burgos/sdd-harness@0.10.3` y contra `legacy-shop/`:

- **`add spec <slug>`** crea `sdd/specs/<spec-id>/` con `cycles/` y `fixes/`, registra la
  entrada en `sdd/specs/index.json` con `status: "in-progress"`, y escribe un `.spec.md` que
  es puro placeholder: `[Qué se construye, por qué y para quién.]`, `RF-1: [Descripción]`,
  `CA-001: [...]`. El `--title` solo alimenta el encabezado; `--author` define el correlativo
  `NNN` por autor.
- **`configure sdd`** deja `sdd/context/apps/<app>/constitution.md` como plantilla de 26
  líneas con todas las secciones en `[...]`. En un proyecto legacy **no sirve como fuente de
  verdad**: lo único propio que trae es la nota de repo standalone.

**Por qué importa:** el guion narraba `add spec` como si generara la spec, y el prompt del
agente lo mandaba a leer `constitution.md` para aprender los patrones del legacy — una lectura
que no devuelve nada. La fuente real de los patrones de `legacy-shop` es el código y el
`README.md` (la sección "Pendientes conocidos" declara la deuda técnica textualmente).

**Cómo aplicarlo:** en la demo, correr `add spec` y hacer `cat` del archivo vacío es un beat
a favor ("esto es un formulario en blanco; ahora miren quién lo llena"), no algo que esconder.
En los prompts, apuntar al código, nunca a la constitución vacía. Ver
[[quien-escribe-las-specs]].
