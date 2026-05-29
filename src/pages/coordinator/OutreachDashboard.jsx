import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  Users,
  CheckCircle2,
  PhoneOff,
  ShieldAlert,
  AlertTriangle,
  PhoneMissed,
  Mail,
  Phone,
} from 'lucide-react'
import { useStore } from '../../store'
import { getPatientsForCoordinator, statusBreakdown } from '../../data/selectors'
import { STATUS_META, CONTACT_STATUSES } from '../../data/mockData'
import { StatCard, StatusPill, AcuityTag, Avatar } from '../../components/ui'
import { ContactActionButtons } from '../../components/ContactActions'
import { relativeDays, initialsColor } from '../../utils/format'

function daysSince(iso) {
  if (!iso) return Infinity
  return Math.round((new Date('2026-05-29T12:00:00') - new Date(iso)) / 86400000)
}

export default function OutreachDashboard() {
  const navigate = useNavigate()
  const { patients, currentCoordinatorId } = useStore()
  const myPatients = useMemo(
    () => getPatientsForCoordinator(patients, currentCoordinatorId),
    [patients, currentCoordinatorId],
  )

  const [filter, setFilter] = useState('needs-attention') // status name | 'needs-attention' | 'all'

  const breakdown = useMemo(() => statusBreakdown(myPatients), [myPatients])
  const byStatus = Object.fromEntries(breakdown.map((b) => [b.status, b]))
  const engaged = byStatus['Engaged']?.count || 0
  const unreachable =
    (byStatus['Unresponsive']?.count || 0) + (byStatus['Incomplete Contact Info']?.count || 0)
  const refused = byStatus['Refused Care']?.count || 0

  const staleCount = myPatients.filter(
    (p) => p.contactStatus !== 'Refused Care' && daysSince(p.lastContactDate) > 30,
  ).length

  // Outreach-priority buckets: how long since we last reached each patient
  const buckets = useMemo(() => {
    const defs = [
      { key: '0–7d', test: (d) => d <= 7 },
      { key: '8–30d', test: (d) => d > 7 && d <= 30 },
      { key: '31–90d', test: (d) => d > 30 && d <= 90 },
      { key: '90d+ / never', test: (d) => d > 90 },
    ]
    return defs.map((def) => ({
      bucket: def.key,
      patients: myPatients.filter((p) => def.test(daysSince(p.lastContactDate))).length,
    }))
  }, [myPatients])

  const queue = useMemo(() => {
    let list = myPatients
    if (filter === 'needs-attention') {
      list = myPatients.filter((p) => p.contactStatus !== 'Engaged')
    } else if (filter !== 'all') {
      list = myPatients.filter((p) => p.contactStatus === filter)
    }
    // Prioritize: highest acuity first, then longest since contact
    return [...list].sort(
      (a, b) =>
        b.riskScore - a.riskScore || daysSince(b.lastContactDate) - daysSince(a.lastContactDate),
    )
  }, [myPatients, filter])

  const queueTitle =
    filter === 'needs-attention'
      ? 'Outreach work queue · patients not yet engaged'
      : filter === 'all'
        ? 'All patients'
        : `${STATUS_META[filter].label} patients`

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Outreach Dashboard</h2>
          <p>
            Where your {myPatients.length} patients stand on contactability — and the fastest path
            to reaching them.
          </p>
        </div>
      </div>

      {staleCount > 0 && (
        <div className="alert-banner">
          <AlertTriangle size={18} />
          <span>
            <strong>{staleCount} patients</strong> have gone 30+ days without successful contact.
            Prioritize the work queue below.
          </span>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-4">
        <StatCard
          icon={Users}
          label="Active panel"
          value={myPatients.length}
          foot="Target caseload: 100"
        />
        <StatCard
          icon={CheckCircle2}
          tone="green"
          label="Engaged"
          value={`${byStatus['Engaged']?.pct || 0}%`}
          foot={`${engaged} patients in active contact`}
        />
        <StatCard
          icon={PhoneOff}
          tone="amber"
          label="Unable to reach"
          value={unreachable}
          foot="Unresponsive + missing contact info"
        />
        <StatCard
          icon={ShieldAlert}
          tone="red"
          label="Refused care"
          value={refused}
          foot={`${byStatus['Refused Care']?.pct || 0}% of panel`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="card-head">
            <h3>Contactability breakdown</h3>
            <span className="hint">Click a status to filter the queue</span>
          </div>
          <div className="card-pad" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 200, height: 200, position: 'relative' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={breakdown}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {breakdown.map((b) => (
                      <Cell key={b.status} fill={b.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, n) => [`${v} patients`, n]}
                    contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                  pointerEvents: 'none',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 26, fontWeight: 800 }}>{myPatients.length}</div>
                  <div className="faint" style={{ fontSize: 11 }}>patients</div>
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              {breakdown.map((b) => (
                <button
                  key={b.status}
                  className="list-item"
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onClick={() => setFilter(b.status)}
                >
                  <span className="dot" style={{ background: b.color }} />
                  <span style={{ fontWeight: 600, flex: 1 }}>{STATUS_META[b.status].label}</span>
                  <span style={{ fontWeight: 700 }}>{b.count}</span>
                  <span className="faint" style={{ width: 38, textAlign: 'right' }}>{b.pct}%</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Time since last successful contact</h3>
            <span className="hint">Outreach urgency</span>
          </div>
          <div className="card-pad" style={{ height: 232 }}>
            <ResponsiveContainer>
              <BarChart data={buckets} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="bucket" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'var(--surface-2)' }}
                  formatter={(v) => [`${v} patients`, 'Patients']}
                  contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }}
                />
                <Bar dataKey="patients" radius={[6, 6, 0, 0]} maxBarSize={64}>
                  {buckets.map((b, i) => (
                    <Cell
                      key={b.bucket}
                      fill={i === 0 ? '#16a34a' : i === 1 ? '#84cc16' : i === 2 ? '#f59e0b' : '#dc2626'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Status filter tiles */}
      <div className="section-title">Filter work queue</div>
      <div className="status-board">
        <button
          className={`status-tile ${filter === 'needs-attention' ? 'active' : ''}`}
          style={filter === 'needs-attention' ? { borderColor: 'var(--primary)' } : undefined}
          onClick={() => setFilter('needs-attention')}
        >
          <div className="big" style={{ color: 'var(--primary)' }}>{unreachable + refused}</div>
          <div className="lbl">Needs attention</div>
          <div className="desc">Everyone not currently engaged</div>
        </button>
        {CONTACT_STATUSES.map((s) => (
          <button
            key={s}
            className={`status-tile ${filter === s ? 'active' : ''}`}
            style={filter === s ? { borderColor: STATUS_META[s].color } : undefined}
            onClick={() => setFilter(s)}
          >
            <div className="big" style={{ color: STATUS_META[s].color }}>{byStatus[s]?.count || 0}</div>
            <div className="lbl">{STATUS_META[s].label}</div>
            <div className="desc">{STATUS_META[s].desc}</div>
          </button>
        ))}
      </div>

      {/* Work queue table */}
      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head">
          <PhoneMissed size={17} style={{ color: 'var(--text-muted)' }} />
          <h3>{queueTitle}</h3>
          <span className="hint">{queue.length} patients · sorted by acuity & recency</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Status</th>
                <th>Acuity</th>
                <th>Last contact</th>
                <th>Attempts</th>
                <th>Contact info</th>
                <th style={{ textAlign: 'right' }}>Take action</th>
              </tr>
            </thead>
            <tbody>
              {queue.slice(0, 40).map((p) => (
                <tr
                  key={p.id}
                  className="clickable"
                  onClick={() => navigate(`/coordinator/patients/${p.id}`)}
                >
                  <td>
                    <div className="patient-cell">
                      <Avatar initials={p.initials} size="sm" color={initialsColor(p.name)} />
                      <div>
                        <div className="pname">{p.name}</div>
                        <div className="pmeta">{p.id} · {p.condition}</div>
                      </div>
                    </div>
                  </td>
                  <td><StatusPill status={p.contactStatus} /></td>
                  <td><AcuityTag acuity={p.acuity} /></td>
                  <td className="muted">{relativeDays(p.lastContactDate)}</td>
                  <td className="muted">{p.attemptedContacts}</td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <span className="tag" style={p.phone ? undefined : { color: 'var(--red)', borderColor: '#fecaca', background: '#fef2f2' }}>
                        <Phone size={11} style={{ marginRight: 3, verticalAlign: '-1px' }} />
                        {p.phone ? 'Phone' : 'Missing'}
                      </span>
                      <span className="tag" style={p.email ? undefined : { color: 'var(--red)', borderColor: '#fecaca', background: '#fef2f2' }}>
                        <Mail size={11} style={{ marginRight: 3, verticalAlign: '-1px' }} />
                        {p.email ? 'Email' : 'Missing'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <ContactActionButtons patient={p} size="sm" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {queue.length === 0 && <div className="empty">No patients in this view 🎉</div>}
          {queue.length > 40 && (
            <div className="card-pad muted" style={{ textAlign: 'center', fontSize: 13 }}>
              Showing top 40 of {queue.length}. Refine with the filters above or open{' '}
              <Link style={{ color: 'var(--primary)', fontWeight: 600 }} to="/coordinator/patients">
                My Patients
              </Link>
              .
            </div>
          )}
        </div>
      </div>
    </>
  )
}
