import { Link } from "react-router-dom";
import styles from "./StartHome.module.css";

function StartHome() {
  const token = sessionStorage.getItem("token");
  const istokenundefined = token === "undefined" || token === null;
  return (
    <div className={styles.center}>
      <h1 className={styles.title}>Meet your dating soul TODAY !!</h1>
      <h1 className={styles.subtitle}>Free Fast Account</h1>
      <h2 className={styles.tagline}>swipe → chat → maybe meet</h2>
      {istokenundefined === true && (
        <Link to="sign_up" className={styles.cta}>
          Start Dating Now ❤️
        </Link>
      )}
    </div>
  );
}

export default StartHome;
