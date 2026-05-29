# CareBridge — Behavioral Health Care Coordination

A React interface for a multi-state behavioral health company that contracts
directly with payers to care for severely ill patients on **Salesforce Health
Cloud**. It gives **Care Coordinators** a way to manage their 100-patient panel
and act directly on data, and gives **Supervisors** a way to see how their
coordinators and states are performing.

> The app runs entirely on a mock data layer (`src/data/mockData.js`) that
> simulates Health Cloud records (Patient/Account, CarePlan,
> MedicationStatement, Task/Event activities, and Claim objects). Swap those
> generators for live SOQL/REST queries to connect a real org.

## Getting started

```bash
npm install
npm run dev        # start the dev server (http://localhost:5173)
npm run build      # production build
npm run test:smoke # SSR render smoke test across every route
```

## Two roles, one app

Use the **View as** switch at the bottom of the sidebar to move between the
Care Coordinator workspace and the Supervisor view.

### Care Coordinator

The thing coordinators struggle with most is simply *reaching* their patients —
many refuse care, have incomplete contact information, or are unresponsive. The
workspace is built around that problem.

- **Outreach Dashboard** — every patient placed on the contactability
  dimension (Engaged · Unresponsive · Incomplete Contact Info · Refused Care)
  via a donut breakdown and a "time since last successful contact" urgency
  chart. A prioritized **work queue** (sorted by acuity and recency) lets the
  coordinator **place a call or send an email directly from the dashboard**.
  Clicking any status filters the queue to that group.
- **My Patients** — the full caseload with search and filters (status, acuity,
  payer) plus inline call/email actions.
- **Patient detail** — contact info (flagging missing phone/email), care plan
  goals, medications with adherence, a full activity timeline, risk score and
  claims, plus **Call / Email / Schedule** actions. Logging a successful call
  updates the patient's contact status and last-contact date live.
- **Schedule** — an agenda of upcoming appointments grouped by day.

#### Acting on the data

- **Call** opens a softphone-style dialer (Salesforce CTI), then captures the
  call outcome, duration, and notes as an activity.
- **Email** composes from templates (check-in, reminder, resources) and logs
  the send.
- **Schedule** creates an appointment (Health Cloud Event).

Missing phone/email is surfaced everywhere so coordinators know when contact
information needs to be completed before outreach is even possible.

### Supervisor

- **Team Dashboard** — patients under management, average engagement rate, the
  overall **claims-filed percentage**, and high-acuity load; an engagement-rate
  bar chart colored by state; top-performer / needs-support highlights; and a
  sortable coordinator performance table. Click any coordinator to drill in.
- **State Performance** — per-state cards and a side-by-side engagement vs.
  claims-filed comparison across the three states.
- **Coordinator detail** — one coordinator's KPIs, panel contactability
  breakdown, and their highest-acuity unreachable patients.

## Tech

React 18 · Vite · React Router · Recharts · Lucide icons. State lives in a
small store (`src/store.jsx`) so coordinator actions (logging calls/emails,
changing status, scheduling) update the dashboards in real time.

## Project structure

```
src/
  App.jsx                     # shell, sidebar, role switch, routes
  store.jsx                   # live patient state + write actions
  data/
    mockData.js               # seeded Health Cloud-style record generator
    selectors.js              # pure derived metrics
  components/
    ui.jsx                    # StatCard, StatusPill, Meter, toasts, avatar
    ContactActions.jsx        # Call / Email / Schedule modals
  pages/
    coordinator/              # OutreachDashboard, PatientPanel, PatientDetail, Schedule
    supervisor/               # SupervisorDashboard, CoordinatorDetail
```
