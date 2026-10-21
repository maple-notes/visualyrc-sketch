import { it, expect } from "vitest";
import {
  createProject,
  uid,
  postText,
  place,
  assignAudio,
  trimSection,
  revise,
  nextPageRange,
  reorderPage,
  timelineExtent,
} from "../domain/model";
it("assigns the entire duration equally in page order without changing content or placements", () => {
  let p = postText(createProject(), "keep");
  p = place(p, p.nodes[0].id, p.pages[0].id);
  const first = p.pages[0].id;
  p = revise(p, (n) => {
    n.pages[0].order = 1;
    n.pages.push({ id: uid(), title: "Earlier", order: 0 });
  });
  const assigned = assignAudio(p, uid(), 7);
  expect(
    assigned.pages.find((page) => page.id === first)?.audioRange,
  ).toMatchObject({ start: 3.5, end: 7 });
  expect(
    assigned.pages.find((page) => page.order === 0)?.audioRange,
  ).toMatchObject({ start: 0, end: 3.5 });
  expect(assigned.nodes).toEqual(p.nodes);
  expect(assigned.placements).toEqual(p.placements);
});
it("clamps both edges to duration, neighbors and a positive section length", () => {
  let p = createProject();
  p = revise(p, (n) => n.pages.push({ id: uid(), title: "Next", order: 1 }));
  p = assignAudio(p, uid(), 10);
  const first = p.pages[0].id,
    second = p.pages[1].id;
  expect(trimSection(p, first, "end", 9, 10).pages[0].audioRange?.end).toBe(5);
  expect(
    trimSection(p, second, "start", 1, 10).pages[1].audioRange?.start,
  ).toBe(5);
  p = trimSection(p, first, "end", 3, 10);
  p = trimSection(p, second, "start", 4, 10);
  expect(p.pages.map((page) => page.audioRange)).toMatchObject([
    { start: 0, end: 3 },
    { start: 4, end: 10 },
  ]);
  expect(
    trimSection(p, first, "start", 100, 10).pages[0].audioRange?.start,
  ).toBeCloseTo(2.9);
  expect(trimSection(p, second, "end", 100, 10).pages[1].audioRange?.end).toBe(
    10,
  );
  expect(() => trimSection(p, first, "end", NaN, 10)).toThrow();
});
it("keeps tiny automatically assigned sections valid", () => {
  let p = createProject();
  p = revise(p, (n) => n.pages.push({ id: uid(), title: "Second", order: 1 }));
  p = assignAudio(p, uid(), 0.01);
  expect(() => trimSection(p, p.pages[0].id, "start", 1, 0.01)).not.toThrow();
});

it("appends timed pages after all existing sections including past the audio end", () => {
  const id = uid();
  let p = assignAudio(createProject(), id, 6);
  expect(nextPageRange(p.pages, id, 6)).toEqual({
    assetId: id,
    start: 6,
    end: 12,
  });
  p = revise(p, (n) =>
    n.pages.push({
      id: uid(),
      title: "Silent outro",
      order: 1,
      audioRange: nextPageRange(n.pages, id, 6),
    }),
  );
  expect(timelineExtent(p.pages, 6)).toBe(42);
  expect(
    trimSection(p, p.pages[1].id, "end", 20, timelineExtent(p.pages, 6))
      .pages[1].audioRange?.end,
  ).toBe(20);
});
it("reorders whole timed pages while retaining duration, gaps, content and identity", () => {
  let p = postText(createProject(), "unchanged");
  p = revise(p, (n) => n.pages.push({ id: uid(), title: "Last", order: 1 }));
  p = assignAudio(p, uid(), 10);
  p = trimSection(p, p.pages[0].id, "end", 3, 10);
  const first = p.pages[0].id,
    last = p.pages[1].id;
  const next = reorderPage(p, last, first);
  expect(
    [...next.pages].sort((a, b) => a.order - b.order).map((p) => p.id),
  ).toEqual([last, first]);
  expect(next.pages.find((p) => p.id === last)?.audioRange).toMatchObject({
    start: 0,
    end: 5,
  });
  expect(next.pages.find((p) => p.id === first)?.audioRange).toMatchObject({
    start: 7,
    end: 10,
  });
  expect(next.nodes).toEqual(p.nodes);
  expect(next.placements).toEqual(p.placements);
  expect(reorderPage(p, first, first)).toBe(p);
  expect(() => reorderPage(p, uid(), first)).toThrow();
});
