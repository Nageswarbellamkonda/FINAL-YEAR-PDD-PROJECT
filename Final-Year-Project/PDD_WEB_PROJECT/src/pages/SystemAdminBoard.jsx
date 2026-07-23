import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Shield, Users, FileText, Bell, Activity, Settings2, Database,
  Loader2, ArrowLeft, RefreshCw, BarChart2, MapPin, Zap, CheckCircle2,
  AlertTriangle, Clock, Calendar, TrendingUp, Brain
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROLE_LABELS } from "@/lib/rbac";
import moment from "moment";

const ADMIN_MODULES = [
  { icon: Users, label: "User Management", desc: "Roles, access, officers", to: "/admin-panel", color: "bg-blue-600" },
  { icon: FileText, label: "Case Management", desc: "All cases & FIRs", to: "/case-management", color: "bg-violet-600" },
  { icon: Bell, label: "Alerts Admin", desc: "Publish alerts & news", to: "/alerts-admin", color: "bg-red-600" },
  { icon: MapPin, label: "Crime Heat Map", desc: "AI crime intelligence", to: "/crime-heat-map", color: "bg-orange-600" },
  { icon: Calendar, label: "Duty Management", desc: "Assign & track duties", to: "/duty-management", color: "bg-emerald-600" },
  { icon: Activity, label: "Workforce Monitor", desc: "Attendance analytics", to: "/workforce-monitor", color: "bg-teal-600" },
  { icon: Zap, label: "Cyber Emergency", desc: "Golden hour cyber portal", to: "/golden-hour-cyber", color: "bg-yellow-600" },
  { icon: Brain, label: "NyayaAI Assistant", desc: "AI advisor & chatbot", to: "/nyaya-ai", color: "bg-primary" },
  { icon: Database, label: "Data Seeder", desc: "Demo data management", to: "/data-seeder", color: "bg-slate-600" },
  { icon: BarChart2, label: "DGP Dashboard", desc: "State command view", to: "/dgp-dashboard", color: "bg-indigo-600" },
  { icon: Settings2, label: "Officer Management", desc: "Officer records", to: "/officer-management", color: "bg-cyan-600" },
  { icon: Activity, label: "Activity Log", desc: "System audit trail", to: "/activity-log", color: "bg-gray-600" },
];

export default function SystemAdminBoard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ complaints: 0, users: 0, alerts: 0, duties: 0, cyber: 0, attendance: 0 });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user: authUser, profile } = useAuth();

  useEffect(() => {
    (async () => {
      const me = profile ?? authUser ?? null;
      setUser(me);
      if (!me) {
        setLoading(false);
        return;
      }
      try {
        const [statsRes, altsRes] = await Promise.all([
          supabase.from("vw_admin_dashboard_metrics").select("*").limit(1).single(),
          supabase.from("station_alerts").select("*").order("created_at", { ascending: false }).limit(5)
        ]);

        const dbStats = statsRes.data || {
          total_complaints: 0,
          total_firs: 0,
          active_emergencies: 0,
          total_cyber_cases: 0,
          active_patrols: 0,
          total_police_officers: 0
        };

        const alts = altsRes.data || [];

        setRecentAlerts(alts);
        setStats({
          complaints: dbStats.total_complaints || 0,
          alerts: dbStats.active_emergencies || 0,
          duties: dbStats.active_patrols || 0,
          cyber: dbStats.total_cyber_cases || 0,
          attendance: dbStats.total_police_officers || 0,
        });
      } catch (err) {
        console.error("Error loading system admin stats:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [authUser, profile]);

  const role = user?.user_type || user?.role || "";
  const isAdmin = ["admin", "system_admin", "administrator", "dgp"].includes(role);

  if (!loading && !isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <Shield className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="font-heading font-bold text-xl mb-2">Admin Access Only</h2>
        <p className="text-muted-foreground mb-4">System Admin Board requires admin or DGP role.</p>
        <Button asChild variant="outline"><Link to="/officer-dashboard">Back to Dashboard</Link></Button>
      </div>
    );
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm"><Link to="/officer-dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link></Button>
        <div className="flex-1">
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-red-600" />
            System Admin Control Board
          </h1>
          <p className="text-muted-foreground text-sm">Full platform control • NyayaMitra AI-Powered Police Governance System</p>
        </div>
        <Badge className="bg-red-600 text-white text-xs">🔴 ADMIN ACCESS</Badge>
        <Button variant="outline" size="sm" onClick={() => location.reload()}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
        {[
          { label: "Complaints", value: stats.complaints + "+", icon: FileText, color: "text-primary" },
          { label: "Active Alerts", value: stats.alerts, icon: Bell, color: "text-red-600" },
          { label: "Duties Today", value: stats.duties, icon: Calendar, color: "text-emerald-600" },
          { label: "Cyber Cases", value: stats.cyber, icon: Zap, color: "text-yellow-600" },
          { label: "Attendance", value: stats.attendance + "+", icon: CheckCircle2, color: "text-green-600" },
          { label: "System", value: "🟢 OK", icon: Activity, color: "text-green-600" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="hover:shadow-md transition">
              <CardContent className="p-3 text-center">
                <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
                <p className={`font-bold text-xl ${s.color}`}>{s.value}</p>
                <p className="text-muted-foreground text-[10px]">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Admin Info */}
      <Card className="mb-6 border-red-200 bg-red-50/30">
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold">{user?.full_name || "Admin"}</p>
            <p className="text-sm text-muted-foreground">{ROLE_LABELS[role] || role.toUpperCase()} • Full Platform Access</p>
            <p className="text-xs text-muted-foreground">{user?.email} • Session: {moment().format("DD MMM YYYY, hh:mm A")}</p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-red-600 text-white">ADMIN</Badge>
            <Badge className="bg-green-600 text-white">ACTIVE</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Module Grid */}
      <h2 className="font-semibold text-base mb-4 flex items-center gap-2">
        <Settings2 className="w-4 h-4 text-primary" /> Platform Modules
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {ADMIN_MODULES.map((mod, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Link to={mod.to}>
              <Card className="hover:shadow-lg transition-all hover:border-primary/30 cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-xl ${mod.color} flex items-center justify-center mb-3`}>
                    <mod.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-semibold text-sm">{mod.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{mod.desc}</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent Alerts */}
      <div className="grid md:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-red-500" /> Recent Alerts
              <Button asChild variant="ghost" size="sm" className="text-xs h-6 ml-auto">
                <Link to="/alerts-admin">Manage</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {recentAlerts.slice(0, 4).map((a, i) => (
              <div key={i} className={`text-xs p-2.5 rounded-lg border ${a.severity === "critical" ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"}`}>
                <p className="font-semibold">{a.title}</p>
                <p className="text-muted-foreground line-clamp-1 mt-0.5">{a.district || "AP-wide"} • {moment(a.created_date).fromNow()}</p>
              </div>
            ))}
            {recentAlerts.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">No alerts</p>}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {[
              { label: "Publish New Alert", to: "/alerts-admin", icon: Bell, color: "text-red-600" },
              { label: "Seed Demo Data", to: "/data-seeder", icon: Database, color: "text-slate-600" },
              { label: "View Crime Heat Map", to: "/crime-heat-map", icon: MapPin, color: "text-orange-600" },
              { label: "Monitor Workforce", to: "/workforce-monitor", icon: Users, color: "text-blue-600" },
              { label: "NyayaAI Assistant", to: "/nyaya-ai", icon: Brain, color: "text-primary" },
            ].map((a, i) => (
              <Link key={i} to={a.to}
                className="flex items-center gap-3 p-2.5 rounded-lg border hover:border-primary/30 hover:bg-primary/5 transition text-sm">
                <a.icon className={`w-4 h-4 ${a.color} flex-shrink-0`} />
                <span>{a.label}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}