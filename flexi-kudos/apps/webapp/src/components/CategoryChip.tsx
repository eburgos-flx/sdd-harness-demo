import type { CategoryDto, CategoryKey } from '@shared-types';

const CATEGORY_COLORS: Record<CategoryKey, { bg: string; fg: string }> = {
  teamwork: { bg: '#dbeafe', fg: '#1e3a8a' },
  ownership: { bg: '#fef3c7', fg: '#92400e' },
  innovation: { bg: '#ede9fe', fg: '#5b21b6' },
  delivery: { bg: '#dcfce7', fg: '#166534' },
  kindness: { bg: '#fce7f3', fg: '#9d174d' },
  learning: { bg: '#e0f2fe', fg: '#075985' },
};

export function CategoryChip({ category }: { category: CategoryDto }) {
  const colors = CATEGORY_COLORS[category.key];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.15rem 0.6rem',
        borderRadius: '999px',
        background: colors.bg,
        color: colors.fg,
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
      }}
    >
      {category.label}
    </span>
  );
}
