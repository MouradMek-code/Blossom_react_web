import { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./FAQ.module.css";

export default function FAQ() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{t("faq.heading")}</h2>
      <div className={styles.list}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`${styles.item} ${open === i ? styles.itemOpen : ""}`}>
            <button className={styles.question} onClick={() => setOpen(open === i ? null : i)}>
              <span>{t(`faq.${i}.q`)}</span>
              <span className={styles.chevron}>{open === i ? "−" : "+"}</span>
            </button>
            {open === i && <p className={styles.answer}>{t(`faq.${i}.a`)}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
