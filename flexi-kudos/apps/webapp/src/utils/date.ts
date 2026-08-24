const rtf = new Intl.RelativeTimeFormat('es-AR', { numeric: 'auto' });
const absoluteFmt = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  dateStyle: 'medium',
  timeStyle: 'short',
});

const UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; seconds: number }> = [
  { unit: 'year', seconds: 60 * 60 * 24 * 365 },
  { unit: 'month', seconds: 60 * 60 * 24 * 30 },
  { unit: 'week', seconds: 60 * 60 * 24 * 7 },
  { unit: 'day', seconds: 60 * 60 * 24 },
  { unit: 'hour', seconds: 60 * 60 },
  { unit: 'minute', seconds: 60 },
  { unit: 'second', seconds: 1 },
];

export function formatRelativeAr(
  iso: string,
  now: Date = new Date(),
): string {
  const target = new Date(iso);
  const deltaSeconds = Math.round((target.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(deltaSeconds);
  if (abs < 30) return 'hace un momento';
  for (const { unit, seconds } of UNITS) {
    if (abs >= seconds) {
      const value = Math.round(deltaSeconds / seconds);
      return rtf.format(value, unit);
    }
  }
  return 'hace un momento';
}

export function formatAbsoluteAr(iso: string): string {
  return absoluteFmt.format(new Date(iso));
}
