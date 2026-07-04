import { Link } from "react-router-dom";
import styles from "./StartHome.module.css";
import { useTranslation } from "react-i18next";

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
      <h1 className={styles.subtitle}>{t("home.subtitle")}</h1>
      <h2 className={styles.tagline}>{t("home.tagline")}</h2>
      {istokenundefined === true && (
        <Link to="sign_up" className={styles.cta}>
          {t("home.cta")}
        </Link>
      )}
      <p className={styles.trustLine}>{t("home.trustLine")}</p>
    </div>
  );
}

export default StartHome;
