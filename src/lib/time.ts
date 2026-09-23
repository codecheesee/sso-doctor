const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
];

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

/** Human-friendly relative time such as "in 5 minutes" or "2 years ago". */
export function relativeTime(date: Date, now: Date = new Date()): string {
  const diff = (date.getTime() - now.getTime()) / 1000;
  const abs = Math.abs(diff);
  for (const [unit, secs] of UNITS) {
    if (abs >= secs || unit === 'second') {
      return rtf.format(Math.round(diff / secs), unit);
    }
  }
  return '';
}

/** Parses an ISO date string; returns null when missing or invalid. */
export function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function describeDate(date: Date, now: Date = new Date()): string {
  return `${date.toISOString()} (${relativeTime(date, now)})`;
}

/** Formats a duration in seconds as e.g. "1h 30m". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.abs(Math.round(totalSeconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [d && `${d}d`, h && `${h}h`, m && `${m}m`, !d && !h && sec && `${sec}s`].filter(Boolean);
  return parts.length ? parts.join(' ') : '0s';
}
