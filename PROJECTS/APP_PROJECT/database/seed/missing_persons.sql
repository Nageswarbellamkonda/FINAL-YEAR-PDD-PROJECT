-- ============================================================================
-- NYAYAMITRA ENTERPRISE DATABASE SEED
-- File: missing_persons.sql
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT c.id, c.md_district_id, c.created_at
        FROM public.complaints c
        WHERE c.md_category_id = 'cat00000-0000-0000-0000-000000000005'
        LIMIT 50
    ) LOOP
        INSERT INTO public.missing_persons (
            complaint_id,
            full_name,
            age,
            gender,
            last_seen_date,
            last_seen_location,
            district_id,
            physical_description,
            clothes_worn,
            status,
            created_at,
            updated_at
        ) VALUES (
            r.id,
            'Missing Person ' || substring(r.id::text from 1 for 4),
            floor(random() * 60 + 5),
            (ARRAY['Male', 'Female'])[floor(random() * 2 + 1)],
            r.created_at - interval '2 days',
            'Near District Center',
            r.md_district_id,
            'Height 5.5ft, medium build',
            'Blue shirt, black pants',
            (ARRAY['missing', 'found_safe', 'found_deceased'])[floor(random() * 3 + 1)],
            r.created_at,
            r.created_at
        );
    END LOOP;
END $$;
