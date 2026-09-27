import type { ReactNode } from 'react';
import type { CertificateInfo, DecodedJwt, DecodedSaml } from '../lib/types';
import { parseDate, relativeTime } from '../lib/time';
import { highlightLines } from '../lib/highlight';
import { CopyButton } from './CopyButton';
import { ClockIcon, CodeIcon, FingerprintIcon, KeyIcon, LayersIcon, LockIcon, ShieldCheckIcon } from './icons';
import { Eyebrow, Panel, Tag } from './ui';

/* ---------- building blocks ---------- */

function Card({ title, icon, children, actions, meta }: { title: string; icon?: ReactNode; children: ReactNode; actions?: ReactNode; meta?: ReactNode }) {
  return (
    <Panel className="overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-zinc-900/[0.06] px-4 py-2.5 dark:border-white/[0.06]">
        {icon && <span className="text-zinc-400 [&>svg]:size-4">{icon}</span>}
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {meta}
        <div className="ml-auto flex items-center gap-1">{actions}</div>
      </div>
      <div className="px-4">{children}</div>
    </Panel>
  );
}

function Row({ label, value, hint, extra }: { label: string; value: ReactNode; hint?: string; extra?: ReactNode }) {
  const empty = value === '' || value === null || value === undefined;
  return (
    <div className="group grid grid-cols-1 gap-x-4 gap-y-1 border-b border-zinc-900/[0.05] py-2.5 last:border-0 sm:grid-cols-[11rem_1fr] dark:border-white/[0.05]">
      <dt className="min-w-0 sm:pt-0.5">
        <span className="font-mono text-[12px] font-semibold text-zinc-800 dark:text-zinc-200">{label}</span>
        {hint && <span className="block text-[11px] break-all text-zinc-400 dark:text-zinc-500">{hint}</span>}
      </dt>
      <dd className="flex min-w-0 items-start gap-2">
        <div className="min-w-0 flex-1 font-mono text-[12.5px] break-all text-zinc-700 dark:text-zinc-300">
          {empty ? <span className="font-sans text-[13px] text-zinc-400 italic">not present</span> : value}
          {extra && <div className="mt-1 font-sans text-xs text-zinc-500 dark:text-zinc-400">{extra}</div>}
        </div>
        {!empty && typeof value === 'string' && (
          <CopyButton text={value} className="-my-1 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100" />
        )}
      </dd>
    </div>
  );
}

function TimeExtra({ value, now }: { value: string; now: Date }) {
  const d = parseDate(value);
  if (!d) return value ? <span className="text-rose-600 dark:text-rose-400">Invalid date</span> : null;
  const past = d < now;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5">
      <ClockIcon className="size-3.5 text-zinc-400" />
      {d.toLocaleString()}
      <span className="text-zinc-300 dark:text-zinc-600">·</span>
      <span className={past ? 'text-zinc-500' : 'font-medium text-brand-700 dark:text-brand-400'}>{relativeTime(d, now)}</span>
    </span>
  );
}

function Pill({ ok, children }: { ok: boolean; children: ReactNode }) {
  return <Tag tone={ok ? 'brand' : 'rose'}>{children}</Tag>;
}

const short = (uri: string) => uri.split(/[:#]/).pop() || uri;

/* ---------- SAML ---------- */

/** An outline of the message, so missing or encrypted parts stand out at a glance. */
function SamlStructure({ saml }: { saml: DecodedSaml }) {
  const isResponse = saml.rootElement === 'Response';
  type Node = { name: string; depth: number; ok: boolean; note?: string };
  const nodes: Node[] = [];
  if (isResponse) {
    nodes.push({ name: 'Response', depth: 0, ok: true, note: saml.responseSigned ? 'signed' : 'unsigned' });
    nodes.push({ name: 'Status', depth: 1, ok: saml.statusCode.endsWith(':Success'), note: short(saml.statusCode) || 'missing' });
  }
  const d = isResponse ? 1 : 0;
  if (saml.encryptedAssertion) nodes.push({ name: 'EncryptedAssertion', depth: d, ok: true, note: 'opaque' });
  if (saml.assertionCount > 0) {
    nodes.push({ name: 'Assertion', depth: d, ok: true, note: saml.assertionSigned ? 'signed' : 'unsigned' });
    nodes.push({ name: 'Subject', depth: d + 1, ok: !!saml.nameId, note: saml.nameId ? 'NameID' : 'no NameID' });
    nodes.push({ name: 'Conditions', depth: d + 1, ok: !!(saml.notBefore || saml.notOnOrAfter), note: `${saml.audiences.length} audience${saml.audiences.length === 1 ? '' : 's'}` });
    nodes.push({ name: 'AuthnStatement', depth: d + 1, ok: !!saml.authnInstant, note: saml.authnContextClassRef ? short(saml.authnContextClassRef) : undefined });
    nodes.push({ name: 'AttributeStatement', depth: d + 1, ok: saml.attributes.length > 0, note: `${saml.attributes.length} attribute${saml.attributes.length === 1 ? '' : 's'}` });
  } else if (!saml.encryptedAssertion) {
    nodes.push({ name: 'Assertion', depth: d, ok: false, note: 'absent' });
  }

  return (
    <Card title="Message structure" icon={<LayersIcon />}>
      <ul className="py-3 font-mono text-[12.5px]">
        {nodes.map((n, i) => (
          <li key={`${n.name}-${i}`} className="flex items-center gap-2 py-1" style={{ paddingLeft: `${n.depth * 1.25}rem` }}>
            {n.depth > 0 && <span aria-hidden="true" className="-ml-3 h-px w-2.5 bg-zinc-300 dark:bg-zinc-700" />}
            <span className={`size-1.5 shrink-0 rounded-full ${n.ok ? 'bg-brand-500' : 'bg-rose-500'}`} />
            <span className="text-zinc-400">
              &lt;<span className="font-semibold text-zinc-800 dark:text-zinc-200">{n.name}</span>&gt;
            </span>
            {n.note && <span className="truncate font-sans text-xs text-zinc-500">{n.note}</span>}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function CertificateCard({ cert, index, now }: { cert: CertificateInfo; index: number; now: Date }) {
  const expired = cert.notAfter ? cert.notAfter < now : false;
  const soon = cert.notAfter ? !expired && cert.notAfter.getTime() - now.getTime() < 30 * 86400 * 1000 : false;
  return (
    <div className="my-3 overflow-hidden rounded-xl ring-1 ring-zinc-900/[0.08] dark:ring-white/[0.08]">
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-900/[0.06] bg-zinc-900/[0.02] px-3 py-2 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <FingerprintIcon className="size-4 text-zinc-400" />
        <span className="text-xs font-semibold">X.509 certificate {index + 1}</span>
        {cert.parsed && cert.notAfter && <Pill ok={!expired && !soon}>{expired ? 'Expired' : soon ? 'Expires soon' : 'Valid'}</Pill>}
        <div className="ml-auto">
          <CopyButton text={cert.pem} label="PEM" />
        </div>
      </div>
      <dl className="px-3">
        <Row label="Subject" value={cert.subject} />
        {cert.parsed && (
          <>
            <Row label="Issuer" value={cert.issuer} />
            <Row label="Valid from" value={cert.notBefore?.toISOString() ?? ''} extra={cert.notBefore && <TimeExtra value={cert.notBefore.toISOString()} now={now} />} />
            <Row label="Valid until" value={cert.notAfter?.toISOString() ?? ''} extra={cert.notAfter && <TimeExtra value={cert.notAfter.toISOString()} now={now} />} />
            <Row label="Serial" value={cert.serialNumber} />
            <Row label="SHA-256" hint="fingerprint" value={cert.sha256Fingerprint} />
          </>
        )}
      </dl>
    </div>
  );
}

export function SamlDecoded({ saml, now }: { saml: DecodedSaml; now: Date }) {
  const success = saml.statusCode.endsWith(':Success');
  const noAssertion = saml.assertionCount === 0;

  return (
    <div className="flex flex-col gap-4">
      <SamlStructure saml={saml} />

      <Card title={saml.rootElement === 'Assertion' ? 'Assertion' : 'Response'} icon={<CodeIcon />}>
        <dl>
          {saml.rootElement === 'Response' && (
            <Row
              label="Status"
              value={saml.statusCode}
              extra={
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  <Pill ok={success}>{short(saml.statusCode) || 'missing'}</Pill>
                  {saml.subStatusCode && <Pill ok={false}>{short(saml.subStatusCode)}</Pill>}
                  {saml.statusMessage && <span>“{saml.statusMessage}”</span>}
                </span>
              }
            />
          )}
          <Row label="Issuer" value={saml.issuer} />
          {saml.rootElement === 'Response' && <Row label="Destination" value={saml.destination} />}
          <Row label="ID" value={saml.responseId} />
          <Row label="InResponseTo" value={saml.inResponseTo} hint={saml.inResponseTo ? undefined : 'Absent in IdP-initiated SSO'} />
          <Row label="IssueInstant" value={saml.issueInstant} extra={<TimeExtra value={saml.issueInstant} now={now} />} />
        </dl>
      </Card>

      <Card title="Signature" icon={<ShieldCheckIcon />}>
        <dl>
          <Row label="Response signed" value={<Pill ok={saml.responseSigned}>{saml.responseSigned ? 'Yes' : 'No'}</Pill>} />
          <Row
            label="Assertion signed"
            value={saml.encryptedAssertion ? <span className="font-sans text-sm text-zinc-500">encrypted, not visible</span> : <Pill ok={saml.assertionSigned}>{saml.assertionSigned ? 'Yes' : 'No'}</Pill>}
          />
          {saml.signatureAlgorithm && <Row label="Signature alg" value={saml.signatureAlgorithm} extra={short(saml.signatureAlgorithm)} />}
          {saml.digestAlgorithm && <Row label="Digest alg" value={saml.digestAlgorithm} extra={short(saml.digestAlgorithm)} />}
        </dl>
        {saml.certificates.map((c, i) => (
          <CertificateCard key={i} cert={c} index={i} now={now} />
        ))}
      </Card>

      {saml.encryptedAssertion && (
        <div className="flex gap-3 rounded-2xl bg-amber-400/10 p-4 text-sm text-amber-800 ring-1 ring-amber-500/25 dark:text-amber-300">
          <LockIcon className="mt-0.5 size-4 shrink-0" />
          The assertion is encrypted. Subject, conditions and attributes cannot be shown without the SP private key.
        </div>
      )}

      {!noAssertion && (
        <>
          <Card title="Subject">
            <dl>
              <Row label="NameID" value={saml.nameId} />
              <Row label="NameID format" value={saml.nameIdFormat} extra={saml.nameIdFormat && short(saml.nameIdFormat)} />
              <Row label="Confirmation" value={saml.subjectConfirmationMethod} extra={saml.subjectConfirmationMethod && short(saml.subjectConfirmationMethod)} />
              <Row label="Recipient" value={saml.recipient} />
              <Row label="NotOnOrAfter" value={saml.subjectConfirmationNotOnOrAfter} extra={<TimeExtra value={saml.subjectConfirmationNotOnOrAfter} now={now} />} />
            </dl>
          </Card>

          <Card title="Conditions" icon={<ClockIcon />}>
            <dl>
              <Row label="NotBefore" value={saml.notBefore} extra={<TimeExtra value={saml.notBefore} now={now} />} />
              <Row label="NotOnOrAfter" value={saml.notOnOrAfter} extra={<TimeExtra value={saml.notOnOrAfter} now={now} />} />
              {saml.audiences.length <= 1 ? (
                <Row label="Audience" value={saml.audiences[0] ?? ''} />
              ) : (
                saml.audiences.map((a, i) => <Row key={`${a}-${i}`} label={`Audience ${i + 1}`} value={a} />)
              )}
            </dl>
          </Card>

          <Card title="Authentication" icon={<KeyIcon />}>
            <dl>
              <Row label="AuthnInstant" value={saml.authnInstant} extra={<TimeExtra value={saml.authnInstant} now={now} />} />
              <Row label="SessionIndex" value={saml.sessionIndex} />
              {saml.sessionNotOnOrAfter && <Row label="Session expires" value={saml.sessionNotOnOrAfter} extra={<TimeExtra value={saml.sessionNotOnOrAfter} now={now} />} />}
              <Row label="AuthnContext" value={saml.authnContextClassRef} extra={saml.authnContextClassRef && short(saml.authnContextClassRef)} />
            </dl>
          </Card>

          <Card title="Attributes" icon={<LayersIcon />} meta={<Tag>{saml.attributes.length}</Tag>}>
            {saml.attributes.length ? (
              <dl>
                {saml.attributes.map((a, i) => {
                  const label = a.friendlyName || a.name.split(/[/:#]/).filter(Boolean).pop() || a.name;
                  return (
                    <Row
                      key={`${a.name}-${i}`}
                      label={label}
                      hint={label !== a.name ? a.name : undefined}
                      value={
                        a.values.length > 1 ? (
                          <span className="flex flex-wrap gap-1">
                            {a.values.map((v, j) => (
                              <span key={j} className="rounded-md bg-zinc-900/[0.05] px-1.5 py-0.5 text-xs text-zinc-800 ring-1 ring-zinc-900/[0.06] dark:bg-white/[0.06] dark:text-zinc-200 dark:ring-white/[0.06]">
                                {v || '(empty)'}
                              </span>
                            ))}
                          </span>
                        ) : (
                          (a.values[0] ?? '')
                        )
                      }
                    />
                  );
                })}
              </dl>
            ) : (
              <p className="py-3 text-sm text-zinc-500 italic">No attributes in this assertion.</p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

/* ---------- JWT ---------- */

const CLAIM_HINTS: Record<string, string> = {
  alg: 'Signing algorithm',
  typ: 'Token type',
  kid: 'Key ID in the JWKS',
  cty: 'Content type',
  iss: 'Issuer',
  sub: 'Subject (user ID)',
  aud: 'Audience',
  exp: 'Expires at',
  nbf: 'Not valid before',
  iat: 'Issued at',
  jti: 'Unique token ID',
  auth_time: 'Time of authentication',
  nonce: 'Replay protection value',
  azp: 'Authorized party',
  scope: 'Granted scopes',
  scp: 'Granted scopes',
  sid: 'Session ID',
  at_hash: 'Access-token hash',
  acr: 'Auth context class',
  amr: 'Auth methods used',
  client_id: 'OAuth client',
  tid: 'Tenant ID',
  oid: 'Object ID',
  upn: 'User principal name',
  email_verified: 'Email ownership verified',
};

const TIME_CLAIMS = new Set(['exp', 'nbf', 'iat', 'auth_time', 'updated_at']);

function ClaimRows({ obj, now }: { obj: Record<string, unknown>; now: Date }) {
  return (
    <dl>
      {Object.entries(obj).map(([k, v]) => {
        const isTime = TIME_CLAIMS.has(k) && typeof v === 'number' && Number.isFinite(v);
        const display = typeof v === 'string' ? v : JSON.stringify(v);
        return (
          <Row
            key={k}
            label={k}
            hint={CLAIM_HINTS[k]}
            value={display}
            extra={isTime ? <TimeExtra value={new Date((v as number) * 1000).toISOString()} now={now} /> : undefined}
          />
        );
      })}
    </dl>
  );
}

const SEGMENTS = [
  { name: 'Header', text: 'text-rose-500 dark:text-rose-400', dot: 'bg-rose-500' },
  { name: 'Payload', text: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500' },
  { name: 'Signature', text: 'text-sky-600 dark:text-sky-400', dot: 'bg-sky-500' },
];

/** The encoded token, colored by segment. */
function JwtAnatomy({ jwt }: { jwt: DecodedJwt }) {
  return (
    <Card title="Token anatomy" icon={<KeyIcon />} actions={<CopyButton text={jwt.segments.join('.')} label="Token" />}>
      <p className="max-h-40 overflow-auto py-3 font-mono text-[12.5px] leading-relaxed break-all scrollbar-thin">
        {jwt.segments.map((seg, i) => (
          <span key={i}>
            {i > 0 && <span className="text-zinc-400">.</span>}
            <span className={SEGMENTS[i]!.text}>{seg || (i === 2 ? '' : '∅')}</span>
          </span>
        ))}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-zinc-900/[0.05] py-2.5 dark:border-white/[0.05]">
        {SEGMENTS.map((s, i) => (
          <span key={s.name} className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
            <span className={`size-2 rounded-full ${s.dot}`} />
            {s.name}
            <span className="font-mono text-[11px] text-zinc-400 tabular-nums">{jwt.segments[i]!.length}</span>
          </span>
        ))}
      </div>
    </Card>
  );
}

export function JwtDecoded({ jwt, now }: { jwt: DecodedJwt; now: Date }) {
  return (
    <div className="flex flex-col gap-4">
      <JwtAnatomy jwt={jwt} />
      <Card title="Header" meta={<span className="size-2 rounded-full bg-rose-500" />} actions={<CopyButton text={JSON.stringify(jwt.header, null, 2)} label="JSON" />}>
        <ClaimRows obj={jwt.header} now={now} />
      </Card>
      <Card title="Payload" meta={<span className="size-2 rounded-full bg-violet-500" />} actions={<CopyButton text={JSON.stringify(jwt.payload, null, 2)} label="JSON" />}>
        <ClaimRows obj={jwt.payload} now={now} />
      </Card>
      <Card title="Signature" meta={<span className="size-2 rounded-full bg-sky-500" />} actions={jwt.signature && <CopyButton text={jwt.signature} />}>
        <p className="py-3 font-mono text-[12.5px] break-all text-zinc-600 dark:text-zinc-400">
          {jwt.signature || <span className="font-sans text-rose-600 italic dark:text-rose-400">empty</span>}
        </p>
      </Card>
    </div>
  );
}

/* ---------- Raw ---------- */

export function RawView({ title, content, lang }: { title: string; content: string; lang: 'json' | 'xml' }) {
  const lines = highlightLines(content, lang);
  return (
    <section className="overflow-hidden rounded-2xl bg-zinc-900 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.45)] ring-1 ring-zinc-950/10 dark:ring-white/10">
      <div className="flex items-center gap-2 border-b border-white/[0.07] bg-white/[0.02] px-4 py-2">
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-white/10" />
          <span className="size-2.5 rounded-full bg-white/10" />
          <span className="size-2.5 rounded-full bg-white/10" />
        </span>
        <h3 className="ml-2 text-xs font-medium text-zinc-400">{title}</h3>
        <Tag tone="brand" onDark className="ml-1">
          {lang}
        </Tag>
        <div className="ml-auto flex items-center gap-2">
          <Eyebrow className="hidden !text-zinc-500 sm:block">{lines.length} lines</Eyebrow>
          <CopyButton text={content} label="Copy" className="text-zinc-400 hover:!bg-white/10 hover:!text-white" />
        </div>
      </div>
      <pre className="max-h-[70vh] overflow-auto py-3 pr-4 font-mono text-[12px] leading-[1.7] whitespace-pre scrollbar-thin">
        <code className="code-lines block">
          {lines.map((l, i) => (
            <span key={i} className="line block text-zinc-200">
              {l}
            </span>
          ))}
        </code>
      </pre>
    </section>
  );
}
