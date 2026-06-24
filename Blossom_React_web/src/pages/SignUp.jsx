import { useCallback, useEffect, useState } from "react";
import FormSignUp from "../components/FormSignUp";
import PageNav from "../components/PageNav";
import styles from "./Homepage.module.css";
import StartProfile from "../components/StartProfile";
import MultiImageUpload from "../components/MultiImageUpload";
import Localisation from "../components/Localisation";
import { BASE_URL } from "../api/config";
import { getSignupDraft, clearSignupDraft } from "../api/signupDraft";
function SignUp() {
  const [isregistered, setRegistered] = useState(false);
  const [error, setError] = useState("");
  const [questionEnded, setQuestionEnded] = useState(false);
  const [answer, setAnswer] = useState({});
  const [photos, setPhoto] = useState(false);
  const [located, setlocated] = useState(false);
  const [verify, setVerified] = useState(false);
  const [checkingResume, setCheckingResume] = useState(true);
  const [resumeIndex, setResumeIndex] = useState(0);
  const [resumeAutoStart, setResumeAutoStart] = useState(false);

  const token = sessionStorage.getItem("token");
  const istokenundefined = token === undefined || token === null;

  // A token alone means signup + email/OTP verification already
  // succeeded in a previous visit - figure out how much further they got
  // before resuming instead of restarting at the signup form.
  useEffect(() => {
    async function checkResume() {
      if (istokenundefined) {
        setCheckingResume(false);
        return;
      }
      try {
        const resp = await fetch(`${BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.status === 200) {
          // Profile already exists, so localisation + every question were
          // already answered (CreateProfile only runs after the last
          // question) - only the photo step could still be unfinished.
          clearSignupDraft();
          setRegistered(true);
          setlocated(true);
          setPhoto(true);
        } else {
          const draft = getSignupDraft();
          setRegistered(true);
          if (draft) {
            setAnswer(draft.answer || {});
            setlocated(!!draft.located);
            setResumeIndex(draft.questionIndex || 0);
            setResumeAutoStart(!!draft.started);
          }
        }
      } catch (err) {
        // Network hiccup while checking resume state - fall back to a
        // fresh start rather than getting stuck on a loading screen.
      } finally {
        setCheckingResume(false);
      }
    }
    checkResume();
    // Intentionally only on mount - token/istokenundefined change later
    // (right after FormSignUp succeeds) is the normal fresh-signup path,
    // not a resume.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const CreateLanguage = useCallback(async () => {
    await Promise.all(
      answer?.language_name.map((ln) =>
        fetch(`${BASE_URL}/profile_language`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language_name: ln,
          }),
        }),
      ),
    );
  }, [answer, token]);

  const CreateProfile = useCallback(async () => {
    const resp = await fetch(`${BASE_URL}/profile`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        age: answer?.age,
        bio: answer?.bio,
        drinking: answer?.drinking,
        education: answer?.education,
        exercise_frequency: answer?.exercise_frequency,
        gender: answer?.gender,
        has_children: answer?.has_children,
        has_pets: answer?.has_pets,
        height_cm: answer?.height_cm,
        occupation: answer?.occupation,
        personality_type: answer?.personality_type,
        relationship_goal: answer?.relationship_goal,
        sexual_orientation: answer?.sexual_orientation,
        smoking: answer?.smoking,
        wants_children: answer?.wants_children,
        city: answer?.city,
        country: answer?.country,
      }),
    });
    const data = await resp.json();
    sessionStorage.setItem("profile_id", data.id);
  }, [answer, token]);

  useEffect(() => {
    async function submit() {
      if (questionEnded && !istokenundefined) {
        await CreateProfile();
        await CreateLanguage();
        clearSignupDraft();
        setQuestionEnded(false);
        setPhoto(true);
      }
    }
    submit();
  }, [
    questionEnded,
    setPhoto,
    CreateProfile,
    CreateLanguage,
    istokenundefined,
  ]);

  if (checkingResume) {
    return (
      <div className={styles.head}>
        <PageNav />
        <p style={{ color: "#fff", textAlign: "center", marginTop: "40px" }}>
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className={styles.head}>
      <PageNav />
      {isregistered === false && (
        <FormSignUp
          setRegistered={setRegistered}
          error={error}
          setError={setError}
          setVerified={setVerified}
          verify={verify}
        />
      )}
      {isregistered === true && located === false && (
        <Localisation
          setlocated={setlocated}
          setAnswer={setAnswer}
          answer={answer}
        />
      )}
      {located === true &&
        isregistered === true &&
        questionEnded === false &&
        photos === false && (
          <StartProfile
            answer={answer}
            setAnswer={setAnswer}
            setQuestionEnded={setQuestionEnded}
            initialIndex={resumeIndex}
            autoStart={resumeAutoStart}
          />
        )}
      {photos === true && <MultiImageUpload />}
    </div>
  );
}

export default SignUp;
