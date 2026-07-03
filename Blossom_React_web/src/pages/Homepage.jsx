import PageNav from "../components/PageNav";
import StartHome from "../components/StartHome";
import HowItWorks from "../components/HowItWorks";
import Testimonials from "../components/Testimonials";
import AppBanner from "../components/AppBanner";
import TrustBadges from "../components/TrustBadges";
import FAQ from "../components/FAQ";
import styles from "./Homepage.module.css";

function Homepage() {
  return (
    <>
      <div className={`${styles.head} ${styles.animatedBg}`}>
        <PageNav />
        <StartHome />
      </div>
      <HowItWorks />
      <TrustBadges />
      <Testimonials />
      <AppBanner />
      <FAQ />
    </>
  );
}

export default Homepage;
