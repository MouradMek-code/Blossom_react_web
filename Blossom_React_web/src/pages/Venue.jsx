import { useState } from "react";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import { BASE_URL } from "../api/config";
import { postJson } from "../api/errors";
import { formatDeadline } from "../api/offers";
import styles from "./Venue.module.css";

const STAFF_KEY = "blossom_staff_code";

function savedStaffCode() {
  try {
    return localStorage.getItem(STAFF_KEY) || "";
  } catch {
    return "";
  }
}

// blossom-date.com/venue - for the restaurants, cafés and bars offering a
// promotion: the staff type the couple's code and their staff code on their
// own phone or till, see whether it's valid, and mark it used. No account;
// the staff code can be remembered on this device.
export default function Venue() {
  const { t, i18n } = useTranslation();
  const [code, setCode] = useState("");
  const [staffCode, setStaffCode] = useState(savedStaffCode);
  const [remember, setRemember] = useState(() => Boolean(savedStaffCode()));
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function call(path) {
    setBusy(true);
    setError("");
    const response = await postJson(`${BASE_URL}/offers/venue/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, staff_code: staffCode }),
    });
    setBusy(false);
    try {
      if (remember) localStorage.setItem(STAFF_KEY, staffCode);
      else localStorage.removeItem(STAFF_KEY);
    } catch {
      // private browsing: nothing remembered
    }
    if (!response.ok) {
      setError(response.message);
      return null;
    }
    return response.data;
  }

  async function check(e) {
    e.preventDefault();
    setDone(false);
    setResult(await call("check"));
  }

  async function markUsed() {
    const data = await call("redeem");
    if (data) {
      setResult(data);
      setDone(true);
    }
  }

  function another() {
    setCode("");
    setResult(null);
    setError("");
    setDone(false);
  }

  const deadline = (value) => formatDeadline(value, i18n.language);

  return (
    <div className={styles.page}>
      <PageNav />
      <main className={styles.wrap}>
        <h1 className={styles.title}>🎁 {t("offers.venueTitle")}</h1>
        <p className={styles.intro}>{t("offers.venueIntro")}</p>

        {!result ? (
          <form className={styles.card} onSubmit={check}>
            <label className={styles.field}>
              <span>{t("offers.coupleCode")}</span>
              <input
                className={styles.codeInput}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 12))}
                placeholder="BLSM-7K3F"
                autoCapitalize="characters"
                autoComplete="off"
                autoFocus
              />
            </label>
            <label className={styles.field}>
              <span>{t("offers.staffCodeLabel")}</span>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={staffCode}
                onChange={(e) => setStaffCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
              />
            </label>
            <label className={styles.remember}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              {t("offers.remember")}
            </label>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.primary} disabled={!code || !staffCode || busy}>
              {busy ? "…" : t("offers.check")}
            </button>
          </form>
        ) : (
          <div className={styles.card}>
            <p className={styles.status}>
              {done
                ? t("offers.usedNow")
                : result.status === "active"
                  ? t("offers.valid")
                  : result.status === "used"
                    ? t("offers.alreadyUsed", { date: deadline(result.used_at) })
                    : t("offers.expiredCode", { date: deadline(result.expires_at) })}
            </p>
            <p className={styles.code}>{result.code}</p>
            <p className={styles.offer}>🎁 {result.title}</p>
            {result.details && <p className={styles.muted}>{result.details}</p>}
            {result.spot && <p className={styles.muted}>📍 {result.spot.name}</p>}
            {result.status === "active" && !done && (
              <>
                <p className={styles.muted}>{t("offers.useBefore", { date: deadline(result.expires_at) })}</p>
                {error && <p className={styles.error}>{error}</p>}
                <button type="button" className={styles.primary} onClick={markUsed} disabled={busy}>
                  {busy ? "…" : t("offers.markUsed")}
                </button>
              </>
            )}
            <button type="button" className={styles.secondary} onClick={another}>
              {t("offers.another")}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
