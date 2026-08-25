import type { KudoDto } from '@shared-types';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { kudosApi } from '../api/kudos-client';
import { EmptyState } from '../components/EmptyState';
import { KudoCard } from '../components/KudoCard';

export function KudosWallPage() {
  const [items, setItems] = useState<KudoDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await kudosApi.listKudos({ limit: 20 });
      setItems(res.items);
      setNextCursor(res.next_cursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error al cargar el muro');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor) return;
    setLoading(true);
    try {
      const res = await kudosApi.listKudos({ limit: 20, cursor: nextCursor });
      setItems((current) => [...current, ...res.items]);
      setNextCursor(res.next_cursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error al cargar más kudos');
    } finally {
      setLoading(false);
    }
  }, [nextCursor]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  return (
    <section>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h2 style={{ margin: 0 }}>Muro de kudos</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => void loadFirstPage()}
            disabled={loading}
            style={btnSecondary}
          >
            Refrescar
          </button>
          <Link to="/nuevo" style={btnPrimary}>
            Dar un kudo
          </Link>
        </div>
      </header>

      {error && (
        <div role="alert" style={alertStyle}>
          {error}
        </div>
      )}

      {items.length === 0 && !loading ? (
        <EmptyState />
      ) : (
        <div style={gridStyle} data-testid="kudos-grid">
          {items.map((kudo) => (
            <KudoCard key={kudo.id} kudo={kudo} />
          ))}
        </div>
      )}

      {nextCursor && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loading}
            style={btnSecondary}
          >
            {loading ? 'Cargando…' : 'Cargar más'}
          </button>
        </div>
      )}
    </section>
  );
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '1rem',
};

const btnPrimary: React.CSSProperties = {
  background: '#111827',
  color: '#fff',
  padding: '0.5rem 1rem',
  borderRadius: '0.5rem',
  textDecoration: 'none',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  background: '#f3f4f6',
  color: '#111827',
  padding: '0.5rem 1rem',
  borderRadius: '0.5rem',
  border: '1px solid #d1d5db',
  fontWeight: 500,
  cursor: 'pointer',
};

const alertStyle: React.CSSProperties = {
  background: '#fef2f2',
  color: '#991b1b',
  padding: '0.75rem 1rem',
  borderRadius: '0.5rem',
  marginBottom: '1rem',
  border: '1px solid #fecaca',
};
