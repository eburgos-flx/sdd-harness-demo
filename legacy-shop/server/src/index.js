import Fastify from 'fastify';
import cors from '@fastify/cors';

import productRoutes from './routes/products.js';
import { registerCartRoutes, cartPayload } from './routes/cart.js';
import { getCart, clearCart, findProduct, pushOrder, listOrders, getSettings } from './store.js';
import { isEmail, shortId } from './utils.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const HOST = process.env.HOST || '0.0.0.0';

const app = Fastify({
  logger: {
    transport: undefined,
    level: process.env.LOG_LEVEL || 'info',
  },
});

await app.register(cors, { origin: true });

app.get('/health', async () => ({ status: 'ok', uptime: process.uptime() }));

app.get('/settings', async () => {
  const s = getSettings();
  // No devolvemos el objeto crudo: hubo un momento en que tenia una key de un
  // proveedor de pagos adentro. Ahora no, pero mejor dejarlo explicito.
  return {
    storeName: s.storeName,
    currency: s.currency,
    shippingFlat: s.shippingFlat,
    freeShippingOver: s.freeShippingOver,
  };
});

await app.register(productRoutes);
await app.register(registerCartRoutes);

/*
 * CHECKOUT
 *
 * Esto tendria que estar en un service aparte, como products/cart, pero se
 * escribio contra reloj para la primera version y nunca se movio. Valida,
 * recalcula los totales por las suyas (no confiamos en lo que manda el front)
 * y arma la orden.
 *
 * TODO: partirlo. TODO: cobrar de verdad.
 */
app.post('/checkout', async (request, reply) => {
  const body = request.body || {};
  const customer = body.customer || {};
  const errors = {};

  if (!body.cartId) {
    return reply.code(400).send({ error: 'bad_request', message: 'Falta cartId' });
  }

  const cart = getCart(body.cartId);
  if (!cart || cart.items.length === 0) {
    return reply.code(400).send({ error: 'empty_cart', message: 'El carrito esta vacio' });
  }

  if (!customer.name || String(customer.name).trim().length < 3) {
    errors.name = 'Ingresa tu nombre y apellido';
  }
  if (!isEmail(customer.email)) {
    errors.email = 'El email no parece valido';
  }
  if (!customer.address || String(customer.address).trim().length < 6) {
    errors.address = 'Ingresa una direccion de entrega';
  }
  if (!customer.city || String(customer.city).trim() === '') {
    errors.city = 'Ingresa la localidad';
  }

  if (Object.keys(errors).length > 0) {
    return reply.code(422).send({ error: 'validation_error', errors: errors });
  }

  // Recalculo de totales. Si, es casi lo mismo que calcTotals(), pero aca ademas
  // se revalida cada linea contra el catalogo (precio y stock) porque el carrito
  // vive en memoria y puede quedar viejo.
  let subtotal = 0;
  const lines = [];

  for (const item of cart.items) {
    const product = findProduct(item.productId);

    if (!product) {
      return reply.code(409).send({
        error: 'product_gone',
        message: 'Uno de los productos ya no esta disponible: ' + item.name,
      });
    }

    if (product.stock < item.quantity) {
      return reply.code(409).send({
        error: 'no_stock',
        message: 'No hay stock suficiente de ' + product.name,
        productId: product.id,
        available: product.stock,
      });
    }

    const lineTotal = product.price * item.quantity;
    subtotal += lineTotal;

    lines.push({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      unitPrice: product.price,
      quantity: item.quantity,
      lineTotal: lineTotal,
    });
  }

  // Envio gratis a partir de 250000. Ojo: este numero tambien esta en
  // data/store.json (settings) y lo usa el carrito.
  let shipping = 4500;
  if (subtotal >= 250000) {
    shipping = 0;
  }

  const total = subtotal + shipping;

  const order = {
    id: shortId('ord'),
    createdAt: new Date().toISOString(),
    status: 'confirmed',
    customer: {
      name: String(customer.name).trim(),
      email: String(customer.email).trim().toLowerCase(),
      address: String(customer.address).trim(),
      city: String(customer.city).trim(),
      notes: customer.notes ? String(customer.notes).trim() : '',
    },
    items: lines,
    totals: {
      subtotal: subtotal,
      shipping: shipping,
      total: total,
    },
  };

  pushOrder(order);
  clearCart(cart.id);

  // await sendConfirmationEmail(order)  <- lo sacamos cuando se vencio la cuenta
  // del proveedor de mails. Volver a engancharlo cuando haya presupuesto.

  app.log.info({ orderId: order.id, total: order.totals.total }, 'orden confirmada');

  return reply.code(201).send({ order: order, cart: cartPayload(getCart(cart.id)) });
});

// Solo para mirar desde la terminal mientras desarrollamos.
app.get('/orders', async () => ({ items: listOrders() }));

try {
  await app.listen({ port: PORT, host: HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
