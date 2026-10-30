# Proposal: bot protection for /api/export (SP-08, not implemented)

The in-memory rate limiter already keys on trusted infrastructure data, not forgeable headers. If abuse still appears, add Cloudflare Turnstile:

- Client: load the widget from `challenges.cloudflare.com` and send the token with the export request.
- Server: verify the token with a `fetch` POST to Turnstile `siteverify` before rendering. No new package is needed.
- Needs a site key and a secret key (Worker secret) and extends the CSP `script-src`/`frame-src`/`connect-src` with `https://challenges.cloudflare.com`, using the existing nonce. `unsafe-inline` stays out.
