# Technical Specification — Visualyrc Sketch (draft)

## Proposed architecture (subject to repository inspection)
Web SPA, TypeScript. Candidate stack: React + Vite; React Flow / xyflow for graph and possibly canvas; IndexedDB via a thin repository abstraction. Select libraries only after evaluating drag, nested coordinate behavior, license and bundle size. No Electron requirement.

## Canonical data model
```ts
type ID = string;
type Project = { id: ID; name: string; pageIds: ID[]; createdAt: string; updatedAt: string };
type Page = { id: ID; projectId: ID; title: string; order: number; audioRange?: { startMs: number; endMs: number } };
type Node = { id: ID; projectId: ID; kind: 'text'|'image'|'url'|'saezuri'; content: unknown; createdAt: string; updatedAt: string };
type Placement = { id: ID; pageId: ID; nodeId: ID; x: number; y: number; width: number; height: number; zIndex: number };
type Edge = { id: ID; projectId: ID; sourceNodeId: ID; targetNodeId: ID; relation: 'related'|'sequence'; label?: string };
type SaezuriMeta = { nodeId: ID; postedAt: string };
```
Prefer discriminated unions for `Node.content` in implementation; `unknown` above is a placeholder pending requirements.

## Invariants
1. `Node.id` is stable; feed, canvas, graph all reference it.
2. A node may have zero, one, or multiple placements across pages.
3. Removing a placement must not remove the node or its edges.
4. Edges reference nodes, never placements.
5. A page deletion removes its placements; node retention policy must be explicit.
6. Editing a canonical node updates every representation.
7. Saezutter order uses `postedAt`, not canvas coordinates.

## State and persistence
Use a single domain store with transactional mutations. Persist normalized records to IndexedDB; version the schema and define migrations. Keep graph layout positions separate from page placements (graph positions are presentation metadata, not content). Debounce noncritical writes, but ensure a confirmed save before unload where feasible. Test reload and schema migration.

## Interactions
- Saezutter → canvas: create placement referencing existing node ID.
- Canvas → graph: select node; graph highlights its neighbors.
- Graph → canvas: show available page placements; user selects destination.
- Graph edges: explicit user action, visible handles or accessible connect action.
- Zoom/pan: distinguish page navigation scroll from canvas pan; never hijack text editing gestures.

## Embed policy
Treat fixupx.com as an optional link-preview helper, **not** a guaranteed iframe renderer. Preserve original X URL, use safe link cards when previews fail, and verify third-party usage terms and privacy. Never claim external posts always embed.

## Testing
Unit: canonical node update, reference placement, deletion semantics, edge persistence, page isolation. E2E: create project → post → drag → link → reload → navigate. Test with browser storage cleared and with third-party requests blocked.

## Security
No secret keys in client bundle or repo. Validate imported JSON. Escape user-generated content. Restrict unsafe URL protocols. No remote code execution.
