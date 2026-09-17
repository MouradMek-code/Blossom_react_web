import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./PageNav.module.css";
import Logo from "./Logo";
import NavIcon from "./NavIcon";
import { BASE_URL } from "../api/config";
import i18n from "../i18n";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "zh", label: "中文" },
  { code: "ar", label: "عربي" },
];

// The four places to go once you're logged in, plus your own profile. Shown
// as links in the bar on a computer and as a bar of tabs at the bottom on a
// phone - the same five the app has.
const TABS = [
  { to: "/profiles", icon: "browse", label: "tabs.browse" },
  { to: "/liked_you", icon: "likes", label: "tabs.likes", badge: "likes" },
  { to: "/date-spots", icon: "spots", label: "tabs.spots" },
  { to: "/messages", icon: "chats", label: "tabs.chats", badge: "chats" },
  { to: "/profile", icon: "profile", label: "tabs.profile" },
];

// `minimal` renders just the logo + language switcher with no navigation
// links - used during profile creation, where the user should complete the
// flow rather than be offered Home/Login/Sign-up escape hatches.
// `hideTabBar` is for the chat page, whose message box needs the bottom.
function PageNav({ minimal = false, hideTabBar = false }) {
  const { t } = useTranslation();
  const [lang, setLang] = useState(i18n.language?.slice(0, 2) || "en");

  function switchLang(code) {
    i18n.changeLanguage(code);
    setLang(code);
  }

  const navigate = useNavigate();
  const [token, setToken] = useState(sessionStorage.getItem("token"));
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [counts, setCounts] = useState({ matches: 0, likes: 0, messages: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const accountRef = useRef(null);
  const istokenundefined = token === "undefined" || token === null;
  const profileCreated = sessionStorage.getItem("profilecreated");
  const isLoggedInNav = !minimal && istokenundefined !== true && profileCreated === "yes";
  // Only offer Home/Sign-up/Login when there's no session at all. A token
  // without a finished profile means the user is mid-signup, so we show no
  // links rather than a misleading "Login".
  const isLoggedOutNav = !minimal && istokenundefined === true;
  const showTabBar = isLoggedInNav && !hideTabBar;
  // New matches and unread chats both live on the chats tab.
  const chatsBadge = counts.messages + counts.matches;

  function HandleLogOut() {
    if (!window.confirm(t("settings.logoutTitle"))) return;
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("profilecreated");
    setToken(null);
    setAccountOpen(false);
    setMenuOpen(false);
    navigate("/login");
  }

  function closeMenu() {
    setMenuOpen(false);
    setAccountOpen(false);
  }

  // Room at the bottom of the page so the tab bar never covers the last of
  // the content (phone widths only - see the stylesheet).
  useEffect(() => {
    if (!showTabBar) return undefined;
    document.body.classList.add("has-tabbar");
    return () => document.body.classList.remove("has-tabbar");
  }, [showTabBar]);

  // Clicking away from the account menu, or pressing Escape, closes it.
  useEffect(() => {
    if (!accountOpen) return undefined;
    function onPointerDown(event) {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === "Escape") setAccountOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountOpen]);

  useEffect(() => {
    const storedToken = sessionStorage.getItem("token");
    const storedTokenMissing =
      storedToken === "undefined" || storedToken === null;
    if (storedTokenMissing) return;

    const headers = { Authorization: `Bearer ${storedToken}` };

    // Backends from before /user/badges: the old four requests (the admin
    // check downloads the whole user list, hence the switch).
    async function legacyCounts() {
      const [matchedResp, likedResp, userResp, messagesResp] = await Promise.all([
        fetch(`${BASE_URL}/matches/unseen_count`, { headers }),
        fetch(`${BASE_URL}/likes/profile_likes/unseen_count`, { headers }),
        fetch(`${BASE_URL}/user/admin/users`, { headers }),
        fetch(`${BASE_URL}/messages/unread_count`, { headers }),
      ]);
      const matched = matchedResp.ok ? await matchedResp.json() : { count: 0 };
      const liked = likedResp.ok ? await likedResp.json() : { count: 0 };
      const unread = messagesResp.ok ? await messagesResp.json() : { count: 0 };
      return {
        matches: matched.count,
        likes: liked.count,
        messages: unread.count,
        is_admin: userResp.ok,
      };
    }

    // All three badges and the admin flag in one request.
    async function fetchCounts() {
      try {
        const resp = await fetch(`${BASE_URL}/user/badges`, { headers });
        // An old backend reads "badges" as a user id (422) or doesn't know it.
        const data = resp.ok ? await resp.json() : await legacyCounts();
        setCounts({
          matches: data.matches || 0,
          likes: data.likes || 0,
          messages: data.messages || 0,
        });
        setIsAdmin(Boolean(data.is_admin));
      } catch (err) {
        // Leave counts at 0 if the backend is unreachable - not worth
        // bouncing the user to login just because a badge couldn't load.
      }
    }

    fetchCounts();
    // Background tabs don't poll; coming back to the tab refreshes at once.
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchCounts();
    }, 30000);
    function onVisible() {
      if (document.visibilityState === "visible") fetchCounts();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  function badgeFor(tab) {
    if (tab.badge === "likes") return counts.likes;
    if (tab.badge === "chats") return chatsBadge;
    return 0;
  }

  return (
    <>
      <nav className={styles.head}>
        <div className={styles.bar}>
          <Logo />

          {isLoggedInNav && (
            <ul className={styles.mainLinks}>
              {TABS.filter((tab) => tab.to !== "/profile").map((tab) => (
                <li key={tab.to} className={styles.mainLinkItem}>
                  <NavLink to={tab.to} className={styles.mainLink} onClick={closeMenu}>
                    {t(tab.label)}
                  </NavLink>
                  {badgeFor(tab) > 0 && (
                    <span className={styles.badge}>
                      {badgeFor(tab) > 9 ? "9+" : badgeFor(tab)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {isLoggedInNav && (
            <div className={styles.account} ref={accountRef}>
              <button
                type="button"
                className={styles.accountBtn}
                onClick={() => setAccountOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                aria-label={t("menu.open")}
              >
                <NavIcon name="profile" size={20} />
              </button>

              {accountOpen && (
                <div className={styles.menu} role="menu">
                  <NavLink to="/profile" className={styles.menuItem} role="menuitem" onClick={closeMenu}>
                    <NavIcon name="profile" size={18} />
                    {t("menu.profile")}
                  </NavLink>
                  <NavLink to="/settings" className={styles.menuItem} role="menuitem" onClick={closeMenu}>
                    <NavIcon name="settings" size={18} />
                    {t("settings.title")}
                  </NavLink>
                  {isAdmin && (
                    <NavLink to="/admin" className={styles.menuItem} role="menuitem" onClick={closeMenu}>
                      {t("nav.admin")}
                    </NavLink>
                  )}
                  <button
                    type="button"
                    className={`${styles.menuItem} ${styles.menuDanger}`}
                    role="menuitem"
                    onClick={HandleLogOut}
                  >
                    <NavIcon name="logout" size={18} />
                    {t("settings.logout")}
                  </button>
                </div>
              )}
            </div>
          )}

          {!isLoggedInNav && (
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
          )}
        </div>

        {!isLoggedInNav && (
          <ul className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`}>
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
                  {t("nav.dateSpots")}
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
        )}
      </nav>

      {showTabBar && (
        <nav className={styles.tabBar} aria-label={t("menu.open")}>
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ""}`}
            >
              <span className={styles.tabIcon}>
                <NavIcon name={tab.icon} size={22} />
                {badgeFor(tab) > 0 && (
                  <span className={styles.tabBadge}>
                    {badgeFor(tab) > 9 ? "9+" : badgeFor(tab)}
                  </span>
                )}
              </span>
              <span className={styles.tabLabel}>{t(tab.label)}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </>
  );
}

export default PageNav;
