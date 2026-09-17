import { useCallback, useEffect, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./ChatPage.module.css";
import PageNav from "../components/PageNav";

import { BASE_URL } from "../api/config";
import { postJson } from "../api/errors";
import { IMG } from "../api/images";
import { categoryEmoji, categoryGradient, shortPlace } from "../api/categories";

// A date spot sent with "Invite a match": the message text plus a tappable
// card for the place.
function InviteCard({ message, mine }) {
  const { t } = useTranslation();
  const spot = message.date_spot;
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
    </div>
  );
}

function ChatPage() {
  const { t } = useTranslation();
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const token = sessionStorage.getItem("token");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [messages, setMessages] = useState([]);
  // Messages already shown in the chat but still on their way to the server.
  const [pending, setPending] = useState([]);
  const [details, setDetails] = useState(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

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

  // Clicking away from the chat menu, or pressing Escape, closes it.
  useEffect(() => {
    if (!menuOpen) return undefined;
    function onPointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  // Unmatching lives here now that there's no separate matches page. The
  // server deletes the conversation with it, so there's a confirmation first.
  async function handleUnmatch() {
    setMenuOpen(false);
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
            <Link to={`/profile/${partner.id}`} className={styles.partner}>
              {partner.photo ? (
                <img
                  className={styles.partnerPhoto}
                  src={IMG.thumb(partner.photo)}
                  alt={partner.first_name}
                />
              ) : (
                <span className={`${styles.partnerPhoto} ${styles.partnerPhotoEmpty}`}>🌸</span>
              )}
              <span className={styles.partnerText}>
                <span className={styles.partnerName}>
                  {partner.first_name}
                  {partner.age ? `, ${partner.age}` : ""}
                </span>
                <span className={styles.partnerHint}>{t("messages.viewProfile")}</span>
              </span>
            </Link>
          ) : (
            <span className={styles.partnerName}>💬</span>
          )}

          {partner && (
            <div className={styles.menuWrap} ref={menuRef}>
              <button
                type="button"
                className={styles.menuBtn}
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={t("messages.options")}
              >
                ⋮
              </button>
              {menuOpen && (
                <div className={styles.menu} role="menu">
                  <Link
                    to={`/profile/${partner.id}`}
                    className={styles.menuItem}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("messages.viewProfile")}
                  </Link>
                  <button
                    type="button"
                    className={`${styles.menuItem} ${styles.menuDanger}`}
                    role="menuitem"
                    onClick={handleUnmatch}
                  >
                    {t("messages.unmatch")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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
                    <InviteCard message={message} mine={isMine} />
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
          <p style={{ color: "#e11d48", textAlign: "center", padding: "0 12px" }}>
            {error}
          </p>
        )}

        {/* A form so Enter sends too. The button is disabled while the box is
            empty - which it is right after a send, so a second click can't
            post the same message again. */}
        <form className={styles.inputBox} onSubmit={sendMessage}>
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
      </div>
    </>
  );
}

export default ChatPage;
