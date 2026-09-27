import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import { BASE_URL } from "../api/config";
import { postJson } from "../api/errors";
import { IMG } from "../api/images";
import { formatDeadline } from "../api/offers";
import styles from "./Promotions.module.css";

// My promotions: the codes a match and I got by saying yes to a spot with a
// venue promotion. At the venue, the staff type their code here to mark it
// used - once only.
export default function Promotions() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const highlight = Number(params.get("highlight")) || null;
  const token = sessionStorage.getItem("token");
  const [vouchers, setVouchers] = useState(null);
  const [error, setError] = useState("");
  const [staffFor, setStaffFor] = useState(null);
  const [staffCode, setStaffCode] = useState("");
  const [staffError, setStaffError] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const load = useCallback(async () => {
    if (!token || token === "null") {
      navigate("/login");
      return;
    }
    try {
      const resp = await fetch(`${BASE_URL}/offers/vouchers`, { headers: { Authorization: `Bearer ${token}` } });
      if (!resp.ok) throw new Error(`vouchers ${resp.status}`);
      setVouchers(await resp.json());
      setError("");
    } catch {
      setError(t("offers.loadFailed"));
    }
  }, [token, navigate, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function redeem(e) {
    e.preventDefault();
    if (!staffCode || redeeming) return;
    setRedeeming(true);
    setStaffError("");
    const result = await postJson(`${BASE_URL}/offers/vouchers/${staffFor}/redeem`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ staff_code: staffCode }),
    });
    setRedeeming(false);
    if (!result.ok) {
      setStaffError(result.message);
      return;
    }
    setVouchers((cur) => cur.map((v) => (v.id === result.data.id ? result.data : v)));
    setStaffFor(null);
    setStaffCode("");
  }

  const deadline = (value) => formatDeadline(value, i18n.language);

  return (
    <div className={styles.page}>
      <PageNav />
      <main className={styles.wrap}>
        <h1 className={styles.title}>🎁 {t("offers.myPromosTitle")}</h1>
        {error && <p className={styles.error}>{error}</p>}
        {vouchers === null ? (
          !error && <p className={styles.muted}>…</p>
        ) : vouchers.length === 0 ? (
          <p className={styles.empty}>
            {t("offers.noPromos")} <Link to="/date-spots">{t("nav.dateSpots", "Date spots")} →</Link>
          </p>
        ) : (
          vouchers.map((v) => {
            const active = v.status === "active";
            return (
              <article
                key={v.id}
                className={`${styles.card} ${v.id === highlight ? styles.highlight : ""} ${active ? "" : styles.done}`}
              >
                <header className={styles.cardTop}>
                  {v.spot?.image_url ? (
                    <img className={styles.spotImage} src={IMG.thumb(v.spot.image_url)} alt="" />
                  ) : (
                    <span className={`${styles.spotImage} ${styles.spotImageEmpty}`}>📍</span>
                  )}
                  <div className={styles.spotText}>
                    <strong>{v.spot?.name}</strong>
                    {v.partner && <span className={styles.muted}>{t("offers.withPartner", { name: v.partner.first_name })}</span>}
                  </div>
                  <span className={`${styles.status} ${styles[`status_${v.status}`]}`}>{t(`offers.status_${v.status}`)}</span>
                </header>

                <p className={styles.offerTitle}>🎁 {v.title}</p>
                {v.details && <p className={styles.muted}>{v.details}</p>}

                <div className={styles.codeBox}>
                  {active && <span className={styles.codeLabel}>{t("offers.showCounter")}</span>}
                  <span className={`${styles.code} ${active ? "" : styles.codeDone}`}>{v.code}</span>
                  <span className={styles.deadline}>
                    {v.status === "used"
                      ? t("offers.usedOn", { date: deadline(v.used_at) })
                      : v.status === "expired"
                        ? t("offers.expiredOn", { date: deadline(v.expires_at) })
                        : t("offers.useBefore", { date: deadline(v.expires_at) })}
                  </span>
                </div>

                {active &&
                  (staffFor === v.id ? (
                    <form className={styles.staff} onSubmit={redeem}>
                      <strong>🔒 {t("offers.staffTitle")}</strong>
                      <span className={styles.muted}>{t("offers.staffText")}</span>
                      <input
                        type="password"
                        inputMode="numeric"
                        autoComplete="off"
                        autoFocus
                        value={staffCode}
                        onChange={(e) => setStaffCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                        placeholder={t("offers.staffPlaceholder")}
                      />
                      {staffError && <span className={styles.error}>{staffError}</span>}
                      <div className={styles.staffRow}>
                        <button type="button" className={styles.secondary} onClick={() => setStaffFor(null)}>
                          {t("offers.cancel")}
                        </button>
                        <button type="submit" className={styles.primary} disabled={!staffCode || redeeming}>
                          {redeeming ? "…" : t("offers.confirm")}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      className={styles.staffBtn}
                      onClick={() => {
                        setStaffFor(v.id);
                        setStaffCode("");
                        setStaffError("");
                      }}
                    >
                      {t("offers.staffButton")}
                    </button>
                  ))}
                {active && (
                  <p className={styles.venueHint}>
                    {t("offers.venueHint", { url: `${window.location.host}/venue` })}
                  </p>
                )}
              </article>
            );
          })
        )}
      </main>
    </div>
  );
}
