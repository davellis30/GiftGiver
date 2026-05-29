import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, SlidersHorizontal } from 'lucide-react'
import { useStore } from '../../store'
import { getPatientsForCoordinator } from '../../data/selectors'
import { CONTACT_STATUSES, PAYERS } from '../../data/mockData'
import { StatusPill, AcuityTag, Avatar } from '../../components/ui'
import { ContactActionButtons } from '../../components/ContactActions'
import { PatientCard } from '../../components/PatientCard'
import { useIsMobile } from '../../utils/useMediaQuery'
import { relativeDays, formatDate, initialsColor } from '../../utils/format'

export default function PatientPanel() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { patients, currentCoordinatorId } = useStore()
  const myPatients = useMemo(
    () => getPatientsForCoordinator(patients, currentCoordinatorId),
    [patients, currentCoordinatorId],
  )

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('All')
  const [acuity, setAcuity] = useState('All')
  const [payer, setPayer] = useState('All')
  const [sort, setSort] = useState('risk')

  const filtered = useMemo(() => {
    let list = myPatients.filter((p) => {
      if (status !== 'All' && p.contactStatus !== status) return false
      if (acuity !== 'All' && p.acuity !== acuity) return false
      if (payer !== 'All' && p.payer !== payer) return false
      if (q) {
        const t = q.toLowerCase()
        if (
          !p.name.toLowerCase().includes(t) &&
          !p.id.toLowerCase().includes(t) &&
          !p.condition.toLowerCase().includes(t)
        )
          return false
      }
      return true
    })
    list = [...list].sort((a, b) => {
      if (sort === 'risk') return b.riskScore - a.riskScore
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'recent')
        return new Date(b.lastContactDate || 0) - new Date(a.lastContactDate || 0)
      return 0
    })
    return list
  }, [myPatients, q, status, acuity, payer, sort])

  return (
    <>
      <div className="page-head">
        <div>
          <h2>My Patients</h2>
          <p>Your full caseload — manage relationships, care plans, and contact across the panel.</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <Search size={16} />
          <input
            placeholder="Search by name, ID, or condition…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>All</option>
          {CONTACT_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className="input" value={acuity} onChange={(e) => setAcuity(e.target.value)}>
          <option value="All">All acuity</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <select className="input" value={payer} onChange={(e) => setPayer(e.target.value)}>
          <option value="All">All payers</option>
          {PAYERS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="risk">Sort: Risk score</option>
          <option value="name">Sort: Name</option>
          <option value="recent">Sort: Recent contact</option>
        </select>
      </div>

      <div className="card">
        <div className="card-head">
          <Users size={17} style={{ color: 'var(--text-muted)' }} />
          <h3>{filtered.length} patients</h3>
          <span className="hint">
            <SlidersHorizontal size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
            of {myPatients.length} total
          </span>
        </div>
        {isMobile ? (
          <div className="card-pad pcard-list">
            {filtered.slice(0, 60).map((p) => (
              <PatientCard key={p.id} patient={p} showNextAppt />
            ))}
            {filtered.length === 0 && <div className="empty">No patients match your filters.</div>}
            {filtered.length > 60 && (
              <div className="muted" style={{ textAlign: 'center', fontSize: 13, paddingTop: 8 }}>
                Showing 60 of {filtered.length}. Narrow your search to see more.
              </div>
            )}
          </div>
        ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Condition</th>
                <th>Status</th>
                <th>Acuity</th>
                <th>Payer</th>
                <th>Last contact</th>
                <th>Next appt</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 60).map((p) => (
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
                        <div className="pmeta">{p.id} · {p.age}{p.gender[0]}</div>
                      </div>
                    </div>
                  </td>
                  <td>{p.condition}</td>
                  <td><StatusPill status={p.contactStatus} /></td>
                  <td><AcuityTag acuity={p.acuity} /></td>
                  <td className="muted">{p.payer}</td>
                  <td className="muted">{relativeDays(p.lastContactDate)}</td>
                  <td className="muted">{p.nextAppointment ? formatDate(p.nextAppointment) : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <ContactActionButtons patient={p} size="sm" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="empty">No patients match your filters.</div>}
          {filtered.length > 60 && (
            <div className="card-pad muted" style={{ textAlign: 'center', fontSize: 13 }}>
              Showing 60 of {filtered.length}. Narrow your search to see more.
            </div>
          )}
        </div>
        )}
      </div>
    </>
  )
}
