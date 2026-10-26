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
steps 2–4. The user subsequently authorized 5-build and unattended implementation.
Implementation evidence below is dated 2026-10-20; human final review remains pending.

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
for Canvas/Graph, Dexie for IndexedDB. Installed versions are pinned by package-lock.json.
Runtime licenses are recorded in THIRD_PARTY_NOTICES.md. Measured build sizes and
actual browser verification are recorded in devpost/verification.md.
- React: https://react.dev/learn — shared UI components and reactive views.
- TypeScript: https://www.typescriptlang.org/docs/ — discriminate content variants.
- Vite: https://vite.dev/guide/ — local dev/build and static output.
- React Flow: https://reactflow.dev/learn — viewport/drag primitives; custom nodes.
- Dexie: https://dexie.org/docs/ — local structured records and transactions.
- Proposed archive dependency fflate: https://github.com/101arrowz/fflate — ZIP;
  installed; bounded streaming extraction, directory checks and CRC are tested.
- Verification: Vitest with fake-indexeddb; actual browser acceptance runs through
  Codex in-app browser controls. No standalone browser/runtime download is required.
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
These scripts now run locally. Use the existing Node 22 runtime; no credentials are needed.
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
are separate. Use the system sans face and one shared mono stack (`--mono`: SF Mono,
`ui-monospace`, Menlo, Consolas) so labels match across browsers; Chrome ignores
`ui-monospace`, hence Menlo is named. Avoid remote font requests. Prototype compact widths 70/100/260px for
waveform/sections/feed at 1700px (the section column later grew to fill a 228 px rail); Canvas flexes. Collapse feed to 36px rail.
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
Deleting a placement, feed entry or page keeps canonical content and its media.
The save transaction reclaims assets only after no canonical content or active
audio references them; a failed transaction rolls back both document and media.

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
Two ways to link: drag from a handle on one card to a handle on another (React Flow
`onConnect`, loose connection mode so either handle starts or ends a link), or use
the Link action with an explicit target. The target list omits already linked nodes
and the drag handler ignores self links and existing pairs, so a duplicate never
reaches `validateProject`. Location tray enumerates Placements and opens chosen
page/viewport.
Graph cards are resizable. A text card takes its height from its content
(`min-height` = saved height or 120 px) and keeps the saved width (default 260 px;
440 px when the text holds a Mermaid block). An image card keeps a fixed frame
(default 260 by 220 px) and its aspect ratio while resizing. The size a user sets by
dragging a corner grip is stored with the Graph position, never on the Node.

### Audio Player and Section Rail
Implements `prd.md > Optional Audio and Timed Pages`.
One HTMLAudioElement owns playback; persist no playing flag. Recreate object URL
from Asset Blob, revoke after source replacement/unmount. Validate a candidate
source before replacing old one. WAV/MP3 initial acceptance only after decode tests.
Page audio range includes audioAssetId; bounds remain finite/nonoverlapping; approved post-audio planning can exceed media
duration, with a seven-day planning ceiling.
Common transform y=origin+seconds*scale drives ticks, ranges, waveform and playhead.
Clock comes from currentTime, sampled every 100ms;
update player/playhead slice, not all cards or IndexedDB every frame.
Generate bounded waveform peaks in a Worker using sampled PCM transferred after
browser decode; decode memory itself remains a risk and needs a real-file probe.
Use progressive/absent waveform state while generating; playback remains usable.
Stale worker results carry asset/generation ID and cannot replace newer source.
Shared timeline scroll, independent Canvas transform. The approved navigation semantics follow the PRD. Graph keeps a compact transport
when audio is active; switching views does not stop playback. A live IndexedDB
subscription waits for the audio asset commit before creating its object URL.

### Storage and Project Archive
Implements `prd.md > Local Save and Portable Projects`, `States and Boundaries`.
Dexie transactions are the durable source. Node edit/layout interactions may remain
optimistic with dirty state, but Saved appears only after successful write. Text
uses explicit Save/Post actions; persist final drag/resize and keyboard movement
immediately through a serialized save queue. Export waits for the queue; project
switching/import are blocked until Saved. Do not depend on async beforeunload saving. Failed write retains dirty
session with retry/export; leaving warns while dirty where browser supports it.

Proposed `.vsketch` ZIP structure: manifest.json + project.json + assets/<assetId>.
Manifest has format='visualyrc-sketch', formatVersion=1 and asset descriptors.
Versioned project payload stores normalized records. Blobs are original bytes;
waveform cache and object URLs are excluded. MIME is validated/decoded, not trusted
from filename. MVP images PNG/JPEG/WebP; exclude SVG execution and animated formats.
Archive extension and ZIP container are approved; numeric limits remain provisional.

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
The Project document owns its nested records; nested records need no repeated
projectId. Asset includes projectId. IDs are UUIDs; timestamps are ISO strings.
- Project: formatVersion=1, id, name, createdAt, updatedAt, activeAudioId?.
- Page: id, title, order, audioRange? {assetId,start,end}; time uses seconds.
- Node: text {id,kind:'text',text,createdAt,updatedAt} or image
  {id,kind:'image',assetId,altText,createdAt,updatedAt}.
- Post: id,nodeId,postedAt; one post per canonical Node.
- Placement: id,pageId,nodeId,x,y,width,height,zIndex.
- Edge: id,source,target; related is the only relation, with undirected pair
  uniqueness validated from sorted endpoint IDs. No redundant pair field.
- Asset: id,projectId,kind,mime,name,blob,width?,height?,duration? in seconds.
- graph: {nodeId,x,y,width?,height?}[] (size optional, 120/64 px minimum);
  viewports: {pageId,x,y,zoom}[].
- Browser view preference: lastPageId,mode,sidebar; audio restores paused.
- Waveform: 1200 transient peaks regenerated from the original asset.
Implementation refinement: normalized records above are stored in one project
document per project in Dexie projects, plus original Blob assets in a separate
assets table indexed by projectId. Transactions commit document/media together.
No separate copies by view; commands enforce unique posts/edge pairs and integrity.
This reduces coordination for the measured 100-node PoC. Split tables only when
measured write costs warrant it. Future migrations remain explicit and tested.
Transient state: selection, editor drafts, player state, worker jobs, dirty writes.
Retain while switching modes, never serialize DOM events/object URLs/React Flow internals.
Second-tab recommendation uses Web Locks when supported; safe fallback is explicit
read-only mode if exclusive ownership cannot be obtained, with no unverified claim
of cross-browser locking. Exact compatibility is an early technical probe.

## File Structure
Actual structure after the verified build:
```text
src/main.tsx                    # mount app
src/app.tsx                     # shell, commands, feed, dialogs/navigation
src/domain/model.ts             # strict schema, canonical mutation functions
src/storage/db.ts               # project/media transaction and cleanup
src/storage/archive.ts          # bounded ZIP validation/export/import
src/storage/media.ts            # browser decode boundaries
src/storage/image-dimensions.ts # pre-allocation image header bounds
src/views/Board.tsx             # shared Canvas/Graph rendering adapter
src/components/ContentCard.tsx  # local media and type icons
src/audio/Timeline.tsx          # player hook and vertical time transform
src/audio/waveform.worker.ts    # bounded peaks
src/styles/app.css              # light palette, square cards, layout/motion
src/test/                       # domain/archive/storage/media tests
work/                           # actual Codex browser suite and fixture tools
outputs/verification/           # ignored local evidence, screenshots and builds
devpost/                        # reviewed plans, checklist and public report/map
```
The common adapter and small domain module replace planned separate Canvas/Graph
and commands files. This avoids duplicating behavior. No standalone Playwright
configuration or extra browser installation was introduced.

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
The initial proposal omitted a rich editor, undo stack and boundary dragging.
The approved hands-on review now adds session history, boundary grips and safe
Markdown/Mermaid rendering as described below; no full WYSIWYG editor.
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
npm run build. All are now available and executed; see verification.md.
Actual browser runs use work/browser-suite.mjs with the Codex in-app browser.
`npm run verify:browser-evidence` checks saved results plus a source fingerprint;
it does not rerun browser actions. Safari, fresh browser profile, memory/FPS and
large-file boundary probes remain unverified; fresh-origin boot and generated-media
roundtrips were exercised. Do not interpret 100-node acceptance as a 60fps result.

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

## Build Revisions — 2026-10-20

- The user delegated 5-build and its slice order, asking for unattended completion
  by HST17:30 and stopping when finished. Human final review is deferred, not faked.
- Project snapshots plus assets are committed in one transaction. No content copy
  is owned by a view. Save failures retain dirty memory and pending original assets.
- Export matches reader limits: each JSON <=8MiB, <=998 assets, <=140MiB payload.
  Per-file and actual streaming inflation bounds are enforced. Limits are
  conservative guards; large real-media performance is not claimed.
- Audio has a 100ms UI clock and bounded worker peaks. Board memoization keeps
  audio-clock updates out of card rendering. Long files may omit the waveform.
- Same-source eager/lazy archive builds measure initial JS bytes; no FPS claim.
- Hosting is a future handoff to the owner's separate Cloudflare Pages website.
  This task neither edits that repository nor deploys or pushes application code.

## Hands-on review implementation — 2026-10-20

`domain/history.ts` retains 50 prior Project snapshots and originals referenced by
past/current/future states. Viewport-only writes do not enter history. Undo/redo use
normal queued atomic writes. Only the latest queued success clears pending media;
retry/export can recover originals from history after an earlier database cleanup.
`domain/clipboard.ts` validates same-project reference payloads and creates independent
Placements. DOM clipboard events carry custom MIME plus text; editor fields keep
native behavior. Images use the existing media validator and one canonical command.

`assignAudio` distributes pages in order across duration. `trimRange` clamps preview
to neighbors/duration with positive lengths, and `trimSection` commits once on pointer
release. Escape/cancel abandons preview; arrows adjust 0.1 seconds, Shift adjusts 1.
`MarkdownContent` renders react-markdown10.1.0 + remark-gfm4.0.1 with HTML disabled.
`MermaidDiagram` lazy-loads mermaid11.16.1, caps input at10,000 characters and200 edges,
rejects configuration/remote resources/math, and puts output in a scriptless sandbox
with restrictive CSP. The frame takes the diagram's own aspect ratio from the SVG
`viewBox` (width capped at the viewBox width), not a fixed height. Existing text strings and archive schema remain unchanged.

These exact dependencies were authorized and installed locally. npm audit reports
one low-severity KaTeX advisory through Mermaid (two package alerts); math input is
blocked. A major Mermaid upgrade requires separate compatibility work; do not claim
that these controls remove the dependency advisory.

`nextPageRange` defaults after the greatest section end. `timelineExtent` adds30
seconds of planning headroom, up to seven days. Audio waveform/seek/playhead retain
the real source duration; the end marker distinguishes silent planning below it.
`reorderPage` normalizes Page.order, moves whole timed pages and retains their
individual durations and slot gaps. `pageReorderProps` handles the same internal
native page drag MIME in both rails; existing Move earlier/later use the same command.
Post-audio ranges need no schema version change: their existing time fields remain
finite positive seconds; import now accepts ranges beyond the referenced duration.

### Fractional section values — 2026-10-20

Section start/end fields use number inputs with step="any". Auto-generated audio
boundaries and pointer trims can contain fractions that are not multiples of0.1.
Do not round stored/default values merely to satisfy a browser step constraint:
that can move boundaries or overlap an adjacent section. Domain validation still
checks finite values, ordering, overlap and the planning limit when saving.
