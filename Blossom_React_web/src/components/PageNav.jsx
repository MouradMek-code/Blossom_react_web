import { NavLink, useNavigate } from "react-router-dom";
import styles from "./PageNav.module.css";
import Logo from "./Logo";
import { useEffect, useState } from "react";
import { BASE_URL } from "../api/config";
function PageNav() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem("token"));
  const istokenundefined = token === "undefined" || token === null;

  function HandleLogOut() {
    sessionStorage.setItem("token", undefined);
    setToken(null);
    navigate("/login");
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
      <Logo />

      <ul className={styles.nav}>
        {istokenundefined !== true && profile !== null && (
          <>
            <span>
              <NavLink to="/profile" style={{ textDecoration: "none" }}>
                Your Profile
              </NavLink>
            </span>
            <span>
              <NavLink to="/profiles" style={{ textDecoration: "none" }}>
                Profiles
              </NavLink>
            </span>
            <span>
              <NavLink to="/MatchedList" style={{ textDecoration: "none" }}>
                Matched
              </NavLink>
            </span>
            <span>
              <NavLink to="/liked_you" style={{ textDecoration: "none" }}>
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
            <NavLink to="/" style={{ textDecoration: "none" }}>
              HomePage
            </NavLink>
          </span>
        )}
        {istokenundefined === true && (
          <span>
            <NavLink to="/sign_up" style={{ textDecoration: "none" }}>
              Sign Up
            </NavLink>
          </span>
        )}

        {istokenundefined === true && (
          <span>
            <NavLink to="/login" style={{ textDecoration: "none" }}>
              Login
            </NavLink>
          </span>
        )}
      </ul>
    </nav>
  );
}

export default PageNav;
