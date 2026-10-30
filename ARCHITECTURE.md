# SmartPDF — Frontend & Product Architecture

> Status: Phase 1 implementation blueprint
> Goal: allow Phase 2 to start without revisiting product structure, UI foundation, document extensibility, RTL, or PDF parity.

## 1. Architecture goals

1. Add a new document type through a bounded plugin/feature, not changes scattered across the app.
2. Keep editor input, live preview, and exported PDF derived from one canonical document model.
3. Support Arabic/English and RTL/LTR at routing, component, content, and PDF-renderer levels.
4. Keep typing and basic preview updates responsive while pagination, autosave, AI, and export run asynchronously.
5. Treat AI output as validated proposals, never direct mutations.
6. Preserve drafts through local recovery, optimistic concurrency, and explicit save states.
7. Meet WCAG 2.2 AA and keep all primary flows keyboard and touch complete.
8. Start as a maintainable single application; extract packages/services only when load or team boundaries justify it.

## 2. Recommended stack

### Core

| Concern | Decision | Why |
|---|---|---|
| Framework | Next.js App Router + React + TypeScript strict mode | Nested layouts, locale segments, server/client boundaries, route loading/error states, and a clear deployment path |
| Styling | Tailwind CSS v4 + CSS custom-property tokens | Fast responsive composition, logical properties, no runtime styling layer, and direct design-token mapping |
| UI primitives | **Base UI** | Unstyled, accessible interactions with focus/keyboard behavior and a documented RTL `DirectionProvider` |
| Component variants | `cva` + `clsx` | Typed variants for system components; simple conditional class composition |
| Editor/UI state | Zustand with selector-based stores | Small, explicit shared client state without provider nesting; recommended by Pick UI Library |
| Forms/schema | React Hook Form + Zod | Performant large forms plus one schema usable by forms, AI validation, migrations, API boundaries, and preflight |
| Notifications | Sonner | Purpose-built, accessible transient feedback; recommended by Pick UI Library |
| Motion | CSS transitions first; Motion only for layout/enter/exit | Avoid a motion dependency for simple hover/fade while retaining robust layout and reduced-motion support |
| Reorder | dnd kit, only for repeatable/reorderable sections | Accessible drag-and-drop with explicit keyboard/button fallbacks; recommended by Pick UI Library |
| Icons | Phosphor Icons | Consistent regular outline system with good document/navigation coverage |
| Localization | Locale segment + `next-intl` behind a small i18n adapter | ICU messages, plurals, formatting, server/client use, and explicit `/en` / `/ar` routing |
| Tests | Vitest, Testing Library, Playwright, axe | Unit/component, bidi/flow E2E, and automated accessibility coverage |

React Hook Form, Zod, `next-intl`, and test tools are outside the Pick UI Library curated list because that list does not cover form-schema validation, full localization, or testing. They are selected for uncovered requirements, not as competing UI libraries.

### UI library evaluation

| Option | Accessibility | RTL | Visual control | Editor fit | Cost/risk | Decision |
|---|---|---|---|---|---|---|
| **Base UI** | Strong ARIA, focus, pointer, and keyboard primitives | Official `DirectionProvider`; app still sets HTML/CSS `dir` | Fully unstyled | Excellent for a bespoke professional system | Must style components intentionally | **Selected** |
| shadcn/ui + Radix | Strong; source-owned components | Generally workable but direction and copied component maintenance need discipline | High, with recognizable defaults to remove | Good | More copied surface and possible design drift | Not selected as the base library |
| React Aria | Excellent accessibility and internationalization foundations | Strong | Fully unstyled | Good | Higher composition/API overhead for V1 | Not selected |
| MUI | Broad accessible component suite | Supported | Lower without deep theme overrides | Fast for admin UI, less ideal for a distinctive editor | Bundle and visual-opinion cost | Not selected |
| Headless UI | Good for covered primitives | Possible with app CSS | High | Coverage is narrower | More custom behavior needed | Not selected |

**Rule:** Base UI is the UI primitive layer. Sonner, Motion, Zustand, and dnd kit solve distinct tasks and must not become alternate component systems.

### Dependency policy

- Pin exact versions in the lockfile during Phase 2; do not document floating versions here.
- Import Base UI components by subpath so unused primitives do not enter the client bundle.
- Avoid charting, rich-text, canvas, or virtualization dependencies until a measured requirement appears.
- Add Virtuoso only when document/client lists exceed roughly 50 rendered items or profiling shows a problem.
- The editor is structured forms, not a rich-text editor. Do not add TipTap/Lexical/Slate in V1.

## 3. Key architecture decisions

| ID | Decision | Consequence |
|---|---|---|
| ADR-001 | Feature-first single Next.js app | Low initial operational cost; boundaries are enforced by imports/tests rather than premature packages |
| ADR-002 | Base UI + owned design-system components | Accessibility behavior is reused while SmartPDF owns visual identity |
| ADR-003 | Versioned canonical document schema | Forms, preview, AI, autosave, migrations, and export share one contract |
| ADR-004 | Document-type plugin registry | CV, Invoice, Quotation and future types plug into one editor shell |
| ADR-005 | Shared HTML/CSS template renderer for preview and server PDF | Highest practical visual parity and native browser bidi/font behavior; requires hardened headless-browser export |
| ADR-006 | UI locale/direction and document locale/direction are separate | Arabic shell can edit English PDF and the inverse without mirroring errors |
| ADR-007 | Cloudflare Browser Rendering PDF Quick Action in production | Native Worker binding, no application API token, browser-quality Arabic/RTL, and a smaller attack surface than a custom renderer service |
| ADR-007 | AI returns Zod-validated patches/proposals | No silent mutation; supports granular review and undo |
| ADR-008 | Local recovery + revision-based server autosave | Protects drafts and prevents last-write-wins data loss |
| ADR-009 | CSS for common motion, Motion for layout/exit only | Smaller client cost and a restrained motion language |

## 4. System overview

```text
Browser
┌──────────────────────────────────────────────────────────────────┐
│ Next.js UI shell                                                 │
│ ├── locale + direction provider                                  │
│ ├── design-system components (Base UI behavior + tokens)         │
│ ├── document editor shell                                        │
│ │   ├── React Hook Form / Zod                                    │
│ │   ├── Zustand editor session                                   │
│ │   ├── document-type plugin                                     │
│ │   └── shared template renderer → DOM live preview              │
│ ├── IndexedDB recovery adapter                                   │
│ └── API client: autosave / AI proposals / export jobs            │
└───────────────────────────┬──────────────────────────────────────┘
                            │ authenticated typed HTTP
Server                      ▼
┌──────────────────────────────────────────────────────────────────┐
│ Next.js server boundaries / application services                 │
│ ├── auth + authorization                                         │
│ ├── document repository port → PostgreSQL/selected backend       │
│ ├── object storage port → logos and generated PDFs               │
│ ├── AI provider port → structured proposal                       │
│ └── export service / queue                                       │
│     └── isolated Chromium renderer → PDF artifact                │
└──────────────────────────────────────────────────────────────────┘
```

Backend vendor selection is intentionally outside this frontend foundation. Application code talks to repository/storage/auth ports so a vendor decision does not leak into document components.

## 5. Canonical document model

### Base metadata

```ts
type DocumentKind = 'cv' | 'invoice' | 'quotation'
type TextDirection = 'ltr' | 'rtl' | 'auto'
type PaperSize = 'A4' | 'LETTER'

interface SmartDocument<TContent> {
  id: string
  ownerId: string
  kind: DocumentKind
  schemaVersion: number
  title: string
  status: 'draft' | 'ready' | 'archived'
  templateId: string
  locale: 'en' | 'ar'
  direction: TextDirection
  paper: {
    size: PaperSize
    orientation: 'portrait' | 'landscape'
  }
  content: TContent
  revision: number
  createdAt: string
  updatedAt: string
}
```

### Document-type contract

```ts
interface DocumentTypePlugin<TContent> {
  kind: DocumentKind
  currentSchemaVersion: number
  schema: ZodSchema<TContent>
  createDefault(locale: 'en' | 'ar'): TContent
  sections: readonly EditorSectionDefinition<TContent>[]
  templates: readonly TemplateDefinition<TContent>[]
  migrations: readonly DocumentMigration[]
  validate(content: TContent): ValidationIssue[]
  preflight(document: SmartDocument<TContent>): PreflightIssue[]
  aiTools: readonly AiToolDefinition<TContent>[]
}
```

Adding a future type requires:

1. A stable kind identifier and versioned Zod content schema.
2. Defaults and migrations.
3. Section definitions/editor components.
4. One or more shared-renderer templates.
5. Validation and export preflight rules.
6. Optional AI tools expressed as allowed patch paths.
7. English and Arabic strings, fixtures, PDF snapshots, and bidi tests.
8. One registry entry. The global editor shell, autosave, AI review, and export routes remain unchanged.

### V1 content boundaries

- `cv`: profile, summary, experience[], education[], skills[], languages[], optionalSections[], ordering.
- `invoice`: issuer, client, invoice metadata, lineItems[], tax/discount, currency, payment, notes.
- `quotation`: issuer, client, quotation metadata, groups/lineItems[], terms, validity, currency, notes.
- Money is stored as integer minor units plus ISO 4217 currency, never floating-point display values.
- Dates use ISO date strings without implicit timezone when the concept is a calendar date.
- Totals are derived and validated server-side; never trust client-computed totals as authoritative.

## 6. Preview and PDF architecture

### One renderer, two environments

```text
SmartDocument + TemplateDefinition + Font manifest
                          │
              Shared React print template
                 ┌────────┴────────┐
                 ▼                 ▼
       Browser DOM preview   Isolated server HTML
       scaled page canvas    local Chromium in dev
                             Cloudflare PDF Quick Action in production
                 │                 │
                 └──── parity tests┘
```

The shared renderer accepts only validated document data and deterministic template tokens. The preview can add non-printing overlays through a separate layer; the export path never renders editor controls.

### Why HTML/CSS + Chromium

- Mature Arabic shaping, bidi, web-font, flex/grid, table, and print CSS behavior.
- The preview can render the same component tree without translating to a second PDF-specific layout language.
- Template designers use familiar CSS with real A4/Letter dimensions.

Tradeoffs:

- Browser rendering is heavier than a pure PDF library and must be protected with bounded requests, Cloudflare rate limits, and failure backpressure.
- Browser/font versions must be pinned to keep output deterministic.
- Page-break behavior needs strict template rules and snapshot tests.

### Print rules

- Templates use physical units (`mm`, `pt`) for page geometry and CSS logical properties for flow.
- Each template declares paper sizes, margins, supported scripts, font files, and a renderer version.
- Fonts are self-hosted/embedded from an allowlist; export cannot fetch arbitrary external assets.
- User text is rendered as text nodes, never raw HTML.
- Logos/images are decoded, size-limited, stripped of dangerous metadata where appropriate, and served from controlled storage.
- Production export uses inline HTML, `cacheTTL: 0`, disabled JavaScript, an embedded-`data:` network allowlist, bounded output, and sanitized failure codes. It has no Crawl, Session Recording, filesystem, command, or arbitrary URL path.

### Rendering performance

- Immediate field updates change the preview model through selector subscriptions.
- Expensive pagination is scheduled/debounced separately; it never blocks keystrokes.
- Preview templates are dynamically loaded by active document kind/template.
- Only visible pages need interactive overlays; distant preview pages may render at lower priority.
- Export always performs a fresh server validation and deterministic full render.

## 7. State ownership

| State | Owner | Examples |
|---|---|---|
| URL state | Next.js router | locale, document ID, selected template route, filters worth sharing |
| Server state | Server components / typed fetch layer | document list, templates, account, business profiles |
| Form state | React Hook Form | active document content and field errors |
| Editor session | Zustand | active section, selection, zoom, pane sizes, undo checkpoints, AI proposal UI |
| Persistent preferences | Server + cookie/local preference | UI locale, theme, page-size default |
| Recovery draft | IndexedDB adapter | latest unsynced validated document snapshot |

Rules:

- Canonical content must not be duplicated independently in React Hook Form and Zustand. Zustand stores editor metadata and proposal/undo state; form state owns the working content.
- Derived totals, completion, and preflight summaries come from pure selectors/functions.
- Avoid global stores for route-fetched data that Server Components can provide.
- Store only schema-valid recovery snapshots. Invalid in-progress field strings stay in form state until parsed or intentionally serialized as a draft field type.

## 8. Autosave, recovery, and concurrency

1. On field change, update form + preview immediately.
2. After a short idle window (target 800ms), validate and write a local IndexedDB snapshot.
3. After a longer idle window (target 2s) or section transition, send a patch with the last known `revision`.
4. Server atomically applies the patch only if the revision matches and returns the next revision.
5. `409 Conflict` triggers a recovery flow comparing timestamps/revisions; never silently choose a winner.
6. On reconnect, send the newest validated local draft after checking the server revision.
7. On successful save, keep a limited local recovery point until a newer server state is confirmed.

Save status is part of the editor contract: `idle`, `saving-local`, `saving-server`, `saved`, `offline`, `conflict`, `error`.

## 9. AI architecture

### Proposal pipeline

```text
User intent + allowed context
          ↓
AI tool definition (allowed fields, schema, policy)
          ↓
Provider structured output
          ↓
Zod parse + factual/field policy checks
          ↓
AiProposal { baseRevision, patches[], warnings[] }
          ↓
Before/after review in UI
          ↓
User accepts selected patches → one undo checkpoint → autosave
```

### Patch model

```ts
interface AiPatch {
  path: string       // allowlisted JSON pointer / typed path
  before: unknown
  after: unknown
  category: 'style' | 'translation' | 'structure' | 'fact-sensitive'
  rationale?: string
}

interface AiProposal {
  id: string
  documentId: string
  baseRevision: number
  patches: AiPatch[]
  warnings: string[]
  createdAt: string
}
```

### AI boundaries

- Provider access is server-only; no API keys in the browser.
- Send the smallest required document slice, not the entire document by default.
- Remove/limit sensitive fields from tools that do not need them.
- Treat pasted/document content as untrusted data, never as system instructions.
- Validate output size, paths, locale, enum values, and schema before proposal creation.
- Reject stale proposals when `baseRevision` no longer matches; offer regeneration against current content.
- Log metadata and error categories, not raw sensitive document content, unless explicit consent and retention policy permit it.
- AI failure never blocks manual creation/export.

## 10. Routing and layout boundaries

```text
src/app/[locale]/
├── layout.tsx                  # lang, dir, dictionaries, theme, DirectionProvider
├── (marketing)/
│   ├── page.tsx
│   ├── templates/[templateId]/page.tsx
│   ├── pricing/page.tsx
│   └── help/page.tsx
├── (auth)/auth/
│   ├── sign-in/page.tsx
│   ├── sign-up/page.tsx
│   └── forgot-password/page.tsx
└── app/
    ├── layout.tsx              # authenticated workspace shell
    ├── page.tsx
    ├── documents/
    │   ├── page.tsx
    │   ├── new/page.tsx
    │   └── [documentId]/
    │       ├── page.tsx
    │       ├── loading.tsx
    │       ├── error.tsx
    │       └── export/page.tsx
    ├── templates/page.tsx
    ├── brand/page.tsx
    ├── clients/page.tsx
    ├── settings/...            # profile, language, appearance, data
    └── trash/page.tsx
```

- All special route files stay under `[locale]`.
- Locale middleware/proxy redirects only when the URL has no supported locale.
- Editor is a normal deep-linkable route; dialogs/sheets do not replace primary navigation.
- Route loading/error boundaries preserve the workspace shell and focus behavior.

## 11. Proposed source structure

```text
src/
├── app/                         # routes and layout composition only
├── design-system/
│   ├── tokens/                  # primitives.css, semantic.css, components.css
│   ├── components/              # Button, Field, Dialog, Menu, Toast adapter...
│   └── motion/                  # tokens + reduced-motion configuration
├── features/
│   ├── documents/               # list/create/archive/duplicate
│   ├── editor/                  # editor shell, panels, session store, autosave
│   ├── preview/                 # page canvas, zoom, selection/warning overlays
│   ├── export/                  # preflight UI and job client
│   ├── ai-assist/               # proposal review and AI task UI
│   ├── business-profile/
│   └── clients/
├── document-types/
│   ├── registry.ts
│   ├── cv/
│   │   ├── schema.ts
│   │   ├── plugin.ts
│   │   ├── sections/
│   │   ├── templates/
│   │   ├── migrations/
│   │   └── fixtures/
│   ├── invoice/...
│   └── quotation/...
├── domain/
│   ├── documents/               # base types, money, validation, patching
│   ├── ai/
│   └── export/
├── i18n/
│   ├── config.ts
│   ├── direction.ts
│   └── messages/{en,ar}.json
├── infrastructure/
│   ├── api/
│   ├── recovery/
│   ├── repositories/
│   ├── storage/
│   ├── ai/
│   └── pdf/
└── test/
    ├── fixtures/
    ├── accessibility/
    ├── bidi/
    ├── visual/
    └── pdf/
```

### Import boundaries

- `domain` imports no React, Next.js, browser, database, or provider code.
- `document-types` may import domain and design-system/template primitives, not app routes.
- `features` compose document types and infrastructure adapters.
- `app` composes features and route concerns; business rules do not live in page files.
- `design-system` cannot import product features.

Enforce with ESLint restricted-import rules and architecture tests.

## 12. API contracts

Exact transport may evolve, but these boundaries should remain stable.

```text
GET    /api/documents?kind=&status=&query=&cursor=
POST   /api/documents
GET    /api/documents/:id
PATCH  /api/documents/:id         If-Match: <revision>
POST   /api/documents/:id/duplicate
POST   /api/documents/:id/archive
DELETE /api/documents/:id          soft delete
POST   /api/documents/:id/export   → { jobId }
GET    /api/export-jobs/:jobId     → queued|rendering|ready|failed
POST   /api/documents/:id/ai-proposals
DELETE /api/ai-proposals/:id
```

Requirements:

- Validate request and response at trust boundaries.
- Authorize every document by owner/workspace on the server.
- Use cursor pagination for lists.
- Use idempotency keys for create/export/AI job actions.
- Rate-limit authentication, AI, and export endpoints separately.
- Never accept computed invoice/quotation totals without recalculation.

## 13. Security and privacy

- Content is private by default; no public document URLs in V1 unless designed separately.
- Strict Content Security Policy; avoid `unsafe-eval` and arbitrary template scripts.
- Sanitize file names and never interpolate user content into HTML with `dangerouslySetInnerHTML`.
- Image uploads: MIME sniffing, size/dimension limits, randomized storage keys, malware scanning where available.
- PDF renderer: isolated process/container, blocked outbound network, strict time/memory/page limits, no local file access.
- Signed, short-lived download URLs; generated artifacts follow a documented retention policy.
- Encrypt in transit and at rest through chosen infrastructure; secrets stay server-side.
- AI: explicit disclosure, minimal context, vendor retention configuration, account-level opt-out where feasible.
- Data export and deletion flows include documents, assets, generated files, and recovery metadata.
- Audit material events: document export, permanent delete, AI proposal generation/acceptance; avoid logging raw content.

## 14. Performance budgets

### User-facing targets

- Simple input-to-preview update: <100ms median on supported hardware.
- Interaction feedback: <100ms.
- Route shell visible: <1s on warm navigation; skeleton only when necessary.
- Editor interactive: target <2.5s on a mid-range mobile connection/device for a normal one-page document.
- No cumulative layout shift from fonts, thumbnails, preview pages, or async panels.

### Techniques

- Server-render marketing and workspace lists; keep only interactive editor islands client-side.
- Dynamically import active document editor/template and Motion/dnd features.
- Memoize preview sections with stable schema-derived selectors.
- Move heavy pagination/measurement to scheduled work or a worker when profiling justifies it.
- Reserve image/page geometry and self-host subset fonts.
- Avoid sending all locale dictionaries to the client.
- Do not render hidden desktop and mobile editor variants simultaneously.

## 15. Accessibility architecture

- Root: skip link, semantic landmarks, locale `lang`, direction `dir`.
- Base UI `DirectionProvider` receives the current UI direction; document preview sets an independent direction.
- Portals mount inside a direction-aware app portal root.
- Route focus manager targets `main`/`h1` after navigation.
- Central form field component owns labels, descriptions, error linkage, and required semantics.
- Central live-region service announces save, AI, filter, and export status without moving focus.
- Preview supplies a structured text/section outline, not only a visual page.
- Reorder offers buttons and keyboard actions in addition to drag.
- Automated axe checks run in component/E2E tests; manual keyboard, NVDA, zoom, high-contrast, and reduced-motion checks are release gates.

## 16. Testing strategy

| Layer | What to test |
|---|---|
| Domain unit | money, totals, dates, migrations, document validation, patch application, preflight |
| Component | Base UI wrappers, fields, errors, focus restoration, RTL behavior, reduced motion |
| Plugin contract | every type registers schema/defaults/sections/templates/migrations/preflight |
| Integration | form → preview, autosave status, local recovery, AI proposal review, stale revision |
| E2E | create/edit/export for all three types in Arabic and English on desktop/mobile |
| Accessibility | axe + keyboard flows + screen-reader smoke tests |
| Visual | app surfaces at breakpoint matrix; LTR/RTL screenshots |
| PDF | deterministic page screenshots/PDF metadata/text extraction across template matrix |

PDF fixtures must include:

- Long Latin and Arabic names.
- Mixed Arabic/English addresses, phone numbers, URLs, and invoice IDs.
- Zero, negative/discount, large, and fractional currency cases.
- One-page, exact-boundary, and multi-page content.
- Missing optional sections and maximum repeatable items.
- A4 and Letter.

## 17. Observability

- Correlation ID across autosave, AI, and export job logs.
- Metrics: autosave latency/failure/conflict, preview render duration, export queue/render/failure, AI validation/rejection, template/page counts.
- Client error boundaries report route, feature, locale/direction, template ID/version, and sanitized error code—never document body.
- Export failure codes are actionable (`FONT_MISSING`, `PAGE_LIMIT`, `RENDER_TIMEOUT`, `INVALID_SCHEMA`) and map to localized recovery text.

## 18. Phase 2 implementation order

1. Bootstrap Next.js/TypeScript/Tailwind while preserving the three root foundation documents.
2. Add design tokens, fonts, locale routing, `lang`/`dir`, Base UI direction provider, and base components.
3. Implement domain base types, plugin registry, and schema-version/migration tests.
4. Build one vertical slice with **Invoice**: create → edit line items → live preview → preflight → mocked export.
5. Add autosave/local recovery and concurrency behavior.
6. Harden shared renderer and connect isolated PDF export.
7. Add CV and Quotation plugins using the proven contract.
8. Add AI proposal pipeline after manual creation/export is complete.
9. Complete responsive, bidi, accessibility, visual, and PDF test matrices.

Invoice is the recommended first slice because it tests repeatable items, money, totals, dates, business profiles, tables/mobile rows, preflight, and multi-page PDF behavior. If the architecture survives Invoice cleanly, CV and Quotation reuse most shell capabilities.

### Phase 2 dependency groups

```text
runtime core: next react react-dom typescript
ui: @base-ui/react tailwindcss class-variance-authority clsx
state/forms: zustand react-hook-form zod @hookform/resolvers
product utilities: next-intl sonner @phosphor-icons/react
conditional: motion @dnd-kit/core @dnd-kit/sortable
testing: vitest @testing-library/react @testing-library/user-event playwright axe-core
export worker: playwright (server/worker only)
```

Do not install `motion`, dnd kit, or export-worker dependencies into the initial client path until their slice is implemented.

## 19. Definition of architecture-ready

- [ ] Routes, pages, editor modes, navigation, and all state classes are defined in `UX_FLOW.md`.
- [ ] Tokens, components, typography, preview, AI behavior, motion, RTL, and responsive rules are defined in `DESIGN_SYSTEM.md`.
- [ ] UI library decision and dependency boundaries are documented.
- [ ] Canonical schema and document plugin contract cover all V1 types and future extension.
- [ ] Preview/export parity strategy and renderer security are explicit.
- [ ] Autosave, recovery, concurrency, and AI proposal state ownership are explicit.
- [ ] Folder/import boundaries and Phase 2 vertical-slice order are ready.
- [ ] Accessibility, bidi, performance, security, and PDF tests have release criteria.

## 20. Official references checked for volatile decisions

- [Base UI accessibility](https://base-ui.com/react/overview/accessibility)
- [Base UI Direction Provider](https://base-ui.com/react/utils/direction-provider)
- [Next.js internationalization guide](https://nextjs.org/docs/app/guides/internationalization)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind logical inset and RTL utilities](https://tailwindcss.com/docs/top-right-bottom-left)
- [Motion accessibility and reduced motion](https://motion.dev/docs/react-accessibility)
- [Motion layout animation](https://motion.dev/docs/react-layout-animations)
