-- Add seed columns to schema tables
ALTER TABLE public.missing_persons 
    ADD COLUMN IF NOT EXISTS case_number TEXT,
    ADD COLUMN IF NOT EXISTS person_name TEXT,
    ADD COLUMN IF NOT EXISTS district TEXT,
    ADD COLUMN IF NOT EXISTS contact_guardian TEXT;

ALTER TABLE public.patrol_logs 
    ADD COLUMN IF NOT EXISTS patrol_unit TEXT,
    ADD COLUMN IF NOT EXISTS vehicle_number TEXT,
    ADD COLUMN IF NOT EXISTS district TEXT,
    ADD COLUMN IF NOT EXISTS route_name TEXT,
    ADD COLUMN IF NOT EXISTS officer_in_charge TEXT,
    ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
    ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
    ADD COLUMN IF NOT EXISTS incidents_checked INT,
    ADD COLUMN IF NOT EXISTS km_covered NUMERIC(6, 2);

ALTER TABLE public.command_center_events 
    ADD COLUMN IF NOT EXISTS event_id TEXT,
    ADD COLUMN IF NOT EXISTS event_type TEXT,
    ADD COLUMN IF NOT EXISTS location TEXT,
    ADD COLUMN IF NOT EXISTS district TEXT,
    ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
    ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
    ADD COLUMN IF NOT EXISTS assigned_units TEXT,
    ADD COLUMN IF NOT EXISTS reported_by TEXT;

ALTER TABLE public.cyber_crime_reports
    ADD COLUMN IF NOT EXISTS case_number TEXT,
    ADD COLUMN IF NOT EXISTS threat_level TEXT,
    ADD COLUMN IF NOT EXISTS attack_type TEXT,
    ADD COLUMN IF NOT EXISTS financial_loss NUMERIC,
    ADD COLUMN IF NOT EXISTS amount_recovered NUMERIC,
    ADD COLUMN IF NOT EXISTS victim_name TEXT,
    ADD COLUMN IF NOT EXISTS victim_phone TEXT,
    ADD COLUMN IF NOT EXISTS victim_district TEXT,
    ADD COLUMN IF NOT EXISTS bank_involved TEXT,
    ADD COLUMN IF NOT EXISTS transaction_id TEXT,
    ADD COLUMN IF NOT EXISTS fraud_account_number TEXT,
    ADD COLUMN IF NOT EXISTS investigation_status TEXT;
