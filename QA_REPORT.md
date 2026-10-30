# SmartPDF Phase 5 QA Report

**Date:** 2026-08-31
**Scope:** Full product QA and debugging before Phase 6
**Environment:** Windows 10, Next.js production build, Microsoft Edge/Chromium 152, local IndexedDB storage

## Executive status

SmartPDF passed the automated unit, component, integration, browser, accessibility, responsive, PDF, and production-build checks described below. No known blocking runtime, network, export, or accessibility defects remain in the tested scope.

Quotation remains intentionally hidden from the Create Document flow because of the current product decision. Its internal editor, preview, calculations, persistence, and PDF export were still tested by loading a valid local quotation document.

## Skills and test method

- Find Skills was used to identify a suitable QA skill.
- Anthropic Webapp Testing was installed and used for browser reconnaissance and the server-managed Playwright workflow.
- UI Ux Pro Max Unified was used for the WCAG 2.2 AA, form, focus, touch-target, and responsive quality gates.
- PDF skill guidance was used to inspect A4 metadata, render every exported page, and visually review typography, bidi text, images, spacing, and page breaks.
- Software Engineering Standards was used for runtime validation, race-condition review, test coverage, and production-quality fixes.

## Product paths tested

### Landing and workspace

- Landing content and primary/secondary navigation.
- Landing A4 document preview.
- Empty workspace state.
- Sidebar collapse and expand.
- New Document route.
- Document list loading from IndexedDB.
- Open, reload, browser back/forward, delete confirmation, deletion persistence, and document counts.
- Accessible names for visible controls.

### Create Document

- CV creation.
- Invoice creation.
- Double activation protection so one action creates one document.
- Keyboard focus visibility on document-type cards.
- Confirmed that no template selector is exposed.
- Confirmed that Quotation is not exposed in the current product flow.

### CV

- Profile photo upload with real PNG bytes.
- 20 MB validation boundary remains covered by component tests.
- Crop dialog, zoom slider, keyboard image movement, apply, and rendered circular photo.
- Full name, headline, specialization, email, phone, location, and summary.
- Arabic, English, mixed-direction text, Unicode punctuation, and emoji.
- Experience add/remove, company, role, month/year dates, current-role state, and multiline responsibilities.
- Education add/remove, institution, degree/field, and month/year dates.
- Multi-word English and Arabic skills.
- Autosave followed by full reload.
- Preview update latency.
- Preview and exported PDF visual comparison.

### Invoice

- Issuer and client fields.
- Invoice number and currency.
- Issue Date and Due Date with mouse and keyboard-capable controls.
- Moving Issue Date after Due Date clears the invalid stale value.
- Quantity, Unit Price, Tax, and Discount keyboard entry.
- Negative numeric normalization and supported bounds.
- Add/remove line item.
- Decimal calculation, discount-before-tax behavior, and final total.
- Multiline mixed-language notes.
- Preview and direct PDF download.

### Quotation

- Distinct Quotation labels and commercial-proposal language.
- Quote number, issuer, client, issue date, valid-until date, items/services, tax, discount, proposed total, terms, and notes.
- 18 mixed-language line items.
- Two-page live preview with A4-sized pages and repeated table headings.
- Two-page exported PDF with totals, terms, and notes on the final page.

## Defects found and fixed

| Area | Root cause | Fix | Regression coverage |
|---|---|---|---|
| CV education | Education existed in the schema, preview, and PDF renderer but had no editor controls | Added structured education entries with institution, degree/field, and dates | Component + E2E |
| Current experience | `current` existed in the model but was not editable | Added an accessible current-role checkbox and disabled/cleared End Date when active | Component + E2E |
| Multiline responsibilities | The textarea stored all lines in one array element, risking the per-bullet schema limit and failed persistence | Store up to 12 bounded lines as canonical bullets while preserving line breaks | Component + reload + PDF |
| Autosave race | An older in-flight save could overlap a newer scheduled save | Serialize saves per document and always persist the latest revision last | Unit + E2E reload |
| Invalid date order | A later Issue Date could leave an earlier Due Date/Valid Until value | Clear stale end dates in the form and block invalid order during preflight | Unit + component + E2E |
| Email and whitespace validation | Client preflight accepted malformed emails and whitespace-only required values until server validation | Added preflight validation with localized messages | Unit |
| Input/schema mismatch | Several fields allowed input longer than the runtime schema | Added matching `maxLength` boundaries to CV and business fields | Component + E2E |
| Duplicate Create/Export | React state alone did not block two programmatic clicks in the same event turn | Added synchronous refs guarding each operation | E2E double activation |
| Profile photo accessibility | Hidden file input had no accessible name | Added the localized accessible label | axe-core E2E |
| Scroll-region accessibility | A long editor pane could scroll without being keyboard focusable | Added named, focusable editor and preview regions | axe-core E2E |
| Create-card focus | The visually hidden radio had no visible focus treatment on its card | Added `focus-within` ring behavior | axe-core + keyboard audit |
| Landing contrast | Small muted text on the preview chrome fell slightly below AA | Switched it to the existing secondary-text token | axe-core E2E |
| Long-preview parity | Long business previews grew as one continuous sheet while PDF was paginated | Added deterministic multi-page A4 preview pagination and final-page totals/notes | Component + E2E + visual PDF review |
| Responsive audit reliability | `networkidle` never settled for App Router navigation and stale Windows QA servers could serve old build assets | Wait for rendered route content and use clean, explicit production-server ports | Responsive + E2E tooling |

## Tests added or expanded

- `src/features/editor/autosave.test.ts`
  - Verifies overlapping saves are serialized and the newest revision persists last.
- `src/features/editor/cv-form.test.tsx`
  - Verifies multiline responsibilities, current-role behavior, and education editing.
- `src/domain/documents/documents.test.ts`
  - Verifies malformed email, reversed dates, and whitespace-only required fields.
- `src/features/preview/document-preview.test.tsx`
  - Verifies long business documents produce separate A4 preview pages.
- `scripts/qa-audit.mjs`
  - Repeatable production E2E audit for primary flows, persistence, double actions, axe-core, Console/Network, performance, and PDF downloads.
- `scripts/responsive-audit.mjs`
  - More reliable route navigation waiting for Next.js App Router.

## PDF verification

| Document | Export | Pages | Paper | Unicode/Arabic | Visual result |
|---|---:|---:|---|---|---|
| Mixed CV with photo | Pass | 1 | A4 | Pass | Photo, type hierarchy, multiline bullets, education, skills, and bidi text render correctly |
| Invoice | Pass | 1 | A4 | Pass | Totals are correct; fields, notes, spacing, and alignment are intact |
| Long Quotation | Pass | 2 | A4 | Pass | Table breaks cleanly, heading row repeats, and totals/terms/notes remain together on page 2 |

All three PDFs are tagged, contain no JavaScript or form fields, and contain no visible `undefined`, `null`, `NaN`, or `Infinity`. Rendered pages showed no clipped text, overlap, missing profile image, black glyph boxes, or broken page boundaries. The smallest extracted text sizes were approximately 9 pt for CV, 9.5 pt for Invoice, and 8.5 pt for long Quotation table metadata.

## Responsive and interaction coverage

The automated responsive audit passed at:

- 320×568, 360×800, 375×667, 390×844, 412×915, and 430×932.
- 844×390 phone landscape.
- 600×960, 768×1024, 800×1280, 1024×768, and 1180×820 tablets.
- 1280×800, 1440×900, 1920×1080, 2560×1440, and 3440×1440.

It covered horizontal overflow, paper fitting, mobile Edit/Preview switching, profile crop portrait/landscape sizing, date-picker collision handling, touch target sizing, tablet split view, sidebar collapse/expand, Arabic RTL preview, mixed text, keyboard interaction, large text, and reduced motion.

## Accessibility result

axe-core reported zero WCAG A/AA blocking violations on:

- Landing.
- Empty Workspace.
- Create Document.
- CV Editor.
- Invoice Editor.
- Quotation Editor.

Keyboard interaction was exercised for navigation, date selection, crop movement, form controls, mobile mode switching, and sidebar controls. Touch targets and visible focus treatments are covered by the responsive audit and component styles.

## Performance and runtime result

- Production landing navigation in the local run: approximately 82 ms.
- Simple input-to-preview update: approximately 19–20 ms.
- Browser Console errors: 0.
- Runtime/page errors: 0.
- Unexpected failed network requests: 0.
- HTTP responses at 400 or higher during successful flows: 0.
- Duplicate create/export requests after guards: 0.
- No repeated loading loop, preview flicker, or stale value after autosave/reload was observed.

## Final command results

- Lint: **Pass** (`eslint . --max-warnings=0`)
- Type Check: **Pass** (`next typegen && tsc --noEmit`)
- Unit/component/integration: **Pass** — 21 files, 61 tests
- Full production E2E: **Pass**
- Responsive cross-device audit: **Pass** — 17 viewport profiles
- Production Build: **Pass**

## Remaining limitations / manual sign-off

- Physical camera capture depends on browser/device camera permission and hardware. The same secure file-input path, image signatures, size limit, crop, zoom, and output path were tested; a real camera permission prompt cannot be fully emulated in this desktop headless run.
- axe-core and keyboard tests do not replace final human verification with VoiceOver, NVDA, or TalkBack. No automated accessibility blockers remain.
- Quotation creation remains intentionally unavailable in the user-facing Create Document flow. Its internal engine was tested without changing that product decision.
- Phase 6 security audit was not started.
