import type { ReactNode } from 'react';
import type { CertificateInfo, DecodedJwt, DecodedSaml } from '../lib/types';
import { parseDate, relativeTime } from '../lib/time';
import { CopyButton } from './CopyButton';

/* ---------- building blocks ---------- */

function Card({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="ml-auto flex items-center gap-1">{actions}</div>
      </div>
      <div className="px-4">{children}</div>
    </section>
  );
}

function Row({ label, value, hint, extra }: { label: string; value: ReactNode; hint?: string; extra?: ReactNode }) {
  const empty = value === '' || value === null || value === undefined;
  return (
    <div className="group grid grid-cols-1 gap-x-4 gap-y-0.5 border-b border-zinc-100 py-2.5 last:border-0 sm:grid-cols-[11rem_1fr] dark:border-zinc-800/80">
      <dt className="text-xs font-medium text-zinc-500 sm:pt-0.5 dark:text-zinc-400">
        {label}
        {hint && <span className="block text-[11px] font-normal break-all text-zinc-400 dark:text-zinc-500">{hint}</span>}
      </dt>
      <dd className="flex min-w-0 items-start gap-2">
        <div className="min-w-0 flex-1 font-mono text-[12.5px] break-all">
          {empty ? <span className="font-sans text-sm text-zinc-400 italic">not present</span> : value}
          {extra && <div className="mt-0.5 font-sans text-xs text-zinc-500 dark:text-zinc-400">{extra}</div>}
        </div>
        {!empty && typeof value === 'string' && (
          <CopyButton text={value} className="sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100" />
        )}
      </dd>
    </div>
  );
}

function TimeExtra({ value, now }: { value: string; now: Date }) {
  const d = parseDate(value);
  if (!d) return value ? <span className="text-rose-600">Invalid date</span> : null;
  const past = d < now;
  return (
    <span>
      {d.toLocaleString()} · <span className={past ? 'text-zinc-500' : 'text-emerald-600 dark:text-emerald-400'}>{relativeTime(d, now)}</span>
    </span>
  );
}

function Pill({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-sans text-xs font-semibold ${
        ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
      }`}
    >
      {children}
    </span>
  );
}

const short = (uri: string) => uri.split(/[:#]/).pop() || uri;

/* ---------- SAML ---------- */

function CertificateCard({ cert, index, now }: { cert: CertificateInfo; index: number; now: Date }) {
  const expired = cert.notAfter ? cert.notAfter < now : false;
  const soon = cert.notAfter ? !expired && cert.notAfter.getTime() - now.getTime() < 30 * 86400 * 1000 : false;
  return (
    <div className="my-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
        <span className="text-xs font-semibold text-zinc-500">Certificate {index + 1}</span>
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
            <Row label="SHA-256 fingerprint" value={cert.sha256Fingerprint} />
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
      <Card title={saml.rootElement === 'Assertion' ? 'Assertion' : 'Response'}>
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

      <Card title="Signature">
        <dl>
          <Row label="Response signed" value={<Pill ok={saml.responseSigned}>{saml.responseSigned ? 'Yes' : 'No'}</Pill>} />
          <Row
            label="Assertion signed"
            value={saml.encryptedAssertion ? <span className="font-sans text-sm text-zinc-500">encrypted, not visible</span> : <Pill ok={saml.assertionSigned}>{saml.assertionSigned ? 'Yes' : 'No'}</Pill>}
          />
          {saml.signatureAlgorithm && <Row label="Signature algorithm" value={saml.signatureAlgorithm} extra={short(saml.signatureAlgorithm)} />}
          {saml.digestAlgorithm && <Row label="Digest algorithm" value={saml.digestAlgorithm} extra={short(saml.digestAlgorithm)} />}
        </dl>
        {saml.certificates.map((c, i) => (
          <CertificateCard key={i} cert={c} index={i} now={now} />
        ))}
      </Card>

      {saml.encryptedAssertion && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/5 dark:text-amber-300">
          The assertion is encrypted. Subject, conditions and attributes cannot be shown without the SP private key.
        </div>
      )}

      {!noAssertion && (
        <>
          <Card title="Subject">
            <dl>
              <Row label="NameID" value={saml.nameId} />
              <Row label="NameID format" value={saml.nameIdFormat} extra={saml.nameIdFormat && short(saml.nameIdFormat)} />
              <Row label="Confirmation method" value={saml.subjectConfirmationMethod} extra={saml.subjectConfirmationMethod && short(saml.subjectConfirmationMethod)} />
              <Row label="Recipient" value={saml.recipient} />
              <Row label="NotOnOrAfter" value={saml.subjectConfirmationNotOnOrAfter} extra={<TimeExtra value={saml.subjectConfirmationNotOnOrAfter} now={now} />} />
            </dl>
          </Card>

          <Card title="Conditions">
            <dl>
              <Row label="NotBefore" value={saml.notBefore} extra={<TimeExtra value={saml.notBefore} now={now} />} />
              <Row label="NotOnOrAfter" value={saml.notOnOrAfter} extra={<TimeExtra value={saml.notOnOrAfter} now={now} />} />
              {saml.audiences.length <= 1 ? (
                <Row label="Audience" value={saml.audiences[0] ?? ''} />
              ) : (
                saml.audiences.map((a, i) => <Row key={a} label={`Audience ${i + 1}`} value={a} />)
              )}
            </dl>
          </Card>

          <Card title="Authentication">
            <dl>
              <Row label="AuthnInstant" value={saml.authnInstant} extra={<TimeExtra value={saml.authnInstant} now={now} />} />
              <Row label="SessionIndex" value={saml.sessionIndex} />
              {saml.sessionNotOnOrAfter && <Row label="Session expires" value={saml.sessionNotOnOrAfter} extra={<TimeExtra value={saml.sessionNotOnOrAfter} now={now} />} />}
              <Row label="AuthnContext" value={saml.authnContextClassRef} extra={saml.authnContextClassRef && short(saml.authnContextClassRef)} />
            </dl>
          </Card>

          <Card title={`Attributes (${saml.attributes.length})`}>
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
                              <span key={j} className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
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
        const isTime = TIME_CLAIMS.has(k) && typeof v === 'number';
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

export function JwtDecoded({ jwt, now }: { jwt: DecodedJwt; now: Date }) {
  return (
    <div className="flex flex-col gap-4">
      <Card title="Header" actions={<CopyButton text={JSON.stringify(jwt.header, null, 2)} label="JSON" />}>
        <ClaimRows obj={jwt.header} now={now} />
      </Card>
      <Card title="Payload" actions={<CopyButton text={JSON.stringify(jwt.payload, null, 2)} label="JSON" />}>
        <ClaimRows obj={jwt.payload} now={now} />
      </Card>
      <Card title="Signature" actions={jwt.signature && <CopyButton text={jwt.signature} />}>
        <p className="py-3 font-mono text-[12.5px] break-all text-zinc-600 dark:text-zinc-400">
          {jwt.signature || <span className="font-sans text-rose-600 italic">empty</span>}
        </p>
      </Card>
    </div>
  );
}

/* ---------- Raw ---------- */

export function RawView({ title, content }: { title: string; content: string }) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 shadow-sm dark:border-zinc-800">
      <div className="flex items-center border-b border-white/10 px-4 py-2">
        <h3 className="text-xs font-medium text-zinc-400">{title}</h3>
        <div className="ml-auto">
          <CopyButton text={content} label="Copy" className="text-zinc-400 hover:bg-white/10 hover:text-white dark:hover:bg-white/10" />
        </div>
      </div>
      <pre className="max-h-[70vh] overflow-auto p-4 font-mono text-[12px] leading-relaxed whitespace-pre text-zinc-200">{content}</pre>
    </section>
  );
}
