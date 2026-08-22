-- Run this script in your Supabase SQL Editor to enable direct password resets without email verification

-- Ensure the pgcrypto extension is installed
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION admin_reset_password(user_email text, new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as database admin
SET search_path = public, extensions
AS $$
BEGIN
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf'))
  WHERE email = user_email;
  
  -- Return true if a row was updated
  IF FOUND THEN
    RETURN true;
  ELSE
    RAISE EXCEPTION 'User with this email not found';
  END IF;
END;
$$;

-- Grant execute permissions to anon and authenticated roles for the frontend to call it
GRANT EXECUTE ON FUNCTION admin_reset_password(text, text) TO anon, authenticated;
