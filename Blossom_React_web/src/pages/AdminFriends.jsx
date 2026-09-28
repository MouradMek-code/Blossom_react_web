import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import PageNav from "../components/PageNav";
import LocationPicker from "../components/LocationPicker";
import { ProfileQuestion } from "../components/StartProfile";
import allQuestions from "../data/questions.json";
import { questionsFor } from "../api/connection";
import { BASE_URL } from "../api/config";
import { IMG } from "../api/images";
import { postJson } from "../api/errors";
import { isImageFile, shrink } from "../api/photoUpload";
import styles from "./AdminFriends.module.css";

const LANGUAGES = [
  ["en", "English"],
  ["fr", "Français"],
  ["zh", "中文"],
  ["ar", "العربية"],
];
const MIN_PHOTOS = 2;
const MAX_PHOTOS = 6;
// The answers the server takes as they are (languages go in their own lists).
const ANSWER_FIELDS = [
  "bio", "age", "gender", "sexual_orientation", "height_cm", "occupation", "education",
  "smoking", "drinking", "exercise_frequency", "has_pets", "relationship_goal",
  "first_date_preference", "past_relationships_count", "last_breakup_reason",
  "has_children", "wants_children", "personality_type",
];

const authHeaders = () => ({ Authorization: `Bearer ${sessionStorage.getItem("token")}` });

function answered(question, answer) {
  const value = answer[question.field];
  return Array.isArray(value) ? value.length > 0 : Boolean(String(value ?? "").trim());
}

function shortDate(value) {
  if (!value) return "";
  const date = new Date(`${String(value).replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}

async function uploadFriendPhoto(userId, file) {
  const form = new FormData();
  form.append("image", await shrink(file));
  return postJson(`${BASE_URL}/friend_profiles/${userId}/photos`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
}

// blossom-date.com/admin/friends - an admin makes a profile from the answers
// and photos a friend gave them. The friend gets an email to check it and
// choose their password; until then nobody sees it (see the server's
// db_friend_profiles.py).
export default function AdminFriends() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [listError, setListError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!sessionStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    const result = await postJson(`${BASE_URL}/friend_profiles`, { headers: authHeaders() });
    if (result.resp?.status === 401) return navigate("/login");
    if (result.resp?.status === 403) return navigate("/");
    if (!result.ok) return setListError(result.message);
    setListError("");
    setRows(result.data);
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className={styles.page}>
      <PageNav />
      <main className={styles.wrap}>
        <Link to="/admin" className={styles.back}>
          ← {t("friends.backToAdmin")}
        </Link>
        <h1 className={styles.title}>👯 {t("friends.title")}</h1>
        <p className={styles.intro}>{t("friends.intro")}</p>
        <ol className={styles.steps}>
          <li>{t("friends.step1")}</li>
          <li>{t("friends.step2")}</li>
          <li>{t("friends.step3")}</li>
        </ol>

        {notice && <p className={styles.notice}>{notice}</p>}

        {formOpen ? (
          <FriendForm
            onCancel={() => setFormOpen(false)}
            onDone={(message) => {
              setFormOpen(false);
              setNotice(message);
              load();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onChanged={load}
          />
        ) : (
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => {
              setNotice("");
              setFormOpen(true);
            }}
          >
            ➕ {t("friends.new")}
          </button>
        )}

        <h2 className={styles.section}>{t("friends.listTitle")}</h2>
        {listError && <p className={styles.error}>{listError}</p>}
        {rows === null ? (
          !listError && <p className={styles.muted}>{t("dashboard.loading")}</p>
        ) : rows.length === 0 ? (
          <p className={styles.muted}>{t("friends.empty")}</p>
        ) : (
          rows.map((row) => <FriendRow key={row.user_id} row={row} onChanged={load} />)
        )}
      </main>
    </div>
  );
}

// ---- The form -------------------------------------------------------------
function FriendForm({ onCancel, onDone, onChanged }) {
  const { t, i18n } = useTranslation();
  const [info, setInfo] = useState(() => ({
    first_name: "",
    email: "",
    date_of_birth: "",
    language: LANGUAGES.some(([code]) => i18n.language?.startsWith(code)) ? i18n.language.slice(0, 2) : "en",
  }));
  const [place, setPlace] = useState({ country: "", city: "" });
  const [answer, setAnswer] = useState({});
  const [photos, setPhotos] = useState([]); // { key, file, url, uploaded }
  // Once the profile exists on the server, only its photos and the email are
  // left to do - a retry must not create it twice.
  const [createdId, setCreatedId] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const fileInput = useRef(null);

  const questions = useMemo(() => questionsFor(allQuestions, answer.connection_type), [answer.connection_type]);
  const titleOf = (question) => (question.field === "connection_type" ? t("connection.question") : question.question);

  // Free the previews when the form closes.
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  function setField(field, value) {
    setInfo((cur) => ({ ...cur, [field]: value }));
  }

  function pick(question, value) {
    setAnswer((cur) => ({ ...cur, [question.field]: value }));
  }

  function addFiles(fileList) {
    const files = [...(fileList || [])].filter(isImageFile);
    setPhotos((cur) => [
      ...cur,
      ...files.slice(0, MAX_PHOTOS - cur.length).map((file, i) => ({
        key: `${Date.now()}-${i}-${file.name}`,
        file,
        url: URL.createObjectURL(file),
        uploaded: false,
      })),
    ]);
    if (fileInput.current) fileInput.current.value = "";
  }

  function removePhoto(key) {
    setPhotos((cur) => {
      const photo = cur.find((p) => p.key === key);
      if (photo) URL.revokeObjectURL(photo.url);
      return cur.filter((p) => p.key !== key);
    });
  }

  function payload() {
    const body = {
      first_name: info.first_name.trim(),
      email: info.email.trim(),
      date_of_birth: info.date_of_birth,
      language: info.language,
      city: place.city,
      country: place.country,
      connection_type: answer.connection_type || "both",
      languages: answer.language_name || [],
      learning_languages: answer.learning_language_name || [],
    };
    ANSWER_FIELDS.forEach((field) => {
      if (answer[field] !== undefined) body[field] = answer[field];
    });
    return body;
  }

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (!createdId) {
      if (!info.first_name.trim() || !info.email.trim() || !info.date_of_birth || !place.country || !place.city) {
        return setError(t("friends.errFields"));
      }
      const missing = questions.filter((q) => !answered(q, answer)).map(titleOf);
      if (missing.length) return setError(t("friends.errMissing", { list: missing.join(" · ") }));
    }
    if (photos.length < MIN_PHOTOS) return setError(t("friends.errPhotos", { count: MIN_PHOTOS }));

    let id = createdId;
    if (!id) {
      setBusy(t("friends.stepCreating"));
      const result = await postJson(`${BASE_URL}/friend_profiles`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      if (!result.ok) {
        setBusy("");
        return setError(result.message);
      }
      id = result.data.user_id;
      setCreatedId(id);
      onChanged();
    }

    for (let i = 0; i < photos.length; i += 1) {
      const photo = photos[i];
      if (photo.uploaded) continue;
      setBusy(t("friends.stepPhoto", { n: i + 1, total: photos.length }));
      const result = await uploadFriendPhoto(id, photo.file);
      if (!result.ok) {
        setBusy("");
        onChanged();
        return setError(`${result.message} ${t("friends.retryHint")}`);
      }
      setPhotos((cur) => cur.map((p) => (p.key === photo.key ? { ...p, uploaded: true } : p)));
    }

    setBusy(t("friends.stepSending"));
    const sent = await postJson(`${BASE_URL}/friend_profiles/${id}/send`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ language: info.language }),
    });
    setBusy("");
    if (!sent.ok) {
      onChanged();
      return setError(`${sent.message} ${t("friends.retryHint")}`);
    }
    onDone(t("friends.done", { email: sent.data.email, name: sent.data.first_name }));
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.formHead}>
        <h2 className={styles.formTitle}>{t("friends.new")}</h2>
        <button type="button" className={styles.linkBtn} onClick={onCancel} disabled={Boolean(busy)}>
          {t("friends.close")}
        </button>
      </div>
      <p className={styles.consent}>🤝 {t("friends.consentNote")}</p>

      {createdId ? (
        <p className={styles.notice}>{t("friends.savedFinish")}</p>
      ) : (
        <>
          <fieldset className={styles.block}>
            <legend className={styles.blockTitle}>1. {t("friends.sectionAbout")}</legend>
            <div className={styles.grid2}>
              <label className={styles.field}>
                <span className={styles.label}>{t("friends.firstName")}</span>
                <input
                  className={styles.input}
                  value={info.first_name}
                  onChange={(e) => setField("first_name", e.target.value)}
                  maxLength={60}
                  autoComplete="off"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>{t("friends.birthDate")}</span>
                <input
                  className={styles.input}
                  type="date"
                  value={info.date_of_birth}
                  onChange={(e) => setField("date_of_birth", e.target.value)}
                />
              </label>
            </div>
            <label className={styles.field}>
              <span className={styles.label}>{t("friends.email")}</span>
              <input
                className={styles.input}
                type="email"
                value={info.email}
                onChange={(e) => setField("email", e.target.value)}
                autoComplete="off"
              />
              <span className={styles.hint}>{t("friends.emailHint")}</span>
            </label>
            <div className={styles.field}>
              <span className={styles.label}>{t("friends.emailLanguage")}</span>
              <div className={styles.chips}>
                {LANGUAGES.map(([code, label]) => (
                  <button
                    key={code}
                    type="button"
                    className={`${styles.chip} ${info.language === code ? styles.chipActive : ""}`}
                    onClick={() => setField("language", code)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>{t("friends.location")}</span>
              <LocationPicker country={place.country} city={place.city} onChange={setPlace} />
            </div>
          </fieldset>

          <fieldset className={styles.block}>
            <legend className={styles.blockTitle}>2. {t("friends.sectionAnswers")}</legend>
            {questions.map((question, i) => (
              <div key={question.field} className={styles.question}>
                <p className={styles.questionTitle}>
                  <span className={styles.questionNumber}>{i + 1}</span>
                  {titleOf(question)}
                  {answered(question, answer) && <span className={styles.tick}>✓</span>}
                </p>
                <ProfileQuestion
                  question={question}
                  Handleclicked={pick}
                  answer={answer}
                  setAnswer={setAnswer}
                  setClicked={() => {}}
                />
              </div>
            ))}
          </fieldset>
        </>
      )}

      <fieldset className={styles.block}>
        <legend className={styles.blockTitle}>{createdId ? "" : "3. "}{t("friends.sectionPhotos")}</legend>
        <p className={styles.hint}>{t("friends.photosHint", { min: MIN_PHOTOS, max: MAX_PHOTOS })}</p>
        <div className={styles.photoGrid}>
          {photos.map((photo, i) => (
            <div key={photo.key} className={styles.photo}>
              <img src={photo.url} alt="" />
              {i === 0 && <span className={styles.mainTag}>{t("friends.mainPhoto")}</span>}
              {photo.uploaded ? (
                <span className={styles.uploadedTag}>✓</span>
              ) : (
                <button
                  type="button"
                  className={styles.removePhoto}
                  onClick={() => removePhoto(photo.key)}
                  aria-label={t("friends.removePhoto")}
                  disabled={Boolean(busy)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              className={styles.addPhoto}
              onClick={() => fileInput.current?.click()}
              disabled={Boolean(busy)}
            >
              <span aria-hidden="true">📷</span>
              {t("friends.addPhotos")}
            </button>
          )}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
      </fieldset>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.submitRow}>
        <button type="submit" className={styles.primaryBtn} disabled={Boolean(busy)}>
          {busy || (createdId ? t("friends.finish") : `✉️ ${t("friends.submit")}`)}
        </button>
      </div>
    </form>
  );
}

// ---- One friend in the list ----------------------------------------------------
function FriendRow({ row, onChanged }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInput = useRef(null);
  const pending = row.status !== "active";
  const enoughPhotos = row.photos.length >= MIN_PHOTOS;

  async function send() {
    setBusy(true);
    setError("");
    setMessage("");
    const result = await postJson(`${BASE_URL}/friend_profiles/${row.user_id}/send`, {
      method: "POST",
      headers: authHeaders(),
    });
    setBusy(false);
    if (!result.ok) return setError(result.message);
    setMessage(t("friends.resent", { email: row.email }));
    onChanged();
  }

  async function remove() {
    if (!window.confirm(t("friends.deleteConfirm", { name: row.first_name }))) return;
    setBusy(true);
    const result = await postJson(`${BASE_URL}/friend_profiles/${row.user_id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    setBusy(false);
    if (!result.ok) return setError(result.message);
    onChanged();
  }

  async function addPhotos(fileList) {
    const files = [...(fileList || [])].filter(isImageFile).slice(0, MAX_PHOTOS - row.photos.length);
    if (fileInput.current) fileInput.current.value = "";
    if (!files.length) return;
    setBusy(true);
    setError("");
    for (const file of files) {
      const result = await uploadFriendPhoto(row.user_id, file);
      if (!result.ok) {
        setError(result.message);
        break;
      }
    }
    setBusy(false);
    onChanged();
  }

  const status =
    row.status === "active"
      ? t("friends.status_active", { date: shortDate(row.claimed_at) })
      : row.status === "sent"
        ? t("friends.status_sent", { date: shortDate(row.sent_at), name: row.first_name })
        : t("friends.status_draft");

  return (
    <article className={styles.row}>
      {row.photos[0] ? (
        <img className={styles.avatar} src={IMG.thumb(row.photos[0].image_url)} alt="" />
      ) : (
        <span className={`${styles.avatar} ${styles.avatarEmpty}`}>🌸</span>
      )}
      <div className={styles.rowInfo}>
        <strong className={styles.rowName}>{row.first_name}</strong>
        <span className={styles.rowEmail}>{row.email}</span>
        <span className={`${styles.status} ${styles[`status_${row.status}`]}`}>{status}</span>
        {pending && !enoughPhotos && (
          <span className={styles.warn}>{t("friends.needPhotos", { count: MIN_PHOTOS })}</span>
        )}
        {message && <span className={styles.ok}>{message}</span>}
        {error && <span className={styles.error}>{error}</span>}
      </div>
      <div className={styles.rowActions}>
        {row.status === "active" && row.profile_id ? (
          <Link className={styles.smallBtn} to={`/profile/${row.profile_id}`}>
            {t("friends.view")}
          </Link>
        ) : null}
        {pending && row.photos.length < MAX_PHOTOS && (
          <>
            <button type="button" className={styles.smallBtn} onClick={() => fileInput.current?.click()} disabled={busy}>
              📷 {t("friends.addPhotos")}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => addPhotos(e.target.files)}
            />
          </>
        )}
        {pending && enoughPhotos && (
          <button type="button" className={styles.smallBtnPrimary} onClick={send} disabled={busy}>
            ✉️ {row.status === "sent" ? t("friends.resend") : t("friends.send")}
          </button>
        )}
        {pending && (
          <button type="button" className={styles.smallBtnDanger} onClick={remove} disabled={busy}>
            {t("friends.delete")}
          </button>
        )}
      </div>
    </article>
  );
}
