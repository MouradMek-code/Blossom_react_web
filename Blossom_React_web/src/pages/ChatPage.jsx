import { useCallback, useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import styles from "./ChatPage.module.css";
import PageNav from "../components/PageNav";

import { BASE_URL } from "../api/config";

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
                  }`}
                >
                  {message.content}
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
