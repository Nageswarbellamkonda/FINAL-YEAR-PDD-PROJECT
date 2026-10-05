import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, KeyRound } from 'lucide-react';

import { getResetPasswordUrl } from '@/lib/config';

export default function ForgotPassword() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [error, setError] = useState('');
  const [emailSentMessage, setEmailSentMessage] = useState('');

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return lang === 'te' ? 'పాస్‌వర్డ్ కనీసం 8 అక్షరాలు ఉండాలి' : 'Password must be at least 8 characters.';
    if (!/[a-zA-Z]/.test(pwd)) return lang === 'te' ? 'పాస్‌వర్డ్‌లో అక్షరాలు ఉండాలి' : 'Password must contain letters.';
    if (!/[0-9]/.test(pwd)) return lang === 'te' ? 'పాస్‌వర్డ్‌లో సంఖ్యలు ఉండాలి' : 'Password must contain numbers.';
    return null;
  };

  const handleSendResetEmail = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError(lang === 'te' ? 'దయచేసి ఇమెయిల్ నమోదు చేయండి' : 'Please enter your email address first.');
      return;
    }
    setSendingEmail(true);
    setError('');
    setEmailSentMessage('');
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: getResetPasswordUrl()
      });
      if (resetErr) {
        if (resetErr.message?.includes('rate limit')) {
          setError(lang === 'te' ? 'ఇమెయిల్ పంపడం రేట్-పరిమితికి చేరింది. దయచేసి క్రింద ఉన్న ఫారమ్‌ను ఉపయోగించి నేరుగా నవీకరించండి.' : 'Email delivery is currently rate-limited by Supabase. You can update your password directly using the form below.');
        } else {
          setError(resetErr.message);
        }
      } else {
        setEmailSentMessage(lang === 'te' ? 'రీసెట్ లింక్ మీ ఇమెయిల్‌కి పంపబడింది. దయచేసి ఇన్‌బాక్స్ తనిఖీ చేయండి.' : 'Recovery link sent! Please check your inbox and click the link to reset your password.');
      }
    } catch (e) {
      setError(e.message || 'Failed to send recovery email.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !newPassword || !confirmPassword) return;

    setError('');
    setEmailSentMessage('');
    
    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(lang === 'te' ? 'పాస్‌వర్డ్‌లు సరిపోలడం లేదు' : 'Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // Pass both 'password' and 'newPassword' so edge function requirements are satisfied
      const { data, error: invokeError } = await supabase.functions.invoke('reset-password', {
        body: {
          email: cleanEmail,
          password: newPassword,
          newPassword,
          confirmPassword
        }
      });

      if (invokeError) {
        throw invokeError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setLoading(false);
      navigate('/login?reset=1', { replace: true });
    } catch (err) {
      setLoading(false);
      console.error('[ForgotPassword] Update error:', err);
      setError(err.message || (lang === 'te' ? 'పనిలో లోపం జరిగింది' : 'An error occurred.'));
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-background">
      <Link to="/login" className="fixed top-20 left-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground bg-card border border-border rounded-lg px-3 py-2 shadow-sm transition z-40">
        <ArrowLeft className="w-4 h-4" /> Back to Login
      </Link>

      <div className="max-w-md w-full">
        <Card className="border border-border bg-card shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-2 bg-muted/30">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
              <KeyRound className="w-6 h-6" />
            </div>
            <CardTitle className="font-heading text-2xl font-bold tracking-tight">
              {lang === 'te' ? 'పాస్‌వర్డ్ నవీకరించండి' : 'Change Password'}
            </CardTitle>
            <CardDescription className="text-sm mt-1.5 text-muted-foreground">
              {lang === 'te' 
                ? 'మీ ఖాతాను నవీకరించడానికి మీ ప్రస్తుత పాస్‌వర్డ్ మరియు కొత్త పాస్‌వర్డ్ నమోదు చేయండి' 
                : 'Enter your current password to set a new password.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cp-email">
                  {lang === 'te' ? 'ఇమెయిల్ చిరునామా' : 'Email Address'}
                </Label>
                <Input 
                  id="cp-email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="name@example.com"
                  required 
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cp-new">
                  {lang === 'te' ? 'కొత్త పాస్‌వర్డ్' : 'New Password'}
                </Label>
                <Input 
                  id="cp-new" 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  className="h-11"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cp-confirm">
                  {lang === 'te' ? 'కొత్త పాస్‌వర్డ్ నిర్ధారించండి' : 'Confirm Password'}
                </Label>
                <Input 
                  id="cp-confirm" 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  className="h-11"
                  placeholder="••••••••"
                />
              </div>

              {emailSentMessage && (
                <p className="text-sm text-green-700 text-center font-medium bg-green-50 p-2.5 rounded-md border border-green-200">
                  {emailSentMessage}
                </p>
              )}

              {error && <p className="text-sm text-red-600 text-center font-medium bg-red-50 p-2 rounded-md">{error}</p>}

              <Button type="submit" className="w-full h-11 mt-2" disabled={loading || !email || !newPassword || !confirmPassword}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {lang === 'te' ? 'నవీకరించండి' : 'Update Password'}
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={sendingEmail || !email}
                  className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1 disabled:opacity-50"
                >
                  {sendingEmail && <Loader2 className="w-3 h-3 animate-spin" />}
                  {lang === 'te' ? 'లేదా ఇమెయిల్‌కి రికవరీ లింక్ పంపండి' : 'Or send recovery link to my email'}
                </button>
              </div>
            </form>
            
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
