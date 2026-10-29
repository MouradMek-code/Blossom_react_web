import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import { POSE_EMOJI, fetchVerification, sendSelfie } from "../api/verification";
import { formatDeadline } from "../api/offers";
import styles from "./Verify.module.css";

// The ✓ verified badge on the website: copy the pose, take a selfie (a
// phone's browser opens the front camera), send. The Blossom team compares it
// with the profile photos; the selfie is deleted once checked. The email of
// an admin's "Ask to verify" links here.
export default function Verify() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [sending, setSending] = useState(false);
  const input = useRef(null);

  const load = useCallback(async () => {
    const token = sessionStorage.getItem("token");
    if (!token || token === "null" || token === "undefined") {
      navigate("/login");
      return;
    }
    const result = await fetchVerification();
    if (result.ok) setState(result.data);
    else setError(result.message);
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  function pick(event) {
    const chosen = event.target.files?.[0];
    event.target.value = "";
    if (!chosen) return;
    setFile(chosen);
    setPreview(URL.createObjectURL(chosen));
  }

  async function send() {
    setSending(true);
    setError("");
    const result = await sendSelfie(file);
    setSending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setFile(null);
    setPreview("");
    setState(result.data);
  }

  const status = state?.status;

  return (
    <div className={styles.page}>
      <PageNav />
      <main className={styles.wrap}>
        {!state ? (
          <p className={styles.muted}>{error || "…"}</p>
        ) : (
          <>
            {state.deadline && status !== "approved" && (
              <p className={styles.deadline}>
                ⚠️ {t("verified.deadline", { date: formatDeadline(state.deadline, i18n.language) })}
              </p>
            )}

            {status === "approved" ? (
              <section className={`${styles.card} ${styles.center}`}>
                <span className={styles.bigBadge}>✓</span>
                <h1 className={styles.title}>{t("verified.doneTitle")}</h1>
                <p className={styles.text}>{t("verified.doneText")}</p>
              </section>
            ) : status === "pending" ? (
              <section className={`${styles.card} ${styles.center}`}>
                <span className={styles.bigEmoji}>⏳</span>
                <h1 className={styles.title}>{t("verified.pendingTitle")}</h1>
                <p className={styles.text}>{t("verified.pendingText")}</p>
              </section>
            ) : (
              <>
                <header className={styles.center}>
                  <span className={styles.bigBadge}>✓</span>
                  <h1 className={styles.title}>{t("verified.introTitle")}</h1>
                  <p className={styles.text}>{t("verified.introText")}</p>
                </header>

                {status === "rejected" && state.reason && (
                  <p className={styles.retry}>{t(`verified.reason_${state.reason}`)}</p>
                )}

                <section className={styles.card}>
                  <h2 className={styles.step}>{t("verified.step1")}</h2>
                  <div className={styles.pose}>
                    <span className={styles.poseEmoji}>{POSE_EMOJI[state.pose] || "🙂"}</span>
                    <strong>{t(`verified.pose_${state.pose}`)}</strong>
                  </div>
                </section>

                <section className={styles.card}>
                  <h2 className={styles.step}>{t("verified.step2")}</h2>
                  <p className={styles.text}>{t("verified.step2Text")}</p>
                  <input ref={input} type="file" accept="image/*" capture="user" hidden onChange={pick} />
                  {preview ? (
                    <>
                      <img src={preview} alt="" className={styles.preview} />
                      <button type="button" className={styles.primary} onClick={send} disabled={sending}>
                        {sending ? "…" : t("verified.send")}
                      </button>
                      <button type="button" className={styles.link} onClick={() => input.current?.click()} disabled={sending}>
                        {t("verified.retake")}
                      </button>
                    </>
                  ) : (
                    <button type="button" className={styles.primary} onClick={() => input.current?.click()}>
                      📸 {t("verified.take")}
                    </button>
                  )}
                  {error && <p className={styles.error}>{error}</p>}
                </section>

                <p className={styles.privacy}>🔒 {t("verified.privacy")}</p>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
