import ProductCard from './ProductCard.jsx';

export default function ProductGrid({ products, loading, onAdd, justAddedId }) {
  if (loading) {
    return (
      <div className="grid">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div className="card card--skeleton" key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="empty">
        <p>No encontramos productos con ese filtro.</p>
      </div>
    );
  }

  return (
    <div className="grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onAdd={onAdd} justAdded={justAddedId === p.id} />
      ))}
    </div>
  );
}
