import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import { BASE_URL } from "../api/config";
import { postJson } from "../api/errors";
import styles from "./EnableLocation.module.css";

// Some browsers never answer when the permission window is just closed.
const GIVE_UP_MS = 30000;
const SERVER_WAIT_MS = 15000;

// The browser's approximate position, or null when there's none to be had.
function findPosition() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    const giveUp = setTimeout(() => resolve(null), GIVE_UP_MS);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(giveUp);
        resolve(position.coords);
      },
      () => {
        clearTimeout(giveUp);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 3 * 3600 * 1000 },
    );
  });
}

// { removed, updated } from the server, or null when it couldn't be checked.
async function checkPosition(coords) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SERVER_WAIT_MS);
  try {
    const result = await postJson(`${BASE_URL}/profile/location/coords`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      // Rounded to about a kilometre: the rest isn't needed.
      body: JSON.stringify({ lat: Number(coords.latitude.toFixed(2)), lng: Number(coords.longitude.toFixed(2)) }),
      signal: controller.signal,
    });
    return result.ok ? result.data : null;
  } finally {
    clearTimeout(timer);
  }
}

// The last sign-up step, after the photos, as on Bumble: one page, one button.
// It leads to the browser's own permission window; whatever happens there
// (refused, no position, too slow), the person carries on to Browse.
export default function EnableLocation() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function enable() {
    setBusy(true);
    let result = null;
    try {
      const coords = await findPosition();
      if (coords) result = await checkPosition(coords);
    } catch {
      // Never in the way: sign-up carries on without it.
    }
    if (result?.removed) {
      sessionStorage.clear();
      window.alert(`${t("location.removedTitle")}\n\n${t("location.removedText")}`);
      window.location.assign("/");
      return;
    }
    navigate("/profiles", { replace: true });
  }

  return (
    <div className={styles.page}>
      <PageNav minimal />
      <main className={styles.wrap}>
        <span className={styles.circle} aria-hidden="true">📍</span>
        <h1 className={styles.title}>{t("location.pageTitle")}</h1>
        <p className={styles.text}>{t("location.pageText")}</p>
        <button type="button" className={styles.button} onClick={enable} disabled={busy}>
          {busy ? t("location.pageBusy") : t("location.pageButton")}
        </button>
        <p className={styles.note}>{t("location.pageNote")}</p>
      </main>
    </div>
  );
}
