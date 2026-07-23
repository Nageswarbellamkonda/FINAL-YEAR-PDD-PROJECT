-- ============================================================================
-- NYAYAMITRA ENTERPRISE DATABASE SEED
-- File: activities.sql
-- ============================================================================

DO $$
DECLARE
    r RECORD;
    v_i INT := 1;
BEGIN
    FOR r IN (SELECT id FROM public.user_profiles ORDER BY random() LIMIT 50) LOOP
        INSERT INTO public.activity_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            metadata,
            created_at
        ) VALUES (
            r.id,
            (ARRAY['login', 'view_case', 'update_case', 'file_complaint', 'download_fir'])[floor(random() * 5 + 1)],
            (ARRAY['auth', 'complaint', 'fir', 'evidence'])[floor(random() * 4 + 1)],
            gen_random_uuid(),
            '{"ip_address": "192.168.1.1", "device": "web_browser"}',
            now() - (random() * interval '7 days')
        );
    END LOOP;
END $$;
