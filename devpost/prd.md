---
doc: prd
status: approved
---
# Visualyrc Sketch — Product Requirements

A local spatial planning app for solo creators.
Source: `scope.md > The Unique Kernel`, `The Core Loop`, `The POC Boundary`.
Drafted ahead at the user's request; scope and this PRD were subsequently approved by the user.

## The Core Journey
1. Open the app without login. Resume the last local project or create a named
   project with one blank page. An empty state offers text/image capture and audio.
2. Post a text or image to Saezutter. It stays in a project-wide newest-first feed.
3. Drag it onto the current page or use Add to current page. Repeat on a second page.
4. Edit shared content and observe both placements/feed update; moving/resizing a
   placement changes only that placement.
5. In Graph, link two canonical items, inspect locations and return to a placement.
6. Reload, then export/import `.vsketch` in a fresh workspace; content/media survive.
7. Optionally load audio, play/seek and assign page ranges; no-audio use stays valid.

## Screens and Layout
Canvas: slim header/transport, narrow vertical waveform and adjacent section rail,
large active-page canvas, collapsible right Saezutter sidebar. Timeline and section
rail scroll together; Canvas has independent pan/zoom. Hide audio chrome without audio.
Graph: selected freeform overview, compact tools/search/zoom and location-action tray;
Saezutter initially collapsed. All canonical nodes remain accessible, including
unplaced/unlinked nodes. No page-grouping or relation-focus modes in this scope.
Dialogs: project create/open, page/range fields, destructive deletion, import errors.
Source: `scope.md > Inspiration & Identity`, `The Core Loop`.

## Look and Feel
Both modes light. Oatmeal background, charcoal text, muted purple active controls
and pale selected fill. Text/feed surfaces square and flat, drop shadow only.
Fine outline content-type icons identify text/image, never users. Small L-shaped
resize controls are distinct from selection decoration; no left selection stripe.
Small identifiers, faint grid, readable sans-serif body and mono metadata.
Selected screenshots establish direction, not incidental edge labels or controls.

## Features and Behavior
### Capture and Shared Content
Text posts reject whitespace-only input. Enter adds a newline; Ctrl/Cmd+Enter posts.
Image-only posts are valid; local image attachment shows a preview. No mixed rich
text/image editor or caption model required. Draft stays after failure/collapse.
Text edit preserves post time and updates every representation. Image content
replacement, if offered, updates shared content; geometry stays per placement.
Acceptance: one content edit updates feed, two placements and Graph without duplication.
Source: `scope.md > The Unique Kernel`.

### Pages and Canvas Placements
Create/rename/reorder pages, each with independent viewport. Page delete confirms
removal of its placements and preserves canonical content/edges/feed posts.
Drag from feed creates a reference; repeated placement is allowed. Select by click,
move by dragging, edit text by double-click, Escape ends editing. Images resize
with preserved aspect ratio; text resizing changes wrapping, not font size.
Provide Add to page and numeric size controls as drag alternatives.
Acceptance: moving/deleting one of two placements leaves the other unchanged.
Source: `scope.md > The Core Loop`.

### Removal and Recovery
Recommended distinct actions: Remove from page deletes Placement only; Remove from
feed deletes posting metadata only; Delete content everywhere confirms and removes
Node, its placements and incident edges. No implicit asset deletion during these
actions in the initial slice; safe orphan cleanup is deferred. This deletion menu
was approved in the planning review. Do not implement ambiguous single Delete behavior.

### Graph Relationships and Navigation
One visible graph item per canonical Node, regardless of placement count. Text/image
are content types; feed origin is metadata. Create/remove undirected related edges
by explicit Link action; prevent self-links/duplicate pairs. No automatic semantic
labels or inferred links. Select to show locations, then choose a page to focus
one placement. Unplaced content can be added to the current page.
Acceptance: cross-page edge survives reload and placement deletion.
Source: `scope.md > The Unique Kernel`.

### Local Save and Portable Projects
Autosave reports Saving/Saved/Error truthfully; failed save retains current work
and offers retry/export. Work is local to browser/site; clearing site data can remove it.
Export `.vsketch` includes original text, images, audio, positions and relationships.
Import validates fully before changing active project; unsupported/corrupt input
leaves current work intact. Recommended default imports as a new project, retaining
the existing one, rather than overwriting it. ZIP container is approved; numeric limits remain provisional.
Acceptance: export and import in a fresh browser profile reproduces the core journey.
Source: `scope.md > What "Working" Looks Like`.

### Optional Audio and Timed Pages
One local audio source; no upload. Load/ready/playing/paused/ended/error are visible.
Play resumes; pause holds time; recommended Stop returns to zero. Waveform ticks,
section boundaries and horizontal playhead share a vertical linear time scale.
Click/drag seeks. Recommended: select page without seeking; separate Play from
section action; optional Follow off initially, follows timeline only. Playback never
moves Canvas or changes pages automatically. These semantics were approved in the planning review.
Recommended ranges: at most one per page, nonoverlapping, gaps/untimed pages allowed;
edit start/end in fields. Replacing audio preserves content and asks how to handle
existing ranges before applying. Invalid/unsupported file leaves prior source intact.
Acceptance: known timestamps match waveform/range/playhead; no-audio loop still works.
Source: `scope.md > The POC Boundary`.

### Workspace and Accessibility
Sidebar collapse retains draft, scroll and graph/canvas zoom. Expansion must not
rewrite positions. Keyboard focus visible independently from selection fill.
Space-drag pans Canvas; bare Space toggles audio only outside editing and without
pointer gesture. Magnetic hover moves control backplates only, disabled for reduced
motion/touch/edit/drag. No attraction on resize controls or seeking targets.

## States and Boundaries
- Empty project/feed/Graph: useful create/post actions, no fake stored content.
- Media error: retain draft/previous audio; show actionable error and retry.
- Storage error: preserve session, never claim Saved; allow recovery export.
- Loading/importing: disable conflicting mutations; cancel leaves current project.
- Reopen: content/layout restored, audio paused, no autoplay.
- Concurrent tabs: recommended detect another editable instance and make later tab
  read-only until explicit takeover; no collaborative merge in this PoC.

## Product Decisions
User-selected: no login; canonical shared content; independent pages; local audio;
light Canvas/freeform Graph; square shadowed text/feed cards; content icons;
`.vsketch`; app implementation remains prohibited at this stage.
User-approved earlier: IndexedDB and React/TypeScript/Vite/React Flow/Dexie direction.
Detailed behavior marked recommended above is not attributed to the user.

## What We're Building
The core journey and scope boundary above, with checks for shared edits, independent
placement geometry, relationship navigation, durable local and portable media,
optional audio, keyboard alternatives and recovery from actual failures.

## Deferred From the POC
Rich embeds/URL previews/drawing, advanced graph modes, complete undo history,
background sync and large-library optimization. No irreversible operation relies
on deferred undo: use confirmation and preserve canonical content by default.

## Possible Later Enhancements
Graph transition polish and improved timeline editing after the core loop is stable.

## Non-Goals
Authentication, public sharing links, multiplayer, AI analysis, audio editing,
DAW integration, native app packaging or OS double-click association.

## Open Questions
Planning review approved full audio scope, ZIP portable archives, audio/range
navigation semantics and explicit deletion semantics. Before public release: repository
ownership linkage, license, sample media rights and optional host. Review format is
not established; this draft is presented as Markdown without claiming that preference.
