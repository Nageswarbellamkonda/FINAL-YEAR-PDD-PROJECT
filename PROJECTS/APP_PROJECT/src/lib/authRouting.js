/**
 * Role → dashboard path (Supabase user_profiles.role)
 */
export const AUTH_ROLES = {
  CITIZEN: 'citizen',
  POLICE_OFFICER: 'police_officer',
  STATION_OFFICER: 'station_officer',
  DSP: 'dsp',
  DGP: 'dgp',
  CYBER_OPS: 'cyber_ops',
  CYBER_OFFICER: 'cyber_officer',
  LAWYER: 'lawyer',
  COURT_OFFICER: 'court_officer',
  ADMINISTRATOR: 'administrator',
  SYSTEM_ADMIN: 'system_admin',
};

/**
 * Normalizes role string (including aliases) to canonical AUTH_ROLES value.
 */
export function normalizeAuthRole(role) {
  const r = (role || '').trim().toLowerCase();
  if (!r) return AUTH_ROLES.CITIZEN;
  if (['police_officer', 'police', 'constable'].includes(r)) return AUTH_ROLES.POLICE_OFFICER;
  if (['station_officer', 'station', 'station_admin', 'si', 'ci'].includes(r)) return AUTH_ROLES.STATION_OFFICER;
  if (['dsp', 'sp'].includes(r)) return AUTH_ROLES.DSP;
  if (['dgp', 'adg', 'ig', 'dig', 'commissioner'].includes(r)) return AUTH_ROLES.DGP;
  if (['cyber_ops', 'cyber_officer'].includes(r)) return AUTH_ROLES.CYBER_OPS;
  if (r === 'lawyer') return AUTH_ROLES.LAWYER;
  if (['court', 'court_officer', 'judge'].includes(r)) return AUTH_ROLES.COURT_OFFICER;
  if (['administrator', 'admin'].includes(r)) return AUTH_ROLES.ADMINISTRATOR;
  if (r === 'system_admin') return AUTH_ROLES.SYSTEM_ADMIN;
  if (['citizen', 'user'].includes(r)) return AUTH_ROLES.CITIZEN;
  return r;
}

/**
 * Checks if user's role satisfies allowed roles, taking aliases into account.
 */
export function roleMatchesAllowed(userRole, allowedRoles) {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  const canonical = normalizeAuthRole(userRole);
  const raw = (userRole || '').trim().toLowerCase();
  return allowedRoles.some((allowed) => {
    const a = (allowed || '').trim().toLowerCase();
    return a === raw || a === canonical || normalizeAuthRole(a) === canonical;
  });
}

export function getDashboardPath(role) {
  const canonical = normalizeAuthRole(role);
  switch (canonical) {
    case AUTH_ROLES.POLICE_OFFICER:
      return '/officer-dashboard';
    case AUTH_ROLES.STATION_OFFICER:
      return '/station-dashboard';
    case AUTH_ROLES.DSP:
      return '/dsp-dashboard';
    case AUTH_ROLES.DGP:
      return '/dgp-dashboard';
    case AUTH_ROLES.CYBER_OPS:
    case AUTH_ROLES.CYBER_OFFICER:
      return '/cyber-ops';
    case AUTH_ROLES.LAWYER:
      return '/lawyer-dashboard';
    case AUTH_ROLES.COURT_OFFICER:
      return '/court-dashboard';
    case AUTH_ROLES.ADMINISTRATOR:
      return '/admin-panel';
    case AUTH_ROLES.SYSTEM_ADMIN:
      return '/system-admin';
    case AUTH_ROLES.CITIZEN:
    default:
      return '/citizen-dashboard';
  }
}

export function isPoliceRole(role) {
  const canonical = normalizeAuthRole(role);
  return [AUTH_ROLES.POLICE_OFFICER, AUTH_ROLES.STATION_OFFICER, AUTH_ROLES.DSP, AUTH_ROLES.DGP].includes(canonical);
}
