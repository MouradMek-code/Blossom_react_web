import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IMG } from "../api/images";
import { loadFeaturedSpot, loadPublicSpots } from "../api/publicSpots";
import { shuffle } from "../api/shuffle";
import { Icon } from "../ui";
import styles from "./SpotsHero.module.css";

// How long each photo stays; the progress line in the card runs for this
// long, and the photo changes when it's full (a 1.2 s cross-fade).
const SLIDE_MS = 4000;
const MAX_SLIDES = 10;

// The spot of the week first (else the list's first: gift spots lead), then
// the others in a new random order each visit.
function heroOrder(all, weekly) {
  const withPhoto = all.filter((s) => s.image_url);
  const first = weekly?.image_url ? weekly : withPhoto[0];
  if (!first) return [];
  return [first, ...shuffle(withPhoto.filter((s) => s.id !== first.id))].slice(0, MAX_SLIDES);
}

// Homepage top: real date spots as the background, one after another behind
// the title (the blossom photo stays until the first one has loaded), and a
// glass card at the bottom - "Spots for dating", the place on screen, a
// progress line - that opens the date spots. Photos load one ahead; it rests
// while the card is hovered or the top is scrolled away. Nothing changes if
// no spot has a photo.
export default function SpotsHero() {
  const { t } = useTranslation();
  const [spots, setSpots] = useState([]);
  const [weeklyId, setWeeklyId] = useState(null);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(() => new Set());
  const [paused, setPaused] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const lastShown = useRef(-1);
  const backdrop = useRef(null);

  useEffect(() => {
    let alive = true;
    Promise.all([loadPublicSpots(), loadFeaturedSpot()]).then(([all, weekly]) => {
      if (!alive) return;
      setWeeklyId(weekly?.image_url ? weekly.id : null);
      setSpots(heroOrder(all, weekly));
    });
    return () => {
      alive = false;
    };
  }, []);

  const count = spots.length;
  const ready = count > 0;

  useEffect(() => {
    const node = backdrop.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ready]);

  if (!ready) return null;

  // Until the new photo has loaded, the last one stays on screen.
  if (loaded.has(index)) lastShown.current = index;
  const shown = lastShown.current;
  const current = spots[index];
  const next = (index + 1) % count;
  const running = count > 1 && !paused && onScreen;
  const place = [current.city, current.country].filter(Boolean).join(", ");

  return (
    <>
      <div ref={backdrop} className={`${styles.backdrop} ${styles.backdropLayer}`} aria-hidden="true">
        {spots.map((spot, i) =>
          i === index || i === next || loaded.has(i) ? (
            <img
              key={spot.id}
              className={`${styles.slide} ${i === shown ? styles.slideOn : ""}`}
              src={IMG.full(spot.image_url)}
              alt=""
              decoding="async"
              onLoad={() => setLoaded((cur) => (cur.has(i) ? cur : new Set(cur).add(i)))}
            />
          ) : null,
        )}
        <span className={`${styles.shade} ${shown >= 0 ? styles.shadeOn : ""}`} />
      </div>

      <Link
        to="/date-spots"
        className={styles.card}
        aria-label={`${t("spotsWall.title")}: ${current.name}. ${t("spotsWall.button")}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <span className={styles.thumbWrap}>
          <img key={current.id} className={styles.thumb} src={IMG.thumb(current.image_url)} alt="" />
        </span>
        <span className={styles.body} key={`body-${current.id}`}>
          <span className={styles.eyebrow}>{t("spotsWall.title")}</span>
          <span className={styles.name}>
            {current.id === weeklyId && <span className={styles.weekly}>{t("dateSpots.spotOfWeek")}</span>}
            {current.name}
          </span>
          {place && (
            <span className={styles.place}>
              <Icon name="map-pin" size={13} />
              {place}
            </span>
          )}
        </span>
        <span className={styles.arrow} aria-hidden="true">
          <Icon name="arrow-right" size={18} />
        </span>

        {count > 1 && (
          <span className={styles.progress} aria-hidden="true">
            {spots.map((spot, i) => (
              <span key={spot.id} className={styles.segment}>
                {i < index && <span className={`${styles.fill} ${styles.fillDone}`} />}
                {i === index && (
                  <span
                    key={`run-${index}`}
                    className={`${styles.fill} ${styles.fillRun}`}
                    style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: running ? "running" : "paused" }}
                    onAnimationEnd={() => setIndex(next)}
                  />
                )}
              </span>
            ))}
          </span>
        )}
      </Link>
    </>
  );
}
