import type { CSSProperties } from 'react';
import { FingerprintIcon, LockIcon, ScanIcon, StethoscopeIcon, WrenchIcon } from './icons';
import { Eyebrow, IconBadge, Panel, Spotlight } from './ui';

const FEATURES = [
  { Icon: ScanIcon, title: 'Auto-detect', body: 'SAML as base64, deflated or raw XML. JWT and JWE. Bearer headers and form bodies too.' },
  { Icon: StethoscopeIcon, title: 'Protocol checks', body: 'Status codes, expiry, clock skew, audience, ACS URL, issuer and signatures.' },
  { Icon: WrenchIcon, title: 'Plain-English fixes', body: 'Every failure explains the likely cause and what to change on the IdP or SP.' },
  { Icon: FingerprintIcon, title: 'Certificate insight', body: 'Embedded X.509 validity dates, serials and SHA-256 fingerprints.' },
];

const STEPS = [
  <>Open DevTools, then the <b className="font-semibold text-zinc-800 dark:text-zinc-200">Network</b> tab, and enable “Preserve log”.</>,
  <>Sign in, then select the <b className="font-semibold text-zinc-800 dark:text-zinc-200">POST</b> to your ACS URL (or the token response).</>,
  <>Copy <code className="font-mono text-[12px] text-brand-700 dark:text-brand-300">SAMLResponse</code> or <code className="font-mono text-[12px] text-brand-700 dark:text-brand-300">id_token</code> from the payload and paste it here.</>,
];

/** Where SSO Doctor sits in a login flow: the token in transit between IdP and app. */
function FlowIllustration() {
  const node = 'fill-white stroke-zinc-900/10 dark:fill-zinc-900 dark:stroke-white/10';
  const title = 'fill-zinc-900 text-[12px] font-semibold dark:fill-white';
  const sub = 'fill-zinc-500 text-[9.5px] dark:fill-zinc-400';
  const glyph = 'stroke-zinc-700 dark:stroke-zinc-300';
  return (
    <svg viewBox="0 0 600 226" role="img" aria-labelledby="flow-title" className="h-auto w-full font-sans">
      <title id="flow-title">A token travels from the identity provider through the browser to your app. SSO Doctor inspects it at the browser.</title>
      <defs>
        <marker id="flow-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 8 4 0 8Z" className="fill-brand-500" />
        </marker>
        <linearGradient id="flow-doctor" x1="0" x2="1">
          <stop offset="0" stopColor="#34d399" stopOpacity=".16" />
          <stop offset="1" stopColor="#2dd4bf" stopOpacity=".16" />
        </linearGradient>
      </defs>

      {/* Identity provider */}
      <g>
        <rect x="8" y="30" width="136" height="92" rx="14" strokeWidth="1" className={node} />
        <g transform="translate(22 46)" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={glyph}>
          <path d="M11 1 19 4v6c0 4.8-3.4 8.4-8 9.8C6.4 18.4 3 14.8 3 10V4l8-3Z" className="fill-brand-500/15" />
          <path d="m7.5 10 2.4 2.4 4.3-4.6" />
        </g>
        <text x="22" y="92" className={title}>Identity Provider</text>
        <text x="22" y="107" className={sub}>signs &amp; issues the token</text>
      </g>

      {/* Browser */}
      <g>
        <rect x="232" y="30" width="136" height="92" rx="14" strokeWidth="1" className={node} />
        <g transform="translate(246 46)" fill="none" strokeWidth="1.5" strokeLinecap="round" className={glyph}>
          <rect x="1" y="2" width="22" height="17" rx="3" className="fill-sky-500/15" />
          <path d="M1 7h22" />
          <circle cx="4.5" cy="4.5" r=".5" />
          <circle cx="7" cy="4.5" r=".5" />
        </g>
        <text x="246" y="92" className={title}>Browser</text>
        <text x="246" y="107" className={sub}>carries it in a redirect / POST</text>
      </g>

      {/* Service provider */}
      <g>
        <rect x="456" y="30" width="136" height="92" rx="14" strokeWidth="1" className={node} />
        <g transform="translate(470 46)" fill="none" strokeWidth="1.5" strokeLinecap="round" className={glyph}>
          <rect x="1" y="1" width="22" height="8" rx="2" className="fill-violet-500/15" />
          <rect x="1" y="12" width="22" height="8" rx="2" className="fill-violet-500/15" />
          <path d="M5 5h.01M5 16h.01M10 5h8M10 16h8" />
        </g>
        <text x="470" y="92" className={title}>Your app (SP)</text>
        <text x="470" y="107" className={sub}>validates, then signs in</text>
      </g>

      {/* Token path */}
      <g fill="none" strokeWidth="1.6" strokeLinecap="round">
        <path d="M150 76h74" strokeDasharray="4 5" markerEnd="url(#flow-arrow)" className="animate-dash stroke-brand-500" />
        <path d="M374 76h74" strokeDasharray="4 5" markerEnd="url(#flow-arrow)" className="animate-dash stroke-brand-500" />
      </g>
      <text x="187" y="66" textAnchor="middle" className="fill-zinc-500 font-mono text-[9px] dark:fill-zinc-400">token</text>
      <text x="411" y="66" textAnchor="middle" className="fill-zinc-500 font-mono text-[9px] dark:fill-zinc-400">POST /acs</text>

      {/* SSO Doctor inspection point */}
      <path d="M300 122v44" strokeWidth="1.4" strokeDasharray="2 4" strokeLinecap="round" className="stroke-zinc-400 dark:stroke-zinc-600" />
      <circle cx="300" cy="122" r="3.5" className="fill-brand-500" />
      <circle cx="300" cy="122" r="3.5" className="animate-ping-slow fill-brand-500/60 [transform-box:fill-box] [transform-origin:center]" />
      <g>
        <rect x="196" y="168" width="208" height="42" rx="21" fill="url(#flow-doctor)" strokeWidth="1" className="stroke-brand-500/40" />
        <g transform="translate(208 177)">
          <rect width="24" height="24" rx="7" fill="#10b981" />
          <path d="M5 12h2.6l1.5-3.4 2.8 6.8 1.5-3.4H19" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <text x="242" y="188" className="fill-zinc-900 text-[11.5px] font-semibold dark:fill-white">SSO Doctor</text>
        <text x="242" y="201" className="fill-zinc-500 text-[9.5px] dark:fill-zinc-400">decode · check · explain</text>
      </g>
    </svg>
  );
}

export function EmptyState() {
  return (
    <div className="flex animate-fade-in flex-col gap-4">
      <Panel className="relative overflow-hidden p-5 sm:p-6">
        <Eyebrow>Where it fits</Eyebrow>
        <h2 className="mt-1.5 text-lg font-semibold tracking-tight">Paste a token to start the diagnosis</h2>
        <p className="mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
          Grab the token while it travels through your browser, or load a sample to see a report.
        </p>
        <div className="mt-5 rounded-xl bg-zinc-900/[0.02] p-3 ring-1 ring-zinc-900/[0.05] dark:bg-white/[0.02] dark:ring-white/[0.05]">
          <FlowIllustration />
        </div>

        <ol className="mt-5 grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={i} className="flex gap-3 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-500/10 font-mono text-[11px] font-semibold text-brand-700 ring-1 ring-brand-500/25 dark:text-brand-300">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </Panel>

      <ul className="grid gap-3 sm:grid-cols-2">
        {FEATURES.map(({ Icon, title, body }, i) => (
          <li key={title} className="animate-fade-in stagger" style={{ '--i': i } as CSSProperties}>
            <Spotlight className="h-full rounded-2xl bg-white p-4 ring-1 ring-zinc-950/[0.07] transition hover:ring-brand-500/30 dark:bg-zinc-900/60 dark:ring-white/[0.08] dark:hover:ring-brand-400/30">
              <IconBadge>
                <Icon className="size-[18px] text-zinc-700 transition group-hover:text-brand-600 dark:text-zinc-300 dark:group-hover:text-brand-300" />
              </IconBadge>
              <h3 className="mt-3 text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">{body}</p>
            </Spotlight>
          </li>
        ))}
      </ul>

      <p className="inline-flex items-center justify-center gap-1.5 text-xs text-zinc-500">
        <LockIcon className="size-3.5" /> Everything runs locally. Tokens are never stored or sent anywhere.
      </p>
    </div>
  );
}
