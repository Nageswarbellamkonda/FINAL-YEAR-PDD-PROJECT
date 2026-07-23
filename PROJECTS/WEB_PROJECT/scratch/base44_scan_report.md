## Summary
Total Files with Base44 dependencies: 45
Total Occurrences: 163

# Base44 Dependency Scan Report

## src\api\base44Client.js
Occurrences: 2

```javascript
L1: import { createClient } from '@base44/sdk';
L7: export const base44 = createClient({
```

## src\components\CaseChat.jsx
Occurrences: 4

```javascript
L2: import { base44 } from "@/api/base44Client";
L32: const unsub = base44.entities.CitizenChat.subscribe(event => {
L44: const msgs = await base44.entities.CitizenChat.filter({ case_id: caseId }, "created_date", 100);
L54: await base44.entities.CitizenChat.create({
```

## src\components\Footer.jsx
Occurrences: 2

```javascript
L5: import { base44 } from "@/api/base44Client";
L20: await base44.entities.Feedback.create({ message: fbMsg, rating: fbRating, is_public: true });
```

## src\components\Navbar.jsx
Occurrences: 1

```javascript
L15: const APP_LOGO = "https://media.base44.com/images/public/69c9e5a623be48a91eed194a/22bde59e8_generated_image.png";
```

## src\components\QRScanner.jsx
Occurrences: 3

```javascript
L7: import { base44 } from "@/api/base44Client";
L27: const cases = await base44.entities.Complaint.filter({ case_id: trimmed });
L42: const att = await base44.entities.Attendance.filter({ officer_email: trimmed });
```

## src\components\VoiceConstable.jsx
Occurrences: 2

```javascript
L4: import { base44 } from "@/api/base44Client";
L184: await base44.entities.Complaint.create({
```

## src\lib\app-params.js
Occurrences: 5

```javascript
L13: const storageKey = `base44_${toSnakeCase(paramName)}`;
L39: storage.removeItem('base44_access_token');
L43: appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID }),
L46: functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
L47: appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL }),
```

## src\pages\ActivityLog.jsx
Occurrences: 9

```javascript
L2: import { base44 } from "@/api/base44Client";
L84: unsubRef.current = base44.entities.Complaint.subscribe((event) => {
L108: complaints = await base44.entities.Complaint.list("-updated_date", 50);
L110: complaints = await base44.entities.Complaint.filter({ district: me.district }, "-updated_date", 50);
L112: complaints = await base44.entities.Complaint.list("-updated_date", 30);
L119: alerts = await base44.entities.StationAlert.list("-created_date", 20);
L121: alerts = await base44.entities.StationAlert.filter({ district: me.district }, "-created_date", 20);
L129: duties = await base44.entities.DutyAssignment.list("-created_date", 20);
L131: duties = await base44.entities.DutyAssignment.filter({ district: me.district }, "-created_date", 20);
```

## src\pages\AlertsAdmin.jsx
Occurrences: 6

```javascript
L2: import { base44 } from "@/api/base44Client";
L45: data = await base44.entities.StationAlert.list("-created_date", 100);
L47: data = await base44.entities.StationAlert.filter({ district: me?.district }, "-created_date", 50);
L65: await base44.entities.StationAlert.create({
L82: await base44.entities.StationAlert.update(id, { is_active: !is_active });
L88: await base44.entities.StationAlert.delete(id);
```

## src\pages\Analytics.jsx
Occurrences: 2

```javascript
L2: import { base44 } from "@/api/base44Client";
L22: const data = await base44.entities.Complaint.list("-created_date", 200);
```

## src\pages\AttendanceSystem.jsx
Occurrences: 3

```javascript
L2: import { base44 } from "@/api/base44Client";
L155: const records = await base44.entities.Attendance.filter({ officer_email: me?.email }, "-created_date", 30);
L200: await base44.entities.Attendance.create({
```

## src\pages\CaseManagement.jsx
Occurrences: 8

```javascript
L2: import { base44 } from "@/api/base44Client";
L59: data = await base44.entities.Complaint.list("-created_date", 200);
L61: data = await base44.entities.Complaint.filter({ district: me.district }, "-created_date", 100);
L63: data = await base44.entities.Complaint.filter({ assigned_officer: me.email }, "-created_date", 50);
L64: if (!data.length && me.district) data = await base44.entities.Complaint.filter({ district: me.district }, "-created_date", 50);
L89: await base44.entities.Complaint.update(selected.id, {
L105: await base44.entities.Complaint.update(selected.id, {
L117: await base44.entities.Complaint.update(selected.id, {
```

## src\pages\CitizenChat.jsx
Occurrences: 5

```javascript
L2: import { base44 } from "@/api/base44Client";
L46: const unsub = base44.entities.CitizenChat.subscribe((event) => {
L56: const msgs = await base44.entities.CitizenChat.filter({ case_id: activeCase.case_id }, "created_date", 100);
L63: const results = await base44.entities.Complaint.filter({ case_id: caseId.trim() });
L77: await base44.entities.CitizenChat.create({
```

## src\pages\CrimeAnalysis.jsx
Occurrences: 2

```javascript
L2: import { base44 } from "@/api/base44Client";
L37: const data = await base44.entities.Complaint.list("-created_date", 200);
```

## src\pages\CrimeHeatMap.jsx
Occurrences: 3

```javascript
L2: import { base44 } from "@/api/base44Client";
L127: base44.entities.Complaint.list("-created_date", 500),
L128: base44.entities.CyberCrimeReport.list("-created_date", 100),
```

## src\pages\CyberOpsCenter.jsx
Occurrences: 3

```javascript
L2: import { base44 } from "@/api/base44Client";
L52: const data = await base44.entities.CyberCrimeReport.list("-created_date", 100);
L59: await base44.entities.CyberCrimeReport.update(id, { recovery_status: status });
```

## src\pages\DataSeeder.jsx
Occurrences: 6

```javascript
L2: import { base44 } from "@/api/base44Client";
L82: await base44.entities.Complaint.bulkCreate(records);
L109: await base44.entities.DutyAssignment.bulkCreate(records);
L134: await base44.entities.Attendance.bulkCreate(records);
L155: await base44.entities.StationAlert.bulkCreate(records);
L168: await base44.entities.CyberCrimeReport.bulkCreate(records);
```

## src\pages\DemoAccess.jsx
Occurrences: 2

```javascript
L2: import { base44 } from "@/api/base44Client";
L45: base44.auth.redirectToLogin(account.redirect || "/officer-dashboard");
```

## src\pages\DutyManagement.jsx
Occurrences: 10

```javascript
L2: import { base44 } from "@/api/base44Client";
L51: data = await base44.entities.DutyAssignment.filter({ duty_date: dateFilter }, "-created_date", 100);
L53: data = await base44.entities.DutyAssignment.filter({ district: me?.district, duty_date: dateFilter }, "-created_date", 100);
L55: data = await base44.entities.DutyAssignment.filter({ station: me?.station, duty_date: dateFilter }, "-created_date", 50);
L58: ? await base44.entities.DutyAssignment.filter({ station: me.station, duty_date: dateFilter }, "-created_date", 50)
L59: : await base44.entities.DutyAssignment.filter({ officer_email: me?.email }, "-created_date", 30);
L61: data = await base44.entities.DutyAssignment.filter({ officer_email: me?.email }, "-created_date", 30);
L70: await base44.entities.DutyAssignment.create({
L86: await base44.entities.DutyAssignment.update(id, { status });
L92: await base44.entities.DutyAssignment.delete(id);
```

## src\pages\Feedback.jsx
Occurrences: 3

```javascript
L9: import { base44 } from "@/api/base44Client";
L37: const data = await base44.entities.Feedback.filter({ is_public: true }, "-created_date", 50);
L48: await base44.entities.Feedback.create({
```

## src\pages\FileComplaint.jsx
Occurrences: 3

```javascript
L3: import { base44 } from "@/api/base44Client";
L130: const result = await base44.integrations.Core.UploadFile({ file });
L150: await base44.entities.Complaint.create({
```

## src\pages\FIRDocument.jsx
Occurrences: 3

```javascript
L3: import { base44 } from "@/api/base44Client";
L28: const results = await base44.entities.Complaint.filter({ case_id: id.trim().toUpperCase() }, "-created_date", 1);
L40: const result = await base44.integrations.Core.InvokeLLM({
```

## src\pages\GoldenHourCyber.jsx
Occurrences: 5

```javascript
L2: import { base44 } from "@/api/base44Client";
L133: const data = await base44.entities.Complaint.filter(
L153: const complaint = await base44.entities.Complaint.create({
L174: await base44.entities.CyberCrimeReport.create({
L201: const results = await base44.entities.Complaint.filter({ case_id: trackId.trim() });
```

## src\pages\LegalDocuments.jsx
Occurrences: 2

```javascript
L2: import { base44 } from "@/api/base44Client";
L379: const results = await base44.entities.Complaint.filter({ case_id: caseId.trim() });
```

## src\pages\LiveTracking.jsx
Occurrences: 6

```javascript
L2: import { base44 } from "@/api/base44Client";
L32: const unsubscribe = base44.entities.WomenSafetySession.subscribe((event) => {
L45: const all = await base44.entities.WomenSafetySession.filter({ status: "active" }, "-created_date", 50);
L46: const alerts = await base44.entities.WomenSafetySession.filter({ status: "emergency" }, "-created_date", 20);
L49: const mine = await base44.entities.WomenSafetySession.filter({ user_email: me?.email, status: "active" }, "-created_date", 1);
L56: await base44.entities.WomenSafetySession.update(sessionId, {
```

## src\pages\NyayaAIAssistant.jsx
Occurrences: 3

```javascript
L2: import { base44 } from "@/api/base44Client";
L87: base44.entities.Complaint.list("-created_date", 50),
L88: base44.entities.CyberCrimeReport.list("-created_date", 20),
```

## src\pages\OfficerManagement.jsx
Occurrences: 6

```javascript
L2: import { base44 } from "@/api/base44Client";
L52: const allUsers = await base44.entities.User.list("-created_date", 200);
L76: await base44.entities.User.update(officer.id, { officer_status: "suspended" });
L85: await base44.entities.User.update(officer.id, { officer_status: "blocked" });
L94: await base44.entities.User.update(officer.id, { officer_status: "active" });
L103: await base44.users.inviteUser(inviteForm.email.trim(), "user");
```

## src\pages\PerformanceDashboard.jsx
Occurrences: 2

```javascript
L2: import { base44 } from "@/api/base44Client";
L29: const data = await base44.entities.Complaint.list("-created_date", 500);
```

## src\pages\PoliceAIAdvisor.jsx
Occurrences: 2

```javascript
L2: import { base44 } from "@/api/base44Client";
L28: const data = await base44.entities.Complaint.list("-created_date", 300);
```

## src\pages\SafeRoute.jsx
Occurrences: 2

```javascript
L2: import { base44 } from "@/api/base44Client";
L53: base44.entities.Complaint.list("-created_date", 200).then(setComplaints);
```

## src\pages\SheTeamsDashboard.jsx
Occurrences: 4

```javascript
L2: import { base44 } from "@/api/base44Client";
L37: const data = await base44.entities.WomenSafetySession.filter({ status: ["active", "alert", "emergency"] }, "-updated_date", 50);
L38: setSessions(data.length ? data : await base44.entities.WomenSafetySession.list("-updated_date", 20));
L44: const unsubscribe = base44.entities.WomenSafetySession.subscribe((event) => {
```

## src\pages\SmartAlerts.jsx
Occurrences: 3

```javascript
L2: import { base44 } from "@/api/base44Client";
L33: base44.entities.Complaint.list("-created_date", 200).then(setComplaints);
L63: const result = await base44.integrations.Core.InvokeLLM({ prompt });
```

## src\pages\Splash.jsx
Occurrences: 1

```javascript
L5: const APP_LOGO = "https://media.base44.com/images/public/69c9e5a623be48a91eed194a/22bde59e8_generated_image.png";
```

## src\pages\TrackCase.jsx
Occurrences: 2

```javascript
L3: import { base44 } from "@/api/base44Client";
L57: const results = await base44.entities.Complaint.filter({ case_id: searchId.trim() });
```

## src\pages\TrustedCircle.jsx
Occurrences: 1

```javascript
L2: import { base44 } from "@/api/base44Client";
```

## src\pages\WomenSafety.jsx
Occurrences: 6

```javascript
L2: import { base44 } from "@/api/base44Client";
L82: base44.entities.WomenSafetySession.update(activeSession.id, {
L101: const session = await base44.entities.WomenSafetySession.create({
L123: await base44.entities.WomenSafetySession.update(activeSession.id, {
L136: await base44.entities.WomenSafetySession.update(activeSession.id, {
L146: await base44.entities.WomenSafetySession.update(activeSession.id, { status: "safe" });
```

## src\pages\WorkforceMonitor.jsx
Occurrences: 3

```javascript
L2: import { base44 } from "@/api/base44Client";
L54: base44.entities.Attendance.list("-created_date", 300),
L55: base44.entities.DutyAssignment.list("-created_date", 200),
```

## index.html
Occurrences: 2

```javascript
L5: <link rel="icon" type="image/png" href="https://media.base44.com/images/public/69c9e5a623be48a91eed194a/22bde59e8_generated_image.png" />
L12: <meta property="og:image" content="https://media.base44.com/images/public/69c9e5a623be48a91eed194a/22bde59e8_generated_image.png" />
```

## package-lock.json
Occurrences: 8

```javascript
L2: "name": "base44-app",
L8: "name": "base44-app",
L11: "@base44/sdk": "^0.8.39",
L12: "@base44/vite-plugin": "^1.0.30",
L392: "node_modules/@base44/sdk": {
L394: "resolved": "https://registry.npmjs.org/@base44/sdk/-/sdk-0.8.39.tgz",
L403: "node_modules/@base44/vite-plugin": {
L405: "resolved": "https://registry.npmjs.org/@base44/vite-plugin/-/vite-plugin-1.0.30.tgz",
```

## package.json
Occurrences: 3

```javascript
L2: "name": "base44-app",
L15: "@base44/sdk": "^0.8.39",
L16: "@base44/vite-plugin": "^1.0.30",
```

## scratch\check_base44_station.js
Occurrences: 1

```javascript
L6: if (line.toLowerCase().includes('base44')) {
```

## scratch\check_base44_unified.js
Occurrences: 1

```javascript
L6: if (line.toLowerCase().includes('base44')) {
```

## scratch\scan_all_base44.js
Occurrences: 4

```javascript
L4: const searchRegex = /base44/i;
L63: let report = '# Base44 Dependency Scan Report\n\n';
L80: report = `## Summary\nTotal Files with Base44 dependencies: ${totalFiles}\nTotal Occurrences: ${totalOccurrences}\n\n` + report;
L82: fs.writeFileSync('scratch/base44_scan_report.md', report);
```

## scratch\scan_base44_pages.js
Occurrences: 4

```javascript
L16: const base44Files = [];
L21: if (content.toLowerCase().includes('base44')) {
L22: base44Files.push(filePath);
L27: console.log("Remaining pages using base44:", base44Files);
```

## vite.config.js
Occurrences: 5

```javascript
L1: import base44 from "@base44/vite-plugin"
L9: base44({
L10: // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
L11: // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
L12: legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
```

