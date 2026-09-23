import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { CheckResult, DecodedJwt, DecodedSaml, DetectedType, ValidationConfig } from './lib/types';
import { detectTokenType } from './lib/detect';
import { decodeSaml } from './lib/saml';
import { decodeJwt } from './lib/jwt';
import { runSamlChecks } from './lib/checks/samlChecks';
import { runJwtChecks } from './lib/checks/jwtChecks';
import { useLocalStorage, useNow, useTheme } from './lib/hooks';

import { Header } from './components/Header';
import { TokenInput } from './components/TokenInput';
import { ValidationConfigPanel } from './components/ValidationConfig';
import { CheckResultList, VerdictBanner } from './components/CheckResultList';
import { JwtDecoded, RawView, SamlDecoded } from './components/DecodedView';
import { EmptyState } from './components/EmptyState';
import { XCircleIcon } from './components/icons';

const DEFAULT_CONFIG: ValidationConfig = {
  expectedAudience: '',
  expectedAcsUrl: '',
  expectedIssuer: '',
  clockSkewSeconds: 180,
};

type Decoded =
  | { kind: 'saml'; saml: DecodedSaml }
  | { kind: 'jwt'; jwt: DecodedJwt }
  | { kind: 'error'; message: string }
  | { kind: 'empty' };

type Tab = 'checks' | 'decoded' | 'raw';

function decode(input: string, type: DetectedType): Decoded {
  if (!input.trim()) return { kind: 'empty' };
  try {
    if (type === 'saml') return { kind: 'saml', saml: decodeSaml(input) };
    if (type === 'jwt') return { kind: 'jwt', jwt: decodeJwt(input) };
    if (type === 'jwe') {
      return {
        kind: 'error',
        message: 'This is an encrypted JWT (JWE). Its claims cannot be read without the recipient private key. Ask the IdP for a signed-only token, or inspect it after your app decrypts it.',
      };
    }
    return {
      kind: 'error',
      message: 'Could not recognize this input. Paste a base64 SAMLResponse, raw SAML XML, or a JWT (three base64url parts separated by dots).',
    };
  } catch (e) {
    return { kind: 'error', message: e instanceof Error ? e.message : 'The token could not be decoded.' };
  }
}

export default function App() {
  const [theme, setTheme] = useTheme();
  const [input, setInput] = useState('');
  const [config, setConfig] = useLocalStorage<ValidationConfig>('config', DEFAULT_CONFIG);
  const [tab, setTab] = useState<Tab>('checks');
  const now = useNow();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Keep typing responsive with very large SAML payloads
  const deferredInput = useDeferredValue(input);
  const detectedType = useMemo(() => detectTokenType(deferredInput), [deferredInput]);
  const decoded = useMemo(() => decode(deferredInput, detectedType), [deferredInput, detectedType]);

  const results: CheckResult[] = useMemo(() => {
    if (decoded.kind === 'saml') return runSamlChecks(decoded.saml, config, now);
    if (decoded.kind === 'jwt') return runJwtChecks(decoded.jwt, config, now);
    return [];
  }, [decoded, config, now]);

  // Show the diagnosis first whenever a new token is loaded
  useEffect(() => setTab('checks'), [deferredInput]);

  // "/" focuses the input from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(target.tagName) && !target.isContentEditable) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const rawContent =
    decoded.kind === 'saml'
      ? decoded.saml.prettyXml
      : decoded.kind === 'jwt'
        ? `// Header\n${JSON.stringify(decoded.jwt.header, null, 2)}\n\n// Payload\n${JSON.stringify(decoded.jwt.payload, null, 2)}`
        : '';

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'checks', label: 'Diagnosis' },
    { id: 'decoded', label: 'Decoded' },
    { id: 'raw', label: decoded.kind === 'saml' ? 'XML' : 'JSON' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header theme={theme} onThemeChange={setTheme} />

      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:py-8">
        <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          <TokenInput ref={inputRef} value={input} onChange={setInput} detectedType={detectedType} />
          <ValidationConfigPanel config={config} onChange={setConfig} detectedType={detectedType} />
          <p className="hidden text-xs text-zinc-500 lg:block">
            Press{' '}
            <kbd className="rounded border border-zinc-300 bg-white px-1 font-mono text-[11px] dark:border-zinc-700 dark:bg-zinc-900">/</kbd> to focus the
            input. Settings are saved in this browser. Tokens are never saved.
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {decoded.kind === 'empty' && <EmptyState />}

          {decoded.kind === 'error' && (
            <div
              role="alert"
              className="animate-fade-in flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 dark:border-rose-500/25 dark:bg-rose-500/5 dark:text-rose-300"
            >
              <XCircleIcon className="mt-0.5 size-5 shrink-0" />
              <div>
                <h2 className="font-semibold">Couldn't decode this input</h2>
                <p className="mt-0.5 text-sm">{decoded.message}</p>
              </div>
            </div>
          )}

          {(decoded.kind === 'saml' || decoded.kind === 'jwt') && (
            <>
              <VerdictBanner results={results} kind={decoded.kind === 'saml' ? 'SAML' : 'JWT'} />

              <div role="tablist" aria-label="Result views" className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    role="tab"
                    type="button"
                    id={`tab-${t.id}`}
                    aria-selected={tab === t.id}
                    aria-controls="result-panel"
                    onClick={() => setTab(t.id)}
                    className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
                      tab === t.id
                        ? 'border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300'
                        : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div role="tabpanel" id="result-panel" aria-labelledby={`tab-${tab}`} key={tab} className="animate-fade-in">
                {tab === 'checks' && <CheckResultList results={results} />}
                {tab === 'decoded' && decoded.kind === 'saml' && <SamlDecoded saml={decoded.saml} now={now} />}
                {tab === 'decoded' && decoded.kind === 'jwt' && <JwtDecoded jwt={decoded.jwt} now={now} />}
                {tab === 'raw' && <RawView title={decoded.kind === 'saml' ? 'Decoded XML (formatted)' : 'Decoded JSON'} content={rawContent} />}
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-zinc-200 px-4 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800">
        SSO Doctor · runs entirely in your browser · signatures are checked for presence, not verified cryptographically
      </footer>
    </div>
  );
}
