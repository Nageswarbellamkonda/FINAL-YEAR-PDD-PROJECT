-- ============================================================================
-- NYAYAMITRA ENTERPRISE DATABASE SEED
-- File: fir.sql
-- ============================================================================

DO $$
DECLARE
    r RECORD;
    v_officer_id UUID;
    v_i INT := 1;
BEGIN
    FOR r IN (SELECT id, user_id, created_at FROM public.complaints ORDER BY random() LIMIT 250) LOOP
        SELECT id INTO v_officer_id FROM public.user_profiles WHERE role IN ('police_officer', 'station_officer', 'dsp') ORDER BY random() LIMIT 1;
        
        INSERT INTO public.fir_documents (
            user_id,
            complaint_id,
            fir_number,
            registered_by,
            status,
            description,
            created_at,
            updated_at
        ) VALUES (
            r.user_id,
            r.id,
            'FIR-' || TO_CHAR(r.created_at, 'YYYYMMDD') || '-' || LPAD(v_i::text, 4, '0'),
            v_officer_id,
            'under_investigation',
            'FIR generated for investigation based on preliminary evidence.',
            r.created_at + interval '1 day',
            r.created_at + interval '1 day'
        );
        v_i := v_i + 1;
    END LOOP;
END $$;
