import { BASE_URL } from "./config";

// The public date spots (no login needed), fetched once per page load and
// shared: the homepage's spots wallpaper and its gifts section both use them.
let pending = null;

export function loadPublicSpots() {
  if (!pending) {
    pending = fetch(`${BASE_URL}/date_spots`)
      .then((resp) => (resp.ok ? resp.json() : []))
      .then((spots) => (Array.isArray(spots) ? spots : []))
      .catch(() => {
        pending = null; // try again next time
        return [];
      });
  }
  return pending;
}

// "Spot of the week" (picked by an admin, or the most saved this week), or
// null. Fetched once, like the list.
let pendingFeatured = null;

export function loadFeaturedSpot() {
  if (!pendingFeatured) {
    pendingFeatured = fetch(`${BASE_URL}/date_spots/featured`)
      .then((resp) => (resp.ok ? resp.json() : null))
      .then((data) => data?.spot || null)
      .catch(() => {
        pendingFeatured = null;
        return null;
      });
  }
  return pendingFeatured;
}
