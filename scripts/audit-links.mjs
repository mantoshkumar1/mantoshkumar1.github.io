import { access, readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const origin = "https://mantoshkumar1.github.io";
const ignoredDirectories = new Set([".git", "chat-worker", "dist", "knowledge", "node_modules", "templates"]);
const separatelyDeployedPaths = new Set(["/photosahi/"]);
const failures = [];

async function walk(directory, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path, files);
    else if (entry.isFile() && extname(entry.name) === ".html") files.push(path);
  }
  return files;
}

function routeFor(file) {
  const path = relative(root, file).replaceAll("\\", "/");
  if (path === "index.html") return "/";
  if (path.endsWith("/index.html")) return `/${path.slice(0, -"index.html".length)}`;
  return `/${path}`;
}

function targetFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  if (decoded.endsWith("/")) return join(root, decoded, "index.html");
  return join(root, decoded);
}

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

function hasFragment(html, fragment) {
  const id = decodeURIComponent(fragment).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:id|name)=["']${id}["']`, "i").test(html);
}

for (const file of await walk(root)) {
  const html = await readFile(file, "utf8");
  const source = relative(root, file).replaceAll("\\", "/");
  const base = new URL(routeFor(file), origin);
  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    const raw = match[1];
    if (/^(?:mailto:|tel:|javascript:|data:)/i.test(raw)) continue;
    let url;
    try { url = new URL(raw, base); } catch { failures.push(`${source}: invalid URL ${raw}`); continue; }
    if (url.origin !== origin) continue;
    if (separatelyDeployedPaths.has(url.pathname)) continue;
    const target = targetFile(url.pathname);
    if (!(await exists(target))) {
      failures.push(`${source}: missing target ${raw}`);
      continue;
    }
    if (url.hash && extname(target) === ".html") {
      const targetHtml = target === file ? html : await readFile(target, "utf8");
      if (!hasFragment(targetHtml, url.hash.slice(1))) failures.push(`${source}: missing fragment ${raw}`);
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Internal link, anchor, and asset checks passed.");
