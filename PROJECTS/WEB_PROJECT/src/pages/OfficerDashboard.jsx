import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import moment from "moment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import {
  FileText, AlertTriangle, CheckCircle2, Clock, TrendingUp, Shield,
  LogOut, ArrowLeft, BarChart2, Building2, MapPin, Eye, Loader2,
  Brain, Trophy, Settings2, LayoutDashboard, Calendar, Bell, Users, Activity, MessageSquare, Zap
} from "lucide-react";
// District filter locked to 5 pilot districts
const PILOT_DISTRICTS = ["Visakhapatnam","Krishna","Guntur","Nellore","Chittoor"];
import { hasPermission, filterComplaintsByRole, ROLE_LABELS, getJurisdiction } from "@/lib/rbac";
import CaseChat from "@/components/CaseChat";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import QRScanner from "@/components/QRScanner";

const PIE_COLORS = ["#dc2626", "#d97706", "#0891b2", "#059669", "#7c3aed", "#1a56db", "#f43f5e"];

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

export default function OfficerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [districtFilter, setDistrictFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [chatCaseId, setChatCaseId] = useState(null);
  const [duties, setDuties] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [updatingDutyId, setUpdatingDutyId] = useState(null);

  const { user: authUser, profile, logout } = useAuth();

  const parseDuty = (d) => {
    let extra = {};
    if (d.notes) {
      try {
        if (typeof d.notes === 'string' && d.notes.trim().startsWith('{')) {
          extra = JSON.parse(d.notes);
        } else if (typeof d.notes === 'object' && d.notes !== null) {
          extra = d.notes;
        }
      } catch (e) {}
    }
    return {
      ...d,
      duty_type: d.duty_type || extra.duty_type || 'patrol',
      shift: d.shift || extra.shift || 'morning',
      duty_date: d.duty_date || extra.duty_date || (d.created_at ? d.created_at.slice(0, 10) : ''),
      start_time: d.start_time || extra.start_time || '',
      end_time: d.end_time || extra.end_time || '',
      instructions: extra.text || extra.original_notes || extra.special_instructions || (typeof d.notes === 'string' && !d.notes.trim().startsWith('{') ? d.notes : ''),
    };
  };

  useEffect(() => {
    loadData();
    // Realtime subscription for duties and attendances
    const channel = supabase
      .channel('officer-duties-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'duty_assignments' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendances' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authUser, profile]);

  const loadData = async () => {
    const me = profile ?? authUser ?? null;
    setUser(me);
    if (!me) {
      setLoading(false);
      return;
    }
    const rank = (me.user_type || me.role || "").toLowerCase();
    const jurisdiction = getJurisdiction(rank);
    try {
      let complaintsData = [];
      let res;
      if (jurisdiction === "all") {
        res = await supabase
          .from("complaints")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);
      } else if (jurisdiction === "district") {
        if (me.district) {
          res = await supabase
            .from("complaints")
            .select("*")
            .eq("district", me.district)
            .order("created_at", { ascending: false })
            .limit(100);
        } else {
          res = await supabase
            .from("complaints")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100);
        }
      } else if (rank === "ci") {
        if (me.department) {
          res = await supabase
            .from("complaints")
            .select("*")
            .eq("assigned_department", me.department)
            .order("created_at", { ascending: false })
            .limit(50);
        } else if (me.district) {
          res = await supabase
            .from("complaints")
            .select("*")
            .eq("district", me.district)
            .order("created_at", { ascending: false })
            .limit(50);
        } else {
          res = await supabase
            .from("complaints")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);
        }
      } else {
        // Query by assigned_officer (checking matching ID, email, or full name)
        let orFilter = `assigned_officer.eq.${me.id},assigned_officer.eq.${me.email}`;
        if (me.full_name) {
          orFilter += `,assigned_officer.ilike.%${me.full_name}%`;
        }
        res = await supabase
          .from("complaints")
          .select("*")
          .or(orFilter)
          .order("created_at", { ascending: false })
          .limit(50);
        
        if ((!res.data || res.data.length === 0) && me.district) {
          res = await supabase
            .from("complaints")
            .select("*")
            .eq("district", me.district)
            .order("created_at", { ascending: false })
            .limit(50);
        }
        if (!res.data || res.data.length === 0) {
          res = await supabase
            .from("complaints")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);
        }
      }

      if (res && res.data) {
        complaintsData = res.data;
      }

      const mappedComplaints = complaintsData.map(c => ({
        ...c,
        case_id: c.complaint_number || c.case_id || `NM-${c.id?.slice(0, 8)}`,
        category: c.complaint_type || c.category || "general",
        created_date: c.created_at || c.created_date,
        location: c.location || (c.location_coordinates ? "Coordinates Provided" : "Unknown")
      }));

      setComplaints(mappedComplaints);

      // Fetch duties assigned to officer
      try {
        let dQuery = supabase
          .from("duty_assignments")
          .select("*")
          .order("created_at", { ascending: false });

        if (["dgp", "admin", "system_admin"].includes(rank)) {
          dQuery = dQuery.limit(50);
        } else if (["dsp", "sp"].includes(rank)) {
          if (me.district) dQuery = dQuery.eq("district", me.district);
          dQuery = dQuery.limit(50);
        } else if (["si", "station_officer", "ci"].includes(rank)) {
          if (me.police_station) {
            dQuery = dQuery.or(`officer_email.eq.${me.email},police_station.eq.${me.police_station}`);
          } else {
            dQuery = dQuery.eq("officer_email", me.email);
          }
          dQuery = dQuery.limit(30);
        } else {
          // Regular Police Officer: show duties assigned to them
          if (me.full_name) {
            dQuery = dQuery.or(`officer_email.eq.${me.email},officer_name.ilike.%${me.full_name}%`);
          } else {
            dQuery = dQuery.eq("officer_email", me.email);
          }
          dQuery = dQuery.limit(20);
        }

        const { data: dData, error: dErr } = await dQuery;
        if (dErr) {
          console.warn("Error fetching duties in OfficerDashboard:", dErr);
        }
        setDuties((dData || []).map(parseDuty));
      } catch (dErr) {
        console.error("Failed to load duties:", dErr);
      }

      // Fetch attendance records for this officer
      try {
        let attQuery = supabase
          .from("attendances")
          .select("*")
          .order("created_at", { ascending: false });

        if (me.full_name) {
          attQuery = attQuery.or(`officer_email.eq.${me.email},officer_name.ilike.%${me.full_name}%`);
        } else {
          attQuery = attQuery.eq("officer_email", me.email);
        }
        const { data: attData, error: attErr } = await attQuery.limit(10);
        if (attErr) console.warn("Error fetching attendances in OfficerDashboard:", attErr);
        setAttendances(attData || []);
      } catch (attErr) {
        console.error("Failed to load attendances:", attErr);
      }
    } catch (err) {
      console.error("Error loading data in OfficerDashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const c = complaints.find(c => c.id === id);
      const newActionUpdates = [...(c?.action_updates || []), {
        date: new Date().toISOString(),
        update: `Status changed to ${newStatus}`,
        by: user?.full_name || user?.email,
      }];
      const { error } = await supabase
        .from("complaints")
        .update({
          status: newStatus,
          action_updates: newActionUpdates
        })
        .eq("id", id);
      if (error) throw error;
      toast.success("Status updated");
      loadData();
    } catch (err) {
      console.error("Error updating case status:", err);
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const updateDutyStatus = async (dutyId, newStatus) => {
    setUpdatingDutyId(dutyId);
    try {
      const { error } = await supabase
        .from("duty_assignments")
        .update({ status: newStatus })
        .eq("id", dutyId);
      if (error) throw error;
      toast.success(`Duty marked as ${newStatus}`);
      loadData();
    } catch (err) {
      console.error("Error updating duty status:", err);
      toast.error("Failed to update duty status");
    } finally {
      setUpdatingDutyId(null);
    }
  };

  const filtered = complaints.filter(c => {
    if (districtFilter !== "all" && c.district !== districtFilter) return false;
    if (deptFilter !== "all" && c.assigned_department !== deptFilter) return false;
    return true;
  });

  const stats = {
    total: filtered.length,
    pending: filtered.filter(c => ["filed", "under_review"].includes(c.status)).length,
    investigating: filtered.filter(c => ["assigned", "investigating"].includes(c.status)).length,
    resolved: filtered.filter(c => ["resolved", "closed"].includes(c.status)).length,
    escalated: filtered.filter(c => c.is_escalated).length,
    critical: filtered.filter(c => c.priority === "critical").length,
  };

  const statusPie = Object.entries(
    filtered.reduce((a, c) => { a[c.status || "filed"] = (a[c.status || "filed"] || 0) + 1; return a; }, {})
  ).map(([name, value]) => ({ name: name.replace("_", " "), value }));

  const deptBar = Object.entries(
    filtered.reduce((a, c) => { a[c.assigned_department || "general"] = (a[c.assigned_department || "general"] || 0) + 1; return a; }, {})
  ).map(([name, value]) => ({ name: name.replace("_", " "), value }));

  const priorityPie = [
    { name: "Critical", value: filtered.filter(c => c.priority === "critical").length, color: "#dc2626" },
    { name: "High", value: filtered.filter(c => c.priority === "high").length, color: "#d97706" },
    { name: "Normal", value: filtered.filter(c => c.priority === "normal").length, color: "#0891b2" },
    { name: "Low", value: filtered.filter(c => c.priority === "low").length, color: "#059669" },
  ].filter(p => p.value > 0);

  const rank = user?.user_type || user?.role || "";
  const rankLabel = ROLE_LABELS[rank] || rank.toUpperCase();
  const districts = [...new Set(complaints.map(c => c.district).filter(Boolean))];
  const departments = [...new Set(complaints.map(c => c.assigned_department).filter(Boolean))];

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            {rankLabel} Dashboard — {user?.full_name || "Officer"}
          </h1>
          <p className="text-muted-foreground text-sm">{user?.district || "Andhra Pradesh"} • {user?.designation || rank} • {user?.station || "AP Police"}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline" size="sm" className="gap-1 border-indigo-300 text-indigo-800 hover:bg-indigo-50">
            <Link to="/nyaya-ai"><Brain className="w-4 h-4 text-indigo-600" /> Nyaya AI</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1 border-cyan-300 text-cyan-800 hover:bg-cyan-50">
            <Link to="/attendance"><Calendar className="w-4 h-4 text-cyan-600" /> Attendance</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1">
            <Link to="/analytics"><BarChart2 className="w-4 h-4" /> Analytics</Link>
          </Button>
          {["dgp","ig","dig","adg","sp","dsp"].includes(rank) && (
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link to="/crime-analysis"><BarChart2 className="w-4 h-4 text-violet-600" /> AI Analysis</Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="gap-1">
            <Link to="/case-management"><Settings2 className="w-4 h-4 text-blue-600" /> Case Mgmt</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1">
            <Link to="/crime-heat-map"><MapPin className="w-4 h-4 text-red-500" /> Crime Map</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1 border-yellow-400 text-yellow-700 hover:bg-yellow-50">
            <Link to="/cyber-ops"><Zap className="w-4 h-4 text-yellow-600" /> Cyber Ops</Link>
          </Button>
          {hasPermission(rank, "VIEW_ALL_ATTENDANCE") && (
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link to="/workforce-monitor"><Users className="w-4 h-4 text-teal-600" /> Workforce</Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="gap-1">
            <Link to="/performance-dashboard"><Trophy className="w-4 h-4 text-yellow-600" /> Performance</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1">
            <Link to="/unified-dashboard"><LayoutDashboard className="w-4 h-4 text-slate-600" /> Command</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1">
            <Link to="/duty-management"><Calendar className="w-4 h-4 text-emerald-600" /> Duties</Link>
          </Button>
          {hasPermission(rank, "PUBLISH_DISTRICT_ALERT") && (
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link to="/alerts-admin"><Bell className="w-4 h-4 text-red-500" /> Alerts</Link>
            </Button>
          )}
          {["dgp","adg","ig","dig","sp","dsp","ci","si","admin"].includes(rank) && (
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link to="/officer-management"><Users className="w-4 h-4 text-blue-600" /> Officers</Link>
            </Button>
          )}
          {["dgp","adg","ig","dig","sp","dsp","admin"].includes(rank) && (
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link to="/dgp-dashboard"><Shield className="w-4 h-4 text-violet-600" /> Command</Link>
            </Button>
          )}
          {["admin","dgp"].includes(rank) && (
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link to="/admin-panel"><Settings2 className="w-4 h-4 text-red-600" /> Admin Panel</Link>
            </Button>
          )}
          {["admin","dgp"].includes(rank) && (
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link to="/system-admin"><Zap className="w-4 h-4 text-red-600" /> Sys Admin</Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="gap-1">
            <Link to="/activity-log"><Activity className="w-4 h-4 text-slate-600" /> Activity</Link>
          </Button>
          {["police","si","special"].includes(rank) && (
            <Button asChild variant="outline" size="sm" className="gap-1 border-blue-300 text-blue-700">
              <Link to="/station-dashboard"><Building2 className="w-4 h-4" /> Station Dashboard</Link>
            </Button>
          )}
          {["dsp","ci"].includes(rank) && (
            <Button asChild variant="outline" size="sm" className="gap-1 border-violet-300 text-violet-700">
              <Link to="/dsp-dashboard"><Shield className="w-4 h-4" /> DSP Dashboard</Link>
            </Button>
          )}
          <QRScanner buttonLabel="Scan/Verify" />
          <Button variant="outline" size="sm" onClick={() => logout()} className="gap-1">
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={districtFilter} onValueChange={setDistrictFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Districts" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Districts</SelectItem>
            {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Departments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d} value={d}>{d.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        {(districtFilter !== "all" || deptFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setDistrictFilter("all"); setDeptFilter("all"); }}>Clear Filters</Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total Cases", value: stats.total, color: "text-primary" },
          { label: "Pending", value: stats.pending, color: "text-yellow-600" },
          { label: "Investigating", value: stats.investigating, color: "text-blue-600" },
          { label: "Resolved", value: stats.resolved, color: "text-green-600" },
          { label: "Escalated", value: stats.escalated, color: "text-orange-600" },
          { label: "Critical", value: stats.critical, color: "text-red-600" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card>
              <CardContent className="p-3 text-center">
                <p className={`font-heading font-bold text-2xl ${s.color}`}>{s.value}</p>
                <p className="text-muted-foreground text-xs">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={entry => (entry && entry.value > 0 ? `${entry.name || 'Case'}: ${entry.value}` : "")} labelLine={false} fontSize={9}>
                  {statusPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Priority Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={priorityPie} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={entry => (entry && entry.value > 0 ? `${entry.name || 'Priority'}: ${entry.value}` : "")} labelLine={false} fontSize={10}>
                  {priorityPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Cases by Department</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptBar} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 9 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {deptBar.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Duties Card */}
      <Card className="mb-6 border-emerald-200 shadow-sm">
        <CardHeader className="bg-emerald-50/40 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-950">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Assigned Duties ({duties.length})
            </CardTitle>
            <Button asChild size="sm" variant="outline" className="h-8 gap-1 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-100">
              <Link to="/duty-management">
                View Duty Roster & Management →
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {duties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-600" />
              <p className="font-medium text-foreground">No duties currently assigned to you</p>
              <p className="text-xs text-muted-foreground mt-1">When a higher official assigns a duty, it will automatically appear here in real-time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {duties.map(d => {
                const displayTime = d.start_time
                  ? (d.start_time.includes('T') ? `${moment(d.start_time).format("HH:mm")}–${moment(d.end_time).format("HH:mm")}` : `${d.start_time}–${d.end_time}`)
                  : "";
                return (
                  <div key={d.id} className={`border rounded-lg p-3 text-sm transition hover:shadow-sm ${
                    d.status === "active" ? "border-green-300 bg-green-50/30" : "border-border bg-card"
                  }`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            d.status === "active" ? "bg-green-100 text-green-700 border border-green-300" :
                            d.status === "completed" ? "bg-gray-100 text-gray-700" :
                            d.status === "cancelled" ? "bg-red-100 text-red-700" :
                            "bg-blue-100 text-blue-700"
                          }`}>
                            {d.status}
                          </span>
                          <Badge variant="outline" className="text-[10px] capitalize font-medium">{d.duty_type?.replace("_", " ")}</Badge>
                          {d.shift && <Badge variant="secondary" className="text-[10px] capitalize">{d.shift} Shift</Badge>}
                          {d.duty_date && <span className="text-xs text-muted-foreground">{moment(d.duty_date).format("ddd, DD MMM YYYY")}</span>}
                        </div>
                        <p className="font-semibold text-foreground text-sm">{d.location || "Designated Sector / Beat"}</p>
                        <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground mt-1">
                          {displayTime && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-muted-foreground" /> {displayTime}</span>}
                          {(d.police_station || d.district) && (
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-muted-foreground" /> {d.police_station ? `${d.police_station} • ` : ""}{d.district || ""}</span>
                          )}
                          <span className="text-muted-foreground">Assigned to: <strong className="text-foreground font-medium">{d.officer_name || d.officer_email}</strong></span>
                        </div>
                        {d.instructions && (
                          <p className="text-xs bg-muted/40 rounded p-2 mt-2 text-foreground/80 italic border-l-2 border-emerald-500">
                            <strong>Instructions:</strong> {d.instructions}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 self-center">
                        {d.status === "scheduled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs bg-green-50 text-green-700 hover:bg-green-100 border-green-300 gap-1"
                            onClick={() => updateDutyStatus(d.id, "active")}
                            disabled={updatingDutyId === d.id}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Start Duty
                          </Button>
                        )}
                        {d.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-300 gap-1"
                            onClick={() => updateDutyStatus(d.id, "completed")}
                            disabled={updatingDutyId === d.id}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance & Nyaya AI Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Attendance Records Card */}
        <Card className="border-cyan-200 shadow-sm">
          <CardHeader className="bg-cyan-50/40 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2 text-cyan-950">
                <Clock className="w-5 h-5 text-cyan-600" />
                My Attendance ({attendances.length})
              </CardTitle>
              <Button asChild size="sm" variant="outline" className="h-8 gap-1 text-xs border-cyan-300 text-cyan-800 hover:bg-cyan-100">
                <Link to="/attendance">
                  Mark / View Attendance →
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {attendances.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30 text-cyan-600" />
                <p className="font-medium text-foreground">No recent attendance records</p>
                <p className="text-xs text-muted-foreground mt-1">Geo-verified attendance will appear here in real-time.</p>
                <Button asChild size="sm" className="mt-3 bg-cyan-700 hover:bg-cyan-800 text-xs">
                  <Link to="/attendance">Mark Today's Attendance</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {attendances.slice(0, 5).map(att => (
                  <div key={att.id} className="flex items-center justify-between p-2.5 border rounded-lg bg-card text-xs">
                    <div>
                      <p className="font-semibold text-foreground">
                        {moment(att.date || att.created_at).format("ddd, DD MMM YYYY")}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {att.police_station || att.district || "Station"}
                        {att.verified && <span className="ml-1.5 text-green-600 font-medium">✓ Geo-verified</span>}
                      </p>
                    </div>
                    <Badge className={
                      att.status === 'present' ? 'bg-green-100 text-green-700 border-green-300' :
                      att.status === 'late' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                      'bg-red-100 text-red-700 border-red-300'
                    } variant="outline">
                      {(att.status || "").toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nyaya AI Assistant Launch Card */}
        <Card className="border-indigo-200 shadow-sm bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30">
          <CardHeader className="bg-indigo-50/40 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2 text-indigo-950">
                <Brain className="w-5 h-5 text-indigo-600" />
                Nyaya AI Assistant
              </CardTitle>
              <Badge className="bg-indigo-600 text-white text-[10px]">OPERATIONAL</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col justify-between h-[calc(100%-60px)]">
            <div className="space-y-2 text-xs">
              <p className="text-foreground/90 font-medium">
                Integrated Police Legal & Operational AI
              </p>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside text-[11px]">
                <li>IPC / BNS section guidance and legal advice</li>
                <li>FIR structuring, case investigation assistance</li>
                <li>Evidence handling SOPs & procedural checklists</li>
              </ul>
            </div>
            <div className="pt-4">
              <Button asChild className="w-full bg-indigo-700 hover:bg-indigo-800 text-white gap-2">
                <Link to="/nyaya-ai">
                  <Brain className="w-4 h-4" /> Open Nyaya AI Workspace
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Cases Assigned ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No cases found</div>
          ) : (
            <div className="space-y-2">
              {filtered.slice(0, 20).map(c => (
                <div key={c.id} className={`border rounded-lg p-3 text-sm hover:shadow-sm transition ${c.priority === "critical" ? "border-red-200 bg-red-50/30" : "border-border"}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">{c.case_id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[c.status] || ""}`}>{c.status?.replace("_", " ")}</span>
                      {c.priority === "critical" && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">CRITICAL</span>}
                      {c.is_escalated && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700">ESCALATED</span>}
                    </div>
                    <p className="font-medium truncate mt-0.5">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.category?.replace("_", " ")} • {c.location} • {c.district}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={c.status} onValueChange={v => updateStatus(c.id, v)} disabled={updatingId === c.id}>
                      <SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["filed","under_review","assigned","investigating","escalated","court_hearing","resolved","closed"].map(s => (
                          <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0">
                      <Link to={`/track-case?id=${c.case_id}`}><Eye className="w-4 h-4" /></Link>
                    </Button>
                    <Button
                      size="sm" variant="ghost" className="h-7 w-7 p-0"
                      onClick={() => setChatCaseId(chatCaseId === c.case_id ? null : c.case_id)}
                      title="Chat with citizen"
                    >
                      <MessageSquare className={`w-4 h-4 ${chatCaseId === c.case_id ? "text-primary" : ""}`} />
                    </Button>
                  </div>
                  {chatCaseId === c.case_id && (
                    <div className="w-full mt-2">
                      <CaseChat caseId={c.case_id} onClose={() => setChatCaseId(null)} />
                    </div>
                  )}
                </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}