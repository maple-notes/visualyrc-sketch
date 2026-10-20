# Decisions and unresolved questions

## Established from discussion
- Web app, **not Electron by default**.
- A project contains multiple **independent** infinite-canvas pages/sections.
- Saezutter is a project-wide, Twitter-like chronological stream of ideas ('saezuri').
- Canvas components and saezuri are **both linkable nodes**; cross-page relationships are first-class.
- Dragging a saezuri to a canvas creates a reference/placement, **not removal from the feed**.
- Graph View exposes relationships across pages and should feel like an actual instrument/terminal, inspired by Arknights/Endfield and Teenage Engineering, not a generic sci-fi HUD.
- Optional audio file can give pages musical sections and a waveform; app should work without audio.
- Prefer user-controlled visual references and a carefully designed interface.

## Approved kickoff decisions — 2026-10-19 HST

The user approved recommendations 1–4 in the kickoff response and explicitly
authorized installing the official Skill Pack inside this project.

1. General-purpose notes first. Audio, waveform, drawing and external embeds
   are deferred.
2. IndexedDB is primary storage. Image-inclusive JSON backup and restore are
   included in P0.
3. Graph shows all canonical nodes, including unlinked and unplaced nodes.
   Moving a placement affects only that instance. Deleting a page preserves
   nodes; complete node deletion is a separate explicit action.
4. Use React, TypeScript, Vite, React Flow for Canvas/Graph, and Dexie for
   IndexedDB. The original light Canvas/dark Graph proposal is superseded by
   the later approval below: both views use light mode. Install the official
   project-local Skill Pack and proceed through its planning workflow.

This approval does not mark the official Skill Pack's planning documents as
generated or approved. Its actual interview and document-review steps still
need to occur. The later visual selection below establishes the screen direction;
interaction details and numeric tokens still require validation.

## Remaining draft details

### Latest user scope change — audio and visual layout

The user now explicitly requests audio loading, playback/stop controls and
a playhead, superseding the audio/waveform deferral in kickoff decision 1.
Drawing and external embeds remain deferred. This request establishes product
direction, not completed implementation or a validated delivery estimate.
Reconcile scope/PRD/spec through the official planning workflow before coding;
audio persistence, supported formats and section editing still need definition.

The app requires no login. Saezutter uses anonymous timestamped cards without
avatars. The latest layout places a vertical waveform and section rail left
of the active canvas, with the global feed on the right. Audio remains optional.

- One active project at a time, without login or server.
- Text/image content and Saezutter post metadata; URL cards later.
- Explicit `related` edges first; `sequence` later.
- The kickoff report contains further implementation recommendations. They
  remain proposals where they go beyond the four approved decisions above.

## Must decide before publication

- Permission to publish Visualyrc branding/assets and sample media.
- Repository owner, hosting target and project license; MIT is a candidate.

Do not silently decide unresolved product questions. Record approved answers here.

## Approved visual selection — latest user instruction

The user selected the attached Canvas screenshot and the freeform Graph
(Open Constellation) screenshot. Both views must use light mode. This supersedes
the previous dark-Graph direction. Preserve their selected layouts, maximize
workspace area, and keep Saezutter a collapsible sidebar with content-type icons.
Text/feed cards are square and flat with drop shadow only; selection is fill-only.
The Graph source screenshot's dark colors and incidental selection stripe are
not part of the approval. Page Atlas and Relation Lens are unselected alternatives.
The user explicitly prohibits app implementation at this stage. This approval
permits visual/document refinement only; it does not complete the official Pack
or approve every proposed interaction, data limit or generated image artifact.

## Project file extension — adopted after collision search

The user conditionally authorized `.vsketch` if no existing extension use was
found. Targeted web searches for `.vsketch` file extension/format found no
established extension use. A Python generative-art tool is named vsketch, but
its documentation describes Python sketches and SVG/HPGL output, not this
extension. This is a search result, not a guarantee of worldwide uniqueness.
Adopt `.vsketch` for Visualyrc Sketch project files.
Source: https://github.com/abey79/vsketch
Source: https://vsketch.readthedocs.io/en/latest/autoapi/vsketch/index.html

The previously proposed ZIP container, versioned manifest and bundled media
remain technical recommendations pending formal specification; extension
approval alone does not approve their detailed implementation. App coding
remains on hold. Future import must identify format and version from contents,
not trust the extension alone.
