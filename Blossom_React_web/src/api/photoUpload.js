import { BASE_URL } from "./config";
import { friendlyError } from "./errors";

// A camera photo is 3-5 MB. Sent as is on a slow connection, the upload could
// take so long that the connection dropped before the server answered - the
// photo was saved, yet the page said it failed. Shrunk to 1600px it is ~300 KB.
const MAX_SIDE = 1600;
const TIMEOUT_MS = 90000;

const authHeader = () => ({ Authorization: `Bearer ${sessionStorage.getItem("token")}` });

export function isImageFile(file) {
  // Some files (HEIC on Windows...) come with no type: let the server decide.
  return !file.type || file.type.startsWith("image/");
}

function loadImage(file) {
  if (window.createImageBitmap) {
    return createImageBitmap(file, { imageOrientation: "from-image" });
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

async function shrink(file) {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const image = await loadImage(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height));
    if (scale === 1 && file.size < 1500000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; // transparent PNG -> white, not black
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file; // the browser can't draw it (e.g. HEIC): send the original
  }
}

export class PhotoUploadError extends Error {}

// The photos on the server right now.
export async function fetchOwnPhotos() {
  const resp = await fetch(`${BASE_URL}/profile`, { headers: authHeader() });
  if (!resp.ok) throw new Error(`profile failed with ${resp.status}`);
  const profile = await resp.json();
  return profile.photos || [];
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// A photo on the server that the page doesn't know about yet. The server keeps
// going when the connection drops, so give it a few seconds to finish.
export async function findSavedPhoto(knownIds, { waits = [0, 3000, 5000, 7000] } = {}) {
  for (const wait of waits) {
    if (wait) await sleep(wait);
    try {
      const fresh = (await fetchOwnPhotos()).filter((p) => !knownIds.has(p.id));
      if (fresh.length) return fresh.reduce((a, b) => (b.id > a.id ? b : a));
    } catch {
      // still offline - try again
    }
  }
  return null;
}

async function uploadNow(file, knownIds) {
  // Without the list of photos already there, a lost answer can't be told
  // apart from an old photo - fetch it first.
  if (!knownIds) {
    knownIds = new Set((await fetchOwnPhotos().catch(() => [])).map((p) => p.id));
  }

  const form = new FormData();
  form.append("image", await shrink(file));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let resp = null;
  try {
    resp = await fetch(`${BASE_URL}/profile/image`, {
      method: "POST",
      headers: authHeader(),
      body: form,
      signal: controller.signal,
    });
  } catch {
    // no answer (connection dropped, timed out): checked below
  } finally {
    clearTimeout(timer);
  }

  if (resp?.ok) {
    try {
      const photo = await resp.json();
      if (photo?.id) return photo;
    } catch {
      // answer cut short: checked below
    }
  }
  // A clear "no" from the server (not a photo, no profile yet...).
  if (resp && resp.status >= 400 && resp.status < 500 && resp.status !== 408 && resp.status !== 429) {
    const data = await resp.json().catch(() => null);
    throw new PhotoUploadError(friendlyError(data, resp));
  }
  // Otherwise the answer was lost: the photo may well be saved. Look before
  // telling the person it failed.
  const saved = await findSavedPhoto(knownIds);
  if (saved) return saved;
  throw new PhotoUploadError("");
}

// One upload at a time: quicker on a weak connection, and a photo found on the
// server after a lost answer can only belong to the upload that just ran.
let queue = Promise.resolve();

// Resolves with the saved photo ({ id, image_url }); rejects with a
// PhotoUploadError (message "" = connection trouble).
// knownIds: ids of the photos already shown (null if unknown).
export function uploadPhoto(file, knownIds) {
  const run = queue.then(() => uploadNow(file, knownIds));
  queue = run.catch(() => {});
  return run;
}

export async function deletePhoto(photoId) {
  const resp = await fetch(`${BASE_URL}/profile/image/${photoId}`, {
    method: "DELETE",
    headers: authHeader(),
  });
  // Already gone counts as deleted.
  if (!resp.ok && resp.status !== 404) throw new Error(`delete failed with ${resp.status}`);
}
