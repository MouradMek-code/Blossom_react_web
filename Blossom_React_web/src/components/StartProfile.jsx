import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./StartProfile.module.css";
import { saveSignupDraft } from "../api/signupDraft";
import questions from "../data/questions.json";

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

  function Handleclicked(question, values) {
    setClicked(true);
    if (question.field === "language_name" && "language_name" in answer) {
      const { language_name } = answer;
      setAnswer((c) => ({
        ...c,
        [question.field]: [...language_name, ...values],
      }));
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
        <StartQuizProgressBar
          indiceQuestion={indiceQuestion}
          length={questions.length}
        />
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

function StartQuizProgressBar({ indiceQuestion, point, length }) {
  return (
    <div className={styles.progressbar}>
      <progress
        className={styles.progress}
        max={length}
        value={indiceQuestion + 1}
      />

      <div className={styles.spanning}>
        <span>{`${indiceQuestion + 1}/${length}`} Question</span>
      </div>
    </div>
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
  const isMobile = useIsMobile();
  const nextButton = (
    <button className={styles.end_button} onClick={onclick}>
      NEXT
    </button>
  );

  return (
    <>
      <div className={styles.questions}>
        <h2>{question.question}</h2>
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
function Question({ question, Handleclicked, answer, setAnswer, setClicked }) {
  // Languages (multi-select cards)
  if (question.field === "language_name") {
    return (
      <div className={styles.optionGrid}>
        {question.options.map((lang) => {
          const selected = answer.language_name?.includes(lang) || false;

          return (
            <button
              type="button"
              key={lang}
              className={`${styles.optionCard} ${
                selected ? styles.selected : ""
              }`}
              onClick={() => {
                const current = answer.language_name || [];

                const updated = selected
                  ? current.filter((item) => item !== lang)
                  : [...current, lang];

                setAnswer((prev) => ({
                  ...prev,
                  language_name: updated,
                }));

                setClicked(updated.length > 0);
              }}
            >
              {lang}
            </button>
          );
        })}
      </div>
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

export default StartProfile;
