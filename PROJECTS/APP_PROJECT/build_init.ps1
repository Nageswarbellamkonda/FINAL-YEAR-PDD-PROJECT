$mig_file = "c:\PDD WEB PROJECT\supabase\migrations\20240722000000_init.sql"
New-Item -Path $mig_file -ItemType File -Force

# 1. Profiles
$profiles_sql = @"
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'citizen',
  email TEXT,
  full_name TEXT,
  phone TEXT,
  profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.citizen_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.police_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  badge_number TEXT,
  rank TEXT,
  jurisdiction_level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.lawyer_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.court_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  court_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.admins (
  user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  admin_level TEXT NOT NULL DEFAULT 'standard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
"@
Set-Content -Path $mig_file -Value $profiles_sql

# 2. Complaints
Get-Content "c:\PDD WEB PROJECT\database\complaints.sql" | Add-Content $mig_file

# 3. Cyber Cases
Get-Content "c:\PDD WEB PROJECT\database\cyber_cases.sql" | Add-Content $mig_file

# 4. Stubs
$stubs_sql = @"
CREATE TABLE IF NOT EXISTS public.evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    fir_id UUID,
    evidence_type TEXT,
    description TEXT,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.station_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type TEXT,
    severity TEXT,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.duty_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_date DATE,
    shift_type TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_date DATE,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.fir_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    fir_number TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.trusted_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    entity_type TEXT,
    entity_id UUID,
    action TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    message TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
"@
Add-Content -Path $mig_file -Value $stubs_sql

# 5. Schema
Get-Content "c:\PDD WEB PROJECT\database\schema.sql" | Add-Content $mig_file

# 6. Bridge columns needed by modules
$bridge_sql = @"
ALTER TABLE public.missing_persons 
ADD COLUMN IF NOT EXISTS case_number TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS assigned_team TEXT;

DO `$`$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'missing_persons_case_number_key') THEN
        ALTER TABLE public.missing_persons ADD CONSTRAINT missing_persons_case_number_key UNIQUE (case_number);
    END IF;
END `$`$;

ALTER TABLE public.patrol_logs
ADD COLUMN IF NOT EXISTS patrol_unit TEXT,
ADD COLUMN IF NOT EXISTS vehicle_number TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS route_name TEXT,
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS incidents_checked INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS km_covered NUMERIC(6, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS officer_in_charge TEXT;

ALTER TABLE public.command_center_events
ADD COLUMN IF NOT EXISTS event_code TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS event_type TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS severity TEXT,
ADD COLUMN IF NOT EXISTS assigned_units JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS details TEXT;

DO `$`$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'command_center_events_event_code_key') THEN
        ALTER TABLE public.command_center_events ADD CONSTRAINT command_center_events_event_code_key UNIQUE (event_code);
    END IF;
END `$`$;
"@
Add-Content -Path $mig_file -Value $bridge_sql

# 7. Modules
$order = @("officers.sql", "missing_persons.sql", "patrol_logs.sql", "women_safety.sql", "command_center.sql")
foreach ($file in $order) {
    Get-Content ("c:\PDD WEB PROJECT\database\" + $file) | Add-Content $mig_file
}

# 8. Rest
$rest = @("indexes.sql", "views.sql", "functions.sql", "triggers.sql", "policies.sql")
foreach ($file in $rest) {
    Get-Content ("c:\PDD WEB PROJECT\database\" + $file) | Add-Content $mig_file
}
