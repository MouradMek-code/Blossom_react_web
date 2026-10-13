import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BlossomMark } from "./Logo";
import { IMG } from "../api/images";
import { bestForLabel, categoryEmoji, categoryGradient, categoryLabel, fullPlace } from "../api/categories";
import styles from "./SpotPhotoMode.module.css";

// Shown as a social proof line only once a place has real attention.
const MIN_VIEWS_SHOWN = 30;

// "📸 Photo mode": a spot as a clean, story-shaped (9:16) poster made for a
// screenshot - photo, name, place, the gift, the description, the Blossom
// brand - with no buttons. Venues reading the post get the how-to and a link
// to offer couples a treat themselves. A click anywhere else closes it.
export default function SpotPhotoMode({ spot, onClose }) {
  const { t } = useTranslation();

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const tags = [
    spot.category && `${categoryEmoji(spot.category)} ${categoryLabel(spot.category, t)}`,
    ...(spot.best_for || []).slice(0, 2).map((b) => bestForLabel(b, t)),
  ].filter(Boolean);
  const partnerLink = spot.offer ? "/partner" : `/partner?spot=${spot.id}`;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label={spot.name}>
      <article className={styles.poster}>
        <div className={styles.photo}>
          {spot.image_url ? (
            <img src={IMG.full(spot.image_url)} alt="" />
          ) : (
            <div
              className={styles.noPhoto}
              style={{ background: `linear-gradient(135deg, ${categoryGradient(spot.category).join(", ")})` }}
            >
              {categoryEmoji(spot.category)}
            </div>
          )}
          <div className={styles.scrim} />
          <div className={styles.brandTop}>
            <BlossomMark size={20} petal="#fff" heart="var(--primary)" />
            Blossom
          </div>
          {spot.offer && <div className={styles.giftRibbon}>{t("dateSpots.giftRibbon")}</div>}
          <div className={styles.titleBox}>
            {tags.length > 0 && <p className={styles.tags}>{tags.join(" · ")}</p>}
            <h2 className={styles.name}>{spot.name}</h2>
            <p className={styles.place}>📍 {fullPlace(spot)}</p>
          </div>
        </div>

        <div className={styles.body}>
          {spot.offer && (
            <div className={styles.gift}>
              <span className={styles.giftLabel}>{t("photoMode.couplesGet")}</span>
              <strong className={styles.giftTitle}>🎁 {spot.offer.title}</strong>
              <span className={styles.giftHow}>{t("photoMode.giftHow")}</span>
            </div>
          )}

          {spot.description && <blockquote className={styles.quote}>“{spot.description}”</blockquote>}

          {(spot.best_for?.length > 0 || spot.view_count >= MIN_VIEWS_SHOWN) && (
            <p className={styles.facts}>
              {spot.best_for?.length > 0 && (
                <span>
                  💞 {t("photoMode.perfectFor")} {spot.best_for.map((b) => bestForLabel(b, t)).join(", ")}
                </span>
              )}
              {spot.view_count >= MIN_VIEWS_SHOWN && <span>{t("photoMode.views", { count: spot.view_count })}</span>}
            </p>
          )}

          {/* For venues reading the post: how it works, and the way in. */}
          <Link to={partnerLink} className={styles.venue} onClick={(e) => e.stopPropagation()}>
            <strong className={styles.venueTitle}>
              🏪 {spot.offer ? t("photoMode.venueTitleOther") : t("photoMode.venueTitle")}
            </strong>
            <span className={styles.venueIdeas}>{t("photoMode.venueIdeas")}</span>
            <ol className={styles.steps}>
              <li>{t("partners.how1")}</li>
              <li>{t("partners.how2")}</li>
              <li>{t("partners.how3")}</li>
            </ol>
            <span className={styles.venueCta}>
              {t("photoMode.venueCta")} <span>blossom-date.com/partner</span>
            </span>
          </Link>

          <footer className={styles.footer}>
            <BlossomMark size={38} />
            <div className={styles.footerText}>
              <strong>Blossom</strong>
              <span>{t("photoMode.tagline")}</span>
            </div>
            <div className={styles.footerLinks}>
              <span>@blossomfordate</span>
              <span>blossom-date.com</span>
            </div>
          </footer>
        </div>
      </article>
      <p className={styles.hint}>{t("photoMode.hint")}</p>
    </div>
  );
}
