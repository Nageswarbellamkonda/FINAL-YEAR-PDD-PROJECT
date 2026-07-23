import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPassword() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(lang === 'te' ? 'పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి' : 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError(lang === 'te' ? 'పాస్‌వర్డ్‌లు సరిపోలడం లేదు' : 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      
      if (updateErr) {
        setError(updateErr.message || (lang === 'te' ? 'పాస్‌వర్డ్ నవీకరణ విఫలమైంది' : 'Password update failed'));
        setLoading(false);
        return;
      }

      // Logout user to force re-login with the new password
      await supabase.auth.signOut();
      
      toast.success(lang === 'te' ? 'పాస్‌వర్డ్ విజయవంతంగా నవీకరించబడింది' : 'Password updated successfully!');
      setLoading(false);
      navigate('/login?reset=1', { replace: true });
    } catch (err) {
      console.error(err);
      setError(lang === 'te' ? 'పనిలో లోపం జరిగింది' : 'An error occurred during password update');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-background">
      <div className="max-w-md w-full">
        <Card className="border border-border bg-card shadow-lg rounded-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-heading text-2xl font-bold tracking-tight">
              {lang === 'te' ? 'కొత్త పాస్‌వర్డ్ సెట్ చేయండి' : 'Reset Password'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1.5">
              {lang === 'te' 
                ? 'దయచేసి మీ కొత్త పాస్‌వర్డ్‌ను నమోదు చేయండి' 
                : 'Please enter your new password below'}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="rp-password">
                  {lang === 'te' ? 'కొత్త పాస్‌వర్డ్' : 'New Password'}
                </Label>
                <Input
                  id="rp-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rp-confirm">
                  {lang === 'te' ? 'పాస్‌వర్డ్ నిర్ధారించండి' : 'Confirm Password'}
                </Label>
                <Input
                  id="rp-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 text-center font-medium">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full h-11 mt-2" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {lang === 'te' ? 'పాస్‌వర్డ్ నవీకరించు' : 'Update Password'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              <Link to="/login" className="text-primary font-medium hover:underline">
                {lang === 'te' ? 'లాగిన్ పేజీకి తిరిగి వెళ్ళండి' : 'Back to Login'}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
