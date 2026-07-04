import { useTranslation } from "react-i18next";
import styles from "./LanguageDating.module.css";

const PAIRS = [
  { flag: "🇯🇵", lang: "Japanese", emoji: "🌸" },
  { flag: "🇫🇷", lang: "French",   emoji: "🥐" },
  { flag: "🇧🇷", lang: "Portuguese", emoji: "☀️" },
  { flag: "🇰🇷", lang: "Korean",   emoji: "✨" },
  { flag: "🇮🇹", lang: "Italian",  emoji: "🍕" },
  { flag: "🇸🇦", lang: "Arabic",   emoji: "🌙" },
];

export default function LanguageDating() {
  const { t } = useTranslation();
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <span className={styles.badge}>{t("languageDating.badge")}</span>
        <h2 className={styles.heading}>{t("languageDating.heading")}</h2>
        <p className={styles.sub}>{t("languageDating.sub")}</p>

        <div className={styles.pills}>
          {PAIRS.map(({ flag, lang, emoji }) => (
            <div key={lang} className={styles.pill}>
              <span className={styles.flag}>{flag}</span>
              <span className={styles.pillLang}>{lang}</span>
              <span className={styles.pillEmoji}>{emoji}</span>
            </div>
          ))}
        </div>

        <p className={styles.cta}>{t("languageDating.cta")}</p>
      </div>
    </section>
  );
}
