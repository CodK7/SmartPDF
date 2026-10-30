# Origin-aware overlays

## Overview

- **Priority:** P1
- **Audit baseline:** uncommitted worktree (no Git commit exists yet)
- **Primary surfaces:** invoice date picker popover, profile photo crop dialog
- **Vocabulary:** Origin-aware animation, Scale in, Fade in, Fade out, Enter / Exit animation, Reduced motion

## Current behavior

- The date picker and crop dialog appear and disappear without a shared enter/exit contract.
- The popover does not use Base UI's trigger-aware transform origin.
- The dialog backdrop appears abruptly and the dialog has no short spatial cue.

## Desired behavior

- Date picker: trigger-origin `scale(.96 → 1)` plus opacity over `140ms` ease-out; exit uses the same short, interruptible transition.
- Crop dialog: centered `scale(.98 → 1)` plus opacity over `180ms`; backdrop fades over `160ms`.
- No bounce, overshoot, animated blur, or delayed input.
- Reduced motion removes scaling and keeps only an immediate state change.

## Implementation

1. Use Base UI `data-starting-style` and `data-ending-style` states on popup/backdrop elements.
2. Bind the popover transform origin to `var(--transform-origin)`.
3. Apply shared motion tokens and explicit `transform, opacity` transition properties.
4. Add matching lightweight feedback to close, month navigation, day selection, and crop upload actions.

## Performance and accessibility

- Transitions use `transform` and `opacity`; no layout properties or filter animation.
- Base UI continues to own focus trapping/restoration, Escape handling, and layer semantics.
- Motion does not delay interaction and is removed for reduced-motion users.

## Acceptance criteria

- Popover opens from its trigger and closes without a hard cut.
- Dialog and backdrop enter/exit together, with exit no slower than entry.
- Keyboard navigation and focus restoration are unchanged.
- No overlay transition remains active under reduced motion.

## Affected files

- `src/features/editor/date-picker-field.tsx`
- `src/features/editor/profile-photo-field.tsx`
- `src/app/globals.css`
