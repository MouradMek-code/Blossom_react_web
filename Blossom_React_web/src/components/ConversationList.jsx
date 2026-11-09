import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BASE_URL } from "../api/config";
import { IMG } from "../api/images";
import { NETWORK_ERROR, postJson } from "../api/errors";
import { shortTime } from "../api/chatTime";
import { Button, EmptyState, Icon, SkeletonRows } from "../ui";
import styles from "../pages/Messages.module.css";

// Refresh while it's on screen, so new messages and badges show up without
// a reload (there's no push channel).
const REFRESH_MS = 10000;

// The chats: the "Likes you" circle and new matches on top, then the
// conversations. The Chats page shows it on its own on a phone; on a computer
// it sits on the left of the open conversation (`compact`), like WhatsApp Web.
export default function ConversationList({ compact = false, activeConversationId }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const [items, setItems] = useState(null); // null while loading
  const [error, setError] = useState("");
  const [openingId, setOpeningId] = useState(null);
  // The "Likes you" circle: how many, how many new, a few photos to blur.
  const [likes, setLikes] = useState({ total: 0, new: 0, photos: [] });

  const load = useCallback(async () => {
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [resp, likesResp] = await Promise.all([
        fetch(`${BASE_URL}/messages/inbox`, { headers }),
        fetch(`${BASE_URL}/likes/profile_likes/summary`, { headers }).catch(() => null),
      ]);
      if (resp.status === 401) {
        navigate("/login");
        return;
      }
      setItems(resp.ok ? await resp.json() : []);
      if (likesResp?.ok) setLikes(await likesResp.json());
      setError("");
    } catch {
      setError(NETWORK_ERROR);
      setItems((cur) => cur || []);
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token || token === "null" || token === "undefined") {
      navigate("/login");
      return undefined;
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
  // Women write first: the new matches waiting for her hello.
  const yourMove = newMatches.filter((item) => item.your_move);
  const conversations = (items || []).filter((item) => item.last_message);

  return (
    <div className={compact ? styles.compact : undefined}>
      <h1 className={styles.title}>{t("messages.title")}</h1>
      {!compact && <p className={styles.subtitle}>{t("messages.subtitle")}</p>}

      {error !== "" && <p className={styles.error}>{error}</p>}

      {/* Likes and new matches, always on top: the "Likes you" circle
          first (their photos blurred - tap to see who), then the faces of
          new matches nobody has written to yet. */}
      {yourMove.length > 0 && (
        <p className={styles.firstMoveBanner}>
          <Icon name="message-circle" size={18} />
          <span>
            {yourMove.length === 1
              ? t("firstMove.bannerOne", { name: yourMove[0].profile.first_name })
              : t("firstMove.bannerMany", { count: yourMove.length })}
          </span>
        </p>
      )}

      <section className={styles.matchesBlock}>
        <h2 className={styles.sectionTitle}>{t("messages.circlesTitle")}</h2>
        <ul className={styles.matchesRow}>
          <li>
            <Link to="/liked_you" className={styles.matchItem}>
              <span className={styles.likesWrap} aria-hidden="true">
                <span className={`${styles.likesCircle} ${likes.total > 0 ? styles.likesCircleOn : ""}`}>
                  {likes.photos[0] && <img className={styles.likesBlur} src={IMG.thumb(likes.photos[0])} alt="" />}
                  <span className={styles.likesHeart}>❤️</span>
                </span>
                {likes.total > 0 && (
                  <span className={styles.likesCount}>{likes.total > 99 ? "99+" : likes.total}</span>
                )}
              </span>
              <span className={styles.matchName}>{t("messages.likesCircle")}</span>
              {likes.new > 0 && (
                <span className={styles.likesNewLabel}>{t("events.likesBannerNew", { count: likes.new })}</span>
              )}
            </Link>
          </li>
          {newMatches.length === 0 && items !== null && (
            <li className={styles.rowHint}>
              {likes.total > 0 ? t("messages.circlesLikeBack") : t("messages.circlesEmpty")}
            </li>
          )}
          {newMatches.map((item) => (
            <li key={item.profile.id}>
              <button
                type="button"
                className={styles.matchItem}
                onClick={() => open(item)}
                disabled={openingId !== null}
              >
                {item.profile.photo ? (
                  <img className={styles.matchAvatar} src={IMG.thumb(item.profile.photo)} alt={item.profile.first_name} />
                ) : (
                  <span className={`${styles.matchAvatar} ${styles.avatarEmpty}`}>🌸</span>
                )}
                <span className={styles.matchName}>{item.profile.first_name}</span>
                {/* Blossom's rule: she writes first. */}
                {item.waiting_for_them && <span className={styles.matchWaiting}>{t("messages.waitingShort")}</span>}
                {item.your_move && <span className={styles.matchYourMove}>{t("firstMove.yourMove")}</span>}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {items === null ? (
        <SkeletonRows count={compact ? 7 : 5} />
      ) : conversations.length === 0 ? (
        newMatches.length > 0 ? (
          <p className={styles.hint}>{t("messages.startChatting")}</p>
        ) : (
          <EmptyState
            icon="message-circle"
            text={t("messages.empty")}
            action={<Button to="/profiles" icon="heart">{t("messages.browse")}</Button>}
          />
        )
      ) : (
        <ul className={styles.list}>
          {conversations.map((item) => {
            const unread = item.unread_count > 0;
            const active = activeConversationId && String(item.conversation_id) === String(activeConversationId);
            return (
              <li key={item.profile.id}>
                <button
                  className={`${styles.row} ${unread ? styles.rowUnread : ""} ${active ? styles.rowActive : ""}`}
                  onClick={() => open(item)}
                  disabled={openingId !== null}
                  aria-current={active ? "page" : undefined}
                >
                  <span className={styles.avatarWrap}>
                    {item.profile.photo ? (
                      <img className={styles.avatar} src={IMG.thumb(item.profile.photo)} alt={item.profile.first_name} />
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
                      <span className={`${styles.preview} ${unread ? styles.previewUnread : ""}`}>
                        {openingId === item.profile.id ? t("messages.loading") : preview(item)}
                      </span>
                      {unread && (
                        <span className={styles.unreadBadge}>{item.unread_count > 9 ? "9+" : item.unread_count}</span>
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
  );
}
