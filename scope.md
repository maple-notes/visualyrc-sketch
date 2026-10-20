# Scope — Visualyrc Sketch hackathon MVP (draft)

> Historical starter draft. Current review candidate: `devpost/scope.md` (status: draft). Later decisions supersede conflicting text below.

## Problem
Creative ideas arrive out of order. Conventional whiteboards separate pages, while feeds capture chronology but not spatial relationships. People lose the connection between ideas as they move from collection to arrangement.

## Single compelling demo
1. Create a project and two canvas pages.
2. Post a short idea to Saezutter.
3. Drag it into page A without removing it from Saezutter.
4. Add a text/image item to page B.
5. Link the two items in Graph View, then jump from the graph back to the source page.
6. Reload the app: content, placements, and links survive.

## P0: must work end-to-end
- Project creation/open; browser persistence.
- Add/rename/delete pages (deletion requires confirmation).
- Per-page pan/zoom canvas, text cards and image cards.
- Saezutter create/edit/delete and chronological display.
- Drag saezuri onto canvas as a reference placement.
- Node/placement/edge identity and persistence.
- Graph View showing cross-page links; create/remove links; navigate to source.
- Keyboard and mouse basic accessibility, visible error/empty states.

## P1: only after P0 is reliable
- Import/export JSON; URL cards and link preview fallback.
- Smooth Canvas ↔ Graph transition respecting reduced-motion preference.
- Audio upload, waveform, section timing and navigation.

## Not in hackathon MVP
- Multiplayer/collaboration, accounts/cloud sync, full rich-text editor, freehand drawing, full external social embeds, Studio integration, AI generation, semantic analysis, complex graph auto-layout configuration.

## Definition of done
- A new user can complete the demo flow without instructions.
- No data loss in a reload test and a page navigation test.
- Automated tests cover node identity, placement references, and cross-page edges.
- Public demo works in a clean browser profile; no paid API keys required.
- README includes setup, privacy/storage limitations, and attribution.

## Scope rule
Any new idea goes to `BACKLOG.md`, not directly into implementation, until P0 is stable.
