---
name: verificacion-visual-chrome-headless
description: Cómo verificar UI en esta máquina: el bridge de Playwright MCP no levanta
type: ops
date: 2026-08-24
---

Las herramientas de Playwright MCP fallan acá con *"Extension connection timeout / Playwright
MCP Bridge"*. Para verificar UI se usa el Chrome del sistema:

- Screenshot suelto:
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --hide-scrollbars --virtual-time-budget=9000 --window-size=1440,1400 --screenshot=out.png http://localhost:5173`
- Flujo con interacción (clicks, forms, errores de consola, 4xx): `puppeteer-core` instalado
  en el scratchpad de la sesión, apuntando al mismo binario de Chrome con
  `executablePath`. No hace falta descargar browsers.

**Por qué:** compilar no es verificar. El carrito, el checkout y los estados de error del
backend solo se prueban manejando la app; así se encontraron el favicon 404, el botón del
carrito estirado en mobile y el "Agregar" que se salía de la card.

**Cómo aplicarlo:** antes de cerrar un cambio de UI, correr el flujo completo y mirar las
capturas — incluida una pasada a 414 px. Nunca instalar herramientas de verificación en el
`package.json` de un proyecto de demo: van al scratchpad.
