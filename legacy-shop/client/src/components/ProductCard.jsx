import Thumb from './Thumb.jsx';
import { formatPrice } from '../format.js';

export default function ProductCard({ product, onAdd, justAdded }) {
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <article className="card">
      <div className="card__media">
        <Thumb src={product.image} seed={product.sku} alt={product.name} />
        <span className="card__cat">{product.category}</span>
        {lowStock ? <span className="card__stock">Ultimas {product.stock}</span> : null}
      </div>

      <div className="card__body">
        <h3 className="card__title">{product.name}</h3>
        <p className="card__desc">{product.description}</p>

        <div className="card__foot">
          <span className="card__price">{formatPrice(product.price)}</span>
          <button
            className={'btn btn--add' + (justAdded ? ' is-done' : '')}
            onClick={() => onAdd(product)}
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? 'Sin stock' : justAdded ? 'Agregado' : 'Agregar'}
          </button>
        </div>
      </div>
    </article>
  );
}
