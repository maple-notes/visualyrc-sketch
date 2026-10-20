# AGENTS.md — Visualyrc Sketch

## Mission
Build a new, standalone web app for the hackathon: independent page canvases, project-wide Saezutter, and a cross-page node graph. Read `DECISIONS.md`, `scope.md`, `prd.md`, `spec.md`, `DESIGN.md` before coding.

## Mandatory process
1. **Before implementation**, briefly present approach and ask for approval on unresolved choices in `DECISIONS.md`.
2. Inspect repository, existing scripts, dependency versions and test setup. Do not assume a stack already exists.
3. Install and run the organizer's **official Devpost Learn Skill Pack** following its authentic instructions; do not fake evidence of use. Reconcile its generated planning artifacts with these drafts.
4. Use existing naming, style and architecture; minimal diffs. Do not rewrite working modules for aesthetic reasons.
5. Implement vertical slices: persistence → Saezutter → pages/canvas → reference placements → graph edges → navigation.
6. Run formatting, type checking, unit tests, and E2E where available. Report exact commands, results, and untested paths.
7. Update documentation and add screenshots/demo notes as features become functional.

## Guardrails
- Do not turn this into Electron; browser-first unless explicitly approved.
- Do not introduce cloud accounts, AI APIs, collaborative sync, or external services without approval.
- Do not reuse proprietary code from existing Visualyrc products. Public third-party dependencies must be license-checked.
- Treat a Saezutter post and canvas component as canonical nodes, not separate data silos.
- Deleting a placement must never silently delete a node.
- Do not promise FxEmbed/fixupx iframe compatibility; provide fallback links.
- Do not add features beyond P0 while P0 is incomplete; capture ideas in `BACKLOG.md`.
- Never commit secrets, personal files, or copyrighted media without rights.
- Ask before destructive file operations, history rewrites, deployment or pushing public code.

## Collaboration
The human owns product and aesthetic decisions. Agents implement, test, document and surface tradeoffs. Prefer clear Japanese progress reports; keep code and external submission copy in English where appropriate. Ponytail, Pstack and Superpowers may supplement the mandatory contest skill if rules allow; do not allow them to replace it.

## Completion report format
Implemented / Changed files / Tests run and outcomes / Known limitations / Next decision required.
