import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import LocationPicker from "../components/LocationPicker";
import { BASE_URL } from "../api/config";
import { postJson } from "../api/errors";
import { tidyCity } from "../api/geo";
import i18n from "../i18n";
import styles from "./Settings.module.css";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "zh", label: "中文" },
  { code: "ar", label: "العربية" },
];

// Everything about the account rather than about dating: language, where you
// live, the legal pages, logging out and deleting the account. Reached from
// the menu behind your picture, so "Log out" is never one stray click away.
function Settings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");

  const [language, setLanguage] = useState(i18n.language?.slice(0, 2) || "en");
  const [profile, setProfile] = useState(null);
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationDraft, setLocationDraft] = useState({ country: "", city: "" });
  const [savingLocation, setSavingLocation] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || token === "null" || token === "undefined") {
      navigate("/login");
      return;
    }
    let alive = true;
    fetch(`${BASE_URL}/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((resp) => (resp.ok ? resp.json() : null))
      .then((data) => {
        if (alive && data) setProfile(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [token, navigate]);

  function switchLanguage(code) {
    i18n.changeLanguage(code);
    setLanguage(code);
  }

  function startEditingLocation() {
    setLocationDraft({ country: profile?.country || "", city: profile?.city || "" });
    setError("");
    setEditingLocation(true);
  }

  async function saveLocation() {
    setSavingLocation(true);
    setError("");
    const params = new URLSearchParams({
      country: locationDraft.country,
      city: tidyCity(locationDraft.city),
    });
    const result = await postJson(`${BASE_URL}/profile/update_city_country?${params}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    setSavingLocation(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setProfile(result.data);
    setEditingLocation(false);
  }

  function handleLogout() {
    if (!window.confirm(t("settings.logoutTitle"))) return;
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("profilecreated");
    navigate("/login");
  }

  async function handleDeleteAccount() {
    if (!window.confirm(`${t("settings.deleteTitle")}\n\n${t("settings.deleteMessage")}`)) return;
    setDeleting(true);
    setError("");
    try {
      const resp = await fetch(`${BASE_URL}/user/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error(`delete failed with ${resp.status}`);
      sessionStorage.clear();
      navigate("/");
    } catch {
      setError(t("settings.deleteFailed"));
      setDeleting(false);
    }
  }

  const place = [profile?.city, profile?.country].filter(Boolean).join(", ");
  const locationReady = Boolean(locationDraft.country && locationDraft.city.trim());

  return (
    <div className={styles.page}>
      <PageNav />

      <div className={styles.container}>
        <h1 className={styles.title}>{t("settings.title")}</h1>
        {error !== "" && <p className={styles.error}>{error}</p>}

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>{t("settings.language")}</h2>
          <div className={styles.langGrid}>
            {LANGUAGES.map((option) => (
              <button
                key={option.code}
                type="button"
                className={`${styles.langBtn} ${language === option.code ? styles.langBtnActive : ""}`}
                onClick={() => switchLanguage(option.code)}
              >
                {option.label}
                {language === option.code && <span aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>{t("settings.location")}</h2>
          {editingLocation ? (
            <div className={styles.editor}>
              <LocationPicker
                country={locationDraft.country}
                city={locationDraft.city}
                onChange={setLocationDraft}
              />
              <div className={styles.editorActions}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={saveLocation}
                  disabled={savingLocation || !locationReady}
                >
                  {savingLocation ? t("location.saving") : t("location.save")}
                </button>
                <button
                  type="button"
                  className={styles.outlineBtn}
                  onClick={() => setEditingLocation(false)}
                >
                  {t("location.cancel")}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.row}>
              <span>📍 {place || t("location.notSet")}</span>
              <button type="button" className={styles.rowAction} onClick={startEditingLocation}>
                {t("location.change")}
              </button>
            </div>
          )}
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>{t("settings.about")}</h2>
          <Link className={styles.linkRow} to="/privacy-policy">
            {t("settings.privacy")}
            <span aria-hidden="true">›</span>
          </Link>
          <Link className={styles.linkRow} to="/terms">
            {t("settings.terms")}
            <span aria-hidden="true">›</span>
          </Link>
          <a className={styles.linkRow} href="mailto:mourad.meknioui@gmail.com">
            {t("settings.support")}
            <span aria-hidden="true">›</span>
          </a>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>{t("settings.account")}</h2>
          <button type="button" className={styles.linkRow} onClick={handleLogout}>
            {t("settings.logout")}
            <span aria-hidden="true">›</span>
          </button>
          <button
            type="button"
            className={`${styles.linkRow} ${styles.danger}`}
            onClick={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? t("location.saving") : t("settings.deleteAccount")}
            <span aria-hidden="true">›</span>
          </button>
        </section>

        <p className={styles.footnote}>
          {t("settings.footnote", { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  );
}

export default Settings;
