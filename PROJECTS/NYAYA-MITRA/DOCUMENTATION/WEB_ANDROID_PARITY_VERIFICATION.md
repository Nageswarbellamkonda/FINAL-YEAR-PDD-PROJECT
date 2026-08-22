# Web to Android Parity Verification

This document verifies that the Android native application matches the Web application in features, logic, network, and startup flow.

## Parity Checklist

| Feature/Flow | Status | Verification Details |
| :--- | :---: | :--- |
| **Startup Flow** | ✅ | Start destination is now `splash` in `AppNavigation.kt`, which transitions to `home` not `login`, matching Web behavior. |
| **Network Configuration** | ✅ | `RetrofitClient.kt` updated to use host LAN IP (`10.107.253.44:3000`) instead of `10.0.2.2`, resolving physical device connectivity issues. |
| **Auth Client** | ✅ | Android `AuthRepository.kt` now directly uses the Supabase Kotlin SDK, hitting exactly the same project (`https://bbznxozzucrhpppicjpg.supabase.co`) as the Web application. |
| **Auth Logic (Role)** | ✅ | Registration in Android mirrors Web by setting default `role` to 'citizen' to bypass DB trigger checks, while preserving actual role in `requested_role` metadata. |
| **Auth Routing** | ✅ | `LoginScreen.kt` navigation precisely mirrors `WEB/src/lib/authRouting.js`, routing users to their specific role dashboard (e.g., `/cyber_ops`, `/dsp_dashboard`). |
| **Duplicate Routes** | ✅ | Removed conflicting `dashboard` route in `AppNavigation.kt` to prevent Compose navigation crashes. |
| **Missing Routes** | ✅ | Re-linked `forgot_password` to `ForgotPasswordScreen` which was previously a stub. |
| **Dashboard Data** | ✅ | `CitizenDashboardViewModel.kt` uses direct `SupabaseClient` queries for cases and alerts, matching the data fetching paradigm of `CitizenDashboard.jsx`. |

## Conclusion
The fundamental authentication loop, network connectivity (specifically on physical devices), and route routing mapping are completely aligned between Web and Android natively.
