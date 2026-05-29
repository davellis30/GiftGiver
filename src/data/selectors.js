// Pure selectors / derived metrics. All take a live patient list so the UI
// can mutate state (log calls, change statuses) and have metrics recompute.

import { CONTACT_STATUSES, STATUS_META, STATES } from './mockData'

const UNREACHABLE = ['Unresponsive', 'Incomplete Contact Info']

export function getPatientsForCoordinator(patients, coordinatorId) {
  return patients.filter((p) => p.coordinatorId === coordinatorId)
}

export function getPatientById(patients, id) {
  return patients.find((p) => p.id === id)
}

export function statusBreakdown(patientList) {
  const counts = Object.fromEntries(CONTACT_STATUSES.map((s) => [s, 0]))
  patientList.forEach((p) => {
    counts[p.contactStatus] += 1
  })
  return CONTACT_STATUSES.map((s) => ({
    status: s,
    count: counts[s],
    pct: patientList.length ? Math.round((counts[s] / patientList.length) * 100) : 0,
    color: STATUS_META[s].color,
  }))
}

export function coordinatorMetrics(patients, coordinatorId) {
  const list = getPatientsForCoordinator(patients, coordinatorId)
  const total = list.length
  const engaged = list.filter((p) => p.contactStatus === 'Engaged').length
  const unreachable = list.filter((p) => UNREACHABLE.includes(p.contactStatus)).length
  const refused = list.filter((p) => p.contactStatus === 'Refused Care').length
  const claimsFiled = list.reduce((s, p) => s + p.claimsFiled, 0)
  const claimsEligible = list.reduce((s, p) => s + p.claimsEligible, 0)
  const highRisk = list.filter((p) => p.acuity === 'High').length
  const apptsScheduled = list.filter((p) => p.nextAppointment).length

  return {
    coordinatorId,
    total,
    engaged,
    unreachable,
    refused,
    engagementRate: total ? Math.round((engaged / total) * 100) : 0,
    claimsFiled,
    claimsEligible,
    claimsRate: claimsEligible ? Math.round((claimsFiled / claimsEligible) * 100) : 0,
    highRisk,
    apptsScheduled,
  }
}

export function allCoordinatorMetrics(patients, coordinators) {
  return coordinators.map((c) => ({ ...c, ...coordinatorMetrics(patients, c.id) }))
}

export function stateBreakdown(patients, coordinators) {
  return STATES.map((state) => {
    const list = patients.filter((p) => p.state === state)
    const engaged = list.filter((p) => p.contactStatus === 'Engaged').length
    const unreachable = list.filter((p) => UNREACHABLE.includes(p.contactStatus)).length
    const claimsFiled = list.reduce((s, p) => s + p.claimsFiled, 0)
    const claimsEligible = list.reduce((s, p) => s + p.claimsEligible, 0)
    const coords = coordinators.filter((c) => c.state === state).length
    return {
      state,
      patients: list.length,
      coordinators: coords,
      engaged,
      unreachable,
      engagementRate: list.length ? Math.round((engaged / list.length) * 100) : 0,
      claimsRate: claimsEligible ? Math.round((claimsFiled / claimsEligible) * 100) : 0,
    }
  })
}
