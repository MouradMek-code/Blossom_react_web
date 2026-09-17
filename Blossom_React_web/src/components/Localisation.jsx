import { useState } from "react";
import { useTranslation } from "react-i18next";
import "./Localisation.css";
import LocationPicker from "./LocationPicker";
import { tidyCity } from "../api/geo";
import { saveSignupDraft } from "../api/signupDraft";

// Sign-up step: where do you live? Chosen from lists rather than detected by
// GPS - some people don't want to share their position, and with GPS there
// was no way past this step for anyone who said no.
function Localisation({ setlocated, setAnswer, answer }) {
  const { t } = useTranslation();
  const [location, setLocation] = useState({
    country: answer?.country || "",
    city: answer?.city || "",
  });

  const ready = Boolean(location.country && location.city.trim());

  function next() {
    const updated = { ...answer, country: location.country, city: tidyCity(location.city) };
    setAnswer(updated);
    saveSignupDraft({ located: true, answer: updated });
    setlocated(true);
  }

  return (
    <div className="location-wrapper">
      <div className="location-card">
        <div className="location-icon">📍</div>
        <h2>{t("location.title")}</h2>
        <p className="subtitle">{t("location.subtitle")}</p>

        <LocationPicker country={location.country} city={location.city} onChange={setLocation} />

        <button className="location-continue" onClick={next} disabled={!ready}>
          {t("location.continue")}
        </button>
      </div>
    </div>
  );
}

export default Localisation;
