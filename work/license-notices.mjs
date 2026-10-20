// Generates public notices from installed runtime dependency license files, offline.
import { execFileSync } from "node:child_process";
import { readFile, readdir, writeFile } from "node:fs/promises";
const dirs = execFileSync("npm", ["ls", "--omit=dev", "--all", "--parseable"], {
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .slice(1);
let text =
  "# Third-party dependency notices\n\nGenerated from the installed lockfile on 2026-10-20. This inventory does not choose a license for Visualyrc Sketch. Type-only packages are included for traceability.\n";
for (const dir of [...new Set(dirs)].sort()) {
  const p = JSON.parse(await readFile(dir + "/package.json", "utf8"));
  const license = (await readdir(dir)).find((name) =>
    /^licen[sc]e(?:\.|$)/i.test(name),
  );
  if (!license) throw Error("Missing license text for " + p.name);
  text += `\n## ${p.name} ${p.version}\n\nDeclared license: ${p.license}\n\n<details><summary>License text</summary>\n\n\`\`\`text\n${await readFile(dir + "/" + license, "utf8")}\n\`\`\`\n</details>\n`;
}
await writeFile("THIRD_PARTY_NOTICES.md", text);
console.log(`Recorded ${dirs.length} dependency licenses.`);
