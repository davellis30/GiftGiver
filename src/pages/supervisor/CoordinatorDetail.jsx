import { useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { ArrowLeft, Users, TrendingUp, FileCheck2, PhoneOff, Mail, Phone } from 'lucide-react'
import { useStore } from '../../store'
import {
  getPatientsForCoordinator,
  coordinatorMetrics,
  statusBreakdown,
} from '../../data/selectors'
import { STATUS_META } from '../../data/mockData'
import { StatCard, StatusPill, AcuityTag, Avatar, Meter } from '../../components/ui'
import { relativeDays, initialsColor } from '../../utils/format'
import { STATE_COLORS } from './SupervisorDashboard'

export default function CoordinatorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { patients, coordinators } = useStore()
  const coordinator = coordinators.find((c) => c.id === id)
  const panel = useMemo(() => getPatientsForCoordinator(patients, id), [patients, id])
  const metrics = useMemo(() => coordinatorMetrics(patients, id), [patients, id])
  const breakdown = useMemo(() => statusBreakdown(panel), [panel])

  if (!coordinator) {
    return (
      <div className="empty">
        Coordinator not found. <Link to="/supervisor" style={{ color: 'var(--primary)' }}>Back</Link>
      </div>
    )
  }

  const attention = panel
    .filter((p) => p.contactStatus !== 'Engaged')
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10)

  return (
    <>
      <button className="back-link" onClick={() => navigate('/supervisor')}>
        <ArrowLeft size={16} /> Back to team
      </button>

      <div className="card card-pad">
        <div className="row" style={{ gap: 16 }}>
          <Avatar initials={coordinator.initials} size="lg" color={initialsColor(coordinator.name)} />
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{coordinator.name}</h2>
            <div className="muted" style={{ marginTop: 3 }}>
              <span className="dot" style={{ background: STATE_COLORS[coordinator.state], display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} />
              {coordinator.region}, {coordinator.state} · {coordinator.tenureMonths} months tenure
            </div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
              {coordinator.email} · {coordinator.phone}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginTop: 18 }}>
        <StatCard icon={Users} label="Panel size" value={metrics.total} foot="Target: 100" />
        <StatCard icon={TrendingUp} tone="green" label="Engagement rate" value={`${metrics.engagementRate}%`} foot={`${metrics.engaged} engaged`} />
        <StatCard icon={PhoneOff} tone="amber" label="Unable to reach" value={metrics.unreachable} foot={`${metrics.refused} refused care`} />
        <StatCard icon={FileCheck2} tone="indigo" label="Claims filed" value={`${metrics.claimsRate}%`} foot={`${metrics.claimsFiled} of ${metrics.claimsEligible}`} />
      </div>

      <div className="grid grid-3" style={{ marginTop: 18, alignItems: 'start' }}>
        <div className="card">
          <div className="card-head"><h3>Panel contactability</h3></div>
          <div className="card-pad" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ width: 150, height: 150 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={breakdown} dataKey="count" nameKey="status" innerRadius={44} outerRadius={68} paddingAngle={2} stroke="none">
                    {breakdown.map((b) => (
                      <Cell key={b.status} fill={b.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v}`, n]} contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1 }}>
              {breakdown.map((b) => (
                <div key={b.status} className="row" style={{ gap: 8, padding: '5px 0', fontSize: 12.5 }}>
                  <span className="dot" style={{ background: b.color }} />
                  <span style={{ flex: 1 }}>{STATUS_META[b.status].label}</span>
                  <span style={{ fontWeight: 700 }}>{b.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card col-span-2">
          <div className="card-head">
            <h3>Patients needing attention</h3>
            <span className="hint">Highest acuity, not yet engaged</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Status</th>
                  <th>Acuity</th>
                  <th>Last contact</th>
                  <th>Contact info</th>
                </tr>
              </thead>
              <tbody>
                {attention.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="patient-cell">
                        <Avatar initials={p.initials} size="sm" color={initialsColor(p.name)} />
                        <div>
                          <div className="pname">{p.name}</div>
                          <div className="pmeta">{p.condition}</div>
                        </div>
                      </div>
                    </td>
                    <td><StatusPill status={p.contactStatus} /></td>
                    <td><AcuityTag acuity={p.acuity} /></td>
                    <td className="muted">{relativeDays(p.lastContactDate)}</td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <Phone size={13} style={{ color: p.phone ? 'var(--green)' : 'var(--red)' }} />
                        <Mail size={13} style={{ color: p.email ? 'var(--green)' : 'var(--red)' }} />
                      </div>
                    </td>
                  </tr>
                ))}
                {attention.length === 0 && (
                  <tr><td colSpan={5} className="empty">Entire panel is engaged 🎉</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
