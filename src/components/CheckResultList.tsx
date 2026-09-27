import { useMemo, useState } from 'react';
import type { CheckResult, CheckStatus } from '../lib/types';
import type { ValidityWindow } from '../lib/timeline';
import { formatDuration } from '../lib/time';
import { CheckResultItem, STATUS_STYLE } from './CheckResult';
import { CopyButton } from './CopyButton';
import { ClockIcon } from './icons';
import { Eyebrow, Panel, STATUS_TONE, Tag } from './ui';

const ORDER: CheckStatus[] = ['FAIL', 'WARN', 'INFO', 'PASS'];

function buildReport(results: CheckResult[], kind: string): string {
  const lines = [`SSO Doctor report (${kind}), ${new Date().toISOString()}`, ''];
  for (const status of ORDER) {
    for (const r of results.filter((x) => x.status === status)) {
      const fix = r.fix && (status === 'FAIL' || status === 'WARN') ? `\n       Fix: ${r.fix}` : '';
      lines.push(`[${r.status}] ${r.title}: ${r.cause}${fix}`);
    }
  }
  return lines.join('\n');
}

function countByStatus(results: CheckResult[]): Record<CheckStatus, number> {
  const c: Record<CheckStatus, number> = { FAIL: 0, WARN: 0, INFO: 0, PASS: 0 };
  results.forEach((r) => c[r.status]++);
  return c;
}

/** Donut showing the share of each status, with "passed / scored" in the middle. */
function HealthRing({ counts }: { counts: Record<CheckStatus, number> }) {
  const total = ORDER.reduce((n, s) => n + counts[s], 0);
  const scored = counts.PASS + counts.WARN + counts.FAIL;
  const r = 30;
  const c = 2 * Math.PI * r;
  const gap = total > 1 ? 3 : 0;
  let offset = 0;

  return (
    <div className="relative size-[76px] shrink-0">
      <svg viewBox="0 0 76 76" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="38" cy="38" r={r} fill="none" strokeWidth="7" className="stroke-zinc-900/[0.06] dark:stroke-white/[0.08]" />
        {ORDER.filter((s) => counts[s] > 0).map((s) => {
          const len = (counts[s] / total) * c;
          const seg = (
            <circle
              key={s}
              cx="38"
              cy="38"
              r={r}
              fill="none"
              stroke={STATUS_STYLE[s].hex}
              strokeWidth="7"
              strokeDasharray={`${Math.max(len - gap, 0.5)} ${c}`}
              strokeDashoffset={-offset}
              className="transition-[stroke-dasharray] duration-500"
            />
          );
          offset += len;
          return seg;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[17px] leading-none font-semibold tabular-nums">
          {counts.PASS}
          <span className="text-zinc-400">/{scored}</span>
        </span>
        <span className="mt-0.5 font-mono text-[9px] tracking-wider text-zinc-500 uppercase">passed</span>
      </div>
    </div>
  );
}

function ValidityTimeline({ window: w, now }: { window: ValidityWindow; now: Date }) {
  const t = now.getTime();
  const start = w.start?.getTime() ?? w.end!.getTime();
  const end = w.end!.getTime();
  const lo = Math.min(start, t);
  const hi = Math.max(end, t);
  const pad = Math.max((hi - lo) * 0.06, 1000);
  const span = hi - lo + pad * 2;
  const pct = (ms: number) => ((ms - lo + pad) / span) * 100;

  const expired = t >= end;
  const early = t < start;
  const status = expired
    ? { text: `Expired ${formatDuration((t - end) / 1000)} ago`, cls: 'text-rose-600 dark:text-rose-400' }
    : early
      ? { text: `Valid in ${formatDuration((start - t) / 1000)}`, cls: 'text-amber-600 dark:text-amber-400' }
      : { text: `Valid for ${formatDuration((end - t) / 1000)}`, cls: 'text-brand-700 dark:text-brand-300' };

  const left = pct(start);
  const width = Math.max(pct(end) - left, 1.5);

  return (
    <div className="border-t border-zinc-900/[0.06] px-4 pt-3.5 pb-4 sm:px-5 dark:border-white/[0.06]">
      <div className="flex items-center gap-2">
        <ClockIcon className="size-4 text-zinc-400" />
        <Eyebrow>Validity window</Eyebrow>
        <span className={`ml-auto text-xs font-semibold tabular-nums ${status.cls}`}>{status.text}</span>
      </div>

      <div className="relative mt-4 mb-1 h-2 rounded-full bg-zinc-900/[0.05] dark:bg-white/[0.06]" role="img" aria-label={status.text}>
        <div
          className={`absolute inset-y-0 rounded-full ${expired || early ? 'bg-zinc-400/60 dark:bg-zinc-500/60' : 'bg-gradient-to-r from-brand-400 to-teal-400'}`}
          style={{ left: `${left}%`, width: `${width}%` }}
        />
        {w.marks.map((m) => (
          <span key={m.label} className="absolute top-1/2 h-3.5 w-px -translate-y-1/2 bg-zinc-500/70" style={{ left: `${pct(m.date.getTime())}%` }} />
        ))}
        <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${pct(t)}%` }}>
          <span className={`block size-3.5 rounded-full border-2 border-white shadow dark:border-zinc-900 ${expired ? 'bg-rose-500' : early ? 'bg-amber-500' : 'bg-brand-500'}`} />
          <span className="absolute top-full left-1/2 mt-1 -translate-x-1/2 font-mono text-[9.5px] font-semibold tracking-wider text-zinc-500 uppercase">now</span>
        </span>
      </div>

      <dl className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5">
        {w.marks.map((m) => (
          <div key={m.label} className="flex items-baseline gap-1.5">
            <dt className="font-mono text-[11px] text-zinc-500">{m.label}</dt>
            <dd className="text-xs font-medium tabular-nums">
              {m.date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function VerdictBanner({ results, kind, window: w, now }: { results: CheckResult[]; kind: string; window: ValidityWindow | null; now: Date }) {
  const counts = useMemo(() => countByStatus(results), [results]);
  const report = buildReport(results, kind);

  const verdict =
    counts.FAIL > 0
      ? { title: `${counts.FAIL} problem${counts.FAIL > 1 ? 's' : ''} found`, sub: 'This token will likely be rejected. Start with the failures below.', glow: 'from-rose-500/[0.12]', tone: 'rose' as const, word: 'Failing' }
      : counts.WARN > 0
        ? { title: 'Looks OK, with warnings', sub: 'No blocking issues, but strict SPs or libraries may still reject it.', glow: 'from-amber-400/[0.14]', tone: 'amber' as const, word: 'Warnings' }
        : { title: 'Healthy', sub: 'All structural and time checks passed.', glow: 'from-brand-400/[0.14]', tone: 'brand' as const, word: 'Healthy' };

  return (
    <Panel className="relative animate-fade-in overflow-hidden">
      <div aria-hidden="true" className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${verdict.glow} via-transparent to-transparent`} />
      <div className="relative flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
        <HealthRing counts={counts} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 pr-9 sm:pr-0">
            <Eyebrow>{kind} diagnosis</Eyebrow>
            <Tag tone={verdict.tone}>{verdict.word}</Tag>
          </div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight" aria-live="polite">
            {verdict.title}
          </h2>
          <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{verdict.sub}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {ORDER.filter((s) => counts[s] > 0).map((s) => (
              <Tag key={s} tone={STATUS_TONE[s]} className="tabular-nums">
                {counts[s]} {STATUS_STYLE[s].plural}
              </Tag>
            ))}
          </div>
        </div>
        <span className="hidden sm:block">
          <CopyButton text={report} label="Copy report" className="ring-1 ring-zinc-900/10 dark:ring-white/10" />
        </span>
        <span className="absolute top-3 right-3 sm:hidden">
          <CopyButton text={report} className="ring-1 ring-zinc-900/10 dark:ring-white/10" />
        </span>
      </div>
      {w && <ValidityTimeline window={w} now={now} />}
    </Panel>
  );
}

export function CheckResultList({ results }: { results: CheckResult[] }) {
  const [filter, setFilter] = useState<CheckStatus | 'ALL'>('ALL');

  const sorted = useMemo(() => [...results].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status)), [results]);
  const present = ORDER.filter((s) => results.some((r) => r.status === s));
  const activeFilter = filter !== 'ALL' && !present.includes(filter) ? 'ALL' : filter;
  const visible = activeFilter === 'ALL' ? sorted : sorted.filter((r) => r.status === activeFilter);

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Filter checks" className="flex flex-wrap gap-1.5">
        {(['ALL', ...present] as const).map((t) => {
          const n = t === 'ALL' ? results.length : results.filter((r) => r.status === t).length;
          const active = activeFilter === t;
          return (
            <button
              key={t}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(t)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 transition ring-inset ${
                active
                  ? 'bg-zinc-900 text-white ring-zinc-900 dark:bg-white dark:text-zinc-900 dark:ring-white'
                  : 'text-zinc-600 ring-zinc-900/10 hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:text-zinc-400 dark:ring-white/10 dark:hover:bg-white/5 dark:hover:text-white'
              }`}
            >
              {t !== 'ALL' && <span className={`size-1.5 rounded-full ${STATUS_STYLE[t].bar}`} />}
              {t === 'ALL' ? 'All' : STATUS_STYLE[t].label}
              <span className="font-mono text-[11px] tabular-nums opacity-60">{n}</span>
            </button>
          );
        })}
      </div>
      <ul className="flex flex-col gap-2">
        {visible.map((r, i) => (
          <CheckResultItem key={r.id} result={r} index={i} />
        ))}
      </ul>
    </div>
  );
}
