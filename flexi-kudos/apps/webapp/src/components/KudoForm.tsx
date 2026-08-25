import type { CategoryDto, MemberDto } from '@shared-types';
import { useMemo, useState, type FormEvent } from 'react';

const MAX = 280;

function countCodePoints(value: string): number {
  return [...value].length;
}

export interface KudoFormValue {
  giver_id: string;
  receiver_id: string;
  category: string;
  message: string;
}

interface Props {
  members: MemberDto[];
  categories: CategoryDto[];
  submitting: boolean;
  onSubmit: (value: KudoFormValue) => void;
}

export function KudoForm({ members, categories, submitting, onSubmit }: Props) {
  const [giverId, setGiverId] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');

  const trimmedLength = countCodePoints(message.trim());
  const isSelfKudo = Boolean(giverId) && giverId === receiverId;
  const messageValid = trimmedLength >= 1 && trimmedLength <= MAX;
  const canSubmit =
    !submitting && Boolean(giverId) && Boolean(receiverId) && Boolean(category) && !isSelfKudo && messageValid;

  const remaining = useMemo(() => MAX - countCodePoints(message), [message]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({ giver_id: giverId, receiver_id: receiverId, category, message: message.trim() });
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle} noValidate>
      <label style={fieldStyle}>
        <span>Giver</span>
        <select value={giverId} onChange={(e) => setGiverId(e.target.value)} required>
          <option value="">Elegí una persona…</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name} ({m.handle})
            </option>
          ))}
        </select>
      </label>

      <label style={fieldStyle}>
        <span>Receiver</span>
        <select value={receiverId} onChange={(e) => setReceiverId(e.target.value)} required>
          <option value="">Elegí una persona…</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name} ({m.handle})
            </option>
          ))}
        </select>
      </label>

      {isSelfKudo && (
        <p role="alert" style={inlineErr}>
          no podés darte un kudo a vos mismo
        </p>
      )}

      <label style={fieldStyle}>
        <span>Categoría</span>
        <select value={category} onChange={(e) => setCategory(e.target.value)} required>
          <option value="">Elegí una categoría…</option>
          {categories.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <label style={fieldStyle}>
        <span>Mensaje</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          required
          aria-describedby="counter"
        />
        <small id="counter" style={{ color: remaining < 0 ? '#991b1b' : '#6b7280' }}>
          {remaining} caracteres restantes
        </small>
      </label>

      <button type="submit" disabled={!canSubmit} style={submitBtn(canSubmit)}>
        {submitting ? 'Publicando…' : 'Publicar kudo'}
      </button>
    </form>
  );
}

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  maxWidth: '32rem',
};
const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  fontWeight: 500,
};
const inlineErr: React.CSSProperties = {
  color: '#991b1b',
  fontSize: '0.85rem',
  margin: 0,
};
const submitBtn = (enabled: boolean): React.CSSProperties => ({
  background: enabled ? '#111827' : '#9ca3af',
  color: '#fff',
  padding: '0.6rem 1.2rem',
  borderRadius: '0.5rem',
  border: 'none',
  fontWeight: 600,
  cursor: enabled ? 'pointer' : 'not-allowed',
  alignSelf: 'flex-start',
});
