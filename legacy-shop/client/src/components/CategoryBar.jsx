export default function CategoryBar({ categories, value, onChange }) {
  const all = ['all'].concat(categories);

  return (
    <nav className="chips" aria-label="Categorias">
      {all.map((cat) => (
        <button
          key={cat}
          className={'chip' + (cat === value ? ' chip--on' : '')}
          onClick={() => onChange(cat)}
        >
          {cat === 'all' ? 'Todo' : cat}
        </button>
      ))}
    </nav>
  );
}
