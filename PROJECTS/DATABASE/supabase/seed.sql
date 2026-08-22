-- ============================================================================
-- NYAYAMITRA PROCEDURAL SEED GENERATOR
-- Description: Generates realistic mock data dynamically
-- ============================================================================

-- 1. MASTER DATA (STATIC)
INSERT INTO public.md_districts (code, name, region) VALUES
('VSP', 'Visakhapatnam', 'North Coastal'),
('AKP', 'Anakapalli', 'North Coastal'),
('VJA', 'Vijayawada', 'Central Coastal'),
('GNT', 'Guntur', 'Central Coastal'),
('TPT', 'Tirupati', 'Rayalaseema')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.md_police_stations (district_id, code, name, contact_phone, latitude, longitude)
SELECT id, 'VSP-I-TOWN', 'Visakhapatnam I Town', '0891-2562709', 17.6868, 83.2185 FROM public.md_districts WHERE code='VSP' UNION ALL
SELECT id, 'VSP-MVP', 'MVP Colony PS', '0891-2562710', 17.7441, 83.3361 FROM public.md_districts WHERE code='VSP' UNION ALL
SELECT id, 'VJA-ONE-TOWN', 'Vijayawada One Town', '0866-2424100', 16.5062, 80.6480 FROM public.md_districts WHERE code='VJA' UNION ALL
SELECT id, 'TPT-ALIPIRI', 'Alipiri PS', '0877-2289001', 13.6288, 79.4192 FROM public.md_districts WHERE code='TPT'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.md_crime_categories (code, name, default_priority) VALUES
('THEFT', 'Theft / Burglary', 'normal'),
('ASSAULT', 'Physical Assault', 'high'),
('CYBER', 'Cyber Fraud', 'high'),
('WOMEN_HARRASS', 'Harassment Against Women', 'urgent'),
('MISSING', 'Missing Person', 'urgent')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.md_complaint_status (code, status_name, is_terminal) VALUES
('FILED', 'Filed Online', false),
('ACKNOWLEDGED', 'Acknowledged by Station', false),
('FIR_REG', 'FIR Registered', false),
('UNDER_INV', 'Under Investigation', false),
('RESOLVED', 'Resolved / Closed', true),
('REJECTED', 'Rejected / Invalid', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.md_patrol_zones (district_id, code, name, severity_level)
SELECT id, 'VSP-BEACH', 'RK Beach Road Sector', 'medium' FROM public.md_districts WHERE code='VSP' UNION ALL
SELECT id, 'VJA-BUS-STAND', 'Vijayawada PNBS Sector', 'high' FROM public.md_districts WHERE code='VJA'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.md_emergency_types (code, type_name, response_protocol) VALUES
('SOS_APP', 'Citizen SOS Alert', 'Immediate dispatch to GPS coordinates'),
('RIOT', 'Riot / Mob Violence', 'Deploy Quick Response Team (QRT)'),
('ACCIDENT_MAJOR', 'Major Highway Accident', 'Dispatch Highway Patrol & Ambulance')
ON CONFLICT (code) DO NOTHING;


-- 2. DYNAMIC PROCEDURAL GENERATION
DO $$
DECLARE
    i INT;
    v_id UUID;
    v_email TEXT;
    
    -- Cache variables for random selection
    v_district_id UUID;
    v_station_id UUID;
    v_category_id UUID;
    v_status_id UUID;
    v_user_id UUID;
    v_officer_id UUID;
    v_complaint_id UUID;
    v_emergency_type_id UUID;
    v_patrol_zone_id UUID;
    
    r RECORD;
BEGIN
    -- 2.1 GENERATE CITIZENS
    FOR i IN 1..100 LOOP
        v_id := gen_random_uuid();
        v_email := 'citizen' || i || '@example.com';
        
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
        VALUES (v_id, v_email, 'dummy', now(), '{"role": "citizen"}'::jsonb);
        
        INSERT INTO public.user_profiles (id, email, full_name, role, phone, profile_completed)
        VALUES (v_id, v_email, 'Citizen ' || i, 'citizen', '9876543' || LPAD(i::text, 3, '0'), true);
    END LOOP;

    -- 2.2 GENERATE POLICE OFFICERS
    FOR i IN 1..10 LOOP
        v_id := gen_random_uuid();
        v_email := 'officer' || i || '@ap.police.gov.in';
        
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
        VALUES (v_id, v_email, 'dummy', now(), '{"role": "police_officer"}'::jsonb);
        
        INSERT INTO public.user_profiles (id, email, full_name, role, phone, profile_completed)
        VALUES (v_id, v_email, 'Officer ' || i, 'police_officer', '944079' || LPAD(i::text, 4, '0'), true);
    END LOOP;

    -- 2.3 GENERATE ADMIN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES (v_id, 'admin@nyayamitra.gov.in', 'dummy', now(), '{"role": "administrator"}'::jsonb);
    
    INSERT INTO public.user_profiles (id, email, full_name, role, profile_completed)
    VALUES (v_id, 'admin@nyayamitra.gov.in', 'System Admin', 'administrator', true);


    -- 2.4 GENERATE COMPLAINTS (1000 Complaints)
    FOR i IN 1..1000 LOOP
        SELECT id INTO v_user_id FROM public.user_profiles WHERE role = 'citizen' ORDER BY random() LIMIT 1;
        SELECT id INTO v_officer_id FROM public.user_profiles WHERE role = 'police_officer' ORDER BY random() LIMIT 1;
        SELECT id INTO v_district_id FROM public.md_districts ORDER BY random() LIMIT 1;
        SELECT id INTO v_station_id FROM public.md_police_stations WHERE district_id = v_district_id ORDER BY random() LIMIT 1;
        SELECT id INTO v_category_id FROM public.md_crime_categories ORDER BY random() LIMIT 1;
        SELECT id INTO v_status_id FROM public.md_complaint_status ORDER BY random() LIMIT 1;
        
        -- Default to any station if district doesn't have one
        IF v_station_id IS NULL THEN
            SELECT id INTO v_station_id FROM public.md_police_stations ORDER BY random() LIMIT 1;
        END IF;

        INSERT INTO public.complaints (
            user_id, complaint_number, title, description, complaint_type, status, priority,
            district, police_station, complainant_name, complainant_phone, assigned_officer,
            md_district_id, md_station_id, md_category_id, md_status_id, created_at
        ) VALUES (
            v_user_id,
            'COMP-' || TO_CHAR(now() - (random() * interval '365 days'), 'YYYYMMDD') || '-' || LPAD(i::text, 4, '0'),
            'Reported Incident ' || i,
            'Detailed description for incident ' || i,
            (SELECT name FROM public.md_crime_categories WHERE id = v_category_id),
            (SELECT status_name FROM public.md_complaint_status WHERE id = v_status_id),
            (SELECT default_priority FROM public.md_crime_categories WHERE id = v_category_id),
            (SELECT name FROM public.md_districts WHERE id = v_district_id),
            (SELECT name FROM public.md_police_stations WHERE id = v_station_id),
            (SELECT full_name FROM public.user_profiles WHERE id = v_user_id),
            (SELECT phone FROM public.user_profiles WHERE id = v_user_id),
            (SELECT full_name FROM public.user_profiles WHERE id = v_officer_id),
            v_district_id, v_station_id, v_category_id, v_status_id,
            now() - (random() * interval '365 days')
        );
    END LOOP;

    -- 2.5 GENERATE FIRS (For ~200 Complaints)
    FOR r IN (SELECT id, user_id, created_at FROM public.complaints ORDER BY random() LIMIT 200) LOOP
        SELECT id INTO v_officer_id FROM public.user_profiles WHERE role = 'police_officer' ORDER BY random() LIMIT 1;
        INSERT INTO public.fir_documents (user_id, complaint_id, fir_number, registered_by, status, created_at)
        VALUES (r.user_id, r.id, 'FIR-' || substring(r.id::text from 1 for 8), v_officer_id, 'under_investigation', r.created_at + interval '1 day');
    END LOOP;

    -- 2.6 GENERATE CYBER CRIMES (For ~150 Complaints)
    FOR r IN (SELECT id, complaint_number, md_district_id, created_at FROM public.complaints ORDER BY random() LIMIT 150) LOOP
        INSERT INTO public.cyber_crime_reports (
            complaint_id, case_number, md_district_id, victim_district, fraud_type, 
            amount_lost, bank_name, recovery_status, created_at
        ) VALUES (
            r.id, r.complaint_number, r.md_district_id,
            (SELECT name FROM public.md_districts WHERE id = r.md_district_id),
            (ARRAY['Phishing', 'Identity Theft', 'UPI Fraud', 'Job Fraud'])[floor(random() * 4 + 1)],
            floor(random() * 100000 + 5000),
            (ARRAY['SBI', 'HDFC', 'ICICI', 'Axis Bank'])[floor(random() * 4 + 1)],
            (ARRAY['under_investigation', 'frozen', 'closed'])[floor(random() * 3 + 1)],
            r.created_at
        );
    END LOOP;
    
    UPDATE public.cyber_crime_reports SET amount_recovered = amount_lost WHERE recovery_status = 'closed';

    -- 2.7 GENERATE MISSING PERSONS (For ~50 Complaints)
    FOR r IN (SELECT id, md_district_id, created_at FROM public.complaints ORDER BY random() LIMIT 50) LOOP
        INSERT INTO public.missing_persons (
            complaint_id, case_number, full_name, gender, status, district_id, district, created_at
        ) VALUES (
            r.id, 'MP-' || substring(r.id::text from 1 for 8), 'Missing Person ' || substring(r.id::text from 1 for 4),
            (ARRAY['Male', 'Female'])[floor(random() * 2 + 1)],
            (ARRAY['missing', 'found_safe', 'found_deceased'])[floor(random() * 3 + 1)],
            r.md_district_id, (SELECT name FROM public.md_districts WHERE id = r.md_district_id), r.created_at
        );
    END LOOP;

    -- 2.8 GENERATE COMMAND CENTER EVENTS (50 Events)
    FOR i IN 1..50 LOOP
        SELECT id INTO v_emergency_type_id FROM public.md_emergency_types ORDER BY random() LIMIT 1;
        SELECT id INTO v_district_id FROM public.md_districts ORDER BY random() LIMIT 1;
        SELECT id INTO v_station_id FROM public.md_police_stations WHERE district_id = v_district_id ORDER BY random() LIMIT 1;
        IF v_station_id IS NULL THEN SELECT id INTO v_station_id FROM public.md_police_stations ORDER BY random() LIMIT 1; END IF;
        
        INSERT INTO public.command_center_events (
            event_type_id, district_id, station_id, event_code, title, event_type, 
            district, severity, status, latitude, longitude, created_at
        ) VALUES (
            v_emergency_type_id, v_district_id, v_station_id,
            'CMD-EVT-' || i, 'Emergency ' || i,
            (SELECT type_name FROM public.md_emergency_types WHERE id = v_emergency_type_id),
            (SELECT name FROM public.md_districts WHERE id = v_district_id),
            (ARRAY['low', 'medium', 'high', 'critical'])[floor(random() * 4 + 1)],
            (ARRAY['open', 'acknowledged', 'resolved', 'escalated'])[floor(random() * 4 + 1)],
            16.0 + (random() * 2.0), 80.0 + (random() * 3.0),
            now() - (random() * interval '7 days')
        );
    END LOOP;

    -- 2.9 GENERATE PATROL LOGS (50 Patrols)
    FOR i IN 1..50 LOOP
        SELECT id INTO v_officer_id FROM public.user_profiles WHERE role = 'police_officer' ORDER BY random() LIMIT 1;
        SELECT id INTO v_patrol_zone_id FROM public.md_patrol_zones ORDER BY random() LIMIT 1;
        
        INSERT INTO public.patrol_logs (
            officer_id, officer_in_charge, zone_id, district, patrol_unit, route_name, status, created_at
        ) VALUES (
            v_officer_id, (SELECT full_name FROM public.user_profiles WHERE id = v_officer_id),
            v_patrol_zone_id, (SELECT d.name FROM public.md_districts d JOIN public.md_patrol_zones z ON d.id = z.district_id WHERE z.id = v_patrol_zone_id),
            'Unit ' || i, 'Route ' || i,
            (ARRAY['active', 'completed'])[floor(random() * 2 + 1)],
            now() - (random() * interval '7 days')
        );
    END LOOP;

END $$;
