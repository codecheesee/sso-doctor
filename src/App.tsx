import { useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { CheckResult, DecodedJwt, DecodedSaml, DetectedType, ValidationConfig } from './lib/types';
import { detectTokenType } from './lib/detect';
import { decodeSaml } from './lib/saml';
import { decodeJwt } from './lib/jwt';
import { runSamlChecks } from './lib/checks/samlChecks';
import { runJwtChecks } from './lib/checks/jwtChecks';
import { jwtWindow, samlWindow } from './lib/timeline';
import { useLocalStorage, useNow, useTheme } from './lib/hooks';

import { Header, HeroBackdrop, Intro } from './components/Header';
import { TokenInput } from './components/TokenInput';
import { MAX_SKEW, ValidationConfigPanel } from './components/ValidationConfig';
import { CheckResultList, VerdictBanner } from './components/CheckResultList';
import { JwtDecoded, RawView, SamlDecoded } from './components/DecodedView';
import { EmptyState } from './components/EmptyState';
import { CodeIcon, GithubIcon, LayersIcon, LockIcon, LogoMark, StethoscopeIcon, XCircleIcon } from './components/icons';
import { Kbd } from './components/ui';

const DEFAULT_CONFIG: ValidationConfig = {
  expectedAudience: '',
  expectedAcsUrl: '',
  expectedIssuer: '',
  clockSkewSeconds: 180,
};

/** Settings come from localStorage, so guard against hand-edited or outdated values. */
function sanitizeConfig(c: ValidationConfig): ValidationConfig {
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  const skew = Number(c.clockSkewSeconds);
  return {
    expectedAudience: str(c.expectedAudience),
    expectedAcsUrl: str(c.expectedAcsUrl),
    expectedIssuer: str(c.expectedIssuer),
    clockSkewSeconds: Number.isFinite(skew) ? Math.max(0, Math.min(MAX_SKEW, Math.round(skew))) : DEFAULT_CONFIG.clockSkewSeconds,
  };
}

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
  const [storedConfig, setConfig] = useLocalStorage<ValidationConfig>('config', DEFAULT_CONFIG);
  const config = useMemo(() => sanitizeConfig(storedConfig), [storedConfig]);
  const [tab, setTab] = useState<Tab>('checks');
  const now = useNow();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ checks: null, decoded: null, raw: null });

  // Keep typing responsive with very large SAML payloads
  const deferredInput = useDeferredValue(input);
  const detectedType = useMemo(() => detectTokenType(deferredInput), [deferredInput]);
  const decoded = useMemo(() => decode(deferredInput, detectedType), [deferredInput, detectedType]);

  const results: CheckResult[] = useMemo(() => {
    if (decoded.kind === 'saml') return runSamlChecks(decoded.saml, config, now);
    if (decoded.kind === 'jwt') return runJwtChecks(decoded.jwt, config, now);
    return [];
  }, [decoded, config, now]);

  const validity = useMemo(
    () => (decoded.kind === 'saml' ? samlWindow(decoded.saml) : decoded.kind === 'jwt' ? jwtWindow(decoded.jwt) : null),
    [decoded],
  );

  // Show the diagnosis first whenever a new token is loaded
  const [lastInput, setLastInput] = useState(deferredInput);
  if (lastInput !== deferredInput) {
    setLastInput(deferredInput);
    setTab('checks');
  }

  // "/" focuses the input from anywhere
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) && !target.isContentEditable) {
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

  const tabs: Array<{ id: Tab; label: string; Icon: typeof CodeIcon }> = [
    { id: 'checks', label: 'Diagnosis', Icon: StethoscopeIcon },
    { id: 'decoded', label: 'Decoded', Icon: LayersIcon },
    { id: 'raw', label: decoded.kind === 'saml' ? 'XML' : 'JSON', Icon: CodeIcon },
  ];

  // WAI-ARIA tabs: arrow keys, Home and End move between tabs
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.findIndex((t) => t.id === tab);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const t = tabs[(next + tabs.length) % tabs.length]!.id;
    setTab(t);
    tabRefs.current[t]?.focus();
  };

  return (
    <div className="relative isolate flex min-h-screen flex-col">
      <HeroBackdrop />
      <Header theme={theme} onThemeChange={setTheme} />
      <Intro />

      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8 lg:py-8">
        <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          <TokenInput ref={inputRef} value={input} onChange={setInput} detectedType={detectedType} />
          <ValidationConfigPanel config={config} onChange={setConfig} detectedType={detectedType} />
          <p className="hidden items-center gap-1.5 text-xs text-zinc-500 lg:flex">
            Press <Kbd>/</Kbd> to focus the input. Settings are saved in this browser; tokens never are.
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {decoded.kind === 'empty' && <EmptyState />}

          {decoded.kind === 'error' && (
            <div role="alert" className="flex animate-fade-in gap-3 rounded-2xl bg-rose-500/[0.06] p-4 ring-1 ring-rose-500/25 dark:bg-rose-500/[0.08]">
              <XCircleIcon className="mt-0.5 size-5 shrink-0 text-rose-500 dark:text-rose-400" />
              <div>
                <h2 className="font-semibold text-rose-700 dark:text-rose-300">Couldn't decode this input</h2>
                <p className="mt-0.5 text-sm text-rose-700/80 dark:text-rose-300/80">{decoded.message}</p>
              </div>
            </div>
          )}

          {(decoded.kind === 'saml' || decoded.kind === 'jwt') && (
            <>
              <VerdictBanner results={results} kind={decoded.kind === 'saml' ? 'SAML' : 'JWT'} window={validity} now={now} />

              <div
                role="tablist"
                aria-label="Result views"
                onKeyDown={onTabKey}
                className="flex w-fit gap-1 rounded-xl bg-zinc-900/[0.04] p-1 ring-1 ring-zinc-900/[0.06] dark:bg-white/[0.04] dark:ring-white/[0.08]"
              >
                {tabs.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    ref={(el) => {
                      tabRefs.current[id] = el;
                    }}
                    role="tab"
                    type="button"
                    id={`tab-${id}`}
                    aria-selected={tab === id}
                    aria-controls="result-panel"
                    tabIndex={tab === id ? 0 : -1}
                    onClick={() => setTab(id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
                      tab === id
                        ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-900/10 dark:bg-zinc-800 dark:text-white dark:ring-white/10'
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                  >
                    <Icon className={`size-4 ${tab === id ? 'text-brand-600 dark:text-brand-400' : ''}`} />
                    {label}
                  </button>
                ))}
              </div>

              <div role="tabpanel" id="result-panel" aria-labelledby={`tab-${tab}`} key={tab} className="animate-fade-in">
                {tab === 'checks' && <CheckResultList results={results} />}
                {tab === 'decoded' && decoded.kind === 'saml' && <SamlDecoded saml={decoded.saml} now={now} />}
                {tab === 'decoded' && decoded.kind === 'jwt' && <JwtDecoded jwt={decoded.jwt} now={now} />}
                {tab === 'raw' && (
                  <RawView
                    title={decoded.kind === 'saml' ? 'Decoded XML (formatted)' : 'Decoded JSON'}
                    lang={decoded.kind === 'saml' ? 'xml' : 'json'}
                    content={rawContent}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="mt-8 border-t border-zinc-900/[0.06] dark:border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-center gap-2">
            <LogoMark className="size-5" />
            <span className="font-medium text-zinc-700 dark:text-zinc-300">SSO Doctor</span>
            <span>· MIT licensed</span>
          </div>
          <p className="inline-flex items-center gap-1.5 sm:mx-auto">
            <LockIcon className="size-3.5" />
            Runs entirely in your browser. Signatures are checked for presence, not verified cryptographically.
          </p>
          <a
            href="https://github.com/codecheesee/sso-doctor"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            <GithubIcon className="size-4" /> Source
          </a>
        </div>
      </footer>
    </div>
  );
}
