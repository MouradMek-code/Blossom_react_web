import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import styles from "./StartProfile.module.css";
import { saveSignupDraft } from "../api/signupDraft";
import allQuestions from "../data/questions.json";
import ProfileFlowerProgress from "./ProfileFlowerProgress";
import { CONNECTION_EMOJI, CONNECTION_TYPES, questionsFor } from "../api/connection";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth <= breakpoint,
  );
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= breakpoint);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);
  return isMobile;
}

// The questions in a few short steps (2-4 each) instead of one per screen -
// the same steps as the app. Only what Browse needs is required.
export const SIGNUP_STEPS = [
  { key: "intent", fields: ["connection_type"], required: ["connection_type"] },
  { key: "you", fields: ["gender", "sexual_orientation", "age"], required: ["gender", "sexual_orientation", "age"] },
  { key: "looking", fields: ["relationship_goal", "first_date_preference"], required: ["relationship_goal"] },
  { key: "story", fields: ["bio", "occupation"], required: [] },
  { key: "languages", fields: ["language_name", "learning_language_name"], required: ["language_name"] },
  { key: "basics", fields: ["height_cm", "education", "personality_type"], required: [] },
  { key: "lifestyle", fields: ["smoking", "drinking", "exercise_frequency", "has_pets"], required: [] },
  { key: "personal", fields: ["has_children", "wants_children", "past_relationships_count", "last_breakup_reason"], required: [] },
];

function filled(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return value != null;
}

// Each question reports "answered" through setClicked; a step works it out
// from the answers instead.
const noop = () => {};

function StartProfile({ setQuestionEnded, answer, setAnswer, initialIndex = 0, autoStart = false }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [started, setStart] = useState(autoStart);
  const [step, setStep] = useState(initialIndex);
  // Someone here only for language exchange skips the dating questions.
  const questions = useMemo(
    () => questionsFor(allQuestions, answer.connection_type),
    [answer.connection_type],
  );
  const steps = useMemo(
    () =>
      SIGNUP_STEPS.map((s) => ({
        ...s,
        questions: s.fields.map((f) => questions.find((q) => q.field === f)).filter(Boolean),
      })).filter((s) => s.questions.length > 0),
    [questions],
  );
  const index = Math.min(step, steps.length - 1);
  const current = steps[index];
  const ready = current.required.every((f) => !current.questions.some((q) => q.field === f) || filled(answer[f]));
  const last = index >= steps.length - 1;

  function Handleclicked(question, values) {
    setAnswer((c) => ({ ...c, [question.field]: values }));
  }

  function begin() {
    setStart(true);
    setStep(0);
    saveSignupDraft({ started: true, questionIndex: 0, answer });
  }

  function next() {
    if (last) {
      setQuestionEnded((c) => !c);
      return;
    }
    const nextStep = index + 1;
    setStep(nextStep);
    saveSignupDraft({ started: true, questionIndex: nextStep, answer });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const nextButton = (
    <button className={styles.end_button} onClick={next}>
      {last ? t("signupSteps.finish") : t("signupSteps.next")}
    </button>
  );

  if (!started) return <ButtonLetsStart count={steps.length} onclick={begin} />;

  return (
    <div className={styles.container}>
      <ProfileFlowerProgress current={index + 1} total={steps.length} />
      <p className={styles.stepLabel}>{t("signupSteps.step", { n: index + 1, total: steps.length })}</p>
      <h1 className={styles.stepTitle}>{t(`signupSteps.${current.key}`)}</h1>
      {current.required.length === 0 && <p className={styles.optionalNote}>{t("signupSteps.optionalStep")}</p>}
      {current.questions.map((question) => (
        <div key={question.field} className={styles.questions}>
          <h2>
            {question.field === "connection_type" ? t("connection.question") : question.question}
            {!current.required.includes(question.field) && (
              <span className={styles.optionalTag}>{t("signupSteps.optional")}</span>
            )}
          </h2>
          <div className={styles.button_question}>
            <Question
              question={question}
              Handleclicked={Handleclicked}
              setAnswer={setAnswer}
              answer={answer}
              setClicked={noop}
            />
          </div>
        </div>
      ))}
      {ready && !isMobile && nextButton}
      {ready && isMobile && createPortal(nextButton, document.body)}
    </div>
  );
}

function ButtonLetsStart({ count, onclick }) {
  const { t } = useTranslation();
  return (
    <div className={styles.container}>
      <div className={styles.let_start_btn}>
        <p>{t("signupSteps.startTitle")}</p>
        <h3>{t("signupSteps.startText", { count })}</h3>
        <button onClick={onclick}>{t("signupSteps.startButton")}</button>
      </div>
    </div>
  );
}

// "What brings you to Blossom?": dating, language exchange or both. "Both" is
// chosen already, so Next works straight away.
function ConnectionQuestion({ answer, setAnswer, setClicked }) {
  const { t } = useTranslation();
  const selected = answer.connection_type || "both";

  function choose(type) {
    setAnswer((prev) => {
      const next = { ...prev, connection_type: type };
      // Language exchange is about friendship; its relationship question is
      // skipped. Changing their mind brings that question back.
      if (type === "language") next.relationship_goal = "Friendship";
      else if (prev.connection_type === "language") delete next.relationship_goal;
      return next;
    });
    setClicked(true);
  }

  useEffect(() => {
    if (answer.connection_type) setClicked(true);
    else choose("both");
    // Only on first showing: pick the default once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.connectionList}>
      <p className={styles.connectionHint}>{t("connection.hint")}</p>
      {CONNECTION_TYPES.map((type) => {
        const isSelected = selected === type;
        return (
          <button
            type="button"
            key={type}
            role="radio"
            aria-checked={isSelected}
            className={`${styles.connectionCard} ${isSelected ? styles.connectionCardSelected : ""}`}
            onClick={() => choose(type)}
          >
            <span className={styles.connectionEmoji} aria-hidden="true">
              {CONNECTION_EMOJI[type]}
            </span>
            <span className={styles.connectionText}>
              <span className={styles.connectionTitle}>
                {t(`connection.${type}`)}
                {type === "both" && (
                  <span className={styles.connectionDefault}>{t("connection.defaultTag")}</span>
                )}
              </span>
              <span className={styles.connectionDesc}>{t(`connection.${type}Desc`)}</span>
            </span>
            <span className={`${styles.radio} ${isSelected ? styles.radioSelected : ""}`} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

function Question({ question, Handleclicked, answer, setAnswer, setClicked }) {
  if (question.field === "connection_type") {
    return <ConnectionQuestion answer={answer} setAnswer={setAnswer} setClicked={setClicked} />;
  }

  // Multi-select personality
  if (question.field === "personality_type") {
    const selected = answer.personality_type ? answer.personality_type.split(", ") : [];
    function toggle(option) {
      const updated = selected.includes(option)
        ? selected.filter((x) => x !== option)
        : [...selected, option];
      setAnswer((prev) => ({ ...prev, personality_type: updated.join(", ") }));
      setClicked(updated.length > 0);
    }
    return (
      <div className={styles.optionGrid}>
        {question.options.map((option) => (
          <button
            type="button"
            key={option}
            className={`${styles.optionCard} ${selected.includes(option) ? styles.selected : ""}`}
            onClick={() => toggle(option)}
          >
            {option}
          </button>
        ))}
      </div>
    );
  }

  // Multi-select language pickers (spoken + learning)
  if (question.field === "language_name" || question.field === "learning_language_name") {
    return (
      <LanguagePicker
        field={question.field}
        options={question.options}
        answer={answer}
        setAnswer={setAnswer}
        setClicked={setClicked}
        styles={styles}
      />
    );
  }

  // Height picker — single select with search
  if (question.field === "height_cm") {
    return (
      <HeightPicker
        field={question.field}
        options={question.options}
        answer={answer}
        setAnswer={setAnswer}
        setClicked={setClicked}
        Handleclicked={Handleclicked}
        question={question}
        styles={styles}
      />
    );
  }

  // Regular options (single select cards)
  if (question.options) {
    return (
      <div className={styles.optionGrid}>
        {question.options.map((option) => (
          <button
            type="button"
            key={option}
            className={`${styles.optionCard} ${
              answer[question.field] === option ? styles.selected : ""
            }`}
            onClick={() => Handleclicked(question, option)}
          >
            {option}
          </button>
        ))}
      </div>
    );
  }

  // Bio
  if (question.field === "bio") {
    return (
      <textarea
        className={styles.bio}
        placeholder="Tell us about yourself..."
        value={answer.bio || ""}
        onChange={(e) => {
          setAnswer((prev) => ({
            ...prev,
            bio: e.target.value,
          }));
          setClicked(e.target.value.trim().length > 0);
        }}
      />
    );
  }

  // Occupation
  if (question.field === "occupation") {
    return (
      <input
        className={styles.textInput}
        type="text"
        placeholder="What is your occupation?"
        value={answer.occupation || ""}
        onChange={(e) => {
          setAnswer((prev) => ({
            ...prev,
            occupation: e.target.value,
          }));
          setClicked(e.target.value.trim().length > 0);
        }}
      />
    );
  }

  return null;
}

function HeightPicker({ field, options, answer, setAnswer, setClicked, Handleclicked, question, styles }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const selected = answer[field] || null;
  const filtered = search.trim()
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  function pick(opt) {
    setAnswer((prev) => ({ ...prev, [field]: opt }));
    setClicked(true);
    setOpen(false);
    setSearch("");
  }

  return (
    <div className={styles.langPickerWrap}>
      {selected && (
        <div className={styles.langSelected}>
          <button type="button" className={styles.langChip} onClick={() => { setAnswer((prev) => { const n = { ...prev }; delete n[field]; return n; }); setClicked(false); }}>
            📏 {selected} ✕
          </button>
        </div>
      )}
      <button type="button" className={styles.langTrigger} onClick={() => setOpen((o) => !o)}>
        <span>{selected ? `📏 ${selected}` : "📏 Select your height…"}</span>
        <span className={styles.langTriggerArrow}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className={styles.langDropdown}>
          <input
            className={styles.langSearch}
            type="text"
            placeholder="🔍 e.g. 170 cm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className={styles.langList}>
            {filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`${styles.langOption} ${selected === opt ? styles.langOptionSelected : ""}`}
                onClick={() => pick(opt)}
              >
                {selected === opt ? "✓ " : ""}{opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LanguagePicker({ field, options, answer, setAnswer, setClicked, styles }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const selected = answer[field] || [];
  const filtered = search.trim()
    ? options.filter((l) => l.toLowerCase().includes(search.toLowerCase()))
    : options;

  function toggle(lang) {
    const updated = selected.includes(lang)
      ? selected.filter((x) => x !== lang)
      : [...selected, lang];
    setAnswer((prev) => ({ ...prev, [field]: updated }));
    setClicked(updated.length > 0);
  }

  return (
    <div className={styles.langPickerWrap}>
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className={styles.langSelected}>
          {selected.map((lang) => (
            <button key={lang} type="button" className={styles.langChip} onClick={() => toggle(lang)}>
              {lang} ✕
            </button>
          ))}
        </div>
      )}

      {/* Trigger */}
      <button
        type="button"
        className={styles.langTrigger}
        onClick={() => setOpen((o) => !o)}
      >
        <span>
          {selected.length === 0
            ? "🌍 Select languages…"
            : `🌍 ${selected.length} selected — tap to change`}
        </span>
        <span className={styles.langTriggerArrow}>{open ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className={styles.langDropdown}>
          <input
            className={styles.langSearch}
            type="text"
            placeholder="🔍 Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className={styles.langList}>
            {filtered.map((lang) => (
              <button
                key={lang}
                type="button"
                className={`${styles.langOption} ${selected.includes(lang) ? styles.langOptionSelected : ""}`}
                onClick={() => toggle(lang)}
              >
                {selected.includes(lang) ? "✓ " : ""}{lang}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default StartProfile;

// One question on its own (the admin's "profile for a friend" form shows them all).
export { Question as ProfileQuestion };
