import type { KudoDto } from '@shared-types';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KudosWallPage } from './KudosWallPage';

vi.mock('../api/kudos-client', () => ({
  kudosApi: {
    listKudos: vi.fn(),
  },
}));

async function importMock() {
  const mod = await import('../api/kudos-client');
  return mod.kudosApi as unknown as {
    listKudos: ReturnType<typeof vi.fn>;
  };
}

function makeKudo(id: string): KudoDto {
  return {
    id,
    giver: { id: 'g', full_name: 'Ana Giver', handle: 'ana' },
    receiver: { id: 'r', full_name: 'Bruno Receiver', handle: 'bruno' },
    category: { key: 'teamwork', label: 'Trabajo en equipo' },
    message: `kudo ${id}`,
    created_at: new Date().toISOString(),
  };
}

describe('KudosWallPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders one card per kudo returned by the api', async () => {
    const client = await importMock();
    client.listKudos.mockResolvedValueOnce({
      items: [makeKudo('1'), makeKudo('2'), makeKudo('3')],
      next_cursor: null,
    });

    render(
      <MemoryRouter>
        <KudosWallPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('kudo-card')).toHaveLength(3);
    });
    expect(screen.getAllByText('Bruno Receiver')).toHaveLength(3);
  });

  it('shows the empty state when the api returns no items', async () => {
    const client = await importMock();
    client.listKudos.mockResolvedValueOnce({ items: [], next_cursor: null });

    render(
      <MemoryRouter>
        <KudosWallPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Todavía no hay kudos/i),
      ).toBeInTheDocument();
    });
  });
});
