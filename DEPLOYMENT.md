# SmartPDF deployment guide

**Target:** manual deployment to GitHub and Cloudflare Workers through OpenNext
**Current publishing state:** no GitHub remote, GitHub repository, GitHub automation, Cloudflare Worker, Cloudflare Preview, or saved Cloudflare login is associated with this project. All external release resources were removed on 1 September 2026 at the owner's request.

## 1. Chosen deployment architecture

SmartPDF is a Next.js 16 App Router application with server Route Handlers. Deploy it as a Cloudflare Worker through `@opennextjs/cloudflare`; do not use a static Pages export because `/api/export` and `/api/validate` require server execution.

The production PDF path is:

```text
Browser
  → same-origin POST /api/export
  → body limit + Zod schema + document preflight
  → genuine Cloudflare context + trusted CF-Connecting-IP
  → per-client and route-wide Cloudflare Rate Limit bindings
  → escaped deterministic HTML/CSS with embedded fonts/images
  → Cloudflare Browser Rendering PDF Quick Action
  → bounded, signature-checked PDF response
  → direct browser download
```

Cloudflare Browser Rendering is used only for PDF generation. It uses inline HTML rather than a destination URL, `cacheTTL: 0`, JavaScript disabled, an allowlist that permits only embedded `data:` resources, and no Crawl or Session Recording. SmartPDF does not persist export HTML or PDFs and does not log document content. See `PRIVACY.md` and `/en/privacy`.

Local `next dev` keeps the existing trusted Edge/Chrome renderer. Package import conditions replace that module with a fail-closed stub in production, and the Cloudflare artifact verifier rejects any bundle containing Playwright or local Windows browser paths.

## 2. Repository preparation

The current folder is a local Git repository with no remote. Before your first push:

1. Review the local commit history and working tree intentionally.
2. Confirm `git status --short` contains no `.env`, `.dev.vars`, `.open-next`, `.wrangler`, `.cloudflare-dry-run`, generated PDF, local QA output, or private log.
3. Run the local gates in section 6.
4. Create a private GitHub repository, add it as `origin`, and push only after reviewing the staged diff.
5. Add branch protection or CI only if you choose to manage those services yourself.

`.gitignore` excludes environment files, Worker/Next build output, dry-run output, temporary PDF renders, logs, keys, and dependencies. `.env.example` contains only the optional local Chromium override and no secret.

## 3. No automatic publishing

No GitHub Actions, Dependabot configuration, remote repository, or Cloudflare deployment is included or connected. Uploading the folder to your own GitHub repository will not automatically deploy SmartPDF anywhere.

If you later add CI or Cloudflare credentials, keep API tokens out of source code, `.env.example`, and all `NEXT_PUBLIC_` variables.

## 4. Cloudflare bindings and variables

`wrangler.jsonc` defines:

| Name | Kind | Preview | Production before final approval |
|---|---|---:|---:|
| `ASSETS` | Worker assets binding | enabled | enabled |
| `BROWSER` | Browser Rendering binding | enabled | present |
| `PDF_EXPORT_IP_RATE_LIMITER` | Rate Limit binding keyed by trusted `CF-Connecting-IP` | enabled | present |
| `PDF_EXPORT_ROUTE_RATE_LIMITER` | route-wide backpressure binding | enabled | present |
| `PDF_EXPORT_ENABLED` | non-secret feature gate | `1` | `0` |

Rate Limit bindings are per Cloudflare location and eventually consistent. They provide abuse backpressure, not exact billing or global accounting. Add account-level Cloudflare rate limiting/monitoring and spending alerts before public launch.

There is no Browser Rendering API key in the Worker. The `BROWSER` binding is the least-privilege capability. No application runtime secret is currently required.

The preview environment uses separate rate-limit namespace IDs. Production remains fail-closed with `PDF_EXPORT_ENABLED=0` until the preview and Linux gates pass. After they pass, change the production value to `1` in a reviewed release commit; do not override a committed `0` only in the Dashboard because a later Wrangler deployment can replace Dashboard vars.

## 5. Platform compatibility

- Compatibility flag: `nodejs_compat`.
- Worker entry: `.open-next/worker.js`.
- Static assets: `.open-next/assets`.
- Fonts: self-hosted for UI and embedded as generated Base64 WOFF2 assets for PDF; no runtime filesystem read is needed in the Worker.
- Middleware: `src/middleware.ts` deliberately retains the Edge Middleware convention because OpenNext supports Edge Middleware but does not currently support Next 16 Node Proxy. Next emits a deprecation warning; do not rename it to `proxy.ts` until OpenNext documents Node Proxy support and the preview gate passes.
- Production PDF code uses Web APIs and Cloudflare bindings only. Node filesystem, local executable lookup, and Playwright are isolated behind the development package condition.
- Paths/imports are case-sensitive in Linux CI.

OpenNext does not fully support Windows builds. In this OneDrive workspace the build reaches server-function bundling and then fails with `EPERM` while creating a pnpm symlink. Do not work around that with unsafe Windows filesystem changes; Linux CI is the release evidence.

## 6. Actual project commands

Run from the project root:

| Purpose | Command |
|---|---|
| Development | `corepack pnpm dev` |
| Lint | `corepack pnpm lint` |
| Type Check | `corepack pnpm typecheck` |
| Tests | `corepack pnpm test` |
| Local browser/PDF QA | `corepack pnpm audit:qa` |
| Security + dependency audit | `corepack pnpm audit:security` |
| Next.js production build | `corepack pnpm build` |
| OpenNext Worker build | `corepack pnpm build:cloudflare` |
| Verify built Worker + Wrangler dry run | `corepack pnpm verify:cloudflare` |
| Remote Cloudflare preview | `corepack pnpm preview:cloudflare` |
| Deliberate production deployment | `corepack pnpm deploy:cloudflare` |
| Regenerate Cloudflare types | `corepack pnpm cf-typegen` |

`preview:cloudflare` targets the isolated `preview` environment and requires Cloudflare authentication. It does not deploy the production Worker.

## 7. Manual preview verification checklist

The Preview gate must pass all of these before production export is enabled:

- Landing, privacy notice, Workspace, Documents, New Document, CV, Invoice, and internal Quotation route.
- CV with profile image and crop result.
- English, Arabic, mixed text, RTL/LTR, Unicode, embedded fonts, A4, and multi-page output.
- Invoice and quotation calculations and dates.
- Six actual downloads: mixed CV, English invoice, long quotation, Arabic RTL CV, Arabic RTL invoice, and Arabic RTL quotation.
- CSP nonce, HSTS, `nosniff`, Referrer-Policy, Permissions-Policy, frame denial, API CSP, and no permissive CORS.
- Cross-origin request rejection, SSRF-shaped image rejection, escaped script-like text, trusted-IP rate limiting, and forged `X-Forwarded-For` resistance.
- Renderer failure returns only generic `429`, `503`, or `500` responses and never falls back to local Playwright in production.

## 8. Production release

Only after you intentionally complete the manual checks:

1. Review the Cloudflare data-processing terms, privacy notice, account region, Browser Rendering limits, and billing alerts.
2. Change the base `PDF_EXPORT_ENABLED` value from `0` to `1` in `wrangler.jsonc` in a reviewed release commit.
3. Run `corepack pnpm build:cloudflare` on Linux and `corepack pnpm verify:cloudflare`.
4. Run `corepack pnpm deploy:cloudflare` deliberately. This is the public production action and must not be automated without an approved release environment.
5. Repeat the header, route, asset, font, PDF, rate-limit, and error-response smoke tests against the production hostname.
6. Monitor error class/status only; never log document bodies, rendered HTML, images, or PDF bytes.

## 9. Rollback

1. Stop new releases and, if PDF is implicated, set `PDF_EXPORT_ENABLED=0` in a reviewed emergency configuration deployment.
2. List recent versions with `corepack pnpm exec wrangler versions list --json`.
3. Redeploy the last verified version with `corepack pnpm exec wrangler versions deploy <version-id>@100%`.
4. Re-run production smoke tests and confirm the error/abuse metrics recover.
5. Preserve operational metadata needed for the incident, but never copy document content into tickets or logs.

## 10. Current evidence and owner-controlled next steps

Local evidence on 31 August 2026: Lint, Type Check, 98 tests, secret scan, dependency audit, Next build, 17-viewport responsive audit, seven-state accessibility/browser QA, and six local PDFs all pass. Cloudflare type generation passes and the production Next server bundle contains no Playwright or local browser markers.

Remote release evidence was deliberately removed with the external resources. When you are ready, create your own private GitHub repository, choose your Cloudflare account and plan, authenticate Wrangler yourself, run the commands in section 6, and perform the manual checklist. Until you do, `FINAL_AUDIT.md` correctly reports **Production Ready: NO**.
