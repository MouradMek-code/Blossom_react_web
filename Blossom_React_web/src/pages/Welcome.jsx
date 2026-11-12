import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import { Button, Icon } from "../ui";
import styles from "./Welcome.module.css";
import { getAuth } from "../api/session";

// What makes Blossom different, once, right after sign-up (after the
// location step): women write first, date spots, partner gifts. "Next", the
// arrow keys or a dot moves between the pages; "Skip" or the last button goes
// to Browse. The app has the same screens (WelcomeScreen).
const STEPS = [
  { key: "women", icon: "message-circle", emoji: "💬" },
  { key: "spots", icon: "map-pin", emoji: "📍" },
  { key: "gifts", icon: "gift", emoji: "🎁" },
];

export default function Welcome() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  // Which way the new page slides in.
  const [direction, setDirection] = useState(1);
  const titleRef = useRef(null);
  const step = STEPS[index];
  const last = index === STEPS.length - 1;

  useEffect(() => {
    if (!getAuth("token")) navigate("/login", { replace: true });
  }, [navigate]);

  function finish() {
    navigate("/profiles", { replace: true });
  }

  function goTo(next) {
    if (next < 0 || next >= STEPS.length) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  }

  // Keyboard: the arrows turn the page (the reading way in Arabic).
  useEffect(() => {
    const rtl = (i18n.language || "").startsWith("ar");
    const onKey = (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const forward = (e.key === "ArrowRight") !== rtl;
      setIndex((cur) => {
        const next = Math.min(Math.max(cur + (forward ? 1 : -1), 0), STEPS.length - 1);
        if (next !== cur) setDirection(forward ? 1 : -1);
        return next;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i18n.language]);

  // Screen readers hear the new page.
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, [index]);

  return (
    <div className={styles.page}>
      <PageNav minimal />
      <main className={styles.wrap}>
        <div className={styles.top}>
          <span className={styles.counter} aria-label={t("welcome.stepOf", { n: index + 1, total: STEPS.length })}>
            {index + 1} / {STEPS.length}
          </span>
          {!last && (
            <button type="button" className={styles.skip} onClick={finish}>
              {t("welcome.skip")}
            </button>
          )}
        </div>

        <section key={step.key} className={`${styles.step} ${direction < 0 ? styles.fromStart : styles.fromEnd}`}>
          <div className={styles.halo} aria-hidden="true">
            <span className={styles.circle}>
              <Icon name={step.icon} size={62} strokeWidth={1.7} color="var(--primary)" />
            </span>
            <span className={styles.badge}>{step.emoji}</span>
          </div>
          <h1 className={styles.title} ref={titleRef} tabIndex={-1}>
            {t(`welcome.${step.key}Title`)}
          </h1>
          <p className={styles.text}>{t(`welcome.${step.key}Text`)}</p>
        </section>

        <div className={styles.dots}>
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              className={`${styles.dot} ${i === index ? styles.dotOn : ""}`}
              onClick={() => goTo(i)}
              aria-label={t("welcome.stepOf", { n: i + 1, total: STEPS.length })}
              aria-current={i === index ? "step" : undefined}
            />
          ))}
        </div>

        <Button full icon={last ? "heart" : undefined} onClick={last ? finish : () => goTo(index + 1)}>
          {last ? t("welcome.start") : t("welcome.next")}
          {!last && <Icon name="arrow-right" size={18} />}
        </Button>
      </main>
    </div>
  );
}
