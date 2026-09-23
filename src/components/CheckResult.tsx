import type { CheckResult as CheckResultType, CheckStatus } from '../lib/types';
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon, WrenchIcon, XCircleIcon } from './icons';

export const STATUS_STYLE: Record<CheckStatus, { label: string; plural: string; Icon: typeof InfoIcon; icon: string; ring: string; chip: string }> = {
  FAIL: {
    label: 'Fail',
    plural: 'failed',
    Icon: XCircleIcon,
    icon: 'text-rose-600 dark:text-rose-400',
    ring: 'border-rose-200 bg-rose-50/60 dark:border-rose-500/25 dark:bg-rose-500/5',
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  },
  WARN: {
    label: 'Warning',
    plural: 'warnings',
    Icon: AlertTriangleIcon,
    icon: 'text-amber-600 dark:text-amber-400',
    ring: 'border-amber-200 bg-amber-50/60 dark:border-amber-500/25 dark:bg-amber-500/5',
    chip: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  },
  INFO: {
    label: 'Info',
    plural: 'info',
    Icon: InfoIcon,
    icon: 'text-sky-600 dark:text-sky-400',
    ring: 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900',
    chip: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  },
  PASS: {
    label: 'Pass',
    plural: 'passed',
    Icon: CheckCircleIcon,
    icon: 'text-emerald-600 dark:text-emerald-400',
    ring: 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
};

export function CheckResultItem({ result }: { result: CheckResultType }) {
  const s = STATUS_STYLE[result.status];
  const showFix = result.fix && (result.status === 'FAIL' || result.status === 'WARN');

  return (
    <li className={`animate-fade-in flex gap-3 rounded-lg border p-3 ${s.ring}`}>
      <s.Icon className={`mt-0.5 size-5 shrink-0 ${s.icon}`} />
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold">
          <span className="sr-only">{s.label}: </span>
          {result.title}
        </h3>
        <p className="mt-0.5 text-sm leading-relaxed break-words text-zinc-600 dark:text-zinc-400">{result.cause}</p>
        {showFix && (
          <div className="mt-2 flex gap-2 rounded-md bg-white/70 p-2 text-sm text-zinc-700 ring-1 ring-zinc-900/5 dark:bg-zinc-950/40 dark:text-zinc-300 dark:ring-white/5">
            <WrenchIcon className="mt-0.5 size-4 shrink-0 text-zinc-400" />
            <p>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">How to fix: </span>
              {result.fix}
            </p>
          </div>
        )}
        {!showFix && result.fix && <p className="mt-1 text-xs text-zinc-500">{result.fix}</p>}
      </div>
    </li>
  );
}
