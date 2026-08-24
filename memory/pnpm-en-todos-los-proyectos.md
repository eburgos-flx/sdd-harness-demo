---
name: pnpm-en-todos-los-proyectos
description: Todos los proyectos usan pnpm; legacy-shop necesitó onlyBuiltDependencies para esbuild
type: ops
date: 2026-08-24
---

`legacy-shop/` se migró de npm a pnpm (`packageManager: pnpm@10.14.0`, `pnpm-lock.yaml`,
scripts internos con `pnpm run`). En el primer `pnpm install`, pnpm bloqueó el postinstall de
esbuild ("Ignored build scripts") y `pnpm approve-builds` es interactivo, así que la
aprobación quedó versionada en `package.json`:

```json
"pnpm": { "onlyBuiltDependencies": ["esbuild"] }
```

**Por qué:** sin eso, cualquiera que clone y haga `pnpm install` se come el warning y el
riesgo de que Vite no encuentre el binario. Versionarlo hace que el install sea limpio y
no interactivo — importante si hay que reinstalar en vivo.

**Cómo aplicarlo:** todo proyecto nuevo del repo arranca en pnpm. Si algún build vuelve a
quedar bloqueado, agregar el paquete a `onlyBuiltDependencies` en lugar de correr
`approve-builds` a mano, y verificar con `rm -rf node_modules && pnpm install` que el
install queda sin warnings.
