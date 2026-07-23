/**
 * LEVEL 2 — DSP Dashboard (District Superintendent of Police)
 * Scope: All police stations within their district
 * Powers: Monitor all stations, manage officers, assign duties, approve escalations
 * Pilot Districts: Visakhapatnam, Vijayawada (Krishna), Guntur, Nellore, Tirupati (Chittoor)
 */
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Shield, FileText, Users, AlertTriangle, CheckCircle2, Clock, TrendingUp,
  LogOut, Eye, Trash2, Calendar, Bell, BarChart2, MapPin, Loader2, ArrowLeft,
  UserX, UserCheck, Activity, Building2, Zap
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import moment from "moment";

const PILOT_DISTRICTS = ["Visakhapatnam", "Krishna", "Guntur", "Nellore", "Chittoor"];
const DISTRICT_DISPLAY = {
  "Visakhapatnam": "Visakhapatnam",
  "Krishna": "Vijayawada (Krishna)",
  "Guntur": "Guntur",
  "Nellore": "Nellore",
  "Chittoor": "Tirupati (Chittoor)",
};
const PIE_COLORS = ["#dc2626","#d97706","#0891b2","#059669","#7c3aed","#f43f5e"];

const STATUS_COLORS = {
  filed: "bg-blue-100 text-blue-700",
  under_review: "bg-yellow-100 text-yellow-700",
  assigned: "bg-orange-100 text-orange-700",
  investigating: "bg-purple-100 text-purple-700",
  escalated: "bg-red-100 text-red-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
};

export default function DSPDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [duties, setDuties] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stationFilter, setStationFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingOfficerId, setDeletingOfficerId] = useState(null);

  const { user: authUser, profile, logout } = useAuth();

  useEffect(() => { loadData(); }, [authUser, profile]);

  const loadData = async () => {
    const me = profile ?? authUser ?? null;
    setUser(me);
    if (!me) {
      setLoading(false);
      return;
    }
    const district = me.district || "";
    try {
      // 1. Fetch complaints
      let comp = [];
      if (district) {
        const { data: compData } = await supabase
          .from("complaints")
          .select("*")
          .eq("district", district)
          .order("created_at", { ascending: false })
          .limit(200);
        if (compData) comp = compData;
      } else {
        const { data: compData } = await supabase
          .from("complaints")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        if (compData) comp = compData;
      }
      // Fallback removed, relying completely on Supabase

      const mappedComplaints = comp.map(c => ({
        ...c,
        case_id: c.complaint_number || c.case_id || `NM-${c.id?.slice(0, 8)}`,
        category: c.complaint_type || c.category || "general",
        created_date: c.created_at || c.created_date,
        location: c.location || (c.location_coordinates ? "Coordinates Provided" : "Unknown")
      }));
      setComplaints(mappedComplaints);

      // 2. Fetch users/officers
      let off = [];
      const { data: usersData } = await supabase
        .from("user_profiles")
        .select("*");
      if (usersData) {
        off = usersData.filter(u => ["police","si","ci","special","she_teams","police_officer","station_officer"].includes(u.user_type || u.role || ""));
      }
      setOfficers(off);

      // 3. Fetch duties
      let dut = [];
      if (district) {
        const { data: dutData } = await supabase
          .from("duty_assignments")
          .select("*")
          .eq("district", district)
          .order("created_at", { ascending: false })
          .limit(100);
        if (dutData) dut = dutData;
      } else {
        const { data: dutData } = await supabase
          .from("duty_assignments")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        if (dutData) dut = dutData;
      }
      setDuties(dut);

      // 4. Fetch attendance
      let att = [];
      if (district) {
        const { data: attData } = await supabase
          .from("attendances")
          .select("*")
          .eq("district", district)
          .order("created_at", { ascending: false })
          .limit(50);
        if (attData) att = attData;
      } else {
        const { data: attData } = await supabase
          .from("attendances")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(30);
        if (attData) att = attData;
      }
      setAttendance(att);

      // 5. Fetch alerts
      let ale = [];
      const { data: aleData } = await supabase
        .from("station_alerts")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20);
      if (aleData) ale = aleData;
      setAlerts(ale);
    } catch (err) {
      console.error("Error loading data in DSPDashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateCaseStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const c = complaints.find(c => c.id === id);
      const newActionUpdates = [...(c?.action_updates || []), {
        date: new Date().toISOString(),
        update: `Status updated to ${newStatus} by DSP ${user?.full_name}`,
        by: user?.email,
      }];
      const { error } = await supabase
        .from("complaints")
        .update({
          status: newStatus,
          action_updates: newActionUpdates
        })
        .eq("id", id);
      if (error) throw error;
      toast.success("Case status updated");
      loadData();
    } catch (err) {
      console.error("Error updating status in DSPDashboard:", err);
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const removeOfficer = async (officerId, officerName) => {
    if (!confirm(`Remove officer ${officerName} from your district? This action cannot be undone.`)) return;
    setDeletingOfficerId(officerId);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          role: "deactivated",
          district: "",
          police_station: ""
        })
        .eq("id", officerId);
      if (error) throw error;
      toast.success(`Officer ${officerName} has been removed from district`);
      loadData();
    } catch (err) {
      console.error("Error removing officer:", err);
      toast.error("Failed to remove officer");
    } finally {
      setDeletingOfficerId(null);
    }
  };

  const publishAlert = async (title, message, severity) => {
    try {
      const { error } = await supabase
        .from("station_alerts")
        .insert({
          title,
          message,
          alert_type: "advisory",
          severity,
          scope: "district",
          district: user?.district || "",
          published_by: user?.email || "",
          publisher_role: "dsp",
          publisher_name: user?.full_name || "",
          is_active: true
        });
      if (error) throw error;
      toast.success("District alert published");
      loadData();
    } catch (err) {
      console.error("Error publishing alert:", err);
      toast.error("Failed to publish alert");
    }
  };

  const filtered = complaints.filter(c => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (stationFilter !== "all" && c.police_station !== stationFilter) return false;
    return true;
  });

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => ["filed","under_review"].includes(c.status)).length,
    investigating: complaints.filter(c => ["assigned","investigating"].includes(c.status)).length,
    resolved: complaints.filter(c => ["resolved","closed"].includes(c.status)).length,
    escalated: complaints.filter(c => c.is_escalated).length,
    critical: complaints.filter(c => c.priority === "critical").length,
    resolutionRate: complaints.length ? Math.round((complaints.filter(c => ["resolved","closed"].includes(c.status)).length / complaints.length) * 100) : 0,
  };

  const stationPie = Object.entries(
    complaints.reduce((a, c) => { const s = c.police_station || "Unknown"; a[s] = (a[s] || 0) + 1; return a; }, {})
  ).slice(0, 6).map(([name, value]) => ({ name, value }));

  const categoryBar = Object.entries(
    complaints.reduce((a, c) => { a[c.category || "other"] = (a[c.category || "other"] || 0) + 1; return a; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name: name.replace("_", " "), value }));

  const stations = [...new Set(complaints.map(c => c.police_station).filter(Boolean))];
  const todayPresent = attendance.filter(a => moment(a.marked_at).isSame(moment(), "day")).length;

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const tabs = ["overview", "cases", "officers", "duties", "alerts"];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-violet-600 text-white text-xs">LEVEL 2 — DISTRICT DSP</Badge>
            <Badge variant="outline" className="text-xs">{DISTRICT_DISPLAY[user?.district] || user?.district}</Badge>
          </div>
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Shield className="w-6 h-6 text-violet-600" />
            DSP Dashboard — {user?.full_name || "DSP"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Deputy Superintendent of Police • {DISTRICT_DISPLAY[user?.district] || user?.district} • Andhra Pradesh Pilot
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline" size="sm">
            <Link to="/workforce-monitor"><Users className="w-4 h-4 mr-1" /> Workforce</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/crime-analysis"><BarChart2 className="w-4 h-4 mr-1" /> Crime Analysis</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/cyber-ops"><Zap className="w-4 h-4 mr-1" /> Cyber Ops</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => logout()} className="text-red-600 border-red-200">
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${activeTab === tab ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            {[
              { label: "Total Cases", value: stats.total, color: "text-primary" },
              { label: "Pending", value: stats.pending, color: "text-yellow-600" },
              { label: "Investigating", value: stats.investigating, color: "text-blue-600" },
              { label: "Resolved", value: stats.resolved, color: "text-green-600" },
              { label: "Escalated", value: stats.escalated, color: "text-orange-600" },
              { label: "Critical", value: stats.critical, color: "text-red-600" },
              { label: "Resolution %", value: `${stats.resolutionRate}%`, color: stats.resolutionRate >= 60 ? "text-green-600" : "text-red-600" },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="text-center">
                  <CardContent className="p-3">
                    <p className={`font-heading font-bold text-xl ${s.color}`}>{s.value}</p>
                    <p className="text-muted-foreground text-[10px]">{s.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Workforce Quick */}
          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            <Card className="border-blue-200 bg-blue-50/30">
              <CardContent className="p-4 flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-bold text-xl text-blue-700">{officers.length}</p>
                  <p className="text-xs text-muted-foreground">Officers Under District</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50/30">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-bold text-xl text-green-700">{todayPresent}</p>
                  <p className="text-xs text-muted-foreground">Present Today (GPS Verified)</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50/30">
              <CardContent className="p-4 flex items-center gap-3">
                <Activity className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="font-bold text-xl text-orange-700">{duties.filter(d => d.status === "active").length}</p>
                  <p className="text-xs text-muted-foreground">Active Duties Now</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader><CardTitle className="text-sm">Cases by Police Station</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={stationPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name.split(" ")[0]}:${value}`} labelLine={false} fontSize={9}>
                      {stationPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Crime Categories</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={categoryBar} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 9 }} />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {categoryBar.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {activeTab === "cases" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> District Cases ({filtered.length})
              </CardTitle>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {["filed","under_review","investigating","escalated","resolved","closed"].map(s => (
                      <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={stationFilter} onValueChange={setStationFilter}>
                  <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All Stations" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stations</SelectItem>
                    {stations.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filtered.slice(0, 30).map(c => (
                <div key={c.id} className={`border rounded-lg p-3 text-sm ${c.priority === "critical" ? "border-red-200 bg-red-50/20" : ""}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-muted-foreground">{c.case_id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[c.status] || ""}`}>{c.status?.replace("_"," ")}</span>
                        {c.priority === "critical" && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">CRITICAL</span>}
                        {c.is_escalated && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700">ESCALATED</span>}
                      </div>
                      <p className="font-medium truncate mt-0.5">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.police_station || "Unknown Station"} • {c.location} • {moment(c.created_date).fromNow()}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Select value={c.status} onValueChange={v => updateCaseStatus(c.id, v)} disabled={updatingId === c.id}>
                        <SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["filed","under_review","assigned","investigating","escalated","court_hearing","resolved","closed"].map(s => (
                            <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0">
                        <Link to={`/track-case?id=${c.case_id}`}><Eye className="w-4 h-4" /></Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "officers" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> District Officers ({officers.length})
              <span className="text-xs text-muted-foreground ml-2 font-normal">DSP can remove officers from district</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {officers.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No officers found in your district</p>
            ) : (
              <div className="space-y-2">
                {officers.map(off => (
                  <div key={off.id} className="flex items-center justify-between border rounded-lg p-3 hover:bg-muted/30 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm">
                        {off.full_name?.[0] || "O"}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{off.full_name || off.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {(off.user_type || off.role || "").toUpperCase()} • {off.station || "No station"} • {off.badge_number || "No badge"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{off.user_type || off.role || "officer"}</Badge>
                      <Button
                        size="sm" variant="destructive" className="h-7 text-xs gap-1"
                        disabled={deletingOfficerId === off.id}
                        onClick={() => removeOfficer(off.id, off.full_name || off.email)}
                      >
                        {deletingOfficerId === off.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserX className="w-3 h-3" />}
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "duties" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> District Duty Assignments ({duties.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {duties.slice(0, 20).map(d => (
                  <div key={d.id} className="flex items-center justify-between border rounded-lg p-3 text-sm">
                    <div>
                      <p className="font-medium">{d.officer_name}</p>
                      <p className="text-xs text-muted-foreground">{d.duty_type?.replace("_"," ")} • {d.location} • {d.shift} shift • {moment(d.duty_date).format("DD MMM")}</p>
                    </div>
                    <Badge className={`text-xs ${d.status === "active" ? "bg-green-500" : d.status === "completed" ? "bg-gray-500" : "bg-yellow-500"} text-white`}>
                      {d.status?.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Button asChild>
            <Link to="/duty-management">Manage Duties →</Link>
          </Button>
        </div>
      )}

      {activeTab === "alerts" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" /> District Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-yellow-800 mb-3">Publish New District Alert</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input placeholder="Alert Title" id="alert-title" className="h-9 text-sm" />
                  <Select defaultValue="high">
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input placeholder="Alert message..." className="mt-2 h-9 text-sm" id="alert-msg" />
                <Button className="mt-2 w-full" size="sm"
                  onClick={() => {
                    const title = document.getElementById("alert-title")?.value;
                    const msg = document.getElementById("alert-msg")?.value;
                    if (title && msg) publishAlert(title, msg, "high");
                  }}>
                  Publish District Alert
                </Button>
              </div>
              {alerts.filter(a => a.district === user?.district).map(a => (
                <div key={a.id} className="border rounded-lg p-3">
                  <p className="font-semibold text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{a.message}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{a.severity}</Badge>
                    <Badge variant="outline" className="text-xs">{moment(a.created_date).fromNow()}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}