/**
 * COURT DASHBOARD
 * Cases flow: Police marks status → "court_hearing" → appears here for scheduling
 * Court Officer schedules → assigns judge, date, type → updates back to complaint
 */
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2, Scale, Calendar, FileText, Search,
  Loader2, CheckCircle2, AlertTriangle, Gavel, LogOut,
  Clock, ArrowRight, Plus, BookOpen, RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
import { toast } from "sonner";

const AP_COURTS = [
  { name: "High Court of Andhra Pradesh, Amaravati", district: "All" },
  { name: "District & Sessions Court, Visakhapatnam", district: "Visakhapatnam" },
  { name: "District & Sessions Court, Vijayawada", district: "Krishna" },
  { name: "District & Sessions Court, Guntur", district: "Guntur" },
  { name: "District & Sessions Court, Tirupati", district: "Chittoor" },
  { name: "District & Sessions Court, Nellore", district: "Nellore" },
  { name: "Fast Track Court, Guntur", district: "Guntur" },
  { name: "Family Court, Visakhapatnam", district: "Visakhapatnam" },
  { name: "Family Court, Vijayawada", district: "Krishna" },
  { name: "POCSO Fast Track Court, Tirupati", district: "Chittoor" },
];

const HEARING_TYPES = ["Arguments", "Evidence", "Hearing", "Judgment", "Appeal", "Bail", "Remand"];

const JUDGES = [
  "Hon. Justice K. Prasad", "Hon. Justice M. Rao", "Hon. Justice P. Reddy",
  "Hon. Justice S. Devi", "Hon. Justice A. Sharma", "Hon. Justice V. Kumar",
];

const statusColors = {
  today: "bg-red-100 text-red-700 border-red-300",
  scheduled: "bg-blue-100 text-blue-700 border-blue-300",
  completed: "bg-green-100 text-green-700 border-green-300",
  adjourned: "bg-yellow-100 text-yellow-700 border-yellow-300",
};

export default function CourtDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pendingCases, setPendingCases] = useState([]);
  const [scheduledCases, setScheduledCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pending");
  const [filterStatus, setFilterStatus] = useState("all");
  const [schedulingId, setSchedulingId] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ date: "", judge: "", type: "Hearing", court: "", notes: "" });

  const { user: authUser, profile, logout } = useAuth();

  useEffect(() => { loadData(); }, [authUser, profile]);

  const loadData = async () => {
    const me = profile ?? authUser ?? null;
    setUser(me);
    if (!me) {
      setLoading(false);
      return;
    }
    const utype = me.user_type || me.role || "";
    if (!["court", "court_officer", "admin"].includes(utype)) { navigate("/dashboard"); return; }

    try {
      // Fetch cases in court_hearing status
      let allHearingCases = [];
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .eq("status", "court_hearing")
        .order("created_at", { ascending: false });
        
      if (!error && data) {
        allHearingCases = data.map(c => {
          // Parse court date from action updates if available
          let parsedCourtDate = null;
          let parsedCourtDetails = null;
          if (c.action_updates && Array.isArray(c.action_updates)) {
             const scheduleUpdate = c.action_updates.find(u => u.update && u.update.startsWith("Court hearing scheduled at"));
             if (scheduleUpdate) {
                // Example format: Court hearing scheduled at High Court on 2026-08-15. Judge: Hon. John...
                const match = scheduleUpdate.update.match(/on\s([^.]+)\./);
                if (match && match[1]) {
                   parsedCourtDate = match[1].trim();
                } else {
                   parsedCourtDate = scheduleUpdate.date; // fallback
                }
                parsedCourtDetails = scheduleUpdate.update;
             }
          }
          return {
            ...c,
            court_date: parsedCourtDate,
            court_details_parsed: parsedCourtDetails,
            case_id: c.complaint_number || c.case_id || `NM-${c.id?.slice(0, 8)}`,
            category: c.complaint_type || c.category || "general",
            created_date: c.created_at || c.created_date,
            location: c.location || (c.location_coordinates ? "Coordinates Provided" : "Unknown")
          };
        });
      }

      setPendingCases(allHearingCases.filter(c => !c.court_date));
      setScheduledCases(allHearingCases.filter(c => !!c.court_date));
    } catch (err) {
      console.error("Error loading data in CourtDashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const scheduleHearing = async (complaint) => {
    if (!scheduleForm.date || !scheduleForm.judge || !scheduleForm.court) {
      toast.error("Please fill hearing date, judge, and court name");
      return;
    }
    try {
      const newActionUpdates = [
        ...(complaint.action_updates || []),
        {
          date: new Date().toISOString(),
          update: `Court hearing scheduled at ${scheduleForm.court} on ${scheduleForm.date}. Judge: ${scheduleForm.judge}. Type: ${scheduleForm.type}. ${scheduleForm.notes ? "Notes: " + scheduleForm.notes : ""}`,
          by: user?.full_name || "Court Officer",
        },
      ];
      const { error } = await supabase
        .from("complaints")
        .update({
          action_updates: newActionUpdates
        })
        .eq("id", complaint.id);
      if (error) throw error;
      toast.success("Hearing scheduled successfully");
      setSchedulingId(null);
      setScheduleForm({ date: "", judge: "", type: "Hearing", court: "", notes: "" });
      loadData();
    } catch (err) {
      console.error("Error scheduling hearing:", err);
      toast.error("Failed to schedule hearing");
    }
  };

  const completeHearing = async (complaint, outcome) => {
    try {
      const newActionUpdates = [
        ...(complaint.action_updates || []),
        {
          date: new Date().toISOString(),
          update: `Court hearing completed. Outcome: ${outcome}.`,
          by: user?.full_name || "Court Officer",
        },
      ];
      const { error } = await supabase
        .from("complaints")
        .update({
          status: outcome === "resolved" ? "resolved" : "court_hearing",
          action_updates: newActionUpdates
        })
        .eq("id", complaint.id);
      if (error) throw error;
      toast.success("Hearing outcome recorded");
      loadData();
    } catch (err) {
      console.error("Error completing hearing:", err);
      toast.error("Failed to record outcome");
    }
  };

  const assignLawyer = async (complaint, lawyerEmail) => {
    if (!lawyerEmail.trim()) return;
    try {
      const newActionUpdates = [
        ...(complaint.action_updates || []),
        {
          date: new Date().toISOString(),
          update: `Lawyer assigned: ${lawyerEmail}`,
          by: user?.full_name || "Court Officer",
        },
      ];
      const { error } = await supabase
        .from("complaints")
        .update({
          assigned_lawyer: lawyerEmail,
          action_updates: newActionUpdates
        })
        .eq("id", complaint.id);
      if (error) throw error;
      toast.success("Lawyer assigned");
      loadData();
    } catch (err) {
      console.error("Error assigning lawyer:", err);
      toast.error("Failed to assign lawyer");
    }
  };

  const filteredPending = pendingCases.filter(c =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.case_id?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredScheduled = scheduledCases.filter(c =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.case_id?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    pending: pendingCases.length,
    scheduled: scheduledCases.length,
    today: scheduledCases.filter(c => moment(c.court_date).isSame(moment(), "day")).length,
    thisWeek: scheduledCases.filter(c => moment(c.court_date).isSame(moment(), "week")).length,
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-700 flex items-center justify-center">
            <Gavel className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-2xl">Court Case Management</h1>
            <p className="text-muted-foreground text-sm">
              Andhra Pradesh Judicial Portal — {user?.full_name || "Court Officer"} • {user?.district || "AP"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
          <Button variant="outline" size="sm" onClick={() => logout()}><LogOut className="w-4 h-4 mr-1" /> Logout</Button>
        </div>
      </div>

      {/* How Cases Reach Court — info banner */}
      <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
        <p className="font-semibold text-amber-800 mb-1">⚖️ Case Flow to Court:</p>
        <div className="flex items-center gap-1 flex-wrap text-xs text-amber-700">
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Complaint Filed</span>
          <ArrowRight className="w-3 h-3" />
          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Investigating</span>
          <ArrowRight className="w-3 h-3" />
          <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Escalated</span>
          <ArrowRight className="w-3 h-3" />
          <span className="bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-semibold">Court Hearing ← Police sends here</span>
          <ArrowRight className="w-3 h-3" />
          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Resolved / Judgment</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Pending Scheduling", value: stats.pending, color: "text-orange-700", bg: "bg-orange-50" },
          { label: "Scheduled Hearings", value: stats.scheduled, color: "text-blue-700", bg: "bg-blue-50" },
          { label: "Today's Hearings", value: stats.today, color: "text-red-700", bg: "bg-red-50" },
          { label: "This Week", value: stats.thisWeek, color: "text-amber-700", bg: "bg-amber-50" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={`${s.bg} border-0`}>
              <CardContent className="p-3 text-center">
                <p className={`font-bold text-xl ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-border">
        {[
          { key: "pending", label: `⏳ Pending Scheduling (${stats.pending})` },
          { key: "scheduled", label: `📅 Cause List (${stats.scheduled})` },
          { key: "courts", label: "🏛️ AP Courts" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === t.key ? "border-amber-600 text-amber-700" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search bar for case tabs */}
      {(tab === "pending" || tab === "scheduled") && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search case ID or title..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      )}

      {/* PENDING SCHEDULING TAB */}
      {tab === "pending" && (
        <div className="space-y-4">
          {filteredPending.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">
              <Gavel className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No cases pending court scheduling</p>
              <p className="text-xs mt-1">Police officers send cases here by setting status to "court_hearing"</p>
            </CardContent></Card>
          ) : filteredPending.map(c => (
            <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-l-4 border-l-orange-400">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs text-muted-foreground">{c.case_id}</span>
                        <Badge className="bg-orange-100 text-orange-700 border-orange-300 text-[10px]">AWAITING SCHEDULING</Badge>
                        {c.priority === "critical" && <Badge className="bg-red-600 text-white text-[10px]">CRITICAL</Badge>}
                      </div>
                      <h3 className="font-semibold text-sm">{c.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.category?.replace(/_/g, " ")} • {c.district} • Filed: {moment(c.created_date).format("DD MMM YYYY")}
                      </p>
                      <p className="text-xs text-muted-foreground">👤 {c.complainant_name} • {c.complainant_phone}</p>
                      {(() => {
                        const lawyerUpdate = c.action_updates?.find(u => u.update && u.update.includes("Case accepted by Adv."));
                        const lawyerName = lawyerUpdate ? lawyerUpdate.by : null;
                        return lawyerName && <p className="text-xs text-violet-600 mt-1">⚖️ Lawyer: {lawyerName}</p>;
                      })()}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/track-case?id=${c.case_id}`}><FileText className="w-3.5 h-3.5 mr-1" /> Case File</Link>
                      </Button>
                      <Button size="sm" className="bg-amber-700 hover:bg-amber-800"
                        onClick={() => setSchedulingId(schedulingId === c.id ? null : c.id)}>
                        <Calendar className="w-3.5 h-3.5 mr-1" /> {schedulingId === c.id ? "Cancel" : "Schedule"}
                      </Button>
                    </div>
                  </div>

                  {/* Scheduling Form */}
                  {schedulingId === c.id && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-3">
                      <p className="text-sm font-semibold text-amber-800">Schedule Court Hearing</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium">Hearing Date *</label>
                          <Input type="date" value={scheduleForm.date} min={moment().format("YYYY-MM-DD")}
                            onChange={e => setScheduleForm(f => ({ ...f, date: e.target.value }))} className="mt-1 h-8 text-xs" />
                        </div>
                        <div>
                          <label className="text-xs font-medium">Hearing Type *</label>
                          <Select value={scheduleForm.type} onValueChange={v => setScheduleForm(f => ({ ...f, type: v }))}>
                            <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{HEARING_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium">Judge *</label>
                          <Select value={scheduleForm.judge} onValueChange={v => setScheduleForm(f => ({ ...f, judge: v }))}>
                            <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Select judge" /></SelectTrigger>
                            <SelectContent>{JUDGES.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium">Court *</label>
                          <Select value={scheduleForm.court} onValueChange={v => setScheduleForm(f => ({ ...f, court: v }))}>
                            <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Select court" /></SelectTrigger>
                            <SelectContent>
                              {AP_COURTS.filter(ct => ct.district === "All" || ct.district === c.district).map(ct => (
                                <SelectItem key={ct.name} value={ct.name}>{ct.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium">Notes (optional)</label>
                        <Input placeholder="Additional instructions..." value={scheduleForm.notes}
                          onChange={e => setScheduleForm(f => ({ ...f, notes: e.target.value }))} className="mt-1 h-8 text-xs" />
                      </div>
                      <Button size="sm" className="bg-amber-700 hover:bg-amber-800 w-full" onClick={() => scheduleHearing(c)}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Confirm Hearing
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* CAUSE LIST TAB */}
      {tab === "scheduled" && (
        <div className="space-y-3">
          {filteredScheduled.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No hearings scheduled yet</p>
            </CardContent></Card>
          ) : filteredScheduled.map(c => {
            const hearingDate = moment(c.court_date);
            const isToday = hearingDate.isSame(moment(), "day");
            const isPast = hearingDate.isBefore(moment(), "day");
            return (
              <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className={`border-l-4 ${isToday ? "border-l-red-500" : isPast ? "border-l-green-500" : "border-l-blue-500"}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-xs text-muted-foreground">{c.case_id}</span>
                          {isToday && <Badge className="bg-red-100 text-red-700 border-red-300 text-[10px]">TODAY</Badge>}
                          {isPast && <Badge className="bg-green-100 text-green-700 border-green-300 text-[10px]">PAST</Badge>}
                          {!isToday && !isPast && <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-[10px]">UPCOMING</Badge>}
                        </div>
                        <h3 className="font-semibold text-sm">{c.title}</h3>
                        <p className="text-xs text-muted-foreground">{c.category?.replace(/_/g, " ")} • {c.district}</p>
                        <p className="text-xs font-medium text-amber-700 mt-1">
                          📅 {hearingDate.format("DD MMM YYYY")} ({hearingDate.fromNow()})
                        </p>
                        {(() => {
                          const lawyerUpdate = c.action_updates?.find(u => u.update && u.update.includes("Case accepted by Adv."));
                          const lawyerName = lawyerUpdate ? lawyerUpdate.by : null;
                          return lawyerName && <p className="text-xs text-violet-600 mt-1">⚖️ Lawyer: {lawyerName}</p>;
                        })()}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/track-case?id=${c.case_id}`}><FileText className="w-3.5 h-3.5 mr-1" /> File</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/legal-documents?caseId=${c.case_id}`}><Scale className="w-3.5 h-3.5 mr-1" /> Order</Link>
                        </Button>
                        {isToday && (
                          <Button size="sm" className="bg-green-700 hover:bg-green-800"
                            onClick={() => completeHearing(c, "resolved")}>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Close
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* AP COURTS TAB */}
      {tab === "courts" && (
        <div className="grid sm:grid-cols-2 gap-4">
          {AP_COURTS.map((court, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="hover:shadow-md transition">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{court.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {court.district === "All" ? "Andhra Pradesh — All Districts" : `District: ${court.district}`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}