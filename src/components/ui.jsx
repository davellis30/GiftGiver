import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { STATUS_META } from '../data/mockData'

// --- Toast notifications ---------------------------------------------------
const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const show = useCallback((message) => {
    setToast(message)
    window.clearTimeout(show._t)
    show._t = window.setTimeout(() => setToast(null), 3200)
  }, [])
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </ToastCtx.Provider>
  )
}

// --- Contact status pill ---------------------------------------------------
export function StatusPill({ status }) {
  const meta = STATUS_META[status]
  if (!meta) return null
  return (
    <span
      className="pill"
      style={{ background: `${meta.color}16`, color: meta.color }}
      title={meta.desc}
    >
      <span className="dot" style={{ background: meta.color }} />
      {meta.label}
    </span>
  )
}

// --- Acuity tag ------------------------------------------------------------
export function AcuityTag({ acuity }) {
  return <span className={`tag acuity-${acuity}`}>{acuity} acuity</span>
}

// --- Stat card -------------------------------------------------------------
export function StatCard({ icon: Icon, label, value, foot, tone = 'primary', trend }) {
  const tones = {
    primary: { bg: 'var(--primary-soft)', fg: 'var(--primary)' },
    green: { bg: '#f0fdf4', fg: 'var(--green)' },
    amber: { bg: '#fffbeb', fg: 'var(--amber)' },
    red: { bg: '#fef2f2', fg: 'var(--red)' },
    indigo: { bg: '#eef2ff', fg: 'var(--indigo)' },
  }
  const t = tones[tone] || tones.primary
  return (
    <div className="card card-pad stat">
      <div className="stat-top">
        {Icon && (
          <div className="stat-icon" style={{ background: t.bg, color: t.fg }}>
            <Icon size={19} />
          </div>
        )}
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">{value}</div>
      {foot && <div className="stat-foot">{foot}</div>}
      {trend && (
        <div className="stat-foot">
          <span className={`trend ${trend.dir}`}>
            {trend.dir === 'up' ? '▲' : '▼'} {trend.value}
          </span>{' '}
          {trend.label}
        </div>
      )}
    </div>
  )
}

// --- Meter / progress bar --------------------------------------------------
export function Meter({ value, color = 'var(--primary)', showLabel = true }) {
  return (
    <div className="meter-row">
      <div className="meter">
        <span style={{ width: `${Math.min(100, value)}%`, background: color }} />
      </div>
      {showLabel && <span className="pctlabel">{value}%</span>}
    </div>
  )
}

// --- Avatar ----------------------------------------------------------------
export function Avatar({ initials, size = '', color }) {
  return (
    <div className={`avatar ${size}`} style={color ? { background: `${color}1a`, color } : undefined}>
      {initials}
    </div>
  )
}
