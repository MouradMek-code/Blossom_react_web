import FormLogin from "../components/FormLogin";
import PageNav from "../components/PageNav";
import Footer from "../components/Footer";
import styles from "./Homepage.module.css";
export default function Login() {
  return (
    <>
      <div className={styles.head}>
        <PageNav />
        <FormLogin />
      </div>
      <Footer />
    </>
  );
}
