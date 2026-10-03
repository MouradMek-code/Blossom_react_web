import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./ChatPage.module.css";
import PageNav from "../components/PageNav";

import { BASE_URL } from "../api/config";
import { postJson } from "../api/errors";
import { IMG } from "../api/images";
import { categoryEmoji, categoryGradient, shortPlace } from "../api/categories";
import { formatDeadline } from "../api/offers";

// A date spot sent with "Invite a match": the message text plus a tappable
// card for the place. The invited person answers "I'm in"; when the spot has
// a venue promotion, that gets them both a code.
function InviteCard({ message, mine, partnerName, onAccept, accepting }) {
  const { t, i18n } = useTranslation();
  const spot = message.date_spot;
  const offer = spot.offer;
  const voucher = message.voucher;
  const accepted = Boolean(message.accepted_at);
  const deadline = (value) => formatDeadline(value, i18n.language);
  return (
    <div className={styles.invite}>
      <p className={styles.inviteText}>{message.content}</p>
      <Link
        to={`/date-spots/${spot.id}`}
        className={`${styles.inviteCard} ${mine ? styles.inviteCardMine : ""}`}
      >
        {spot.image_url ? (
          <img className={styles.inviteImage} src={IMG.card(spot.image_url)} alt={spot.name} />
        ) : (
          <div
            className={styles.inviteImage}
            style={{ background: `linear-gradient(135deg, ${categoryGradient(spot.category).join(", ")})` }}
          >
            <span aria-hidden="true">{categoryEmoji(spot.category)}</span>
          </div>
        )}
        <div className={styles.inviteInfo}>
          <span className={styles.inviteEyebrow}>💌 {t("dateSpots.dateIdea")}</span>
          <strong className={styles.inviteName}>{spot.name}</strong>
          <span className={styles.invitePlace}>📍 {shortPlace(spot)}</span>
          <span className={styles.inviteCta}>{t("dateSpots.viewSpot")} →</span>
        </div>
      </Link>

      {voucher ? (
        <Link to={`/promotions?highlight=${voucher.id}`} className={styles.voucherBox}>
          <strong className={styles.voucherTitle}>🎁 {voucher.title}</strong>
          <span className={styles.voucherLabel}>{t("offers.yourCode")}</span>
          <span className={styles.voucherCode}>{voucher.code}</span>
          <span className={`${styles.voucherDeadline} ${voucher.status !== "active" ? styles.voucherDone : ""}`}>
            {voucher.status === "used"
              ? t("offers.usedOn", { date: deadline(voucher.used_at) })
              : voucher.status === "expired"
                ? t("offers.expiredOn", { date: deadline(voucher.expires_at) })
                : t("offers.useBefore", { date: deadline(voucher.expires_at) })}
          </span>
        </Link>
      ) : offer && !accepted ? (
        <p className={styles.offerStrip}>
          🎁{" "}
          {mine
            ? t("offers.ifTheySayYes", { title: offer.title, name: partnerName })
            : t("offers.ifYouSayYes", { title: offer.title })}
        </p>
      ) : null}

      {accepted ? (
        <p className={styles.inStatus}>
          {mine ? t("offers.theyreIn", { name: partnerName }) : t("offers.youreIn")}
        </p>
      ) : !mine ? (
        <button type="button" className={styles.imInBtn} onClick={() => onAccept(message)} disabled={accepting}>
          {accepting ? "…" : t("offers.imIn")}
        </button>
      ) : null}
    </div>
  );
}

// "Suggest a spot" from the chat: spots with a venue promotion first, one
// click sends the invite card.
function SpotSuggester({ partner, token, onClose, onSent }) {
  const { t } = useTranslation();
  const [spots, setSpots] = useState(null);
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${BASE_URL}/date_spots`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setSpots)
      .catch(() => setSpots([]));
  }, []);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (spots || [])
      .filter((s) => !q || `${s.name} ${s.city} ${s.neighborhood || ""}`.toLowerCase().includes(q))
      .sort((a, b) => Number(Boolean(b.offer)) - Number(Boolean(a.offer)));
  }, [spots, search]);

  async function suggest(spot) {
    if (sending) return;
    setSending(spot.id);
    setError("");
    const result = await postJson(`${BASE_URL}/date_spots/${spot.id}/invite`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id: partner.id, content: t("dateSpots.inviteMessage", { name: spot.name }) }),
    });
    setSending(null);
    if (!result.ok) {
      setError(result.message || t("offers.inviteFailed"));
      return;
    }
    onSent(result.data.message);
  }

  return (
    <div className={styles.suggestOverlay} onClick={onClose}>
      <div className={styles.suggestSheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t("offers.suggestTitle")}>
        <div className={styles.suggestHead}>
          <strong>{t("offers.suggestTitle")}</strong>
          <button type="button" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className={styles.suggestHint}>{t("offers.suggestHint")}</p>
        <input
          className={styles.suggestSearch}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("offers.searchSpot")}
          autoFocus
        />
        {error && <p className={styles.suggestError}>{error}</p>}
        <div className={styles.suggestList}>
          {spots === null
            ? "…"
            : shown.map((spot) => (
                <button key={spot.id} type="button" className={styles.suggestRow} onClick={() => suggest(spot)} disabled={!!sending}>
                  {spot.image_url ? (
                    <img className={styles.suggestImage} src={IMG.thumb(spot.image_url)} alt="" />
                  ) : (
                    <span className={styles.suggestImage}>{categoryEmoji(spot.category)}</span>
                  )}
                  <span className={styles.suggestText}>
                    <strong>{spot.name}</strong>
                    <span>📍 {shortPlace(spot)}</span>
                    {spot.offer && <span className={styles.suggestOffer}>🎁 {spot.offer.title}</span>}
                  </span>
                  <span aria-hidden="true">{sending === spot.id ? "…" : "💌"}</span>
                </button>
              ))}
        </div>
      </div>
    </div>
  );
}

function ChatPage() {
  const { t, i18n } = useTranslation();
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const token = sessionStorage.getItem("token");

  const [messages, setMessages] = useState([]);
  // Messages already shown in the chat but still on their way to the server.
  const [pending, setPending] = useState([]);
  const [details, setDetails] = useState(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  // The invite being answered with "I'm in", and what it got the couple.
  const [accepting, setAccepting] = useState(null);
  const [notice, setNotice] = useState(null);
  const [suggestOpen, setSuggestOpen] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  // Mirrors `text` synchronously. A double click fires send twice before React
  // re-renders, and both calls would otherwise read the same text and post it
  // twice; reading and clearing through the ref lets only the first through.
  const textRef = useRef("");

  function updateText(value) {
    textRef.current = value;
    setText(value);
  }

  // Who's on the other side (name + photo for the header), and our own
  // profile id - more reliable than the locally stored one for deciding which
  // bubbles are ours.
  useEffect(() => {
    let alive = true;
    fetch(`${BASE_URL}/messages/conversation/${conversationId}/details`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data) setDetails(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [conversationId, token]);

  const profileId = details?.me_profile_id ?? sessionStorage.getItem("profile_id");
  const partner = details?.profile;

  // "I'm in" on a date spot invite. With a venue promotion on the spot, the
  // couple gets a code - or a word on why not.
  async function acceptInvite(message) {
    if (accepting) return;
    setAccepting(message.id);
    setError("");
    const result = await postJson(`${BASE_URL}/offers/invites/${message.id}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setAccepting(null);
    if (!result.ok) {
      setError(result.message || t("offers.acceptFailed"));
      return;
    }
    const updated = result.data.message;
    setMessages((cur) => cur.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
    const voucher = result.data.voucher;
    const reason = result.data.reason;
    if (voucher) {
      setNotice({
        title: t("offers.gotTitle"),
        text: t("offers.gotText", {
          title: voucher.title,
          spot: voucher.spot?.name || message.date_spot.name,
          date: formatDeadline(voucher.expires_at, i18n.language),
        }),
        voucherId: voucher.id,
      });
    } else if (reason && reason !== "no_offer") {
      setNotice({ title: t("offers.dateOn"), text: t(`offers.reason_${reason}`) });
    }
  }

  // Unmatching lives here now that there's no separate matches page. The
  // server deletes the conversation with it, so there's a confirmation first.
  async function handleUnmatch() {
    const question = `${t("messages.unmatchTitle", { name: partner.first_name })}\n\n${t(
      "messages.unmatchMessage",
    )}`;
    if (!window.confirm(question)) return;
    try {
      const resp = await fetch(`${BASE_URL}/matches/unmatch/${partner.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error(`unmatch failed with ${resp.status}`);
      navigate("/messages");
    } catch {
      setError(t("messages.unmatchFailed"));
    }
  }

  const loadMessages = useCallback(async () => {
    try {
      const resp = await fetch(
        `${BASE_URL}/messages/conversation/${conversationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!resp.ok) return;
      setMessages(await resp.json());
    } catch {
      // Keep showing what we have; the next poll will retry.
    }
  }, [conversationId, token]);

  useEffect(() => {
    loadMessages();

    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  // Sends feel instant: the input clears and the bubble appears straight away
  // (faded, "Sending…"), then turns solid once the server confirms. On failure
  // the bubble goes away and the text is put back so nothing is lost.
  async function sendMessage(e) {
    e?.preventDefault();
    const content = textRef.current.trim();
    if (!content) return;
    updateText("");
    setError("");
    inputRef.current?.focus();

    const tempId = `pending-${Date.now()}-${Math.random()}`;
    const afterId = messages.reduce((max, m) => Math.max(max, Number(m.id) || 0), 0);
    setPending((cur) => [...cur, { id: tempId, content, afterId }]);

    const result = await postJson(`${BASE_URL}/messages/conversation/${conversationId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    setPending((cur) => cur.filter((m) => m.id !== tempId));
    if (!result.ok) {
      setError(result.message);
      if (!textRef.current) updateText(content);
      return;
    }
    setMessages((cur) =>
      cur.some((m) => m.id === result.data.id) ? cur : [...cur, result.data],
    );
  }

  // The 3s poll can deliver a message before its own send call returns; don't
  // show the pending copy next to the real one in that moment.
  const visiblePending = pending.filter(
    (p) =>
      !messages.some(
        (m) =>
          m.id > p.afterId &&
          m.content === p.content &&
          Number(m.sender_profile_id) === Number(profileId),
      ),
  );

  return (
    <>
      <div className={styles.chatContainer}>
        {/* No bottom tab bar here: the message box needs the bottom. */}
        <PageNav hideTabBar />
        <div className={styles.header}>
          <Link to="/messages" className={styles.back} aria-label={t("messages.back")}>
            ←
          </Link>
          {partner ? (
            <div className={styles.partner}>
              {/* state: tells their profile page this is a match (Unmatch). */}
              <Link
                to={`/profile/${partner.id}`}
                state={{ matched: true }}
                className={styles.partnerPhotoLink}
              >
                {partner.photo ? (
                  <img
                    className={styles.partnerPhoto}
                    src={IMG.thumb(partner.photo)}
                    alt={partner.first_name}
                  />
                ) : (
                  <span className={`${styles.partnerPhoto} ${styles.partnerPhotoEmpty}`}>🌸</span>
                )}
              </Link>
              <span className={styles.partnerText}>
                <Link
                  to={`/profile/${partner.id}`}
                  state={{ matched: true }}
                  className={styles.partnerName}
                >
                  {partner.first_name}
                  {partner.age ? `, ${partner.age}` : ""}
                </Link>
                {/* Both actions in plain sight, right under the name. */}
                <span className={styles.partnerActions}>
                  <Link
                    to={`/profile/${partner.id}`}
                    state={{ matched: true }}
                    className={styles.partnerHint}
                  >
                    {t("messages.viewProfile")}
                  </Link>
                  <span className={styles.dot} aria-hidden="true">·</span>
                  <button type="button" className={styles.unmatchLink} onClick={handleUnmatch}>
                    💔 {t("messages.unmatch")}
                  </button>
                </span>
              </span>
            </div>
          ) : (
            <span className={styles.partnerName}>💬</span>
          )}
        </div>

        {details?.event && (
          <Link to={`/events/${details.event.id}`} className={styles.eventBanner}>
            {t("events.matchedThrough", { title: details.event.title })}
          </Link>
        )}

        <div className={styles.messagesContainer}>
          {messages.map((message) => {
            const isMine =
              Number(message.sender_profile_id) === Number(profileId);

            return (
              <div
                key={message.id}
                className={`${styles.row} ${isMine ? styles.right : styles.left}`}
              >
                <div
                  className={`${styles.bubble} ${
                    isMine ? styles.mine : styles.theirs
                  } ${message.date_spot ? styles.bubbleInvite : ""}`}
                >
                  {message.date_spot ? (
                    <InviteCard
                      message={message}
                      mine={isMine}
                      partnerName={partner?.first_name || ""}
                      onAccept={acceptInvite}
                      accepting={accepting === message.id}
                    />
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            );
          })}

          {visiblePending.map((message) => (
            <div key={message.id} className={`${styles.row} ${styles.right}`}>
              <div className={`${styles.bubble} ${styles.mine} ${styles.pending}`}>
                {message.content}
                <span className={styles.pendingStatus}>{t("messages.sending")}</span>
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {error !== "" && (
          <p style={{ color: "var(--primary)", textAlign: "center", padding: "0 12px" }}>
            {error}
          </p>
        )}

        {notice && (
          <div className={styles.notice} role="status">
            <strong>{notice.title}</strong>
            <span>{notice.text}</span>
            <div className={styles.noticeActions}>
              {notice.voucherId && (
                <Link to={`/promotions?highlight=${notice.voucherId}`}>{t("offers.myPromos")}</Link>
              )}
              <button type="button" onClick={() => setNotice(null)}>OK</button>
            </div>
          </div>
        )}

        {/* A form so Enter sends too. The button is disabled while the box is
            empty - which it is right after a send, so a second click can't
            post the same message again. */}
        <form className={styles.inputBox} onSubmit={sendMessage}>
          {partner && (
            <button
              type="button"
              className={styles.suggestBtn}
              onClick={() => setSuggestOpen(true)}
              title={t("offers.suggestSpot")}
              aria-label={t("offers.suggestSpot")}
            >
              📍
            </button>
          )}
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => updateText(e.target.value)}
            placeholder={t("messages.placeholder")}
            className={styles.input}
            autoComplete="off"
          />
          <button type="submit" className={styles.button} disabled={!text.trim()}>
            {t("messages.send")}
          </button>
        </form>

        {suggestOpen && partner && (
          <SpotSuggester
            partner={partner}
            token={token}
            onClose={() => setSuggestOpen(false)}
            onSent={(message) => {
              setSuggestOpen(false);
              setMessages((cur) => (cur.some((m) => m.id === message.id) ? cur : [...cur, message]));
            }}
          />
        )}
      </div>
    </>
  );
}

export default ChatPage;
