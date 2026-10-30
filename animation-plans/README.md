# SmartPDF animation audit

Audit baseline: uncommitted worktree (no Git commit exists yet).

| Priority | Plan | Outcome |
|---|---|---|
| P1 | [001 — Unified motion tokens and control feedback](./001-unified-motion-tokens.md) | One calm timing/easing system; explicit hover, press, focus, and loading behavior. |
| P1 | [002 — Origin-aware overlays](./002-origin-aware-overlays.md) | Date popovers and photo crop dialog enter/exit from the correct visual origin. |
| P1 | [003 — Navigation and editor state continuity](./003-navigation-editor-continuity.md) | Short sidebar and Edit/Preview state feedback without animating document content. |

The audit intentionally rejects hero reveals, ambient page motion, document-content animation, list staggering, and a new animation dependency. They do not improve task comprehension and would add distraction or rendering cost.
