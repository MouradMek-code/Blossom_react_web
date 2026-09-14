import { useTranslation } from "react-i18next";
import styles from "./FounderProjects.module.css";
import { FINDREWARD_URL, HELPREWARD_URL } from "../api/links";

// Homepage section pointing to the founder's other community projects.
export default function FounderProjects() {
  const { t } = useTranslation();

  const PROJECTS = [
    {
      icon: "🐾",
      name: "findreward.net",
      url: FINDREWARD_URL,
      description: t("founder.findreward"),
    },
    {
      icon: "🤝",
      name: "helpreward.com",
      url: HELPREWARD_URL,
      description: t("founder.helpreward"),
    },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>{t("founder.eyebrow")}</p>
        <h2 className={styles.title}>{t("founder.title")}</h2>
        <p className={styles.subtitle}>{t("founder.subtitle")}</p>

        <div className={styles.grid}>
          {PROJECTS.map((p) => (
            <a
              key={p.name}
              className={styles.card}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.icon} aria-hidden="true">
                {p.icon}
              </span>
              <span className={styles.text}>
                <span className={styles.name}>{p.name}</span>
                <span className={styles.description}>{p.description}</span>
                <span className={styles.visit}>{t("founder.visit")} ↗</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
