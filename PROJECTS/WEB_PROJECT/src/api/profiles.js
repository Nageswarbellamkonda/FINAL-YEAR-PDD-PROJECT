import { supabase } from '@/lib/supabase';
import { AUTH_ROLES } from '@/lib/authRouting';

/**
 * Upsert user_profiles + role-specific extension table in one transaction-like flow.
 */
export async function saveCompleteProfile(userId, email, form) {
  const userRow = {
    id: userId,
    email,
    role: form.role,
    phone: form.phone,
    district: form.district,
    mandal: form.mandal || null,
    police_station: form.station || null,
    designation: form.designation || null,
    department: form.department || null,
    profile_completed: true,
    updated_at: new Date().toISOString(),
  };

  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert(userRow, { onConflict: 'id' });

  if (profileError) return { error: profileError };

  const roleError = await upsertRoleProfile(userId, form);
  if (roleError) return { error: roleError };

  await logActivity(userId, 'profile_completed', 'user_profiles', userId, { role: form.role });

  return { error: null };
}

async function upsertRoleProfile(userId, form) {
  switch (form.role) {
    case AUTH_ROLES.CITIZEN: {
      const { error } = await supabase.from('citizen_profiles').upsert(
        {
          user_id: userId,
          preferred_language: 'en',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
      return error;
    }
    case AUTH_ROLES.POLICE_OFFICER:
    case AUTH_ROLES.STATION_OFFICER:
    case AUTH_ROLES.DSP: {
      const { error } = await supabase.from('police_profiles').upsert(
        {
          user_id: userId,
          jurisdiction_level:
            form.role === AUTH_ROLES.DSP
              ? 'district'
              : form.role === AUTH_ROLES.STATION_OFFICER
                ? 'station'
                : 'station',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
      return error;
    }
    case AUTH_ROLES.LAWYER: {
      const { error } = await supabase.from('lawyer_profiles').upsert(
        { user_id: userId, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
      return error;
    }
    case AUTH_ROLES.COURT_OFFICER: {
      const { error } = await supabase.from('court_profiles').upsert(
        {
          user_id: userId,
          court_type: form.designation || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
      return error;
    }
    case AUTH_ROLES.ADMINISTRATOR: {
      const { error } = await supabase.from('admins').upsert(
        {
          user_id: userId,
          admin_level: 'standard',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
      return error;
    }
    default:
      return null;
  }
}

export async function fetchUserProfile(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return { data, error };
}

export async function logActivity(userId, action, entityType, entityId, metadata = {}) {
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
}
