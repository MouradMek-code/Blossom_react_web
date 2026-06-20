import { useState } from "react";
import "./Localisation.css";

function Localisation({ setlocated, setAnswer, answer }) {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [locationData, setLocationData] = useState(null);
  const [error, setError] = useState("");

  const handleGetPosition = () => {
    setError("");
    setStatus("loading");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
          );

          const data = await res.json();

          setLocationData({
            city:
              data.address?.city || data.address?.town || data.address?.village,
            country: data.address?.country,
          });

          const resp = answer;
          resp.city =
            data.address?.city || data.address?.town || data.address?.village;
          resp.country = data.address?.country;
          setAnswer(resp);
          setStatus("success");
        } catch {
          setError("Failed to fetch location.");
          setStatus("error");
        }
      },
      () => {
        setError("Location permission denied.");
        setStatus("error");
      },
    );
  };

  return (
    <div className="location-wrapper">
      <div className="location-card">
        <h2>Enable Location</h2>

        <p className="subtitle">
          We use your location to improve your experience.
        </p>

        {status !== "success" && (
          <button onClick={handleGetPosition} disabled={status === "loading"}>
            {status === "loading" ? "Detecting..." : "Allow Location"}
          </button>
        )}

        {error && <p className="error">{error}</p>}

        {locationData && (
          <div className="result">
            <p>
              📍 {locationData.city}, {locationData.country}
            </p>

            <button onClick={() => setlocated(true)}>Continue</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Localisation;
