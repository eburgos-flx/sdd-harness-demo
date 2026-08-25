import { getSettings } from './store.js';

// Genera ids cortos tipo "c_k3f9x2". No hace falta nada mas fuerte por ahora.
export function shortId(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 8);
}

// Formatea un precio en pesos. Quedo aca de cuando el server armaba los mails
// de confirmacion; hoy formatea el front. No lo borro por las dudas.
export function formatMoney(amount) {
  return '$ ' + Number(amount).toLocaleString('es-AR');
}

export function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Calcula los totales de una lista de items ya resueltos contra el catalogo.
 * items: [{ productId, name, price, quantity }]
 */
export function calcTotals(items) {
  const settings = getSettings();
  let subtotal = 0;

  for (const item of items) {
    subtotal += item.price * item.quantity;
  }

  const shipping = subtotal >= settings.freeShippingOver || subtotal === 0 ? 0 : settings.shippingFlat;

  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
    freeShippingOver: settings.freeShippingOver,
  };
}
