// Persists in-progress signup state (location + question answers + which
// question we're on) so a user who closes the tab mid-signup can resume
// where they left off instead of restarting from question 1. Lives in
// sessionStorage: it holds personal details, so it stays with the tab.
const DRAFT_KEY = "signup_draft";

export function getSignupDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSignupDraft(partial) {
  const current = getSignupDraft() || {};
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...current, ...partial }));
}

export function clearSignupDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}
