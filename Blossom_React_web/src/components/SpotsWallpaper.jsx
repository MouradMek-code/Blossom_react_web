import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IMG } from "../api/images";
import { loadFeaturedSpot, loadPublicSpots } from "../api/publicSpots";
import { shuffle } from "../api/shuffle";
import { Icon } from "../ui";
import styles from "./SpotsWallpaper.module.css";

// How long each photo stays (the change itself is a 1 s cross-fade).
const SLIDE_MS = 3000;
const MAX_SLIDES = 12;


// The spot of the week first (else the list's first: gift spots lead), then
// the others in a new random order each time.
function wallOrder(all, weekly) {
  const withPhoto = all.filter((s) => s.image_url);
  const first = weekly?.image_url ? weekly : withPhoto[0];
  if (!first) return [];
  return [first, ...shuffle(withPhoto.filter((s) => s.id !== first.id))].slice(0, MAX_SLIDES);
}

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Homepage: a big wallpaper of real date spots, one photo after another.
// The whole picture is a link to the date spots page. Photos load one ahead
// (not all at once); it only turns while on screen, and stops while the
// mouse is on it. No spots with a photo: nothing is shown.
export default function SpotsWallpaper() {
  const { t } = useTranslation();
  const [spots, setSpots] = useState([]);
  const [weeklyId, setWeeklyId] = useState(null);
  const [index, setIndex] = useState(0);
  const [needed, setNeeded] = useState(() => new Set([0, 1]));
  const [paused, setPaused] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    let alive = true;
    Promise.all([loadPublicSpots(), loadFeaturedSpot()]).then(([all, weekly]) => {
      if (!alive) return;
      setWeeklyId(weekly?.image_url ? weekly.id : null);
      setSpots(wallOrder(all, weekly));
    });
    return () => {
      alive = false;
    };
  }, []);

  const count = spots.length;
  const ready = count > 0;

  // Turn only while it can be seen.
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setOnScreen(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.25 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ready]);

  useEffect(() => {
    if (count < 2 || paused || !onScreen || reducedMotion()) return undefined;
    const timer = setInterval(() => {
      if (document.visibilityState !== "hidden") setIndex((i) => (i + 1) % count);
    }, SLIDE_MS);
    return () => clearInterval(timer);
  }, [count, paused, onScreen]);

  // The photo on screen and the next one get loaded; the rest wait their turn.
  useEffect(() => {
    if (count === 0) return;
    const next = (index + 1) % count;
    setNeeded((cur) => (cur.has(index) && cur.has(next) ? cur : new Set([...cur, index, next])));
  }, [index, count]);

  if (!ready) return null;
  const current = spots[index];

  return (
    <Link
      ref={ref}
      to="/date-spots"
      className={styles.wall}
      aria-label={`${t("spotsWall.title")} - ${t("spotsWall.button")}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {spots.map((spot, i) => (
        <img
          key={spot.id}
          className={`${styles.slide} ${i === index ? styles.slideOn : ""}`}
          src={needed.has(i) ? IMG.full(spot.image_url) : undefined}
          alt=""
          aria-hidden="true"
          decoding="async"
        />
      ))}
      <span className={styles.shade} aria-hidden="true" />

      {/* Which place this is. */}
      {current.id === weeklyId ? (
        <span className={`${styles.caption} ${styles.captionWeekly}`} key={current.id} aria-hidden="true">
          {t("dateSpots.spotOfWeek")} · {current.name}
        </span>
      ) : (
        <span className={styles.caption} key={current.id} aria-hidden="true">
          <Icon name="map-pin" size={15} />
          {[current.name, current.city].filter(Boolean).join(" · ")}
        </span>
      )}

      <span className={styles.content}>
        <span className={styles.title}>{t("spotsWall.title")}</span>
        <span className={styles.text}>{t("spotsWall.text")}</span>
        <span className={styles.cta}>
          {t("spotsWall.button")}
          <Icon name="arrow-right" size={19} />
        </span>
      </span>

      {count > 1 && (
        <span className={styles.dots} aria-hidden="true">
          {spots.map((spot, i) => (
            <span key={spot.id} className={`${styles.dot} ${i === index ? styles.dotOn : ""}`} />
          ))}
        </span>
      )}
    </Link>
  );
}
