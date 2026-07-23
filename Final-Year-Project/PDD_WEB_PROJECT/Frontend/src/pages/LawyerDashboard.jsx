/**
 * LAWYER DASHBOARD
 * Cases arrive here when: court assigns lawyer OR police assigns_lawyer field matches email
 * Lawyer can: review case, draft docs, add legal opinion, view hearings, communicate
 */
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Scale, FileText, Clock, CheckCircle2, AlertTriangle, Phone,
  User, Loader2, ArrowLeft, BookOpen, Calendar, Search, MessageSquare,
  LogOut, Edit, Send, RefreshCw, Gavel, ArrowRight, Plus
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
import { toast } from "sonner";

const LEGAL_SECTIONS = [
  { section: "IPC 302", title: "Murder", description: "Life imprisonment or death penalty", category: "violent" },
  { section: "IPC 376", title: "Sexual Assault / Rape", description: "Minimum 10 years imprisonment", category: "violent" },
  { section: "IPC 420", title: "Cheating & Dishonesty", description: "Imprisonment up to 7 years + fine", category: "fraud" },
  { section: "IPC 379", title: "Theft", description: "Imprisonment up to 3 years + fine", category: "property" },
  { section: "IPC 354", title: "Assault on Woman", description: "Imprisonment 1–5 years + fine", category: "women" },
  { section: "IT Act 66C", title: "Identity Theft (Cyber)", description: "Imprisonment up to 3 years + ₹1 lakh fine", category: "cyber" },
  { section: "IT Act 66D", title: "Cheating by Impersonation", description: "Imprisonment up to 3 years + ₹1 lakh fine", category: "cyber" },
  { section: "NDPS Act", title: "Narcotics Offences", description: "6 months to life imprisonment", category: "narcotics" },
  { section: "IPC 323", title: "Voluntarily Causing Hurt", description: "Imprisonment up to 1 year + fine", category: "violent" },
  { section: "IPC 498A", title: "Domestic Violence / Cruelty", description: "Imprisonment up to 3 years + fine", category: "women" },
  { section: "CrPC 125", title: "Maintenance of Wife/Children", description: "Monthly maintenance order by Magistrate", category: "family" },
  { section: "IPC 406", title: "Criminal Breach of Trust", description: "Imprisonment up to 3 years + fine", category: "fraud" },
];

const BAIL_TEMPLATES = [
  "Application for Anticipatory Bail",
  "Application for Regular Bail",
  "Application for Interim Bail",
  "Surety Bond Application",
  "Application for Bail Extension",
];

export default function LawyerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("cases");
  const [legalNotes, setLegalNotes] = useState({});
  const [savingNote, setSavingNote] = useState(null);

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
    if (!["lawyer", "admin"].includes(utype)) { navigate("/dashboard"); return; }

    try {
      // Lawyers see: cases assigned to them directly, OR cases in court_hearing status in their district
      let assigned = [];
      if (utype === "admin") {
        const { data } = await supabase
          .from("complaints")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        if (data) assigned = data;
      } else {
        // Fetch recent cases to find ones assigned to this lawyer (tracked in action_updates)
        const { data } = await supabase
          .from("complaints")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        
        if (data) {
          // Filter locally: check if the lawyer's email is in any assignment action
          assigned = data.filter(c => 
            c.action_updates && 
            c.action_updates.some(update => update.update && update.update.includes("Case accepted by Adv.") && update.by === me.email)
          );
        }
      }

      // Also pull court_hearing cases (filter by district if available)
      let courtCases = [];
      let query = supabase.from("complaints").select("*").eq("status", "court_hearing").order("created_at", { ascending: false }).limit(30);
      if (me.district) {
        query = query.eq("district", me.district);
      }
      const { data: courtData } = await query;
      if (courtData) courtCases = courtData;

      // Map profiles
      const mappedAssigned = assigned.map(c => ({
        ...c,
        case_id: c.complaint_number || c.case_id || `NM-${c.id?.slice(0, 8)}`,
        category: c.complaint_type || c.category || "general",
        created_date: c.created_at || c.created_date,
        location: c.location || (c.location_coordinates ? "Coordinates Provided" : "Unknown")
      }));

      const mappedCourtCases = courtCases.map(c => ({
        ...c,
        case_id: c.complaint_number || c.case_id || `NM-${c.id?.slice(0, 8)}`,
        category: c.complaint_type || c.category || "general",
        created_date: c.created_at || c.created_date,
        location: c.location || (c.location_coordinates ? "Coordinates Provided" : "Unknown")
      }));

      // Merge deduplicated
      const allIds = new Set(mappedAssigned.map(c => c.id));
      let merged = [...mappedAssigned, ...mappedCourtCases.filter(c => !allIds.has(c.id))];

      // Fallback removed, relying completely on Supabase

      setCases(merged);
    } catch (err) {
      console.error("Error loading data in LawyerDashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveLegalNote = async (caseId, complaintId) => {
    const note = legalNotes[caseId];
    if (!note?.trim()) return;
    setSavingNote(caseId);
    try {
      const c = cases.find(x => x.id === complaintId);
      const newActionUpdates = [
        ...(c?.action_updates || []),
        {
          date: new Date().toISOString(),
          update: `[LEGAL OPINION] ${note}`,
          by: `Adv. ${user?.full_name || user?.email}`,
        },
      ];
      const { error } = await supabase
        .from("complaints")
        .update({
          action_updates: newActionUpdates
        })
        .eq("id", complaintId);
      if (error) throw error;
      toast.success("Legal note saved to case file");
      setLegalNotes(prev => ({ ...prev, [caseId]: "" }));
      loadData();
    } catch (err) {
      console.error("Error saving note:", err);
      toast.error("Failed to save legal note");
    } finally {
      setSavingNote(null);
    }
  };

  const acceptCase = async (complaint) => {
    try {
      const newActionUpdates = [
        ...(complaint.action_updates || []),
        {
          date: new Date().toISOString(),
          update: `Case accepted by Adv. ${user?.full_name || user?.email} (Bar ID: ${user?.bar_council_id || "N/A"})`,
          by: user?.email,
        },
      ];
      const { error } = await supabase
        .from("complaints")
        .update({
          action_updates: newActionUpdates
        })
        .eq("id", complaint.id);
      if (error) throw error;
      toast.success("Case accepted — added to your case list");
      loadData();
    } catch (err) {
      console.error("Error accepting case:", err);
      toast.error("Failed to accept case");
    }
  };

  const issueNotice = async (caseId, complaintId) => {
    const complaint = cases.find(c => c.id === complaintId);
    if (!complaint) return;
    
    setSavingNote(caseId + "_notice");
    try {
      const noticeContent = `This is a formal legal notice issued by Adv. ${user?.full_name || "Legal Advisor"} regarding case ${caseId}.\n\nYou are hereby directed to respond to the legal proceedings immediately. Further instructions will be sent via mail.`;
      
      const newNotice = {
        title: "Legal Notice Issued",
        content: noticeContent,
        issuer: `Adv. ${user?.full_name || user?.email}`,
        date: new Date().toISOString()
      };
      
      const newNotices = [...(complaint.notices || []), newNotice];
      const newActionUpdates = [
        ...(complaint.action_updates || []),
        { date: new Date().toISOString(), update: "Legal Notice Issued", by: `Adv. ${user?.full_name || user?.email}` }
      ];
      
      const { error } = await supabase.from('complaints').update({ notices: newNotices, action_updates: newActionUpdates }).eq("id", complaintId);
      
      if (error) throw error;
      
      toast.success("Notice successfully issued to citizen");
      loadData();
    } catch (error) {
      console.error("Error issuing notice:", error);
      toast.error("Failed to issue notice");
    } finally {
      setSavingNote(null);
    }
  };

  const stats = {
    total: cases.length,
    active: cases.filter(c => !["resolved", "closed"].includes(c.status)).length,
    resolved: cases.filter(c => ["resolved", "closed"].includes(c.status)).length,
    court: cases.filter(c => c.status === "court_hearing").length,
    myAssigned: cases.filter(c => c.action_updates?.some(u => u.update && u.update.includes("Case accepted by Adv.") && u.by === user?.email)).length,
  };

  const filtered = cases.filter(c =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.case_id?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-2xl">Legal Advisors Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Adv. {user?.full_name || "Lawyer"} • Bar ID: {user?.bar_council_id || "N/A"} • {user?.district || "AP"}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={loadData}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
          <Button asChild variant="outline" size="sm"><Link to="/legal-documents"><FileText className="w-4 h-4 mr-1" /> Draft Documents</Link></Button>
          <Button variant="outline" size="sm" onClick={() => logout()}><LogOut className="w-4 h-4 mr-1" /> Logout</Button>
        </div>
      </div>

      {/* How cases come to lawyer — info */}
      <div className="mb-5 bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm">
        <p className="font-semibold text-violet-800 mb-1">📋 How Cases Reach You:</p>
        <div className="flex items-center gap-1 flex-wrap text-xs text-violet-700">
          <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Police escalates case</span>
          <ArrowRight className="w-3 h-3" />
          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Court hearing status</span>
          <ArrowRight className="w-3 h-3" />
          <span className="bg-violet-200 text-violet-800 px-2 py-0.5 rounded-full font-semibold">Court assigns lawyer or you accept here</span>
          <ArrowRight className="w-3 h-3" />
          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">You represent & draft documents</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: "All Cases", value: stats.total, color: "text-violet-700", bg: "bg-violet-50", icon: Scale },
          { label: "My Assigned", value: stats.myAssigned, color: "text-indigo-700", bg: "bg-indigo-50", icon: User },
          { label: "Active", value: stats.active, color: "text-orange-700", bg: "bg-orange-50", icon: Clock },
          { label: "In Court", value: stats.court, color: "text-blue-700", bg: "bg-blue-50", icon: Gavel },
          { label: "Resolved", value: stats.resolved, color: "text-green-700", bg: "bg-green-50", icon: CheckCircle2 },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className={`${s.bg} border-0`}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={`w-7 h-7 ${s.color}`} />
                <div>
                  <p className={`font-bold text-xl ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-border overflow-x-auto">
        {[
          { key: "cases", label: "📋 All Cases" },
          { key: "my_cases", label: "⚖️ My Assigned" },
          { key: "court_cases", label: "🏛️ In Court" },
          { key: "bail", label: "📄 Bail Templates" },
          { key: "reference", label: "📖 IPC Reference" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === t.key ? "border-violet-600 text-violet-700" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* CASES TAB */}
      {(tab === "cases" || tab === "my_cases" || tab === "court_cases") && (
        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search case title or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="space-y-3">
            {(() => {
              let list = filtered;
              if (tab === "my_cases") list = filtered.filter(c => c.action_updates?.some(u => u.update && u.update.includes("Case accepted by Adv.") && u.by === user?.email));
              if (tab === "court_cases") list = filtered.filter(c => c.status === "court_hearing");
              return list.length === 0 ? (
                <Card><CardContent className="p-12 text-center text-muted-foreground">
                  <Scale className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No cases found.</p>
                  <p className="text-xs mt-1 text-muted-foreground">
                    {tab === "my_cases" ? "You haven't been assigned any cases yet." : "Cases appear here once police escalates to court."}
                  </p>
                </CardContent></Card>
              ) : list.map((c, index) => {
                  const isAssignedToMe = c.action_updates?.some(u => u.update && u.update.includes("Case accepted by Adv.") && u.by === user?.email);
                  return (
                    <motion.div key={c.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}>
                      <Card className="hover:shadow-md transition">
                        <CardContent className="p-5">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-sm font-semibold bg-violet-100 text-violet-800 px-2 py-0.5 rounded">
                                  {c.case_id}
                                </span>
                                {isAssignedToMe && <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">My Case</Badge>}
                                <Badge variant="outline" className="text-[10px] capitalize">{c.status?.replace(/_/g, " ")}</Badge>
                                {c.priority === "critical" && <Badge className="bg-red-600 text-white text-[10px]">CRITICAL</Badge>}
                              </div>
                              <h3 className="font-semibold text-sm">{c.title}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {c.category?.replace(/_/g, " ")} • {c.district} • {moment(c.created_date).format("DD MMM YYYY")}
                              </p>
                              <p className="text-xs text-muted-foreground">👤 {c.complainant_name} • 📞 {c.complainant_phone}</p>
                              {c.court_date && (
                                <p className="text-xs text-amber-700 font-medium mt-1">
                                  ⚖️ Court date: {moment(c.court_date).format("DD MMM YYYY")} ({moment(c.court_date).fromNow()})
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Button asChild size="sm" variant="outline">
                                <Link to={`/track-case?id=${c.case_id}`}><FileText className="w-3.5 h-3.5 mr-1" /> View</Link>
                              </Button>
                              <Button asChild size="sm" className="bg-violet-600 hover:bg-violet-700">
                                <Link to={`/legal-documents?caseId=${c.case_id}`}><Scale className="w-3.5 h-3.5 mr-1" /> Draft</Link>
                              </Button>
                              {!isAssignedToMe ? (
                                <Button size="sm" variant="outline" className="border-violet-300 text-violet-700"
                                  onClick={() => acceptCase(c)}>
                                  <Plus className="w-3.5 h-3.5 mr-1" /> Accept
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" className="border-red-300 text-red-700"
                                  disabled={savingNote === c.case_id + "_notice"}
                                  onClick={() => issueNotice(c.case_id, c.id)}>
                                  {savingNote === c.case_id + "_notice" ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <AlertTriangle className="w-3.5 h-3.5 mr-1" />}
                                  Issue Notice
                                </Button>
                              )}
                            </div>
                          </div>

                      {/* Legal Note */}
                      {isAssignedToMe && (
                        <div className="flex gap-2 mt-2">
                          <Input
                            placeholder="Add legal opinion / notes to case file..."
                            className="h-7 text-xs flex-1"
                            value={legalNotes[c.case_id] || ""}
                            onChange={e => setLegalNotes(prev => ({ ...prev, [c.case_id]: e.target.value }))}
                            onKeyDown={e => e.key === "Enter" && saveLegalNote(c.case_id, c.id)}
                          />
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2"
                            disabled={savingNote === c.case_id}
                            onClick={() => saveLegalNote(c.case_id, c.id)}>
                            {savingNote === c.case_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                            Save
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            });
          })()}
          </div>
        </div>
      )}

      {/* BAIL TEMPLATES TAB */}
      {tab === "bail" && (
        <div className="grid sm:grid-cols-2 gap-4">
          {BAIL_TEMPLATES.map((tmpl, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="hover:shadow-md transition cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-violet-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{tmpl}</p>
                    <p className="text-xs text-muted-foreground">Click to generate template</p>
                  </div>
                  <Button asChild size="sm" className="bg-violet-600 hover:bg-violet-700 shrink-0">
                    <Link to={`/legal-documents`}><Edit className="w-3.5 h-3.5" /></Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* IPC REFERENCE TAB */}
      {tab === "reference" && (
        <div className="grid sm:grid-cols-2 gap-4">
          {LEGAL_SECTIONS.map((ls, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="hover:shadow-md transition">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-violet-700" />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-sm text-violet-700">{ls.section}</p>
                      <p className="font-semibold text-sm">{ls.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ls.description}</p>
                      <Badge variant="outline" className="mt-1 text-[10px] capitalize">{ls.category}</Badge>
                    </div>
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