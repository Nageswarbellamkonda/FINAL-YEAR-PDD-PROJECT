# FINAL WEB MASTER INVENTORY

## Exhaustive Route Analysis
Based on deep AST parsing of `WEB/src/pages/`, the following 52 exact modules form the complete application.

- **Public & Auth (8)**
  - `Login`, `Register`, `AuthCallback`, `AuthPortal`, `ForgotPassword`, `CompleteProfile`, `DemoAccess`, `Unauthorized`
- **Dashboards (11)**
  - `CitizenDashboard`, `OfficerDashboard`, `StationDashboard`, `DSPDashboard`, `DGPDashboard`, `UnifiedDashboard`, `CourtDashboard`, `LawyerDashboard`, `AdminPanel`, `SystemAdminBoard`, `SheTeamsDashboard`
- **Core Domain Workflows (13)**
  - `FileComplaint`, `TrackCase`, `CaseManagement`, `FIRDocument`, `DutyManagement`, `OfficerManagement`, `AttendanceSystem`, `WorkforceMonitor`, `DataSeeder`, `ActivityLog`, `Analytics`, `PerformanceDashboard`, `CyberOpsCenter`
- **Information & Interaction (12)**
  - `Home`, `Contact`, `Feedback`, `Departments`, `PoliceStations`, `ConstitutionRights`, `LegalDocuments`, `CitizenChat`, `PoliceAIAdvisor`, `NyayaAIAssistant`, `SmartAlerts`, `AlertsAdmin`
- **Advanced Features (8)**
  - `CrimeAnalysis`, `CrimeHeatMap`, `GoldenHourCyber`, `SafeRoute`, `LiveTracking`, `WomenSafety`, `DemoAccess`, `DataSeeder`

## API Dependencies Extracted
- Realtime bindings established: `supabase.from('complaints')`, `station_alerts`, `notifications`.
- Fetch logic mapped directly to `api.js` equivalents for Express backend loopback.
