import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageNav from "../components/PageNav";
import ProfileFilterModal from "../components/ProfileFilterModal";
import { matchesFilters } from "../api/profileFilters";
import styles from "./Profiles.module.css";
const BASE_URL = "http://localhost:8000";

function Profiles() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const [profiles, setProfiles] = useState([]);
  const [matchedProfile, setMatchedProfile] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState({});
  const [appliedFilters, setAppliedFilters] = useState({});

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
        throw new Error(`error happened on like service : ${data.detail?.[0]?.msg}`);

      if (data.matched) {
        setMatchedProfile(profile);
        setTimeout(() => setMatchedProfile(null), 2000);
      }
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    async function fetchProfiles() {
      try {
        const resp = await fetch(`${BASE_URL}/profile/all_profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await resp.json();
        if (resp.status !== 200)
          throw new Error(`error happeneded on login : ${data.detail?.[0]?.msg}`);
        setProfiles(data);
      } catch (err) {
        sessionStorage.setItem("token", null);
        navigate("/login");
      }
    }

    fetchProfiles();
  }, [token, navigate, matchedProfile]);

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
    setFilterOpen(false);
  }

  return (
    <div className="profile-page">
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

      <PageNav />

      <div className={styles.toolbar}>
        <button type="button" className={styles.filterButton} onClick={openFilters}>
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
          <p className={styles.empty}>
            {activeFilterCount > 0 ? "No profiles match your filters" : "No profiles to show"}
          </p>
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
              src={profile.photos?.[0]?.image_url}
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
