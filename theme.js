(() => {
  const storageKey = "italy-site-theme";
  const readTheme = () => {
    try {
      const storedTheme = localStorage.getItem(storageKey);
      return storedTheme === "light" || storedTheme === "dark" ? storedTheme : "dark";
    }
    catch { return "dark"; }
  };
  const applyTheme = (theme, persist = false) => {
    const selected = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = selected;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", selected === "dark" ? "#0d1422" : "#ffffff");
    if (persist) {
      try { localStorage.setItem(storageKey, selected); }
      catch { /* The theme still works when storage is unavailable. */ }
    }
    window.dispatchEvent(new CustomEvent("site-theme-change", { detail: { theme: selected } }));
    return selected;
  };

  const initialTheme = readTheme();
  document.documentElement.dataset.theme = initialTheme;
  window.siteTheme = {
    get: () => document.documentElement.dataset.theme === "dark" ? "dark" : "light",
    set: (theme) => applyTheme(theme, true),
    toggle: () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true),
  };
})();
