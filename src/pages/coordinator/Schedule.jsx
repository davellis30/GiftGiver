import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, CalendarCheck, Clock } from 'lucide-react'
import { useStore } from '../../store'
import { getPatientsForCoordinator } from '../../data/selectors'
import { StatusPill, AcuityTag, Avatar } from '../../components/ui'
import { ContactActionButtons } from '../../components/ContactActions'
import { initialsColor } from '../../utils/format'

function dayKey(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}
function timeStr(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function Schedule() {
  const navigate = useNavigate()
  const { patients, currentCoordinatorId } = useStore()
  const myPatients = useMemo(
    () => getPatientsForCoordinator(patients, currentCoordinatorId),
    [patients, currentCoordinatorId],
  )

  const upcoming = useMemo(
    () =>
      myPatients
        .filter((p) => p.nextAppointment)
        .sort((a, b) => new Date(a.nextAppointment) - new Date(b.nextAppointment)),
    [myPatients],
  )

  const grouped = useMemo(() => {
    const map = new Map()
    upcoming.forEach((p) => {
      const k = dayKey(p.nextAppointment)
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(p)
    })
    return [...map.entries()]
  }, [upcoming])

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Schedule</h2>
          <p>Upcoming appointments across your panel. {upcoming.length} scheduled.</p>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="card card-pad empty">
          <CalendarDays size={28} style={{ opacity: 0.4 }} />
          <div style={{ marginTop: 10 }}>No appointments scheduled yet.</div>
        </div>
      ) : (
        <div className="stack" style={{ gap: 18 }}>
          {grouped.map(([day, list]) => (
            <div className="card" key={day}>
              <div className="card-head">
                <CalendarDays size={16} style={{ color: 'var(--primary)' }} />
                <h3>{day}</h3>
                <span className="hint">{list.length} appointments</span>
              </div>
              <div className="card-pad stack" style={{ gap: 0 }}>
                {list.map((p) => (
                  <div key={p.id} className="list-item">
                    <div className="row" style={{ gap: 8, width: 92 }}>
                      <Clock size={14} className="muted" />
                      <span style={{ fontWeight: 700 }}>{timeStr(p.nextAppointment)}</span>
                    </div>
                    <div
                      className="patient-cell"
                      style={{ flex: 1, cursor: 'pointer' }}
                      onClick={() => navigate(`/coordinator/patients/${p.id}`)}
                    >
                      <Avatar initials={p.initials} size="sm" color={initialsColor(p.name)} />
                      <div>
                        <div className="pname">{p.name}</div>
                        <div className="pmeta">{p.condition}</div>
                      </div>
                    </div>
                    <StatusPill status={p.contactStatus} />
                    <AcuityTag acuity={p.acuity} />
                    <ContactActionButtons patient={p} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
