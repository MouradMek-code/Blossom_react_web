import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./Footer.module.css";
import { BlossomMark } from "./Logo";

import { INSTAGRAM_HANDLE, INSTAGRAM_URL, PLAY_STORE_URL, SUPPORT_EMAIL } from "../api/links";
import { InstagramIcon } from "./InstagramBand";

function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.wordmark}>
            <BlossomMark size={34} />
            Blossom
          </div>
          <p className={styles.blurb}>{t("footer.blurb")}</p>
          <a
            className={styles.storeBtn}
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className={styles.storeIcon}>▶</span>
            <span>
              <small>{t("footer.getItOn")}</small>
              <strong>Google Play</strong>
            </span>
          </a>
          <a className={styles.instagram} href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
            <InstagramIcon size={18} />
            <span>@{INSTAGRAM_HANDLE}</span>
          </a>
        </div>

        {/* Product */}
        <nav className={styles.col}>
          <h4>{t("footer.product")}</h4>
          <Link to="/profiles">{t("footer.browse")}</Link>
          <Link to="/date-spots">{t("nav.dateSpots")}</Link>
          <Link to="/partner">{t("partners.link")}</Link>
          <Link to="/business">{t("business.navLink")}</Link>
          <Link to="/sign_up">{t("footer.signUp")}</Link>
          <Link to="/login">{t("footer.logIn")}</Link>
        </nav>

        {/* Company / Legal */}
        <nav className={styles.col}>
          <h4>{t("footer.company")}</h4>
          <Link to="/privacy-policy">{t("footer.privacy")}</Link>
          <Link to="/terms">{t("footer.terms")}</Link>
          <Link to="/delete-account">{t("footer.deleteAccount")}</Link>
          <a href={`mailto:${SUPPORT_EMAIL}`}>{t("footer.contact")}</a>
        </nav>
      </div>

      <div className={styles.bottomBar}>
        <span>© {year} Blossom</span>
        <span className={styles.dot}>·</span>
        <span>{t("footer.madeWithLove")}</span>
        <span className={styles.dot}>·</span>
        <span>{t("footer.adults")}</span>
      </div>
    </footer>
  );
}

export default Footer;
