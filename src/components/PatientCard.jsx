import { useNavigate } from 'react-router-dom'
import { Phone, Mail, Clock, CalendarCheck, AlertTriangle } from 'lucide-react'
import { StatusPill, AcuityTag, Avatar } from './ui'
import { ContactActionButtons } from './ContactActions'
import { relativeDays, formatDate, initialsColor } from '../utils/format'

// Touch-friendly patient card used in place of dense tables on phones.
export function PatientCard({ patient: p, showNextAppt = false }) {
  const navigate = useNavigate()
  const missing = []
  if (!p.phone) missing.push('phone')
  if (!p.email) missing.push('email')

  return (
    <div className="pcard">
      <div className="pcard-top" onClick={() => navigate(`/coordinator/patients/${p.id}`)}>
        <Avatar initials={p.initials} size="sm" color={initialsColor(p.name)} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="pname">{p.name}</div>
          <div className="pmeta">{p.id} · {p.condition}</div>
        </div>
        <StatusPill status={p.contactStatus} />
      </div>

      <div className="pcard-meta">
        <AcuityTag acuity={p.acuity} />
        <span className="muted">
          <Clock size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
          {relativeDays(p.lastContactDate)}
        </span>
        {showNextAppt && p.nextAppointment && (
          <span className="muted">
            <CalendarCheck size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
            {formatDate(p.nextAppointment)}
          </span>
        )}
      </div>

      {missing.length > 0 && (
        <div className="pcard-warn">
          <AlertTriangle size={13} />
          Missing {missing.join(' & ')} — update contact info
        </div>
      )}

      <div className="pcard-actions">
        <ContactActionButtons patient={p} size="sm" />
      </div>
    </div>
  )
}
