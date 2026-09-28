import { NavLink } from "react-router-dom";
import styles from "./Logo.module.css";

// The Blossom flower: five petals around a heart. Drawn in code so it stays
// sharp at any size and always matches the site's rose.
export function BlossomMark({ size = 32, petal = "var(--primary)", heart = "#fff", className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
    >
      <g fill={petal}>
        {[0, 72, 144, 216, 288].map((angle) => (
          <ellipse key={angle} cx="20" cy="10.5" rx="6.8" ry="9" transform={`rotate(${angle} 20 20)`} />
        ))}
      </g>
      <circle cx="20" cy="20" r="7.2" fill={petal} />
      <path
        d="M20 25.2c-3.9-2.6-6-4.8-6-7.2a3 3 0 0 1 6-1.1 3 3 0 0 1 6 1.1c0 2.4-2.1 4.6-6 7.2z"
        fill={heart}
      />
    </svg>
  );
}

// Mark + "Blossom". `light` is for dark backgrounds (the photo hero).
function Logo({ light = false, compact = false }) {
  return (
    <NavLink to="/" className={`${styles.logo} ${light ? styles.light : ""}`} aria-label="Blossom - home">
      <BlossomMark
        size={38}
        className={styles.mark}
        petal={light ? "#fff" : "var(--primary)"}
        heart={light ? "var(--primary)" : "#fff"}
      />
      {!compact && <span className={styles.wordmark}>Blossom</span>}
    </NavLink>
  );
}

export default Logo;
