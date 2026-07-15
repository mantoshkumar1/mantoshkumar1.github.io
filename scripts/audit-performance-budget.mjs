import { readdir, stat } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

const root = resolve(process.env.SITE_ROOT || join(process.cwd(), "dist"));
const limits = {
  html: 36 * 1024,
  css: 100 * 1024,
  javascriptTotal: 60 * 1024,
  image: 180 * 1024,
  publicTotalWithoutPdf: 1024 * 1024
};
const failures = [];

async function filesIn(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(path));
    else files.push(path);
  }
  return files;
}

const files = await filesIn(root);
const sizes = new Map(await Promise.all(files.map(async (file) => [file, (await stat(file)).size])));
const html = files.filter((file) => extname(file) === ".html");
const css = files.filter((file) => extname(file) === ".css");
const javascript = files.filter((file) => extname(file) === ".js");
const images = files.filter((file) => /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(file));
const withoutPdf = files.filter((file) => extname(file) !== ".pdf");

function enforceEach(group, limit, label) {
  for (const file of group) {
    const size = sizes.get(file);
    if (size > limit) failures.push(`${relative(root, file)}: ${size} bytes exceeds ${label} budget of ${limit}`);
  }
}

function total(group) { return group.reduce((sum, file) => sum + sizes.get(file), 0); }

enforceEach(html, limits.html, "HTML document");
enforceEach(css, limits.css, "stylesheet");
enforceEach(images, limits.image, "image");
if (total(javascript) > limits.javascriptTotal) failures.push(`first-party JavaScript: ${total(javascript)} bytes exceeds ${limits.javascriptTotal}`);
if (total(withoutPdf) > limits.publicTotalWithoutPdf) failures.push(`public artifact excluding PDF: ${total(withoutPdf)} bytes exceeds ${limits.publicTotalWithoutPdf}`);

if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}
console.log(`Performance budget passed: largest HTML ${Math.max(...html.map((file) => sizes.get(file)))} B, CSS ${total(css)} B, JS ${total(javascript)} B, public artifact excluding PDF ${total(withoutPdf)} B.`);
