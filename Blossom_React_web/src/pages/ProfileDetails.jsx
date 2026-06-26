import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageNav from "../components/PageNav";
import { BASE_URL } from "../api/config";

function ProfileDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      const token = sessionStorage.getItem("token");

      const resp = await fetch(`${BASE_URL}/profile/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await resp.json();

      setProfile(data);
    }

    fetchProfile();
  }, [id]);

  async function handleBlock() {
    const confirmed = window.confirm(
      "Block this person? You won't see each other again, and you won't be able to message them."
    );
    if (!confirmed) return;

    const token = sessionStorage.getItem("token");
    try {
      const resp = await fetch(`${BASE_URL}/blocks/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error("Failed to block");
      navigate("/profiles");
    } catch (err) {
      window.alert(err.toString());
    }
  }

  async function handleReport() {
    const reason = window.prompt("Why are you reporting this profile?");
    if (!reason) return;

    const token = sessionStorage.getItem("token");
    try {
      const resp = await fetch(`${BASE_URL}/reports`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reported_profile_id: Number(id), reason }),
      });
      if (!resp.ok) throw new Error("Failed to submit report");
      window.alert("Report submitted. Thank you.");
    } catch (err) {
      window.alert(err.toString());
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
        {/* HERO */}
        <section className="hero-card">
          <div className="hero-left">
            <h1 className="name">
              {profile.first_name}
              <span className="age"> {profile.age} years old</span>
            </h1>

            <p className="location">📍 {profile.city || "Location not set"}</p>

            <p className="goal">
              💘 {profile.relationship_goal || "Not specified"}
            </p>

            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button
                type="button"
                onClick={handleReport}
                style={{
                  border: "1px solid #999",
                  borderRadius: "999px",
                  padding: "6px 14px",
                  background: "white",
                  color: "#555",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Report
              </button>
              <button
                type="button"
                onClick={handleBlock}
                style={{
                  border: "none",
                  borderRadius: "999px",
                  padding: "6px 14px",
                  background: "#e11d48",
                  color: "white",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Block
              </button>
            </div>
          </div>
        </section>

        {/* PHOTOS */}
        <section className="card">
          <h2>Photos</h2>
          <div className="photos-grid">
            {profile.photos?.map((p) => (
              <img key={p.id} src={p.image_url} alt={profile.first_name} />
            ))}
          </div>
        </section>

        {/* ABOUT */}
        <section className="card">
          <h2>About {profile.first_name}</h2>
          <p className="bio">{profile.bio || "No bio added yet."}</p>
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
              <b>{profile.height_cm} cm</b>
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

export default ProfileDetails;
