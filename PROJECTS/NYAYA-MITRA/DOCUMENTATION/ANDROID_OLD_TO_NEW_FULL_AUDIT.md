# NYAYA-MITRA Android Migration Audit: Old to Current
## Overview
This document serves as the complete audit mapping the OLD Android UI/UX (from `PDD APP PROJECT`) to the CURRENT Android Jetpack Compose codebase (`NYAYA-MITRA/APP`), as per Phase 1 requirements.

**OLD Application Source of Truth:** `C:\Users\91789\OneDrive\Desktop\PROJECTS\PDD APP PROJECT` (React + Capacitor Web App)
**CURRENT Application:** `C:\Users\91789\OneDrive\Desktop\PROJECTS\NYAYA-MITRA\APP` (Native Jetpack Compose)

## Audit Findings
The OLD application was a fully functioning React-based WebView (Capacitor) app with extensive UI components, themes, routing, and feature modules.
The CURRENT application is a **Native Jetpack Compose** project where dozens of `.kt` screen files were scaffolded. However, the vast majority of these files are merely 2.5KB dummy placeholders containing hardcoded text like *"This is the native Android implementation for Splash"*.
Additionally, the `AppNavigation.kt` is not routing through the proper Splash -> Login -> Role Dashboard flow, resulting in the app launching directly into an incomplete, simplified `LoginScreen`.

## Screen Mapping Matrix

| Old React Screen / Route | Current Compose Screen (`ui/screens/*.kt`) | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Authentication & Flow** | | | |
| `Splash` | `SplashScreen.kt` (2.5KB) | ❌ Missing UI | Exists but is a hardcoded placeholder scaffold. |
| `Login` | `LoginScreen.kt` | ⚠️ Incomplete | Simplified UI, lacks old branding/styling. |
| `Register` | N/A | ❌ Missing | Missing completely. |
| `AuthCallback` | `AuthCallbackScreen.kt` | ❌ Mocked | Exists as placeholder. |
| `ForgotPassword` | N/A | ❌ Missing | Missing completely. |
| `ChangePassword` | N/A | ❌ Missing | Missing completely. |
| **Dashboards** | | | |
| `Dashboard` (Home) | `DashboardScreen.kt` | ⚠️ Incomplete | Barebones implementation. |
| `DSPDashboard` | `DSPDashboardScreen.kt` (13KB) | ⚠️ Partial | Exists with some UI, needs Retrofit API parity check. |
| `StationDashboard` | `StationDashboardScreen.kt` (7KB) | ⚠️ Partial | Exists, needs styling and API check. |
| `OfficerDashboard` | `OfficerDashboardScreen.kt` (7KB) | ⚠️ Partial | Exists, needs styling and API check. |
| `CitizenDashboard` | `CitizenDashboardScreen.kt` (8KB) | ⚠️ Partial | Exists, needs styling and API check. |
| `DGPDashboard` | `DGPDashboardScreen.kt` (7KB) | ⚠️ Partial | Exists. |
| `LawyerDashboard` | `LawyerDashboardScreen.kt` (6.8KB) | ⚠️ Partial | Exists. |
| `CourtDashboard` | `CourtDashboardScreen.kt` (7.6KB) | ⚠️ Partial | Exists. |
| **Core Operational Features** | | | |
| `SmartAlerts` (Alerts) | `SmartAlertsScreen.kt` (2.5KB) | ❌ Mocked | Exists as placeholder. Needs full UI/UX & API. |
| `DutyManagement` | `DutyScreen.kt` | ⚠️ Incomplete | Exists but needs verification with Web parity. |
| `OfficerManagement` | `OfficerManagementScreen.kt` (2.5KB)| ❌ Mocked | Exists as placeholder. |
| `CrimeAnalysis` | `CrimeAnalysisScreen.kt` (4.3KB) | ⚠️ Partial | Exists, needs AI backend endpoint integration. |
| `PoliceAIAdvisor` | `PoliceAIAdvisorScreen.kt` (6KB) | ⚠️ Partial | Exists. |
| `ActivityLog` | `ActivityLogScreen.kt` (2.5KB) | ❌ Mocked | Exists as placeholder. |
| **Citizen & Case Management** | | | |
| `FileComplaint` / `FIR` | `FIRScreen.kt` | ⚠️ Incomplete | Exists. |
| `TrackCase` | `TrackCaseScreen.kt` (2.5KB) | ❌ Mocked | Exists as placeholder. |
| `CaseManagement` | `CaseManagementScreen.kt` (7KB) | ⚠️ Partial | Exists. |
| `LegalDocuments` | `LegalDocumentsScreen.kt` (9.6KB) | ⚠️ Partial | Exists. |
| `ConstitutionRights` | `ConstitutionRightsScreen.kt` (6.8KB)| ⚠️ Partial | Exists. |
| `CitizenChat` | `CitizenChatScreen.kt` (2.5KB) | ❌ Mocked | Exists as placeholder. |
| **Utilities & Others** | | | |
| `AttendanceSystem` | `AttendanceSystemScreen.kt` (2.5KB) | ❌ Mocked | Exists as placeholder. |
| `CrimeHeatMap` | `CrimeHeatMapScreen.kt` (5.3KB) | ⚠️ Partial | Exists. |
| `LiveTracking` | `LiveTrackingScreen.kt` (2.5KB) | ❌ Mocked | Exists as placeholder. |
| `SafeRoute` | `SafeRouteScreen.kt` (1KB) | ❌ Mocked | Exists as placeholder. |
| `NyayaAIAssistant` | `NyayaAIAssistantScreen.kt` (4.4KB)| ⚠️ Partial | Exists. |

## Global App Structure Audit
- **Navigation (BottomNav & Drawer):** Currently completely disconnected. The Jetpack Compose application uses `AppNavigation.kt` but there is no overarching `Scaffold` containing the Drawer/BottomNav mirroring the web app's layout.
- **Styling (Theme/Colors/Typography):** The native `MaterialTheme` in `ui/theme/` has not been fully configured to match the deep blues, golds, and fonts of the React app.
- **Backend Connectivity:** There is evidence of a `RetrofitClient` and `NyayaMitraApi`, but endpoints need strict auditing against `localhost:3000/api/` as per Phase 10. Direct Supabase access MUST be prevented in Android.

## Conclusion
The migration process was superficially started by scaffolding `.kt` files, but the majority of features are missing their UI and API connections. The navigation flow is broken. The immediate priority is establishing the correct `Splash -> Login -> Dashboard` flow with the exact visual layout (colors, branding, navigation skeleton) of the old React app, before fleshing out the mocked screens (Alerts, Duties, Officers, AI).
