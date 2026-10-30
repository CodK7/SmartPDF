# SmartPDF AI — Design System

> Version: 1.0 foundation
> Design direction: Modern, premium, minimal, professional, clean, intelligent, AI-native
> Accessibility target: WCAG 2.2 AA

## 1. Design premise

The product should feel like a precise publishing instrument: calm around the edges, confident in its hierarchy, and visually subordinate to the document being created. “Premium” comes from typography, alignment, predictable behavior, and excellent bidi/print fidelity—not gradients, glow, or ornamental glass.

### Design principles

1. **The document is the hero.** Product chrome frames the page; it never competes with it.
2. **One primary action per surface.** Visual emphasis follows task priority.
3. **Flat, not lifeless.** Use borders, spacing, subtle elevation, and state transitions instead of card proliferation.
4. **AI is a capability, not a theme.** AI controls use the same system with a restrained teal semantic accent.
5. **Density is contextual.** Forms are comfortable; tables and toolbars are compact but remain touch-accessible.
6. **Direction is data.** RTL/LTR is a first-class behavior at application, component, and document layers.
7. **Motion explains.** Movement shows source, destination, state, or progress; it does not decorate idle screens.

### Explicit anti-patterns

- Purple gradients as an AI signifier.
- Glowing blobs, neon outlines, and ambient particle motion.
- Excessive glassmorphism or translucent surfaces over content.
- A card around every group when spacing/dividers are sufficient.
- Huge rounded “toy” controls, emoji icons, and inconsistent icon weights.
- Typewriter AI responses that make completed text artificially slow.
- Hidden labels, placeholder-only inputs, and low-contrast grey-on-grey text.
- Desktop panes compressed into mobile width.

## 2. Visual identity

### Personality

| Attribute | Expression |
|---|---|
| Intelligent | Clear recommendations, structured proposals, contextual controls |
| Professional | Ink/navy neutrals, exact grid, conservative radius and elevation |
| Premium | Controlled whitespace, crisp type, excellent empty/loading states |
| Trustworthy | Visible save/export status, review before AI apply, no hidden changes |
| Bilingual | Equal typographic care and layout quality in Arabic and English |

### Signature visual motif

Use a restrained **page edge** motif: a 1px border, subtle paper shadow, and occasional crop/page markers in preview contexts. Do not turn it into a decorative pattern across all pages.

## 3. Token architecture

Use three layers. Components must never consume raw hex values or primitive spacing directly when a semantic/component token exists.

```text
Primitive values → Semantic purpose → Component contract
ink-900          → text-primary    → input-text
blue-700         → action-primary  → button-primary-bg
space-4          → field-gap       → form-section-gap
```

### 3.1 Primitive color tokens

```css
:root {
  --ink-0: #ffffff;
  --ink-50: #f8fafc;
  --ink-100: #f1f5f9;
  --ink-200: #e2e8f0;
  --ink-300: #cbd5e1;
  --ink-400: #94a3b8;
  --ink-500: #64748b;
  --ink-600: #475569;
  --ink-700: #334155;
  --ink-800: #1e293b;
  --ink-900: #0f172a;
  --ink-950: #020617;

  --blue-50: #eff6ff;
  --blue-100: #dbeafe;
  --blue-200: #bfdbfe;
  --blue-500: #3b82f6;
  --blue-600: #2563eb;
  --blue-700: #1d4ed8;
  --blue-800: #1e40af;

  --teal-50: #f0fdfa;
  --teal-100: #ccfbf1;
  --teal-600: #0d9488;
  --teal-700: #0f766e;
  --teal-800: #115e59;

  --green-50: #f0fdf4;
  --green-700: #15803d;
  --amber-50: #fffbeb;
  --amber-700: #b45309;
  --red-50: #fef2f2;
  --red-700: #b91c1c;
}
```

### 3.2 Semantic color tokens — light

```css
:root {
  color-scheme: light;
  --color-canvas: var(--ink-50);
  --color-surface: var(--ink-0);
  --color-surface-subtle: var(--ink-100);
  --color-surface-raised: var(--ink-0);
  --color-paper: var(--ink-0);

  --color-text: var(--ink-900);
  --color-text-secondary: var(--ink-600);
  --color-text-muted: var(--ink-500);
  --color-text-inverse: var(--ink-0);

  --color-border: var(--ink-200);
  --color-border-strong: var(--ink-300);
  --color-divider: var(--ink-200);

  --color-action: var(--blue-700);
  --color-action-hover: var(--blue-800);
  --color-action-soft: var(--blue-50);
  --color-focus: var(--blue-600);

  --color-ai: var(--teal-700);
  --color-ai-hover: var(--teal-800);
  --color-ai-soft: var(--teal-50);

  --color-success: var(--green-700);
  --color-success-soft: var(--green-50);
  --color-warning: var(--amber-700);
  --color-warning-soft: var(--amber-50);
  --color-danger: var(--red-700);
  --color-danger-soft: var(--red-50);

  --color-selection: var(--blue-100);
  --color-scrim: rgb(2 6 23 / 0.52);
}
```

### 3.3 Semantic color tokens — dark

Dark mode is architecture-ready and may follow light-mode V1 delivery. It changes the application shell, not the printed page.

```css
[data-theme="dark"] {
  color-scheme: dark;
  --color-canvas: #0b1220;
  --color-surface: #111827;
  --color-surface-subtle: #172033;
  --color-surface-raised: #1e293b;
  --color-text: #f8fafc;
  --color-text-secondary: #cbd5e1;
  --color-text-muted: #94a3b8;
  --color-border: #334155;
  --color-border-strong: #475569;
  --color-divider: #334155;
  --color-action: #60a5fa;
  --color-action-hover: #93c5fd;
  --color-action-soft: #172554;
  --color-focus: #60a5fa;
  --color-ai: #5eead4;
  --color-ai-hover: #99f6e4;
  --color-ai-soft: #134e4a;
  --color-paper: #ffffff;
  --color-scrim: rgb(0 0 0 / 0.64);
}
```

All foreground/background pairs must be measured in implementation. Normal text requires ≥4.5:1, large text and essential non-text UI ≥3:1. Do not infer dark-mode compliance from the light palette.

## 4. Typography

### UI families

- **English / Latin:** Inter Variable, fallback `ui-sans-serif, system-ui, sans-serif`.
- **Arabic:** Noto Sans Arabic Variable, fallback `Tahoma, Arial, sans-serif`.
- Load only used scripts and weights, use `font-display: swap`, and reserve comparable fallback metrics to reduce layout shift.
- Use one family per script; do not combine display fonts in the application shell.

### Document font registry

Templates may use approved, embedded open fonts, separate from the product UI:

- Neutral sans: Noto Sans / Noto Sans Arabic.
- Editorial CV: Source Serif 4 / Noto Naskh Arabic where the template explicitly pairs them.
- Business documents: Inter / Noto Sans Arabic.

Every template declares supported scripts, weights, and fallback behavior. Export is blocked when a required glyph cannot be embedded reliably.

### Type scale

| Token | Size / line height | Weight | Use |
|---|---:|---:|---|
| `display-lg` | `48/56` desktop, `36/44` mobile | 650 | Marketing hero only |
| `heading-xl` | `32/40` | 650 | Page title |
| `heading-lg` | `24/32` | 650 | Major section |
| `heading-md` | `20/28` | 600 | Panel title |
| `heading-sm` | `16/24` | 600 | Form section / card title |
| `body-lg` | `18/28` | 400 | Introductory copy |
| `body-md` | `16/24` | 400 | Default body and inputs |
| `body-sm` | `14/20` | 400 | Dense supporting copy |
| `label-md` | `14/20` | 550 | Labels and buttons |
| `label-sm` | `12/16` | 550 | Metadata; never critical body copy |

Rules:

- Minimum mobile body/input size is 16px.
- Arabic line height may increase by 2–4px per role without changing hierarchy.
- Heading tracking is slightly negative only for Latin headings (`-0.015em`); Arabic uses normal tracking.
- Invoice numbers, totals, dates, and aligned data use tabular figures.
- Long reading measure: 35–60 characters on mobile, 60–75 on desktop.

## 5. Spacing, sizing, and shape

### Spacing primitives

Use a 4px base with an 8px dominant rhythm.

| Token | Value | Typical use |
|---|---:|---|
| `space-0` | 0 | reset |
| `space-1` | 4px | icon micro-gap |
| `space-2` | 8px | related control gap |
| `space-3` | 12px | compact field gap |
| `space-4` | 16px | mobile gutter / control group |
| `space-5` | 20px | panel inset |
| `space-6` | 24px | desktop gutter / section gap |
| `space-8` | 32px | major form section separation |
| `space-10` | 40px | page section |
| `space-12` | 48px | large page section |
| `space-16` | 64px | marketing section |
| `space-24` | 96px | marketing-only vertical rhythm |

### Control sizing

| Component | Compact | Default | Touch/mobile |
|---|---:|---:|---:|
| Button | 32px visual / 44px hit area | 40px visual / 44px hit area | 48px |
| Input/select | 36px | 44px | 48px |
| Icon button | 32px visual / 44px hit area | 40px visual / 44px hit area | 48px |
| Segmented control | 36px | 40px | 44px |

### Radius

| Token | Value | Use |
|---|---:|---|
| `radius-xs` | 4px | page markers, small badges |
| `radius-sm` | 6px | compact fields |
| `radius-md` | 8px | buttons, inputs, menus |
| `radius-lg` | 12px | panels, dialogs, template thumbnails |
| `radius-xl` | 16px | mobile sheets only |
| `radius-full` | 999px | status dots/pills only |

Avoid making every container rounded. Page canvas corners are 2–4px because physical paper is not a bubble.

### Borders and elevation

- Default separation: 1px border using `color-border`.
- Focus ring: 2px `color-focus` plus 2px surface offset.
- `shadow-1`: menus, sticky toolbars — `0 1px 2px rgb(15 23 42 / .06), 0 4px 12px rgb(15 23 42 / .05)`.
- `shadow-2`: dialogs/sheets — `0 16px 40px rgb(15 23 42 / .16)`.
- `shadow-paper`: preview only — `0 2px 4px rgb(15 23 42 / .08), 0 16px 32px rgb(15 23 42 / .10)`.
- No colored glow. Elevation communicates stacking only.

## 6. Grid and responsive system

### Breakpoints

| Name | Range | Grid | Gutter | Product behavior |
|---|---:|---:|---:|---|
| `xs` | 320–479 | 4 columns | 16px | single-task mobile |
| `sm` | 480–767 | 4 columns | 20px | large phone |
| `md` | 768–1023 | 8 columns | 24px | tablet portrait / mode switch |
| `lg` | 1024–1279 | 12 columns | 24px | tablet landscape / compact split |
| `xl` | 1280–1535 | 12 columns | 32px | full desktop editor |
| `2xl` | ≥1536 | 12 columns | 40px | wider preview; keep form constrained |

### Container rules

- Marketing/content max width: 1200px; readable text max width: 720px.
- Workspace lists max width: 1440px.
- Editor uses the viewport, with a 64px navigation rail and 360–420px inspector on desktop.
- Use container queries inside reusable panels so editor controls respond to pane width, not only viewport width.
- Use logical properties and Tailwind logical utilities (`ps`, `pe`, `ms`, `me`, `inset-s`, `inset-e`). Physical left/right is allowed only for real page geometry.
- Fixed headers and bottom bars include safe-area insets and reserve matching content padding.

## 7. Iconography

- Use **Phosphor Icons**, outline/regular weight, as the single icon family.
- Standard sizes: 16px inline, 20px controls/navigation, 24px prominent actions.
- Do not mix regular and filled icons at the same hierarchy level. Active navigation may use `fill` only if used consistently across all nav items.
- Directional icons mirror in RTL; universal symbols do not.
- Icon-only buttons require accessible names and tooltips for sighted discovery.
- Icons support labels; they do not replace status text or document-type names.

## 8. Component specifications

### Buttons

Variants:

1. `primary`: one per surface; solid blue, white label.
2. `secondary`: white/surface with strong border.
3. `ghost`: toolbar and low-emphasis actions.
4. `ai`: restrained teal outline/soft surface; never gradient.
5. `danger`: red, reserved for confirmed destructive actions.
6. `link`: inline navigation only.

States: rest, hover, pressed, focus-visible, loading, disabled. Loading preserves width, shows a spinner plus unchanged or concise status label, and disables repeat activation.

### Inputs and text areas

- Persistent label above; optional/required indicator in text.
- Helper text below for format or consequence.
- Validate on blur for normal fields; recalculate totals as values change without showing premature red errors.
- Error includes icon + message + resolution, and is linked with `aria-describedby`.
- `dir="auto"` for mixed free text; numbers/identifiers get explicit bidi isolation.
- Textarea grows to a documented maximum then scrolls; character count appears only when a real limit exists.

### Selects, menus, dialogs, and sheets

- Build interaction behavior with Base UI primitives.
- Popovers use trigger-aware transform origin.
- Menus keep a stable width and never shift surrounding layout.
- Desktop uses dialogs for short blocking decisions; mobile uses bottom sheets for task panels where appropriate.
- Escape/back closes the top layer and returns focus to the trigger.

### Repeatable sections and line items

- Desktop: table/grid with inline editable rows, sticky totals where needed.
- Mobile: stacked rows with summary header and expandable details.
- Reorder has drag handle plus explicit Move up/down actions and keyboard support.
- Destructive row action is separated from reorder/duplicate and supports undo.

### Navigation

- Sidebar/rail active item uses soft blue background, strong text, 3px logical-start indicator, icon + label.
- Mobile bottom nav has three labeled destinations only.
- Editor mode switch is a segmented control, distinct from global navigation.
- Breadcrumbs appear at three or more levels; document title remains editable without looking like an unlabeled input.

### Toasts and alerts

- Sonner renders transient, cross-screen outcomes.
- Inline alerts render information needed to complete the current task.
- Toast timeout: 4–5 seconds for success/info; errors remain until dismissed or resolved.
- `aria-live="polite"` by default; urgent blocking errors use a focused inline alert, not an assertive toast storm.

### Skeletons and progress

- Skeletons reserve final dimensions and appear only when content is expected to take >300ms.
- Use a spinner for compact indeterminate button work; use staged progress for PDF generation.
- Never show fake percentage progress. Export phases may read: Preparing → Rendering pages → Finalizing.

## 9. Live Preview component

### Canvas anatomy

```text
Preview panel
├── Toolbar: page size | fit | zoom | page navigation | preflight
├── Optional thumbnail rail (desktop/tablet landscape)
├── Canvas background
│   └── Page stack
│       ├── Real page dimensions and margins
│       ├── Template content
│       └── Non-printing overlays: selection, warning, AI proposal
└── Status region: updating / current page / overflow count
```

### Behavior and visual rules

- Canvas background uses `color-canvas`; pages use `color-paper` and `shadow-paper`.
- Default desktop zoom is Fit page or Fit width based on available container width; mobile defaults to Fit width.
- Page gaps: 24px desktop, 16px tablet, 12px mobile.
- Selected preview region uses a 2px blue outline outside printable content; AI proposal uses teal plus a textual legend.
- Overflow is red only at the actual boundary and paired with a warning icon/message.
- Non-printing overlays are excluded from export and can be toggled off.
- Preview toolbar remains keyboard reachable; page canvas itself is not a trap.
- Provide a structured outline/text view for screen-reader users and low-powered devices.

## 10. AI-native interaction design

### Entry points

- **Context action:** next to summary, experience bullet, terms, or notes.
- **Selection action:** improve selected content.
- **Document action:** command menu for whole-document consistency or translation.
- **Creation action:** convert pasted content/brief into a structured draft.

### AI control states

| State | UI treatment | User control |
|---|---|---|
| Ready | Teal outline/label; examples relevant to context | Open or dismiss |
| Requesting context | Compact fields, no generic chat wall | Edit prompt / cancel |
| Working | Meaningful task label + cancel | Continue editing elsewhere where safe |
| Proposal ready | Before/after or field-level diff | Accept all/field, regenerate, dismiss |
| Partial result | Completed fields visible; failed fields identified | Retry failed only |
| Error | Cause when known; original untouched | Retry / edit request |
| Applied | Brief check + undo checkpoint | Undo |

### Trust rules

- Never fabricate dates, employers, prices, tax rates, client details, or legal terms.
- Highlight factual changes separately from style changes.
- Present translation as a proposal and preserve the source.
- Explain data handling near the first AI action and in settings.
- AI output must conform to the document schema before it can enter editor state.
- Do not use an omnipresent floating sparkle button; place AI where it has clear context.

## 11. Motion language

The vocabulary below is intentionally limited. Descriptions use the Animation Vocabulary glossary so design and engineering share exact terms.

### Approved vocabulary

- **Hover effect** — A short color, border, or elevation response that confirms an interactive target before activation.
- **Press / Tap feedback** — A subtle scale-down when an element is clicked, so it feels physical.
- **Focus feedback** — A visible focus ring and restrained surface response for keyboard navigation.
- **Enter / Exit animation** — A short transition when a temporary layer appears or disappears; exit is never slower than entry.
- **Origin-aware animation** — An element animates out of its trigger, like a popover growing from the button that opened it instead of from its own center which is the default in CSS.
- **Scale in** — A small element scales from slightly smaller to full size while appearing.
- **Fade in / Fade out** — Opacity communicates temporary layer presence without moving surrounding content.
- **Layout animation** — When an element's size or position changes, it animates to the new spot instead of snapping.
- **Continuity transition** — A change that keeps the user oriented by visually connecting before and after. For example, making the same rectangle bigger and smaller.
- **State change** — A short color/opacity response that makes selection, busy, error, or success states perceivable without relying on motion alone.
- **Skeleton / Pulse** — A geometry-preserving placeholder with a calm opacity pulse while content loads.
- **Purposeful animation** — Motion should serve a function — orient, give feedback, show relationships — not just decorate.
- **Spatial consistency** — Animating so an element keeps its identity and position across states, so users never lose track of where things went.
- **Reduced motion** — Respecting the user's prefers-reduced-motion setting by toning down or removing motion.

### Motion tokens

| Token | Duration | Easing | Use |
|---|---:|---|---|
| `motion-instant` | 100ms | ease-out | immediate color/opacity feedback |
| `motion-fast` | 140ms | ease-out | hover, press, tab state, popover |
| `motion-base` | 180ms | ease-out | dialog and surface state |
| `motion-deliberate` | 240ms | ease-in-out | reserved for infrequent larger movement |

Suggested curves:

```css
:root {
  --ease-out: cubic-bezier(.23, 1, .32, 1);
  --ease-in-out: cubic-bezier(.77, 0, .175, 1);
  --ease-drawer: cubic-bezier(.32, .72, 0, 1);
}
```

### Usage map

| Interaction | Motion |
|---|---|
| Button/icon press | `0.98` scale for 140ms; no surrounding layout shift |
| Hover and focus | Explicit color/border/shadow properties for 140ms; focus ring remains visible |
| Popover | Origin-aware scale `0.96→1` + fade for 140ms |
| Dialog | Centered scale `0.98→1` + fade for 180ms; backdrop fade for 140ms |
| Sidebar collapse/expand | Layout updates immediately; the outgoing/incoming sidebar identity uses a 140ms fade/4px logical-inline cue |
| Edit ↔ Preview | Content switches immediately; selected-tab surface changes for 140ms |
| Live Preview edits | No animation; text and layout update immediately to protect WYSIWYG accuracy |
| PDF export | Real busy label only; no spinner or invented progress for near-instant work |
| Loading | Geometry-preserving Skeleton/Pulse at 1800ms; static under reduced motion |

### Motion limits

- Animate only transform and opacity for spatial motion; color/border/shadow transitions are short and interaction-bound.
- No parallax, float, marquee, automatic orbit, ambient idle animation, or pulsing outside loading skeletons.
- No stagger in lists or marketing content.
- Document content, page scale, and crop dragging never receive decorative transitions.
- Reduced motion removes spatial scaling/translation and skeleton animation while preserving color, labels, focus, and complete functionality.
- Motion never blocks input, and all animations must be interruptible.
- CSS handles every current transition; no animation library is required.

## 12. RTL/LTR component contract

There are two independent directions:

```ts
type UiDirection = 'ltr' | 'rtl'
type DocumentDirection = 'ltr' | 'rtl' | 'auto'
```

- The application root sets `dir` from the UI locale and wraps interactive primitives in Base UI `DirectionProvider`.
- The preview page sets its own `dir` from document metadata, even when opposite to the shell.
- Portal roots inherit/provide direction explicitly.
- Components use inline/block logical tokens; no `left`/`right` naming in component APIs.
- Table column order follows document semantics, not blind mirroring. Currency amount alignment is end-aligned in either direction.
- Test Arabic UI + English document, English UI + Arabic document, and mixed field values as separate cases.

## 13. Accessibility and quality gates

- All interactive controls: keyboard operable, semantic role, accessible name, visible focus.
- Minimum 44×44px pointer target; 48px preferred on mobile.
- Contrast: 4.5:1 normal text, 3:1 large text/non-text essential UI.
- No color-only status. Pair icon, text, and/or shape.
- Focus is trapped/restored in modal layers and moved deliberately after route/error events.
- Screen-reader live regions announce save, AI, filter results, and export status without stealing focus.
- Browser zoom to 200%, text scaling, forced colors, high contrast, reduced motion, and keyboard-only flows are tested.
- Automated checks: axe and Lighthouse; manual checks: NVDA on Windows, VoiceOver on iOS/macOS when available.
- Visual QA sizes: 320, 375, 480, 768, 1024, 1280, 1440, 1920 and landscape mobile/tablet.
- PDF QA matrix: document type × template × English/Arabic/mixed × A4/Letter × 1/multi-page.

## 14. Design implementation checklist

- [ ] Primitive, semantic, and component tokens exist as separate files/layers.
- [ ] No raw color/spacing values inside product components.
- [ ] Inter and Noto Sans Arabic load without layout shift; PDF fonts are embedded.
- [ ] Base UI primitives receive the current direction, including portals.
- [ ] Focus, hover, pressed, loading, disabled, error, and success states are present.
- [ ] Mobile editor uses Edit/Preview/AI modes and meets safe-area rules.
- [ ] Page preview preserves exact ratio and reserves geometry while loading.
- [ ] AI output is displayed as a proposal with granular accept/reject and undo.
- [ ] Motion uses only approved terms/tokens and respects reduced motion.
- [ ] Light and dark application surfaces are tested independently; printed paper is not inverted.
