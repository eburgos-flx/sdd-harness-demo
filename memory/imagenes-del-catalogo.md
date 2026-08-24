---
name: imagenes-del-catalogo
description: Ids de picsum elegidos a mano; loremflickr quedó descartado por logos de marcas
type: fixture
date: 2026-08-24
---

Las fotos de `legacy-shop/server/data/store.json` son ids **fijos** de picsum
(`https://picsum.photos/id/N/640/640`, N ∈ 7, 26, 36, 39, 48, 60, 119, 201, 250, 445, 625,
668), elegidos mirando contactos de hoja para que todos sean escritorio/tech y la grilla se
vea coherente en el proyector.

**Por qué:** con seeds aleatorios de picsum salían paisajes y perros; con loremflickr por
keyword salían logos de marcas reales (Corsair) y fotos de gente al azar — peor para una
presentación a un cliente.

**Cómo aplicarlo:** si hay que sumar productos, elegir el id a mano del mismo registro
visual. Si no hay red en el lugar, `client/src/components/Thumb.jsx` cae a un placeholder
con degradé estable por SKU en vez de mostrar imágenes rotas: ese fallback existe por eso,
no lo saques.
