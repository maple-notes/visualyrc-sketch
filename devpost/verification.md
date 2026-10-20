# Build verification — 2026-10-20

Status: the local P0 implementation is mechanically verified. The learner's final
hands-on review and learning reflection have not happened while they are away.
This report is technical evidence, not a human-written contest submission.

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
