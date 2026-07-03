import { useTranslation } from "react-i18next";
import styles from "./TrustBadges.module.css";

export default function TrustBadges() {
  const { t } = useTranslation();

  const BADGES = [
    { icon: "🔒", label: t("trust.encrypted") },
    { icon: "🇪🇺", label: t("trust.gdpr") },
    { icon: "🚫", label: t("trust.noFake") },
    { icon: "❌", label: t("trust.noAds") },
    { icon: "🗑️", label: t("trust.delete") },
  ];

  return (
    <div className={styles.bar}>
      {BADGES.map((b) => (
        <div key={b.label} className={styles.badge}>
          <span className={styles.icon}>{b.icon}</span>
          <span className={styles.label}>{b.label}</span>
        </div>
      ))}
    </div>
  );
}
