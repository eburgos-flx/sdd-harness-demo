import type { CategoryDto, MemberDto } from '@shared-types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { KudoForm } from './KudoForm';

const MEMBERS: MemberDto[] = [
  { id: 'm-1', full_name: 'Ana', handle: 'ana' },
  { id: 'm-2', full_name: 'Bruno', handle: 'bruno' },
];
const CATEGORIES: CategoryDto[] = [
  { key: 'teamwork', label: 'Trabajo en equipo' },
];

describe('KudoForm', () => {
  it('keeps submit disabled while any field is missing', () => {
    render(
      <KudoForm
        members={MEMBERS}
        categories={CATEGORIES}
        submitting={false}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Publicar kudo/i })).toBeDisabled();
  });

  it('disables submit when giver equals receiver and shows inline error', async () => {
    const user = userEvent.setup();
    render(
      <KudoForm
        members={MEMBERS}
        categories={CATEGORIES}
        submitting={false}
        onSubmit={vi.fn()}
      />,
    );

    const [giverSelect, receiverSelect, categorySelect] = screen.getAllByRole('combobox');
    await user.selectOptions(giverSelect, 'm-1');
    await user.selectOptions(receiverSelect, 'm-1');
    await user.selectOptions(categorySelect, 'teamwork');
    await user.type(screen.getByRole('textbox'), 'gracias');

    expect(screen.getByText(/no podés darte un kudo a vos mismo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Publicar kudo/i })).toBeDisabled();
  });

  it('disables submit when message exceeds 280 code points', async () => {
    const user = userEvent.setup();
    render(
      <KudoForm
        members={MEMBERS}
        categories={CATEGORIES}
        submitting={false}
        onSubmit={vi.fn()}
      />,
    );

    const [giverSelect, receiverSelect, categorySelect] = screen.getAllByRole('combobox');
    await user.selectOptions(giverSelect, 'm-1');
    await user.selectOptions(receiverSelect, 'm-2');
    await user.selectOptions(categorySelect, 'teamwork');
    const textarea = screen.getByRole('textbox');
    await user.click(textarea);
    await user.paste('a'.repeat(281));

    expect(screen.getByRole('button', { name: /Publicar kudo/i })).toBeDisabled();
  });

  it('enables submit when all fields are valid and calls onSubmit', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <KudoForm
        members={MEMBERS}
        categories={CATEGORIES}
        submitting={false}
        onSubmit={onSubmit}
      />,
    );

    const [giverSelect, receiverSelect, categorySelect] = screen.getAllByRole('combobox');
    await user.selectOptions(giverSelect, 'm-1');
    await user.selectOptions(receiverSelect, 'm-2');
    await user.selectOptions(categorySelect, 'teamwork');
    await user.type(screen.getByRole('textbox'), 'gracias por bancar el release');

    const submit = screen.getByRole('button', { name: /Publicar kudo/i });
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(onSubmit).toHaveBeenCalledWith({
      giver_id: 'm-1',
      receiver_id: 'm-2',
      category: 'teamwork',
      message: 'gracias por bancar el release',
    });
  });
});
