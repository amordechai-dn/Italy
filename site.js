const SITE_PAGES = [
  { id: "dashboard", href: "", file: "index.html", label: "מרכז" },
  { id: "flights", href: "flights/", file: "flights/index.html", label: "טיסות", count: "38" },
  { id: "hotels", href: "hotels/", file: "hotels/index.html", label: "מלונות", status: "בקרוב" },
  { id: "attractions", href: "attractions/", file: "attractions/index.html", label: "אטרקציות", status: "בקרוב" },
];

const siteRoot = document.documentElement.dataset.siteRoot || ".";
const siteUrl = (path = "") => `${siteRoot.replace(/\/$/, "")}/${path}`;
const pageBuildVersion = document.querySelector('meta[name="site-build-version"]')?.content?.trim() || "";
const updateChannel = "BroadcastChannel" in window ? new BroadcastChannel("italy-site-updates") : null;

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function buildSiteHeader() {
  const header = document.querySelector("[data-site-header]");
  if (!header) return;

  const activePage = document.body.dataset.page;
  const brand = createElement("a", "site-brand");
  brand.href = siteUrl();
  brand.setAttribute("aria-label", "צפון איטליה 2027 — השוואת טיסות ותכנון");

  const mark = createElement("span", "brand-mark");
  mark.setAttribute("aria-hidden", "true");
  const logo = createElement("img", "brand-logo");
  logo.src = siteUrl("assets/italy-mark.svg");
  logo.alt = "";
  logo.width = 40;
  logo.height = 40;
  logo.decoding = "async";
  mark.append(logo);
  const copy = createElement("span", "site-brand-copy");
  const title = createElement("strong");
  const year = createElement("bdi", "", "2027");
  year.dir = "ltr";
  title.append("צפון איטליה ", year);
  const subtitle = createElement("small", "", "השוואת טיסות ותכנון");
  copy.append(title, subtitle);
  brand.append(mark, copy);

  const nav = createElement("nav", "page-tabs");
  nav.setAttribute("aria-label", "עמודי האתר");

  SITE_PAGES.forEach((page) => {
    const link = createElement("a", "page-tab");
    link.href = siteUrl(page.href);
    if (page.id === activePage) link.setAttribute("aria-current", "page");
    link.append(createElement("span", "", page.label));
    if (page.count) {
      const count = createElement("span", "tab-count", page.count);
      count.setAttribute("aria-hidden", "true");
      link.append(count);
    }
    if (page.status) {
      link.setAttribute("aria-label", `${page.label} — ${page.status}`);
      link.append(createElement("span", "tab-status", page.status));
    }
    nav.append(link);
  });

  const themeToggle = createElement("button", "theme-toggle");
  themeToggle.type = "button";
  const themeIcon = createElement("span", "theme-toggle-icon");
  themeIcon.setAttribute("aria-hidden", "true");
  const themeLabel = createElement("span", "theme-toggle-label");
  themeToggle.append(themeIcon, themeLabel);

  const updateThemeToggle = () => {
    const isDark = window.siteTheme?.get() === "dark";
    themeIcon.textContent = isDark ? "☀" : "◐";
    themeLabel.textContent = isDark ? "מצב בהיר" : "מצב כהה";
    themeToggle.setAttribute("aria-label", isDark ? "מעבר למצב בהיר" : "מעבר למצב כהה");
    themeToggle.setAttribute("aria-pressed", String(isDark));
  };
  themeToggle.addEventListener("click", () => window.siteTheme?.toggle());
  window.addEventListener("site-theme-change", updateThemeToggle);
  updateThemeToggle();

  header.replaceChildren(brand, nav, themeToggle);
}

buildSiteHeader();

function reloadForVersion(version) {
  if (!/^[a-f0-9]{40}$/i.test(version) || version === pageBuildVersion) return;
  const reloadKey = `site-reload-${version}`;
  if (sessionStorage.getItem(reloadKey)) return;
  sessionStorage.setItem(reloadKey, "1");
  const url = new URL(window.location.href);
  url.searchParams.set("site-version", version.slice(0, 8));
  window.location.replace(url);
}

async function checkForSiteUpdate() {
  if (!/^https?:$/.test(window.location.protocol) || !/^[a-f0-9]{40}$/i.test(pageBuildVersion)) return;
  try {
    const response = await fetch(`${siteUrl("version.txt")}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return;
    const deployedVersion = (await response.text()).trim();
    if (deployedVersion !== pageBuildVersion) {
      updateChannel?.postMessage(deployedVersion);
      reloadForVersion(deployedVersion);
    }
  } catch {
    // A temporary network failure should never interrupt the current page.
  }
}

async function enableFreshNavigation() {
  if (!("serviceWorker" in navigator) || !/^https?:$/.test(window.location.protocol)) return;
  try {
    const registration = await navigator.serviceWorker.register(siteUrl("sw.js"));
    await registration.update();
  } catch {
    // The site continues to work normally if service workers are unavailable.
  }
}

updateChannel?.addEventListener("message", (event) => reloadForVersion(String(event.data || "")));
window.addEventListener("focus", checkForSiteUpdate);
window.addEventListener("online", checkForSiteUpdate);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") checkForSiteUpdate();
});
window.addEventListener("load", () => {
  enableFreshNavigation();
  checkForSiteUpdate();
  window.setInterval(checkForSiteUpdate, 60_000);
});
