# Build verification — 2026-10-20

Status: the local P0 implementation is mechanically verified. The learner's final
hands-on review and learning reflection have not happened while they are away.
This report is technical evidence, not a human-written contest submission.

## Update 2026-10-25: review fixes

After the learner's hands-on review, four display problems were fixed in commits
`06f03aa`, `5e0317e` and `b048e22`:

- Markdown cards showed a blank line between every heading, list and paragraph.
- Graph cards had a fixed 260 by 160 frame, so longer notes spilled out. Text cards
  now grow with their text and keep an optional saved size.
- Short audio sections let the title, time range and buttons overlap.
- Mermaid diagrams sat in a frame fixed at 200 px high, and the monospace font
  differed between browsers.

Checks run on this source: `npm run typecheck`, `npm run lint` and `npm run build`
pass, and `npm test` passes 37 tests in seven files. A new unit test covers the
saved Graph card size. A Playwright script with the installed Chrome checked
resize, persistence and growth of a Graph card, and rendered sections of 3, 4 and
7 seconds. The 58-assertion Codex in-app browser suite below was not rerun for
these commits.

## Result

- `npm run typecheck`: pass, TypeScript strict checking.
- `npm run lint`: pass, ESLint.
- `npm test`: 22 tests passed across four files.
- `npm run build`: pass, static Vite build. One initial JavaScript chunk remains
  above Vite's 500 kB warning threshold; the warning is not suppressed.
- Actual **Codex in-app browser**: 58 assertions passed against the production
  preview at `http://127.0.0.1:4173/`, completed 2026-10-20 09:04 HST.
- Browser console: zero error records during the successful acceptance runs.
- `npm run verify:browser-evidence`: verifies saved results against the source
  fingerprint. It does not drive a browser. Local evidence is ignored, not fabricated
  or included in a fresh clone.
- Formatting: existing cached Prettier was used on TypeScript, CSS, configs, runner
  scripts and the app map. No formatter or browser package was downloaded for this.

Core source commit: `8e42ae0` (following initial slice `4ec9daa`).
The source fingerprint and exact browser completion timestamp are in the ignored
`outputs/verification/browser-suite.json`.

## Actual browser coverage

The 30 core assertions cover no-login project creation, text posting/placement,
shared edits on independent pages, independent sizes, reload and page restoration,
image placement, canonical Graph identity, explicit links, location navigation,
placement removal without content loss, sidebar area/draft retention, optional audio,
linear waveform/section alignment, seek/play/pause/stop, page selection without seek,
media-inclusive download/import as a new project, and malformed import recovery.

Twenty additional assertions use actual pointer drags and corner grips, verify
keyboard Graph movement after reload, image aspect preservation, Graph search,
overlapping-range rejection, Play from section, audio replacement cancel/confirm,
no-audio fallback, page reorder/deletion, relationship unlink, canonical deletion,
feed-only deletion, and read-only second-tab behavior.

Eight codec assertions load generated JPEG and WebP images and MP3 audio, verify
natural ending and restart, roundtrip all three original formats, reject invalid
audio while preserving the prior source, and check console errors. PNG and WAV are
covered in the core suite. Test media contains a generated color field and tone;
reference screenshots and personal media are not used as product assets.

A separate 100-Node/100-Placement/99-Edge/10-page fixture was imported through the UI.
Graph rendered 100 canonical Nodes and 99 Edges; a text edit survived reload, with
no console errors. This confirms that journey at that size; it does not establish
an FPS, memory or large-file guarantee.

The initial production-preview visit used a fresh origin distinct from the dev
server. A fresh browser profile and Safari were not tested. Do not label the fresh
origin as a separate browser profile.

## Tests at boundaries

Domain tests verify shared edits, placement independence, removal semantics,
undirected edge uniqueness and invalid ranges. Archive tests verify ID remapping,
original media bytes, missing media, malformed/versioned/traversal input, actual
inflated JSON limits, directory truncation, CRC corruption and export/read limits.
Storage tests verify project/media transactions and rollback on an injected quota
exception, plus reclaiming removed audio. Media tests cover header bounds,
invalid/animated WebP rejection and near-end clock formatting.

Real browser storage exhaustion was not induced. Failed-save recovery is implemented
but its UI was not tested under real quota exhaustion. No passing result is claimed
for that unperformed scenario.

## Repairs found through verification

- Image decode could finish after changing projects; project identity is checked
  again before applying the asset.
- Async import/gesture callbacks could retain stale busy state. A synchronous guard
  at the shared mutation entry now blocks conflicting writes.
- Switching projects could use an earlier database list snapshot; switching reads
  the latest committed document, or retains the current in-memory document.
- Export could omit missing original media or exceed reader-only limits. It now
  rejects those cases and does not claim a valid backup.
- ZIP parsing needed directory/header consistency and CRC checks, in addition to
  bounded streaming extraction.
- Keyboard moves were visible but not durable. Final position changes now persist
  for keyboard and pointer operations.
- Audio replacement could read its asset before the save committed. The player now
  observes the asset table and creates its source after the asset becomes available.
- Long project names could exceed the schema during creation or import suffixing.
  Creation now validates the schema and imported names stay within its limit.
- Unreferenced replacement audio could accumulate. The atomic save reclaims only
  media no longer referenced by canonical content or active audio.

Runner corrections are distinguished from app fixes: the browser adapter has no
`isDisabled()` helper, the sidebar can already be open, and its short locator wait
was insufficient for a six-second audio ending. The runner uses DOM disabled-state
observation, current sidebar state, and bounded visible-state polling. Final suites
were rerun; earlier interrupted attempts were not counted as passes.

## Performance evidence

Same-source A/B builds changed only eager versus deferred archive loading:

| Measurement | Eager archive | Deferred archive |
| --- | ---: | ---: |
| Initial JS bytes | 653,244 | 634,236 |
| Initial gzip bytes, same Node zlib settings | 203,964 | 196,002 |
| Total JS including worker/async chunk | 653,534 | 655,255 |

Initial gzip payload avoids **7,962 bytes**, while import/export still loads the
archive module when used. Total code was not reduced; this is deferred work, not an
FPS or elapsed-network-load claim. The production Vite report uses its own gzip
settings: initial JS approximately 634.23 kB / 198.12 kB gzip, CSS27.73 kB /5.49 kB
gzip, archive chunk20.72 kB /9.10 kB gzip, worker0.29 kB.

For the 100-node fixture, 100 pure Node clone/edit/full-validation runs measured
median0.479 ms and p95 0.768 ms on Node22.23.2. This excludes rendering, IndexedDB,
browser automation transport, audio decoding and network. It is not browser latency.
`work/measure-bundle.mjs` and `work/make-performance-fixture.mjs` reproduce these
specific measurements. Board memoization separates the audio clock from board props;
no render-rate improvement is claimed without a browser trace.

## Known limits and release handoff

Desktop-first Chromium acceptance is verified. Safari, physical touch/phone use,
responsive viewport resizing, reduced-motion device behavior, heap/FPS profiling,
fresh browser profile import and real media near size ceilings remain unverified.
Long audio can omit the waveform to bound decode memory. There is no complete undo,
cloud backup, live collaboration or rich embed service in P0.

The static build is ready for a later integration into the owner's separate
Cloudflare Pages website. This task did not touch that repository, deploy, or push
application commits. Browser storage is origin-scoped; moving hosts requires a
portable export/import. The project's own license is still undecided; installed
third-party notices are recorded separately.

Human final review, the official learning wrap-up, demo recording, the learner's own
submission and any public publication remain open. No registration, human feedback,
submission, survey answer or release-license approval is claimed by this report.

## Hands-on review revisions — 2026-10-20 18:58 HST

Implementation commit: `e44dc8d`. This supplements the earlier core-build snapshot;
it does not retrospectively replace its measurements or the human learning record.

- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm test`:36 tests pass across7 files.
- Cached Prettier `--check src work/*.mjs`: pass; no formatter installation.
- `npm run build`: pass; the existing large-chunk warning remains.
- Actual Codex in-app browser against disposable `http://127.0.0.1:4190/`:
  core30 + extended20 + media8 + review37 =95 passing assertions.
  Completion:2026-10-21T04:58:12.303Z. Browser console errors:0.
- `npm run verify:browser-evidence`: pass for source fingerprint
  `5d17971977fb99663831d22dd4c49d37d53f17f837c11f4dc7b661be8dbd04d7`.
  This checks the saved actual-run reports; it does not execute the browser.
- `git diff --check`: pass. Private learner profile, media fixtures, screenshots,
  local evidence and the nested GitHub Desktop checkout remain unstaged/ignored.

New actual UI checks include left-rail toggle placement, equal audio assignment,
section-edge pointer/keyboard trims, source/range restoration after Undo, native
Cmd+C/V/X/Z/Shift+Z, cross-page shared references, native text-field Undo, image
original recovery, Markdown headings/lists/emphasis, valid Mermaid output and its
sandbox/CSP, visible unsafe-diagram rejection, new post-audio sections with immediate
grips, extension/reload, actual page drag in ordinary and timed rails, duration/order
Undo, and disabling play for sections wholly after audio end. Archive unit tests
also roundtrip post-audio sections without changing actual media duration.

Verification found and repaired an audio-ended clock race. Grip tests initially
hit the sidebar when a narrow viewport hid the node corner; they now operate the
visible Fit control before resizing. A read-only review found two recovery cases:
older writes clearing newer pending originals, and unused pending media inflating
retry/export sizes. Writes now clear pending media only for the latest success,
filter originals to current references, and export/retry recover from session history.

The browser runtime provides native file choosers but no documented native external
file-drag API. Canvas chooser ingestion and real Saezutter/page drags passed; actual
Finder-to-browser file ingress remains unautomated. Renderer-specific portable
browser roundtrip was not separately driven; the unchanged stored text strings use
the archive path covered by the existing tests. Safari/physical devices remain unchecked.

Dependency install was explicitly approved for react-markdown10.1.0, remark-gfm4.0.1,
mermaid11.16.1. Actual node_modules total is324MiB, approximately158MiB added versus
the earlier100–150MiB estimate. Production dist is4.3MiB; Mermaid loads lazily on
visible diagrams. These are disk sizes, not browser memory or frame-rate results.
`npm audit --json` reports2 low package alerts from one transitive KaTeX advisory
(GHSA-238p-pmpm-9mq7),0 moderate/high/critical. Mermaid math/configuration/external
resources are disabled and SVG is sandboxed; this does not clear the dependency
advisory. Do not apply the proposed major-version fix without compatibility review.

Generated local evidence/screenshots/logs: outputs/verification, approximately1.8MiB.
Temporary generated fixtures: tmp, approximately1.7MiB. Neither is committed.
The user project on4180 was left intact; final tests used4190. Reload only after
Saved is visible, and keep the same origin to retain browser-local projects.
Human final acceptance and learning reflection remain pending; no push/deployment.

## Fractional-value regression — 2026-10-20 19:13 HST

The learner's screenshot showed a native step mismatch for automatically populated
section values60.0994144685444 and90.09941446854441. Reproduced in an isolated4190
tab: both range fields matched :invalid and Save kept the dialog open. Both inputs
now accept arbitrary decimal precision with step="any"; no boundary rounding and
no change to domain overlap/order/finite-value checks.

- Typecheck, ESLint,36 unit tests, production build and cached Prettier checks: pass.
- Actual Codex browser suite:30 core +20 extended +8 media +39 review =97 passes,
  completed2026-10-21T05:13:49.775Z, source fingerprint
  `0084beab93aad96ea30749fcf44102e8d74cd19f280f71f9a9eee3909e1d71d3`.
- New checks use the exact screenshot values, verify no native-invalid fields,
  then save through the real button and confirm the retained fractional boundary.
- Saved-evidence check and git diff whitespace check pass. Browser console errors:0.
- The resize runner uses the top-right L grip after Fit. In one viewport its former
  bottom-right target was covered by the selection tray; this is a test targeting
  adjustment, not a claimed product fix for overlays.
- Existing4173 user project was not modified by tests. Reload there after Saved.
- No new dependencies/downloads. Existing dependency total324MiB; dist4.3MiB;
  local outputs/verification1.8MiB and temporary fixtures1.7MiB. These remain ignored.
- The previously documented Safari/native Finder ingress and dependency-audit limits
  remain. No push or deployment.
