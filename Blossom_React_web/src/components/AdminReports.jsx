import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BASE_URL } from "../api/config";
import { postJson } from "../api/errors";
import { IMG } from "../api/images";
import { formatDeadline } from "../api/offers";
import styles from "./AdminReports.module.css";
import AskToVerify from "./AskToVerify";

// Admin: members' reports - who, why, how many times that person was
// reported. "Done" files a report away; "Delete the account" removes the
// person (the report stays, with their name). onDeleted(userId) lets the
// members list drop them too.
export default function AdminReports({ token, onDeleted }) {
  const { t, i18n } = useTranslation();
  const [reports, setReports] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const auth = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    const result = await postJson(`${BASE_URL}/reports/admin${showAll ? "?all=true" : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (result.ok) setReports(result.data);
    else setError(result.message);
  }, [token, showAll]);

  useEffect(() => {
    load();
  }, [load]);

  async function done(report) {
    setBusy(report.id);
    const result = await postJson(`${BASE_URL}/reports/admin/${report.id}/handled`, { method: "POST", headers: auth });
    setBusy(null);
    if (result.ok) load();
    else setError(result.message);
  }

  async function deleteAccount(report) {
    const person = report.reported;
    if (!window.confirm(t("profileReports.deleteConfirm", { name: person.name }))) return;
    setBusy(report.id);
    const result = await postJson(`${BASE_URL}/user/admin/users/${person.user_id}`, { method: "DELETE", headers: auth });
    setBusy(null);
    if (!result.ok) {
      setError(t("profileReports.deleteFailed"));
      return;
    }
    onDeleted?.(person.user_id);
    load();
  }

  if (reports === null) return error ? <p className={styles.error}>{error}</p> : null;
  return (
    <section className={styles.block}>
      <div className={styles.head}>
        <h2 className={styles.title}>
          {t("profileReports.title")}
          {!showAll && reports.length > 0 && <span className={styles.count}>{reports.length}</span>}
        </h2>
        <button type="button" className={styles.toggle} onClick={() => setShowAll((v) => !v)}>
          {showAll ? t("profileReports.hideHandled") : t("profileReports.showAll")}
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {reports.length === 0 && <p className={styles.muted}>{t("profileReports.empty")}</p>}
      <ul className={styles.list}>
        {reports.map((report) => {
          const person = report.reported;
          return (
            <li key={report.id} className={`${styles.card} ${report.handled ? styles.cardHandled : ""}`}>
              <div className={styles.person}>
                {person.photo ? (
                  <img src={IMG.thumb(person.photo)} alt="" />
                ) : (
                  <span className={styles.avatarEmpty}>🌸</span>
                )}
                <div>
                  <strong>
                    {person.name || "?"}
                    {person.age ? `, ${person.age}` : ""}
                  </strong>
                  {person.deleted ? (
                    <span className={styles.deleted}>{t("profileReports.deleted")}</span>
                  ) : (
                    person.city && <span className={styles.muted}> · {person.city}</span>
                  )}
                  <p className={styles.meta}>
                    {t("profileReports.reportedBy", { name: report.reporter.name || "?" })} ·{" "}
                    {formatDeadline(report.created_at, i18n.language)}
                  </p>
                </div>
                {report.times_reported > 1 && (
                  <span className={styles.times}>{t("profileReports.times", { count: report.times_reported })}</span>
                )}
              </div>
              <blockquote className={styles.reason}>{report.reason}</blockquote>
              <div className={styles.actions}>
                {!person.deleted && person.id && (
                  <Link to={`/profile/${person.id}`} className={styles.secondary}>
                    👤 {t("profileReports.seeProfile")}
                  </Link>
                )}
                {!person.deleted && person.id && (
                  <AskToVerify
                    profile={person}
                    name={person.name}
                    onAsked={(deadline) =>
                      setReports((cur) =>
                        cur.map((r) =>
                          r.reported.id === person.id ? { ...r, reported: { ...r.reported, verify_by: deadline } } : r,
                        ),
                      )
                    }
                  />
                )}
                {!person.deleted && person.user_id && (
                  <button type="button" className={styles.danger} onClick={() => deleteAccount(report)} disabled={busy === report.id}>
                    🗑 {t("profileReports.deleteAccount")}
                  </button>
                )}
                {report.handled ? (
                  <span className={styles.handled}>✓ {t("profileReports.handled")}</span>
                ) : (
                  <button type="button" className={styles.done} onClick={() => done(report)} disabled={busy === report.id}>
                    ✓ {t("profileReports.done")}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
