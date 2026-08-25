export default function Header({ storeName, itemCount, query, onQueryChange, onOpenCart }) {
  return (
    <header className="header">
      <div className="header__inner">
        <a className="brand" href="/">
          <span className="brand__mark">ls</span>
          <span className="brand__name">{storeName || 'Legacy Shop'}</span>
        </a>

        <div className="search">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M9 3a6 6 0 104.47 10.03l3.25 3.25 1.06-1.06-3.25-3.25A6 6 0 009 3zm0 1.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9z"
              fill="currentColor"
            />
          </svg>
          <input
            type="search"
            value={query}
            placeholder="Buscar en el catalogo"
            aria-label="Buscar productos"
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>

        <button className="cart-button" onClick={onOpenCart} aria-label="Abrir carrito">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M3 3h2.2l.6 2.4h11.4l-1.6 6.4H7.1l-.3 1.2h9.6v1.5H5.6a1 1 0 01-.97-1.24L5.4 10 4 4.5H3V3zm4.2 3.9l.9 3.4h6.9l.85-3.4H7.2zM8 16.2a1.3 1.3 0 110 2.6 1.3 1.3 0 010-2.6zm7 0a1.3 1.3 0 110 2.6 1.3 1.3 0 010-2.6z"
              fill="currentColor"
            />
          </svg>
          <span>Carrito</span>
          {itemCount > 0 ? <em className="cart-button__badge">{itemCount}</em> : null}
        </button>
      </div>
    </header>
  );
}
