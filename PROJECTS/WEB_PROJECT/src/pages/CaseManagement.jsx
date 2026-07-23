import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import {
  FileText, ArrowRight, RefreshCw, Search, User, Building2,
  CheckCircle2, AlertTriangle, Loader2, ArrowLeft, X, Send
} from "lucide-react";
import { Link } from "react-router-dom";

const STATUS_LIST = ["filed","under_review","assigned","investigating","escalated","court_hearing","resolved","closed"];
const DEPTS = ["general","narcotics","she_teams","cyber_crime","cid","traffic","anti_corruption"];

const STATUS_COLORS = {
  filed: "bg-blue-100 text-blue-700", under_review: "bg-yellow-100 text-yellow-700",
  assigned: "bg-orange-100 text-orange-700", investigating: "bg-purple-100 text-purple-700",
  escalated: "bg-red-100 text-red-700", court_hearing: "bg-indigo-100 text-indigo-700",
  resolved: "bg-green-100 text-green-700", closed: "bg-gray-100 text-gray-700",
};

export default function CaseManagement() {
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferDept, setTransferDept] = useState("");
  const [withdrawReason, setWithdrawReason] = useState("");
  const [updateNote, setUpdateNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [panel, setPanel] = useState(null); // "transfer" | "update" | "withdraw"

  const { user: authUser, profile } = useAuth();

  useEffect(() => {
    (async () => {
      const me = profile ?? authUser ?? null;
      setUser(me);
      await loadCases(me);
    })();
  }, [authUser, profile]);

  const loadCases = async (me) => {
    const { getJurisdiction } = await import("@/lib/rbac");
    const role = me.user_type || me.role || "";
    const jur = getJurisdiction(role);
    let query = supabase.from('complaints').select('*').order('created_at', { ascending: false });
    if (jur === "all") {
      query = query.limit(200);
    } else if (jur === "district" && me.district) {
      query = query.eq('district', me.district).limit(100);
    } else {
      const { data: officerData } = await supabase.from('complaints').select('*').eq('assigned_to', me.id).order('created_at', { ascending: false }).limit(50);
      if (officerData && officerData.length > 0) {
        setComplaints(officerData);
        setLoading(false);
        return;
      }
      if (me.district) query = query.eq('district', me.district);
      query = query.limit(50);
    }
    const { data = [] } = await query;
    setComplaints(data || []);
    setLoading(false);
  };

  const reload = async () => {
    const me = profile ?? authUser ?? null;
    await loadCases(me);
  };

  const filtered = complaints.filter(c => {
    const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.case_id?.toLowerCase().includes(search.toLowerCase()) || c.complainant_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const addUpdate = (c, update, by) => [
    ...(c.action_updates || []),
    { date: new Date().toISOString(), update, by: by || user?.full_name || user?.email },
  ];

  const handleTransfer = async () => {
    if (!transferEmail && !transferDept) { toast.error("Enter officer email or department"); return; }
    setProcessing(true);
    const updates = {
      status: "assigned",
      action_updates: addUpdate(selected, `Case transferred to ${transferEmail || transferDept}`),
    };
    if (transferEmail) {
      const { data: up } = await supabase.from('user_profiles').select('id').eq('email', transferEmail).single();
      if (up?.id) updates.assigned_to = up.id;
    }
    await supabase.from('complaints').update(updates).eq('id', selected.id);
    toast.success("Case transferred successfully");
    setPanel(null); setTransferEmail(""); setTransferDept("");
    await reload();
    setSelected(null);
    setProcessing(false);
  };

  const handleUpdate = async () => {
    if (!updateNote.trim()) { toast.error("Add an update note"); return; }
    setProcessing(true);
    await supabase.from('complaints').update({
      action_updates: addUpdate(selected, updateNote),
    }).eq('id', selected.id);
    toast.success("Case updated");
    setUpdateNote(""); setPanel(null);
    await reload();
    setProcessing(false);
  };

  const handleWithdraw = async () => {
    if (!withdrawReason.trim()) { toast.error("Provide withdrawal reason"); return; }
    setProcessing(true);
    await supabase.from('complaints').update({
      status: "closed",
      action_updates: addUpdate(selected, `Case withdrawn: ${withdrawReason}`),
    }).eq('id', selected.id);
    toast.success("Case withdrawn and closed");
    setWithdrawReason(""); setPanel(null);
    await reload();
    setSelected(null);
    setProcessing(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm"><Link to="/officer-dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link></Button>
        <div className="flex-1">
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Case Management System
          </h1>
          <p className="text-muted-foreground text-sm">Transfer, update, withdraw — full case lifecycle control</p>
        </div>
        <Button variant="outline" size="sm" onClick={reload}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by title, case ID, name..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_LIST.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Case List */}
        <div className="lg:col-span-3 space-y-2">
          <p className="text-xs text-muted-foreground mb-2">{filtered.length} case(s) found</p>
          {filtered.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">No cases found</CardContent></Card>
          ) : filtered.slice(0, 30).map(c => (
            <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={() => { setSelected(c); setPanel(null); }}
              className={`border rounded-xl p-3.5 cursor-pointer hover:shadow-md transition ${selected?.id === c.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-[10px] text-muted-foreground">{c.case_id}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_COLORS[c.status] || ""}`}>{c.status?.replace("_", " ")}</span>
                    {c.priority === "critical" && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-red-100 text-red-700">CRITICAL</span>}
                    {c.is_escalated && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-orange-100 text-orange-700">ESCALATED</span>}
                  </div>
                  <p className="font-medium text-sm truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.complainant_name || "Unknown"} • {c.location || c.district} • {moment(c.created_at || c.created_date).fromNow()}</p>
                </div>
                <ArrowRight className={`w-4 h-4 flex-shrink-0 mt-1 transition ${selected?.id === c.id ? "text-primary" : "text-muted-foreground/40"}`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key={selected.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <Card className="sticky top-20">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm">{selected.title}</CardTitle>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{selected.case_id}</p>
                      </div>
                      <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-muted-foreground">Complainant:</span><br /><strong>{selected.complainant_name || "Unknown"}</strong></div>
                      <div><span className="text-muted-foreground">Category:</span><br /><strong>{(selected.complaint_type || selected.category)?.replace("_", " ")}</strong></div>
                      <div><span className="text-muted-foreground">District:</span><br /><strong>{selected.district || "N/A"}</strong></div>
                      <div><span className="text-muted-foreground">Department:</span><br /><strong>{selected.assigned_department || "general"}</strong></div>
                      <div><span className="text-muted-foreground">Assigned to:</span><br /><strong className="break-all">{selected.assigned_to || selected.assigned_officer || "Unassigned"}</strong></div>
                      <div><span className="text-muted-foreground">Filed:</span><br /><strong>{moment(selected.created_at || selected.created_date).format("DD MMM YYYY")}</strong></div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2 border-t">
                      <Button variant="outline" size="sm" className="w-full gap-2 justify-start"
                        onClick={() => setPanel(panel === "transfer" ? null : "transfer")}>
                        <ArrowRight className="w-4 h-4 text-blue-600" /> Transfer Case
                      </Button>
                      <Button variant="outline" size="sm" className="w-full gap-2 justify-start"
                        onClick={() => setPanel(panel === "update" ? null : "update")}>
                        <Send className="w-4 h-4 text-green-600" /> Add Case Update
                      </Button>
                      <Button variant="outline" size="sm" className="w-full gap-2 justify-start text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setPanel(panel === "withdraw" ? null : "withdraw")}>
                        <X className="w-4 h-4" /> Withdraw Case
                      </Button>
                    </div>

                    {/* Transfer Panel */}
                    <AnimatePresence>
                      {panel === "transfer" && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="space-y-2 pt-2 border-t">
                            <p className="text-xs font-semibold text-blue-700 flex items-center gap-1"><User className="w-3.5 h-3.5" /> Transfer to Officer/Dept</p>
                            <Input placeholder="Officer email" value={transferEmail} onChange={e => setTransferEmail(e.target.value)} className="text-sm h-8" />
                            <Select value={transferDept} onValueChange={setTransferDept}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Transfer Department" /></SelectTrigger>
                              <SelectContent>{DEPTS.map(d => <SelectItem key={d} value={d}>{d.replace("_", " ")}</SelectItem>)}</SelectContent>
                            </Select>
                            <Button size="sm" className="w-full" onClick={handleTransfer} disabled={processing}>
                              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Transfer"}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                      {panel === "update" && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="space-y-2 pt-2 border-t">
                            <p className="text-xs font-semibold text-green-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Add Update</p>
                            <Textarea placeholder="Describe the case update..." value={updateNote} onChange={e => setUpdateNote(e.target.value)} className="text-sm h-20" />
                            <Button size="sm" className="w-full bg-green-600 hover:bg-green-700" onClick={handleUpdate} disabled={processing}>
                              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Update"}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                      {panel === "withdraw" && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="space-y-2 pt-2 border-t border-red-200">
                            <p className="text-xs font-semibold text-red-700 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Withdraw Case</p>
                            <Textarea placeholder="Mandatory: Reason for withdrawal..." value={withdrawReason} onChange={e => setWithdrawReason(e.target.value)} className="text-sm h-20 border-red-200" />
                            <Button size="sm" variant="destructive" className="w-full" onClick={handleWithdraw} disabled={processing}>
                              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Withdrawal"}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Timeline */}
                    {selected.action_updates?.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-semibold mb-2 text-muted-foreground">Case Timeline</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {[...selected.action_updates].reverse().map((u, i) => (
                            <div key={i} className="text-xs border-l-2 border-primary/30 pl-2">
                              <p className="text-foreground">{u.update}</p>
                              <p className="text-muted-foreground">{moment(u.date).format("DD MMM, hh:mm A")} — {u.by}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a case to manage</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}