-- ============================================================================
-- NYAYAMITRA ENTERPRISE DATABASE SEED
-- File: command_center.sql
-- ============================================================================

DO $$
DECLARE
    i INT;
    v_district_id UUID;
    v_station_id UUID;
    v_event_type_id UUID;
BEGIN
    FOR i IN 1..30 LOOP
        SELECT id INTO v_district_id FROM public.md_districts ORDER BY random() LIMIT 1;
        SELECT id INTO v_station_id FROM public.md_police_stations WHERE district_id = v_district_id ORDER BY random() LIMIT 1;
        SELECT id INTO v_event_type_id FROM public.md_emergency_types ORDER BY random() LIMIT 1;

        INSERT INTO public.command_center_events (
            event_type_id,
            district_id,
            station_id,
            title,
            description,
            severity,
            status,
            latitude,
            longitude,
            created_at
        ) VALUES (
            v_event_type_id,
            v_district_id,
            v_station_id,
            'Emergency Event ' || i,
            'Automated emergency alert triggered in sector ' || substring(v_district_id::text from 1 for 4),
            (ARRAY['low', 'medium', 'high', 'critical'])[floor(random() * 4 + 1)],
            (ARRAY['open', 'acknowledged', 'resolved', 'escalated'])[floor(random() * 4 + 1)],
            16.0 + (random() * 2.0),
            80.0 + (random() * 3.0),
            now() - (random() * interval '7 days')
        );
    END LOOP;
END $$;
