import { useState } from "react";
import styles from "./FormSignUp.module.css";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import { BASE_URL } from "../api/config";
import { useTranslation } from "react-i18next";
function FormLogin() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  function HandleLogin(e) {
    e.preventDefault();
    async function Login() {
      setError("");
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);
      const requestOptionsLogin = {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      };
      try {
        const resp = await fetch(`${BASE_URL}/login`, requestOptionsLogin);
        const data = await resp.json();
        if (resp.status !== 200)
          throw new Error(`error happeneded on login : ${data.detail}`);
        sessionStorage.setItem("token", data.access_token);
        sessionStorage.setItem("profilecreated", "yes");
        // Check if user has completed profile setup
        const profileResp = await fetch(`${BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        navigate(profileResp.status === 200 ? "/profile" : "/signup");
      } catch (err) {
        setError(err);
      } finally {
        setUsername("");
        setPassword("");
      }
    }
    Login();
  }
  return (
    <div>
      <h1 className={styles.title}>{t("login.title")}</h1>
      <form className={styles.container} onSubmit={(e) => HandleLogin(e)}>
        {error !== "" && (
          <span className={styles.error}>{error.toString()}</span>
        )}
        <div className={styles.group}>
          <label>{t("login.usernamePlaceholder")}</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
          ></input>
        </div>
        <div className={styles.group}>
          <label>{t("login.password")}</label>
          <div className={styles.passwordWrap}>
            <input
              type={showPassword ? "text" : "password"}
              onChange={(e) => setPassword(e.target.value)}
              value={password}
            />
            <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>
        <div className={styles.registerform}>
          <button onClick={(e) => HandleLogin(e)}>{t("login.button")}</button>
        </div>
        <p style={{ textAlign: "center", marginTop: "12px" }}>
          <Link to="/forgot_password">{t("login.forgotPassword")}</Link>
        </p>
      </form>
    </div>
  );
}
export default FormLogin;
