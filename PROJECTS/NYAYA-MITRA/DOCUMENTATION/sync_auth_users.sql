-- Run this script in your Supabase SQL Editor if old credentials are not working.
-- This script ensures EVERY profile in user_profiles has a valid login account in auth.users.
-- It will set the password for all orphaned accounts to 'securepassword123' so you can login.

DO $$
DECLARE
    profile_record RECORD;
    new_user_id uuid;
BEGIN
    -- Loop through all user_profiles that DO NOT have a matching auth.users record
    FOR profile_record IN 
        SELECT p.id, p.email, p.role 
        FROM public.user_profiles p
        LEFT JOIN auth.users u ON u.email = p.email
        WHERE u.id IS NULL AND p.email IS NOT NULL
    LOOP
        -- Generate a new UUID for the auth.users record
        new_user_id := gen_random_uuid();
        
        -- Insert into GoTrue auth.users with 'securepassword123'
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, 
            raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, 
            email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', profile_record.email, 
            extensions.crypt('securepassword123', extensions.gen_salt('bf')), -- Default password
            now(), now(), now(), 
            '{"provider":"email","providers":["email"]}', 
            '{}', 
            now(), now(), '', '', '', ''
        );
        
        -- Insert into auth.identities
        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            new_user_id, new_user_id, format('{"sub":"%s","email":"%s"}', new_user_id::text, profile_record.email)::jsonb, 
            'email', now(), now(), now()
        );

        -- Update the user_profiles table to point to the new auth.users ID
        UPDATE public.user_profiles SET id = new_user_id WHERE email = profile_record.email;
        
        -- Update related profile tables just in case
        IF profile_record.role = 'citizen' THEN
            UPDATE public.citizen_profiles SET user_id = new_user_id WHERE user_id = profile_record.id;
        ELSIF profile_record.role IN ('police_officer', 'station_officer', 'dsp', 'dgp', 'cyber_ops') THEN
            UPDATE public.police_profiles SET user_id = new_user_id WHERE user_id = profile_record.id;
        ELSIF profile_record.role = 'lawyer' THEN
            UPDATE public.lawyer_profiles SET user_id = new_user_id WHERE user_id = profile_record.id;
        ELSIF profile_record.role = 'court_officer' THEN
            UPDATE public.court_profiles SET user_id = new_user_id WHERE user_id = profile_record.id;
        ELSIF profile_record.role IN ('administrator', 'system_admin') THEN
            UPDATE public.admins SET user_id = new_user_id WHERE user_id = profile_record.id;
        END IF;

    END LOOP;
END $$;
