import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getDashboardPath, roleMatchesAllowed } from '@/lib/authRouting';
import { Loader2 } from 'lucide-react';

/**
 * HOC to protect dashboard pages with authentication and role-based access.
 * Usage: export default withDashboardProtection(CitizenDashboard, 'citizen');
 */
export function withDashboardProtection(Component, allowedRoles = null) {
  return function ProtectedDashboard(props) {
    const navigate = useNavigate();
    const { isAuthenticated, isLoadingAuth, profile, user } = useAuth();

    useEffect(() => {
      if (isLoadingAuth) return;

      // Not authenticated
      if (!isAuthenticated || !user) {
        navigate('/login', { replace: true });
        return;
      }

      // Profile not completed
      if (profile && profile.profile_completed === false) {
        navigate('/complete-profile', { replace: true });
        return;
      }

      // Role-based access control
      if (allowedRoles && !Array.isArray(allowedRoles)) {
        allowedRoles = [allowedRoles];
      }

      if (allowedRoles && allowedRoles.length > 0) {
        const userRole = (profile?.role || profile?.user_type || user?.user_metadata?.requested_role || user?.user_metadata?.role || 'citizen').toLowerCase();
        if (!roleMatchesAllowed(userRole, allowedRoles)) {
          // User's role doesn't match - redirect to their correct dashboard
          navigate(getDashboardPath(userRole), { replace: true });
          return;
        }
      }
    }, [isAuthenticated, isLoadingAuth, profile, user, navigate, allowedRoles]);

    if (isLoadingAuth) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!isAuthenticated || !user || !profile?.profile_completed) {
      return null;
    }

    return <Component {...props} />;
  };
}

export default withDashboardProtection;
