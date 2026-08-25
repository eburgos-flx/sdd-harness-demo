import Thumb from './Thumb.jsx';
import CheckoutForm from './CheckoutForm.jsx';
import { formatPrice } from '../format.js';

export default function CartDrawer(props) {
  const {
    open,
    view,
    cart,
    order,
    errors,
    generalError,
    submitting,
    onClose,
    onQty,
    onRemove,
    onGoCheckout,
    onBackToCart,
    onSubmit,
    onKeepShopping,
  } = props;

  const totals = cart.totals;
  const missing = totals.freeShippingOver - totals.subtotal;
  const progress = Math.min(100, Math.round((totals.subtotal / totals.freeShippingOver) * 100));

  return (
    <>
      <div className={'overlay' + (open ? ' is-open' : '')} onClick={onClose} />

      <aside className={'drawer' + (open ? ' is-open' : '')} aria-hidden={!open}>
        <div className="drawer__head">
          <h2>{view === 'done' ? 'Compra confirmada' : view === 'checkout' ? 'Checkout' : 'Tu carrito'}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar carrito">
            &times;
          </button>
        </div>

        {generalError ? <p className="alert">{generalError}</p> : null}

        {view === 'done' && order ? (
          <div className="done">
            <div className="done__mark">&#10003;</div>
            <h3>Gracias por tu compra</h3>
            <p>
              Tu orden <strong>{order.id}</strong> quedo confirmada por{' '}
              <strong>{formatPrice(order.totals.total)}</strong>.
            </p>
            <p className="done__mail">Te mandamos el detalle a {order.customer.email}</p>
            <button className="btn btn--primary btn--block" onClick={onKeepShopping}>
              Seguir comprando
            </button>
          </div>
        ) : null}

        {view === 'checkout' ? (
          <CheckoutForm
            totals={totals}
            errors={errors}
            submitting={submitting}
            onBack={onBackToCart}
            onSubmit={onSubmit}
          />
        ) : null}

        {view === 'cart' ? (
          cart.items.length === 0 ? (
            <div className="drawer__empty">
              <p>Todavia no agregaste nada.</p>
              <button className="btn" onClick={onClose}>
                Ver el catalogo
              </button>
            </div>
          ) : (
            <>
              <div className="lines">
                {cart.items.map((item) => (
                  <div className="line" key={item.productId}>
                    <Thumb src={item.image} seed={item.sku} alt={item.name} className="thumb--sm" />

                    <div className="line__info">
                      <p className="line__name">{item.name}</p>
                      <p className="line__price">{formatPrice(item.price)}</p>

                      <div className="stepper">
                        <button onClick={() => onQty(item, item.quantity - 1)} aria-label="Quitar uno">
                          &minus;
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => onQty(item, item.quantity + 1)} aria-label="Agregar uno">
                          +
                        </button>
                      </div>
                    </div>

                    <div className="line__right">
                      <span className="line__total">{formatPrice(item.price * item.quantity)}</span>
                      <button className="line__remove" onClick={() => onRemove(item)}>
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="drawer__foot">
                {totals.shipping === 0 ? (
                  <p className="ship ship--free">Tenes envio gratis</p>
                ) : (
                  <div className="ship">
                    <p>
                      Te faltan <strong>{formatPrice(missing)}</strong> para el envio gratis
                    </p>
                    <div className="ship__bar">
                      <span style={{ width: progress + '%' }} />
                    </div>
                  </div>
                )}

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

                <button className="btn btn--primary btn--block" onClick={onGoCheckout}>
                  Finalizar compra
                </button>
              </div>
            </>
          )
        ) : null}
      </aside>
    </>
  );
}
