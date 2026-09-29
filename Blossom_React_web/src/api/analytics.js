import { BASE_URL } from "./config";

// Visits for the admin dashboard. The browser keeps a random id (no personal
// data) so a visitor without a profile can be told apart from another; the
// server decides what counts (admins never, a member once, others per visit).
const DEVICE_KEY = "blossom_device_id";
// The server treats 30 minutes without activity as the end of a visit; a
// ping a bit sooner keeps an active visit going as one.
const KEEP_ALIVE_MS = 25 * 60 * 1000;

let memoryId = null;
let lastSentAt = 0;
let lastToken;
let lastPage;

// /profile/42 -> /profile/:id; a secret link's long random part (a friend's
// activation link, a venue's manager link) -> :token. The server does it too.
function pageOf(path) {
  return (path || "/")
    .replace(/\/[A-Za-z0-9_-]{16,}(?=\/|$)/g, "/:token")
    .replace(/\/\d+(?=\/|$)/g, "/:id");
}

function randomId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function deviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = randomId();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    memoryId = memoryId || randomId(); // private mode: this page load only
    return memoryId;
  }
}

function currentToken() {
  const token = sessionStorage.getItem("token");
  return token && token !== "null" && token !== "undefined" ? token : null;
}

function timezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

// Called on every page change and when the tab comes back into view. Tells
// the server about each new page (the dashboard's day view shows the path
// people took), after logging in, and to keep a long visit alive - not about
// the same page again. Never throws.
export function trackVisit(path) {
  const token = currentToken();
  const page = pageOf(path);
  const loggedIn = token && token !== lastToken;
  const moved = page !== lastPage;
  const due = Date.now() - lastSentAt > KEEP_ALIVE_MS;
  lastToken = token;
  lastPage = page;
  if (!loggedIn && !moved && !due) return;
  lastSentAt = Date.now();

  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  fetch(`${BASE_URL}/analytics/visit`, {
    method: "POST",
    headers,
    keepalive: true,
    body: JSON.stringify({
      device_id: deviceId(),
      platform: "web",
      entry: page,
      language: navigator.language,
      timezone: timezone(),
    }),
  }).catch(() => {});
}
