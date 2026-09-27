import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import QRCode from "qrcode";
import { BASE_URL } from "../api/config";
import styles from "./Poster.module.css";

// The printable counter poster for a venue's promotion: what couples get,
// how, and a QR code to the spot on Blossom (which also brings new members).
// Public - no staff code on it.
export default function Poster() {
  const { t } = useTranslation();
  const { offerId } = useParams();
  const [offer, setOffer] = useState(null);
  const [qr, setQr] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/offers/${offerId}/poster`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`poster ${r.status}`))))
      .then(setOffer)
      .catch(() => setError(true));
  }, [offerId]);

  useEffect(() => {
    if (!offer) return;
    const url = `${window.location.origin}/date-spots/${offer.spot.id}`;
    QRCode.toDataURL(url, { width: 480, margin: 1, color: { dark: "#2A2420", light: "#FFFFFF" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [offer]);

  if (error) return <p className={styles.message}>{t("offers.loadFailed")}</p>;
  if (!offer) return <p className={styles.message}>…</p>;

  return (
    <div className={styles.page}>
      <button type="button" className={styles.print} onClick={() => window.print()}>
        {t("offers.print")}
      </button>
      <article className={styles.poster}>
        <p className={styles.brand}>🌸 Blossom</p>
        <p className={styles.for}>{t("offers.posterFor")}</p>
        <h1 className={styles.title}>🎁 {offer.title}</h1>
        {offer.details && <p className={styles.details}>{offer.details}</p>}
        <p className={styles.spot}>
          📍 {offer.spot.name}
          {offer.spot.neighborhood ? ` · ${offer.spot.neighborhood}` : ""} · {offer.spot.city}
        </p>
        <p className={styles.how}>{t("offers.posterHow")}</p>
        {qr && <img className={styles.qr} src={qr} alt="" />}
        <p className={styles.scan}>{t("offers.posterScan")}</p>
        <p className={styles.site}>{window.location.host}</p>
      </article>
    </div>
  );
}
