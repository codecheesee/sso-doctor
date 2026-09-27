import type { CSSProperties } from 'react';
import type { CheckResult as CheckResultType, CheckStatus } from '../lib/types';
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon, WrenchIcon, XCircleIcon } from './icons';
import { STATUS_TONE, Tag } from './ui';

export const STATUS_STYLE: Record<CheckStatus, { label: string; plural: string; Icon: typeof InfoIcon; icon: string; bar: string; hex: string }> = {
  FAIL: { label: 'Fail', plural: 'failed', Icon: XCircleIcon, icon: 'text-rose-500 dark:text-rose-400', bar: 'bg-rose-500', hex: '#f43f5e' },
  WARN: { label: 'Warning', plural: 'warnings', Icon: AlertTriangleIcon, icon: 'text-amber-500 dark:text-amber-400', bar: 'bg-amber-400', hex: '#f59e0b' },
  INFO: { label: 'Info', plural: 'info', Icon: InfoIcon, icon: 'text-sky-500 dark:text-sky-400', bar: 'bg-sky-400', hex: '#38bdf8' },
  PASS: { label: 'Pass', plural: 'passed', Icon: CheckCircleIcon, icon: 'text-brand-500 dark:text-brand-400', bar: 'bg-brand-500', hex: '#10b981' },
};

export function CheckResultItem({ result, index = 0 }: { result: CheckResultType; index?: number }) {
  const s = STATUS_STYLE[result.status];
  const showFix = result.fix && (result.status === 'FAIL' || result.status === 'WARN');
  const muted = result.status === 'PASS' || result.status === 'INFO';

  return (
    <li
      style={{ '--i': index } as CSSProperties}
      className="group relative flex animate-fade-in gap-3 overflow-hidden rounded-xl bg-white p-3.5 pl-4 ring-1 ring-zinc-950/[0.07] transition stagger hover:ring-zinc-950/15 dark:bg-zinc-900/60 dark:ring-white/[0.08] dark:hover:ring-white/15"
    >
      <span aria-hidden="true" className={`absolute inset-y-3 left-0 w-[3px] rounded-r-full ${s.bar} ${muted ? 'opacity-40' : ''}`} />
      <s.Icon className={`mt-0.5 size-5 shrink-0 ${s.icon}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="text-sm font-semibold tracking-tight">
            <span className="sr-only">{s.label}: </span>
            {result.title}
          </h3>
          <Tag tone={STATUS_TONE[result.status]} className="ml-auto">
            {result.status}
          </Tag>
        </div>
        <p className="mt-1 text-[13px] leading-relaxed break-words text-zinc-600 dark:text-zinc-400">{result.cause}</p>
        {showFix && (
          <div className="mt-2.5 flex gap-2.5 rounded-lg bg-zinc-900/[0.03] p-2.5 text-[13px] leading-relaxed text-zinc-700 ring-1 ring-zinc-900/[0.06] ring-inset dark:bg-white/[0.03] dark:text-zinc-300 dark:ring-white/[0.06]">
            <WrenchIcon className="mt-0.5 size-4 shrink-0 text-brand-600 dark:text-brand-400" />
            <p>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">How to fix · </span>
              {result.fix}
            </p>
          </div>
        )}
        {!showFix && result.fix && <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{result.fix}</p>}
      </div>
    </li>
  );
}
