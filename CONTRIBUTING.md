# Contributing to SSO Doctor

Thanks for your interest in contributing. Here's how to get started.

## Development Setup

```bash
git clone https://github.com/codecheesee/sso-doctor.git
cd sso-doctor
npm install
npm run dev
```

## Making Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run the build to verify (`npm run build`)
5. Commit with a clear message (`git commit -m "Add: your feature"`)
6. Push to your fork and open a Pull Request

## What to Work On

- Additional validation checks (e.g., signature algorithm strength, SAML status code checks)
- Support for more token formats (e.g., PASETO)
- Dark mode toggle
- Export decoded results as JSON
- Copy-to-clipboard for individual fields
- Localization / i18n

## Code Style

- TypeScript strict mode is enabled
- Functional React components with hooks
- Each validation check is an independent function returning `CheckResult`
- Comments should explain *why*, not just *what*

## Commit Messages

Use the format: `Category: description`

- `Add: new JWT claim check for azp`
- `Fix: SAML audience extraction for multiple audiences`
- `Refactor: extract certificate parsing into utility`
- `Docs: update README with deployment instructions`

## Privacy Principle

SSO Doctor must never transmit user data. All processing stays in the browser. Do not add analytics, telemetry, or external API calls that would send token data to any server.
