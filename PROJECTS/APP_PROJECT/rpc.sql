CREATE TABLE IF NOT EXISTS public.public_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    district TEXT NOT NULL,
    title_en TEXT NOT NULL,
    title_te TEXT,
    desc_en TEXT NOT NULL,
    desc_te TEXT,
    badge TEXT,
    badge_color TEXT,
    icon_color TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RPC for dashboard metrics
CREATE OR REPLACE FUNCTION get_dashboard_metrics(p_role TEXT, p_district TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  res JSONB;
  total_cases INT;
  resolved_cases INT;
  pending_cases INT;
  critical_cases INT;
  alerts_count INT;
  duties_count INT;
BEGIN
  -- Build queries dynamically or use simple IFs based on district focus
  IF p_district IS NULL OR p_district = 'All' THEN
    SELECT COUNT(*) INTO total_cases FROM public.complaints;
    SELECT COUNT(*) INTO resolved_cases FROM public.complaints WHERE status IN ('resolved', 'closed');
    SELECT COUNT(*) INTO pending_cases FROM public.complaints WHERE status IN ('filed', 'under_review');
    SELECT COUNT(*) INTO critical_cases FROM public.complaints WHERE priority = 'critical' AND status NOT IN ('resolved', 'closed');
  ELSE
    SELECT COUNT(*) INTO total_cases FROM public.complaints WHERE district = p_district;
    SELECT COUNT(*) INTO resolved_cases FROM public.complaints WHERE district = p_district AND status IN ('resolved', 'closed');
    SELECT COUNT(*) INTO pending_cases FROM public.complaints WHERE district = p_district AND status IN ('filed', 'under_review');
    SELECT COUNT(*) INTO critical_cases FROM public.complaints WHERE district = p_district AND priority = 'critical' AND status NOT IN ('resolved', 'closed');
  END IF;

  SELECT COUNT(*) INTO alerts_count FROM public.station_alerts WHERE is_active = true;
  SELECT COUNT(*) INTO duties_count FROM public.duty_assignments WHERE duty_date = CURRENT_DATE;

  res := jsonb_build_object(
    'total', total_cases,
    'resolved', resolved_cases,
    'pending', pending_cases,
    'critical', critical_cases,
    'active_alerts', alerts_count,
    'today_duties', duties_count
  );

  RETURN res;
END;
$$ LANGUAGE plpgsql;

-- RPC for analytics trends
CREATE OR REPLACE FUNCTION get_analytics_trends(days INT DEFAULT 14)
RETURNS JSONB AS $$
DECLARE
  res JSONB;
BEGIN
  WITH dates AS (
    SELECT generate_series(CURRENT_DATE - (days - 1), CURRENT_DATE, '1 day'::interval)::DATE AS d
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', to_char(d.d, 'DD Mon'),
      'complaints', (SELECT COUNT(*) FROM public.complaints WHERE DATE(created_at) = d.d)
    )
  ) INTO res
  FROM dates d;

  RETURN res;
END;
$$ LANGUAGE plpgsql;

-- RPC for category distribution
CREATE OR REPLACE FUNCTION get_category_distribution(days INT DEFAULT 30)
RETURNS JSONB AS $$
DECLARE
  res JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object('name', REPLACE(COALESCE(complaint_type, 'other'), '_', ' '), 'value', count)
  ) INTO res
  FROM (
    SELECT complaint_type, COUNT(*) as count 
    FROM public.complaints 
    WHERE created_at >= CURRENT_DATE - days 
    GROUP BY complaint_type
    ORDER BY count DESC
  ) t;
  
  RETURN res;
END;
$$ LANGUAGE plpgsql;

-- RPC for District Performance
CREATE OR REPLACE FUNCTION get_district_performance()
RETURNS JSONB AS $$
DECLARE
  res JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', district, 
      'total', total_c, 
      'resolved', resolved_c, 
      'rate', CASE WHEN total_c > 0 THEN ROUND((resolved_c::NUMERIC / total_c::NUMERIC) * 100) ELSE 0 END
    )
  ) INTO res
  FROM (
    SELECT COALESCE(district, 'Unknown') as district, 
           COUNT(*) as total_c, 
           COUNT(*) FILTER (WHERE status IN ('resolved', 'closed')) as resolved_c 
    FROM public.complaints 
    GROUP BY district
  ) t
  ORDER BY rate DESC;
  
  RETURN res;
END;
$$ LANGUAGE plpgsql;
