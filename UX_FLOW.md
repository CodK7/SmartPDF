# SmartPDF AI — Product & UX Blueprint

> Status: Phase 1 source of truth
> Scope: V1 supports CV / Resume, Invoice, and Quotation
> Product languages: English (`en`, LTR) and Arabic (`ar`, RTL)

## 1. Product definition

SmartPDF AI is a document-creation workspace, not a generic text editor and not an AI chat wrapper. A user supplies structured information, sees an immediate page-accurate preview, improves the content with optional AI help, and exports a professional PDF without learning layout software.

### Core promise

“From structured information to a polished, export-ready PDF with no layout work.”

### Primary jobs to be done

1. **CV creator:** turn career information into a credible, ATS-aware CV in either Arabic or English.
2. **Small business operator:** create a correct invoice quickly, reuse client/business data, and export it.
3. **Sales or freelance professional:** prepare a clear quotation, revise line items, and convert it later into another business document.
4. **Returning user:** find, duplicate, update, and re-export a previous document without rebuilding it.

### Product principles

- **Structured first:** forms and document-specific controls are the primary interface; free-form AI is secondary.
- **Preview is truth:** every meaningful edit must be reflected in the preview quickly and predictably.
- **AI proposes, the user decides:** AI never silently overwrites data or exports on the user’s behalf.
- **Progressive disclosure:** show the minimum needed to complete the current document section.
- **Bilingual by architecture:** UI locale and document language/direction are independent settings.
- **Professional restraint:** no decorative AI theater, unnecessary cards, or motion that competes with the document.
- **Recoverability:** autosave, version-safe AI suggestions, undo, and clear recovery paths prevent data loss.

### V1 scope

- Create, edit, duplicate, archive, and delete documents.
- Start from a document type and template.
- Real-time structured preview.
- Document-specific validation and calculations.
- AI-assisted drafting, rewriting, summarizing, tone adjustment, and field extraction where appropriate.
- Export to PDF in A4 and Letter where the template permits it.
- English and Arabic application UI, LTR and RTL, and English/Arabic document content.

### Explicit non-goals for V1

- Full freeform canvas/layout editor.
- Real-time multi-user collaboration.
- Electronic signatures, payments, accounting, or tax filing.
- DOCX import/export.
- Arbitrary user-created templates.
- AI auto-export or irreversible bulk rewriting.

## 2. Users and UX risks

| User | Context | Needs | Main risk to solve |
|---|---|---|---|
| First-time job seeker | Mobile-first, incomplete content | Guidance and examples | A long, intimidating CV form |
| Experienced professional | Desktop, existing CV content | Fast import and refinement | AI changing facts or tone |
| Freelancer / SME owner | Repeated invoices and quotes | Saved business/client data | Calculation or currency errors |
| Arabic-first user | RTL UI and Arabic document | Native, not mirrored-afterthought UX | Broken direction, punctuation, tables, PDF fonts |
| Bilingual user | Arabic UI with English document, or inverse | Independent language controls | Coupling app direction to document direction |

## 3. Complete page inventory

### Public and account pages

| Route | Page | Purpose | Primary action |
|---|---|---|---|
| `/[locale]` | Landing | Explain the value with one real editor/preview demonstration | Create a document |
| `/[locale]/templates` | Public template gallery | Browse CV, invoice, and quotation templates | Use template |
| `/[locale]/templates/[templateId]` | Template detail | Preview pages, language support, and page sizes | Use this template |
| `/[locale]/pricing` | Pricing | Explain plans and export/AI limits if monetization is enabled | Start / upgrade |
| `/[locale]/help` | Help center | Search task-based guidance | Open guide |
| `/[locale]/privacy` | Privacy | Explain data and AI processing | — |
| `/[locale]/terms` | Terms | Legal terms | — |
| `/[locale]/auth/sign-in` | Sign in | Authenticate returning users | Sign in |
| `/[locale]/auth/sign-up` | Create account | Create an account | Continue |
| `/[locale]/auth/forgot-password` | Password recovery | Request reset | Send reset link |
| `/[locale]/auth/reset-password` | Reset password | Set a new password | Save password |

### Authenticated workspace pages

| Route | Page | Purpose | Primary action |
|---|---|---|---|
| `/[locale]/app` | Workspace home | Recent documents, resume draft, quick create | New document |
| `/[locale]/app/documents` | Documents | Search, filter, sort, duplicate, archive | New document |
| `/[locale]/app/documents/new` | Create flow | Choose type, template, and creation mode | Continue |
| `/[locale]/app/documents/[documentId]` | Editor | Structured input, AI assistance, live preview | Export PDF |
| `/[locale]/app/documents/[documentId]/export` | Export review | Preflight, page size, file name, final generation | Download PDF |
| `/[locale]/app/templates` | Workspace templates | Browse compatible templates with user data preview | Apply template |
| `/[locale]/app/brand` | Business profile | Reusable issuer/company details, logo, tax and payment details | Save profile |
| `/[locale]/app/clients` | Clients | Reusable client records for invoices and quotations | Add client |
| `/[locale]/app/settings/profile` | Profile | Name, avatar, preferences | Save changes |
| `/[locale]/app/settings/language` | Language & region | UI language, locale, timezone, default currency/page size | Save preferences |
| `/[locale]/app/settings/appearance` | Appearance | Theme and reduced-motion override | Save preferences |
| `/[locale]/app/settings/data` | Data & privacy | AI data controls, export account data, delete account | Manage data |
| `/[locale]/app/trash` | Trash | Restore or permanently delete documents | Restore |

### System pages and route states

- `loading`: route-level skeleton preserving the final layout geometry.
- `error`: recoverable error with retry and support code; user drafts remain local.
- `not-found`: clear route back to Documents.
- `offline`: editing remains available for the open draft where possible; export and AI are disabled with explanation.
- `maintenance`: read-only access to recent local drafts if available.

## 4. Information architecture

```text
SmartPDF AI
├── Public
│   ├── Product / landing
│   ├── Templates
│   │   └── Template detail
│   ├── Pricing
│   ├── Help
│   └── Legal
├── Authentication
└── Workspace
    ├── Home
    ├── Documents
    │   ├── New document
    │   ├── Editor
    │   │   ├── Content sections
    │   │   ├── Design & template
    │   │   ├── AI suggestions
    │   │   ├── Live preview
    │   │   └── Export preflight
    │   └── Trash
    ├── Templates
    ├── Business data
    │   ├── Brand / issuer profile
    │   └── Clients
    └── Settings
        ├── Profile
        ├── Language & region
        ├── Appearance
        └── Data & privacy
```

### Navigation model

#### Desktop (≥1280px)

- Persistent 240px sidebar: logo, Home, Documents, Templates, Business data, Settings.
- “New document” is the single high-emphasis sidebar action.
- Workspace top bar: page title/breadcrumb, search, language switcher, help, account menu.
- The editor uses a focused shell: back to Documents, editable title, save status, undo/redo, document language, preview controls, Export. The general sidebar collapses to a 64px rail to preserve canvas space.

#### Tablet (768–1279px)

- 72px navigation rail in landscape; drawer triggered from the top bar in portrait.
- Editor in landscape may show input and preview split 44/56 when space allows.
- Editor in portrait uses explicit `Edit` and `Preview` modes; never a squeezed desktop split.

#### Mobile (<768px)

- Top-level app uses a bottom bar with three destinations: Documents, New, Templates. Settings and business data live in the account sheet.
- The editor removes the global bottom bar. It has a compact header and a sticky mode switch: `Edit`, `Preview`, `AI`.
- Only one primary task surface is shown at a time. The user can swipe only where a visible tab control provides the same action; gestures are never required.

## 5. Primary end-to-end flow

### Flow A — Create a first document

1. User selects **Create document**.
2. Chooses `CV`, `Invoice`, or `Quotation`.
3. Chooses a template after seeing page thumbnails, supported languages, and A4/Letter support.
4. Chooses a starting method:
   - **Start with AI:** describe goals or paste existing content; AI extracts a structured draft.
   - **Start manually:** begin with clearly grouped fields and examples.
   - **Use saved data:** available for business documents when a business/client profile exists.
5. Reviews the generated or initial structured data before it is applied.
6. Enters the editor with the first incomplete section open and the live preview visible or one tap away.
7. Completes sections; progress is based on required information, not an artificial percentage.
8. Uses AI at field or section level if desired. Every change appears as a reviewable proposal.
9. Opens Export. Preflight checks missing required data, page overflow, unsupported glyphs/fonts, totals, and page size.
10. Fixes issues or acknowledges warnings.
11. Generates and downloads the PDF. Success offers `Open`, `Download again`, and `Duplicate`, not a dead-end celebration screen.

### Flow B — Return to a draft

1. Workspace shows recent documents and exact save status.
2. User opens a draft; input, preview position, open section, zoom, and device-appropriate mode are restored.
3. If local changes are newer than the server, SmartPDF presents a timestamped recovery choice rather than silently overwriting.
4. Autosave runs after editing pauses; the header communicates `Saving…`, `Saved`, `Offline — saved on this device`, or `Couldn’t sync — Retry`.

### Flow C — AI-assisted change

1. Entry point is contextual: `Improve summary`, `Shorten`, `Make more formal`, `Extract line items`, or `Ask AI`.
2. A compact request sheet gathers only missing context: desired tone, target role, or business constraint.
3. The system shows a meaningful status such as `Drafting a shorter summary` rather than a theatrical typing animation.
4. Result is returned as a structured patch with before/after comparison.
5. User accepts all, accepts individual fields, asks for another version, or dismisses.
6. Accepted changes create one undo checkpoint and update the preview.
7. On failure, the original content remains untouched and retry is available.

### Flow D — Export

1. User opens Export from the editor.
2. Preflight groups results into:
   - **Blocking issues:** missing required invoice number, invalid totals, unsupported font.
   - **Warnings:** sparse second page, long unbroken URL, content close to page edge.
   - **Ready:** page count, paper size, direction, and file name.
3. Selecting an issue returns focus to the exact field and highlights the corresponding preview region.
4. Export button becomes a progress button and cannot be double-triggered.
5. If generation fails, the user keeps the draft and receives cause + recovery action.

## 6. Document-specific flows

### CV / Resume

Sections are ordered: Basics → Target role & summary → Experience → Education → Skills → Optional sections → Design → Export.

- Sections are reorderable on desktop/tablet and have keyboard-accessible move up/down controls everywhere.
- On mobile, reordering defaults to explicit move controls; drag is an enhancement.
- AI actions: draft/shorten summary, rewrite achievement bullets, identify missing measurable outcomes, translate with review.
- Validation warns about unexplained long text, inconsistent dates, and page overflow; it does not claim guaranteed ATS scoring.

### Invoice

Sections are ordered: Issuer → Client → Invoice details → Line items → Tax/discount → Payment details → Notes → Export.

- Totals recalculate immediately and use locale-aware currency formatting.
- Line items use a compact table on desktop and stacked editable rows on mobile.
- Tax labels remain configurable because tax terminology differs by jurisdiction.
- AI can extract line items from pasted text but cannot invent prices or tax rates without explicit confirmation.

### Quotation

Sections are ordered: Issuer → Client → Quote details → Scope/line items → Terms → Validity → Notes → Export.

- Optional grouping by phase or deliverable.
- Expiry/valid-until date is visible in preview and preflight.
- Future conversion to invoice is represented in the data model but is not a V1 action unless implemented end-to-end.

## 7. Editor UX by device

### Desktop

```text
┌ Focused header: Back | Title | Save | Undo/Redo | Language | Export ┐
├ Nav rail ┬ Inspector / structured form ┬ Live page preview          ┤
│ 64 px    │ 360–420 px, section nav     │ flexible, centered canvas  │
│          │ AI actions stay contextual  │ zoom + page navigation     │
└──────────┴─────────────────────────────┴─────────────────────────────┘
```

- Inspector and preview may scroll independently only on desktop, with clear focus and no scroll trapping.
- Clicking a preview section focuses its related editor section when a mapping exists.
- Width handles are optional; default pane widths must already work from 1024–1920px.

### Tablet

- **Landscape ≥1024px:** two panes with collapsible section index.
- **Portrait 768–1023px:** full-width edit/preview modes with preserved scroll position per mode.
- Export, undo, save state, and document title remain reachable in the header.
- On-screen keyboard must not cover the active field or sticky action.

### Mobile — a real mobile flow

- Start in `Edit`, showing one accordion section at a time and a clear next incomplete section.
- `Preview` is a full-screen page viewer with fit-width default; pinch zoom is optional and visible zoom controls remain available.
- `AI` opens a task-oriented panel, not a desktop chat sidebar squeezed into 360px.
- Line items and repeatable CV entries become stacked rows with explicit Add, Duplicate, Move, and Delete actions.
- Sticky bottom action changes contextually: `Next section`, `Review changes`, or `Export`.
- Autosave and validation use compact inline status; toasts are reserved for cross-screen outcomes.
- Back behavior: close sheet → exit focused field → return to document list. Unsaved local changes trigger a confirmation only when recovery is not guaranteed.

## 8. Live preview UX

### Required controls

- Page size (`A4`, `Letter`) where supported.
- Zoom menu: `Fit page`, `Fit width`, 50–200%.
- Previous/next page and `page n of m`.
- Toggle page thumbnails on larger screens.
- Preview refresh/status for slow layout recalculation.
- Open export preflight.

### Preview behavior

- The preview uses the same document schema and template renderer as export.
- Page dimensions and margins are real, not a decorative approximation.
- Content overflow is indicated at the responsible field and page boundary.
- During typing, lightweight text/layout updates are immediate; expensive pagination is scheduled without blocking input.
- AI proposals can be highlighted temporarily in preview, with a legend and a no-highlight view.
- UI direction never forces document direction. An English CV can be previewed LTR inside an Arabic RTL application shell.
- Dark app theme never inverts the document page; paper remains the template’s defined print appearance.

## 9. States and feedback

| Context | Loading | Empty | Error | Success |
|---|---|---|---|---|
| Workspace | Document-row skeletons | “Create your first document” + type choices | Retry with cached recent items | New document appears and receives focus |
| Template gallery | Aspect-ratio-reserved thumbnail skeletons | Explain active filters + clear filters | Retry thumbnails/list separately | Applied template with undo |
| Editor load | Fixed pane skeletons; no layout jump | Not applicable | Recover local draft / retry server | Draft ready; focus restored |
| Autosave | `Saving…` in header | — | `Couldn’t sync` + retry; local copy retained | `Saved` with timestamp on demand |
| AI | Purpose-specific progress + cancel | Suggested starter actions | Original unchanged + retry/edit request | Reviewable proposal, never auto-applied |
| Preview | Page skeleton at correct ratio | Empty document guidance mapped to first field | Keep editor usable + retry preview | Updated without celebratory toast |
| Export | Determinate phases when possible | — | Cause + retry; no duplicate exports | Download ready + open/download again |
| Search/filter | Inline list skeleton only if remote | Query-aware empty state + clear filter | Keep previous results + retry | Result count announced politely |

### Feedback rules

- Field errors appear after blur or submit, directly under the field.
- Multiple export errors get a summary with links to each field.
- Success toasts auto-dismiss in 4–5 seconds, do not steal focus, and use `aria-live="polite"`.
- Destructive actions use confirmation only when undo/recovery is not available. Archive/delete should prefer an Undo toast.
- Color is never the only indicator; pair icon, label, and status text.

## 10. English, Arabic, RTL, and localization

- Locale routes are explicit: `/en/...` and `/ar/...`.
- The root layout sets both `lang` and `dir`.
- The selected UI locale is persisted, but first visit may use browser preference with a visible override.
- Use CSS logical properties (`margin-inline`, `padding-inline`, `inset-inline-start`) and direction-aware icons.
- Text arrows and back/forward icons mirror; universal symbols such as download, plus, play, and check do not.
- Numbers, currencies, dates, and plural rules use `Intl.*` with an explicit locale and currency.
- User-entered text fields use `dir="auto"` where mixed content is expected; structured document sections inherit the document direction unless overridden.
- Email addresses, URLs, invoice numbers, phone numbers, and code-like identifiers are isolated with `bdi` and appropriate direction.
- Translation keys describe intent, not English copy. Avoid concatenated sentences.
- Layouts are tested with 30–40% text expansion in both languages.
- Arabic QA includes punctuation, Arabic and Latin digits, mixed brand names, long unbroken references, line-item tables, and PDF font embedding.

## 11. Accessibility contract

Target: WCAG 2.2 AA.

- Complete workflow is usable with keyboard only.
- Visible 2–3px focus indicator with at least 3:1 contrast against adjacent colors.
- Tab order follows visual order in both RTL and LTR.
- All icon-only controls have accessible names; tooltips do not replace names.
- Form fields have persistent labels, descriptions where needed, `aria-invalid`, and linked error text.
- After failed submit/export, focus moves to the error summary, then users can jump to the first invalid field.
- Dialogs and sheets trap focus, close with Escape, and restore focus to their trigger.
- Route changes move focus to the page heading/main region and announce the new context.
- Touch targets are at least 44×44px, with at least 8px separation where accidental activation is likely.
- Zoom to 200% must not hide actions or require two-dimensional scrolling, except the document canvas itself.
- Drag/reorder always has keyboard and button alternatives.
- Motion respects `prefers-reduced-motion`; no essential meaning depends on animation.
- Preview has a structured text outline alternative so the PDF is not the only readable representation.

## 12. Success metrics and instrumentation

### Product metrics

- Time to first valid preview.
- Time from create flow to first successful export.
- Creation-flow completion by document type, device, and locale.
- Export preflight failure rate and top blocking issues.
- Draft recovery success and autosave failure rate.
- AI proposal acceptance, partial acceptance, undo, and retry rates; never treat raw AI usage as success.
- Mobile completion parity versus desktop.

### UX quality gates

- Median input-to-preview update under 100ms for simple fields.
- No data loss in tested offline/reconnect scenarios.
- Zero blocking accessibility violations in automated tests; keyboard and screen-reader manual sign-off.
- Visual/PDF snapshot coverage for all templates in English, Arabic, mixed-direction, A4, and Letter.
- All required flows work at 320, 375, 768, 1024, 1280, 1440, and 1920px plus tablet landscape.

## 13. V1 UX acceptance checklist

- [ ] A new user can create each document type manually without invoking AI.
- [ ] AI-generated content is reviewed before application and can be undone.
- [ ] UI locale and document language/direction can be changed independently.
- [ ] Mobile uses mode switching, not a compressed three-pane desktop layout.
- [ ] Export preflight links every issue to its source field.
- [ ] Local recovery exists when autosave cannot reach the server.
- [ ] Empty, loading, error, offline, and success states exist for every primary surface.
- [ ] All primary actions have keyboard, touch, screen-reader, and reduced-motion behavior defined.
- [ ] Adding a future document type does not require redesigning navigation or the editor shell.
