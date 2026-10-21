import { it, expect } from "vitest";
import { EditHistory } from "../domain/history";
import { captureImage, pasteReference } from "../domain/clipboard";
import {
  createProject,
  postText,
  place,
  uid,
  removeContent,
  revise,
  type Asset,
} from "../domain/model";
it("undoes and redoes shared edits, then invalidates redo after a new edit", () => {
  const a = createProject(),
    h = new EditHistory();
  h.reset([]);
  const b = postText(a, "first");
  h.record(a, b, []);
  const back = h.step(b, "undo")!;
  expect(back.nodes).toHaveLength(0);
  const forward = h.step(back, "redo")!;
  expect(forward.nodes).toHaveLength(1);
  const restored = h.step(forward, "undo")!;
  h.record(restored, postText(restored, "other"), []);
  expect(h.step(restored, "redo")).toBeUndefined();
});
it("retains original media after canonical deletion for undo and bounds history to50 steps", () => {
  const p = createProject(),
    h = new EditHistory();
  const asset: Asset = {
    id: uid(),
    projectId: p.id,
    kind: "image",
    name: "image.png",
    mime: "image/png",
    width: 320,
    height: 240,
    blob: new Blob(["original"]),
  };
  const image = captureImage(p, asset, { pageId: p.pages[0].id, x: 20, y: 30 });
  h.reset([asset]);
  const deleted = removeContent(image, image.nodes[0].id);
  h.record(image, deleted, []);
  const restored = h.step(deleted, "undo")!;
  expect(h.assets(restored)[0].blob).toBe(asset.blob);
  expect(restored.placements).toHaveLength(1);
  h.reset([]);
  let current = p;
  for (let i = 0; i < 60; i++) {
    const next = postText(current, String(i));
    h.record(current, next, []);
    current = next;
  }
  for (let i = 0; i < 50; i++) current = h.step(current, "undo")!;
  expect(h.step(current, "undo")).toBeUndefined();
});
it("pastes new independent placements of the same canonical content and rejects foreign projects", () => {
  let p = postText(createProject(), "shared");
  p = place(p, p.nodes[0].id, p.pages[0].id);
  p = revise(p, (n) => n.pages.push({ id: uid(), title: "Second", order: 1 }));
  const original = p.placements[0],
    payload = {
      projectId: p.id,
      nodeId: original.nodeId,
      x: original.x,
      y: original.y,
      width: original.width,
      height: original.height,
    };
  const pasted = pasteReference(p, payload, p.pages[1].id);
  expect(pasted.nodes).toHaveLength(1);
  expect(pasted.placements[1].id).not.toBe(original.id);
  expect(pasted.placements[1].nodeId).toBe(original.nodeId);
  expect(pasted.placements[1].x).toBe(original.x + 24);
  expect(() =>
    pasteReference(createProject(), payload, p.pages[1].id),
  ).toThrow();
});
it("creates image/post/placement together with correct source project and world coordinates", () => {
  const p = createProject(),
    a: Asset = {
      id: uid(),
      projectId: p.id,
      kind: "image",
      name: "image.png",
      mime: "image/png",
      width: 320,
      height: 240,
      blob: new Blob(["x"]),
    };
  const next = captureImage(p, a, { pageId: p.pages[0].id, x: 120, y: 90 });
  expect(next.posts[0].nodeId).toBe(next.nodes[0].id);
  expect(next.placements[0]).toMatchObject({
    x: 120,
    y: 90,
    width: 320,
    height: 240,
  });
  expect(() => captureImage(createProject(), a)).toThrow();
  expect(() => captureImage(p, a, { pageId: uid(), x: 0, y: 0 })).toThrow();
});
