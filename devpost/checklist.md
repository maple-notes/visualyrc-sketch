---
doc: checklist
status: approved
---
# Build Checklist

Build mode: fast — user explicitly delegated unattended implementation through HST 17:30.
The user requested all work without waiting for checkpoints; order selected by agent
under that instruction. The learner has now provided hands-on feedback; final readiness remains pending.

## Slices

- [x] **1. Shared text references survive reload**
  Becomes usable: Shared text references survive reload.
  Why now: Proves the unique shared-content kernel before peripheral features.
  PRD ref: `prd.md > Capture and Shared Content`
  Spec ref: `spec.md > Canonical Content Repository`
  Build: Bootstrap React/Vite/Dexie and render the chosen light shell, create project/pages, post/place/edit text across independent placements with autosave.
  Verify (mechanical): Check shared edits, independent placement geometry, reload persistence and typecheck/unit/build.
  Learner check: Post a note, place on two pages, edit and reload.
  Commit: `feat: shared text workspace with durable reference placements`

- [x] **2. Images and cross-page Graph are usable**
  Becomes usable: Images and cross-page Graph are usable.
  Why now: Extends the verified kernel to visual references and cross-page links.
  PRD ref: `prd.md > Graph Relationships and Navigation`
  Spec ref: `spec.md > Graph Adapter`
  Build: Add local image posts and placements, L resize grips, explicit related edges, all-node Graph and location navigation.
  Verify (mechanical): Decode image fixture, test reference deletion and edge persistence, operate Graph in Codex browser.
  Learner check: Place an image, link it to a note and navigate back from Graph.
  Commit: `feat: image references and project-wide graph`

- [x] **3. Portable project backup restores media**
  Becomes usable: Portable project backup restores media.
  Why now: Addresses portable media durability before adding audio.
  PRD ref: `prd.md > Local Save and Portable Projects`
  Spec ref: `spec.md > Storage and Project Archive`
  Build: Implement bounded ZIP .vsketch export/import, new-project ID remap, truthful save status and read-only concurrent-tab handling.
  Verify (mechanical): Roundtrip original media, reject malformed/missing/oversize archives without changing old project; browser download/import.
  Learner check: Export, import and verify the restored project.
  Commit: `feat: validated portable project archives`

- [x] **4. Audio drives a vertical section timeline**
  Becomes usable: Audio drives a vertical section timeline.
  Why now: Adds the requested audio workflow on proven persistence.
  PRD ref: `prd.md > Optional Audio and Timed Pages`
  Spec ref: `spec.md > Audio Player and Section Rail`
  Build: Add validated optional audio, waveform worker, play/pause/stop/seek, range fields, follow and no-audio fallback.
  Verify (mechanical): Generated small WAV fixture tests clock/control/range alignment, persistence and archive roundtrip.
  Learner check: Load audio, seek, stop and switch sections without unintended seek.
  Commit: `feat: local audio and timed page navigation`

- [x] **5. Integrated workspace is verified and documented**
  Becomes usable: Integrated workspace is verified and documented.
  Why now: Verifies the whole scope and measures actual behavior.
  PRD ref: `prd.md > Workspace and Accessibility`
  Spec ref: `spec.md > Verification and Performance Learning`
  Build: Complete keyboard alternatives, empty/errors, resize and magnetic hover, performance fixture and reproducible browser acceptance evidence.
  Verify (mechanical): Run all configured checks and actual Codex-browser journeys; record screenshots/logs, limits and performance.
  Learner check: Final human review when back; do not mark as performed during absence.
  Commit: `test: verify core journeys and release-ready static build`

## Hands-on Checkpoints
- [ ] Early usable behavior explored by learner — deferred during explicitly requested absence; agent browser checks proceed.
- [x] Final kick-the-tires exploration and feedback completed by learner — annotated screenshot and editing feedback received2026-10-20; retry after fixes remains pending.

## Final Review
- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map
- [ ] Learning activity complete — real performance evidence prepared; learner follow-up pending
- [ ] Optional edit and transfer reflection addressed
- [x] `devpost/app-map.html` generated from finished code, local links checked, opened in Codex browser and provided as a take-home link. The panel-open request is queued until this task is shown.

Activity and evidence: agent-only Codex browser acceptance, 58 passing assertions;
22 passing unit tests. See verification.md for actual evidence and limits.
Learner hands-on exploration happened on2026-10-20; the learning tour/reflection has not.
Route and stops: reference route prepared: app.tsx composer/run →
domain/model.ts postText/place → storage/db.ts saveProject. Not toured with learner.
Edit outcome: optional learner edit has not been offered during absence.
Reflection: deferred while user away.
Activity mode: agent browser verification now, learner review later.

## Revisions

- User explicitly requested unattended completion by HST17:30; plan/order and fast
  execution are delegated. Human checkpoints remain unchecked until real feedback.
- The first working integration includes adapters needed to compile all views;
  later slices remain unchecked until their browser acceptance passes.
- Persistence stores each normalized project document atomically in a projects
  table and original media in an assets table. At the 100-node PoC target this
  avoids unnecessary table coordination while preserving Node/Placement identity.
  Revisit only if measured project-write cost warrants separate record tables.

- Slices2–4 were integrated into the initially compilable app, then verified through
  the real core journey and extra gestures before a consolidated local commit.
  Their original suggested commit titles are descriptive targets, not fabricated
  historical commits. Actual commit IDs are recorded in the Git log below.
- Mechanical slices are complete. Human checkpoints, final review and learning
  reflection remain unperformed and must not be checked by an unattended agent.

## Actual local commits

- `4ec9daa`: first working shared-text/reference slice.
- `8e42ae0`: completed image/Graph, archive, audio, recovery and verification tools.
- This documentation commit: actual report, app map, planning reconciliation and
  static-hosting handoff. No application push or deployment was performed.

## Official skill resume — 2026-10-20

- Invoked the installed official `5-build` again from saved project artifacts.
  Planning artifacts exist and scope/PRD/spec/checklist remain approved; completed
  implementation slices are not repeated or retroactively attributed to new runs.
- Re-ran typecheck, ESLint,22 unit tests and the production build successfully.
  The existing 58-assertion Codex-browser report matches current source; the
  saved-evidence check is not a new browser run. The large-chunk warning remains.
- Read the official learning-wrap-up instructions. Use the real same-source archive
  loading comparison for the learner's web-optimization goal after final feedback;
  the app map is already available. No learner activity or reflection is claimed.
- Checked the official `6-ship` entry conditions. Hands-on feedback, explicit final
  readiness and the learning wrap-up remain open, so shipping steps have not begun.
- Next interaction: learner tries the local preview and describes any unexpected
  behavior or desired corrections. Keep all human-completion boxes unchecked until
  that feedback and final readiness actually happen. No additional features,
  publication, push or deployment are authorized by this resume record.

## Hands-on review revisions — 2026-10-20

The learner returned and supplied actual feedback. Follow `review-plan.md` for
rail placement, automatic sections, trim grips, image drops, session editing history,
Markdown and Mermaid. Dependency installation was explicitly approved. Keep final
readiness and learning reflection unchecked until the learner completes them.

- Completed the authorized hands-on revisions in local commit `e44dc8d`.
  Verified36 unit tests and95 actual Codex-browser assertions, including page drag
  in both rails, post-audio range/reload, clipboard keys, original-media undo,
  Markdown and sandboxed Mermaid. Exact commands and limitations: verification.md.
- Recorded the learner's follow-up decision: new pages may occupy silent planning
  after audio end; move whole pages through drag-and-drop with duration preserved.
- Consolidated these connected review fixes in one implementation checkpoint after
  integration tests, followed by a documentation checkpoint. Suggested per-task
  commit steps in review-plan.md are not separate fabricated historical commits.
- Learner retry, explicit readiness, code tour/reflection and6-ship remain pending.
  No push, deployment or work in the separate website repository occurred.

### Fractional-value correction

The learner reported that the native number-input step constraint rejected an
automatically filled value60.0994144685444. Reproduced two invalid fields and a
blocked Save. Changed both section fields to step="any"; original precision and
domain validation remain intact. Added native-validity and actual-save browser
regressions using the exact screenshot values; verification.md records the result.

## Second review revisions 2026-10-25

The learner reviewed screenshots of seeded demo projects and asked for four fixes:
blank lines in Markdown cards, Graph cards that could not grow or be resized,
overlapping labels in short audio sections, and a fixed-height Mermaid frame. The
same pass made the monospace font consistent across browsers.

- Fixed in commits `06f03aa`, `5e0317e` and `b048e22`, pushed to `origin/main`
  with the learner's approval.
- Verified with typecheck, lint, build and 37 unit tests. A Playwright script
  checked Graph card resize and growth. The Codex in-app browser suite was not
  rerun; verification.md records the scope.
- Two later fixes: the Graph link list hides already linked nodes (`ad62365`), and
  Graph cards link by dragging between handles (`423cb71`).
- The planning documents `devpost/prd.md` and `devpost/spec.md` were updated to match
  the implementation before the repository was made public.
- Final readiness, the code tour and 6-ship remain open.
