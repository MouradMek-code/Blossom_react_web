import { NavLink, useNavigate } from "react-router-dom";
import styles from "./PageNav.module.css";
import Logo from "./Logo";
import { useEffect, useState } from "react";
import { BASE_URL } from "../api/config";
function PageNav() {
  const navigate = useNavigate();
  const [token, setToken] = useState(sessionStorage.getItem("token"));
  const [menuOpen, setMenuOpen] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const istokenundefined = token === "undefined" || token === null;
  const profileCreated = sessionStorage.getItem("profilecreated");

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
        const [matchedResp, likedResp] = await Promise.all([
          fetch(`${BASE_URL}/matches/unseen_count`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          }),
          fetch(`${BASE_URL}/likes/profile_likes/unseen_count`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          }),
        ]);
        const matched = matchedResp.ok
          ? await matchedResp.json()
          : { count: 0 };
        const liked = likedResp.ok ? await likedResp.json() : { count: 0 };
        setMatchCount(matched.count || 0);
        setLikeCount(liked.count || 0);
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
        >
          <span className={styles.menuToggleBar} />
          <span className={styles.menuToggleBar} />
          <span className={styles.menuToggleBar} />
        </button>
      </div>

      <ul className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`}>
        {istokenundefined !== true && profileCreated === "yes" && (
          <>
            <span>
              <NavLink
                to="/profile"
                style={{ textDecoration: "none" }}
                onClick={closeMenu}
              >
                Your Profile
              </NavLink>
            </span>
            <span>
              <NavLink
                to="/profiles"
                style={{ textDecoration: "none" }}
                onClick={closeMenu}
              >
                Browse
              </NavLink>
            </span>
            <span className={styles.navItemWithBadge}>
              <NavLink
                to="/MatchedList"
                style={{ textDecoration: "none" }}
                onClick={closeMenu}
              >
                Matched
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
                Likes You
              </NavLink>
              {likeCount > 0 && (
                <span className={styles.badge}>
                  {likeCount > 9 ? "9+" : likeCount}
                </span>
              )}
            </span>
            <span>
              <button className={styles.logout} onClick={HandleLogOut}>
                Logout
              </button>
            </span>
          </>
        )}
        {profileCreated === null && (
          <span>
            <NavLink
              to="/"
              style={{ textDecoration: "none" }}
              onClick={closeMenu}
            >
              HomePage
            </NavLink>
          </span>
        )}
        {profileCreated === null && (
          <span>
            <NavLink
              to="/sign_up"
              style={{ textDecoration: "none" }}
              onClick={closeMenu}
            >
              Sign Up
            </NavLink>
          </span>
        )}

        {profileCreated === null && (
          <span>
            <NavLink
              to="/login"
              style={{ textDecoration: "none" }}
              onClick={closeMenu}
            >
              Login
            </NavLink>
          </span>
        )}
      </ul>
    </nav>
  );
}

export default PageNav;
