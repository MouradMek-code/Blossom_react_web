import { useCallback, useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./ChatPage.module.css";
import PageNav from "../components/PageNav";

import { BASE_URL } from "../api/config";
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
  const { conversationId } = useParams();

  const token = sessionStorage.getItem("token");
  const profileId = sessionStorage.getItem("profile_id");

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const bottomRef = useRef(null);

  const loadMessages = useCallback(async () => {
    const resp = await fetch(
      `${BASE_URL}/messages/conversation/${conversationId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const data = await resp.json();
    setMessages(data);
  }, [conversationId, token]);

  useEffect(() => {
    loadMessages();

    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!text.trim()) return;
    setError("");

    const resp = await fetch(
      `${BASE_URL}/messages/conversation/${conversationId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: text }),
      },
    );

    const data = await resp.json();

    if (!resp.ok) {
      setError(data.detail || "Failed to send message");
      return;
    }

    setMessages((prev) => [...prev, data]);
    setText("");
  }

  return (
    <>
      (
      <div className={styles.chatContainer}>
        <PageNav />
        <div className={styles.header}>💬 Conversation</div>

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

          <div ref={bottomRef} />
        </div>

        {error !== "" && (
          <p style={{ color: "#e11d48", textAlign: "center", padding: "0 12px" }}>
            {error}
          </p>
        )}

        <div className={styles.inputBox}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type message..."
            className={styles.input}
          />
          <button onClick={sendMessage} className={styles.button}>
            Send
          </button>
        </div>
      </div>
      )
    </>
  );
}

export default ChatPage;
