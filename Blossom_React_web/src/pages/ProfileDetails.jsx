import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageNav from "../components/PageNav";
import { BASE_URL } from "../api/config";
import styles from "./ProfileDetails.module.css";

function ProfileDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [liked, setLiked] = useState(false);
  const [matched, setMatched] = useState(false);
  const [liking, setLiking] = useState(false);

  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [blocking, setBlocking] = useState(false);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const token = sessionStorage.getItem("token");
      const resp = await fetch(`${BASE_URL}/profile/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      setProfile(data);
    }
    fetchProfile();
  }, [id]);

  async function handleLike() {
    if (liked || liking) return;
    setLiking(true);
    const token = sessionStorage.getItem("token");
    try {
      const resp = await fetch(`${BASE_URL}/likes/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await resp.json();
      setLiked(true);
      if (data.matched) {
        setMatched(true);
        setTimeout(() => setMatched(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLiking(false);
    }
  }

  async function handleBlock() {
    setBlocking(true);
    const token = sessionStorage.getItem("token");
    try {
      const resp = await fetch(`${BASE_URL}/blocks/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error("Failed to block");
      navigate("/profiles");
    } catch (err) {
      console.error(err);
      setBlocking(false);
    }
  }

  async function handleReport() {
    const reason = reportReason.trim();
    if (!reason) return;
    setReporting(true);
    const token = sessionStorage.getItem("token");
    try {
      const resp = await fetch(`${BASE_URL}/reports`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reported_profile_id: Number(id), reason }),
      });
      if (!resp.ok) throw new Error("Failed to report");
      setReportModalOpen(false);
      setReportReason("");
    } catch (err) {
      console.error(err);
    } finally {
      setReporting(false);
    }
  }

  if (!profile) {
    return (
      <div className={styles.loadingPage}>
        <PageNav />
        <div className={styles.spinner} />
        <p style={{ color: "#d6336c", fontWeight: 600 }}>Loading profile…</p>
      </div>
    );
  }

  const coverPhoto = profile.photos?.[0]?.image_url;

  return (
    <div className={styles.page}>
      <PageNav />

      {/* HERO */}
      <div className={styles.hero}>
        {coverPhoto ? (
          <img src={coverPhoto} alt={profile.first_name} className={styles.heroCover} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#fde4ef,#d6336c)" }} />
        )}
        <div className={styles.heroGradient} />

        <button className={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>

        <div className={styles.heroInfo}>
          <h1 className={styles.heroName}>
            {profile.first_name}
            <span className={styles.heroAge}>, {profile.age}</span>
          </h1>
          <div className={styles.heroMeta}>
            {profile.city && <span className={styles.heroBadge}>📍 {profile.city}</span>}
            {profile.relationship_goal && <span className={styles.heroBadge}>💘 {profile.relationship_goal}</span>}
            {profile.occupation && <span className={styles.heroBadge}>💼 {profile.occupation}</span>}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className={styles.body}>

        {/* Safety */}
        <div className={styles.card}>
          <div className={styles.safetyRow}>
            <button className={styles.reportBtn} onClick={() => setReportModalOpen(true)}>⚠️ Report</button>
            <button className={styles.blockBtn} onClick={() => setBlockModalOpen(true)}>🚫 Block</button>
          </div>
        </div>

        {/* Photos */}
        {profile.photos?.length > 1 && (
          <div className={styles.card}>
            <p className={styles.cardTitle}>Photos</p>
            <div className={styles.photoGrid}>
              {profile.photos.map((p) => (
                <img key={p.id} src={p.image_url} alt={profile.first_name} onClick={() => setLightboxPhoto(p.image_url)} />
              ))}
            </div>
          </div>
        )}

        {/* About */}
        {profile.bio && (
          <div className={styles.card}>
            <p className={styles.cardTitle}>About {profile.first_name}</p>
            <p className={styles.bio}>{profile.bio}</p>
          </div>
        )}

        {/* Basic Info */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Basic Information</p>
          <div className={styles.grid}>
            <Fact label="Gender" value={profile.gender} />
            <Fact label="Orientation" value={profile.sexual_orientation} />
            <Fact label="Height" value={profile.height_cm ? `${profile.height_cm} cm` : null} />
            <Fact label="Occupation" value={profile.occupation} />
            <Fact label="Education" value={profile.education} />
            <Fact label="Personality" value={profile.personality_type} />
          </div>
        </div>

        {/* Lifestyle */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Lifestyle</p>
          <div className={styles.grid}>
            <Fact label="Smoking" value={profile.smoking} />
            <Fact label="Drinking" value={profile.drinking} />
            <Fact label="Exercise" value={profile.exercise_frequency} />
            <Fact label="Pets" value={profile.has_pets} />
          </div>
        </div>

        {/* Family */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Family & Future</p>
          <div className={styles.grid}>
            <Fact label="Children" value={profile.has_children} />
            <Fact label="Wants children" value={profile.wants_children} />
            <Fact label="Goal" value={profile.relationship_goal} />
            <Fact label="Ideal first date" value={profile.first_date_preference} />
          </div>
        </div>

        {/* Languages */}
        {profile.languages?.length > 0 && (
          <div className={styles.card}>
            <p className={styles.cardTitle}>🗣️ Speaks</p>
            <div className={styles.tags}>
              {profile.languages.map((l, i) => (
                <span key={i} className={styles.tag}>{l.language_name || l}</span>
              ))}
            </div>
          </div>
        )}

        {/* Learning Languages */}
        {profile.learning_languages?.length > 0 && (
          <div className={`${styles.card} ${styles.learningCard}`}>
            <p className={`${styles.cardTitle} ${styles.learningCardTitle}`}>📚 Learning</p>
            <div className={styles.tags}>
              {profile.learning_languages.map((l, i) => (
                <span key={i} className={`${styles.tag} ${styles.learningTag}`}>{l.language_name || l}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* STICKY ACTION BAR */}
      <div className={styles.actionBar}>
        <button className={styles.passBtn} onClick={() => navigate(-1)} title="Pass">✕</button>
        <button
          className={styles.likeBtn}
          onClick={handleLike}
          disabled={liked || liking}
          title={liked ? "Liked!" : "Like"}
        >
          {liked ? "💖" : "❤️"}
        </button>
      </div>

      {/* MATCH TOAST */}
      {matched && (
        <div className={styles.matchToast}>🎉 It's a Match with {profile.first_name}!</div>
      )}

      {/* BLOCK MODAL */}
      {blockModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setBlockModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <p className={styles.modalTitle}>Block {profile.first_name}?</p>
            <p className={styles.modalSub}>
              You won't see each other again and won't be able to message them.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.modalCancelBtn} onClick={() => setBlockModalOpen(false)}>Cancel</button>
              <button className={styles.modalDestructiveBtn} onClick={handleBlock} disabled={blocking}>
                {blocking ? "Blocking…" : "Block"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightboxPhoto && (
        <div className={styles.lightboxOverlay} onClick={() => setLightboxPhoto(null)}>
          <img src={lightboxPhoto} alt="Full size" className={styles.lightboxImage} onClick={(e) => e.stopPropagation()} />
          <button className={styles.lightboxClose} onClick={() => setLightboxPhoto(null)}>✕</button>
        </div>
      )}

      {/* REPORT MODAL */}
      {reportModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setReportModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <p className={styles.modalTitle}>Report this profile</p>
            <p className={styles.modalSub}>Why are you reporting {profile.first_name}?</p>
            <textarea
              className={styles.modalTextarea}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe the issue…"
              rows={4}
            />
            <div className={styles.modalActions}>
              <button className={styles.modalCancelBtn} onClick={() => setReportModalOpen(false)}>Cancel</button>
              <button
                className={styles.modalSubmitBtn}
                onClick={handleReport}
                disabled={!reportReason.trim() || reporting}
              >
                {reporting ? "Sending…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Fact({ label, value }) {
  return (
    <div className={styles.fact}>
      <span className={styles.factLabel}>{label}</span>
      <span className={styles.factValue}>{value || "—"}</span>
    </div>
  );
}

export default ProfileDetails;
