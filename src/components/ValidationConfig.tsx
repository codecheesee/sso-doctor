import { useId, useState } from 'react';
import type { DetectedType, ValidationConfig } from '../lib/types';
import { ChevronDownIcon, SettingsIcon } from './icons';

interface ValidationConfigProps {
  config: ValidationConfig;
  onChange: (config: ValidationConfig) => void;
  detectedType: DetectedType;
}

const inputCls =
  'w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm shadow-xs placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:placeholder:text-zinc-600';

function Field({ label, hint, value, onChange, placeholder }: { label: string; hint: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <input id={id} type="text" spellCheck={false} className={inputCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      <p className="text-[11px] text-zinc-500">{hint}</p>
    </div>
  );
}

export function ValidationConfigPanel({ config, onChange, detectedType }: ValidationConfigProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const skewId = useId();
  const isJwt = detectedType === 'jwt';
  const active = [config.expectedAudience, config.expectedIssuer, isJwt ? '' : config.expectedAcsUrl].filter((v) => v.trim()).length;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      >
        <SettingsIcon className="shrink-0 text-zinc-500" />
        Validation settings
        <span className="truncate text-xs font-normal text-zinc-500 dark:text-zinc-400">
          {active ? `${active} expected value${active > 1 ? 's' : ''} set` : 'optional'}
        </span>
        <ChevronDownIcon className={`ml-auto shrink-0 text-zinc-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div id={panelId} className="grid animate-fade-in grid-cols-1 gap-4 border-t border-zinc-100 p-3 sm:grid-cols-2 dark:border-zinc-800">
          <Field
            label={isJwt ? 'Expected audience (aud)' : 'Expected audience / SP Entity ID'}
            hint={isJwt ? 'Your client ID or API identifier' : 'The SP Entity ID the IdP should target'}
            placeholder={isJwt ? 'my-client-id' : 'https://app.example.com/saml/metadata'}
            value={config.expectedAudience}
            onChange={(v) => onChange({ ...config, expectedAudience: v })}
          />
          <Field
            label={isJwt ? 'Expected issuer (iss)' : 'Expected issuer / IdP Entity ID'}
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
          <div className="flex flex-col gap-1">
            <label htmlFor={skewId} className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Allowed clock skew
            </label>
            <div className="flex items-center gap-2">
              <input
                id={skewId}
                type="number"
                min={0}
                max={3600}
                step={30}
                className={`${inputCls} w-28 tabular-nums`}
                value={config.clockSkewSeconds}
                onChange={(e) => {
                  const n = Math.max(0, Math.min(3600, Number.parseInt(e.target.value, 10) || 0));
                  onChange({ ...config, clockSkewSeconds: n });
                }}
              />
              <span className="text-sm text-zinc-500">seconds</span>
            </div>
            <p className="text-[11px] text-zinc-500">Tolerance for time checks (most SPs use 60–300s)</p>
          </div>
        </div>
      )}
    </section>
  );
}
