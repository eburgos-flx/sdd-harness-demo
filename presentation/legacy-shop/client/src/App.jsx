import { useEffect, useState } from 'react';

import Header from './components/Header.jsx';
import CategoryBar from './components/CategoryBar.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import * as api from './api.js';

const CART_KEY = 'legacyshop.cartId';

const EMPTY_CART = {
  cartId: null,
  items: [],
  totals: { subtotal: 0, shipping: 0, total: 0, freeShippingOver: 250000 },
};

export default function App() {
  const [settings, setSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState(EMPTY_CART);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [view, setView] = useState('cart');
  const [order, setOrder] = useState(null);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [justAddedId, setJustAddedId] = useState(null);

  // Arranque: settings + carrito guardado (si el server se reinicio, el carrito
  // ya no existe y hay que limpiar el localStorage).
  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {});

    const saved = window.localStorage.getItem(CART_KEY);
    if (!saved) return;

    api
      .getCart(saved)
      .then((data) => {
        if (!data.cartId) {
          window.localStorage.removeItem(CART_KEY);
          return;
        }
        setCart(data);
      })
      .catch(() => window.localStorage.removeItem(CART_KEY));
  }, []);

  // Catalogo. El search dispara con un delay chico para no pegarle en cada tecla.
  useEffect(() => {
    let alive = true;
    setLoading(true);

    const timer = setTimeout(() => {
      api
        .getProducts({ category, q: query })
        .then((data) => {
          if (!alive) return;
          setProducts(data.items);
          setCategories(data.categories);
          setLoading(false);
        })
        .catch(() => {
          if (!alive) return;
          setGeneralError('No pudimos cargar el catalogo. Esta levantado el server?');
          setLoading(false);
        });
    }, 220);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [category, query]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function persist(data) {
    setCart(data);
    if (data.cartId) window.localStorage.setItem(CART_KEY, data.cartId);
  }

  async function handleAdd(product) {
    try {
      const data = await api.addToCart(cart.cartId, product.id, 1);
      persist(data);
      setJustAddedId(product.id);
      setTimeout(() => setJustAddedId(null), 1400);
    } catch (err) {
      setGeneralError(err.message);
    }
  }

  async function handleQty(item, quantity) {
    try {
      const data = await api.updateLine(cart.cartId, item.productId, quantity);
      persist(data);
    } catch (err) {
      setGeneralError(err.message);
    }
  }

  async function handleRemove(item) {
    try {
      const data = await api.removeLine(cart.cartId, item.productId);
      persist(data);
    } catch (err) {
      setGeneralError(err.message);
    }
  }

  async function handleCheckout(customer) {
    setSubmitting(true);
    setErrors({});
    setGeneralError('');

    try {
      const data = await api.checkout(cart.cartId, customer);
      persist(data.cart);
      setOrder(data.order);
      setView('done');
    } catch (err) {
      if (err.status === 422) {
        setErrors(err.payload.errors || {});
      } else {
        setGeneralError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function openCart() {
    setView(order ? 'cart' : view === 'done' ? 'cart' : view);
    setDrawerOpen(true);
  }

  function keepShopping() {
    setOrder(null);
    setView('cart');
    setDrawerOpen(false);
  }

  const itemCount = cart.items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="app">
      <Header
        storeName={settings ? settings.storeName : ''}
        itemCount={itemCount}
        query={query}
        onQueryChange={setQuery}
        onOpenCart={openCart}
      />

      <section className="hero">
        <div className="hero__inner">
          <p className="hero__kicker">Escritorio y audio</p>
          <h1>Todo lo que usas ocho horas por dia</h1>
          <p className="hero__sub">
            Envio gratis a partir de {settings ? '$ ' + settings.freeShippingOver.toLocaleString('es-AR') : '$ 250.000'}.
            Cambios sin cargo dentro de los 30 dias.
          </p>
        </div>
      </section>

      <main className="content">
        <div className="content__bar">
          <CategoryBar categories={categories} value={category} onChange={setCategory} />
          <span className="content__count">{products.length} productos</span>
        </div>

        <ProductGrid products={products} loading={loading} onAdd={handleAdd} justAddedId={justAddedId} />
      </main>

      <footer className="footer">
        <span>Legacy Shop &middot; catalogo interno</span>
        <span>v0.4.2</span>
      </footer>

      <CartDrawer
        open={drawerOpen}
        view={view}
        cart={cart}
        order={order}
        errors={errors}
        generalError={drawerOpen ? generalError : ''}
        submitting={submitting}
        onClose={() => setDrawerOpen(false)}
        onQty={handleQty}
        onRemove={handleRemove}
        onGoCheckout={() => setView('checkout')}
        onBackToCart={() => setView('cart')}
        onSubmit={handleCheckout}
        onKeepShopping={keepShopping}
      />
    </div>
  );
}
