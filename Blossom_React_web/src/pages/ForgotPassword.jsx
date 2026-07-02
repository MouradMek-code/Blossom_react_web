import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageNav from "../components/PageNav";
import styles from "../components/FormSignUp.module.css";
import homeStyles from "./Homepage.module.css";
import { BASE_URL } from "../api/config";
import { useTranslation } from "react-i18next";

function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState("request"); // "request" | "reset"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function handleRequestCode(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    try {
      const resp = await fetch(`${BASE_URL}/user/forgot_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await resp.json();
      if (resp.status !== 200) {
        throw new Error(data.detail || "Failed to send reset code");
      }
      setInfo(data.message || "If that email exists, a reset code has been sent.");
      setStep("reset");
    } catch (err) {
      setError(err.toString());
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    try {
      const resp = await fetch(`${BASE_URL}/user/reset_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, new_password: newPassword }),
      });
      const data = await resp.json();
      if (resp.status !== 200) {
        throw new Error(data.detail || "Failed to reset password");
      }
      navigate("/login");
    } catch (err) {
      setError(err.toString());
    }
  }

  return (
    <div className={homeStyles.head}>
      <PageNav />

      <div>
        <h1 className={styles.title}>
          {step === "request" ? t("forgotPassword.titleRequest") : t("forgotPassword.titleReset")}
        </h1>

        {step === "request" ? (
          <form className={styles.container} onSubmit={handleRequestCode}>
            {error !== "" && <span className={styles.error}>{error}</span>}
            <p style={{ color: "#fff", textAlign: "center" }}>
              {t("forgotPassword.description")}
            </p>
            <div className={styles.group}>
              <label>{t("forgotPassword.email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className={styles.registerform}>
              <button type="submit">{t("forgotPassword.sendCode")}</button>
            </div>
            <p style={{ textAlign: "center" }}>
              <Link to="/login">{t("forgotPassword.backToLogin")}</Link>
            </p>
          </form>
        ) : (
          <form className={styles.container} onSubmit={handleResetPassword}>
            {error !== "" && <span className={styles.error}>{error}</span>}
            {info !== "" && (
              <p style={{ color: "#fff", textAlign: "center" }}>{info}</p>
            )}
            <div className={styles.group}>
              <label>{t("forgotPassword.resetCode")}</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
              />
            </div>
            <div className={styles.group}>
              <label>{t("forgotPassword.newPassword")}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className={styles.registerform}>
              <button type="submit">{t("forgotPassword.updatePassword")}</button>
            </div>
            <p style={{ textAlign: "center" }}>
              <button
                type="button"
                onClick={() => setStep("request")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fff",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                {t("forgotPassword.tryAgain")}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
