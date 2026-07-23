-- ============================================================================
-- NYAYAMITRA ENTERPRISE DATABASE SEED
-- File: cyber_cases.sql
-- ============================================================================

DO $$
DECLARE
    r RECORD;
    v_i INT := 1;
BEGIN
    FOR r IN (
        SELECT c.id, c.complaint_number, c.md_district_id, c.created_at, u.full_name, u.phone
        FROM public.complaints c
        JOIN public.user_profiles u ON c.user_id = u.id
        WHERE c.complaint_type ILIKE '%Cyber%' OR c.md_category_id = 'cat00000-0000-0000-0000-000000000003'
        LIMIT 100
    ) LOOP
        INSERT INTO public.cyber_crime_reports (
            complaint_id,
            case_id,
            md_district_id,
            fraud_type,
            amount_lost,
            bank_name,
            account_number,
            utr_transaction_id,
            victim_name,
            victim_phone,
            recovery_status,
            amount_recovered,
            created_date,
            created_at
        ) VALUES (
            r.id,
            r.complaint_number,
            r.md_district_id,
            (ARRAY['Phishing', 'Identity Theft', 'UPI Fraud', 'Job Fraud'])[floor(random() * 4 + 1)],
            floor(random() * 100000 + 5000),
            (ARRAY['SBI', 'HDFC', 'ICICI', 'Axis Bank'])[floor(random() * 4 + 1)],
            'ACC' || LPAD(floor(random() * 1000000)::text, 10, '0'),
            'UTR' || TO_CHAR(now(), 'YYYYMMDD') || LPAD(v_i::text, 4, '0'),
            r.full_name,
            r.phone,
            (ARRAY['pending', 'partial_recovery', 'full_recovery', 'untraceable'])[floor(random() * 4 + 1)],
            0, -- Default to 0, update conditionally if needed
            r.created_at,
            r.created_at
        );
        v_i := v_i + 1;
    END LOOP;
    
    -- Update amount_recovered for cases that are 'partial_recovery' or 'full_recovery'
    UPDATE public.cyber_crime_reports
    SET amount_recovered = amount_lost
    WHERE recovery_status = 'full_recovery';
    
    UPDATE public.cyber_crime_reports
    SET amount_recovered = amount_lost * (random() * 0.5 + 0.1)
    WHERE recovery_status = 'partial_recovery';
END $$;
