import { NavLink, useNavigate } from "react-router-dom";
import styles from "./PageNav.module.css";
import Logo from "./Logo";
import { useEffect, useState } from "react";
import { BASE_URL } from "../api/config";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "zh", label: "中文" },
  { code: "ar", label: "عربي" },
];

// `minimal` renders just the logo + language switcher with no navigation
// links - used during profile creation, where the user should complete the
// flow rather than be offered Home/Login/Sign-up escape hatches.
function PageNav({ minimal = false }) {
  const { t } = useTranslation();
  const [lang, setLang] = useState(i18n.language?.slice(0, 2) || "en");

  function switchLang(code) {
    i18n.changeLanguage(code);
    setLang(code);
  }

  const navigate = useNavigate();
  const [token, setToken] = useState(sessionStorage.getItem("token"));
  const [menuOpen, setMenuOpen] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const istokenundefined = token === "undefined" || token === null;
  const profileCreated = sessionStorage.getItem("profilecreated");
  const isLoggedInNav = !minimal && istokenundefined !== true && profileCreated === "yes";
  // Only offer Home/Sign-up/Login when there's no session at all. A token
  // without a finished profile means the user is mid-signup, so we show no
  // links rather than a misleading "Login".
  const isLoggedOutNav = !minimal && istokenundefined === true;

  function HandleLogOut() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("profilecreated");
    setToken(null);
    setMenuOpen(false);
    navigate("/login");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  useEffect(() => {
    const storedToken = sessionStorage.getItem("token");
    const storedTokenMissing =
      storedToken === "undefined" || storedToken === null;
    if (storedTokenMissing) return;

    async function fetchCounts() {
      try {
        const [matchedResp, likedResp, userResp] = await Promise.all([
          fetch(`${BASE_URL}/matches/unseen_count`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          }),
          fetch(`${BASE_URL}/likes/profile_likes/unseen_count`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          }),
          fetch(`${BASE_URL}/user/admin/users`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          }),
        ]);
        const matched = matchedResp.ok ? await matchedResp.json() : { count: 0 };
        const liked = likedResp.ok ? await likedResp.json() : { count: 0 };
        setMatchCount(matched.count || 0);
        setLikeCount(liked.count || 0);
        setIsAdmin(userResp.ok);
      } catch (err) {
        // Leave counts at 0 if the backend is unreachable - not worth
        // bouncing the user to login just because a badge couldn't load.
      }
    }

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className={styles.head}>
      <div className={styles.bar}>
        <Logo />

        <button
          type="button"
          className={styles.menuToggle}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          style={minimal ? { display: "none" } : undefined}
        >
          <span
            className={`${styles.menuToggleBar} ${menuOpen ? styles.menuToggleBarTopOpen : ""}`}
          />
          <span
            className={`${styles.menuToggleBar} ${menuOpen ? styles.menuToggleBarMidOpen : ""}`}
          />
          <span
            className={`${styles.menuToggleBar} ${menuOpen ? styles.menuToggleBarBottomOpen : ""}`}
          />
        </button>
      </div>

      <ul
        className={`${styles.nav} ${menuOpen ? styles.navOpen : ""} ${
          isLoggedInNav ? styles.navLoggedIn : ""
        }`}
      >
        {isLoggedInNav && (
          <>
            <span>
              <NavLink
                to="/profile"
                style={{ textDecoration: "none" }}
                onClick={closeMenu}
              >
                {t("nav.yourProfile")}
              </NavLink>
            </span>
            <span>
              <NavLink
                to="/profiles"
                style={{ textDecoration: "none" }}
                onClick={closeMenu}
              >
                {t("nav.browse")}
              </NavLink>
            </span>
            <span>
              <NavLink
                to="/date-spots"
                style={{ textDecoration: "none" }}
                onClick={closeMenu}
              >
                Date spots
              </NavLink>
            </span>
            <span className={styles.navItemWithBadge}>
              <NavLink
                to="/MatchedList"
                style={{ textDecoration: "none" }}
                onClick={closeMenu}
              >
                {t("nav.matched")}
              </NavLink>
              {matchCount > 0 && (
                <span className={styles.badge}>
                  {matchCount > 9 ? "9+" : matchCount}
                </span>
              )}
            </span>
            <span className={styles.navItemWithBadge}>
              <NavLink
                to="/liked_you"
                style={{ textDecoration: "none" }}
                onClick={closeMenu}
              >
                {t("nav.likesYou")}
              </NavLink>
              {likeCount > 0 && (
                <span className={styles.badge}>
                  {likeCount > 9 ? "9+" : likeCount}
                </span>
              )}
            </span>
            {isAdmin && (
              <span>
                <NavLink to="/admin" style={{ textDecoration: "none" }} onClick={closeMenu}>
                  {t("nav.admin")}
                </NavLink>
              </span>
            )}
            <span>
              <button className={styles.logout} onClick={HandleLogOut}>
                {t("nav.logout")}
              </button>
            </span>
          </>
        )}
        {isLoggedOutNav && (
          <span>
            <NavLink
              to="/"
              style={{ textDecoration: "none" }}
              onClick={closeMenu}
            >
              {t("nav.homePage")}
            </NavLink>
          </span>
        )}
        {isLoggedOutNav && (
          <span>
            <NavLink
              to="/date-spots"
              style={{ textDecoration: "none" }}
              onClick={closeMenu}
            >
              Date spots
            </NavLink>
          </span>
        )}
        {isLoggedOutNav && (
          <span>
            <NavLink
              to="/sign_up"
              style={{ textDecoration: "none" }}
              onClick={closeMenu}
            >
              {t("nav.signUp")}
            </NavLink>
          </span>
        )}

        {isLoggedOutNav && (
          <span>
            <NavLink
              to="/login"
              style={{ textDecoration: "none" }}
              onClick={closeMenu}
            >
              {t("nav.login")}
            </NavLink>
          </span>
        )}

        <span className={styles.langSwitcher}>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { switchLang(l.code); closeMenu(); }}
              className={`${styles.langBtn} ${lang === l.code ? styles.langBtnActive : ""}`}
            >
              {l.label}
            </button>
          ))}
        </span>
      </ul>
    </nav>
  );
}

export default PageNav;
