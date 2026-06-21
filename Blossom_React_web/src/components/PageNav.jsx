import { NavLink, useNavigate } from "react-router-dom";
import styles from "./PageNav.module.css";
import Logo from "./Logo";
import { useEffect, useState } from "react";
import { BASE_URL } from "../api/config";
function PageNav() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem("token"));
  const [menuOpen, setMenuOpen] = useState(false);
  const istokenundefined = token === "undefined" || token === null;

  function HandleLogOut() {
    sessionStorage.setItem("token", undefined);
    setToken(null);
    setMenuOpen(false);
    navigate("/login");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  useEffect(() => {
    const storedToken = sessionStorage.getItem("token");
    const storedTokenMissing = storedToken === "undefined" || storedToken === null;

    async function fetchProfile() {
      if (storedTokenMissing) {
        return;
      }
      try {
        const resp = await fetch(`${BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        const data = await resp.json();
        if (resp.status !== 200)
          throw new Error(`error happeneded on login : ${data.detail[0].msg}`);
        setProfile(data);
      } catch (err) {
        if (!storedTokenMissing) {
          setToken(null);
        }
      }
    }

    fetchProfile();
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
        {istokenundefined !== true && profile !== null && (
          <>
            <span>
              <NavLink to="/profile" style={{ textDecoration: "none" }} onClick={closeMenu}>
                Your Profile
              </NavLink>
            </span>
            <span>
              <NavLink to="/profiles" style={{ textDecoration: "none" }} onClick={closeMenu}>
                Profiles
              </NavLink>
            </span>
            <span>
              <NavLink to="/MatchedList" style={{ textDecoration: "none" }} onClick={closeMenu}>
                Matched
              </NavLink>
            </span>
            <span>
              <NavLink to="/liked_you" style={{ textDecoration: "none" }} onClick={closeMenu}>
                Likes You
              </NavLink>
            </span>
            <span>
              <button className={styles.logout} onClick={HandleLogOut}>
                Logout
              </button>
            </span>
          </>
        )}
        {istokenundefined === true && (
          <span>
            <NavLink to="/" style={{ textDecoration: "none" }} onClick={closeMenu}>
              HomePage
            </NavLink>
          </span>
        )}
        {istokenundefined === true && (
          <span>
            <NavLink to="/sign_up" style={{ textDecoration: "none" }} onClick={closeMenu}>
              Sign Up
            </NavLink>
          </span>
        )}

        {istokenundefined === true && (
          <span>
            <NavLink to="/login" style={{ textDecoration: "none" }} onClick={closeMenu}>
              Login
            </NavLink>
          </span>
        )}
      </ul>
    </nav>
  );
}

export default PageNav;
