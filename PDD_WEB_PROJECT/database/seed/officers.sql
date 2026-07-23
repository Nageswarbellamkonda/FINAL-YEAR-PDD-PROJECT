-- ============================================================================
-- NYAYAMITRA ENTERPRISE DATABASE SEED
-- File: officers.sql
-- ============================================================================

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data) VALUES
    ('o3000000-0000-0000-0000-000000000001', 'sp.vsp@ap.police.gov.in', 'dummy', now(), '{"role": "police_officer", "full_name": "K. Srinivas IPS"}'),
    ('o3000000-0000-0000-0000-000000000002', 'ci.vsp_i_town@ap.police.gov.in', 'dummy', now(), '{"role": "station_officer", "full_name": "P. Ramesh CI"}'),
    ('o3000000-0000-0000-0000-000000000003', 'si.vja_one_town@ap.police.gov.in', 'dummy', now(), '{"role": "police_officer", "full_name": "M. Rao SI"}'),
    ('a4000000-0000-0000-0000-000000000001', 'admin@nyayamitra.gov.in', 'dummy', now(), '{"role": "administrator", "full_name": "System Administrator"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_profiles (id, email, full_name, role, phone, md_district_id, md_station_id, md_department_id, md_rank_id, profile_completed) VALUES
    ('o3000000-0000-0000-0000-000000000001', 'sp.vsp@ap.police.gov.in', 'K. Srinivas IPS', 'dsp', '9440790001', 'd1000000-0000-0000-0000-000000000001', NULL, 'dep00000-0000-0000-0000-000000000001', 'rnk00000-0000-0000-0000-000000000007', true),
    ('o3000000-0000-0000-0000-000000000002', 'ci.vsp_i_town@ap.police.gov.in', 'P. Ramesh CI', 'station_officer', '9440790002', 'd1000000-0000-0000-0000-000000000001', 's2000000-0000-0000-0000-000000000001', 'dep00000-0000-0000-0000-000000000001', 'rnk00000-0000-0000-0000-000000000005', true),
    ('o3000000-0000-0000-0000-000000000003', 'si.vja_one_town@ap.police.gov.in', 'M. Rao SI', 'police_officer', '9440790003', 'd1000000-0000-0000-0000-000000000008', 's2000000-0000-0000-0000-000000000003', 'dep00000-0000-0000-0000-000000000001', 'rnk00000-0000-0000-0000-000000000004', true),
    ('a4000000-0000-0000-0000-000000000001', 'admin@nyayamitra.gov.in', 'System Administrator', 'administrator', '9999999999', NULL, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.admins (user_id, admin_level) VALUES
    ('a4000000-0000-0000-0000-000000000001', 'super')
ON CONFLICT (user_id) DO NOTHING;
