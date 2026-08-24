import { Link } from 'react-router-dom';

export function EmptyState() {
  return (
    <div
      style={{
        padding: '3rem 1rem',
        textAlign: 'center',
        border: '2px dashed #d1d5db',
        borderRadius: '0.75rem',
        color: '#4b5563',
      }}
    >
      <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
        Todavía no hay kudos, ¡empezá vos!
      </p>
      <Link
        to="/nuevo"
        style={{
          display: 'inline-block',
          background: '#111827',
          color: '#fff',
          padding: '0.6rem 1.2rem',
          borderRadius: '0.5rem',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Dar el primer kudo
      </Link>
    </div>
  );
}
