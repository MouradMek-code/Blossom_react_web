import { Fragment, useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./ChatPage.module.css";
import PageNav from "../components/PageNav";
import ConversationList from "../components/ConversationList";
import { useWide } from "../api/useWide";
import { Icon } from "../ui";
import FirstMoveCard from "../components/FirstMoveCard";

import { BASE_URL } from "../api/config";
import { postJson } from "../api/errors";
import { IMG } from "../api/images";
import { categoryEmoji, categoryGradient, shortPlace } from "../api/categories";
import { formatDeadline } from "../api/offers";
import { firstRiskyMessageId } from "../api/chatSafety";
import { fetchChat, sendChatPhoto, sendTyping } from "../api/chatLive";
import { activeLabel, clockTime, dayLabel, isActiveNow, startsDay } from "../api/chatTime";
import { isImageFile } from "../api/photoUpload";
import { getAuth } from "../api/session";

// While the box is changing, "typing..." is sent at most this often.
const TYPING_EVERY_MS = 3000;

// A photo in the chat. Theirs stays blurred until clicked - nobody gets a
// picture in their face they didn't choose to see; then a click opens it big.
function PhotoMessage({ message, mine, revealed, onReveal, onOpen }) {
  const { t } = useTranslation();
  const hidden = !mine && !revealed;
  if (message.pending) {
    return (
      <span className={styles.photoWrap}>
        <img src={message.localUrl} alt="" className={styles.photo} />
        <span className={styles.photoVeil}>
          <span className={styles.photoSpinner} aria-hidden="true" />
        </span>
      </span>
    );
  }
  return (
    <button
      type="button"
      className={styles.photoWrap}
      onClick={hidden ? onReveal : onOpen}
      aria-label={hidden ? t("messages.photoTap") : t("messages.photoOpen")}
    >
      <img
        src={hidden ? IMG.hidden(message.image_url) : IMG.card(message.image_url)}
        alt=""
        className={`${styles.photo} ${hidden ? styles.photoHidden : ""}`}
        loading="lazy"
      />
      {hidden && (
        <span className={styles.photoVeil}>
          <Icon name="eye" size={24} />
          {t("messages.photoTap")}
        </span>
      )}
    </button>
  );
}

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
          <span className={styles.invitePlace}><Icon name="map-pin" size={14} style={{ verticalAlign: "-2px", marginInlineEnd: 4 }} />{shortPlace(spot)}</span>
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

  // Logged in, the list says which spots I saved (♡): those come first.
  useEffect(() => {
    fetch(`${BASE_URL}/date_spots`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then(setSpots)
      .catch(() => setSpots([]));
  }, [token]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (spots || [])
      .filter((s) => !q || `${s.name} ${s.city} ${s.neighborhood || ""}`.toLowerCase().includes(q))
      .sort((a, b) => Number(Boolean(b.offer)) - Number(Boolean(a.offer)));
  }, [spots, search]);
  const savedShown = shown.filter((s) => s.saved);
  const otherShown = shown.filter((s) => !s.saved);

  function row(spot) {
    return (
      <button key={spot.id} type="button" className={styles.suggestRow} onClick={() => suggest(spot)} disabled={!!sending}>
        {spot.image_url ? (
          <img className={styles.suggestImage} src={IMG.thumb(spot.image_url)} alt="" />
        ) : (
          <span className={styles.suggestImage}>{categoryEmoji(spot.category)}</span>
        )}
        <span className={styles.suggestText}>
          <strong>{spot.name}</strong>
          <span><Icon name="map-pin" size={14} style={{ verticalAlign: "-2px", marginInlineEnd: 4 }} />{shortPlace(spot)}</span>
          {spot.offer && <span className={styles.suggestOffer}>🎁 {spot.offer.title}</span>}
        </span>
        <span aria-hidden="true">{sending === spot.id ? "…" : "💌"}</span>
      </button>
    );
  }

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
          <button type="button" onClick={onClose} aria-label="Close">
            <Icon name="x" size={20} />
          </button>
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
          {spots === null ? (
            "…"
          ) : (
            <>
              {savedShown.length > 0 && <p className={styles.suggestGroup}>{t("offers.suggestSaved")}</p>}
              {savedShown.map(row)}
              {savedShown.length > 0 && otherShown.length > 0 && (
                <p className={styles.suggestGroup}>{t("offers.suggestAll")}</p>
              )}
              {otherShown.map(row)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatPage() {
  const { t, i18n } = useTranslation();
  const { conversationId } = useParams();
  const wide = useWide();
  const navigate = useNavigate();

  const token = getAuth("token");

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
  // From the poll: "typing...", when they were last on Blossom, photos allowed.
  const [typing, setTyping] = useState(false);
  const [lastActiveAt, setLastActiveAt] = useState(null);
  const [photosAllowed, setPhotosAllowed] = useState(false);
  const [sendingPhoto, setSendingPhoto] = useState(false);
  // Their photos the reader chose to see, and the one open full screen.
  const [revealed, setRevealed] = useState(() => new Set());
  const [viewer, setViewer] = useState(null);
  const lastTypingPing = useRef(0);
  const fileRef = useRef(null);

  const listRef = useRef(null);
  // Following the newest message: true at the bottom, false once you scroll
  // up to read older ones - then nothing pulls you back down (polling, "Seen",
  // "typing..."), and a "New messages" button appears instead.
  const atBottom = useRef(true);
  const autoScrollUntil = useRef(0);
  const shownCount = useRef(0);
  const [newBelow, setNewBelow] = useState(false);
  const inputRef = useRef(null);
  // Mirrors `text` synchronously. A double click fires send twice before React
  // re-renders, and both calls would otherwise read the same text and post it
  // twice; reading and clearing through the ref lets only the first through.
  const textRef = useRef("");

  function updateText(value) {
    textRef.current = value;
    setText(value);
    // "typing..." for them, every few seconds while the box changes.
    const now = Date.now();
    if (value.trim() && now - lastTypingPing.current > TYPING_EVERY_MS) {
      lastTypingPing.current = now;
      sendTyping(conversationId);
    }
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

  const profileId = details?.me_profile_id ?? getAuth("profile_id");
  const partner = details?.profile;
  // Empty chat, a man with a woman: she writes first - his box waits.
  const waitingForHer = messages.length === 0 && details?.first_move === "them";
  // WhatsApp, crypto, money...: a warning under the first such message.
  const riskyId = useMemo(() => firstRiskyMessageId(messages, profileId), [messages, profileId]);

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
      const live = await fetchChat(conversationId);
      if (!live) return;
      setMessages(live.messages);
      setTyping(live.typing);
      setLastActiveAt(live.lastActiveAt);
      setPhotosAllowed(live.photosAllowed);
    } catch {
      // Keep showing what we have; the next poll will retry.
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();

    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  const scrollToLatest = useCallback((smooth = true) => {
    atBottom.current = true;
    setNewBelow(false);
    const list = listRef.current;
    if (!list) return;
    // Our own smooth scroll passes through "not at the bottom" on the way.
    autoScrollUntil.current = Date.now() + 700;
    list.scrollTo({ top: list.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  function onListScroll() {
    const list = listRef.current;
    if (!list) return;
    const near = list.scrollHeight - list.scrollTop - list.clientHeight < 120;
    if (near) {
      atBottom.current = true;
      setNewBelow(false);
    } else if (Date.now() > autoScrollUntil.current) {
      atBottom.current = false;
    }
  }

  // Another conversation: start at its newest message.
  useEffect(() => {
    atBottom.current = true;
    shownCount.current = 0;
    setNewBelow(false);
  }, [conversationId]);

  useEffect(() => {
    const count = messages.length + pending.length;
    const firstFill = shownCount.current === 0;
    const grew = count > shownCount.current;
    shownCount.current = count;
    if (atBottom.current) scrollToLatest(!firstFill);
    else if (grew) setNewBelow(true);
  }, [messages, pending, typing, scrollToLatest]);

  // The big photo closes with Escape.
  useEffect(() => {
    if (!viewer) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setViewer(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer]);

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
    // Sending ends "typing..." on the server; the next words start it again.
    lastTypingPing.current = 0;

    const tempId = `pending-${Date.now()}-${Math.random()}`;
    const afterId = messages.reduce((max, m) => Math.max(max, Number(m.id) || 0), 0);
    atBottom.current = true; // your own message: always shown
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

  // Photos wait until both have written (the server says so on each poll).
  function choosePhoto() {
    if (sendingPhoto) return;
    if (!photosAllowed) {
      setNotice({ title: t("messages.photoLockedTitle"), text: t("messages.photoLocked") });
      return;
    }
    fileRef.current?.click();
  }

  // The bubble shows at once, with a spinner, while the photo goes up.
  async function sendPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isImageFile(file)) {
      setError(t("photos.notImage", { defaultValue: t("messages.photoFailed") }));
      return;
    }
    setError("");
    setSendingPhoto(true);
    const tempId = `pending-photo-${Date.now()}`;
    const localUrl = URL.createObjectURL(file);
    const afterId = messages.reduce((max, m) => Math.max(max, Number(m.id) || 0), 0);
    atBottom.current = true;
    setPending((cur) => [...cur, { id: tempId, content: "", localUrl, photo: true, afterId, pending: true }]);
    const result = await sendChatPhoto(conversationId, file);
    setPending((cur) => cur.filter((m) => m.id !== tempId));
    URL.revokeObjectURL(localUrl);
    setSendingPhoto(false);
    if (!result.ok) {
      setError(result.message || t("messages.photoFailed"));
      return;
    }
    setMessages((cur) => (cur.some((m) => m.id === result.data.id) ? cur : [...cur, result.data]));
  }

  // The 3s poll can deliver a message before its own send call returns; don't
  // show the pending copy next to the real one in that moment.
  const visiblePending = pending.filter(
    (p) =>
      !messages.some(
        (m) =>
          m.id > p.afterId &&
          Number(m.sender_profile_id) === Number(profileId) &&
          (p.photo ? Boolean(m.image_url) : m.content === p.content),
      ),
  );
  // "Sent" / "Seen" goes under my message when it's the last one in the chat.
  const lastMessage = messages[messages.length - 1];
  const statusId =
    lastMessage && visiblePending.length === 0 && Number(lastMessage.sender_profile_id) === Number(profileId)
      ? lastMessage.id
      : null;
  // Under the name: "typing..." or "Active 5 min ago".
  const presence = typing ? t("messages.typing") : activeLabel(lastActiveAt, t);

  const page = (
    <>
      <div className={`${styles.chatContainer} ${wide ? styles.chatInSplit : ""}`}>
        {/* No bottom tab bar here: the message box needs the bottom. */}
        {!wide && <PageNav hideTabBar />}
        <div className={styles.header}>
          {!wide && (
            <Link to="/messages" className={styles.back} aria-label={t("messages.back")}>
              <Icon name="arrow-left" size={22} />
            </Link>
          )}
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
                {isActiveNow(lastActiveAt) && <span className={styles.onlineDot} aria-hidden="true" />}
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
                {presence && (
                  <span className={`${styles.presence} ${typing ? styles.presenceTyping : ""}`} aria-live="polite">
                    {presence}
                  </span>
                )}
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

        <div className={styles.messagesContainer} ref={listRef} onScroll={onListScroll}>
          {messages.length === 0 && details?.first_move && (
            <FirstMoveCard
              move={details.first_move}
              name={partner?.first_name || ""}
              onPick={(line) => {
                updateText(line);
                inputRef.current?.focus();
              }}
            />
          )}
          {messages.map((message, index) => {
            const isMine =
              Number(message.sender_profile_id) === Number(profileId);
            const isPhoto = Boolean(message.image_url);

            return (
              <Fragment key={message.id}>
              {startsDay(message, messages[index - 1]) && (
                <div className={styles.dayRow} role="separator">
                  <span className={styles.dayText}>{dayLabel(message.created_at, t, i18n.language)}</span>
                </div>
              )}
              <div
                className={`${styles.row} ${isMine ? styles.right : styles.left}`}
              >
                <div
                  className={`${styles.bubble} ${
                    isMine ? styles.mine : styles.theirs
                  } ${message.date_spot ? styles.bubbleInvite : ""} ${isPhoto ? styles.bubblePhoto : ""}`}
                >
                  {isPhoto ? (
                    <PhotoMessage
                      message={message}
                      mine={isMine}
                      revealed={revealed.has(message.id)}
                      onReveal={() => setRevealed((cur) => new Set(cur).add(message.id))}
                      onOpen={() => setViewer({ url: message.image_url, mine: isMine })}
                    />
                  ) : message.date_spot ? (
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
                  <time className={styles.time} dateTime={message.created_at}>
                    {clockTime(message.created_at)}
                  </time>
                </div>
              </div>
              {message.id === statusId && (
                <span className={`${styles.readStatus} ${message.is_read ? styles.readStatusSeen : ""}`}>
                  {message.is_read ? `✓✓ ${t("messages.seen")}` : `✓ ${t("messages.sent")}`}
                </span>
              )}
              {message.id === riskyId && (
                <div className={styles.safety}>
                  <span className={styles.safetyRow}>
                    <Icon name="alert-triangle" size={17} />
                    {t("chatSafety.text")}
                  </span>
                  {partner && (
                    <Link to={`/profile/${partner.id}`} className={`${styles.safetyRow} ${styles.safetyLink}`}>
                      <Icon name="flag" size={16} />
                      {t("chatSafety.report")}
                    </Link>
                  )}
                </div>
              )}
              </Fragment>
            );
          })}

          {visiblePending.map((message) => (
            <div key={message.id} className={`${styles.row} ${styles.right}`}>
              {message.photo ? (
                <div className={`${styles.bubble} ${styles.mine} ${styles.bubblePhoto}`}>
                  <PhotoMessage message={message} mine />
                  <span className={styles.pendingStatus}>{t("messages.photoSending")}</span>
                </div>
              ) : (
                <div className={`${styles.bubble} ${styles.mine} ${styles.pending}`}>
                  {message.content}
                  <span className={styles.pendingStatus}>{t("messages.sending")}</span>
                </div>
              )}
            </div>
          ))}

          {typing && (
            <div
              className={`${styles.row} ${styles.left}`}
              role="status"
              aria-label={t("messages.typingLabel", { name: partner?.first_name || "" })}
            >
              <div className={`${styles.bubble} ${styles.theirs} ${styles.typingBubble}`}>
                <span className={styles.typingDots} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            </div>
          )}

          {newBelow && (
            <button type="button" className={styles.newBelow} onClick={() => scrollToLatest()}>
              {t("messages.newBelow")}
              <Icon name="chevron-down" size={16} />
            </button>
          )}
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
          {partner && !waitingForHer && (
            <button
              type="button"
              className={styles.suggestBtn}
              onClick={() => setSuggestOpen(true)}
              title={t("offers.suggestSpot")}
              aria-label={t("offers.suggestSpot")}
            >
              <Icon name="map-pin" size={20} />
            </button>
          )}
          {partner && !waitingForHer && (
            <>
              <button
                type="button"
                className={`${styles.photoBtn} ${photosAllowed ? "" : styles.photoBtnLocked}`}
                onClick={choosePhoto}
                disabled={sendingPhoto}
                title={t("messages.sendPhoto")}
                aria-label={t("messages.sendPhoto")}
              >
                <Icon name="image" size={20} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={sendPhoto} />
            </>
          )}
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => updateText(e.target.value)}
            placeholder={
              waitingForHer ? t("firstMove.waitPlaceholder", { name: partner?.first_name || "" }) : t("messages.placeholder")
            }
            className={styles.input}
            autoComplete="off"
            disabled={waitingForHer}
          />
          <button type="submit" className={styles.button} disabled={!text.trim()}>
            {t("messages.send")}
          </button>
        </form>

        {viewer && (
          <div className={styles.viewer} role="dialog" aria-modal="true" onClick={() => setViewer(null)}>
            <img src={IMG.full(viewer.url)} alt="" className={styles.viewerImage} onClick={(e) => e.stopPropagation()} />
            <div className={styles.viewerBar}>
              {!viewer.mine && partner ? (
                // Reporting lives on their profile, like for any message.
                <Link to={`/profile/${partner.id}`} state={{ matched: true }} className={styles.viewerAction}>
                  <Icon name="flag" size={17} />
                  {t("messages.photoReport")}
                </Link>
              ) : (
                <span />
              )}
              <button
                type="button"
                className={styles.viewerClose}
                onClick={() => setViewer(null)}
                aria-label={t("messages.photoClose")}
                autoFocus
              >
                <Icon name="x" size={26} />
              </button>
            </div>
          </div>
        )}

        {suggestOpen && partner && (
          <SpotSuggester
            partner={partner}
            token={token}
            onClose={() => setSuggestOpen(false)}
            onSent={(message) => {
              setSuggestOpen(false);
              atBottom.current = true;
              setMessages((cur) => (cur.some((m) => m.id === message.id) ? cur : [...cur, message]));
            }}
          />
        )}
      </div>
    </>
  );

  // On a computer: the chat list on the left, like WhatsApp Web.
  if (!wide) return page;
  return (
    <div className={styles.desktopPage}>
      <PageNav hideTabBar />
      <div className={styles.desktopBody}>
        <aside className={styles.side}>
          <ConversationList compact activeConversationId={conversationId} />
        </aside>
        <div className={styles.desktopMain}>{page}</div>
      </div>
    </div>
  );
}

export default ChatPage;
