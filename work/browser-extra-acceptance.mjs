// Run after browser-acceptance.mjs through the Codex in-app browser runtime.
import { writeFile } from "node:fs/promises";
export async function runExtra(tab, browser, root) {
  const pw = tab.playwright,
    checks = [];
  const b = (name) => pw.getByRole("button", { name, exact: true });
  const check = (ok, name) => {
    if (!ok) throw Error("FAIL: " + name);
    checks.push({ name, passed: true });
  };
  const state = () => tab.ax.write();
  const transform = () =>
    b("Shared edit across both pages").evaluate(
      (el) => el.closest(".react-flow__node").style.transform,
    );
  const upload = async (name, path) => {
    const pending = pw
      .waitForEvent("filechooser", { timeoutMs: 10000 })
      .catch((e) => ({ error: String(e) }));
    await b(name).click();
    const c = await pending;
    if ("error" in c) throw Error(c.error);
    await c.setFiles([path]);
  };
  await b("Shared edit across both pages").click();
  const k0 = await transform();
  await b("Shared edit across both pages").press("ArrowRight");
  await state();
  const k1 = await transform();
  await tab.reload();
  await state();
  check(
    k0 !== k1 && (await transform()) === k1,
    "keyboard Graph move persists",
  );
  const g = await b("Shared edit across both pages").evaluate((el) => {
    const r = el.getBoundingClientRect();
    return [r.x + 60, r.y + 65];
  });
  await tab.ax.drag(g, [g[0] + 65, g[1] + 40]);
  await state();
  const g1 = await transform();
  await tab.reload();
  await state();
  check(g1 !== k1 && (await transform()) === g1, "actual Graph drag persists");
  await pw
    .getByRole("textbox", { name: "Search nodes", exact: true })
    .fill("reference.png");
  check(
    (await pw.locator(".react-flow__node").count()) === 1,
    "Graph search filters nodes",
  );
  await pw.getByRole("textbox", { name: "Search nodes", exact: true }).fill("");
  await b("Canvas").click();
  await b("Expand Saezutter").click();
  await b("01 Opening 00:00—00:03").click();
  const drag = await pw.evaluate(() => {
    const post = [...document.querySelectorAll(".post-card")]
        .find((el) => el.textContent.includes("Shared edit across both pages"))
        .getBoundingClientRect(),
      board = document.querySelector(".flow-area").getBoundingClientRect();
    return {
      from: [post.x + 90, post.y + 45],
      to: [board.x + 180, board.y + 180],
    };
  });
  await tab.ax.drag(drag.from, drag.to);
  await state();
  check(
    (await pw.locator(".react-flow__node").count()) === 1,
    "actual Saezutter drag creates reference",
  );
  await b("Shared edit across both pages").click();
  await b("Fit").click();
  await new Promise((resolve) => setTimeout(resolve, 350));
  const grip = await pw.locator(".corner-grip.bottom.right").evaluate((el) => {
    const r = el.getBoundingClientRect();
    return [r.x + r.width / 2, r.y + r.height / 2];
  });
  await tab.ax.drag(grip, [grip[0] + 60, grip[1] + 30]);
  await state();
  const width = await pw
    .getByLabel("Placement width", { exact: true })
    .getAttribute("value");
  await tab.reload();
  await state();
  await b("Shared edit across both pages").click();
  check(
    Number(width) > 280 &&
      (await pw
        .getByLabel("Placement width", { exact: true })
        .getAttribute("value")) === width,
    "actual L-grip text resize persists",
  );
  await b("02 Second page 00:03—00:06").click();
  await b("reference.png").click();
  await b("Fit").click();
  await new Promise((resolve) => setTimeout(resolve, 350));
  const ig = await pw.locator(".corner-grip.bottom.right").evaluate((el) => {
    const r = el.getBoundingClientRect();
    return [r.x + r.width / 2, r.y + r.height / 2];
  });
  await tab.ax.drag(ig, [ig[0] + 40, ig[1] + 30]);
  await state();
  const iw = Number(
      await pw
        .getByLabel("Placement width", { exact: true })
        .getAttribute("value"),
    ),
    ih = Number(
      await pw
        .getByLabel("Placement height", { exact: true })
        .getAttribute("value"),
    );
  check(
    iw > 320 && Math.abs(iw / ih - 4 / 3) < 0.01,
    "image resize preserves original aspect",
  );
  await b("Edit page Second page").click();
  await pw.getByLabel("Section start", { exact: true }).fill("2");
  await b("Save page").click();
  await state();
  check(
    (await pw.getByRole("alert").innerText()).toLowerCase().includes("overlap"),
    "overlapping sections rejected",
  );
  await b("Close dialog").click();
  await b("Dismiss error").click();
  await b("Play from Second page").click();
  await state();
  check(
    (await b("Pause").isVisible()) &&
      (await pw.getByTestId("playback-time").innerText())
        .trim()
        .startsWith("00:03"),
    "section play both seeks and plays",
  );
  await b("Stop").click();
  await upload("Replace audio", root + "/tmp/fixtures/tone.wav");
  await pw
    .getByRole("dialog", { name: "Replace audio?", exact: true })
    .waitFor({ state: "visible" });
  await b("Cancel").click();
  check(
    await b("02 Second page 00:03—00:06").isVisible(),
    "cancel audio replacement preserves ranges",
  );
  await upload("Replace audio", root + "/tmp/fixtures/tone.wav");
  await pw
    .getByRole("dialog", { name: "Replace audio?", exact: true })
    .waitFor({ state: "visible" });
  await b("Confirm").click();
  await b("Replace audio").waitFor({ state: "visible" });
  await state();
  check(
    (await pw.locator(".timed-section").count()) === 2 &&
      (await pw.locator(".react-flow__node").count()) === 2,
    "audio replacement redistributes pages and preserves content",
  );
  await b("Remove audio").click();
  await state();
  await b("Confirm").click();
  await state();
  check(
    (await pw.locator(".waveform").count()) === 0 &&
      (await b("Load audio").isVisible()),
    "remove audio restores ordinary note workspace",
  );
  await b("Edit page Second page").click();
  await b("Move page earlier").click();
  check(
    (await pw.locator(".canvas-toolbar").innerText()).includes(
      "01 / SECOND PAGE",
    ),
    "page reorder updates displayed index",
  );
  await b("Edit page Second page").click();
  await b("Delete page").click();
  await b("Confirm").click();
  await b("Graph").click();
  await state();
  check(
    (await pw.locator(".react-flow__node").count()) === 2 &&
      (await pw.locator(".react-flow__edge").count()) === 1,
    "page deletion retains Nodes and Edge",
  );
  await b("Shared edit across both pages").click();
  await b("Unlink image").click();
  check(
    (await pw.locator(".react-flow__edge").count()) === 0,
    "unlink preserves contents",
  );
  await pw
    .getByLabel("Link target", { exact: true })
    .selectOption({ label: "reference.png" });
  await b("Link nodes").click();
  await b("Delete selected content everywhere").click();
  await b("Cancel").click();
  check(
    (await pw.locator(".react-flow__node").count()) === 2,
    "cancel canonical deletion preserves contents",
  );
  await b("Delete selected content everywhere").click();
  await b("Confirm").click();
  await state();
  check(
    (await pw.locator(".react-flow__node").count()) === 1 &&
      (await pw.locator(".react-flow__edge").count()) === 0,
    "canonical deletion removes node references and relationships",
  );
  await b("Open Saezutter").click();
  check(
    (await pw.getByTestId("post").count()) === 1,
    "canonical deletion removes corresponding feed entry",
  );
  await b("Remove from feed").click();
  await b("Confirm").click();
  check(
    (await pw.getByTestId("post").count()) === 0 &&
      (await pw.locator(".react-flow__node").count()) === 1,
    "feed-only deletion retains canonical Node",
  );
  const second = await browser.tabs.new();
  await second.goto(await tab.url());
  await second.ax.write();
  check(
    await second.playwright
      .getByRole("button", { name: "Import project", exact: true })
      .evaluate((el) => el.disabled),
    "second editor tab is read-only",
  );
  await second.close();
  const errors = await tab.dev.logs({ levels: ["error"], limit: 30 });
  check(
    errors.length === 0,
    "no browser console errors during extended acceptance",
  );
  await writeFile(
    root + "/outputs/verification/browser-extra.json",
    JSON.stringify(
      { checks, url: await tab.url(), completedAt: new Date().toISOString() },
      null,
      2,
    ),
  );
  return { passed: checks.length };
}
