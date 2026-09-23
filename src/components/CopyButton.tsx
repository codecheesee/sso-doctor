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
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 ${className}`}
    >
      {copied ? <CheckIcon className="text-emerald-500" /> : <CopyIcon />}
      {label && <span>{copied ? 'Copied' : label}</span>}
    </button>
  );
}
