/**
 * LEVEL 1 — Police Station Dashboard
 * For: SI, Police Constable, Special Branch
 * Scope: Own station cases only
 * Pilot Districts: Visakhapatnam, Vijayawada, Guntur, Nellore, Tirupati
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
  Shield, FileText, Clock, CheckCircle2, AlertTriangle, Users, Calendar,
  LogOut, Eye, MessageSquare, Plus, Edit2, Trash2, ArrowLeft, Bell, MapPin, Loader2, Zap
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import CaseChat from "@/components/CaseChat";
import moment from "moment";

// Removed DEMO constants

const STATUS_COLORS = {
  filed: "bg-blue-100 text-blue-700 border-blue-200",
  under_review: "bg-yellow-100 text-yellow-700 border-yellow-200",
  assigned: "bg-orange-100 text-orange-700 border-orange-200",
  investigating: "bg-purple-100 text-purple-700 border-purple-200",
  escalated: "bg-red-100 text-red-700 border-red-200",
  court_hearing: "bg-indigo-100 text-indigo-700 border-indigo-200",
  resolved: "bg-green-100 text-green-700 border-green-200",
  closed: "bg-gray-100 text-gray-700 border-gray-200",
};

const PILOT_DISTRICTS = ["Visakhapatnam", "Krishna", "Guntur", "Nellore", "Chittoor"];

export default function StationDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [chatCaseId, setChatCaseId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [newCaseNote, setNewCaseNote] = useState({});
  const [cyberCases, setCyberCases] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [activeTab, setActiveTab] = useState("cases");
  const [stationName, setStationName] = useState("");
  const [districtName, setDistrictName] = useState("");

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
      instructions: extra.text || extra.original_notes || (typeof d.notes === 'string' && !d.notes.trim().startsWith('{') ? d.notes : ''),
    };
  };

  useEffect(() => {
    loadData();

    // Supabase Realtime for station duties, attendances, complaints, and cyber crime reports
    const channel = supabase
      .channel('station-dashboard-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'duty_assignments' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendances' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cyber_crime_reports' }, () => {
        loadData();
      })
      .subscribe((status, err) => {
        if (err) console.warn("Station dashboard realtime warning:", status, err);
      });

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

    try {
      // Resolve officer station & district dynamically from DB / master tables
      let myStation = me.police_station || me.station;
      let myDistrict = me.district;

      if ((!myStation || !myDistrict) && me.md_station_id) {
        try {
          const { data: stn } = await supabase
            .from('md_police_stations')
            .select('id, name, district_id, md_districts:district_id(id, name)')
            .eq('id', me.md_station_id)
            .maybeSingle();
          if (stn) {
            myStation = myStation || stn.name;
            myDistrict = myDistrict || stn.md_districts?.name;
          }
        } catch (e) {
          console.warn("Station lookup error:", e);
        }
      }

      if (!myStation || !myDistrict) {
        try {
          const { data: comp } = await supabase
            .from('complaints')
            .select('police_station, district')
            .or(`assigned_officer.ilike.%${me.full_name || ''}%,assigned_officer.ilike.%${me.email || ''}%`)
            .not('police_station', 'is', null)
            .limit(1);
          if (comp && comp.length > 0) {
            myStation = myStation || comp[0].police_station;
            myDistrict = myDistrict || comp[0].district;
          }
        } catch (e) {
          console.warn("Complaint station lookup error:", e);
        }
      }

      if (!myStation || !myDistrict) {
        try {
          const { data: att } = await supabase
            .from('attendances')
            .select('police_station, district')
            .or(`officer_email.eq.${me.email},officer_name.ilike.%${me.full_name || ''}%`)
            .not('police_station', 'is', null)
            .limit(1);
          if (att && att.length > 0) {
            myStation = myStation || att[0].police_station;
            myDistrict = myDistrict || att[0].district;
          }
        } catch (e) {
          console.warn("Attendance station lookup error:", e);
        }
      }

      if (!myStation || !myDistrict) {
        try {
          const { data: defaultStn } = await supabase
            .from('md_police_stations')
            .select('name, md_districts:district_id(name)')
            .limit(1);
          if (defaultStn && defaultStn.length > 0) {
            myStation = myStation || defaultStn[0].name;
            myDistrict = myDistrict || defaultStn[0].md_districts?.name;
          }
        } catch (e) {
          console.warn("Default master station lookup error:", e);
        }
      }

      setStationName(myStation || "");
      setDistrictName(myDistrict || "");

      // Station level: load cases from own station/district
      let complaintsData = [];
      const { data: stationComps, error: err } = await supabase
        .from("complaints")
        .select("*")
        .or(`police_station.ilike.%${myStation}%,district.ilike.%${myDistrict}%,assigned_officer.ilike.%${me.full_name || ''}%`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!err && stationComps && stationComps.length > 0) {
        complaintsData = stationComps;
      } else {
        const { data: allComps } = await supabase
          .from("complaints")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(30);
        complaintsData = allComps || [];
      }

      // Map complaint properties for the UI
      const mappedComplaints = complaintsData.map(c => ({
        ...c,
        case_id: c.complaint_number || c.case_id || `NM-${c.id?.slice(0, 8)}`,
        category: c.complaint_type || c.category || "general",
        created_date: c.created_at || c.created_date,
        location: c.location || (c.location_coordinates ? "Coordinates Provided" : "Unknown")
      }));
      setComplaints(mappedComplaints);

      // Station & Subordinate duties
      let dutiesData = [];
      let dQuery = supabase.from("duty_assignments").select("*").order("created_at", { ascending: false });
      dQuery = dQuery.or(`police_station.ilike.%${myStation}%,district.ilike.%${myDistrict}%,officer_email.eq.${me.email},officer_name.ilike.%${me.full_name || ''}%`);
      const { data: stationDuties } = await dQuery.limit(50);
      if (stationDuties) {
        dutiesData = stationDuties.map(parseDuty);
      }
      setDuties(dutiesData);

      // Cyber fraud cases for this station/district
      let cyberData = [];
      let { data: cyberRes } = await supabase
        .from("cyber_crime_reports")
        .select("*")
        .ilike("victim_district", `%${myDistrict}%`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!cyberRes || cyberRes.length === 0) {
        const { data: allCyber } = await supabase
          .from("cyber_crime_reports")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);
        cyberRes = allCyber;
      }

      if (cyberRes) {
        cyberData = cyberRes.map(c => ({
          ...c,
          case_id: c.case_number || c.case_id || `NM-${c.id?.slice(0, 8)}`,
          created_date: c.created_at || c.created_date
        }));
      }
      setCyberCases(cyberData);

      // Today's station attendance
      let attendanceData = [];
      const { data: attRes, error: attErr } = await supabase
        .from("attendances")
        .select("*")
        .or(`police_station.ilike.%${myStation}%,district.ilike.%${myDistrict}%`)
        .order("created_at", { ascending: false })
        .limit(30);

      if (!attErr && attRes) {
        attendanceData = attRes;
      }
      setTodayAttendance(attendanceData);

    } catch (err) {
      console.error("Error loading data in StationDashboard:", err);
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
        update: `Status changed to ${newStatus} by ${user?.full_name || user?.email}`,
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
      console.error("Error updating status:", err);
      toast.error("Failed to update case status");
    } finally {
      setUpdatingId(null);
    }
  };

  const addNote = async (id) => {
    const note = newCaseNote[id];
    if (!note?.trim()) return;
    try {
      const c = complaints.find(c => c.id === id);
      const newActionUpdates = [...(c?.action_updates || []), {
        date: new Date().toISOString(),
        update: note,
        by: user?.full_name || user?.email,
      }];
      const { error } = await supabase
        .from("complaints")
        .update({
          action_updates: newActionUpdates
        })
        .eq("id", id);
      if (error) throw error;
      toast.success("Note added");
      setNewCaseNote(prev => ({ ...prev, [id]: "" }));
      loadData();
    } catch (err) {
      console.error("Error adding note:", err);
      toast.error("Failed to add note");
    }
  };

  const filtered = complaints.filter(c => statusFilter === "all" || c.status === statusFilter);

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => ["filed", "under_review"].includes(c.status)).length,
    investigating: complaints.filter(c => ["assigned", "investigating"].includes(c.status)).length,
    resolved: complaints.filter(c => ["resolved", "closed"].includes(c.status)).length,
    critical: complaints.filter(c => c.priority === "critical").length,
  };

  const todayDuty = duties.find(d => d.duty_date === moment().format("YYYY-MM-DD"));

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-blue-600 text-white text-xs">LEVEL 1 — STATION</Badge>
            <Badge variant="outline" className="text-xs">{user?.police_station || user?.station || stationName || "Station"}</Badge>
          </div>
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            {user?.full_name || "Officer"} — Station Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            {user?.designation || user?.user_type || "Station Officer"} • {user?.police_station || user?.station || stationName || "Station"} • {user?.district || districtName || "Andhra Pradesh"} • AP Pilot
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline" size="sm">
            <Link to="/attendance"><Calendar className="w-4 h-4 mr-1" /> Attendance</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="border-yellow-400 text-yellow-700 hover:bg-yellow-50">
            <Link to="/cyber-ops"><Zap className="w-4 h-4 mr-1 text-yellow-600" /> Cyber Ops</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="border-indigo-300 text-indigo-800 hover:bg-indigo-50">
            <Link to="/nyaya-ai"><MessageSquare className="w-4 h-4 mr-1 text-indigo-600" /> Nyaya AI</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/duty-management"><Clock className="w-4 h-4 mr-1" /> My Duties</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/file-complaint"><Plus className="w-4 h-4 mr-1" /> File FIR</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/smart-alerts"><Bell className="w-4 h-4 mr-1" /> Alerts</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => logout()} className="text-red-600 border-red-200">
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>
      </div>

      {/* Today's Duty Banner */}
      {todayDuty && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="font-semibold text-emerald-800 text-sm">Today's Duty: {(todayDuty.duty_type ? todayDuty.duty_type.replace(/_/g, " ").toUpperCase() : "GENERAL DUTY")}</p>
            <p className="text-xs text-emerald-700">{todayDuty.location || "Station"} • {todayDuty.shift || "general"} shift{todayDuty.start_time ? ` • ${todayDuty.start_time}–${todayDuty.end_time}` : ""}</p>
          </div>
          <Badge className={`ml-auto ${todayDuty.status === "active" ? "bg-green-500" : "bg-yellow-500"} text-white`}>
            {(todayDuty.status || "").toUpperCase()}
          </Badge>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Cases", value: stats.total, color: "text-primary" },
          { label: "Pending", value: stats.pending, color: "text-yellow-600" },
          { label: "Investigating", value: stats.investigating, color: "text-blue-600" },
          { label: "Resolved", value: stats.resolved, color: "text-green-600" },
          { label: "Critical", value: stats.critical, color: "text-red-600" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="text-center">
              <CardContent className="p-3">
                <p className={`font-heading font-bold text-2xl ${s.color}`}>{s.value}</p>
                <p className="text-muted-foreground text-xs">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-border overflow-x-auto">
        {[
          { key: "cases", label: `📋 Cases (${filtered.length})` },
          { key: "cyber", label: `🔐 Cyber Ops (${cyberCases.length})` },
          { key: "attendance", label: `✅ Today's Attendance (${todayAttendance.length})` },
          { key: "duties", label: `📅 Duties (${duties.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeTab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* CASES TAB */}
      {activeTab === "cases" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Station Cases
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.keys(STATUS_COLORS).map(s => (
                  <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />No cases found
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.slice(0, 25).map(c => (
                  <div key={c.id} className={`border rounded-xl p-4 transition hover:shadow-sm ${c.priority === "critical" ? "border-red-200 bg-red-50/30" : "border-border"}`}>
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs text-muted-foreground">{c.case_id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLORS[c.status] || ""}`}>
                            {c.status?.replace("_", " ")}
                          </span>
                          {c.priority === "critical" && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200">CRITICAL</span>}
                          {c.is_escalated && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700 border border-orange-200">ESCALATED</span>}
                        </div>
                        <p className="font-semibold truncate">{c.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{c.category?.replace("_", " ")} • {c.location} • {moment(c.created_date).fromNow()}</p>
                        <p className="text-xs text-muted-foreground">👤 {c.complainant_name} • {c.complainant_phone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={c.status} onValueChange={v => updateStatus(c.id, v)} disabled={updatingId === c.id || c.id?.startsWith("demo")}>
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
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                          onClick={() => setChatCaseId(chatCaseId === c.case_id ? null : c.case_id)}>
                          <MessageSquare className={`w-4 h-4 ${chatCaseId === c.case_id ? "text-primary" : ""}`} />
                        </Button>
                      </div>
                      {chatCaseId === c.case_id && <div className="w-full mt-2"><CaseChat caseId={c.case_id} onClose={() => setChatCaseId(null)} /></div>}
                      <div className="w-full flex gap-2 mt-1">
                        <Input placeholder="Add investigation note..." className="h-7 text-xs flex-1"
                          value={newCaseNote[c.id] || ""}
                          onChange={e => setNewCaseNote(prev => ({ ...prev, [c.id]: e.target.value }))}
                          onKeyDown={e => e.key === "Enter" && !c.id?.startsWith("demo") && addNote(c.id)} />
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2"
                          onClick={() => !c.id?.startsWith("demo") && addNote(c.id)}>
                          <Edit2 className="w-3 h-3 mr-1" /> Note
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CYBER OPS TAB */}
      {activeTab === "cyber" && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 mb-2">
            🔐 <strong>Golden Hour:</strong> Report cyber fraud within 60 mins to freeze fraudster accounts. Call 1930 or use{" "}
            <Link to="/golden-hour-cyber" className="underline font-semibold">Golden Hour Portal</Link>
          </div>
          {cyberCases.map(c => (
            <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className={`border-l-4 ${c.recovery_status === "recovered" ? "border-l-green-500" : c.amount_recovered > 0 ? "border-l-yellow-500" : "border-l-red-500"}`}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">{c.case_id}</span>
                        <Badge className={`text-[10px] ${c.recovery_status === "recovered" ? "bg-green-600" : c.amount_recovered > 0 ? "bg-yellow-500" : "bg-red-600"} text-white`}>
                          {(c.recovery_status ? c.recovery_status.replace(/_/g, " ").toUpperCase() : "PENDING")}
                        </Badge>
                      </div>
                      <p className="font-semibold text-sm">{c.fraud_type}</p>
                      <p className="text-xs text-muted-foreground">👤 {c.victim_name} • 📞 {c.victim_phone}</p>
                      <div className="flex gap-4 mt-1">
                        <span className="text-xs text-red-600 font-medium">Lost: ₹{(c.amount_lost || 0).toLocaleString()}</span>
                        <span className="text-xs text-green-600 font-medium">Recovered: ₹{(c.amount_recovered || 0).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">🏦 {c.bank_name} • {moment(c.created_date).fromNow()}</p>
                    </div>
                    <Button asChild size="sm" className="bg-blue-700 hover:bg-blue-800">
                      <Link to="/golden-hour-cyber"><Eye className="w-3.5 h-3.5 mr-1" /> Track</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* ATTENDANCE TAB */}
      {activeTab === "attendance" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Today's station attendance — {moment().format("DD MMM YYYY")}</p>
            <Button asChild size="sm" variant="outline"><Link to="/attendance"><Calendar className="w-3.5 h-3.5 mr-1" /> Mark Mine</Link></Button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Present", count: todayAttendance.filter(a => a.status === "present").length, color: "text-green-700 bg-green-50" },
              { label: "Late", count: todayAttendance.filter(a => a.status === "late").length, color: "text-yellow-700 bg-yellow-50" },
              { label: "Absent", count: todayAttendance.filter(a => a.status === "absent").length, color: "text-red-700 bg-red-50" },
            ].map((s, i) => (
              <Card key={i} className={`${s.color} border-0`}>
                <CardContent className="p-3 text-center">
                  <p className="font-bold text-2xl">{s.count}</p>
                  <p className="text-xs font-medium">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {todayAttendance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30 text-cyan-600" />
              <p className="font-medium text-foreground">No attendance records logged for today yet</p>
              <p className="text-xs text-muted-foreground mt-1">Officers marking attendance will update this list automatically in real-time.</p>
            </div>
          ) : (
            todayAttendance.map(a => (
              <div key={a.id} className="flex items-center justify-between border border-border rounded-xl p-3 text-sm">
                <div>
                  <p className="font-semibold">{a.officer_name || a.officer_email}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.police_station || a.district || "Station"} • {moment(a.date || a.created_at).format("DD MMM YYYY")}
                    {a.verified && <span className="ml-1.5 text-green-600 font-medium">✓ Geo-verified</span>}
                  </p>
                </div>
                <Badge className={a.status === "present" ? "bg-green-100 text-green-700 border-green-300" : a.status === "late" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"} variant="outline">
                  {(a.status || "").toUpperCase()}
                </Badge>
              </div>
            ))
          )}
        </div>
      )}

      {/* DUTIES TAB */}
      {activeTab === "duties" && (
        <div className="space-y-3">
          <div className="flex justify-end mb-2">
            <Button asChild size="sm" variant="outline"><Link to="/duty-management"><Plus className="w-3.5 h-3.5 mr-1" /> Manage Duties</Link></Button>
          </div>
          {duties.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">No duties assigned for this station yet</p>
          ) : (
            duties.map(d => (
              <Card key={d.id} className={`border-l-4 ${d.status === "active" ? "border-l-green-500" : d.status === "completed" ? "border-l-gray-400" : "border-l-blue-400"}`}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold capitalize">{d.officer_name || d.officer_email}: {(d.duty_type ? d.duty_type.replace(/_/g, " ") : "duty")} — {d.shift || "general"} shift</p>
                      <p className="text-xs text-muted-foreground">📍 {d.location || d.police_station || "Station Beat"} • {d.duty_date || moment(d.created_at).format("DD MMM YYYY")}{d.start_time ? ` • ${d.start_time}–${d.end_time}` : ""}</p>
                      {d.instructions && <p className="text-xs text-slate-600 mt-1 italic">Instructions: {d.instructions}</p>}
                    </div>
                    <Badge className={d.status === "active" ? "bg-green-600 text-white" : d.status === "completed" ? "bg-gray-400 text-white" : "bg-blue-600 text-white"}>
                      {(d.status || "").toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}