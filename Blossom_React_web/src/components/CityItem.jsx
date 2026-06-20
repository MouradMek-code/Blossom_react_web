import { Link } from "react-router-dom";
import styles from "./CityItem.module.css";

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function CityItem({ city }) {
  const { cityName, date, id, position } = city;
  return (
    <div>
      <Link
        className={styles.city}
        to={`${id}?lat=${position.lat}&lng=${position.lng}`}
      >
        <span className={styles.name}>{cityName}</span>
        <div className={styles.date}>
          <span className={styles.date}>{formatDateTime(date)}</span>
          <button>✕</button>
        </div>
      </Link>
    </div>
  );
}

export default CityItem;
