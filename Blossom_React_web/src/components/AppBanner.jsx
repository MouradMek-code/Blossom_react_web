import { Link } from "react-router-dom";
import styles from "./AppBanner.module.css";

export default function AppBanner() {
  return (
    <section className={styles.section}>
      <div className={styles.text}>
        <h2 className={styles.heading}>Take Blossom everywhere 📱</h2>
        <p className={styles.sub}>
          Our mobile app lets you browse, match and chat on the go — available on Android, coming soon on iOS.
        </p>
        <div className={styles.badges}>
          <a
            href="https://play.google.com/store"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.badge}
          >
            <span className={styles.badgeIcon}>▶</span>
            <span className={styles.badgeText}>
              <small>Get it on</small>
              Google Play
            </span>
          </a>
          <span className={styles.badgeSoon}>
            <span className={styles.badgeIcon}></span>
            <span className={styles.badgeText}>
              <small>Coming soon</small>
              App Store
            </span>
          </span>
        </div>
      </div>
      <div className={styles.mockup}>
        <div className={styles.phone}>
          <div className={styles.phoneScreen}>
            <div className={styles.phoneCard}>
              <div className={styles.phoneAvatar}>🌸</div>
              <div className={styles.phoneMatch}>It's a Match!</div>
              <div className={styles.phoneSub}>You both liked each other</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
