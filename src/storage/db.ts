import Dexie, { type Table } from "dexie";
import type { Asset, Project } from "../domain/model";
class WorkspaceDB extends Dexie {
  projects!: Table<Project, string>;
  assets!: Table<Asset, string>;
  constructor() {
    super("visualyrc-sketch");
    this.version(1).stores({
      projects: "id,updatedAt",
      assets: "id,projectId",
    });
  }
}
export const db = new WorkspaceDB();
export async function saveProject(p: Project, assets: Asset[] = []) {
  await db.transaction("rw", db.projects, db.assets, async () => {
    if (assets.length) await db.assets.bulkPut(assets);
    await db.projects.put(p);
    const referenced = new Set(
      p.nodes.flatMap((n) => (n.kind === "image" ? [n.assetId] : [])),
    );
    if (p.activeAudioId) referenced.add(p.activeAudioId);
    const stored = await db.assets
      .where("projectId")
      .equals(p.id)
      .primaryKeys();
    await db.assets.bulkDelete(stored.filter((id) => !referenced.has(id)));
  });
}
export async function projectAssets(p: Project) {
  const ids = new Set(
    p.nodes.flatMap((n) => (n.kind === "image" ? [n.assetId] : [])),
  );
  if (p.activeAudioId) ids.add(p.activeAudioId);
  return (await db.assets.bulkGet([...ids])).filter((x): x is Asset => !!x);
}
