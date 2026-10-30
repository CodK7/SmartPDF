# Navigation and editor state continuity

## Overview

- **Priority:** P1
- **Audit baseline:** uncommitted worktree (no Git commit exists yet)
- **Primary surfaces:** desktop sidebar, mobile Edit/Preview tabs, export state, live preview
- **Vocabulary:** Accordion / Collapse, Continuity transition, State change, Crossfade, Spatial consistency, Reduced motion

## Current behavior

- Sidebar width changes over `200ms` using a generic ease-out curve while its content swaps immediately.
- Mobile Edit/Preview state changes are immediate but the selected tab has no shared transition feedback.
- Export correctly exposes real busy text, while preview content updates immediately.
- Live preview resizing is state-driven; animating its scale would create blur or lag during resize.

## Desired behavior

- Sidebar layout updates immediately to avoid per-frame reflow; its identity swap uses an interruptible `140ms` opacity/4px logical-inline cue.
- Mobile Edit/Preview switches immediately; only the tab selection surface crossfades over `140ms` so the mode remains clear.
- Export button keeps real `Exporting…` feedback and receives no fake progress.
- Document content and preview scale remain unanimated to preserve WYSIWYG sharpness and typing responsiveness.

## Implementation

1. Keep the sidebar width update immediate and add state-entry classes for expanded content and the collapsed arrow.
2. Add short explicit background/color transitions to Edit/Preview tabs and navigation actions.
3. Preserve current real export status; use the button's common feedback contract.
4. Do not animate document text updates, preview scaling, PDF layout, or route loading geometry.
5. Verify sidebar and tab transitions are disabled under reduced motion.

## Performance and accessibility

- No animation runs while typing into editor fields.
- Sidebar feedback uses compositor-friendly opacity/transform only, with no JavaScript frame loop or animated layout property.
- The mode is communicated by `aria-selected`, color, and text/icon—not motion alone.
- All motion is interruptible by the next interaction.

## Acceptance criteria

- Repeated rapid collapse/expand remains responsive without bounce or delayed controls.
- Edit/Preview switches on the first interaction with no hidden focus trap or content flicker.
- Live preview does not animate or re-render purely for visual polish.
- Export shows only real busy state and remains disabled during generation.
- Reduced motion preserves complete functionality.

## Affected files

- `src/features/workspace/workspace-shell.tsx`
- `src/features/editor/document-editor.tsx`
- `src/features/preview/document-preview.tsx` (verification only unless a defect is found)
- `src/app/globals.css`
