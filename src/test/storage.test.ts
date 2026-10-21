import "fake-indexeddb/auto";
import { it, expect, afterEach, vi } from "vitest";
import { db, saveProject, projectAssets } from "../storage/db";
import { createProject, postText, uid, revise } from "../domain/model";
afterEach(async () => {
  vi.restoreAllMocks();
  await db.projects.clear();
  await db.assets.clear();
});
it("saves project and original media atomically and reloads shared IDs", async () => {
  let p = postText(createProject(), "persistent");
  const a = {
    id: uid(),
    projectId: p.id,
    kind: "image" as const,
    name: "fixture.png",
    mime: "image/png",
    blob: new Blob(["test"]),
  };
  p = revise(p, (n) => {
    n.nodes.push({
      id: uid(),
      kind: "image",
      assetId: a.id,
      altText: "fixture",
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    });
  });
  await saveProject(p, [a]);
  expect((await db.projects.get(p.id))?.nodes).toEqual(p.nodes);
  expect((await projectAssets(p))[0].blob.size).toBe(4);
});

it("rolls back media when the document write fails", async () => {
  const p = createProject();
  await saveProject(p);
  const a = {
    id: uid(),
    projectId: p.id,
    kind: "audio" as const,
    name: "tone.wav",
    mime: "audio/wav",
    duration: 6,
    blob: new Blob(["audio"]),
  };
  const changed = revise(p, (n) => {
    n.activeAudioId = a.id;
  });
  vi.spyOn(db.projects, "put").mockRejectedValueOnce(
    new DOMException("Quota exhausted", "QuotaExceededError"),
  );
  await expect(saveProject(changed, [a])).rejects.toThrow("Quota exhausted");
  expect((await db.projects.get(p.id))?.activeAudioId).toBeUndefined();
  expect(await db.assets.get(a.id)).toBeUndefined();
});
it("reclaims removed audio but preserves media referenced by canonical content", async () => {
  const p = createProject();
  const a = {
    id: uid(),
    projectId: p.id,
    kind: "audio" as const,
    name: "tone.wav",
    mime: "audio/wav",
    duration: 6,
    blob: new Blob(["audio"]),
  };
  const withAudio = revise(p, (n) => {
    n.activeAudioId = a.id;
  });
  await saveProject(withAudio, [a]);
  expect(await db.assets.get(a.id)).toBeDefined();
  await saveProject(p);
  expect(await db.assets.get(a.id)).toBeUndefined();
});

it("restores history media after a failed undo save and retries without losing originals", async () => {
  const { EditHistory } = await import("../domain/history");
  const { captureImage } = await import("../domain/clipboard");
  const p = createProject();
  const asset = {
    id: uid(),
    projectId: p.id,
    kind: "image" as const,
    name: "original.png",
    mime: "image/png",
    width: 10,
    height: 10,
    blob: new Blob(["original"]),
  };
  const image = captureImage(p, asset);
  const history = new EditHistory();
  history.reset([asset]);
  history.record(image, p, []);
  await saveProject(image, [asset]);
  await saveProject(p);
  const restored = history.step(p, "undo")!;
  vi.spyOn(db.projects, "put").mockRejectedValueOnce(new Error("disk full"));
  await expect(saveProject(restored, history.assets(restored))).rejects.toThrow(
    "disk full",
  );
  expect(await projectAssets(restored)).toHaveLength(0);
  expect(await history.assets(restored)[0].blob.text()).toBe("original");
  await saveProject(restored, history.assets(restored));
  expect(await (await projectAssets(restored))[0].blob.text()).toBe("original");
});
