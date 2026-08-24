import type { CategoryKey } from '@shared-types';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { kudosApi } from '../api/kudos-client';
import { KudosApiError } from '../api/errors';
import { KudoForm, type KudoFormValue } from '../components/KudoForm';
import { useMembersCategories } from '../context/MembersCategoriesProvider';

export function NewKudoPage() {
  const { members, categories, loading } = useMembersCategories();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (value: KudoFormValue) => {
    setSubmitting(true);
    setError(null);
    try {
      await kudosApi.createKudo({
        giver_id: value.giver_id,
        receiver_id: value.receiver_id,
        category: value.category as CategoryKey,
        message: value.message,
      });
      navigate('/', { replace: true });
    } catch (e) {
      if (e instanceof KudosApiError) {
        setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : 'no pudimos publicar el kudo');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <h2>Dar un kudo</h2>
      {loading && <p>Cargando miembros…</p>}
      {error && (
        <div role="alert" style={alertStyle}>
          {error}
        </div>
      )}
      {!loading && (
        <KudoForm
          members={members}
          categories={categories}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      )}
    </section>
  );
}

const alertStyle: React.CSSProperties = {
  background: '#fef2f2',
  color: '#991b1b',
  padding: '0.75rem 1rem',
  borderRadius: '0.5rem',
  marginBottom: '1rem',
  border: '1px solid #fecaca',
};
