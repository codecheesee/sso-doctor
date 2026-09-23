import { useMemo, useState } from 'react';
import type { CheckResult, CheckStatus } from '../lib/types';
import { CheckResultItem, STATUS_STYLE } from './CheckResult';
import { CopyButton } from './CopyButton';
import { AlertTriangleIcon, CheckCircleIcon, XCircleIcon } from './icons';

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

export function VerdictBanner({ results, kind }: { results: CheckResult[]; kind: string }) {
  const counts = useMemo(() => {
    const c: Record<CheckStatus, number> = { FAIL: 0, WARN: 0, INFO: 0, PASS: 0 };
    results.forEach((r) => c[r.status]++);
    return c;
  }, [results]);

  const verdict =
    counts.FAIL > 0
      ? { title: `${counts.FAIL} problem${counts.FAIL > 1 ? 's' : ''} found`, sub: 'This token will likely be rejected. Start with the failures below.', Icon: XCircleIcon, cls: 'from-rose-500/15 text-rose-700 dark:text-rose-300', icon: 'bg-rose-600' }
      : counts.WARN > 0
        ? { title: 'Looks OK, with warnings', sub: 'No blocking issues, but strict SPs or libraries may still reject it.', Icon: AlertTriangleIcon, cls: 'from-amber-500/15 text-amber-800 dark:text-amber-300', icon: 'bg-amber-500' }
        : { title: 'Healthy', sub: 'All structural and time checks passed.', Icon: CheckCircleIcon, cls: 'from-emerald-500/15 text-emerald-700 dark:text-emerald-300', icon: 'bg-emerald-600' };

  return (
    <div className={`animate-fade-in overflow-hidden rounded-xl border border-zinc-200 bg-white bg-gradient-to-r to-transparent to-60% p-4 dark:border-zinc-800 dark:bg-zinc-900 ${verdict.cls}`}>
      <div className="flex items-start gap-3">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-full text-white ${verdict.icon}`}>
          <verdict.Icon className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-wide uppercase opacity-80">{kind} diagnosis</p>
          <h2 className="text-lg font-semibold" aria-live="polite">
            {verdict.title}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{verdict.sub}</p>
        </div>
        <CopyButton text={buildReport(results, kind)} label="Copy report" />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {ORDER.filter((s) => counts[s] > 0).map((s) => (
          <span key={s} className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${STATUS_STYLE[s].chip}`}>
            {counts[s]} {STATUS_STYLE[s].plural}
          </span>
        ))}
      </div>
    </div>
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
      <div role="group" aria-label="Filter checks" className="flex flex-wrap gap-1">
        {(['ALL', ...present] as const).map((t) => {
          const n = t === 'ALL' ? results.length : results.filter((r) => r.status === t).length;
          const active = activeFilter === t;
          return (
            <button
              key={t}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(t)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                active ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              {t === 'ALL' ? 'All' : STATUS_STYLE[t].label} <span className="tabular-nums opacity-60">{n}</span>
            </button>
          );
        })}
      </div>
      <ul className="flex flex-col gap-2">
        {visible.map((r) => (
          <CheckResultItem key={r.id} result={r} />
        ))}
      </ul>
    </div>
  );
}
