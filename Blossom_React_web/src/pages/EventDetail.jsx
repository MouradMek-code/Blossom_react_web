import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import Footer from "../components/Footer";
import { BASE_URL } from "../api/config";
import { IMG } from "../api/images";
import { postJson } from "../api/errors";
import { KIND_EMOJI, KIND_GRADIENT, eventWhen } from "../api/events";
import styles from "./EventDetail.module.css";

const WOMEN = ["Woman", "Trans Woman"];

function getToken() {
  const token = sessionStorage.getItem("token");
  return token && token !== "null" && token !== "undefined" ? token : null;
}

function headers(json = false) {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

function timeOnly(iso, language) {
  try {
    return new Date(iso).toLocaleTimeString(language, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

// blossom-date.com/events/:id - the event, "I'm interested", the organiser's
// list of people to match, and the comments.
export default function EventDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const loggedIn = Boolean(getToken());
  const [event, setEvent] = useState(null);
  const [missing, setMissing] = useState("");
  const [me, setMe] = useState(null);
  const [people, setPeople] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [chats, setChats] = useState({}); // profile id -> conversation id, after a match

  const load = useCallback(async () => {
    const result = await postJson(`${BASE_URL}/events/${id}`, { headers: headers() });
    if (result.ok) {
      setEvent(result.data);
      setMissing("");
    } else {
      setMissing(result.message);
    }
  }, [id]);

  const loadPeople = useCallback(async () => {
    const result = await postJson(`${BASE_URL}/events/${id}/interested`, { headers: headers() });
    if (result.ok) setPeople(result.data);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!loggedIn) return;
    fetch(`${BASE_URL}/user/me`, { headers: headers() })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setMe(data))
      .catch(() => {});
  }, [loggedIn]);

  const isOwner = Boolean(event?.is_owner);
  const isAdmin = Boolean(me?.is_admin);
  useEffect(() => {
    if (event && (isOwner || isAdmin)) loadPeople();
  }, [event, isOwner, isAdmin, loadPeople]);

  function flash(text) {
    setNotice(text);
    setTimeout(() => setNotice(""), 2500);
  }

  async function act(url, options) {
    setBusy(true);
    setError("");
    const result = await postJson(url, { headers: headers(Boolean(options.body)), ...options });
    setBusy(false);
    if (!result.ok) setError(result.message);
    return result;
  }

  async function toggleInterest(on) {
    const result = await act(`${BASE_URL}/events/${id}/interest`, { method: on ? "POST" : "DELETE" });
    if (result.ok) setEvent(result.data);
  }

  async function answer(person, action) {
    const result = await act(`${BASE_URL}/events/${id}/interested/${person.id}/${action}`, { method: "POST" });
    if (!result.ok) return;
    if (result.data.conversation_id) setChats((c) => ({ ...c, [person.id]: result.data.conversation_id }));
    loadPeople();
    load();
  }

  async function cancel() {
    if (!window.confirm(t("events.cancelConfirm"))) return;
    const result = await act(`${BASE_URL}/events/${id}`, { method: "DELETE" });
    if (result.ok) load();
  }

  async function adminRemove() {
    if (!window.confirm(t("events.adminRemoveConfirm"))) return;
    const result = await act(`${BASE_URL}/events/${id}`, { method: "DELETE" });
    if (result.ok) navigate("/events");
  }

  async function report() {
    if (!window.confirm(t("events.reportConfirm"))) return;
    const result = await act(`${BASE_URL}/events/${id}/report`, { method: "POST", body: JSON.stringify({}) });
    if (result.ok) flash(t("events.reported"));
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text: `${t("events.shareText")} ${event.title}`, url });
        return;
      } catch {
        // cancelled: fall back to copying
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      flash(t("events.linkCopied"));
    } catch {
      window.prompt(t("events.share"), url);
    }
  }

  if (missing) {
    return (
      <div className={styles.page}>
        <PageNav />
        <main className={styles.body}>
          <div className={styles.missing}>
            <p className={styles.missingIcon}>📅</p>
            <p>{missing}</p>
            <Link to="/events" className={styles.primaryBtn}>{t("events.back")}</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className={styles.page}>
        <PageNav />
        <main className={styles.body}>
          <p className={styles.muted}>{t("dashboard.loading")}</p>
        </main>
      </div>
    );
  }

  const language = i18n.language;
  const [from, to] = KIND_GRADIENT[event.kind] || KIND_GRADIENT.group;
  const womanOnlyBlocked = event.women_only && !isOwner && me && !WOMEN.includes(me.gender);
  const status = event.status !== "active" ? "cancelled" : event.past ? "past" : null;

  return (
    <div className={styles.page}>
      <PageNav />
      <main className={styles.body}>
        <Link to="/events" className={styles.back}>← {t("events.back")}</Link>

        <article className={styles.card}>
          <div className={styles.media}>
            {event.image_url ? (
              <img src={IMG.full(event.image_url)} alt="" />
            ) : (
              <span className={styles.noImage} style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
                {KIND_EMOJI[event.kind]}
              </span>
            )}
            <span className={styles.kindPill}>
              {KIND_EMOJI[event.kind]} {t(`events.kind_${event.kind}`)}
            </span>
          </div>

          <div className={styles.content}>
            {status && <p className={styles.statusBar}>{t(`events.${status}`)}</p>}
            <h1 className={styles.title}>{event.title}</h1>

            <ul className={styles.facts}>
              <li>
                <span>🕒</span>
                <strong>
                  {eventWhen(event.starts_at, language)}
                  {event.ends_at && ` – ${timeOnly(event.ends_at, language)}`}
                </strong>
              </li>
              <li>
                <span>📍</span>
                <span>
                  <strong>{event.place_name}</strong> · {event.city}
                  {event.map_url && (
                    <>
                      {" "}
                      <a href={event.map_url} target="_blank" rel="noopener noreferrer" className={styles.mapLink}>
                        🗺️ Google Maps
                      </a>
                    </>
                  )}
                </span>
              </li>
              {event.spot?.offer && (
                <li className={styles.giftFact}>
                  <span>🎁</span>
                  <Link to={`/date-spots/${event.spot.id}`}>
                    {t("events.giftHere", { title: event.spot.offer.title })}
                  </Link>
                </li>
              )}
              {event.spot && !event.spot.offer && (
                <li>
                  <span>🌸</span>
                  <Link to={`/date-spots/${event.spot.id}`}>{t("events.atSpot", { name: event.spot.name })}</Link>
                </li>
              )}
              {event.max_people && (
                <li>
                  <span>👥</span>
                  {t("events.upTo", { count: event.max_people })}
                </li>
              )}
              {event.languages.length > 0 && (
                <li>
                  <span>🗣️</span>
                  <span className={styles.langs}>
                    {event.languages.map((l) => (
                      <span key={l} className={styles.lang}>{l}</span>
                    ))}
                  </span>
                </li>
              )}
              {event.women_only && (
                <li>
                  <span>👩</span>
                  {t("events.womenOnly")}
                </li>
              )}
            </ul>

            <p className={styles.description}>{event.description}</p>

            <div className={styles.organizer}>
              {event.organizer?.photo ? (
                <img src={IMG.thumb(event.organizer.photo)} alt="" />
              ) : (
                <span className={styles.avatarEmpty}>🌸</span>
              )}
              <div>
                <p className={styles.organizerName}>
                  {event.organizer?.first_name}
                  {event.organizer?.age ? `, ${event.organizer.age}` : ""}
                </p>
                <p className={styles.muted}>{t("events.organiserBadge")}</p>
              </div>
              <span className={styles.counts}>
                🙋 {event.interested_count} · 💬 {event.comment_count}
              </span>
            </div>

            {/* What the viewer can do */}
            <div className={styles.actions}>
              {!loggedIn ? (
                <>
                  <button type="button" className={styles.primaryBtn} onClick={() => navigate("/sign_up")}>
                    {t("events.visitorJoin")}
                  </button>
                  <Link to="/login" className={styles.linkBtn}>{t("nav.login")}</Link>
                </>
              ) : isOwner ? (
                event.status === "active" && (
                  <>
                    <Link to={`/events/${event.id}/edit`} className={styles.secondaryBtn}>✏️ {t("events.edit")}</Link>
                    <button type="button" className={styles.dangerBtn} onClick={cancel} disabled={busy}>
                      {t("events.cancelEvent")}
                    </button>
                  </>
                )
              ) : event.my_interest === "matched" ? (
                <div className={styles.matchedBox}>
                  <p>{t("events.matched")}</p>
                  <Link to="/messages" className={styles.primaryBtn}>{t("events.openMessages")}</Link>
                </div>
              ) : event.my_interest === "pending" ? (
                <div className={styles.interestBox}>
                  <span className={styles.interestOn}>{t("events.interestedOn")}</span>
                  <p className={styles.muted}>{t("events.interestHint")}</p>
                  {event.open && (
                    <button type="button" className={styles.linkBtn} onClick={() => toggleInterest(false)} disabled={busy}>
                      {t("events.withdraw")}
                    </button>
                  )}
                </div>
              ) : womanOnlyBlocked ? (
                <p className={styles.muted}>👩 {t("events.womenOnlyHint")}</p>
              ) : event.open ? (
                <div className={styles.interestBox}>
                  <button type="button" className={styles.primaryBtn} onClick={() => toggleInterest(true)} disabled={busy}>
                    {t("events.interested")}
                  </button>
                  <p className={styles.muted}>{t("events.interestHint")}</p>
                </div>
              ) : null}
              <div className={styles.smallActions}>
                <button type="button" className={styles.chipBtn} onClick={share}>🔗 {t("events.share")}</button>
                {loggedIn && !isOwner && (
                  <button type="button" className={styles.chipBtn} onClick={report} disabled={busy}>
                    🚩 {t("events.report")}
                  </button>
                )}
                {isAdmin && !isOwner && (
                  <button type="button" className={styles.chipDanger} onClick={adminRemove} disabled={busy}>
                    🛡️ {t("events.adminRemove")}
                  </button>
                )}
              </div>
            </div>
            {notice && <p className={styles.notice}>{notice}</p>}
            {error && <p className={styles.error}>{error}</p>}
            <p className={styles.safety}>🛡️ {t("events.safety")}</p>
          </div>
        </article>

        {(isOwner || isAdmin) && people && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t("events.interestedTitle", { count: people.length })}</h2>
            {isOwner && <p className={styles.muted}>{t("events.ownerHint")}</p>}
            {people.length === 0 ? (
              <p className={styles.empty}>{t("events.interestedEmpty")}</p>
            ) : (
              <ul className={styles.people}>
                {people.map(({ person, status: answerStatus }) => (
                  <li key={person.id} className={styles.person}>
                    <Link to={`/profile/${person.id}`} className={styles.personLink}>
                      {person.photo ? (
                        <img src={IMG.thumb(person.photo)} alt="" />
                      ) : (
                        <span className={styles.avatarEmpty}>🌸</span>
                      )}
                      <span>
                        <strong>{person.first_name}{person.age ? `, ${person.age}` : ""}</strong>
                        <span className={styles.personMeta}>
                          {[person.city, person.languages.slice(0, 3).join(" · ")].filter(Boolean).join(" — ")}
                        </span>
                      </span>
                    </Link>
                    <div className={styles.personActions}>
                      {answerStatus === "matched" ? (
                        <>
                          <span className={styles.matchedBadge}>💞 {t("events.matchedBadge")}</span>
                          <Link to={chats[person.id] ? `/chat/${chats[person.id]}` : "/messages"} className={styles.chipBtn}>
                            💬 {t("events.openChat")}
                          </Link>
                        </>
                      ) : isOwner && event.open ? (
                        <>
                          {answerStatus === "declined" && (
                            <span className={styles.declinedBadge}>{t("events.declinedBadge")}</span>
                          )}
                          <button type="button" className={styles.matchBtn} onClick={() => answer(person, "match")} disabled={busy}>
                            {t("events.match")}
                          </button>
                          {answerStatus === "pending" && (
                            <button type="button" className={styles.linkBtn} onClick={() => answer(person, "decline")} disabled={busy}>
                              {t("events.decline")}
                            </button>
                          )}
                        </>
                      ) : (
                        answerStatus === "declined" && (
                          <span className={styles.declinedBadge}>{t("events.declinedBadge")}</span>
                        )
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <Comments event={event} loggedIn={loggedIn} isAdmin={isAdmin} blocked={womanOnlyBlocked}
          onCount={(count) => setEvent((e) => ({ ...e, comment_count: count }))} />
      </main>
      <Footer />
    </div>
  );
}

function Comments({ event, loggedIn, isAdmin, blocked, onCount }) {
  const { t, i18n } = useTranslation();
  const [comments, setComments] = useState(null);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!loggedIn) return;
    const result = await postJson(`${BASE_URL}/events/${event.id}/comments`, { headers: headers() });
    if (result.ok) setComments(result.data);
    else setError(result.message);
  }, [event.id, loggedIn]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (comments) onCount(comments.filter((c) => !c.deleted).length);
  }, [comments]); // eslint-disable-line react-hooks/exhaustive-deps

  async function send(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    setError("");
    const result = await postJson(`${BASE_URL}/events/${event.id}/comments`, {
      method: "POST",
      headers: headers(true),
      body: JSON.stringify({ text: text.trim(), parent_id: replyTo?.id || null }),
    });
    setSending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setText("");
    setReplyTo(null);
    load();
  }

  async function remove(comment) {
    if (!window.confirm(t("events.deleteCommentConfirm"))) return;
    const result = await postJson(`${BASE_URL}/events/comments/${comment.id}`, { method: "DELETE", headers: headers() });
    if (result.ok) load();
    else setError(result.message);
  }

  async function report(comment) {
    if (!window.confirm(t("events.reportConfirm"))) return;
    const result = await postJson(`${BASE_URL}/events/${event.id}/report`, {
      method: "POST",
      headers: headers(true),
      body: JSON.stringify({ comment_id: comment.id }),
    });
    if (result.ok) {
      setNotice(t("events.reported"));
      setTimeout(() => setNotice(""), 2500);
    } else setError(result.message);
  }

  const threads = (comments || []).filter((c) => !c.parent_id);
  const repliesOf = (id) => (comments || []).filter((c) => c.parent_id === id);
  const canWrite = loggedIn && !blocked && event.open && (event.comments_open || event.is_owner);

  function renderComment(comment, isReply) {
    if (comment.deleted) {
      return <p className={styles.deleted}>{t("events.deletedComment")}</p>;
    }
    return (
      <div className={`${styles.comment} ${isReply ? styles.reply : ""}`}>
        {comment.author?.photo ? (
          <img src={IMG.thumb(comment.author.photo)} alt="" className={styles.commentAvatar} />
        ) : (
          <span className={`${styles.avatarEmpty} ${styles.commentAvatar}`}>🌸</span>
        )}
        <div className={styles.commentBody}>
          <p className={styles.commentHead}>
            <strong>{comment.author?.first_name}</strong>
            {comment.is_owner && <span className={styles.organiserBadge}>{t("events.organiserBadge")}</span>}
            {!comment.is_owner && comment.interested && (
              <span className={styles.interestedBadge}>{t("events.interestedBadge")}</span>
            )}
            <span className={styles.commentTime}>{eventWhen(comment.created_at, i18n.language)}</span>
          </p>
          <p className={styles.commentText}>{comment.text}</p>
          <div className={styles.commentActions}>
            {canWrite && (
              <button type="button" onClick={() => setReplyTo({ id: comment.parent_id || comment.id, name: comment.author?.first_name })}>
                {t("events.reply")}
              </button>
            )}
            {(comment.can_delete || isAdmin) && (
              <button type="button" onClick={() => remove(comment)}>{t("events.deleteComment")}</button>
            )}
            {!comment.mine && (
              <button type="button" onClick={() => report(comment)}>{t("events.report")}</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        💬 {t("events.commentsTitle")}
        {comments && ` (${comments.filter((c) => !c.deleted).length})`}
      </h2>
      {!loggedIn ? (
        <p className={styles.membersOnly}>
          🔒 {t("events.commentsMembers")} <Link to="/login">{t("nav.login")}</Link> · <Link to="/sign_up">{t("nav.signUp")}</Link>
        </p>
      ) : (
        <>
          {comments === null ? (
            <p className={styles.muted}>{t("dashboard.loading")}</p>
          ) : threads.length === 0 ? (
            <p className={styles.empty}>{t("events.noComments")}</p>
          ) : (
            <ul className={styles.thread}>
              {threads.map((comment) => (
                <li key={comment.id}>
                  {renderComment(comment, false)}
                  {repliesOf(comment.id).map((reply) => (
                    <div key={reply.id}>{renderComment(reply, true)}</div>
                  ))}
                </li>
              ))}
            </ul>
          )}
          {canWrite ? (
            <form className={styles.composer} onSubmit={send}>
              {replyTo && (
                <p className={styles.replying}>
                  ↪ {t("events.replyingTo", { name: replyTo.name })}
                  <button type="button" onClick={() => setReplyTo(null)} aria-label="×">×</button>
                </p>
              )}
              <div className={styles.composerRow}>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t("events.commentPlaceholder")}
                  maxLength={500}
                  rows={2}
                />
                <button type="submit" className={styles.primaryBtn} disabled={sending || !text.trim()}>
                  {t("events.send")}
                </button>
              </div>
            </form>
          ) : (
            <p className={styles.muted}>
              {blocked
                ? t("events.commentsWomenOnly")
                : !event.open
                  ? t("events.past")
                  : t("events.commentsClosed")}
            </p>
          )}
          {notice && <p className={styles.notice}>{notice}</p>}
          {error && <p className={styles.error}>{error}</p>}
        </>
      )}
    </section>
  );
}
