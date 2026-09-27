import { useId, useState } from 'react';
import type { DetectedType, ValidationConfig } from '../lib/types';
import { ChevronDownIcon, SettingsIcon } from './icons';
import { Panel, Tag } from './ui';

interface ValidationConfigProps {
  config: ValidationConfig;
  onChange: (config: ValidationConfig) => void;
  detectedType: DetectedType;
}

export const MAX_SKEW = 3600;

const inputCls =
  'w-full rounded-lg border-0 bg-zinc-900/[0.03] px-3 py-2 font-mono text-[12.5px] ring-1 ring-zinc-900/10 transition ring-inset placeholder:font-sans placeholder:text-zinc-400 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none dark:bg-white/[0.03] dark:ring-white/10 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950 dark:focus:ring-brand-400';

function Field({ label, code, hint, value, onChange, placeholder }: { label: string; code?: string; hint: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {label}
        {code && <code className="font-mono text-[11px] text-zinc-400">{code}</code>}
      </label>
      <input id={id} type="text" spellCheck={false} className={inputCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      <p className="text-[11px] text-zinc-500">{hint}</p>
    </div>
  );
}

function SkewField({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const id = useId();
  // Keep the raw text so the field can be cleared while typing without snapping to 0
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Allowed clock skew
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_SKEW}
          step={30}
          className={`${inputCls} w-28 tabular-nums`}
          value={draft ?? String(value)}
          onChange={(e) => {
            setDraft(e.target.value);
            const n = Number.parseInt(e.target.value, 10);
            if (Number.isFinite(n)) onChange(Math.max(0, Math.min(MAX_SKEW, n)));
          }}
          onBlur={() => setDraft(null)}
        />
        <span className="text-sm text-zinc-500">seconds</span>
      </div>
      <p className="text-[11px] text-zinc-500">Tolerance for time checks (most SPs use 60–300s)</p>
    </div>
  );
}

export function ValidationConfigPanel({ config, onChange, detectedType }: ValidationConfigProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const isJwt = detectedType === 'jwt';
  const active = [config.expectedAudience, config.expectedIssuer, isJwt ? '' : config.expectedAcsUrl].filter((v) => v.trim()).length;

  return (
    <Panel>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded(!expanded)}
        className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-zinc-900/[0.02] dark:hover:bg-white/[0.02]"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-zinc-900/[0.04] text-zinc-600 ring-1 ring-zinc-900/10 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10">
          <SettingsIcon className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold">Validation settings</span>
          <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">Compare the token with what your app expects</span>
        </span>
        <span className="ml-auto flex items-center gap-2">
          {active > 0 ? <Tag tone="brand">{active} set</Tag> : <Tag>optional</Tag>}
          <ChevronDownIcon className={`size-4 shrink-0 text-zinc-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {expanded && (
        <div id={panelId} className="grid animate-fade-in grid-cols-1 gap-4 border-t border-zinc-900/[0.06] p-4 sm:grid-cols-2 dark:border-white/[0.06]">
          <Field
            label={isJwt ? 'Expected audience' : 'Expected audience / SP Entity ID'}
            code={isJwt ? 'aud' : undefined}
            hint={isJwt ? 'Your client ID or API identifier' : 'The SP Entity ID the IdP should target'}
            placeholder={isJwt ? 'my-client-id' : 'https://app.example.com/saml/metadata'}
            value={config.expectedAudience}
            onChange={(v) => onChange({ ...config, expectedAudience: v })}
          />
          <Field
            label={isJwt ? 'Expected issuer' : 'Expected issuer / IdP Entity ID'}
            code={isJwt ? 'iss' : undefined}
            hint="Must match exactly, including trailing slash"
            placeholder={isJwt ? 'https://login.example.com/' : 'https://idp.example.com/saml'}
            value={config.expectedIssuer}
            onChange={(v) => onChange({ ...config, expectedIssuer: v })}
          />
          {!isJwt && (
            <Field
              label="Expected ACS URL"
              hint="Compared with Recipient and Destination"
              placeholder="https://app.example.com/saml/acs"
              value={config.expectedAcsUrl}
              onChange={(v) => onChange({ ...config, expectedAcsUrl: v })}
            />
          )}
          <SkewField value={config.clockSkewSeconds} onChange={(n) => onChange({ ...config, clockSkewSeconds: n })} />
        </div>
      )}
    </Panel>
  );
}
