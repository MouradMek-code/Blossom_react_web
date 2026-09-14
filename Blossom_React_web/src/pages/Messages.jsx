import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import { BASE_URL } from "../api/config";
import { IMG } from "../api/images";
import { NETWORK_ERROR, postJson } from "../api/errors";
import { shortTime } from "../api/chatTime";
import styles from "./Messages.module.css";

// Refresh while the page is open, so new messages and badges show up without
// a reload (there's no push channel).
const REFRESH_MS = 10000;

function Messages() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const [items, setItems] = useState(null); // null while loading
  const [error, setError] = useState("");
  const [openingId, setOpeningId] = useState(null);

  const load = useCallback(async () => {
    try {
      const resp = await fetch(`${BASE_URL}/messages/inbox`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.status === 401) {
        navigate("/login");
        return;
      }
      setItems(resp.ok ? await resp.json() : []);
      setError("");
    } catch {
      setError(NETWORK_ERROR);
      setItems((cur) => cur || []);
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token || token === "null" || token === "undefined") {
      navigate("/login");
      return;
    }
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, [token, navigate, load]);

  // New matches have no conversation until someone opens it.
  async function open(item) {
    if (item.conversation_id) {
      navigate(`/chat/${item.conversation_id}`);
      return;
    }
    setOpeningId(item.profile.id);
    const result = await postJson(`${BASE_URL}/profile/profile/${item.profile.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setOpeningId(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    navigate(`/chat/${result.data.conversation_id}`);
  }

  function preview(item) {
    const name = item.profile.first_name;
    if (!item.last_message) {
      return item.waiting_for_them
        ? t("messages.waiting", { name })
        : t("messages.newMatch");
    }
    const text = item.last_message.is_invite
      ? `💌 ${item.last_message.content}`
      : item.last_message.content;
    return item.last_message.mine ? `${t("messages.you")}: ${text}` : text;
  }

  return (
    <div className={styles.page}>
      <PageNav />
      <div className={styles.container}>
        <h1 className={styles.title}>{t("messages.title")}</h1>
        <p className={styles.subtitle}>{t("messages.subtitle")}</p>

        {error !== "" && <p className={styles.error}>{error}</p>}

        {items === null ? (
          <p className={styles.muted}>{t("messages.loading")}</p>
        ) : items.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>💬</div>
            <p className={styles.emptyText}>{t("messages.empty")}</p>
            <button className={styles.emptyBtn} onClick={() => navigate("/profiles")}>
              {t("messages.browse")}
            </button>
          </div>
        ) : (
          <ul className={styles.list}>
            {items.map((item) => {
              const unread = item.unread_count > 0;
              const isNew = !item.last_message;
              return (
                <li key={item.profile.id}>
                  <button
                    className={`${styles.row} ${unread ? styles.rowUnread : ""}`}
                    onClick={() => open(item)}
                    disabled={openingId !== null}
                  >
                    <span className={styles.avatarWrap}>
                      {item.profile.photo ? (
                        <img
                          className={styles.avatar}
                          src={IMG.thumb(item.profile.photo)}
                          alt={item.profile.first_name}
                        />
                      ) : (
                        <span className={`${styles.avatar} ${styles.avatarEmpty}`}>🌸</span>
                      )}
                      {isNew && <span className={styles.newDot} aria-hidden="true" />}
                    </span>

                    <span className={styles.body}>
                      <span className={styles.topLine}>
                        <span className={styles.name}>
                          {item.profile.first_name}
                          {item.profile.age ? `, ${item.profile.age}` : ""}
                        </span>
                        {item.last_message && (
                          <span className={`${styles.time} ${unread ? styles.timeUnread : ""}`}>
                            {shortTime(item.last_message.created_at)}
                          </span>
                        )}
                      </span>
                      <span className={styles.bottomLine}>
                        <span
                          className={`${styles.preview} ${isNew ? styles.previewNew : ""} ${
                            unread ? styles.previewUnread : ""
                          }`}
                        >
                          {openingId === item.profile.id ? t("messages.loading") : preview(item)}
                        </span>
                        {unread && (
                          <span className={styles.unreadBadge}>
                            {item.unread_count > 9 ? "9+" : item.unread_count}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Messages;
