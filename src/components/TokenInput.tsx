import { useState, type DragEvent, type Ref } from 'react';
import type { DetectedType } from '../lib/types';
import { SAMPLES } from '../lib/samples';
import { ClipboardIcon, KeyIcon, SparkleIcon, TrashIcon, UploadIcon } from './icons';
import { Tag, type TagTone } from './ui';

interface TokenInputProps {
  value: string;
  onChange: (value: string) => void;
  detectedType: DetectedType;
  ref?: Ref<HTMLTextAreaElement>;
}

const TYPE_TAG: Record<DetectedType, { label: string; tone: TagTone }> = {
  saml: { label: 'SAML Response', tone: 'brand' },
  jwt: { label: 'JWT', tone: 'sky' },
  jwe: { label: 'JWE · encrypted', tone: 'amber' },
  unknown: { label: 'Unrecognized', tone: 'zinc' },
};

const SAMPLE_TONE: Record<string, string> = {
  'jwt-valid': 'bg-brand-400',
  'jwt-none': 'bg-rose-400',
  'saml-expired': 'bg-amber-400',
  'saml-denied': 'bg-rose-400',
};

const toolBtn =
  'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-zinc-400 transition hover:bg-white/[0.07] hover:text-white';

function formatBytes(n: number): string {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
}

export function TokenInput({ value, onChange, detectedType, ref }: TokenInputProps) {
  const [dragging, setDragging] = useState(false);
  const [pasteError, setPasteError] = useState(false);
  const tag = value.trim() ? TYPE_TAG[detectedType] : null;

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
    <section className="overflow-hidden rounded-2xl bg-zinc-900 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.45)] ring-1 ring-zinc-950/10 dark:bg-zinc-900/80 dark:ring-white/10">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-white/[0.07] bg-white/[0.02] px-3 py-2">
        <KeyIcon className="size-4 text-brand-400" />
        <label htmlFor="token-input" className="text-[13px] font-semibold text-white">
          Token
        </label>
        {tag && (
          <Tag tone={tag.tone} onDark className="animate-fade-in">
            {tag.label}
          </Tag>
        )}
        <div className="ml-auto flex items-center gap-0.5">
          <button type="button" onClick={handlePaste} className={toolBtn}>
            <ClipboardIcon className="size-3.5" /> Paste
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')} className={`${toolBtn} hover:text-rose-300`}>
              <TrashIcon className="size-3.5" /> Clear
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
        onDragLeave={(e) => {
          // Ignore leave events fired when moving between children
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={handleDrop}
      >
        <textarea
          id="token-input"
          ref={ref}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          className="scrollbar-thin block h-56 w-full resize-y bg-transparent px-4 py-3 font-mono text-[12.5px] leading-relaxed break-all text-zinc-200 caret-brand-400 placeholder:text-zinc-500 focus:outline-none lg:h-72"
          placeholder={'Paste a SAMLResponse (base64 or XML) or a JWT…\n\nAlso accepts "Bearer …" headers, SAMLResponse=… form bodies, URL-encoded and line-wrapped values. You can drop a file here too.'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {dragging && (
          <div className="pointer-events-none absolute inset-2 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-brand-400/60 bg-zinc-950/85 text-sm font-medium text-brand-300 backdrop-blur-sm">
            <UploadIcon className="size-7" />
            Drop file to load
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold tracking-wider text-zinc-500 uppercase">
          <SparkleIcon className="size-3.5 text-brand-400" /> Samples
        </span>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLES.map((s) => (
            <button
              key={s.id}
              type="button"
              title={s.description}
              onClick={() => onChange(s.build())}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-zinc-300 ring-1 ring-white/10 transition ring-inset hover:bg-brand-400/10 hover:text-brand-200 hover:ring-brand-400/40"
            >
              <span className={`size-1.5 rounded-full ${SAMPLE_TONE[s.id] ?? 'bg-zinc-400'}`} />
              {s.label}
            </button>
          ))}
        </div>
        {value && (
          <span className="ml-auto font-mono text-[11px] text-zinc-500 tabular-nums">
            {value.length.toLocaleString()} chars · {formatBytes(new Blob([value]).size)}
          </span>
        )}
      </div>
      {pasteError && (
        <p role="status" className="border-t border-white/[0.07] px-3 py-2 text-xs text-amber-300">
          Clipboard access was blocked. Press Ctrl/⌘+V in the box instead.
        </p>
      )}
    </section>
  );
}
