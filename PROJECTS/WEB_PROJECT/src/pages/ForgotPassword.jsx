import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { config } from '@/lib/config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, MailCheck, KeyRound } from 'lucide-react';

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
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      // Requested hardcoded redirect URL
      const redirectTo = "https://nageswarbellamkonda.github.io/FINAL-YEAR-PDD-PROJECT/reset-password";
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      
      setLoading(false);
      if (error) {
        const errorMsg = extractErrorMessage(error);
        setError(errorMsg || (lang === 'te' ? 'పాస్‌వర్డ్ రీసెట్ విఫలమైంది' : 'Password reset failed'));
        return;
      }
      
      setStep(2);
      setMessage(lang === 'te' 
        ? 'మీ ఇమెయిల్‌కు 6 అంకెల OTP పంపబడింది.' 
        : 'A 6-digit OTP has been sent to your email. Enter it below.');
    } catch (e) {
      setLoading(false);
      setError(lang === 'te' ? 'పనిలో లోపం జరిగింది' : 'An error occurred');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: 'recovery'
      });

      setLoading(false);
      if (error) {
        const errorMsg = extractErrorMessage(error);
        setError(errorMsg || (lang === 'te' ? 'చెల్లని OTP' : 'Invalid OTP. Please try again.'));
        return;
      }

      // OTP verified successfully, user now has a session.
      navigate('/reset-password');
    } catch (e) {
      setLoading(false);
      setError(lang === 'te' ? 'పనిలో లోపం జరిగింది' : 'An error occurred verifying OTP');
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
              {step === 1 ? <KeyRound className="w-6 h-6" /> : <MailCheck className="w-6 h-6" />}
            </div>
            <CardTitle className="font-heading text-2xl font-bold tracking-tight">
              {step === 1 
                ? (lang === 'te' ? 'పాస్‌వర్డ్ మర్చిపోయారా?' : 'Forgot Password?')
                : (lang === 'te' ? 'OTP నమోదు చేయండి' : 'Enter Verification Code')}
            </CardTitle>
            <CardDescription className="text-sm mt-1.5 text-muted-foreground">
              {step === 1
                ? (lang === 'te' ? 'పాస్‌వర్డ్ రీసెట్ చేయడానికి మీ ఇమెయిల్‌ను నమోదు చేయండి' : 'Enter your email to receive a password reset code')
                : (lang === 'te' ? `${email} కు పంపిన కోడ్‌ను నమోదు చేయండి` : `Enter the 6-digit code sent to ${email}`)}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {step === 1 ? (
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fp-email">
                    {lang === 'te' ? 'ఇమెయిల్ చిరునామా' : 'Email Address'}
                  </Label>
                  <Input 
                    id="fp-email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="name@example.com"
                    required 
                    className="h-11"
                  />
                </div>

                {error && <p className="text-sm text-red-600 text-center font-medium bg-red-50 p-2 rounded-md">{error}</p>}

                <Button type="submit" className="w-full h-11 mt-2" disabled={loading || !email}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {lang === 'te' ? 'OTP పంపండి' : 'Send Verification Code'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fp-otp">
                    {lang === 'te' ? '6 అంకెల OTP' : '6-Digit OTP Code'}
                  </Label>
                  <Input 
                    id="fp-otp" 
                    type="text" 
                    inputMode="numeric"
                    maxLength={6}
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    placeholder="123456"
                    className="h-11 text-center text-xl tracking-widest"
                    required 
                  />
                </div>

                {message && <p className="text-sm text-green-700 text-center font-medium bg-green-50 p-2 rounded-md">{message}</p>}
                {error && <p className="text-sm text-red-600 text-center font-medium bg-red-50 p-2 rounded-md">{error}</p>}

                <Button type="submit" className="w-full h-11 mt-2" disabled={loading || otp.length < 6}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {lang === 'te' ? 'OTP నిర్ధారించండి' : 'Verify Code'}
                </Button>

                <div className="text-center mt-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="text-sm text-muted-foreground h-auto p-0"
                    onClick={() => { setStep(1); setOtp(''); setError(''); setMessage(''); }}
                  >
                    {lang === 'te' ? 'వేరే ఇమెయిల్ ఉపయోగించండి' : 'Use a different email'}
                  </Button>
                </div>
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
