import { CheckCircleIcon, LockIcon, PulseIcon } from './icons';

const FEATURES = [
  'Detects SAML (base64, deflated or raw XML), JWT and JWE automatically',
  'Checks status codes, expiry, clock skew, audience, ACS URL, issuer and signatures',
  'Explains each failure in plain English, with a fix',
  'Shows certificate dates and SHA-256 fingerprints',
];

export function EmptyState() {
  return (
    <div className="flex h-full min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white/50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
        <PulseIcon className="size-6" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">Paste a token to start the diagnosis</h2>
      <p className="mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
        Copy the <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">SAMLResponse</code> from your browser dev tools
        (Network tab, the POST to your ACS URL), or copy an ID or access token. You can also try a sample.
      </p>
      <ul className="mt-6 grid max-w-lg gap-2 text-left text-sm text-zinc-600 dark:text-zinc-400">
        {FEATURES.map((f) => (
          <li key={f} className="flex gap-2">
            <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
            {f}
          </li>
        ))}
      </ul>
      <p className="mt-6 inline-flex items-center gap-1.5 text-xs text-zinc-500">
        <LockIcon className="size-3.5" /> Everything runs locally. Tokens are never stored or sent anywhere.
      </p>
    </div>
  );
}
