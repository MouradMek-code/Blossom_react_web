import PageNav from "../components/PageNav";
import StartHome from "../components/StartHome";
import LoveCarousel from "../components/LoveCarousel";
import HowItWorks from "../components/HowItWorks";
import StatsCounter from "../components/StatsCounter";
import Testimonials from "../components/Testimonials";
import AppBanner from "../components/AppBanner";
import TrustBadges from "../components/TrustBadges";
import FAQ from "../components/FAQ";
import styles from "./Homepage.module.css";

function Homepage() {
  return (
    <div className={`${styles.head} ${styles.animatedBg}`}>
      <PageNav />
      <StartHome />
      <StatsCounter />
      <LoveCarousel />
      <HowItWorks />
      <TrustBadges />
      <Testimonials />
      <AppBanner />
      <FAQ />
    </div>
  );
}

export default Homepage;
