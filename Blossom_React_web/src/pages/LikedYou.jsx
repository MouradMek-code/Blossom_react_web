import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import MatchCelebration from "../components/MatchCelebration";
import styles from "./LikedYou.module.css";
import { BASE_URL } from "../api/config";
import { IMG } from "../api/images";
import { Button, EmptyState, Icon, SkeletonTiles } from "../ui";

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
  const { t } = useTranslation();
  const token = sessionStorage.getItem("token");
  const [likedByProfiles, setLikedByProfiles] = useState(null); // null while loading
  const [matchedProfile, setMatchedProfile] = useState(null);
  const [likingId, setLikingId] = useState(null);

  const fetchLikedBy = useCallback(async () => {
    try {
      // One request for the full profiles. Falls back to the older
      // ids-then-fetch-each path if the backend hasn't been deployed yet.
      const resp = await fetch(`${BASE_URL}/likes/profile_likes/profiles`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resp.ok) {
        setLikedByProfiles(await resp.json());
      } else {
        const legacyResp = await fetch(`${BASE_URL}/likes/profile_likes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await legacyResp.json();
        if (legacyResp.status !== 200)
          throw new Error("Could not load the people who liked you.");
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
      }

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
    setLikingId(profile.id);
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

      if (data.matched) setMatchedProfile(profile);
      setLikedByProfiles((prev) => (prev || []).filter((p) => p.id !== profile.id));
    } catch (err) {
    } finally {
      setLikingId(null);
    }
  }

  const closeMatch = useCallback(() => setMatchedProfile(null), []);

  return (
    <div>
      <PageNav />
      <MatchCelebration them={matchedProfile} onClose={closeMatch} />

      <div className={styles.head}>
        {/* Reached from the "Likes you" circle in Chats. */}
        <Link to="/messages" className={styles.backLink} aria-label={t("messages.back")}>
          <Icon name="arrow-left" size={22} />
        </Link>
        <h1 className={styles.title}>{t("likesYou.title")}</h1>
      </div>

      {likedByProfiles === null ? (
        <div className={styles.skeletonWrap}>
          <SkeletonTiles count={3} imageHeight={360} />
        </div>
      ) : likedByProfiles.length === 0 ? (
        <EmptyState
          icon="heart"
          text={t("likesYou.empty")}
          action={<Button to="/profiles" icon="users">{t("messages.browse")}</Button>}
        />
      ) : (
        <div className={styles.container}>
          {likedByProfiles.map((profile) => (
            <div key={profile.id} className={styles.card}>
              <button
                type="button"
                className={styles.imageWrapper}
                onClick={() => navigate(`/profile/${profile.id}`)}
                aria-label={`${t("messages.viewProfile")}: ${profile.first_name}`}
              >
                <img
                  src={IMG.thumb(profile.photos?.[0]?.image_url)}
                  alt={profile.first_name}
                  className={styles.image}
                />

                <span className={styles.overlay}>
                  <span className={styles.profileInfo}>
                    <span className={styles.name}>
                      {profile.first_name}
                      <span>{profile.age}</span>
                    </span>

                    <span className={styles.pills}>
                      {(profile.city || profile.country) && (
                        <span className={styles.pill}>
                          <Icon name="map-pin" size={15} />
                          {[profile.city, profile.country].filter(Boolean).join(", ")}
                        </span>
                      )}
                      {profile.occupation && (
                        <span className={styles.pill}>
                          <Icon name="briefcase" size={15} />
                          {profile.occupation}
                        </span>
                      )}
                    </span>
                  </span>
                </span>
              </button>

              <button
                type="button"
                className={styles.likeButton}
                onClick={() => handleLikeBack(profile)}
                disabled={likingId !== null}
              >
                <Icon name="heart" size={19} strokeWidth={2.4} />
                {t("likesYou.likeBack")}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LikedYou;
