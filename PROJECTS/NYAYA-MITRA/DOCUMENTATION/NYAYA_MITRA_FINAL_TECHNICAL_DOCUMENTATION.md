# NYAYA-MITRA Final Technical Documentation

## A. Project Structure
The root of the `NYAYA-MITRA` project contains exactly six folders defining the complete, synchronized ecosystem:
- **`PDD WEB PROJECT/`**: The web-based React/Vite source code.
- **`PDD APP PROJECT/`**: The native Android Kotlin/Jetpack Compose source code.
- **`BACKEND/`**: The Node.js Express server supplementary backend.
- **`DATABASE/`**: The Supabase definitions and schema references.
- **`FINAL_REPORTS/`**: Contains all generated test parity matrices, deployment reports, and migration audits.
- **`DOCUMENTATION/`**: Contains this final technical architecture document.

## B. Web Frontend
- **Frameworks & Libraries:** React 18, Vite, Tailwind CSS, Radix UI components, Framer Motion, React Router DOM, React Leaflet (maps), Supabase-JS.
- **Role:** The Web application operates as the absolute single source of truth for all workflows, dashboard designs, and business logic.

## C. Android Frontend
- **Frameworks & Libraries:** Kotlin, Jetpack Compose, Material 3, Navigation Compose, Retrofit 2, Supabase Kotlin SDK (GoTrue, Postgrest), Ktor Client.
- **Role:** The Android application acts as a direct, native adaptation of the Web workflow. It is built strictly to enforce `Splash → Home → Feature → Authentication → Dashboard` matching the Web's public-facing architecture rather than acting solely as a gated login application.

## D. Backend
- **Frameworks & Libraries:** Node.js, Express, TypeScript.
- **Role:** Handles supplementary backend API logic (running on port 3000). The Android client accesses this locally deployed backend using the actual physical LAN IP (`10.107.253.44`), completely avoiding the `10.0.2.2` emulator trap.

## E. Database/Supabase
- **Service:** Hosted Supabase (PostgreSQL).
- **Role:** Serves as the central repository, meaning all users, profiles, complaints, cases, and alerts are structurally identical whether accessed from Web or Android. No duplicate mock databases exist.

## F. Authentication
- **Flow:** Handled directly via Supabase Auth (GoTrue). Both Web and Android execute identical signup/login transactions to the `auth.users` schema.

## G. Email Verification
- Both Web and Android enforce Supabase's native email verification workflow. An unverified account cannot access protected routes on either platform.

## H. Role-based Registration
- A specialized workflow where `requested_role` metadata is passed to Supabase during registration. Database triggers map this correctly into the public `profiles` table to assign roles like Citizen vs Police vs Cyber.

## I. Role-based Login
- Upon successful authentication, both applications fetch the `role` from the `profiles` table.

## J. Role-based Routing
- Depending on the `role`, users are dynamically navigated to `citizen_dashboard`, `officer_dashboard`, `admin_dashboard`, etc.

## K. Every Dashboard/Role
- **Citizen:** Tracking, AI Safe Route, AI Chat, Emergency Contacts, File Complaint.
- **Police Officer:** View assigned cases, update case status, GPS attendance tracking.
- **Station Officer / SI:** View station complaints, assign duties, check heatmaps.
- **DSP / CI / DGP:** Platform overview, resource allocation, aggregate heatmaps.
- **Lawyer:** Legal consultation, document drafting (Nyaya AI).
- **Court Officer:** Court case scheduling, tracking hearings.
- **Cyber Ops Officer:** Golden hour cyber-fraud monitoring, quick-freeze requests.
- **System Admin:** Manage total infrastructure, ban malicious accounts.

## L. API Communication
- Standardized REST calls via Axios (Web) and Retrofit (Android), with Authorization Bearer tokens automatically injected from the active Supabase session.

## M. Supabase Integration
- Utilized for Authentication, direct Realtime Database mapping, Storage (for complaint evidence), and Edge Functions (if enabled).

## N. Android Networking
- Fixed by replacing hardcoded `localhost`/`10.0.2.2` with dynamic/environment-aware configuration pointing to the physical host (`10.107.253.44`). AndroidManifest enables cleartext traffic where necessary for local LAN deployment.

## O. Web ↔ Android Synchronization
- **Core Sync Mechanism:** Achieved strictly by pointing both independent clients to the *exact same Supabase project*.
- When a Citizen files a complaint on the Web, the data enters the unified Supabase `complaints` table. The Android Police Officer dashboard immediately reflects this new case upon refresh/realtime subscription. 

## P. Build/Run Instructions
- **Web (`PDD WEB PROJECT`):**
  - `npm install`
  - `npm run dev` (Runs on `http://localhost:5173`)
- **Android (`PDD APP PROJECT`):**
  - Use physical device via USB debugging.
  - `.\gradlew clean assembleDebug`
  - `.\gradlew installDebug`

## Q. Testing/Verification Results
- Web UI workflows and Dashboard rendering paths have been fully verified.
- Android application correctly executes the `Home` start, resolves resources correctly (Logo parity), cleanly compiles (`BUILD SUCCESSFUL in 10m 21s`), and correctly requests authentication on restricted actions.

## R. Important Environment/Configuration Requirements
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are strictly required in the Web `.env`.
- Android contains matched Supabase configuration variables inside `AuthRepository` and `RetrofitClient` mapped to `bbznxozzucrhpppicjpg.supabase.co`.
- The physical Android device *must* share the same LAN network as the backend if connecting to local Express routes.

## S. Dependencies and Major Frameworks
- React, Jetpack Compose, Supabase SDK, Node.js.

## T. How Web, Android, Backend and Database communicate
1. User interacts with UI (Web/Android).
2. For Auth/Direct DB Queries → Request goes straight to Supabase (Supabase-JS / Supabase-Kotlin).
3. For Specialized processing → Request goes to Express Backend (`10.107.253.44:3000`).
4. Express Backend optionally communicates with Supabase using Service Key to bypass RLS, returning processed results to the Client.
5. Supabase emits Realtime broadcasts which both Web and Android can subscribe to for live-sync (e.g., chat, active tracking).
