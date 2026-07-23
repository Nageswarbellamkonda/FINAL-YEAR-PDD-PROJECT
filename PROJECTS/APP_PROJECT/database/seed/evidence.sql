-- ============================================================================
-- NYAYAMITRA ENTERPRISE DATABASE SEED
-- File: evidence.sql
-- ============================================================================

DO $$
DECLARE
    r RECORD;
    v_evidence_type_id UUID;
    v_i INT := 1;
BEGIN
    FOR r IN (SELECT id, user_id, created_at FROM public.complaints ORDER BY random() LIMIT 300) LOOP
        SELECT id INTO v_evidence_type_id FROM public.md_evidence_types ORDER BY random() LIMIT 1;

        INSERT INTO public.evidence (
            user_id,
            complaint_id,
            evidence_type,
            md_evidence_type_id,
            description,
            file_name,
            file_size,
            mime_type,
            created_at,
            updated_at
        ) VALUES (
            r.user_id,
            r.id,
            'Document',
            v_evidence_type_id,
            'Evidence submitted for case ' || substring(r.id::text from 1 for 6),
            'evidence_' || v_i || '.pdf',
            floor(random() * 5000000 + 100000),
            'application/pdf',
            r.created_at + interval '1 hour',
            r.created_at + interval '1 hour'
        );
        v_i := v_i + 1;
    END LOOP;
END $$;
