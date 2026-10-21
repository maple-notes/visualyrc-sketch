import { z } from "zod";
import { place, revise, uid, type Project, type Asset } from "./model";
export const referenceClipboardSchema = z
  .object({
    projectId: z.string().uuid(),
    nodeId: z.string().uuid(),
    x: z.number().finite(),
    y: z.number().finite(),
    width: z.number().min(80).max(20000),
    height: z.number().min(48).max(20000),
  })
  .strict();
export const referenceMime = "application/x-visualyrc-placement";
export function pasteReference(
  p: Project,
  value: unknown,
  pageId: string,
  offset = 24,
): Project {
  const data = referenceClipboardSchema.parse(value);
  if (data.projectId !== p.id)
    throw Error(
      "Paste references within the same project. Use a project archive to transfer media.",
    );
  return place(
    p,
    data.nodeId,
    pageId,
    data.x + offset,
    data.y + offset,
    data.width,
    data.height,
  );
}
export function captureImage(
  p: Project,
  asset: Asset,
  target?: { pageId: string; x: number; y: number },
): Project {
  if (asset.projectId !== p.id || asset.kind !== "image")
    throw Error("Image belongs to another project");
  const id = uid(),
    now = new Date().toISOString();
  let next = revise(p, (n) => {
    n.nodes.push({
      id,
      kind: "image",
      assetId: asset.id,
      altText: asset.name,
      createdAt: now,
      updatedAt: now,
    });
    n.posts.unshift({ id: uid(), nodeId: id, postedAt: now });
  });
  if (target) {
    const ratio = (asset.width ?? 280) / (asset.height ?? 170),
      width = Math.max(120, Math.min(420, asset.width ?? 280), 64 * ratio);
    next = place(
      next,
      id,
      target.pageId,
      target.x,
      target.y,
      width,
      width / ratio,
    );
  }
  return next;
}
