import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./Map.module.css";

function Map() {
  const [searchparams, setsearchparams] = useSearchParams();
  const navigate = useNavigate();
  const lat = searchparams.get("lat");
  const lng = searchparams.get("ling");
  return (
    <div className={styles.map} onClick={navigate("cities")}>
      <h1>Map</h1>
      <h1>
        Position : {lat} {lng}
      </h1>
    </div>
  );
}

export default Map;
