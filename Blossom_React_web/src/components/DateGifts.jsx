import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BASE_URL } from "../api/config";
import { IMG } from "../api/images";
import { categoryEmoji, categoryGradient } from "../api/categories";
import styles from "./DateGifts.module.css";

const STEPS = [
  { key: "step1", icon: "💞" },
  { key: "step2", icon: "📍" },
  { key: "step3", icon: "🎟️" },
  { key: "step4", icon: "☕" },
];

// Homepage: "Your first date, with a little gift" - the venue gifts explained
// to the people who date, with the gifts open right now. Only real ones: with
// none open, the section shows the steps alone.
export default function DateGifts() {
  const { t, i18n } = useTranslation();
  const [gifts, setGifts] = useState([]);
  // Spaced capitals for Latin scripts only: spacing breaks Arabic's joined letters.
  const latinScript = !/^(ar|zh)/.test(i18n.language || "");

  useEffect(() => {
    let alive = true;
    fetch(`${BASE_URL}/date_spots`)
      .then((resp) => (resp.ok ? resp.json() : []))
      .then((spots) => {
        if (alive && Array.isArray(spots)) setGifts(spots.filter((s) => s.offer).slice(0, 3));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className={styles.section} id="gifts">
      <div className={styles.inner}>
        <p className={`${styles.eyebrow} ${latinScript ? styles.eyebrowLatin : ""}`}>{t("gifts.eyebrow")}</p>
        <h2 className={styles.title}>{t("gifts.title")}</h2>
        <p className={styles.subtitle}>{t("gifts.subtitle")}</p>

        <ol className={styles.steps}>
          {STEPS.map(({ key, icon }, i) => (
            <li key={key} className={styles.step}>
              <span className={styles.stepTop}>
                <span className={styles.stepNumber}>{i + 1}</span>
                <span className={styles.stepIcon} aria-hidden="true">
                  {icon}
                </span>
              </span>
              <strong className={styles.stepTitle}>{t(`gifts.${key}Title`)}</strong>
              <span className={styles.stepText}>{t(`gifts.${key}Text`)}</span>
            </li>
          ))}
        </ol>

        {gifts.length > 0 && (
          <div className={styles.now}>
            <p className={styles.nowTitle}>{t("gifts.nowTitle")}</p>
            <div className={styles.gifts}>
              {gifts.map((spot) => (
                <Link key={spot.id} to={`/date-spots/${spot.id}`} className={styles.gift}>
                  {spot.image_url ? (
                    <img className={styles.giftImage} src={IMG.card(spot.image_url)} alt="" loading="lazy" />
                  ) : (
                    <span
                      className={`${styles.giftImage} ${styles.giftNoImage}`}
                      style={{ background: `linear-gradient(135deg, ${categoryGradient(spot.category).join(", ")})` }}
                      aria-hidden="true"
                    >
                      {categoryEmoji(spot.category)}
                    </span>
                  )}
                  <span className={styles.giftBody}>
                    <span className={styles.giftOffer}>🎁 {spot.offer.title}</span>
                    <span className={styles.giftName}>{spot.name}</span>
                    <span className={styles.giftPlace}>📍 {spot.city}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <Link to="/date-spots?gifts=1" className={styles.button}>
            🎁 {t("gifts.button")}
          </Link>
          <p className={styles.fine}>{t("gifts.fine")}</p>
        </div>

        <Link to="/partner" className={styles.owner}>
          🏪 {t("gifts.owner")} →
        </Link>
      </div>
    </section>
  );
}
