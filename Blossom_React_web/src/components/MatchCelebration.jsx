import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IMG } from "../api/images";
import { Button } from "../ui";
import styles from "./MatchCelebration.module.css";

// The match moment (Browse and "Likes you"): both photos, a heart, then the
// choice - write now, or keep browsing. It stays until they choose; Escape or
// a click outside closes it. The app has the same screen.
export default function MatchCelebration({ myPhoto, them, onClose, youWriteFirst = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!them) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [them, onClose]);

  if (!them) return null;
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={t("likesYou.matchTitle")} onClick={onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.photos}>
          {myPhoto && <img src={IMG.thumb(myPhoto)} alt="" className={`${styles.photo} ${styles.left}`} />}
          <img
            src={IMG.card(them.photos?.[0]?.image_url)}
            alt={them.first_name}
            className={`${styles.photo} ${myPhoto ? styles.right : ""}`}
          />
          <span className={styles.heart} aria-hidden="true">💞</span>
        </div>
        <h1 className={styles.title}>{t("likesYou.matchTitle")}</h1>
        <p className={styles.text}>
          {t("likesYou.matchText")} · <strong>{them.first_name}</strong>
        </p>
        {/* Women write first: she's told right here. */}
        {youWriteFirst && <p className={styles.firstMove}>💬 {t("firstMove.celebrate", { name: them.first_name })}</p>}
        <div className={styles.actions}>
          <Button icon="message-circle" onClick={() => navigate("/messages")} autoFocus>
            {youWriteFirst ? t("firstMove.sayHi") : t("likesYou.matchMessage")}
          </Button>
          <button type="button" className={styles.later} onClick={onClose}>
            {t("likesYou.matchKeepGoing")}
          </button>
        </div>
      </div>
    </div>
  );
}
