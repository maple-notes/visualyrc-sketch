# Product Requirements Document — Visualyrc Sketch (draft)

## Audience and jobs
Solo creators planning videos, songs, stories, design projects, and other work across multiple boards. They need to capture thoughts instantly, arrange them visually by page, and discover links across pages.

## Product model
- **Project**: umbrella workspace.
- **Page/section**: independent infinite canvas, optional audio timing metadata.
- **Node**: canonical content, independent of display surface.
- **Placement**: view-specific representation of a node on a page.
- **Saezuri**: a node with post metadata displayed in a chronological feed.
- **Edge**: relationship between canonical nodes, even if placed on different pages.

## Core journeys
### Capture
User enters a note in Saezutter; it appears in the feed immediately with timestamp. Editing updates the canonical content everywhere it is referenced.

### Organize
User opens a page and drags a saezuri onto the canvas. The feed retains the original post. The canvas placement can move and resize without changing the underlying content or other placements.

### Connect
User enters Graph View, selects two nodes and links them. The edge persists regardless of page and can be removed without deleting either node. Clicking a node reveals its locations and navigates to a chosen page.

### Return
After reload, project, pages, nodes, placements, and edges remain available.

## Usability
- Clear distinction between deleting a placement and deleting the canonical node.
- Undo for common edits where feasible; confirm destructive node deletion.
- Visible keyboard focus; drag-and-drop has a menu/button alternative.
- Respect `prefers-reduced-motion`; no motion required to understand state.
- Desktop-first; smaller screens provide at least readable access to feed and graph.

## Nonfunctional
- Local-first by default; disclose that clearing browser data may remove work.
- No unnecessary remote requests for local content.
- Sanitize user-provided text and URLs; never execute pasted markup.
- Gracefully handle missing/blocked external previews.
- Stable performance with a test fixture of ~100 nodes across 10 pages; measure rather than promise a frame rate.

## Success measure
An evaluator understands the capture → place → connect → revisit loop in under three minutes.
