import { NavLink, useNavigate } from "react-router-dom";
import styles from "./PageNav.module.css";
import Logo from "./Logo";
import { useState } from "react";
function PageNav() {
  const navigate = useNavigate();
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
        {istokenundefined !== true && (
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
