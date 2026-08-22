# Setup Instructions

## Prerequisites
- Node.js (v18+)
- Android Studio (for native app)
- Java JDK 17
- Supabase account & project

## Backend Setup
1. Navigate to `BACKEND/`
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in your Supabase URL and Service Role Key.
4. Run `npm run dev` to start the server.

## Web Setup
1. Navigate to `WEB/`
2. Run `npm install`
3. Ensure `.env` points the API URL to the local backend (e.g., `VITE_API_URL=http://localhost:3000`).
4. Run `npm run dev`.

## Android Setup
1. Open the `APP/` directory in Android Studio.
2. Wait for Gradle sync to complete.
3. Update `network/RetrofitClient.kt` (or similar) to point to your local backend IP (e.g., `http://10.0.2.2:3000`).
4. Run the app on an emulator or physical device.


