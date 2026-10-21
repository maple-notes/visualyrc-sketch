// This needs a live Codex in-app browser tab; it does not launch a separate browser.
import { runReview } from "./browser-review-acceptance.mjs";
import { runAcceptance } from "./browser-acceptance.mjs";
import { runMedia } from "./browser-media-acceptance.mjs";
import { runExtra } from "./browser-extra-acceptance.mjs";
import { sourceFingerprint } from "./source-fingerprint.mjs";
import { writeFile } from "node:fs/promises";
export async function runSuite(tab, browser, root) {
  const before = await sourceFingerprint(root);
  const core = await runAcceptance(tab, root);
  const extra = await runExtra(tab, browser, root);
  const media = await runMedia(tab, root);
  const review = await runReview(tab, root);
  const after = await sourceFingerprint(root);
  if (before !== after)
    throw Error("Source changed during browser verification; rerun.");
  const result = {
    sourceHash: after,
    core: core.passed,
    extra: extra.passed,
    media: media.passed,
    review: review.passed,
    total: core.passed + extra.passed + media.passed + review.passed,
    url: await tab.url(),
    completedAt: new Date().toISOString(),
  };
  await writeFile(
    root + "/outputs/verification/browser-suite.json",
    JSON.stringify(result, null, 2),
  );
  return result;
}
