---
doc: spec
status: approved
---
# Visualyrc Sketch — Technical Spec

## How This Works, In Plain Language
Store each idea once. The feed, each page and Graph look up that same idea by ID.
A placement stores where one reference appears; it never owns a separate text copy.
Browser storage saves content and original media locally without a server/login.
A `.vsketch` file carries the project to another browser. Optional audio supplies
playback time and section ranges, without controlling the independent canvas.
This draft is prepared together with scope/PRD at the user's request. The user subsequently approved scope, PRD and spec. This completes planning
steps 2–4 but authorizes no application implementation.

## The Core Journey Through the System
Implements `prd.md > The Core Journey`.
Post → validate input → transaction writes Node and Post metadata → feed renders ID.
Drop → screen-to-world conversion → Placement references Node → Canvas renders.
Edit → transaction updates Node → subscribed views update from same record.
Link → validate endpoint IDs/pair → Edge references Nodes → Graph renders once per Node.
Reload → open versioned local database → load selected project → restore view state.
Export → settle pending writes → capture consistent snapshot/assets → validate → archive.
Import → validate archive/schema/references → allocate fresh IDs → single transaction
creates a new project → switch only after commit. Existing project remains intact.
Audio → save validated original asset → player clock → playhead/section display.

## Stack
Previously approved direction: React + TypeScript + Vite, React Flow (`@xyflow/react`)
for Canvas/Graph, Dexie for IndexedDB. No app package.json or dependencies installed.
Versions, compatibility, actual licenses and bundle size remain unverified in this
pass; exact versions/lockfile must be verified before approved installation.
- React: https://react.dev/learn — shared UI components and reactive views.
- TypeScript: https://www.typescriptlang.org/docs/ — discriminate content variants.
- Vite: https://vite.dev/guide/ — local dev/build and static output.
- React Flow: https://reactflow.dev/learn — viewport/drag primitives; custom nodes.
- Dexie: https://dexie.org/docs/ — local structured records and transactions.
- Proposed archive dependency fflate: https://github.com/101arrowz/fflate — ZIP;
  not selected/installed. Verify license and bounded extraction API before adoption.
- Proposed verification: Vitest https://vitest.dev/guide/ and Playwright
  https://playwright.dev/docs/intro, with fake-indexeddb for unit storage tests.
- Browser audio/file APIs: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement
  and https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API .
Links are documentation pointers, not evidence of fresh web verification.
No backend, authentication, paid API or cloud storage. Docker is unnecessary for
this static single-process PoC; it adds setup without protecting the core risk.

## Where It Runs and How Someone Tries It
Browser SPA, desktop first; proposed acceptance targets current Chromium and Safari
on the development Mac, recording exact versions at verification. No universal
browser/mobile promise. Use consistent localhost origin for browser persistence.
Planned Node 22 runtime (confirm Vite requirements), npm lockfile and scripts:
`npm ci`, `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`, open
`http://127.0.0.1:5173`; `npm run build`; `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort`.
These scripts are a contract to implement, not runnable commands today.
Dev/preview use different origins and therefore different local databases; use
`.vsketch` export/import to transfer, never claim missing dev data is deleted.
No API keys. Public GitHub repo and short recording are submission outputs;
hosted demo is optional in the installed curriculum, with deployment approval still
required. The user-created nested GitHub checkout is not the outer source root;
reconcile that GitHub Desktop path before push, never merge histories silently.

## Look and Feel
Implements `prd.md > Look and Feel`, `Screens and Layout`.
CSS tokens: oatmeal #FAFAF7, charcoal #3A3B43, ink #0A0A0A, accent #866490,
selection #EDE6EF. Both modes light. Flat square text/feed cards and drop shadow
only. Fine outlined type icons. L grips visible for selected resizable Placement,
constant screen size with enlarged hit area. Selected fill and keyboard focus
are separate. Use system sans/mono initially; final font choice remains a design
detail. Avoid remote font requests. Prototype compact widths 70/100/260px for
waveform/sections/feed at 1700px; Canvas flexes. Collapse feed to 36px rail.
Do not trace erroneous time alignment or incidental edges from generated images.

## Components
### Project Shell
Implements `prd.md > Screens and Layout`, `Workspace and Accessibility`.
App owns active project/page/mode and sidebar preference. Domain records have one
shared repository; React Flow local node arrays are derived rendering adapters,
not independent content databases. Selector subscriptions limit unnecessary renders.

### Canonical Content Repository
Implements `prd.md > Capture and Shared Content`, `Removal and Recovery`.
Validated commands transact Node/Post/Placement/Edge changes. Feed deletion removes
Post only, placement deletion removes Placement only, explicit full deletion removes
Node/Posts/Placements/incident Edges atomically. Reject cross-project references.
Never delete asset Blobs on generic node/page deletion. Asset cleanup is deferred.

### Canvas Adapter
Implements `prd.md > Pages and Canvas Placements`.
React Flow rendering IDs equal Placement.id; source content lookup uses nodeId.
Persist drag/resize commit to canonical Placement, not Node. Images keep ratio;
text box changes wrapping. Clamp dimensions without shifting opposite corner.
Use selected L handles and numeric dimension inputs. Separate editing gestures
from drag/pan, preserve viewport per page. No Graph edge editing on Canvas.

### Saezutter Sidebar
Implements `prd.md > Capture and Shared Content`, `Workspace and Accessibility`.
Newest Post order by postedAt plus stable ID tie-break; T/picture from Node.kind.
Local draft stays in shell while collapsed; clear after successful transaction only.
Image decode/store error leaves draft. Drop payload contains projectId/nodeId;
validate again on receipt. Add to current page provides keyboard alternative.

### Graph Adapter
Implements `prd.md > Graph Relationships and Navigation`.
React Flow rendering ID equals Node.id. GraphPosition is independent of Placement.
One node per canonical Node; show isolated/unplaced nodes. Initial deterministic
nonoverlapping grid (proposal), then persist user positions; no force simulation
on every edit. Related edges undirected; canonical sorted endpoint pair unique.
Link action chooses source/target explicitly. Location tray enumerates Placements
and opens chosen page/viewport. Graph does not show image resize controls.

### Audio Player and Section Rail
Implements `prd.md > Optional Audio and Timed Pages`.
One HTMLAudioElement owns playback; persist no playing flag. Recreate object URL
from Asset Blob, revoke after source replacement/unmount. Validate a candidate
source before replacing old one. WAV/MP3 initial acceptance only after decode tests.
Page audio range includes audioAssetId; bounds validated against that asset duration.
Common transform y=origin+seconds*scale drives ticks, ranges, waveform and playhead.
Clock comes from currentTime, sampled by requestAnimationFrame only while playing;
update player/playhead slice, not all cards or IndexedDB every frame.
Generate bounded waveform peaks in a Worker using sampled PCM transferred after
browser decode; decode memory itself remains a risk and needs a real-file probe.
Use progressive/absent waveform state while generating; playback remains usable.
Stale worker results carry asset/generation ID and cannot replace newer source.
Shared timeline scroll, independent Canvas transform. Scope semantics follow PRD
recommendations until reviewed. Hiding Graph transport does not stop audio;
provide explicit transport toggle to restore controls.

### Storage and Project Archive
Implements `prd.md > Local Save and Portable Projects`, `States and Boundaries`.
Dexie transactions are the durable source. Node edit/layout interactions may remain
optimistic with dirty state, but Saved appears only after successful write. Debounce
text around 300ms, persist final drag/resize immediately, flush on blur/export/page
switch. Do not depend on async beforeunload saving. Failed write retains dirty
session with retry/export; leaving warns while dirty where browser supports it.

Proposed `.vsketch` ZIP structure: manifest.json + project.json + assets/<assetId>.
Manifest has format='visualyrc-sketch', formatVersion=1 and asset descriptors.
Versioned project payload stores normalized records. Blobs are original bytes;
waveform cache and object URLs are excluded. MIME is validated/decoded, not trusted
from filename. MVP images PNG/JPEG/WebP; exclude SVG execution and animated formats.
Archive extension is approved, ZIP contents/limits are not yet approved.

Provisional guardrails for review: audio ≤50MiB; each image ≤10MiB and ≤24MP;
archive ≤150MiB compressed and ≤200MiB expanded, ≤1000 entries. These are product
proposals, not approved file creation/download authorization or measured limits.
Preflight entry counts/sizes and enforce incremental actual-output bounds before
full allocation; reject traversal/absolute paths, duplicate names, encryption,
unsupported compression/version, missing media/refs and unexpected record fields.
No network fetches or script execution on import. Never claim safety based on ZIP
metadata alone; library selection depends on bounded inflation verification.
Atomically import as a new project with fresh ID mapping for all records/assets;
validate complete mapping before commit. No overwrite dialog needed in first slice.
Export from a consistent transaction snapshot; show size estimate before archive
creation. Storage quota/large-file probes must pass before these limits are finalized.

## Data Model
All project records carry projectId; IDs generated independently, dates ISO strings.
- Project: id, name, createdAt, updatedAt, activeAudioAssetId?; page order via Page.order.
- Page: id, projectId, title, order, audioRange? {audioAssetId,startMs,endMs}.
- Node discriminated union: text {id,projectId,kind:'text',text,createdAt,updatedAt};
  image {id,projectId,kind:'image',assetId,altText,createdAt,updatedAt}.
  No 'saezuri' kind, unknown content, url variant or embedded layout fields.
- Post: id, projectId, nodeId (unique per project/node), postedAt; feed is metadata.
- Placement: id, projectId,pageId,nodeId,x,y,width,height,zIndex.
- Edge: id,projectId,sourceNodeId,targetNodeId,relation:'related',pairKey.
- Asset: id,projectId,kind:'image'|'audio',mime,name,size,blob, dimensions?/durationMs?.
- GraphPosition: projectId,nodeId,x,y. PageViewport: projectId,pageId,x,y,zoom.
- ProjectView: projectId,lastPageId,mode,sidebarOpen; restore paused audio.
- WaveformCache: assetId,algorithmVersion,peaks; regeneratable, not archive content.
Schema v1 includes all tables above in one database; index projectId, pageId,
nodeId and unique Post/Edge pairs. No separate copies by view. Future migrations
are explicit and tested. Cross-record referential integrity is enforced in commands.
Transient state: selection, editor drafts, player state, worker jobs, dirty writes.
Retain while switching modes, never serialize DOM events/object URLs/React Flow internals.
Second-tab recommendation uses Web Locks when supported; safe fallback is explicit
read-only mode if exclusive ownership cannot be obtained, with no unverified claim
of cross-browser locking. Exact compatibility is an early technical probe.

## File Structure
Planned only; no application files are created in this task.
```text
src/
  main.tsx                     # mount app
  app/App.tsx                  # shell, project/view navigation
  domain/model.ts              # discriminated records and IDs
  domain/commands.ts           # validated mutations/deletion rules
  storage/db.ts                # Dexie schema and transactional repository
  storage/archive.ts           # bounded export/import and ID mapping
  storage/schema.ts            # external-input validation
  views/CanvasView.tsx         # Placement adapter/viewport
  views/GraphView.tsx          # canonical Node adapter/locations
  views/Saezutter.tsx          # feed/composer/drop source
  components/ContentCard.tsx   # shared content and type icons
  components/ResizeGrips.tsx   # L controls and keyboard size fields
  audio/player.ts             # element lifecycle and playback commands
  audio/Timeline.tsx           # shared time transform/sections/playhead
  audio/waveform.worker.ts     # bounded peaks and stale-job handling
  styles/tokens.css            # chosen visual language
  styles/app.css               # layout and states
  test/                        # domain/storage/archive unit fixtures
e2e/                           # actual browser core journeys (root directory)
public/                        # only rights-cleared local assets
index.html                     # Vite entry
package.json / package-lock.json # approved pinned dependencies/scripts
vite.config.ts / tsconfig.json # app build configuration
playwright.config.ts           # browser acceptance configuration
devpost/                       # canonical reviewed planning and build evidence
outputs/                       # supplemental review artifacts, selected media ignored
work/                          # reproducible agent scripts when needed
tmp/                           # ignored local scratch
```

## External Services and Dependencies
No runtime external API, auth endpoint or cloud database. npm registry is development
supply chain, installed only after authorization/license/version review; never at
runtime. GitHub repo/push and optional hosting remain separate release actions.
Media remains local and supplied by the user or rights-cleared fixtures.
Do not publish the reference game images or local learner profile.

## Important Failure Modes
- IndexedDB quota/unavailable/write failure → keep dirty session; explicit unsaved
  status and recovery export; never silently fall back to lossy text-only storage.
- Media decode/import allocation → retain previous project/audio; cancel with error;
  reject before large allocations, generation token suppresses stale jobs.
- Multi-view identity/gesture conflicts → transactional invariants and separate
  view IDs; test edits while changing pages/import source/dragging.

## What Was Simplified and Why
No server/accounts; one active local workspace and explicit portable backup.
No auto semantic layout; deterministic initial placement plus manual Graph positions.
No destructive overwrite on import; new project preserves the current one.
No full rich editor, undo stack or waveform boundary dragging in initial proposal.
These details are recommendations, not permission to cut requested capabilities.

## Verification and Performance Learning
Unit: shared edits, placement independence, page/feed/full deletion rules, edge pair
uniqueness, section validation, ID remapping, quota errors and archive rejection.
Browser: post/place twice/edit/link/navigate/reload/export/fresh-profile import;
repeat without audio, then audio play/pause/stop/seek/replace/reload.
Verify Safari and Chromium actual persistence and gesture behavior; a memory mock
alone cannot prove IndexedDB/media correctness. Confirm ignored personal files.
Fixture target from existing PRD:100 Nodes over10 pages, shared placements/media.
Record exact browser/device, asset sizes, cold/warm load, frame timings, long tasks
and heap during drag/resize/audio; compare before/after using same fixture and zoom.
Do not invent a 60fps guarantee. Bound decoded media, use thumbnails/cache and
subscription granularity before adding abstractions. Capture real evidence of one
bottleneck and measured change for the learner's optimization goal.
Planned commands: npm run typecheck, npm run lint, npm run test -- --run,
npm run test:e2e, npm run build. None is available or executed in this task.

## Decisions and Open Issues
Confirmed: chosen stack direction, independent Node/Placement/Edge, no login,
selected light UI/freeform Graph, .vsketch extension, local optional audio.
Approved in the planning review: full optional audio slice, ZIP-based .vsketch,
page selection separate from seeking, and distinct removal semantics. Numeric
media/archive limits remain provisional pending real-file validation.
Actual learner question: how can login-free saving work? Explain browser autosave
versus portable archive; investigate original-media roundtrip/quota during build.
Actual goal: lightweight web app and optimization. Profile one real core-loop
interaction before optimization, repeat the same measurement after changes.
Release: license, rights-cleared sample assets, hosting/public URL decision and
outer-vs-nested repository linkage. Never infer push/publication permission.
Review format still unset; Markdown supplied now, HTML available if requested.
