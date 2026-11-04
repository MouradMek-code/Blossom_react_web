import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BASE_URL } from "../api/config";
import { postJson } from "../api/errors";
import { formatDeadline } from "../api/offers";
import styles from "./AdminReports.module.css";

const KIND_EMOJI = { child_safety: "🛡️", scam: "🎭", harassment: "🚫", bug: "🐞", other: "💬" };

// Admin, below the reported profiles: what members and visitors sent with
// "Report a problem" (child safety first). "Mark as done" only files it away;
// reply by email when there's an address.
export default function AdminFeedback({ token }) {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const call = useCallback(
    (path, method = "GET", body) =>
      postJson(`${BASE_URL}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      }),
    [token],
  );

  const load = useCallback(async () => {
    const result = await call(`/feedback/admin${showAll ? "?all=true" : ""}`);
    if (result.ok) {
      setItems(result.data);
      setError("");
    } else {
      setError(result.message);
    }
  }, [call, showAll]);

  useEffect(() => {
    load();
  }, [load]);

  async function setDone(item, handled) {
    setBusy(item.id);
    const result = await call(`/feedback/admin/${item.id}/handled`, "POST", { handled });
    setBusy(null);
    if (result.ok) load();
    else setError(result.message);
  }

  async function remove(item) {
    if (!window.confirm(t("feedback.adminDeleteConfirm"))) return;
    setBusy(item.id);
    const result = await call(`/feedback/admin/${item.id}`, "DELETE");
    setBusy(null);
    if (result.ok) setItems((cur) => cur.filter((x) => x.id !== item.id));
    else setError(result.message);
  }

  return (
    <section className={styles.block}>
      <div className={styles.head}>
        <h2 className={styles.title}>🛟 {t("feedback.adminTitle")}</h2>
        <button type="button" className={styles.toggle} onClick={() => setShowAll((v) => !v)}>
          {showAll ? t("feedback.adminHideDone") : t("feedback.adminShowAll")}
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {items === null ? (
        <p className={styles.muted}>…</p>
      ) : items.length === 0 ? (
        <p className={styles.muted}>{t("feedback.adminEmpty")}</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li
              key={item.id}
              className={`${styles.card} ${item.handled ? styles.cardHandled : ""}`}
              style={item.kind === "child_safety" ? { borderColor: "#d64545", borderWidth: 2 } : undefined}
            >
              <strong style={item.kind === "child_safety" ? { color: "#d64545" } : undefined}>
                {KIND_EMOJI[item.kind]} {t(`feedback.kind_${item.kind}`)}
              </strong>
              <p className={styles.muted}>
                {item.reporter.name ? t("feedback.adminFrom", { name: item.reporter.name }) : t("feedback.adminVisitor")}
                {item.reporter.email ? ` · ${item.reporter.email}` : ""} · {formatDeadline(item.created_at, i18n.language)}
              </p>
              {item.about && (
                <p>
                  <Link to={`/profile/${item.about.profile_id}`}>
                    👤 {t("feedback.adminAbout", { name: item.about.name || "?" })}
                  </Link>
                </p>
              )}
              <blockquote className={styles.reason} style={{ whiteSpace: "pre-wrap" }}>{item.message}</blockquote>
              <div className={styles.actions}>
                {item.reporter.email && (
                  <a className={styles.secondary} href={`mailto:${item.reporter.email}?subject=${encodeURIComponent("Blossom")}`}>
                    ✉️ {t("feedback.adminReply")}
                  </a>
                )}
                <button type="button" className={styles.secondary} onClick={() => setDone(item, !item.handled)} disabled={busy === item.id}>
                  {item.handled ? t("feedback.adminReopen") : `✓ ${t("feedback.adminDone")}`}
                </button>
                <button type="button" className={styles.danger} onClick={() => remove(item)} disabled={busy === item.id}>
                  {t("feedback.adminDelete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
