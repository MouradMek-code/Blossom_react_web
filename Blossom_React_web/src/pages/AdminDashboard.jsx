import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import { BASE_URL } from "../api/config";
import { IMG } from "../api/images";
import {
  actionChips,
  breakdownLabel,
  clockTime,
  compact,
  delta,
  durationLabel,
  localDay,
  longDate,
  niceMax,
  placeLabel,
  shiftDay,
  shortDate,
  tzOffsetMinutes,
} from "../api/dashboardLabels";
import styles from "./AdminDashboard.module.css";

const PERIODS = [7, 30, 90];

// Admins only: who visits Blossom (admins never counted; a member once per
// period, anyone without a profile at every visit) and how many finish a
// profile. The numbers come from GET /analytics/dashboard.
export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  // "period": the overview over 7/30/90 days; "day": one day in detail.
  const [mode, setMode] = useState("period");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    const token = sessionStorage.getItem("token");
    if (!token || token === "null") {
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${BASE_URL}/analytics/dashboard?days=${days}&tz_offset=${tzOffsetMinutes()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.status === 403 || resp.status === 401) {
        navigate("/");
        return;
      }
      if (!resp.ok) throw new Error(`dashboard ${resp.status}`);
      setData(await resp.json());
      setUpdatedAt(new Date());
      setError("");
    } catch {
      setError(t("dashboard.loadError"));
    } finally {
      setLoading(false);
    }
  }, [days, navigate, t]);

  useEffect(() => {
    load();
  }, [load]);

  const k = data?.kpis;

  return (
    <div className={styles.page}>
      <PageNav />
      <main className={styles.wrap}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>📊 {t("dashboard.title")}</h1>
            <p className={styles.subtitle}>{t("dashboard.subtitle")}</p>
          </div>
          <div className={styles.headerActions}>
            <Link to="/admin" className={styles.linkBtn}>{t("dashboard.membersLink")}</Link>
            <Link to="/admin/promos" className={styles.linkBtn}>{t("offers.tab")}</Link>
            <div className={styles.segmented} role="tablist" aria-label={t("dashboard.period")}>
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={mode === "period" && days === p}
                  className={mode === "period" && days === p ? styles.segActive : styles.seg}
                  onClick={() => {
                    setMode("period");
                    setDays(p);
                  }}
                >
                  {t("dashboard.periodDays", { count: p })}
                </button>
              ))}
              <button
                type="button"
                role="tab"
                aria-selected={mode === "day"}
                className={mode === "day" ? styles.segActive : styles.seg}
                onClick={() => setMode("day")}
              >
                {t("dashboard.dayTab")}
              </button>
            </div>
          </div>
        </header>

        {mode === "day" ? (
          <DayView t={t} language={i18n.language} />
        ) : (
          <>
            {error && (
              <p className={styles.error}>
                {error}{" "}
                <button type="button" className={styles.retry} onClick={load}>{t("dashboard.retry")}</button>
              </p>
            )}

            {!data ? (
              <p className={styles.loading}>{t("dashboard.loading")}</p>
            ) : (
              <div className={loading ? styles.refreshing : undefined}>
                {/* Hero + today */}
                <section className={`${styles.card} ${styles.hero}`}>
                  <div>
                    <p className={styles.heroLabel}>{t("dashboard.visitors")} · {t("dashboard.periodDays", { count: days })}</p>
                    <p className={styles.heroValue}>{compact(k.visitors.value)}</p>
                    <Delta d={delta(k.visitors.value, k.visitors.previous, { t })} days={days} t={t} />
                    <p className={styles.heroExplain}>
                      {t("dashboard.visitorsExplain", { members: k.members.value, visits: k.anonymous.value })}
                    </p>
                  </div>
                  <div className={styles.today}>
                    <p className={styles.todayLabel}>{t("dashboard.today")}</p>
                    <p className={styles.todayValue}>{data.today.visitors}</p>
                    <p className={styles.todayLine}>
                      {t("dashboard.todayLine", {
                        members: data.today.members,
                        visits: data.today.anonymous,
                        newProfiles: data.today.new_profiles,
                      })}
                    </p>
                  </div>
                </section>

                {/* KPI tiles */}
                <section className={styles.tiles}>
                  <Tile label={t("dashboard.members")} hint={t("dashboard.membersHint")} value={compact(k.members.value)}
                    d={delta(k.members.value, k.members.previous, { t })} days={days} t={t} />
                  <Tile label={t("dashboard.anonymous")} hint={t("dashboard.anonymousHint")} value={compact(k.anonymous.value)}
                    d={delta(k.anonymous.value, k.anonymous.previous, { t })} days={days} t={t} />
                  <Tile label={t("dashboard.newProfiles")} hint={t("dashboard.newProfilesHint")} value={compact(k.new_profiles.value)}
                    d={delta(k.new_profiles.value, k.new_profiles.previous, { t })} days={days} t={t} />
                  <Tile label={t("dashboard.signupRate")} hint={t("dashboard.signupRateHint")}
                    value={k.signup_rate.value == null ? "—" : `${k.signup_rate.value}%`}
                    d={delta(k.signup_rate.value, k.signup_rate.previous, { points: true, t })} days={days} t={t} />
                </section>

                <DailyChart daily={data.daily} t={t} language={i18n.language} />

                <div className={styles.grid2}>
                  <NewProfilesChart daily={data.daily} t={t} language={i18n.language} />
                  <HoursChart hours={data.hours} t={t} />
                </div>

                <div className={styles.grid2}>
                  <Funnel steps={data.funnel} t={t} />
                  <Community c={data.community} t={t} />
                </div>

                <div className={styles.grid2}>
                  <Breakdown title={t("dashboard.platforms")} kind="platforms" items={data.platforms} t={t} />
                  <Breakdown title={t("dashboard.languages")} kind="languages" items={data.languages} t={t} />
                  <Breakdown title={t("dashboard.regions")} kind="timezones" items={data.timezones} t={t} />
                  <Breakdown title={t("dashboard.entries")} kind="entries" items={data.entries} t={t} />
                </div>

                <p className={styles.footnote}>
                  {t("dashboard.footnote")}
                  {updatedAt && <> · {t("dashboard.updated", { time: updatedAt.toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" }) })}</>}
                  {" · "}
                  <button type="button" className={styles.retry} onClick={load}>{t("dashboard.refresh")}</button>
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Delta({ d, days, t }) {
  if (!d) return <p className={styles.deltaFlat}>&nbsp;</p>;
  const cls = d.direction === "up" ? styles.deltaUp : d.direction === "down" ? styles.deltaDown : styles.deltaFlat;
  const arrow = d.direction === "up" ? "▲" : d.direction === "down" ? "▼" : "•";
  return (
    <p className={cls}>
      <span aria-hidden="true">{arrow}</span> {d.text}{" "}
      <span className={styles.deltaVs}>{t("dashboard.vsPrevious", { count: days })}</span>
    </p>
  );
}

function Tile({ label, hint, value, d, days, t }) {
  return (
    <div className={styles.tile}>
      <p className={styles.tileLabel}>{label}</p>
      <p className={styles.tileValue}>{value}</p>
      <Delta d={d} days={days} t={t} />
      <p className={styles.tileHint}>{hint}</p>
    </div>
  );
}

// Members (rose) + visits without a profile (blue), stacked per day.
function DailyChart({ daily, t, language }) {
  const [active, setActive] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const max = niceMax(Math.max(0, ...daily.map((d) => d.members + d.anonymous)));
  const labelEvery = Math.ceil(daily.length / 6);
  const empty = daily.every((d) => d.members + d.anonymous === 0);
  const current = active != null ? daily[active] : null;

  return (
    <section className={styles.card}>
      <div className={styles.cardHead}>
        <h2 className={styles.cardTitle}>{t("dashboard.daily")}</h2>
        <div className={styles.legend}>
          <span><i className={styles.swatchMembers} /> {t("dashboard.legendMembers")}</span>
          <span><i className={styles.swatchAnon} /> {t("dashboard.legendAnonymous")}</span>
        </div>
      </div>

      {empty ? (
        <p className={styles.empty}>{t("dashboard.noData")}</p>
      ) : (
        <div className={styles.chart} onMouseLeave={() => setActive(null)}>
          <div className={styles.yAxis}>
            <span>{compact(max)}</span>
            <span>{Number.isInteger(max / 2) ? compact(max / 2) : ""}</span>
            <span>0</span>
          </div>
          <div className={styles.plot}>
            <div className={styles.gridTop} />
            <div className={styles.gridMid} />
            <div className={styles.columns}>
              {daily.map((d, i) => (
                <button
                  key={d.date}
                  type="button"
                  className={`${styles.colSlot} ${active === i ? styles.colActive : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  aria-label={`${shortDate(d.date, language)}: ${d.members} ${t("dashboard.legendMembers")}, ${d.anonymous} ${t("dashboard.legendAnonymous")}`}
                >
                  <span className={styles.stack} style={{ height: `${((d.members + d.anonymous) / max) * 100}%` }}>
                    {d.anonymous > 0 && <span className={styles.segAnon} style={{ flexGrow: d.anonymous }} />}
                    {d.members > 0 && <span className={styles.segMembers} style={{ flexGrow: d.members }} />}
                  </span>
                </button>
              ))}
            </div>
            {current && (
              <div
                className={styles.tooltip}
                style={{ left: `${((active + 0.5) / daily.length) * 100}%` }}
                role="status"
              >
                <strong>{shortDate(current.date, language)}</strong>
                <span><i className={styles.swatchMembers} /> {current.members} {t("dashboard.legendMembers")}</span>
                <span><i className={styles.swatchAnon} /> {current.anonymous} {t("dashboard.legendAnonymous")}</span>
                <span className={styles.tooltipMuted}>{t("dashboard.newProfilesCount", { count: current.new_profiles })}</span>
              </div>
            )}
            <div className={styles.xAxis}>
              {daily.map((d, i) => (
                <span key={d.date}>{i % labelEvery === 0 || i === daily.length - 1 ? shortDate(d.date, language) : ""}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      <button type="button" className={styles.tableToggle} onClick={() => setShowTable((v) => !v)}>
        {showTable ? t("dashboard.hideTable") : t("dashboard.showTable")}
      </button>
      {showTable && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("dashboard.tableDate")}</th>
                <th>{t("dashboard.legendMembers")}</th>
                <th>{t("dashboard.legendAnonymous")}</th>
                <th>{t("dashboard.newProfiles")}</th>
              </tr>
            </thead>
            <tbody>
              {[...daily].reverse().map((d) => (
                <tr key={d.date}>
                  <td>{shortDate(d.date, language)}</td>
                  <td>{d.members}</td>
                  <td>{d.anonymous}</td>
                  <td>{d.new_profiles}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// One series: the title names it, so no legend.
function ColumnChart({ title, hint, values, labels, tooltip, labelEvery, className }) {
  const [active, setActive] = useState(null);
  const max = niceMax(Math.max(0, ...values));
  return (
    <section className={styles.card}>
      <div className={styles.cardHead}>
        <h2 className={styles.cardTitle}>{title}</h2>
        {hint && <p className={styles.cardHint}>{hint}</p>}
      </div>
      <div className={styles.chartSmall} onMouseLeave={() => setActive(null)}>
        <div className={styles.yAxis}>
          <span>{compact(max)}</span>
          <span>0</span>
        </div>
        <div className={styles.plot}>
          <div className={styles.gridTop} />
          <div className={styles.columns}>
            {values.map((v, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.colSlot} ${active === i ? styles.colActive : ""}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                aria-label={tooltip(i)}
              >
                <span className={styles.stack} style={{ height: `${(v / max) * 100}%` }}>
                  {v > 0 && <span className={className} style={{ flexGrow: 1 }} />}
                </span>
              </button>
            ))}
          </div>
          {active != null && (
            <div className={styles.tooltip} style={{ left: `${((active + 0.5) / values.length) * 100}%` }} role="status">
              {tooltip(active)}
            </div>
          )}
          <div className={styles.xAxis}>
            {labels.map((l, i) => (
              <span key={i}>{i % labelEvery === 0 || i === labels.length - 1 ? l : ""}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function NewProfilesChart({ daily, t, language }) {
  return (
    <ColumnChart
      title={t("dashboard.dailyNew")}
      hint={t("dashboard.newProfilesHint")}
      values={daily.map((d) => d.new_profiles)}
      labels={daily.map((d) => shortDate(d.date, language))}
      labelEvery={Math.ceil(daily.length / 4)}
      tooltip={(i) => `${shortDate(daily[i].date, language)} · ${t("dashboard.newProfilesCount", { count: daily[i].new_profiles })}`}
      className={styles.segMembers}
    />
  );
}

function HoursChart({ hours, t }) {
  return (
    <ColumnChart
      title={t("dashboard.hours")}
      hint={t("dashboard.hoursHint")}
      values={hours}
      labels={hours.map((_, h) => `${String(h).padStart(2, "0")}h`)}
      labelEvery={6}
      tooltip={(h) => `${String(h).padStart(2, "0")}:00–${String(h).padStart(2, "0")}:59 · ${t("dashboard.visitsCount", { count: hours[h] })}`}
      className={styles.segAll}
    />
  );
}

function Breakdown({ title, kind, items, t }) {
  const total = items.reduce((sum, x) => sum + x.value, 0);
  const max = Math.max(1, ...items.map((x) => x.value));
  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{title}</h2>
      {total === 0 ? (
        <p className={styles.empty}>{t("dashboard.noData")}</p>
      ) : (
        <ul className={styles.bars}>
          {items.map((x) => (
            <li key={x.key} className={styles.barRow}>
              <span className={styles.barLabel} title={x.key}>{breakdownLabel(kind, x.key, t)}</span>
              <span className={styles.barTrack}>
                <span className={styles.barFill} style={{ width: `${(x.value / max) * 100}%` }} />
              </span>
              <span className={styles.barValue}>
                {x.value} <span className={styles.barPct}>{Math.round((x.value / total) * 100)}%</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Funnel({ steps, t }) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{t("dashboard.funnel")}</h2>
      <ol className={styles.funnel}>
        {steps.map((s, i) => {
          const prev = i > 0 ? steps[i - 1].value : null;
          const rate = prev ? Math.round((s.value / prev) * 100) : null;
          return (
            <li key={s.key} className={styles.funnelRow}>
              <div className={styles.funnelTop}>
                <span>{t(`dashboard.funnel_${s.key}`)}</span>
                <span className={styles.funnelValue}>
                  {s.value}
                  {rate != null && <span className={styles.funnelRate}> · {rate}%</span>}
                </span>
              </div>
              <span className={styles.barTrack}>
                <span className={styles.funnelFill} style={{ width: `${(s.value / max) * 100}%` }} />
              </span>
            </li>
          );
        })}
      </ol>
      <p className={styles.cardHint}>{t("dashboard.funnelHint")}</p>
    </section>
  );
}

function Community({ c, t }) {
  const items = [
    [t("dashboard.membersTotal"), c.members_total],
    [t("dashboard.finishedTotal"), c.finished_total],
    [t("dashboard.activeWeek"), c.active_week],
    [t("dashboard.returning"), c.returning],
    [t("dashboard.visitsPerMember"), c.visits_per_member],
  ];
  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{t("dashboard.community")}</h2>
      <dl className={styles.community}>
        {items.map(([label, value]) => (
          <div key={label} className={styles.communityItem}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// ---- One day in detail -----------------------------------------------------------

const FILTERS = ["all", "members", "visitors"];

// Everyone who came on one day: who they are, when, how long, the pages they
// saw, and what members did (counts only). GET /analytics/day.
function DayView({ t, language }) {
  const navigate = useNavigate();
  const today = localDay();
  const [day, setDay] = useState(today);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    const token = sessionStorage.getItem("token");
    if (!token || token === "null") {
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${BASE_URL}/analytics/day?day=${day}&tz_offset=${tzOffsetMinutes()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.status === 401 || resp.status === 403) {
        navigate("/");
        return;
      }
      if (!resp.ok) throw new Error(`day ${resp.status}`);
      setData(await resp.json());
      setError("");
    } catch {
      setError(t("dashboard.loadError"));
    } finally {
      setLoading(false);
    }
  }, [day, navigate, t]);

  useEffect(() => {
    load();
  }, [load]);

  const people = data?.people || [];
  const counts = {
    all: people.length,
    members: people.filter((p) => p.member).length,
    visitors: people.filter((p) => !p.member).length,
  };
  const shown = people.filter((p) => filter === "all" || (filter === "members" ? p.member : !p.member));
  const totals = data?.totals;

  return (
    <div>
      <div className={styles.dayNav}>
        <button
          type="button"
          className={styles.dayArrow}
          onClick={() => setDay(shiftDay(day, -1))}
          aria-label={t("dashboard.dayPrev")}
          title={t("dashboard.dayPrev")}
        >
          ‹
        </button>
        <div className={styles.dayCenter}>
          <strong className={styles.dayTitle}>{longDate(day, language)}</strong>
          <input
            type="date"
            className={styles.dayInput}
            value={day}
            max={today}
            onChange={(e) => e.target.value && setDay(e.target.value)}
          />
        </div>
        <button
          type="button"
          className={styles.dayArrow}
          onClick={() => setDay(shiftDay(day, 1))}
          disabled={day >= today}
          aria-label={t("dashboard.dayNext")}
          title={t("dashboard.dayNext")}
        >
          ›
        </button>
        {day !== today && (
          <button type="button" className={styles.linkBtn} onClick={() => setDay(today)}>
            {t("dashboard.dayToday")}
          </button>
        )}
      </div>

      {error && (
        <p className={styles.error}>
          {error}{" "}
          <button type="button" className={styles.retry} onClick={load}>{t("dashboard.retry")}</button>
        </p>
      )}

      {!data ? (
        <p className={styles.loading}>{t("dashboard.loading")}</p>
      ) : (
        <div className={loading ? styles.refreshing : undefined}>
          <section className={styles.tiles}>
            <DayTile label={t("dashboard.dayPeople")} value={totals.people}
              line={t("dashboard.dayPeopleLine", { members: totals.members, visitors: totals.visitors })} />
            <DayTile label={t("dashboard.dayVisits")} value={totals.visits}
              line={t("dashboard.dayVisitsLine", { app: totals.app, web: totals.web })} />
            <DayTile label={t("dashboard.dayTime")} value={durationLabel(totals.seconds, t)}
              line={t("dashboard.dayTimeLine", { pages: totals.pages })} />
            <DayTile label={t("dashboard.dayNew")} value={totals.new_profiles}
              line={t("dashboard.dayNewLine", { accounts: totals.new_accounts })} />
          </section>

          <ColumnChart
            title={t("dashboard.dayHours")}
            hint={t("dashboard.hoursHint")}
            values={data.hours}
            labels={data.hours.map((_, h) => `${String(h).padStart(2, "0")}h`)}
            labelEvery={6}
            tooltip={(h) => `${String(h).padStart(2, "0")}:00–${String(h).padStart(2, "0")}:59 · ${t("dashboard.visitsCount", { count: data.hours[h] })}`}
            className={styles.segAll}
          />

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>{t("dashboard.dayWho")}</h2>
              <div className={styles.segmented} role="tablist">
                {FILTERS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={filter === key}
                    className={filter === key ? styles.segActive : styles.seg}
                    onClick={() => setFilter(key)}
                  >
                    {t(`dashboard.filter${key[0].toUpperCase()}${key.slice(1)}`)} · {counts[key]}
                  </button>
                ))}
              </div>
            </div>
            {shown.length === 0 ? (
              <p className={styles.empty}>{t("dashboard.dayEmpty")}</p>
            ) : (
              <div className={styles.people}>
                {shown.map((person) => (
                  <PersonCard key={person.key} person={person} t={t} language={language} />
                ))}
              </div>
            )}
            {data.truncated && <p className={styles.cardHint}>{t("dashboard.dayTruncated")}</p>}
          </section>

          <p className={styles.footnote}>
            {t("dashboard.dayPrivacy")}{" · "}
            <button type="button" className={styles.retry} onClick={load}>{t("dashboard.refresh")}</button>
          </p>
        </div>
      )}
    </div>
  );
}

function DayTile({ label, value, line }) {
  return (
    <div className={styles.tile}>
      <p className={styles.tileLabel}>{label}</p>
      <p className={styles.tileValue}>{value}</p>
      <p className={styles.tileHint}>{line}</p>
    </div>
  );
}

// One person on that day: who, when, how long, what they did, and each visit's path.
function PersonCard({ person, t, language }) {
  const member = person.member;
  const chips = actionChips(person.actions, t);
  const range =
    person.first_at && clockTime(person.first_at, language) !== clockTime(person.last_at, language)
      ? `${clockTime(person.first_at, language)}–${clockTime(person.last_at, language)}`
      : clockTime(person.first_at, language);
  return (
    <article className={styles.person}>
      <div className={styles.personHead}>
        {member?.photo ? (
          <img className={styles.personAvatar} src={IMG.thumb(member.photo)} alt="" />
        ) : (
          <span className={`${styles.personAvatar} ${styles.personAvatarEmpty}`} aria-hidden="true">
            {member ? "🌸" : "👤"}
          </span>
        )}
        <div className={styles.personWho}>
          {member ? (
            <Link to={`/profile/${member.id}`} className={styles.personName}>
              {member.first_name}
            </Link>
          ) : (
            <span className={styles.personName}>{t("dashboard.visitor", { id: person.device || "—" })}</span>
          )}
          <span className={styles.personMeta}>
            {member
              ? [member.age, member.city].filter(Boolean).join(" · ")
              : person.returning
                ? t("dashboard.dayReturning")
                : t("dashboard.dayFirstTime")}
          </span>
        </div>
        {person.first_at && (
          <div className={styles.personWhen}>
            <strong>{range}</strong>
            <span>
              {durationLabel(person.seconds, t)} · {person.platforms.map((p) => t(`dashboard.${p}`)).join(" + ")}
              {person.language ? ` · ${person.language.toUpperCase()}` : ""}
            </span>
          </div>
        )}
      </div>
      {chips.length > 0 && (
        <div className={styles.chips}>
          {chips.map((chip) => (
            <span key={chip} className={styles.chip}>{chip}</span>
          ))}
        </div>
      )}
      {person.visits.length === 0 ? (
        <p className={styles.cardHint}>{t("dashboard.noVisit")}</p>
      ) : (
        person.visits.map((visit) => <VisitPath key={visit.start} visit={visit} t={t} language={language} />)
      )}
    </article>
  );
}

// "📱 14:05  Home → Browse → A profile → A chat" - long paths folded in the middle.
function VisitPath({ visit, t, language }) {
  const [open, setOpen] = useState(false);
  const pages = visit.pages;
  const long = pages.length > 10;
  const shown = long && !open ? [...pages.slice(0, 4), null, ...pages.slice(-4)] : pages;
  return (
    <div className={styles.visitRow}>
      <span className={styles.visitWhen}>
        {visit.platform === "app" ? "📱" : "💻"} {clockTime(visit.start, language)}
      </span>
      <ol className={styles.path}>
        {shown.map((page, i) =>
          page ? (
            <li key={`${page.at}-${i}`} className={styles.pathStep} title={clockTime(page.at, language)}>
              {placeLabel(page.path)}
            </li>
          ) : (
            <li key="more" className={styles.pathStep}>
              <button type="button" className={styles.pathMore} onClick={() => setOpen(true)}
                title={t("dashboard.showAllPages", { count: pages.length })}>
                +{pages.length - 8}
              </button>
            </li>
          ),
        )}
      </ol>
      {long && open && (
        <button type="button" className={styles.tableToggle} onClick={() => setOpen(false)}>
          {t("dashboard.showLess")}
        </button>
      )}
    </div>
  );
}
