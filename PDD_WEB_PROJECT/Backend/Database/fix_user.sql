DO $$
DECLARE
  uid UUID;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'techarmy885@gmail.com';
  
  IF uid IS NOT NULL THEN
    INSERT INTO public.user_profiles (id, email, full_name, role, profile_completed)
    VALUES (uid, 'techarmy885@gmail.com', 'Tech Army Citizen', 'citizen', true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.citizen_profiles (user_id) VALUES (uid) ON CONFLICT DO NOTHING;
  END IF;
END $$;
