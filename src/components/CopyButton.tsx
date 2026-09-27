import { useCopy } from '../lib/hooks';
import { CheckIcon, CopyIcon } from './icons';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({ text, label, className = '' }: CopyButtonProps) {
  const [copied, copy] = useCopy();
  return (
    <button
      type="button"
      onClick={() => copy(text)}
      title={copied ? 'Copied' : 'Copy'}
      aria-label={copied ? 'Copied' : `Copy${label ? ` ${label}` : ''}`}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-900/[0.05] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white ${className}`}
    >
      {copied ? <CheckIcon className="size-3.5 text-brand-500" /> : <CopyIcon className="size-3.5" />}
      {label && <span className={copied ? 'text-brand-600 dark:text-brand-400' : ''}>{copied ? 'Copied' : label}</span>}
    </button>
  );
}
