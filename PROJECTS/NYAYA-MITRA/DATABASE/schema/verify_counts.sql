SELECT 'complaints' AS table_name, count(*) AS row_count FROM public.complaints
UNION ALL
SELECT 'fir_documents' AS table_name, count(*) AS row_count FROM public.fir_documents
UNION ALL
SELECT 'cyber_crime_reports' AS table_name, count(*) AS row_count FROM public.cyber_crime_reports
UNION ALL
SELECT 'missing_persons' AS table_name, count(*) AS row_count FROM public.missing_persons
UNION ALL
SELECT 'women_safety_alerts' AS table_name, count(*) AS row_count FROM public.women_safety_alerts
UNION ALL
SELECT 'officers' AS table_name, count(*) AS row_count FROM public.officers
UNION ALL
SELECT 'police_profiles' AS table_name, count(*) AS row_count FROM public.police_profiles
UNION ALL
SELECT 'activity_logs' AS table_name, count(*) AS row_count FROM public.activity_logs
UNION ALL
SELECT 'patrol_logs' AS table_name, count(*) AS row_count FROM public.patrol_logs
UNION ALL
SELECT 'attendances' AS table_name, count(*) AS row_count FROM public.attendances
UNION ALL
SELECT 'command_center_events' AS table_name, count(*) AS row_count FROM public.command_center_events
UNION ALL
SELECT 'admins' AS table_name, count(*) AS row_count FROM public.admins;
