import type { KudoDto } from '@shared-types';
import { formatAbsoluteAr, formatRelativeAr } from '../utils/date';
import { CategoryChip } from './CategoryChip';

export function KudoCard({ kudo }: { kudo: KudoDto }) {
  const relative = formatRelativeAr(kudo.created_at);
  const absolute = formatAbsoluteAr(kudo.created_at);
  return (
    <article
      data-testid="kudo-card"
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        padding: '1rem',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: '1rem' }}>
          Para <span style={{ color: '#111827' }}>{kudo.receiver.full_name}</span>
        </strong>
        <CategoryChip category={kudo.category} />
      </header>
      <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#1f2937' }}>{kudo.message}</p>
      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: '#6b7280',
        }}
      >
        <span>de {kudo.giver.full_name}</span>
        <time title={absolute} dateTime={kudo.created_at}>
          {relative}
        </time>
      </footer>
    </article>
  );
}
