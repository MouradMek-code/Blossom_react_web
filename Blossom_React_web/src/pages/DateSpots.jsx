import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import PageNav from "../components/PageNav";
import Footer from "../components/Footer";
import { BASE_URL } from "../api/config";
import { IMG } from "../api/images";
import { friendlyError, NETWORK_ERROR } from "../api/errors";
import { CATEGORIES, categoryLabel } from "../api/categories";
import styles from "./DateSpots.module.css";

// Fire-and-forget engagement tracking. Never block or surface errors: a missed
// count must never get in the way of the user opening a place.
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
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(false);
  const { id: routeId } = useParams();
  const navigate = useNavigate();

  const token = sessionStorage.getItem("token");
  const isLoggedIn = token && token !== "undefined" && token !== "null";
  const [isAdmin, setIsAdmin] = useState(false);

  // The token only carries the username, so ask the backend whether this
  // account is an admin - that gates the counter editor below each photo.
  useEffect(() => {
    if (!isLoggedIn) return;
    let alive = true;
    fetch(`${BASE_URL}/user/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive) setIsAdmin(Boolean(data?.is_admin));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [token, isLoggedIn]);

  // Reflect an admin edit straight away, in the open detail card and in the
  // list behind it, so the new numbers show without a refetch.
  function applyStats(updated) {
    if (!updated?.id) return;
    setSpots((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
    setSelected((cur) => (cur && cur.id === updated.id ? { ...cur, ...updated } : cur));
  }

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (country) params.set("country", country);
    if (city) params.set("city", city);
    if (category) params.set("category", category);
    const qs = params.toString();
    try {
      const [spotsResp, locResp] = await Promise.all([
        fetch(`${BASE_URL}/date_spots${qs ? `?${qs}` : ""}`),
        fetch(`${BASE_URL}/date_spots/locations`),
      ]);
      setSpots(spotsResp.ok ? await spotsResp.json() : []);
      setLocations(locResp.ok ? await locResp.json() : []);
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  }, [country, city, category]);

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

  const citiesForCountry = useMemo(() => {
    const entry = locations.find((l) => l.country === country);
    return entry ? entry.cities : [];
  }, [locations, country]);

  const hasFilters = Boolean(country || city || category);
  // The newest spot gets the full-width featured treatment; the rest tile below.
  const [featured, ...rest] = spots;

  return (
    <>
      <div className={styles.page}>
        <PageNav />

        <header className={styles.hero}>
          <p className={styles.eyebrow}>{t("dateSpots.eyebrow")}</p>
          <h1 className={styles.title}>{t("dateSpots.title")}</h1>
          <p className={styles.subtitle}>{t("dateSpots.subtitle")}</p>
          {isLoggedIn ? (
            <button className={styles.addBtn} onClick={() => setFormOpen((o) => !o)}>
              {formOpen ? t("dateSpots.close") : `＋ ${t("dateSpots.share")}`}
            </button>
          ) : (
            <p className={styles.loginHint}>
              <a href="/login">{t("dateSpots.loginHint")}</a>
            </p>
          )}
        </header>

        <div className={styles.body}>
          {error !== "" && <p className={styles.error}>{error}</p>}

          {formOpen && isLoggedIn && (
            <AddSpotForm
              token={token}
              onCancel={() => setFormOpen(false)}
              onCreated={() => {
                setFormOpen(false);
                load();
              }}
            />
          )}

          {/* Filter chips */}
          <div className={styles.filterBar}>
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

            {country && citiesForCountry.length > 0 && (
              <div className={styles.chipRow}>
                <button
                  className={`${styles.chip} ${styles.chipSmall} ${!city ? styles.chipActive : ""}`}
                  onClick={() => setCity("")}
                >
                  {t("dateSpots.allCities")}
                </button>
                {citiesForCountry.map((c) => (
                  <button
                    key={c}
                    className={`${styles.chip} ${styles.chipSmall} ${city === c ? styles.chipActive : ""}`}
                    onClick={() => setCity(c)}
                  >
                    📍 {c}
                  </button>
                ))}
              </div>
            )}

            <div className={styles.chipRow}>
              <button
                className={`${styles.chip} ${styles.chipSmall} ${!category ? styles.chipActive : ""}`}
                onClick={() => setCategory("")}
              >
                {t("dateSpots.allCategories")}
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  className={`${styles.chip} ${styles.chipSmall} ${category === c ? styles.chipActive : ""}`}
                  onClick={() => setCategory(category === c ? "" : c)}
                >
                  {categoryLabel(c, t)}
                </button>
              ))}
            </div>
          </div>

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
          ) : spots.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📍</div>
              <p className={styles.emptyTitle}>{t("dateSpots.emptyTitle")}</p>
              <p className={styles.emptyText}>
                {hasFilters ? t("dateSpots.emptyFiltered") : t("dateSpots.emptyAll")}
              </p>
              {isLoggedIn && !formOpen && (
                <button className={styles.emptyBtn} onClick={() => setFormOpen(true)}>
                  ＋ {t("dateSpots.share")}
                </button>
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
                {featured.image_url ? (
                  <img
                    className={styles.featuredImage}
                    src={IMG.full(featured.image_url)}
                    alt={featured.name}
                  />
                ) : (
                  <div className={styles.noImage} />
                )}
                <div className={styles.scrim} />
                <span className={styles.featuredFlag}>★ {t("dateSpots.featured")}</span>
                <div className={styles.featuredInfo}>
                  {featured.category && (
                    <span className={styles.tag}>
                      {categoryLabel(featured.category, t)}
                    </span>
                  )}
                  <h2 className={styles.featuredTitle}>{featured.name}</h2>
                  <p className={styles.overlayPlace}>
                    📍 {featured.city}, {featured.country}
                  </p>
                  <p className={styles.featuredText}>{featured.description}</p>
                  <SpotStats spot={featured} t={t} className={styles.overlayStats} />
                </div>
              </article>

              {/* Grid */}
              {rest.length > 0 && (
                <div className={styles.grid}>
                  {rest.map((spot, i) => (
                    <article
                      key={spot.id}
                      className={styles.card}
                      onClick={() => openSpot(spot)}
                      style={{ animationDelay: `${(i + 1) * 60}ms` }}
                    >
                      {spot.image_url ? (
                        <img
                          className={styles.cardImage}
                          src={IMG.card(spot.image_url)}
                          alt={spot.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className={styles.noImage} />
                      )}
                      <div className={styles.scrim} />
                      <div className={styles.cardInfo}>
                        {spot.category && (
                          <span className={styles.tag}>
                            {categoryLabel(spot.category, t)}
                          </span>
                        )}
                        <h3 className={styles.cardTitle}>{spot.name}</h3>
                        <p className={styles.overlayPlace}>
                          📍 {spot.city}, {spot.country}
                        </p>
                        <SpotStats spot={spot} t={t} className={styles.overlayStats} />
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selected && (
        <div className={styles.detailOverlay} onClick={closeSpot}>
          <div className={styles.detailCard} onClick={(e) => e.stopPropagation()}>
            <button className={styles.detailClose} onClick={closeSpot} aria-label="Close">
              ✕
            </button>
            {selected.image_url && (
              <img
                className={styles.detailImage}
                src={IMG.full(selected.image_url)}
                alt={selected.name}
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
              {selected.category && (
                <span className={styles.detailTag}>
                  {categoryLabel(selected.category, t)}
                </span>
              )}
              <h2 className={styles.detailTitle}>{selected.name}</h2>
              <p className={styles.detailPlace}>
                📍 {selected.city}, {selected.country}
              </p>
              <SpotStats spot={selected} t={t} className={styles.detailStats} />
              <p className={styles.detailText}>{selected.description}</p>
              {selected.profile?.first_name && (
                <p className={styles.detailAuthor}>
                  {t("dateSpots.sharedBy", { name: selected.profile.first_name })}
                </p>
              )}
              <div className={styles.detailActions}>
                {selected.map_url && (
                  <a
                    className={styles.mapBtn}
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
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}

function AddSpotForm({ token, onCancel, onCreated }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function pickFile(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError(t("dateSpots.errName"));
    if (!city.trim() || !country.trim()) return setError(t("dateSpots.errPlace"));
    if (description.trim().length < 10) return setError(t("dateSpots.errDesc"));
    if (
      mapUrl.trim() &&
      !/^https?:\/\/(www\.)?([a-z-]+\.)?(google\.[a-z.]+|goo\.gl|maps\.app\.goo\.gl)\//i.test(
        mapUrl.trim(),
      )
    )
      return setError(t("dateSpots.errMapUrl"));

    const body = new FormData();
    body.append("name", name.trim());
    body.append("city", city.trim());
    body.append("country", country.trim());
    body.append("description", description.trim());
    if (category) body.append("category", category);
    if (mapUrl.trim()) body.append("map_url", mapUrl.trim());
    if (file) body.append("image", file);

    setSubmitting(true);
    let resp;
    try {
      resp = await fetch(`${BASE_URL}/date_spots`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
    } catch {
      setSubmitting(false);
      return setError(NETWORK_ERROR);
    }
    let data = null;
    try {
      data = await resp.json();
    } catch {
      data = null;
    }
    setSubmitting(false);

    if (!resp.ok) return setError(friendlyError(data, resp));
    onCreated();
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <h2 className={styles.formTitle}>{t("dateSpots.formTitle")}</h2>
      {error !== "" && <p className={styles.error}>{error}</p>}

      <div className={styles.formRow}>
        <label className={styles.label}>
          {t("dateSpots.name")} <span className={styles.req}>*</span>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("dateSpots.namePlaceholder")}
          />
        </label>
      </div>

      <div className={styles.formGrid}>
        <label className={styles.label}>
          {t("dateSpots.city")} <span className={styles.req}>*</span>
          <input
            className={styles.input}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t("dateSpots.cityPlaceholder")}
          />
        </label>
        <label className={styles.label}>
          {t("dateSpots.country")} <span className={styles.req}>*</span>
          <input
            className={styles.input}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder={t("dateSpots.countryPlaceholder")}
          />
        </label>
      </div>

      {/* Vibe picker */}
      <p className={styles.label}>{t("dateSpots.category")}</p>
      <div className={styles.pickRow}>
        {CATEGORIES.map((c) => (
          <button
            type="button"
            key={c}
            className={`${styles.chip} ${styles.chipSmall} ${category === c ? styles.chipActive : ""}`}
            onClick={() => setCategory(category === c ? "" : c)}
          >
            {categoryLabel(c, t)}
          </button>
        ))}
      </div>

      <label className={styles.label}>
        {t("dateSpots.why")} <span className={styles.req}>*</span>
        <textarea
          className={styles.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder={t("dateSpots.whyPlaceholder")}
        />
      </label>

      <label className={styles.label}>
        {t("dateSpots.mapUrl")}
        <input
          className={styles.input}
          type="url"
          value={mapUrl}
          onChange={(e) => setMapUrl(e.target.value)}
          placeholder={t("dateSpots.mapUrlPlaceholder")}
        />
      </label>

      <label className={styles.label}>
        {t("dateSpots.photo")}
        <input className={styles.file} type="file" accept="image/*" onChange={pickFile} />
      </label>
      {preview && <img className={styles.preview} src={preview} alt="Preview" />}

      <p className={styles.safety}>{t("dateSpots.safety")}</p>

      <div className={styles.formActions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          {t("dateSpots.cancel")}
        </button>
        <button type="submit" className={styles.submitBtn} disabled={submitting}>
          {submitting ? t("dateSpots.submitting") : t("dateSpots.submit")}
        </button>
      </div>
    </form>
  );
}

export default DateSpots;
