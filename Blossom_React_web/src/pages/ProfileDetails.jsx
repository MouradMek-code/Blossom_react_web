import { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import { BASE_URL } from "../api/config";
import { IMG } from "../api/images";
import styles from "./ProfileDetails.module.css";

// Someone's full profile. Liking and passing happen on the Browse cards, not
// here; opened from a chat it also offers "Unmatch", next to Report and Block.
function ProfileDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Set by the chat page's links: this person is a match.
  const isMatch = Boolean(location.state?.matched);

  const [profile, setProfile] = useState(null);
  const [unmatching, setUnmatching] = useState(false);

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

  // The server deletes the conversation with the match, hence the confirmation.
  async function handleUnmatch() {
    const question = `${t("messages.unmatchTitle", { name: profile.first_name })}\n\n${t(
      "messages.unmatchMessage",
    )}`;
    if (!window.confirm(question)) return;
    setUnmatching(true);
    const token = sessionStorage.getItem("token");
    try {
      const resp = await fetch(`${BASE_URL}/matches/unmatch/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error(`unmatch failed with ${resp.status}`);
      navigate("/messages");
    } catch {
      setUnmatching(false);
      window.alert(t("messages.unmatchFailed"));
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
        <div className={styles.spinner} />
        <p style={{ color: "#d6336c", fontWeight: 600 }}>{t("messages.loading")}</p>
      </div>
    );
  }

  const coverPhoto = IMG.full(profile.photos?.[0]?.image_url);

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

        <button className={styles.backBtn} onClick={() => navigate(-1)}>← {t("safety.back")}</button>

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
            {isMatch && (
              <button className={styles.unmatchBtn} onClick={handleUnmatch} disabled={unmatching}>
                💔 {t("messages.unmatch")}
              </button>
            )}
            <button className={styles.reportBtn} onClick={() => setReportModalOpen(true)}>
              ⚠️ {t("safety.report")}
            </button>
            <button className={styles.blockBtn} onClick={() => setBlockModalOpen(true)}>
              🚫 {t("safety.block")}
            </button>
          </div>
        </div>

        {/* Photos */}
        {profile.photos?.length > 1 && (
          <div className={styles.card}>
            <p className={styles.cardTitle}>Photos</p>
            <div className={styles.photoGrid}>
              {profile.photos.map((p) => (
                <img key={p.id} src={IMG.card(p.image_url)} alt={profile.first_name} loading="lazy" onClick={() => setLightboxPhoto(p.image_url)} />
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
            <Fact label="Height" value={formatHeight(profile.height_cm)} />
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

      {/* BLOCK MODAL */}
      {blockModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setBlockModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <p className={styles.modalTitle}>{t("safety.blockTitle", { name: profile.first_name })}</p>
            <p className={styles.modalSub}>{t("safety.blockMessage")}</p>
            <div className={styles.modalActions}>
              <button className={styles.modalCancelBtn} onClick={() => setBlockModalOpen(false)}>
                {t("safety.cancel")}
              </button>
              <button className={styles.modalDestructiveBtn} onClick={handleBlock} disabled={blocking}>
                {blocking ? t("safety.blocking") : t("safety.block")}
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
            <p className={styles.modalTitle}>{t("safety.reportTitle")}</p>
            <p className={styles.modalSub}>{t("safety.reportQuestion", { name: profile.first_name })}</p>
            <textarea
              className={styles.modalTextarea}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder={t("safety.reportPlaceholder")}
              rows={4}
            />
            <div className={styles.modalActions}>
              <button className={styles.modalCancelBtn} onClick={() => setReportModalOpen(false)}>
                {t("safety.cancel")}
              </button>
              <button
                className={styles.modalSubmitBtn}
                onClick={handleReport}
                disabled={!reportReason.trim() || reporting}
              >
                {reporting ? t("safety.sending") : t("safety.submit")}
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

// Height is stored as a string that already includes the unit (e.g. "170 cm"),
// so strip any trailing "cm" before re-adding exactly one to avoid "170 cm cm".
function formatHeight(value) {
  if (!value) return null;
  return `${String(value).replace(/\s*cm\s*$/i, "").trim()} cm`;
}

export default ProfileDetails;
