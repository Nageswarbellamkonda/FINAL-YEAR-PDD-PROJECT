import { AUTH_ROLES, getDashboardPath } from '@/lib/authRouting';

/** Dashboard path → allowed roles (must match getDashboardPath keys) */
export const DASHBOARD_ROUTE_ACCESS = {
  '/citizen-dashboard': [AUTH_ROLES.CITIZEN],
  '/officer-dashboard': [AUTH_ROLES.POLICE_OFFICER],
  '/station-dashboard': [AUTH_ROLES.STATION_OFFICER],
  '/dsp-dashboard': [AUTH_ROLES.DSP],
  '/lawyer-dashboard': [AUTH_ROLES.LAWYER],
  '/court-dashboard': [AUTH_ROLES.COURT_OFFICER],
  '/admin-panel': [AUTH_ROLES.ADMINISTRATOR],
  '/dgp-dashboard': [AUTH_ROLES.DSP, AUTH_ROLES.ADMINISTRATOR],
};

/** Routes any authenticated user with completed profile may access */
export const AUTHENTICATED_SHARED_ROUTES = [
  '/dashboard',
  '/case-management',
  '/case-chat',
  '/attendance',
  '/feedback',
  '/notifications',
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
