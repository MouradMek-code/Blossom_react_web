import { BASE_URL } from "./config";
import { postJson } from "./errors";

// The ✓ verified badge (server: database/db_verification.py). The server
// picks the pose to copy, so an old photo can't be used; the emoji shows it.
export const POSE_EMOJI = {
  peace: "✌️",
  thumb: "👍",
  wave: "👋",
  point: "☝️",
  ok: "👌",
  chin: "🤔",
};

function authHeaders() {
  return { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
}

// { status: "none" | "pending" | "approved" | "rejected", pose, reason, deadline }
export function fetchVerification() {
  return postJson(`${BASE_URL}/verification/me`, { headers: authHeaders() });
}

export function sendSelfie(file) {
  const form = new FormData();
  form.append("selfie", file);
  return postJson(`${BASE_URL}/verification`, { method: "POST", headers: authHeaders(), body: form });
}

// Admins: "Ask to verify" a suspicious profile - 48 hours or it's deleted.
export function requestVerification(profileId) {
  return postJson(`${BASE_URL}/verification/admin/request/${profileId}`, { method: "POST", headers: authHeaders() });
}
