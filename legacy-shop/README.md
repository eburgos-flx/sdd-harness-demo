# Legacy Shop

Catalogo de productos con carrito y checkout. Es la tienda interna que arrancamos
en 2023 para vender accesorios de escritorio al equipo.

- `client/` — React 18 + Vite. Grilla de catalogo, carrito lateral y checkout de un paso.
- `server/` — Fastify. API REST sin base de datos: el catalogo sale de un JSON en disco
  (`server/data/store.json`) y los carritos viven en memoria.

## Levantarlo

```bash
npm install
npm run dev
```

| Servicio | URL |
| --- | --- |
| Front (Vite) | http://localhost:5173 |
| API (Fastify) | http://localhost:3001 |

`npm run dev` levanta los dos con concurrently. Tambien estan `npm run dev:server`,
`npm run dev:client` y `npm run build` (deja el bundle en `dist/`).

## Endpoints

| Metodo | Ruta | Que hace |
| --- | --- | --- |
| GET | `/products?category=&q=` | Catalogo, con filtro por categoria y busqueda |
| GET | `/products/:id` | Detalle de un producto |
| GET | `/cart?cartId=` | Carrito actual con totales |
| POST | `/cart` | Agrega un producto (crea el carrito si no existe) |
| POST | `/cart/update` | Setea la cantidad de una linea (0 la elimina) |
| POST | `/cart/remove` | Saca una linea (endpoint viejo, lo usa el boton "Quitar") |
| POST | `/checkout` | Valida, recalcula totales, arma la orden y vacia el carrito |
| GET | `/orders` | Ordenes de la sesion actual (solo para mirar desde la terminal) |
| GET | `/settings` | Nombre de la tienda, moneda y reglas de envio |

Los precios estan en pesos y los totales **siempre** se calculan en el server; el front
solo formatea. El envio es gratis a partir del monto que define
`settings.freeShippingOver` en `server/data/store.json`.

## Pendientes conocidos

- No hay tests. Nunca hubo.
- Los carritos y las ordenes estan en memoria: se pierden cuando reinicia el server.
- El handler de `/checkout` esta todo en `server/src/index.js` y duplica el calculo de
  totales de `server/src/utils.js`.
- Conviven dos estilos de rutas: `routes/products.js` usa el estilo plugin con async/await
  y `routes/cart.js` sigue con callbacks y `reply.send()`.
- El monto de envio gratis esta hardcodeado en el checkout ademas de estar en el JSON.
- Las fotos de los productos son de picsum.photos, no son fotos reales del catalogo.
