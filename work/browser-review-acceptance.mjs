// Actual visible UI/pointer/keyboard verification. Creates a disposable project.
import { writeFile } from "node:fs/promises";
export async function runReview(tab, root) {
  const pw = tab.playwright,
    checks = [];
  const b = (name) => pw.getByRole("button", { name, exact: true });
  const check = (ok, name) => {
    if (!ok) throw Error("FAIL: " + name);
    checks.push({ name, passed: true });
  };
  const state = () => tab.ax.write();
  const upload = async (name, path) => {
    const event = pw
      .waitForEvent("filechooser", { timeoutMs: 10000 })
      .catch((e) => ({ error: String(e) }));
    await b(name).click();
    const chooser = await event;
    if ("error" in chooser) throw Error(chooser.error);
    await chooser.setFiles([path]);
  };
  const key = (keys) => b("Canvas").press(keys);
  await pw.locator(".project-title").click();
  await b("New project").click();
  await pw
    .getByLabel("Project name", { exact: true })
    .fill("Final review acceptance");
  await b("Create project").click();
  await state();
  check(
    (await pw
      .locator('.page-rail-header [aria-label="Toggle page rail"]')
      .count()) === 1,
    "rail toggle is in left rail header",
  );
  check(
    (await pw
      .locator('.canvas-toolbar [aria-label="Collapse Saezutter"]')
      .count()) === 0,
    "redundant Canvas sidebar toggle removed",
  );
  await b("Toggle page rail").click();
  check(
    (await pw.locator(".page-rail-collapsed").count()) === 1,
    "collapsed page rail has reopen control",
  );
  await b("Toggle page rail").click();
  await pw.getByLabel("Write a note", { exact: true }).fill("Clipboard note");
  await b("Post").click();
  await b("Add post to page").click();
  await b("Clipboard note").click();
  await b("Clipboard note").press("Meta+c");
  await b("Clipboard note").press("Meta+v");
  await state();
  check(
    (await pw.locator(".react-flow__node").count()) === 2,
    "Cmd C/V creates another reference",
  );
  await b("Clipboard note").first().press("Meta+x");
  check(
    (await pw.locator(".react-flow__node").count()) === 1,
    "Cmd X removes only one placement",
  );
  check(
    (await pw.getByTestId("post").count()) === 1,
    "cut keeps canonical post",
  );
  await key("Meta+z");
  check(
    (await pw.locator(".react-flow__node").count()) === 2,
    "Cmd Z restores cut",
  );
  await key("Meta+Shift+z");
  check(
    (await pw.locator(".react-flow__node").count()) === 1,
    "Shift Cmd Z reapplies cut",
  );
  await key("Meta+z");
  await b("Add page").first().click();
  await pw.getByLabel("Page title", { exact: true }).fill("Second page");
  await b("Save page").click();
  const pageRows = await pw.locator(".page-row").evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return [r.x + 40, r.y + r.height / 2, r.y + 4];
    }),
  );
  await tab.ax.drag(
    [pageRows[1][0], pageRows[1][1]],
    [pageRows[0][0], pageRows[0][2]],
  );
  check(
    await b("01 Second page").isVisible(),
    "actual no-audio page drag reorders pages",
  );
  await key("Meta+z");
  await b("02 Second page").click();
  await key("Meta+v");
  check(
    (await pw.locator(".react-flow__node").count()) === 1,
    "paste references across project pages",
  );
  await b("Graph").click();
  check(
    (await pw.locator(".react-flow__node").count()) === 1,
    "pasted references do not duplicate Graph content",
  );
  await b("Canvas").click();
  await b("Expand Saezutter").click();
  await pw.getByLabel("Write a note", { exact: true }).fill("native draft");
  await pw.getByLabel("Write a note", { exact: true }).press("Meta+a");
  await pw.getByLabel("Write a note", { exact: true }).press("x");
  await pw.getByLabel("Write a note", { exact: true }).press("Meta+z");
  check(
    (await pw
      .getByLabel("Write a note", { exact: true })
      .evaluate((el) => el.value)) === "native draft",
    "text editor uses native undo",
  );
  await pw.getByLabel("Write a note", { exact: true }).fill("");
  await upload("Add image", root + "/tmp/fixtures/reference.png");
  await pw.locator(".react-flow__node img").waitFor({ state: "visible" });
  check(
    (await pw.locator(".react-flow__node").count()) === 2,
    "Canvas image ingestion creates node post and placement",
  );
  await b("reference.png").press("Enter");
  await b("Delete selected content everywhere").click();
  await b("Confirm").click();
  await state();
  check(
    (await pw.locator(".react-flow__node img").count()) === 0,
    "canonical image deletion removes placement",
  );
  await key("Meta+z");
  await pw.locator(".react-flow__node img").waitFor({ state: "visible" });
  check(true, "undo canonical deletion restores original image");
  await key("Meta+Shift+z");
  check(
    (await pw.locator(".react-flow__node img").count()) === 0,
    "redo canonical image deletion",
  );
  await key("Meta+z");
  await pw.locator(".react-flow__node img").waitFor({ state: "visible" });
  await upload("Load audio", root + "/tmp/fixtures/tone.wav");
  await b("Replace audio").waitFor({ state: "visible" });
  check(
    (await pw.locator(".timed-section").count()) === 2,
    "audio assigns existing pages automatically",
  );
  check(
    Number(
      await pw
        .getByRole("slider", { name: "Opening section end", exact: true })
        .getAttribute("aria-valuenow"),
    ) === 3,
    "equal split covers first half",
  );
  const trim = await pw
    .getByRole("slider", { name: "Opening section end", exact: true })
    .evaluate((el) => {
      const r = el.getBoundingClientRect();
      return [r.x + r.width / 2, r.y + r.height / 2];
    });
  await tab.ax.drag(trim, [trim[0], trim[1] - 50]);
  await state();
  const end = Number(
    await pw
      .getByRole("slider", { name: "Opening section end", exact: true })
      .getAttribute("aria-valuenow"),
  );
  check(end < 3 && end > 2, "actual section end drag updates range");
  await pw
    .getByRole("slider", { name: "Second page section start", exact: true })
    .press("ArrowDown");
  check(
    Number(
      await pw
        .getByRole("slider", { name: "Second page section start", exact: true })
        .getAttribute("aria-valuenow"),
    ) > 3,
    "section start keyboard trim works",
  );
  await tab.reload();
  await b("Replace audio").waitFor({ state: "visible" });
  check(
    Number(
      await pw
        .getByRole("slider", { name: "Opening section end", exact: true })
        .getAttribute("aria-valuenow"),
    ) === end,
    "trim persists after reload",
  );
  await upload("Replace audio", root + "/tmp/fixtures/tone.wav");
  await pw
    .getByRole("dialog", { name: "Replace audio?", exact: true })
    .waitFor({ state: "visible" });
  await b("Confirm").click();
  await b("Replace audio").waitFor({ state: "visible" });
  check(
    Number(
      await pw
        .getByRole("slider", { name: "Opening section end", exact: true })
        .getAttribute("aria-valuenow"),
    ) === 3,
    "replacement evenly redistributes sections",
  );
  await key("Meta+z");
  await b("Replace audio").waitFor({ state: "visible" });
  check(
    Number(
      await pw
        .getByRole("slider", { name: "Opening section end", exact: true })
        .getAttribute("aria-valuenow"),
    ) === end,
    "undo audio replacement restores prior source and ranges",
  );
  await b("Play").click();
  await b("Pause").waitFor({ state: "visible" });
  await b("Stop").click();
  check(
    (await pw.getByTestId("playback-time").innerText()).includes("/ 00:06"),
    "restored audio is playable",
  );
  await pw
    .getByLabel("Write a note", { exact: true })
    .fill("# Review heading\n\n**Strong** and `code`\n\n- first\n- second");
  await b("Post").click();
  await pw.locator(".post-card h1").waitFor({ state: "visible" });
  check(
    (await pw.locator(".post-card strong").innerText()) === "Strong",
    "Markdown heading emphasis and list render",
  );
  await pw
    .getByLabel("Write a note", { exact: true })
    .fill("```mermaid\nflowchart LR\nIdea --> Plan\n```");
  await b("Post").click();
  const iframe = pw.locator('.post-card iframe[title="Mermaid diagram"]');
  await iframe.waitFor({ state: "visible" });
  check(
    (await iframe.getAttribute("srcdoc")).includes("<svg"),
    "Mermaid creates an SVG diagram",
  );
  check(
    (await iframe.getAttribute("sandbox")) === "" &&
      (await iframe.getAttribute("srcdoc")).includes("default-src 'none'"),
    "diagram output is sandboxed with no external resource access",
  );
  await writeFile(
    root + "/outputs/verification/review-workspace.png",
    await tab.screenshot({ fullPage: false }),
  );
  await pw
    .getByLabel("Write a note", { exact: true })
    .fill(
      '```mermaid\n%%{init: {securityLevel: "loose"}}%%\nflowchart LR\nA-->B\n```',
    );
  await b("Post").click();
  await pw.getByRole("alert").waitFor({ state: "visible" });
  check(
    (await pw.getByRole("alert").innerText()).includes("disabled"),
    "unsafe Mermaid directives rejected visibly",
  );
  await b("Add page").click();
  await pw.getByLabel("Page title", { exact: true }).fill("Silent outro");
  check(
    Number(
      await pw
        .getByLabel("Section start", { exact: true })
        .evaluate((el) => el.value),
    ) === 6,
    "new page defaults after audio and existing sections",
  );
  await b("Save page").click();
  const silentStart = () =>
    pw.getByRole("slider", { name: "Silent outro section start", exact: true });
  const silentEnd = () =>
    pw.getByRole("slider", { name: "Silent outro section end", exact: true });
  await silentStart().waitFor({ state: "visible" });
  check(
    Number(await silentEnd().getAttribute("aria-valuenow")) > 6,
    "new silent page immediately has resize grips",
  );
  check(
    await b("Play from Silent outro").evaluate((el) => el.disabled),
    "post-audio section cannot accidentally restart audio",
  );
  const originalEnd = Number(await silentEnd().getAttribute("aria-valuenow"));
  await silentEnd().press("ArrowDown");
  check(
    Number(await silentEnd().getAttribute("aria-valuenow")) > originalEnd,
    "silent section extends past audio end",
  );
  await key("Meta+z");
  await state();
  // Native keyboard scrolling positions both sections before a real drag.
  const rail = pw.getByRole("region", { name: "Page timeline", exact: true });
  await rail.press("Home");
  await new Promise((resolve) => setTimeout(resolve, 250));
  let geometry;
  for (let i = 0; i < 30; i++) {
    geometry = await pw
      .locator(".timed-section,.timeline-scroll")
      .evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return {
            cls: el.className,
            text: el.className === "timeline-scroll" ? "" : el.textContent,
            x: r.x,
            y: r.y,
            h: r.height,
          };
        }),
      );
    const viewport = geometry.find((r) => r.cls === "timeline-scroll");
    const source = geometry.find((r) => r.text.includes("Silent outro"));
    const target = geometry.find((r) => r.text.includes("Second page"));
    const sy = Math.max(viewport.y + 20, source.y + 35),
      ty = Math.max(viewport.y + 20, target.y + target.h * 0.25);
    if (sy < viewport.y + viewport.h - 30 && ty < target.y + target.h * 0.5) {
      await tab.ax.drag([source.x + 35, sy], [target.x + 35, ty]);
      break;
    }
    await rail.press("ArrowDown");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  await state();
  check(
    Number(await silentStart().getAttribute("aria-valuenow")) < 6,
    "actual timed page drag moves entire section",
  );
  const endAfterMove = Number(await silentEnd().getAttribute("aria-valuenow"));
  await key("Meta+z");
  check(
    Number(await silentStart().getAttribute("aria-valuenow")) === 6 &&
      Number(await silentEnd().getAttribute("aria-valuenow")) === originalEnd,
    "undo restores page order and section positions",
  );
  check(
    endAfterMove -
      Number(
        await pw
          .getByRole("slider", { name: "Opening section end", exact: true })
          .getAttribute("aria-valuenow"),
      ) >
      0,
    "reordering retains positive section lengths",
  );
  await tab.reload();
  await silentEnd().waitFor({ state: "visible" });
  check(
    Number(await silentEnd().getAttribute("aria-valuenow")) === originalEnd,
    "post-audio section survives reload",
  );
  await writeFile(
    root + "/outputs/verification/silent-sections.png",
    await tab.screenshot({ fullPage: false }),
  );
  const errors = await tab.dev.logs({ levels: ["error"], limit: 30 });
  check(
    errors.length === 0,
    "no browser console errors in final review acceptance",
  );
  const report = {
    checks,
    errors,
    url: await tab.url(),
    completedAt: new Date().toISOString(),
    externalNativeFileDrag:
      "not automated; Canvas chooser exercises the same image ingestion path",
  };
  await writeFile(
    root + "/outputs/verification/browser-review.json",
    JSON.stringify(report, null, 2),
  );
  return { passed: checks.length };
}
