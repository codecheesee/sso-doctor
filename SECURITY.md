# Security Policy

## Architecture

SSO Doctor is a **static, client-side-only** web application. There is no backend, no server-side processing, and no network calls that transmit user data.

All token decoding and validation happens in the browser via JavaScript. Tokens pasted into the tool are never sent anywhere — they remain in the browser's memory and are discarded when the page is closed or the input is cleared.

## Reporting a Vulnerability

If you discover a security issue (e.g., a vector that could cause token data to leak outside the browser), please email **n.gorai098@gmail.com** with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact

I'll respond within 48 hours and work on a fix.

## Scope

The following are in scope:
- XSS vulnerabilities in the decoded output rendering
- Dependencies that introduce network calls or data exfiltration
- Logic bugs in validation checks that could cause false PASSes on insecure tokens

The following are out of scope:
- Cryptographic signature verification (SSO Doctor does not verify signatures — it's a debugging tool, not a security gateway)
- Issues requiring physical access to the user's machine
