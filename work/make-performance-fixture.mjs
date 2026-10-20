import { writeFile, readFile, mkdir } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { zipSync, strToU8 } from "fflate";
import {
  createProject,
  uid,
  validateProject,
  revise,
} from "../src/domain/model.ts";
await mkdir("tmp/fixtures", { recursive: true });
const p = createProject("Performance · 100 ideas / 10 pages");
p.pages = Array.from({ length: 10 }, (_, i) => ({
  id: uid(),
  title: `Page ${i + 1}`,
  order: i,
}));
const imageId = uid(),
  audioId = uid();
const now = p.createdAt;
for (let i = 0; i < 100; i++) {
  const id = uid();
  p.nodes.push(
    i % 10 === 0
      ? {
          id,
          kind: "image",
          assetId: imageId,
          altText: `Image reference ${i + 1}`,
          createdAt: now,
          updatedAt: now,
        }
      : {
          id,
          kind: "text",
          text: `Idea ${i + 1}: arrange references, preserve shared content and test a concrete creative direction.`,
          createdAt: now,
          updatedAt: now,
        },
  );
  p.posts.push({ id: uid(), nodeId: id, postedAt: now });
  p.placements.push({
    id: uid(),
    nodeId: id,
    pageId: p.pages[i % 10].id,
    x: 70 + (Math.floor(i / 10) % 3) * 300,
    y: 80 + Math.floor(i / 30) * 220,
    width: 260,
    height: 160,
    zIndex: i,
  });
  p.graph.push({
    nodeId: id,
    x: 50 + (i % 10) * 300,
    y: 50 + Math.floor(i / 10) * 230,
  });
  if (i) p.edges.push({ id: uid(), source: p.nodes[i - 1].id, target: id });
}
p.activeAudioId = audioId;
p.pages[0].audioRange = { assetId: audioId, start: 0, end: 3 };
p.pages[1].audioRange = { assetId: audioId, start: 3, end: 6 };
validateProject(p);
const img = await readFile("tmp/fixtures/reference.png"),
  audio = await readFile("tmp/fixtures/tone.wav");
const manifest = {
  format: "visualyrc-sketch",
  formatVersion: 1,
  assets: [
    {
      id: imageId,
      kind: "image",
      name: "reference.png",
      mime: "image/png",
      size: img.length,
      width: 320,
      height: 240,
    },
    {
      id: audioId,
      kind: "audio",
      name: "tone.wav",
      mime: "audio/wav",
      size: audio.length,
      duration: 6,
    },
  ],
};
await writeFile(
  "tmp/fixtures/performance.vsketch",
  zipSync(
    {
      "manifest.json": strToU8(JSON.stringify(manifest)),
      "project.json": strToU8(JSON.stringify(p)),
      ["assets/" + imageId]: img,
      ["assets/" + audioId]: audio,
    },
    { level: 0 },
  ),
);
const runs = [];
for (let r = 0; r < 100; r++) {
  const t = performance.now();
  revise(p, (n) => {
    const node = n.nodes[1];
    if (node.kind === "text") node.text += " updated";
  });
  runs.push(performance.now() - t);
}
runs.sort((a, b) => a - b);
await mkdir("outputs/verification", { recursive: true });
const report = {
  fixture: {
    nodes: 100,
    pages: 10,
    edges: 99,
    placements: 100,
    images: 1,
    audio: 1,
  },
  operation:
    "clone + canonical text edit + complete schema/reference validation",
  runs: 100,
  medianMs: runs[50],
  p95Ms: runs[95],
  runtime: process.version,
  scope: "Node CPU benchmark, not browser FPS",
};
await writeFile(
  "outputs/verification/domain-performance.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report));
