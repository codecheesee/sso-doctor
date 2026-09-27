import { useId, type HTMLAttributes, type PointerEvent, type ReactNode } from 'react';
import type { CheckStatus } from '../lib/types';

/* ---------- Tag: mono, uppercase protocol-style label ---------- */

export type TagTone = 'brand' | 'rose' | 'amber' | 'sky' | 'violet' | 'zinc';

const TAG_TONES: Record<TagTone, string> = {
  brand: 'bg-brand-400/10 text-brand-700 ring-brand-500/25 dark:text-brand-300 dark:ring-brand-400/25',
  rose: 'bg-rose-400/10 text-rose-600 ring-rose-500/25 dark:text-rose-300 dark:ring-rose-400/25',
  amber: 'bg-amber-400/10 text-amber-700 ring-amber-500/30 dark:text-amber-300 dark:ring-amber-400/25',
  sky: 'bg-sky-400/10 text-sky-700 ring-sky-500/25 dark:text-sky-300 dark:ring-sky-400/25',
  violet: 'bg-violet-400/10 text-violet-700 ring-violet-500/25 dark:text-violet-300 dark:ring-violet-400/25',
  zinc: 'bg-zinc-400/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-300 dark:ring-zinc-400/20',
};

/* Always-dark surfaces (code panels) use the dark palette regardless of theme */
const TAG_TONES_ON_DARK: Record<TagTone, string> = {
  brand: 'bg-brand-400/10 text-brand-300 ring-brand-400/25',
  rose: 'bg-rose-400/10 text-rose-300 ring-rose-400/25',
  amber: 'bg-amber-400/10 text-amber-300 ring-amber-400/25',
  sky: 'bg-sky-400/10 text-sky-300 ring-sky-400/25',
  violet: 'bg-violet-400/10 text-violet-300 ring-violet-400/25',
  zinc: 'bg-zinc-400/10 text-zinc-300 ring-zinc-400/20',
};

export const STATUS_TONE: Record<CheckStatus, TagTone> = { FAIL: 'rose', WARN: 'amber', INFO: 'sky', PASS: 'brand' };

export function Tag({ tone = 'zinc', onDark = false, children, className = '' }: { tone?: TagTone; onDark?: boolean; children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10.5px] leading-4 font-semibold tracking-wide uppercase ring-1 ring-inset ${(onDark ? TAG_TONES_ON_DARK : TAG_TONES)[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`font-mono text-[11px] font-medium tracking-[0.14em] text-zinc-500 uppercase dark:text-zinc-400 ${className}`}>{children}</p>;
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-zinc-200 bg-white px-1 font-mono text-[11px] text-zinc-600 shadow-[0_1px_0_rgb(0_0_0/0.06)] dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
      {children}
    </kbd>
  );
}

/* ---------- Panel: the standard card surface ---------- */

export const panelCls =
  'rounded-2xl bg-white ring-1 ring-zinc-950/[0.07] shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(0_0_0/0.08)] dark:bg-zinc-900/60 dark:ring-white/[0.08] dark:shadow-none';

export function Panel({ className = '', children, ...rest }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section className={`${panelCls} ${className}`} {...rest}>
      {children}
    </section>
  );
}

/* ---------- Icon badge: an icon in a soft ring ---------- */

export function IconBadge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-900/[0.04] ring-1 ring-zinc-900/10 transition group-hover:bg-brand-500/10 group-hover:ring-brand-500/30 dark:bg-white/[0.06] dark:ring-white/15 dark:group-hover:bg-brand-400/10 dark:group-hover:ring-brand-400/30 ${className}`}
    >
      {children}
    </span>
  );
}

/* ---------- Grid pattern: SVG lines with a few highlighted cells ---------- */

export function GridPattern({ size = 44, squares = [], className = '' }: { size?: number; squares?: Array<[number, number]>; className?: string }) {
  // React ids contain characters that are awkward inside url(#…)
  const id = `grid-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg aria-hidden="true" className={className}>
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse" x="50%" y={-1}>
          <path d={`M.5 ${size}V.5H${size}`} fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
      <svg x="50%" y={-1} className="overflow-visible">
        {squares.map(([x, y]) => (
          <rect key={`${x}-${y}`} strokeWidth={0} width={size + 1} height={size + 1} x={x * size} y={y * size} />
        ))}
      </svg>
    </svg>
  );
}

/* ---------- Spotlight: a soft glow that follows the pointer ---------- */

function trackPointer(e: PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
}

export function Spotlight({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div onPointerMove={trackPointer} className={`group relative isolate overflow-hidden ${className}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{ background: 'radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), rgb(16 185 129 / 0.12), transparent 70%)' }}
      />
      {children}
    </div>
  );
}
