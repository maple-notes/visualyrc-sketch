import { Unzip, UnzipInflate, zipSync, strToU8, strFromU8 } from "fflate";
import { z } from "zod";
import {
  uid,
  validateProject,
  type Asset,
  type Project,
} from "../domain/model";
const MB = 1024 * 1024;
const descriptor = z
  .object({
    id: z.string().uuid(),
    kind: z.enum(["image", "audio"]),
    name: z.string().max(200),
    mime: z.string().max(100),
    size: z.number().int().nonnegative(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    duration: z.number().positive().optional(),
  })
  .strict();
const manifestSchema = z
  .object({
    format: z.literal("visualyrc-sketch"),
    formatVersion: z.literal(1),
    assets: z.array(descriptor).max(1000),
  })
  .strict();
export async function exportArchive(
  project: Project,
  assets: Asset[],
): Promise<Blob> {
  validateProject(project);
  if (assets.length > 998)
    throw Error("Project exceeds the 998 asset portable limit.");
  const byId = new Map(assets.map((a) => [a.id, a]));
  if (byId.size !== assets.length) throw Error("Duplicate export assets");
  for (const node of project.nodes)
    if (node.kind === "image" && byId.get(node.assetId)?.kind !== "image")
      throw Error("Cannot export: referenced image is missing.");
  if (
    project.activeAudioId &&
    byId.get(project.activeAudioId)?.kind !== "audio"
  )
    throw Error("Cannot export: referenced audio is missing.");
  const files: Record<string, Uint8Array> = {
    "project.json": strToU8(JSON.stringify(project)),
  };
  const manifest = {
    format: "visualyrc-sketch",
    formatVersion: 1,
    assets: assets.map((a) => ({
      id: a.id,
      kind: a.kind,
      name: a.name,
      mime: a.mime,
      size: a.blob.size,
      ...(a.width ? { width: a.width, height: a.height } : {}),
      ...(a.duration ? { duration: a.duration } : {}),
    })),
  };
  files["manifest.json"] = strToU8(JSON.stringify(manifest));
  manifestSchema.parse(manifest);
  if (
    files["project.json"].length > 8 * MB ||
    files["manifest.json"].length > 8 * MB
  )
    throw Error("Project JSON exceeds the 8 MiB portable limit.");
  let size = files["project.json"].length + files["manifest.json"].length;
  for (const a of assets) {
    if (a.blob.size > (a.kind === "image" ? 10 : 50) * MB)
      throw Error("Asset exceeds its portable size limit.");
    size += a.blob.size;
    if (size > 140 * MB)
      throw Error("Project is too large to export (140 MiB limit).");
    files["assets/" + a.id] = new Uint8Array(await a.blob.arrayBuffer());
  }
  const bytes = zipSync(files, { level: 0 });
  return new Blob([Uint8Array.from(bytes).buffer], { type: "application/zip" });
}
const crcTable = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(data: Uint8Array) {
  let c = 0xffffffff;
  for (const byte of data) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
export function readEntries(bytes: Uint8Array): Record<string, Uint8Array> {
  if (bytes.length > 150 * MB) throw Error("Archive exceeds 150 MiB");
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b)
    throw Error("Not a project ZIP archive");
  // Reject incomplete, encrypted, split and ZIP64 containers before inflation.
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--)
    if (
      view.getUint32(i, true) === 0x06054b50 &&
      i + 22 + view.getUint16(i + 20, true) === bytes.length
    ) {
      end = i;
      break;
    }
  if (end < 0) throw Error("Incomplete ZIP directory");
  const entries = view.getUint16(end + 10, true),
    central = view.getUint32(end + 16, true),
    centralSize = view.getUint32(end + 12, true);
  if (
    entries > 1000 ||
    view.getUint16(end + 4, true) !== 0 ||
    view.getUint16(end + 6, true) !== 0 ||
    view.getUint16(end + 8, true) !== entries ||
    central + centralSize !== end
  )
    throw Error("Unsupported ZIP directory");
  let at = central;
  const listed = new Map<string, { size: number; crc: number }>();
  for (let i = 0; i < entries; i++) {
    if (at + 46 > end || view.getUint32(at, true) !== 0x02014b50)
      throw Error("Invalid ZIP directory");
    const flags = view.getUint16(at + 8, true),
      method = view.getUint16(at + 10, true),
      compressed = view.getUint32(at + 20, true),
      expanded = view.getUint32(at + 24, true),
      nameSize = view.getUint16(at + 28, true),
      extra = view.getUint16(at + 30, true),
      comment = view.getUint16(at + 32, true),
      offset = view.getUint32(at + 42, true);
    if (
      flags & 1 ||
      ![0, 8].includes(method) ||
      compressed === 0xffffffff ||
      expanded > 50 * MB ||
      offset >= central ||
      at + 46 + nameSize + extra + comment > end
    )
      throw Error("Unsupported ZIP entry");
    const name = strFromU8(bytes.subarray(at + 46, at + 46 + nameSize));
    if (
      listed.has(name) ||
      !/^(manifest\.json|project\.json|assets\/[0-9a-f-]{36})$/.test(name)
    )
      throw Error("Invalid archive entry");
    if (offset + 30 > central || view.getUint32(offset, true) !== 0x04034b50)
      throw Error("Invalid local ZIP header");
    const localNameSize = view.getUint16(offset + 26, true),
      localExtra = view.getUint16(offset + 28, true);
    const localName = strFromU8(
      bytes.subarray(offset + 30, offset + 30 + localNameSize),
    );
    if (
      localName !== name ||
      view.getUint16(offset + 8, true) !== method ||
      view.getUint16(offset + 6, true) & 1 ||
      offset + 30 + localNameSize + localExtra + compressed > central
    )
      throw Error("ZIP directory mismatch");
    listed.set(name, { size: expanded, crc: view.getUint32(at + 16, true) });
    at += 46 + nameSize + extra + comment;
  }
  if (at !== end) throw Error("Invalid ZIP directory size");
  const files: Record<string, Uint8Array> = {};
  let count = 0,
    total = 0,
    failed: Error | undefined;
  const unzip = new Unzip((file) => {
    if (failed) return;
    count++;
    if (
      count > 1000 ||
      !/^(manifest\.json|project\.json|assets\/[0-9a-f-]{36})$/.test(
        file.name,
      ) ||
      Object.hasOwn(files, file.name)
    ) {
      failed = Error("Invalid archive entry");
      return;
    }
    const cap = file.name.endsWith(".json") ? 8 * MB : 50 * MB;
    let size = 0;
    const chunks: Uint8Array[] = [];
    files[file.name] = new Uint8Array();
    file.ondata = (error, chunk, final) => {
      if (failed) return;
      if (error) {
        failed = error;
        return;
      }
      size += chunk.length;
      total += chunk.length;
      if (size > cap || total > 200 * MB) {
        failed = Error("Expanded archive exceeds safe limits");
        file.terminate();
        return;
      }
      chunks.push(chunk);
      if (final) {
        const value = new Uint8Array(size);
        let offset = 0;
        for (const c of chunks) {
          value.set(c, offset);
          offset += c.length;
        }
        files[file.name] = value;
      }
    };
    try {
      file.start();
    } catch (e) {
      failed = e instanceof Error ? e : Error("Invalid compression");
    }
  });
  unzip.register(UnzipInflate);
  try {
    for (let at = 0; at < bytes.length && !failed; at += 4096)
      unzip.push(bytes.subarray(at, at + 4096), at + 4096 >= bytes.length);
  } catch (e) {
    throw new Error("Invalid or truncated archive: " + String(e), { cause: e });
  }
  if (failed) throw failed;
  if (!files["manifest.json"] || !files["project.json"])
    throw Error("Missing project manifest");
  if (Object.keys(files).length !== listed.size)
    throw Error("ZIP entry count mismatch");
  for (const [name, meta] of listed) {
    const data = files[name];
    if (!data || data.length !== meta.size || crc32(data) !== meta.crc)
      throw Error("ZIP integrity check failed");
  }
  return files;
}
export async function importArchive(
  blob: Blob,
): Promise<{ project: Project; assets: Asset[] }> {
  if (blob.size > 150 * MB) throw Error("Archive exceeds 150 MiB");
  const files = readEntries(new Uint8Array(await blob.arrayBuffer()));
  const manifest = manifestSchema.parse(
    JSON.parse(strFromU8(files["manifest.json"])),
  );
  const p = validateProject(JSON.parse(strFromU8(files["project.json"])));
  const descriptors = new Map(manifest.assets.map((a) => [a.id, a]));
  if (descriptors.size !== manifest.assets.length)
    throw Error("Duplicate assets");
  if (Object.keys(files).length !== manifest.assets.length + 2)
    throw Error("Unlisted archive content");
  const assets: Asset[] = manifest.assets.map((a) => {
    const b = files["assets/" + a.id];
    if (!b || b.length !== a.size) throw Error("Missing or damaged media");
    if (
      a.kind === "image" &&
      (!["image/png", "image/jpeg", "image/webp"].includes(a.mime) ||
        a.size > 10 * MB)
    )
      throw Error("Invalid image asset");
    if (a.kind === "audio" && (!a.duration || a.size > 50 * MB))
      throw Error("Invalid audio asset");
    return {
      ...a,
      projectId: p.id,
      blob: new Blob([Uint8Array.from(b).buffer], { type: a.mime }),
    };
  });
  for (const n of p.nodes)
    if (n.kind === "image" && descriptors.get(n.assetId)?.kind !== "image")
      throw Error("Missing image reference");
  if (p.activeAudioId && descriptors.get(p.activeAudioId)?.kind !== "audio")
    throw Error("Missing audio reference");
  // Imported IDs are always new, so restoring cannot overwrite existing work.
  const mapping = new Map<string, string>();
  const remap = (id: string) => {
    let next = mapping.get(id);
    if (!next) {
      next = uid();
      mapping.set(id, next);
    }
    return next;
  };
  const next: Project = {
    ...p,
    id: uid(),
    name: p.name.slice(0, 189) + " (imported)",
    pages: p.pages.map((x) => ({
      ...x,
      id: remap(x.id),
      ...(x.audioRange
        ? {
            audioRange: {
              ...x.audioRange,
              assetId: remap(x.audioRange.assetId),
            },
          }
        : {}),
    })),
    nodes: p.nodes.map((x) =>
      x.kind === "text"
        ? { ...x, id: remap(x.id) }
        : { ...x, id: remap(x.id), assetId: remap(x.assetId) },
    ),
    posts: p.posts.map((x) => ({
      ...x,
      id: remap(x.id),
      nodeId: remap(x.nodeId),
    })),
    placements: p.placements.map((x) => ({
      ...x,
      id: remap(x.id),
      nodeId: remap(x.nodeId),
      pageId: remap(x.pageId),
    })),
    edges: p.edges.map((x) => ({
      ...x,
      id: remap(x.id),
      source: remap(x.source),
      target: remap(x.target),
    })),
    graph: p.graph.map((x) => ({ ...x, nodeId: remap(x.nodeId) })),
    viewports: p.viewports.map((x) => ({ ...x, pageId: remap(x.pageId) })),
    ...(p.activeAudioId ? { activeAudioId: remap(p.activeAudioId) } : {}),
  };
  return {
    project: validateProject(next),
    assets: assets.map((a) => ({ ...a, id: remap(a.id), projectId: next.id })),
  };
}
