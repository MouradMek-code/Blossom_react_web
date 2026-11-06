import { Link } from "react-router-dom";
import Icon from "./Icon";
import styles from "./ui.module.css";

// Blossom's shared building blocks for the website (the app has the same set
// in src/ui): every page uses these, so the site looks the same everywhere.
export { Icon };

const VARIANT_CLASS = {
  primary: styles.primary,
  secondary: styles.secondary,
  quiet: styles.quiet,
  danger: styles.danger,
  dangerSolid: styles.dangerSolid,
  ghost: styles.ghost,
};

// One button: primary (filled rose), secondary (rose outline), quiet (grey
// outline), danger / dangerSolid, ghost. `to` makes it a link inside the
// site, `href` a normal link. At least 44 px tall.
export function Button({
  children,
  variant = "primary",
  icon,
  loading = false,
  small = false,
  full = false,
  to,
  href,
  className = "",
  type = "button",
  ...rest
}) {
  const classes = [styles.button, VARIANT_CLASS[variant] || styles.primary, small && styles.small, full && styles.full, className]
    .filter(Boolean)
    .join(" ");
  const body = (
    <>
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : icon ? <Icon name={icon} size={small ? 15 : 18} /> : null}
      {children}
    </>
  );
  if (to) return <Link to={to} className={classes} {...rest}>{body}</Link>;
  if (href) return <a href={href} className={classes} {...rest}>{body}</a>;
  return (
    <button type={type} className={classes} {...rest} disabled={loading || rest.disabled} aria-busy={loading || undefined}>
      {body}
    </button>
  );
}

export function Card({ children, tone, className = "", as: Tag = "section", ...rest }) {
  const toneClass = tone === "danger" ? styles.cardDanger : tone === "info" ? styles.cardInfo : "";
  return <Tag className={[styles.card, toneClass, className].filter(Boolean).join(" ")} {...rest}>{children}</Tag>;
}

// A rounded pill: a choice (onClick + selected) or a plain label.
export function Chip({ label, icon, selected = false, tone, onClick, className = "" }) {
  const onClass = selected ? (tone === "danger" ? styles.chipOnDanger : styles.chipOn) : "";
  const classes = [styles.chip, onClass, className].filter(Boolean).join(" ");
  const body = (
    <>
      {icon ? <Icon name={icon} size={15} /> : null}
      {label}
    </>
  );
  if (!onClick) return <span className={classes}>{body}</span>;
  return (
    <button type="button" role="radio" aria-checked={selected} className={classes} onClick={onClick}>
      {body}
    </button>
  );
}

// What a list shows when it's empty: icon, title, a line of help, next step.
export function EmptyState({ icon = "search", title, text, action }) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyCircle}>
        <Icon name={icon} size={34} />
      </span>
      {title && <h2 className={styles.emptyTitle}>{title}</h2>}
      {text && <p className={styles.emptyText}>{text}</p>}
      {action && <div className={styles.emptyAction}>{action}</div>}
    </div>
  );
}

// Grey shimmering shapes where the content will be, instead of a spinner.
export function Skeleton({ width = "100%", height = 14, round = 8, style }) {
  return <span className={styles.skeleton} style={{ display: "block", width, height, borderRadius: round, ...style }} />;
}

export function SkeletonTiles({ count = 6, imageHeight = 220 }) {
  return (
    <div className={styles.skeletonGrid} aria-label="Loading" role="status">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.skeletonTile}>
          <Skeleton height={imageHeight} round={18} />
          <Skeleton width="65%" height={16} />
          <Skeleton width="40%" height={12} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 6 }) {
  return (
    <div className={styles.skeletonRows} aria-label="Loading" role="status">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.skeletonRow}>
          <Skeleton width={54} height={54} round={27} />
          <div className={styles.skeletonRowText}>
            <Skeleton width={i % 2 ? "45%" : "60%"} height={15} />
            <Skeleton width={i % 2 ? "75%" : "55%"} height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}
