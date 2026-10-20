# Visual Direction — Visualyrc Sketch (draft)

## Concept
A believable creative instrument, not a movie-hacker HUD. References: Arknights / Endfield in-world terminal logic and Teenage Engineering tactile controls. Use references for interaction principles, **not** copyrighted asset or UI copying.

## Visual hierarchy
- Canvas: quiet, light, content-forward workspace.
- Saezutter: compact, legible chronological feed, easy capture.
- Graph: light, precise relationship workspace; same theme as Canvas (latest approval).
- Shared controls, type scale, focus states, and icon family across all views.

## Starter palette (not approved)
Paper `#F2F0EA`, soft grey `#D5D5CF`, graphite `#353C3E`, deep charcoal `#171D20`, signal lime `#D4EB70`. Accent is for selection, connections and active states, not decoration.

## Current visual target — latest user feedback

The user selected the original Drafting Terminal concept as the base,
superseding the stronger Arknights-style exploration below. Preserve its
light, spacious composition and thin separators. Add a subtle canvas grid
and small numbers, not oversized page numerals.

The user broadly accepted the revised light/purple concept, then requested
anonymous Saezutter posts without avatars; no login is required. Use separate
rounded, slightly puffy raised cards for posts and canvas materials. Keep
timestamps, color-only selection and the requested magnetic hover direction.
Use subtle surface highlights and contact shadows while retaining readable
text; do not revive the rejected glass-heavy treatment.

Follow the latest supplied sketch: vertical audio waveform, section rail,
large active-page canvas, and project-wide Saezutter from left to right.
Include local audio loading, playback controls and a visible playhead.
The current concept proposes a top transport with play/pause, stop and elapsed
time; a horizontal playhead moves down the vertical waveform. Section blocks
align with audio time and the selected section visually connects to its canvas.
Timeline scrolling and canvas pan/zoom remain distinct. These detailed motion
and scroll semantics are proposals requiring interaction validation.
Audio remains optional; retain independent pages when no audio is loaded.

The supplied AIR_MOUS_Color_Palette.pdf was visually inspected. The revised
concept proposes BG Oatmeal `#FAFAF7`, Ink Black `#0A0A0A`, Panel Charcoal
`#3A3B43`, Accent Deep Purple `#866490` and Dusty Purple `#93748A`, with
derived light selection tints. This supersedes the starter lime palette
for the current concept only; exact UI color assignments await review.

## Detailed interaction candidate

See `outputs/ui-interaction-spec.md` for the current review candidate covering
layout tokens, thin-line icons, L-shaped resize controls, restrained raised
materials, magnetic hover, local audio and section navigation. The latest
user reference establishes the icon/grip style. Earlier claims that selection
must have no resize controls are superseded: color indicates selection;
L-shaped grips provide manipulation affordances. Numeric values and playback
semantics remain recommendations, not implemented or user-approved behavior.

## Motion
Canvas → Graph: content recedes, relation lines emerge, nodes settle into graph positions, inspector appears. Aim for brief, interruptible transitions; support reduced motion and no layout jank. Transition should explain the change of representation.

## Design deliverables
One desktop shell, Canvas page, Saezutter panel, Graph View, node card states, empty/loading/error states, interaction storyboard. Screenshots from reference products supplied by the user can guide direction; do not copy their art or UI directly.

## Accessibility
Readable contrast for small labels, 44px-ish touch targets where relevant, keyboard navigation, visible focus, descriptive node/edge labels, reduced-motion fallback.

## User feedback — 2026-10-19 HST

- The first three visual concepts were refined but too flat. The interface
  should feel more like operating a terminal.
- The supplied Arknights / Endfield screenshots are references for the degree
  of depth and operational presence, not layouts or assets to reproduce.
- Selection highlights use color alone. Do not add a left vertical stripe,
  underline or other redundant selection ornament.
- The user would like a magnetic hover highlight that is attracted toward the
  pointer. This is a requested interaction direction, not implemented behavior.

### Proposed response to the feedback

The user rejected the second round of concepts as a regression. The proposed
glass, translucency and material-lighting interpretation is not approved.
At the user's request, the next single concept leans more closely toward
Arknights: strong black/white/grey panel composition, large page numbers,
small supporting labels and angular controls around a light canvas.
Exact colors and layouts remain subject to visual selection. Any generated
decorative coordinates, maps or telemetry are concept artifacts, not approved
product requirements. Do not reproduce game assets or exact layouts.

For magnetic hover, move only the highlight backplate a small distance toward
the pointer. Keep labels, element layout and hit targets fixed. Distinguish
the transient hover fill from the persistent selected fill. On pointer exit,
return the backplate to its resting position; do not change selection.

Prototype the motion after visual selection, first on page rows and mode
controls. Proposed starting values are 2–4px maximum displacement and a brief
damped return; tune through actual use. Disable the displacement for reduced
motion, touch input, text editing and canvas dragging. Preserve keyboard focus
indication independently of the color-only selected-state treatment.

The revised images are static concepts. They cannot validate the magnetic
motion, interaction performance, translucency contrast or pointer behavior.

## Latest refinement — square cards and workspace priority

The user now requires flat, square-cornered text and Saezutter cards with drop
shadow only, superseding earlier puffy-material recommendations for these items.
Saezutter is a collapsible sidebar with text/image content-type icons, not avatars.
Maximize Canvas area with compact chrome and narrow timeline rails.
The user selected the freeform overview Graph and the latest Canvas layout.
Both views use light mode. Page grouping and selected-node focus remain unselected
explorations. This supersedes earlier dark-Graph language in the design history.
See outputs/ui-interaction-spec.md for candidate behaviors and acceptance checks.

## Selected light-mode pair

Use oatmeal background #FAFAF7, offwhite flat node surfaces, charcoal #3A3B43
text and pale lavender #EDE6EF selected fill in both modes. Purple #866490
marks active controls. Graph connections use readable neutral-grey lines,
visually stronger than the faint grid. Exact contrast and line weights require
prototype verification. Preserve the selected freeform Graph composition,
collapsed Saezutter rail and compact location/action tray; no page-region frames.
Reference originals are retained in outputs/design-selected/ for provenance.
Do not implement the app until the user explicitly resumes implementation.
