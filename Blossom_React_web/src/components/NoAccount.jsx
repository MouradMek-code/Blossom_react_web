import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./NoAccount.module.css";

// Accounts are for people who want to date. Cafés and restaurants never need
// one: these say so where it matters.

// Under the title of the venue pages (partner form, For venues).
export function NoAccountBadge() {
  const { t } = useTranslation();
  return <p className={styles.badge}>{t("business.noAccount")}</p>;
}

// On sign-up and log-in: a café owner who took the wrong door.
export function VenueNotice() {
  const { t } = useTranslation();
  return (
    <p className={styles.notice}>
      {t("business.membersOnly")}{" "}
      <Link to="/business">
        🏪 {t("business.venueNoAccount")} → {t("business.navLink")}
      </Link>
    </p>
  );
}
