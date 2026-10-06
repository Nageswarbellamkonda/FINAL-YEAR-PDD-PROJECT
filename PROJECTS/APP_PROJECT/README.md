# NYAYA-MITRA Mobile Application (APP_PROJECT)
## Project Setup, Build & Faculty Demonstration Guide

Welcome to the **NYAYA-MITRA** Android application repository. This mobile client works in full real-time synchronization with the NYAYA-MITRA ecosystem, powered by React 19, Android Native SDK / Jetpack (API 24 to 36), and Supabase real-time backend.

---

### Project Architecture & Path Overview
- **Authoritative Root Path:** `PROJECTS/APP_PROJECT`
- **Native Android Module Path:** `PROJECTS/APP_PROJECT/android`
- **Application ID:** `com.nyayamitra.app`
- **Application Name:** `Nyayamitra`
- **Target SDK:** 36 (Android 16) | **Min SDK:** 24 (Android 7.0)
- **Required JDK:** OpenJDK 21 LTS

---

### Quick Start: Step-by-Step Execution

#### STEP 1 — Open APP_PROJECT
Open a terminal in the application root directory:
```bash
cd PROJECTS/APP_PROJECT
```

#### STEP 2 — Install Node Dependencies
Install the required frontend and runtime packages:
```bash
npm install
```

#### STEP 3 — Configure Required Environment Variables
Copy the provided environment example configuration to create your local `.env`:
```bash
cp .env.example .env
```
Ensure `.env` contains the required Supabase connection parameters:
```env
VITE_SUPABASE_URL=https://bbznxozzucrhpppicjpg.supabase.co
VITE_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
VITE_GEMINI_API_KEY=<GEMINI_API_KEY>
VITE_AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
VITE_AI_MODEL=gemini-1.5-flash
```
*(Note: Never bundle private `service_role` keys into the mobile application).*

#### STEP 4 — Build Application
Compile the React application and production web assets:
```bash
npm run build
```
This outputs compiled assets into `APP_PROJECT/dist`.

#### STEP 5 — Synchronize Android Project
Synchronize compiled assets and native plugins into the Android native module:
```bash
npx cap sync android
```
*(Or use `npm run build:android` if configured).*

#### STEP 6 — Open Android Project in Android Studio
1. Launch **Android Studio**.
2. Select **Open** from the Welcome screen (or **File → Open**).
3. Browse to and select:
   ```
   PROJECTS/APP_PROJECT/android
   ```
   *(Important: Open the `android` subfolder containing `settings.gradle`, not the parent folder).*
4. Allow Android Studio to complete Gradle sync and project indexing.

#### STEP 7 — Select Emulator or Physical Device
- **Emulator:** Open **Device Manager** in Android Studio and start an Android Virtual Device (Pixel with API 34, 35, or 36 recommended).
- **Physical Device:** Enable **Developer Options** and **USB Debugging** on your Android smartphone, then connect it via USB. Verify connectivity with `adb devices`.

#### STEP 8 — Run the App
- In Android Studio, ensure the run configuration is set to **`app`** and click the green **Run (▶)** button.
- Alternatively, build and install the debug APK directly via command line:
  ```bash
  cd android
  ./gradlew assembleDebug
  adb install app/build/outputs/apk/debug/app-debug.apk
  ```

---

### Troubleshooting & Configuration Guide

#### 1. Gradle Sync / JDK 21 Requirement
- Android Studio Quail / modern Gradle requires **JDK 21 LTS**.
- If Gradle sync reports unsupported class file version or incompatible JVM, verify:
  - **Android Studio → Settings → Build, Execution, Deployment → Build Tools → Gradle**
  - Set **Gradle JDK** to **Embedded JDK 21 / JBR 21** or Temurin OpenJDK 21 LTS.

#### 2. Android SDK Path
- Ensure your `local.properties` file in `APP_PROJECT/android/` points to your installed Android SDK:
  ```properties
  sdk.dir=C:\\Users\\<Username>\\AppData\\Local\\Android\\Sdk
  ```
  *(Android Studio creates and manages this file automatically upon project open).*

#### 3. Supabase Real-Time Backend Connection
- The mobile app connects to the same live Supabase database as the web application.
- If network requests fail, ensure the device/emulator has active internet connectivity.
- All real-time channels auto-reconnect upon network resumption.

#### 4. Pre-built Debug APK Location
If you need to install the pre-compiled APK directly on an Android device:
```
PROJECTS/APP_PROJECT/android/app/build/outputs/apk/debug/app-debug.apk
```
Install using:
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

### Supported Roles & Capabilities
The application provides full role-based access control (RBAC) and real-time synchronization for 10 distinct user roles:
1. **Citizen:** File complaints, track status, emergency SOS, awareness, AI advisor.
2. **Police Officer:** Assigned cases, duties, attendance marking, investigation updates.
3. **SI / Station:** Police station overview, active duties, attendance logs, local alerts.
4. **DSP:** Sub-division analytics, duty assignment, district alerts, officer monitoring.
5. **DGP:** State-wide analytics, crime distribution, force-wide public notices.
6. **Cyber Officer:** Cyber crime reports, freeze requests, golden hour response.
7. **Lawyer:** Assigned cases, court hearing schedule, FIR and charge sheet documents.
8. **Court:** Judicial dockets, court hearing tracking, case transition updates.
9. **Administrator:** System configuration, user verification, department governance.
10. **System Admin:** System health, audit logs, performance telemetry.
