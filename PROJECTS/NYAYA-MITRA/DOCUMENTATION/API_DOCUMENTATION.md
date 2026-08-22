# NYAYA-MITRA Shared API Documentation

This document lists the actual Express API routes actively used by both the WEB and ANDROID applications, providing the requested "COMMON SERVER-SIDE IMPLEMENTATION".

### Citizen Profiles API
- `GET /api/citizen_profiles` - Fetch all citizen profiles
- `POST /api/citizen_profiles` - Create a new citizen profile

### Police Profiles API
- `GET /api/police_profiles` - Fetch police officer profiles
- `POST /api/police_profiles` - Create police profile

### Lawyer Profiles API
- `GET /api/lawyer_profiles` - Fetch lawyer directory
- `POST /api/lawyer_profiles` - Register a lawyer

### Court Profiles API
- `GET /api/court_profiles` - Fetch court details
- `POST /api/court_profiles` - Register a court entity

### Admins API
- `GET /api/admins` - Fetch admin records
- `POST /api/admins` - Register new admin

### FIR & Case Management APIs
- `GET /api/firs` - Get all FIRs
- `GET /api/firs/:id` - Get specific FIR
- `POST /api/firs` - File new FIR
- `GET /api/case_messages` - Retrieve case communications
- `POST /api/case_messages` - Send case update

### Complaints APIs
- `GET /api/complaints` - Fetch all complaints
- `POST /api/complaints` - File a new complaint

### Chat & Feedback APIs
- `GET /api/citizen_chats` - Fetch citizen chats
- `POST /api/citizen_chats` - Initiate chat
- `GET /api/feedback` - Fetch system feedback
- `POST /api/feedback` - Submit feedback

### Duty & Attendance APIs
- `GET /api/duty_assignments` - Get officer duties
- `POST /api/duty_assignments` - Assign duty
- `GET /api/attendances` - Fetch attendance records
- `POST /api/attendances` - Log attendance
- `GET /api/attendance` - Legacy attendance fallback

### Emergency & Operations APIs
- `GET /api/station_alerts` - Get active alerts
- `POST /api/station_alerts` - Trigger alert
- `GET /api/cyber_crime_reports` - Fetch cyber reports
- `POST /api/cyber_crime_reports` - Report cyber crime
- `GET /api/women_safety_sessions` - Fetch SHE team operations
- `POST /api/women_safety_sessions` - Log session

### AI & Analytics APIs
- `GET /api/ai_case_summaries` - Retrieve AI summaries
- `POST /api/ai_case_summaries` - Generate AI summary
- `GET /api/vw_admin_dashboard_metrics` - Get unified analytics view

### Notifications APIs
- `GET /api/activity_logs` - Fetch system logs
- `POST /api/activity_logs` - Write system log
- `GET /api/public_notices` - Fetch digital noticeboard
- `POST /api/public_notices` - Publish notice

### Documents & Evidence APIs
- `GET /api/evidence_files` - Fetch attached evidence metadata
- `POST /api/evidence_files` - Attach new evidence metadata

---
> [!NOTE]
> All APIs enforce backend validation and execute actual `supabase.from()` PostgREST logic internally within their respective Express Services.
