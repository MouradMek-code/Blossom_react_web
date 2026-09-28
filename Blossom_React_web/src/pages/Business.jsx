import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import Footer from "../components/Footer";
import { BASE_URL } from "../api/config";
import { postJson } from "../api/errors";
import styles from "./Business.module.css";

const TOPICS = ["partnership", "question", "problem", "other"];

// blossom-date.com/business - everything for cafés, restaurants and bars in
// one place: become a partner, check a couple's code, get the manager link
// again, contact Blossom. The app's Settings open these sections directly
// (#check, #lost-link, #contact).
export default function Business() {
  const { t, i18n } = useTranslation();
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  return (
    <div className={styles.page}>
      <PageNav />
      <main className={styles.wrap}>
        <h1 className={styles.title}>{t("business.title")}</h1>
        <p className={styles.intro}>{t("business.intro")}</p>

        <section className={`${styles.card} ${styles.highlight}`} id="partner">
          <h2>🏪 {t("business.partnerTitle")}</h2>
          <p>{t("business.partnerText")}</p>
          <Link to="/partner" className={styles.primary}>
            {t("business.partnerButton")}
          </Link>
        </section>

        <section className={styles.card} id="check">
          <h2>🔎 {t("business.checkTitle")}</h2>
          <p>{t("business.checkText")}</p>
          <Link to="/venue" className={styles.secondary}>
            {t("business.checkButton")}
          </Link>
        </section>

        <LostLink t={t} />
        <ContactForm t={t} language={(i18n.language || "en").slice(0, 2)} />
      </main>
      <Footer />
    </div>
  );
}

function LostLink({ t }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await postJson(`${BASE_URL}/partners/manager_link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message || t("partners.failed"));
      return;
    }
    setSent(true);
  }

  return (
    <section className={styles.card} id="lost-link">
      <h2>🔑 {t("business.lostTitle")}</h2>
      <p>{t("business.lostText")}</p>
      {sent ? (
        <p className={styles.ok}>{t("business.lostSent")}</p>
      ) : (
        <form className={styles.inline} onSubmit={send}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("business.email")} required />
          <button type="submit" className={styles.primaryBtn} disabled={busy}>
            {busy ? "…" : t("business.lostButton")}
          </button>
        </form>
      )}
      {error && <p className={styles.error}>{error}</p>}
    </section>
  );
}

function ContactForm({ t, language }) {
  const [form, setForm] = useState({ name: "", business: "", email: "", phone: "", topic: "partnership", message: "", website: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function send(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await postJson(`${BASE_URL}/partners/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        business: form.business || null,
        phone: form.phone || null,
        website: form.website || null,
        language,
      }),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message || t("partners.failed"));
      return;
    }
    setSent(true);
  }

  return (
    <section className={styles.card} id="contact">
      <h2>📩 {t("business.contactTitle")}</h2>
      <p>{t("business.contactText")}</p>
      {sent ? (
        <p className={styles.ok}>{t("business.sent")}</p>
      ) : (
        <form className={styles.form} onSubmit={send}>
          <div className={styles.row2}>
            <label>
              <span>{t("business.name")} *</span>
              <input value={form.name} onChange={set("name")} maxLength={120} required autoComplete="name" />
            </label>
            <label>
              <span>{t("business.business")}</span>
              <input value={form.business} onChange={set("business")} maxLength={150} autoComplete="organization" />
            </label>
          </div>
          <div className={styles.row2}>
            <label>
              <span>{t("business.email")} *</span>
              <input type="email" value={form.email} onChange={set("email")} maxLength={200} required autoComplete="email" />
            </label>
            <label>
              <span>{t("business.phone")}</span>
              <input type="tel" value={form.phone} onChange={set("phone")} maxLength={40} autoComplete="tel" />
            </label>
          </div>
          <label>
            <span>{t("business.topic")}</span>
            <select value={form.topic} onChange={set("topic")}>
              {TOPICS.map((topic) => (
                <option key={topic} value={topic}>
                  {t(`business.topic_${topic}`)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t("business.message")} *</span>
            <textarea value={form.message} onChange={set("message")} rows={5} maxLength={3000} required />
          </label>
          {/* Invisible to people: a bot that fills it is ignored. */}
          <input
            className={styles.hp}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={form.website}
            onChange={set("website")}
            name="website"
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.primaryBtn} disabled={busy}>
            {busy ? t("business.sending") : t("business.send")}
          </button>
        </form>
      )}
    </section>
  );
}
