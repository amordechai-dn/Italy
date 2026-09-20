import { readdir, readFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const siteScript = await readFile(join(root, "site.js"), "utf8");
const registeredPages = [...siteScript.matchAll(/\{\s*id:\s*"([^"]+)"\s*,\s*href:\s*"([^"]+)"/g)]
  .map(([, id, href]) => ({ id, href }));

const htmlFiles = (await readdir(root))
  .filter((file) => file.endsWith(".html") && file !== "index.html")
  .sort();

const errors = [];
const cssVersions = new Map();

for (const file of htmlFiles) {
  const html = await readFile(join(root, file), "utf8");
  const pageId = html.match(/<body[^>]*data-page="([^"]+)"/)?.[1];
  const registered = registeredPages.find((page) => page.href === file);
  const cssVersion = html.match(/site\.css\?v=([^"']+)/)?.[1];

  if (!pageId) errors.push(`${file}: חסר data-page ב-body`);
  if (!registered) errors.push(`${file}: העמוד אינו רשום ב-SITE_PAGES`);
  if (registered && pageId !== registered.id) errors.push(`${file}: data-page אינו תואם לרישום בניווט`);
  if (!html.includes('src="site.js?v=')) errors.push(`${file}: חסר site.js`);
  if (!html.includes("data-site-header")) errors.push(`${file}: חסרה מעטפת הכותרת המשותפת`);
  if ((html.match(/class="page-tabs"/g) ?? []).length) errors.push(`${file}: הניווט הועתק ידנית במקום להיבנות מ-site.js`);
  if (!cssVersion) errors.push(`${file}: חסר site.css עם מספר גרסה`);
  else cssVersions.set(file, cssVersion);
}

for (const { href } of registeredPages) {
  if (!htmlFiles.includes(basename(href))) errors.push(`site.js: הקובץ הרשום ${href} אינו קיים`);
}

if (new Set(cssVersions.values()).size > 1) {
  errors.push(`גרסת site.css אינה אחידה: ${[...cssVersions].map(([file, version]) => `${file}=v${version}`).join(", ")}`);
}

if (errors.length) {
  console.error(errors.map((error) => `✗ ${error}`).join("\n"));
  process.exit(1);
}

console.log(`✓ נבדקו ${htmlFiles.length} עמודים: מעטפת, ניווט וגרסת עיצוב אחידים`);
