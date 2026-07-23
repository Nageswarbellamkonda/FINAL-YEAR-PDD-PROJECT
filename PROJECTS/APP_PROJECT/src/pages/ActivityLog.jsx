import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, ArrowLeft, RefreshCw, Loader2, FileText,
  Bell, Calendar, Shield, Users, Clock, Wifi, WifiOff
} from "lucide-react";
import { Link } from "react-router-dom";
import { hasPermission, getJurisdiction, ROLE_LABELS } from "@/lib/rbac";
import moment from "moment";

const ACTIVITY_ICONS = {
  complaint: FileText,
  alert: Bell,
  duty: Calendar,
  attendance: Clock,
  officer: Shield,
  default: Activity,
};

const EVENT_COLORS = {
  create: "bg-green-100 text-green-700 border-green-300",
  update: "bg-blue-100 text-blue-700 border-blue-300",
  delete: "bg-red-100 text-red-700 border-red-300",
  escalate: "bg-orange-100 text-orange-700 border-orange-300",
  resolve: "bg-emerald-100 text-emerald-700 border-emerald-300",
  assign: "bg-violet-100 text-violet-700 border-violet-300",
};

function ActivityItem({ item, index }) {
  const Icon = ACTIVITY_ICONS[item.type] || ACTIVITY_ICONS.default;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex gap-3 items-start pb-4 border-b border-border last:border-0"
    >
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <span className="font-medium text-sm">{item.title}</span>
          {item.event && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold capitalize ${EVENT_COLORS[item.event] || "bg-muted text-muted-foreground border-border"}`}>
              {item.event}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{item.description}</p>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{moment(item.time).fromNow()} — {item.by}</p>
      </div>
    </motion.div>
  );
}

export default function ActivityLog() {
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [liveMode, setLiveMode] = useState(true);
  const unsubRef = useRef(null);

  const { user: authUser, profile } = useAuth();

  useEffect(() => {
    loadData();
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, [authUser, profile]);

  useEffect(() => {
    if (!liveMode) {
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
      return;
    }
    // Subscribe to real-time complaint updates
    const channel = supabase.channel('activity-log')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, (payload) => {
        const data = payload.new || payload.old;
        const newActivity = {
          id: Date.now() + Math.random(),
          type: "complaint",
          title: data?.title || "Case Update",
          description: `Case ${data?.complaint_number} — ${data?.status?.replace("_", " ")}`,
          event: payload.eventType === "INSERT" ? "create" : payload.eventType === "DELETE" ? "delete" : "update",
          time: new Date().toISOString(),
          by: data?.assigned_to || "System",
          isLive: true,
        };
        setActivities(prev => [newActivity, ...prev.slice(0, 99)]);
      })
      .subscribe();
      
    unsubRef.current = () => { supabase.removeChannel(channel); };
  }, [liveMode]);

  const loadData = async () => {
    setLoading(true);
    const me = profile ?? authUser ?? null;
    setUser(me);
    const jur = getJurisdiction(me?.user_type || me?.role);

    let cQuery = supabase.from('complaints').select('*').order('updated_at', { ascending: false }).limit(50);
    if (jur !== "all" && me?.district) cQuery = cQuery.eq('district', me.district);
    const { data: complaints = [] } = await cQuery;

    let aQuery = supabase.from('station_alerts').select('*').order('created_at', { ascending: false }).limit(20);
    if (jur !== "all" && me?.district) aQuery = aQuery.eq('district', me.district);
    const { data: alerts = [] } = hasPermission(me?.user_type || me?.role, "PUBLISH_STATION_ALERT") ? await aQuery : { data: [] };

    let dQuery = supabase.from('duty_assignments').select('*').order('created_at', { ascending: false }).limit(20);
    if (jur !== "all" && me?.district) dQuery = dQuery.eq('district', me.district);
    const { data: duties = [] } = hasPermission(me?.user_type || me?.role, "VIEW_DUTIES") ? await dQuery : { data: [] };


    // Build activity feed
    const feed = [];

    complaints.forEach(c => {
      feed.push({
        id: "c-" + c.id,
        type: "complaint",
        title: c.title || "Complaint",
        description: `${c.complaint_number} • Status: ${c.status?.replace("_", " ")} • ${c.district || c.police_station || "Unknown"}`,
        event: c.priority === "urgent" || c.priority === "high" ? "escalate" : ["resolved","closed"].includes(c.status) ? "resolve" : c.assigned_to ? "assign" : "create",
        time: c.updated_at || c.created_at,
        by: c.assigned_to || c.user_id || "Citizen",
      });
    });

    alerts.forEach(a => {
      feed.push({
        id: "a-" + a.id,
        type: "alert",
        title: a.title,
        description: `${a.severity?.toUpperCase()} ${a.alert_type?.replace("_", " ")} • ${a.scope} level • ${a.district || "AP"}`,
        event: "create",
        time: a.created_at,
        by: a.publisher_name || "System",
      });
    });

    duties.forEach(d => {
      feed.push({
        id: "d-" + d.id,
        type: "duty",
        title: `Duty: ${d.duty_type?.replace("_", " ") || "Patrol"}`,
        description: `${d.officer_name || d.officer_email} • ${d.station} • ${d.shift} shift`,
        event: "assign",
        time: d.created_at,
        by: d.assigned_by || "System",
      });
    });

    // Sort by time descending
    feed.sort((a, b) => new Date(b.time) - new Date(a.time));
    setActivities(feed);
    setLoading(false);
  };

  const filtered = filter === "all"
    ? activities
    : activities.filter(a => a.type === filter);

  const canView = user && hasPermission(user.user_type || user.role, "OFFICER_DASHBOARD");

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!canView) return (
    <div className="max-w-xl mx-auto py-20 text-center">
      <Shield className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
      <h2 className="font-heading font-bold text-xl">Officers Only</h2>
      <Button asChild variant="outline" className="mt-4"><Link to="/dashboard">Back</Link></Button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm"><Link to="/officer-dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link></Button>
        <div className="flex-1">
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" /> Activity Log
          </h1>
          <p className="text-muted-foreground text-sm">
            {ROLE_LABELS[user?.user_type || user?.role]} — Real-time system activity
          </p>
        </div>
        <button
          onClick={() => setLiveMode(v => !v)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition ${liveMode ? "bg-green-50 text-green-700 border-green-300" : "bg-muted text-muted-foreground border-border"}`}
        >
          {liveMode ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {liveMode ? "Live" : "Paused"}
        </button>
        <Button variant="outline" size="sm" onClick={loadData}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["all", "complaint", "alert", "duty", "attendance"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition capitalize ${filter === f ? "bg-primary text-white shadow" : "bg-muted hover:bg-muted/80 text-muted-foreground"}`}>
            {f === "all" ? "All Activity" : f + "s"}
          </button>
        ))}
      </div>

      {/* Live indicator */}
      {liveMode && (
        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-3 py-1.5 mb-4 w-fit">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Receiving live updates — {filtered.filter(a => a.isLive).length} new since load
        </div>
      )}

      <Card>
        <CardContent className="p-5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No activity found</p>
            </div>
          ) : (
            <div className="space-y-0">
              <AnimatePresence>
                {filtered.slice(0, 60).map((item, i) => (
                  <ActivityItem key={item.id} item={item} index={i} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}