import styles from "./ProfileFlowerProgress.module.css";

const TOTAL_PETALS = 8;

export default function ProfileFlowerProgress({ current, total }) {
  const pct = Math.min(current / total, 1);
  const bloomedPetals = Math.round(pct * TOTAL_PETALS);
  const isDone = current >= total;

  // Ring arc (circumference of r=68 circle)
  const r = 68;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <div className={styles.wrap}>
      <div className={`${styles.flowerBox} ${isDone ? styles.glow : ""}`}>
        <svg viewBox="0 0 180 180" width="150" height="150" className={styles.svg}>
          <defs>
            {/* Active petal gradient */}
            <radialGradient id="petalGrad" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ff9fc4" />
              <stop offset="100%" stopColor="#d6336c" />
            </radialGradient>
            {/* Inactive petal */}
            <radialGradient id="petalInactive" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#f9e8f0" />
              <stop offset="100%" stopColor="#edd5e4" />
            </radialGradient>
            {/* Center gradient */}
            <radialGradient id="centerGrad" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fff" />
              <stop offset="100%" stopColor="#fde4ef" />
            </radialGradient>
          </defs>

          {/* Outer progress ring track */}
          <circle
            cx="90" cy="90" r={r}
            fill="none"
            stroke="#f0dce8"
            strokeWidth="4"
          />
          {/* Outer progress ring fill */}
          <circle
            cx="90" cy="90" r={r}
            fill="none"
            stroke="url(#petalGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            transform="rotate(-90 90 90)"
            className={styles.ring}
          />

          {/* Petals — 8 at 45° intervals */}
          {Array.from({ length: TOTAL_PETALS }).map((_, i) => {
            const angleDeg = i * 45 - 90;
            const angleRad = angleDeg * (Math.PI / 180);
            const dist = 30;
            const cx = 90 + Math.cos(angleRad) * dist;
            const cy = 90 + Math.sin(angleRad) * dist;
            const active = i < bloomedPetals;
            return (
              <ellipse
                key={i}
                cx={cx}
                cy={cy}
                rx="12"
                ry="21"
                transform={`rotate(${angleDeg + 90}, ${cx}, ${cy})`}
                fill={active ? "url(#petalGrad)" : "url(#petalInactive)"}
                className={`${styles.petal} ${active ? styles.petalActive : ""}`}
                style={{ transitionDelay: `${i * 0.06}s` }}
              />
            );
          })}

          {/* Center circle */}
          <circle
            cx="90" cy="90" r="22"
            fill="url(#centerGrad)"
            stroke={isDone ? "#d6336c" : "#f0dce8"}
            strokeWidth="2"
            className={styles.center}
          />

          {/* Center text */}
          {isDone ? (
            <text x="90" y="95" textAnchor="middle" fontSize="18" className={styles.centerEmoji}>🌸</text>
          ) : (
            <>
              <text x="90" y="88" textAnchor="middle" fontSize="13" fontWeight="700" fill="#d6336c" className={styles.centerNum}>{current}</text>
              <line x1="78" y1="92" x2="102" y2="92" stroke="#e8c8d8" strokeWidth="1.5" />
              <text x="90" y="103" textAnchor="middle" fontSize="11" fill="#c8a0b8" className={styles.centerDenom}>{total}</text>
            </>
          )}
        </svg>
      </div>

      <p className={styles.label}>
        {isDone
          ? "Your profile is ready to bloom 🌸"
          : current === 0
          ? "Answer questions to grow your flower 🌱"
          : `${total - current} question${total - current > 1 ? "s" : ""} left 🌷`}
      </p>
    </div>
  );
}
