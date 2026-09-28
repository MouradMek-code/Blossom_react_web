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

function StartProfile({ setQuestionEnded, answer, setAnswer, initialIndex = 0, autoStart = false }) {
  const [started, setStart] = useState(autoStart);
  const [indiceQuestion, setIndiceQuestion] = useState(initialIndex);
  const [clicked, setClicked] = useState(false);
  // Someone here only for language exchange skips the dating questions.
  const questions = useMemo(
    () => questionsFor(allQuestions, answer.connection_type),
    [answer.connection_type],
  );

  function Handleclicked(question, values) {
    setClicked(true);
    if ((question.field === "language_name" || question.field === "learning_language_name") && question.field in answer) {
      const prev = answer[question.field];
      setAnswer((c) => ({ ...c, [question.field]: [...prev, ...values] }));
      return;
    }
    setAnswer((c) => ({ ...c, [question.field]: values }));
  }
  function HandleLetStartButton() {
    setStart((s) => !s);
    setIndiceQuestion(0);
    setClicked(false);
    saveSignupDraft({ started: true, questionIndex: 0, answer });
  }
  function Handleindicequestion(i) {
    setClicked(false);
    if (indiceQuestion >= questions.length - 1) {
      setQuestionEnded((c) => !c);
    }
    const nextIndex = indiceQuestion + 1;
    setIndiceQuestion(nextIndex);
    saveSignupDraft({ started: true, questionIndex: nextIndex, answer });
  }
  return (
    <div className={styles.container}>
      <header>
        <span className={styles.title}>Create Your Profile Here</span>
      </header>
      {started ? (
        <ProfileFlowerProgress current={indiceQuestion + 1} total={questions.length} />
      ) : (
        <ButtonLetsStart
          length={questions.length}
          onclick={HandleLetStartButton}
        />
      )}
      {started && indiceQuestion < questions.length && (
        <QuestionOption
          question={questions[indiceQuestion]}
          onclick={Handleindicequestion}
          Handleclicked={Handleclicked}
          clicked={clicked}
          setAnswer={setAnswer}
          answer={answer}
          setClicked={setClicked}
        />
      )}
    </div>
  );
}
function ButtonLetsStart({ length, onclick }) {
  return (
    <>
      <div className={styles.let_start_btn}>
        <p>Create Your Profile</p>
        <h3>{length} questions to create your profile</h3>

        <button onClick={onclick}>let'start</button>
      </div>
    </>
  );
}


function QuestionOption({
  question,
  onclick,
  Handleclicked,
  clicked,
  setAnswer,
  answer,
  setClicked,
}) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const nextButton = (
    <button className={styles.end_button} onClick={onclick}>
      NEXT
    </button>
  );
  const title = question.field === "connection_type" ? t("connection.question") : question.question;

  return (
    <>
      <div className={styles.questions}>
        <h2>{title}</h2>
        <div className={styles.button_question}>
          <Question
            question={question}
            Handleclicked={Handleclicked}
            clicked={clicked}
            setAnswer={setAnswer}
            answer={answer}
            setClicked={setClicked}
          />
        </div>
        {clicked && !isMobile && nextButton}
      </div>
      {clicked && isMobile && createPortal(nextButton, document.body)}
    </>
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
