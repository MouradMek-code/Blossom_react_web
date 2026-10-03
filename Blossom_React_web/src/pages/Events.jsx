import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import Footer from "../components/Footer";
import { BASE_URL } from "../api/config";
import { IMG } from "../api/images";
import { EVENT_KINDS, KIND_EMOJI, KIND_GRADIENT, eventDay, eventWhen } from "../api/events";
import styles from "./Events.module.css";

function authHeaders() {
  const token = sessionStorage.getItem("token");
  return token && token !== "null" && token !== "undefined" ? { Authorization: `Bearer ${token}` } : {};
}

// blossom-date.com/events - date ideas, group outings and language exchanges
// organised by members. Everyone can look; members say "I'm interested",
// comment, and the organiser matches who they'd like to meet.
export default function Events() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const loggedIn = Boolean(authHeaders().Authorization);
  const [events, setEvents] = useState(null);
  const [locations, setLocations] = useState([]);
  const [kind, setKind] = useState("");
  const [city, setCity] = useState("");
  const [mine, setMine] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (mine) params.set("mine", "true");
    else {
      if (kind) params.set("kind", kind);
      if (city) params.set("city", city);
    }
    try {
      const [listResp, locResp] = await Promise.all([
        fetch(`${BASE_URL}/events?${params}`, { headers: authHeaders() }),
        fetch(`${BASE_URL}/events/locations`),
      ]);
      setEvents(listResp.ok ? await listResp.json() : []);
      if (locResp.ok) setLocations(await locResp.json());
      setError("");
    } catch {
      setError(t("dashboard.loadError"));
      setEvents([]);
    }
  }, [kind, city, mine, t]);

  useEffect(() => {
    load();
  }, [load]);

  const cities = locations.flatMap((l) => l.cities);

  return (
    <div className={styles.page}>
      <PageNav />
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Blossom</p>
        <h1 className={styles.title}>📅 {t("events.title")}</h1>
        <p className={styles.subtitle}>{t("events.subtitle")}</p>
        {loggedIn ? (
          <Link to="/events/new" className={styles.createBtn}>
            ＋ {t("events.create")}
          </Link>
        ) : (
          <div className={styles.guest}>
            <button type="button" className={styles.createBtn} onClick={() => navigate("/sign_up")}>
              ＋ {t("events.create")}
            </button>
            <p className={styles.muted}>
              {t("events.signUpToCreate")} <Link to="/login">{t("nav.login")}</Link>
            </p>
          </div>
        )}
      </header>

      <main className={styles.body}>
        {loggedIn && (
          <div className={styles.switch} role="tablist">
            <button type="button" role="tab" aria-selected={!mine} className={!mine ? styles.switchOn : styles.switchOff}
              onClick={() => setMine(false)}>
              {t("events.allEvents")}
            </button>
            <button type="button" role="tab" aria-selected={mine} className={mine ? styles.switchOn : styles.switchOff}
              onClick={() => setMine(true)}>
              {t("events.myEvents")}
            </button>
          </div>
        )}

        {!mine && (
          <div className={styles.filters}>
            <div className={styles.chips}>
              <button type="button" className={!kind ? styles.chipOn : styles.chip} onClick={() => setKind("")}>
                {t("events.allTypes")}
              </button>
              {EVENT_KINDS.map((k) => (
                <button key={k} type="button" className={kind === k ? styles.chipOn : styles.chip}
                  onClick={() => setKind(kind === k ? "" : k)}>
                  {KIND_EMOJI[k]} {t(`events.kind_${k}`)}
                </button>
              ))}
            </div>
            {cities.length > 1 && (
              <div className={styles.chips}>
                <button type="button" className={!city ? styles.chipOn : styles.chip} onClick={() => setCity("")}>
                  {t("events.allCities")}
                </button>
                {cities.map((c) => (
                  <button key={c} type="button" className={city === c ? styles.chipOn : styles.chip}
                    onClick={() => setCity(city === c ? "" : c)}>
                    📍 {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}
        {events === null ? (
          <p className={styles.muted}>{t("dashboard.loading")}</p>
        ) : events.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyIcon}>📅</p>
            <p>{mine ? t("events.emptyMine") : t("events.empty")}</p>
            {loggedIn && (
              <Link to="/events/new" className={styles.createBtnSmall}>＋ {t("events.create")}</Link>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {events.map((event) => (
              <EventCard key={event.id} event={event} t={t} language={i18n.language} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export function EventCard({ event, t, language }) {
  const { day, month } = eventDay(event.starts_at, language);
  const [from, to] = KIND_GRADIENT[event.kind] || KIND_GRADIENT.group;
  return (
    <Link to={`/events/${event.id}`} className={`${styles.card} ${event.status !== "active" ? styles.cardOff : ""}`}>
      <div className={styles.media}>
        {event.image_url ? (
          <img src={IMG.card(event.image_url)} alt="" loading="lazy" />
        ) : (
          <span className={styles.noImage} style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
            {KIND_EMOJI[event.kind]}
          </span>
        )}
        <span className={styles.dateBadge}>
          <strong>{day}</strong>
          <span>{month}</span>
        </span>
        <span className={styles.kindPill}>
          {KIND_EMOJI[event.kind]} {t(`events.kind_${event.kind}`)}
        </span>
      </div>
      <div className={styles.cardBody}>
        <h2 className={styles.cardTitle}>{event.title}</h2>
        <p className={styles.when}>🕒 {eventWhen(event.starts_at, language)}</p>
        <p className={styles.place}>📍 {event.place_name} · {event.city}</p>
        <div className={styles.tags}>
          {event.spot?.offer && <span className={styles.giftTag}>🎁 {event.spot.offer.title}</span>}
          {event.women_only && <span className={styles.tag}>👩 {t("events.womenOnly")}</span>}
          {event.status === "cancelled" && <span className={styles.tagWarn}>{t("events.cancelled")}</span>}
        </div>
        <div className={styles.cardFoot}>
          <span className={styles.organizer}>
            {event.organizer?.photo ? (
              <img src={IMG.thumb(event.organizer.photo)} alt="" />
            ) : (
              <span className={styles.avatarEmpty}>🌸</span>
            )}
            {t("events.organisedBy", { name: event.organizer?.first_name || "?" })}
          </span>
          <span className={styles.counts}>
            🙋 {event.interested_count} · 💬 {event.comment_count}
          </span>
        </div>
      </div>
    </Link>
  );
}
