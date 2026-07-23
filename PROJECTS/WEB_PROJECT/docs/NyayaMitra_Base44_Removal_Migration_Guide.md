# NyayaMitra — Complete Base44 Removal & Migration Guide

**Document Version:** 1.0 — July 2026
**Purpose:** Replace every Base44 SDK call, entity, auth flow, storage function, realtime subscription, AI integration, and workflow with a technology-agnostic architecture, then provide equivalent implementations using **Supabase (Web/React)** and **Supabase + Kotlin (Android)**.

---

## Table of Contents

1. [Base44 Dependency Inventory](#1-base44-dependency-inventory)
2. [Technology-Agnostic Target Architecture](#2-technology-agnostic-target-architecture)
3. [File-by-File Dependency Map & Replacement Plan](#3-file-by-file-dependency-map--replacement-plan)
4. [Supabase Backend Setup](#4-supabase-backend-setup)
5. [React/Supabase — Client Layer Replacement](#5-reactsupabase--client-layer-replacement)
6. [Authentication Flow Replacement](#6-authentication-flow-replacement)
7. [Entity (Database) Call Replacement](#7-entity-database-call-replacement)
8. [Storage Function Replacement](#8-storage-function-replacement)
9. [Realtime Subscription Replacement](#9-realtime-subscription-replacement)
10. [AI Integration Replacement](#10-ai-integration-replacement)
11. [Workflow / Scheduled Job Replacement](#11-workflow--scheduled-job-replacement)
12. [Analytics Replacement](#12-analytics-replacement)
13. [Kotlin / Jetpack Compose (Android) Implementation](#13-kotlin--jetpack-compose-android-implementation)
14. [Post-Migration Cleanup Checklist](#14-post-migration-cleanup-checklist)

---

## 1. Base44 Dependency Inventory

### 1.1 NPM Packages (uninstall first)

| Package | File | Action |
|---------|------|--------|
| `@base44/sdk` | `package.json`, `src/api/base44Client.js` | Uninstall; replace with `@supabase/supabase-js` |
| `@base44/vite-plugin` | `vite.config.js`, `package.json` | Uninstall; remove from Vite plugins |

```bash
npm uninstall @base44/sdk @base44/vite-plugin
npm install @supabase/supabase-js
```

### 1.2 Every File That Depends on Base44

| # | File | Base44 Usage | Replacement |
|---|------|--------------|-------------|
| 1 | `src/api/base44Client.js` | `createClient` from `@base44/sdk` | Replace with `src/lib/supabase.ts` |
| 2 | `src/lib/app-params.js` | Reads `app_id`, `token`, `functions_version` | Replace with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| 3 | `src/lib/AuthContext.jsx` | `base44.auth.me()`, `base44.auth.logout()`, `base44.auth.redirectToLogin()`, `createAxiosClient` from `@base44/sdk` | Replace with `supabase.auth.getUser()`, `supabase.auth.signOut()`, `supabase.auth.signInWithPassword()` |
| 4 | `src/App.jsx` | `AuthProvider`, `QueryClientProvider`, splash gate | Keep structure; swap `AuthProvider` internals |
| 5 | `src/lib/rbac.js` | None directly, but `getDashboardRoute` uses Base44 routes | Keep as-is; routes unchanged |
| 6 | `src/lib/supabase.js` | [Legacy stub, unused] | Replace with real Supabase client init |
| 7 | `src/components/CaseChat.jsx` | `base44.auth.me()`, `base44.entities.CitizenChat.subscribe()`, `.filter()`, `.create()` | Supabase auth + `citizen_chats` table + realtime channel |
| 8 | `src/components/AIChatbot.jsx` | **No Base44 dependency** (local knowledge base) | No change needed |
| 9 | `src/components/VoiceConstable.jsx` | Likely `base44.integrations.Core.InvokeLLM` | Replace with `/functions/v1/ai-proxy` fetch |
| 10 | `src/components/QRScanner.jsx` | Possibly `base44` for verification | Replace with Supabase query |
| 11 | `src/pages/Splash.jsx` | None | No change |
| 12 | `src/pages/Home.jsx` | None (LocalStorage only) | No change |
| 13 | `src/pages/AuthPortal.jsx` | `base44.auth.redirectToLogin()` | `supabase.auth.signInWithOtp()` or redirect to custom login |
| 14 | `src/pages/CompleteProfile.jsx` | `base44.auth.me()`, `base44.auth.updateMe()` | `supabase.auth.getUser()`, insert into `user_profiles` table |
| 15 | `src/pages/FileComplaint.jsx` | `base44.integrations.Core.UploadFile()`, `base44.entities.Complaint.create()`, `CyberCrimeReport.create()` | `supabase.storage.upload()`, `supabase.from('complaints').insert()` |
| 16 | `src/pages/TrackCase.jsx` | `base44.entities.Complaint.filter()` | `supabase.from('complaints').select().eq('case_id', ...)` |
| 17 | `src/pages/Dashboard.jsx` | `base44.entities.Complaint.filter()`, `base44.auth.me()` | Supabase queries + `auth.getUser()` |
| 18 | `src/pages/CitizenDashboard.jsx` | `base44.entities.Complaint.filter()`, `base44.auth.me()` | Supabase |
| 19 | `src/pages/StationDashboard.jsx` | `base44.entities.{Complaint,CyberCrimeReport,Attendance,DutyAssignment}.filter()`, `.update()`, `.subscribe()` | Supabase queries + realtime |
| 20 | `src/pages/OfficerDashboard.jsx` | `base44.entities.Complaint.filter()`, `.update()` | Supabase |
| 21 | `src/pages/DSPDashboard.jsx` | Multiple entity `.filter()`, `.list()` | Supabase |
| 22 | `src/pages/DGPDashboard.jsx` | Multiple entity reads, `StationAlert.filter()` | Supabase |
| 23 | `src/pages/CourtDashboard.jsx` | `Complaint.filter({status:"court_hearing"})`, `.update()` | Supabase |
| 24 | `src/pages/LawyerDashboard.jsx` | `Complaint.filter({assigned_lawyer})`, `.update()` | Supabase |
| 25 | `src/pages/AttendanceSystem.jsx` | `base44.entities.Attendance.create()`, `.filter()` | Supabase insert + select |
| 26 | `src/pages/DutyManagement.jsx` | `DutyAssignment.create()`, `.update()`, `.filter()` | Supabase |
| 27 | `src/pages/GoldenHourCyber.jsx` | `CyberCrimeReport.create()`, `.update()` | Supabase |
| 28 | `src/pages/CrimeAnalysis.jsx` | `Complaint.list()`, `base44.integrations.Core.InvokeLLM()` | Supabase + AI proxy Edge Function |
| 29 | `src/pages/CrimeHeatMap.jsx` | `Complaint.list()` or `Complaint.filter()` | Supabase |
| 30 | `src/pages/NyayaAIAssistant.jsx` | `base44.integrations.Core.InvokeLLM()` | `/functions/v1/ai-proxy` fetch |
| 31 | `src/pages/ConstitutionRights.jsx` | None (static content) | No change |
| 32 | `src/pages/FIRDocument.jsx` | `Complaint.get()` or `.filter()` | Supabase |
| 33 | `src/pages/LegalDocuments.jsx` | `Complaint.filter()`, `InvokeLLM` (optional) | Supabase + AI proxy |
| 34 | `src/pages/SafeRoute.jsx` | `InvokeLLM`, `Complaint.filter()` | Supabase + AI proxy |
| 35 | `src/pages/TrustedCircle.jsx` | `WomenSafetySession.create()` etc. | Supabase (or remove — legacy) |
| 36 | `src/pages/SmartAlerts.jsx` | `InvokeLLM`, `StationAlert.filter()` | Supabase + AI proxy |
| 37 | `src/pages/CitizenChat.jsx` (page) | Same as CaseChat component | Supabase |
| 38 | `src/pages/Feedback.jsx` | `Feedback.create()`, `.list()` | Supabase |
| 39 | `src/pages/Contact.jsx` | None or `User.list()` | Supabase |
| 40 | `src/pages/PoliceStations.jsx` | None (uses static `policeStations.js`) | No change |
| 41 | `src/pages/Departments.jsx` | None (static) | No change |
| 42 | `src/pages/UnifiedDashboard.jsx` | Multiple entity reads + `InvokeLLM` | Supabase + AI proxy |
| 43 | `src/pages/PerformanceDashboard.jsx` | Entity reads | Supabase |
| 44 | `src/pages/CaseManagement.jsx` | `Complaint.filter()`, `.update()` | Supabase |
| 45 | `src/pages/Analytics.jsx` | Entity reads + `InvokeLLM` | Supabase + AI proxy |
| 46 | `src/pages/LiveTracking.jsx` | `DutyAssignment.filter()`, realtime | Supabase + realtime |
| 47 | `src/pages/AlertsAdmin.jsx` | `StationAlert.create()`, `.update()`, `.filter()` | Supabase |
| 48 | `src/pages/OfficerManagement.jsx` | `User.list()`, `update` | Supabase admin API |
| 49 | `src/pages/ActivityLog.jsx` | Activity entity or audit table | Supabase audit table |
| 50 | `src/pages/WorkforceMonitor.jsx` | `DutyAssignment`, `Attendance` reads | Supabase + realtime |
| 51 | `src/pages/CyberOpsCenter.jsx` | `CyberCrimeReport.filter()` | Supabase |
| 52 | `src/pages/SystemAdminBoard.jsx` | Entity reads | Supabase |
| 53 | `src/pages/AdminPanel.jsx` | `base44.users.inviteUser()`, `User.list()` | `supabase.auth.admin.inviteUserByEmail()` |
| 54 | `src/pages/PoliceAIAdvisor.jsx` | `InvokeLLM` | AI proxy |
| 55 | `src/components/FirstTimeGuide.jsx` | None | No change |
| 56 | `src/components/RoleFeatureGuide.jsx` | None | No change |
| 57 | `src/components/NoticeBoard.jsx` | `StationAlert.filter()` | Supabase |
| 58 | `src/components/ScrollingTicker.jsx` | `StationAlert.filter()` | Supabase |
| 59 | `src/components/APMap.jsx` | None | No change |
| 60 | `src/components/EmergencyBanner.jsx` | None | No change |
| 61 | `src/data/policeStations.js` | None (static) | No change |

### 1.3 Base44 Concepts → Replacement Map

| Base44 Concept | Replacement |
|----------------|-------------|
| `@base44/sdk` `createClient` | `@supabase/supabase-js` `createClient` |
| `base44.auth.me()` | `supabase.auth.getUser()` |
| `base44.auth.logout()` | `supabase.auth.signOut()` |
| `base44.auth.redirectToLogin()` | `supabase.auth.signInWithPassword()` / custom login page |
| `base44.auth.isAuthenticated()` | `!!(await supabase.auth.getSession()).data.session` |
| `base44.auth.updateMe(data)` | `supabase.from('user_profiles').update(data).eq('id', user.id)` |
| `base44.users.inviteUser(email, role)` | `supabase.auth.admin.inviteUserByEmail(email)` (service role) |
| `base44.entities.X.list()` | `supabase.from('x').select('*')` |
| `base44.entities.X.filter(query)` | `supabase.from('x').select('*').eq(...)` |
| `base44.entities.X.get(id)` | `supabase.from('x').select('*').eq('id', id).single()` |
| `base44.entities.X.create(data)` | `supabase.from('x').insert(data).select().single()` |
| `base44.entities.X.update(id, patch)` | `supabase.from('x').update(patch).eq('id', id)` |
| `base44.entities.X.delete(id)` | `supabase.from('x').delete().eq('id', id)` |
| `base44.entities.X.bulkCreate([])` | `supabase.from('x').insert([])` |
| `base44.entities.X.subscribe(cb)` | `supabase.channel('x').on('postgres_changes', cb)` |
| `base44.integrations.Core.InvokeLLM` | Edge Function `/functions/v1/ai-proxy` |
| `base44.integrations.Core.UploadFile` | `supabase.storage.from('bucket').upload()` |
| `base44.integrations.Core.UploadPrivateFile` | `supabase.storage.from('private-bucket').upload()` |
| `base44.integrations.Core.CreateFileSignedUrl` | `supabase.storage.from('private-bucket').createSignedUrl()` |
| `base44.integrations.Core.SendEmail` | Edge Function `/functions/v1/send-email` (Resend) |
| `base44.integrations.Core.GenerateImage` | Edge Function `/functions/v1/generate-image` (OpenAI DALL-E) |
| `base44.integrations.Core.GenerateSpeech` | Edge Function `/functions/v1/generate-speech` (OpenAI TTS) |
| `base44.integrations.Core.GenerateVideo` | Edge Function `/functions/v1/generate-video` (Google Veo) |
| `base44.integrations.Core.TranscribeAudio` | Edge Function `/functions/v1/transcribe` (OpenAI Whisper) |
| `base44.integrations.Core.ExtractDataFromUploadedFile` | Edge Function `/functions/v1/extract-data` (LLM with schema) |
| `base44.analytics.track()` | PostHog / `supabase.from('analytics_events').insert()` |
| `base44/entities/*.jsonc` | SQL DDL migrations in `supabase/migrations/` |
| `base44/config.jsonc` | `supabase/config.toml` + `.env` |
| Base44 Hosting | Vercel / Netlify |

---

## 2. Technology-Agnostic Target Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    CLIENTS                                  │
│  ┌─────────────────┐        ┌──────────────────────────────┐ │
│  │  React Web SPA  │        │  Kotlin Android (Compose)   │ │
│  │  (Vite + TS)    │        │  (MVVM + Hilt)              │ │
│  └────────┬────────┘        └──────────────┬───────────────┘ │
└───────────┼─────────────────────────────────┼───────────────┘
            │                                 │
            │  HTTPS (Supabase JS SDK)         │  HTTPS (Supabase Kotlin SDK)
            │                                 │  + Retrofit for Edge Functions
            ▼                                 ▼
┌────────────────────────────────────────────────────────────┐
│                  SUPABASE BACKEND                           │
│                                                             │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌───────────┐ │
│  │  Auth    │  │ PostgreSQL │  │ Storage  │  │ Realtime  │ │
│  │ (JWT+OTP)│  │ (RLS)      │  │ (S3)     │  │ (PgChanges)│ │
│  └──────────┘  └────────────┘  └──────────┘  └───────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           EDGE FUNCTIONS (Deno Deploy)               │   │
│  │  ai-proxy • send-email • case-id-gen • golden-hour   │   │
│  │  escalation-cron • generate-doc • extract-data       │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────────┐
│             EXTERNAL AI / EMAIL / STORAGE PROVIDERS         │
│  OpenAI • Anthropic • Google AI • Resend • AWS S3          │
└────────────────────────────────────────────────────────────┘
```

**Key Principle:** All AI, email, and sensitive operations go through **Edge Functions** (server-side) so API keys never reach the client. Both web and Android call the same Edge Functions.

---

## 3. File-by-File Dependency Map & Replacement Plan

### 3.1 Core Infrastructure Files (replace first)

#### `src/api/base44Client.js` → `src/lib/supabase.ts`

**Before:**
```javascript
import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
export const base44 = createClient({
  appId: appParams.appId, token: appParams.token,
  functionsVersion: appParams.functionsVersion, serverUrl: '', requiresAuth: false
});
```

**After:**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  realtime: { params: { eventsPerSecond: 10 } }
});
```

#### `src/lib/app-params.js` → DELETE (use `.env`)

**`.env` (web):**
```env
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

#### `src/lib/AuthContext.jsx` → Rewrite

**After:**
```jsx
// src/lib/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) { setUser(session.user); setIsAuthenticated(true); }
      setIsLoadingAuth(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);
          const { data } = await supabase.from('user_profiles')
            .select('*').eq('id', session.user.id).single();
          setProfile(data);
        } else {
          setUser(null); setProfile(null); setIsAuthenticated(false);
        }
        setIsLoadingAuth(false);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => { await supabase.auth.signOut(); };
  const navigateToLogin = () => { window.location.href = '/login'; };

  return (
    <AuthContext.Provider value={{ user, profile, isAuthenticated, isLoadingAuth, logout, navigateToLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### 3.2 Page-Level Replacements (pattern)

Every page follows the same transformation. Here's the canonical pattern using `FileComplaint.jsx`:

**Before (Base44):**
```jsx
import { base44 } from "@/api/base44Client";
const { file_url } = await base44.integrations.Core.UploadFile({ file: proofFile });
await base44.entities.Complaint.create({ title, description, category, proof_urls: [file_url] });
```

**After (Supabase):**
```tsx
import { supabase } from "@/lib/supabase";
const { data: upload } = await supabase.storage.from('proof-public')
  .upload(`complaints/${Date.now()}-${proofFile.name}`, proofFile);
const file_url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/proof-public/${upload.path}`;
const { data, error } = await supabase.from('complaints')
  .insert({ title, description, category, proof_urls: [file_url], created_by_id: user.id })
  .select().single();
```

### 3.3 Realtime Component: `src/components/CaseChat.jsx`

**After (full Supabase version):**
```tsx
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
// ... other imports unchanged

export default function CaseChat({ caseId, onClose }) {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u));
  }, []);

  useEffect(() => {
    if (!caseId) return;
    loadMessages();
    const channel = supabase.channel(`citizen_chat:${caseId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'citizen_chats', filter: `case_id=eq.${caseId}` },
        (payload) => setMessages(prev => [...prev, payload.new])
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [caseId]);

  const loadMessages = async () => {
    const { data } = await supabase.from('citizen_chats')
      .select('*').eq('case_id', caseId).order('created_date', { ascending: true }).limit(100);
    if (data) setMessages(data);
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || sending || !user) return;
    setSending(true);
    const utype = user?.user_metadata?.user_type || "citizen";
    const isPolice = !["citizen","user","lawyer"].includes(utype);
    await supabase.from('citizen_chats').insert({
      case_id: caseId, sender_email: user.email,
      sender_name: user.user_metadata?.full_name || user.email,
      sender_role: isPolice ? "police" : "citizen",
      message: input.trim(), read: false
    });
    setInput(""); setSending(false);
  };
  // ... JSX unchanged
}
```

### 3.4 Files With NO Base44 Dependency (no change needed)

| File | Why no change |
|------|---------------|
| `src/pages/Home.jsx` | Only uses LocalStorage |
| `src/pages/Splash.jsx` | Pure animation |
| `src/pages/ConstitutionRights.jsx` | Static content |
| `src/pages/PoliceStations.jsx` | Static data from `policeStations.js` |
| `src/pages/Departments.jsx` | Static |
| `src/components/AIChatbot.jsx` | Local knowledge base — no LLM call |
| `src/components/APMap.jsx` | Leaflet only |
| `src/components/EmergencyBanner.jsx` | Static |
| `src/components/FirstTimeGuide.jsx` | LocalStorage |
| `src/data/policeStations.js` | Static data |
| `src/lib/rbac.js` | Pure logic (no SDK) |
| `src/lib/LanguageContext.js` | Pure i18n |
| `src/lib/translations.js` | Static strings |
| All `src/components/ui/*.jsx` | Pure shadcn primitives |

---

## 4. Supabase Backend Setup

### 4.1 SQL Schema (one migration file per entity)

```sql
-- supabase/migrations/001_user_profiles.sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  user_type TEXT DEFAULT 'citizen',
  district TEXT, station TEXT, mandal TEXT,
  badge_number TEXT, designation TEXT, department TEXT, phone TEXT,
  bar_council_id TEXT, court_name TEXT, specialization TEXT,
  profile_complete BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 002_complaints.sql
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id TEXT UNIQUE,
  title TEXT NOT NULL, description TEXT NOT NULL,
  category TEXT NOT NULL, priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'filed',
  complainant_name TEXT NOT NULL, complainant_phone TEXT NOT NULL,
  complainant_email TEXT, location TEXT NOT NULL, district TEXT,
  proof_urls TEXT[], assigned_officer TEXT, assigned_department TEXT DEFAULT 'general',
  assigned_lawyer TEXT, action_updates JSONB DEFAULT '[]',
  escalation_date TEXT, is_escalated BOOLEAN DEFAULT false, court_date TEXT,
  created_by_id UUID REFERENCES auth.users(id),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE case_id_seq START 1;
CREATE OR REPLACE FUNCTION generate_case_id(p_district TEXT)
RETURNS TEXT AS $$
DECLARE v_code TEXT; v_seq BIGINT;
BEGIN
  v_code := CASE p_district
    WHEN 'Visakhapatnam' THEN 'VZ' WHEN 'Krishna' THEN 'KR'
    WHEN 'Guntur' THEN 'GU' WHEN 'Nellore' THEN 'NL'
    WHEN 'Chittoor' THEN 'CH' ELSE 'XX' END;
  v_seq := nextval('case_id_seq');
  RETURN 'NM-' || v_code || LPAD(v_seq::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_complaint_case_id
  BEFORE INSERT ON complaints
  FOR EACH ROW WHEN (NEW.case_id IS NULL)
  EXECUTE FUNCTION (SELECT generate_case_id(NEW.district));

-- 003_cyber_reports.sql, 004_attendance.sql, 005_duties.sql,
-- 006_alerts.sql, 007_chats.sql, 008_feedback.sql — similar pattern
```

### 4.2 Row-Level Security (critical — replaces app-level RBAC)

```sql
-- 009_rls_policies.sql
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Citizens see only their own complaints
CREATE POLICY "citizens_own_complaints" ON complaints FOR SELECT
  USING (auth.uid() = created_by_id);

-- Officers see complaints in their jurisdiction
CREATE POLICY "officers_view_jurisdiction" ON complaints FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_profiles p
    WHERE p.id = auth.uid()
    AND p.user_type IN ('police','dsp','dgp','admin','si','ci','sp')
    AND (p.user_type IN ('dgp','admin') OR p.district = complaints.district)
  ));

-- Any authenticated user can create complaints
CREATE POLICY "auth_insert_complaint" ON complaints FOR INSERT
  WITH CHECK (auth.uid() = created_by_id);

-- Officers can update complaints in jurisdiction
CREATE POLICY "officers_update_complaint" ON complaints FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_profiles p
    WHERE p.id = auth.uid()
    AND p.user_type IN ('police','dsp','dgp','admin','si','ci','sp')
    AND (p.user_type IN ('dgp','admin') OR p.district = complaints.district)
  ));

-- Only admin/dgp can delete
CREATE POLICY "admin_delete" ON complaints FOR DELETE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin'));
```

### 4.3 Storage Buckets

```sql
-- Run in Supabase SQL editor
INSERT INTO storage.buckets (id, name, public) VALUES ('proof-public','proof-public', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('evidence-private','evidence-private', false);

CREATE POLICY "auth_upload_proof" ON storage.objects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "public_read_proof" ON storage.objects FOR SELECT
  USING (bucket_id = 'proof-public');
CREATE POLICY "auth_read_evidence" ON storage.objects FOR SELECT
  USING (bucket_id = 'evidence-private');
```

---

## 5. React/Supabase — Client Layer Replacement

Create thin API wrapper modules so pages don't call Supabase directly (easier to maintain + test):

```typescript
// src/api/complaints.ts
import { supabase } from '@/lib/supabase';

export const complaintsApi = {
  async list() {
    const { data, error } = await supabase.from('complaints')
      .select('*').order('created_date', { ascending: false });
    if (error) throw error; return data;
  },
  async filter(query: Record<string, any>) {
    let q = supabase.from('complaints').select('*');
    for (const [k, v] of Object.entries(query)) q = q.eq(k, v);
    const { data, error } = await q.order('created_date', { ascending: false });
    if (error) throw error; return data;
  },
  async getByCaseId(caseId: string) {
    const { data, error } = await supabase.from('complaints')
      .select('*').eq('case_id', caseId).single();
    if (error) throw error; return data;
  },
  async create(payload: any) {
    const { data, error } = await supabase.from('complaints')
      .insert(payload).select().single();
    if (error) throw error; return data;
  },
  async update(id: string, patch: any) {
    const { data, error } = await supabase.from('complaints')
      .update(patch).eq('id', id).select().single();
    if (error) throw error; return data;
  },
  async subscribe(callback: (payload: any) => void) {
    const channel = supabase.channel('complaints')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, callback)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }
};
```

Similarly create `src/api/{attendance,duties,alerts,chats,cyberReports,feedback}.ts`.

---

## 6. Authentication Flow Replacement

### 6.1 Login (email + OTP)

```typescript
// src/api/auth.ts
import { supabase } from '@/lib/supabase';

export const authApi = {
  async sendOtp(email: string) {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
  },
  async verifyOtp(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw error; return data;
  },
  async signInWithPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error; return data;
  },
  async signUp(email: string, password: string, metadata: any) {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: metadata } });
    if (error) throw error; return data;
  },
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
  async updateProfile(userId: string, data: any) {
    const { error } = await supabase.from('user_profiles')
      .update({ ...data, updated_date: new Date().toISOString() }).eq('id', userId);
    if (error) throw error;
  },
  async inviteUser(email: string) {
    // Must be called from Edge Function with service role
    const res = await fetch('/functions/v1/invite-user', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) throw new Error('Invite failed');
  }
};
```

### 6.2 CompleteProfile.jsx rewrite

```tsx
const handleComplete = async (e) => {
  e.preventDefault();
  await authApi.updateProfile(user.id, {
    user_type: selectedRole, district, station, mandal,
    badge_number, designation, department, phone,
    profile_complete: true
  });
  navigate('/dashboard');
};
```

---

## 7. Entity (Database) Call Replacement

| Base44 Pattern | Supabase Equivalent |
|----------------|---------------------|
| `base44.entities.Complaint.list()` | `supabase.from('complaints').select('*')` |
| `base44.entities.Complaint.filter({district:'VZ'}, '-created_date', 10)` | `supabase.from('complaints').select('*').eq('district','VZ').order('created_date',{ascending:false}).limit(10)` |
| `base44.entities.Complaint.get(id)` | `supabase.from('complaints').select('*').eq('id',id).single()` |
| `base44.entities.Complaint.create(data)` | `supabase.from('complaints').insert(data).select().single()` |
| `base44.entities.Complaint.update(id, {status:'resolved'})` | `supabase.from('complaints').update({status:'resolved'}).eq('id',id)` |
| `base44.entities.Complaint.delete(id)` | `supabase.from('complaints').delete().eq('id',id)` |
| `base44.entities.Complaint.bulkCreate([])` | `supabase.from('complaints').insert([])` |
| `base44.entities.Complaint.updateMany({status:'filed'}, {$set:{status:'review'}})` | `supabase.from('complaints').update({status:'review'}).eq('status','filed')` |

**Example: StationDashboard.jsx status update**

```tsx
// Before
await base44.entities.Complaint.update(c.id, {
  status: newStatus,
  action_updates: [...(c.action_updates||[]), { date: new Date().toISOString(), update: `Status → ${newStatus}`, by: user.email }]
});

// After
await supabase.from('complaints').update({
  status: newStatus,
  action_updates: [...(c.action_updates||[]), { date: new Date().toISOString(), update: `Status → ${newStatus}`, by: user.email }],
  updated_date: new Date().toISOString()
}).eq('id', c.id);
```

---

## 8. Storage Function Replacement

```typescript
// src/api/storage.ts
import { supabase } from '@/lib/supabase';

export const storageApi = {
  async uploadPublic(file: File, path: string) {
    const { data, error } = await supabase.storage.from('proof-public')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/proof-public/${data.path}`;
  },
  async uploadPrivate(file: File, path: string) {
    const { data, error } = await supabase.storage.from('evidence-private').upload(path, file);
    if (error) throw error;
    return data.path; // returns URI, not URL
  },
  async getSignedUrl(uri: string, expiresIn = 300) {
    const { data, error } = await supabase.storage.from('evidence-private')
      .createSignedUrl(uri, expiresIn);
    if (error) throw error;
    return data.signedUrl;
  }
};
```

---

## 9. Realtime Subscription Replacement

```typescript
// Before (Base44)
useEffect(() => {
  const unsub = base44.entities.Complaint.subscribe((event) => {
    if (event.type === 'create') setComplaints(p => [event.data, ...p]);
    if (event.type === 'update') setComplaints(p => p.map(c => c.id === event.data.id ? event.data : c));
    if (event.type === 'delete') setComplaints(p => p.filter(c => c.id !== event.data.id));
  });
  return unsub;
}, []);

// After (Supabase)
useEffect(() => {
  const channel = supabase.channel('complaints-changes')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'complaints' },
      (payload) => setComplaints(p => [payload.new, ...p]))
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'complaints' },
      (payload) => setComplaints(p => p.map(c => c.id === payload.new.id ? payload.new : c)))
    .on('postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'complaints' },
      (payload) => setComplaints(p => p.filter(c => c.id !== payload.old.id)))
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, []);
```

**Important:** Enable realtime on each table in Supabase dashboard → Database → Replication, or via SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE complaints, citizen_chats, duty_assignments, attendances, station_alerts;
```

---

## 10. AI Integration Replacement

### 10.1 Edge Function: `ai-proxy`

```typescript
// supabase/functions/ai-proxy/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const MODEL_ROUTES = {
  "gpt-5-mini": { provider: "openai", model: "gpt-4o-mini" },
  "gpt-5-5": { provider: "openai", model: "gpt-4o" },
  "gemini-3-flash": { provider: "google", model: "gemini-1.5-flash" },
  "claude-sonnet-4-6": { provider: "anthropic", model: "claude-3-5-sonnet-20241022" },
  "claude-opus-4-8": { provider: "anthropic", model: "claude-3-opus-20240229" },
  "automatic": { provider: "openai", model: "gpt-4o-mini" }
};

Deno.serve(async (req) => {
  const { prompt, model = "automatic", response_json_schema, file_urls, add_context_from_internet } = await req.json();

  // Auth check
  const auth = req.headers.get("Authorization");
  const { data: { user } } = await supabase.auth.getUser(auth?.replace("Bearer ", ""));
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Rate limit (simple)
  const { count } = await supabase.from('ai_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id).gte('created_at', new Date(Date.now() - 3600000).toISOString());
  if ((count || 0) > 100) return new Response("Rate limit exceeded", { status: 429 });

  const route = MODEL_ROUTES[model] || MODEL_ROUTES.automatic;

  let response;
  if (route.provider === "openai") {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: route.model,
        messages: [{ role: "user", content: prompt }],
        ...(response_json_schema ? { response_format: { type: "json_schema", json_schema: response_json_schema } } : {})
      })
    });
    const data = await response.json();
    return Response.json({ result: data.choices[0].message.content });
  }

  if (route.provider === "anthropic") {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: route.model, max_tokens: 4096,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await response.json();
    return Response.json({ result: data.content[0].text });
  }

  return new Response("Unknown model", { status: 400 });
});
```

### 10.2 Client Wrapper

```typescript
// src/api/ai.ts
export const aiApi = {
  async invoke(prompt: string, opts: { model?: string; response_json_schema?: any; file_urls?: string[]; add_context_from_internet?: boolean } = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session?.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt, ...opts })
    });
    if (!res.ok) throw new Error(await res.text());
    const { result } = await res.json();
    return result; // string or parsed JSON if schema provided
  }
};
```

### 10.3 Page Usage (NyayaAIAssistant.jsx)

```tsx
// Before
const result = await base44.integrations.Core.InvokeLLM({ prompt, model: "automatic" });

// After
const result = await aiApi.invoke(prompt, { model: "automatic" });
```

---

## 11. Workflow / Scheduled Job Replacement

| Base44 Concept | Supabase Replacement |
|----------------|---------------------|
| Backend functions | Edge Functions (Deno) |
| Scheduled tasks | `pg_cron` + `pg_net` or Supabase scheduled functions |
| Realtime triggers | Postgres triggers + Edge Function webhooks |

### 11.1 Auto-Escalation Cron

```sql
-- Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Escalate critical cases unresolved >48h
CREATE OR REPLACE FUNCTION escalate_old_critical_cases()
RETURNS VOID AS $$
BEGIN
  UPDATE complaints SET is_escalated = true, status = 'escalated'
  WHERE priority = 'critical'
    AND status IN ('filed','under_review','assigned','investigating')
    AND created_date < NOW() - INTERVAL '48 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run every hour
SELECT cron.schedule('escalate-critical', '0 * * * *', 'SELECT escalate_old_critical_cases()');
```

### 11.2 Golden Hour Auto-Notify

```typescript
// supabase/functions/golden-hour-notify/index.ts
Deno.serve(async (req) => {
  const { complaint_id } = await req.json();
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Update recovery status → notified
  await supabase.from('cyber_crime_reports')
    .update({ recovery_status: 'notified' }).eq('complaint_id', complaint_id);

  // Send email to cyber cell
  await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
    method: "POST",
    body: JSON.stringify({
      to: "cybercell@ap.gov.in",
      subject: `Golden Hour Alert — ${complaint_id}`,
      body: "New cyber fraud reported. Immediate action required."
    })
  });
  return Response.json({ ok: true });
});
```

**Trigger via Postgres webhook:**
```sql
-- Notify on cyber report insert
CREATE OR REPLACE FUNCTION notify_golden_hour()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_net.http_post(
    url := '${SUPABASE_URL}/functions/v1/golden-hour-notify',
    body := json_build_object('complaint_id', NEW.complaint_id)::text,
    headers := '{"Content-Type":"application/json"}'::json
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER golden_hour_trigger
  AFTER INSERT ON cyber_crime_reports
  FOR EACH ROW EXECUTE FUNCTION notify_golden_hour();
```

---

## 12. Analytics Replacement

```typescript
// src/api/analytics.ts
export const analytics = {
  async track(eventName: string, properties: Record<string, any> = {}) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('analytics_events').insert({
      event_name: eventName,
      properties,
      user_id: user?.id
    });
  }
};
```

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  properties JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_analytics_event ON analytics_events(event_name, created_at DESC);
```

---

## 13. Kotlin / Jetpack Compose (Android) Implementation

### 13.1 Setup

**`app/build.gradle.kts`:**
```kotlin
dependencies {
    // Supabase
    implementation("io.github.jan-tennert.supabase:postgrest-kt:2.5.0")
    implementation("io.github.jan-tennert.supabase:gotrue-kt:2.5.0")
    implementation("io.github.jan-tennert.supabase:realtime-kt:2.5.0")
    implementation("io.github.jan-tennert.supabase:storage-kt:2.5.0")
    implementation("io.ktor:ktor-client-android:2.3.12")

    // Compose
    implementation(platform("androidx.compose:compose-bom:2024.09.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.navigation:navigation-compose:2.8.0")

    // MVVM
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.6")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")

    // Hilt DI
    implementation("com.google.dagger:hilt-android:2.52")
    kapt("com.google.dagger:hilt-compiler:2.52")

    // Retrofit (for Edge Functions)
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")

    // Room (offline)
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")

    // Location
    implementation("com.google.android.gms:play-services-location:21.3.0")
}
```

### 13.2 Supabase Client (Kotlin)

```kotlin
// data/remote/NyayaSupabaseClient.kt
package com.nyayamitra.data.remote

import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.realtime.Realtime
import io.github.jan.supabase.storage.Storage

object NyayaSupabaseClient {
    val client = createSupabaseClient(
        supabaseUrl = "https://yourproject.supabase.co",
        supabaseKey = "your-anon-key"
    ) {
        install(Auth)
        install(Postgrest)
        install(Realtime)
        install(Storage)
    }

    val auth get() = client.auth
    val db get() = client.postgrest
    val storage get() = client.storage
    val realtime get() = client.realtime
}
```

### 13.3 Domain Models

```kotlin
// domain/model/Complaint.kt
package com.nyayamitra.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Complaint(
    val id: String,
    val caseId: String? = null,
    val title: String,
    val description: String,
    val category: String,
    val priority: String = "normal",
    val status: String = "filed",
    val complainantName: String,
    val complainantPhone: String,
    val complainantEmail: String? = null,
    val location: String,
    val district: String? = null,
    val proofUrls: List<String> = emptyList(),
    val assignedOfficer: String? = null,
    val assignedDepartment: String = "general",
    val assignedLawyer: String? = null,
    val actionUpdates: List<ActionUpdate> = emptyList(),
    val isEscalated: Boolean = false,
    val courtDate: String? = null,
    val createdDate: String,
    val updatedDate: String
)

@Serializable
data class ActionUpdate(
    val date: String,
    val update: String,
    val by: String
)
```

### 13.4 Repository

```kotlin
// data/repo/ComplaintRepository.kt
package com.nyayamitra.data.repo

import com.nyayamitra.data.remote.NyayaSupabaseClient
import com.nyayamitra.data.remote.NyayaSupabaseClient.db
import com.nyayamitra.domain.model.Complaint

class ComplaintRepository {
    suspend fun list(): List<Complaint> {
        return db.from("complaints").select().decodeList()
    }

    suspend fun filterByDistrict(district: String): List<Complaint> {
        return db.from("complaints").select {
            filter { eq("district", district) }
            order("created_date", io.github.jan.supabase.postgrest.query.Order.DESCENDING)
        }.decodeList()
    }

    suspend fun getByCaseId(caseId: String): Complaint? {
        return db.from("complaints").select {
            filter { eq("case_id", caseId) }
            limit(1)
        }.decodeList<Complaint>().firstOrNull()
    }

    suspend fun create(complaint: Complaint): Complaint {
        return db.from("complaints").insert(complaint) {
            select()
        }.decodeSingle()
    }

    suspend fun update(id: String, patch: Map<String, Any?>) {
        db.from("complaints").update(patch) {
            filter { eq("id", id) }
            select()
        }
    }

    suspend fun delete(id: String) {
        db.from("complaints").delete { filter { eq("id", id) } }
    }
}
```

### 13.5 Auth Repository

```kotlin
// data/repo/AuthRepository.kt
package com.nyayamitra.data.repo

import com.nyayamitra.data.remote.NyayaSupabaseClient.auth
import io.github.jan.supabase.gotrue.user.UserInfo

class AuthRepository {
    suspend fun sendOtp(email: String) {
        auth.signInWith(Email) { this.email = email }
    }

    suspend fun verifyOtp(email: String, token: String): UserInfo {
        return auth.verifyEmailOtp(email, token)
    }

    suspend fun signInWithPassword(email: String, password: String): UserInfo {
        auth.signInWith(Password) {
            this.email = email
            this.password = password
        }
        return auth.currentUserOrNull()!!
    }

    suspend fun signOut() { auth.signOut() }

    fun currentUser(): UserInfo? = auth.currentUserOrNull()

    suspend fun updateProfile(userId: String, data: Map<String, Any?>) {
        NyayaSupabaseClient.db.from("user_profiles").update(data) {
            filter { eq("id", userId) }
        }
    }
}
```

### 13.6 ViewModel (MVVM)

```kotlin
// ui/citizen/FileComplaintViewModel.kt
package com.nyayamitra.ui.citizen

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nyayamitra.data.repo.ComplaintRepository
import com.nyayamitra.domain.model.Complaint
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class FileComplaintViewModel @Inject constructor(
    private val complaintRepo: ComplaintRepository
) : ViewModel() {

    private val _state = MutableStateFlow<UiState>(UiState.Idle)
    val state: StateFlow<UiState> = _state

    fun fileComplaint(request: FileComplaintRequest) {
        viewModelScope.launch {
            _state.value = UiState.Loading
            try {
                val complaint = complaintRepo.create(request.toComplaint())
                _state.value = UiState.Success(complaint)
            } catch (e: Exception) {
                _state.value = UiState.Error(e.message ?: "Unknown error")
            }
        }
    }

    sealed class UiState {
        object Idle : UiState()
        object Loading : UiState()
        data class Success(val complaint: Complaint) : UiState()
        data class Error(val message: String) : UiState()
    }
}
```

### 13.7 Compose Screen

```kotlin
// ui/citizen/FileComplaintScreen.kt
package com.nyayamitra.ui.citizen

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@Composable
fun FileComplaintScreen(
    onNavigateToTrackCase: (String) -> Unit,
    viewModel: FileComplaintViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("theft") }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("File Complaint", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(16.dp))

        OutlinedTextField(
            value = title, onValueChange = { title = it },
            label = { Text("Title") }, modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = description, onValueChange = { description = it },
            label = { Text("Description") }, modifier = Modifier.fillMaxWidth(),
            minLines = 3
        )
        Spacer(Modifier.height(16.dp))

        Button(
            onClick = {
                viewModel.fileComplaint(
                    FileComplaintRequest(title, description, category)
                )
            },
            modifier = Modifier.fillMaxWidth()
        ) { Text("Submit") }

        when (val s = state) {
            is FileComplaintViewModel.UiState.Loading ->
                CircularProgressIndicator(Modifier.padding(16.dp))
            is FileComplaintViewModel.UiState.Success ->
                LaunchedEffect(s) { onNavigateToTrackCase(s.complaint.caseId.orEmpty()) }
            is FileComplaintViewModel.UiState.Error ->
                Text(s.message, color = MaterialTheme.colorScheme.error)
            else -> {}
        }
    }
}
```

### 13.8 Realtime in Android

```kotlin
// data/repo/RealtimeRepository.kt
package com.nyayamitra.data.repo

import com.nyayamitra.data.remote.NyayaSupabaseClient.realtime
import com.nyayamitra.domain.model.Complaint
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.receiveAsFlow

class RealtimeRepository {
    fun subscribeComplaints(): kotlinx.coroutines.flow.Flow<Complaint> {
        val channel = Channel<Complaint>()
        val sub = realtime.channel("complaints").postgresChangeFlow(
            "public.complaints"
        ) {
            table = "complaints"
            eventType = io.github.jan.supabase.realtime.PostgresAction.INSERT
        }
        // Collect and emit
        kotlinx.coroutines.GlobalScope.launch {
            sub.collect { change ->
                change.data.record.let {
                    channel.send(it.decodeAs<Complaint>())
                }
            }
        }
        return channel.receiveAsFlow()
    }
}
```

### 13.9 Storage Upload (Android)

```kotlin
// data/repo/StorageRepository.kt
package com.nyayamitra.data.repo

import com.nyayamitra.data.remote.NyayaSupabaseClient.storage
import java.io.File

class StorageRepository {
    suspend fun uploadProof(file: File, path: String): String {
        val bucket = storage.from("proof-public")
        bucket.upload(path, file.readBytes())
        return bucket.publicUrl(path)
    }

    suspend fun uploadPrivate(file: File, path: String): String {
        val bucket = storage.from("evidence-private")
        bucket.upload(path, file.readBytes())
        return path
    }

    suspend fun getSignedUrl(path: String, expiresIn: Long = 300): String {
        return storage.from("evidence-private").createSignedUrl(path, expiresIn)
    }
}
```

### 13.10 AI Proxy (Android via Retrofit)

```kotlin
// data/remote/AiApi.kt
package com.nyayamitra.data.remote

import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST

interface AiApi {
    @POST("functions/v1/ai-proxy")
    suspend fun invoke(
        @Header("Authorization") auth: String,
        @Body request: AiRequest
    ): AiResponse
}

data class AiRequest(
    val prompt: String,
    val model: String = "automatic",
    val response_json_schema: Map<String, Any>? = null,
    val file_urls: List<String>? = null
)

data class AiResponse(val result: String)

// AiRepository.kt
class AiRepository(private val api: AiApi, private val authRepo: AuthRepository) {
    suspend fun invoke(prompt: String, model: String = "automatic"): String {
        val token = authRepo.currentUser()?.accessToken
            ?: throw Exception("Not authenticated")
        return api.invoke("Bearer $token", AiRequest(prompt, model)).result
    }
}
```

### 13.11 GPS Attendance (Android)

```kotlin
// data/repo/AttendanceRepository.kt
class AttendanceRepository(
    private val db: NyayaSupabaseClient,
    private val fusedLocationClient: FusedLocationProviderClient
) {
    suspend fun markAttendance(officerEmail: String, stationLat: Double, stationLng: Double): Attendance {
        val location = getLocation()
        val distance = haversine(location.latitude, location.longitude, stationLat, stationLng)
        val status = when {
            distance <= 100 -> "present"
            distance <= 200 -> "late"
            else -> throw Exception("Too far from station ($distance m)")
        }
        val record = Attendance(
            officerEmail = officerEmail,
            station = "", district = "", shift = "morning",
            status = status, markedAt = System.currentTimeMillis().toString(),
            latitude = location.latitude, longitude = location.longitude,
            distanceMeters = distance, locationVerified = distance <= 100
        )
        return db.db.from("attendances").insert(record) { select() }.decodeSingle()
    }

    private fun haversine(lat1: Double, lng1: Double, lat2: Double, lng2: Double): Int {
        val R = 6371000.0
        val dLat = Math.toRadians(lat2 - lat1)
        val dLng = Math.toRadians(lng2 - lng1)
        val a = Math.sin(dLat/2).pow(2) +
            Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
            Math.sin(dLng/2).pow(2)
        return (2 * R * Math.asin(Math.sqrt(a))).roundToInt()
    }

    private suspend fun getLocation(): Location =
        suspendCancellableCoroutine { cont ->
            fusedLocationClient.lastLocation
                .addOnSuccessListener { cont.resume(it) }
                .addOnFailureListener { cont.resumeWithException(it) }
        }
}
```

### 13.12 Offline Sync (Room + WorkManager)

```kotlin
// data/local/NyayaDatabase.kt
@Database(entities = [ComplaintEntity::class, AttendanceEntity::class], version = 1)
abstract class NyayaDatabase : RoomDatabase() {
    abstract fun complaintDao(): ComplaintDao
    abstract fun attendanceDao(): AttendanceDao
}

@Entity(tableName = "cached_complaints")
data class ComplaintEntity(
    @PrimaryKey val id: String, val caseId: String?, val title: String,
    val description: String, val category: String, val status: String,
    val synced: Boolean = false
)

// WorkManager sync
class ComplaintSyncWorker(...) : CoroutineWorker(...) {
    override suspend fun doWork(): Result {
        val pending = dao.getUnsynced()
        for (c in pending) {
            try {
                complaintRepo.create(c.toModel())
                dao.markSynced(c.id)
            } catch (e: Exception) { return Result.retry() }
        }
        return Result.success()
    }
}
```

---

## 14. Post-Migration Cleanup Checklist

### 14.1 Uninstall & Delete

- [ ] `npm uninstall @base44/sdk @base44/vite-plugin`
- [ ] Delete `src/api/base44Client.js`
- [ ] Delete `src/lib/app-params.js`
- [ ] Remove `base44/config.jsonc` (replace with `supabase/config.toml`)
- [ ] Delete all `base44/entities/*.jsonc` (converted to SQL migrations)
- [ ] Remove `@base44/vite-plugin` from `vite.config.js`
- [ ] Remove `base44` import from every page/component
- [ ] Delete `src/lib/supabase.js` (legacy stub) — replaced by `src/lib/supabase.ts`

### 14.2 Add

- [ ] `npm install @supabase/supabase-js`
- [ ] Create `src/lib/supabase.ts`
- [ ] Create `src/api/{complaints,attendance,duties,alerts,chats,cyberReports,feedback,auth,storage,ai,analytics}.ts`
- [ ] Create `.env` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] Create `supabase/migrations/` with SQL DDL
- [ ] Create `supabase/functions/` with Edge Functions
- [ ] Set Supabase secrets: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`

### 14.3 Update

- [ ] `vite.config.js` — remove Base44 plugin
- [ ] `src/App.jsx` — keep AuthProvider, swap internals
- [ ] `src/lib/AuthContext.jsx` — full rewrite (Section 6)
- [ ] Every page/component importing `base44` — swap to `supabase` / API wrapper
- [ ] `index.html` — update title/meta if needed

### 14.4 Verify

- [ ] Login flow works (email OTP + password)
- [ ] File complaint creates record + uploads proof
- [ ] Track case returns correct record
- [ ] Station dashboard loads + status updates persist
- [ ] Realtime updates reflect across tabs
- [ ] GPS attendance blocks >100m
- [ ] Golden Hour cyber report works
- [ ] AI assistant returns LLM responses
- [ ] Court hearing scheduling works
- [ ] Lawyer sees assigned cases
- [ ] DGP dashboard aggregates state data
- [ ] RLS policies block unauthorized access (test with 2 users)
- [ ] Android app builds + authenticates + files complaint + marks attendance

### 14.5 Build & Deploy

- [ ] `npm run build` succeeds with no Base44 imports
- [ ] Deploy web to Vercel
- [ ] Deploy Edge Functions: `supabase functions deploy ai-proxy send-email ...`
- [ ] Run migrations: `supabase db push`
- [ ] Enable realtime on tables (Supabase dashboard → Replication)
- [ ] Build Android: `./gradlew bundleRelease` → upload to Play Store

---

**End of Migration Guide**

> After completing this guide, NyayaMitra will have **zero Base44 dependencies** — fully portable to Supabase (web + Android) with identical functionality. The shared Supabase backend serves both clients, AI runs through Edge Functions (keys server-side), and RLS enforces security at the database level.