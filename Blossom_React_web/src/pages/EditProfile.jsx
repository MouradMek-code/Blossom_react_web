import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import { ProfileQuestion } from "../components/StartProfile";
import { BASE_URL } from "../api/config";
import { postJson } from "../api/errors";
import { answersFrom, detailsBody, editSections } from "../api/profileCompletion";
import { Button, Card, Icon, SkeletonRows } from "../ui";
import styles from "./EditProfile.module.css";
import { getAuth } from "../api/session";

// /profile/edit: every answer from sign-up that can be completed or changed
// later - the optional ones skipped at sign-up first of all - with the same
// questions as sign-up. ?section=<key> opens at that section. Clicking a
// chosen answer again removes it. One Save at the bottom.
export default function EditProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = getAuth("token");
  const [initial, setInitial] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const scrolled = useRef(false);

  useEffect(() => {
    if (!token || token === "null" || token === "undefined") {
      navigate("/login");
      return undefined;
    }
    let alive = true;
    postJson(`${BASE_URL}/profile`, { method: "GET", headers: { Authorization: `Bearer ${token}` } }).then((result) => {
      if (!alive) return;
      if (result.resp?.status === 401) {
        navigate("/login");
        return;
      }
      if (!result.ok) {
        setError(result.message || t("editProfile.failed"));
        return;
      }
      const start = answersFrom(result.data);
      setInitial(start);
      setAnswer(start);
    });
    return () => {
      alive = false;
    };
  }, [token, navigate, t]);

  const sections = useMemo(() => (answer ? editSections(answer.connection_type) : []), [answer]);
  const dirty = answer !== null && JSON.stringify(answer) !== JSON.stringify(initial);

  // Opened at a section: scroll there once it's on the page.
  useEffect(() => {
    if (!answer || scrolled.current) return;
    scrolled.current = true;
    const key = new URLSearchParams(window.location.search).get("section");
    if (key) document.getElementById(`edit-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [answer]);

  // Changes not saved: the browser asks before closing the tab.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // A chosen answer, clicked again, is removed (they're all optional here).
  function choose(question, option) {
    setAnswer((cur) => ({ ...cur, [question.field]: cur[question.field] === option ? "" : option }));
  }

  async function save() {
    if (!answer.language_name?.length) {
      setError(t("editProfile.needLanguage"));
      return;
    }
    setError("");
    setSaving(true);
    const result = await postJson(`${BASE_URL}/profile/details`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(detailsBody(answer)),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.message || t("editProfile.failed"));
      return;
    }
    setInitial(answer); // saved: nothing to warn about any more
    navigate("/profile");
  }

  function cancel() {
    if (dirty && !window.confirm(`${t("editProfile.discardTitle")}\n${t("editProfile.discardText")}`)) return;
    navigate("/profile");
  }

  return (
    <div className={styles.page}>
      <PageNav />
      <main className={styles.wrap}>
        <div className={styles.head}>
          <Link to="/profile" className={styles.back} aria-label={t("safety.back", "Back")} onClick={(e) => {
            e.preventDefault();
            cancel();
          }}>
            <Icon name="arrow-left" size={22} />
          </Link>
          <h1 className={styles.title}>{t("editProfile.title")}</h1>
        </div>
        <p className={styles.hint}>{t("editProfile.hint")}</p>

        {answer === null ? (
          error ? <p className={styles.error}>{error}</p> : <SkeletonRows count={6} />
        ) : (
          <>
            {sections.map((section) => (
              <Card key={section.key} className={styles.section} id={`edit-${section.key}`}>
                <h2 className={styles.sectionTitle}>{t(`signupSteps.${section.key}`)}</h2>
                {section.questions.map((question) => (
                  <div key={question.field} className={styles.question}>
                    <h3 className={styles.questionTitle}>{question.question}</h3>
                    <ProfileQuestion
                      question={question}
                      Handleclicked={choose}
                      answer={answer}
                      setAnswer={setAnswer}
                      setClicked={() => {}}
                    />
                  </div>
                ))}
              </Card>
            ))}

            <div className={styles.footer}>
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              <div className={styles.footerButtons}>
                <Button variant="quiet" onClick={cancel}>
                  {t("offers.cancel")}
                </Button>
                <Button icon="check" onClick={save} loading={saving} disabled={!dirty}>
                  {t("editProfile.save")}
                </Button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
