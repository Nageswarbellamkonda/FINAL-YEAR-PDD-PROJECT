# Security Documentation
1. **JWT Validation**: All user sessions are cryptographically signed.
2. **Row Level Security (RLS)**: Users can only execute `SELECT, INSERT, UPDATE` on rows where `auth.uid() = user_id`.
3. **Protected Routes**: React Router handles front-end intercepts, storing `auth_return_to` in session storage.
4. **API Keys**: No secret keys are exposed. `VITE_SUPABASE_ANON_KEY` is safely restricted by RLS.
