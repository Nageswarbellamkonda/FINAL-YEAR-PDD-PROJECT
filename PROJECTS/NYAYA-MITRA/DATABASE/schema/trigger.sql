CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
  extracted_role TEXT;
  extracted_name TEXT;
BEGIN
  -- Extract role from metadata, default to citizen
  extracted_role := COALESCE(new.raw_user_meta_data->>'requested_role', new.raw_user_meta_data->>'role', 'citizen');
  -- Extract name from metadata
  extracted_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Unknown User');

  -- Insert into master profile table
  INSERT INTO public.user_profiles (id, email, full_name, role, profile_completed)
  VALUES (new.id, new.email, extracted_name, extracted_role, true)
  ON CONFLICT (id) DO NOTHING;

  -- Insert into specific role tables based on extracted role
  IF extracted_role = 'citizen' THEN
    INSERT INTO public.citizen_profiles (user_id) VALUES (new.id) ON CONFLICT DO NOTHING;
  ELSIF extracted_role IN ('police_officer', 'station_officer', 'dsp', 'dgp', 'cyber_ops') THEN
    INSERT INTO public.police_profiles (user_id) VALUES (new.id) ON CONFLICT DO NOTHING;
  ELSIF extracted_role = 'lawyer' THEN
    INSERT INTO public.lawyer_profiles (user_id) VALUES (new.id) ON CONFLICT DO NOTHING;
  ELSIF extracted_role = 'court_officer' THEN
    INSERT INTO public.court_profiles (user_id) VALUES (new.id) ON CONFLICT DO NOTHING;
  ELSIF extracted_role IN ('administrator', 'system_admin') THEN
    INSERT INTO public.admins (user_id, admin_level) VALUES (new.id, CASE WHEN extracted_role = 'system_admin' THEN 'super' ELSE 'standard' END) ON CONFLICT DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
