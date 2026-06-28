import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageNav from "../components/PageNav";
import "./profile.css";

import { BASE_URL } from "../api/config";

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
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
        const data = await resp.json();
        if (resp.status !== 200)
          throw new Error(`error happeneded on login : ${data.detail[0].msg}`);

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

  async function handleUploadPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const resp = await fetch(`${BASE_URL}/profile/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const newPhoto = await resp.json();
      if (resp.status !== 200) throw new Error("Failed to upload photo");
      setProfile((prev) => ({ ...prev, photos: [...(prev.photos || []), newPhoto] }));
    } catch (err) {
      setError(err.toString());
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  }

  async function handleDeletePhoto(photoId) {
    setError("");
    try {
      const resp = await fetch(`${BASE_URL}/profile/image/${photoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.status !== 200) throw new Error("Failed to delete photo");
      setProfile((prev) => ({
        ...prev,
        photos: prev.photos.filter((p) => p.id !== photoId),
      }));
    } catch (err) {
      setError(err.toString());
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Delete your account permanently? This will remove your profile, photos, matches, and messages. This cannot be undone."
    );
    if (!confirmed) return;

    setDeletingAccount(true);
    setError("");
    try {
      const resp = await fetch(`${BASE_URL}/user/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.status !== 200) throw new Error("Failed to delete account");
      sessionStorage.clear();
      navigate("/");
    } catch (err) {
      setError(err.toString());
      setDeletingAccount(false);
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
              📍 {profile.city || "Location not set"},{" "}
              {profile.country || "Location not set"}
            </p>

            <div className="hero-badges">
              <span>💘 {profile.relationship_goal || "Not specified"}</span>

              {profile.occupation && <span>💼 {profile.occupation}</span>}

              {profile.education && <span>🎓 {profile.education}</span>}
            </div>
          </div>
        </section>

        {/* PHOTOS */}
        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Photos</h2>
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
              {uploadingPhoto ? "Uploading..." : "+ Add Photo"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleUploadPhoto}
            />
          </div>
          <div className="photos-grid">
            {profile.photos?.map((p) => (
              <div key={p.id} style={{ position: "relative" }}>
                <img src={p.image_url} alt={profile.first_name} />
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

        {/* FUTURE */}
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

        {/* DATING PREFERENCES */}
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

        {/* DANGER ZONE */}
        <section className="card" style={{ borderColor: "#e11d48" }}>
          <h2>Danger Zone</h2>
          <p style={{ color: "#666", marginBottom: "12px" }}>
            Permanently delete your account, profile, photos, matches, and messages.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deletingAccount}
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
            {deletingAccount ? "Deleting..." : "Delete Account"}
          </button>
        </section>
      </div>
    </div>
  );
}

export default Profile;
