---
name: legacy-shop-imperfecciones-guionadas
description: La deuda técnica de legacy-shop es decorado deliberado; no se arregla
type: fixture
date: 2026-08-24
---

`legacy-shop/` se escribió a mano con imperfecciones puestas a propósito: sin tests, el
handler de `/checkout` entero en `server/src/index.js` recalculando totales por su cuenta,
`routes/products.js` en estilo plugin async y `routes/cart.js` con callbacks y
`reply.send()`, el monto de envío gratis hardcodeado además de estar en el JSON, comentarios
viejos firmados y un bloque de mail comentado. El README las lista en "Pendientes conocidos".

**Por qué:** es lo que el presentador señala en vivo ("proyecto real, patrones mezclados") y
es el material que el kit lee para armar `sdd/context/apps/legacy-shop/constitution.md`. Un
agente que "limpia" el código deja el escenario 3 sin su punto: que SDD se adopta sobre lo
que ya tenés, sin reescribirlo.

**Cómo aplicarlo:** no refactorizar nada de `legacy-shop/` salvo pedido explícito. La feature
de cupones del escenario debe **integrarse a esos patrones** (misma forma de ruta, mismo
store JSON), no corregirlos. Lo que sí se arregla sin pensarlo: que la app no ande.
