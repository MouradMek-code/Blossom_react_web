// Light, dark, or like the device (the default) - chosen in Settings, kept in
// this browser. public/index.html applies it before the page paints (no
// flash of the wrong colours); this keeps it up to date afterwards.
const KEY = "blossom_theme";
export const THEME_MODES = ["system", "light", "dark"];
const THEME_COLORS = { light: "#C1466B", dark: "#171311" };

const media = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

export function getThemeMode() {
  try {
    const saved = localStorage.getItem(KEY);
    return THEME_MODES.includes(saved) ? saved : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(mode = getThemeMode()) {
  const dark = mode === "dark" || (mode === "system" && Boolean(media?.matches));
  const scheme = dark ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", scheme);
  // The browser's own bar on phones.
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[scheme]);
}

export function setThemeMode(mode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    // private mode: it still applies for this visit
  }
  applyTheme(mode);
}

// Following the device: when it switches to dark (or back), so does the site.
media?.addEventListener?.("change", () => {
  if (getThemeMode() === "system") applyTheme("system");
});
