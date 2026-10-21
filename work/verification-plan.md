# Reproduce verification

The official `devpost/checklist.md` remains the progress source. Human exploration,
final readiness and learning reflection stay unchecked until they actually happen.

## Local fixtures and standard checks

Use the installed Node 22 runtime. The commands below install nothing:

```sh
python3 work/make-media-fixtures.py
sh work/make-codec-fixtures.sh
node work/make-performance-fixture.mjs
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

Codec fixture generation uses the existing FFmpeg and Python Pillow. Those are
verification helpers only; the app needs neither. Do not install them silently on
another machine. Generated media contains a color field and a quiet six-second tone.
No user or third-party art is used in destructive tests.

## Actual Codex in-app browser run

Read the installed `control-in-app-browser` skill. Connect using its documented
browser runtime through the Codex Node tool. Open a disposable origin such as `http://127.0.0.1:4180/` in a tab
with no other editable tab on that origin. Pass that live tab and browser binding:

```js
const suite = await import('/absolute/project/path/work/browser-suite.mjs');
await suite.runSuite(tab, browser, '/absolute/project/path');
```

This creates disposable projects through visible controls, file choosers and actual
pointer gestures. It does not inject application state, fetch data behind the UI,
or substitute an external browser. `browser-acceptance.mjs` checks the 30 core
assertions; `browser-extra-acceptance.mjs` checks 20 gestures/deletion/audio/locking
assertions; `browser-media-acceptance.mjs` checks 8 codec and natural-ending assertions;
`browser-review-acceptance.mjs` checks 37 final-review assertions including actual
clipboard keys, trim drag, media undo, Markdown and Mermaid. Total: 95 assertions.
Native Finder file drags are not automated by the installed runtime. A real Canvas
file chooser tests the shared ingestion path; native external ingress needs a human check.

Results and screenshots are ignored under `outputs/verification/`. The suite checks
that source did not change during the run and records its fingerprint. Afterwards:

```sh
npm run verify:browser-evidence
```

That command validates the saved report against current source. It does not rerun
browser operations. A fresh clone has no local report and should fail until a real
browser run produces one. Record real failures and repairs; never write a passing
report by hand. After editing a runner, reconnect a fresh Node tool session so its
module cache does not retain an earlier runner version.

## Measurements

`node work/measure-bundle.mjs` builds the same source twice, changing only eager
versus deferred archive loading, then compares initial entry gzip bytes. Outputs
remain in `outputs/verification/bundle-*`; no app source is modified.
`node work/make-performance-fixture.mjs` creates 100 Nodes, 100 Placements, 99 Edges
and 10 pages, with one shared image asset and one audio asset. It separately measures
100 pure Node clone/edit/validation runs. Import that fixture through the browser,
edit a Graph node, and reload; record actual counts. Neither measurement establishes
browser FPS, heap usage or a real-device guarantee.
