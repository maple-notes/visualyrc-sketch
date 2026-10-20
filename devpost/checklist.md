---
doc: checklist
status: approved
---
# Build Checklist

Build mode: fast — user explicitly delegated unattended implementation through HST 17:30.
The user requested all work without waiting for checkpoints; order selected by agent
under that instruction. Human feedback/final readiness are still not performed.

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

- [ ] **2. Images and cross-page Graph are usable**
  Becomes usable: Images and cross-page Graph are usable.
  Why now: Extends the verified kernel to visual references and cross-page links.
  PRD ref: `prd.md > Graph Relationships and Navigation`
  Spec ref: `spec.md > Graph Adapter`
  Build: Add local image posts and placements, L resize grips, explicit related edges, all-node Graph and location navigation.
  Verify (mechanical): Decode image fixture, test reference deletion and edge persistence, operate Graph in Codex browser.
  Learner check: Place an image, link it to a note and navigate back from Graph.
  Commit: `feat: image references and project-wide graph`

- [ ] **3. Portable project backup restores media**
  Becomes usable: Portable project backup restores media.
  Why now: Addresses portable media durability before adding audio.
  PRD ref: `prd.md > Local Save and Portable Projects`
  Spec ref: `spec.md > Storage and Project Archive`
  Build: Implement bounded ZIP .vsketch export/import, new-project ID remap, truthful save status and read-only concurrent-tab handling.
  Verify (mechanical): Roundtrip original media, reject malformed/missing/oversize archives without changing old project; browser download/import.
  Learner check: Export, import and verify the restored project.
  Commit: `feat: validated portable project archives`

- [ ] **4. Audio drives a vertical section timeline**
  Becomes usable: Audio drives a vertical section timeline.
  Why now: Adds the requested audio workflow on proven persistence.
  PRD ref: `prd.md > Optional Audio and Timed Pages`
  Spec ref: `spec.md > Audio Player and Section Rail`
  Build: Add validated optional audio, waveform worker, play/pause/stop/seek, range fields, follow and no-audio fallback.
  Verify (mechanical): Generated small WAV fixture tests clock/control/range alignment, persistence and archive roundtrip.
  Learner check: Load audio, seek, stop and switch sections without unintended seek.
  Commit: `feat: local audio and timed page navigation`

- [ ] **5. Integrated workspace is verified and documented**
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
- [ ] Final kick-the-tires exploration and feedback completed by learner

## Final Review
- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map
- [ ] Learning activity complete — real performance evidence prepared; learner follow-up pending
- [ ] Optional edit and transfer reflection addressed
- [ ] `devpost/app-map.html` generated from finished code, checked and shown

Activity and evidence: pending implementation and measurements.
Route and stops: pending actual code.
Edit outcome: not yet offered.
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
