import { getCart } from '../store.js';
import { calcTotals, calcDiscountedTotal, resolveCoupon } from '../utils.js';

export default async function couponRoutes(fastify) {
  fastify.post('/coupons/validate', async (request, reply) => {
    const body = request.body || {};

    if (!body.cartId) {
      return reply.code(400).send({ error: 'bad_request', message: 'Falta cartId' });
    }

    if (String(body.couponCode || '').trim() === '') {
      return reply.code(400).send({ error: 'bad_request', message: 'Falta el codigo del cupon' });
    }

    const cart = getCart(body.cartId);
    if (!cart || cart.items.length === 0) {
      return reply.code(400).send({ error: 'empty_cart', message: 'El carrito esta vacio' });
    }

    const totals = calcTotals(cart.items);
    const resolved = resolveCoupon(body.couponCode, totals.subtotal);

    if (resolved.error) {
      return reply.code(409).send(resolved);
    }

    return {
      coupon: { code: resolved.coupon.code, percentOff: resolved.coupon.percentOff },
      totals: {
        subtotal: totals.subtotal,
        discount: resolved.discount,
        shipping: totals.shipping,
        total: calcDiscountedTotal(totals.subtotal, resolved.discount, totals.shipping),
        freeShippingOver: totals.freeShippingOver,
      },
    };
  });
}
