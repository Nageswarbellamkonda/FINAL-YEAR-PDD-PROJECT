-- ============================================================================
-- NYAYAMITRA ENTERPRISE DATABASE SEED
-- File: citizens.sql
-- ============================================================================

DO $$
DECLARE
    i INT;
    v_id UUID;
    v_email TEXT;
BEGIN
    FOR i IN 1..100 LOOP
        v_id := gen_random_uuid();
        v_email := 'citizen' || i || '@example.com';
        
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
        VALUES (v_id, v_email, 'dummy', now(), '{"role": "citizen", "full_name": "Citizen ' || i || '"}')
        ON CONFLICT (id) DO NOTHING;
        
        INSERT INTO public.user_profiles (id, email, full_name, role, phone, md_district_id, profile_completed)
        VALUES (
            v_id, 
            v_email, 
            'Citizen ' || i, 
            'citizen', 
            '9876543' || LPAD(i::text, 3, '0'), 
            (SELECT id FROM public.md_districts ORDER BY random() LIMIT 1),
            true
        )
        ON CONFLICT (id) DO NOTHING;
        
    END LOOP;
END $$;
