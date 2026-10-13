import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BASE_URL } from "../api/config";
import { postJson } from "../api/errors";
import { IMG } from "../api/images";
import { categoryEmoji, categoryGradient, shortPlace } from "../api/categories";
import styles from "./SavedSpots.module.css";

// "♡ My saved places" on your profile: the spots you saved, latest first.
// Tap one to open it (and invite a match from there); ♥ removes it.
export default function SavedSpots() {
  const { t } = useTranslation();
  const token = sessionStorage.getItem("token");
  const [spots, setSpots] = useState(null);

  useEffect(() => {
    let alive = true;
    postJson(`${BASE_URL}/date_spots/saved`, { headers: { Authorization: `Bearer ${token}` } }).then((result) => {
      if (alive) setSpots(result.ok ? result.data : []);
    });
    return () => {
      alive = false;
    };
  }, [token]);

  async function unsave(spot) {
    setSpots((cur) => cur.filter((s) => s.id !== spot.id));
    const result = await postJson(`${BASE_URL}/date_spots/${spot.id}/save`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!result.ok) setSpots((cur) => [spot, ...cur]);
  }

  return (
    <section className="card">
      <h2>{t("dateSpots.savedTitle")}</h2>
      {spots === null ? (
        <p className={styles.muted}>…</p>
      ) : spots.length === 0 ? (
        <p className={styles.empty}>
          {t("dateSpots.savedEmpty")}{" "}
          <Link to="/date-spots">{t("dateSpots.savedSeeAll")}</Link>
        </p>
      ) : (
        <ul className={styles.row}>
          {spots.map((spot) => (
            <li key={spot.id} className={styles.item}>
              <Link to={`/date-spots/${spot.id}`} className={styles.card}>
                {spot.image_url ? (
                  <img src={IMG.card(spot.image_url)} alt="" loading="lazy" />
                ) : (
                  <span
                    className={styles.noPhoto}
                    style={{ background: `linear-gradient(135deg, ${categoryGradient(spot.category).join(", ")})` }}
                  >
                    {categoryEmoji(spot.category)}
                  </span>
                )}
                {spot.offer && <span className={styles.gift}>🎁 {spot.offer.title}</span>}
                <span className={styles.info}>
                  <strong>{spot.name}</strong>
                  <small>📍 {shortPlace(spot)}</small>
                </span>
              </Link>
              <button
                type="button"
                className={styles.heart}
                onClick={() => unsave(spot)}
                aria-label={t("dateSpots.saved")}
                title={t("dateSpots.saved")}
              >
                ♥
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
