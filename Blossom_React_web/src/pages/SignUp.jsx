import { useCallback, useEffect, useState } from "react";
import FormSignUp from "../components/FormSignUp";
import PageNav from "../components/PageNav";
import styles from "./Homepage.module.css";
import StartProfile from "../components/StartProfile";
import MultiImageUpload from "../components/MultiImageUpload";
import Localisation from "../components/Localisation";
import { BASE_URL } from "../api/config";
function SignUp() {
  const [isregistered, setRegistered] = useState(false);
  const [error, setError] = useState("");
  const [questionEnded, setQuestionEnded] = useState(false);
  const [answer, setAnswer] = useState({});
  const [photos, setPhoto] = useState(false);
  const [located, setlocated] = useState(false);
  const [verify, setVerified] = useState(false);
  const token = sessionStorage.getItem("token");
  const istokenundefined = token === undefined || token === null;
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
        setQuestionEnded(false);
        setPhoto(true);
      }
    }
    submit();
  }, [questionEnded, setPhoto, CreateProfile, CreateLanguage, istokenundefined]);
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
          />
        )}
      {photos === true && <MultiImageUpload />}
    </div>
  );
}

export default SignUp;
