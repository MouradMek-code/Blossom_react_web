import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import Footer from "../components/Footer";
import LocationPicker from "../components/LocationPicker";
import { BASE_URL } from "../api/config";
import { postJson } from "../api/errors";
import { IMG } from "../api/images";
import { categoryEmoji } from "../api/categories";
import styles from "./Partner.module.css";

const EMPTY = {
  venue_name: "",
  map_url: "",
  about: "",
  offer_title: "",
  offer_details: "",
  max_couples: "",
  ends_at: "",
  days: "7",
  hours: "0",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  message: "",
  website: "", // hidden: people leave it empty, bots fill it
};

const GOOGLE_MAPS_LINK = /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|(www\.)?google\.[a-z.]+\/maps)/i;

// blossom-date.com/partner - a café, restaurant or bar asks to offer a
// promotion to Blossom couples. No account: an admin reviews it and answers
// by email (with the venue's manager link and staff code when approved).
// A place already on Blossom is picked from a search (or comes with the
// spot page's "Is this your place?" link, ?spot=<id>): the gift then goes on
// that spot instead of a new one.
export default function Partner() {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState(EMPTY);
  const [place, setPlace] = useState({ country: "", city: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const autoName = useRef("");
  const [spot, setSpot] = useState(null); // the place, when it's already on Blossom
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null); // null = nothing searched yet

  function pickSpot(found) {
    setSpot(found);
    setQuery("");
    setResults(null);
    setError("");
  }

  // Opened from a spot's page: /partner?spot=<id>.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("spot");
    if (!id) return undefined;
    let alive = true;
    fetch(`${BASE_URL}/partners/spots/${encodeURIComponent(id)}`)
      .then((resp) => (resp.ok ? resp.json() : null))
      .then((found) => {
        if (alive && found) pickSpot(found);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // "Is your place already on Blossom?" - search as they type.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      return undefined;
    }
    let alive = true;
    const timer = setTimeout(async () => {
      try {
        const resp = await fetch(`${BASE_URL}/partners/spots?q=${encodeURIComponent(q)}`);
        const found = resp.ok ? await resp.json() : [];
        if (alive) setResults(found);
      } catch {
        if (alive) setResults([]);
      }
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Pasting the Google Maps link fills in the name (unless typed already).
  useEffect(() => {
    const url = form.map_url.trim();
    if (!GOOGLE_MAPS_LINK.test(url)) return undefined;
    const timer = setTimeout(async () => {
      try {
        const resp = await fetch(`${BASE_URL}/date_spots/resolve_link?url=${encodeURIComponent(url)}`);
        if (!resp.ok) return;
        const { name } = await resp.json();
        if (!name) return;
        setForm((f) => {
          if (f.venue_name && f.venue_name !== autoName.current) return f;
          autoName.current = name;
          return { ...f, venue_name: name };
        });
      } catch {
        // just type the name
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.map_url]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    const validHours = (parseInt(form.days, 10) || 0) * 24 + (parseInt(form.hours, 10) || 0);
    setSending(true);
    // A place already on Blossom: its spot gives the name, city and country.
    const placeFields = spot
      ? { spot_id: spot.id }
      : {
          venue_name: form.venue_name,
          map_url: form.map_url || null,
          city: place.city,
          country: place.country,
          about: form.about || null,
        };
    const result = await postJson(`${BASE_URL}/partners/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...placeFields,
        offer_title: form.offer_title,
        offer_details: form.offer_details || null,
        max_couples: form.max_couples ? parseInt(form.max_couples, 10) : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        valid_hours: validHours || null,
        contact_name: form.contact_name || null,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone || null,
        message: form.message || null,
        language: (i18n.language || "en").slice(0, 2),
        website: form.website || null,
      }),
    });
    setSending(false);
    if (!result.ok) {
      const reason = result.data?.detail?.reason;
      if (reason === "already_partner") {
        setSpot((cur) => (cur ? { ...cur, partner: true } : cur));
        return;
      }
      if (reason === "spot_gone") {
        setSpot(null);
        setError(t("partners.spotGone"));
        return;
      }
      setError(result.message || t("partners.failed"));
      return;
    }
    setSent(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className={styles.page}>
      <PageNav />
      <main className={styles.wrap}>
        <h1 className={styles.title}>🏪 {t("partners.title")}</h1>
        <p className={styles.intro}>{t("partners.intro")}</p>
        <ol className={styles.steps}>
          <li>{t("partners.how1")}</li>
          <li>{t("partners.how2")}</li>
          <li>{t("partners.how3")}</li>
        </ol>

        {sent ? (
          <div className={styles.sent}>
            <h2>{t("partners.sentTitle")}</h2>
            <p>{t("partners.sentText")}</p>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => {
                setForm(EMPTY);
                setPlace({ country: "", city: "" });
                setSpot(null);
                setSent(false);
              }}
            >
              {t("partners.another")}
            </button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={submit}>
            <h2 className={styles.section}>{t("partners.placeSection")}</h2>
            {spot ? (
              <>
                <p className={styles.chosenLabel}>{t("partners.yourPlace")}</p>
                <div className={styles.chosen}>
                  <SpotThumb spot={spot} />
                  <span className={styles.spotText}>
                    <strong>{spot.name}</strong>
                    <span>{[spot.neighborhood, spot.city, spot.country].filter(Boolean).join(", ")}</span>
                  </span>
                  <button type="button" className={styles.changeBtn} onClick={() => setSpot(null)}>
                    {t("partners.change")}
                  </button>
                </div>
                {spot.partner && (
                  <div className={styles.partnerNotice}>
                    <p>{t("partners.alreadyPartner")}</p>
                    <Link to="/business#lost-link">🔑 {t("partners.getLink")}</Link>
                  </div>
                )}
              </>
            ) : (
              <>
                <label className={styles.field}>
                  <span>🔎 {t("partners.searchLabel")}</span>
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("partners.searchPlaceholder")}
                    autoComplete="off"
                  />
                  <small>{t("partners.searchHint")}</small>
                </label>
                {results &&
                  (results.length > 0 ? (
                    <ul className={styles.results}>
                      {results.map((found) => (
                        <li key={found.id}>
                          <button type="button" className={styles.result} onClick={() => pickSpot(found)}>
                            <SpotThumb spot={found} />
                            <span className={styles.spotText}>
                              <strong>{found.name}</strong>
                              <span>{[found.neighborhood, found.city, found.country].filter(Boolean).join(", ")}</span>
                            </span>
                            {found.partner && <span className={styles.partnerTag}>{t("partners.partnerTag")}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.noResult}>{t("partners.searchNone")}</p>
                  ))}

                <p className={styles.orNew}>{t("partners.orNew")}</p>
                <label className={styles.field}>
                  <span>{t("partners.mapUrl")}</span>
                  <input value={form.map_url} onChange={set("map_url")} placeholder="https://maps.app.goo.gl/…" inputMode="url" />
                  <small>{t("partners.mapUrlHint")}</small>
                </label>
                <label className={styles.field}>
                  <span>{t("partners.venueName")} *</span>
                  <input value={form.venue_name} onChange={set("venue_name")} maxLength={150} required />
                </label>
                <div className={styles.field}>
                  <span>
                    {t("partners.city")} / {t("partners.country")} *
                  </span>
                  <LocationPicker country={place.country} city={place.city} onChange={setPlace} />
                </div>
                <label className={styles.field}>
                  <span>{t("partners.about")}</span>
                  <textarea value={form.about} onChange={set("about")} rows={3} maxLength={1000} />
                </label>
              </>
            )}

            <h2 className={styles.section}>{t("partners.offerSection")}</h2>
            <label className={styles.field}>
              <span>{t("partners.offerTitle")} *</span>
              <input
                value={form.offer_title}
                onChange={set("offer_title")}
                placeholder={t("partners.offerPlaceholder")}
                maxLength={120}
                required
              />
            </label>
            <label className={styles.field}>
              <span>{t("partners.offerDetails")}</span>
              <input value={form.offer_details} onChange={set("offer_details")} placeholder={t("partners.detailsPlaceholder")} maxLength={500} />
            </label>
            <div className={styles.row2}>
              <label className={styles.field}>
                <span>{t("partners.maxCouples")}</span>
                <input
                  inputMode="numeric"
                  value={form.max_couples}
                  onChange={(e) => setForm((f) => ({ ...f, max_couples: e.target.value.replace(/\D/g, "").slice(0, 5) }))}
                  placeholder="10"
                />
                <small>{t("partners.maxCouplesHint")}</small>
              </label>
              <label className={styles.field}>
                <span>{t("partners.endsAt")}</span>
                <input type="datetime-local" value={form.ends_at} onChange={set("ends_at")} />
                <small>{t("partners.endsAtHint")}</small>
              </label>
            </div>
            <div className={styles.field}>
              <span>{t("partners.validFor")}</span>
              <div className={styles.inline}>
                <input
                  inputMode="numeric"
                  value={form.days}
                  onChange={(e) => setForm((f) => ({ ...f, days: e.target.value.replace(/\D/g, "").slice(0, 3) }))}
                />
                <span>{t("offers.daysLabel")}</span>
                <input
                  inputMode="numeric"
                  value={form.hours}
                  onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value.replace(/\D/g, "").slice(0, 2) }))}
                />
                <span>{t("offers.hoursLabel")}</span>
              </div>
            </div>

            <h2 className={styles.section}>{t("partners.contactSection")}</h2>
            <div className={styles.row2}>
              <label className={styles.field}>
                <span>{t("partners.contactName")}</span>
                <input value={form.contact_name} onChange={set("contact_name")} maxLength={120} autoComplete="name" />
              </label>
              <label className={styles.field}>
                <span>{t("partners.contactEmail")} *</span>
                <input type="email" value={form.contact_email} onChange={set("contact_email")} maxLength={200} required autoComplete="email" />
              </label>
            </div>
            <label className={styles.field}>
              <span>{t("partners.contactPhone")}</span>
              <input type="tel" value={form.contact_phone} onChange={set("contact_phone")} maxLength={40} autoComplete="tel" />
            </label>
            <label className={styles.field}>
              <span>{t("partners.message")}</span>
              <textarea value={form.message} onChange={set("message")} rows={3} maxLength={1000} />
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
            <button type="submit" className={styles.primary} disabled={sending || Boolean(spot?.partner)}>
              {sending ? t("partners.sending") : t("partners.send")}
            </button>
          </form>
        )}
        <p className={styles.more}>
          <Link to="/business#lost-link">🔑 {t("business.lostTitle")}</Link>
          {" · "}
          <Link to="/business#contact">📩 {t("business.contactTitle")}</Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}

// The spot's photo, or its vibe's emoji.
function SpotThumb({ spot }) {
  return spot.image_url ? (
    <img className={styles.thumb} src={IMG.thumb(spot.image_url)} alt="" />
  ) : (
    <span className={`${styles.thumb} ${styles.thumbEmpty}`} aria-hidden="true">
      {categoryEmoji(spot.category)}
    </span>
  );
}
