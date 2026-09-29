import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BASE_URL } from "../api/config";
import { postJson } from "../api/errors";
import { formatDeadline, formatHours } from "../api/offers";
import styles from "../pages/AdminPromos.module.css";

// Admin: "Partner with Blossom" requests (approve - after correcting if
// needed - or refuse) and the partner venues (their private manager link).
export function PartnerRequests({ token, onApproved }) {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const result = await postJson(`${BASE_URL}/partners/requests`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (result.ok) setItems(result.data);
    else setError(result.message || t("partners.failed"));
  }, [token, t]);

  useEffect(() => {
    load();
  }, [load]);

  if (items === null) return error ? <p className={styles.error}>{error}</p> : null;
  const pending = items.filter((r) => r.status === "pending");
  const done = items.filter((r) => r.status !== "pending");

  return (
    <section className={styles.partnerBlock}>
      <h2 className={styles.blockTitle}>{t("partners.requests")}</h2>
      {error && <p className={styles.error}>{error}</p>}
      {pending.length === 0 && <p className={styles.muted}>{t("partners.noRequests")}</p>}
      {pending.map((r) => (
        <RequestCard
          key={r.id}
          request={r}
          token={token}
          language={i18n.language}
          onDone={() => {
            load();
            onApproved?.();
          }}
        />
      ))}
      {done.length > 0 && (
        <details className={styles.couples}>
          <summary>
            {t("partners.status_approved")} / {t("partners.status_refused")} ({done.length})
          </summary>
          <table>
            <tbody>
              {done.map((r) => (
                <tr key={r.id}>
                  <td>{r.venue_name}</td>
                  <td>{r.offer_title}</td>
                  <td>{t(`partners.status_${r.status}`)}</td>
                  <td className={styles.muted}>{formatDeadline(r.reviewed_at, i18n.language)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </section>
  );
}

function RequestCard({ request: r, token, language, onDone }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [refusing, setRefusing] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [edits, setEdits] = useState({
    venue_name: r.venue_name || "",
    city: r.city || "",
    country: r.country || "",
    offer_title: r.offer_title || "",
    offer_details: r.offer_details || "",
    max_couples: r.max_couples == null ? "" : String(r.max_couples),
  });
  const newVenue = r.kind === "new_venue";

  async function send(path, body) {
    setBusy(true);
    setError("");
    const result = await postJson(`${BASE_URL}/partners/requests/${r.id}/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message || t("partners.failed"));
      return;
    }
    onDone();
  }

  function approve() {
    const body = {};
    if (editing) {
      Object.assign(body, {
        offer_title: edits.offer_title,
        offer_details: edits.offer_details || null,
        max_couples: edits.max_couples ? parseInt(edits.max_couples, 10) : null,
      });
      if (newVenue) Object.assign(body, { venue_name: edits.venue_name, city: edits.city, country: edits.country });
    }
    send("approve", body);
  }

  const field = (key, label) => (
    <label className={styles.field}>
      <span>{label}</span>
      <input value={edits[key]} onChange={(e) => setEdits((x) => ({ ...x, [key]: e.target.value }))} />
    </label>
  );

  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.spot}>
          {newVenue ? t("partners.newVenue") : t("partners.newOfferFrom", { name: r.venue?.name || r.venue_name })}
        </span>
        <span className={styles.muted}>{formatDeadline(r.created_at, language)}</span>
      </div>
      <h2 className={styles.offerTitle}>🏪 {r.venue_name}</h2>
      <p className={styles.line}>
        📍 {[r.city, r.country].filter(Boolean).join(", ")}
        {r.map_url && (
          <>
            {" · "}
            <a href={r.map_url} target="_blank" rel="noreferrer">
              {t("partners.openMaps")}
            </a>
          </>
        )}
      </p>
      {r.about && <p className={styles.muted}>{r.about}</p>}
      <p className={styles.stats}>🎁 {r.offer_title}</p>
      {r.offer_details && <p className={styles.muted}>{r.offer_details}</p>}
      <p className={styles.line}>
        {r.max_couples == null ? t("offers.noLimit") : t("offers.placesLeft", { count: r.max_couples })}
        {r.ends_at && <> · {t("offers.until", { date: formatDeadline(r.ends_at, language) })}</>}
        {r.valid_hours && <> · {t("offers.validAfterYes", { time: formatHours(r.valid_hours, t) })}</>}
      </p>
      {!r.ends_at && !r.valid_hours && <p className={styles.muted}>{t("partners.defaults")}</p>}
      {(r.contact_name || r.contact_email || r.contact_phone) && (
        <p className={styles.line}>
          👤 {t("partners.contact")}: {[r.contact_name, r.contact_email, r.contact_phone].filter(Boolean).join(" · ")}
        </p>
      )}
      {r.message && <p className={styles.muted}>💬 {r.message}</p>}
      {r.suggested_spot && (
        <p className={styles.line}>
          🔗 {t("partners.existingSpot", { name: r.suggested_spot.name })}
          {r.spot_chosen && <> ({t("partners.chosenByVenue")})</>}
        </p>
      )}

      {editing && (
        <div className={styles.editBox}>
          {newVenue && field("venue_name", t("partners.venueName"))}
          {newVenue && field("city", t("partners.city"))}
          {newVenue && field("country", t("partners.country"))}
          {field("offer_title", t("partners.offerTitle"))}
          {field("offer_details", t("partners.offerDetails"))}
          {field("max_couples", t("partners.maxCouples"))}
        </div>
      )}
      {refusing && (
        <label className={styles.field}>
          <span>{t("partners.refuseReason")}</span>
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
        </label>
      )}
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        {refusing ? (
          <>
            <button type="button" className={styles.danger} onClick={() => send("refuse", { reason: reason || null })} disabled={busy}>
              {t("partners.confirmRefuse")}
            </button>
            <button type="button" onClick={() => setRefusing(false)} disabled={busy}>
              {t("offers.cancel")}
            </button>
          </>
        ) : (
          <>
            <button type="button" className={styles.approveBtn} onClick={approve} disabled={busy}>
              {t("partners.approve")}
            </button>
            <button type="button" onClick={() => setEditing((v) => !v)} disabled={busy}>
              {t("partners.edit")}
            </button>
            <button type="button" className={styles.danger} onClick={() => setRefusing(true)} disabled={busy}>
              {t("partners.refuse")}
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export function PartnerVenues({ token, refreshKey }) {
  const { t } = useTranslation();
  const [venues, setVenues] = useState(null);
  const [copied, setCopied] = useState(null);

  const load = useCallback(async () => {
    const result = await postJson(`${BASE_URL}/partners/venues`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (result.ok) setVenues(result.data);
  }, [token]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function copy(venue) {
    try {
      await navigator.clipboard.writeText(venue.manage_url);
      setCopied(venue.id);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      window.prompt(t("partners.copyLink"), venue.manage_url);
    }
  }

  async function newLink(venue) {
    if (!window.confirm(t("partners.newLinkConfirm"))) return;
    const result = await postJson(`${BASE_URL}/partners/venues/${venue.id}/new_link`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (result.ok) setVenues((cur) => cur.map((v) => (v.id === venue.id ? result.data : v)));
  }

  if (!venues || venues.length === 0) return null;
  return (
    <section className={styles.partnerBlock}>
      <h2 className={styles.blockTitle}>{t("partners.venues")}</h2>
      {venues.map((v) => (
        <div key={v.id} className={styles.venueRow}>
          <div>
            <strong>{v.name}</strong>
            <span className={styles.muted}>
              {" "}
              · {v.spot?.city} · 🔑 {v.staff_code}
              {v.contact_email ? ` · ${v.contact_email}` : ""}
            </span>
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={() => copy(v)}>
              {copied === v.id ? t("partners.linkCopied") : t("partners.copyLink")}
            </button>
            <button type="button" onClick={() => newLink(v)}>
              {t("partners.newLink")}
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}

// "Contact us" messages from businesses: reply by email, mark as handled.
export function BusinessMessages({ token }) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState(null);

  const load = useCallback(async () => {
    const result = await postJson(`${BASE_URL}/partners/contact`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (result.ok) setMessages(result.data);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function setHandled(message, handled) {
    const result = await postJson(`${BASE_URL}/partners/contact/${message.id}/handled`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ handled }),
    });
    if (result.ok) setMessages((cur) => cur.map((m) => (m.id === message.id ? result.data : m)));
  }

  if (!messages) return null;
  return (
    <section className={styles.partnerBlock}>
      <h2 className={styles.blockTitle}>{t("business.messages")}</h2>
      {messages.length === 0 && <p className={styles.muted}>{t("business.noMessages")}</p>}
      {messages.map((m) => (
        <article key={m.id} className={`${styles.card} ${m.handled ? styles.handled : ""}`}>
          <div className={styles.cardTop}>
            <span className={styles.spot}>
              {m.name}
              {m.business ? ` · ${m.business}` : ""}
            </span>
            <span className={styles.muted}>
              {t(`business.topic_${m.topic}`)} · {formatDeadline(m.created_at, i18n.language)}
            </span>
          </div>
          <p className={styles.messageText}>{m.message}</p>
          <p className={styles.muted}>
            {m.email}
            {m.phone ? ` · ${m.phone}` : ""}
          </p>
          <div className={styles.actions}>
            <a className={styles.linkBtn} href={`mailto:${m.email}?subject=${encodeURIComponent("Blossom")}`}>
              {t("business.reply")}
            </a>
            <button type="button" onClick={() => setHandled(m, !m.handled)}>
              {m.handled ? t("business.reopen") : t("business.markHandled")}
            </button>
            {m.handled && <span className={styles.muted}>{t("business.handled")}</span>}
          </div>
        </article>
      ))}
    </section>
  );
}
