import { useTranslation } from "react-i18next";
import { INSTAGRAM_URL } from "../api/links";
import styles from "./InstagramBand.module.css";

// The Instagram glyph, drawn inline (no icon package).
export function InstagramIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Homepage: "Follow Blossom on Instagram" - @blossomfordate.
export default function InstagramBand() {
  const { t } = useTranslation();
  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <span className={styles.badge}>
          <InstagramIcon size={30} />
        </span>
        <div className={styles.text}>
          <h2 className={styles.title}>{t("social.title")}</h2>
          <p className={styles.body}>{t("social.text")}</p>
        </div>
        <a className={styles.button} href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
          <InstagramIcon size={18} />
          {t("social.button")}
        </a>
      </div>
    </section>
  );
}
