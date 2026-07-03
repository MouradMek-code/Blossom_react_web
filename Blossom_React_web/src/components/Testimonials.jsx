import { useTranslation } from "react-i18next";
import styles from "./Testimonials.module.css";

const EMOJIS = ["👩‍❤️‍👨", "💑", "🥂"];

export default function Testimonials() {
  const { t } = useTranslation();

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{t("testimonials.heading")}</h2>
      <div className={styles.grid}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={styles.card}>
            <div className={styles.emoji}>{EMOJIS[i]}</div>
            <p className={styles.quote}>"{t(`testimonials.${i}.quote`)}"</p>
            <div className={styles.meta}>
              <strong className={styles.name}>{t(`testimonials.${i}.name`)}</strong>
              <span className={styles.detail}>{t(`testimonials.${i}.detail`)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
