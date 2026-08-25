# FIX-eburgos-flx-001 — pnpm-lock.yaml desactualizado rompe `pnpm sdd:validate` y el gate de CI

| Campo         | Valor              |
| ------------- | ------------------ |
| **ID**        | FIX-eburgos-flx-001 |
| **Tipo**      | BUGFIX             |
| **Severidad** | high               |
| **Keyword**   | [BUGFIX]           |
| **Fecha**     | 2026-08-24         |
| **Autor**     | eburgos-flx        |
| **Estado**    | validated          |
| **Spec**      | N/A (repo-level)   |

## Problema

`pnpm sdd:validate` abortaba con `ERR_MODULE_NOT_FOUND: Cannot find package 'ajv'`. La
instalación del kit SDD agregó `ajv@^8.20.0` y `ajv-formats@^3.0.1` a `devDependencies` de
`package.json`, pero `pnpm-lock.yaml` nunca se regeneró: los paquetes estaban en el store
de pnpm (`node_modules/.pnpm/`) sin linkear en `node_modules/`.

Consecuencia: `pnpm install --frozen-lockfile` fallaba con `ERR_PNPM_OUTDATED_LOCKFILE`,
que es el modo por defecto en CI. El workflow `.github/workflows/sdd-validate.yml` —gate
obligatorio de todo PR que toque `sdd/**`— estaba roto para cualquiera que clonara el repo.

## Justificación del bypass

No es una funcionalidad: es la herramienta de verificación del propio sistema SDD. Abrir un
ciclo para arreglarla exige correr `pnpm sdd:validate`, que es justamente lo que no
funciona. Bloqueaba el cierre de cualquier ciclo y el merge de cualquier PR sobre `sdd/**`.

## Solución aplicada

`pnpm install` para regenerar el lockfile con las dos dependencias que ya estaban
declaradas en `package.json`. No se agregó, quitó ni cambió ninguna versión: el lockfile se
alineó con lo que el `package.json` ya pedía.

### Archivos modificados

- `pnpm-lock.yaml` — 6 líneas: entradas de `ajv@8.20.0` y `ajv-formats@3.0.1` en
  `devDependencies` e importers.

### Test de validación

- **Referencia:** el repo no tiene framework de tests. Verificación por comando:
  - `pnpm install --frozen-lockfile` → `Lockfile is up to date` (reproduce la condición de CI)
  - `pnpm sdd:validate` → `[validate-sdd] OK — 8 files valid, cross-checks passed`

### Decisión del Reviewer

> [A completar por sdd-reviewer al cerrar el ciclo]
>
> Revisado en el cierre de cycle-01 de spec-eburgos-flx-001-checkout-coupon (2026-08-24).
>
> - [x] `validated` — fix correcto, no requiere seguimiento
> - [ ] `absorbed` — debe formalizarse en próxima spec: SPEC-XXX
>
> El lockfile quedó alineado con `package.json` sin cambiar ninguna versión.
> `pnpm install --frozen-lockfile` (condición de CI) y `pnpm sdd:validate` en verde.

---
