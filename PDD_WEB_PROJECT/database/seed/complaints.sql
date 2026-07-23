-- ============================================================================
-- NYAYAMITRA ENTERPRISE DATABASE SEED
-- File: complaints.sql
-- ============================================================================

DO $$
DECLARE
    i INT;
    v_citizen_id UUID;
    v_district_id UUID;
    v_station_id UUID;
    v_category_id UUID;
    v_status_id UUID;
BEGIN
    FOR i IN 1..500 LOOP
        -- Select random references
        SELECT id INTO v_citizen_id FROM public.user_profiles WHERE role = 'citizen' ORDER BY random() LIMIT 1;
        SELECT id INTO v_district_id FROM public.md_districts ORDER BY random() LIMIT 1;
        SELECT id INTO v_station_id FROM public.md_police_stations WHERE district_id = v_district_id ORDER BY random() LIMIT 1;
        SELECT id INTO v_category_id FROM public.md_crime_categories ORDER BY random() LIMIT 1;
        SELECT id INTO v_status_id FROM public.md_complaint_status ORDER BY random() LIMIT 1;
        
        -- Fallback if no station in that district
        IF v_station_id IS NULL THEN
            SELECT id INTO v_station_id FROM public.md_police_stations ORDER BY random() LIMIT 1;
        END IF;

        INSERT INTO public.complaints (
            user_id,
            complaint_number,
            title,
            description,
            complaint_type,
            status,
            priority,
            md_district_id,
            md_station_id,
            md_category_id,
            md_status_id,
            created_at
        ) VALUES (
            v_citizen_id,
            'COMP-' || TO_CHAR(now() - (random() * interval '365 days'), 'YYYYMMDD') || '-' || LPAD(i::text, 4, '0'),
            'Reported Incident ' || i,
            'Detailed description for incident ' || i,
            (SELECT name FROM public.md_crime_categories WHERE id = v_category_id),
            (SELECT status_name FROM public.md_complaint_status WHERE id = v_status_id),
            (SELECT default_priority FROM public.md_crime_categories WHERE id = v_category_id),
            v_district_id,
            v_station_id,
            v_category_id,
            v_status_id,
            now() - (random() * interval '365 days')
        );
    END LOOP;
END $$;
