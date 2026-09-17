import { Navigate } from "react-router-dom";
import PageNav from "../components/PageNav";
import StartHome from "../components/StartHome";
import Testimonials from "../components/Testimonials";
import AppBanner from "../components/AppBanner";
import TrustBadges from "../components/TrustBadges";
import FAQ from "../components/FAQ";
import LanguageDating from "../components/LanguageDating";
import FounderProjects from "../components/FounderProjects";
import Footer from "../components/Footer";
import styles from "./Homepage.module.css";

function Homepage() {
  // The homepage is for visitors. Someone logged in goes straight to Browse,
  // or back into sign-up if their profile isn't finished yet.
  const token = sessionStorage.getItem("token");
  if (token && token !== "undefined" && token !== "null") {
    const finished = sessionStorage.getItem("profilecreated") === "yes";
    return <Navigate to={finished ? "/profiles" : "/sign_up"} replace />;
  }

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
      <FounderProjects />
      <Footer />
    </>
  );
}

export default Homepage;
