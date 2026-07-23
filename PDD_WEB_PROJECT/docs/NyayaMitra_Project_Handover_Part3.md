# NyayaMitra — Complete Project Handover Document (Part 3: Migration, Future & Review)

**Document Version:** 1.0 — July 2026

> This is **Part 3 of 3**. Covers Sections 18-22 (Base44 Dependency → Professional Review) + Appendices.
> Part 1 covers Sections 1-11 (Executive Summary → Screen Documentation).
> Part 2 covers Sections 12-17 (Business Logic → Security).

---

## 18. Base44 Dependency Analysis

### 18.1 Direct Dependencies on Base44

| Dependency | Location | Replacement |
|-----------|----------|-------------|
| `@base44/sdk` | `src/api/base44Client.js` | `@supabase/supabase-js` + custom API client |
| `@base44/vite-plugin` | `vite.config.js` | Remove — standard Vite config |
| `base44.auth.*` | `AuthContext.jsx`, all pages | `supabase.auth.*` |
| `base44.entities.*` | All pages | Supabase client queries or custom REST API |
| `base44.integrations.Core.*` | AI, file, email pages | Direct provider APIs via Edge Functions |
| `base44.users.inviteUser` | Admin pages | Supabase Admin SDK `auth.admin.inviteUserByEmail` |
| `base44.analytics.track` | Event tracking | PostHog / Mixpanel / Supabase custom table |
| Base44 Realtime (`subscribe`) | Dashboard subscriptions | Supabase Realtime (postgres_changes) |
| Base44 Hosting | SPA serving | Vercel / Netlify |
| Base44 Entity Schema (`.jsonc`) | `base44/entities/` | SQL DDL files / Prisma schema |

### 18.2 Replacement Strategy

#### 18.2.1 Authentication

```javascript
// BEFORE (Base44)
import { base44 } from '@/api/base44Client';
const user = await base44.auth.me();
await base44.auth.logout();

// AFTER (Supabase)
import { supabase } from '@/lib/supabase';
const { data: { user } } = await supabase.auth.getUser();
await supabase.auth.signOut();
```

#### 18.2.2 Entity CRUD

```javascript
// BEFORE (Base44)
const complaints = await base44.entities.Complaint.filter({ district: "Visakhapatnam" });
await base44.entities.Complaint.create({ title: "..." });
await base44.entities.Complaint.update(id, { status: "resolved" });

// AFTER (Supabase)
const { data: complaints } = await supabase
  .from('complaints')
  .select('*')
  .eq('district', 'Visakhapatnam');
const { data } = await supabase.from('complaints').insert({ title: "..." });
const { data } = await supabase.from('complaints').update({ status: "resolved" }).eq('id', id);
```

#### 18.2.3 File Upload

```javascript
// BEFORE
const { file_url } = await base44.integrations.Core.UploadFile({ file });

// AFTER (Supabase Storage)
const { data, error } = await supabase.storage
  .from('proof-public')
  .upload(`complaints/${Date.now()}-${file.name}`, file);
const file_url = `${supabaseUrl}/storage/v1/object/public/proof-public/${data.path}`;
```

#### 18.2.4 LLM Invocation

```javascript
// BEFORE
const result = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6" });

// AFTER (Direct Anthropic API via Supabase Edge Function)
const response = await fetch('/functions/v1/ai-proxy', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${supabaseToken}` },
  body: JSON.stringify({ prompt, model: 'claude-sonnet-4-6' })
});
const result = await response.json();
```

#### 18.2.5 Realtime

```javascript
// BEFORE
const unsub = base44.entities.Complaint.subscribe((event) => { ... });

// AFTER (Supabase Realtime)
supabase.channel('complaints')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' },
    (payload) => {
      if (payload.eventType === 'INSERT') setComplaints(prev => [payload.new, ...prev]);
      if (payload.eventType === 'UPDATE') setComplaints(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
      if (payload.eventType === 'DELETE') setComplaints(prev => prev.filter(c => c.id !== payload.old.id));
    })
  .subscribe();
```

#### 18.2.6 Email

```javascript
// BEFORE (Base44 — registered users only)
await base44.integrations.Core.SendEmail({ to, subject, body });

// AFTER (Resend — any email)
await fetch('/functions/v1/send-email', {
  method: 'POST',
  body: JSON.stringify({ to, subject, body })
});
```

#### 18.2.7 Entity Schema → SQL DDL

Each `base44/entities/*.jsonc` maps to a PostgreSQL table:

```sql
-- From Complaint.jsonc
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('narcotics','snatching','women_safety','cyber_crime','otp_fraud','theft','assault','domestic_violence','missing_person','traffic','corruption','other')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  status TEXT DEFAULT 'filed' CHECK (status IN ('filed','under_review','assigned','investigating','escalated','court_hearing','resolved','closed')),
  complainant_name TEXT NOT NULL,
  complainant_phone TEXT NOT NULL,
  complainant_email TEXT,
  location TEXT NOT NULL,
  district TEXT,
  proof_urls TEXT[],
  assigned_officer TEXT,
  assigned_department TEXT DEFAULT 'general',
  assigned_lawyer TEXT,
  action_updates JSONB DEFAULT '[]',
  escalation_date TEXT,
  is_escalated BOOLEAN DEFAULT false,
  court_date TEXT,
  created_by_id UUID REFERENCES auth.users,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_complaints_case_id ON complaints(case_id);
CREATE INDEX idx_complaints_district_status ON complaints(district, status);
CREATE INDEX idx_complaints_assigned_officer ON complaints(assigned_officer);
```

---

## 19. Migration Guide

### 19.1 Target Stack

| Layer | Technology |
|-------|-----------|
| **Web** | React + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions) |
| **Mobile** | Kotlin + Jetpack Compose + MVVM |
| **AI** | OpenAI / Anthropic / Google (via Edge Functions proxy) |
| **Maps** | Mapbox / Google Maps SDK |
| **Hosting** | Vercel (web), Play Store (Android) |

### 19.2 Shared Backend Design

Both web and Android consume the **same Supabase backend**:

```
                    ┌─────────────────────┐
                    │   Supabase Backend   │
                    │  (PostgreSQL + Auth  │
                    │   + Storage + RT)   │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
                 ▼             ▼             ▼
          ┌──────────┐  ┌──────────┐  ┌──────────────┐
          │React Web │  │ Edge Fn  │  │ Kotlin App   │
          │ (Vercel) │  │ (AI/Email)│  │ (Android)   │
          └──────────┘  └──────────┘  └──────────────┘
```

### 19.3 Recommended Production Folder Structure

#### 19.3.1 Monorepo (Turborepo)

```
nyaya-mitra/
├── apps/
│   ├── web/                    # React + TS + Vite
│   │   ├── src/
│   │   │   ├── api/            # Supabase client, API wrappers
│   │   │   ├── components/     # UI components
│   │   │   ├── pages/          # Route pages
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── lib/            # utils, auth, rbac
│   │   │   ├── types/         # TypeScript types
│   │   │   └── App.tsx
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── android/                # Kotlin + Jetpack Compose
│       ├── app/
│       │   ├── src/main/java/com/nyayamitra/
│       │   │   ├── ui/
│       │   │   │   ├── screens/       # Compose screens
│       │   │   │   ├── components/    # Reusable composables
│       │   │   │   ├── theme/         # Material 3 theme
│       │   │   │   └── navigation/    # NavHost
│       │   │   ├── data/
│       │   │   │   ├── remote/        # Supabase API client
│       │   │   │   ├── local/         # Room DB (offline)
│       │   │   │   └── repo/          # Repositories
│       │   │   ├── domain/
│       │   │   │   ├── model/         # Domain models
│       │   │   │   └── usecase/       # Use cases
│       │   │   └── di/               # Hilt DI
│       │   ├── build.gradle.kts
│       │   └── AndroidManifest.xml
│       ├── build.gradle.kts
│       └── settings.gradle.kts
│
├── packages/
│   ├── shared/                 # Shared types & validation (TS)
│   │   ├── src/
│   │   │   ├── types/          # Complaint, User, etc. types
│   │   │   ├── schemas/        # Zod schemas
│   │   │   └── constants/      # Pilot districts, categories
│   │   └── package.json
│   └── supabase/               # Supabase config & migrations
│       ├── migrations/         # SQL migration files
│       ├── functions/          # Edge Functions
│       │   ├── ai-proxy/
│       │   ├── send-email/
│       │   ├── case-id-gen/
│       │   └── golden-hour-notify/
│       ├── seed.sql
│       └── config.toml
│
├── turbo.json
├── package.json
└── README.md
```

#### 19.3.2 Web App Structure (TypeScript)

```
apps/web/src/
├── api/
│   ├── supabase.ts            # Supabase client init
│   ├── complaints.ts          # Complaint API wrapper
│   ├── auth.ts                # Auth API wrapper
│   ├── attendance.ts          # Attendance API wrapper
│   └── ai.ts                  # AI proxy wrapper
├── components/
│   ├── ui/                    # shadcn/ui (TS versions)
│   └── feature/               # Feature components
├── pages/
│   ├── Home.tsx
│   ├── FileComplaint.tsx
│   ├── StationDashboard.tsx
│   └── ...
├── hooks/
│   ├── useAuth.ts
│   ├── useComplaints.ts
│   └── useRealtime.ts
├── lib/
│   ├── rbac.ts
│   ├── utils.ts
│   └── validation.ts
├── types/
│   └── index.ts               # From @nyayamitra/shared
└── App.tsx
```

#### 19.3.3 Android App Structure (MVVM + Jetpack Compose)

```
app/src/main/java/com/nyayamitra/
├── ui/
│   ├── screens/
│   │   ├── auth/              # LoginScreen, RoleSelectScreen
│   │   ├── citizen/           # FileComplaintScreen, TrackCaseScreen
│   │   ├── police/            # StationDashboardScreen, AttendanceScreen
│   │   ├── lawyer/            # LawyerDashboardScreen
│   │   └── court/             # CourtDashboardScreen
│   ├── components/            # Composables: CaseCard, StatusBadge, etc.
│   ├── theme/                 # Color.kt, Type.kt, Theme.kt
│   └── navigation/            # NavGraph.kt, Routes.kt
├── data/
│   ├── remote/
│   │   ├── SupabaseClient.kt  # Supabase Kotlin SDK
│   │   ├── ComplaintApi.kt    # POST/PATCH /complaints
│   │   └── AiApi.kt           # POST /functions/v1/ai-proxy
│   ├── local/
│   │   ├── NyayaDatabase.kt   # Room database
│   │   └── dao/               # ComplaintDao, AttendanceDao
│   └── repo/
│       ├── ComplaintRepository.kt
│       └── AuthRepository.kt
├── domain/
│   ├── model/
│   │   ├── Complaint.kt
│   │   ├── User.kt
│   │   └── Attendance.kt
│   └── usecase/
│       ├── FileComplaintUseCase.kt
│       ├── MarkAttendanceUseCase.kt
│       └── GetAssignedCasesUseCase.kt
└── di/
    ├── AppModule.kt           # Hilt modules
    └── NetworkModule.kt
```

#### 19.3.4 Backend Structure (Supabase)

```
packages/supabase/
├── migrations/
│   ├── 001_create_users_ext.sql       # user_profiles table
│   ├── 002_create_complaints.sql
│   ├── 003_create_cyber_reports.sql
│   ├── 004_create_attendance.sql
│   ├── 005_create_duties.sql
│   ├── 006_create_alerts.sql
│   ├── 007_create_chats.sql
│   ├── 008_create_feedback.sql
│   ├── 009_rls_policies.sql           # Row-Level Security
│   ├── 010_indexes.sql
│   └── 011_functions.sql             # case_id_gen, escalation_check
├── functions/
│   ├── ai-proxy/                      # LLM proxy (OpenAI/Anthropic/Google)
│   │   └── index.ts
│   ├── send-email/                    # Resend email
│   │   └── index.ts
│   ├── case-id-gen/                   # Sequential case ID generator
│   │   └── index.ts
│   ├── golden-hour-notify/            # Cyber fraud auto-notify
│   │   └── index.ts
│   ├── escalation-cron/               # Auto-escalate old critical cases
│   │   └── index.ts
│   └── generate-legal-doc/            # Legal document generation
│       └── index.ts
├── seed.sql                           # Pilot district/station seed data
└── config.toml
```

### 19.4 Key Migration Steps

| Step | Detail |
|------|--------|
| 1 | Convert `base44/entities/*.jsonc` → SQL DDL in `migrations/` |
| 2 | Create Supabase Auth (email/OTP) to replace Base44 Auth |
| 3 | Create Storage buckets (`proof-public`, `evidence-private`) with RLS |
| 4 | Implement Edge Functions for AI, email, case-id generation |
| 5 | Set up Realtime (postgres_changes) for entity subscriptions |
| 6 | Convert `rbac.js` to SQL RLS policies |
| 7 | Replace `base44Client.js` with `supabase.ts` client |
| 8 | Update all entity calls from `base44.entities.X` → `supabase.from('x')` |
| 9 | Replace `InvokeLLM` with Edge Function AI proxy |
| 10 | Build Android app consuming same Supabase backend |
| 11 | Set up CI/CD (Vercel for web, Play Store for Android) |
| 12 | Seed pilot district/station data via `seed.sql` |

### 19.5 SQL Migration Example (Complaints Table)

```sql
-- 002_create_complaints.sql
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'narcotics','snatching','women_safety','cyber_crime','otp_fraud',
    'theft','assault','domestic_violence','missing_person','traffic',
    'corruption','other'
  )),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  status TEXT DEFAULT 'filed' CHECK (status IN (
    'filed','under_review','assigned','investigating','escalated',
    'court_hearing','resolved','closed'
  )),
  complainant_name TEXT NOT NULL,
  complainant_phone TEXT NOT NULL,
  complainant_email TEXT,
  location TEXT NOT NULL,
  district TEXT,
  proof_urls TEXT[],
  assigned_officer TEXT,
  assigned_department TEXT DEFAULT 'general',
  assigned_lawyer TEXT,
  action_updates JSONB DEFAULT '[]'::jsonb,
  escalation_date TEXT,
  is_escalated BOOLEAN DEFAULT false,
  court_date TEXT,
  created_by_id UUID REFERENCES auth.users(id),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Case ID sequence generator
CREATE SEQUENCE case_id_seq START 1;

CREATE OR REPLACE FUNCTION generate_case_id(p_district TEXT)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_seq BIGINT;
BEGIN
  v_code := CASE p_district
    WHEN 'Visakhapatnam' THEN 'VZ'
    WHEN 'Krishna' THEN 'KR'
    WHEN 'Guntur' THEN 'GU'
    WHEN 'Nellore' THEN 'NL'
    WHEN 'Chittoor' THEN 'CH'
    ELSE 'XX'
  END;
  v_seq := nextval('case_id_seq');
  RETURN 'NM-' || v_code || LPAD(v_seq::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update updated_date
CREATE TRIGGER update_complaints_updated_date
  BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

-- Indexes
CREATE INDEX idx_complaints_case_id ON complaints(case_id);
CREATE INDEX idx_complaints_district_status ON complaints(district, status);
CREATE INDEX idx_complaints_assigned_officer ON complaints(assigned_officer);
CREATE INDEX idx_complaints_created_date ON complaints(created_date DESC);
```

### 19.6 Android ViewModel Example (Kotlin)

```kotlin
// FileComplaintViewModel.kt
@HiltViewModel
class FileComplaintViewModel @Inject constructor(
  private val complaintRepo: ComplaintRepository
) : ViewModel() {

  private val _uiState = MutableStateFlow<FileComplaintUiState>(FileComplaintUiState.Idle)
  val uiState: StateFlow<FileComplaintUiState> = _uiState

  fun fileComplaint(request: FileComplaintRequest) {
    viewModelScope.launch {
      _uiState.value = FileComplaintUiState.Loading
      try {
        val complaint = complaintRepo.fileComplaint(request)
        _uiState.value = FileComplaintUiState.Success(complaint)
      } catch (e: Exception) {
        _uiState.value = FileComplaintUiState.Error(e.message ?: "Unknown error")
      }
    }
  }
}

sealed class FileComplaintUiState {
  object Idle : FileComplaintUiState()
  object Loading : FileComplaintUiState()
  data class Success(val complaint: Complaint) : FileComplaintUiState()
  data class Error(val message: String) : FileComplaintUiState()
}
```

### 19.7 Android Compose Screen Example

```kotlin
// FileComplaintScreen.kt
@Composable
fun FileComplaintScreen(
  viewModel: FileComplaintViewModel = hiltViewModel(),
  onNavigateToTrackCase: (String) -> Unit
) {
  val uiState by viewModel.uiState.collectAsState()
  var title by remember { mutableStateOf("") }
  var description by remember { mutableStateOf("") }
  var category by remember { mutableStateOf("") }

  Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
    Text("File Complaint", style = MaterialTheme.typography.headlineMedium)
    Spacer(modifier = Modifier.height(16.dp))

    OutlinedTextField(
      value = title,
      onValueChange = { title = it },
      label = { Text("Title") },
      modifier = Modifier.fillMaxWidth()
    )
    // ... more fields

    Button(
      onClick = {
        viewModel.fileComplaint(FileComplaintRequest(title, description, category))
      },
      modifier = Modifier.fillMaxWidth()
    ) { Text("Submit") }

    when (val state = uiState) {
      is FileComplaintUiState.Loading -> CircularProgressIndicator()
      is FileComplaintUiState.Success -> {
        LaunchedEffect(state) { onNavigateToTrackCase(state.complaint.caseId) }
      }
      is FileComplaintUiState.Error -> Text(state.message, color = MaterialTheme.colorScheme.error)
      else -> {}
    }
  }
}
```

---

## 20. Missing Features & Recommendations

### 20.1 Missing Functionality

| Feature | Status | Recommendation |
|---------|--------|-------------|
| **Offline complaint filing** | `[MISSING]` | Add PWA service worker + IndexedDB queue; sync when online. Android: Room DB with WorkManager sync. |
| **SMS/OTP via phone (not email)** | `[MISSING]` | Integrate Twilio/msg91 for phone OTP. Supabase supports phone auth. |
| **Multi-language (full i18n)** | Partial (en/te) | Add Hindi; use i18next for complete translation coverage. |
| **Push notifications** | `[MISSING]` | FCM for Android, Web Push API for web. Supabase Edge Function trigger. |
| **PDF report export** | Partial (jspdf) | Standardize legal doc PDF templates with proper formatting. |
| **Case ID auto-sequence** | Partial | Implement Postgres function with `FOR UPDATE` lock on sequence table. |
| **Auto-escalation cron** | `[MISSING]` | Supabase scheduled function to escalate critical cases >48h. |
| **Audit trail** | Partial (`/activity-log`) | Comprehensive audit: who changed what, when. DB triggers. |
| **Data export (CSV/Excel)** | `[MISSING]` | Admin export for reports. |
| **Two-factor authentication** | `[MISSING]` | TOTP via app for admin/DGP roles. |
| **Evidence file virus scanning** | `[MISSING]` | ClamAV integration on upload. |
| **WhatsApp integration** | `[MISSING]` | WhatsApp Business API for citizen notifications. |
| **Payment integration** | `[MISSING]` | If fees are introduced — Razorpay/Stripe. |
| **Biometric attendance** | `[MISSING]` | Fingerprint/face recognition for officer attendance. |
| **Dashboard export to PDF** | `[MISSING]` | DGP/DSP report export. |

### 20.2 Missing Security

| Item | Recommendation |
|------|-------------|
| Row-Level Security at DB | Implement Supabase RLS policies for all tables |
| API rate limiting | Per-user limits on complaint filing, AI calls |
| Input sanitization server-side | Validate all inputs in Edge Functions |
| CSP headers | Add Content-Security-Policy |
| Encrypted sensitive fields | Encrypt account numbers, UTR at rest |
| Session timeout | Idle timeout after 30 min for officer roles |
| File type validation | Whitelist image/PDF MIME types |
| XSS in AI markdown | Sanitize react-markdown output with DOMPurify |

### 20.3 Missing Validation

| Item | Recommendation |
|------|-------------|
| Aadhaar/card number masking | Don't store full PAN/Aadhaar; mask or hash |
| Phone OTP verification at complaint | Verify complainant phone before accepting |
| Duplicate complaint detection | Check for similar title+location within 24h |
| Geo-fencing for attendance | Strict 100m radius with accuracy check |

### 20.4 Missing UX Improvements

| Item | Recommendation |
|------|-------------|
| Progressive Web App (PWA) | Add manifest.json + service worker for installable app |
| Dark mode toggle | Theme tokens exist — add toggle button |
| Onboarding tour | First-time guide exists — enhance with step-by-step |
| Search & filter on dashboards | Add global search across cases |
| Pagination/virtualization | Current dashboards load all — add pagination |
| Skeleton loaders | Replace spinners with skeleton screens |
| Error boundaries | Add React error boundaries per route |
| Accessibility (WCAG) | Add ARIA labels, keyboard nav, screen reader support |

### 20.5 Missing Scalability

| Item | Recommendation |
|------|-------------|
| Pagination on all list views | Implement cursor-based pagination |
| Server-side filtering | Move complex filters to DB queries |
| Caching layer | Redis for frequently accessed data |
| CDN for static assets | Already on Base44 CDN — maintain in migration |
| Database read replicas | For DGP dashboard heavy reads |
| Image optimization | Compress/resize uploaded proof images |
| Connection pooling | PgBouncer for Supabase |

### 20.6 Missing Production Features

| Item | Recommendation |
|------|-------------|
| Monitoring & alerting | Sentry for errors, Datadog for performance |
| Analytics | PostHog for user behavior, custom dashboards |
| Feature flags | LaunchDarkly / custom for gradual rollout |
| A/B testing | For UX optimization |
| Backup strategy | Automated daily Supabase backups |
| Disaster recovery | Multi-region replication |
| GDPR/DPDP compliance | Data retention, right to deletion |
| Health checks | `/health` endpoint |
| API versioning | `/v1/`, `/v2/` namespacing |

---

## 21. Future Scope

### 21.1 Vision: NyayaMitra 2026+ — AI-Native Smart Policing

> **As a Senior Software Architect & AI Product Designer in 2026**, I envision NyayaMitra evolving from a digital complaint platform into an **AI-native predictive policing ecosystem** that proactively prevents crime, automates investigations, and delivers justice faster.

### 21.2 Advanced AI Features

| Feature | Description | Version |
|---------|-------------|---------|
| **AI Case Triage Agent** | Autonomous agent that reads filed complaints, classifies severity, suggests IPC sections, and auto-routes to the right department | V2 |
| **Predictive Crime Forecasting** | Time-series ML model (Prophet/LSTM) predicting crime hotspots by week/day | V2 |
| **AI-Powered FIR Drafting** | LLM generates structured FIR drafts from citizen complaint + officer notes | V2 |
| **Evidence Analysis AI** | Computer vision on uploaded proof images (license plates, faces, objects) | V3 |
| **Voice-to-FIR** | Officer speaks complaint details → AI transcribes & structures into FIR format | V2 |
| **Multilingual Real-time Translation** | Auto-translate complaints between English, Telugu, Hindi, Urdu in real-time | V2 |
| **AI Legal Precedent Search** | RAG-based search over Indian case law for lawyers | V3 |
| **Sentiment Analysis on Feedback** | NLP to identify systemic issues from citizen feedback | V2 |
| **Anomaly Detection** | Detect unusual complaint patterns (serial fraud, organized crime) | V3 |
| **AI Interrogation Assistant** | Suggests questions based on case evidence and suspect profile | V3 |
| **Automated Charge Sheet Generation** | LLM compiles evidence, witness statements, IPC sections into charge sheet | V3 |

### 21.3 Automation Ideas

| Feature | Description | Version |
|---------|-------------|---------|
| **Auto-escalation** | Critical cases unresolved >48h auto-escalate to DSP | V1 |
| **Auto-case-assignment** | Round-robin or expertise-based officer assignment | V2 |
| **Duty auto-scheduling** | AI generates optimal patrol schedules based on crime heatmap | V2 |
| **Auto-notify bank (Golden Hour)** | Automated API to bank freeze systems (RBI's SIM-locked framework) | V2 |
| **Court date auto-scheduling** | AI suggests optimal hearing dates based on case load | V3 |
| **Automated citizen updates** | WhatsApp/SMS on every status change | V2 |
| **Auto-generated weekly DGP brief** | LLM compiles weekly crime report for DGP | V2 |

### 21.4 Security Improvements

| Feature | Description | Version |
|---------|-------------|---------|
| **Blockchain evidence chain** | Immutable hash chain for evidence custody | V3 |
| **Zero-trust architecture** | Every API call verified, mTLS | V3 |
| **Biometric officer auth** | Fingerprint/Face ID for officer login | V2 |
| **Encrypted citizen chat** | End-to-end encryption for citizen-officer chat | V2 |
| **GDPR/DPDP compliance suite** | Data subject access requests, right to erasure | V2 |
| **Anonymized whistleblower channel** | Encrypted, anonymous corruption reporting | V2 |

### 21.5 UX Improvements

| Feature | Description | Version |
|---------|-------------|---------|
| **Mobile-first PWA** | Installable, offline-capable progressive web app | V1 |
| **Voice interface** | Full voice navigation for illiterate citizens | V2 |
| **AR crime scene reconstruction** | AR overlay of incident from photos | V3 |
| **Gamified officer performance** | Badges, leaderboards for officer KPIs | V2 |
| **Citizen trust score** | Transparency rating per station | V2 |
| **Dark mode** | Full dark theme | V1 |
| **Accessibility (WCAG 2.2 AAA)** | Screen reader, voice nav, high contrast | V2 |

### 21.6 Police Workflow Improvements

| Feature | Description | Version |
|---------|-------------|---------|
| **Drone integration** | Live drone feeds for bandobast/VIP security | V3 |
| **Body-worn camera integration** | Live stream + auto-upload footage to case | V3 |
| **Automatic number plate recognition (ANPR)** | Traffic enforcement automation | V3 |
| **Gunshot detection** | IoT sensors in high-crime areas | V3 |
| **Smart patrol routing** | AI-reroutes patrols based on real-time risk | V2 |
| **Inter-station case transfer** | Digital, auditable case handoff | V2 |
| **Integrated e-FIR filing** | Direct integration with CCTNS/SCRB | V3 |

### 21.7 Citizen Workflow Improvements

| Feature | Description | Version |
|---------|-------------|---------|
| **One-tap SOS** | Shake-to-alert with live location | V1 |
| **Anonymous reporting** | Encrypted anonymous complaint channel | V2 |
| **Community watch** | Neighborhood crime reporting & alerts | V3 |
| **Live officer tracking** | See assigned officer's ETA (like Uber) | V2 |
| **Crowdsourced evidence** | Citizens upload photos/videos of incidents | V2 |
| **Digital rights wallet** | Citizens access their rights, filed cases, documents | V2 |

### 21.8 Mobile-First Enhancements

| Feature | Description | Version |
|---------|-------------|---------|
| **Offline-first Android app** | Room DB + WorkManager sync | V1 |
| **Geofencing alerts** | Enter high-crime area → push notification | V2 |
| **NFC evidence tagging** | Tap NFC tags at crime scenes | V3 |
| **Wearable integration** | Officer smartwatch with duty alerts | V3 |
| **In-app camera with OCR** | Scan vehicle numbers, documents | V2 |

### 21.9 Offline Capabilities

| Feature | Description | Version |
|---------|-------------|---------|
| **Offline complaint filing** | Queue and sync when online | V1 |
| **Offline attendance** | Store GPS + timestamp, verify when online | V1 |
| **Offline case viewing** | Cache assigned cases on device | V2 |
| **Conflict resolution** | Handle concurrent edits when syncing | V2 |

### 21.10 Real-Time Collaboration

| Feature | Description | Version |
|---------|-------------|---------|
| **Multi-officer case collaboration** | Multiple officers on one case, live updates | V2 |
| **Live location sharing** | Officers see each other on map during operations | V2 |
| **Real-time chat with file sharing** | Case chat with document/image attachments | V2 |
| **Collaborative document editing** | Lawyers + officers co-edit legal docs | V3 |

### 21.11 Analytics & Reporting

| Feature | Description | Version |
|---------|-------------|---------|
| **Predictive dashboards** | AI forecasts crime trends | V2 |
| **Officer performance scoring** | Multi-factor KPI score | V2 |
| **District comparison reports** | Benchmark districts against each other | V2 |
| **Citizen satisfaction analytics** | NPS from feedback | V2 |
| **Real-time crime heatmap** | Live updating heatmap | V2 |
| **Custom report builder** | DGP builds custom queries | V3 |

### 21.12 AI Agents

| Agent | Purpose | Version |
|-------|---------|---------|
| **Case Triage Agent** | Auto-classify & route new complaints | V2 |
| **Investigation Assistant Agent** | Suggest investigation steps, evidence to collect | V2 |
| **Legal Research Agent** | Find precedents, relevant sections | V3 |
| **Citizen Helpdesk Agent** | 24/7 AI chatbot for citizen queries | V2 |
| **Duty Optimization Agent** | Auto-generate patrol schedules | V2 |
| **Escalation Monitor Agent** | Watch for overdue cases, auto-escalate | V2 |

### 21.13 Voice Features

| Feature | Description | Version |
|---------|-------------|---------|
| **Voice complaint filing** | Speak complaint → AI structures it | V2 |
| **Voice-activated dashboards** | "Show me critical cases in Gajuwaka" | V3 |
| **Multilingual TTS** | Read case updates aloud in Telugu | V2 |
| **Voice biometric auth** | Speaker recognition for officers | V3 |

### 21.14 OCR & Translation

| Feature | Description | Version |
|---------|-------------|---------|
| **OCR on uploaded documents** | Extract text from FIR scans, ID proofs | V2 |
| **Real-time translation** | Auto-translate complaints between languages | V2 |
| **Handwriting recognition** | Read handwritten complaints | V3 |
| **Document classification** | Auto-tag document type (FIR, charge sheet, petition) | V2 |

### 21.15 Accessibility

| Feature | Description | Version |
|---------|-------------|---------|
| **Screen reader optimization** | Full ARIA support | V2 |
| **High contrast mode** | For visually impaired | V2 |
| **Dyslexia-friendly font** | Optional font setting | V3 |
| **Voice-only mode** | Full voice navigation for illiterate users | V2 |

### 21.16 Scalability & Cloud Architecture

| Feature | Description | Version |
|---------|-------------|---------|
| **Multi-region deployment** | Active-active across India regions | V3 |
| **Microservices** | Split monolith into auth, cases, AI, notifications services | V3 |
| **Event-driven architecture** | Kafka/EventBridge for async processing | V3 |
| **Horizontal pod autoscaling** | K8s auto-scale based on load | V3 |
| **Edge caching** | Cloudflare Workers for global latency | V3 |
| **Database sharding** | Shard by district for scale | V3 |

### 21.17 Performance Optimization

| Feature | Description | Version |
|---------|-------------|---------|
| **Code splitting & lazy loading** | Per-route lazy loading | V1 |
| **Image lazy loading** | Native `loading="lazy"` | V1 |
| **Virtualized lists** | react-window for large case lists | V2 |
| **Server-side caching** | Redis for dashboard data | V2 |
| **Query optimization** | Add DB indexes, optimize queries | V1 |
| **Bundle size analysis** | Webpack/Vite bundle analyzer | V1 |

### 21.18 Version Roadmap Summary

| Version | Theme | Timeline | Key Features |
|---------|-------|----------|-------------|
| **V1 (Pilot)** | Digital Foundation | 0-6 months | Current features + offline, PWA, push notifications, auto-escalation, dark mode, pagination |
| **V2 (Intelligence)** | AI-Powered Operations | 6-18 months | AI triage agent, predictive crime, voice-to-FIR, multilingual, biometric, WhatsApp, real-time collab, analytics, duty optimization |
| **V3 (Autonomous)** | Autonomous Ecosystem | 18-36 months | Evidence AI, blockchain, AR reconstruction, drone integration, body cameras, ANPR, microservices, multi-region, AI agents, legal RAG |

---

## 22. Professional Review

### 22.1 Strengths

| # | Strength | Detail |
|---|----------|--------|
| 1 | **Comprehensive role-based architecture** | 7 distinct user tiers with clear jurisdiction hierarchy and permission matrix |
| 2 | **Bilingual support** | English + Telugu from day one — critical for rural AP adoption |
| 3 | **Real police station data** | Actual GPS coordinates, phone numbers for 5 pilot districts — production-ready |
| 4 | **Golden Hour cyber protocol** | Unique 60-minute recovery workflow — genuinely solves a real problem |
| 5 | **GPS-verified attendance** | Haversine-based geo-fencing prevents proxy attendance |
| 6 | **End-to-end case lifecycle** | Citizen → Police → Lawyer → Court digital chain |
| 7 | **AI integration throughout** | NyayaAI, Crime Analysis, Police Advisor, Safe Route, Smart Alerts |
| 8 | **Modern tech stack** | React 18, Tailwind, shadcn/ui, React Query — maintainable |
| 9 | **Clean design system** | Token-based theming, consistent components |
| 10 | **Scalable entity model** | Well-structured JSON schemas with clear relationships |
| 11 | **Real-time updates** | WebSocket subscriptions for live dashboard updates |
| 12 | **Pilot-first approach** | 5 districts before state-wide — pragmatic |
| 13 | **Demo data fallback** | Ensures functional demo even without seeded data |
| 14 | **Good componentization** | 50+ small, focused components |

### 22.2 Weaknesses

| # | Weakness | Impact | Mitigation |
|---|----------|--------|------------|
| 1 | **Base44 lock-in** | Cannot deploy without platform | Migrate to Supabase (Section 19) |
| 2 | **No offline support** | Rural users without connectivity cannot file | PWA + IndexedDB |
| 3 | **No RLS at DB level** | Security relies on app logic only | Implement Supabase RLS |
| 4 | **No automated tests** | Regressions not caught | Add Jest + React Testing Library |
| 5 | **No CI/CD** | Manual deployment | GitHub Actions |
| 6 | **Large demo data in code** | DEMO_COMPLAINTS bloat dashboard files | Move to seed data |
| 7 | **No TypeScript** | Type safety missing | Migrate to TS |
| 8 | **No pagination** | Dashboards load all records | Cursor pagination |
| 9 | **Inconsistent error handling** | Some try/catch, some let bubble | Standardize |
| 10 | **No monitoring** | No error tracking | Add Sentry |
| 11 | **Legacy modules** | WomenSafety entity/route remnants | Clean up |
| 12 | **No input sanitization on AI output** | XSS risk in markdown | DOMPurify |
| 13 | **No rate limiting** | Abuse risk | Add per-user limits |
| 14 | **Single language coverage partial** | Some strings hardcoded | Complete i18n |

### 22.3 Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Base44 pricing/availability change | Medium | Critical | Migrate to Supabase |
| Data breach (no RLS) | Medium | Critical | Implement RLS immediately |
| AI cost overrun | Medium | High | Add rate limits, caching |
| Scale beyond pilot | High | High | Pagination, read replicas |
| Adoption resistance | Medium | Medium | Training, UI simplicity |
| Legal/compliance (DPDP Act) | High | High | Compliance audit |
| AI hallucination in legal advice | Medium | High | Disclaimers, human review |
| GPS spoofing in attendance | Medium | Medium | Accuracy check, movement detection |

### 22.4 Technical Debt

| Item | Severity | Effort |
|------|----------|--------|
| WomenSafety legacy entity | Low | 1h |
| Demo data hardcoded in dashboards | Medium | 4h |
| No TypeScript | High | 2 weeks |
| No automated tests | High | 1 week |
| No CI/CD | High | 2 days |
| No pagination | High | 3 days |
| Inconsistent error handling | Medium | 3 days |
| No monitoring | Medium | 2 days |
| No input validation server-side | High | 1 week |
| No RLS | Critical | 3 days |

### 22.5 Production Readiness

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Core functionality** | 8/10 | All primary workflows complete |
| **Security** | 4/10 | Missing RLS, rate limits, server validation |
| **Scalability** | 5/10 | No pagination, caching |
| **Monitoring** | 2/10 | No error tracking, analytics |
| **Testing** | 1/10 | No automated tests |
| **Documentation** | 7/10 | This document; inline comments sparse |
| **Deployment automation** | 3/10 | No CI/CD |
| **Overall** | **4.3/10** | **Pilot-ready, NOT production-ready** |

### 22.6 Maintainability

| Aspect | Rating | Notes |
|--------|--------|-------|
| Code organization | 8/10 | Good componentization, clear structure |
| Naming conventions | 8/10 | Consistent |
| Component size | 7/10 | Some dashboards 400+ lines — could split |
| DRYness | 6/10 | Demo data duplicated; some logic repeated |
| Documentation | 5/10 | JSDoc comments sparse |
| Dependencies | 8/10 | Well-chosen, modern |

### 22.7 Scalability

| Aspect | Rating | Notes |
|--------|--------|-------|
| Frontend | 6/10 | No lazy loading beyond APMap; no virtualization |
| Backend | 5/10 | Base44 scales automatically but no control |
| Database | 5/10 | No indexes (platform-managed), no pagination |
| Real-time | 7/10 | WebSocket subscriptions scale |
| AI calls | 4/10 | No caching, no rate limiting |

### 22.8 Security Review

| Area | Rating | Notes |
|------|--------|-------|
| Authentication | 8/10 | Platform-managed, solid |
| Authorization | 6/10 | App-level RBAC, no DB-level RLS |
| Data protection | 4/10 | No encryption of sensitive fields |
| Input validation | 5/10 | Form-level only, no server validation |
| Output encoding | 5/10 | XSS risk in AI markdown |
| Rate limiting | 1/10 | None |
| Audit logging | 4/10 | Partial activity log |
| **Overall** | **4.7/10** | **Needs hardening** |

### 22.9 UI/UX Review

| Aspect | Rating | Notes |
|--------|--------|-------|
| Visual design | 8/10 | Clean, professional, consistent tokens |
| Responsiveness | 8/10 | Tailwind responsive classes used |
| Accessibility | 4/10 | Missing ARIA, keyboard nav |
| Loading states | 7/10 | Spinners present, no skeletons |
| Empty states | 7/10 | Most pages handle empty |
| Error states | 6/10 | Toasts, but no error boundaries |
| Mobile UX | 7/10 | Good, but no PWA/offline |
| Bilingual | 7/10 | en/te, incomplete coverage |
| **Overall** | **6.8/10** | **Good for pilot** |

### 22.10 Performance Review

| Metric | Rating | Notes |
|--------|--------|-------|
| Initial load | 6/10 | Vite handles, but large bundle |
| Route transitions | 7/10 | React Router fast |
| Data fetching | 6/10 | React Query, but no pagination |
| Rendering | 7/10 | Reasonable component sizes |
| Image handling | 5/10 | No lazy loading, no optimization |
| AI response time | 6/10 | No streaming, no caching |
| **Overall** | **6.2/10** | |

### 22.11 Database Review

| Aspect | Rating | Notes |
|--------|--------|-------|
| Schema design | 8/10 | Well-normalized entities |
| Relationships | 8/10 | Clear FKs |
| Indexes | 3/10 | Platform-managed, no custom |
| Constraints | 6/10 | Enum validation, some missing |
| Data types | 8/10 | Appropriate |
| Query patterns | 6/10 | No complex queries, no N+1 awareness |
| **Overall** | **6.2/10** | |

### 22.12 AI Integration Review

| Aspect | Rating | Notes |
|--------|--------|-------|
| Feature breadth | 9/10 | 8+ AI features |
| Model selection | 7/10 | Multi-model support |
| Prompt design | 6/10 | Basic prompts, could be more sophisticated |
| Output handling | 6/10 | Markdown render, no sanitization |
| Error handling | 5/10 | Basic toast, no retry |
| Cost management | 3/10 | No rate limits, caching |
| Streaming | 2/10 | No streaming responses |
| **Overall** | **5.4/10** | |

### 22.13 Overall Ratings (Out of 10)

| Dimension | Score |
|-----------|-------|
| **Architecture** | **8/10** |
| **Code Organization** | **7.5/10** |
| **User Experience** | **7/10** |
| **Innovation** | **8.5/10** |
| **AI Integration** | **7/10** |
| **Security** | **4.5/10** |
| **Scalability** | **5.5/10** |
| **Final Year Project Quality** | **9/10** |
| **Real-World Deployment Readiness** | **5/10** |
| **Overall Average** | **6.9/10** |

### 22.14 Prioritized Action Plan (Pre-Production)

> Top improvements to implement before considering production-ready:

| Priority | Action | Effort | Impact |
|----------|--------|--------|--------|
| 🔴 P0 | **Migrate from Base44 to Supabase** (eliminate platform lock-in) | 2 weeks | Critical |
| 🔴 P0 | **Implement Row-Level Security (RLS)** on all tables | 3 days | Critical |
| 🔴 P0 | **Add server-side input validation** (Edge Functions) | 1 week | Critical |
| 🔴 P0 | **Add automated tests** (Jest + RTL, 80% coverage) | 1 week | Critical |
| 🟠 P1 | **Set up CI/CD** (GitHub Actions) | 2 days | High |
| 🟠 P1 | **Add pagination** on all list views | 3 days | High |
| 🟠 P1 | **Add error monitoring** (Sentry) | 2 days | High |
| 🟠 P1 | **Add rate limiting** on AI & complaint APIs | 2 days | High |
| 🟠 P1 | **Sanitize AI markdown output** (DOMPurify) | 4 hours | High |
| 🟠 P1 | **Add offline support** (PWA + IndexedDB) | 1 week | High |
| 🟠 P1 | **Implement push notifications** (FCM) | 1 week | High |
| 🟡 P2 | **Migrate to TypeScript** | 2 weeks | Medium |
| 🟡 P2 | **Add Sentry + analytics** (PostHog) | 3 days | Medium |
| 🟡 P2 | **Complete bilingual coverage** | 1 week | Medium |
| 🟡 P2 | **Add skeleton loaders & error boundaries** | 3 days | Medium |
| 🟡 P2 | **Implement auto-escalation cron** | 2 days | Medium |
| 🟡 P2 | **Add accessibility (WCAG 2.2)** | 1 week | Medium |
| 🟢 P3 | **Build Android app** (Kotlin + Compose) | 4 weeks | Strategic |
| 🟢 P3 | **Add AI streaming responses** | 3 days | Medium |
| 🟢 P3 | **Add voice-to-FIR** | 1 week | Strategic |
| 🟢 P3 | **Implement predictive crime forecasting** | 2 weeks | Strategic |

### 22.15 Final Verdict

> **NyayaMitra is an excellent final-year engineering project and a strong pilot prototype.** It demonstrates sophisticated understanding of:
> - Real-world police workflows
> - Role-based access control
> - AI integration patterns
> - Bilingual citizen services
> - End-to-end case lifecycle management
>
> **However, it is NOT yet production-ready.** The critical gaps are:
> 1. Platform lock-in (Base44) — must migrate to Supabase
> 2. Missing database-level security (RLS)
> 3. No automated testing or CI/CD
> 4. No offline support for rural users
> 5. No server-side validation
>
> With the P0 and P1 items in the action plan completed, NyayaMitra would be ready for a real pilot deployment in the 5 Andhra Pradesh districts. With P2 and P3 items, it would be a state-wide, AI-native smart policing platform.
>
> **Estimated time to production-ready:** 4-6 weeks (P0 + P1)
> **Estimated time to state-wide rollout:** 3-4 months (P0 + P1 + P2 + Android)
> **Estimated time to AI-native platform (V2):** 6-12 months

---

## Appendix A: Pilot Districts

| District | Key Cities | Notable Stations |
|----------|-----------|-----------------|
| **Visakhapatnam** | Vizag City, Anakapalli, Araku | Gajuwaka PS, MVP Colony PS, Rushikonda PS |
| **Krishna** | Vijayawada, Machilipatnam, Gudivada | Vijayawada One Town PS, Benz Circle PS, Auto Nagar PS |
| **Guntur** | Guntur City, Tenali, Narasaraopet | Guntur Town PS, Mangalagiri PS, Tenali Town PS |
| **Nellore** | Nellore City, Kavali | Nellore Town PS, 2 Town PS |
| **Chittoor** | Tirupati, Chittoor, Madanapalle | Tirupati Town PS, Chittoor Town PS |

### District Codes (Case IDs)

| District | Code | Example Case ID |
|----------|------|-----------------|
| Visakhapatnam | VZ | NM-VZ001 |
| Krishna | KR | NM-KR002 |
| Guntur | GU | NM-GU003 |
| Nellore | NL | NM-NL004 |
| Chittoor | CH | NM-CH005 |

## Appendix B: Emergency Helplines

| Number | Service |
|--------|---------|
| 100 | Police Emergency |
| 112 | Emergency Response Support System (ERSS) |
| 1930 | Cyber Crime Helpline |
| 1091 | Women Helpline |
| 1098 | Child Helpline |
| 1073 | Senior Citizen Helpline |
| 108 | Ambulance |
| 101 | Fire |

## Appendix C: Legal References

| Act | Coverage |
|-----|---------|
| **BNS (Bharatiya Nyaya Sanhita, 2023)** | Replaces IPC — criminal offences |
| **BNSS (Bharatiya Nagarik Suraksha Sanhita, 2023)** | Replaces CrPC — criminal procedure |
| **BSA (Bharatiya Sakshya Adhiniyam, 2023)** | Replaces Indian Evidence Act — evidence |
| **IT Act, 2000 (Section 66C, 66D)** | Cyber crime |
| **NDPS Act, 1985** | Narcotics |
| **IPC (Indian Penal Code)** | Legacy criminal law (pre-2024) |

## Appendix D: IPC Sections Referenced in LawyerDashboard

| Section | Title | Description | Category |
|---------|-------|-------------|----------|
| IPC 302 | Murder | Life imprisonment or death penalty | violent |
| IPC 376 | Sexual Assault / Rape | Minimum 10 years imprisonment | violent |
| IPC 420 | Cheating & Dishonesty | Imprisonment up to 7 years + fine | fraud |
| IPC 379 | Theft | Imprisonment up to 3 years + fine | property |
| IPC 354 | Assault on Woman | Imprisonment 1–5 years + fine | women |
| IT Act 66C | Identity Theft (Cyber) | Imprisonment up to 3 years + ₹1 lakh fine | cyber |
| IT Act 66D | Cheating by Impersonation | Imprisonment up to 3 years + ₹1 lakh fine | cyber |
| NDPS Act | Narcotics Offences | 6 months to life imprisonment | narcotics |
| IPC 323 | Voluntarily Causing Hurt | Imprisonment up to 1 year + fine | violent |
| IPC 498A | Domestic Violence / Cruelty | Imprisonment up to 3 years + fine | women |
| CrPC 125 | Maintenance of Wife/Children | Monthly maintenance order by Magistrate | family |
| IPC 406 | Criminal Breach of Trust | Imprisonment up to 3 years + fine | fraud |

## Appendix E: AP Courts Referenced in CourtDashboard

| Court Name | District |
|-----------|---------|
| High Court of Andhra Pradesh, Amaravati | All |
| District & Sessions Court, Visakhapatnam | Visakhapatnam |
| District & Sessions Court, Vijayawada | Krishna |
| District & Sessions Court, Guntur | Guntur |
| District & Sessions Court, Tirupati | Chittoor |
| District & Sessions Court, Nellore | Nellore |
| Fast Track Court, Guntur | Guntur |
| Family Court, Visakhapatnam | Visakhapatnam |
| Family Court, Vijayawada | Krishna |
| POCSO Fast Track Court, Tirupati | Chittoor |

## Appendix F: Complaint Categories

| Category | Department | Default Priority |
|----------|-----------|-----------------|
| narcotics | Narcotics Cell | high |
| snatching | General | high |
| women_safety | SHE Teams | high |
| cyber_crime | Cyber Crime Cell | high |
| otp_fraud | Cyber Crime Cell | high |
| theft | General | normal |
| assault | General | high |
| domestic_violence | SHE Teams | high |
| missing_person | CID | high |
| traffic | Traffic Police | low |
| corruption | Anti-Corruption Bureau | high |
| other | General | normal |

---

**End of Document**

> This document was generated as a complete engineering handover of the NyayaMitra platform. It is self-contained and sufficient for another engineer or AI assistant to understand, recreate, maintain, improve, and deploy the entire project without access to Base44.
>
> **Developer:** Nageswar Bellamkonda
> **Project:** NyayaMitra — Smart Policing & Citizen Safety Platform
> **Pilot:** 5 Districts, Andhra Pradesh, India
> **Document Version:** 1.0 — July 2026
> **Document Parts:** 3 files (Part 1: SRS & Overview, Part 2: Business Logic & Security, Part 3: Migration, Future & Review)