# 🩺 SSO Doctor

**Decode, inspect, and troubleshoot SAML responses and JWTs — entirely in your browser.**

SSO Doctor is a privacy-first diagnostic tool for engineers and IT admins debugging Single Sign-On integrations. Paste a SAML Response or JWT, and instantly see decoded fields, validation results, and actionable fix recommendations — without any data leaving your machine.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcodeycheesee%2Fsso-doctor)

---

## Why SSO Doctor?

Debugging SSO is painful. You're staring at a base64 blob, trying to figure out why login fails. Existing tools either:
- require pasting tokens into someone else's server (security risk), or
- give you raw decoded output with no analysis

SSO Doctor does both decoding **and** validation, tells you exactly what's wrong in plain English, and runs **100% in your browser** — nothing is ever transmitted.

---

## Features

### 🔍 Auto-Detection
Paste any token and SSO Doctor automatically identifies whether it's a SAML Response (base64, optionally deflated) or a JWT (OIDC ID token / access token).

### 📋 Full Decode View
Every field is extracted and displayed in a clean, readable layout:
- **SAML**: Issuer, NameID, Conditions, Audience, Attributes, Recipient, Destination, Session Index, X.509 certificates, raw XML
- **JWT**: Header (algorithm, key ID), Payload (all claims with timestamps formatted as human-readable dates), Signature

### ✅ Validation Engine
16 automated checks with **PASS / WARN / FAIL** status, a plain-English cause, and a recommended fix:

| SAML Checks | JWT Checks |
|---|---|
| NotBefore / NotOnOrAfter time window | `exp` / `nbf` / `iat` validity |
| Audience vs expected Entity ID | `aud` mismatch |
| Recipient & Destination vs ACS URL | `iss` mismatch |
| Issuer mismatch | `alg: "none"` vulnerability |
| X.509 certificate expiry (+ 30-day warning) | Missing `nonce` |
| Missing NameID | Missing common claims (`sub`, `email`, `name`) |
| Missing attributes | |
| Missing InResponseTo (unsolicited response) | |

### ⚙️ Configurable Validation
Optional inputs to compare against your expected values:
- Expected Audience / Entity ID
- Expected ACS URL
- Expected Issuer
- Clock skew tolerance (default: 300 seconds)

### 🧪 Sample Data
One-click sample tokens (clearly fake) to explore the tool without needing a real SSO setup.

### 🔒 Privacy by Design
All processing runs locally via JavaScript in your browser. **No backend. No cookies. No analytics. No data storage. Nothing leaves the page.**

---

## Quick Start

### Use Online
Deploy your own instance to Vercel in one click, or run locally:

### Run Locally

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

Or connect the GitHub repo to Vercel for automatic deploys on push.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 |
| SAML XML parsing | fast-xml-parser |
| Deflate handling | pako |
| X.509 certificate parsing | pkijs + asn1js |
| Deployment | Vercel (static SPA) |

---

## Project Structure

```
src/
├── lib/
│   ├── detect.ts          # Auto-detect JWT vs SAML
│   ├── jwt.ts             # JWT base64url decoding
│   ├── saml.ts            # SAML base64 → inflate → XML → structured data
│   ├── samples.ts         # Fake sample tokens for demo
│   ├── types.ts           # Shared TypeScript interfaces
│   └── checks/
│       ├── samlChecks.ts  # 8 SAML validation checks
│       └── jwtChecks.ts   # 8 JWT validation checks
├── components/
│   ├── TokenInput.tsx         # Paste input + sample data buttons
│   ├── ValidationConfig.tsx   # Optional config panel
│   ├── DecodedView.tsx        # Decoded fields display
│   ├── CheckResult.tsx        # Single PASS/WARN/FAIL card
│   ├── CheckResultList.tsx    # All results + summary counts
│   └── PrivacyNotice.tsx      # Privacy banner
├── App.tsx                    # Main app orchestrator
├── main.tsx                   # React entry point
└── index.css                  # Tailwind v4 + custom theme
```

---

## How It Works

### SAML Decoding Pipeline
1. Base64-decode the input
2. Check if the result is raw XML (starts with `<`)
3. If not, try zlib inflate (`pako.inflate`), then raw deflate (`pako.inflateRaw`)
4. Parse XML with `fast-xml-parser` (namespace prefixes removed for clean access)
5. Walk the parsed tree to extract Issuer, NameID, Conditions, Attributes, etc.
6. Parse embedded X.509 certificates using `pkijs` to extract subject, validity dates, serial number

### JWT Decoding Pipeline
1. Split the string on `.` into 3 segments
2. Replace base64url characters (`-` → `+`, `_` → `/`), pad with `=`
3. Decode with `atob`, parse header and payload as JSON
4. Return structured header, payload, and raw signature

### Validation Engine
Each check is an independent function that returns:
```typescript
{
  status: 'PASS' | 'WARN' | 'FAIL',
  title: string,    // e.g. "Token Expired"
  cause: string,    // e.g. "The token's expiration time has passed."
  fix: string       // e.g. "Token expired at 2024-01-15T10:35:00Z. Request a new token."
}
```

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT — see [LICENSE](LICENSE).
