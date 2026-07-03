import styles from "./TrustBadges.module.css";

const BADGES = [
  { icon: "🔒", label: "End-to-end encrypted" },
  { icon: "🇪🇺", label: "GDPR compliant" },
  { icon: "🚫", label: "No fake profiles" },
  { icon: "❌", label: "Zero ads, ever" },
  { icon: "🗑️", label: "Delete anytime" },
];

export default function TrustBadges() {
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
