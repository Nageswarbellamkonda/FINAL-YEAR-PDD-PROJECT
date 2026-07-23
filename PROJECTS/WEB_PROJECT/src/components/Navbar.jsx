import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

import { useLanguage } from "../lib/LanguageContext";
import { useTranslation } from "../lib/translations";
import { Menu, X, Shield, Globe, ChevronDown, Home, LogIn, UserPlus, FileEdit, Search, Bell, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const APP_LOGO = "/logo.png";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, setLang } = useLanguage();
  const t = useTranslation(lang);
  const location = useLocation();

  const navItems = [
    { path: "/", label: lang === "te" ? "హోమ్" : "Home", icon: Home, emoji: "🏠" },
    { path: "/login", label: lang === "te" ? "లాగిన్" : "Login", icon: LogIn, emoji: "🔐" },
    { path: "/register", label: lang === "te" ? "రిజిస్టర్" : "Register", icon: UserPlus, emoji: "📝" },
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
                </span>
                {isActive(item.path) && (
                  <motion.div layoutId="navbar-indicator" className="absolute inset-0 border border-sky-400/40 rounded-xl shadow-[0_0_10px_rgba(56,189,248,0.2)]" />
                )}
              </Link>
            ))}
          </div>

          {/* Language Switcher */}
          <div className="hidden lg:flex justify-end items-center w-auto pl-4">
            <div className="flex bg-white/10 p-1 rounded-xl shadow-inner ml-2">
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
              {item.label}
            </Link>
          ))}
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