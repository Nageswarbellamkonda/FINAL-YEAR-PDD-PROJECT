import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
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

  const { user: authUser, profile, logout } = useAuth();

  useEffect(() => { loadData(); }, [authUser, profile]);

  const loadData = async () => {
    const me = profile ?? authUser ?? null;
    setUser(me);
    if (!me) {
      setLoading(false);
      return;
    }
    const rank = me.user_type || me.role || "";
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
        // Query by assigned_officer (checking matching ID or email)
        res = await supabase
          .from("complaints")
          .select("*")
          .or(`assigned_officer.eq.${me.id},assigned_officer.eq.${me.email},assigned_to.eq.${me.id}`)
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
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm">
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
          {["dgp","ig","dig","adg","sp","dsp"].includes(rank) && (
            <>
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link to="/analytics"><BarChart2 className="w-4 h-4" /> Analytics</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link to="/crime-analysis"><BarChart2 className="w-4 h-4 text-violet-600" /> AI Analysis</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link to="/attendance">📅 Attendance</Link>
            </Button>
          </>
          )}
          {rank !== "police" && (
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link to="/case-management"><Settings2 className="w-4 h-4 text-blue-600" /> Case Mgmt</Link>
            </Button>
          )}
          {rank !== "police" && (
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link to="/nyaya-ai"><Brain className="w-4 h-4 text-primary" /> NyayaAI</Link>
            </Button>
          )}
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
                <Pie data={statusPie} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => value > 0 ? `${name}:${value}` : ""} labelLine={false} fontSize={9}>
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
                <Pie data={priorityPie} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name}:${value}`} labelLine={false} fontSize={10}>
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