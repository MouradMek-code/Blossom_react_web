import { BASE_URL } from "./config";
import { postJson } from "./errors";
import { shrink } from "./photoUpload";
import { getAuth } from "./session";

const authHeader = () => ({ Authorization: `Bearer ${getAuth("token")}` });

// An open chat's poll: the messages, whether they're typing, when they were
// last on Blossom, whether photos can be sent yet. A server without /live yet
// (deploy in progress) gets the plain list instead, and isn't asked again.
let liveMissing = false;

export async function fetchChat(conversationId) {
  if (!liveMissing) {
    const resp = await fetch(`${BASE_URL}/messages/conversation/${conversationId}/live`, { headers: authHeader() });
    if (resp.ok) {
      const data = await resp.json();
      return {
        messages: data.messages || [],
        typing: Boolean(data.typing),
        lastActiveAt: data.last_active_at || null,
        photosAllowed: Boolean(data.photos_allowed),
      };
    }
    const body = resp.status === 404 ? await resp.json().catch(() => null) : null;
    if (body?.detail !== "Not Found") return null;
    liveMissing = true;
  }
  const resp = await fetch(`${BASE_URL}/messages/conversation/${conversationId}`, { headers: authHeader() });
  if (!resp.ok) return null;
  return { messages: await resp.json(), typing: false, lastActiveAt: null, photosAllowed: false };
}

// "Typing..." on the other side. Fire and forget: it doesn't matter if one
// is lost.
export function sendTyping(conversationId) {
  fetch(`${BASE_URL}/messages/conversation/${conversationId}/typing`, {
    method: "POST",
    headers: authHeader(),
  }).catch(() => {});
}

// A photo from the computer or phone, shrunk first.
// { ok, data: message, message: error text }
export async function sendChatPhoto(conversationId, file) {
  const form = new FormData();
  form.append("image", await shrink(file));
  return postJson(`${BASE_URL}/messages/conversation/${conversationId}/photo`, {
    method: "POST",
    headers: authHeader(),
    body: form,
  });
}
