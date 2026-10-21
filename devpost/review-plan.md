# Final Review Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Address the learner's actual product review: compact rail controls, useful automatic audio sections, draggable boundaries, direct image drops, basic editing shortcuts, Markdown and Mermaid rendering.

**Architecture:** Keep Node/Placement/Edge canonical. Add small pure domain commands for audio assignment, constrained trims and reference clipboard operations. Project-local undo/redo snapshots retain the media needed for recovery before the existing database cleanup runs. Keep text source as Markdown in the existing text Node; rendering is a view concern.

**Tech Stack:** Existing React/TypeScript/React Flow/Dexie/Vitest. Approved and installed renderer dependencies are react-markdown10.1.0, remark-gfm4.0.1 and Mermaid11.16.1, found in the local npm cache; the owner approved project-local installation.

**Spec:** devpost/prd.md and devpost/spec.md, amended by the learner's annotated screenshot and subsequent shortcut/Markdown/Mermaid requests on2026-10-20.

## Global Constraints

- Browser-first, local-only; no external AI, backend, credentials or cloud APIs.
- Preserve existing work and media; no push/deployment or unrelated repository edits.
- No dependency installation before authorization. Renderer installation may add roughly100–150MiB of local dependencies; actual size must be checked and reported.
- A placement cut removes that reference only. Canonical deletion remains explicit.
- Keep existing data schema: text Nodes store the original Markdown string.
- Work on disposable test projects, not the learner's project currently open in4173.

## Review Focus

- Undo after canonical deletion/audio replacement must restore original media, not a missing-asset placeholder.
- Editable fields retain native copy/cut/paste/undo; app shortcuts must not intercept them.
- Very short sections and touching neighbors must never overlap or invert while dragging.
- File decode completing after a page/project switch must not place content into an unintended project.
- Mermaid and Markdown must not execute arbitrary HTML, fetch remote media or allow diagram/link actions to run scripts.

### Task1: Audio section workflow and rail controls

**Files:** src/domain/model.ts, src/audio/Timeline.tsx, src/app.tsx, src/styles/app.css, src/test/domain.test.ts.
**Interfaces:** assignAudio(project,assetId,duration) returns a validated Project with equal ranges in Page.order; trimSection(project,pageId,edge,seconds,duration) returns a validated Project clamped to nearest neighbors. Timeline receives onTrim and readOnly.

- [x] Test equal assignment, preserved nodes/placements, range limits and adjacent trims.
- [x] Move page-rail toggle to its own header; retain a collapsed reopen rail.
- [x] Remove the redundant Saezutter toggle while expanded; retain its header close and collapsed reopen control.
- [x] Assign existing pages over the full duration when accepting new/replacement audio. Preserve replacement confirmation and clearly describe redistribution.
- [x] Add top/bottom grips, preview then commit, keyboard alternatives and cancellation. Keep range fields available.
- [x] Verify controls and actual pointer trim in a separate browser origin; commit.

### Task2: Direct image drop

**Files:** src/app.tsx, src/views/Board.tsx, src/domain/model.ts, src/test/domain.test.ts.
**Interfaces:** Board.onFilesDrop(files,x,y); reusable image ingestion adds one canonical Node/Post and a Placement at world coordinates per image.

- [x] Test valid placement/reference creation and rejected/cross-project input.
- [x] Support PNG/JPEG/WebP files from an external drag; decode before committing and stagger multiple images. Do not navigate to dropped files.
- [x] Preserve Saezutter's existing reference drag and read-only blocking.
- [x] Verify shared ingestion via a real file chooser and external drop if the browser runtime supports native file drags; explicitly report any unverified native ingress. Commit.

### Task3: Basic editing shortcuts and history

**Files:** new src/domain/history.ts and src/domain/clipboard.ts if needed; src/app.tsx, src/views/Board.tsx, related unit tests.
**Interfaces:** history retains up to50 prior Project states and media required by past/current/future states; clipboard stores copied reference geometry/content IDs. App command routing excludes input/textarea/select/contenteditable.

- [x] Test undo/redo, redo invalidation, separate project histories and asset recovery after deletion/replacement.
- [x] Add Cmd/Ctrl+C,V,X,Z and Shift+Cmd/Ctrl+Z for the selected Canvas reference; repeat paste offsets and new Placement IDs reference the same Node.
- [x] Copy/paste can transfer references between pages in one project. Keep clipboard project-local and avoid silent cross-project references. Graph undo/redo uses the same project history; do not silently turn Graph Cut into canonical deletion.
- [x] Do not record pan/zoom or selection as edit history. Keep history local to the current session; reload starts a fresh history.
- [x] Verify actual keyboard operations, native editor undo and restored media in browser; commit.

### Task4: Markdown and Mermaid

**Files:** src/components/ContentCard.tsx, new src/components/MarkdownContent.tsx and MermaidDiagram.tsx, src/styles/app.css, package.json/package-lock.json/THIRD_PARTY_NOTICES.md, renderer tests.
**Interfaces:** render the existing text string; recognize fenced mermaid blocks. Lazy-load the diagram renderer, use strict security, disable raw HTML/remote media and provide visible parse errors without changing the source.

- [x] Obtain approval for the specified local dependency installation and disk footprint. No global settings change.
- [x] Implement headings/lists/links/code/tables with safe local rendering and readable card scrolling. Editing still uses the source textarea.
- [x] Render Mermaid blocks as diagrams; reject oversized input, ignore stale renders and isolate failures.
- [x] Verify normal/malformed diagrams, safe HTML/URLs, source-based rendering and production lazy loading. Existing archive tests cover stored text strings; a renderer-specific portable browser roundtrip was not separately driven. Update dependency notices and commit.

### Task5: Final integrated verification

- [x] Update approved behavior docs and official5-build Final Review checkboxes to match real work; human re-test remains pending until feedback.
- [x] Run formatting, typecheck, lint, unit tests, production build and updated browser acceptance.
- [x] Save screenshots and exact measured outcomes; distinguish new browser runs from saved-evidence checks.
- [x] Report local commits, remaining unverified paths and generated/dependency sizes. No automatic push or deployment.

### Task6: Post-audio pages and page reordering — authorized2026-10-20

The learner explicitly selected silent planning after audio end instead of splitting
an existing section, and requested page drag reordering. This supersedes the former
requirement to constrain every section to audio duration.

- [x] Default a new page after the latest existing section, with immediate trim grips.
- [x] Keep the real media duration/playhead unchanged; extend only planning space.
- [x] Preserve post-audio ranges through local save and portable archive restore.
- [x] Drag whole pages in both audio/no-audio rails; retain lengths, content and gaps.
- [x] Route existing Move earlier/later keyboard alternatives through the same command.
- [x] Verify reordering, trim, reload and undo with unit tests and actual browser gestures.

## Actual outcome

Implementation commit: `e44dc8d`. Final integrated browser run:95 assertions at
2026-10-20 18:58 HST on disposable port4190;36 unit tests pass. Native Finder drag
is the remaining manual ingress check because this runtime exposes file choosers,
not native external file drags. No human final readiness or learning reflection is
claimed. New dependencies expanded node_modules by approximately158MiB, exceeding
the earlier100–150MiB estimate slightly; total is324MiB. No global install occurred.
