import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        // Parse hash/query params in case tokens were passed directly
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const queryParams = new URLSearchParams(window.location.search);
        const type = hashParams.get('type') || queryParams.get('type');
        const accessToken = hashParams.get('access_token');

        // Check if there is already an active session
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user || accessToken || type === 'recovery') {
          if (mounted) setHasRecoverySession(true);
        } else {
          if (mounted) setHasRecoverySession(false);
        }
      } catch (err) {
        console.warn('[ResetPassword] Session check error:', err);
        if (mounted) setHasRecoverySession(false);
      } finally {
        if (mounted) setCheckingSession(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY' || session?.user) {
        setHasRecoverySession(true);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  const validatePassword = (pwd) => {
    if (pwd.length < 8) {
      return lang === 'te'
        ? 'పాస్‌వర్డ్ కనీసం 8 అక్షరాలు ఉండాలి'
        : 'Password must be at least 8 characters.';
    }
    if (!/[a-zA-Z]/.test(pwd)) {
      return lang === 'te'
        ? 'పాస్‌వర్డ్‌లో అక్షరాలు ఉండాలి'
        : 'Password must contain letters.';
    }
    if (!/[0-9]/.test(pwd)) {
      return lang === 'te'
        ? 'పాస్‌వర్డ్‌లో సంఖ్యలు ఉండాలి'
        : 'Password must contain numbers.';
    }
    return null;
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;

    setError('');

    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        lang === 'te'
          ? 'పాస్‌వర్డ్‌లు సరిపోలడం లేదు'
          : 'Passwords do not match.'
      );
      return;
    }

    setLoading(true);

    try {
      // Direct Supabase Auth updateUser for the recovery session
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      // Clean up the recovery session state cleanly
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (ignore) {}

      setTimeout(() => {
        navigate('/login?reset=1', { replace: true });
      }, 1500);
    } catch (err) {
      console.error('[ResetPassword] Update error:', err);
      setError(err?.message || (lang === 'te' ? 'పాస్‌వర్డ్ నవీకరణ విఫలమైంది' : 'Failed to update password.'));
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {lang === 'te' ? 'సెషన్ ధృవీకరిస్తోంది…' : 'Verifying recovery session…'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-background">
      <Link
        to="/login"
        className="fixed top-20 left-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground bg-card border border-border rounded-lg px-3 py-2 shadow-sm transition z-40"
      >
        <ArrowLeft className="w-4 h-4" /> {lang === 'te' ? 'లాగిన్‌కి తిరిగి వెళ్లండి' : 'Back to Login'}
      </Link>

      <div className="max-w-md w-full">
        <Card className="border border-border bg-card shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-2 bg-muted/30">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
              <KeyRound className="w-6 h-6" />
            </div>
            <CardTitle className="font-heading text-2xl font-bold tracking-tight">
              {lang === 'te' ? 'కొత్త పాస్‌వర్డ్ సెట్ చేయండి' : 'Set New Password'}
            </CardTitle>
            <CardDescription className="text-sm mt-1.5 text-muted-foreground">
              {lang === 'te'
                ? 'మీ ఖాతా కోసం బలమైన కొత్త పాస్‌వర్డ్‌ను నమోదు చేయండి'
                : 'Enter your new password below to secure your account.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {!hasRecoverySession && !success ? (
              <div className="space-y-4">
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        {lang === 'te' ? 'చెల్లని లేదా గడువు ముగిసిన రికవరీ లింక్' : 'Invalid or Expired Link'}
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        {lang === 'te'
                          ? 'పాస్‌వర్డ్ రీసెట్ చేయడానికి దయచేసి మళ్లీ అభ్యర్థించండి.'
                          : 'No active recovery session was found. Please request a fresh reset link or use the change password form.'}
                      </p>
                    </div>
                  </div>
                </div>
                <Button asChild className="w-full h-11">
                  <Link to="/forgot-password">
                    {lang === 'te' ? 'కొత్త లింక్ అభ్యర్థించండి' : 'Request New Reset Link'}
                  </Link>
                </Button>
              </div>
            ) : success ? (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
                <p className="text-sm font-semibold text-green-800">
                  {lang === 'te' ? 'పాస్‌వర్డ్ విజయవంతంగా నవీకరించబడింది!' : 'Password updated successfully!'}
                </p>
                <p className="text-xs text-green-700">
                  {lang === 'te' ? 'లాగిన్ పేజీకి దారి మళ్లిస్తోంది…' : 'Redirecting to login page…'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="rp-new">
                    {lang === 'te' ? 'కొత్త పాస్‌వర్డ్' : 'New Password'}
                  </Label>
                  <Input
                    id="rp-new"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="h-11"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rp-confirm">
                    {lang === 'te' ? 'కొత్త పాస్‌వర్డ్ నిర్ధారించండి' : 'Confirm Password'}
                  </Label>
                  <Input
                    id="rp-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-11"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 text-center font-medium bg-red-50 p-2 rounded-md">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 mt-2"
                  disabled={loading || !newPassword || !confirmPassword}
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {lang === 'te' ? 'పాస్‌వర్డ్ నవీకరించండి' : 'Update Password'}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                <span className="mr-1">{lang === 'te' ? 'ఖాతా గుర్తుందా?' : 'Remember your password?'}</span>
                <Link to="/login" className="text-primary font-medium hover:underline">
                  {lang === 'te' ? 'లాగిన్' : 'Log in'}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
