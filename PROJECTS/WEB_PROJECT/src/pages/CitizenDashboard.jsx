import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useLanguage } from "../lib/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileText, Search, Shield, Loader2, Plus, Eye, LogOut,
  AlertTriangle, CheckCircle2, Clock, Phone, MapPin, MessageSquare,
  Navigation, Heart, Zap, ChevronRight, Bell, User
} from "lucide-react";
import { motion } from "framer-motion";
import moment from "moment";

const statusColors = {
  filed: "bg-blue-100 text-blue-700",
  under_review: "bg-yellow-100 text-yellow-700",
  assigned: "bg-orange-100 text-orange-700",
  investigating: "bg-purple-100 text-purple-700",
  escalated: "bg-red-100 text-red-700",
  court_hearing: "bg-indigo-100 text-indigo-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
};

const QUICK_TOOLS = [
  { icon: FileText, label: "File Complaint", labelTe: "ఫిర్యాదు దాఖలు", to: "/file-complaint", color: "bg-primary" },
  { icon: Search, label: "Track Case", labelTe: "కేసు ట్రాక్", to: "/track-case", color: "bg-secondary" },
  { icon: Zap, label: "Cyber Fraud", labelTe: "సైబర్ ఫ్రాడ్", to: "/golden-hour-cyber", color: "bg-yellow-600" },
  { icon: Navigation, label: "Safe Route", labelTe: "సురక్షిత మార్గం", to: "/safe-route", color: "bg-emerald-600" },
  { icon: Heart, label: "Trusted Circle", labelTe: "నమ్మకమైన సర్కిల్", to: "/trusted-circle", color: "bg-rose-600" },
  { icon: MessageSquare, label: "Chat with Police", labelTe: "పోలీసుతో చాట్", to: "/citizen-chat", color: "bg-blue-700" },
  { icon: Bell, label: "Smart Alerts", labelTe: "స్మార్ట్ అలెర్ట్స్", to: "/smart-alerts", color: "bg-red-700" },
];

const EMERGENCY = [
  { num: "100", label: "Police", labelTe: "పోలీసు" },
  { num: "181", label: "SHE Teams", labelTe: "షీ టీమ్స్" },
  { num: "1930", label: "Cyber Crime", labelTe: "సైబర్ క్రైమ్" },
  { num: "108", label: "Ambulance", labelTe: "అంబులెన్స్" },
];

export default function CitizenDashboard() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackId, setTrackId] = useState("");

  const { user: authUser, profile, logout } = useAuth();
  
  useRealtimeSync(['complaints', 'station_alerts'], () => {
    loadData();
  });

  useEffect(() => {
    loadData();
  }, [authUser, profile]);
  const loadData = async () => {
    const me = profile ?? authUser ?? null;
    setUser(me);
    if (!me) {
      setLoading(false);
      return;
    }

    try {
      // Fetch cases created by this user
      // Supporting both user_id (complete schema) and created_by (full schema) columns
      let cases = [];
      const { data: casesData, error: casesError } = await supabase
        .from("complaints")
        .select("*")
        .eq("user_id", me.id)
        .order("created_at", { ascending: false })
        .limit(20);
        
      if (casesError) {
        console.warn("Querying complaints by 'user_id' failed, trying 'created_by'...", casesError);
        const { data: casesData2, error: casesError2 } = await supabase
          .from("complaints")
          .select("*")
          .eq("created_by", me.id)
          .order("created_at", { ascending: false })
          .limit(20);
          
        if (casesError2) {
          console.error("Querying complaints failed:", casesError2);
        } else {
          cases = casesData2 || [];
        }
      } else {
        cases = casesData || [];
      }


      // Map complaint properties for the UI (making it compatible with both schemas)
      const mappedCases = cases.map(c => ({
        ...c,
        case_id: c.complaint_number || c.case_id,
        category: c.complaint_type || c.category,
        created_date: c.created_at || c.created_date,
        location: c.location || (c.location_coordinates ? "Coordinates Provided" : "Unknown")
      }));
      setComplaints(mappedCases);

      // Fetch active alerts, fallback to notifications with type='alert' if table doesn't exist
      let alerts = [];
      const { data: alertData, error: alertError } = await supabase
        .from("station_alerts")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);

      if (alertError) {
        console.warn("Querying 'station_alerts' table failed, trying 'notifications' with type='alert'...", alertError);
        const { data: notifData, error: notifError } = await supabase
          .from("notifications")
          .select("*")
          .eq("type", "alert")
          .order("created_at", { ascending: false })
          .limit(5);

        if (!notifError && notifData) {
          alerts = notifData.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            is_active: !n.is_read
          }));
        }
      } else {
        alerts = alertData || [];
      }
      setAlerts(alerts);
    } catch (err) {
      console.error("Error loading data in CitizenDashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = (e) => {
    e.preventDefault();
    if (trackId.trim()) navigate(`/track-case?id=${trackId.trim()}`);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const stats = {
    total: complaints.length,
    active: complaints.filter(c => !["resolved", "closed"].includes(c.status)).length,
    resolved: complaints.filter(c => ["resolved", "closed"].includes(c.status)).length,
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl">
              {lang === "te" ? "నమస్కారం" : "Welcome"}, {user?.full_name?.split(" ")[0] || "Citizen"} 👋
            </h1>
            <p className="text-muted-foreground text-xs">
              {user?.district || "Andhra Pradesh"} • {lang === "te" ? "పౌర డాష్‌బోర్డ్" : "Citizen Dashboard"}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => logout()} className="gap-2">
          <LogOut className="w-4 h-4" /> {lang === "te" ? "లాగ్ అవుట్" : "Logout"}
        </Button>
      </div>

      {/* Quick Track */}
      <Card className="border-secondary/30 bg-secondary/5">
        <CardContent className="p-4">
          <p className="font-semibold text-sm mb-2">{lang === "te" ? "⚡ త్వరిత కేసు ట్రాక్" : "⚡ Quick Case Track"}</p>
          <form onSubmit={handleTrack} className="flex gap-2">
            <Input value={trackId} onChange={e => setTrackId(e.target.value)}
              placeholder={lang === "te" ? "Case ID నమోదు చేయండి (NM-001)" : "Enter Case ID (e.g. NM-001)"}
              className="flex-1 text-sm" />
            <Button type="submit" size="sm" className="gap-1">
              <Search className="w-4 h-4" />{lang === "te" ? "ట్రాక్" : "Track"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: lang === "te" ? "మొత్తం కేసులు" : "Total Cases", value: stats.total, icon: FileText, color: "text-primary" },
          { label: lang === "te" ? "క్రియాశీల" : "Active", value: stats.active, icon: Clock, color: "text-orange-500" },
          { label: lang === "te" ? "పరిష్కరించబడింది" : "Resolved", value: stats.resolved, icon: CheckCircle2, color: "text-green-600" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
              <p className="font-bold text-2xl">{s.value}</p>
              <p className="text-muted-foreground text-[11px]">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Tools */}
      <div>
        <h2 className="font-heading font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">
          {lang === "te" ? "సేవలు" : "Services & Safety Tools"}
        </h2>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
          {QUICK_TOOLS.map((tool, i) => (
            <motion.div key={i} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link to={tool.to}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card border border-border hover:shadow-md transition text-center">
                <div className={`w-10 h-10 rounded-xl ${tool.color} flex items-center justify-center`}>
                  <tool.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-medium leading-tight">
                  {lang === "te" ? tool.labelTe : tool.label}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Women Safety Quick Panel */}
      <Card className="border-pink-200 bg-pink-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-pink-900 text-sm">
                  {lang === "te" ? "మహిళా భద్రత — SHE టీమ్స్" : "Women Safety — SHE Teams"}
                </p>
                <p className="text-pink-700 text-xs">
                  {lang === "te" ? "24/7 నిఘా • లైవ్ ట్రాకింగ్ • SOS" : "24/7 Monitoring • Live Tracking • SOS Alerts"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <a href="tel:181" className="bg-pink-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold">
                181
              </a>
              <Button asChild size="sm" variant="outline" className="text-pink-700 border-pink-300">
                <Link to="/women-safety"><ChevronRight className="w-4 h-4" /></Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cyber Fraud Quick Panel */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-yellow-900 text-sm">
                  {lang === "te" ? "గోల్డెన్ అవర్ సైబర్ ఫ్రాడ్" : "Golden Hour Cyber Fraud"}
                </p>
                <p className="text-yellow-700 text-xs">
                  {lang === "te" ? "1 గంటలోపు రిపోర్ట్ → గరిష్ట రికవరీ" : "Report in 1 hour → Maximize recovery"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <a href="tel:1930" className="bg-yellow-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold">
                1930
              </a>
              <Button asChild size="sm" variant="outline" className="text-yellow-700 border-yellow-300">
                <Link to="/golden-hour-cyber"><ChevronRight className="w-4 h-4" /></Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div>
          <h2 className="font-heading font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">
            {lang === "te" ? "క్రియాశీల హెచ్చరికలు" : "Active Alerts"}
          </h2>
          <div className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                <Bell className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-900 text-xs">{alert.title}</p>
                  <p className="text-red-700 text-[11px] mt-0.5">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Numbers */}
      <div>
        <h2 className="font-heading font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">
          {lang === "te" ? "అత్యవసర హెల్ప్‌లైన్లు" : "Emergency Helplines"}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {EMERGENCY.map((e, i) => (
            <a key={i} href={`tel:${e.num}`}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition text-center">
              <Phone className="w-4 h-4" />
              <span className="font-bold text-lg">{e.num}</span>
              <span className="text-[10px] text-red-100">{lang === "te" ? e.labelTe : e.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* My Cases */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            {lang === "te" ? "నా కేసులు" : "My Cases"}
          </h2>
          <Button asChild size="sm" className="gap-1">
            <Link to="/file-complaint"><Plus className="w-3 h-3" />{lang === "te" ? "కొత్త కేసు" : "New Case"}</Link>
          </Button>
        </div>
        {complaints.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                {lang === "te" ? "ఇంకా ఫిర్యాదులు లేవు" : "No complaints filed yet"}
              </p>
              <Button asChild size="sm" className="mt-3">
                <Link to="/file-complaint">{lang === "te" ? "ఫిర్యాదు దాఖలు చేయండి" : "File your first complaint"}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {complaints.map(c => (
              <Card key={c.id} className="hover:shadow-sm transition">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs text-muted-foreground">{c.case_id || c.id.slice(0, 8)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[c.status] || ""}`}>
                          {c.status?.replace(/_/g, " ")}
                        </span>
                        {c.is_escalated && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">ESCALATED</span>}
                      </div>
                      <h3 className="font-semibold text-sm truncate">{c.title}</h3>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {c.category?.replace(/_/g, " ")} • {c.location} • {moment(c.created_date).fromNow()}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/track-case?id=${c.case_id || c.id}`}><Eye className="w-4 h-4" /></Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}