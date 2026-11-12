// Timestamps for chat screens.
//
// The API sends naive UTC datetimes ("2026-09-15T10:00:00.123456"). Without a
// zone suffix JavaScript would read them as *local* time, shifting every
// message by the viewer's UTC offset - so add the "Z" ourselves. Fractions are
// trimmed to milliseconds, which every JS engine parses.
export function parseServerDate(value) {
  if (!value) return null;
  // "2026-09-15 10:00:00" (a space, from str() on the server) -> ISO "T".
  let s = String(value).replace(/^(\d{4}-\d\d-\d\d) /, "$1T").replace(/(\.\d{3})\d+/, "$1");
  if (!/[zZ]$|[+-]\d\d:?\d\d$/.test(s)) s += "Z";
  const date = new Date(s);
  return Number.isNaN(date.getTime()) ? null : date;
}

// "14:05" for today, "15/09" earlier this year, "15/09/25" before that.
export function shortTime(value) {
  const date = parseServerDate(value);
  if (!date) return "";
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  if (date.toDateString() === now.toDateString()) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  const day = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
  return date.getFullYear() === now.getFullYear()
    ? day
    : `${day}/${String(date.getFullYear()).slice(2)}`;
}


// "14:05", under each message.
export function clockTime(value) {
  const date = parseServerDate(value);
  if (!date) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// The day between messages: "Today", "Yesterday", "Monday" this week,
// "15 September" this year, "15 September 2025" before.
export function dayLabel(value, t, language) {
  const date = parseServerDate(value);
  if (!date) return "";
  const now = new Date();
  const start = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((start(now) - start(date)) / 86400000);
  if (days === 0) return t("messages.today");
  if (days === 1) return t("messages.yesterday");
  try {
    if (days > 1 && days < 7) return date.toLocaleDateString(language, { weekday: "long" });
    const options = { day: "numeric", month: "long" };
    if (date.getFullYear() !== now.getFullYear()) options.year = "numeric";
    return date.toLocaleDateString(language, options);
  } catch {
    return shortTime(value);
  }
}

// True when `message` is the first of its day (the day label goes above it).
export function startsDay(message, previous) {
  if (!previous) return true;
  const a = parseServerDate(message.created_at);
  const b = parseServerDate(previous.created_at);
  return !a || !b || a.toDateString() !== b.toDateString();
}

// When the other person was last on Blossom - never more precise than this,
// and nothing after a week: "Active now" (5 min), "Active 12 min ago",
// "Active 3 h ago", "Active yesterday", "Active 4 days ago".
export function activeLabel(value, t, now = new Date()) {
  const date = parseServerDate(value);
  if (!date) return "";
  const minutes = Math.max(0, Math.floor((now - date) / 60000));
  if (minutes < 5) return t("messages.activeNow");
  if (minutes < 60) return t("messages.activeMinutes", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("messages.activeHours", { count: hours });
  const days = Math.floor(hours / 24);
  if (days === 1) return t("messages.activeYesterday");
  if (days < 7) return t("messages.activeDays", { count: days });
  return "";
}

export function isActiveNow(value, now = new Date()) {
  const date = parseServerDate(value);
  return Boolean(date) && now - date < 5 * 60000;
}
