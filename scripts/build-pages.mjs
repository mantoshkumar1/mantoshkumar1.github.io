import { cp, mkdir, readdir, rm, unlink } from "node:fs/promises";
import { resolve, join } from "node:path";
import { generateSeo } from "./generate-seo.mjs";

const source = resolve(process.cwd());
const output = join(source, "dist");
const excluded = new Set([
  ".DS_Store", ".git", ".github", ".gitignore", "AGENTS.md", "README.md", "VISION.md",
  "_config.yml", "chat-worker", "dist", "docs", "knowledge", "node_modules", "plan", "scripts", "templates"
]);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of await readdir(source)) {
  if (excluded.has(entry)) continue;
  await cp(join(source, entry), join(output, entry), { recursive: true });
}
await generateSeo(output, join(source, "seo.config.json"));
await unlink(join(output, "seo.config.json"));
console.log("Built static GitHub Pages artifact in dist/.");
