import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import { BASE_URL } from "../api/config";
import { breakdownLabel, compact, delta, niceMax, shortDate, tzOffsetMinutes } from "../api/dashboardLabels";
import styles from "./AdminDashboard.module.css";

const PERIODS = [7, 30, 90];

// Admins only: who visits Blossom (admins never counted; a member once per
// period, anyone without a profile at every visit) and how many finish a
// profile. The numbers come from GET /analytics/dashboard.
export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
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
            <div className={styles.segmented} role="tablist" aria-label={t("dashboard.period")}>
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={days === p}
                  className={days === p ? styles.segActive : styles.seg}
                  onClick={() => setDays(p)}
                >
                  {t("dashboard.periodDays", { count: p })}
                </button>
              ))}
            </div>
          </div>
        </header>

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
