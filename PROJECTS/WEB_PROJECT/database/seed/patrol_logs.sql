-- ============================================================================
-- NYAYAMITRA ENTERPRISE DATABASE SEED
-- File: patrol_logs.sql
-- ============================================================================

DO $$
DECLARE
    i INT;
    v_officer_id UUID;
    v_zone_id UUID;
    v_start_time TIMESTAMPTZ;
BEGIN
    FOR i IN 1..50 LOOP
        SELECT id INTO v_officer_id FROM public.user_profiles WHERE role IN ('police_officer', 'station_officer') ORDER BY random() LIMIT 1;
        SELECT id INTO v_zone_id FROM public.md_patrol_zones ORDER BY random() LIMIT 1;
        v_start_time := now() - (random() * interval '7 days');

        IF v_officer_id IS NOT NULL AND v_zone_id IS NOT NULL THEN
            INSERT INTO public.patrol_logs (
                officer_id,
                zone_id,
                start_time,
                end_time,
                status,
                distance_covered_km,
                incidents_reported
            ) VALUES (
                v_officer_id,
                v_zone_id,
                v_start_time,
                CASE WHEN random() > 0.2 THEN v_start_time + interval '4 hours' ELSE NULL END,
                CASE WHEN random() > 0.2 THEN 'completed' ELSE 'active' END,
                floor(random() * 20 + 5),
                floor(random() * 3)
            );
        END IF;
    END LOOP;
END $$;
