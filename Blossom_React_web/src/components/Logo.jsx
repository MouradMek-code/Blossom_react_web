import { NavLink } from "react-router-dom";
import styles from "./Logo.module.css";
function Logo() {
  return (
    <NavLink className={styles.image} to="/" style={{ textDecoration: "none" }}>
      <img src="/LogoBlossom.png" alt="LogoBlossom.png"></img>
    </NavLink>
  );
}
export default Logo;
