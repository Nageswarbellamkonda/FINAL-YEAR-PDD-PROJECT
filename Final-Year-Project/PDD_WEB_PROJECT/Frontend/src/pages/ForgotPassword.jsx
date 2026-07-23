import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

function extractErrorMessage(error) {
  if (!error) return null;
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.details) return error.details;
  if (error.error_description) return error.error_description;
  if (typeof error === 'object') {
    for (const key of ['msg', 'error', 'message', 'details', 'description']) {
      if (error[key] && typeof error[key] === 'string') {
        return error[key];
      }
    }
  }
  return JSON.stringify(error);
}

export default function ForgotPassword() {
  const { lang } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      setLoading(false);
      if (error) {
        const errorMsg = extractErrorMessage(error);
        setError(errorMsg || (lang === 'te' ? 'పాస్‌వర్డ్ రీసెట్ విఫలమైంది' : 'Password reset failed'));
        return;
      }
      setMessage(lang === 'te' ? 'పాస్‌వర్డ్ రీసెట్ లింక్ ఇమెయిల్‌కు పంపబడింది' : 'Password reset link sent to your email');
    } catch (e) {
      setLoading(false);
      setError(lang === 'te' ? 'పనిలో లోపం జరిగింది' : 'An error occurred');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <Link to="/" className="fixed top-20 left-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground bg-card border border-border rounded-lg px-3 py-2 shadow-sm transition z-40">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-heading text-2xl">{lang === 'te' ? 'పాస్‌వర్డ్ మర్చిపోయారా?' : 'Forgot Password?'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fp-email">{lang === 'te' ? 'నిజమైన ఇమెయిల్ నమోదు చేయండి' : 'Enter your registered email'}</Label>
                <Input id="fp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              {message && <p className="text-sm text-green-700">{message}</p>}
              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {lang === 'te' ? 'రీసెట్ లింక్ పంపండి' : 'Send reset link'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              <Link to="/login" className="text-primary hover:underline">{lang === 'te' ? 'వినందులు' : 'Back to Login'}</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
