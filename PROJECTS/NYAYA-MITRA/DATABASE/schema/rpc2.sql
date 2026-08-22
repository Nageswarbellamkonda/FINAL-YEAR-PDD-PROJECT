CREATE OR REPLACE FUNCTION get_analytics_page_data(days INT DEFAULT 30)
RETURNS JSONB AS $$
DECLARE
  res JSONB;
  trend_data JSONB;
  category_data JSONB;
  priority_data JSONB;
  dept_data JSONB;
  stats_data JSONB;
BEGIN
  -- Trend Data
  WITH dates AS (
    SELECT generate_series(CURRENT_DATE - (days - 1), CURRENT_DATE, '1 day'::interval)::DATE AS d
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', to_char(d.d, 'DD Mon'),
      'complaints', (SELECT COUNT(*) FROM public.complaints WHERE DATE(created_at) = d.d)
    )
  ) INTO trend_data FROM dates d;

  -- Category Data
  SELECT jsonb_agg(jsonb_build_object('name', REPLACE(COALESCE(complaint_type, 'other'), '_', ' '), 'value', count)) 
  INTO category_data
  FROM (
    SELECT complaint_type, COUNT(*) as count 
    FROM public.complaints 
    WHERE created_at >= CURRENT_DATE - days 
    GROUP BY complaint_type
    ORDER BY count DESC
  ) t;

  -- Priority Data
  SELECT jsonb_build_array(
    jsonb_build_object('name', 'Critical', 'value', COUNT(*) FILTER (WHERE priority = 'critical'), 'color', '#e53935'),
    jsonb_build_object('name', 'High', 'value', COUNT(*) FILTER (WHERE priority = 'high'), 'color', '#ff6f00'),
    jsonb_build_object('name', 'Normal', 'value', COUNT(*) FILTER (WHERE priority = 'normal'), 'color', '#0288d1'),
    jsonb_build_object('name', 'Low', 'value', COUNT(*) FILTER (WHERE priority = 'low'), 'color', '#43a047')
  ) INTO priority_data
  FROM public.complaints WHERE created_at >= CURRENT_DATE - days;

  -- Dept Data (Police Station)
  SELECT jsonb_agg(jsonb_build_object('name', COALESCE(police_station, 'general'), 'value', count)) 
  INTO dept_data
  FROM (
    SELECT police_station, COUNT(*) as count 
    FROM public.complaints 
    WHERE created_at >= CURRENT_DATE - days 
    GROUP BY police_station
    ORDER BY count DESC
  ) t;

  -- Stats Data
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'resolved', COUNT(*) FILTER (WHERE status IN ('resolved', 'closed')),
    'pending', COUNT(*) FILTER (WHERE status IN ('filed', 'under_review')),
    'escalated', 0, -- Set to 0 or calculate if you add is_escalated column later
    'critical', COUNT(*) FILTER (WHERE priority = 'critical')
  ) INTO stats_data
  FROM public.complaints WHERE created_at >= CURRENT_DATE - days;

  res := jsonb_build_object(
    'trendData', COALESCE(trend_data, '[]'::jsonb),
    'categoryData', COALESCE(category_data, '[]'::jsonb),
    'priorityData', COALESCE(priority_data, '[]'::jsonb),
    'deptData', COALESCE(dept_data, '[]'::jsonb),
    'stats', COALESCE(stats_data, '{}'::jsonb)
  );

  RETURN res;
END;
$$ LANGUAGE plpgsql;
