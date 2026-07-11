import { useState } from "react";
import styles from "./FormSignUp.module.css";
import styles2 from "./VerifyPhone.module.css";
import { BASE_URL } from "../api/config";
import { saveSignupDraft, clearSignupDraft } from "../api/signupDraft";
import { postJson } from "../api/errors";
import { useTranslation } from "react-i18next";
import FlowerProgress from "./FlowerProgress";

function FormSignUp({ setRegistered, error, setError, verify, setVerified, prefill }) {
  const { t } = useTranslation();
  const [username, setUsername] = useState(prefill?.username || "");
  const [email, setEmail] = useState(prefill?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(prefill?.phoneNumber || "");
  const [dateOfBirth, setDateOfBirth] = useState(prefill?.dateOfBirth || "");
  const [submitting, setSubmitting] = useState(false);

  function FormHandler(e) {
    e.preventDefault();
    async function SignUp() {
      setError("");

      // Clear, instant client-side validation before hitting the server.
      if (!username.trim()) return setError("Please enter a username.");
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        return setError("Please enter a valid email address.");
      if (!password || password.length < 6)
        return setError("Password must be at least 6 characters.");
      if (!phoneNumber.trim() || !/^\+?[0-9\s-]{7,}$/.test(phoneNumber.trim()))
        return setError("Please enter a valid phone number, including country code (e.g. +33…).");

      const today = new Date();
      const birth = new Date(dateOfBirth);
      const age =
        today.getFullYear() -
        birth.getFullYear() -
        (today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
          ? 1
          : 0);
      if (!dateOfBirth || isNaN(birth.getTime())) {
        return setError("Please enter your date of birth.");
      }
      if (age < 18) {
        return setError("You must be at least 18 years old to sign up.");
      }

      setSubmitting(true);
      const result = await postJson(`${BASE_URL}/user/send_email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password: password,
          phone_number: phoneNumber.trim(),
          date_of_birth: dateOfBirth,
        }),
      });
      setSubmitting(false);

      if (!result.ok) {
        setError(result.message);
        return;
      }
      // The account doesn't exist yet and there's no token until the
      // OTP is verified - save just enough (no password) to resume
      // straight at the verification screen if the user leaves now.
      saveSignupDraft({ stage: "verify_otp", username, email, phoneNumber, dateOfBirth });
      setVerified((c) => !c);
      sessionStorage.setItem("token", result.data.access_token);
    }
    SignUp();
  }

  const filledCount = [username, email, password, phoneNumber, dateOfBirth].filter(Boolean).length;

  return (
    <div>
      <FlowerProgress filled={filledCount} verified={verify === true} />
      <h1 className={styles.title}>{t("signup.title")}</h1>
      {verify === false && (
        <form className={styles.container} onSubmit={(e) => FormHandler(e)}>
          {error !== "" && (
            <span className={styles.error}>{error.toString()}</span>
          )}
          <p className={styles.requiredNote}>All fields are required.</p>
          <div className={styles.group}>
            <label>{t("signup.name")} <span className={styles.req}>*</span></label>
            <input
              type="text"
              value={username}
              required
              autoCapitalize="none"
              placeholder="e.g. sofia_martin"
              onChange={(e) => setUsername(e.target.value)}
            ></input>
          </div>
          <div className={styles.group}>
            <label>{t("signup.email")} <span className={styles.req}>*</span></label>
            <input
              type="email"
              value={email}
              required
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
            ></input>
          </div>
          <div className={styles.group}>
            <label>{t("signup.password")} <span className={styles.req}>*</span></label>
            <div className={styles.passwordWrap}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                required
                minLength={6}
                placeholder="At least 6 characters"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          <div className={styles.group}>
            <label>{t("signup.phoneNumber")} <span className={styles.req}>*</span></label>
            <input
              type="tel"
              value={phoneNumber}
              required
              placeholder="+33 6 12 34 56 78 (with country code)"
              onChange={(e) => setPhoneNumber(e.target.value)}
            ></input>
          </div>
          <div className={styles.group}>
            <label>{t("signup.dateOfBirth")} <span className={styles.req}>*</span></label>
            <input
              type="date"
              value={dateOfBirth}
              required
              placeholder="YYYY-MM-DD"
              onChange={(e) => setDateOfBirth(e.target.value)}
            ></input>
            <small className={styles.hint}>You must be 18 or older.</small>
          </div>
          <div className={styles.registerform}>
            <button onClick={(e) => FormHandler(e)} disabled={submitting}>
              {submitting ? "Sending code…" : t("signup.button")}
            </button>
          </div>
          <p style={{ textAlign: "center", fontSize: "12px", color: "#888", marginTop: "12px" }}>
            {t("signup.privacyPolicy")}{" "}
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
              {t("signup.privacyPolicyLink")}
            </a>
            .
          </p>
        </form>
      )}

      {verify === true && (
        <VerificationForm
          username={username}
          email={email}
          password={password}
          phoneNumber={phoneNumber}
          dateOfBirth={dateOfBirth}
          setError={setError}
          setRegistered={setRegistered}
        />
      )}
    </div>
  );
}
function VerificationForm({
  username,
  email,
  password,
  phoneNumber,
  dateOfBirth,
  setError,
  setRegistered,
}) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const needsPassword = !password;
  const [resendState, setResendState] = useState("idle");
  const [cooldown, setCooldown] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  async function handleResend() {
    if (resendState === "sending" || cooldown > 0) return;
    setResendState("sending");
    try {
      const url = BASE_URL + "/user/resend_email?email=" + encodeURIComponent(email) + "&phone_number=" + encodeURIComponent(phoneNumber);
      const resp = await fetch(url, { method: "POST" });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to resend");
      }
      setResendState("sent");
      let s = 60;
      setCooldown(s);
      const timer = setInterval(() => {
        s -= 1;
        setCooldown(s);
        if (s <= 0) { clearInterval(timer); setResendState("idle"); }
      }, 1000);
    } catch (err) {
      setResendState("error");
      setError(err.message || "Could not resend code. Please try again.");
    }
  }

  const SignUp = async () => {
    setError("");
    const effectivePassword = password || passwordInput;

    if (!code.trim() || code.trim().length < 6) {
      return setError("Please enter the 6-digit code we sent you.");
    }
    if (needsPassword && (!passwordInput || passwordInput.length < 6)) {
      return setError("Please re-enter your password (at least 6 characters).");
    }

    setSubmitting(true);

    // Step 1 — confirm the emailed OTP.
    const verifyResult = await postJson(`${BASE_URL}/user/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number: phoneNumber, otp: code.trim(), email }),
    });
    if (!verifyResult.ok) {
      setSubmitting(false);
      return setError(verifyResult.message);
    }

    // Step 2 — create the account now that the email is verified.
    const createResult = await postJson(`${BASE_URL}/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email,
        password: effectivePassword,
        phone_number: phoneNumber,
        date_of_birth: dateOfBirth,
      }),
    });
    setSubmitting(false);
    if (!createResult.ok) {
      return setError(createResult.message);
    }

    clearSignupDraft();
    setRegistered((c) => !c);
    sessionStorage.setItem("token", createResult.data.access_token);
  };
  return (
    <div className={styles2.container}>
      <div className={styles2.card}>
        <div className={styles2.icon}>🔐</div>

        <h1 className={styles2.title}>{t("verify.title")}</h1>

        <p className={styles2.subtitle}>{t("verify.subtitle")}</p>

        <input
          className={styles2.input}
          placeholder="••••••"
          value={code}
          maxLength={6}
          onChange={(e) => setCode(e.target.value)}
        />

        {needsPassword && (
          <input
            className={styles2.input}
            type="password"
            placeholder={t("verify.reenterPassword")}
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
          />
        )}

        <button className={styles2.button} onClick={SignUp} disabled={submitting}>
          {submitting ? "Verifying…" : t("verify.button")}
        </button>

        <div className={styles2.footerText}>
          {t("verify.resend")}{" "}
          {cooldown > 0 ? (
            <span className={styles2.resendCooldown}>{cooldown}s</span>
          ) : (
            <button
              className={styles2.resendBtn}
              onClick={handleResend}
              disabled={resendState === "sending"}
            >
              {resendState === "sending" ? "..." : resendState === "sent" ? t("verify.resendSent") : t("verify.resendLink")}
            </button>
          )}
        </div>
        <p className={styles2.spamHint}>
          📬 {t("verify.spamHint")}
        </p>
      </div>
    </div>
  );
}

export default FormSignUp;
