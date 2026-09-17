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
    // New matches are on display here, so they count as seen.
    fetch(`${BASE_URL}/matches/mark_seen`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
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

  // Only conversations reach the list; matches nobody has written to yet are
  // the row of faces above it.
  function preview(item) {
    const text = item.last_message.is_invite
      ? `💌 ${item.last_message.content}`
      : item.last_message.content;
    return item.last_message.mine ? `${t("messages.you")}: ${text}` : text;
  }

  const newMatches = (items || []).filter((item) => !item.last_message);
  const conversations = (items || []).filter((item) => item.last_message);

  return (
    <div className={styles.page}>
      <PageNav />
      <div className={styles.container}>
        <h1 className={styles.title}>{t("messages.title")}</h1>
        <p className={styles.subtitle}>{t("messages.subtitle")}</p>

        {error !== "" && <p className={styles.error}>{error}</p>}

        {newMatches.length > 0 && (
          <section className={styles.matchesBlock}>
            <h2 className={styles.sectionTitle}>{t("messages.newMatches")}</h2>
            <ul className={styles.matchesRow}>
              {newMatches.map((item) => (
                <li key={item.profile.id}>
                  <button
                    type="button"
                    className={styles.matchItem}
                    onClick={() => open(item)}
                    disabled={openingId !== null}
                  >
                    {item.profile.photo ? (
                      <img
                        className={styles.matchAvatar}
                        src={IMG.thumb(item.profile.photo)}
                        alt={item.profile.first_name}
                      />
                    ) : (
                      <span className={`${styles.matchAvatar} ${styles.avatarEmpty}`}>🌸</span>
                    )}
                    <span className={styles.matchName}>{item.profile.first_name}</span>
                    {/* Blossom's rule: she writes first. */}
                    {item.waiting_for_them && (
                      <span className={styles.matchWaiting}>{t("messages.waitingShort")}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {items === null ? (
          <p className={styles.muted}>{t("messages.loading")}</p>
        ) : conversations.length === 0 ? (
          newMatches.length > 0 ? (
            <p className={styles.hint}>{t("messages.startChatting")}</p>
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>💬</div>
              <p className={styles.emptyText}>{t("messages.empty")}</p>
              <button className={styles.emptyBtn} onClick={() => navigate("/profiles")}>
                {t("messages.browse")}
              </button>
            </div>
          )
        ) : (
          <ul className={styles.list}>
            {conversations.map((item) => {
              const unread = item.unread_count > 0;
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
                    </span>

                    <span className={styles.body}>
                      <span className={styles.topLine}>
                        <span className={styles.name}>
                          {item.profile.first_name}
                          {item.profile.age ? `, ${item.profile.age}` : ""}
                        </span>
                        <span className={`${styles.time} ${unread ? styles.timeUnread : ""}`}>
                          {shortTime(item.last_message.created_at)}
                        </span>
                      </span>
                      <span className={styles.bottomLine}>
                        <span
                          className={`${styles.preview} ${unread ? styles.previewUnread : ""}`}
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
