import { access, readdir, readFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const siteScript = await readFile(join(root, "site.js"), "utf8");
const registeredPages = [...siteScript.matchAll(/\{\s*id:\s*"([^"]+)"\s*,\s*href:\s*"([^"]*)"\s*,\s*file:\s*"([^"]+)"/g)]
  .map(([, id, href, file]) => ({ id, href, file }));

async function collectHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtmlFiles(fullPath));
    else if (entry.name.endsWith(".html")) files.push(relative(root, fullPath));
  }
  return files;
}

const htmlFiles = (await collectHtmlFiles(root)).sort();

const errors = [];
const cssVersions = new Map();

for (const file of htmlFiles) {
  const html = await readFile(join(root, file), "utf8");
  if (/<body[^>]*data-redirect/.test(html)) continue;
  const pageId = html.match(/<body[^>]*data-page="([^"]+)"/)?.[1];
  const registered = registeredPages.find((page) => page.file === file);
  const cssVersion = html.match(/(?:\.\.\/)*site\.css\?v=([^"']+)/)?.[1];

  if (!pageId) errors.push(`${file}: חסר data-page ב-body`);
  if (!registered) errors.push(`${file}: העמוד אינו רשום ב-SITE_PAGES`);
  if (registered && pageId !== registered.id) errors.push(`${file}: data-page אינו תואם לרישום בניווט`);
  if (!/(?:\.\.\/)*site\.js\?v=/.test(html)) errors.push(`${file}: חסר site.js`);
  if (!html.includes('meta name="site-build-version"')) errors.push(`${file}: חסרה גרסת פרסום לעדכון אוטומטי`);
  if (!/(?:\.\.\/)*theme\.js\?v=/.test(html)) errors.push(`${file}: חסר theme.js`);
  if (!html.includes("data-site-header")) errors.push(`${file}: חסרה מעטפת הכותרת המשותפת`);
  if (!html.includes('class="skip-link"')) errors.push(`${file}: חסר קישור דילוג לתוכן הראשי`);
  if (!html.includes('id="main-content"')) errors.push(`${file}: חסרה נקודת כניסה לתוכן הראשי`);
  if (/<style[\s>]/.test(html)) errors.push(`${file}: עיצוב פנימי אסור; יש להעביר אותו לקובץ CSS`);
  if (/<script>/.test(html)) errors.push(`${file}: קוד JavaScript פנימי אסור; יש להעביר אותו לקובץ JS`);
  if ((html.match(/class="page-tabs"/g) ?? []).length) errors.push(`${file}: הניווט הועתק ידנית במקום להיבנות מ-site.js`);
  if (!cssVersion) errors.push(`${file}: חסר site.css עם מספר גרסה`);
  else cssVersions.set(file, cssVersion);

  const pageCss = [...html.matchAll(/href="([^"']+\.css)\?v=[^"']+"/g)]
    .map(([, href]) => href)
    .filter((href) => !/(^|\/)site\.css$/.test(href));
  for (const href of pageCss) {
    try { await access(join(root, dirname(file), href)); }
    catch { errors.push(`${file}: קובץ העיצוב ${href} אינו קיים`); }
  }

  for (const tableScroll of html.matchAll(/<div class="table-scroll"([^>]*)>/g)) {
    if (!/tabindex="0"/.test(tableScroll[1])) errors.push(`${file}: אזור טבלה נגלל חייב להיות נגיש למקלדת`);
  }
  if (html.includes("<table") && !html.includes("<caption")) errors.push(`${file}: לטבלה חסרה כותרת caption`);
}

for (const { file } of registeredPages) {
  if (!htmlFiles.includes(file)) errors.push(`site.js: הקובץ הרשום ${file} אינו קיים`);
}

for (const requiredFile of ["sw.js", "version.txt"]) {
  try { await access(join(root, requiredFile)); }
  catch { errors.push(`${requiredFile}: חסר קובץ עדכון האתר`); }
}

if (new Set(cssVersions.values()).size > 1) {
  errors.push(`גרסת site.css אינה אחידה: ${[...cssVersions].map(([file, version]) => `${file}=v${version}`).join(", ")}`);
}

if (errors.length) {
  console.error(errors.map((error) => `✗ ${error}`).join("\n"));
  process.exit(1);
}

console.log(`✓ נבדקו ${htmlFiles.length} עמודים: מעטפת, ניווט וגרסת עיצוב אחידים`);
