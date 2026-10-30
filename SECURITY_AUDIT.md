# SmartPDF security audit

**Audit date:** 31 August 2026
**Scope:** local-first browser application, Next.js routes, image pipeline, PDF generation, Cloudflare/OpenNext configuration, dependencies, and privacy boundary.
**Current release conclusion:** no known open Critical, High, or Medium issue in the default fail-closed deployment. No GitHub or Cloudflare resource is currently connected; the owner must run a fresh release gate before any production publication.

## 1. Trust model

- All document data is untrusted, including records read back from IndexedDB.
- Drafts remain in the user's browser; there is no account, session, server document repository, SQL database, or cross-user ownership model in this release.
- `POST /api/export` is an unauthenticated but guarded expensive endpoint. It accepts only same-origin, explicitly marked, bounded JSON and then applies runtime schema and document preflight validation.
- In Cloudflare, the route trusts `CF-Connecting-IP` only when `getCloudflareContext()` supplies genuine request metadata. It never uses `X-Forwarded-For` as identity.
- Cloudflare Browser Rendering is an external processor used only after the user chooses Export PDF. The approved data flow is disclosed in `PRIVACY.md` and `/en/privacy`.

## 2. Production PDF security boundary

```text
Untrusted document
  → 512 KiB request limit
  → content-type, request marker, and Origin checks
  → Cloudflare context + trusted client metadata
  → per-client and route-wide Rate Limit bindings
  → Zod discriminated-union validation
  → document preflight and bounded money/date/text/image checks
  → context-aware HTML escaping
  → inline deterministic HTML/CSS/fonts/image
  → Cloudflare Browser Rendering quickAction("pdf")
       cacheTTL = 0
       JavaScript = disabled
       allowRequestPattern = ["^data:"]
       script/XHR/fetch/websocket/eventsource/media = rejected
       A4 + print backgrounds + CSS page size
  → bounded and signature-checked PDF
  → no-store response and direct download
```

The Worker does not accept a renderer URL, execute shell commands, access a deployment filesystem, or launch a binary. It does not use Crawl or Session Recording. It has no Browser Rendering API key; the `BROWSER` binding is the capability boundary. If the flag, request context, client metadata, either limiter, Browser binding, renderer response, PDF signature, or output-size check fails, export stops without a production fallback.

The local renderer remains available under `next dev` only. Package import conditions resolve it to a production unavailable stub. The final Next server bundle was searched and contains no Playwright package, local Chromium environment variable, or Windows Edge/Chrome path marker.

## 3. Data handling and logging

- SmartPDF does not persist request HTML or returned PDF on the server.
- The route buffers the bounded renderer response only for the active request and returns it directly.
- Application logs do not include document content, HTML, profile images, PDF bytes, email, phone, address, or business notes.
- Unexpected failures log only a controlled error class name; responses expose generic codes without stacks, paths, bindings, or secrets.
- Cloudflare is documented as an external data processor. Production launch still requires review of Cloudflare's current data-processing, region, retention, and billing terms.

## 4. Validation and injection controls

- Zod validates kind, UUIDs, ownership literal, schema version, status, template, locale, direction, paper, revisions, dates, emails, arrays, text lengths, money bounds, quantity, tax, and discount.
- Text validation rejects malformed UTF-16, unsafe control characters, bidi overrides/isolates, and BOM, then normalizes valid text to NFC.
- React renders document text as text nodes. The PDF renderer escapes `&`, `<`, `>`, quotes, and apostrophes before concatenating controlled HTML.
- Profile upload accepts JPEG/PNG/WebP up to 20 MB in the browser, checks format structure and pixel budgets before crop, and stores only a bounded canonical 512×512 JPEG data URL. The API validates its Base64 structure, JPEG markers, dimensions, and maximum encoded length.
- The Browser Rendering network allowlist permits only embedded `data:` resources. `http:`, `https:`, `file:`, localhost, link-local, and private-network destinations are not permitted.
- Money calculations use safe bounded minor units and exact arithmetic rather than trusting display floats.

## 5. Request and abuse controls

- Request body is bounded while streaming, not only by caller-declared `Content-Length`.
- Cross-origin JSON and missing request markers are rejected before export access or rendering.
- Production export requires `PDF_EXPORT_ENABLED=1`, a genuine Cloudflare request context, a syntactically valid trusted `CF-Connecting-IP`, both native limiters, and the Browser binding.
- Per-client rate limit: 8 requests/minute in the production configuration.
- Route-wide rate limit: 120 requests/minute per Cloudflare location as backpressure.
- The local two-render concurrency slot remains secondary backpressure, not the primary distributed control.
- Cloudflare bindings are per location and eventually consistent. They cannot be treated as exact global usage accounting; account-level WAF/rate policy, monitoring, and cost alerts are still required before public release.

## 6. Response and browser security

- PDF responses set `Cache-Control: no-store`, `Content-Type: application/pdf`, safe attachment filenames, and `X-Content-Type-Options: nosniff`.
- API responses use `default-src 'none'; frame-ancestors 'none'; sandbox`.
- Dynamic pages use a unique CSP nonce, `strict-dynamic`, no inline-script permission, object denial, base/form restrictions, frame denial, and restricted image/font/connect/worker sources.
- HSTS, frame denial, COOP, `nosniff`, Referrer-Policy, and Permissions-Policy are configured. Camera is same-origin only for optional profile-photo capture; microphone, geolocation, and payment are disabled.
- `src/middleware.ts` stays on Edge Middleware because the selected OpenNext version supports Edge Middleware but not Next 16 Node Proxy. This is a deployment compatibility decision, not an application behavior change.

## 7. Supply chain and secrets

- pnpm is locked to 11.19.0; future CI, if the owner adds it, should use `--frozen-lockfile`.
- No GitHub Actions, CI secrets, GitHub repository, or Cloudflare deployment is currently configured by this project.
- `.env*`, `.dev.vars*`, `.next`, `.open-next`, `.wrangler`, dry-run output, temp PDFs, logs, PEM files, and dependencies are ignored.
- `.env.example` contains no token or secret. The optional `CHROMIUM_EXECUTABLE_PATH` is local-development configuration only.
- Cloudflare type generation confirms `BROWSER`, `ASSETS`, both Rate Limit bindings, and the isolated Preview environment.
- The local secret scan found no candidate key/token/private key; `pnpm audit --audit-level high` found no known vulnerability.

## 8. Historical finding disposition

| Finding | Original severity | Current disposition |
|---|---:|---|
| Export abuse via forged forwarding identity | High | Fixed in design/code; actual Cloudflare Preview rate test pending |
| Arbitrary JPEG-labelled bytes reach renderer | Medium | Mitigated with structural/dimension/canonical validation |
| Unsafe money precision | Medium | Fixed |
| Malformed Unicode amplification | Medium | Fixed |
| Autosave can recreate deleted document | Medium | Fixed |
| Inline-script CSP allowance | Low | Fixed for scripts; inline style-attribute exception remains |
| Image dimension bomb | Low | Fixed while preserving 20 MB upload limit |
| Plaintext local IndexedDB documents | Low | Accepted local-first risk |
| CI/Cloudflare artifact gap | Low | External release resources intentionally removed; owner must run a fresh release gate |

## 9. Verification completed locally

- Lint: pass, zero warnings.
- Strict Type Check: pass.
- Unit/component/security tests: 25 files, 79 tests, all pass.
- Secret pattern scan: pass.
- Dependency audit at High severity: pass, no known vulnerabilities.
- Next.js production build: pass.
- Production export bundle marker scan: pass; development renderer excluded.
- Browser QA: Landing, Privacy, Workspace, Create Document, CV, Invoice, and Quotation; no console errors, request failures, bad responses, or blocking axe findings.
- PDF QA: six downloads, including English/mixed and Arabic RTL CV/Invoice/Quotation, profile photo, embedded fonts, Unicode, and two-page quotation.
- PDF metadata: A4, tagged, no PDF JavaScript.
- PDF visual review: no clipped text, overlap, missing Arabic glyphs, broken image, malformed totals, or broken page transition found.
- Responsive regression: 17 viewports from 320×568 to 3440×1440, portrait/landscape where applicable, no failures.
- Windows OpenNext attempt: progressed beyond middleware and failed at server-function pnpm symlink creation with `EPERM`, consistent with the documented Windows/OneDrive limitation.

## 10. Future Cloudflare Preview checks

A future owner-controlled Preview should test the real Cloudflare runtime for:

- all UI routes, fonts, images, assets, hydration, and seven accessibility states;
- six actual Cloudflare PDFs, profile image, Arabic, English, RTL/LTR, and multi-page layout;
- CSP, HSTS, `nosniff`, Referrer-Policy, Permissions-Policy, frame denial, and CORS;
- script-like text escaping, SSRF-shaped profile URL rejection, trusted-IP quota, forged `X-Forwarded-For`, and renderer error responses.

No remote result is claimed. The Worker Preview and local Cloudflare login used during prior verification were removed at the owner's request.

## 11. Residual risks

1. Same-origin malicious code or a sufficiently privileged local/browser attacker can read plaintext IndexedDB data.
2. A future browser/image-decoder vulnerability remains relevant when Cloudflare renders validated images.
3. Inline style attributes remain allowed for crop and preview geometry.
4. Per-location eventual rate limiting needs WAF, monitoring, cost limits, and incident response around it.
5. Cloudflare data-processing terms and operational retention behavior must be reviewed by the deployment owner.
6. No independent penetration test or production Worker test has been performed.

Authentication, cookies/sessions, authorization/IDOR, CSRF tokens, and SQL parameterization are not present because the product has no accounts or server database. They become mandatory if cloud persistence or authentication is introduced.

## 12. Production blockers and severity

Known open security findings in the default fail-closed configuration:

- **CRITICAL: 0**
- **HIGH: 0**
- **MEDIUM: 0**
- **LOW: 4** — local IndexedDB confidentiality, inline-style CSP exception, image-decoder residual, and non-exact distributed quota semantics.

Operational release blockers:

- exact OpenNext Worker build has not passed on Linux CI;
- Wrangler dry-run artifact verification has not completed after a Linux build;
- authenticated Cloudflare Preview has not run;
- actual Cloudflare Browser Rendering, headers, and Rate Limit behavior are unverified;
- production PDF feature flag remains deliberately disabled.

**Production Ready: NO.** No public production deployment was performed.
