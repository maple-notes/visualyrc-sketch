# Visualyrc Sketch

A local spatial workspace for ideas, references, and creative planning. Each page has
its own canvas. Saezutter captures text and images; Graph connects the same content
across the project. No login, server, paid API, or cloud database is required.

## Who it is for

Visualyrc Sketch was built for planning music videos and short films. Load the
song, and each page becomes one section of it, with its own board of notes and
reference images.

The same structure works for a course. Make one page per lecture, take notes on
each, and link related ideas across lectures in Graph. Before an exam, the Graph
shows which ideas from Week 1 return in Week 4, and **Open in page** jumps back to
the lecture where you wrote them.

## Run locally

Use Node.js 22. The repository includes an npm lockfile.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/`. To try the static production build:

```sh
npm run build
npm run preview
```

Open `http://127.0.0.1:4173/`. Dev and preview have different browser storage because
their ports differ. Export/import a `.vsketch` file to transfer a project between them.

## Core journey

1. Write a note in Saezutter and choose **Place**, or drag the post into Canvas.
2. Add a page and place the same post there. Edit either reference; both show the
   same content, while their positions and sizes remain independent.
3. Switch to Graph, select an item, choose a link target, and use **Link nodes**.
   **Open in page** returns to a particular placement.
4. Use **Export project** to download a portable `.vsketch` backup. Import creates
   a new project, preserving the current project.
5. Optionally load WAV or MP3 audio. Existing pages are distributed equally over
   the duration. Trim section edges by dragging or editing start/end fields.
   New pages append as immediately adjustable sections, including in silent planning
   space after the audio ends. Drag pages to reorder whole sections; their lengths
   and content stay intact. Page selection does not seek; **Play from section** both seeks and plays.

Both views use the selected light palette. Text and feed cards have square corners
and a flat drop shadow. The Saezutter sidebar and page rail can collapse. Images
keep their aspect ratio through the L-shaped resize grips; numeric fields provide
an alternative. Arrow keys move selected nodes; Space-drag pans the board.

In Graph, a text card grows to fit its text. Select a card and drag its corner grip
to make it larger in advance; the project saves that size, and a longer note still
grows past it. Cards with diagrams start wider.

Each section in the audio rail is as tall as its share of the song. Short sections
switch to a compact label: first the page number goes, then the time range, and the
shortest sections show the title only.

## Editing

Drop PNG/JPEG/WebP files onto Canvas, or use **Add image**. Copy/paste/cut a selected
reference with Cmd/Ctrl+C/V/X; copying between pages shares the same content.
Cmd/Ctrl+Z and Shift+Cmd/Ctrl+Z undo/redo up to50 project edits in this session.
Reload/project switching clears history; editing text fields keeps native shortcuts.

Text accepts Markdown/GFM and fenced `mermaid` blocks. Edit the source as text.
Raw HTML, remote Markdown images, diagram configuration, remote resources and math
are disabled. Diagrams load on demand and keep their own aspect ratio at the card's
width; invalid diagrams show an error. The installed
Mermaid dependency has a low-severity transitive KaTeX advisory; see the verification
report for the actual audit status and limits.

## Saving and recovery

IndexedDB stores normalized project documents and original media in this browser
and origin. **Saved** means the write transaction finished. A later editor tab is
read-only; close the other editor and reload to edit. Browser storage can be erased
or evicted, so keep exported backups. This is not cross-device synchronization.

A `.vsketch` file is a ZIP containing `manifest.json`, `project.json`, and original
assets. Import checks schema, references, ZIP directory consistency, CRC and actual
inflated sizes before saving a new project with fresh IDs. Placement removal keeps
content; feed removal keeps content; full content deletion removes its references
and relationships after confirmation. Unreferenced original media is reclaimed
inside the same save transaction. Page deletion preserves canonical content.

A failed save keeps the in-memory project, shows **Unsaved**, and offers retry and
recovery export. Do not close that tab before recovering. Project switching and
import are blocked while saving or unsaved. No export silently omits missing media.

Current guardrails: images PNG/JPEG/WebP up to 10 MiB and 24 MP; WAV/MP3 audio up to
50 MiB; portable export up to 140 MiB, JSON up to 8 MiB, and 998 assets. Import accepts
up to 150 MiB compressed and 200 MiB expanded with 1000 entries. Waveform generation
is bounded; long audio may play without a waveform preview. These limits are guards,
not proof that every file near the limits performs well.

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

The actual end-to-end suite uses **Codex's in-app browser**. It operates visible
controls, uploads generated media, downloads a project, imports it, and checks
reloads and destructive operations using disposable data. See
[verification evidence](devpost/verification.md) and [the runner](work/verification-plan.md).
`npm run verify:browser-evidence` checks saved local browser results and the source
fingerprint; it does not launch a browser or replace that actual run. Ignored local
evidence is not included in a fresh clone. Safari and physical-device checks remain
unverified. No general 60-fps or large-library guarantee is made.

## Static hosting handoff

`npm run build` creates `dist/`; no runtime process or environment secrets are needed.
The build uses relative asset URLs and can be placed under a directory such as
`/sketch/` with a trailing slash. Copy the built directory into the website's static
output during a later, separately authorized integration. Serve it over HTTPS (or
localhost), with same-origin workers and `blob:` image/audio URLs permitted by the
host's policy. Do not overwrite the website's routing or security configuration.
Cloudflare Pages deployment and the separate website repository are untouched.

## Project records and licensing

The approved planning artifacts are `devpost/scope.md`, `devpost/prd.md`, and
`devpost/spec.md`; `devpost/checklist.md` records actual build progress. Root planning
files remain historical design context. Open [the app map](devpost/app-map.html)
offline for code locations and one concrete learning example.

[Third-party notices](THIRD_PARTY_NOTICES.md) record the installed dependency licenses.
The project's own release license remains the owner's decision; this repository
does not yet grant an open-source license for original project code. No reference
artwork, personal learner profile, or proprietary code from other Visualyrc products
is included. Human final review, demo video, human-written submission, and any
publication remain separate from the verified local build.
