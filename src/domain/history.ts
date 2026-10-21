import { revise, type Project, type Asset } from "./model";
const assetIds = (p: Project) =>
  new Set([
    ...p.nodes.flatMap((n) => (n.kind === "image" ? [n.assetId] : [])),
    ...(p.activeAudioId ? [p.activeAudioId] : []),
  ]);
export class EditHistory {
  private past: Project[] = [];
  private future: Project[] = [];
  private media = new Map<string, Asset>();
  reset(assets: Asset[]) {
    this.past = [];
    this.future = [];
    this.media = new Map(assets.map((a) => [a.id, a]));
  }
  record(before: Project, after: Project, assets: Asset[], remember = true) {
    assets.forEach((a) => this.media.set(a.id, a));
    if (remember && before !== after) {
      this.past.push(before);
      this.past = this.past.slice(-50);
      this.future = [];
    }
    const kept = new Set(
      [after, ...this.past, ...this.future].flatMap((p) => [...assetIds(p)]),
    );
    for (const id of this.media.keys())
      if (!kept.has(id)) this.media.delete(id);
  }
  step(current: Project, direction: "undo" | "redo"): Project | undefined {
    const from = direction === "undo" ? this.past : this.future,
      to = direction === "undo" ? this.future : this.past;
    const p = from.pop();
    if (!p) return;
    to.push(current);
    return revise(p, (next) => {
      next.viewports = current.viewports.filter((v) =>
        next.pages.some((page) => page.id === v.pageId),
      );
    });
  }
  assets(p: Project): Asset[] {
    return [...assetIds(p)].map((id) => {
      const asset = this.media.get(id);
      if (!asset)
        throw Error(
          "Original media is unavailable for this edit. Export a recovery copy before continuing.",
        );
      return asset;
    });
  }
}
