import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import PageNav from "../components/PageNav";
import Footer from "../components/Footer";
import { BASE_URL } from "../api/config";
import { IMG } from "../api/images";
import { friendlyError, NETWORK_ERROR } from "../api/errors";
import styles from "./DateSpots.module.css";

function DateSpots() {
  const { t } = useTranslation();
  const [spots, setSpots] = useState([]);
  const [locations, setLocations] = useState([]);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(false);
  const { id: routeId } = useParams();
  const navigate = useNavigate();

  const token = sessionStorage.getItem("token");
  const isLoggedIn = token && token !== "undefined" && token !== "null";

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (country) params.set("country", country);
    if (city) params.set("city", city);
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
  }, [country, city]);

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
      /* clipboard unavailable - nothing useful to do */
    }
  }

  const citiesForCountry = useMemo(() => {
    const entry = locations.find((l) => l.country === country);
    return entry ? entry.cities : [];
  }, [locations, country]);

  return (
    <>
      <div className={styles.page}>
        <PageNav />

        <header className={styles.hero}>
          <p className={styles.eyebrow}>{t("dateSpots.eyebrow")}</p>
          <h1 className={styles.title}>{t("dateSpots.title")}</h1>
          <p className={styles.subtitle}>
{t("dateSpots.subtitle")}
          </p>
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

          {/* Filters */}
          <div className={styles.filters}>
            <select
              className={styles.select}
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setCity("");
              }}
            >
              <option value="">{t("dateSpots.allCountries")}</option>
              {locations.map((l) => (
                <option key={l.country} value={l.country}>
                  {l.country}
                </option>
              ))}
            </select>

            <select
              className={styles.select}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={!country}
            >
              <option value="">{country ? t("dateSpots.allCities") : t("dateSpots.pickCountry")}</option>
              {citiesForCountry.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {(country || city) && (
              <button
                className={styles.clearBtn}
                onClick={() => {
                  setCountry("");
                  setCity("");
                }}
              >
                {t("dateSpots.clear")}
              </button>
            )}
          </div>

          {loading ? (
            <p className={styles.muted}>{t("dateSpots.loading")}</p>
          ) : spots.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📍</div>
              <p className={styles.emptyTitle}>{t("dateSpots.emptyTitle")}</p>
              <p className={styles.emptyText}>
                {country || city
                  ? t("dateSpots.emptyFiltered")
                  : t("dateSpots.emptyAll")}
              </p>
            </div>
          ) : (
            <div className={styles.grid}>
              {spots.map((spot) => (
                <article key={spot.id} className={styles.card}>
                  {spot.image_url && (
                    <img
                      className={styles.cardImage}
                      src={IMG.card(spot.image_url)}
                      alt={spot.name}
                      loading="lazy"
                      onClick={() => openSpot(spot)}
                    />
                  )}
                  <div className={styles.cardBody}>
                    <h2 className={styles.cardTitle}>{spot.name}</h2>
                    <p className={styles.cardPlace}>
                      📍 {spot.city}, {spot.country}
                    </p>
                    <p
                      className={styles.cardText}
                      onClick={() => openSpot(spot)}
                      title={t("dateSpots.readMore")}
                    >
                      {spot.description}
                    </p>
                    <button className={styles.readMore} onClick={() => openSpot(spot)}>
                      {t("dateSpots.readMore")}
                    </button>
                    {spot.profile?.first_name && (
                      <p className={styles.cardAuthor}>
{t("dateSpots.sharedBy", { name: spot.profile.first_name })}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
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
            <div className={styles.detailBody}>
              <h2 className={styles.detailTitle}>{selected.name}</h2>
              <p className={styles.detailPlace}>
                📍 {selected.city}, {selected.country}
              </p>
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
    if (!city.trim() || !country.trim())
return setError(t("dateSpots.errPlace"));
    if (description.trim().length < 10)
      return setError(t("dateSpots.errDesc"));
    if (mapUrl.trim() && !/^https?:\/\/(www\.)?([a-z-]+\.)?(google\.[a-z.]+|goo\.gl|maps\.app\.goo\.gl)\//i.test(mapUrl.trim()))
      return setError(t("dateSpots.errMapUrl"));

    const body = new FormData();
    body.append("name", name.trim());
    body.append("city", city.trim());
    body.append("country", country.trim());
    body.append("description", description.trim());
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

      <p className={styles.safety}>
        {t("dateSpots.safety")}
      </p>

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
