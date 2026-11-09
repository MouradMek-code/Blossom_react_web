import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import MatchCelebration from "../components/MatchCelebration";
import ProfileFilterModal from "../components/ProfileFilterModal";
import { matchesFilters, getDefaultFilters } from "../api/profileFilters";
import { seededShuffle } from "../api/shuffle";
import styles from "./Profiles.module.css";
import { BASE_URL } from "../api/config";
import { IMG } from "../api/images";
import { isNewMember } from "../api/newMember";
import { CONNECTION_DOTS, connectionOf, firstMove, languagesLine } from "../api/connection";
import { Button, EmptyState, Icon, SkeletonTiles } from "../ui";

// One person in the Browse grid. Several photos: bars on top, and the left or
// right half of the photo shows the previous or next one.
function BrowseCard({ profile, latinScript, onLike, onOpen }) {
  const { t } = useTranslation();
  const photos = profile.photos || [];
  const [index, setIndex] = useState(0);
  const photo = photos[Math.min(index, Math.max(photos.length - 1, 0))];

  function step(e, by) {
    e.stopPropagation();
    setIndex((cur) => Math.min(Math.max(cur + by, 0), photos.length - 1));
  }

  return (
    <div className={styles.card}>
      <img src={IMG.card(photo?.image_url)} alt={profile.first_name} className={styles.image} />

      {photos.length > 1 && (
        <>
          <div className={styles.bars} aria-hidden="true">
            {photos.map((p, i) => (
              <span key={p.id ?? i} className={`${styles.bar} ${i === index ? styles.barOn : ""}`} />
            ))}
          </div>
          <button
            type="button"
            className={`${styles.tapZone} ${styles.tapLeft}`}
            onClick={(e) => step(e, -1)}
            disabled={index === 0}
            aria-label={t("browse.previousPhoto")}
          />
          <button
            type="button"
            className={`${styles.tapZone} ${styles.tapRight}`}
            onClick={(e) => step(e, 1)}
            disabled={index >= photos.length - 1}
            aria-label={t("browse.nextPhoto")}
          />
        </>
      )}

      <button
        type="button"
        className={styles.loveButton}
        onClick={(e) => onLike(e, profile)}
        aria-label={`${t("browse.like")} ${profile.first_name}`}
      >
        <Icon name="heart" size={24} color="var(--primary)" strokeWidth={2.4} />
      </button>

      {/* Joined less than a week ago. */}
      {isNewMember(profile) && (
        <span className={`${styles.newBadge} ${latinScript ? styles.smallCaps : ""}`}>
          <span className={styles.newDot} aria-hidden="true" />
          {t("browse.new")}
        </span>
      )}

      <div className={styles.overlay}>
        <div className={styles.profileInfo}>
          {/* What they're here for: dating, language exchange or both. */}
          <span className={styles.connection}>
            <span className={styles.dots} aria-hidden="true">
              {CONNECTION_DOTS[connectionOf(profile)].map((color) => (
                <span key={color} className={styles.dot} style={{ background: color }} />
              ))}
            </span>
            {t(`connection.${connectionOf(profile)}`)}
          </span>
          <h3>
            <span className={styles.nameLine}>
              {profile.first_name}
              {profile.verified && (
                <span className={styles.verified} title={t("verified.verifiedLabel")}>
                  <Icon name="check" size={14} strokeWidth={3.2} color="#fff" />
                </span>
              )}
            </span>
            <span>{profile.age}</span>
          </h3>

          <div className={styles.pills}>
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
          </div>

          {/* The languages matter to anyone open to language exchange. */}
          {connectionOf(profile) !== "dating" && languagesLine(profile) && (
            <p className={styles.languages}>{languagesLine(profile)}</p>
          )}

          <button type="button" className={styles.viewProfileButton} onClick={() => onOpen(profile)}>
            {t("browse.viewProfile")}
            <Icon name="arrow-right" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Profiles() {
  const { t, i18n } = useTranslation();
  // Small caps with letter spacing for Latin scripts only: spacing breaks
  // Arabic's joined letters, and Chinese has no capitals.
  const latinScript = !/^(ar|zh)/.test(i18n.language || "");
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const [profiles, setProfiles] = useState([]);
  const [ownPhoto, setOwnPhoto] = useState(null);
  const [ownProfile, setOwnProfile] = useState(null);
  const [matchedProfile, setMatchedProfile] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("blossom_filters") || "{}"); } catch { return {}; }
  });
  const [appliedFilters, setAppliedFilters] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("blossom_filters") || "{}"); } catch { return {}; }
  });
  const [loading, setLoading] = useState(true);
  // Bumped by "Refresh" at the end of the deck.
  const [reloadKey, setReloadKey] = useState(0);
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

      // The match moment stays until they choose: write, or keep browsing.
      if (data.matched) setMatchedProfile(profile);
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
          setOwnPhoto(ownData.photos?.[0]?.image_url || null);
          setOwnProfile(ownData);
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
  }, [token, navigate, matchedProfile, deckSeed, reloadKey]);

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

  const closeMatch = useCallback(() => setMatchedProfile(null), []);

  function refresh() {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }

  const toolbar = (
    <div className={styles.toolbar}>
      <h1 className={styles.pageTitle}>{t("browse.title")}</h1>
      <button type="button" className={styles.filterButton} onClick={openFilters} disabled={loading}>
        <Icon name="sliders" size={18} />
        {t("browse.filters")}
        {activeFilterCount > 0 && <span className={styles.filterCount}>{activeFilterCount}</span>}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="profile-page">
        <PageNav />
        {toolbar}
        <div className={styles.skeletonWrap}>
          <SkeletonTiles count={6} imageHeight={420} />
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <MatchCelebration
        myPhoto={ownPhoto}
        them={matchedProfile}
        onClose={closeMatch}
        youWriteFirst={firstMove(ownProfile, matchedProfile) === "you"}
      />

      <PageNav />

      {toolbar}

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
          <div className={styles.emptyWrap}>
            {activeFilterCount > 0 ? (
              <EmptyState
                icon="search"
                title={t("browse.noMatchTitle")}
                text={t("browse.noMatchText")}
                action={<Button icon="sliders" onClick={openFilters}>{t("browse.filters")}</Button>}
              />
            ) : (
              <EmptyState
                icon="users"
                title={t("browse.emptyTitle")}
                text={t("browse.emptyText")}
                action={<Button icon="refresh-cw" variant="secondary" onClick={refresh}>{t("browse.refresh")}</Button>}
              />
            )}
          </div>
        )}

        {filteredProfiles.map((profile) => (
          <BrowseCard
            key={profile.id}
            profile={profile}
            latinScript={latinScript}
            onLike={handleLike}
            onOpen={(p) => navigate(`/profile/${p.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

export default Profiles;
