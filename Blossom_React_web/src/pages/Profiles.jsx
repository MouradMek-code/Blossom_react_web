import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageNav from "../components/PageNav";
import ProfileFilterModal from "../components/ProfileFilterModal";
import { matchesFilters, getDefaultFilters } from "../api/profileFilters";
import { seededShuffle } from "../api/shuffle";
import styles from "./Profiles.module.css";
import { BASE_URL } from "../api/config";
import { IMG } from "../api/images";

function Profiles() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const [profiles, setProfiles] = useState([]);
  const [matchedProfile, setMatchedProfile] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("blossom_filters") || "{}"); } catch { return {}; }
  });
  const [appliedFilters, setAppliedFilters] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("blossom_filters") || "{}"); } catch { return {}; }
  });
  const [loading, setLoading] = useState(true);
  // One seed per mount: the deck order is random each visit but stays put
  // while browsing, even though a match triggers a re-fetch.
  const [deckSeed] = useState(() => Math.random());

  async function handleLike(e, profile) {
    e.stopPropagation();
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
    } catch (err) {}
  }

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    async function fetchAll() {
      try {
        const [profilesResp, ownResp] = await Promise.all([
          fetch(`${BASE_URL}/profile/all_profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${BASE_URL}/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const data = await profilesResp.json();
        if (profilesResp.status !== 200)
          throw new Error(`error happened on login : ${data.detail?.[0]?.msg}`);
        // Randomise the deck so the same faces aren't always first.
        setProfiles(seededShuffle(data, deckSeed));

        if (ownResp.ok) {
          const ownData = await ownResp.json();
          const saved = (() => { try { return JSON.parse(sessionStorage.getItem("blossom_filters") || "null"); } catch { return null; } })();
          const defaults = getDefaultFilters(ownData);
          const initial = saved !== null ? saved : defaults;
          setDraftFilters(initial);
          setAppliedFilters(initial);
        }
      } catch (err) {
        sessionStorage.setItem("token", null);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [token, navigate, matchedProfile, deckSeed]);

  const filteredProfiles = useMemo(
    () => profiles.filter((p) => matchesFilters(p, appliedFilters)),
    [profiles, appliedFilters],
  );

  const activeFilterCount = Object.keys(appliedFilters).length;

  function openFilters() {
    setDraftFilters(appliedFilters);
    setFilterOpen(true);
  }

  function applyFilters() {
    setAppliedFilters(draftFilters);
    sessionStorage.setItem("blossom_filters", JSON.stringify(draftFilters));
    setFilterOpen(false);
  }

  if (loading) {
    return (
      <div className="profile-page">
        <PageNav />
        <p className={styles.empty} style={{ marginTop: "4rem" }}>Loading profiles...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {matchedProfile && (
        <div className={styles.matchOverlay}>
          <div className={styles.matchCard}>
            <div className={styles.matchHeart}>❤️</div>
            <h1>It's a Match!</h1>
            <img
              src={IMG.card(matchedProfile.photos?.[0]?.image_url)}
              alt={matchedProfile.first_name}
              className={styles.matchImage}
            />
            <h2>{matchedProfile.first_name}</h2>
            <p>You both liked each other</p>
          </div>
        </div>
      )}

      <PageNav />

      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.filterButton}
          onClick={openFilters}
        >
          ⚙️ Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </button>
      </div>

      <ProfileFilterModal
        open={filterOpen}
        filters={draftFilters}
        onChange={setDraftFilters}
        onApply={applyFilters}
        onClose={() => setFilterOpen(false)}
        profiles={profiles}
      />

      <div className={styles.container}>
        {filteredProfiles.length === 0 && (
          <div className={styles.empty}>
            {activeFilterCount > 0 ? (
              <>
                <div className={styles.emptyIcon}>🔍</div>
                <p className={styles.emptyTitle}>No matches for your filters</p>
                <p className={styles.emptyText}>Try widening your search — more people may appear with fewer filters applied.</p>
                <p className={styles.emptyHint}>Click ⚙️ Filters to adjust</p>
              </>
            ) : (
              <>
                <div className={styles.emptyIcon}>🌸</div>
                <p className={styles.emptyTitle}>You've seen everyone!</p>
                <p className={styles.emptyText}>No more profiles right now — check back later as new members join every day.</p>
                <p className={styles.emptyHint}>New people bloom every day 💌</p>
              </>
            )}
          </div>
        )}

        {filteredProfiles.map((profile) => (
          <div key={profile.id} className={styles.card}>
            <button
              type="button"
              className={styles.loveButton}
              onClick={(e) => handleLike(e, profile)}
            >
              ❤️
            </button>

            <img
              src={IMG.card(profile.photos?.[0]?.image_url)}
              alt={profile.first_name}
              className={styles.image}
            />

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

                <button
                  type="button"
                  className={styles.viewProfileButton}
                  onClick={() => navigate(`/profile/${profile.id}`)}
                >
                  View Profile
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Profiles;
