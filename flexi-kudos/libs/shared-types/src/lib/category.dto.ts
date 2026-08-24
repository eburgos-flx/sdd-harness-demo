export type CategoryKey =
  | 'teamwork'
  | 'ownership'
  | 'innovation'
  | 'delivery'
  | 'kindness'
  | 'learning';

export const CATEGORY_KEYS: readonly CategoryKey[] = [
  'teamwork',
  'ownership',
  'innovation',
  'delivery',
  'kindness',
  'learning',
] as const;

export interface CategoryDto {
  key: CategoryKey;
  label: string;
}
