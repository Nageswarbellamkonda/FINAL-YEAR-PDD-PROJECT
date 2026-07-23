import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getDashboardPath } from '@/lib/authRouting';
import { getRequiredRolesForPath } from '@/lib/rbacRoutes';
import { Loader2 } from 'lucide-react';

/**
 * Protects routes requiring authentication, completed profile, and optional role.
 */
export default function RoleRoute({
  children,
  allowedRoles = null,
  requireProfile = true,
  redirectTo = '/login',
}) {
  const { isAuthenticated, isLoadingAuth, profile, user } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  if (requireProfile && !profile?.profile_completed) {
    // Complete Profile page removed — redirect to register so users can create a full profile
    return <Navigate to="/register" replace />;
  }

  const roles = allowedRoles ?? getRequiredRolesForPath(location.pathname);
  if (roles && profile?.role && !roles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

/**
 * Complete-profile page: requires auth but redirects if profile already done.
 */
export function ProfileCompletionRoute({ children }) {
  const { isAuthenticated, isLoadingAuth, profile, user } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (profile?.profile_completed === true) {
    return <Navigate to={getDashboardPath(profile.role)} replace />;
  }

  return children;
}
