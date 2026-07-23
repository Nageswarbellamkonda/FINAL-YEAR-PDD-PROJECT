-- ============================================================================
-- NYAYAMITRA MASTER SCHEMA (CLEAN REBUILD)
-- Unified, Single-File Migration
-- ============================================================================

-- 1. MASTER DATA TABLES
CREATE TABLE IF NOT EXISTS public.md_districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    region TEXT
);

CREATE TABLE IF NOT EXISTS public.md_police_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID REFERENCES public.md_districts(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    contact_phone TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS public.md_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS public.md_police_ranks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    hierarchy_level INT
);

CREATE TABLE IF NOT EXISTS public.md_crime_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    default_priority TEXT
);

CREATE TABLE IF NOT EXISTS public.md_complaint_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    status_name TEXT NOT NULL,
    is_terminal BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.md_patrol_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID REFERENCES public.md_districts(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    severity_level TEXT
);

CREATE TABLE IF NOT EXISTS public.md_emergency_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    type_name TEXT NOT NULL,
    response_protocol TEXT
);

CREATE TABLE IF NOT EXISTS public.md_evidence_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    requires_secure_storage BOOLEAN DEFAULT false
);

-- 2. USER PROFILES
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'citizen',
    email TEXT,
    full_name TEXT,
    phone TEXT,
    profile_completed BOOLEAN DEFAULT false,
    md_district_id UUID REFERENCES public.md_districts(id) ON DELETE SET NULL,
    md_station_id UUID REFERENCES public.md_police_stations(id) ON DELETE SET NULL,
    md_department_id UUID REFERENCES public.md_departments(id) ON DELETE SET NULL,
    md_rank_id UUID REFERENCES public.md_police_ranks(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. CORE MODULES
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    complaint_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    complaint_type TEXT,
    status TEXT,
    priority TEXT,
    district TEXT,
    police_station TEXT,
    location TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    complainant_name TEXT,
    complainant_phone TEXT,
    assigned_officer TEXT,
    md_district_id UUID REFERENCES public.md_districts(id) ON DELETE SET NULL,
    md_station_id UUID REFERENCES public.md_police_stations(id) ON DELETE SET NULL,
    md_category_id UUID REFERENCES public.md_crime_categories(id) ON DELETE SET NULL,
    md_status_id UUID REFERENCES public.md_complaint_status(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fir_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    fir_number TEXT UNIQUE NOT NULL,
    registered_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    status TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    evidence_type TEXT,
    md_evidence_type_id UUID REFERENCES public.md_evidence_types(id) ON DELETE SET NULL,
    description TEXT,
    file_name TEXT,
    file_size BIGINT,
    mime_type TEXT,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cyber_crime_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    case_number TEXT UNIQUE NOT NULL,
    md_district_id UUID REFERENCES public.md_districts(id) ON DELETE SET NULL,
    victim_district TEXT,
    attack_type TEXT,
    financial_loss NUMERIC(15, 2) DEFAULT 0,
    bank_involved TEXT,
    fraud_account_number TEXT,
    transaction_id TEXT,
    victim_name TEXT,
    victim_phone TEXT,
    investigation_status TEXT,
    amount_recovered NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.missing_persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    case_number TEXT UNIQUE,
    full_name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    last_seen_date TIMESTAMPTZ,
    last_seen_location TEXT,
    district_id UUID REFERENCES public.md_districts(id) ON DELETE SET NULL,
    district TEXT,
    assigned_team TEXT,
    physical_description TEXT,
    clothes_worn TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.patrol_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    officer_in_charge TEXT,
    zone_id UUID REFERENCES public.md_patrol_zones(id) ON DELETE SET NULL,
    patrol_unit TEXT,
    vehicle_number TEXT,
    district TEXT,
    route_name TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    incidents_checked INT DEFAULT 0,
    km_covered NUMERIC(6, 2) DEFAULT 0.00,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.command_center_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type_id UUID REFERENCES public.md_emergency_types(id) ON DELETE SET NULL,
    district_id UUID REFERENCES public.md_districts(id) ON DELETE SET NULL,
    station_id UUID REFERENCES public.md_police_stations(id) ON DELETE SET NULL,
    event_code TEXT UNIQUE,
    title TEXT NOT NULL,
    event_type TEXT,
    district TEXT,
    location TEXT,
    severity TEXT,
    status TEXT,
    details TEXT,
    assigned_units JSONB DEFAULT '[]'::jsonb,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    action TEXT,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    message TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. VIEWS
CREATE OR REPLACE VIEW public.vw_complaints_detailed AS
SELECT 
    c.id,
    c.complaint_number,
    c.title,
    c.description,
    c.complaint_type,
    c.status AS legacy_status,
    c.priority,
    c.assigned_officer AS assigned_to,
    c.district AS legacy_district,
    c.location AS mandal,
    c.police_station AS legacy_station,
    c.latitude,
    c.longitude,
    c.created_at,
    c.updated_at,
    c.complainant_name AS citizen_name,
    c.complainant_phone AS citizen_phone,
    u.email AS citizen_email,
    md_dist.name AS district_name,
    md_stat.name AS station_name,
    md_cat.name AS category_name,
    md_stat_code.status_name AS current_status
FROM public.complaints c
LEFT JOIN public.user_profiles u ON c.user_id = u.id
LEFT JOIN public.md_districts md_dist ON c.md_district_id = md_dist.id
LEFT JOIN public.md_police_stations md_stat ON c.md_station_id = md_stat.id
LEFT JOIN public.md_crime_categories md_cat ON c.md_category_id = md_cat.id
LEFT JOIN public.md_complaint_status md_stat_code ON c.md_status_id = md_stat_code.id;


CREATE OR REPLACE VIEW public.vw_admin_dashboard_metrics AS
SELECT 
    (SELECT COUNT(*) FROM public.complaints) AS total_complaints,
    (SELECT COUNT(*) FROM public.fir_documents) AS total_firs,
    (SELECT COUNT(*) FROM public.complaints WHERE status = 'resolved' OR md_status_id IN (SELECT id FROM md_complaint_status WHERE is_terminal = true)) AS resolved_cases,
    (SELECT COUNT(*) FROM public.user_profiles WHERE role IN ('police_officer', 'station_officer', 'dsp')) AS total_police_officers,
    (SELECT COUNT(*) FROM public.command_center_events WHERE status IN ('open', 'acknowledged', 'escalated')) AS active_emergencies,
    (SELECT COUNT(*) FROM public.cyber_crime_reports) AS total_cyber_cases,
    (SELECT COALESCE(SUM(financial_loss), 0) FROM public.cyber_crime_reports) AS total_cyber_amount_lost,
    (SELECT COALESCE(SUM(amount_recovered), 0) FROM public.cyber_crime_reports) AS total_cyber_amount_recovered;


CREATE OR REPLACE VIEW public.vw_district_crime_heat AS
SELECT 
    md_dist.name AS district,
    COUNT(c.id) AS total_cases,
    SUM(CASE WHEN c.priority = 'high' OR c.priority = 'critical' THEN 1 ELSE 0 END) AS high_priority_cases
FROM public.md_districts md_dist
LEFT JOIN public.complaints c ON c.md_district_id = md_dist.id
GROUP BY md_dist.name;


CREATE OR REPLACE VIEW public.vw_active_patrols AS
SELECT 
    p.id,
    p.start_time,
    p.status,
    p.latitude,
    p.longitude,
    p.route_name AS route_coordinates,
    p.officer_in_charge AS officer_name,
    NULL AS officer_phone,
    p.patrol_unit AS zone_name,
    'normal' AS severity_level,
    p.district AS district_name
FROM public.patrol_logs p
WHERE p.status = 'active';

CREATE OR REPLACE VIEW public.vw_cyber_crimes_detailed AS
SELECT 
    cy.id,
    cy.case_number AS case_id,
    cy.attack_type AS fraud_type,
    cy.financial_loss AS amount_lost,
    cy.amount_recovered,
    cy.bank_involved AS bank_name,
    cy.victim_name,
    cy.investigation_status AS recovery_status,
    cy.created_at AS created_date,
    cy.victim_district AS district_name
FROM public.cyber_crime_reports cy;

-- 5. RPC Functions
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT row_to_json(t) INTO result
    FROM (
        SELECT 
            (SELECT COUNT(*) FROM public.complaints) AS total_complaints,
            (SELECT COUNT(*) FROM public.fir_documents) AS total_firs,
            (SELECT COUNT(*) FROM public.cyber_crime_reports) AS cyber_crimes,
            (SELECT COUNT(*) FROM public.missing_persons WHERE status = 'missing') AS active_missing_persons,
            (SELECT COUNT(*) FROM public.command_center_events WHERE status IN ('open', 'escalated')) AS active_emergencies,
            (SELECT COUNT(*) FROM public.patrol_logs WHERE status = 'active') AS active_patrols
    ) t;
    
    RETURN result;
END;
$$;
