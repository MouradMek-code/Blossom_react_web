import { useState } from "react";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import Footer from "../components/Footer";
import { BASE_URL } from "../api/config";
import { postJson } from "../api/errors";
import styles from "./ReportProblem.module.css";

// What the report is about; child safety first.
const KINDS = [
  ["child_safety", "🛡️"],
  ["scam", "🎭"],
  ["harassment", "🚫"],
  ["bug", "🐞"],
  ["other", "💬"],
];

// "Report a problem" on the website (blossom-date.com/report) - members and
// visitors, no email app needed. It goes straight to the Blossom team.
export default function ReportProblem() {
  const { t, i18n } = useTranslation();
  const token = sessionStorage.getItem("token");
  const loggedIn = Boolean(token) && token !== "null" && token !== "undefined";
  const [kind, setKind] = useState(null);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // hidden: bots fill it
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const ready = kind && message.trim().length >= 5;

  async function send(event) {
    event.preventDefault();
    if (!ready || sending) return;
    setSending(true);
    setError("");
    const result = await postJson(`${BASE_URL}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(loggedIn ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        kind,
        message: message.trim(),
        email: loggedIn ? null : email.trim() || null,
        language: (i18n.language || "en").slice(0, 2),
        website: website || null,
      }),
    });
    setSending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className={styles.page}>
      <PageNav />
      <main className={styles.wrap}>
        <h1 className={styles.title}>🛟 {t("feedback.title")}</h1>
        {sent ? (
          <section className={`${styles.card} ${styles.center}`}>
            <span className={styles.bigEmoji} aria-hidden="true">💌</span>
            <h2>{t("feedback.doneTitle")}</h2>
            <p className={styles.text}>{t("feedback.doneText")}</p>
          </section>
        ) : (
          <form onSubmit={send} className={styles.form}>
            <p className={styles.text}>{t("feedback.intro")}</p>

            <section className={styles.card}>
              <h2 className={styles.label}>{t("feedback.reasonLabel")}</h2>
              <div className={styles.kinds} role="radiogroup">
                {KINDS.map(([key, emoji]) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={kind === key}
                    className={`${styles.kind} ${kind === key ? styles.kindOn : ""} ${
                      kind === key && key === "child_safety" ? styles.kindChild : ""
                    }`}
                    onClick={() => setKind(key)}
                  >
                    {emoji} {t(`feedback.kind_${key}`)}
                  </button>
                ))}
              </div>
              {kind === "child_safety" && <p className={styles.childNote}>{t("feedback.childNote")}</p>}
            </section>

            <section className={styles.card}>
              <label className={styles.field}>
                <span className={styles.label}>{t("feedback.messageLabel")}</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("feedback.messagePlaceholder")}
                  maxLength={2000}
                  rows={6}
                />
              </label>
              {!loggedIn && (
                <label className={styles.field}>
                  <span className={styles.label}>{t("feedback.emailLabel")}</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    maxLength={200}
                    autoComplete="email"
                  />
                </label>
              )}
              <input
                className={styles.hidden}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </section>

            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.button} disabled={!ready || sending}>
              {sending ? t("feedback.sending") : t("feedback.send")}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
