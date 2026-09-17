import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  GEONAMES_CREDIT,
  findCountryByName,
  flagEmoji,
  fold,
  loadCountries,
  searchCities,
  tidyCity,
} from "../api/geo";
import styles from "./LocationPicker.module.css";

// Country + city chooser, used at sign-up and on the profile page, so people
// say where they live instead of sharing their GPS position.
// `country` and `city` are the stored names; onChange receives both.
export default function LocationPicker({ country, city, onChange }) {
  const { t } = useTranslation();
  const listId = useId();
  const [countries, setCountries] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const fetchCountries = useCallback(() => {
    setLoadError(false);
    loadCountries()
      .then(setCountries)
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const selected = useMemo(() => findCountryByName(countries, country), [countries, country]);

  // Suggestions for what's typed - debounced, with stale requests cancelled.
  useEffect(() => {
    if (!selected || !open) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(
      () => {
        searchCities(selected.code, city, controller.signal)
          .then((names) => {
            setSuggestions(names);
            setActive(-1);
          })
          .catch(() => {});
      },
      city ? 200 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [selected, city, open]);

  const typed = (city || "").trim();
  const exact = suggestions.find((name) => fold(name) === fold(typed));
  // A town that isn't in the list can still be used as typed - offered last,
  // so a half-typed name isn't the first thing under the cursor.
  const options = [
    ...suggestions.map((name) => ({ key: name, label: `📍 ${name}`, value: name })),
    ...(typed && !exact
      ? [{ key: "__typed", label: `✏️ ${t("location.useTyped", { name: tidyCity(typed) })}`, value: tidyCity(typed) }]
      : []),
  ];

  function pickCountry(e) {
    const next = (countries || []).find((c) => c.code === e.target.value);
    setSuggestions([]);
    onChange({ country: next ? next.name : "", city: "" });
  }

  function pickCity(name) {
    setOpen(false);
    onChange({ country, city: name });
  }

  function onCityBlur() {
    setOpen(false);
    // Typed a listed city without clicking it? Store its proper spelling.
    if (exact && exact !== city) onChange({ country, city: exact });
  }

  function onCityKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open && options[active]) {
      e.preventDefault();
      pickCity(options[active].value);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className={styles.picker}>
      <div className={styles.field}>
        <span className={styles.label}>{t("location.country")}</span>
        {loadError ? (
          <p className={styles.error}>
            {t("location.loadError")}{" "}
            <button type="button" className={styles.retry} onClick={fetchCountries}>
              {t("location.retry")}
            </button>
          </p>
        ) : (
          <select
            className={styles.control}
            aria-label={t("location.country")}
            value={selected ? selected.code : ""}
            onChange={pickCountry}
            disabled={!countries}
          >
            <option value="" disabled>
              {countries ? t("location.chooseCountry") : t("location.loading")}
            </option>
            {(countries || []).map((c) => (
              <option key={c.code} value={c.code}>
                {flagEmoji(c.code)} {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className={styles.field}>
        <span className={styles.label}>{t("location.city")}</span>
        <div className={styles.cityWrap}>
          <input
            className={styles.control}
            aria-label={t("location.city")}
            role="combobox"
            aria-controls={listId}
            aria-expanded={open && options.length > 0}
            aria-autocomplete="list"
            autoComplete="off"
            maxLength={50}
            disabled={!selected}
            placeholder={selected ? t("location.searchCity") : t("location.countryFirst")}
            value={city || ""}
            onChange={(e) => {
              setOpen(true);
              onChange({ country, city: e.target.value });
            }}
            onFocus={() => setOpen(true)}
            onBlur={onCityBlur}
            onKeyDown={onCityKeyDown}
          />
          {open && selected && options.length > 0 && (
            <ul id={listId} className={styles.menu} role="listbox">
              {options.map((option, i) => (
                <li key={option.key} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    className={`${styles.option} ${i === active ? styles.optionActive : ""}`}
                    // Keep focus in the input so the click lands before blur.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickCity(option.value)}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className={styles.hint}>{t("location.notListed")}</p>
      </div>

      <p className={styles.credit}>
        <a href="https://www.geonames.org" target="_blank" rel="noopener noreferrer">
          {GEONAMES_CREDIT}
        </a>
      </p>
    </div>
  );
}
