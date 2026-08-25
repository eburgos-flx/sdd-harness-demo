import { useState } from 'react';
import { formatPrice } from '../format.js';
import { validateCoupon } from '../api.js';

const EMPTY = { name: '', email: '', address: '', city: '', notes: '' };

export default function CheckoutForm({
  cartId,
  totals,
  errors,
  couponError,
  submitting,
  onBack,
  onSubmit,
}) {
  const [customer, setCustomer] = useState(EMPTY);
  const [couponCode, setCouponCode] = useState('');
  const [applied, setApplied] = useState(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const shownTotals = applied ? applied.totals : totals;
  const shownCouponError = couponMessage || couponError;

  function set(field, value) {
    setCustomer((prev) => ({ ...prev, [field]: value }));
  }

  async function applyCoupon() {
    const code = couponCode.trim();

    if (code === '') {
      setCouponMessage('Ingresa un codigo de cupon');
      return;
    }

    setCheckingCoupon(true);
    setCouponMessage('');

    try {
      setApplied(await validateCoupon(cartId, code));
    } catch (err) {
      setApplied(null);
      setCouponMessage(err.message);
    } finally {
      setCheckingCoupon(false);
    }
  }

  function removeCoupon() {
    setApplied(null);
    setCouponCode('');
    setCouponMessage('');
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(customer, applied ? applied.coupon.code : '');
  }

  return (
    <form className="checkout" onSubmit={handleSubmit}>
      <button type="button" className="link-back" onClick={onBack}>
        &larr; Volver al carrito
      </button>

      <div className="field">
        <label htmlFor="co-name">Nombre y apellido</label>
        <input
          id="co-name"
          value={customer.name}
          onChange={(e) => set('name', e.target.value)}
          autoComplete="name"
        />
        {errors.name ? <small className="field__error">{errors.name}</small> : null}
      </div>

      <div className="field">
        <label htmlFor="co-email">Email</label>
        <input
          id="co-email"
          type="email"
          value={customer.email}
          onChange={(e) => set('email', e.target.value)}
          autoComplete="email"
        />
        {errors.email ? <small className="field__error">{errors.email}</small> : null}
      </div>

      <div className="field">
        <label htmlFor="co-address">Direccion de entrega</label>
        <input
          id="co-address"
          value={customer.address}
          onChange={(e) => set('address', e.target.value)}
          autoComplete="street-address"
        />
        {errors.address ? <small className="field__error">{errors.address}</small> : null}
      </div>

      <div className="field">
        <label htmlFor="co-city">Localidad</label>
        <input
          id="co-city"
          value={customer.city}
          onChange={(e) => set('city', e.target.value)}
          autoComplete="address-level2"
        />
        {errors.city ? <small className="field__error">{errors.city}</small> : null}
      </div>

      <div className="field">
        <label htmlFor="co-notes">Comentarios (opcional)</label>
        <textarea
          id="co-notes"
          rows={2}
          value={customer.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="co-coupon">Cupon de descuento</label>

        {applied ? (
          <div className="coupon__applied">
            <span>
              <strong>{applied.coupon.code}</strong> &mdash; {applied.coupon.percentOff}% de descuento
            </span>
            <button type="button" className="link-back" onClick={removeCoupon}>
              Quitar
            </button>
          </div>
        ) : (
          <div className="coupon__row">
            <input
              id="co-coupon"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              autoComplete="off"
              placeholder="Ingresa tu codigo"
            />
            <button type="button" className="btn" onClick={applyCoupon} disabled={checkingCoupon}>
              {checkingCoupon ? 'Validando...' : 'Aplicar'}
            </button>
          </div>
        )}

        {shownCouponError ? <small className="field__error">{shownCouponError}</small> : null}
      </div>

      <div className="totals">
        <div className="totals__row">
          <span>Subtotal</span>
          <span>{formatPrice(shownTotals.subtotal)}</span>
        </div>
        {applied ? (
          <div className="totals__row totals__row--discount">
            <span>Descuento ({applied.coupon.code})</span>
            <span>&minus;{formatPrice(shownTotals.discount)}</span>
          </div>
        ) : null}
        <div className="totals__row">
          <span>Envio</span>
          <span>{shownTotals.shipping === 0 ? 'Gratis' : formatPrice(shownTotals.shipping)}</span>
        </div>
        <div className="totals__row totals__row--big">
          <span>Total</span>
          <span>{formatPrice(shownTotals.total)}</span>
        </div>
      </div>

      <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
        {submitting ? 'Procesando...' : 'Confirmar compra'}
      </button>
    </form>
  );
}
