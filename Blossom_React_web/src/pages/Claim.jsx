import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import Logo from "../components/Logo";
import { BASE_URL } from "../api/config";
import { IMG } from "../api/images";
import { NETWORK_ERROR, postJson } from "../api/errors";
import styles from "./Claim.module.css";

// blossom-date.com/claim/<link> - a friend whose profile an admin made from
// their answers: they check it, accept the terms and choose their password
// (then it shows in Browse), or say "This isn't me" and it's all deleted.
export default function Claim() {
  const { token } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [stage, setStage] = useState("loading"); // loading | ready | error | declined
  const [profile, setProfile] = useState(null);
  const [problem, setProblem] = useState(""); // notFound | expired | network
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const switchedLanguage = useRef(false);
  const url = `${BASE_URL}/friend_profiles/claim/${encodeURIComponent(token)}`;

  useEffect(() => {
    let alive = true;
    fetch(url)
      .then(async (resp) => {
        const data = await resp.json().catch(() => null);
        if (!alive) return;
        if (!resp.ok) {
          setProblem(data?.detail?.reason === "expired" ? "expired" : "notFound");
          setStage("error");
          return;
        }
        setProfile(data);
        setStage("ready");
        // Shown in the language the email was written in.
        if (!switchedLanguage.current && data.language && !i18n.language?.startsWith(data.language)) {
          switchedLanguage.current = true;
          i18n.changeLanguage(data.language);
        }
      })
      .catch(() => {
        if (!alive) return;
        setProblem("network");
        setStage("error");
      });
    return () => {
      alive = false;
    };
  }, [url, i18n]);

  async function activate(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (password.length < 8) return setError(t("claim.errShort"));
    if (password !== password2) return setError(t("claim.errMatch"));
    if (!accepted) return setError(t("claim.errTerms"));
    setBusy(true);
    const result = await postJson(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, accept_terms: true }),
    });
    setBusy(false);
    if (!result.ok) return setError(result.message);
    // Logged in, the same way the login form does it.
    sessionStorage.setItem("token", result.data.access_token);
    sessionStorage.setItem("profilecreated", "yes");
    if (result.data.profile_id) sessionStorage.setItem("profile_id", result.data.profile_id);
    navigate("/profiles", { replace: true });
  }

  async function decline() {
    if (busy || !window.confirm(t("claim.notMeConfirm"))) return;
    setBusy(true);
    setError("");
    const result = await postJson(`${url}/decline`, { method: "POST" });
    setBusy(false);
    if (!result.ok) return setError(result.message);
    setStage("declined");
  }

  let content;
  if (stage === "loading") {
    content = <p className={styles.muted}>{t("dashboard.loading")}</p>;
  } else if (stage === "error") {
    content = (
      <div className={styles.card}>
        <h1 className={styles.title}>{t("claim.title")}</h1>
        <p className={styles.text}>
          {problem === "expired" ? t("claim.expired") : problem === "network" ? NETWORK_ERROR : t("claim.notFound")}
        </p>
        <div className={styles.links}>
          <Link to="/login" className={styles.secondaryBtn}>
            {t("nav.login")}
          </Link>
          <Link to="/" className={styles.plainLink}>
            {t("claim.home")}
          </Link>
        </div>
      </div>
    );
  } else if (stage === "declined") {
    content = (
      <div className={styles.card}>
        <h1 className={styles.title}>🗑️</h1>
        <p className={styles.text}>{t("claim.deleted")}</p>
        <Link to="/" className={styles.plainLink}>
          {t("claim.home")}
        </Link>
      </div>
    );
  } else {
    const [mainPhoto, ...otherPhotos] = profile.photos;
    const place = [profile.city, profile.country].filter(Boolean).join(", ");
    content = (
      <div className={styles.card}>
        <h1 className={styles.title}>{t("claim.hello", { name: profile.first_name })}</h1>
        <p className={styles.text}>{t("claim.intro")}</p>

        <section className={styles.preview} aria-label={t("claim.preview")}>
          <p className={styles.previewLabel}>{t("claim.preview")}</p>
          {mainPhoto && <img className={styles.mainPhoto} src={IMG.card(mainPhoto)} alt={profile.first_name} />}
          {otherPhotos.length > 0 && (
            <div className={styles.thumbs}>
              {otherPhotos.map((photo) => (
                <img key={photo} src={IMG.thumb(photo)} alt="" />
              ))}
            </div>
          )}
          <p className={styles.name}>
            {profile.first_name}
            {profile.age ? <span className={styles.age}> · {profile.age}</span> : null}
          </p>
          {place && <p className={styles.place}>📍 {place}</p>}
          {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
          <p className={styles.editLater}>{t("claim.editLater")}</p>
        </section>

        <form className={styles.form} onSubmit={activate} noValidate>
          <p className={styles.loginWith}>{t("claim.loginWith", { email: profile.email })}</p>
          <label className={styles.field}>
            <span className={styles.label}>{t("claim.password")}</span>
            <input
              className={styles.input}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
            />
            <span className={styles.hint}>{t("claim.passwordHint")}</span>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>{t("claim.passwordAgain")}</span>
            <input
              className={styles.input}
              type={showPassword ? "text" : "password"}
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            {t("claim.showPassword")}
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
            <span>
              {t("claim.terms")}{" "}
              <Link to="/terms" target="_blank">
                {t("footer.terms")}
              </Link>
              {" · "}
              <Link to="/privacy-policy" target="_blank">
                {t("footer.privacy")}
              </Link>
            </span>
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.primaryBtn} disabled={busy}>
            {busy ? t("claim.activating") : `🌸 ${t("claim.activate")}`}
          </button>
        </form>

        <button type="button" className={styles.notMe} onClick={decline} disabled={busy}>
          {t("claim.notMe")}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <Logo />
      </header>
      <main className={styles.wrap}>{content}</main>
    </div>
  );
}
