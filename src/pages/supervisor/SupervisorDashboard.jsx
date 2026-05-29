import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts'
import {
  Users,
  TrendingUp,
  FileCheck2,
  ShieldAlert,
  Trophy,
  LifeBuoy,
  MapPin,
} from 'lucide-react'
import { useStore } from '../../store'
import { allCoordinatorMetrics, stateBreakdown } from '../../data/selectors'
import { StatCard, Meter, Avatar } from '../../components/ui'
import { initialsColor } from '../../utils/format'

export const STATE_COLORS = {
  California: '#2563eb',
  Texas: '#7c3aed',
  Florida: '#0d9488',
}

function rateColor(v) {
  return v >= 55 ? 'var(--green)' : v >= 40 ? 'var(--amber)' : 'var(--red)'
}

export default function SupervisorDashboard({ tab: initialTab = 'coordinators' }) {
  const navigate = useNavigate()
  const { patients, coordinators } = useStore()
  const [tab, setTab] = useState(initialTab)

  const metrics = useMemo(
    () => allCoordinatorMetrics(patients, coordinators),
    [patients, coordinators],
  )
  const states = useMemo(() => stateBreakdown(patients, coordinators), [patients, coordinators])

  const totalPatients = metrics.reduce((s, m) => s + m.total, 0)
  const avgEngagement = Math.round(metrics.reduce((s, m) => s + m.engagementRate, 0) / metrics.length)
  const totalClaimsFiled = metrics.reduce((s, m) => s + m.claimsFiled, 0)
  const totalClaimsEligible = metrics.reduce((s, m) => s + m.claimsEligible, 0)
  const claimsRate = Math.round((totalClaimsFiled / totalClaimsEligible) * 100)
  const totalHighRisk = metrics.reduce((s, m) => s + m.highRisk, 0)

  const ranked = [...metrics].sort((a, b) => b.engagementRate - a.engagementRate)
  const topPerformer = ranked[0]
  const needsSupport = ranked[ranked.length - 1]

  const engagementChart = ranked.map((m) => ({
    name: m.name.split(' ')[0],
    fullName: m.name,
    state: m.state,
    engagement: m.engagementRate,
    claims: m.claimsRate,
  }))

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Team Dashboard</h2>
          <p>
            Engagement, reach, and claims performance across {coordinators.length} care coordinators
            in {states.length} states.
          </p>
        </div>
        <div className="actions">
          <div className="role-switch" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <button
              className={tab === 'coordinators' ? 'active' : ''}
              style={tab === 'coordinators' ? { background: 'var(--primary)', color: '#fff' } : { color: 'var(--text-muted)' }}
              onClick={() => setTab('coordinators')}
            >
              Coordinators
            </button>
            <button
              className={tab === 'states' ? 'active' : ''}
              style={tab === 'states' ? { background: 'var(--primary)', color: '#fff' } : { color: 'var(--text-muted)' }}
              onClick={() => setTab('states')}
            >
              States
            </button>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-4">
        <StatCard icon={Users} label="Patients under management" value={totalPatients.toLocaleString()} foot={`${coordinators.length} coordinators`} />
        <StatCard icon={TrendingUp} tone="green" label="Avg engagement rate" value={`${avgEngagement}%`} foot="Patients in active contact" />
        <StatCard icon={FileCheck2} tone="indigo" label="Claims filed rate" value={`${claimsRate}%`} foot={`${totalClaimsFiled.toLocaleString()} of ${totalClaimsEligible.toLocaleString()} eligible`} />
        <StatCard icon={ShieldAlert} tone="red" label="High-acuity patients" value={totalHighRisk} foot="Across all panels" />
      </div>

      {tab === 'coordinators' ? (
        <>
          {/* Highlights */}
          <div className="grid grid-2" style={{ marginTop: 18 }}>
            <div className="card card-pad" style={{ borderLeft: '4px solid var(--green)' }}>
              <div className="row" style={{ gap: 12 }}>
                <div className="stat-icon" style={{ background: '#f0fdf4', color: 'var(--green)' }}>
                  <Trophy size={19} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="stat-label">Top performer</div>
                  <div className="row spread">
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{topPerformer.name}</span>
                    <span style={{ fontWeight: 800, color: 'var(--green)' }}>{topPerformer.engagementRate}%</span>
                  </div>
                  <div className="muted" style={{ fontSize: 12.5 }}>
                    {topPerformer.region}, {topPerformer.state} · {topPerformer.claimsRate}% claims filed
                  </div>
                </div>
              </div>
            </div>
            <div className="card card-pad" style={{ borderLeft: '4px solid var(--amber)' }}>
              <div className="row" style={{ gap: 12 }}>
                <div className="stat-icon" style={{ background: '#fffbeb', color: 'var(--amber)' }}>
                  <LifeBuoy size={19} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="stat-label">Needs support</div>
                  <div className="row spread">
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{needsSupport.name}</span>
                    <span style={{ fontWeight: 800, color: 'var(--amber)' }}>{needsSupport.engagementRate}%</span>
                  </div>
                  <div className="muted" style={{ fontSize: 12.5 }}>
                    {needsSupport.region}, {needsSupport.state} · {needsSupport.unreachable} unreachable patients
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement chart */}
          <div className="card" style={{ marginTop: 18 }}>
            <div className="card-head">
              <h3>Engagement rate by coordinator</h3>
              <span className="hint">% of panel in active contact · colored by state</span>
            </div>
            <div className="card-pad" style={{ height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={engagementChart} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis unit="%" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[0, 80]} />
                  <Tooltip
                    cursor={{ fill: 'var(--surface-2)' }}
                    formatter={(v, n, item) => [`${v}%`, item.payload.fullName]}
                    contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }}
                  />
                  <Bar dataKey="engagement" radius={[6, 6, 0, 0]} maxBarSize={54}>
                    {engagementChart.map((d) => (
                      <Cell key={d.fullName} fill={STATE_COLORS[d.state]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="legend">
                {Object.entries(STATE_COLORS).map(([s, c]) => (
                  <span className="legend-item" key={s}>
                    <span className="dot" style={{ background: c }} /> {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Coordinator table */}
          <div className="card" style={{ marginTop: 18 }}>
            <div className="card-head">
              <Users size={17} style={{ color: 'var(--text-muted)' }} />
              <h3>Coordinator performance</h3>
              <span className="hint">Click a row to drill in</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Coordinator</th>
                    <th>Location</th>
                    <th>Panel</th>
                    <th style={{ width: 180 }}>Engagement</th>
                    <th>Unable to reach</th>
                    <th>Refused</th>
                    <th style={{ width: 160 }}>Claims filed</th>
                    <th>High acuity</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((m) => (
                    <tr
                      key={m.id}
                      className="clickable"
                      onClick={() => navigate(`/supervisor/coordinator/${m.id}`)}
                    >
                      <td>
                        <div className="patient-cell">
                          <Avatar initials={m.initials} size="sm" color={initialsColor(m.name)} />
                          <div>
                            <div className="pname">{m.name}</div>
                            <div className="pmeta">{m.tenureMonths} mo tenure</div>
                          </div>
                        </div>
                      </td>
                      <td className="muted">
                        <span className="dot" style={{ background: STATE_COLORS[m.state], display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} />
                        {m.region}, {m.state}
                      </td>
                      <td style={{ fontWeight: 600 }}>{m.total}</td>
                      <td><Meter value={m.engagementRate} color={rateColor(m.engagementRate)} /></td>
                      <td className="muted">{m.unreachable}</td>
                      <td className="muted">{m.refused}</td>
                      <td><Meter value={m.claimsRate} color={rateColor(m.claimsRate)} /></td>
                      <td>
                        <span className="tag acuity-High">{m.highRisk}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <StatesView states={states} patients={patients} />
      )}
    </>
  )
}

function StatesView({ states, patients }) {
  const chartData = states.map((s) => ({
    state: s.state,
    Engagement: s.engagementRate,
    'Claims filed': s.claimsRate,
  }))

  return (
    <>
      <div className="grid grid-3" style={{ marginTop: 18 }}>
        {states.map((s) => (
          <div className="card card-pad" key={s.state} style={{ borderTop: `4px solid ${STATE_COLORS[s.state]}` }}>
            <div className="row" style={{ gap: 10, marginBottom: 14 }}>
              <div className="stat-icon" style={{ background: `${STATE_COLORS[s.state]}16`, color: STATE_COLORS[s.state] }}>
                <MapPin size={19} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{s.state}</div>
                <div className="muted" style={{ fontSize: 12.5 }}>
                  {s.patients.toLocaleString()} patients · {s.coordinators} coordinators
                </div>
              </div>
            </div>
            <div className="stack" style={{ gap: 12 }}>
              <div>
                <div className="row spread" style={{ marginBottom: 5 }}>
                  <span className="muted" style={{ fontSize: 12.5 }}>Engagement rate</span>
                  <span style={{ fontWeight: 700 }}>{s.engagementRate}%</span>
                </div>
                <Meter value={s.engagementRate} color={rateColor(s.engagementRate)} showLabel={false} />
              </div>
              <div>
                <div className="row spread" style={{ marginBottom: 5 }}>
                  <span className="muted" style={{ fontSize: 12.5 }}>Claims filed rate</span>
                  <span style={{ fontWeight: 700 }}>{s.claimsRate}%</span>
                </div>
                <Meter value={s.claimsRate} color={rateColor(s.claimsRate)} showLabel={false} />
              </div>
              <div className="kv" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <span className="k">Unable to reach</span>
                <span className="v">{s.unreachable} patients</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head">
          <h3>Engagement vs. claims filed by state</h3>
          <span className="hint">Two key contract performance measures side by side</span>
        </div>
        <div className="card-pad" style={{ height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="state" tick={{ fontSize: 13, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis unit="%" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[0, 80]} />
              <Tooltip
                cursor={{ fill: 'var(--surface-2)' }}
                formatter={(v) => `${v}%`}
                contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }}
              />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="Engagement" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={70} />
              <Bar dataKey="Claims filed" fill="#0d9488" radius={[6, 6, 0, 0]} maxBarSize={70} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}
