import { useEffect, useRef, useState } from "react";
import styles from "./StatsCounter.module.css";

const STATS = [
  { value: 12000, label: "Members", suffix: "+" },
  { value: 850, label: "Matches made", suffix: "+" },
  { value: 60, label: "Countries", suffix: "+" },
  { value: 98, label: "Satisfaction", suffix: "%" },
];

function useCountUp(target, duration = 1800, active) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [active, target, duration]);
  return count;
}

function StatItem({ value, label, suffix, active }) {
  const count = useCountUp(value, 1800, active);
  return (
    <div className={styles.stat}>
      <span className={styles.value}>{count.toLocaleString()}{suffix}</span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}

export default function StatsCounter() {
  const [active, setActive] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.section} ref={ref}>
      {STATS.map((s) => (
        <StatItem key={s.label} {...s} active={active} />
      ))}
    </section>
  );
}
