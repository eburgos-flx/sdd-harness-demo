import { useState } from 'react';
import { formatPrice } from '../format.js';

const EMPTY = { name: '', email: '', address: '', city: '', notes: '' };

export default function CheckoutForm({ totals, errors, submitting, onBack, onSubmit }) {
  const [customer, setCustomer] = useState(EMPTY);

  function set(field, value) {
    setCustomer((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(customer);
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

      <div className="totals">
        <div className="totals__row">
          <span>Subtotal</span>
          <span>{formatPrice(totals.subtotal)}</span>
        </div>
        <div className="totals__row">
          <span>Envio</span>
          <span>{totals.shipping === 0 ? 'Gratis' : formatPrice(totals.shipping)}</span>
        </div>
        <div className="totals__row totals__row--big">
          <span>Total</span>
          <span>{formatPrice(totals.total)}</span>
        </div>
      </div>

      <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
        {submitting ? 'Procesando...' : 'Confirmar compra'}
      </button>
    </form>
  );
}
