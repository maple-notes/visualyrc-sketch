// Same source, with archive loading alone changed, to compare initial JS payloads.
import { build } from "vite";
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { gzipSync } from "node:zlib";
const root = process.cwd(),
  out = root + "/outputs/verification";
await mkdir(out, { recursive: true });
await build({
  root,
  logLevel: "error",
  plugins: [
    {
      name: "eager-archive-baseline",
      enforce: "pre",
      transform(code, id) {
        if (!id.endsWith("/src/app.tsx")) return;
        return (
          'import {exportArchive,importArchive} from "./storage/archive";\n' +
          code
            .replace(
              /const \{ exportArchive \} = await import\("\.\/storage\/archive"\);/,
              "",
            )
            .replace(
              /const \{ importArchive \} = await import\("\.\/storage\/archive"\);/,
              "",
            )
        );
      },
    },
  ],
  build: { outDir: out + "/bundle-eager", emptyOutDir: true },
});
await build({
  root,
  logLevel: "error",
  build: { outDir: out + "/bundle-lazy", emptyOutDir: true },
});
async function stats(dir) {
  const html = await readFile(dir + "/index.html", "utf8"),
    entry = html.match(/<script[^>]+src="([^"]+)"/)[1];
  const bytes = await readFile(dir + "/" + entry.replace(/^\.\//, ""));
  let total = 0;
  for (const name of await readdir(dir + "/assets"))
    if (name.endsWith(".js"))
      total += (await readFile(dir + "/assets/" + name)).length;
  return {
    entryBytes: bytes.length,
    entryGzipBytes: gzipSync(bytes).length,
    totalJSBytes: total,
  };
}
const baseline = await stats(out + "/bundle-eager"),
  lazy = await stats(out + "/bundle-lazy");
const result = {
  baseline,
  lazy,
  initialGzipBytesAvoided: baseline.entryGzipBytes - lazy.entryGzipBytes,
  scope:
    "Same-source build A/B; bytes, not elapsed load time or FPS. Archive code is requested only by import/export.",
};
await writeFile(
  out + "/bundle-comparison.json",
  JSON.stringify(result, null, 2),
);
console.log(result);
