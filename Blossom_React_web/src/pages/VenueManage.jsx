import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import { BASE_URL } from "../api/config";
import { postJson } from "../api/errors";
import { formatDeadline, formatHours } from "../api/offers";
import { parseServerDate } from "../api/chatTime";
import styles from "./VenueManage.module.css";

// datetime-local wants "YYYY-MM-DDTHH:MM" in local time.
function localInputValue(value) {
  const date = value ? new Date(`${String(value).replace(" ", "T")}Z`) : new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const MONTH_MS = 30 * 24 * 3600 * 1000;
const IDEAS = [
  { key: "coffee", emoji: "☕" },
  { key: "dessert", emoji: "🍰" },
  { key: "drink", emoji: "🥂" },
  { key: "discount", emoji: "💸" },
];

// blossom-date.com/venue/manage/<private link> - the venue owner's page, no
// account: pause, resume, add places, +1 month or any end date, repeat an
// old offer, see the numbers, and publish a new gift (live at once; Blossom
// is told and can pause it).
export default function VenueManage() {
  const { t, i18n } = useTranslation();
  const { token } = useParams();
  const [page, setPage] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const [endDates, setEndDates] = useState({});
  const [saved, setSaved] = useState(null);
  const [newOffer, setNewOffer] = useState({ offer_title: "", offer_details: "", max_couples: "", valid_hours: null });
  const [sentNew, setSentNew] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const newOfferForm = useRef(null);

  const base = `${BASE_URL}/partners/manage/${encodeURIComponent(token)}`;

  const load = useCallback(async () => {
    const result = await postJson(base, { method: "GET" });
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPage(result.data);
    setError("");
  }, [base]);

  useEffect(() => {
    load();
  }, [load]);

  async function change(offer, changes) {
    setBusy(offer.id);
    const result = await postJson(`${base}/offers/${offer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    setBusy(null);
    if (!result.ok) {
      setError(result.message || t("partners.failed"));
      return;
    }
    setPage((p) => ({ ...p, offers: p.offers.map((o) => (o.id === offer.id ? result.data : o)) }));
    setSaved(offer.id);
    setTimeout(() => setSaved(null), 2000);
  }

  // +1 month from the current end (or from now, for an offer that ended).
  function plusMonth(offer) {
    const end = parseServerDate(offer.ends_at);
    const from = Math.max(Date.now(), end ? end.getTime() : 0);
    change(offer, { ends_at: new Date(from + MONTH_MS).toISOString() });
  }

  // An old offer, again: its words and limits fill in the new gift.
  function repeat(offer) {
    setSentNew(false);
    setNewOffer({
      offer_title: offer.title,
      offer_details: offer.details || "",
      max_couples: offer.max_couples ? String(offer.max_couples) : "",
      valid_hours: offer.valid_hours || null,
    });
    newOfferForm.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function publishOffer(e) {
    e.preventDefault();
    setError("");
    setPublishing(true);
    const result = await postJson(`${base}/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offer_title: newOffer.offer_title,
        offer_details: newOffer.offer_details || null,
        max_couples: newOffer.max_couples ? parseInt(newOffer.max_couples, 10) : null,
        valid_hours: newOffer.valid_hours,
      }),
    });
    setPublishing(false);
    if (!result.ok) {
      setError(result.message || t("partners.failed"));
      return;
    }
    setSentNew(true);
    setNewOffer({ offer_title: "", offer_details: "", max_couples: "", valid_hours: null });
    load();
  }

  const deadline = (value) => formatDeadline(value, i18n.language);

  if (!page) {
    return (
      <div className={styles.page}>
        <PageNav />
        <main className={styles.wrap}>{error ? <p className={styles.error}>{error}</p> : <p className={styles.muted}>…</p>}</main>
      </div>
    );
  }

  const { venue } = page;
  const checkShort = venue.check_url.replace(/^https?:\/\//, "");

  return (
    <div className={styles.page}>
      <PageNav />
      <main className={styles.wrap}>
        <h1 className={styles.title}>🏪 {venue.name}</h1>
        <p className={styles.muted}>
          {t("partners.manageTitle")} · {t("partners.manageIntro")}
        </p>

        <div className={styles.staffBox}>
          🔑 {t("partners.staffCodeBox", { code: venue.staff_code, url: checkShort })}{" "}
          <a href={venue.check_url}>{checkShort}</a>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <h2 className={styles.section}>{t("partners.yourOffers")}</h2>
        {page.offers.length === 0 && <p className={styles.muted}>{t("partners.noOffers")}</p>}
        {page.offers.map((o) => (
          <article key={o.id} className={styles.card}>
            <div className={styles.cardTop}>
              <strong className={styles.offerTitle}>🎁 {o.title}</strong>
              <span className={`${styles.state} ${styles[`state_${o.state}`]}`}>{t(`offers.state_${o.state}`)}</span>
            </div>
            {o.details && <p className={styles.muted}>{o.details}</p>}
            <p className={styles.line}>
              {t("offers.until", { date: deadline(o.ends_at) })} · {t("offers.validAfterYes", { time: formatHours(o.valid_hours, t) })}
            </p>
            <p className={styles.line}>
              {o.stats.remaining == null ? t("offers.noLimit") : t("offers.placesLeft", { count: o.stats.remaining })}
            </p>
            <p className={styles.stats}>{t("offers.stats", o.stats)}</p>

            <div className={styles.actions}>
              <button type="button" onClick={() => plusMonth(o)} disabled={busy === o.id}>
                {t("partners.plusMonth")}
              </button>
              <button type="button" onClick={() => repeat(o)}>
                {t("partners.repeatOffer")}
              </button>
            </div>
            {o.state !== "ended" && (
              <div className={styles.actions}>
                <button type="button" onClick={() => change(o, { active: !o.active })} disabled={busy === o.id}>
                  {o.active ? t("offers.pause") : t("offers.resume")}
                </button>
                {o.max_couples != null && (
                  <button type="button" onClick={() => change(o, { max_couples: o.max_couples + 5 })} disabled={busy === o.id}>
                    {t("offers.addPlaces")}
                  </button>
                )}
                <a className={styles.linkBtn} href={`/poster/${o.id}`} target="_blank" rel="noreferrer">
                  {t("offers.poster")}
                </a>
              </div>
            )}
            <div className={styles.endRow}>
              <label>
                <span>{t("partners.extend")}</span>
                <input
                  type="datetime-local"
                  value={endDates[o.id] ?? localInputValue(o.ends_at)}
                  onChange={(e) => setEndDates((d) => ({ ...d, [o.id]: e.target.value }))}
                />
              </label>
              <button
                type="button"
                onClick={() => change(o, { ends_at: new Date(endDates[o.id] ?? localInputValue(o.ends_at)).toISOString() })}
                disabled={busy === o.id || !endDates[o.id]}
              >
                {saved === o.id ? t("partners.saved") : t("partners.save")}
              </button>
            </div>
          </article>
        ))}

        {page.requests.length > 0 && (
          <ul className={styles.requests}>
            {page.requests.map((r) => (
              <li key={r.id}>
                🎁 {r.offer_title} · {r.status === "pending" ? t("partners.waiting") : t("partners.notAccepted")}
                {r.refuse_reason ? ` (${r.refuse_reason})` : ""}
              </li>
            ))}
          </ul>
        )}

        <h2 className={styles.section}>{t("partners.newOffer")}</h2>
        <form className={styles.card} onSubmit={publishOffer} ref={newOfferForm}>
          <p className={styles.muted}>{t("partners.newOfferLive")}</p>
          <div className={styles.ideas}>
            {IDEAS.map((idea) => (
              <button
                type="button"
                key={idea.key}
                onClick={() =>
                  setNewOffer((n) => ({
                    ...n,
                    offer_title: t(`partners.tpl_${idea.key}`),
                    offer_details: t(`partners.tpl_${idea.key}_details`),
                  }))
                }
              >
                {idea.emoji} {t(`partners.tpl_${idea.key}`)}
              </button>
            ))}
          </div>
          <label className={styles.field}>
            <span>{t("partners.offerTitle")}</span>
            <input
              value={newOffer.offer_title}
              onChange={(e) => setNewOffer((n) => ({ ...n, offer_title: e.target.value }))}
              placeholder={t("partners.offerPlaceholder")}
              maxLength={120}
              required
            />
          </label>
          <label className={styles.field}>
            <span>{t("partners.offerDetails")}</span>
            <input
              value={newOffer.offer_details}
              onChange={(e) => setNewOffer((n) => ({ ...n, offer_details: e.target.value }))}
              placeholder={t("partners.detailsPlaceholder")}
              maxLength={500}
            />
          </label>
          <label className={styles.field}>
            <span>{t("partners.maxCouples")}</span>
            <input
              inputMode="numeric"
              value={newOffer.max_couples}
              onChange={(e) => setNewOffer((n) => ({ ...n, max_couples: e.target.value.replace(/\D/g, "").slice(0, 5) }))}
              placeholder="10"
            />
          </label>
          {sentNew && <p className={styles.ok}>{t("partners.publishedNow")}</p>}
          <button type="submit" className={styles.primary} disabled={publishing}>
            {publishing ? t("partners.sending") : t("partners.publishNow")}
          </button>
        </form>

        <p className={styles.muted}>
          <Link to="/venue">{t("offers.venueTitle")} →</Link>
        </p>
      </main>
    </div>
  );
}
