// ---------------------------------------------------------------------------
// Mock data layer
//
// Simulates records that would normally be sourced from Salesforce Health
// Cloud (Account/Patient, CareProgramEnrollee, CarePlan, MedicationStatement,
// Task/Event activities, and Claim objects) via the Salesforce REST API.
//
// All data is generated deterministically from a seeded PRNG so the UI is
// stable across reloads. Replace the generators here with real SOQL/REST
// queries when wiring up a live Health Cloud org.
// ---------------------------------------------------------------------------

// Deterministic pseudo-random number generator (mulberry32)
function makeRng(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rng = makeRng(20260529)
const pick = (arr) => arr[Math.floor(rng() * arr.length)]
const pickWeighted = (entries) => {
  // entries: [[value, weight], ...]
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let r = rng() * total
  for (const [value, w] of entries) {
    if (r < w) return value
    r -= w
  }
  return entries[entries.length - 1][0]
}
const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min

// --- Reference data --------------------------------------------------------

export const STATES = ['California', 'Texas', 'Florida']

const REGIONS = {
  California: ['Bay Area', 'Los Angeles', 'Central Valley'],
  Texas: ['Houston Metro', 'Dallas–Fort Worth', 'San Antonio'],
  Florida: ['Miami-Dade', 'Tampa Bay', 'Orlando'],
}

export const PAYERS = [
  'Aetna Better Health',
  'UnitedHealthcare Community',
  'Cigna HealthSpring',
  'Humana Behavioral',
  'Centene / Ambetter',
]

const CONDITIONS = [
  'Schizophrenia',
  'Schizoaffective Disorder',
  'Bipolar I Disorder',
  'Major Depressive Disorder',
  'Substance Use Disorder',
  'Severe PTSD',
  'Borderline Personality Disorder',
]

export const CONTACT_STATUSES = [
  'Engaged',
  'Unresponsive',
  'Incomplete Contact Info',
  'Refused Care',
]

// Status presentation metadata used across the UI
export const STATUS_META = {
  Engaged: { color: '#16a34a', label: 'Engaged', desc: 'In active, regular contact' },
  Unresponsive: { color: '#f59e0b', label: 'Unresponsive', desc: 'Outreach attempted, no reply' },
  'Incomplete Contact Info': {
    color: '#6366f1',
    label: 'Incomplete Contact Info',
    desc: 'Missing or invalid phone/email',
  },
  'Refused Care': { color: '#dc2626', label: 'Refused Care', desc: 'Patient declined services' },
}

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Carlos', 'Maria', 'Luis', 'Ana', 'Jose', 'Carmen', 'DeShawn',
  'Aaliyah', 'Marcus', 'Tanya', 'Wei', 'Mei', 'Raj', 'Priya', 'Ahmed', 'Fatima',
  'Hannah', 'Noah', 'Olivia', 'Ethan', 'Sophia', 'Liam',
]
const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Nguyen',
  'Patel', 'Kim', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres',
]

const MEDICATIONS = [
  { name: 'Clozapine', dosages: ['25 mg', '50 mg', '100 mg'], freq: 'Twice daily' },
  { name: 'Risperidone', dosages: ['1 mg', '2 mg', '4 mg'], freq: 'Once daily' },
  { name: 'Aripiprazole', dosages: ['5 mg', '10 mg', '15 mg'], freq: 'Once daily' },
  { name: 'Lithium Carbonate', dosages: ['300 mg', '600 mg'], freq: 'Twice daily' },
  { name: 'Sertraline', dosages: ['50 mg', '100 mg'], freq: 'Once daily' },
  { name: 'Quetiapine', dosages: ['100 mg', '200 mg', '300 mg'], freq: 'At bedtime' },
  { name: 'Buprenorphine/Naloxone', dosages: ['8 mg / 2 mg'], freq: 'Once daily' },
  { name: 'Lamotrigine', dosages: ['100 mg', '200 mg'], freq: 'Once daily' },
  { name: 'Venlafaxine XR', dosages: ['75 mg', '150 mg'], freq: 'Once daily' },
]

const CARE_GOALS = [
  'Reduce psychiatric hospitalization episodes',
  'Establish stable housing',
  'Achieve medication adherence above 90%',
  'Attend weekly outpatient therapy',
  'Complete substance-use treatment program',
  'Re-engage with primary care provider',
  'Build a relapse-prevention safety plan',
  'Improve daily-living independence',
  'Connect with peer support group',
  'Coordinate transportation to appointments',
]

const ACTIVITY_OUTCOMES_BY_STATUS = {
  Engaged: ['Reached — productive', 'Reached — productive', 'Left voicemail', 'Reached — productive'],
  Unresponsive: ['No answer', 'Left voicemail', 'Mailbox full', 'No answer'],
  'Incomplete Contact Info': ['Number disconnected', 'Email bounced', 'No valid contact on file'],
  'Refused Care': ['Reached — declined services', 'Reached — declined services', 'Hung up'],
}

// --- Care coordinators -----------------------------------------------------

const COORDINATOR_DEFS = [
  { id: 'CC-01', name: 'Maria Santos', state: 'California', region: 'Bay Area', tenureMonths: 41 },
  { id: 'CC-02', name: 'Darnell Pierce', state: 'California', region: 'Los Angeles', tenureMonths: 28 },
  { id: 'CC-03', name: 'Grace Okafor', state: 'California', region: 'Central Valley', tenureMonths: 9 },
  { id: 'CC-04', name: 'Tyler Brennan', state: 'Texas', region: 'Houston Metro', tenureMonths: 33 },
  { id: 'CC-05', name: 'Sofia Reyes', state: 'Texas', region: 'Dallas–Fort Worth', tenureMonths: 16 },
  { id: 'CC-06', name: 'Aisha Karim', state: 'Florida', region: 'Miami-Dade', tenureMonths: 52 },
  { id: 'CC-07', name: 'Brandon Wells', state: 'Florida', region: 'Tampa Bay', tenureMonths: 6 },
]

// The signed-in care coordinator
export const CURRENT_COORDINATOR_ID = 'CC-01'

// Each coordinator gets a target panel of 100 patients. We slightly randomize
// to make the data feel real (some panels are over/under target).
const PANEL_SIZE = 100

// Status distribution shifts by coordinator "skill" so the supervisor view
// shows meaningful variation in who is succeeding at engagement.
const COORDINATOR_PROFILE = {
  'CC-01': { Engaged: 58, Unresponsive: 20, 'Incomplete Contact Info': 10, 'Refused Care': 12 },
  'CC-02': { Engaged: 49, Unresponsive: 26, 'Incomplete Contact Info': 12, 'Refused Care': 13 },
  'CC-03': { Engaged: 34, Unresponsive: 34, 'Incomplete Contact Info': 19, 'Refused Care': 13 },
  'CC-04': { Engaged: 61, Unresponsive: 18, 'Incomplete Contact Info': 9, 'Refused Care': 12 },
  'CC-05': { Engaged: 45, Unresponsive: 28, 'Incomplete Contact Info': 14, 'Refused Care': 13 },
  'CC-06': { Engaged: 63, Unresponsive: 17, 'Incomplete Contact Info': 8, 'Refused Care': 12 },
  'CC-07': { Engaged: 31, Unresponsive: 33, 'Incomplete Contact Info': 22, 'Refused Care': 14 },
}

function isoDaysAgo(days) {
  const d = new Date('2026-05-29T12:00:00')
  d.setDate(d.getDate() - days)
  return d.toISOString()
}
function isoDaysAhead(days) {
  const d = new Date('2026-05-29T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function makePhone() {
  return `(${randInt(200, 989)}) ${randInt(200, 989)}-${String(randInt(0, 9999)).padStart(4, '0')}`
}

function makeActivities(status, count) {
  const subjects = {
    Call: ['Outreach call', 'Check-in call', 'Appointment reminder', 'Medication follow-up'],
    Email: ['Welcome email', 'Resource packet', 'Appointment confirmation', 'Care plan update'],
    Visit: ['Home visit', 'Clinic visit', 'Telehealth session'],
  }
  const acts = []
  for (let i = 0; i < count; i++) {
    const type = pickWeighted([
      ['Call', 5],
      ['Email', 3],
      ['Visit', 2],
    ])
    const outcome = pick(ACTIVITY_OUTCOMES_BY_STATUS[status])
    acts.push({
      id: `A-${randInt(100000, 999999)}`,
      type,
      subject: pick(subjects[type]),
      date: isoDaysAgo(randInt(0, 90)),
      outcome,
      durationMin: type === 'Email' ? 0 : randInt(3, 35),
      notes: '',
    })
  }
  return acts.sort((a, b) => new Date(b.date) - new Date(a.date))
}

function makeCarePlan() {
  const n = randInt(2, 4)
  const goals = [...CARE_GOALS].sort(() => rng() - 0.5).slice(0, n)
  return goals.map((goal) => ({
    goal,
    status: pickWeighted([
      ['On Track', 4],
      ['At Risk', 3],
      ['Not Started', 2],
      ['Met', 1],
    ]),
    targetDate: isoDaysAhead(randInt(20, 180)),
  }))
}

function makeMedications() {
  const n = randInt(1, 4)
  const chosen = [...MEDICATIONS].sort(() => rng() - 0.5).slice(0, n)
  return chosen.map((m) => ({
    name: m.name,
    dosage: pick(m.dosages),
    frequency: m.freq,
    adherence: randInt(35, 99),
    lastFilled: isoDaysAgo(randInt(1, 60)),
  }))
}

let patientCounter = 0
function makePatient(coordinator) {
  patientCounter += 1
  const profile = COORDINATOR_PROFILE[coordinator.id]
  const status = pickWeighted(Object.entries(profile).map(([k, v]) => [k, v]))
  const first = pick(FIRST_NAMES)
  const last = pick(LAST_NAMES)
  const incomplete = status === 'Incomplete Contact Info'

  // Patients who can't be reached have fewer/older contacts and no upcoming appt
  const reachable = status === 'Engaged'
  const attempts = reachable ? randInt(1, 4) : randInt(3, 14)
  const lastContact = status === 'Engaged' ? isoDaysAgo(randInt(0, 14)) : status === 'Refused Care' ? isoDaysAgo(randInt(10, 60)) : status === 'Unresponsive' ? isoDaysAgo(randInt(20, 120)) : null

  const acuity = pickWeighted([
    ['High', 5],
    ['Medium', 3],
    ['Low', 2],
  ])

  // Claims are filed for visits/services rendered. Engaged patients generate
  // far more billable encounters than unreachable ones.
  const claimsEligible = reachable ? randInt(6, 18) : randInt(0, 6)
  const claimsFiled = reachable
    ? Math.max(0, claimsEligible - randInt(0, 2))
    : Math.max(0, claimsEligible - randInt(0, 4))

  return {
    id: `P-${String(patientCounter).padStart(4, '0')}`,
    name: `${first} ${last}`,
    initials: `${first[0]}${last[0]}`,
    age: randInt(19, 74),
    gender: pick(['Female', 'Male', 'Nonbinary']),
    state: coordinator.state,
    region: coordinator.region,
    payer: pick(PAYERS),
    condition: pick(CONDITIONS),
    acuity,
    riskScore: acuity === 'High' ? randInt(70, 98) : acuity === 'Medium' ? randInt(40, 75) : randInt(10, 45),
    contactStatus: status,
    phone: incomplete && rng() < 0.6 ? null : makePhone(),
    email:
      incomplete && rng() < 0.7
        ? null
        : `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    address: `${randInt(100, 9999)} ${pick(['Oak', 'Maple', 'Main', 'Elm', 'Cedar', 'Pine'])} ${pick(['St', 'Ave', 'Blvd', 'Dr'])}`,
    coordinatorId: coordinator.id,
    enrolledDate: isoDaysAgo(randInt(30, 720)),
    lastContactDate: lastContact,
    nextAppointment: reachable && rng() < 0.7 ? isoDaysAhead(randInt(1, 21)) : null,
    attemptedContacts: attempts,
    carePlan: makeCarePlan(),
    medications: makeMedications(),
    activities: makeActivities(status, reachable ? randInt(4, 10) : randInt(2, 8)),
    claimsEligible,
    claimsFiled,
  }
}

// Build coordinators + their patient panels
export const coordinators = COORDINATOR_DEFS.map((def) => ({
  ...def,
  initials: def.name
    .split(' ')
    .map((w) => w[0])
    .join(''),
  email: `${def.name.split(' ')[0].toLowerCase()}.${def.name.split(' ')[1].toLowerCase()}@carebridge.health`,
  phone: makePhone(),
}))

export const patients = []
coordinators.forEach((c) => {
  const size = PANEL_SIZE + randInt(-6, 6)
  for (let i = 0; i < size; i++) {
    patients.push(makePatient(c))
  }
})

// Derived metrics and selectors live in ./selectors.js (pure functions that
// operate on a live patient list so the UI can mutate state interactively).
