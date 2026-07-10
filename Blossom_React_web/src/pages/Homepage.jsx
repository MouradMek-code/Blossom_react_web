import PageNav from "../components/PageNav";
import StartHome from "../components/StartHome";
import Testimonials from "../components/Testimonials";
import AppBanner from "../components/AppBanner";
import TrustBadges from "../components/TrustBadges";
import FAQ from "../components/FAQ";
import LanguageDating from "../components/LanguageDating";
import Footer from "../components/Footer";
import styles from "./Homepage.module.css";

function Homepage() {
  return (
    <>
      <div className={`${styles.head} ${styles.animatedBg}`}>
        <PageNav />
        <StartHome />
      </div>
      <TrustBadges />
      <LanguageDating />
      <Testimonials />
      <AppBanner />
      <FAQ />
      <Footer />
    </>
  );
}

export default Homepage;
