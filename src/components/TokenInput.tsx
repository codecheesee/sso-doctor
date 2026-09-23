import { useState, type DragEvent, type Ref } from 'react';
import type { DetectedType } from '../lib/types';
import { SAMPLES } from '../lib/samples';
import { ClipboardIcon, TrashIcon, UploadIcon } from './icons';

interface TokenInputProps {
  value: string;
  onChange: (value: string) => void;
  detectedType: DetectedType;
  ref?: Ref<HTMLTextAreaElement>;
}

const TYPE_BADGE: Record<DetectedType, { label: string; className: string }> = {
  saml: { label: 'SAML Response', className: 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/25' },
  jwt: { label: 'JWT', className: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/25' },
  jwe: { label: 'JWE (encrypted)', className: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/25' },
  unknown: { label: 'Unrecognized', className: 'bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-400/20' },
};

const btn =
  'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100';

export function TokenInput({ value, onChange, detectedType, ref }: TokenInputProps) {
  const [dragging, setDragging] = useState(false);
  const [pasteError, setPasteError] = useState(false);
  const badge = value.trim() ? TYPE_BADGE[detectedType] : null;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onChange(text);
      setPasteError(false);
    } catch {
      setPasteError(true);
    }
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      onChange(await file.text());
      return;
    }
    const text = e.dataTransfer.getData('text');
    if (text) onChange(text);
  };

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
        <label htmlFor="token-input" className="text-sm font-medium">
          Token
        </label>
        {badge && (
          <span className={`animate-fade-in rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${badge.className}`}>
            {badge.label}
          </span>
        )}
        <div className="ml-auto flex items-center gap-0.5">
          <button type="button" onClick={handlePaste} className={btn}>
            <ClipboardIcon /> Paste
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')} className={`${btn} hover:text-rose-600 dark:hover:text-rose-400`}>
              <TrashIcon /> Clear
            </button>
          )}
        </div>
      </div>

      <div
        className="relative"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <textarea
          id="token-input"
          ref={ref}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          className="block h-56 w-full resize-y bg-transparent p-3 font-mono text-[12.5px] leading-relaxed break-all text-zinc-800 placeholder:text-zinc-400 focus:outline-none lg:h-72 dark:text-zinc-200 dark:placeholder:text-zinc-500"
          placeholder={'Paste a SAMLResponse (base64 or XML) or a JWT…\n\nAlso accepts "Bearer …" headers, SAMLResponse=… form bodies and URL-encoded values. You can drop a file here too.'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {dragging && (
          <div className="pointer-events-none absolute inset-2 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-indigo-400 bg-indigo-50/90 text-sm font-medium text-indigo-700 dark:bg-indigo-950/90 dark:text-indigo-300">
            <UploadIcon className="size-6" />
            Drop file to load
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Try a sample:</span>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLES.map((s) => (
            <button
              key={s.id}
              type="button"
              title={s.description}
              onClick={() => onChange(s.build())}
              className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
            >
              {s.label}
            </button>
          ))}
        </div>
        {value && <span className="ml-auto text-[11px] text-zinc-400 tabular-nums">{value.length.toLocaleString()} chars</span>}
      </div>
      {pasteError && (
        <p className="border-t border-zinc-100 px-3 py-2 text-xs text-amber-700 dark:border-zinc-800 dark:text-amber-400">
          Clipboard access was blocked. Press Ctrl/⌘+V in the box instead.
        </p>
      )}
    </section>
  );
}
