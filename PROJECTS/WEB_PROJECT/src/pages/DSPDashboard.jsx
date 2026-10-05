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
import { Textarea } from "@/components/ui/textarea";
import {
  Shield, FileText, Users, AlertTriangle, CheckCircle2, Clock, TrendingUp,
  LogOut, Eye, Trash2, Calendar, Bell, BarChart2, MapPin, Loader2, ArrowLeft,
  UserX, UserCheck, Activity, Building2, Zap, Edit, Plus, Globe, Send, Save, CheckCircle, XCircle, RefreshCw
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { broadcastAlertChange, getAlertDestination, subscribeAlertsRealtime } from "@/lib/alertsSync";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [duties, setDuties] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const VALID_TABS = ["overview", "cases", "officers", "duties", "attendance", "alerts"];
  const currentTabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    VALID_TABS.includes(currentTabParam) ? currentTabParam : "overview"
  );

  useEffect(() => {
    const param = searchParams.get("tab");
    if (param && VALID_TABS.includes(param) && param !== activeTab) {
      setActiveTab(param);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  const [statusFilter, setStatusFilter] = useState("all");
  const [stationFilter, setStationFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingOfficerId, setDeletingOfficerId] = useState(null);

  const [alertForm, setAlertForm] = useState({
    title: "",
    message: "",
    destination: "BOTH",
    category: "crime_alert",
    severity: "high",
    district: "All AP",
  });
  const [editingAlertId, setEditingAlertId] = useState(null);
  const [savingAlert, setSavingAlert] = useState(false);
  const [deletingAlertId, setDeletingAlertId] = useState(null);
  const [alertFilterStatus, setAlertFilterStatus] = useState("all");
  const [alertDestinationFilter, setAlertDestinationFilter] = useState("all");

  const { user: authUser, profile, logout } = useAuth();

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from("station_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (data && !error) {
        setAlerts(data);
      }
    } catch (e) {
      console.warn("[DSPDashboard] Error loading alerts:", e);
    }
  };

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
      instructions: extra.text || extra.original_notes || (typeof d.notes === 'string' && !d.notes.trim().startsWith('{') ? d.notes : ''),
    };
  };

  useEffect(() => {
    loadData();

    // Supabase Realtime for DSP duties, attendances & complaints
    const dutyChannel = supabase
      .channel(`dsp-sync-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'duty_assignments' },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendances' },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'complaints' },
        () => {
          loadData();
        }
      )
      .subscribe((status, err) => {
        if (err) console.warn("DSP realtime warning:", status, err);
      });

    return () => {
      supabase.removeChannel(dutyChannel);
    };
  }, [authUser, profile]);

  useEffect(() => {
    fetchAlerts();
    let unsubscribe = () => {};
    try {
      unsubscribe = subscribeAlertsRealtime(() => {
        fetchAlerts();
      });
    } catch (err) {
      console.warn("[DSPDashboard] Realtime subscription failed gracefully:", err);
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


  const loadData = async () => {
    fetchAlerts();
    const me = profile ?? authUser ?? null;
    setUser(me);
    if (!me) {
      setLoading(false);
      return;
    }
    let district = me.district || "";
    if (!district && me.md_district_id) {
      try {
        const { data: dRow } = await supabase.from("md_districts").select("name").eq("id", me.md_district_id).maybeSingle();
        if (dRow?.name) district = dRow.name;
      } catch (e) {
        console.warn("Could not resolve district from master table:", e);
      }
    }

    try {
      // 1. Fetch complaints
      let comp = [];
      let compQuery = supabase.from("complaints").select("*").order("created_at", { ascending: false });
      if (district) {
        compQuery = compQuery.or(`district.ilike.%${district}%,police_station.ilike.%${district}%`);
      }
      const { data: compData } = await compQuery.limit(100);
      if (compData && compData.length > 0) {
        comp = compData;
      } else {
        const { data: allComp } = await supabase.from("complaints").select("*").order("created_at", { ascending: false }).limit(50);
        comp = allComp || [];
      }

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
      let dutQuery = supabase.from("duty_assignments").select("*").order("created_at", { ascending: false });
      if (district) {
        dutQuery = dutQuery.or(`district.ilike.%${district}%,police_station.ilike.%${district}%`);
      }
      const { data: dutData } = await dutQuery.limit(100);
      if (dutData) dut = dutData;
      setDuties(dut.map(parseDuty));

      // 4. Fetch attendance
      let att = [];
      let attQuery = supabase.from("attendances").select("*").order("created_at", { ascending: false });
      if (district) {
        attQuery = attQuery.or(`district.ilike.%${district}%,police_station.ilike.%${district}%`);
      }
      const { data: attData } = await attQuery.limit(50);
      if (attData && attData.length > 0) {
        att = attData;
      } else {
        const { data: allAtt } = await supabase.from("attendances").select("*").order("created_at", { ascending: false }).limit(30);
        att = allAtt || [];
      }
      setAttendance(att);

      // 5. Fetch alerts (all alerts including drafts for DSP management)
      await fetchAlerts();
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

  const handleSaveAlert = async (isPublish = true) => {
    if (!alertForm.title.trim() || !alertForm.message.trim()) {
      toast.error("Alert Title and Message are required");
      return;
    }
    setSavingAlert(true);
    try {
      const districtVal = alertForm.district || user?.district || "All AP";
      const scopeVal = districtVal === "All AP" ? "all" : "district";
      const isNotice = alertForm.destination === "PUBLIC_NOTICE" || alertForm.destination === "BOTH";
      const isTicker = alertForm.destination === "SMART_CRIME_ALERT" || alertForm.destination === "BOTH";

      const targetAudience = {
        destination: alertForm.destination,
        show_in_notice_board: isNotice,
        show_in_ticker: isTicker,
        status: isPublish ? "published" : "draft",
        notice_type: alertForm.category,
        severity: alertForm.severity,
        district: districtVal,
        published_by: user?.email || "dsp@nyayamitra.in",
        publisher_name: user?.full_name || "DSP Officer",
        publisher_role: "dsp",
        updated_at: new Date().toISOString()
      };

      const payload = {
        title: alertForm.title.trim(),
        message: alertForm.message.trim(),
        alert_type: alertForm.category,
        severity: alertForm.severity,
        scope: scopeVal,
        district: districtVal,
        station: "All Stations",
        published_by: user?.email || "dsp@nyayamitra.in",
        publisher_role: "dsp",
        publisher_name: user?.full_name || "DSP Officer",
        is_active: isPublish,
        target_audience: targetAudience
      };

      let savedRecord = null;
      if (editingAlertId) {
        const { data, error } = await supabase
          .from("station_alerts")
          .update(payload)
          .eq("id", editingAlertId)
          .select();
        if (error) throw error;
        savedRecord = data?.[0] || { id: editingAlertId, ...payload };
        toast.success(isPublish ? "Alert updated and published live" : "Draft updated successfully");
      } else {
        const { data, error } = await supabase
          .from("station_alerts")
          .insert([payload])
          .select();
        if (error) throw error;
        savedRecord = data?.[0] || payload;
        toast.success(isPublish ? "Alert published to live public board" : "Alert saved as draft");
      }

      await broadcastAlertChange(editingAlertId ? "UPDATE" : "INSERT", savedRecord);

      setEditingAlertId(null);
      setAlertForm({
        title: "",
        message: "",
        destination: "BOTH",
        category: "crime_alert",
        severity: "high",
        district: user?.district || "All AP",
      });

      await fetchAlerts();
    } catch (err) {
      console.error("Error saving alert:", err);
      toast.error(`Failed to save alert: ${err.message || 'Database error'}`);
    } finally {
      setSavingAlert(false);
    }
  };

  const startEditAlert = (alert) => {
    setEditingAlertId(alert.id);
    setAlertForm({
      title: alert.title || "",
      message: alert.message || "",
      destination: alert.target_audience?.destination || getAlertDestination(alert),
      category: alert.target_audience?.notice_type || alert.alert_type || "crime_alert",
      severity: alert.severity || "high",
      district: alert.district || user?.district || "All AP",
    });

    const formEl = document.getElementById("dsp-alert-form");
    if (formEl) formEl.scrollIntoView({ behavior: "smooth" });
  };

  const cancelEditAlert = () => {
    setEditingAlertId(null);
    setAlertForm({
      title: "",
      message: "",
      destination: "BOTH",
      category: "crime_alert",
      severity: "high",
      district: user?.district || "All AP",
    });
  };

  const handleToggleAlert = async (alert) => {
    try {
      const nextActive = !alert.is_active;
      const updatedAudience = {
        ...(alert.target_audience || {}),
        status: nextActive ? "published" : "inactive",
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from("station_alerts")
        .update({
          is_active: nextActive,
          target_audience: updatedAudience
        })
        .eq("id", alert.id)
        .select();
      if (error) throw error;

      const updatedRecord = data?.[0] || { ...alert, is_active: nextActive, target_audience: updatedAudience };
      await broadcastAlertChange("TOGGLE", updatedRecord);
      toast.success(nextActive ? "Alert published live" : "Alert unpublished / deactivated");
      await fetchAlerts();
    } catch (err) {
      console.error("Error toggling alert:", err);
      toast.error("Failed to update alert status");
    }
  };

  const handleDeleteAlert = async (id, title) => {
    if (!confirm(`Are you sure you want to delete this alert: "${title}"?`)) return;
    setDeletingAlertId(id);
    try {
      const { error } = await supabase.from("station_alerts").delete().eq("id", id);
      if (error) throw error;

      await broadcastAlertChange("DELETE", { id });
      toast.success("Alert deleted from database");
      if (editingAlertId === id) cancelEditAlert();
      await fetchAlerts();
    } catch (err) {
      console.error("Error deleting alert:", err);
      toast.error("Failed to delete alert");
    } finally {
      setDeletingAlertId(null);
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
  const todayPresent = attendance.filter(a => (a.status === 'present' || a.status === 'late') && moment(a.date || a.created_at).isSame(moment(), "day")).length;

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const currentDistrict = user?.district || 'Vijayawada';
  const tabs = ["overview", "cases", "officers", "duties", "attendance", "alerts"];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-violet-600 text-white text-xs">LEVEL 2 — DISTRICT DSP</Badge>
            <Badge variant="outline" className="text-xs">{DISTRICT_DISPLAY[currentDistrict] || currentDistrict}</Badge>
          </div>
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Shield className="w-6 h-6 text-violet-600" />
            DSP Dashboard — {user?.full_name || "DSP"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Deputy Superintendent of Police • {DISTRICT_DISPLAY[currentDistrict] || currentDistrict} • Andhra Pradesh Pilot
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline" size="sm" className="border-cyan-300 text-cyan-800 hover:bg-cyan-50">
            <Link to="/attendance"><Calendar className="w-4 h-4 mr-1 text-cyan-600" /> Attendance</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="border-emerald-300 text-emerald-800 hover:bg-emerald-50">
            <Link to="/duty-management"><Clock className="w-4 h-4 mr-1 text-emerald-600" /> Duty Mgmt</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="border-indigo-300 text-indigo-800 hover:bg-indigo-50">
            <Link to="/nyaya-ai"><Shield className="w-4 h-4 mr-1 text-indigo-600" /> Nyaya AI</Link>
          </Button>
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
          <button key={tab} onClick={() => handleTabChange(tab)}
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
                {duties.length === 0 ? (
                  <p className="text-center py-6 text-sm text-muted-foreground">No duty assignments recorded in this district</p>
                ) : (
                  duties.slice(0, 20).map(d => (
                    <div key={d.id} className="flex items-center justify-between border rounded-lg p-3 text-sm">
                      <div>
                        <p className="font-medium">{d.officer_name || d.officer_email}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.duty_type?.replace(/_/g," ")} • {d.police_station || d.location || "District Beat"} • {d.shift} shift • {d.duty_date || moment(d.created_at).format("DD MMM YYYY")}
                        </p>
                        {d.instructions && <p className="text-xs text-slate-500 mt-0.5 italic">{d.instructions}</p>}
                      </div>
                      <Badge className={`text-xs ${d.status === "active" ? "bg-green-600" : d.status === "completed" ? "bg-gray-500" : "bg-yellow-500"} text-white`}>
                        {d.status?.toUpperCase()}
                      </Badge>
                    </div>
                  ))
                )}
            </CardContent>
          </Card>
          <Button asChild>
            <Link to="/duty-management">Manage Duties →</Link>
          </Button>
        </div>
      )}

      {activeTab === "attendance" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-600" />
                  District Officer Attendance ({attendance.length})
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Live geo-verified attendance monitoring for {DISTRICT_DISPLAY[currentDistrict] || currentDistrict}
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline" className="text-xs">
                  <Link to="/attendance">Mark Attendance System →</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="text-xs">
                  <Link to="/workforce-monitor">Workforce Monitor →</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Present Today", count: attendance.filter(a => a.status === "present" && moment(a.date || a.created_at).isSame(moment(), "day")).length, color: "text-green-700 bg-green-50" },
                  { label: "Late Today", count: attendance.filter(a => a.status === "late" && moment(a.date || a.created_at).isSame(moment(), "day")).length, color: "text-yellow-700 bg-yellow-50" },
                  { label: "Total Logged", count: attendance.length, color: "text-blue-700 bg-blue-50" },
                ].map((s, i) => (
                  <Card key={i} className={`${s.color} border-0`}>
                    <CardContent className="p-3 text-center">
                      <p className="font-bold text-2xl">{s.count}</p>
                      <p className="text-xs font-medium">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {attendance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30 text-cyan-600" />
                  <p className="font-medium text-foreground">No attendance records found for this district</p>
                  <p className="text-xs text-muted-foreground mt-1">Officers marking attendance in stations will appear here in real-time.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attendance.slice(0, 30).map(a => (
                    <div key={a.id} className="flex items-center justify-between border rounded-lg p-3 text-sm hover:bg-muted/40 transition">
                      <div>
                        <p className="font-medium">{a.officer_name || a.officer_email}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.police_station || a.district || "Station Beat"} • {moment(a.date || a.created_at).format("ddd, DD MMM YYYY • hh:mm A")}
                          {a.verified && <span className="ml-1.5 text-green-600 font-medium">✓ Geo-verified</span>}
                        </p>
                      </div>
                      <Badge className={
                        a.status === "present" ? "bg-green-100 text-green-700 border-green-300" :
                        a.status === "late" ? "bg-yellow-100 text-yellow-700 border-yellow-300" :
                        "bg-red-100 text-red-700 border-red-300"
                      } variant="outline">
                        {a.status?.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "alerts" && (
        <div className="space-y-6">
          {/* Card: Authoritative Form */}
          <Card id="dsp-alert-form" className="border-2 border-primary/20 shadow-sm">
            <CardHeader className="bg-primary/5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  {editingAlertId ? "Edit Alert / Public Notice" : "Create & Publish Alert / Public Notice"}
                </CardTitle>
                {editingAlertId && (
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800 border-amber-300">
                    Editing Mode
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Single control point for public alerts. Published items reflect immediately on the Home Public Notice Board and Home Header Alerts in real-time.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-3">
                {/* Title */}
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Alert / Notice Title *
                  </label>
                  <Input
                    placeholder="e.g. Cyber Fraud Alert: Do Not Share OTP | Missing Person Notice"
                    value={alertForm.title}
                    onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Alert Description / Message *
                  </label>
                  <Textarea
                    placeholder="Enter the full description, warning, advisory, or instructions for the public..."
                    value={alertForm.message}
                    onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                    className="min-h-[80px] text-sm resize-y"
                  />
                </div>

                {/* Selectors Grid: Destination, Category, Severity, District */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {/* Public Destination */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Public Destination *
                    </label>
                    <Select
                      value={alertForm.destination}
                      onValueChange={(val) => setAlertForm({ ...alertForm, destination: val })}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select Destination" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BOTH">Both (Notice Board & Header Alerts)</SelectItem>
                        <SelectItem value="PUBLIC_NOTICE">Home Public Notice Board Only</SelectItem>
                        <SelectItem value="SMART_CRIME_ALERT">Home Header / Smart Crime Alerts Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category / Type */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Category / Type
                    </label>
                    <Select
                      value={alertForm.category}
                      onValueChange={(val) => setAlertForm({ ...alertForm, category: val })}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="crime_alert">Crime Alert</SelectItem>
                        <SelectItem value="advisory">Public Advisory</SelectItem>
                        <SelectItem value="missing">Missing Person</SelectItem>
                        <SelectItem value="reward">Reward Announced</SelectItem>
                        <SelectItem value="emergency">Emergency Alert</SelectItem>
                        <SelectItem value="cyber_crime">Cyber Crime</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Severity / Priority
                    </label>
                    <Select
                      value={alertForm.severity}
                      onValueChange={(val) => setAlertForm({ ...alertForm, severity: val })}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select Severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (General)</SelectItem>
                        <SelectItem value="medium">Medium (Advisory)</SelectItem>
                        <SelectItem value="high">High (Alert)</SelectItem>
                        <SelectItem value="critical">Critical (Emergency)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* District */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      District Jurisdiction
                    </label>
                    <Select
                      value={alertForm.district}
                      onValueChange={(val) => setAlertForm({ ...alertForm, district: val })}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select District" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All AP">All AP (Statewide)</SelectItem>
                        {PILOT_DISTRICTS.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white gap-1.5"
                    disabled={savingAlert}
                    onClick={() => handleSaveAlert(true)}
                  >
                    {savingAlert ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {editingAlertId ? "Update & Publish Live" : "Publish to Live Public Board"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={savingAlert}
                    onClick={() => handleSaveAlert(false)}
                  >
                    <Save className="w-4 h-4" />
                    {editingAlertId ? "Save Changes as Draft" : "Save as Draft (Unpublished)"}
                  </Button>

                  {editingAlertId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelEditAlert}
                      disabled={savingAlert}
                    >
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* List of Managed Alerts */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Managed District Alerts & Notices ({alerts.length})
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Real-time database records in <code className="bg-muted px-1 py-0.5 rounded text-[11px]">public.station_alerts</code>
                </p>
              </div>

              {/* Filter controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <Select
                  value={alertFilterStatus}
                  onValueChange={setAlertFilterStatus}
                >
                  <SelectTrigger className="h-8 text-xs w-[130px]">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Records</SelectItem>
                    <SelectItem value="published">Published Only</SelectItem>
                    <SelectItem value="draft">Drafts Only</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={alertDestinationFilter}
                  onValueChange={setAlertDestinationFilter}
                >
                  <SelectTrigger className="h-8 text-xs w-[150px]">
                    <SelectValue placeholder="Destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Destinations</SelectItem>
                    <SelectItem value="BOTH">Both Destinations</SelectItem>
                    <SelectItem value="PUBLIC_NOTICE">Notice Board Only</SelectItem>
                    <SelectItem value="SMART_CRIME_ALERT">Header Alerts Only</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm" onClick={loadData} title="Refresh alerts from database">
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {(() => {
                const safeAlerts = Array.isArray(alerts) ? alerts : [];
                const displayedAlerts = safeAlerts.filter((a) => {
                  if (!a || typeof a !== "object") return false;
                  let aud = a.target_audience;
                  if (typeof aud === "string") {
                    try { aud = JSON.parse(aud); } catch { aud = {}; }
                  }
                  if (alertFilterStatus === "published" && !a.is_active) return false;
                  if (alertFilterStatus === "draft" && a.is_active) return false;
                  if (alertDestinationFilter !== "all") {
                    const dest = aud?.destination || getAlertDestination(a);
                    if (dest !== alertDestinationFilter && dest !== "BOTH") return false;
                  }
                  return true;
                });

                if (displayedAlerts.length === 0) {
                  return (
                    <div className="p-8 text-center text-muted-foreground text-sm border border-dashed rounded-lg">
                      <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="font-semibold text-foreground">No alerts match the selected filter</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Use the form above to publish a new alert or change your filters.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {displayedAlerts.map((a) => {
                      if (!a) return null;
                      let aud = a.target_audience;
                      if (typeof aud === "string") {
                        try { aud = JSON.parse(aud); } catch { aud = {}; }
                      }
                      const dest = aud?.destination || getAlertDestination(a);
                      const isPub = a.is_active !== false && aud?.status !== "draft";

                      const sev = String(a.severity || "medium").toLowerCase();
                      const sevColor =
                        sev === "critical"
                          ? "bg-red-100 text-red-700 border-red-200"
                          : sev === "high"
                          ? "bg-orange-100 text-orange-700 border-orange-200"
                          : sev === "medium"
                          ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                          : "bg-green-100 text-green-700 border-green-200";

                      const destLabel =
                        dest === "BOTH"
                          ? "Notice Board & Header"
                          : dest === "PUBLIC_NOTICE"
                          ? "Notice Board Only"
                          : "Header Alerts Only";

                      const categoryLabel = String(aud?.notice_type || a.alert_type || "advisory").replace("_", " ");

                      return (
                        <div
                          key={a.id}
                          className={`border rounded-xl p-4 transition-all hover:shadow-sm ${
                            isPub ? "bg-card" : "bg-muted/30 border-dashed"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                {/* Status Badge */}
                                <Badge
                                  className={`text-[10px] font-bold ${
                                    isPub
                                      ? "bg-emerald-600 text-white"
                                      : "bg-amber-500 text-white"
                                  }`}
                                >
                                  {isPub ? "● PUBLISHED (LIVE)" : "○ DRAFT / INACTIVE"}
                                </Badge>

                                {/* Destination Badge */}
                                <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">
                                  {destLabel}
                                </Badge>

                                {/* Severity Badge */}
                                <Badge variant="outline" className={`text-[10px] font-semibold ${sevColor}`}>
                                  {(a.severity || "medium").toUpperCase()}
                                </Badge>

                                {/* Category */}
                                <Badge variant="secondary" className="text-[10px]">
                                  {categoryLabel}
                                </Badge>

                                {/* District */}
                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
                                  <MapPin className="w-3 h-3" />
                                  {a.district || "All AP"}
                                </span>
                              </div>

                              <h4 className="font-bold text-sm text-foreground">{a.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">
                                {a.message}
                              </p>

                              <div className="flex items-center gap-3 mt-2.5 text-[11px] text-muted-foreground/80 flex-wrap">
                                <span>Published by: <strong>{a.publisher_name || a.published_by || "DSP Officer"}</strong></span>
                                <span>•</span>
                                <span>{moment(a.created_at).format("DD MMM YYYY, hh:mm A")}</span>
                                <span>({moment(a.created_at).fromNow()})</span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex sm:flex-col items-center gap-1.5 shrink-0 self-end sm:self-start">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs gap-1"
                                onClick={() => startEditAlert(a)}
                                title="Edit Alert"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                Edit
                              </Button>

                              <Button
                                size="sm"
                                variant={isPub ? "secondary" : "default"}
                                className={`h-8 text-xs gap-1 ${
                                  isPub
                                    ? "text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                }`}
                                onClick={() => handleToggleAlert(a)}
                                title={isPub ? "Unpublish from public views" : "Publish to live public views"}
                              >
                                {isPub ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                {isPub ? "Unpublish" : "Publish"}
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                                onClick={() => handleDeleteAlert(a.id, a.title)}
                                disabled={deletingAlertId === a.id}
                                title="Delete from Database"
                              >
                                {deletingAlertId === a.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}