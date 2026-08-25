const money = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export function formatPrice(value) {
  return money.format(Number(value) || 0);
}

// Colorcito estable por sku, para el placeholder cuando la imagen no carga.
export function tintFor(seed) {
  let hash = 0;
  for (let i = 0; i < String(seed).length; i++) {
    hash = (hash * 31 + String(seed).charCodeAt(i)) % 360;
  }
  return 'linear-gradient(135deg, hsl(' + hash + ' 46% 82%), hsl(' + ((hash + 48) % 360) + ' 52% 68%))';
}
