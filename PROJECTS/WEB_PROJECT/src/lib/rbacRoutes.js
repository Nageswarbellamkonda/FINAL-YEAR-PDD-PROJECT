import { AUTH_ROLES, getDashboardPath } from '@/lib/authRouting';

/** Dashboard path → allowed roles (must match getDashboardPath keys) */
export const DASHBOARD_ROUTE_ACCESS = {
  '/citizen-dashboard': [AUTH_ROLES.CITIZEN],
  '/officer-dashboard': [AUTH_ROLES.POLICE_OFFICER, 'police', 'constable', AUTH_ROLES.STATION_OFFICER, AUTH_ROLES.DSP, AUTH_ROLES.DGP, AUTH_ROLES.ADMINISTRATOR],
  '/station-dashboard': [AUTH_ROLES.STATION_OFFICER, 'station', 'station_admin', 'si', 'ci', AUTH_ROLES.POLICE_OFFICER, 'police', AUTH_ROLES.DSP, AUTH_ROLES.DGP, AUTH_ROLES.ADMINISTRATOR],
  '/dsp-dashboard': [AUTH_ROLES.DSP, 'sp', AUTH_ROLES.DGP, AUTH_ROLES.ADMINISTRATOR],
  '/lawyer-dashboard': [AUTH_ROLES.LAWYER],
  '/court-dashboard': [AUTH_ROLES.COURT_OFFICER, 'court', 'judge'],
  '/admin-panel': [AUTH_ROLES.ADMINISTRATOR, 'admin', AUTH_ROLES.SYSTEM_ADMIN],
  '/dgp-dashboard': [AUTH_ROLES.DGP, 'adg', 'ig', 'dig', 'commissioner', AUTH_ROLES.ADMINISTRATOR, AUTH_ROLES.SYSTEM_ADMIN],
  '/cyber-ops': [AUTH_ROLES.CYBER_OPS, 'cyber_officer', AUTH_ROLES.DSP, AUTH_ROLES.DGP, AUTH_ROLES.ADMINISTRATOR, AUTH_ROLES.SYSTEM_ADMIN, AUTH_ROLES.POLICE_OFFICER, 'police'],
  '/duty-management': [AUTH_ROLES.POLICE_OFFICER, 'police', AUTH_ROLES.STATION_OFFICER, 'si', 'ci', AUTH_ROLES.DSP, AUTH_ROLES.DGP, AUTH_ROLES.ADMINISTRATOR, AUTH_ROLES.SYSTEM_ADMIN],
};

/** Routes any authenticated user with completed profile may access */
export const AUTHENTICATED_SHARED_ROUTES = [
  '/dashboard',
  '/case-management',
  '/case-chat',
  '/attendance',
  '/feedback',
  '/notifications',
  '/crime-heat-map',
  '/performance-dashboard',
  '/unified-dashboard',
  '/activity-log',
  '/duty-management',
];

export function roleCanAccessPath(role, pathname) {
  const normalized = pathname.replace(/\/$/, '') || '/';
  const allowed = DASHBOARD_ROUTE_ACCESS[normalized];
  if (allowed) return allowed.includes(role);
  if (AUTHENTICATED_SHARED_ROUTES.some((r) => normalized.startsWith(r))) return true;
  return true;
}

export function getRequiredRolesForPath(pathname) {
  const normalized = pathname.replace(/\/$/, '') || '/';
  return DASHBOARD_ROUTE_ACCESS[normalized] || null;
}

export function redirectPathForRole(role) {
  return getDashboardPath(role);
}
