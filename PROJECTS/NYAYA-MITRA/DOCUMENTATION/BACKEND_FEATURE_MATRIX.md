# NYAYA-MITRA Backend Feature Matrix

This matrix verifies that every major feature discovered in the OLD projects is successfully implemented across the NEW shared Express API, fulfilling the Master Prompt requirement.

| Feature | Web Source (React) | Android Source (Compose) | Shared Backend Route | Controller / Service | Database (Supabase) | End-to-End Status |
|---|---|---|---|---|---|---|
| **Authentication** | AuthPortal.jsx | AuthViewModel.kt | `/api/auth` | `auth.controller.ts` | `auth.users` | PASS |
| **FIR Management** | FIRDocument.jsx | FirViewModel.kt | `/api/fir` | `fir.controller.ts` | `firs` | PASS |
| **Complaints** | FileComplaint.jsx | ComplaintViewModel.kt | `/api/complaint` | `complaint.controller.ts` | `complaints` | PASS |
| **Duty Management**| DutyManagement.jsx | DutyViewModel.kt | `/api/duty` | `duty.controller.ts` | `duty_assignments` | PASS |
| **Emergency** | LiveTracking.jsx | EmergencyViewModel.kt | `/api/emergency` | `emergency.controller.ts` | `station_alerts` | PASS |
| **AI Advisor** | PoliceAIAdvisor.jsx | AiViewModel.kt | `/api/ai` | `ai.controller.ts` | `ai_case_summaries` | PASS |
| **Analytics** | CrimeAnalysis.jsx | AnalyticsViewModel.kt | `/api/analytics` | `analytics.controller.ts` | `vw_admin_dashboard_metrics` | PASS |
| **Profiles (Citizen)** | profiles.js | ProfileViewModel.kt | `/api/citizen_profiles`| `citizen_profiles.controller.ts` | `citizen_profiles` | PASS |
| **Case Chat** | CaseChat.jsx | CaseChatViewModel.kt | `/api/citizen_chats` | `citizen_chats.controller.ts` | `citizen_chats` | PASS |
| **Court Records** | LegalDocuments.jsx | CourtViewModel.kt | `/api/court_profiles` | `court_profiles.controller.ts` | `court_profiles` | PASS |
| **Women Safety** | WomenSafety.jsx | SheTeamsViewModel.kt | `/api/women_safety_sessions` | `women_safety_sessions.controller.ts` | `women_safety_sessions` | PASS |

> [!IMPORTANT]
> This matrix confirms that the Web and Android apps are no longer independently connecting directly to the Supabase database. They both communicate uniformly through the NodeJS Express backend.
