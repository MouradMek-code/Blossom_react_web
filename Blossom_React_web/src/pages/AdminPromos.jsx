import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import { BASE_URL } from "../api/config";
import { postJson } from "../api/errors";
import { formatDeadline, formatHours } from "../api/offers";
import styles from "./AdminPromos.module.css";

// Admin: venue promotions for couples - publish one on a date spot, follow
// how many couples got it and used it, pause, add places, end it.
export default function AdminPromos() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const [offers, setOffers] = useState(null);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(null);

  const send = useCallback(
    (path, method, body) =>
      postJson(`${BASE_URL}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      }),
    [token],
  );

  const load = useCallback(async () => {
    if (!token || token === "null") {
      navigate("/login");
      return;
    }
    try {
      const resp = await fetch(`${BASE_URL}/offers/admin`, { headers: { Authorization: `Bearer ${token}` } });
      if (resp.status === 403 || resp.status === 401) {
        navigate("/");
        return;
      }
      if (!resp.ok) throw new Error(`offers ${resp.status}`);
      setOffers(await resp.json());
      setError("");
    } catch {
      setError(t("offers.loadFailed"));
    }
  }, [token, navigate, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function change(offer, changes) {
    setBusy(offer.id);
    const result = await send(`/offers/admin/${offer.id}`, "PATCH", changes);
    setBusy(null);
    if (!result.ok) {
      setError(result.message || t("offers.saveFailed"));
      return;
    }
    setOffers((cur) => cur.map((o) => (o.id === offer.id ? result.data : o)));
  }

  const deadline = (value) => formatDeadline(value, i18n.language);

  return (
    <div className={styles.page}>
      <PageNav />
      <main className={styles.wrap}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t("offers.tab")}</h1>
          <div className={styles.links}>
            <Link to="/admin/dashboard">{t("dashboard.dashboardLink")}</Link>
            <Link to="/admin">{t("dashboard.membersLink")}</Link>
          </div>
        </header>

        {formOpen ? (
          <OfferForm
            t={t}
            send={send}
            onCancel={() => setFormOpen(false)}
            onCreated={(offer) => {
              setFormOpen(false);
              setOffers((cur) => [offer, ...(cur || [])]);
            }}
          />
        ) : (
          <button type="button" className={styles.newBtn} onClick={() => setFormOpen(true)}>
            {t("offers.new")}
          </button>
        )}

        {error && <p className={styles.error}>{error}</p>}

        {offers === null ? (
          !error && <p className={styles.muted}>…</p>
        ) : offers.length === 0 ? (
          <p className={styles.empty}>{t("offers.empty")}</p>
        ) : (
          offers.map((o) => (
            <article key={o.id} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.spot}>📍 {o.spot?.name}</span>
                <span className={`${styles.state} ${styles[`state_${o.state}`]}`}>{t(`offers.state_${o.state}`)}</span>
              </div>
              <h2 className={styles.offerTitle}>🎁 {o.title}</h2>
              {o.details && <p className={styles.muted}>{o.details}</p>}
              <p className={styles.line}>
                {t("offers.until", { date: deadline(o.ends_at) })} · {t("offers.useWithin", { time: formatHours(o.valid_hours, t) })}
              </p>
              <p className={styles.line}>
                {o.stats.remaining == null ? t("offers.noLimit") : t("offers.placesLeft", { count: o.stats.remaining })}
              </p>
              <p className={styles.stats}>{t("offers.stats", o.stats)}</p>
              <p className={styles.line}>🔑 {t("offers.staffCodeShow", { code: o.staff_code })}</p>

              {o.couples.length > 0 && (
                <details className={styles.couples}>
                  <summary>
                    {t("offers.couples")} ({o.couples.length})
                  </summary>
                  <table>
                    <tbody>
                      {o.couples.map((c) => (
                        <tr key={c.code}>
                          <td>{c.names.join(" & ")}</td>
                          <td className={styles.code}>{c.code}</td>
                          <td>{t(`offers.status_${c.status}`)}</td>
                          <td className={styles.muted}>
                            {c.used_at ? deadline(c.used_at) : deadline(c.expires_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              )}

              {o.state !== "ended" && (
                <div className={styles.actions}>
                  <button type="button" onClick={() => change(o, { active: !o.active })} disabled={busy === o.id}>
                    {o.active ? t("offers.pause") : t("offers.resume")}
                  </button>
                  {o.max_couples != null && (
                    <button
                      type="button"
                      onClick={() => change(o, { max_couples: o.max_couples + 5 })}
                      disabled={busy === o.id}
                    >
                      {t("offers.addPlaces")}
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.danger}
                    onClick={() => change(o, { ends_at: new Date().toISOString() })}
                    disabled={busy === o.id}
                  >
                    {t("offers.endNow")}
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </main>
    </div>
  );
}

// datetime-local wants "YYYY-MM-DDTHH:MM" in local time.
function localInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function OfferForm({ t, send, onCancel, onCreated }) {
  const [spots, setSpots] = useState(null);
  const [search, setSearch] = useState("");
  const [spot, setSpot] = useState(null);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [maxCouples, setMaxCouples] = useState("");
  const [endsAt, setEndsAt] = useState(() => localInputValue(new Date(Date.now() + 30 * 24 * 3600 * 1000)));
  const [days, setDays] = useState("7");
  const [hours, setHours] = useState("0");
  const [staffCode, setStaffCode] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/date_spots`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setSpots)
      .catch(() => setSpots([]));
  }, []);

  const found = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (spots || [])
      .filter((s) => !q || `${s.name} ${s.city} ${s.neighborhood || ""}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [spots, search]);

  async function publish(e) {
    e.preventDefault();
    setError("");
    if (!spot) return setError(t("offers.chooseSpot"));
    const end = new Date(endsAt);
    if (Number.isNaN(end.getTime()) || end <= new Date()) return setError(t("offers.badDate"));
    const validHours = (parseInt(days, 10) || 0) * 24 + (parseInt(hours, 10) || 0);
    if (validHours < 1) return setError(t("offers.badValidity"));
    setSaving(true);
    const result = await send("/offers/admin", "POST", {
      spot_id: spot.id,
      title,
      details: details || null,
      max_couples: maxCouples ? parseInt(maxCouples, 10) : null,
      ends_at: end.toISOString(),
      valid_hours: validHours,
      staff_code: staffCode || null,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.message || t("offers.saveFailed"));
      return;
    }
    onCreated(result.data);
  }

  return (
    <form className={styles.form} onSubmit={publish}>
      <label className={styles.field}>
        <span>{t("offers.spot")}</span>
        {spot ? (
          <button type="button" className={styles.chosenSpot} onClick={() => setSpot(null)}>
            📍 {spot.name} · {spot.city} ✕
          </button>
        ) : (
          <>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("offers.searchSpot")} />
            <div className={styles.spotList}>
              {spots === null
                ? "…"
                : found.map((s) => (
                    <button key={s.id} type="button" onClick={() => setSpot(s)}>
                      {s.offer ? "🎁 " : ""}
                      {s.name} · {s.city}
                    </button>
                  ))}
            </div>
          </>
        )}
      </label>
      <label className={styles.field}>
        <span>{t("offers.title")}</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("offers.titlePlaceholder")} maxLength={120} />
      </label>
      <label className={styles.field}>
        <span>{t("offers.details")}</span>
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t("offers.detailsPlaceholder")} maxLength={500} rows={2} />
      </label>
      <label className={styles.field}>
        <span>{t("offers.maxCouples")}</span>
        <input
          inputMode="numeric"
          value={maxCouples}
          onChange={(e) => setMaxCouples(e.target.value.replace(/\D/g, "").slice(0, 5))}
          placeholder="10"
        />
        <small>{t("offers.maxCouplesHint")}</small>
      </label>
      <label className={styles.field}>
        <span>{t("offers.endsAt")}</span>
        <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
      </label>
      <div className={styles.field}>
        <span>{t("offers.validFor")}</span>
        <div className={styles.row}>
          <input inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, "").slice(0, 3))} />
          <span>{t("offers.daysLabel")}</span>
          <input inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value.replace(/\D/g, "").slice(0, 2))} />
          <span>{t("offers.hoursLabel")}</span>
        </div>
      </div>
      <label className={styles.field}>
        <span>{t("offers.staffCode")}</span>
        <input
          inputMode="numeric"
          value={staffCode}
          onChange={(e) => setStaffCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
          placeholder="1234"
        />
        <small>{t("offers.staffCodeHint")}</small>
      </label>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.formActions}>
        <button type="button" className={styles.secondary} onClick={onCancel}>
          {t("offers.cancel")}
        </button>
        <button type="submit" className={styles.primary} disabled={saving}>
          {saving ? "…" : t("offers.publish")}
        </button>
      </div>
    </form>
  );
}
