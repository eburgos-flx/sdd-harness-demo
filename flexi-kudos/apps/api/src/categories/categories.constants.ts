import type { CategoryDto, CategoryKey } from '@shared-types';

export const CATEGORIES: readonly CategoryDto[] = [
  { key: 'teamwork', label: 'Trabajo en equipo' },
  { key: 'ownership', label: 'Ownership' },
  { key: 'innovation', label: 'Innovación' },
  { key: 'delivery', label: 'Entrega' },
  { key: 'kindness', label: 'Amabilidad' },
  { key: 'learning', label: 'Aprendizaje' },
] as const;

export const CATEGORY_KEYS: readonly CategoryKey[] = CATEGORIES.map((c) => c.key);

export const isValidCategoryKey = (value: unknown): value is CategoryKey =>
  typeof value === 'string' &&
  (CATEGORY_KEYS as readonly string[]).includes(value);
