import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./ForVenues.module.css";

// Homepage: "For cafés & restaurants" - where venue owners find the way to
// offer a promotion to Blossom couples.
export default function ForVenues() {
  const { t } = useTranslation();
  return (
    <section className={styles.section} id="for-venues">
      <div className={styles.card}>
        <span className={styles.icon} aria-hidden="true">🏪</span>
        <div className={styles.text}>
          <h2 className={styles.title}>{t("business.homeTitle")}</h2>
          <p className={styles.body}>{t("business.homeText")}</p>
          <div className={styles.actions}>
            <Link to="/partner" className={styles.primary}>
              {t("business.homeButton")}
            </Link>
            <Link to="/business" className={styles.secondary}>
              {t("business.homeMore")} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
