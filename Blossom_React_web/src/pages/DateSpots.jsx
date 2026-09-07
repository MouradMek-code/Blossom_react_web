import { useCallback, useEffect, useMemo, useState } from "react";
import PageNav from "../components/PageNav";
import Footer from "../components/Footer";
import { BASE_URL } from "../api/config";
import { IMG } from "../api/images";
import { friendlyError, NETWORK_ERROR } from "../api/errors";
import styles from "./DateSpots.module.css";

function DateSpots() {
  const [spots, setSpots] = useState([]);
  const [locations, setLocations] = useState([]);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");

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

  const citiesForCountry = useMemo(() => {
    const entry = locations.find((l) => l.country === country);
    return entry ? entry.cities : [];
  }, [locations, country]);

  return (
    <>
      <div className={styles.page}>
        <PageNav />

        <header className={styles.hero}>
          <p className={styles.eyebrow}>Community picks</p>
          <h1 className={styles.title}>Great places to go on a date</h1>
          <p className={styles.subtitle}>
            Real spots, shared by real people who had a good time there. Pick a
            city and find your next date.
          </p>
          {isLoggedIn ? (
            <button className={styles.addBtn} onClick={() => setFormOpen((o) => !o)}>
              {formOpen ? "Close" : "＋ Share a place"}
            </button>
          ) : (
            <p className={styles.loginHint}>
              <a href="/login">Log in</a> to share a place you loved.
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
              <option value="">All countries</option>
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
              <option value="">{country ? "All cities" : "Pick a country first"}</option>
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
                Clear
              </button>
            )}
          </div>

          {loading ? (
            <p className={styles.muted}>Loading places…</p>
          ) : spots.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📍</div>
              <p className={styles.emptyTitle}>No places here yet</p>
              <p className={styles.emptyText}>
                {country || city
                  ? "Nothing shared for this place yet — be the first."
                  : "Be the first to share somewhere you had a great date."}
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
                    />
                  )}
                  <div className={styles.cardBody}>
                    <h2 className={styles.cardTitle}>{spot.name}</h2>
                    <p className={styles.cardPlace}>
                      📍 {spot.city}, {spot.country}
                    </p>
                    <p className={styles.cardText}>{spot.description}</p>
                    {spot.profile?.first_name && (
                      <p className={styles.cardAuthor}>
                        Shared by {spot.profile.first_name}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

function AddSpotForm({ token, onCancel, onCreated }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [description, setDescription] = useState("");
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

    if (!name.trim()) return setError("Please give the place a name.");
    if (!city.trim() || !country.trim())
      return setError("Please say which city and country it's in.");
    if (description.trim().length < 10)
      return setError("Please add a short description (at least 10 characters).");

    const body = new FormData();
    body.append("name", name.trim());
    body.append("city", city.trim());
    body.append("country", country.trim());
    body.append("description", description.trim());
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
      <h2 className={styles.formTitle}>Share a place</h2>
      {error !== "" && <p className={styles.error}>{error}</p>}

      <div className={styles.formRow}>
        <label className={styles.label}>
          Place name <span className={styles.req}>*</span>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Café de Flore"
          />
        </label>
      </div>

      <div className={styles.formGrid}>
        <label className={styles.label}>
          City <span className={styles.req}>*</span>
          <input
            className={styles.input}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Paris"
          />
        </label>
        <label className={styles.label}>
          Country <span className={styles.req}>*</span>
          <input
            className={styles.input}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. France"
          />
        </label>
      </div>

      <label className={styles.label}>
        Why was it great? <span className={styles.req}>*</span>
        <textarea
          className={styles.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Quiet corner tables, great coffee, and easy to talk for hours…"
        />
      </label>

      <label className={styles.label}>
        Photo (optional)
        <input className={styles.file} type="file" accept="image/*" onChange={pickFile} />
      </label>
      {preview && <img className={styles.preview} src={preview} alt="Preview" />}

      <p className={styles.safety}>
        Please only share public places, and keep it respectful.
      </p>

      <div className={styles.formActions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={styles.submitBtn} disabled={submitting}>
          {submitting ? "Sharing…" : "Share place"}
        </button>
      </div>
    </form>
  );
}

export default DateSpots;
