import { z } from "zod";
const id = z.string().uuid();
const point = { x: z.number().finite(), y: z.number().finite() };
const time = z.string().datetime();
const text = z
  .object({
    id,
    kind: z.literal("text"),
    text: z.string().min(1).max(100000),
    createdAt: time,
    updatedAt: time,
  })
  .strict();
const image = z
  .object({
    id,
    kind: z.literal("image"),
    assetId: id,
    altText: z.string().max(1000),
    createdAt: time,
    updatedAt: time,
  })
  .strict();
export const contentSchema = z.discriminatedUnion("kind", [text, image]);
export const pageSchema = z
  .object({
    id,
    title: z.string().min(1).max(200),
    order: z.number().int().nonnegative(),
    audioRange: z
      .object({
        assetId: id,
        start: z.number().finite().nonnegative(),
        end: z
          .number()
          .finite()
          .positive()
          .max(7 * 86400),
      })
      .strict()
      .optional(),
  })
  .strict();
export const projectSchema = z
  .object({
    formatVersion: z.literal(1),
    id,
    name: z.string().min(1).max(200),
    createdAt: time,
    updatedAt: time,
    pages: z.array(pageSchema).min(1).max(1000),
    nodes: z.array(contentSchema).max(10000),
    posts: z
      .array(z.object({ id, nodeId: id, postedAt: time }).strict())
      .max(10000),
    placements: z
      .array(
        z
          .object({
            id,
            pageId: id,
            nodeId: id,
            ...point,
            width: z.number().finite().min(80).max(20000),
            height: z.number().finite().min(48).max(20000),
            zIndex: z.number().finite(),
          })
          .strict(),
      )
      .max(20000),
    edges: z
      .array(z.object({ id, source: id, target: id }).strict())
      .max(20000),
    graph: z
      .array(
        z
          .object({
            nodeId: id,
            ...point,
            // Optional user-chosen card size; text cards still grow to fit.
            width: z.number().finite().min(120).max(20000).optional(),
            height: z.number().finite().min(64).max(20000).optional(),
          })
          .strict(),
      )
      .max(10000),
    viewports: z
      .array(
        z
          .object({ pageId: id, ...point, zoom: z.number().min(0.1).max(4) })
          .strict(),
      )
      .max(1000),
    activeAudioId: id.optional(),
  })
  .strict();
export type Project = z.infer<typeof projectSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Page = z.infer<typeof pageSchema>;
export type Placement = Project["placements"][number];
export type Asset = {
  id: string;
  projectId: string;
  kind: "image" | "audio";
  name: string;
  mime: string;
  blob: Blob;
  width?: number;
  height?: number;
  duration?: number;
};
export const uid = () => crypto.randomUUID();
export function createProject(name = "Untitled project"): Project {
  const now = new Date().toISOString();
  return validateProject({
    formatVersion: 1,
    id: uid(),
    name: name.trim() || "Untitled project",
    createdAt: now,
    updatedAt: now,
    pages: [{ id: uid(), title: "Opening", order: 0 }],
    nodes: [],
    posts: [],
    placements: [],
    edges: [],
    graph: [],
    viewports: [],
  });
}
export function validateProject(value: unknown): Project {
  const p = projectSchema.parse(value);
  const unique = (values: string[]) => {
    if (new Set(values).size !== values.length)
      throw Error("Duplicate record IDs");
  };
  unique(p.pages.map((x) => x.id));
  unique(p.nodes.map((x) => x.id));
  unique(p.posts.map((x) => x.id));
  unique(p.posts.map((x) => x.nodeId));
  unique(p.placements.map((x) => x.id));
  unique(p.edges.map((x) => x.id));
  unique(p.graph.map((x) => x.nodeId));
  unique(p.viewports.map((x) => x.pageId));
  const pages = new Set(p.pages.map((x) => x.id)),
    nodes = new Set(p.nodes.map((x) => x.id));
  if (
    p.posts.some((x) => !nodes.has(x.nodeId)) ||
    p.placements.some((x) => !nodes.has(x.nodeId) || !pages.has(x.pageId)) ||
    p.graph.some((x) => !nodes.has(x.nodeId)) ||
    p.viewports.some((x) => !pages.has(x.pageId))
  )
    throw Error("Broken content reference");
  const pairs: string[] = [];
  for (const e of p.edges) {
    if (e.source === e.target || !nodes.has(e.source) || !nodes.has(e.target))
      throw Error("Invalid relationship");
    pairs.push([e.source, e.target].sort().join(":"));
  }
  unique(pairs);
  const ranges = p.pages
    .flatMap((x) => (x.audioRange ? [x.audioRange] : []))
    .sort((a, b) => a.start - b.start);
  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i];
    if (
      r.assetId !== p.activeAudioId ||
      r.start >= r.end ||
      (i > 0 && r.start < ranges[i - 1].end)
    )
      throw Error("Invalid or overlapping audio ranges");
  }
  return p;
}
export function revise(p: Project, change: (next: Project) => void): Project {
  const n = structuredClone(p);
  change(n);
  n.updatedAt = new Date().toISOString();
  return validateProject(n);
}
export function postText(p: Project, text: string): Project {
  if (!text.trim()) throw Error("Write something first");
  return revise(p, (n) => {
    const now = new Date().toISOString(),
      id = uid();
    n.nodes.push({
      id,
      kind: "text",
      text: text.trim(),
      createdAt: now,
      updatedAt: now,
    });
    n.posts.unshift({ id: uid(), nodeId: id, postedAt: now });
  });
}
export function place(
  p: Project,
  nodeId: string,
  pageId: string,
  x = 120,
  y = 120,
  width = 280,
  height = 170,
): Project {
  return revise(p, (n) => {
    n.placements.push({
      id: uid(),
      nodeId,
      pageId,
      x,
      y,
      width,
      height,
      zIndex: n.placements.length,
    });
  });
}
export function link(p: Project, a: string, b: string): Project {
  return revise(p, (n) => {
    n.edges.push({ id: uid(), source: a, target: b });
  });
}
export function removeContent(p: Project, id: string): Project {
  return revise(p, (n) => {
    n.nodes = n.nodes.filter((x) => x.id !== id);
    n.posts = n.posts.filter((x) => x.nodeId !== id);
    n.placements = n.placements.filter((x) => x.nodeId !== id);
    n.edges = n.edges.filter((x) => x.source !== id && x.target !== id);
    n.graph = n.graph.filter((x) => x.nodeId !== id);
  });
}
export function removePage(p: Project, id: string): Project {
  if (p.pages.length === 1) throw Error("Keep at least one page");
  return revise(p, (n) => {
    n.pages = n.pages.filter((x) => x.id !== id);
    n.placements = n.placements.filter((x) => x.pageId !== id);
    n.viewports = n.viewports.filter((x) => x.pageId !== id);
  });
}

export function assignAudio(
  p: Project,
  assetId: string,
  duration: number,
): Project {
  if (!Number.isFinite(duration) || duration <= 0)
    throw Error("Invalid audio duration");
  return revise(p, (next) => {
    next.activeAudioId = assetId;
    const pages = [...next.pages].sort((a, b) => a.order - b.order);
    pages.forEach((page, i) => {
      page.audioRange = {
        assetId,
        start: (i * duration) / pages.length,
        end: ((i + 1) * duration) / pages.length,
      };
    });
  });
}

export function trimRange(
  pages: Page[],
  pageId: string,
  edge: "start" | "end",
  seconds: number,
  duration: number,
): NonNullable<Page["audioRange"]> {
  if (!Number.isFinite(seconds) || !Number.isFinite(duration) || duration <= 0)
    throw Error("Invalid section time");
  const ordered = pages
    .filter((page) => page.audioRange)
    .sort((a, b) => a.audioRange!.start - b.audioRange!.start);
  const index = ordered.findIndex((page) => page.id === pageId),
    original = ordered[index]?.audioRange;
  if (!original) throw Error("Page has no audio section");
  const range = { ...original },
    minimum = Math.min(0.1, range.end - range.start);
  if (edge === "start")
    range.start = Math.max(
      ordered[index - 1]?.audioRange?.end ?? 0,
      Math.min(range.end - minimum, seconds),
    );
  else
    range.end = Math.min(
      ordered[index + 1]?.audioRange?.start ?? duration,
      Math.max(range.start + minimum, seconds),
    );
  return range;
}
export function trimSection(
  p: Project,
  pageId: string,
  edge: "start" | "end",
  seconds: number,
  duration: number,
): Project {
  const range = trimRange(p.pages, pageId, edge, seconds, duration);
  return revise(p, (next) => {
    next.pages.find((page) => page.id === pageId)!.audioRange = range;
  });
}

export function nextPageRange(
  pages: Page[],
  assetId: string,
  duration: number,
) {
  const start = Math.max(0, ...pages.map((p) => p.audioRange?.end ?? 0));
  const last = [...pages]
    .filter((p) => p.audioRange)
    .sort((a, b) => b.audioRange!.end - a.audioRange!.end)[0]?.audioRange;
  const length = Math.min(30, last ? last.end - last.start : duration);
  const end =
    start + (start < duration ? Math.min(length, duration - start) : length);
  return { assetId, start, end };
}
export function timelineExtent(pages: Page[], duration: number) {
  return Math.min(
    7 * 86400,
    Math.max(duration, ...pages.map((p) => p.audioRange?.end ?? 0)) + 30,
  );
}
export function reorderPage(
  p: Project,
  sourceId: string,
  targetId: string,
  after = false,
): Project {
  if (sourceId === targetId) return p;
  const ordered = [...p.pages].sort((a, b) => a.order - b.order);
  const source = ordered.find((page) => page.id === sourceId);
  if (!source || !ordered.some((page) => page.id === targetId))
    throw Error("Page no longer exists");
  const ids = ordered
    .filter((page) => page.id !== sourceId)
    .map((page) => page.id);
  ids.splice(ids.indexOf(targetId) + (after ? 1 : 0), 0, sourceId);
  return revise(p, (next) => {
    const timed = next.pages
      .filter((page) => page.audioRange)
      .sort((a, b) => a.audioRange!.start - b.audioRange!.start);
    const gaps = timed.map(
      (page, i) =>
        page.audioRange!.start - (timed[i - 1]?.audioRange?.end ?? 0),
    );
    next.pages.forEach((page) => {
      page.order = ids.indexOf(page.id);
    });
    let cursor = 0;
    timed
      .sort((a, b) => a.order - b.order)
      .forEach((page, i) => {
        const r = page.audioRange!,
          length = r.end - r.start;
        cursor += gaps[i];
        page.audioRange = { ...r, start: cursor, end: cursor + length };
        cursor += length;
      });
  });
}
