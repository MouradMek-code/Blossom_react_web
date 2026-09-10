import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./Footer.module.css";

import { PLAY_STORE_URL, SUPPORT_EMAIL } from "../api/links";

function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.wordmark}>
            Blossom <span className={styles.bloom}>🌸</span>
          </div>
          <p className={styles.blurb}>Where she always makes the first move.</p>
          <a
            className={styles.storeBtn}
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className={styles.storeIcon}>▶</span>
            <span>
              <small>GET IT ON</small>
              <strong>Google Play</strong>
            </span>
          </a>
        </div>

        {/* Product */}
        <nav className={styles.col}>
          <h4>Product</h4>
          <Link to="/profiles">Browse</Link>
          <Link to="/date-spots">{t("nav.dateSpots")}</Link>
          <Link to="/sign_up">Sign up</Link>
          <Link to="/login">Log in</Link>
        </nav>

        {/* Company / Legal */}
        <nav className={styles.col}>
          <h4>Company</h4>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms">Terms &amp; 18+</Link>
          <Link to="/delete-account">Delete account</Link>
          <a href={`mailto:${SUPPORT_EMAIL}`}>Contact</a>
        </nav>
      </div>

      <div className={styles.bottomBar}>
        <span>© {year} Blossom</span>
        <span className={styles.dot}>·</span>
        <span>Made with love</span>
        <span className={styles.dot}>·</span>
        <span>18+ only</span>
      </div>
    </footer>
  );
}

export default Footer;
