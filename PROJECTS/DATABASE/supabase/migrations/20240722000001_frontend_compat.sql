-- ============================================================================
-- FRONTEND COMPATIBILITY PATCH
-- Creates missing tables and fixes column names to perfectly match React Code
-- ============================================================================

-- 1. ROLE-SPECIFIC PROFILES
CREATE TABLE IF NOT EXISTS public.citizen_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_language TEXT DEFAULT 'en',
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.police_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    jurisdiction_level TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lawyer_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.court_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    court_type TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_level TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. APPLICATION MODULES
CREATE TABLE IF NOT EXISTS public.duty_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_email TEXT,
    officer_name TEXT,
    district TEXT,
    mandal TEXT,
    police_station TEXT,
    location TEXT,
    status TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_email TEXT,
    officer_name TEXT,
    district TEXT,
    mandal TEXT,
    police_station TEXT,
    date DATE,
    status TEXT,
    verified BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.station_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    message TEXT,
    severity TEXT,
    target_audience JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.women_safety_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT,
    user_email TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    start_location JSONB,
    end_location JSONB,
    status TEXT,
    emergency_triggered BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_case_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    summary_text TEXT,
    key_entities JSONB,
    risk_assessment TEXT,
    generated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.case_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    sender_id UUID,
    sender_role TEXT,
    message TEXT,
    attachments JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.citizen_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    message TEXT,
    is_ai BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    rating INT,
    comments TEXT,
    is_public BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. SCHEMA ADJUSTMENTS
ALTER TABLE public.cyber_crime_reports RENAME COLUMN attack_type TO fraud_type;
ALTER TABLE public.cyber_crime_reports RENAME COLUMN financial_loss TO amount_lost;
ALTER TABLE public.cyber_crime_reports RENAME COLUMN bank_involved TO bank_name;
ALTER TABLE public.cyber_crime_reports RENAME COLUMN fraud_account_number TO account_number;
ALTER TABLE public.cyber_crime_reports RENAME COLUMN investigation_status TO recovery_status;

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS officer_status TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS trusted_contacts JSONB;

ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS notices JSONB;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS action_updates JSONB;

ALTER TABLE public.evidence RENAME TO evidence_files;

-- 4. VIEWS
CREATE OR REPLACE VIEW public.attendance AS SELECT * FROM public.attendances;

-- Also update vw_cyber_crimes_detailed to use the new base columns
DROP VIEW IF EXISTS public.vw_cyber_crimes_detailed;
CREATE OR REPLACE VIEW public.vw_cyber_crimes_detailed AS
SELECT 
    cy.id,
    cy.case_number AS case_id,
    cy.fraud_type,
    cy.amount_lost,
    cy.amount_recovered,
    cy.bank_name,
    cy.victim_name,
    cy.recovery_status,
    cy.created_at AS created_date,
    cy.victim_district AS district_name
FROM public.cyber_crime_reports cy;
