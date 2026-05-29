import { createContext, useContext, useMemo, useState, useCallback } from 'react'
import {
  patients as seedPatients,
  coordinators,
  CURRENT_COORDINATOR_ID,
} from './data/mockData'

// ---------------------------------------------------------------------------
// App store
//
// Holds the live patient list (seeded from mockData) and exposes the write
// actions a care coordinator performs: logging a call/email/visit, updating a
// patient's contact status, and scheduling appointments. In a real build these
// would issue Salesforce REST writes (Task/Event inserts, field updates).
// ---------------------------------------------------------------------------

const StoreCtx = createContext(null)
export const useStore = () => useContext(StoreCtx)

export function StoreProvider({ children }) {
  const [patients, setPatients] = useState(seedPatients)

  const updatePatient = useCallback((id, updater) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...(typeof updater === 'function' ? updater(p) : updater) } : p)),
    )
  }, [])

  const logActivity = useCallback((id, activity) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const entry = {
          id: `A-${Date.now()}`,
          date: new Date().toISOString(),
          durationMin: 0,
          notes: '',
          loggedByUser: true,
          ...activity,
        }
        const patch = { activities: [entry, ...p.activities] }
        // Reaching a patient bumps the last-contact date and can re-engage them
        if (entry.outcome && entry.outcome.startsWith('Reached')) {
          patch.lastContactDate = entry.date
          if (entry.outcome.includes('declined')) {
            patch.contactStatus = 'Refused Care'
          } else if (p.contactStatus !== 'Refused Care') {
            patch.contactStatus = 'Engaged'
          }
        }
        return { ...p, ...patch }
      }),
    )
  }, [])

  const scheduleAppointment = useCallback((id, iso) => {
    updatePatient(id, { nextAppointment: iso })
  }, [updatePatient])

  const setContactStatus = useCallback((id, status) => {
    updatePatient(id, { contactStatus: status })
  }, [updatePatient])

  const value = useMemo(
    () => ({
      patients,
      coordinators,
      currentCoordinatorId: CURRENT_COORDINATOR_ID,
      currentCoordinator: coordinators.find((c) => c.id === CURRENT_COORDINATOR_ID),
      updatePatient,
      logActivity,
      scheduleAppointment,
      setContactStatus,
    }),
    [patients, updatePatient, logActivity, scheduleAppointment, setContactStatus],
  )

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}
