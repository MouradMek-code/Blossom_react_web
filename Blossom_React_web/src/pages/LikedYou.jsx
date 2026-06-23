import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageNav from "../components/PageNav";
import styles from "./LikedYou.module.css";
import { BASE_URL } from "../api/config";

// /likes/profile_likes only returns the ids of profiles that liked the
// current user, so each id has to be resolved via /profile/{id} to get the
// actual name/photos/etc.
function extractId(entry) {
  if (typeof entry === "number" || typeof entry === "string") return entry;
  return (
    entry.profile_id ?? entry.id ?? entry.liker_id ?? entry.liker_profile_id
  );
}

function LikedYou() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const [likedByProfiles, setLikedByProfiles] = useState([]);
  const [matchedProfile, setMatchedProfile] = useState(null);

  const fetchLikedBy = useCallback(async () => {
    try {
      const resp = await fetch(`${BASE_URL}/likes/profile_likes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      if (resp.status !== 200)
        throw new Error(
          `error happeneded on likes service : ${data.detail?.[0]?.msg}`,
        );

      const ids = data
        .map(extractId)
        .filter((id) => id !== undefined && id !== null);
      const profiles = await Promise.all(
        ids.map(async (id) => {
          const profileResp = await fetch(`${BASE_URL}/profile/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          return profileResp.json();
        }),
      );
      setLikedByProfiles(profiles);

      fetch(`${BASE_URL}/likes/profile_likes/mark_seen`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    } catch (err) {
      sessionStorage.setItem("token", null);
      navigate("/login");
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchLikedBy();
  }, [token, navigate, fetchLikedBy]);

  async function handleLikeBack(profile) {
    try {
      const resp = await fetch(`${BASE_URL}/likes/${profile.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await resp.json();
      if (resp.status !== 200)
        throw new Error(
          `error happened on like service : ${data.detail?.[0]?.msg}`,
        );

      if (data.matched) {
        setMatchedProfile(profile);
        setTimeout(() => setMatchedProfile(null), 2000);
      }
      setLikedByProfiles((prev) => prev.filter((p) => p.id !== profile.id));
    } catch (err) {}
  }

  return (
    <div>
      <PageNav />

      {matchedProfile && (
        <div className={styles.matchOverlay}>
          <div className={styles.matchCard}>
            <div className={styles.matchHeart}>❤️</div>
            <h1>It's a Match!</h1>
            <img
              src={matchedProfile.photos?.[0]?.image_url}
              alt={matchedProfile.first_name}
              className={styles.matchImage}
            />
            <h2>{matchedProfile.first_name}</h2>
            <p>You both liked each other</p>
          </div>
        </div>
      )}

      <h1 className={styles.title}>People who like you</h1>

      <div className={styles.container}>
        {likedByProfiles.length === 0 && (
          <p className={styles.empty}>likes ....</p>
        )}

        {likedByProfiles.map((profile) => (
          <div key={profile.id} className={styles.card}>
            <div
              className={styles.imageWrapper}
              onClick={() => navigate(`/profile/${profile.id}`)}
            >
              <img
                src={profile.photos?.[0]?.image_url}
                alt={profile.first_name}
                className={styles.image}
              />

              <div className={styles.heartBadge}>❤️</div>

              <div className={styles.overlay}>
                <div className={styles.profileInfo}>
                  <h3>
                    {profile.first_name}
                    <span>{profile.age}</span>
                  </h3>

                  <p className={styles.location}>
                    📍 {profile.city}, {profile.country}
                  </p>

                  {profile.occupation && (
                    <div className={styles.tag}>💼 {profile.occupation}</div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              className={styles.likeButton}
              onClick={() => handleLikeBack(profile)}
            >
              ❤️ Like Back
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LikedYou;
