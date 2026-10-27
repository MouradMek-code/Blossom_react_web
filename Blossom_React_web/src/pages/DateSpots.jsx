import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageNav from "../components/PageNav";
import Footer from "../components/Footer";
import LocationPicker from "../components/LocationPicker";
import SpotsMap from "../components/SpotsMap";
import SpotPhotoMode from "../components/SpotPhotoMode";
import { BASE_URL } from "../api/config";
import { IMG } from "../api/images";
import { offerTerms } from "../api/offers";
import { KIND_EMOJI, eventDay, eventWhen } from "../api/events";
import { isNewSpot, matchesName, orderSpots } from "../api/spotOrder";
import { buildCollections, proofParts } from "../api/spotCollections";
import { mapPoints } from "../api/spotMap";
import { friendlyError, NETWORK_ERROR, postJson } from "../api/errors";
import { isImageFile, shrink } from "../api/photoUpload";
import {
  BEST_FOR,
  CATEGORIES,
  bestForLabel,
  categoryEmoji,
  categoryGradient,
  categoryLabel,
  fullPlace,
  shortPlace,
} from "../api/categories";
import styles from "./DateSpots.module.css";

// Fire-and-forget engagement tracking. Never block or surface errors: a missed
// count must never get in the way of the user opening a place.
// A venue promotion for matched couples who go together ("🎁 -20%...").
function OfferPill({ offer }) {
  if (!offer) return null;
  return <span className={styles.offerPill}>🎁 {offer.title}</span>;
}

function track(spotId, action) {
  fetch(`${BASE_URL}/date_spots/${spotId}/${action}`, { method: "POST" }).catch(() => {});
}

// Social proof line. Deliberately renders nothing for a zero count: an empty
// spot shouldn't advertise "0 views".
function SpotStats({ spot, t, className }) {
  const views = spot?.view_count || 0;
  const went = spot?.map_click_count || 0;
  if (views < 1 && went < 1) return null;
  return (
    <p className={className}>
      {views >= 1 && <span>👁 {t("dateSpots.viewsCount", { count: views })}</span>}
      {views >= 1 && went >= 1 && <span> · </span>}
      {went >= 1 && <span>🧭 {t("dateSpots.wentCount", { count: went })}</span>}
    </p>
  );
}

const ROTATE_MS = 2000;
const MAX_ROTATING = 7;
const MAX_MORE_PHOTOS = 6;

// A place with several photos: they take turns every 2 seconds, fading. The
// first one stays in the page's flow (it gives the size); the others lie on
// top of it, in the same positioned box, and fade in one after another.
// Each card starts at its own moment, so they don't all change together.
function RotatingPhotos({ urls, className, alt, lazy }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (urls.length < 2) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    let timer;
    const start = setTimeout(() => {
      timer = setInterval(() => setIndex((i) => (i + 1) % urls.length), ROTATE_MS);
    }, Math.random() * ROTATE_MS);
    return () => {
      clearTimeout(start);
      clearInterval(timer);
    };
  }, [urls.length]);

  return (
    <>
      <img className={className} src={urls[0]} alt={alt} loading={lazy ? "lazy" : undefined} />
      {urls.slice(1).map((url, i) => (
        <img
          key={url}
          className={`${className} ${styles.rotatorTop} ${index === i + 1 ? styles.rotatorOn : ""}`}
          src={url}
          alt=""
          aria-hidden="true"
          loading="lazy"
        />
      ))}
    </>
  );
}

// The spot's photo, or - for places without one, like the starter spots - a
// backdrop tinted by vibe with the vibe's emoji, so the card still looks
// intentional.
function SpotBackdrop({ spot, imgClass, src, lazy }) {
  if (spot.image_url) {
    if ((spot.photos || []).length > 1) {
      // Same size as the main photo asked for (card or full).
      const size = src === IMG.full(spot.image_url) ? IMG.full : IMG.card;
      return (
        <RotatingPhotos
          urls={spot.photos.slice(0, MAX_ROTATING).map(size)}
          className={imgClass}
          alt={spot.name}
          lazy={lazy}
        />
      );
    }
    return (
      <img
        className={imgClass}
        src={src}
        alt={spot.name}
        loading={lazy ? "lazy" : undefined}
      />
    );
  }
  const [from, to] = categoryGradient(spot.category);
  return (
    <div
      className={styles.noImage}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <span className={styles.noImageEmoji} aria-hidden="true">
        {categoryEmoji(spot.category)}
      </span>
    </div>
  );
}

// "📍 Châtelet, Paris"
function placeLine(spot) {
  return `📍 ${shortPlace(spot)}`;
}

// "♥ 3  📅 2  💞 5": saves, upcoming events, couples who used the gift.
function ProofLine({ spot, t, className }) {
  const parts = proofParts(spot);
  if (parts.length === 0) return null;
  return (
    <p className={`${styles.proof} ${className || ""}`}>
      {parts.map(([icon, key, count]) => (
        <span key={key} title={t(`dateSpots.${key}`)}>
          {icon} {count}
        </span>
      ))}
    </p>
  );
}

// ⭐ Spot of the week: an admin's pick (with their words), or else the most
// saved place this week. The whole card opens the place.
function SpotOfWeek({ data, t, saved, onOpen, onToggleSave }) {
  const { spot, note, picked } = data;
  const text = picked ? (note ? `“${note}”` : spot.description) : t("dateSpots.spotOfWeekAuto");
  return (
    <section className={styles.sotw} onClick={onOpen}>
      <div className={styles.sotwMedia}>
        <SpotBackdrop spot={spot} imgClass={styles.sotwImage} src={IMG.full(spot.image_url)} />
        <SaveHeart saved={saved} onToggle={onToggleSave} t={t} />
      </div>
      <div className={styles.sotwBody}>
        <span className={styles.sotwLabel}>{t("dateSpots.spotOfWeek")}</span>
        <h2 className={styles.sotwName}>{spot.name}</h2>
        <p className={styles.sotwPlace}>{placeLine(spot)}</p>
        {spot.offer && <p className={styles.sotwGift}>🎁 {spot.offer.title}</p>}
        {text && <p className={styles.sotwNote}>{text}</p>}
        <ProofLine spot={spot} t={t} className={styles.sotwProof} />
        <span className={styles.sotwCta}>{t("dateSpots.spotOfWeekSee")}</span>
      </div>
    </section>
  );
}

// Admin: make the open spot the spot of the week (with a note), or stop it.
function FeatureBox({ spot, isFeatured, token, t, onChanged }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function send(remove) {
    setBusy(true);
    setMessage("");
    const result = await postJson(`${BASE_URL}/date_spots/${spot.id}/feature`, {
      method: remove ? "DELETE" : "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: remove ? undefined : JSON.stringify({ note: note.trim() || null }),
    });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setMessage(remove ? "" : t("dateSpots.featureDone"));
    setNote("");
    onChanged();
  }

  return (
    <div className={styles.featureBox}>
      <strong>{t("dateSpots.featureTitle")}</strong>
      {isFeatured ? (
        <button type="button" className={styles.featureRemove} onClick={() => send(true)} disabled={busy}>
          {t("dateSpots.featureRemove")}
        </button>
      ) : (
        <div className={styles.featureRow}>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("dateSpots.featureNotePlaceholder")}
            maxLength={300}
          />
          <button type="button" onClick={() => send(false)} disabled={busy}>
            {t("dateSpots.featurePick")}
          </button>
        </div>
      )}
      {message && <p className={styles.featureMessage}>{message}</p>}
    </div>
  );
}

// ♡ / ♥ in a card's corner. Its own click: it never opens the card.
function SaveHeart({ saved, onToggle, t }) {
  return (
    <button
      type="button"
      className={`${styles.saveHeart} ${saved ? styles.saveHeartOn : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={saved}
      aria-label={saved ? t("dateSpots.saved") : t("dateSpots.save")}
      title={saved ? t("dateSpots.saved") : t("dateSpots.save")}
    >
      {saved ? "♥" : "♡"}
    </button>
  );
}

// A partner café/restaurant's gift: the gift itself is the title, then where,
// the terms, and the invite right on the card.
function GiftCard({ spot, t, onOpen, onInvite, saved, onToggleSave }) {
  return (
    <article className={styles.giftCard} onClick={onOpen}>
      <div className={styles.giftMedia}>
        <SpotBackdrop spot={spot} imgClass={styles.giftImage} src={IMG.card(spot.image_url)} lazy />
        <span className={styles.giftRibbon}>{t("dateSpots.giftRibbon")}</span>
        <SaveHeart saved={saved} onToggle={onToggleSave} t={t} />
      </div>
      <div className={styles.giftBody}>
        <strong className={styles.giftOffer}>{spot.offer.title}</strong>
        <span className={styles.giftVenue}>{spot.name}</span>
        <span className={styles.giftPlace}>{placeLine(spot)}</span>
        <span className={styles.giftTerms}>{offerTerms(spot.offer, t)}</span>
        <ProofLine spot={spot} t={t} className={styles.giftProof} />
        {onInvite ? (
          <button
            type="button"
            className={styles.giftInvite}
            onClick={(e) => {
              e.stopPropagation();
              onInvite();
            }}
          >
            💌 {t("dateSpots.invite")}
          </button>
        ) : (
          <span className={styles.giftSee}>{t("dateSpots.giftSee")} →</span>
        )}
      </div>
    </article>
  );
}

// Admin-only editor for a spot's counters, shown right under its photo.
// Used to seed a venue's numbers or correct them; everyone else never sees it.
function AdminStatsEditor({ spot, token, t, onSaved }) {
  const [views, setViews] = useState(String(spot.view_count || 0));
  const [went, setWent] = useState(String(spot.map_click_count || 0));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  // Switching to another spot must reload that spot's numbers, not keep the
  // previous one's.
  useEffect(() => {
    setViews(String(spot.view_count || 0));
    setWent(String(spot.map_click_count || 0));
    setStatus("");
  }, [spot.id, spot.view_count, spot.map_click_count]);

  async function save() {
    setSaving(true);
    setStatus("");
    try {
      const resp = await fetch(`${BASE_URL}/date_spots/${spot.id}/stats`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          view_count: Math.max(0, parseInt(views, 10) || 0),
          map_click_count: Math.max(0, parseInt(went, 10) || 0),
        }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        setStatus(friendlyError(data, resp));
      } else {
        setStatus(t("dateSpots.adminSaved"));
        onSaved(data);
        setTimeout(() => setStatus(""), 2000);
      }
    } catch {
      setStatus(NETWORK_ERROR);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.adminBox}>
      <p className={styles.adminTitle}>🛠️ {t("dateSpots.adminTitle")}</p>
      <div className={styles.adminRow}>
        <label className={styles.adminField}>
          <span>👁 {t("dateSpots.adminViews")}</span>
          <input
            className={styles.adminInput}
            type="number"
            min="0"
            value={views}
            onChange={(e) => setViews(e.target.value)}
          />
        </label>
        <label className={styles.adminField}>
          <span>🧭 {t("dateSpots.adminWent")}</span>
          <input
            className={styles.adminInput}
            type="number"
            min="0"
            value={went}
            onChange={(e) => setWent(e.target.value)}
          />
        </label>
        <button className={styles.adminSave} onClick={save} disabled={saving}>
          {saving ? t("dateSpots.adminSaving") : t("dateSpots.adminSave")}
        </button>
      </div>
      {status !== "" && <p className={styles.adminStatus}>{status}</p>}
    </div>
  );
}

function DateSpots() {
  const { t } = useTranslation();
  const [spots, setSpots] = useState([]);
  const [locations, setLocations] = useState([]);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [bestFor, setBestFor] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [suggestSent, setSuggestSent] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [inviteSpot, setInviteSpot] = useState(null);
  // ♡ The spots I saved (the list says so when I'm logged in).
  const [savedIds, setSavedIds] = useState(() => new Set());
  // ⭐ Spot of the week (null when there's none).
  const [spotOfWeek, setSpotOfWeek] = useState(null);
  // "📸 Photo mode": the spot as a clean poster, for a screenshot.
  const [photoSpot, setPhotoSpot] = useState(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState("");
  const { id: routeId } = useParams();
  const navigate = useNavigate();

  const token = sessionStorage.getItem("token");
  const isLoggedIn = token && token !== "undefined" && token !== "null";
  const [me, setMe] = useState(null);
  const isAdmin = Boolean(me?.is_admin);

  // The token only carries the username, so ask the backend who this is:
  // admins get the counter editor and starter-spot import, authors get Edit.
  useEffect(() => {
    if (!isLoggedIn) return;
    let alive = true;
    fetch(`${BASE_URL}/user/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive || !data) return;
        setMe(data);
        // Chat works out which bubbles are "mine" from this. An invite sends
        // the user straight into a conversation, so make sure it's set.
        if (data.profile_id) sessionStorage.setItem("profile_id", data.profile_id);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [token, isLoggedIn]);

  // Admins: any spot. Members: the spots they shared, until a spot becomes a
  // partner (venue or gifts) - then only admins (the server says the same).
  function canEdit(spot) {
    if (isAdmin) return true;
    return me?.profile_id != null && spot?.profile?.id === me.profile_id && !spot?.partner;
  }

  // Reflect an admin edit straight away, in the open detail card and in the
  // list behind it, so the new numbers show without a refetch.
  function applyStats(updated) {
    if (!updated?.id) return;
    // The answer has no `offer` (only the list attaches it): keep the gift box.
    const merge = (spot) => ({ ...spot, ...updated, offer: updated.offer ?? spot.offer });
    setSpots((prev) => prev.map((s) => (s.id === updated.id ? merge(s) : s)));
    setSelected((cur) => (cur && cur.id === updated.id ? merge(cur) : cur));
  }

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (country) params.set("country", country);
    if (city) params.set("city", city);
    if (category) params.set("category", category);
    if (bestFor) params.set("best_for", bestFor);
    const qs = params.toString();
    try {
      const [spotsResp, locResp] = await Promise.all([
        fetch(`${BASE_URL}/date_spots${qs ? `?${qs}` : ""}`, {
          headers: isLoggedIn ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`${BASE_URL}/date_spots/locations`),
      ]);
      const list = spotsResp.ok ? await spotsResp.json() : [];
      setSpots(list);
      setSavedIds(new Set(list.filter((s) => s.saved).map((s) => s.id)));
      setLocations(locResp.ok ? await locResp.json() : []);
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  }, [country, city, category, bestFor, isLoggedIn, token]);

  const loadSpotOfWeek = useCallback(async () => {
    const result = await postJson(`${BASE_URL}/date_spots/featured`, {
      headers: isLoggedIn ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = result.ok ? result.data : null;
    setSpotOfWeek(data && data.spot ? data : null);
    if (data?.spot?.saved) setSavedIds((cur) => new Set(cur).add(data.spot.id));
  }, [isLoggedIn, token]);

  useEffect(() => {
    loadSpotOfWeek();
  }, [loadSpotOfWeek]);

  // ♡ / ♥ - straight away on screen, undone if the server says no.
  async function toggleSave(spot) {
    if (!isLoggedIn) {
      navigate("/sign_up");
      return;
    }
    const was = savedIds.has(spot.id);
    const flip = (cur) => {
      const next = new Set(cur);
      if (was) next.delete(spot.id);
      else next.add(spot.id);
      return next;
    };
    setSavedIds(flip);
    const result = await postJson(`${BASE_URL}/date_spots/${spot.id}/save`, {
      method: was ? "DELETE" : "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!result.ok) {
      setSavedIds((cur) => {
        const next = new Set(cur);
        if (was) next.add(spot.id);
        else next.delete(spot.id);
        return next;
      });
      setError(result.message);
    }
  }

  useEffect(() => {
    load();
  }, [load]);

  // Deep link: /date-spots/:id opens that spot's detail straight away.
  useEffect(() => {
    if (!routeId || spots.length === 0) return;
    const match = spots.find((s) => String(s.id) === String(routeId));
    if (match) setSelected(match);
  }, [routeId, spots]);

  function openSpot(spot) {
    setCopied(false);
    setSelected(spot);
    track(spot.id, "view");
  }

  function closeSpot() {
    setSelected(null);
    setCopied(false);
    if (routeId) navigate("/date-spots", { replace: true });
  }

  // Admins (any spot) and whoever shared it. Its gifts and the codes couples
  // got there go with it, so the confirmation says so.
  async function deleteSpot(spot) {
    if (deleting || !window.confirm(t("dateSpots.deleteConfirm", { name: spot.name }))) return;
    setDeleting(true);
    const result = await postJson(`${BASE_URL}/date_spots/${spot.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setDeleting(false);
    if (!result.ok) {
      window.alert(result.message);
      return;
    }
    setSpots((prev) => prev.filter((s) => s.id !== spot.id));
    closeSpot();
  }

  // "Suggest a place" (members) / "Add a place" (admins): the form sits at the
  // bottom of the page - the gifts come first.
  function openSuggest() {
    if (!isLoggedIn) {
      navigate("/sign_up");
      return;
    }
    setEditing(null);
    setSuggestSent(false);
    setFormOpen(true);
    setTimeout(() => document.getElementById("suggest")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function startEdit(spot) {
    closeSpot();
    setFormOpen(false);
    setEditing(spot);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function shareSpot(spot) {
    const url = `${window.location.origin}/date-spots/${spot.id}`;
    const payload = { title: spot.name, text: t("dateSpots.shareText"), url };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        // user dismissed the share sheet - fall through to copying
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function seedStarterSpots() {
    if (!window.confirm(t("dateSpots.adminSeedConfirm"))) return;
    setSeeding(true);
    setSeedStatus("");
    const result = await postJson(`${BASE_URL}/date_spots/admin/seed`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setSeeding(false);
    if (!result.ok) {
      setSeedStatus(result.message);
      return;
    }
    setSeedStatus(t("dateSpots.adminSeedDone", result.data));
    load();
  }

  // Every city with spots, A to Z. Picking a city picks its country too.
  const cityChoices = useMemo(
    () =>
      locations
        .flatMap((l) => l.cities.map((name) => ({ name, country: l.country })))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [locations],
  );

  const hasFilters = Boolean(country || city || category || bestFor);
  // The first spot gets the full-width featured treatment; the rest tile
  // below. Newest spots first, then a random order (see orderSpots).
  // Spots with a venue promotion for couples: their own row, and a filter.
  // /date-spots?gifts=1 (the homepage's "See spots with gifts") opens with
  // the filter on.
  const [promoOnly, setPromoOnly] = useState(
    () => new URLSearchParams(window.location.search).get("gifts") === "1",
  );
  const [query, setQuery] = useState("");
  const [view, setView] = useState("list"); // "list" | "map"
  // Country and "best for" live in a panel behind ⚙️, so the places come first.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const panelCount = (country && !city ? 1 : 0) + (bestFor ? 1 : 0);
  // Picked once per visit: the random part of the order stays put while the
  // page is open (refreshes, edits) and changes on the next visit.
  const [seed] = useState(() => Math.random());
  const searching = query.trim() !== "";
  const promoSpots = spots.filter((s) => s.offer);
  const ordered = orderSpots(promoOnly ? promoSpots : spots, seed);
  const shownSpots = searching ? ordered.filter((s) => matchesName(s, query)) : ordered;
  const [featured, ...rest] = shownSpots;
  // No search or vibe chosen: the page's "home" - gifts, then themed rows.
  const browsing = !searching && !category && !bestFor && !promoOnly;
  const collections = browsing ? buildCollections(ordered) : [];

  function clearFilters() {
    setCountry("");
    setCity("");
    setCategory("");
    setBestFor("");
    setPromoOnly(false);
    setQuery("");
  }

  return (
    <>
      <div className={styles.page}>
        <PageNav />

        <header className={styles.hero}>
          <p className={styles.eyebrow}>{t("dateSpots.eyebrow")}</p>
          <h1 className={styles.title}>{t("dateSpots.title")}</h1>
          <p className={styles.subtitle}>{t("dateSpots.subtitle")}</p>
          <div className={styles.heroLinks}>
            {/* Promotion codes a match and I got at spots with 🎁. */}
            {isLoggedIn && (
              <Link to="/promotions" className={styles.myPromos}>
                {t("offers.myPromos")}
              </Link>
            )}
            <Link to="/partner" className={styles.partnerLink}>
              {t("dateSpots.offerGiftLink")}
            </Link>
          </div>
          {isAdmin && (
            <div className={styles.seedRow}>
              <button className={styles.seedBtn} onClick={openSuggest}>
                ＋ {t("dateSpots.addPlace")}
              </button>{" "}
              <button className={styles.seedBtn} onClick={seedStarterSpots} disabled={seeding}>
                🛠️ {seeding ? t("dateSpots.adminSeeding") : t("dateSpots.adminSeed")}
              </button>
              {seedStatus !== "" && <p className={styles.adminStatus}>{seedStatus}</p>}
            </div>
          )}
        </header>

        <div className={styles.body}>
          {error !== "" && <p className={styles.error}>{error}</p>}

          {editing && (
            <AddSpotForm
              key={editing.id}
              token={token}
              initial={editing}
              onCancel={() => setEditing(null)}
              onSaved={() => {
                setEditing(null);
                load();
              }}
            />
          )}

          {/* ⭐ Spot of the week, first and big. */}
          {spotOfWeek && browsing && (
            <SpotOfWeek
              data={spotOfWeek}
              t={t}
              saved={savedIds.has(spotOfWeek.spot.id)}
              onOpen={() => openSpot(spotOfWeek.spot)}
              onToggleSave={() => toggleSave(spotOfWeek.spot)}
            />
          )}

          {/* One slim bar: city, search, more filters, list / map. */}
          <div className={styles.toolbar}>
            <label className={styles.citySelect}>
              <span aria-hidden="true">📍</span>
              <select
                value={city ? `${country}|${city}` : ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) {
                    setCity("");
                    return;
                  }
                  const [nextCountry, nextCity] = value.split("|");
                  setCountry(nextCountry);
                  setCity(nextCity);
                }}
                aria-label={t("dateSpots.city")}
              >
                <option value="">{t("dateSpots.allCities")}</option>
                {cityChoices.map((c) => (
                  <option key={`${c.country}|${c.name}`} value={`${c.country}|${c.name}`}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          <div className={styles.search}>
            <span className={styles.searchIcon} aria-hidden="true">🔎</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("dateSpots.searchPlaceholder")}
              aria-label={t("dateSpots.searchPlaceholder")}
            />
            {searching && (
              <button type="button" onClick={() => setQuery("")} aria-label={t("dateSpots.clearSearch")}>
                ✕
              </button>
            )}
          </div>
            <button
              type="button"
              className={`${styles.filtersBtn} ${filtersOpen || panelCount > 0 ? styles.filtersBtnOn : ""}`}
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
            >
              ⚙️ {t("dateSpots.moreFilters")}
              {panelCount > 0 ? ` (${panelCount})` : ""}
            </button>
          <div className={styles.viewSwitch} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={view === "list"}
              className={view === "list" ? styles.viewOn : styles.viewOff}
              onClick={() => setView("list")}
            >
              📋 {t("dateSpots.viewList")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "map"}
              className={view === "map" ? styles.viewOn : styles.viewOff}
              onClick={() => setView("map")}
            >
              🗺️ {t("dateSpots.viewMap")}
            </button>
          </div>
          </div>

          {/* Country and "best for": behind ⚙️. */}
          {filtersOpen && (
            <div className={styles.filterPanel}>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>{t("dateSpots.country")}</span>
              <div className={styles.chipRow}>
                <button
                  className={`${styles.chip} ${!country ? styles.chipActive : ""}`}
                  onClick={() => {
                    setCountry("");
                    setCity("");
                  }}
                >
                  🌍 {t("dateSpots.allCountries")}
                </button>
                {locations.map((l) => (
                  <button
                    key={l.country}
                    className={`${styles.chip} ${country === l.country ? styles.chipActive : ""}`}
                    onClick={() => {
                      setCountry(l.country);
                      setCity("");
                    }}
                  >
                    {l.country}
                  </button>
                ))}
              </div>
            </div>

            {/* Tap a chip again to clear it. */}
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>{t("dateSpots.bestFor")}</span>
              <div className={styles.chipRow}>
                {BEST_FOR.map((b) => (
                  <button
                    key={b}
                    className={`${styles.chip} ${styles.chipSmall} ${bestFor === b ? styles.chipActive : ""}`}
                    onClick={() => setBestFor(bestFor === b ? "" : b)}
                  >
                    {bestForLabel(b, t)}
                  </button>
                ))}
              </div>
            </div>

              {(country || city || category || bestFor || promoOnly || searching) && (
                <button type="button" className={styles.clearFilters} onClick={clearFilters}>
                  ✕ {t("dateSpots.clearFilters")}
                </button>
              )}
            </div>
          )}

          {/* The vibes: one row (it scrolls sideways on a phone). */}
          <div className={styles.categoryRow}>
            <button
              type="button"
              className={`${styles.chip} ${styles.chipSmall} ${!category && !promoOnly ? styles.chipActive : ""}`}
              onClick={() => {
                setCategory("");
                setPromoOnly(false);
              }}
            >
              {t("dateSpots.allCategories")}
            </button>
            {(promoSpots.length > 0 || promoOnly) && (
              <button
                type="button"
                className={`${styles.chip} ${styles.chipSmall} ${styles.chipGift} ${promoOnly ? styles.chipGiftOn : ""}`}
                onClick={() => setPromoOnly((on) => !on)}
              >
                {t("dateSpots.filterGifts")} · {promoSpots.length}
              </button>
            )}
            {CATEGORIES.map((c) => (
              <button
                type="button"
                key={c}
                className={`${styles.chip} ${styles.chipSmall} ${category === c ? styles.chipActive : ""}`}
                onClick={() => setCategory(category === c ? "" : c)}
              >
                {categoryEmoji(c)} {categoryLabel(c, t)}
              </button>
            ))}
          </div>

          {/* The gifts partner cafés and restaurants offer: first, and big. */}
          {promoSpots.length > 0 && browsing && (
            <section className={styles.gifts}>
              <div className={styles.giftsHead}>
                <h2 className={styles.giftsTitle}>{t("dateSpots.giftsTitle")}</h2>
                <p className={styles.giftsSubtitle}>{t("dateSpots.giftsSubtitle")}</p>
              </div>
              <div className={styles.giftsList}>
                {promoSpots.map((spot) => (
                  <GiftCard
                    key={spot.id}
                    spot={spot}
                    t={t}
                    onOpen={() => openSpot(spot)}
                    onInvite={isLoggedIn ? () => setInviteSpot(spot) : null}
                    saved={savedIds.has(spot.id)}
                    onToggleSave={() => toggleSave(spot)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Themed rows, Netflix-style. */}
          {view === "list" &&
            !loading &&
            collections.map((c) => (
              <section key={c.key} className={styles.collection}>
                <h2 className={styles.collectionTitle}>
                  {c.emoji} {t(`dateSpots.col_${c.key}`)}
                </h2>
                <div className={styles.collectionRow}>
                  {c.spots.map((spot) => (
                    <article key={spot.id} className={styles.miniCard} onClick={() => openSpot(spot)}>
                      <SpotBackdrop spot={spot} imgClass={styles.miniImage} src={IMG.card(spot.image_url)} lazy />
                      <div className={styles.scrim} />
                      <SaveHeart saved={savedIds.has(spot.id)} onToggle={() => toggleSave(spot)} t={t} />
                      <div className={styles.miniInfo}>
                        {spot.offer && <span className={styles.miniGift}>🎁 {spot.offer.title}</span>}
                        <strong>{spot.name}</strong>
                        <small>{placeLine(spot)}</small>
                        <ProofLine spot={spot} t={t} className={styles.miniProof} />
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}

          <h2 className={styles.sectionTitle}>
            {t("dateSpots.allSpots")} · {shownSpots.length}
          </h2>

          {loading ? (
            <div className={styles.grid}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={styles.skeleton}>
                  <div className={styles.skelImage} />
                  <div className={styles.skelLine} />
                  <div className={`${styles.skelLine} ${styles.skelShort}`} />
                </div>
              ))}
            </div>
          ) : shownSpots.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📍</div>
              <p className={styles.emptyTitle}>{t("dateSpots.emptyTitle")}</p>
              <p className={styles.emptyText}>
                {searching
                  ? t("dateSpots.searchEmpty", { query: query.trim() })
                  : promoOnly
                  ? t("dateSpots.emptyGifts")
                  : hasFilters
                    ? t("dateSpots.emptyFiltered")
                    : t("dateSpots.emptyAll")}
              </p>
            </div>
          ) : view === "map" ? (
            <div className={styles.mapBlock}>
              <SpotsMap spots={shownSpots} onOpen={openSpot} />
              {shownSpots.length > mapPoints(shownSpots).length && (
                <p className={styles.mapNote}>
                  {t("dateSpots.mapMissing", { count: shownSpots.length - mapPoints(shownSpots).length })}{" "}
                  <button type="button" className={styles.inlineLink} onClick={() => setView("list")}>
                    {t("dateSpots.viewList")} →
                  </button>
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Featured */}
              <article
                className={styles.featured}
                onClick={() => openSpot(featured)}
                style={{ animationDelay: "0ms" }}
              >
                <SpotBackdrop
                  spot={featured}
                  imgClass={styles.featuredImage}
                  src={IMG.full(featured.image_url)}
                />
                <div className={styles.scrim} />
                <SaveHeart saved={savedIds.has(featured.id)} onToggle={() => toggleSave(featured)} t={t} />
                <span className={`${styles.featuredFlag} ${featured.offer ? styles.featuredFlagGift : ""}`}>
                  {featured.offer
                    ? t("dateSpots.giftRibbon")
                    : isNewSpot(featured)
                      ? `🆕 ${t("dateSpots.newBadge")}`
                      : `★ ${t("dateSpots.featured")}`}
                </span>
                <div className={styles.featuredInfo}>
                  <OfferPill offer={featured.offer} />
                  {featured.category && (
                    <span className={styles.tag}>
                      {categoryLabel(featured.category, t)}
                    </span>
                  )}
                  <h2 className={styles.featuredTitle}>{featured.name}</h2>
                  <p className={styles.overlayPlace}>{placeLine(featured)}</p>
                  <p className={styles.featuredText}>{featured.description}</p>
                  <SpotStats spot={featured} t={t} className={styles.overlayStats} />
                  <ProofLine spot={featured} t={t} />
                </div>
              </article>

              {/* Grid */}
              {rest.length > 0 && (
                <div className={styles.grid}>
                  {rest.map((spot, i) => (
                    <article
                      key={spot.id}
                      className={`${styles.card} ${spot.offer ? styles.cardGift : ""}`}
                      onClick={() => openSpot(spot)}
                      style={{ animationDelay: `${(i + 1) * 60}ms` }}
                    >
                      <SpotBackdrop
                        spot={spot}
                        imgClass={styles.cardImage}
                        src={IMG.card(spot.image_url)}
                        lazy
                      />
                      <div className={styles.scrim} />
                      <SaveHeart saved={savedIds.has(spot.id)} onToggle={() => toggleSave(spot)} t={t} />
                      <div className={styles.cardInfo}>
                        <OfferPill offer={spot.offer} />
                        {isNewSpot(spot) && (
                          <span className={`${styles.tag} ${styles.newTag}`}>🆕 {t("dateSpots.newBadge")}</span>
                        )}
                        {spot.category && (
                          <span className={styles.tag}>
                            {categoryLabel(spot.category, t)}
                          </span>
                        )}
                        <h3 className={styles.cardTitle}>{spot.name}</h3>
                        <p className={styles.overlayPlace}>{placeLine(spot)}</p>
                        <SpotStats spot={spot} t={t} className={styles.overlayStats} />
                        <ProofLine spot={spot} t={t} />
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Members suggest places (an admin approves them): a discreet line at
              the very bottom - the gifts come first. Admins add places here too. */}
          <div className={styles.suggest} id="suggest">
            {suggestSent ? (
              <p className={styles.suggestThanks}>🌸 {t("dateSpots.suggestThanks")}</p>
            ) : formOpen && isLoggedIn && !editing ? (
              <AddSpotForm
                token={token}
                isAdmin={isAdmin}
                onCancel={() => setFormOpen(false)}
                onSaved={(saved) => {
                  setFormOpen(false);
                  if (saved?.status === "pending") setSuggestSent(true);
                  else load();
                }}
              />
            ) : (
              <p className={styles.suggestLine}>
                {t("dateSpots.suggestTitle")}{" "}
                <button type="button" className={styles.inlineLink} onClick={openSuggest}>
                  {t("dateSpots.suggestButton")} →
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {selected && (
        <div className={styles.detailOverlay} onClick={closeSpot}>
          <div className={styles.detailCard} onClick={(e) => e.stopPropagation()}>
            <button className={styles.detailClose} onClick={closeSpot} aria-label="Close">
              ✕
            </button>
            {selected.image_url ? (
              <div className={styles.detailPhotos}>
                <SpotBackdrop spot={selected} imgClass={styles.detailImage} src={IMG.full(selected.image_url)} />
              </div>
            ) : (
              <div
                className={styles.detailBanner}
                style={{
                  background: `linear-gradient(135deg, ${categoryGradient(selected.category).join(", ")})`,
                }}
              >
                <span className={styles.detailBannerEmoji} aria-hidden="true">
                  {categoryEmoji(selected.category)}
                </span>
              </div>
            )}
            {isAdmin && (
              <FeatureBox
                key={selected.id}
                spot={selected}
                isFeatured={Boolean(spotOfWeek?.picked && spotOfWeek.spot.id === selected.id)}
                token={token}
                t={t}
                onChanged={loadSpotOfWeek}
              />
            )}
            {isAdmin && (
              <AdminStatsEditor
                spot={selected}
                token={token}
                t={t}
                onSaved={applyStats}
              />
            )}
            <div className={styles.detailBody}>
              {(selected.category || selected.best_for?.length > 0) && (
                <div className={styles.detailTags}>
                  {selected.category && (
                    <span className={styles.detailTag}>
                      {categoryLabel(selected.category, t)}
                    </span>
                  )}
                  {(selected.best_for || []).map((b) => (
                    <span key={b} className={styles.bestForPill}>
                      {bestForLabel(b, t)}
                    </span>
                  ))}
                </div>
              )}
              <h2 className={styles.detailTitle}>{selected.name}</h2>
              <p className={styles.detailPlace}>📍 {fullPlace(selected)}</p>
              {/* Right away, no scrolling: organise something here, or (for
                  the café's staff) offer couples a gift here. */}
              <div className={styles.quickRow}>
                <button
                  type="button"
                  className={`${styles.quickBtn} ${styles.quickSave} ${savedIds.has(selected.id) ? styles.quickSaveOn : ""}`}
                  onClick={() => toggleSave(selected)}
                  aria-pressed={savedIds.has(selected.id)}
                >
                  {savedIds.has(selected.id) ? `♥ ${t("dateSpots.saved")}` : `♡ ${t("dateSpots.save")}`}
                </button>
                <Link
                  to={isLoggedIn ? `/events/new?spot=${selected.id}` : "/sign_up"}
                  className={styles.quickBtn}
                >
                  📅 {t("events.eventsAtSpot")}
                </Link>
                {!selected.offer && (
                  <Link to={`/partner?spot=${selected.id}`} className={`${styles.quickBtn} ${styles.quickGift}`}>
                    🎁 {t("dateSpots.offerGiftShort")}
                  </Link>
                )}
              </div>
              <SpotStats spot={selected} t={t} className={styles.detailStats} />
              {proofParts(selected).length > 0 && (
                <p className={styles.detailProof}>
                  {proofParts(selected).map(([icon, key, count]) => (
                    <span key={key}>
                      {icon} {t(`dateSpots.${key}`)}: <strong>{count}</strong>
                    </span>
                  ))}
                </p>
              )}
              {selected.offer && (
                <div className={styles.offerBox}>
                  <strong className={styles.offerBoxTitle}>🎁 {selected.offer.title}</strong>
                  {selected.offer.details && <p className={styles.offerBoxDetails}>{selected.offer.details}</p>}
                  <p className={styles.offerBoxTerms}>{offerTerms(selected.offer, t)}</p>
                  <p className={styles.offerBoxHow}>{t("offers.howTo")}</p>
                </div>
              )}
              <p className={styles.detailText}>{selected.description}</p>
              {selected.profile?.first_name && (
                <p className={styles.detailAuthor}>
                  {t("dateSpots.sharedBy", { name: selected.profile.first_name })}
                </p>
              )}
              <div className={styles.detailActions}>
                {isLoggedIn && (
                  <button className={styles.inviteBtn} onClick={() => setInviteSpot(selected)}>
                    💌 {t("dateSpots.invite")}
                  </button>
                )}
                {selected.map_url && (
                  <a
                    // The invite is the main action for logged-in users; for
                    // visitors, directions stay the primary button.
                    className={isLoggedIn ? styles.secondaryLink : styles.mapBtn}
                    href={selected.map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track(selected.id, "map_click")}
                  >
                    🗺️ {t("dateSpots.openMap")}
                  </a>
                )}
                <button className={styles.shareBtn} onClick={() => shareSpot(selected)}>
                  🔗 {copied ? t("dateSpots.linkCopied") : t("dateSpots.shareLink")}
                </button>
                <button className={styles.shareBtn} onClick={() => setPhotoSpot(selected)}>
                  📸 {t("photoMode.button")}
                </button>
                {canEdit(selected) && (
                  <button className={styles.shareBtn} onClick={() => startEdit(selected)}>
                    ✏️ {t("dateSpots.edit")}
                  </button>
                )}
                {canEdit(selected) && (
                  <button
                    className={`${styles.shareBtn} ${styles.deleteBtn}`}
                    onClick={() => deleteSpot(selected)}
                    disabled={deleting}
                  >
                    🗑️ {deleting ? t("dateSpots.deleting") : t("dateSpots.delete")}
                  </button>
                )}
              </div>
              <SpotEvents spotId={selected.id} t={t} />
            </div>
          </div>
        </div>
      )}

      {photoSpot && <SpotPhotoMode spot={photoSpot} onClose={() => setPhotoSpot(null)} />}

      {inviteSpot && (
        <InvitePicker
          spot={inviteSpot}
          token={token}
          onClose={() => setInviteSpot(null)}
          onSent={(conversationId) => navigate(`/chat/${conversationId}`)}
        />
      )}
      <Footer />
    </>
  );
}

// Pick a match to send this spot to. The invite lands in your conversation as
// a card ("Want to go to ... together?") - for a woman opening the chat, it's
// a ready-made first message.
// "Upcoming events here" in a spot's card (creating one is at the top).
function SpotEvents({ spotId, t }) {
  const { i18n } = useTranslation();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    let alive = true;
    fetch(`${BASE_URL}/events?spot_id=${spotId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => alive && setEvents(Array.isArray(data) ? data : []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [spotId]);

  if (events.length === 0) return null;
  return (
    <div className={styles.spotEvents}>
      {events.length > 0 && (
        <>
          <p className={styles.spotEventsTitle}>{t("events.upcomingHere")}</p>
          <ul className={styles.spotEventsList}>
            {events.slice(0, 3).map((event) => {
              const { day, month } = eventDay(event.starts_at, i18n.language);
              return (
                <li key={event.id}>
                  <Link to={`/events/${event.id}`} className={styles.spotEvent}>
                    <span className={styles.spotEventDate}>
                      <strong>{day}</strong>
                      {month}
                    </span>
                    <span className={styles.spotEventText}>
                      <strong>{KIND_EMOJI[event.kind]} {event.title}</strong>
                      <small>{eventWhen(event.starts_at, i18n.language)} · 🙋 {event.interested_count}</small>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function InvitePicker({ spot, token, onClose, onSent }) {
  const { t } = useTranslation();
  const [matches, setMatches] = useState(null); // null while loading
  const [error, setError] = useState("");
  const [sendingId, setSendingId] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch(`${BASE_URL}/profile/profiles/matched`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (alive) setMatches(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!alive) return;
        setMatches([]);
        setError(NETWORK_ERROR);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  async function invite(match) {
    setSendingId(match.id);
    setError("");
    const result = await postJson(`${BASE_URL}/date_spots/${spot.id}/invite`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        profile_id: match.id,
        content: t("dateSpots.inviteMessage", { name: spot.name }),
      }),
    });
    setSendingId(null);
    if (!result.ok) {
      // e.g. "the woman has to send the first message" - shown as-is.
      setError(result.message);
      return;
    }
    onSent(result.data.conversation_id);
  }

  return (
    <div className={styles.inviteOverlay} onClick={onClose}>
      <div
        className={styles.inviteSheet}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className={styles.detailClose} onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h3 className={styles.inviteTitle}>
          💌 {t("dateSpots.inviteTitle", { name: spot.name })}
        </h3>
        <p className={styles.inviteHint}>{t("dateSpots.inviteHint")}</p>
        {error !== "" && <p className={styles.error}>{error}</p>}

        {matches === null ? (
          <p className={styles.inviteHint}>{t("dateSpots.inviteLoading")}</p>
        ) : matches.length === 0 ? (
          <p className={styles.inviteEmpty}>{t("dateSpots.inviteEmpty")}</p>
        ) : (
          <ul className={styles.matchList}>
            {matches.map((m) => (
              <li key={m.id}>
                <button
                  className={styles.matchRow}
                  onClick={() => invite(m)}
                  disabled={sendingId !== null}
                >
                  {m.photos?.[0]?.image_url ? (
                    <img
                      className={styles.matchPhoto}
                      src={IMG.thumb(m.photos[0].image_url)}
                      alt=""
                    />
                  ) : (
                    <span className={styles.matchPhotoEmpty}>🌸</span>
                  )}
                  <span className={styles.matchName}>
                    {m.first_name}
                    {m.age ? `, ${m.age}` : ""}
                  </span>
                  <span className={styles.matchAction}>
                    {sendingId === m.id ? t("dateSpots.inviteSending") : "→"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const GOOGLE_MAPS_LINK = /^https?:\/\/(www\.)?([a-z-]+\.)?(google\.[a-z.]+|goo\.gl|maps\.app\.goo\.gl)\//i;

// Used both to share a new place and, with `initial`, to edit an existing one
// (authors their own, admins any - e.g. adding a photo to a starter spot).
//
// Sharing is kept to what takes seconds: paste the Google Maps link (which also
// fills in the name and makes "Open in Google Maps" exact), pick a vibe, done.
// City and country come from the profile; neighborhood and "best for" wait
// behind "More details".
function AddSpotForm({ token, initial, isAdmin = false, onCancel, onSaved }) {
  const { t } = useTranslation();
  const editing = Boolean(initial);
  const [mapUrl, setMapUrl] = useState(initial?.map_url || "");
  const [linkStatus, setLinkStatus] = useState(""); // "" | "reading" | "noName"
  const [name, setName] = useState(initial?.name || "");
  const [place, setPlace] = useState({ country: initial?.country || "", city: initial?.city || "" });
  // Filled in from the person's profile (not chosen): say so, so a café in
  // another city doesn't end up listed in theirs.
  const [placeFromProfile, setPlaceFromProfile] = useState(false);
  const placeTouched = useRef(false);
  const [placeMissing, setPlaceMissing] = useState(false);
  const [neighborhood, setNeighborhood] = useState(initial?.neighborhood || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [bestFor, setBestFor] = useState(initial?.best_for || []);
  const [showDetails, setShowDetails] = useState(
    Boolean(initial?.neighborhood || initial?.best_for?.length),
  );
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  // More photos: the ones already saved (editing) and the ones just picked.
  const [gallery, setGallery] = useState(initial?.gallery || []);
  const [moreFiles, setMoreFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Members: "I'd love this place to offer a gift to couples".
  const [wantsGift, setWantsGift] = useState(false);
  // The name we filled in from the link, so a newer link can replace it -
  // but never a name the person typed themselves.
  const autoName = useRef("");

  function fillName(value) {
    const previous = autoName.current;
    autoName.current = value;
    setName((cur) => (!cur.trim() || cur === previous ? value : cur));
  }

  // Most date spots are in the city people live in: start from their profile.
  useEffect(() => {
    if (editing) return undefined;
    let alive = true;
    fetch(`${BASE_URL}/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((resp) => (resp.ok ? resp.json() : null))
      .then((profile) => {
        if (alive && profile?.country && !placeTouched.current) {
          setPlace({ country: profile.country, city: profile.city || "" });
          setPlaceFromProfile(true);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [editing, token]);

  // Pasting the link fills in the name. Google Maps' share text sometimes
  // comes whole ("name / address / link"): keep just the link, and its first
  // line already is the name.
  useEffect(() => {
    const raw = mapUrl.trim();
    const found = raw.match(/https?:\/\/\S+/);
    if (!found || (editing && raw === initial?.map_url)) {
      setLinkStatus("");
      return undefined;
    }
    if (found[0] !== raw) {
      const firstLine = raw
        .slice(0, found.index)
        .split("\n")
        .map((line) => line.trim())
        .find(Boolean);
      if (firstLine) fillName(firstLine);
      setMapUrl(found[0]);
      return undefined;
    }
    if (!GOOGLE_MAPS_LINK.test(raw)) {
      setLinkStatus("");
      return undefined;
    }
    let alive = true;
    const timer = setTimeout(async () => {
      setLinkStatus("reading");
      try {
        const resp = await fetch(
          `${BASE_URL}/date_spots/resolve_link?url=${encodeURIComponent(raw)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = resp.ok ? await resp.json() : null;
        if (!alive) return;
        if (data?.name) {
          fillName(data.name);
          setLinkStatus("");
        } else {
          setLinkStatus("noName");
        }
      } catch {
        if (alive) setLinkStatus("noName");
      }
    }, 500);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [mapUrl, token, editing, initial?.map_url]);

  function pickFile(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  // More photos: up to 6 besides the main one (the ones already there count).
  async function pickMore(e) {
    const picked = Array.from(e.target.files || []).filter(isImageFile);
    e.target.value = "";
    const room = MAX_MORE_PHOTOS - gallery.length - moreFiles.length;
    if (picked.length > room) setError(t("dateSpots.tooManyPhotos"));
    const added = await Promise.all(picked.slice(0, Math.max(0, room)).map(shrink));
    setMoreFiles((cur) => [...cur, ...added.map((f) => ({ file: f, url: URL.createObjectURL(f) }))]);
  }

  async function removeSaved(photo) {
    if (!window.confirm(t("dateSpots.removePhotoConfirm"))) return;
    const result = await postJson(`${BASE_URL}/date_spots/${initial.id}/photos/${photo.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (result.ok) setGallery(result.data.gallery || []);
    else setError(result.message);
  }

  // After saving: the extra photos, one by one. Returns the place as it ends up.
  async function uploadMore(spotId, saved) {
    let latest = saved;
    for (const { file: extra } of moreFiles) {
      const body = new FormData();
      body.append("image", extra, extra.name || "photo.jpg");
      const result = await postJson(`${BASE_URL}/date_spots/${spotId}/photos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (!result.ok) {
        setError(result.message);
        break;
      }
      latest = result.data;
    }
    return latest;
  }

  function toggleBestFor(value) {
    setBestFor((cur) =>
      cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
    );
  }

  function create() {
    const body = new FormData();
    body.append("name", name.trim());
    body.append("city", place.city.trim());
    body.append("country", place.country.trim());
    body.append("map_url", mapUrl.trim());
    if (description.trim()) body.append("description", description.trim());
    if (neighborhood.trim()) body.append("neighborhood", neighborhood.trim());
    if (category) body.append("category", category);
    if (bestFor.length > 0) body.append("best_for", bestFor.join(","));
    if (file) body.append("image", file);
    if (!isAdmin && wantsGift) body.append("wants_gift", "true");
    return postJson(`${BASE_URL}/date_spots`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
  }

  // Details go as JSON (so clearing a field works), then the photo separately
  // if a new one was picked.
  async function saveEdit() {
    const result = await postJson(`${BASE_URL}/date_spots/${initial.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
        city: place.city.trim(),
        country: place.country.trim(),
        neighborhood: neighborhood.trim(),
        description: description.trim(),
        category,
        best_for: bestFor,
        map_url: mapUrl.trim(),
      }),
    });
    if (!result.ok || !file) return result;
    const body = new FormData();
    body.append("image", file);
    return postJson(`${BASE_URL}/date_spots/${initial.id}/image`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
  }

  async function submit(e) {
    e.preventDefault();
    setError("");

    // Required when sharing; older places being edited may not have one yet.
    if (!editing && !mapUrl.trim()) return setError(t("dateSpots.errLink"));
    if (mapUrl.trim() && !GOOGLE_MAPS_LINK.test(mapUrl.trim()))
      return setError(t("dateSpots.errMapUrl"));
    if (!name.trim()) return setError(t("dateSpots.errName"));
    if (!place.city.trim() || !place.country.trim()) {
      setPlaceMissing(true);
      return setError(t("dateSpots.errPlace"));
    }

    setSubmitting(true);
    const result = editing ? await saveEdit() : await create();
    if (!result.ok) {
      setSubmitting(false);
      return setError(result.message);
    }
    const saved = moreFiles.length > 0 ? await uploadMore(result.data.id, result.data) : result.data;
    setSubmitting(false);
    onSaved(saved);
  }

  const shownPhoto = preview || (editing ? initial.image_url : null);

  return (
    <form className={styles.form} onSubmit={submit}>
      <h2 className={styles.formTitle}>
        {editing ? t("dateSpots.editTitle") : isAdmin ? t("dateSpots.addPlace") : t("dateSpots.suggestFormTitle")}
      </h2>
      {error !== "" && <p className={styles.error}>{error}</p>}

      {/* 1. The Google Maps link: exact place, and usually the name too. */}
      <label className={styles.label}>
        <span>
          {t("dateSpots.mapLink")} {!editing && <span className={styles.req}>*</span>}
        </span>
        <span className={styles.hint}>{t("dateSpots.mapLinkHint")}</span>
        <input
          className={styles.input}
          value={mapUrl}
          onChange={(e) => setMapUrl(e.target.value)}
          placeholder={t("dateSpots.mapLinkPlaceholder")}
          autoComplete="off"
        />
      </label>
      {linkStatus === "reading" && <p className={styles.linkStatus}>{t("dateSpots.linkReading")}</p>}
      {linkStatus === "noName" && <p className={styles.linkStatus}>{t("dateSpots.linkNoName")}</p>}

      {/* 2. Name - filled in from the link, still editable. */}
      <label className={styles.label}>
        {t("dateSpots.name")} <span className={styles.req}>*</span>
        <input
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("dateSpots.namePlaceholder")}
        />
      </label>

      {/* 3. Where - its own city and country, always in view. */}
      <div className={`${styles.where} ${placeMissing ? styles.whereMissing : ""}`}>
        <p className={styles.whereTitle}>
          {t("dateSpots.whereTitle")} <span className={styles.req}>*</span>
        </p>
        <p className={styles.hint}>{t("dateSpots.whereHint")}</p>
        <LocationPicker
          country={place.country}
          city={place.city}
          onChange={(next) => {
            placeTouched.current = true;
            setPlace(next);
            setPlaceFromProfile(false);
            if (next.city && next.country) setPlaceMissing(false);
          }}
        />
        {placeFromProfile && <p className={styles.wherePrefilled}>ℹ️ {t("dateSpots.wherePrefilled")}</p>}
      </div>

      {/* 4. Vibe - one click. */}
      <p className={styles.label}>{t("dateSpots.category")}</p>
      <div className={styles.pickRow}>
        {CATEGORIES.map((c) => (
          <button
            type="button"
            key={c}
            className={`${styles.chip} ${styles.chipSmall} ${category === c ? styles.chipActive : ""}`}
            onClick={() => setCategory(category === c ? "" : c)}
          >
            {categoryEmoji(c)} {categoryLabel(c, t)}
          </button>
        ))}
      </div>

      <label className={styles.label}>
        {editing ? t("dateSpots.photoReplace") : t("dateSpots.photo")}
        <input className={styles.file} type="file" accept="image/*" onChange={pickFile} />
      </label>
      {shownPhoto && <img className={styles.preview} src={shownPhoto} alt="Preview" />}

      {/* Up to 6 more: they take turns on the place's card. */}
      <label className={styles.label}>
        {t("dateSpots.morePhotos")}
        <span className={styles.hint}>{t("dateSpots.morePhotosHint")}</span>
        <input
          className={styles.file}
          type="file"
          accept="image/*"
          multiple
          onChange={pickMore}
          disabled={gallery.length + moreFiles.length >= MAX_MORE_PHOTOS}
        />
      </label>
      {(gallery.length > 0 || moreFiles.length > 0) && (
        <div className={styles.thumbs}>
          {gallery.map((photo) => (
            <span key={photo.id} className={styles.thumb}>
              <img src={IMG.thumb(photo.image_url)} alt="" />
              <button type="button" onClick={() => removeSaved(photo)} aria-label={t("dateSpots.removePhoto")} title={t("dateSpots.removePhoto")}>
                ✕
              </button>
            </span>
          ))}
          {moreFiles.map((extra, i) => (
            <span key={extra.url} className={styles.thumb}>
              <img src={extra.url} alt="" />
              <button
                type="button"
                onClick={() => setMoreFiles((cur) => cur.filter((_, j) => j !== i))}
                aria-label={t("dateSpots.removePhoto")}
                title={t("dateSpots.removePhoto")}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <label className={styles.label}>
        {t("dateSpots.whyOptional")}
        <textarea
          className={styles.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder={t("dateSpots.whyPlaceholder")}
        />
      </label>

      {/* Rarely needed, so out of the way. */}
      <button
        type="button"
        className={styles.detailsToggle}
        onClick={() => setShowDetails((open) => !open)}
      >
        {showDetails ? `− ${t("dateSpots.lessDetails")}` : `+ ${t("dateSpots.moreDetails")}`}
      </button>
      {showDetails && (
        <>
          <label className={styles.label}>
            {t("dateSpots.neighborhood")}
            <input
              className={styles.input}
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder={t("dateSpots.neighborhoodPlaceholder")}
            />
          </label>

          <p className={styles.label}>{t("dateSpots.bestFor")}</p>
          <div className={styles.pickRow}>
            {BEST_FOR.map((b) => (
              <button
                type="button"
                key={b}
                className={`${styles.chip} ${styles.chipSmall} ${bestFor.includes(b) ? styles.chipActive : ""}`}
                onClick={() => toggleBestFor(b)}
              >
                {bestForLabel(b, t)}
              </button>
            ))}
          </div>
        </>
      )}

      {!editing && !isAdmin && (
        <label className={styles.giftWish}>
          <input type="checkbox" checked={wantsGift} onChange={(e) => setWantsGift(e.target.checked)} />
          <span>🎁 {t("dateSpots.wantsGift")}</span>
        </label>
      )}

      <p className={styles.safety}>{t("dateSpots.safety")}</p>

      {/* A last look at where it goes, right by the button. */}
      {place.city && place.country && (
        <p className={styles.whereSummary}>
          📍 {t("dateSpots.whereSummary", { place: `${place.city}, ${place.country}` })}
        </p>
      )}

      <div className={styles.formActions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          {t("dateSpots.cancel")}
        </button>
        <button type="submit" className={styles.submitBtn} disabled={submitting}>
          {editing
            ? submitting
              ? t("dateSpots.saving")
              : t("dateSpots.saveChanges")
            : submitting
              ? t("dateSpots.submitting")
              : isAdmin
                ? t("dateSpots.submit")
                : t("dateSpots.suggestSend")}
        </button>
      </div>
    </form>
  );
}

export default DateSpots;
