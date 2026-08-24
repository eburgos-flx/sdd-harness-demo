# FIX-eburgos-flx-001-001 — CORS habilitado en la API

| Campo         | Valor                                                  |
| ------------- | ------------------------------------------------------ |
| **ID**        | FIX-eburgos-flx-001-001                                |
| **Tipo**      | BUGFIX                                                 |
| **Severidad** | high                                                   |
| **Keyword**   | [BUGFIX]                                               |
| **Fecha**     | 2026-08-24                                             |
| **Autor**     | eburgos-flx                                            |
| **Estado**    | implemented                                            |
| **Spec**      | spec-eburgos-flx-001-kudos-wall                        |

## Problema

La webapp corre en `http://localhost:4200` y consume la API en `http://localhost:3000`.
El navegador dispara un preflight `OPTIONS /v1/kudos?limit=20` que Nest responde 404
porque `main.ts` no habilita CORS. Consecuencia: el happy path del muro no funciona
desde el navegador (aunque sí desde `curl`, que fue como CA-001 quedó marcado PASS).

Evidencia en el log de `pnpm dev`:

```
request completed  method:"OPTIONS" url:"/v1/kudos?limit=20"
  origin: "http://localhost:4200"  statusCode: 404
```

## Justificación del bypass

- ≤5 archivos afectados (solo `apps/api/src/main.ts`).
- Sin cambios de contrato de API ni de datos.
- Sin nuevas entidades ni migraciones.
- El ciclo-01 ya está `completed`: reabrir el ciclo para 1 línea no es proporcional.
  El reviewer del próximo ciclo decide `validated` (fix correcto y suficiente) o
  `absorbed` (formalizar en la spec una decisión de CORS por env-driven).

## Solución aplicada

`app.enableCors({ origin, credentials: false })` en `main.ts`, con `origin` leído
de `CORS_ORIGIN` (fallback `http://localhost:4200`). Split por coma para permitir
lista de orígenes en despliegues futuros. Sin cambios en controladores.

### Archivos modificados

- `apps/api/src/main.ts` — se agrega `app.enableCors(...)` antes de `app.listen(port)`.

### Test de validación

- **Referencia:** ausente en esta iteración. Manual: `curl -i -X OPTIONS
  http://localhost:3000/v1/kudos -H "Origin: http://localhost:4200" -H
  "Access-Control-Request-Method: GET"` debe devolver 204 con
  `Access-Control-Allow-Origin: http://localhost:4200`. Test automatizado queda como
  follow-up para cycle-02 (agregarlo al e2e supertest de `apps/api`).

### Decisión del Reviewer

> [A completar por sdd-reviewer al cerrar el próximo ciclo]
>
> - [ ] `validated` — fix correcto, no requiere seguimiento
> - [ ] `absorbed` — se formaliza en la spec una decisión de CORS por env-driven y
>       se agrega el test e2e correspondiente.
