import { Link } from "react-router-dom";
import styles from "./StartHome.module.css";

function StartHome() {
  const token = sessionStorage.getItem("token");
  const istokenundefined = token === "undefined" || token === null;
  return (
    <div className={styles.center}>
      <h1 className={styles.title}>Stop swiping. Start dating.</h1>
      <h1 className={styles.subtitle}>Real plans, not endless chats</h1>
      <h2 className={styles.tagline}>Pick a date, not just a face</h2>
      {istokenundefined === true && (
        <Link to="sign_up" className={styles.cta}>
          Start Dating Now ❤️
        </Link>
      )}
    </div>
  );
}

export default StartHome;
