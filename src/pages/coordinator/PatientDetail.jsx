import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Phone,
  Mail,
  CalendarPlus,
  MapPin,
  ShieldCheck,
  Pill,
  Target,
  Activity,
  Clock,
  PhoneOff,
  CalendarCheck,
  FileText,
} from 'lucide-react'
import { useStore } from '../../store'
import { getPatientById } from '../../data/selectors'
import { CONTACT_STATUSES } from '../../data/mockData'
import { StatusPill, AcuityTag, Avatar, Meter } from '../../components/ui'
import { CallModal, EmailModal, ScheduleModal } from '../../components/ContactActions'
import { formatDate, relativeDays, initialsColor } from '../../utils/format'

const PLAN_STATUS_COLOR = {
  'On Track': 'var(--green)',
  Met: 'var(--primary)',
  'At Risk': 'var(--amber)',
  'Not Started': 'var(--text-faint)',
}
const ACT_ICON = { Call: Phone, Email: Mail, Visit: CalendarCheck }

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { patients, setContactStatus } = useStore()
  const patient = getPatientById(patients, id)
  const [modal, setModal] = useState(null)

  if (!patient) {
    return (
      <div className="empty">
        Patient not found. <Link to="/coordinator/patients" style={{ color: 'var(--primary)' }}>Back to panel</Link>
      </div>
    )
  }

  const adherenceAvg = patient.medications.length
    ? Math.round(
        patient.medications.reduce((s, m) => s + m.adherence, 0) / patient.medications.length,
      )
    : 0

  return (
    <>
      <button className="back-link" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header */}
      <div className="card card-pad">
        <div className="row spread" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div className="row" style={{ gap: 16 }}>
            <Avatar initials={patient.initials} size="lg" color={initialsColor(patient.name)} />
            <div>
              <div className="row" style={{ gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{patient.name}</h2>
                <StatusPill status={patient.contactStatus} />
                <AcuityTag acuity={patient.acuity} />
              </div>
              <div className="muted" style={{ marginTop: 4 }}>
                {patient.id} · {patient.age} yrs · {patient.gender} · {patient.condition}
              </div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                {patient.region}, {patient.state} · Enrolled {formatDate(patient.enrolledDate)}
              </div>
            </div>
          </div>
          <div className="row" style={{ gap: 9 }}>
            <button
              className={`btn ${patient.phone ? 'btn-green' : ''}`}
              onClick={() => setModal('call')}
            >
              {patient.phone ? <Phone size={16} /> : <PhoneOff size={16} />} Call
            </button>
            <button className="btn" onClick={() => setModal('email')}>
              <Mail size={16} /> Email
            </button>
            <button className="btn btn-primary" onClick={() => setModal('schedule')}>
              <CalendarPlus size={16} /> Schedule
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginTop: 18, alignItems: 'start' }}>
        {/* Left column: contact + status + appt */}
        <div className="stack" style={{ gap: 18 }}>
          <div className="card">
            <div className="card-head"><h3>Contact information</h3></div>
            <div className="card-pad stack" style={{ gap: 0 }}>
              <div className="kv">
                <span className="k"><Phone size={13} style={{ verticalAlign: '-2px', marginRight: 6 }} />Phone</span>
                <span className="v" style={patient.phone ? undefined : { color: 'var(--red)' }}>
                  {patient.phone || 'Missing'}
                </span>
              </div>
              <div className="kv">
                <span className="k"><Mail size={13} style={{ verticalAlign: '-2px', marginRight: 6 }} />Email</span>
                <span className="v" style={patient.email ? undefined : { color: 'var(--red)' }}>
                  {patient.email || 'Missing'}
                </span>
              </div>
              <div className="kv">
                <span className="k"><MapPin size={13} style={{ verticalAlign: '-2px', marginRight: 6 }} />Address</span>
                <span className="v">{patient.address}</span>
              </div>
              <div className="kv">
                <span className="k"><ShieldCheck size={13} style={{ verticalAlign: '-2px', marginRight: 6 }} />Payer</span>
                <span className="v">{patient.payer}</span>
              </div>
              <div className="kv">
                <span className="k">Last successful contact</span>
                <span className="v">{relativeDays(patient.lastContactDate)}</span>
              </div>
              <div className="kv">
                <span className="k">Outreach attempts</span>
                <span className="v">{patient.attemptedContacts}</span>
              </div>
            </div>
          </div>

          <div className="card card-pad">
            <label className="stat-label" style={{ display: 'block', marginBottom: 8 }}>
              Update contact status
            </label>
            <select
              className="input"
              style={{ width: '100%' }}
              value={patient.contactStatus}
              onChange={(e) => setContactStatus(patient.id, e.target.value)}
            >
              {CONTACT_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="card">
            <div className="card-head"><h3>Next appointment</h3></div>
            <div className="card-pad">
              {patient.nextAppointment ? (
                <div className="row" style={{ gap: 12 }}>
                  <div className="stat-icon" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                    <CalendarCheck size={19} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{formatDate(patient.nextAppointment)}</div>
                    <div className="muted" style={{ fontSize: 12.5 }}>{relativeDays(patient.nextAppointment)}</div>
                  </div>
                </div>
              ) : (
                <div className="stack" style={{ gap: 10 }}>
                  <span className="muted">No upcoming appointment scheduled.</span>
                  <button className="btn btn-primary btn-sm" onClick={() => setModal('schedule')} style={{ alignSelf: 'flex-start' }}>
                    <CalendarPlus size={15} /> Schedule one
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Risk & billing</h3></div>
            <div className="card-pad stack" style={{ gap: 14 }}>
              <div>
                <div className="row spread" style={{ marginBottom: 6 }}>
                  <span className="muted" style={{ fontSize: 12.5 }}>Risk score</span>
                  <span style={{ fontWeight: 700 }}>{patient.riskScore}/100</span>
                </div>
                <Meter
                  value={patient.riskScore}
                  showLabel={false}
                  color={patient.riskScore > 70 ? 'var(--red)' : patient.riskScore > 40 ? 'var(--amber)' : 'var(--green)'}
                />
              </div>
              <div className="kv" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <span className="k"><FileText size={13} style={{ verticalAlign: '-2px', marginRight: 6 }} />Claims filed</span>
                <span className="v">{patient.claimsFiled} / {patient.claimsEligible} eligible</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle + right: care plan, meds, activity (span 2) */}
        <div className="col-span-2 stack" style={{ gap: 18 }}>
          <div className="card">
            <div className="card-head">
              <Target size={16} style={{ color: 'var(--text-muted)' }} />
              <h3>Care plan</h3>
              <span className="hint">{patient.carePlan.length} goals</span>
            </div>
            <div className="card-pad stack" style={{ gap: 14 }}>
              {patient.carePlan.map((g, i) => (
                <div key={i} className="row spread" style={{ alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{g.goal}</div>
                    <div className="muted" style={{ fontSize: 12 }}>Target {formatDate(g.targetDate)}</div>
                  </div>
                  <span
                    className="pill"
                    style={{ background: `${PLAN_STATUS_COLOR[g.status]}16`, color: PLAN_STATUS_COLOR[g.status] }}
                  >
                    <span className="dot" style={{ background: PLAN_STATUS_COLOR[g.status] }} />
                    {g.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <Pill size={16} style={{ color: 'var(--text-muted)' }} />
              <h3>Medications</h3>
              <span className="hint">Avg adherence {adherenceAvg}%</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Medication</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Last filled</th>
                    <th style={{ width: 180 }}>Adherence</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.medications.map((m, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{m.name}</td>
                      <td className="muted">{m.dosage}</td>
                      <td className="muted">{m.frequency}</td>
                      <td className="muted">{formatDate(m.lastFilled)}</td>
                      <td>
                        <Meter
                          value={m.adherence}
                          color={m.adherence >= 80 ? 'var(--green)' : m.adherence >= 60 ? 'var(--amber)' : 'var(--red)'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <Activity size={16} style={{ color: 'var(--text-muted)' }} />
              <h3>Activity timeline</h3>
              <span className="hint">{patient.activities.length} logged</span>
            </div>
            <div className="card-pad">
              {patient.activities.slice(0, 12).map((a) => {
                const Icon = ACT_ICON[a.type] || Clock
                return (
                  <div key={a.id} className="timeline-item">
                    <div className="timeline-icon">
                      <Icon size={15} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="row spread">
                        <span style={{ fontWeight: 600 }}>{a.subject}</span>
                        <span className="faint" style={{ fontSize: 12 }}>{formatDate(a.date)}</span>
                      </div>
                      <div className="muted" style={{ fontSize: 12.5 }}>
                        {a.type}
                        {a.outcome ? ` · ${a.outcome}` : ''}
                        {a.durationMin ? ` · ${a.durationMin} min` : ''}
                        {a.loggedByUser ? ' · logged by you' : ''}
                      </div>
                      {a.notes && (
                        <div style={{ fontSize: 12.5, marginTop: 4, color: 'var(--text)' }}>
                          “{a.notes}”
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {modal === 'call' && <CallModal patient={patient} onClose={() => setModal(null)} />}
      {modal === 'email' && <EmailModal patient={patient} onClose={() => setModal(null)} />}
      {modal === 'schedule' && <ScheduleModal patient={patient} onClose={() => setModal(null)} />}
    </>
  )
}
