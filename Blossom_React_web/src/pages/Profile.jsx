import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageNav from "../components/PageNav";
import "./profile.css";

import { BASE_URL } from "../api/config";

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  const token = sessionStorage.getItem("token");
  const istokenundefined = token === "undefined" || token === null;
  console.log(token);
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
  }, [token, navigate]);

  if (!profile) return <div className="loading">Loading...</div>;
  return (
    <div className="profile-page">
      <PageNav />

      <div className="profile-container">
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

export default Profile;
