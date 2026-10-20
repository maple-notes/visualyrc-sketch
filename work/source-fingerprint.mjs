import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
export async function sourceFingerprint(root) {
  const files = [
    "package.json",
    "package-lock.json",
    "index.html",
    "vite.config.ts",
    "tsconfig.json",
    "eslint.config.js",
  ];
  async function walk(dir) {
    for (const entry of await readdir(root + "/" + dir, {
      withFileTypes: true,
    })) {
      const path = dir + "/" + entry.name;
      if (entry.isDirectory()) await walk(path);
      else files.push(path);
    }
  }
  await walk("src");
  await walk("work");
  const hash = createHash("sha256");
  for (const file of files.sort()) {
    hash.update(file + "\0");
    hash.update(await readFile(root + "/" + file));
  }
  return hash.digest("hex");
}
