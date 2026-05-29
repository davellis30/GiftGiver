import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import {
  HeartPulse,
  PhoneCall,
  Users,
  CalendarDays,
  LayoutDashboard,
  Map,
  Bell,
  Search,
  Menu,
} from 'lucide-react'
import { StoreProvider, useStore } from './store'
import { ToastProvider, Avatar } from './components/ui'
import { initialsColor } from './utils/format'
import { getPatientsForCoordinator } from './data/selectors'

import OutreachDashboard from './pages/coordinator/OutreachDashboard'
import PatientPanel from './pages/coordinator/PatientPanel'
import PatientDetail from './pages/coordinator/PatientDetail'
import Schedule from './pages/coordinator/Schedule'
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard'
import CoordinatorDetail from './pages/supervisor/CoordinatorDetail'

function Sidebar({ role, setRole, open }) {
  const { patients, currentCoordinatorId } = useStore()
  const myPatients = getPatientsForCoordinator(patients, currentCoordinatorId)
  const needAttention = myPatients.filter((p) =>
    ['Unresponsive', 'Incomplete Contact Info'].includes(p.contactStatus),
  ).length

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <div className="brand-mark">
          <HeartPulse size={20} />
        </div>
        <div>
          <div className="brand-name">CareBridge</div>
          <div className="brand-sub">Health Cloud</div>
        </div>
      </div>

      {role === 'coordinator' ? (
        <>
          <div className="nav-section-label">My Workspace</div>
          <NavLink to="/coordinator/outreach" className="nav-link">
            <PhoneCall size={18} /> Outreach Dashboard
            {needAttention > 0 && <span className="badge">{needAttention}</span>}
          </NavLink>
          <NavLink to="/coordinator/patients" className="nav-link">
            <Users size={18} /> My Patients
            <span className="badge">{myPatients.length}</span>
          </NavLink>
          <NavLink to="/coordinator/schedule" className="nav-link">
            <CalendarDays size={18} /> Schedule
          </NavLink>
        </>
      ) : (
        <>
          <div className="nav-section-label">Supervision</div>
          <NavLink to="/supervisor" end className="nav-link">
            <LayoutDashboard size={18} /> Team Dashboard
          </NavLink>
          <NavLink to="/supervisor/states" className="nav-link">
            <Map size={18} /> State Performance
          </NavLink>
        </>
      )}

      <div className="sidebar-foot">
        <div className="nav-section-label" style={{ paddingLeft: 4 }}>
          View as
        </div>
        <div className="role-switch">
          <button
            className={role === 'coordinator' ? 'active' : ''}
            onClick={() => setRole('coordinator')}
          >
            Coordinator
          </button>
          <button
            className={role === 'supervisor' ? 'active' : ''}
            onClick={() => setRole('supervisor')}
          >
            Supervisor
          </button>
        </div>
      </div>
    </aside>
  )
}

function Topbar({ role, onMenu }) {
  const { currentCoordinator } = useStore()
  const person =
    role === 'supervisor'
      ? { name: 'Patricia Nguyen', initials: 'PN', sub: 'Regional Supervisor · 3 states' }
      : { name: currentCoordinator.name, initials: currentCoordinator.initials, sub: `Care Coordinator · ${currentCoordinator.region}, ${currentCoordinator.state}` }

  return (
    <header className="topbar">
      <button className="btn btn-ghost btn-icon menu-btn" onClick={onMenu} aria-label="Open menu">
        <Menu size={20} />
      </button>
      <div className="search" style={{ maxWidth: 320 }}>
        <Search size={16} />
        <input placeholder="Search patients, coordinators…" />
      </div>
      <div className="topbar-right">
        <button className="btn btn-ghost btn-icon" title="Notifications">
          <Bell size={18} />
        </button>
        <div className="user-chip">
          <Avatar initials={person.initials} color={initialsColor(person.name)} />
          <div className="stack" style={{ gap: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{person.name}</span>
            <span className="faint" style={{ fontSize: 11.5 }}>{person.sub}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

function Shell() {
  const location = useLocation()
  // Infer role from the active route so deep links land in the right chrome
  const [role, setRole] = useState(
    location.pathname.startsWith('/supervisor') ? 'supervisor' : 'coordinator',
  )
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  return (
    <div className="app-shell">
      <Sidebar role={role} setRole={setRole} open={drawerOpen} />
      <div
        className={`drawer-backdrop ${drawerOpen ? 'show' : ''}`}
        onClick={() => setDrawerOpen(false)}
      />
      <div className="main">
        <Topbar role={role} onMenu={() => setDrawerOpen((v) => !v)} />
        <main className="content">
          <Routes>
            <Route path="/" element={<Navigate to="/coordinator/outreach" replace />} />
            <Route path="/coordinator/outreach" element={<OutreachDashboard />} />
            <Route path="/coordinator/patients" element={<PatientPanel />} />
            <Route path="/coordinator/patients/:id" element={<PatientDetail />} />
            <Route path="/coordinator/schedule" element={<Schedule />} />
            <Route path="/supervisor" element={<SupervisorDashboard />} />
            <Route path="/supervisor/states" element={<SupervisorDashboard tab="states" />} />
            <Route path="/supervisor/coordinator/:id" element={<CoordinatorDetail />} />
            <Route path="*" element={<Navigate to="/coordinator/outreach" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </StoreProvider>
  )
}
