import type { CategoryDto, MemberDto } from '@shared-types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { kudosApi } from '../api/kudos-client';

interface MembersCategoriesContext {
  members: MemberDto[];
  categories: CategoryDto[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const ctx = createContext<MembersCategoriesContext | null>(null);

export function MembersCategoriesProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, c] = await Promise.all([
        kudosApi.listMembers(),
        kudosApi.listCategories(),
      ]);
      setMembers(m);
      setCategories(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error al cargar miembros y categorías');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo<MembersCategoriesContext>(
    () => ({ members, categories, loading, error, reload: load }),
    [members, categories, loading, error, load],
  );

  return <ctx.Provider value={value}>{children}</ctx.Provider>;
}

export function useMembersCategories(): MembersCategoriesContext {
  const value = useContext(ctx);
  if (!value) {
    throw new Error('useMembersCategories must be used inside MembersCategoriesProvider');
  }
  return value;
}
