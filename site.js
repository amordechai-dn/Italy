const SITE_PAGES = [
  { id: "dashboard", href: "", file: "index.html", label: "מרכז" },
  { id: "flights", href: "flights/", file: "flights/index.html", label: "טיסות", count: "38" },
  { id: "hotels", href: "hotels/", file: "hotels/index.html", label: "מלונות", status: "בקרוב" },
  { id: "attractions", href: "attractions/", file: "attractions/index.html", label: "אטרקציות", status: "בקרוב" },
];

const siteRoot = document.documentElement.dataset.siteRoot || ".";
const siteUrl = (path = "") => `${siteRoot.replace(/\/$/, "")}/${path}`;

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

  header.replaceChildren(brand, nav);
}

buildSiteHeader();
