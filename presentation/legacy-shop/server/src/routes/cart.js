import { getCart, createCart, saveCart, findProduct } from '../store.js';
import { calcTotals, shortId } from '../utils.js';

// OJO: este archivo quedo con el estilo viejo (callback + reply.send). Cuando
// haya tiempo unificarlo con products.js, que ya usa async/await. -- EB 2024-03

export function cartPayload(cart) {
  if (!cart) {
    return { cartId: null, items: [], totals: calcTotals([]) };
  }

  return {
    cartId: cart.id,
    items: cart.items,
    totals: calcTotals(cart.items),
  };
}

export function registerCartRoutes(fastify, opts, done) {
  fastify.get('/cart', function (request, reply) {
    const cart = getCart(request.query.cartId);
    reply.send(cartPayload(cart));
  });

  fastify.post('/cart', function (request, reply) {
    const body = request.body || {};
    var cartId = body.cartId;

    if (!body.productId) {
      reply.code(400).send({ error: 'bad_request', message: 'Falta productId' });
      return;
    }

    const product = findProduct(body.productId);
    if (!product) {
      reply.code(404).send({ error: 'not_found', message: 'No existe el producto' });
      return;
    }

    let cart = getCart(cartId);
    if (!cart) {
      cartId = cartId || shortId('c');
      cart = createCart(cartId);
    }

    const quantity = Number(body.quantity) > 0 ? Number(body.quantity) : 1;
    const line = cart.items.find((i) => i.productId === product.id);

    if (line) {
      line.quantity = line.quantity + quantity;
    } else {
      cart.items.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: quantity,
      });
    }

    saveCart(cart);
    reply.send(cartPayload(cart));
  });

  // Setea la cantidad exacta de una linea. Si llega en 0 o menos, la saca.
  fastify.post('/cart/update', function (request, reply) {
    const body = request.body || {};
    const cart = getCart(body.cartId);

    if (!cart) {
      reply.code(404).send({ error: 'not_found', message: 'No hay carrito' });
      return;
    }

    const quantity = Number(body.quantity);
    const index = cart.items.findIndex((i) => i.productId === body.productId);

    if (index === -1) {
      reply.code(404).send({ error: 'not_found', message: 'El producto no esta en el carrito' });
      return;
    }

    if (!quantity || quantity <= 0) {
      cart.items.splice(index, 1);
    } else {
      cart.items[index].quantity = quantity;
    }

    saveCart(cart);
    reply.send(cartPayload(cart));
  });

  // Endpoint viejo, lo usa el tachito del carrito. Hace lo mismo que /cart/update
  // con quantity 0, pero el front nunca se migro.
  fastify.post('/cart/remove', function (request, reply) {
    const body = request.body || {};
    const cart = getCart(body.cartId);

    if (!cart) {
      reply.code(404).send({ error: 'not_found', message: 'No hay carrito' });
      return;
    }

    cart.items = cart.items.filter((i) => i.productId !== body.productId);
    saveCart(cart);
    reply.send(cartPayload(cart));
  });

  done();
}
