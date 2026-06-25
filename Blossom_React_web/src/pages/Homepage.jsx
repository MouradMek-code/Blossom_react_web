import PageNav from "../components/PageNav";
import StartHome from "../components/StartHome";
import HowItWorks from "../components/HowItWorks";
import styles from "./Homepage.module.css";
function Homepage() {
  return (
    <div className={`${styles.head} ${styles.animatedBg}`}>
      <PageNav />
      <StartHome />
    </div>
  );
}

export default Homepage;
