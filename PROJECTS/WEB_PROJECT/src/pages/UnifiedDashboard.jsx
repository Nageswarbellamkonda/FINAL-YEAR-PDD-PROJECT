import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import moment from "moment";
import {
  Shield, AlertTriangle, FileText, MapPin, Zap, MessageSquare,
  TrendingUp, Clock, CheckCircle2, BarChart2, Bell, Users,
  Eye, ArrowRight, Loader2, Activity, Calendar
} from "lucide-react";

const QUICK_LINKS = [
  { to: "/file-complaint", icon: FileText, label: "File Complaint", color: "bg-primary" },
  { to: "/track-case", icon: Eye, label: "Track Case", color: "bg-secondary" },
  { to: "/smart-alerts", icon: Zap, label: "Smart Alerts", color: "bg-red-600" },
  { to: "/citizen-chat", icon: MessageSquare, label: "Police Chat", color: "bg-blue-700" },
  { to: "/women-safety", icon: Shield, label: "Women Safety", color: "bg-pink-600" },
  { to: "/live-tracking", icon: MapPin, label: "Live Tracking", color: "bg-emerald-600" },
  { to: "/analytics", icon: BarChart2, label: "Analytics", color: "bg-violet-600" },
  { to: "/attendance", icon: Clock, label: "Attendance", color: "bg-cyan-700" },
  { to: "/duty-management", icon: Calendar, label: "Duty Mgmt", color: "bg-emerald-700" },
  { to: "/alerts-admin", icon: Bell, label: "Alerts Admin", color: "bg-orange-600" },
  { to: "/golden-hour-cyber", icon: AlertTriangle, label: "Cyber 🆘", color: "bg-yellow-600" },
  { to: "/admin-panel", icon: Users, label: "Admin Panel", color: "bg-gray-700" },
];

const STATIC_ALERTS = [
  { type: "high", msg: "Increased snatching near Rythu Bazaar, Visakhapatnam — 7PM-9PM", time: "1h ago" },
  { type: "medium", msg: "Cyber fraud surge — OTP scams targeting senior citizens in Guntur", time: "3h ago" },
  { type: "low", msg: "Extra patrol deployed on NH-16 during festival period", time: "6h ago" },
];

export default function UnifiedDashboard() {
  const { user: authUser, profile } = useAuth();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const me = profile ?? authUser ?? null;
      setUser(me);
      if (!me) {
        setLoading(false);
        return;
      }
      const utype = me.user_type || me.role || "citizen";
      try {
        let complaintsData = [];
        let res;
        
        if (["citizen", "user"].includes(utype)) {
          // Query complaints created by this user (checking both user_id and created_by)
          res = await supabase
            .from("complaints")
            .select("*")
            .eq("user_id", me.id)
            .order("created_at", { ascending: false })
            .limit(10);
            
          if (res.error) {
            res = await supabase
              .from("complaints")
              .select("*")
              .eq("created_by", me.id)
              .order("created_at", { ascending: false })
              .limit(10);
          }
        } else {
          res = await supabase
            .from("complaints")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(20);
        }
        
        if (res && res.data) {
          complaintsData = res.data.map(c => ({
            ...c,
            case_id: c.complaint_number || c.case_id || `NM-${c.id?.slice(0, 8)}`,
            category: c.complaint_type || c.category || "general",
            created_date: c.created_at || c.created_date,
            location: c.location || (c.location_coordinates ? "Coordinates Provided" : "Unknown")
          }));
        }
        
        setComplaints(complaintsData);
      } catch (err) {
        console.error("Error loading data in UnifiedDashboard:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [authUser, profile]);

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => ["filed", "under_review"].includes(c.status)).length,
    active: complaints.filter(c => ["assigned", "investigating"].includes(c.status)).length,
    resolved: complaints.filter(c => ["resolved", "closed"].includes(c.status)).length,
  };

  const isOfficer = user && !["citizen", "user"].includes(user.user_type || user.role || "citizen");

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <button onClick={() => isOfficer ? window.location.href = "/officer-dashboard" : window.location.href = "/dashboard"}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm">
        ← {isOfficer ? "Officer Dashboard" : "Dashboard"}
      </button>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              Unified Command Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Welcome back, {user?.full_name || "User"} •{" "}
              <span className="font-medium text-foreground">{(user?.user_type || user?.role || "citizen").toUpperCase()}</span>
              {user?.district && ` • ${user.district}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              System Live
            </span>
            <span className="text-xs text-muted-foreground">{moment().format("ddd, DD MMM YYYY • hh:mm A")}</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Cases", value: stats.total, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Active", value: stats.active, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="hover:shadow-md transition">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className={`font-bold text-2xl ${s.color}`}>{s.value}</p>
                  <p className="text-muted-foreground text-xs">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-5 gap-2">
                {QUICK_LINKS.map((item, i) => (
                  <Link key={i} to={item.to}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:shadow-md hover:border-primary/30 transition group text-center">
                    <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center group-hover:scale-105 transition`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[11px] font-medium text-foreground leading-tight">{item.label}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Cases */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  {isOfficer ? "Recent Cases" : "My Complaints"}
                </CardTitle>
                <Button asChild variant="ghost" size="sm" className="text-xs h-7">
                  <Link to={isOfficer ? "/officer-dashboard" : "/dashboard"}>
                    View All <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {complaints.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-6">No cases found</p>
              ) : complaints.slice(0, 5).map(c => (
                <Link key={c.id} to={`/track-case?id=${c.case_id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[10px] text-muted-foreground">{c.case_id}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                        c.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        c.status === 'investigating' ? 'bg-purple-100 text-purple-700' :
                        c.status === 'escalated' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>{c.status?.replace("_", " ")}</span>
                      {c.priority === "critical" && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-red-100 text-red-700">CRITICAL</span>}
                    </div>
                    <p className="text-sm font-medium truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.location} • {moment(c.created_date).fromNow()}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition flex-shrink-0" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Live Crime Alerts */}
          <Card className="border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </motion.div>
                Live Crime Alerts
                <Badge className="bg-red-500 text-white text-[9px] ml-auto animate-pulse">LIVE</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {STATIC_ALERTS.map((a, i) => (
                <div key={i} className={`text-xs rounded-lg p-2.5 border ${
                  a.type === "high" ? "bg-red-50 border-red-200 text-red-800" :
                  a.type === "medium" ? "bg-yellow-50 border-yellow-200 text-yellow-800" :
                  "bg-green-50 border-green-200 text-green-800"
                }`}>
                  <p className="font-medium leading-snug">{a.msg}</p>
                  <p className="mt-1 opacity-70">{a.time}</p>
                </div>
              ))}
              <Button asChild variant="outline" size="sm" className="w-full text-xs h-8 mt-1">
                <Link to="/smart-alerts">View All Alerts <ArrowRight className="w-3 h-3 ml-1" /></Link>
              </Button>
            </CardContent>
          </Card>

          {/* AI Decision Panel */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> AI Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {[
                { label: "Risk Prediction Engine", to: "/smart-alerts", desc: "AI crime risk by district & time" },
                { label: "Police Decision AI", to: "/officer-dashboard", desc: "Case priority & officer allocation" },
                { label: "Safe Route Analysis", to: "/safe-route", desc: "Navigate avoiding risk zones" },
                { label: "AI Legal Assistant", to: "/legal-documents", desc: "Draft FIRs, charge sheets" },
              ].map((item, i) => (
                <Link key={i} to={item.to}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-primary/10 transition group border border-transparent hover:border-primary/20">
                  <div>
                    <p className="text-xs font-semibold">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition" />
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-600" /> System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {[
                { name: "AI Engine", status: "Operational", color: "text-green-600 bg-green-50" },
                { name: "GPS Tracking", status: "Live", color: "text-green-600 bg-green-50" },
                { name: "Emergency Line", status: "100 Active", color: "text-green-600 bg-green-50" },
                { name: "Blockchain Ledger", status: "Synced", color: "text-blue-600 bg-blue-50" },
                { name: "Crime Database", status: "Updated", color: "text-green-600 bg-green-50" },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className={`px-2 py-0.5 rounded-full font-medium ${s.color}`}>{s.status}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}