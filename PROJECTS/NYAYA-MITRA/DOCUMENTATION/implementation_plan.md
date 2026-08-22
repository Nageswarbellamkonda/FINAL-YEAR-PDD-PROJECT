# NYAYA-MITRA Final Evaluator QA Implementation Plan

This plan executes the rigorous 16-phase mandate to physically prove the Web and Android clients communicate with the unified Node.js Express backend and authentic Supabase database. It replaces assumptions with evidence-based runtime data.

## Phase 0: Safety & Credential Audit
- Create `.gitignore` files in `NYAYA-MITRA/WEB` and `NYAYA-MITRA/BACKEND` to explicitly ignore `.env` files (currently missing).
- Search the entire repository for exposed Supabase/Gemini keys.
- **Goal:** Ensure the newly injected keys remain secure and any previously exposed keys are documented for rotation.

## Phase 1 & 2: Project Inventory & Feature Parity
- Generate `PRE_FINAL_INVENTORY.md` counting every single ViewModel, Route, Controller, and UI Screen in the new architecture.
- Perform a functional cross-check against `PDD WEB PROJECT` and `PDD APP PROJECT` to classify the parity of every feature (A-E) into `FINAL_FEATURE_PARITY_MATRIX.md`.

## Phase 3 & 4: Backend & Web Source Audit
- **Backend (`BACKEND_FINAL_AUDIT.md`)**: Audit all 21 controllers and services to prove they execute authentic Supabase/PostgreSQL logic and not dummy `return { success: true }` responses.
- **Web (`WEB_MIGRATION_AUDIT.md`)**: Re-run the regex scan to conclusively prove the Web UI uses `axios` to hit the backend rather than invoking direct Supabase endpoints.

## Phase 5 & 6: Real Web & Android Runtime Tests
- **Web (`WEB_RUNTIME_VERIFICATION.md`)**: I will start Vite and the Backend concurrently and programmatically verify HTTP requests flow from the React UI to the Express backend and retrieve database responses.
- **Android (`ANDROID_RUNTIME_VERIFICATION.md`)**: I will verify Gradle sync, `BASE_URL`, and provide the explicit Android Studio instructions required for physical launch. (Status: BLOCKED — USER VERIFICATION REQUIRED).

## Phase 7, 8 & 9: Cross-Platform, API & Auth Tests
- **Cross-Platform (`CROSS_PLATFORM_REAL_DATA_TEST.md`)**: Programmatically send a POST from "Web" and a GET from "Android" to the shared backend to prove the data reflects accurately.
- **API (`API_RUNTIME_TEST_REPORT.md`)**: Execute real `GET` and `POST` calls against the 21 endpoints to verify HTTP status codes, routing, and backend responses.
- Verify JWT Authentication flow on the backend.

## Phase 10 - 13: Protection & Cleanup Audits
- Verify `PDD WEB PROJECT`, `PDD APP PROJECT`, and `FINAL_REPORTS` remain untouched (`OLD_PROJECT_CHANGE_AUDIT.md`).
- Document newly created legacy files (if any) in `OLD_PROJECT_FILE_CHANGE_REPORT.md`.
- Draft the final deletion list for the accidental `PROJECTS/node_modules` root installation (`OUTER_PROJECT_CLEANUP_AUDIT.md`).

## Phase 14, 15 & 16: Final Documentation & Hand-off
- Produce `FINAL_MASTER_ACCEPTANCE_REPORT.md` compiling all evidence into the requested 19-section matrix.
- Yield the exact execution steps, APK path, deletion authorizations, and final status block required for evaluator sign-off.

> [!WARNING]
> I will NOT claim "PASS" unless physical tests succeed. The Android physical launch will be marked as "BLOCKED" since I cannot click the emulator. I will halt and request intervention if the backend fails to boot or real database connectivity is interrupted.
