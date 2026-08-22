# NYAYA-MITRA Final Deployment Checklist

## Pre-Deployment Verification

### Backend (Express / Node.js)
- [x] Environment variables configured securely without hardcoded secrets.
- [x] CORS policies set accurately to accept connections from production domains.
- [x] Production build step executed (`npm run build`).
- [x] Port dynamically allocated (`process.env.PORT`).
- [x] Health checks implemented (`/api/health`).

### Web Client (React / Vite)
- [x] API Base URL configured via `.env` (No raw `localhost` strings in production).
- [x] `SUPABASE_ANON_KEY` and `VITE_SUPABASE_URL` injected at build-time.
- [x] Production build complete (`npm run build`).
- [x] Routing fallbacks configured for SPA deployments.

### Mobile Application (Android)
- [x] All API endpoints point to production URL via `BuildConfig.BASE_URL` or environment config, ensuring no `10.0.2.2` in Release APKs.
- [x] Network Security Configuration defined (`AndroidManifest.xml` INTERNET permissions present).
- [x] Gradle scripts optimized for Release build type (`minifyEnabled`, ProGuard rules).
- [x] Signing configurations validated (Keystore ready).

### Database (Supabase / PostgreSQL)
- [x] Remote database seeded with correct schemas (Tables, RLS Policies, Indexes).
- [x] No `service_role` keys leaked to mobile or web layers.
- [x] Trigger functions established where needed.

## Final Steps for Manual Cloud Deployment
1. Provision Backend host (e.g., Render, Railway, AWS EC2) and inject `.env` secrets.
2. Deploy the Web frontend static bundle to Vercel/Netlify.
3. Sign the Android APK/AAB and upload to Play Console for closed testing.
