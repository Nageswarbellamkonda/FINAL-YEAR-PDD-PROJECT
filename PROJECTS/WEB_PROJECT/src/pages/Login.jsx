import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { getDashboardPath } from "@/lib/authRouting";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const queryParams = new URLSearchParams(location.search);
  const verified = queryParams.get("verified") === "1";
  const reset = queryParams.get("reset") === "1";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError("");

    const { error: signInError, data, profile } = await signIn(email, password);
    setLoading(false);

    if (signInError) {
      let errorMsg = signInError.message || signInError.toString();
      if (typeof errorMsg !== 'string') {
        errorMsg = JSON.stringify(errorMsg);
      }
      setError(
        errorMsg ||
          (lang === "te" ? "లాగిన్ విఫలమైంది" : "Login failed. Check email, password, or verify your email.")
      );
      return;
    }

    // Check email verification — supabase may set email_confirmed_at or confirmed_at
    const userObj = data?.user ?? null;
    const emailConfirmed = !!(userObj?.email_confirmed_at || userObj?.confirmed_at || userObj?.email_confirmed);

    if (!emailConfirmed) {
      setError(lang === "te" ? "దయచేసి మీ ఇమెయిల్‌ను ధృవీకరించండి. ధృవీకరణ ఇమెయిల్ పంపబడింది." : "Please verify your email. A verification link was sent.");
      return;
    }

    if (!profile) {
      setError(lang === "te" ? "ప్రొఫైల్ నమోదు లేదు. దయచేసి రిజిస్టర్ చేయండి లేదా సపోర్ట్‌ను సంప్రదించండి." : "Profile not found. Please register or contact support.");
      return;
    }

    if (!profile.profile_completed) {
      navigate("/complete-profile", { replace: true });
      return;
    }

    // Profile exists, is completed, and email verified
    const returnTo = sessionStorage.getItem('auth_return_to');
    if (returnTo) {
      sessionStorage.removeItem('auth_return_to');
      navigate(returnTo, { replace: true });
    } else {
      navigate(getDashboardPath(profile.role), { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* LEFT PANEL - INFO & WORKFLOW */}
      <div className="hidden md:flex md:w-1/3 lg:w-2/5 bg-slate-900 text-white p-10 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=800&q=80')] bg-cover bg-center mix-blend-overlay"></div>
        
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition mb-12">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          
          <div className="mb-8">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="NyayaMitra Logo" className="h-16 mb-6" />
            <h1 className="text-3xl font-heading font-bold mb-4 leading-tight">
              NyayaMitra<br/>
              <span className="text-secondary text-xl font-medium">Digital Justice Platform</span>
            </h1>
            <p className="text-slate-300 leading-relaxed text-sm">
              A unified, secure, and transparent ecosystem bridging Citizens, Police, Lawyers, and Courts. Login with your official credentials to access your designated dashboard.
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Secure Access</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              NyayaMitra uses enterprise-grade security. All logins are tracked and monitored. Please ensure you are not sharing your credentials with anyone.
            </p>
          </div>
        </div>
        
        <div className="relative z-10 text-xs text-slate-500 mt-12">
          &copy; {new Date().getFullYear()} NyayaMitra Enterprise Project. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL - LOGIN FORM */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center md:text-left">
            <h2 className="font-heading font-bold text-3xl text-slate-900">
              {lang === "te" ? "లాగిన్" : "Welcome Back"}
            </h2>
            <p className="text-slate-600 mt-2">
              {lang === "te"
                ? "మీ ఖాతాతో న్యాయమిత్రలోకి ప్రవేశించండి"
                : "Sign in to NyayaMitra with your email and password"}
            </p>
          </motion.div>

          {verified && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r shadow-sm">
              <p className="text-sm text-green-700 font-medium">
                {lang === "te"
                  ? "ఇమెయిల్ ధృవీకరించబడింది. ఇప్పుడు లాగిన్ చేయండి."
                  : "Email verified successfully. Please log in."}
              </p>
            </div>
          )}

          {reset && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r shadow-sm">
              <p className="text-sm text-green-700 font-medium">
                {lang === "te"
                  ? "పాస్‌వర్డ్ విజయవంతంగా నవీకరించబడింది. దయచేసి లాగిన్ చేయండి."
                  : "Password updated successfully. Please log in."}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-slate-200 shadow-sm rounded-xl p-6 md:p-8">
            <div className="space-y-2">
              <Label htmlFor="login-email">{lang === "te" ? "ఇమెయిల్" : "Email"}</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-50"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">{lang === "te" ? "పాస్‌వర్డ్" : "Password"}</Label>
                <Link to="/forgot-password" className="text-xs text-primary font-medium hover:underline">
                  {lang === "te" ? "పాస్‌వర్డ్ మర్చిపోయారా?" : "Forgot Password?"}
                </Link>
              </div>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-50"
              />
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r">
                <p className="text-sm text-red-700 whitespace-pre-wrap font-medium">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-lg font-medium shadow-sm mt-2" disabled={loading}>
              {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              {lang === "te" ? "లాగిన్ చేయండి" : "Login"}
            </Button>

            <div className="pt-6 border-t border-slate-100 flex flex-col items-center gap-2 mt-6">
              <p className="text-sm text-slate-500">
                {lang === "te" ? "ఖాతా లేదా?" : "Don't have an account?"}
              </p>
              <Button variant="outline" asChild className="w-full h-10">
                <Link to="/register">
                  {lang === "te" ? "కొత్త ఖాతా సృష్టించండి" : "Create an account"}
                </Link>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
