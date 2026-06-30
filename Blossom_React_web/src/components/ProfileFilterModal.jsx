import { useMemo } from "react";
import styles from "./ProfileFilterModal.module.css";
import questionsData from "../data/questions.json";
import filterMeta from "../data/filterMeta.json";

const FILTERABLE = questionsData
  .filter((q) => filterMeta[q.field])
  .map((q) => ({ ...q, question: filterMeta[q.field].question, group: filterMeta[q.field].section }));

const SECTION_ORDER = [
  "Location",
  "Basic Info",
  "Lifestyle",
  "Relationship",
  "Dating Preferences",
  "Personality",
  "Languages",
  "Education",
];

export default function ProfileFilterModal({ open, filters, onChange, onApply, onClose, profiles = [] }) {
  const locationSections = useMemo(() => {
    const countries = [...new Set(profiles.map((p) => p.country).filter(Boolean))].sort();
    const cities = [...new Set(profiles.map((p) => p.city).filter(Boolean))].sort();
    return [
      { field: "country", question: "Country", options: countries, group: "Location" },
      { field: "city", question: "City", options: cities, group: "Location" },
    ].filter((section) => section.options.length > 0);
  }, [profiles]);

  if (!open) return null;

  function toggleSingle(field, option) {
    onChange((prev) => {
      const next = { ...prev };
      if (next[field] === option) {
        delete next[field];
      } else {
        next[field] = option;
      }
      return next;
    });
  }

  function toggleMultiple(field, option) {
    onChange((prev) => {
      const current = prev[field] || [];
      const updated = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      const next = { ...prev };
      if (updated.length === 0) {
        delete next[field];
      } else {
        next[field] = updated;
      }
      return next;
    });
  }

  const activeCount = Object.keys(filters).length;
  const allSections = [...locationSections, ...FILTERABLE];
  const groupedSections = SECTION_ORDER.map((group) => ({
    group,
    items: allSections.filter((s) => s.group === group),
  })).filter((g) => g.items.length > 0);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Filters</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.scroll}>
          {groupedSections.map(({ group, items }) => (
            <div key={group} className={styles.group}>
              <h2 className={styles.groupTitle}>{group}</h2>
              {items.map((q) => (
                <div key={q.field} className={styles.section}>
                  <h3>{q.question}</h3>
                  <div className={styles.optionGrid}>
                    {q.options.map((option) => {
                      const selected = q.multiple
                        ? (filters[q.field] || []).includes(option)
                        : filters[q.field] === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          className={`${styles.optionChip} ${selected ? styles.optionChipSelected : ""}`}
                          onClick={() =>
                            q.multiple
                              ? toggleMultiple(q.field, option)
                              : toggleSingle(q.field, option)
                          }
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <button className={styles.resetButton} onClick={() => onChange({})}>
            Reset {activeCount > 0 ? `(${activeCount})` : ""}
          </button>
          <button className={styles.applyButton} onClick={onApply}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
