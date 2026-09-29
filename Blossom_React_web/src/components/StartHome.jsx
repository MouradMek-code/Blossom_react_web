import { Link } from "react-router-dom";
import styles from "./StartHome.module.css";
import { useTranslation } from "react-i18next";
import NavIcon from "./NavIcon";

function StartHome() {
  const { t } = useTranslation();
  const token = sessionStorage.getItem("token");
  const istokenundefined = token === "undefined" || token === null;
  return (
    <div className={styles.center}>
      <h1 className={styles.title}>{t("home.title")}</h1>
      <div className={styles.floatingBadge}>
        <span className={styles.badgeDot} />
        {t("home.langBadge")}
      </div>
      <p className={styles.subtitle}>{t("home.subtitle")}</p>
      <p className={styles.tagline}>{t("home.tagline")}</p>
      <div className={styles.actions}>
        {istokenundefined === true && (
          <Link to="/sign_up" className={styles.cta}>
            {t("home.cta")}
          </Link>
        )}
        <Link to="/date-spots" className={styles.ctaSpots}>
          <NavIcon name="spots" size={20} />
          {t("home.ctaSpots")}
        </Link>
      </div>
      {/* The venue gifts, explained further down (DateGifts). */}
      <a
        href="#gifts"
        className={styles.giftLine}
        onClick={(e) => {
          const section = document.getElementById("gifts");
          if (!section) return;
          e.preventDefault();
          section.scrollIntoView({ behavior: "smooth" });
        }}
      >
        🎁 {t("gifts.heroLine")} <span aria-hidden="true">↓</span>
      </a>
      <p className={styles.trustLine}>{t("home.trustLine")}</p>
    </div>
  );
}

export default StartHome;
