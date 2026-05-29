import { useState } from 'react'
import {
  Phone,
  Mail,
  CalendarPlus,
  X,
  PhoneOff,
  AlertTriangle,
  PhoneCall,
} from 'lucide-react'
import { useStore } from '../store'
import { useToast, Avatar } from './ui'
import { initialsColor } from '../utils/format'

function ModalShell({ icon: Icon, title, subtitle, onClose, children, footer, tone }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="stat-icon" style={{ background: `${tone}16`, color: tone }}>
            <Icon size={19} />
          </div>
          <div>
            <h3>{title}</h3>
            {subtitle && <div className="muted" style={{ fontSize: 12.5 }}>{subtitle}</div>}
          </div>
          <button className="btn btn-ghost btn-icon" style={{ marginLeft: 'auto' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

const CALL_OUTCOMES = [
  'Reached — productive',
  'Reached — declined services',
  'Left voicemail',
  'No answer',
  'Number disconnected',
]

export function CallModal({ patient, onClose }) {
  const { logActivity } = useStore()
  const toast = useToast()
  const [phase, setPhase] = useState('ready') // ready | dialing | wrapup
  const [outcome, setOutcome] = useState('Reached — productive')
  const [notes, setNotes] = useState('')
  const [duration, setDuration] = useState(8)
  const noPhone = !patient.phone

  const startCall = () => {
    setPhase('dialing')
    window.setTimeout(() => setPhase('wrapup'), 1400)
  }

  const save = () => {
    logActivity(patient.id, {
      type: 'Call',
      subject: 'Outreach call',
      outcome,
      durationMin: outcome.startsWith('Reached') ? Number(duration) : 0,
      notes,
    })
    toast(`Call logged for ${patient.name}`)
    onClose()
  }

  return (
    <ModalShell
      icon={Phone}
      tone="var(--green)"
      title={`Call ${patient.name}`}
      subtitle={patient.phone || 'No phone number on file'}
      onClose={onClose}
      footer={
        phase === 'wrapup' ? (
          <>
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Save call log</button>
          </>
        ) : (
          <button className="btn" onClick={onClose}>Close</button>
        )
      }
    >
      {noPhone ? (
        <div className="alert-banner" style={{ marginBottom: 0 }}>
          <AlertTriangle size={18} />
          No valid phone number on file. Update the patient's contact information before
          attempting a call.
        </div>
      ) : phase === 'ready' ? (
        <div style={{ textAlign: 'center', padding: '14px 0 6px' }}>
          <Avatar initials={patient.initials} size="lg" color={initialsColor(patient.name)} />
          <div style={{ fontSize: 22, fontWeight: 700, margin: '14px 0 2px', letterSpacing: '0.02em' }}>
            {patient.phone}
          </div>
          <div className="muted" style={{ marginBottom: 20 }}>
            Connect via softphone (Salesforce CTI)
          </div>
          <button className="btn btn-green" style={{ padding: '11px 26px' }} onClick={startCall}>
            <PhoneCall size={17} /> Start call
          </button>
        </div>
      ) : phase === 'dialing' ? (
        <div style={{ textAlign: 'center', padding: '28px 0' }}>
          <div className="dialing-pulse"><Phone size={26} /></div>
          <div style={{ fontWeight: 700, marginTop: 16 }}>Dialing {patient.phone}…</div>
          <div className="muted">Connecting</div>
        </div>
      ) : (
        <>
          <div className="field">
            <label>Call outcome</label>
            <select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
              {CALL_OUTCOMES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          {outcome.startsWith('Reached') && (
            <div className="field">
              <label>Duration (minutes)</label>
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          )}
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Notes</label>
            <textarea
              placeholder="Summarize the conversation, next steps, any risk flags…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </>
      )}
    </ModalShell>
  )
}

const EMAIL_TEMPLATES = {
  'Check-in': (p) =>
    `Hi ${p.name.split(' ')[0]},\n\nThis is your care coordinator at CareBridge. I wanted to check in and see how you've been doing. Please let me know a good time to connect this week.\n\nWarm regards,`,
  'Appointment reminder': (p) =>
    `Hi ${p.name.split(' ')[0]},\n\nThis is a friendly reminder about your upcoming appointment. Please reply to confirm or let me know if you need to reschedule.\n\nThank you,`,
  'Resources': (p) =>
    `Hi ${p.name.split(' ')[0]},\n\nAttached are some resources that may be helpful for you. I'm here if you have any questions or would like to talk through them together.\n\nTake care,`,
}

export function EmailModal({ patient, onClose }) {
  const { logActivity } = useStore()
  const toast = useToast()
  const noEmail = !patient.email
  const [template, setTemplate] = useState('Check-in')
  const [subject, setSubject] = useState('Checking in from CareBridge')
  const [body, setBody] = useState(EMAIL_TEMPLATES['Check-in'](patient))

  const applyTemplate = (t) => {
    setTemplate(t)
    setBody(EMAIL_TEMPLATES[t](patient))
    setSubject(
      t === 'Appointment reminder'
        ? 'Reminder: your upcoming appointment'
        : t === 'Resources'
          ? 'Some resources for you'
          : 'Checking in from CareBridge',
    )
  }

  const send = () => {
    logActivity(patient.id, {
      type: 'Email',
      subject,
      outcome: 'Email sent',
      notes: body,
    })
    toast(`Email sent to ${patient.name}`)
    onClose()
  }

  return (
    <ModalShell
      icon={Mail}
      tone="var(--primary)"
      title={`Email ${patient.name}`}
      subtitle={patient.email || 'No email address on file'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={send} disabled={noEmail}>
            <Mail size={15} /> Send email
          </button>
        </>
      }
    >
      {noEmail ? (
        <div className="alert-banner" style={{ marginBottom: 0 }}>
          <AlertTriangle size={18} />
          No email address on file. Update the patient's contact information before sending.
        </div>
      ) : (
        <>
          <div className="field">
            <label>Template</label>
            <div className="row" style={{ gap: 8 }}>
              {Object.keys(EMAIL_TEMPLATES).map((t) => (
                <button
                  key={t}
                  className={`chip ${template === t ? 'active' : ''}`}
                  onClick={() => applyTemplate(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Message</label>
            <textarea
              style={{ minHeight: 140 }}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        </>
      )}
    </ModalShell>
  )
}

export function ScheduleModal({ patient, onClose }) {
  const { scheduleAppointment, logActivity } = useStore()
  const toast = useToast()
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [type, setType] = useState('Telehealth session')

  const save = () => {
    if (!date) return
    const iso = new Date(`${date}T${time}:00`).toISOString()
    scheduleAppointment(patient.id, iso)
    logActivity(patient.id, {
      type: 'Visit',
      subject: `Scheduled: ${type}`,
      outcome: 'Appointment scheduled',
    })
    toast(`Appointment scheduled for ${patient.name}`)
    onClose()
  }

  return (
    <ModalShell
      icon={CalendarPlus}
      tone="var(--indigo)"
      title={`Schedule with ${patient.name}`}
      subtitle="Creates a Health Cloud Event"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={!date}>
            Schedule
          </button>
        </>
      }
    >
      <div className="field">
        <label>Appointment type</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option>Telehealth session</option>
          <option>Clinic visit</option>
          <option>Home visit</option>
          <option>Phone check-in</option>
        </select>
      </div>
      <div className="row" style={{ gap: 12 }}>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field" style={{ width: 130, marginBottom: 0 }}>
          <label>Time</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
    </ModalShell>
  )
}

// Convenience action-button cluster reused in tables and detail views
export function ContactActionButtons({ patient, size = '' }) {
  const [modal, setModal] = useState(null)
  const cls = size === 'sm' ? 'btn btn-sm' : 'btn'
  return (
    <>
      <div className="row" style={{ gap: 7 }} onClick={(e) => e.stopPropagation()}>
        <button
          className={`${cls} ${patient.phone ? 'btn-green' : ''}`}
          onClick={() => setModal('call')}
          title={patient.phone ? `Call ${patient.phone}` : 'No phone on file'}
        >
          {patient.phone ? <Phone size={15} /> : <PhoneOff size={15} />} Call
        </button>
        <button className={cls} onClick={() => setModal('email')} title={patient.email || 'No email on file'}>
          <Mail size={15} /> Email
        </button>
      </div>
      {modal === 'call' && <CallModal patient={patient} onClose={() => setModal(null)} />}
      {modal === 'email' && <EmailModal patient={patient} onClose={() => setModal(null)} />}
    </>
  )
}
