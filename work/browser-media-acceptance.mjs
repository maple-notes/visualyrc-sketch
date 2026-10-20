import { writeFile } from "node:fs/promises";
export async function runMedia(tab, root) {
  const pw = tab.playwright,
    checks = [];
  const b = (name) => pw.getByRole("button", { name, exact: true });
  const check = (ok, name) => {
    if (!ok) throw Error("FAIL: " + name);
    checks.push({ name, passed: true });
  };
  const upload = async (name, path) => {
    const event = pw
      .waitForEvent("filechooser", { timeoutMs: 10000 })
      .catch((e) => ({ error: String(e) }));
    await b(name).click();
    const chooser = await event;
    if ("error" in chooser) throw Error(chooser.error);
    await chooser.setFiles([path]);
  };
  await b("Canvas").click();
  if (await b("Open Saezutter").count()) await b("Open Saezutter").click();
  await upload("Attach image", root + "/tmp/fixtures/reference.jpg");
  await pw
    .locator('.post-card img[alt="reference.jpg"]')
    .waitFor({ state: "visible" });
  check(true, "JPEG decodes in the browser");
  await upload("Attach image", root + "/tmp/fixtures/reference.webp");
  await pw
    .locator('.post-card img[alt="reference.webp"]')
    .waitFor({ state: "visible" });
  check(true, "WebP decodes in the browser");
  await upload("Load audio", root + "/tmp/fixtures/tone.mp3");
  await b("Replace audio").waitFor({ state: "visible" });
  check(
    (await pw.getByTestId("playback-time").innerText()).includes("/ 00:06"),
    "MP3 metadata and playback source load",
  );
  await b("Play").click();
  await b("Pause").waitFor({ state: "visible" });
  const deadline = Date.now() + 10000;
  while (!(await b("Play").isVisible()) && Date.now() < deadline)
    await new Promise((resolve) => setTimeout(resolve, 200));
  check(
    (await pw.getByTestId("playback-time").innerText())
      .trim()
      .startsWith("00:06"),
    "natural end stops and displays duration",
  );
  await b("Play").click();
  await b("Pause").waitFor({ state: "visible" });
  check(true, "play restarts naturally ended audio");
  await b("Stop").click();
  const event = pw
    .waitForEvent("download", { timeoutMs: 10000 })
    .catch((e) => ({ error: String(e) }));
  await b("Export project").click();
  const download = await event;
  if ("error" in download) throw Error(download.error);
  const path = await download.path();
  await upload("Import project", path);
  await pw
    .locator('.post-card img[alt="reference.jpg"]')
    .waitFor({ state: "visible" });
  await pw
    .locator('.post-card img[alt="reference.webp"]')
    .waitFor({ state: "visible" });
  await b("Replace audio").waitFor({ state: "visible" });
  check(true, "JPEG WebP and MP3 survive portable roundtrip");
  await upload("Replace audio", root + "/tmp/fixtures/broken.vsketch");
  await pw.getByRole("alert").waitFor({ state: "visible" });
  check(
    await b("Replace audio").isVisible(),
    "invalid audio leaves prior MP3 source intact",
  );
  await b("Dismiss error").click();
  const errors = await tab.dev.logs({ levels: ["error"], limit: 30 });
  check(errors.length === 0, "no console errors during codec checks");
  await writeFile(
    root + "/outputs/verification/browser-media.json",
    JSON.stringify(
      { checks, url: await tab.url(), completedAt: new Date().toISOString() },
      null,
      2,
    ),
  );
  return { passed: checks.length };
}
