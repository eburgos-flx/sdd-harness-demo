// La API corre en otro puerto en desarrollo. En produccion queda detras del
// mismo dominio, por eso el fallback a "".
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request(path, options) {
  const res = await fetch(BASE + path, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message || 'Error de red');
    err.status = res.status;
    err.payload = data;
    throw err;
  }

  return data;
}

export function getSettings() {
  return request('/settings');
}

export function getProducts(params) {
  const qs = new URLSearchParams();
  if (params.category && params.category !== 'all') qs.set('category', params.category);
  if (params.q) qs.set('q', params.q);
  return request('/products?' + qs.toString());
}

export function getCart(cartId) {
  return request('/cart?cartId=' + encodeURIComponent(cartId || ''));
}

export function addToCart(cartId, productId, quantity) {
  return post('/cart', { cartId, productId, quantity });
}

export function updateLine(cartId, productId, quantity) {
  return post('/cart/update', { cartId, productId, quantity });
}

export function removeLine(cartId, productId) {
  return post('/cart/remove', { cartId, productId });
}

export function validateCoupon(cartId, couponCode) {
  return post('/coupons/validate', { cartId, couponCode });
}

export function checkout(cartId, customer, couponCode) {
  return post('/checkout', { cartId, customer, couponCode });
}

function post(path, body) {
  return request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
