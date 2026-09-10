import { useTranslation } from "react-i18next";
import styles from "./AppBanner.module.css";
import { PLAY_STORE_URL } from "../api/links";

export default function AppBanner() {
  const { t } = useTranslation();

  return (
    <section className={styles.section}>
      <div className={styles.text}>
        <h2 className={styles.heading}>{t("appBanner.heading")}</h2>
        <p className={styles.sub}>{t("appBanner.sub")}</p>
        <div className={styles.badges}>
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.badge}
          >
            <span className={styles.badgeIcon}>▶</span>
            <span className={styles.badgeText}>
              <small>{t("appBanner.getItOn")}</small>
              {t("appBanner.googlePlay")}
            </span>
          </a>
          <span className={styles.badgeSoon}>
            <span className={styles.badgeIcon}></span>
            <span className={styles.badgeText}>
              <small>{t("appBanner.comingSoon")}</small>
              {t("appBanner.appStore")}
            </span>
          </span>
        </div>
      </div>
      <div className={styles.mockup}>
        <div className={styles.phone}>
          <div className={styles.phoneScreen}>
            <div className={styles.phoneCard}>
              <div className={styles.phoneAvatar}>🌸</div>
              <div className={styles.phoneMatch}>{t("appBanner.matchTitle")}</div>
              <div className={styles.phoneSub}>{t("appBanner.matchSub")}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
