// Where the login is kept in this browser.
//
// "Keep me logged in" (ticked by default) keeps it in localStorage: closing
// the tab or the browser doesn't log you out, and every tab shares it.
// Unticked - a shared or public computer - it lives in sessionStorage and is
// gone when the tab closes, like before.
//
// Only the login lives here (token, profile id, "profile finished").
// Things that belong to one visit (filters, the sign-up draft) stay in
// sessionStorage.
const AUTH_KEYS = ["token", "profile_id", "profilecreated"];
const REMEMBER_KEY = "blossom_remember";

function safe(read, fallback = null) {
  try {
    return read();
  } catch {
    return fallback; // storage blocked (private mode, site data off)
  }
}

// A tab-only login wins, so a tab on a shared computer never mixes with a
// remembered one.
function activeStore() {
  return safe(() => sessionStorage.getItem("token")) ? sessionStorage : localStorage;
}

export function getAuth(key) {
  const value = safe(() => activeStore().getItem(key));
  // "null" / "undefined" were written by older code: they mean nothing.
  return value && value !== "null" && value !== "undefined" ? value : null;
}

export function setAuth(key, value) {
  if (value === null || value === undefined || value === "") {
    removeAuth(key);
    return;
  }
  safe(() => activeStore().setItem(key, String(value)));
}

export function removeAuth(key) {
  safe(() => localStorage.removeItem(key));
  safe(() => sessionStorage.removeItem(key));
}

// Log out: the login goes from both places.
export function clearAuth() {
  AUTH_KEYS.forEach(removeAuth);
}

// Log out and forget everything this visit kept (filters, sign-up draft).
export function clearSession() {
  clearAuth();
  safe(() => sessionStorage.clear());
}

// The box's last answer on this browser (yes unless they unticked it).
export function getRemember() {
  return safe(() => localStorage.getItem(REMEMBER_KEY)) !== "no";
}

// A new login replaces any previous one, then is kept where asked.
export function startSession(token, remember = getRemember()) {
  clearAuth();
  if (!token || token === "undefined" || token === "null") return;
  safe(() => localStorage.setItem(REMEMBER_KEY, remember ? "yes" : "no"));
  const saved = remember && safe(() => {
    localStorage.setItem("token", token);
    return true;
  }, false);
  // Not remembered - or localStorage refused it: this tab only.
  if (!saved) safe(() => sessionStorage.setItem("token", token));
}

// Logged out (or in as someone else) in another tab: this tab follows,
// unless it has its own tab-only login. A reload is enough - pages that need
// a login send you to it.
export function followOtherTabs() {
  let timer = null;
  window.addEventListener("storage", (event) => {
    if (event.storageArea !== localStorage || event.key !== "token") return;
    if (safe(() => sessionStorage.getItem("token"))) return;
    // A new login is two writes (clear, then set): react once.
    clearTimeout(timer);
    timer = setTimeout(() => window.location.reload(), 150);
  });
}
