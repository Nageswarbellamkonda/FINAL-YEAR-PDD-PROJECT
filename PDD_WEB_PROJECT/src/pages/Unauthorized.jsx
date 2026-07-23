import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getDashboardPath } from '@/lib/authRouting';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function Unauthorized() {
  const { profile, isAuthenticated } = useAuth();
  const homePath = isAuthenticated && profile?.profile_completed
    ? getDashboardPath(profile.role)
    : '/';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-heading font-semibold">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have permission to view this page. Please sign in with the correct role or
            return to your dashboard.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default">
            <Link to={homePath}>Go to {isAuthenticated ? 'Dashboard' : 'Home'}</Link>
          </Button>
          {!isAuthenticated && (
            <Button asChild variant="outline">
              <Link to="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
