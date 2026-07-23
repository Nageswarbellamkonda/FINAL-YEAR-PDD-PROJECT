# Database Schema
NyayaMitra utilizes PostgreSQL via Supabase.

## Core Tables
1. **profiles**: User demographic and role data.
2. **complaints**: Core FIR/Incident tracking.
3. **cyber_crime_reports**: Specialized schema for financial/cyber fraud.
4. **women_safety_sessions**: Real-time SOS and location tracking sessions.
5. **ai_case_summaries**: Caches AI-generated insights to prevent redundant API calls.
6. **notifications**: Real-time event broadcasting to users.

*Note: All tables are protected via strictly configured RLS policies.*
