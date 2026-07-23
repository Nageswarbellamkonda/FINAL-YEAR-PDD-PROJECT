# NyayaMitra — Complete Project Handover Document (Part 1: SRS & Overview)

**Document Version:** 1.0
**Date:** July 2026
**Author:** Nageswar Bellamkonda (Original Developer)
**Prepared By:** Engineering Handover Generation
**Platform of Origin:** Base44 (BaaS) — React + Vite + Tailwind CSS
**Classification:** Engineering Handover / SRS / SDD / Architecture / Migration Guide

> This is **Part 1 of 3**. Covers Sections 1-11 (Executive Summary → Screen Documentation).
> Part 2 covers Sections 12-17 (Business Logic → Security).
> Part 3 covers Sections 18-22 (Base44 Dependency → Professional Review) + Appendices.

---

## Table of Contents (Full Document)

1. Executive Summary *(Part 1)*
2. Complete Project Overview *(Part 1)*
3. Complete System Architecture *(Part 1)*
4. Technology Stack *(Part 1)*
5. Folder Structure *(Part 1)*
6. Database Design *(Part 1)*
7. Authentication & Authorization *(Part 1)*
8. Storage *(Part 1)*
9. API Documentation *(Part 1)*
10. User Roles *(Part 1)*
11. Screen Documentation *(Part 1)*
12. Business Logic *(Part 2)*
13. AI Features *(Part 2)*
14. Environment Variables *(Part 2)*
15. External Services *(Part 2)*
16. Deployment *(Part 2)*
17. Security *(Part 2)*
18. Base44 Dependency Analysis *(Part 3)*
19. Migration Guide *(Part 3)*
20. Missing Features & Recommendations *(Part 3)*
21. Future Scope *(Part 3)*
22. Professional Review *(Part 3)*

---

## 1. Executive Summary

### 1.1 Project Purpose

**NyayaMitra** (న్యాయ మిత్ర — "Friend of Justice") is a next-generation **Smart Policing & Citizen Safety Platform** built for the **Andhra Pradesh Police Department**. It bridges the gap between citizens and law enforcement by providing a single, unified, AI-powered digital interface for complaint filing, case tracking, police operations, legal aid, and court workflows.

### 1.2 Problem Statement

| # | Problem | Impact |
|---|---------|--------|
| 1 | Citizens must physically visit police stations to file complaints | Delay, intimidation, lost evidence |
| 2 | No real-time case status visibility | Citizens lose trust in the system |
| 3 | Police duty rosters, attendance, and patrol tracking are manual | Inefficient resource allocation |
| 4 | Cyber fraud victims lose the "golden hour" (60-min recovery window) | Money rarely recovered |
| 5 | Lawyers and courts have no digital link to police case files | Slower justice delivery |
| 6 | Senior officers (DSP/DGP) lack real-time crime intelligence dashboards | Reactive, not proactive policing |

### 1.3 Objectives

1. **Digitize complaint filing** with proof upload and auto-generated case IDs.
2. **Provide real-time case tracking** for citizens via unique case IDs.
3. **Enable GPS-verified officer attendance** within 100m of station.
4. **Provide a Golden Hour cyber fraud recovery portal** for 60-min account freezing.
5. **Create role-based dashboards** for Station, DSP, DGP, Lawyer, and Court officers.
6. **Integrate AI** for legal guidance, crime analysis, safe-route suggestions, and police advisory.
7. **Support bilingual UI** (English + Telugu) for rural accessibility.
8. **Pilot in 5 districts** of Andhra Pradesh before state-wide rollout.

### 1.4 Target Users

| Tier | Users |
|------|-------|
| **Citizens** | General public, victims, complainants |
| **Police — Station Level** | Constables, Head Constables, ASIs, SIs, CIs |
| **Police — District Level** | DSPs, SPs |
| **Police — State Command** | DGP, ADG, IG, DIG |
| **Legal** | Advocates / Lawyers |
| **Judicial** | Court Officers / Court Clerks |
| **Admin** | System Administrators |

### 1.5 Real-World Use Case

> A citizen in Visakhapatnam loses ₹45,000 to an OTP fraud. Instead of travelling to a station, they open NyayaMitra, file a cyber complaint with a screenshot, and immediately enter the **Golden Hour Cyber Portal** — the system notifies the cyber crime cell and generates a freeze request to the bank. Meanwhile, the assigned SI at Gajuwaka PS sees the case appear on their Station Dashboard, the DSP sees it in the district overview, and the DGP sees it in the state crime intelligence feed. A lawyer is assigned for legal opinion, and when the case reaches court, a court officer schedules a hearing. The citizen tracks everything via their Case ID.

### 1.6 Expected Outcomes

- Reduced average complaint filing time from **hours to minutes**
- Increased cyber fraud **recovery rate** via golden-hour protocol
- Transparent, real-time case status for **100% of filed complaints**
- Data-driven policing through **crime heat maps & AI analysis**
- Unified digital workflow across **Police → Lawyer → Court**

---

## 2. Complete Project Overview

### 2.1 Module Inventory

The application is organized into the following functional modules. Each is implemented as a React page under `src/pages/`.

#### 2.1.1 Public / Landing Module

| Screen | Route | Purpose |
|--------|-------|---------|
| Splash | (internal) | Animated 4-second branded loading screen |
| Home | `/` | Citizen portal homepage with quick actions, map, notice board, constitution section, emergency helplines |
| AuthPortal | `/auth` | Role-selection login gateway (6 roles) |
| CompleteProfile | `/complete-profile` | Mandatory profile setup post-login (role-specific fields) |

#### 2.1.2 Citizen Module

| Screen | Route | Purpose |
|--------|-------|---------|
| CitizenDashboard | `/citizen-dashboard` | Personal dashboard for a citizen's cases, alerts, safety tools |
| FileComplaint | `/file-complaint` | File a complaint with category, district, mandal, station, proof upload; auto-generates case ID |
| TrackCase | `/track-case` | Track any complaint by case ID; shows full timeline & action updates |
| CitizenChat | `/citizen-chat` | Chat interface between citizen and assigned police officer |
| Feedback | `/feedback` | Rate services and leave a review |
| Contact | `/contact` | Contact police departments and lawyers |
| ConstitutionRights | `/constitution-rights` | BNS, BNSS, BSA laws and citizen rights reference |
| FIRDocument | `/fir-document` | FIR document generator |
| LegalDocuments | `/legal-documents` | Generate legal drafts (FIR summary, charge sheet, petitions) from case data |
| SafeRoute | `/safe-route` | AI route navigation avoiding crime zones |
| TrustedCircle | `/trusted-circle` | Emergency contacts & family SOS network |
| SmartAlerts | `/smart-alerts` | AI crime risk alerts and predictions |
| PoliceStations | `/police-stations` | Find AP police stations by district |
| Departments | `/departments` | Police department directory (Narcotics, Cyber, CID, Traffic) |
| NyayaAIAssistant | `/nyaya-ai` | AI legal guidance, cyber help & police advisor chat |

#### 2.1.3 Police — Station Level Module

| Screen | Route | Purpose |
|--------|-------|---------|
| StationDashboard | `/station-dashboard` | Station cases, cyber ops, attendance, duties (4 tabs) |
| OfficerDashboard | `/officer-dashboard` | General officer dashboard with case management |
| AttendanceSystem | `/attendance` | GPS-verified check-in within 100m of station |
| DutyManagement | `/duty-management` | Assign/manage patrol, bandobast, night duties |
| GoldenHourCyber | `/golden-hour-cyber` | Cyber fraud instant report & 1-hour freeze workflow |
| CaseManagement | `/case-management` | Case lifecycle management |
| PoliceAIAdvisor | `/police-ai-advisor` | AI advisory for police operations |

#### 2.1.4 Police — District Level Module

| Screen | Route | Purpose |
|--------|-------|---------|
| DSPDashboard | `/dsp-dashboard` | District-wide case overview, officer performance, alerts |
| AlertsAdmin | `/alerts-admin` | Publish district/station alerts & advisories |
| OfficerManagement | `/officer-management` | Manage officers under district jurisdiction |
| WorkforceMonitor | `/workforce-monitor` | Real-time workforce monitoring |

#### 2.1.5 Police — State Command Module

| Screen | Route | Purpose |
|--------|-------|---------|
| DGPDashboard | `/dgp-dashboard` | State command dashboard with KPIs, district rankings, crime trends, cyber intelligence |
| PerformanceDashboard | `/performance-dashboard` | Officer & district performance analytics |
| CrimeAnalysis | `/crime-analysis` | AI-driven crime analysis with charts |
| CrimeHeatMap | `/crime-heat-map` | AI crime hotspots & pattern intelligence map |
| CyberOpsCenter | `/cyber-ops` | State-wide cyber operations center |
| ActivityLog | `/activity-log` | System activity audit log |

#### 2.1.6 Legal & Judicial Module

| Screen | Route | Purpose |
|--------|-------|---------|
| LawyerDashboard | `/lawyer-dashboard` | Lawyer's assigned cases, legal opinions, document drafting, IPC reference, bail templates |
| CourtDashboard | `/court-dashboard` | Court cases ready for hearing scheduling, judge assignment |

#### 2.1.7 Cross-Cutting / Admin Module

| Screen | Route | Purpose |
|--------|-------|---------|
| Dashboard | `/dashboard` | Central router that redirects to role-specific dashboard |
| UnifiedDashboard | `/unified-dashboard` | Unified command center combining alerts, cases, tracking, AI |
| Analytics | `/analytics` | General analytics views |
| LiveTracking | `/live-tracking` | Live tracking interface |
| AdminPanel | `/admin-panel` | System admin panel |
| SystemAdminBoard | `/system-admin` | System administration board |

### 2.2 Feature Deep-Dive (Selected Core Features)

#### Feature: File Complaint

| Aspect | Detail |
|--------|--------|
| **Purpose** | Let a citizen file a complaint online with proof and receive a unique case ID |
| **Why it exists** | Replaces physical station visits; creates an auditable digital record |
| **User flow** | Home → File Complaint → Select category → Select district → mandal → station → Enter details → Upload proof → Submit → Receive case ID → Redirect to Track Case |
| **Backend flow** | `base44.entities.Complaint.create({...})` → auto-generates `case_id` (format: `NM-<DIST>-<SEQ>`) → assigns default department based on category → sets status `filed` |
| **Database interaction** | Creates a `Complaint` record; if category is cyber, also creates a linked `CyberCrimeReport` |
| **AI interaction** | Priority is auto-assigned based on category mapping (narcotics→high, theft→normal, etc.) |
| **Validation** | Required fields: title, description, category, complainant_name, complainant_phone, location. Phone validated as 10-digit Indian number. District restricted to 5 pilot districts. |
| **Error handling** | Toast notification on validation failure or API error |
| **Edge cases** | Offline submission not supported `[MISSING]`; proof file size limited by platform; demo data shown in station dashboard if no real complaints exist |

#### Feature: Track Case

| Aspect | Detail |
|--------|--------|
| **Purpose** | Let citizens track complaint status by case ID |
| **User flow** | Home → Track Case → Enter case ID → View status timeline, action updates, assigned officer, court dates |
| **Backend flow** | `base44.entities.Complaint.filter({ case_id })` → returns matching complaint |
| **Database interaction** | Reads `Complaint` by `case_id` field |
| **Validation** | Case ID format check |
| **Edge cases** | Case not found → "No case found" empty state; multiple matches → shows first |

#### Feature: Station Dashboard

| Aspect | Detail |
|--------|--------|
| **Purpose** | Station-level police officer's operational dashboard |
| **Why it exists** | SI/Constable needs a single view of their station's cases, cyber ops, attendance, and duties |
| **User flow** | Login → CompleteProfile → Dashboard routes to `/station-dashboard` → 4 tabs: Cases, Cyber Ops, Attendance, Duties |
| **Backend flow** | Fetches `Complaint`, `CyberCrimeReport`, `Attendance`, `DutyAssignment` filtered by user's district/station. Falls back to `DEMO_COMPLAINTS`, `DEMO_DUTIES`, `DEMO_CYBER`, `DEMO_ATTENDANCE` if empty. |
| **Database interaction** | Reads 4 entities; updates `Complaint.status` via `update()`; adds `action_updates` notes |
| **AI interaction** | None directly; links to Golden Hour portal for cyber |
| **Validation** | Status changes restricted to allowed enum values; demo records (ID starts with "demo") are read-only |
| **Edge cases** | Empty data → demo data injected for functional preview; chat with citizen via CaseChat component |

#### Feature: GPS-Verified Attendance

| Aspect | Detail |
|--------|--------|
| **Purpose** | Mark officer attendance only within 100m of their assigned station |
| **Why it exists** | Prevents proxy/distance attendance fraud |
| **User flow** | Attendance page → Select station → Click "Mark Attendance" → Browser geolocation API → Haversine distance to station coordinates → If ≤100m, create `Attendance` record with `location_verified: true` |
| **Backend flow** | `base44.entities.Attendance.create({ officer_email, officer_name, station, district, shift, latitude, longitude, distance_meters, location_verified, status })` |
| **Database interaction** | Creates `Attendance`; station coordinates from static `policeStations.js` |
| **Validation** | Distance ≤ 100m → present; 100-200m → late; >200m → absent/blocked |
| **Edge cases** | Geolocation denied → error toast; station not in pilot list → blocked |

#### Feature: Golden Hour Cyber Recovery

| Aspect | Detail |
|--------|--------|
| **Purpose** | Enable cyber fraud victims to report within 60 minutes for bank account freeze |
| **Why it exists** | The first 60 minutes are critical for freezing fraudster accounts before funds are withdrawn |
| **User flow** | File cyber complaint → Golden Hour portal → Enter fraud details (bank, account, UTR, amount) → System generates freeze request → Status tracks: reported → notified → bank_contacted → freeze_requested → freeze_confirmed → hold_placed → recovery_initiated → recovered/failed |
| **Backend flow** | Creates `CyberCrimeReport` linked to `Complaint` via `complaint_id`; updates `recovery_status` through stages |
| **Database interaction** | `CyberCrimeReport` entity with 9 recovery stages |
| **Edge cases** | Amount recovered partial → tracked separately from amount_lost |

#### Feature: Court Dashboard — Hearing Scheduling

| Aspect | Detail |
|--------|--------|
| **Purpose** | Court officers schedule hearings for cases marked `court_hearing` |
| **User flow** | Login as court officer → Dashboard → See cases with `status: court_hearing` → Select judge, court name, hearing type, date → Submit → Updates `Complaint.court_date` and adds action update |
| **Backend flow** | `base44.entities.Complaint.filter({ status: "court_hearing" })` → `update(id, { court_date, action_updates: [...existing, { date, update: "Hearing scheduled", by }] })` |
| **Database interaction** | Reads & updates `Complaint`; court list from `AP_COURTS` static array |
| **Validation** | Date must be future; judge from `JUDGES` list; hearing type from `HEARING_TYPES` |

#### Feature: Lawyer Dashboard

| Aspect | Detail |
|--------|--------|
| **Purpose** | Lawyers review assigned cases, add legal opinions, draft documents |
| **User flow** | Login as lawyer → Dashboard → See cases where `assigned_lawyer === user.email` or court-assigned → Review case → Add legal opinion → Access IPC section reference → Use bail templates → Draft documents via LegalDocuments |
| **Backend flow** | `base44.entities.Complaint.filter({ assigned_lawyer: user.email })` → display with case details, action updates, court dates |
| **Database interaction** | Reads `Complaint`; adds legal opinion as `action_update` |
| **Static reference** | `LEGAL_SECTIONS` (IPC/IT Act/NDPS), `BAIL_TEMPLATES` arrays |

#### Feature: NyayaAI Assistant

| Aspect | Detail |
|--------|--------|
| **Purpose** | AI chat assistant for legal guidance, cyber help, and police advisory |
| **User flow** | Open `/nyaya-ai` → Select quick prompt or type custom → `InvokeLLM` integration → Stream/display response |
| **Backend flow** | `base44.integrations.Core.InvokeLLM({ prompt, model, response_json_schema? })` |
| **AI interaction** | Uses Base44 Core LLM (model configurable: automatic, gemini_3_flash, gpt_5_5, claude_sonnet_4_6, etc.) |
| **Quick prompts** | Crime Summary, Cyber Guidance, Legal Rights, Duty Guidance, Case Priority, Officer Advice |

#### Feature: Crime Analysis & Heat Map

| Aspect | Detail |
|--------|--------|
| **Purpose** | AI-driven crime trend analysis for senior officers |
| **User flow** | Open `/crime-analysis` → Select time range → Fetch complaints → Display bar/line/pie charts → "Generate AI Report" → LLM produces markdown assessment |
| **Backend flow** | Fetch `Complaint` list → aggregate by category/district/date → `InvokeLLM` with aggregated data for insights |
| **AI interaction** | LLM generates predictive forecasts and resource allocation suggestions |

---

## 3. Complete System Architecture

### 3.1 High-Level Architecture Diagram (Text)

```
┌─────────────────────────────────────────────────────────────┐
│                       USER BROWSER                           │
│  (React SPA — Vite + Tailwind + shadcn/ui)                  │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  Pages   │  │Components│  │  Hooks   │  │  Lib     │      │
│  │ (30+)    │  │ (UI+feat)│  │          │  │ (auth,rbac)│    │
│  └────┬─────┘  └──────────┘  └──────────┘  └──────────┘    │
│       │                                                      │
│       ▼                                                      │
│  ┌────────────────────────────────────┐                      │
│  │  base44Client (Pre-initialized SDK) │                      │
│  │  @base44/sdk                        │                      │
│  └───────────────┬────────────────────┘                      │
└──────────────────┼──────────────────────────────────────────┘
                   │ HTTPS
                   ▼
┌──────────────────────────────────────────────────────────────┐
│                    BASE44 PLATFORM (BaaS)                     │
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│  │  Auth Svc  │  │  Database  │  │  Storage   │              │
│  │ (JWT+OTP)  │  │ (MongoDB)  │  │ (File S3)  │              │
│  └────────────┘  └────────────┘  └────────────┘              │
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│  │ Integrations│  │  Realtime  │  │  Hosting   │              │
│  │ (LLM,Email)│  │ (WebSockets)│  │ (CDN)     │              │
│  └────────────┘  └────────────┘  └────────────┘              │
└──────────────────────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│                  EXTERNAL AI / EMAIL SERVICES                  │
│  LLM Providers (GPT-5, Gemini, Claude)  •  Email (SendGrid)   │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Frontend Architecture

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| **Router** | react-router-dom v6 | URL → Page mapping; Layout wrapper via `<Outlet />` |
| **State — Auth** | React Context (`AuthContext`) | Current user, auth state, login/logout/redirect |
| **State — Server** | @tanstack/react-query | Server state caching, fetching, mutations |
| **State — Local** | useState/useEffect | Component-level UI state |
| **State — Language** | LanguageContext | English/Telugu toggle |
| **Data Access** | `@base44/sdk` via `base44Client.js` | Entity CRUD, auth, integrations, realtime |
| **UI Components** | shadcn/ui (Radix primitives) | Buttons, Cards, Selects, Dialogs, Tabs, etc. |
| **Styling** | Tailwind CSS + CSS variables (`index.css`) | Token-based design system |
| **Icons** | lucide-react | All icons |
| **Charts** | recharts | Bar, Line, Pie charts |
| **Maps** | react-leaflet | AP police map, crime heat map |
| **Animations** | framer-motion | Page transitions, card animations, splash |
| **Markdown** | react-markdown | Rendering AI/LLM responses |
| **Drag & Drop** | @hello-pangea/dnd | Duty/officer reordering |

### 3.3 Backend Architecture (Base44-Hosted)

| Service | Description |
|---------|-------------|
| **Auth** | Email/password login with OTP verification; JWT sessions; platform-managed |
| **Database** | Document-based (MongoDB under the hood); entities defined as JSON schemas |
| **Storage** | File storage for proof uploads (`UploadFile`, `UploadPrivateFile`) |
| **Integrations** | `InvokeLLM` (multi-model), `SendEmail`, `GenerateImage`, `GenerateSpeech`, `GenerateVideo`, `TranscribeAudio`, `ExtractDataFromUploadedFile` |
| **Realtime** | WebSocket subscriptions on entities (`entity.subscribe(callback)`) |
| **Hosting** | Static SPA hosting with CDN |

### 3.4 Data Flow

```
Citizen Files Complaint
  │
  ├─► FileComplaint.jsx
  │     ├─► UploadFile (proof) → returns file_url
  │     ├─► base44.entities.Complaint.create({...})
  │     │     └─► MongoDB insert → returns record with id, case_id
  │     └─► toast.success → navigate("/track-case?id=...")
  │
  ▼
Station Officer Opens Dashboard
  │
  ├─► StationDashboard.jsx
  │     ├─► base44.entities.Complaint.filter({district, station})
  │     ├─► Realtime: Complaint.subscribe(event => update state)
  │     └─► If empty → inject DEMO_COMPLAINTS
  │
  ▼
Officer Updates Status
  │
  ├─► base44.entities.Complaint.update(id, {status, action_updates})
  │     └─► MongoDB update → realtime event → all subscribers update
  │
  ▼
Status → court_hearing
  │
  ├─► CourtDashboard.jsx sees case
  │     ├─► Schedule hearing → update(id, {court_date, action_updates})
  │     └─► LawyerDashboard sees assigned case (if assigned_lawyer set)
  │
  ▼
Status → resolved/closed
  │
  └─► Citizen sees final status in TrackCase
```

### 3.5 Authentication Flow

```
1. User visits app → Splash → Home (public)
2. User clicks "Login" → AuthPortal → selects role
3. Platform login page (email/password or OTP)
4. On success → token stored in localStorage
5. AuthContext.checkAppState() → fetches public-settings → checkUserAuth()
6. base44.auth.me() → returns current user object
7. If user.data.profile_complete !== true → redirect to /complete-profile
8. CompleteProfile saves role-specific data via base44.auth.updateMe({...})
9. Dashboard.jsx routes to role-specific dashboard
```

---

## 4. Technology Stack

### 4.1 Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.2.0 | UI framework |
| react-dom | ^18.2.0 | React DOM renderer |
| react-router-dom | ^6.26.0 | Client-side routing |
| vite | (dev) | Build tool & dev server |
| tailwindcss | ^3.x | Utility-first CSS framework |
| tailwindcss-animate | ^1.0.7 | Tailwind animation utilities |
| @tanstack/react-query | ^5.84.1 | Server state management |
| framer-motion | ^11.16.4 | Animations & transitions |
| recharts | ^2.15.4 | Data visualization charts |
| react-leaflet | ^4.2.1 | Interactive maps |
| lucide-react | ^0.475.0 | Icon library |
| react-markdown | ^9.0.1 | Render markdown (AI responses) |
| react-hook-form | ^7.54.2 | Form state management |
| @hookform/resolvers | ^4.1.2 | Form validation resolvers |
| zod | ^3.24.2 | Schema validation |
| date-fns | ^3.6.0 | Date utilities |
| moment | ^2.30.1 | Date formatting (used in dashboards) |
| lodash | ^4.17.21 | Utility functions |
| react-quill | ^2.0.0 | Rich text editor (legal docs) |
| @hello-pangea/dnd | ^17.0.0 | Drag and drop |
| three | ^0.171.0 | 3D rendering (reserved for 3D crime maps) |
| canvas-confetti | ^1.9.4 | Celebration effects |
| html2canvas | ^1.4.1 | HTML-to-image (document export) |
| jspdf | ^4.0.0 | PDF generation (legal documents) |
| sonner | ^2.0.1 | Toast notifications |
| next-themes | ^0.4.4 | Dark mode theme switching |
| class-variance-authority | ^0.7.1 | Component variant styling |
| clsx | ^2.1.1 | Class name utility |
| tailwind-merge | ^3.0.2 | Tailwind class merging |
| cmdk | ^1.0.0 | Command palette |
| vaul | ^1.1.2 | Drawer component |

### 4.2 UI Primitives (shadcn/ui — Radix-based)

| Package | Purpose |
|---------|---------|
| @radix-ui/react-accordion | Accordion |
| @radix-ui/react-alert-dialog | Alert dialogs |
| @radix-ui/react-aspect-ratio | Aspect ratio |
| @radix-ui/react-avatar | Avatars |
| @radix-ui/react-checkbox | Checkboxes |
| @radix-ui/react-collapsible | Collapsible sections |
| @radix-ui/react-context-menu | Context menus |
| @radix-ui/react-dialog | Dialogs |
| @radix-ui/react-dropdown-menu | Dropdown menus |
| @radix-ui/react-hover-card | Hover cards |
| @radix-ui/react-label | Labels |
| @radix-ui/react-menubar | Menubars |
| @radix-ui/react-navigation-menu | Navigation menus |
| @radix-ui/react-popover | Popovers |
| @radix-ui/react-progress | Progress bars |
| @radix-ui/react-radio-group | Radio groups |
| @radix-ui/react-scroll-area | Scroll areas |
| @radix-ui/react-select | Select dropdowns |
| @radix-ui/react-separator | Separators |
| @radix-ui/react-slider | Sliders |
| @radix-ui/react-slot | Slot composition |
| @radix-ui/react-switch | Toggle switches |
| @radix-ui/react-tabs | Tabs (used in StationDashboard) |
| @radix-ui/react-toast | Toast system |
| @radix-ui/react-toggle | Toggles |
| @radix-ui/react-toggle-group | Toggle groups |
| @radix-ui/react-tooltip | Tooltips |
| input-otp | OTP input |
| react-day-picker | Date pickers |
| react-resizable-panels | Resizable panels |
| embla-carousel-react | Carousel (hero awareness) |

### 4.3 Backend / Platform

| Component | Technology | Purpose |
|-----------|-----------|---------|
| BaaS Platform | Base44 | Auth, DB, Storage, Integrations, Hosting |
| SDK | @base44/sdk ^0.8.39 | Frontend client for all backend calls |
| Vite Plugin | @base44/vite-plugin ^1.0.30 | Build integration |
| Database | MongoDB (via Base44) | Document store for entities |
| Auth | Base44 Auth (JWT + OTP) | Session management |
| File Storage | Base44 Storage (S3-backed) | Proof uploads, generated files |
| AI/LLM | Base44 Core InvokeLLM | Multi-model LLM gateway |

### 4.4 Why Each Is Used

| Technology | Rationale |
|-----------|-----------|
| **React + Vite** | Fast HMR, modern SPA, large ecosystem |
| **Tailwind** | Utility-first, consistent design tokens, responsive |
| **shadcn/ui** | Accessible, customizable, Radix primitives |
| **react-router-dom v6** | Declarative nested routing with Layout/Outlet |
| **@tanstack/react-query** | Caching, refetch, optimistic updates |
| **framer-motion** | Smooth splash & card animations |
| **recharts** | Simple, declarative charts for dashboards |
| **react-leaflet** | Free OSM maps, no API key needed |
| **moment** | Convenient relative time ("2 hours ago") |
| **jspdf + html2canvas** | Client-side PDF for legal documents |
| **zod + react-hook-form** | Type-safe form validation |
| **@base44/sdk** | Single SDK for all backend (auth, entities, integrations) |

---

## 5. Folder Structure

```
nyaya-mitra/
├── index.html                  # HTML entry; title, meta, fonts
├── package.json                # Dependencies & scripts
├── vite.config.js              # Vite + Base44 plugin config
├── tailwind.config.js          # Tailwind theme tokens mapping
├── postcss.config.js           # PostCSS (Tailwind + autoprefixer)
├── jsconfig.json               # JS path aliases (@ → /src)
├── components.json             # shadcn/ui config
├── eslint.config.js            # Linting rules
├── .gitignore
├── README.md
│
├── base44/
│   ├── config.jsonc            # App name & build config
│   ├── entities/               # Entity JSON schemas (DB)
│   │   ├── Complaint.jsonc
│   │   ├── CyberCrimeReport.jsonc
│   │   ├── DutyAssignment.jsonc
│   │   ├── Attendance.jsonc
│   │   ├── CitizenChat.jsonc
│   │   ├── StationAlert.jsonc
│   │   ├── Feedback.jsonc
│   │   ├── WomenSafetySession.jsonc
│   │   └── User.jsonc          # Built-in (customized role field)
│   ├── agents/                 # AI agent configs (if any)
│   └── workflows/              # Workflow configs (if any)
│
└── src/
    ├── main.jsx                # React entry point
    ├── App.jsx                 # Router & route definitions
    ├── index.css               # Design tokens, Tailwind layers
    │
    ├── api/
    │   └── base44Client.js     # Pre-initialized Base44 SDK client
    │
    ├── lib/
    │   ├── AuthContext.jsx     # Auth provider & context
    │   ├── app-params.js       # App ID, token, URL params
    │   ├── rbac.js            # Role-Based Access Control definitions
    │   ├── LanguageContext.js # i18n state (en/te)
    │   ├── translations.js    # English/Telugu strings
    │   ├── query-client.js    # React Query client
    │   ├── utils.js           # cn() class merge utility
    │   ├── PageNotFound.jsx   # 404 page
    │   └── supabase.js         # [Legacy/unused] Supabase stub
    │
    ├── data/
    │   └── policeStations.js   # AP pilot district station hierarchy (lat/lng/phone)
    │
    ├── hooks/
    │   └── use-mobile.jsx      # Mobile detection hook
    │
    ├── components/
    │   ├── Layout.jsx          # Root layout (Navbar + Outlet + Footer + AIChatbot + VoiceConstable)
    │   ├── Navbar.jsx          # Top navigation with language switcher
    │   ├── Footer.jsx          # Footer
    │   ├── AIChatbot.jsx        # Floating AI chat assistant
    │   ├── VoiceConstable.jsx   # Voice input component
    │   ├── CaseChat.jsx         # Real-time case chat (citizen ↔ officer)
    │   ├── APMap.jsx            # Interactive AP police map
    │   ├── AwarenessCarousel.jsx # Hero awareness carousel
    │   ├── EmergencyBanner.jsx  # Emergency helpline numbers
    │   ├── FirstTimeGuide.jsx   # First-visit onboarding guide
    │   ├── NoticeBoard.jsx      # News/alerts notice board
    │   ├── ScrollingTicker.jsx  # Scrolling news ticker
    │   ├── QuickActionCard.jsx  # Home page action card
    │   ├── ConstitutionSection.jsx # Constitution rights section
    │   ├── QRScanner.jsx       # QR code scanner (officer verification)
    │   ├── RoleFeatureGuide.jsx # Role-based feature guide
    │   ├── UserNotRegisteredError.jsx
    │   ├── ProtectedRoute.jsx  # Auth guard wrapper
    │   └── ui/                 # shadcn/ui primitives (40+ components)
    │       ├── button.jsx
    │       ├── card.jsx
    │       ├── input.jsx
    │       ├── select.jsx
    │       ├── badge.jsx
    │       ├── label.jsx
    │       ├── textarea.jsx
    │       ├── dialog.jsx
    │       ├── tabs.jsx
    │       ├── table.jsx
    │       ├── toast.jsx
    │       ├── use-toast.jsx
    │       └── ... (30+ more)
    │
    ├── pages/                  # 40+ page components
    │   ├── Splash.jsx
    │   ├── Home.jsx
    │   ├── AuthPortal.jsx
    │   ├── CompleteProfile.jsx
    │   ├── FileComplaint.jsx
    │   ├── TrackCase.jsx
    │   ├── Dashboard.jsx
    │   ├── CitizenDashboard.jsx
    │   ├── StationDashboard.jsx
    │   ├── OfficerDashboard.jsx
    │   ├── DSPDashboard.jsx
    │   ├── DGPDashboard.jsx
    │   ├── CourtDashboard.jsx
    │   ├── LawyerDashboard.jsx
    │   ├── AttendanceSystem.jsx
    │   ├── DutyManagement.jsx
    │   ├── GoldenHourCyber.jsx
    │   ├── CrimeAnalysis.jsx
    │   ├── CrimeHeatMap.jsx
    │   ├── NyayaAIAssistant.jsx
    │   ├── ConstitutionRights.jsx
    │   ├── FIRDocument.jsx
    │   ├── LegalDocuments.jsx
    │   ├── SafeRoute.jsx
    │   ├── TrustedCircle.jsx
    │   ├── SmartAlerts.jsx
    │   ├── CitizenChat.jsx
    │   ├── Feedback.jsx
    │   ├── Contact.jsx
    │   ├── PoliceStations.jsx
    │   ├── Departments.jsx
    │   ├── UnifiedDashboard.jsx
    │   ├── PerformanceDashboard.jsx
    │   ├── CaseManagement.jsx
    │   ├── Analytics.jsx
    │   ├── LiveTracking.jsx
    │   ├── AlertsAdmin.jsx
    │   ├── OfficerManagement.jsx
    │   ├── ActivityLog.jsx
    │   ├── WorkforceMonitor.jsx
    │   ├── CyberOpsCenter.jsx
    │   ├── SystemAdminBoard.jsx
    │   ├── AdminPanel.jsx
    │   └── PoliceAIAdvisor.jsx
    │
    └── utils/
        └── index.ts            # Shared utilities (createPageUrl, etc.)
```

### 5.1 Key File Purposes

| File | Purpose |
|------|---------|
| `src/App.jsx` | Defines all routes inside `<Layout>` wrapper; AuthProvider, QueryClientProvider, Router, Toaster |
| `src/api/base44Client.js` | Single point of SDK initialization; imported everywhere as `base44` |
| `src/lib/AuthContext.jsx` | Provides `user`, `isAuthenticated`, `logout`, `navigateToLogin` to entire app |
| `src/lib/rbac.js` | ROLES, PERMISSIONS, jurisdiction filtering, `filterComplaintsByRole()` |
| `src/data/policeStations.js` | Static hierarchy: State → District → Circle → Mandal → Station (with GPS coords) |
| `src/index.css` | Design tokens (HSL CSS variables) for light/dark themes |
| `tailwind.config.js` | Maps CSS tokens to Tailwind utility classes |
| `base44/entities/*.jsonc` | JSON Schema definitions for each database entity |

---

## 6. Database Design

### 6.1 Entity Relationship Overview

```
User (1) ──────── (N) Complaint
                       │
            ┌──────────┼──────────┐
            │          │          │
     CyberCrimeReport  │    CitizenChat
     (1:1 cyber link)  │    (N messages)
                       │
                 DutyAssignment
                 Attendance
                 StationAlert
                 
Feedback (standalone)
WomenSafetySession (standalone — legacy)
```

### 6.2 Entity: Complaint

**Purpose:** Central case record — the heart of the system.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `case_id` | string | no (auto) | Unique case identifier (e.g., `NM-VZ001`) |
| `title` | string | **yes** | Brief complaint title |
| `description` | string | **yes** | Detailed complaint description |
| `category` | enum | **yes** | narcotics, snatching, women_safety, cyber_crime, otp_fraud, theft, assault, domestic_violence, missing_person, traffic, corruption, other |
| `priority` | enum | no | low, normal, high, critical (AI-assigned) |
| `status` | enum | no (default `filed`) | filed, under_review, assigned, investigating, escalated, court_hearing, resolved, closed |
| `complainant_name` | string | **yes** | Name of complainant |
| `complainant_phone` | string | **yes** | 10-digit phone |
| `complainant_email` | string | no | Email |
| `location` | string | **yes** | Incident location |
| `district` | string | no | One of 5 pilot districts |
| `proof_urls` | array<string> | no | Uploaded proof file URLs |
| `assigned_officer` | string | no | Email of assigned officer |
| `assigned_department` | enum | no (default `general`) | general, narcotics, she_teams, cyber_crime, cid, traffic, anti_corruption |
| `assigned_lawyer` | string | no | Email of assigned lawyer |
| `action_updates` | array<{date, update, by}> | no | Timeline of status changes & notes |
| `escalation_date` | string | no | Auto-escalation trigger date |
| `is_escalated` | boolean | no (default false) | Escalation flag |
| `court_date` | string | no | Scheduled court hearing date |
| **Built-in** | | | `id`, `created_date`, `updated_date`, `created_by_id` |

**Relationships:**
- `created_by_id` → User (citizen who filed)
- `assigned_officer` → User.email (police officer)
- `assigned_lawyer` → User.email (lawyer)
- `case_id` ← CyberCrimeReport.complaint_id (1:1 for cyber cases)
- `case_id` ← CitizenChat.case_id (1:N messages)

### 6.3 Entity: CyberCrimeReport

**Purpose:** Cyber fraud-specific data linked to a complaint for golden-hour recovery.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `case_id` | string | no | Linked complaint case ID |
| `fraud_type` | string | **yes** | e.g., OTP Fraud, UPI Fraud, Phishing |
| `amount_lost` | number | **yes** | Amount lost in INR |
| `bank_name` | string | no | Victim's bank |
| `account_number` | string | no | Victim's account |
| `utr_transaction_id` | string | no | Transaction reference |
| `fraud_account` | string | no | Fraudster's account |
| `fraud_time` | string (date-time) | no | When fraud occurred |
| `victim_name` | string | **yes** | |
| `victim_phone` | string | **yes** | |
| `victim_email` | string | no | |
| `district` | string | no | |
| `description` | string | no | |
| `recovery_status` | enum | no (default `reported`) | reported → notified → bank_contacted → freeze_requested → freeze_confirmed → hold_placed → recovery_initiated → recovered / failed |
| `amount_recovered` | number | no (default 0) | Amount recovered in INR |
| `complaint_id` | string | no | Linked Complaint case_id |
| `assigned_officer` | string | no | |
| `notes` | string | no | |

### 6.4 Entity: DutyAssignment

**Purpose:** Assign patrol, bandobast, VIP security, night duties to officers.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `officer_email` | string | **yes** | |
| `officer_name` | string | no | |
| `assigned_by` | string | no | Email of assigning officer |
| `district` | string | **yes** | |
| `station` | string | **yes** | |
| `mandal` | string | no | |
| `role` | string | no | |
| `duty_type` | enum | no (default `patrol`) | patrol, bandobast, vip_security, traffic, investigation, court_duty, night_duty, emergency |
| `duty_date` | string (date) | **yes** | |
| `shift` | enum | no (default `morning`) | morning, afternoon, evening, night |
| `start_time` | string | no | |
| `end_time` | string | no | |
| `location` | string | no | Patrol zone |
| `geo_lat` | number | no | Zone center latitude |
| `geo_lng` | number | no | Zone center longitude |
| `geo_radius_m` | number | no (default 500) | Allowed attendance radius |
| `status` | enum | no (default `scheduled`) | scheduled, active, completed, cancelled |
| `notes` | string | no | |
| `attendance_marked` | boolean | no (default false) | |

### 6.5 Entity: Attendance

**Purpose:** GPS-verified officer attendance records.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `officer_email` | string | **yes** | |
| `officer_name` | string | no | |
| `station` | string | **yes** | |
| `district` | string | **yes** | |
| `shift` | enum | no | morning, afternoon, evening, night |
| `status` | enum | no (default `present`) | present, late, absent |
| `marked_at` | string | no | Timestamp |
| `latitude` | number | no | Check-in GPS |
| `longitude` | number | no | Check-in GPS |
| `distance_meters` | number | no | Distance from station |
| `location_verified` | boolean | no (default false) | True if ≤100m |
| `role` | string | no | |
| `remarks` | string | no | |

### 6.6 Entity: CitizenChat

**Purpose:** Real-time chat between citizen and assigned officer per case.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `case_id` | string | **yes** | Linked Complaint case_id |
| `sender_email` | string | **yes** | |
| `sender_name` | string | no | |
| `sender_role` | enum | no (default `citizen`) | citizen, police |
| `message` | string | **yes** | |
| `read` | boolean | no (default false) | Read receipt |

### 6.7 Entity: StationAlert

**Purpose:** Broadcast crime alerts, duty notices, advisories to officers/citizens.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | **yes** | |
| `message` | string | **yes** | |
| `alert_type` | enum | no (default `crime_alert`) | crime_alert, duty_notice, emergency, news, advisory, weather |
| `severity` | enum | no (default `medium`) | low, medium, high, critical |
| `scope` | enum | no (default `district`) | all, district, station |
| `district` | string | no | |
| `station` | string | no | |
| `published_by` | string | **yes** | Email of publishing officer |
| `publisher_role` | string | no | |
| `publisher_name` | string | no | |
| `is_active` | boolean | no (default true) | |
| `expires_at` | string | no | |

### 6.8 Entity: Feedback

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | no | |
| `rating` | number | **yes** | |
| `feature` | string | no | |
| `message` | string | **yes** | |
| `is_public` | boolean | no (default true) | |

### 6.9 Entity: WomenSafetySession

> **Note:** This entity exists in the schema but the Women Safety module has been **removed from navigation and routing** as per project refocus. Retained for data backward-compatibility.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_email` | string | **yes** | |
| `user_name` | string | no | |
| `user_phone` | string | **yes** | |
| `companion_name` | string | no | |
| `companion_phone` | string | no | |
| `vehicle_number` | string | no | |
| `destination` | string | no | |
| `status` | enum | no (default `active`) | active, safe, alert, emergency |
| `last_checkin` | string | no | |
| `checkin_interval_minutes` | number | no (default 10) | |
| `last_location` | string | no | |
| `emergency_contacts` | array<{name, phone}> | no | |
| `otp_code` | string | no | |
| `missed_checkins` | number | no (default 0) | |

### 6.10 Entity: User (Built-in)

**Purpose:** Platform-managed user with role customization.

| Field | Type | Editable | Description |
|-------|------|----------|-------------|
| `id` | string | no | Built-in |
| `email` | string | no | Built-in |
| `full_name` | string | no | Built-in |
| `created_date` | string | no | Built-in |
| `role` | string | **yes** | `admin` or `user` (platform-level) |
| `data.*` | object | **yes** (via `updateMe`) | Custom profile fields stored in `data` |

**Custom profile fields stored in `user.data`:**

| Field | Description |
|-------|-------------|
| `user_type` | citizen, police, dsp, dgp, lawyer, court, admin |
| `district` | One of 5 pilot districts |
| `station` | Assigned police station |
| `mandal` | Mandal |
| `badge_number` | Police badge number |
| `designation` | Role-specific designation |
| `department` | general, narcotics, cyber_crime, etc. |
| `phone` | Phone number |
| `profile_complete` | Boolean — profile setup finished |
| `bar_council_id` | (Lawyer) Bar Council registration |
| `court_name` | (Court) Assigned court |
| `specialization` | (Lawyer) Areas of practice |

### 6.11 ER Diagram (Text)

```
┌─────────────┐        ┌──────────────────────┐
│    User      │        │      Complaint       │
│─────────────│        │──────────────────────│
│ id (PK)     │◄──┐    │ id (PK)              │
│ email (UQ)  │   │    │ case_id (UQ)         │
│ full_name   │   ├────│ created_by_id (FK)   │
│ role        │   │    │ assigned_officer →User│
│ data: {     │   │    │ assigned_lawyer →User │
│  user_type, │   │    │ category, status     │
│  district,  │   │    │ priority              │
│  station,   │   │    │ action_updates[]      │
│  ...}       │   │    │ court_date            │
└─────────────┘   │    └───────┬──────────────┘
                  │            │ 1:1 (cyber)
                  │            ▼
                  │    ┌──────────────────────┐
                  │    │  CyberCrimeReport     │
                  │    │──────────────────────│
                  │    │ id (PK)              │
                  │    │ complaint_id (FK)    │
                  │    │ fraud_type, amount   │
                  │    │ recovery_status       │
                  │    └──────────────────────┘
                  │
                  │            │ 1:N (chat)
                  │            ▼
                  │    ┌──────────────────────┐
                  │    │    CitizenChat        │
                  │    │──────────────────────│
                  │    │ id (PK)              │
                  │    │ case_id (FK)         │
                  │    │ sender_email →User   │
                  │    │ message, read         │
                  │    └──────────────────────┘
                  │
                  ├────►┌──────────────────────┐
                  │     │  DutyAssignment      │
                  │     │──────────────────────│
                  │     │ officer_email →User  │
                  │     │ assigned_by →User    │
                  │     │ duty_type, shift     │
                  │     └──────────────────────┘
                  │
                  ├────►┌──────────────────────┐
                  │     │    Attendance         │
                  │     │──────────────────────│
                  │     │ officer_email →User  │
                  │     │ location_verified     │
                  │     └──────────────────────┘
                  │
                  └────►┌──────────────────────┐
                        │   StationAlert       │
                        │──────────────────────│
                        │ published_by →User  │
                        │ scope, severity      │
                        └──────────────────────┘

   Standalone:
   ┌────────────┐    ┌─────────────────────┐
   │  Feedback  │    │ WomenSafetySession  │
   │  (rating)  │    │ (legacy — removed)  │
   └────────────┘    └─────────────────────┘
```

### 6.12 Indexes & Constraints

> **[NOTE]** Base44 manages indexes automatically. In a Supabase/PostgreSQL migration, the following indexes are **recommended**:

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| complaints | `case_id` | UNIQUE | Fast lookup by case ID |
| complaints | `district, status` | COMPOSITE | Dashboard filtering |
| complaints | `assigned_officer` | BTREE | Officer's cases |
| complaints | `created_date` | BTREE (DESC) | Recent cases |
| cyber_crime_reports | `complaint_id` | BTREE | Link to complaint |
| citizen_chats | `case_id, created_date` | COMPOSITE | Chat history |
| attendances | `officer_email, marked_at` | COMPOSITE | Daily attendance |
| duty_assignments | `officer_email, duty_date` | COMPOSITE | Officer's schedule |
| station_alerts | `district, is_active` | COMPOSITE | Active alerts |
| users | `email` | UNIQUE | Login lookup |

---

## 7. Authentication & Authorization

### 7.1 Authentication (Platform-Managed)

| Aspect | Detail |
|--------|--------|
| **Method** | Email + Password (bcrypt hashed) with OTP email verification |
| **Session** | JWT token stored in localStorage (`base44_access_token`) |
| **Login Flow** | User → AuthPortal → Platform login page → JWT issued → stored → AuthContext loads user |
| **Logout** | `base44.auth.logout(redirectUrl)` — clears token, redirects |
| **Password Reset** | Platform-managed `hashed_reset_token` + `force_password_reset` flag |
| **OTP** | 6-digit code, 10-min expiry (`otp_expires_at`), max attempts tracked |
| **User Registration** | Via invitation only: `base44.users.inviteUser(email, role)` — users cannot self-create |

### 7.2 Authorization (Custom RBAC)

Defined in `src/lib/rbac.js`:

```javascript
export const ROLES = {
  DGP: "dgp", ADG: "adg", IG: "ig", DIG: "dig", SP: "sp",
  DSP: "dsp", CI: "ci", SI: "si", CONSTABLE: "police",
  SHE_TEAMS: "she_teams", SPECIAL: "special",
  LAWYER: "lawyer", COURT: "court",
  CITIZEN: "citizen", ADMIN: "admin",
};
```

### 7.3 Role Hierarchy (Rank)

| Role | Rank | Jurisdiction |
|------|------|-------------|
| admin | 100 | All |
| dgp | 90 | State |
| adg | 85 | State |
| ig | 80 | State |
| dig | 75 | State |
| sp | 70 | District |
| dsp | 65 | District |
| ci | 50 | Circle |
| si | 40 | Station |
| police | 30 | Station |
| lawyer | 20 | Own cases |
| court | 20 | Court cases |
| citizen | 10 | Own complaints |

### 7.4 Permissions Matrix

| Permission | Roles |
|------------|-------|
| VIEW_ALL_DISTRICTS | admin, dgp, adg, ig, dig |
| VIEW_DISTRICT | + sp, dsp |
| VIEW_CIRCLE | + ci |
| VIEW_STATION | + si, police, she_teams, special |
| UPDATE_ANY_CASE | admin, dgp, adg, ig, dig, sp, dsp |
| UPDATE_DISTRICT_CASE | sp, dsp, ci |
| UPDATE_STATION_CASE | ci, si, police, she_teams, special |
| TRANSFER_CASE | admin → ci |
| DELETE_CASE | admin, dgp |
| ESCALATE_CASE | admin → si |
| PUBLISH_DISTRICT_ALERT | admin → dsp |
| PUBLISH_STATION_ALERT | + ci, si |
| ASSIGN_DUTY | admin → si |
| VIEW_ALL_ATTENDANCE | admin → dsp |
| MANAGE_ATTENDANCE | + ci, si |
| VIEW_PERFORMANCE | admin → dsp |
| STATION_ADMIN | admin → si |
| ANALYTICS | admin → ci |
| AI_ADVISOR | admin → si |
| CASE_MANAGEMENT | admin → si |

### 7.5 Access Control Implementation

```javascript
// rbac.js
export function hasPermission(userRole, permission) {
  const allowed = PERMISSIONS[permission] || [];
  return allowed.includes(userRole?.toLowerCase());
}

export function getJurisdiction(userRole) {
  const r = userRole?.toLowerCase();
  if (["admin","dgp","adg","ig","dig"].includes(r)) return "all";
  if (["sp","dsp"].includes(r)) return "district";
  if (["ci"].includes(r)) return "circle";
  return "station";
}

export function filterComplaintsByRole(complaints, user) {
  // Filters complaint array based on jurisdiction
}
```

### 7.6 Route Protection

- `AuthProvider` in `App.jsx` wraps entire app
- `AuthContext` exposes `user`, `isAuthenticated`, `authError`
- If `authError.type === 'auth_required'` → redirect to login
- If `authError.type === 'user_not_registered'` → show `UserNotRegisteredError`
- `ProtectedRoute` component available for route-level guards
- `Dashboard.jsx` performs **post-login role routing** (citizen → `/citizen-dashboard`, police → station/dsp/dgp dashboard, lawyer → `/lawyer-dashboard`, court → `/court-dashboard`)

---

## 8. Storage

### 8.1 Storage Services

| Service | Method | Visibility | Use Case |
|---------|--------|-----------|----------|
| **UploadFile** | `base44.integrations.Core.UploadFile({file})` | Public | Proof images, documents |
| **UploadPrivateFile** | `base44.integrations.Core.UploadPrivateFile({file})` | Private | Sensitive evidence |
| **CreateFileSignedUrl** | `base44.integrations.Core.CreateFileSignedUrl({file_uri})` | Time-limited | Download private files |

### 8.2 Upload Process

```javascript
// FileComplaint.jsx
const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
// Store file_url in Complaint.proof_urls array
await base44.entities.Complaint.create({
  ...complaintData,
  proof_urls: [file_url]
});
```

### 8.3 Folder Organization (Base44-Managed)

```
/app-files/
  /public/        ← UploadFile results (publicly accessible URLs)
  /private/       ← UploadPrivateFile results (signed URL required)
```

### 8.4 Security & Access Rules

| Rule | Implementation |
|------|---------------|
| Public files | Accessible via direct URL (no auth) |
| Private files | Require `CreateFileSignedUrl` with expiry (default 300s) |
| Upload auth | Requires authenticated user session |
| File size | Limited by platform (avoid base64 in entity fields) |

### 8.5 Migration to Supabase Storage (Recommended)

```sql
-- Supabase Storage Buckets
CREATE BUCKET "proof-public" (public = true);
CREATE BUCKET "evidence-private" (public = false);

-- RLS Policies
CREATE POLICY "Users can upload own proof"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'proof-public' AND auth.uid() = owner);

CREATE POLICY "Officers can read case evidence"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'evidence-private');
```

---

## 9. API Documentation

> **[NOTE]** Base44 does not expose raw REST endpoints to the frontend. All data access is via the `@base44/sdk` JavaScript client. The following documents the **SDK methods** used, which map to internal REST endpoints.

### 9.1 Entity CRUD API

| Operation | SDK Call | Returns |
|-----------|---------|---------|
| List all | `base44.entities.{Entity}.list(sort?, limit?)` | `Entity[]` |
| Filter | `base44.entities.{Entity}.filter(query, sort?, limit?)` | `Entity[]` |
| Get by ID | `base44.entities.{Entity}.get(id)` | `Entity` |
| Create | `base44.entities.{Entity}.create(data)` | `Entity` |
| Bulk create | `base44.entities.{Entity}.bulkCreate([data])` | `Entity[]` |
| Update | `base44.entities.{Entity}.update(id, patch)` | `Entity` |
| Bulk update | `base44.entities.{Entity}.bulkUpdate([{id, ...patch}])` | `Entity[]` |
| Update many | `base44.entities.{Entity}.updateMany(query, {$set: patch})` | result |
| Delete | `base44.entities.{Entity}.delete(id)` | result |
| Delete many | `base44.entities.{Entity}.deleteMany(query)` | result |
| Schema | `base44.entities.{Entity}.schema()` | JSON Schema |
| Subscribe | `base44.entities.{Entity}.subscribe(callback)` | unsubscribe fn |

### 9.2 Authentication API

| Operation | SDK Call |
|-----------|---------|
| Current user | `base44.auth.me()` |
| Check auth | `base44.auth.isAuthenticated()` → `Promise<boolean>` |
| Update profile | `base44.auth.updateMe(data)` |
| Logout | `base44.auth.logout(redirectUrl?)` |
| Redirect to login | `base44.auth.redirectToLogin(nextUrl?)` |
| Invite user | `base44.users.inviteUser(email, role)` |

### 9.3 Integration API

| Operation | SDK Call | Input | Output |
|-----------|---------|-------|--------|
| Invoke LLM | `base44.integrations.Core.InvokeLLM({prompt, model?, add_context_from_internet?, response_json_schema?, file_urls?})` | string prompt | string or JSON |
| Upload File | `base44.integrations.Core.UploadFile({file})` | File binary | `{file_url}` |
| Upload Private | `base44.integrations.Core.UploadPrivateFile({file})` | File binary | `{file_uri}` |
| Signed URL | `base44.integrations.Core.CreateFileSignedUrl({file_uri, expires_in?})` | file_uri | `{signed_url}` |
| Send Email | `base44.integrations.Core.SendEmail({to, subject, body, from_name?})` | Registered user email | result |
| Generate Image | `base44.integrations.Core.GenerateImage({prompt, existing_image_urls?})` | Prompt | `{url}` |
| Generate Speech | `base44.integrations.Core.GenerateSpeech({text, voice?, language_code?})` | Text | `{url}` |
| Generate Video | `base44.integrations.Core.GenerateVideo({prompt, duration?, aspect_ratio?})` | Prompt | `{url}` |
| Transcribe Audio | `base44.integrations.Core.TranscribeAudio({audio_url})` | Audio URL | transcript string |
| Extract Data | `base44.integrations.Core.ExtractDataFromUploadedFile({file_url, json_schema})` | File + schema | `{status, output}` |

### 9.4 Available LLM Models

| Model ID | Cost | Capabilities |
|----------|------|-------------|
| `automatic` | standard | Auto-selected |
| `gpt_5_mini` | standard | Fast text |
| `gpt_5_4` | high | Complex text |
| `gpt_5_5` | high | Complex text |
| `gemini_3_flash` | standard | Text + web search |
| `gemini_3_1_pro` | high | Text + web search |
| `claude_sonnet_4_6` | high | Complex reasoning |
| `claude_opus_4_6` | highest | Deep reasoning |
| `claude_opus_4_7` | highest | Deep reasoning |
| `claude_opus_4_8` | highest | Deep reasoning |
| `claude-sonnet-5` | highest | Latest Claude |

### 9.5 Analytics API

```javascript
base44.analytics.track({ eventName: "complaint_filed", properties: { category: "cyber_crime" } });
```

### 9.6 Error Handling

All SDK calls throw on error. The app lets errors bubble (no try/catch unless user-facing). Errors are caught by the platform and surfaced in the preview console. Form flows use try/catch with inline toast errors.

---

## 10. User Roles

### 10.1 Role Overview

| Role | `user_type` value | Dashboard Route | Primary Capabilities |
|------|-------------------|-----------------|----------------------|
| **Citizen** | `citizen` | `/citizen-dashboard` | File complaints, track cases, chat with officer, feedback, legal docs, safe route, trusted circle |
| **Police (Station)** | `police` | `/station-dashboard` | View station cases, update status, add notes, cyber ops, mark attendance, view duties |
| **Police (SI/CI)** | `si`/`ci` | `/station-dashboard` or `/officer-dashboard` | Station cases + assign duties + publish station alerts |
| **DSP** | `dsp` | `/dsp-dashboard` | District-wide cases, officer management, district alerts, performance |
| **DGP / State Command** | `dgp`/`adg`/`ig`/`dig`/`sp` | `/dgp-dashboard` | State-wide KPIs, district rankings, crime trends, cyber intelligence |
| **Lawyer** | `lawyer` | `/lawyer-dashboard` | Assigned cases, legal opinions, IPC reference, bail templates, doc drafting |
| **Court Officer** | `court` | `/court-dashboard` | Cases with `court_hearing` status, schedule hearings, assign judges |
| **System Admin** | `admin` | `/admin-panel` | User management, system config, all access |

### 10.2 Role Detail: Citizen

| Action | Allowed |
|--------|---------|
| File complaint | ✅ |
| Track own cases | ✅ |
| Chat with assigned officer | ✅ |
| Submit feedback | ✅ |
| View constitution & rights | ✅ |
| Access NyayaAI Assistant | ✅ |
| Use Safe Route & Trusted Circle | ✅ |
| View other citizens' cases | ❌ |
| Access any police dashboard | ❌ |
| Publish alerts | ❌ |
| Manage officers | ❌ |

### 10.3 Role Detail: Police Station Officer (Constable/SI)

| Action | Allowed |
|--------|---------|
| View station-assigned cases | ✅ |
| Update case status (station level) | ✅ |
| Add investigation notes | ✅ |
| Chat with complainant | ✅ |
| Mark GPS attendance | ✅ |
| View own duties | ✅ |
| View station attendance summary | ✅ |
| Assign duties | SI+ only |
| Publish station alerts | SI+ only |
| View district-wide data | ❌ (unless DSP+) |
| Delete cases | ❌ |
| Escalate cases | SI+ only |

### 10.4 Role Detail: DSP

| Action | Allowed |
|--------|---------|
| All station officer actions | ✅ |
| View all district cases | ✅ |
| Update any case in district | ✅ |
| Assign officers to cases | ✅ |
| Publish district alerts | ✅ |
| View district attendance | ✅ |
| Manage officers in district | ✅ |
| View district performance | ✅ |
| Delete cases | ❌ |
| View other districts | ❌ |

### 10.5 Role Detail: DGP / State Command

| Action | Allowed |
|--------|---------|
| View all state data | ✅ |
| View state KPIs & rankings | ✅ |
| Crime analysis & heat maps | ✅ |
| Cyber ops state view | ✅ |
| Publish state alerts | ✅ |
| Transfer cases across districts | ✅ |
| Delete cases | ✅ (admin, dgp) |
| View performance all districts | ✅ |
| Manage all officers | ✅ |

### 10.6 Role Detail: Lawyer

| Action | Allowed |
|--------|---------|
| View assigned cases | ✅ |
| Add legal opinion | ✅ |
| Access IPC/IT Act reference | ✅ |
| Use bail templates | ✅ |
| Draft legal documents | ✅ |
| View court hearing dates | ✅ |
| Chat with assigned client | ✅ |
| View unassigned cases | ❌ |
| Update case status | ❌ (only legal opinion) |
| Access police dashboards | ❌ |

### 10.7 Role Detail: Court Officer

| Action | Allowed |
|--------|---------|
| View cases with `court_hearing` status | ✅ |
| Schedule hearings (judge, date, type) | ✅ |
| Assign lawyers | ✅ |
| Update court_date | ✅ |
| Add hearing action updates | ✅ |
| Access court list (AP_COURTS) | ✅ |
| File new complaints | ❌ |
| Access police dashboards | ❌ |
| Change investigation status | ❌ |

---

## 11. Screen Documentation

### 11.1 Home (`/`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Public landing page / citizen portal |
| **Components** | ScrollingTicker, AwarenessCarousel, APMap, QuickActionCard (×18), NoticeBoard, ConstitutionSection, EmergencyBanner |
| **Buttons** | "View More Departments" toggle; quick action cards link to routes |
| **Forms** | None |
| **Tables** | None |
| **Navigation** | 18 quick action links to citizen features |
| **Validations** | None (public page) |
| **Backend calls** | LocalStorage for visitor count |
| **Loading states** | Lazy-loaded APMap shows skeleton |
| **Empty states** | N/A |
| **Error states** | N/A |

### 11.2 AuthPortal (`/auth`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Role-selection login gateway |
| **Components** | 6 role cards (Citizen, Police Station, DSP, DGP, Lawyer, Court) |
| **Forms** | DSP: district selector dropdown |
| **Backend calls** | `base44.auth.redirectToLogin(nextUrl)` |
| **Flow** | Select role → store role in localStorage/state → redirect to platform login → return to CompleteProfile with selected role |

### 11.3 CompleteProfile (`/complete-profile`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Mandatory profile setup based on selected role |
| **Components** | Role-specific form sections |
| **Forms** | Citizen: name, phone, district. Police: badge, designation, district→mandal→station, department. Lawyer: bar council ID, specialization. Court: court name, designation. |
| **Validations** | Required fields; district restricted to 5 pilot districts; cascading dropdowns (district→mandal→station) |
| **Backend calls** | `base44.auth.updateMe({...profileData, profile_complete: true})` |
| **Navigation** | On success → `/dashboard` (which routes to role-specific dashboard) |
| **Error states** | Toast on update failure |

### 11.4 FileComplaint (`/file-complaint`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | File a new complaint |
| **Components** | Category select, district→mandal→station cascading, title, description, name, phone, location, proof upload |
| **Validations** | Required: title, description, category, complainant_name, complainant_phone, location. Phone = 10 digits. |
| **Backend calls** | `UploadFile` for proof → `Complaint.create()` → if cyber, `CyberCrimeReport.create()` |
| **Success** | Toast + navigate to TrackCase with new case_id |
| **Loading** | Loader2 spinner on submit button |
| **Error** | Toast notification |

### 11.5 TrackCase (`/track-case`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Track complaint by case ID |
| **Forms** | Case ID input + search |
| **Backend calls** | `Complaint.filter({ case_id })` |
| **Display** | Status badge, timeline (action_updates), assigned officer, court dates, proof URLs |
| **Empty state** | "No case found" message |
| **Loading** | Spinner during fetch |

### 11.6 StationDashboard (`/station-dashboard`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Station-level officer dashboard |
| **Components** | KPI cards, 4 tabs (Cases, Cyber Ops, Attendance, Duties), CaseChat inline |
| **Tables** | Case list with status dropdowns, notes input |
| **Backend calls** | `Complaint.filter`, `CyberCrimeReport.filter`, `Attendance.filter`, `DutyAssignment.filter`, `Complaint.update` (status), realtime subscriptions |
| **Demo data** | DEMO_COMPLAINTS, DEMO_DUTIES, DEMO_CYBER, DEMO_ATTENDANCE injected if empty |
| **Loading** | Loader2 |
| **Empty** | "No cases found" with icon |
| **Error** | Toast |
| **Navigation** | Links to TrackCase, GoldenHourCyber, DutyManagement, AttendanceSystem |

### 11.7 AttendanceSystem (`/attendance`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | GPS-verified attendance |
| **Components** | Station selector, "Mark Attendance" button, attendance history |
| **Forms** | Station hierarchical dropdown (district→circle→mandal→station) |
| **Backend calls** | Browser geolocation → Haversine distance → `Attendance.create()` |
| **Validations** | Distance ≤ 100m → present; 100-200m → late; >200m → blocked with toast |
| **Error** | Geolocation denied → toast; station not found → toast |

### 11.8 GoldenHourCyber (`/golden-hour-cyber`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Cyber fraud instant report & recovery tracking |
| **Components** | Fraud report form, recovery status tracker, 1930 helpline CTA |
| **Backend calls** | `CyberCrimeReport.create()` / `update()` (recovery_status) |
| **Status flow** | reported → notified → bank_contacted → freeze_requested → freeze_confirmed → hold_placed → recovery_initiated → recovered/failed |

### 11.9 DGPDashboard (`/dgp-dashboard`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | State command center |
| **Components** | KPI cards, district distribution bar chart, category pie chart, monthly trend line chart, active alerts, cyber intelligence module |
| **Backend calls** | `Complaint.list`, `StationAlert.filter`, `DutyAssignment.filter`, `CyberCrimeReport.filter` |
| **Auth guard** | Only `dgp`, `adg`, `ig`, `dig`, `sp`, `admin` roles |

### 11.10 CourtDashboard (`/court-dashboard`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Court hearing scheduling |
| **Components** | Case list (status=court_hearing), hearing scheduling form (judge, court, type, date) |
| **Backend calls** | `Complaint.filter({status: "court_hearing"})`, `Complaint.update(id, {court_date, action_updates})` |
| **Static data** | `AP_COURTS` (10 courts), `JUDGES` (6 names), `HEARING_TYPES` (7 types) |

### 11.11 LawyerDashboard (`/lawyer-dashboard`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Lawyer case management |
| **Components** | Assigned cases, legal opinion input, IPC reference, bail templates |
| **Backend calls** | `Complaint.filter({assigned_lawyer: email})`, `Complaint.update` (legal opinion) |
| **Static data** | `LEGAL_SECTIONS` (12 IPC/IT/NDPS sections), `BAIL_TEMPLATES` |

### 11.12 NyayaAIAssistant (`/nyaya-ai`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | AI chat for legal/cyber/police guidance |
| **Components** | Chat interface, quick prompt buttons, AI guidance cards |
| **Backend calls** | `base44.integrations.Core.InvokeLLM({prompt})` |
| **Loading** | Loader2 during LLM call |

### 11.13 CrimeAnalysis (`/crime-analysis`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | AI crime analysis |
| **Components** | Time range filter, bar/line/pie charts, "Generate AI Report" button |
| **Backend calls** | `Complaint.list`, `InvokeLLM` (with aggregated data) |
| **Output** | Markdown assessment rendered via react-markdown |

### 11.14 Other Screens

All remaining screens (`PoliceStations`, `Departments`, `Contact`, `Feedback`, `ConstitutionRights`, `FIRDocument`, `LegalDocuments`, `SafeRoute`, `TrustedCircle`, `SmartAlerts`, `CitizenChat`, `UnifiedDashboard`, `PerformanceDashboard`, `CaseManagement`, `Analytics`, `LiveTracking`, `AlertsAdmin`, `OfficerManagement`, `ActivityLog`, `WorkforceMonitor`, `CyberOpsCenter`, `SystemAdminBoard`, `AdminPanel`, `PoliceAIAdvisor`, `CrimeHeatMap`, `CitizenDashboard`, `DutyManagement`, `OfficerDashboard`, `DSPDashboard`) follow the same pattern:

- Fetch relevant entities via `base44.entities.{Entity}.filter/list`
- Display in cards/tables with role-based filtering
- Allow role-appropriate CRUD operations
- Show loading spinners, empty states, and error toasts
- Use shadcn/ui components throughout

---

> **End of Part 1.** Continue to `NyayaMitra_Project_Handover_Part2.md` for Sections 12-17.