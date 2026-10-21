// Run only through Codex's Node tool with an already connected in-app browser tab.
import { writeFile, mkdir } from "node:fs/promises";
export async function runAcceptance(tab, root) {
  const checks = [];
  const pw = tab.playwright;
  const button = (name) => pw.getByRole("button", { name, exact: true });
  const check = (ok, name) => {
    if (!ok) throw Error("FAIL: " + name);
    checks.push({ name, passed: true, at: new Date().toISOString() });
  };
  const upload = async (name, path) => {
    const event = pw
      .waitForEvent("filechooser", { timeoutMs: 10000 })
      .catch((e) => ({ error: String(e) }));
    await button(name).click();
    const chooser = await event;
    if ("error" in chooser) throw Error(chooser.error);
    await chooser.setFiles([path]);
  };
  const state = async () => {
    await tab.ax.write();
  };
  // Start a separate disposable project entirely through visible controls.
  await pw.locator(".project-title").click();
  await button("New project").click();
  await pw
    .getByLabel("Project name", { exact: true })
    .fill("Acceptance workspace");
  await button("Create project").click();
  await state();
  check(
    (await pw.locator(".project-title").innerText()) === "Acceptance workspace",
    "new project without login",
  );
  await pw
    .getByLabel("Write a note", { exact: true })
    .fill("Original shared idea");
  await button("Post").click();
  await button("Add post to page").click();
  await state();
  check(
    (await pw.locator(".react-flow__node").count()) === 1,
    "text post creates reference placement",
  );
  await button("Add page").first().click();
  await pw.getByLabel("Page title", { exact: true }).fill("Second page");
  await button("Save page").click();
  await button("02 Second page").click();
  await button("Add post to page").click();
  await button("Edit post").click();
  await pw
    .getByLabel("Text content", { exact: true })
    .fill("Shared edit across both pages");
  await button("Save text").click();
  await state();
  check(
    (await pw.locator(".react-flow__node .content-text").innerText()) ===
      "Shared edit across both pages",
    "edit updates second page",
  );
  await button("01 Opening").click();
  check(
    (await pw.locator(".react-flow__node .content-text").innerText()) ===
      "Shared edit across both pages",
    "same edit updates first page",
  );
  await pw
    .getByRole("button", { name: "Shared edit across both pages", exact: true })
    .click();
  await pw.getByLabel("Placement width", { exact: true }).fill("360");
  await pw.getByLabel("Placement X", { exact: true }).fill("140");
  await state();
  check(
    (await pw
      .getByLabel("Placement width", { exact: true })
      .getAttribute("value")) === "360",
    "numeric resize changes placement",
  );
  await button("02 Second page").click();
  await pw
    .getByRole("button", { name: "Shared edit across both pages", exact: true })
    .click();
  check(
    (await pw
      .getByLabel("Placement width", { exact: true })
      .getAttribute("value")) === "280",
    "other reference geometry stays independent",
  );
  await tab.reload();
  await state();
  check(
    (await pw.locator(".canvas-toolbar").innerText()).includes("SECOND PAGE"),
    "reload restores selected page",
  );
  check(
    (await pw.locator(".react-flow__node .content-text").innerText()) ===
      "Shared edit across both pages",
    "reload restores shared content",
  );
  await upload("Attach image", root + "/tmp/fixtures/reference.png");
  await pw.locator(".post-card img").waitFor({ state: "visible" });
  await state();
  await button("Add post to page").first().click();
  await state();
  check(
    (await pw.locator(".react-flow__node img").count()) === 1,
    "image post places original image",
  );
  await button("Graph").click();
  await pw
    .getByRole("button", { name: "Shared edit across both pages", exact: true })
    .click();
  await pw
    .getByLabel("Link target", { exact: true })
    .selectOption({ label: "reference.png" });
  await button("Link nodes").click();
  await state();
  check(
    (await pw.locator(".react-flow__node").count()) === 2,
    "graph uses canonical nodes not placements",
  );
  check(
    (await pw.locator(".react-flow__edge").count()) === 1,
    "explicit related edge is rendered",
  );
  await pw
    .getByLabel("Open placement location", { exact: true })
    .selectOption({ label: "Opening" });
  await state();
  check(
    (await pw.locator(".canvas-toolbar").innerText()).includes("OPENING"),
    "graph opens chosen page placement",
  );
  await button("Remove placement").click();
  await state();
  check(
    (await pw.locator(".react-flow__node").count()) === 0,
    "placement removal leaves page empty",
  );
  check(
    (await pw.getByTestId("post").count()) === 2,
    "placement removal keeps feed content",
  );
  await button("Graph").click();
  await state();
  check(
    (await pw.locator(".react-flow__edge").count()) === 1,
    "placement removal retains graph relationship",
  );
  await button("Canvas").click();
  await button("Expand Saezutter").click();
  await pw.getByLabel("Write a note", { exact: true }).fill("Draft retained");
  await button("Collapse sidebar").click();
  const before = await pw
    .locator(".canvas-shell")
    .evaluate((el) => el.getBoundingClientRect().width);
  await button("Expand Saezutter").click();
  const after = await pw
    .locator(".canvas-shell")
    .evaluate((el) => el.getBoundingClientRect().width);
  check(before > after + 150, "sidebar collapse expands usable canvas");
  check(
    (await pw
      .getByLabel("Write a note", { exact: true })
      .evaluate((el) => el.value)) === "Draft retained",
    "sidebar collapse retains composer",
  );
  await pw.getByLabel("Write a note", { exact: true }).fill("");
  await upload("Load audio", root + "/tmp/fixtures/tone.wav");
  await state();
  await pw
    .getByRole("slider", { name: "Audio position", exact: true })
    .waitFor({ state: "visible" });
  check(
    (await pw.getByTestId("playback-time").innerText()).includes("/ 00:06"),
    "audio metadata loaded",
  );
  await button("Edit page Opening").click();
  await pw.getByLabel("Section start", { exact: true }).fill("0");
  await pw.getByLabel("Section end", { exact: true }).fill("3");
  await button("Save page").click();
  await button("Edit page Second page").click();
  await pw.getByLabel("Section start", { exact: true }).fill("3");
  await pw.getByLabel("Section end", { exact: true }).fill("6");
  await button("Save page").click();
  await state();
  const alignment = await pw.evaluate(() => ({
    a:
      document.querySelectorAll(".timed-section")[1].getBoundingClientRect()
        .top - document.querySelector(".waveform").getBoundingClientRect().top,
    h: document.querySelector(".waveform").getBoundingClientRect().height,
  }));
  check(
    Math.abs(alignment.a - alignment.h / 2) < 2,
    "section boundary and waveform share time transform",
  );
  await pw
    .getByRole("slider", { name: "Audio position", exact: true })
    .press("ArrowDown");
  await pw
    .getByRole("slider", { name: "Audio position", exact: true })
    .press("ArrowDown");
  await button("02 Second page 00:03—00:06").click();
  check(
    (await pw.getByTestId("playback-time").innerText())
      .trim()
      .startsWith("00:02"),
    "page selection does not seek audio",
  );
  await button("Play").click();
  await state();
  check(
    await button("Pause").isVisible(),
    "playback starts with pause control",
  );
  await button("Pause").click();
  await state();
  check(await button("Play").isVisible(), "pause holds playback");
  await button("Stop").click();
  check(
    (await pw.getByTestId("playback-time").innerText())
      .trim()
      .startsWith("00:00"),
    "stop resets playhead",
  );
  const dl = pw
    .waitForEvent("download", { timeoutMs: 10000 })
    .catch((e) => ({ error: String(e) }));
  await button("Export project").click();
  const downloaded = await dl;
  if ("error" in downloaded) throw Error(downloaded.error);
  const archive = await downloaded.path();
  check(!!archive, "project archive downloaded");
  await upload("Import project", archive);
  await pw
    .getByRole("button", {
      name: "Acceptance workspace (imported)",
      exact: true,
    })
    .waitFor({ state: "visible" });
  await state();
  check(
    (await pw.locator(".project-title").innerText()).includes("(imported)"),
    "import creates new project",
  );
  await button("Graph").click();
  await state();
  check(
    (await pw.locator(".react-flow__node").count()) === 2 &&
      (await pw.locator(".react-flow__edge").count()) === 1,
    "archive restores canonical nodes and edges",
  );
  check(
    (await pw.getByTestId("playback-time").innerText()).trim() ===
      "00:00 / 00:06",
    "archive restores audio paused",
  );
  await upload("Import project", root + "/tmp/fixtures/broken.vsketch");
  await state();
  check(
    (await pw.getByRole("alert").innerText()).includes("Import rejected"),
    "malformed archive rejected with recovery message",
  );
  check(
    (await pw.locator(".project-title").innerText()).includes("(imported)"),
    "invalid import keeps old project",
  );
  await button("Dismiss error").click();
  const logs = await tab.dev.logs({ levels: ["error"], limit: 30 });
  check(logs.length === 0, "no browser console errors during acceptance run");
  await mkdir(root + "/outputs/verification", { recursive: true });
  await writeFile(
    root + "/outputs/verification/browser-acceptance.json",
    JSON.stringify(
      {
        checks,
        logs,
        archive,
        url: await tab.url(),
        completedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  await writeFile(
    root + "/outputs/verification/graph-acceptance.png",
    await tab.screenshot({ fullPage: false }),
  );
  return { passed: checks.length, archive };
}
