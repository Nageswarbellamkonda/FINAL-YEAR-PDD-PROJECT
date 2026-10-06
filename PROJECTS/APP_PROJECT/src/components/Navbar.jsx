import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { useLanguage } from "../lib/LanguageContext";
import { useTranslation } from "../lib/translations";
import { useAuth } from "@/lib/AuthContext";
import { getDashboardPath } from "@/lib/authRouting";
import { fetchSmartCrimeAlerts, subscribeAlertsRealtime } from "@/lib/alertsSync";
import { Menu, X, Shield, Globe, ChevronDown, Home, LogIn, UserPlus, FileEdit, Search, Bell, ShieldAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const APP_LOGO = import.meta.env.BASE_URL + "logo.png";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const currentUser = profile ?? user ?? null;
  const userRole = (currentUser?.role || currentUser?.user_type || '').toLowerCase();
  const isDspOfficer = ['dsp', 'sp', 'commissioner', 'dgp', 'administrator', 'system_admin'].includes(userRole);

  const handleManageAlerts = (e) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (isDspOfficer) {
      navigate('/dsp-dashboard?tab=alerts');
    } else {
      navigate('/dashboard');
    }
  };

  const [mobileOpen, setMobileOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const { lang, setLang } = useLanguage();
  const t = useTranslation(lang);
  const location = useLocation();

  useEffect(() => {
    const loadCount = async () => {
      try {
        const alerts = await fetchSmartCrimeAlerts();
        setAlertCount(alerts?.length || 0);
      } catch (err) {
        // Non-blocking fallback
      }
    };
    loadCount();
    let unsubscribe = () => {};
    try {
      unsubscribe = subscribeAlertsRealtime(() => {
        loadCount();
      });
    } catch (err) {
      console.warn("[Navbar] Realtime subscription failed gracefully:", err);
    }
    return () => {
      if (typeof unsubscribe === "function") {
        try {
          unsubscribe();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const userDashboard = currentUser ? getDashboardPath(userRole) : "/dashboard";

  const navItems = [
    { path: "/", label: lang === "te" ? "హోమ్" : "Home", icon: Home, emoji: "🏠" },
    ...(currentUser
      ? [{ path: userDashboard, label: lang === "te" ? "డాష్‌బోర్డ్" : "Dashboard", icon: Shield, emoji: "📊" }]
      : [
          { path: "/login", label: lang === "te" ? "లాగిన్" : "Login", icon: LogIn, emoji: "🔐" },
          { path: "/register", label: lang === "te" ? "రిజిస్టర్" : "Register", icon: UserPlus, emoji: "📝" },
        ]),
    { path: "/file-complaint", label: lang === "te" ? "FIR" : "File FIR", icon: FileEdit, emoji: "✍️" },
    { path: "/track-case", label: lang === "te" ? "ట్రాక్" : "Track Case", icon: Search, emoji: "🔎" },
    { path: "/smart-alerts", label: lang === "te" ? "అలెర్ట్స్" : "Alerts", icon: Bell, emoji: "🚨" },
    { path: "/golden-hour-cyber", label: lang === "te" ? "సైబర్" : "Cyber Fraud", icon: ShieldAlert, emoji: "💻" },
  ];

  const isActive = (path) => location.pathname === path;


  return (
    <nav className="sticky top-0 z-50 bg-primary shadow-lg">
      <div className="w-full px-4 lg:px-8 xl:px-12">
        <div className="flex items-center h-16 w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 w-auto pr-4">
            <img src={APP_LOGO} alt="Nyaya Mitra" className="w-10 h-10 rounded-lg" />
            <div>
              <h1 className="text-white font-heading font-bold text-lg leading-tight tracking-wide">
                {t("appName")}
              </h1>
              <p className="text-white/60 text-[10px] font-medium tracking-widest uppercase">
                Next-Gen Smart Policing & Citizen Safety Platform
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex flex-1 justify-center items-center gap-1 overflow-hidden">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-2 xl:px-3 py-2 rounded-xl text-[12px] xl:text-[13px] font-bold tracking-wide transition-all duration-300 whitespace-nowrap group ${
                  isActive(item.path)
                    ? "text-sky-300 bg-white/10"
                    : "text-white/80 hover:text-white hover:bg-white/10 hover:-translate-y-0.5"
                }`}
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  <span>{item.emoji}</span>
                  {item.label}
                  {item.path === "/smart-alerts" && alertCount > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full animate-pulse leading-none shadow-sm">
                      {alertCount}
                    </span>
                  )}
                </span>
                {isActive(item.path) && (
                  <motion.div layoutId="navbar-indicator" className="absolute inset-0 border border-sky-400/40 rounded-xl shadow-[0_0_10px_rgba(56,189,248,0.2)]" />
                )}
              </Link>
            ))}
          </div>

          {/* Language Switcher & User Status / Logout */}
          <div className="hidden lg:flex justify-end items-center w-auto pl-4 gap-2">
            <div className="flex bg-white/10 p-1 rounded-xl shadow-inner">
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  lang === "en" ? "bg-white text-primary shadow-sm" : "text-white hover:text-sky-200"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("te")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  lang === "te" ? "bg-white text-primary shadow-sm" : "text-white hover:text-sky-200"
                }`}
              >
                తెలుగు
              </button>
            </div>

            {currentUser && (
              <div className="flex items-center gap-2 ml-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-200 bg-white/15 px-2.5 py-1 rounded-lg border border-white/20">
                  {userRole.toUpperCase()}
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => logout()}
                  className="h-8 px-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold gap-1 shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{lang === "te" ? "లాగ్అవుట్" : "Logout"}</span>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-primary/95 backdrop-blur-lg border-t border-white/10 pb-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`block px-6 py-3 text-sm font-medium flex items-center gap-3 ${
                isActive(item.path)
                  ? "bg-white/15 text-sky-300 border-l-4 border-sky-400"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <span>{item.emoji}</span>
              <span className="flex-1">{item.label}</span>
              {item.path === "/smart-alerts" && alertCount > 0 && (
                <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
                  {alertCount}
                </span>
              )}
            </Link>
          ))}
          {isDspOfficer && (
            <button
              onClick={(e) => { setMobileOpen(false); handleManageAlerts(e); }}
              className="w-full text-left px-6 py-3 text-sm font-bold text-amber-300 flex items-center gap-3 bg-amber-500/10 border-l-4 border-amber-400 hover:bg-amber-500/20"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>{lang === "te" ? "అలెర్ట్స్ నిర్వహణ (DSP)" : "Manage Alerts (DSP)"}</span>
            </button>
          )}

          {currentUser && (
            <div className="px-6 py-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => { setMobileOpen(false); logout(); }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>{lang === "te" ? "లాగ్అవుట్" : "Logout"} ({userRole.toUpperCase()})</span>
              </Button>
            </div>
          )}

          <div className="px-6 pt-2 flex gap-2">
            <Button
              size="sm"
              variant={lang === "en" ? "secondary" : "ghost"}
              onClick={() => setLang("en")}
              className={lang !== "en" ? "text-white/70" : ""}
            >
              English
            </Button>
            <Button
              size="sm"
              variant={lang === "te" ? "secondary" : "ghost"}
              onClick={() => setLang("te")}
              className={lang !== "te" ? "text-white/70" : ""}
            >
              తెలుగు
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}