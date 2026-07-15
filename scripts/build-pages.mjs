import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { generateSeo } from "./generate-seo.mjs";

const source = resolve(process.cwd());
const output = join(source, "dist");
const publicEntries = [
  "404.html", "accessibility", "apple-touch-icon.png", "assets", "contact", "experience",
  "favicon.ico", "favicon.svg", "index.html", "insights", "llms.txt", "newsletter", "projects",
  "resume", "robots.txt", "site.webmanifest", "systems", "thinking"
];
const privateAssetPaths = [
  "assets/.DS_Store",
  "assets/original-vision",
  "assets/seo/social-default.png",
  "assets/ui-versions",
  "assets/vision"
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of publicEntries) {
  await cp(join(source, entry), join(output, entry), { recursive: true });
}
for (const path of privateAssetPaths) await rm(join(output, path), { recursive: true, force: true });
await generateSeo(output, join(source, "seo.config.json"));
await writeFile(join(output, ".nojekyll"), "");
await writeFile(join(output, "deployment.json"), `${JSON.stringify({ revision: process.env.GITHUB_SHA || process.env.DEPLOYMENT_REVISION || "local" }, null, 2)}\n`);
console.log("Built static GitHub Pages artifact in dist/.");
