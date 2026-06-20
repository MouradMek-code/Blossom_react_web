import { Link, NavLink } from "react-router-dom";
import PageNav from "../components/PageNav";
import StartHome from "../components/StartHome";
import styles from "./Homepage.module.css";
function Homepage() {
  return (
    <div className={styles.head}>
      <PageNav />
      <StartHome />
    </div>
  );
}

export default Homepage;
