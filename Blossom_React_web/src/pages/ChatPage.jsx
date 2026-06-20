import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import styles from "./ChatPage.module.css";
import PageNav from "../components/PageNav";

const BASE_URL = "http://localhost:8000";

function ChatPage() {
  const { conversationId } = useParams();

  const token = sessionStorage.getItem("token");
  const profileId = sessionStorage.getItem("profile_id");

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const bottomRef = useRef(null);

  async function loadMessages() {
    const resp = await fetch(
      `${BASE_URL}/messages/conversation/${conversationId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const data = await resp.json();
    setMessages(data);
  }

  useEffect(() => {
    loadMessages();

    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!text.trim()) return;

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

    const newMessage = await resp.json();

    setMessages((prev) => [...prev, newMessage]);
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
