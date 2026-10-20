import { describe, it, expect } from "vitest";
import { zipSync, strToU8 } from "fflate";
import {
  createProject,
  postText,
  place,
  link,
  revise,
  uid,
  type Asset,
} from "../domain/model";
import { exportArchive, importArchive, readEntries } from "../storage/archive";
const zip = (files: Record<string, Uint8Array>) =>
  new Blob([Uint8Array.from(zipSync(files)).buffer]);
describe("portable archives", () => {
  it("roundtrips content/relationships and media with fresh IDs", async () => {
    let p = postText(postText(createProject(), "a"), "b");
    p = place(p, p.nodes[0].id, p.pages[0].id);
    p = link(p, p.nodes[0].id, p.nodes[1].id);
    const a: Asset = {
      id: uid(),
      projectId: p.id,
      kind: "image",
      name: "image.png",
      mime: "image/png",
      blob: new Blob([new Uint8Array([1, 2, 3])]),
    };
    p = revise(p, (n) => {
      n.nodes.push({
        id: uid(),
        kind: "image",
        assetId: a.id,
        altText: "test",
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      });
    });
    const result = await importArchive(await exportArchive(p, [a]));
    expect(result.project.id).not.toBe(p.id);
    expect(result.project.nodes[0].id).not.toBe(p.nodes[0].id);
    expect(result.project.placements[0].nodeId).toBe(
      result.project.nodes[0].id,
    );
    expect(result.project.edges).toHaveLength(1);
    expect(new Uint8Array(await result.assets[0].blob.arrayBuffer())).toEqual(
      new Uint8Array([1, 2, 3]),
    );
  });
  it("rejects traversal, missing manifest and malformed data", async () => {
    expect(() => readEntries(zipSync({ "../bad": strToU8("x") }))).toThrow();
    expect(() => readEntries(new Uint8Array([1, 2, 3]))).toThrow();
    await expect(
      importArchive(
        zip({ "manifest.json": strToU8("{}"), "project.json": strToU8("{}") }),
      ),
    ).rejects.toThrow();
  });
  it("rejects missing referenced assets and unsupported versions", async () => {
    const p = createProject();
    const manifest = {
      format: "visualyrc-sketch",
      formatVersion: 2,
      assets: [],
    };
    await expect(
      importArchive(
        zip({
          "manifest.json": strToU8(JSON.stringify(manifest)),
          "project.json": strToU8(JSON.stringify(p)),
        }),
      ),
    ).rejects.toThrow();
  });
  it("bounds actual inflated JSON size, not only compressed size", () => {
    const bytes = zipSync(
      {
        "manifest.json": strToU8("x".repeat(9 * 1024 * 1024)),
        "project.json": strToU8("{}"),
      },
      { level: 9 },
    );
    expect(bytes.length).toBeLessThan(20000);
    expect(() => readEntries(bytes)).toThrow(/limits/);
  });
});

it("refuses export if original referenced media is missing", async () => {
  const p = revise(createProject(), (n) => {
    n.activeAudioId = uid();
  });
  await expect(exportArchive(p, [])).rejects.toThrow(/missing/);
});
it("rejects same-length stored JSON corruption using CRC", () => {
  const bytes = zipSync(
    {
      "manifest.json": strToU8('{"format":"visualyrc-sketch"}'),
      "project.json": strToU8('{"name":"original"}'),
    },
    { level: 0 },
  );
  const start = new TextDecoder().decode(bytes).indexOf("original");
  bytes[start] = 0x58;
  expect(() => readEntries(bytes)).toThrow(/integrity/);
});
it("rejects a truncated directory", () => {
  const bytes = zipSync({
    "manifest.json": strToU8("{}"),
    "project.json": strToU8("{}"),
  });
  expect(() => readEntries(bytes.subarray(0, bytes.length - 6))).toThrow(
    /directory/,
  );
});

it("refuses to create an archive that exceeds reader JSON limits", async () => {
  const p = createProject();
  for (let i = 0; i < 900; i++)
    p.nodes.push({
      id: uid(),
      kind: "text",
      text: "x".repeat(10000),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    });
  await expect(exportArchive(p, [])).rejects.toThrow(/8 MiB/);
});
it("refuses excess export entries before reading media", async () => {
  const p = createProject();
  const a: Asset = {
    id: uid(),
    projectId: p.id,
    kind: "image",
    name: "x.png",
    mime: "image/png",
    blob: new Blob([]),
  };
  await expect(
    exportArchive(
      p,
      Array.from({ length: 999 }, () => ({ ...a, id: uid() })),
    ),
  ).rejects.toThrow(/998/);
});

it("roundtrips the longest valid project name", async () => {
  const p = createProject("x".repeat(200));
  const imported = await importArchive(await exportArchive(p, []));
  expect(imported.project.name.length).toBeLessThanOrEqual(200);
  expect(imported.project.name.endsWith(" (imported)")).toBe(true);
});
