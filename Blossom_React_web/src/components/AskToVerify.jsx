import { useState } from "react";
import { useTranslation } from "react-i18next";
import { requestVerification } from "../api/verification";
import { formatDeadline } from "../api/offers";

const BLUE = "#2F80ED";

// Admin, on a suspicious profile: "Ask to verify". The member is told by
// notification and email to verify within 48 hours, or the profile will be
// deleted - by the admin, by hand (database/db_verification.py). Shows where
// it stands instead once asked, once the deadline has passed, or verified.
export default function AskToVerify({ profile, name, onAsked }) {
  const { t, i18n } = useTranslation();
  const [sending, setSending] = useState(false);

  if (profile.verified) {
    return <span style={{ color: BLUE, fontWeight: 800, fontSize: 13 }}>✓ {t("verified.verifiedLabel")}</span>;
  }
  if (profile.verify_by) {
    // Nothing is deleted automatically: past the deadline, the admin decides.
    if (new Date(profile.verify_by) < new Date()) {
      return <span style={{ color: "#C0392B", fontWeight: 800, fontSize: 13 }}>⌛ {t("verified.askExpired")}</span>;
    }
    return (
      <span style={{ color: "#B4581E", fontWeight: 700, fontSize: 13 }}>
        ⏳ {t("verified.asked", { date: formatDeadline(profile.verify_by, i18n.language) })}
      </span>
    );
  }

  async function ask() {
    if (!window.confirm(`${t("verified.askTitle", { name })}\n\n${t("verified.askText", { name })}`)) return;
    setSending(true);
    const result = await requestVerification(profile.id);
    setSending(false);
    if (result.ok) onAsked(result.data.deadline);
    else window.alert(`${t("verified.askFailed")}: ${result.message}`);
  }

  return (
    <button
      type="button"
      onClick={ask}
      disabled={sending}
      style={{
        padding: "6px 14px",
        borderRadius: 999,
        border: `1.5px solid ${BLUE}`,
        background: "transparent",
        color: BLUE,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      🛡️ {sending ? "…" : t("verified.askButton")}
    </button>
  );
}
