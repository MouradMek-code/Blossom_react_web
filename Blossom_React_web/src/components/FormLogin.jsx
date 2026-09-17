import { useState } from "react";
import styles from "./FormSignUp.module.css";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import { BASE_URL } from "../api/config";
import { postJson, NETWORK_ERROR } from "../api/errors";
import { useTranslation } from "react-i18next";
function FormLogin() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  function HandleLogin(e) {
    e.preventDefault();
    async function Login() {
      setError("");

      // Client-side checks first so we never bother the server with
      // obviously-incomplete input and can show an instant, clear message.
      if (!username.trim()) {
        setError("Please enter your username or email.");
        return;
      }
      if (!password) {
        setError("Please enter your password.");
        return;
      }

      setSubmitting(true);
      const formData = new URLSearchParams();
      formData.append("username", username.trim());
      formData.append("password", password);

      const result = await postJson(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      if (!result.ok) {
        setError(result.message);
        setPassword("");
        setSubmitting(false);
        return;
      }

      const data = result.data;
      sessionStorage.setItem("token", data.access_token);

      // Finished profile -> straight to Browse; otherwise resume sign-up.
      let profileResp;
      try {
        profileResp = await fetch(`${BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
      } catch {
        setError(NETWORK_ERROR);
        setSubmitting(false);
        return;
      }
      if (profileResp.status === 200) {
        // Only now: this flag switches on the logged-in menu, and used to be
        // set even for people who hadn't finished their profile.
        sessionStorage.setItem("profilecreated", "yes");
        const profile = await profileResp.json().catch(() => null);
        if (profile?.id) sessionStorage.setItem("profile_id", profile.id);
        navigate("/profiles");
      } else {
        sessionStorage.removeItem("profilecreated");
        // The sign-up page lives at /sign_up; "/signup" was a dead link.
        navigate("/sign_up");
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
          <button onClick={(e) => HandleLogin(e)} disabled={submitting}>
            {submitting ? "Signing in…" : t("login.button")}
          </button>
        </div>
        <p style={{ textAlign: "center", marginTop: "12px" }}>
          <Link to="/forgot_password">{t("login.forgotPassword")}</Link>
        </p>
      </form>
    </div>
  );
}
export default FormLogin;
