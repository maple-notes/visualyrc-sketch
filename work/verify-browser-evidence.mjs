// Checks saved real-browser evidence. It does not drive or replace browser testing.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { sourceFingerprint } from "./source-fingerprint.mjs";
const root = process.cwd(),
  report = JSON.parse(
    await readFile("outputs/verification/browser-suite.json", "utf8"),
  );
assert.equal(
  report.sourceHash,
  await sourceFingerprint(root),
  "Source changed: run the Codex in-app browser suite again.",
);
for (const file of [
  "browser-acceptance.json",
  "browser-extra.json",
  "browser-media.json",
]) {
  const result = JSON.parse(
    await readFile("outputs/verification/" + file, "utf8"),
  );
  assert(
    result.checks.length > 0 && result.checks.every((c) => c.passed === true),
  );
}
assert.equal(report.core, 30);
assert(report.extra >= 20);
assert.equal(report.media, 8);
assert.equal(report.total, report.core + report.extra + report.media);
console.log(
  `Verified saved Codex-browser evidence: ${report.total} checks, ${report.url}, ${report.completedAt}. This command does not rerun the browser.`,
);
