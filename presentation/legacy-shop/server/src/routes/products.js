import { listProducts, findProduct } from '../store.js';

/*
 * Rutas de catalogo. Son las unicas que quedaron en el estilo "plugin" de
 * fastify despues de la limpieza de 2024. El resto sigue como estaba.
 */
export default async function productRoutes(fastify) {
  fastify.get('/products', async (request) => {
    const { category, q } = request.query;

    let items = listProducts();

    if (category && category !== 'all') {
      items = items.filter((p) => p.category === category);
    }

    if (q && q.trim() !== '') {
      const needle = q.trim().toLowerCase();
      items = items.filter(
        (p) => p.name.toLowerCase().includes(needle) || p.description.toLowerCase().includes(needle)
      );
    }

    // Las categorias se calculan sobre el catalogo completo, no sobre el filtrado,
    // asi los chips no desaparecen cuando el usuario filtra.
    const categories = [...new Set(listProducts().map((p) => p.category))].sort();

    return { items, categories, count: items.length };
  });

  fastify.get('/products/:id', async (request, reply) => {
    const product = findProduct(request.params.id);

    if (!product) {
      return reply.code(404).send({ error: 'not_found', message: 'No existe el producto' });
    }

    return product;
  });
}
