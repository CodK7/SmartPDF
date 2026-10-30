# Unified motion tokens and control feedback

## Overview

- **Priority:** P1
- **Audit baseline:** uncommitted worktree (no Git commit exists yet)
- **Primary surfaces:** global design tokens, buttons, links, inputs, selection cards, document cards, skeletons
- **Vocabulary:** Press / Tap feedback, Hover effect, Focus feedback, Skeleton, Reduced motion, Purposeful animation

## Current behavior

- Durations and curves are split between Tailwind defaults, `duration-150`, `duration-200`, and broad `transition` declarations.
- Broad transitions include properties that never need animation and make later visual changes harder to predict.
- Focus is visible, but hover/press feedback is not consistently timed across links, buttons, cards, and field controls.
- Reduced motion globally collapses every transition, including non-spatial color feedback.

## Desired behavior

- Shared CSS tokens: `100ms`, `140ms`, `180ms`, and `240ms` with explicit ease-out/ease-in-out curves.
- Controls animate only their intended background, border, color, opacity, shadow, or transform properties.
- Press feedback uses `scale(.98)` for `140ms` and never shifts surrounding layout.
- Loading skeletons reserve final geometry and use a calm opacity pulse; they become static in reduced-motion mode.
- Reduced motion removes spatial transforms and non-essential animation while retaining immediate, perceivable state changes.

## Implementation

1. Add motion duration/easing tokens and reusable motion utility classes to `src/app/globals.css`.
2. Replace broad transitions in `Button`, `Field`, landing CTA, document cards, and create-type cards with explicit properties.
3. Apply the same hover/press/focus timing to icon actions, navigation actions, date controls, skill chips, and upload controls.
4. Replace scattered `animate-pulse` usage with one skeleton class.
5. Scope `prefers-reduced-motion` to spatial/animated utilities instead of disabling useful color feedback globally.

## Performance and accessibility

- Frequent motion is limited to compositor-friendly `transform` and `opacity`; color/border transitions are short and interaction-bound.
- No `transition: all`, scroll-linked motion, stagger, blur animation, or JavaScript animation loop.
- Focus rings remain immediate and visible; disabled controls do not animate.

## Acceptance criteria

- No broad `transition` declarations remain in product components.
- All press feedback is subtle and consistent, with no bounce or glow.
- Skeletons have stable dimensions and stop moving under reduced motion.
- Keyboard focus and state changes remain perceivable with motion disabled.

## Affected files

- `src/app/globals.css`
- `src/design-system/components/button.tsx`
- `src/design-system/components/field.tsx`
- `src/features/marketing/landing-page.tsx`
- `src/features/documents/create-document-page.tsx`
- `src/features/documents/dashboard-page.tsx`
- editor control components as discovered during implementation
