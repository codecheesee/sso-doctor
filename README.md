# 🩺 SSO Doctor

**Decode, inspect, and troubleshoot SAML responses and JWTs — entirely in your browser.**

SSO Doctor is a privacy-first diagnostic tool for engineers and IT admins debugging Single Sign-On integrations. Paste a SAML Response or JWT, and instantly see decoded fields, validation results, and actionable fix recommendations — without any data leaving your machine.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcodecheesee%2Fsso-doctor)

---

## Why SSO Doctor?

Debugging SSO is painful. You're staring at a base64 blob, trying to figure out why login fails. Existing tools either:
- require pasting tokens into someone else's server (security risk), or
- give you raw decoded output with no analysis

SSO Doctor does both decoding **and** validation, tells you exactly what's wrong in plain English, and runs **100% in your browser** — nothing is ever transmitted.

---

## Features

### 🔍 Auto-Detection
Paste almost anything and SSO Doctor identifies it:
- SAML Response or Assertion — base64, base64 + DEFLATE (HTTP-Redirect binding), or raw XML
- JWT (OIDC ID token / access token) and JWE (encrypted JWT, flagged as unreadable)
- Pasted as-is from dev tools: `Bearer …` headers, `SAMLResponse=…` form bodies, URL-encoded values
- Drag and drop a file onto the input

### 🩻 Diagnosis First
A verdict banner (Healthy / warnings / problems found) followed by every check, failures first. Each failed or warning check includes a **How to fix** note. **Copy report** puts the full result on your clipboard for a ticket.

### ✅ Validation Engine
Checks return **FAIL / WARN / INFO / PASS**. Skipped checks (no expected value configured) are shown as INFO, not PASS.

| SAML checks | JWT checks |
|---|---|
| IdP status code (RequestDenied, AuthnFailed, …) with fix hints | `alg: none` / symmetric `HS*` algorithms |
| Assertion present, multiple or encrypted | Signature segment present |
| Response / Assertion signed | `kid` present for asymmetric algorithms |
| Weak SHA-1 signature or digest | `exp` / `nbf` / `iat` validity with clock skew |
| NotBefore / NotOnOrAfter time window | Token lifetime over 24 hours |
| Bearer SubjectConfirmation expiry | `aud` vs expected audience |
| Audience vs expected SP Entity ID | `iss` vs expected issuer |
| Recipient & Destination vs ACS URL | `sub` present |
| Issuer vs expected IdP Entity ID | Profile claims and `email_verified` (ID tokens) |
| X.509 certificate validity (+ 30-day warning) | |
| NameID present and matches declared format | |
| Attributes present and non-empty | |
| SP- vs IdP-initiated (InResponseTo) | |

Mismatches that differ only by case or a trailing slash are called out explicitly.

> Signatures are checked for **presence and algorithm only**. SSO Doctor does not verify them cryptographically.

### 📋 Decoded View
- **SAML**: status, issuer, IDs, signature details, certificates (subject, issuer, validity, serial, **SHA-256 fingerprint**, copy PEM), subject, conditions, authentication context, multi-value attributes, and formatted XML
- **JWT**: header and payload claims with descriptions, timestamps as local and relative times ("expires in 5 minutes"), signature, and formatted JSON
- Copy button on every value; relative times refresh live

### ⚙️ Configurable Validation
Optional expected values to compare against (saved in your browser's localStorage):
- Expected Audience / SP Entity ID (JWT: `aud`)
- Expected ACS URL (SAML only)
- Expected Issuer
- Clock skew tolerance (default: 180 seconds)

### 🎨 UX
Light, dark and system themes · responsive layout · keyboard shortcut `/` to focus the input · accessible labels and focus states.

### 🧪 Sample Data
Four one-click sample tokens (clearly fake, generated relative to the current time): a valid JWT, a broken JWT, an expired SAML response, and a SAML RequestDenied error.

### 🔒 Privacy by Design
All processing runs locally in your browser. **No backend. No cookies. No analytics. Nothing leaves the page.** Tokens are never stored; only your validation settings and theme are kept in localStorage.

---

## Quick Start

### Run Locally

Requires Node.js 20.19+ or 22.12+.

```bash
git clone https://github.com/codecheesee/sso-doctor.git
cd sso-doctor
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for Production

```bash
npm run build
```

Output goes to `dist/` — deploy it anywhere that serves static files.

### Deploy to Vercel

```bash
npx vercel --prod
```

Or connect the GitHub repo to Vercel for automatic deploys on push. `vercel.json` sets a strict Content-Security-Policy and other security headers.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript 5.9 |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| SAML XML parsing | Browser-native `DOMParser` (namespace-aware) |
| Deflate handling | pako |
| X.509 certificate parsing | asn1js |
| Deployment | Vercel (static SPA) |

---

## Project Structure

```
src/
├── lib/
│   ├── detect.ts          # Auto-detect JWT / JWE / SAML
│   ├── encoding.ts        # Input normalization, base64, inflate helpers
│   ├── jwt.ts             # JWT base64url decoding
│   ├── saml.ts            # SAML → XML → structured data, X.509 parsing
│   ├── sha256.ts          # Certificate fingerprints
│   ├── time.ts            # Relative time and duration formatting
│   ├── hooks.ts           # localStorage, theme, clipboard, live clock hooks
│   ├── samples.ts         # Fake sample tokens for demo
│   ├── types.ts           # Shared TypeScript interfaces
│   └── checks/
│       ├── samlChecks.ts  # SAML validation checks
│       └── jwtChecks.ts   # JWT validation checks
├── components/
│   ├── Header.tsx             # App bar + theme switcher
│   ├── TokenInput.tsx         # Input, paste, drag-and-drop, samples
│   ├── ValidationConfig.tsx   # Optional expected values
│   ├── CheckResultList.tsx    # Verdict banner, filters, results
│   ├── CheckResult.tsx        # Single check card
│   ├── DecodedView.tsx        # Decoded SAML / JWT / raw views
│   ├── EmptyState.tsx         # First-run guidance
│   ├── CopyButton.tsx
│   └── icons.tsx
├── App.tsx                    # Main app orchestrator
├── main.tsx                   # React entry point
└── index.css                  # Tailwind v4 + dark mode variant
```

---

## How It Works

### SAML Decoding Pipeline
1. Normalize input (strip `SAMLResponse=`, URL-decode, remove whitespace)
2. If it is already XML, use it; otherwise base64-decode
3. If the result is not XML, try raw DEFLATE, then zlib inflate (`pako`)
4. Parse with the browser's `DOMParser` and walk elements by local name, so any namespace prefix works
5. Extract status, issuer, subject, conditions, attributes and signature details
6. Parse embedded X.509 certificates with `asn1js` (subject, issuer, validity, serial, SHA-256 fingerprint)

### JWT Decoding Pipeline
1. Normalize input (strip `Bearer`, quotes, URL encoding)
2. Split on `.` — 3 parts is a JWT, 5 parts (or an `enc` header) is a JWE
3. base64url-decode header and payload as UTF-8, parse as JSON
4. Return structured header, payload, and raw signature

### Validation Engine
Each check is an independent function that returns:
```typescript
{
  id: string,
  status: 'PASS' | 'WARN' | 'FAIL' | 'INFO',
  title: string,    // e.g. "Token Expired"
  cause: string,    // e.g. "Expired 2024-01-15T10:35:00Z (2 hours ago)."
  fix: string       // e.g. "Get a new token (or use the refresh token)…"
}
```

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT — see [LICENSE](LICENSE).
