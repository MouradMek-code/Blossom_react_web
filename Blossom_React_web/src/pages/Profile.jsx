import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import NavIcon from "../components/NavIcon";
import "./profile.css";

import { BASE_URL } from "../api/config";
import { IMG } from "../api/images";
import { postJson } from "../api/errors";
import { deletePhoto, fetchOwnPhotos, isImageFile, uploadPhoto } from "../api/photoUpload";
import { CONNECTION_EMOJI, CONNECTION_TYPES, connectionLabel, connectionOf } from "../api/connection";

function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [savingConnection, setSavingConnection] = useState(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const token = sessionStorage.getItem("token");
  const istokenundefined = token === "undefined" || token === null;
  useEffect(() => {
    if (istokenundefined) {
      navigate("/login");
      return;
    }

    async function fetchProfile() {
      try {
        const resp = await fetch(`${BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.status === 401) {
          sessionStorage.setItem("token", null);
          navigate("/login");
          return;
        }
        if (resp.status !== 200) {
          // Token valid but no profile yet — resume signup flow
          navigate("/sign_up");
          return;
        }
        const data = await resp.json();
        setProfile(data);
        sessionStorage.setItem("profile_id", data.id);
      } catch (err) {
        sessionStorage.setItem("token", null);
        navigate("/login");
      }
    }

    fetchProfile();
  }, [token, navigate, istokenundefined]);

  function startEditingBio() {
    setBioDraft(profile.bio || "");
    setEditingBio(true);
    setError("");
  }

  // Dating, language exchange or both - one click.
  async function changeConnection(type) {
    if (type === connectionOf(profile) || savingConnection) return;
    setSavingConnection(type);
    setError("");
    const result = await postJson(`${BASE_URL}/profile/connection`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ connection_type: type }),
    });
    setSavingConnection(null);
    if (!result.ok) {
      setError(result.message || t("connection.changeFailed"));
      return;
    }
    setProfile(result.data);
  }

  async function saveBio() {
    setSavingBio(true);
    setError("");
    try {
      const resp = await fetch(`${BASE_URL}/profile/bio`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bio: bioDraft }),
      });
      const data = await resp.json();
      if (resp.status !== 200) throw new Error(data.detail || "Failed to update bio");
      setProfile(data);
      setEditingBio(false);
    } catch (err) {
      setError(err.toString());
    } finally {
      setSavingBio(false);
    }
  }

  // Each photo shows as soon as it is saved.
  async function handleUploadPhoto(e) {
    const chosen = Array.from(e.target.files || []);
    e.target.value = "";
    const files = chosen.filter(isImageFile);
    setError("");
    if (chosen.length && !files.length) {
      setError(t("photos.notImage"));
      return;
    }
    if (!files.length) return;
    setUploadingPhoto(true);
    const known = new Set((profile?.photos || []).map((p) => p.id));
    let failure = null;
    for (const file of files) {
      try {
        const photo = await uploadPhoto(file, known);
        known.add(photo.id);
        setProfile((prev) => withPhoto(prev, photo));
      } catch (err) {
        failure = err.message || t("photos.connection");
      }
    }
    setUploadingPhoto(false);
    if (failure !== null) {
      setError(failure);
      // Show whatever did get saved.
      fetchOwnPhotos()
        .then((photos) => setProfile((prev) => ({ ...prev, photos })))
        .catch(() => {});
    }
  }

  async function handleDeletePhoto(photoId) {
    if (!window.confirm(t("photos.deleteTitle"))) return;
    setError("");
    try {
      await deletePhoto(photoId);
      setProfile((prev) => ({
        ...prev,
        photos: (prev.photos || []).filter((p) => p.id !== photoId),
      }));
    } catch {
      setError(t("photos.deleteFailed"));
    }
  }

  if (!profile)
    return (
      <div className="profile-page">
        <PageNav />
        <div className="loading">Loading...</div>
      </div>
    );
  return (
    <div className="profile-page">
      <PageNav />

      <div className="profile-container">
        {error !== "" && (
          <p style={{ color: "#e11d48", textAlign: "center", marginBottom: "12px" }}>
            {error}
          </p>
        )}
        {/* HERO */}
        <section className="hero-card">
          <div className="hero-content">
            <h1 className="name">
              {profile.first_name}
              <span className="age">, {profile.age}</span>
            </h1>

            <p className="location">
              📍{" "}
              {profile.city || profile.country
                ? [profile.city, profile.country].filter(Boolean).join(", ")
                : t("location.notSet")}
            </p>

            {/* Language, location, logging out and deleting the account. */}
            <Link to="/settings" className="settings-link">
              <NavIcon name="settings" size={17} />
              {t("settings.title")}
            </Link>

            <div className="hero-badges">
              <span className="hero-connection">{connectionLabel(connectionOf(profile), t)}</span>
              <span>💘 {profile.relationship_goal || "Not specified"}</span>

              {profile.occupation && <span>💼 {profile.occupation}</span>}

              {profile.education && <span>🎓 {profile.education}</span>}
            </div>
          </div>
        </section>

        {/* DATING / LANGUAGE EXCHANGE / BOTH */}
        <section className="card">
          <h2>{t("connection.title")}</h2>
          <div className="connection-options">
            {CONNECTION_TYPES.map((type) => {
              const isSelected = connectionOf(profile) === type;
              return (
                <button
                  key={type}
                  type="button"
                  className={`connection-option ${isSelected ? "selected" : ""}`}
                  onClick={() => changeConnection(type)}
                  disabled={savingConnection !== null}
                  aria-pressed={isSelected}
                >
                  <span className="connection-emoji" aria-hidden="true">
                    {CONNECTION_EMOJI[type]}
                  </span>
                  <span className="connection-text">
                    <strong>{t(`connection.${type}`)}</strong>
                    <small>{t(`connection.${type}Desc`)}</small>
                  </span>
                  {savingConnection === type && <span className="connection-saving">…</span>}
                </button>
              );
            })}
          </div>
        </section>

        {/* PHOTOS */}
        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>{t("photos.section")}</h2>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              style={{
                border: "none",
                borderRadius: "999px",
                padding: "8px 16px",
                background: "#e11d48",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {uploadingPhoto ? t("photos.uploading") : t("photos.addButton")}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={handleUploadPhoto}
            />
          </div>
          <div className="photos-grid">
            {profile.photos?.map((p) => (
              <div key={p.id} style={{ position: "relative" }}>
                <img src={IMG.card(p.image_url)} alt={profile.first_name} loading="lazy" />
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(p.id)}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(0,0,0,0.6)",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ABOUT */}
        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>About {profile.first_name}</h2>
            {!editingBio && (
              <button
                type="button"
                onClick={startEditingBio}
                style={{
                  border: "1px solid #e11d48",
                  borderRadius: "999px",
                  padding: "6px 14px",
                  background: "white",
                  color: "#e11d48",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Edit
              </button>
            )}
          </div>

          {editingBio ? (
            <div>
              <textarea
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  border: "1px solid #ddd",
                  padding: "12px",
                  fontSize: "1rem",
                  resize: "vertical",
                }}
              />
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={saveBio}
                  disabled={savingBio}
                  style={{
                    border: "none",
                    borderRadius: "999px",
                    padding: "8px 18px",
                    background: "#e11d48",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {savingBio ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBio(false)}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "999px",
                    padding: "8px 18px",
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="bio">{profile.bio || "No bio added yet."}</p>
          )}
        </section>

        {/* FACTS */}
        <section className="card">
          <h2>Basic Information</h2>

          <div className="grid">
            <div>
              <span>Gender</span>
              <b>{profile.gender}</b>
            </div>
            <div>
              <span>Orientation</span>
              <b>{profile.sexual_orientation}</b>
            </div>
            <div>
              <span>Height</span>
              <b>{profile.height_cm}</b>
            </div>
            <div>
              <span>Occupation</span>
              <b>{profile.occupation}</b>
            </div>
            <div>
              <span>Education</span>
              <b>{profile.education}</b>
            </div>
            <div>
              <span>Personality</span>
              <b>{profile.personality_type}</b>
            </div>
          </div>
        </section>

        {/* LIFESTYLE */}
        <section className="card">
          <h2>Lifestyle</h2>

          <div className="grid">
            <div>
              <span>Smoking</span>
              <b>{profile.smoking}</b>
            </div>
            <div>
              <span>Drinking</span>
              <b>{profile.drinking}</b>
            </div>
            <div>
              <span>Exercise</span>
              <b>{profile.exercise_frequency}</b>
            </div>
            <div>
              <span>Pets</span>
              <b>{profile.has_pets}</b>
            </div>
          </div>
        </section>

        {/* FUTURE + DATING PREFERENCES - not asked of someone only here for
            language exchange. */}
        {connectionOf(profile) !== "language" && (
          <>
            <section className="card">
              <h2>Family & Future</h2>

              <div className="grid">
                <div>
                  <span>Children</span>
                  <b>{profile.has_children}</b>
                </div>
                <div>
                  <span>Wants children</span>
                  <b>{profile.wants_children}</b>
                </div>
                <div>
                  <span>Goal</span>
                  <b>{profile.relationship_goal}</b>
                </div>
              </div>
            </section>

            <section className="card">
              <h2>Dating Preferences</h2>

              <div className="grid">
                <div>
                  <span>Ideal first date</span>
                  <b>{profile.first_date_preference || "-"}</b>
                </div>
                <div>
                  <span>Past relationships</span>
                  <b>{profile.past_relationships_count || "-"}</b>
                </div>
                <div>
                  <span>Last breakup reason</span>
                  <b>{profile.last_breakup_reason || "-"}</b>
                </div>
              </div>
            </section>
          </>
        )}

        {/* LANGUAGES */}
        <section className="card">
          <h2>Languages</h2>

          <div className="tags">
            {profile.languages?.length ? (
              profile.languages.map((l, i) => (
                <span key={i}>{l.language_name || l}</span>
              ))
            ) : (
              <span>No languages listed</span>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

function withPhoto(profile, photo) {
  const photos = profile?.photos || [];
  if (photos.some((p) => p.id === photo.id)) return profile;
  return { ...profile, photos: [...photos, { id: photo.id, image_url: photo.image_url }] };
}

export default Profile;
