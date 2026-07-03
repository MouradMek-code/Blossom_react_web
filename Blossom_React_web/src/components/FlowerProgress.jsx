import styles from "./FlowerProgress.module.css";

const STEPS = ["Name", "Email", "Password", "Phone", "Birthday"];

export default function FlowerProgress({ filled, verified }) {
  const total = STEPS.length;
  const bloomed = verified ? total : filled;
  const allDone = bloomed >= total;

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.flowerWrap} ${allDone ? styles.glow : ""}`}>
        <svg viewBox="0 0 120 120" width="110" height="110" className={styles.svg}>
          {/* Petals — 5 at 72° intervals */}
          {STEPS.map((_, i) => {
            const angle = (i * 72 - 90) * (Math.PI / 180);
            const cx = 60 + Math.cos(angle) * 24;
            const cy = 60 + Math.sin(angle) * 24;
            const rotation = i * 72;
            const active = i < bloomed;
            return (
              <ellipse
                key={i}
                cx={cx}
                cy={cy}
                rx="11"
                ry="17"
                transform={`rotate(${rotation}, ${cx}, ${cy})`}
                className={`${styles.petal} ${active ? styles.petalActive : ""}`}
                style={{ transitionDelay: `${i * 0.08}s` }}
              />
            );
          })}
          {/* Center circle */}
          <circle
            cx="60"
            cy="60"
            r="13"
            className={`${styles.center} ${allDone ? styles.centerActive : ""}`}
          />
          {/* Center emoji text */}
          <text
            x="60"
            y="65"
            textAnchor="middle"
            fontSize="14"
            className={styles.centerText}
          >
            {verified ? "🌸" : bloomed === 0 ? "🌱" : bloomed < total ? "🌷" : "🌸"}
          </text>
        </svg>
      </div>

      {/* Step dots */}
      <div className={styles.dots}>
        {STEPS.map((label, i) => (
          <div key={i} className={styles.dotWrap}>
            <div className={`${styles.dot} ${i < bloomed ? styles.dotActive : ""}`} />
            <span className={`${styles.dotLabel} ${i < bloomed ? styles.dotLabelActive : ""}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <p className={styles.hint}>
        {verified
          ? "Almost there — check your messages 📬"
          : bloomed === 0
          ? "Let's get you started 🌱"
          : bloomed < total
          ? `${total - bloomed} step${total - bloomed > 1 ? "s" : ""} left to bloom 🌷`
          : "Ready to blossom! 🌸"}
      </p>
    </div>
  );
}
