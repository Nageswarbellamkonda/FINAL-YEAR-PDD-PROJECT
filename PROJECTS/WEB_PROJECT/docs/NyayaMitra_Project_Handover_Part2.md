# NyayaMitra — Complete Project Handover Document (Part 2: Business Logic → Security)

**Document Version:** 1.0 — July 2026

> This is **Part 2 of 3**. Covers Sections 12-17 (Business Logic → Security).
> Part 1 covers Sections 1-11 (Executive Summary → Screen Documentation).
> Part 3 covers Sections 18-22 (Base44 Dependency → Professional Review) + Appendices.

---

## 12. Business Logic

### 12.1 Complaint Lifecycle

```
[Citizen Files Complaint]
        │
        ▼
    status: "filed"
    priority: (auto from category)
    department: (auto from category)
        │
        ▼
[Station Officer Reviews]
    status → "under_review"
        │
        ▼
[Officer Assigned]
    status → "assigned"
    assigned_officer: email
        │
        ▼
[Investigation Begins]
    status → "investigating"
    action_updates: [{date, update, by}]
        │
        ├──► [If critical & unresolved >48h]
        │       status → "escalated"
        │       is_escalated: true
        │       escalation_date: set
        │
        ├──► [If cyber crime]
        │       CyberCrimeReport created
        │       Golden Hour flow activated
        │
        └──► [Ready for court]
                status → "court_hearing"
                │
                ▼
        [Court Officer Schedules Hearing]
            court_date: set
            judge: assigned
            hearing_type: set
            action_updates: +hearing scheduled
                │
                ├──► [Lawyer assigned]
                │       assigned_lawyer: email
                │       Lawyer sees case in dashboard
                │
                ▼
        [Hearing Complete → Resolution]
            status → "resolved"
                │
                ▼
        [Case Closed]
            status → "closed"
```

### 12.2 Auto-Department Assignment

| Category | Auto-Assigned Department | Default Priority |
|----------|------------------------|------------------|
| narcotics | narcotics | high |
| snatching | general | high |
| women_safety | she_teams | high |
| cyber_crime | cyber_crime | high |
| otp_fraud | cyber_crime | high |
| theft | general | normal |
| assault | general | high |
| domestic_violence | she_teams | high |
| missing_person | cid | high |
| traffic | traffic | low |
| corruption | anti_corruption | high |
| other | general | normal |

### 12.3 Case ID Generation

Format: `NM-<DISTRICT_CODE>-<SEQUENCE>-<SUFFIX>`

Examples: `NM-VZ001`, `NM-KR002`, `NM-GU003`, `NM-NL004`, `NM-CH005`

| District | Code |
|----------|------|
| Visakhapatnam | VZ |
| Krishna (Vijayawada) | KR |
| Guntur | GU |
| Nellore | NL |
| Chittoor (Tirupati) | CH |

> **[MISSING]** Case ID auto-generation logic is partially implemented. A centralized sequence generator should be added (Supabase: a `case_sequences` table with `SELECT ... FOR UPDATE` or a Postgres function).

### 12.4 GPS Attendance Logic (Haversine)

```javascript
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

// Rules:
// distance ≤ 100m → status: "present", location_verified: true
// 100m < distance ≤ 200m → status: "late"
// distance > 200m → blocked (attendance refused)
```

**Station Coordinate Source:** `src/data/policeStations.js` — each station has `lat` and `lng` fields.

**Implementation Flow:**
1. Officer selects their station from dropdown
2. Lookup station coordinates from static data
3. Request browser geolocation (`navigator.geolocation.getCurrentPosition`)
4. Calculate Haversine distance between officer GPS and station GPS
5. If ≤ 100m → create Attendance record with `location_verified: true`, `status: "present"`
6. If 100-200m → create with `status: "late"`
7. If > 200m → show toast "You are too far from the station" and refuse

### 12.5 Cyber Golden Hour Protocol

```
T+0 min:   Victim reports fraud → CyberCrimeReport created (status: "reported")
T+5 min:   System auto-notifies cyber cell (status: "notified")
T+10 min:  Officer contacts victim's bank (status: "bank_contacted")
T+15 min:  Freeze request sent to fraudster's bank (status: "freeze_requested")
T+30 min:  Freeze confirmed (status: "freeze_confirmed")
T+45 min:  Hold placed on funds (status: "hold_placed")
T+60 min:  Recovery initiated (status: "recovery_initiated")
Final:     "recovered" or "failed"
```

**Recovery Status Enum (9 stages):**
1. `reported` — Initial report filed
2. `notified` — Cyber cell auto-notified
3. `bank_contacted` — Victim's bank contacted
4. `freeze_requested` — Freeze request sent to fraudster's bank
5. `freeze_confirmed` — Bank confirms freeze
6. `hold_placed` — Funds placed on hold
7. `recovery_initiated` — Recovery process started
8. `recovered` — Funds recovered to victim
9. `failed` — Recovery unsuccessful

**Key Metrics Tracked:**
- `amount_lost` (INR)
- `amount_recovered` (INR, default 0)
- `fraud_time` (timestamp of fraud)
- `utr_transaction_id` (bank reference)

### 12.6 Role-Based Data Filtering

```javascript
// filterComplaintsByRole(complaints, user)
// Jurisdiction: all → see everything
// Jurisdiction: district → filter by user.district
// Jurisdiction: circle → filter by district + assigned_officer/dept
// Jurisdiction: station → filter by assigned_officer === user.email
```

**Implementation:**
```javascript
export function filterComplaintsByRole(complaints, user) {
  const role = user?.user_type || user?.role || "citizen";
  const jurisdiction = getJurisdiction(role);

  if (jurisdiction === "all") return complaints;
  if (jurisdiction === "district") {
    return complaints.filter(c =>
      !user.district || c.district === user.district ||
      c.location?.toLowerCase().includes((user.district || "").toLowerCase())
    );
  }
  if (jurisdiction === "circle") {
    return complaints.filter(c =>
      c.district === user.district && (
        !user.station || c.assigned_officer === user.email ||
        c.assigned_department === user.department
      )
    );
  }
  // Station level
  return complaints.filter(c =>
    c.assigned_officer === user.email ||
    (c.district === user.district && c.status !== "closed")
  );
}
```

### 12.7 Real-Time Updates

```javascript
// Any entity subscription updates all open dashboards
useEffect(() => {
  const unsub = base44.entities.Complaint.subscribe((event) => {
    if (event.type === 'create') setComplaints(prev => [event.data, ...prev]);
    if (event.type === 'update') setComplaints(prev =>
      prev.map(c => c.id === event.data.id ? event.data : c));
    if (event.type === 'delete') setComplaints(prev =>
      prev.filter(c => c.id !== event.data.id));
  });
  return unsub;
}, []);
```

**Event Types:** `create`, `update`, `delete` — each carries the full entity `data` object.

### 12.8 Demo Data Fallback

When real database records are empty, StationDashboard injects demo data for functional preview:

```javascript
const DEMO_COMPLAINTS = [
  { id: "demo1", case_id: "NM-VZ001-DEMO", title: "Mobile Snatching Near RTC Complex",
    category: "snatching", status: "investigating", priority: "high",
    location: "RTC Complex, Visakhapatnam", district: "Visakhapatnam",
    complainant_name: "Ravi Kumar", complainant_phone: "9876543210",
    created_date: moment().subtract(2, "days").toISOString(), is_escalated: false },
  // ... 4 more demo complaints
];
```

> Demo records are identified by IDs starting with `"demo"` and are **read-only** — status updates and notes are disabled.

### 12.9 Cascading Dropdown Logic (District → Mandal → Station)

```javascript
// FileComplaint.jsx & CompleteProfile.jsx
const PILOT_DISTRICT_DATA = {
  "Visakhapatnam": {
    mandals: ["Gajuwaka","Seethammadhara","Anakapalli","Kommadi","Pedagantyada","Bheemunipatnam","Araku"],
    stations: {
      "Gajuwaka": ["Gajuwaka PS","Bheemunipatnam PS","Malkapuram PS"],
      "Seethammadhara": ["One Town PS","MVP Colony PS","Dwaraka Nagar PS","Rushikonda PS","Gopalapatnam PS"],
      // ...
    }
  },
  // 4 more districts
};

// Flow:
// 1. User selects District → populate Mandal dropdown
// 2. User selects Mandal → populate Station dropdown
// 3. All three stored in Complaint / User profile
```

### 12.10 Action Updates Timeline

Every status change or note adds an entry to `Complaint.action_updates`:

```javascript
await base44.entities.Complaint.update(complaintId, {
  action_updates: [
    ...complaint.action_updates,
    { date: new Date().toISOString(), update: "Status changed to investigating", by: userEmail }
  ]
});
```

Displayed as a timeline in TrackCase and StationDashboard.

---

## 13. AI Features

### 13.1 NyayaAI Assistant (`/nyaya-ai`)

| Aspect | Detail |
|--------|--------|
| **Input** | Free-text user query or quick-prompt selection |
| **Prompt design** | System context: "You are NyayaAI, a legal and police guidance assistant for Andhra Pradesh citizens and officers." + user query |
| **Model** | `automatic` (default) — configurable to `gemini_3_flash` for web-context queries |
| **Processing** | `base44.integrations.Core.InvokeLLM({prompt, model})` |
| **Output** | Markdown text rendered via react-markdown |
| **Quick prompts** | Crime Summary, Cyber Guidance, Legal Rights, Duty Guidance, Case Priority, Officer Advice |
| **Validation** | Empty input blocked |
| **Error handling** | Toast on LLM failure |

**Quick Prompts Definition:**
```javascript
const QUICK_PROMPTS = [
  { label: "Crime Summary", prompt: "Give me a summary of recent crime trends and key insights", icon: TrendingUp },
  { label: "Cyber Guidance", prompt: "What should I do immediately after a cyber fraud?", icon: Zap },
  { label: "Legal Rights", prompt: "What are my fundamental rights during a police inquiry?", icon: FileText },
  { label: "Duty Guidance", prompt: "Explain patrol zone best practices for night duty", icon: Shield },
  { label: "Case Priority", prompt: "How should I prioritize critical vs high priority cases?", icon: AlertTriangle },
  { label: "Officer Advice", prompt: "What are the key workflow steps for a newly filed FIR?", icon: Users },
];
```

### 13.2 Crime Analysis AI (`/crime-analysis`)

| Aspect | Detail |
|--------|--------|
| **Input** | Aggregated complaint data (counts by category, district, date) + time range |
| **Prompt design** | "Analyze the following crime data from Andhra Pradesh pilot districts. Identify patterns, emerging threats, and provide resource allocation recommendations. Data: [JSON]" |
| **Model** | `claude_sonnet_4_6` (for complex reasoning) or `gemini_3_1_pro` (with web context) |
| **Output** | Markdown assessment with: crime patterns, predictive forecasts, resource suggestions |
| **Processing** | Fetch complaints → aggregate → format prompt → InvokeLLM → render markdown |

### 13.3 Police AI Advisor (`/police-ai-advisor`)

| Aspect | Detail |
|--------|--------|
| **Input** | Officer's operational questions (patrol optimization, case prioritization) |
| **Output** | Structured advisory with best practices |
| **Model** | `automatic` |

### 13.4 Smart Alerts AI (`/smart-alerts`)

| Aspect | Detail |
|--------|--------|
| **Input** | Historical crime data + location |
| **Output** | Risk predictions and alerts |
| **Model** | `gemini_3_flash` (with web context for news) |

### 13.5 Crime Heat Map AI (`/crime-heat-map`)

| Aspect | Detail |
|--------|--------|
| **Input** | Complaint locations + categories |
| **Output** | Heat map overlay with AI-identified hotspots |
| **Processing** | Aggregate by geo-coordinates → render on Leaflet map |

### 13.6 Safe Route AI (`/safe-route`)

| Aspect | Detail |
|--------|--------|
| **Input** | Source + destination + crime hotspots |
| **Output** | Recommended route avoiding high-crime zones |
| **Model** | `automatic` |

### 13.7 AI Chatbot (Global Floating)

| Aspect | Detail |
|--------|--------|
| **Component** | `src/components/AIChatbot.jsx` — floating button on all pages |
| **Input** | User questions |
| **Output** | Quick AI responses |
| **Model** | `automatic` |

### 13.8 Voice Constable

| Aspect | Detail |
|--------|--------|
| **Component** | `src/components/VoiceConstable.jsx` — voice input |
| **Processing** | Browser Web Speech API → text → InvokeLLM |
| **Output** | Text response + optional TTS via `GenerateSpeech` |

### 13.9 AI Integration Patterns

**Pattern 1: Simple Q&A**
```javascript
const result = await base44.integrations.Core.InvokeLLM({
  prompt: userInput,
  model: "automatic"
});
// result is a string (markdown)
```

**Pattern 2: Structured JSON Output**
```javascript
const result = await base44.integrations.Core.InvokeLLM({
  prompt: "Analyze this complaint and return severity",
  response_json_schema: {
    type: "object",
    properties: {
      severity: { type: "string", enum: ["low","medium","high","critical"] },
      reasoning: { type: "string" }
    }
  }
});
// result is a parsed object
```

**Pattern 3: Web-Context Queries**
```javascript
const result = await base44.integrations.Core.InvokeLLM({
  prompt: "What are the latest cyber fraud trends in Andhra Pradesh?",
  model: "gemini_3_flash",
  add_context_from_internet: true
});
```

**Pattern 4: Vision (file_urls)**
```javascript
const result = await base44.integrations.Core.InvokeLLM({
  prompt: "Analyze this evidence photo and describe what you see",
  file_urls: ["https://...proof-image.jpg"]
});
```

### 13.10 AI Model Selection Guide

| Use Case | Recommended Model | Rationale |
|----------|------------------|-----------|
| General Q&A | `automatic` | Cost-effective, auto-selects best |
| Web-context queries | `gemini_3_flash` | Only model with web search |
| Complex reasoning | `claude_sonnet_4_6` | Strong analytical ability |
| Deep legal analysis | `claude_opus_4_8` | Highest quality reasoning |
| Fast simple tasks | `gpt_5_mini` | Low latency |
| Vision tasks | Any (all support file_urls) | — |

---

## 14. Environment Variables

### 14.1 Frontend (Vite)

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_BASE44_APP_ID` | Base44 application identifier | `69c9e5a623be48a91eed194a` |
| `VITE_BASE44_FUNCTIONS_VERSION` | Backend functions version | `v1` |
| `VITE_BASE44_APP_BASE_URL` | App base URL for redirects | `https://nyaya-mitra.app.base44.dev` |

> These are injected at build time via `import.meta.env`. Runtime fallbacks in `app-params.js` check URL params (`?app_id=`, `?access_token=`) and localStorage.

**app-params.js Logic:**
```javascript
const getAppParams = () => ({
  appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID }),
  token: getAppParamValue("access_token", { removeFromUrl: true }),
  functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
  appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL }),
});
```

### 14.2 Backend (Base44-Managed — No Direct Env Vars)

Base44 manages all backend secrets (DB connection, AI API keys, email credentials). No environment variables are exposed to the frontend.

### 14.3 Migration to Supabase (.env)

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # backend only

# AI (OpenAI / Anthropic / Google)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIza...

# Email (Resend)
RESEND_API_KEY=re_...

# Maps (optional alternative)
MAPBOX_API_KEY=pk-...

# Storage (if S3 direct)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=nyaya-mitra
```

> **Security:** Never expose service-role keys or AI API keys in the frontend. Use Supabase Edge Functions or a backend API as a proxy.

### 14.4 Runtime Config

The app supports runtime configuration via URL parameters:
- `?app_id=` — Override app ID
- `?access_token=` — Set auth token (auto-removed from URL)
- `?functions_version=` — Set functions version
- `?app_base_url=` — Set base URL
- `?clear_access_token=true` — Clear stored token

This allows testing different environments without rebuilding.

---

## 15. External Services

### 15.1 Currently Used (via Base44)

| Service | Purpose | Replaced By (Migration) |
|---------|---------|------------------------|
| Base44 Auth | User auth, OTP, sessions | Supabase Auth |
| Base44 Database (MongoDB) | Entity storage | Supabase (PostgreSQL) |
| Base44 Storage | File uploads | Supabase Storage / AWS S3 |
| Base44 Core InvokeLLM | Multi-model LLM gateway | Direct OpenAI/Anthropic/Google API or OpenRouter |
| Base44 Core SendEmail | Email to registered users | Resend / SendGrid / Supabase Edge Function |
| Base44 Core GenerateImage | AI image generation | OpenAI DALL-E / Google Imagen |
| Base44 Core GenerateSpeech | TTS | OpenAI TTS / Google TTS |
| Base44 Core GenerateVideo | AI video | Google Veo / Runway |
| Base44 Core TranscribeAudio | Speech-to-text | OpenAI Whisper API |
| Base44 Realtime | Entity subscriptions | Supabase Realtime (Postgres changes) |
| Base44 Hosting | Static SPA + CDN | Vercel / Netlify / Cloudflare Pages |

### 15.2 Client-Side Services

| Service | Purpose |
|---------|---------|
| Browser Geolocation API | GPS for attendance |
| Browser Web Speech API | Voice input |
| Leaflet / OpenStreetMap | Maps (free, no API key) |
| Unsplash | Stock photos (hero images) |
| Google Fonts (Inter, Noto Sans Telugu) | Typography |

### 15.3 Not Currently Integrated (Available as Connectors)

Google Calendar, Gmail, Google Sheets, Google Docs, Slack, Notion, Salesforce, HubSpot, GitHub, Jira, and 50+ other OAuth connectors — **[NOT USED]** in current pilot.

### 15.4 Recommended Future Integrations

| Service | Purpose | Priority |
|---------|---------|----------|
| Twilio / msg91 | SMS OTP & notifications | P0 |
| Firebase Cloud Messaging | Push notifications (web + Android) | P1 |
| WhatsApp Business API | Citizen notifications | P1 |
| Razorpay / Stripe | Fee payments (if introduced) | P2 |
| RBI Cyber Portal API | Golden Hour bank freeze automation | P2 |
| Mapbox | Better map styling & routing | P2 |
| Sentry | Error monitoring | P0 |
| PostHog | Product analytics | P1 |

---

## 16. Deployment

### 16.1 Current Deployment (Base44)

| Step | Detail |
|------|--------|
| Build | `npm run build` → outputs `./dist` |
| Hosting | Base44 auto-deploys static SPA to CDN |
| Custom Domain | Configure via Base44 dashboard |
| Environment | `VITE_BASE44_APP_ID` set in Base44 dashboard |
| HTTPS | Auto-provisioned by Base44 |
| Preview | Auto-deployed preview on every change |
| Mobile | Same codebase publishes to iOS/Android via Base44 |

### 16.2 Migration Deployment (Recommended)

#### Web (Vercel)

```bash
npm install
npm run build    # outputs ./dist
# Deploy to Vercel:
vercel --prod
# Set environment variables in Vercel dashboard
```

**Vercel Configuration (`vercel.json`):**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "./dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

#### Backend (Supabase)

```bash
# 1. Create Supabase project
# 2. Run SQL migrations (schema creation)
supabase db push

# 3. Set up Storage buckets
# (via Supabase dashboard or CLI)

# 4. Configure Auth providers (email/OTP)
# (via Supabase dashboard)

# 5. Deploy Edge Functions for AI proxy & email
supabase functions deploy ai-proxy
supabase functions deploy send-email
supabase functions deploy case-id-gen
supabase functions deploy golden-hour-notify
supabase functions deploy escalation-cron

# 6. Set environment secrets
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set RESEND_API_KEY=re_...
```

#### Android (Play Store)

```bash
# Build APK
./gradlew assembleRelease

# Or AAB for Play Store
./gradlew bundleRelease

# Sign with keystore
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 release.aab keystore

# Upload to Play Console
# (via Google Play Console or CLI)
```

### 16.3 CI/CD (Recommended)

**`.github/workflows/deploy.yml`:**
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  supabase:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/cli-action@v1
        with:
          command: db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_TOKEN }}

  android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: 17
          distribution: temurin
      - run: ./gradlew bundleRelease
      - uses: r0admillion/upload-google-play@v1
        with:
          serviceAccountJsonPlain: ${{ secrets.PLAY_SERVICE_ACCOUNT }}
          packageName: com.nyayamitra.app
          releaseFiles: app/build/outputs/bundle/release/app-release.aab
```

### 16.4 Build Configuration

**`vite.config.js` (current):**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import base44Plugin from '@base44/vite-plugin'

export default defineConfig({
  plugins: [react(), base44Plugin()],
  resolve: { alias: { '@': '/src' } },
  server: { port: 3000 }
})
```

**Post-migration (remove Base44 plugin):**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': '/src' } },
  server: { port: 3000 },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'charts': ['recharts'],
          'maps': ['react-leaflet', 'leaflet']
        }
      }
    }
  }
})
```

### 16.5 Docker Deployment (Optional)

**`Dockerfile`:**
```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 17. Security

### 17.1 Authentication Security

| Measure | Status |
|---------|--------|
| Password hashing (bcrypt) | ✅ (platform-managed) |
| JWT sessions | ✅ |
| OTP email verification | ✅ |
| Session expiry | ✅ (platform) |
| Rate limiting on OTP | ✅ (`otp_attempts` tracked) |
| Force password reset | ✅ (`force_password_reset` flag) |
| Account disable | ✅ (`disabled`, `disabled_reason` fields) |

### 17.2 Authorization Security

| Measure | Status |
|---------|--------|
| Role-based access control | ✅ (`rbac.js`) |
| Jurisdiction filtering | ✅ (`filterComplaintsByRole`) |
| Route protection | ✅ (`ProtectedRoute`, AuthContext) |
| Admin-only user management | ✅ (platform-built-in) |
| **[MISSING]** Row-Level Security (RLS) at DB level | ❌ — currently app-level only. **Recommendation:** In Supabase, implement RLS policies on all tables. |

### 17.3 API Security

| Measure | Status |
|---------|--------|
| HTTPS only | ✅ (platform) |
| JWT token in Authorization header | ✅ |
| Token auto-refresh | ✅ (platform) |
| **[MISSING]** API rate limiting | ❌ — **Recommendation:** Add per-user rate limits. |
| **[MISSING]** Input sanitization at API | ❌ — **Recommendation:** Validate all inputs server-side. |

### 17.4 Storage Security

| Measure | Status |
|---------|--------|
| Public vs private file separation | ✅ |
| Signed URLs with expiry | ✅ (`CreateFileSignedUrl`) |
| Upload auth required | ✅ |
| **[MISSING]** File type validation | ❌ — **Recommendation:** Validate MIME types on upload. |
| **[MISSING]** Virus scanning | ❌ — **Recommendation:** Scan uploaded files. |

### 17.5 Input Validation

| Measure | Status |
|---------|--------|
| Form-level validation (zod/react-hook-form) | ✅ (some forms) |
| Required field checks | ✅ |
| Phone format validation | ✅ (10-digit) |
| **[MISSING]** XSS prevention | ⚠️ — react-markdown renders AI output; ensure sanitization. |
| **[MISSING]** SQL/NoSQL injection prevention | ⚠️ — platform handles, but custom queries need care. |

### 17.6 Supabase RLS Policy Examples

```sql
-- Complaints: Users can see their own; officers see district/station cases
CREATE POLICY "Citizens see own complaints"
  ON complaints FOR SELECT
  USING (auth.uid() = created_by_id);

CREATE POLICY "Officers see district complaints"
  ON complaints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('police','dsp','dgp','admin')
      AND (user_profiles.district = complaints.district
           OR user_profiles.user_type IN ('dgp','admin'))
    )
  );

-- Attendance: Officers can insert own; managers see district
CREATE POLICY "Officers mark own attendance"
  ON attendances FOR INSERT
  WITH CHECK (auth.uid() = (
    SELECT id FROM user_profiles WHERE email = attendances.officer_email
  ));

-- Only admins can delete complaints
CREATE POLICY "Admin delete complaints"
  ON complaints FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );
```

### 17.7 Edge Function Input Validation Example

```typescript
// supabase/functions/file-complaint/index.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

Deno.serve(async (req) => {
  const { title, description, category, complainant_phone, location } = await req.json();

  // Validate
  if (!title || title.length < 5) {
    return new Response('Title too short', { status: 400 });
  }
  if (!/^[0-9]{10}$/.test(complainant_phone)) {
    return new Response('Invalid phone', { status: 400 });
  }
  const validCategories = ['narcotics','snatching','cyber_crime', ...];
  if (!validCategories.includes(category)) {
    return new Response('Invalid category', { status: 400 });
  }

  // Generate case ID
  const { data: caseId } = await supabase.rpc('generate_case_id', { p_district: 'Visakhapatnam' });

  // Insert
  const { data, error } = await supabase.from('complaints').insert({
    case_id: caseId,
    title, description, category,
    complainant_phone, location,
    created_by_id: req.headers.get('user-id')
  }).select().single();

  if (error) return new Response(JSON.stringify(error), { status: 500 });
  return Response.json(data);
});
```

### 17.8 Best Practices Recommendations

1. **Implement CSP** (Content Security Policy) headers.
2. **Add CSRF protection** for form submissions.
3. **Enable audit logging** for all sensitive operations (partially in `/activity-log`).
4. **Encrypt sensitive fields** (account numbers, UTR) at rest using pgcrypto.
5. **Implement PII data retention policy** — auto-delete resolved case data after 7 years.
6. **Add 2FA** for admin and DGP roles (TOTP via app).
7. **Regular dependency scanning** (npm audit, Dependabot, Snyk).
8. **Sanitize all AI-generated markdown** with DOMPurify before rendering.
9. **Rate limit AI calls** per user (e.g., 20/hour for citizens, 100/hour for officers).
10. **Implement file upload restrictions** — max size 10MB, MIME whitelist (image/jpeg, image/png, application/pdf).
11. **Add security headers** — X-Frame-Options, X-Content-Type-Options, Referrer-Policy.
12. **Regular penetration testing** — quarterly security audit.
13. **Comply with DPDP Act (India)** — data localization, consent, right to access/erasure.

---

> **End of Part 2.** Continue to `NyayaMitra_Project_Handover_Part3.md` for Sections 18-22 (Migration Guide, Missing Features, Future Scope, Professional Review) + Appendices.