# SmartPDF

Production-oriented English and Arabic (RTL) interface for CVs and invoices, with retained internal quotation compatibility. Each document has its own language (English or Arabic), chosen when it is created. The application is local-first: documents are validated and stored in browser IndexedDB and are not presented as cloud-synced or account-backed.

## Run locally

Install dependencies with `corepack pnpm install --frozen-lockfile`, then start the app with `corepack pnpm dev`.

Open `http://localhost:3000`. The dev server listens on `localhost` only. The interface is served under `/en` and `/ar`, and the language switch in the header changes the interface language; the language of a document is independent of it.

## Quality commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm build:cloudflare`
- `corepack pnpm verify:cloudflare` (after a successful OpenNext build)

## Security boundary

- User content is untrusted. Drafts are stored with a lenient structural schema so that one temporarily invalid field never blocks saving; the strict schema (safe text, email, dates, direction matching locale) runs before export and again on the server.
- Export validation accepts only bounded, marked, same-origin JSON and applies layered rate limiting. Production PDF generation uses Cloudflare Browser Rendering only after explicit export; it does not persist or log document content.
- React text rendering provides contextual HTML escaping; no user content is passed to `dangerouslySetInnerHTML`.
- Nonce CSP and defensive headers are configured in `src/middleware.ts` and `next.config.ts`.
- There are no frontend secrets. `.env.example` contains only optional local/server configuration and no credentials.
- Authentication, ownership, SQL parameterization, and secure sessions become mandatory when a server repository is connected. They are not simulated in the local-only product mode.

Architecture and UX decisions live in `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, and `UX_FLOW.md`.

## GitHub and Cloudflare

- GitHub CI (`.github/workflows/ci.yml`) runs on Linux: install, lint, typecheck, test, `audit:security` (secret scan and dependency audit), then `build:cloudflare`. `verify:cloudflare` (artifact checks and a Wrangler dry run) is run manually after a successful OpenNext build.
- Cloudflare Workers packaging uses OpenNext through `corepack pnpm build:cloudflare`; configuration is in `open-next.config.ts` and `wrangler.jsonc`.
- The application needs a Worker rather than a static Pages export because PDF export is a server route.
- Local development uses installed Edge/Chrome. Cloudflare uses the least-privilege `BROWSER` binding, with no cache or JavaScript and embedded-data-only network access. Production remains fail-closed until the Linux and remote Preview gates pass; see `DEPLOYMENT.md`, `PRIVACY.md`, and `FINAL_AUDIT.md`.
