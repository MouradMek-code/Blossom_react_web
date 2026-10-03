import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import Footer from "../components/Footer";
import LocationPicker from "../components/LocationPicker";
import { ProfileQuestion } from "../components/StartProfile";
import allQuestions from "../data/questions.json";
import { BASE_URL } from "../api/config";
import { IMG } from "../api/images";
import { postJson } from "../api/errors";
import { formatTimeInput, localToIso } from "../api/offers";
import { isImageFile, shrink } from "../api/photoUpload";
import { EVENT_KINDS, KIND_EMOJI, isoToDateText, isoToTimeText } from "../api/events";
import styles from "./EventForm.module.css";

const WOMEN = ["Woman", "Trans Woman"];
const LANGUAGE_QUESTION = (Array.isArray(allQuestions) ? allQuestions : allQuestions.questions || [])
  .find((q) => q.field === "language_name");

function getToken() {
  const token = sessionStorage.getItem("token");
  return token && token !== "null" && token !== "undefined" ? token : null;
}

// Typing a date: "12102026" -> "12/10/2026".
function formatDateInput(text) {
  const digits = String(text || "").replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// The end is a time on the same day - or the next day when it's earlier
// than the start (a party until 1:00).
function endIso(dateText, startText, endText) {
  if (!endText) return null;
  const start = localToIso(dateText, startText);
  const end = localToIso(dateText, endText);
  if (!start || !end) return undefined;
  if (end > start) return end;
  return new Date(new Date(end).getTime() + 24 * 3600 * 1000).toISOString();
}

// /events/new and /events/:id/edit.
export default function EventForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const [params] = useSearchParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = getToken();
  const fileInput = useRef(null);

  const [me, setMe] = useState(null);
  const [kind, setKind] = useState("group");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [spot, setSpot] = useState(null);
  const [placeName, setPlaceName] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [location, setLocation] = useState({ country: "", city: "" });
  const [maxPeople, setMaxPeople] = useState("");
  const [languages, setLanguages] = useState({ language_name: [] });
  const [womenOnly, setWomenOnly] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(true);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(!editing);
  const [owner, setOwner] = useState(true);
  const [originalStart, setOriginalStart] = useState(null);

  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    if (!token) return;
    fetch(`${BASE_URL}/user/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setMe(data))
      .catch(() => {});
  }, [token]);

  // "Create an event here" from a date spot.
  useEffect(() => {
    const spotId = params.get("spot");
    if (editing || !spotId) return;
    fetch(`${BASE_URL}/partners/spots/${spotId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setSpot(data);
        setLocation({ country: data.country || "", city: data.city || "" });
      })
      .catch(() => {});
  }, [params, editing]);

  useEffect(() => {
    if (!editing || !token) return;
    postJson(`${BASE_URL}/events/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then((result) => {
      if (!result.ok) {
        setError(result.message);
        return;
      }
      const e = result.data;
      setOwner(e.is_owner);
      setOriginalStart(e.starts_at);
      setKind(e.kind);
      setTitle(e.title);
      setDescription(e.description);
      setDate(isoToDateText(e.starts_at));
      setStart(isoToTimeText(e.starts_at));
      setEnd(e.ends_at ? isoToTimeText(e.ends_at) : "");
      setSpot(e.spot);
      setPlaceName(e.place_name || "");
      setMapUrl(e.map_url || "");
      setLocation({ country: e.country || "", city: e.city || "" });
      setMaxPeople(e.max_people ? String(e.max_people) : "");
      setLanguages({ language_name: e.languages || [] });
      setWomenOnly(e.women_only);
      setCommentsOpen(e.comments_open);
      setPreview(e.image_url ? IMG.card(e.image_url) : "");
      setLoaded(true);
    });
  }, [editing, id, token]);

  // Date spot search, as the member types.
  useEffect(() => {
    if (spot || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`${BASE_URL}/partners/spots?q=${encodeURIComponent(query.trim())}`)
        .then((r) => (r.ok ? r.json() : []))
        .then(setResults)
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [query, spot]);

  async function pickPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isImageFile(file)) {
      setError(t("events.photoError"));
      return;
    }
    const small = await shrink(file);
    setPhoto(small);
    setPreview(URL.createObjectURL(small));
  }

  function pickSpot(found) {
    setSpot(found);
    setQuery("");
    setResults([]);
    if (found.city) setLocation({ country: found.country || "", city: found.city });
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    const startsAt = localToIso(date, start);
    const endsAt = endIso(date, start, end);
    if (!startsAt || endsAt === undefined) {
      setError(t("events.errDate"));
      return;
    }
    if (!spot && !placeName.trim()) {
      setError(t("events.errPlace"));
      return;
    }
    const auth = { Authorization: `Bearer ${token}` };
    const fields = {
      kind,
      title: title.trim(),
      description: description.trim(),
      starts_at: startsAt,
      ends_at: endsAt,
      place_name: spot && !placeName.trim() ? spot.name : placeName.trim(),
      map_url: mapUrl.trim() || null,
      city: location.city,
      country: location.country,
      max_people: kind === "group" && maxPeople ? Number(maxPeople) : null,
      languages: languages.language_name,
      women_only: womenOnly,
      comments_open: commentsOpen,
    };
    // Unchanged start: not sent, so a started event can still be edited.
    if (editing && originalStart && new Date(originalStart).getTime() === new Date(startsAt).getTime()) {
      delete fields.starts_at;
    }
    setSaving(true);
    let result;
    if (editing) {
      result = await postJson(`${BASE_URL}/events/${id}`, {
        method: "PATCH",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (result.ok && photo) {
        const form = new FormData();
        form.append("image", photo, photo.name || "event.jpg");
        result = await postJson(`${BASE_URL}/events/${id}/image`, { method: "PUT", headers: auth, body: form });
      }
    } else {
      const form = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") return;
        form.append(key, Array.isArray(value) ? value.join(",") : String(value));
      });
      if (spot) form.append("spot_id", String(spot.id));
      if (photo) form.append("image", photo, photo.name || "event.jpg");
      result = await postJson(`${BASE_URL}/events`, { method: "POST", headers: auth, body: form });
    }
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    navigate(`/events/${result.data.id}`, { replace: editing });
  }

  const isWoman = WOMEN.includes(me?.gender);
  const notYours = editing && loaded && !owner && me && !me.is_admin;
  const valid = title.trim().length >= 3 && description.trim().length >= 10 && date && start && location.city;

  return (
    <div className={styles.page}>
      <PageNav />
      <main className={styles.body}>
        <Link to={editing ? `/events/${id}` : "/events"} className={styles.back}>← {t("events.back")}</Link>
        <h1 className={styles.title}>{editing ? t("events.formEdit") : t("events.formNew")}</h1>
        <p className={styles.safety}>🛡️ {t("events.safety")}</p>

        {!loaded || notYours ? (
          <p className={styles.muted}>{notYours ? t("events.notYours") : error || t("dashboard.loading")}</p>
        ) : (
          <form className={styles.form} onSubmit={submit}>
            <fieldset className={styles.field}>
              <legend>{t("events.fieldKind")}</legend>
              <div className={styles.kinds}>
                {EVENT_KINDS.map((k) => (
                  <button key={k} type="button" className={kind === k ? styles.kindOn : styles.kind} onClick={() => setKind(k)}>
                    <span className={styles.kindEmoji}>{KIND_EMOJI[k]}</span>
                    <strong>{t(`events.kind_${k}`)}</strong>
                    <small>{t(`events.kindHint_${k}`)}</small>
                  </button>
                ))}
              </div>
            </fieldset>

            <label className={styles.field}>
              <span>{t("events.fieldTitle")}</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}
                placeholder={t("events.titlePlaceholder")} required />
            </label>

            <label className={styles.field}>
              <span>{t("events.fieldDescription")}</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1500} rows={5}
                placeholder={t("events.descriptionPlaceholder")} required />
              <small className={styles.counter}>{description.length}/1500</small>
            </label>

            <div className={styles.row}>
              <label className={styles.field}>
                <span>{t("events.fieldStarts")}</span>
                <input value={date} onChange={(e) => setDate(formatDateInput(e.target.value))} inputMode="numeric"
                  placeholder={t("events.datePlaceholder")} required />
              </label>
              <label className={styles.fieldSmall}>
                <span>&nbsp;</span>
                <input value={start} onChange={(e) => setStart(formatTimeInput(e.target.value))} inputMode="numeric"
                  placeholder={t("events.timePlaceholder")} required />
              </label>
              <label className={styles.fieldSmall}>
                <span>{t("events.fieldEnds")}</span>
                <input value={end} onChange={(e) => setEnd(formatTimeInput(e.target.value))} inputMode="numeric"
                  placeholder={t("events.timePlaceholder")} />
              </label>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>{t("events.fieldPlace")}</span>
              <small className={styles.hint}>{t("events.placeHint")}</small>
              {spot ? (
                <div className={styles.spotChip}>
                  {spot.image_url && <img src={IMG.thumb(spot.image_url)} alt="" />}
                  <span>
                    <strong>{spot.name}</strong>
                    <small>{[spot.neighborhood, spot.city].filter(Boolean).join(", ")}</small>
                  </span>
                  {!editing && (
                    <button type="button" onClick={() => setSpot(null)}>{t("events.removeSpot")}</button>
                  )}
                </div>
              ) : (
                <>
                  {!editing && (
                    <div className={styles.search}>
                      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`🔎 ${t("events.searchSpot")}`} />
                      {results.length > 0 && (
                        <ul className={styles.results}>
                          {results.map((found) => (
                            <li key={found.id}>
                              <button type="button" onClick={() => pickSpot(found)}>
                                {found.image_url ? <img src={IMG.thumb(found.image_url)} alt="" /> : <span>🌸</span>}
                                <span>
                                  <strong>{found.name}</strong>
                                  <small>{[found.neighborhood, found.city].filter(Boolean).join(", ")}</small>
                                </span>
                                {found.partner && <em>🎁</em>}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className={styles.or}>{t("events.orPlace")}</p>
                    </div>
                  )}
                  <input value={placeName} onChange={(e) => setPlaceName(e.target.value)} maxLength={150}
                    placeholder={t("events.placePlaceholder")} />
                </>
              )}
              {!spot && (
                <input value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} maxLength={500}
                  placeholder={t("events.mapLink")} className={styles.mapInput} />
              )}
            </div>

            <div className={styles.field}>
              <span className={styles.label}>{t("events.fieldCity")}</span>
              <LocationPicker country={location.country} city={location.city} onChange={setLocation} />
            </div>

            {kind === "group" && (
              <label className={styles.fieldSmall}>
                <span>{t("events.fieldMax")}</span>
                <input type="number" min={2} max={100} value={maxPeople}
                  onChange={(e) => setMaxPeople(e.target.value)} placeholder="8" />
              </label>
            )}

            {(kind === "language" || languages.language_name.length > 0) && LANGUAGE_QUESTION && (
              <div className={styles.field}>
                <span className={styles.label}>{t("events.fieldLanguages")}</span>
                <ProfileQuestion question={LANGUAGE_QUESTION} Handleclicked={() => {}} answer={languages}
                  setAnswer={setLanguages} setClicked={() => {}} />
              </div>
            )}

            {(isWoman || womenOnly) && (
              <label className={styles.toggle}>
                <input type="checkbox" checked={womenOnly} onChange={(e) => setWomenOnly(e.target.checked)} />
                <span>
                  <strong>👩 {t("events.fieldWomenOnly")}</strong>
                  <small>{t("events.womenOnlyHint")}</small>
                </span>
              </label>
            )}

            <label className={styles.toggle}>
              <input type="checkbox" checked={commentsOpen} onChange={(e) => setCommentsOpen(e.target.checked)} />
              <span>
                <strong>💬 {t("events.fieldComments")}</strong>
              </span>
            </label>

            <div className={styles.field}>
              <span className={styles.label}>{t("events.fieldPhoto")}</span>
              <button type="button" className={styles.photo} onClick={() => fileInput.current?.click()}>
                {preview ? <img src={preview} alt="" /> : <span>📷</span>}
              </button>
              <input ref={fileInput} type="file" accept="image/*" hidden onChange={pickPhoto} />
            </div>

            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.submit} disabled={saving || !valid}>
              {saving ? t("events.saving") : editing ? t("events.saveChanges") : t("events.publish")}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
