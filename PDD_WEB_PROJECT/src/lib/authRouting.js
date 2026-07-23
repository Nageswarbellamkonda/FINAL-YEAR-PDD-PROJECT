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
  LAWYER: 'lawyer',
  COURT_OFFICER: 'court_officer',
  ADMINISTRATOR: 'administrator',
  SYSTEM_ADMIN: 'system_admin',
};

export function getDashboardPath(role) {
  switch ((role || '').toLowerCase()) {
    case 'citizen':
      return '/citizen-dashboard';
    case 'police_officer':
      return '/officer-dashboard';
    case 'station_officer':
      return '/station-dashboard';
    case 'dsp':
      return '/dsp-dashboard';
    case 'dgp':
      return '/dgp-dashboard';
    case 'cyber_ops':
      return '/cyber-ops';
    case 'lawyer':
      return '/lawyer-dashboard';
    case 'court':
    case 'court_officer':
      return '/court-dashboard';
    case 'administrator':
      return '/admin-panel';
    case 'system_admin':
      return '/system-admin';
    default:
      return '/citizen-dashboard';
  }
}

export function isPoliceRole(role) {
  const r = (role || '').toLowerCase();
  return r === 'police_officer' || r === 'station_officer' || r === 'dsp' || r === 'dgp';
}
