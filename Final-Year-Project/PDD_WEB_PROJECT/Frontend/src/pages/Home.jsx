import { FileText, Search, Shield, Building2, Scale, MessageSquare, Users, Calendar, BookOpen, Zap, Navigation, Heart, LayoutDashboard, AlertTriangle, MapPin, Brain, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { useTranslation } from "../lib/translations";
import AwarenessCarousel from "../components/AwarenessCarousel";
import QuickActionCard from "../components/QuickActionCard";
import EmergencyBanner from "../components/EmergencyBanner";
import NoticeBoard from "../components/NoticeBoard";
import ScrollingTicker from "../components/ScrollingTicker";
import { lazy, Suspense } from "react";
import FirstTimeGuide from "../components/FirstTimeGuide";
import ConstitutionSection from "../components/ConstitutionSection";
const APMap = lazy(() => import("../components/APMap"));
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Home() {
  const { lang } = useLanguage();
  const t = useTranslation(lang);
  const [visitCount, setVisitCount] = useState(0);
  const [showAllActions, setShowAllActions] = useState(false);

  useEffect(() => {
    const base = 12480;
    const stored = parseInt(localStorage.getItem('nyaya_visits') || '0');
    const newCount = stored + 1;
    localStorage.setItem('nyaya_visits', newCount.toString());
    setVisitCount(base + newCount);
  }, []);

  const actions = [
    {
      icon: User,
      title: lang === "te" ? "పౌర డాష్‌బోర్డ్" : "Citizen Dashboard",
      description: lang === "te" ? "మీ కేసులు, భద్రత సేవలు, అలెర్ట్లు" : "Your cases, safety tools & live alerts",
      to: "/citizen-dashboard",
      color: "bg-primary",
    },
    {
      icon: FileText,
      title: t("fileComplaint"),
      description: lang === "te" ? "ఆన్‌లైన్‌లో ఫిర్యాదు దాఖలు చేయండి" : "File a complaint online with proof & get a unique case ID",
      to: "/file-complaint",
      color: "bg-secondary",
    },
    {
      icon: Search,
      title: t("trackCase"),
      description: lang === "te" ? "మీ కేసు స్థితిని ట్రాక్ చేయండి" : "Track your complaint status in real-time",
      to: "/track-case",
      color: "bg-secondary",
    },
    {
      icon: Shield,
      title: t("womenSafetyTitle"),
      description: lang === "te" ? "మహిళా భద్రత & షీ టీమ్స్" : "Women safety tools, SOS & She Teams",
      to: "/women-safety",
      color: "bg-pink-600",
    },
    {
      icon: Building2,
      title: t("departments"),
      description: lang === "te" ? "పోలీసు విభాగాలు" : "Narcotics, Cyber Crime, CID & more",
      to: "/departments",
      color: "bg-emerald-600",
    },
    {
      icon: Scale,
      title: lang === "te" ? "న్యాయవాదులు" : "Legal Aid",
      description: lang === "te" ? "న్యాయవాదులను సంప్రదించండి" : "Connect with lawyers for legal guidance",
      to: "/contact",
      color: "bg-violet-600",
    },
    {
      icon: Building2,
      title: lang === "te" ? "పోలీసు స్టేషన్లు" : "Police Stations",
      description: lang === "te" ? "AP & TS పోలీసు స్టేషన్లు" : "Find AP & Telangana police stations by district",
      to: "/police-stations",
      color: "bg-teal-600",
    },
    {
      icon: MessageSquare,
      title: lang === "te" ? "అభిప్రాయం" : "Feedback",
      description: lang === "te" ? "మీ అభిప్రాయం పంచుకోండి" : "Rate and review our services",
      to: "/feedback",
      color: "bg-indigo-600",
    },
    {
      icon: Calendar,
      title: lang === "te" ? "హాజరు" : "Attendance",
      description: lang === "te" ? "అధికారుల GPS హాజరు" : "GPS-verified officer attendance",
      to: "/attendance",
      color: "bg-cyan-700",
    },
    {
      icon: BookOpen,
      title: lang === "te" ? "చట్టాలు & హక్కులు" : "Constitution & Laws",
      description: lang === "te" ? "సంవిధానం, BNS, BNSS, BSA హక్కులు" : "BNS, BNSS, BSA laws & your rights",
      to: "/constitution-rights",
      color: "bg-amber-700",
    },
    {
      icon: MessageSquare,
      title: lang === "te" ? "పోలీసు చాట్" : "Police Chat",
      description: lang === "te" ? "అధికారితో నేరుగా మాట్లాడండి" : "Chat directly with your assigned officer",
      to: "/citizen-chat",
      color: "bg-blue-700",
    },
    {
      icon: Zap,
      title: lang === "te" ? "స్మార్ట్ అలెర్ట్స్" : "Smart Alerts",
      description: lang === "te" ? "AI ఆధారిత నేర అలెర్ట్లు" : "AI crime risk alerts & predictions",
      to: "/smart-alerts",
      color: "bg-red-700",
    },
    {
      icon: Navigation,
      title: lang === "te" ? "సురక్షిత మార్గం" : "Safe Route",
      description: lang === "te" ? "నేర ప్రాంతాలు దాటి సురక్షిత మార్గం" : "AI route navigation avoiding crime zones",
      to: "/safe-route",
      color: "bg-emerald-700",
    },
    {
      icon: Heart,
      title: lang === "te" ? "నమ్మకమైన సర్కిల్" : "Trusted Circle",
      description: lang === "te" ? "అత్యవసర పరిచయాలు & SOS నెట్‌వర్క్" : "Emergency contacts & family SOS network",
      to: "/trusted-circle",
      color: "bg-rose-600",
    },
    {
      icon: LayoutDashboard,
      title: lang === "te" ? "యూనిఫైడ్ డాష్‌బోర్డ్" : "Command Center",
      description: lang === "te" ? "సమీకృత పోలీసు కమాండ్ సెంటర్" : "Unified alerts, cases, tracking & AI",
      to: "/unified-dashboard",
      color: "bg-slate-700",
    },
    {
      icon: AlertTriangle,
      title: lang === "te" ? "గోల్డెన్ అవర్ సైబర్" : "Golden Hour Cyber",
      description: lang === "te" ? "సైబర్ మోసం తక్షణ రిపోర్ట్ — 1 గంట రికవరీ" : "Instant fraud report • 1-hour account freeze",
      to: "/golden-hour-cyber",
      color: "bg-yellow-600",
    },
    {
      icon: MapPin,
      title: lang === "te" ? "క్రైమ్ హీట్ మ్యాప్" : "Crime Heat Map",
      description: lang === "te" ? "AI నేర తీవ్రత మ్యాప్" : "AI crime hotspots & pattern intelligence",
      to: "/crime-heat-map",
      color: "bg-red-700",
    },
    {
      icon: Brain,
      title: lang === "te" ? "న్యాయ AI అసిస్టెంట్" : "NyayaAI Assistant",
      description: lang === "te" ? "AI చట్టపరమైన మార్గదర్శకత్వం" : "AI legal guidance, cyber help & police advisor",
      to: "/nyaya-ai",
      color: "bg-indigo-700",
    },
  ];

  const stats = [
    { value: "24/7", label: lang === "te" ? "ఆన్‌లైన్ సేవ" : "Online Service" },
    { value: "13", label: lang === "te" ? "జిల్లాలు" : "AP Districts" },
    { value: "100%", label: lang === "te" ? "డిజిటల్" : "Digital" },
    { value: "AI", label: lang === "te" ? "ఆధారిత" : "Powered" },
  ];

  return (
    <div>
      <FirstTimeGuide lang={lang} />

      {/* Scrolling Ticker */}
      <ScrollingTicker />

      {/* Hero Carousel */}
      <section className="max-w-7xl mx-auto px-4 pt-6">
        <AwarenessCarousel />
      </section>

      {/* AP Police Interactive Map */}
      <section className="max-w-7xl mx-auto px-4 pt-4 pb-2">
        <Suspense fallback={<div className="h-[420px] bg-muted rounded-2xl animate-pulse" />}>
          <APMap />
        </Suspense>
      </section>

      {/* Quick Actions */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-xl">{lang === 'te' ? 'త్వరిత చర్యలు' : 'Quick Actions'}</h2>
          {visitCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted rounded-full px-3 py-1">
              <Users className="w-3 h-3" />
              <span>{visitCount.toLocaleString()} visitors</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {(showAllActions ? actions : actions.slice(0, 4)).map((action, i) => (
            <QuickActionCard key={i} {...action} />
          ))}
        </div>
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setShowAllActions(v => !v)}
            className="px-6 py-2 rounded-full border-2 border-primary text-primary text-sm font-semibold hover:bg-primary hover:text-white transition-all shadow-sm"
          >
            {showAllActions
              ? (lang === 'te' ? 'కుచించు ▲' : 'Show Less ▲')
              : (lang === 'te' ? 'మరిన్ని విభాగాలు చూడండి ▼' : 'View More Departments ▼')}
          </button>
        </div>
      </section>

      {/* Notice Board */}
      <section className="max-w-7xl mx-auto px-4 py-4">
        <NoticeBoard />
      </section>

      {/* Constitution & Law Section */}
      <div id="constitution">
        <ConstitutionSection lang={lang} />
      </div>

      {/* Emergency Helplines */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <EmergencyBanner />
      </section>

    </div>
  );
}