import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "../lib/LanguageContext";
import { useTranslation } from "../lib/translations";
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText, Clock, CheckCircle2, AlertTriangle, TrendingUp,
  LogOut, Loader2, Plus, Eye, BarChart2, Scale, MapPin,
} from "lucide-react";
import RoleFeatureGuide from "../components/RoleFeatureGuide";
import { motion } from "framer-motion";
import { ROLE_LABELS } from "@/lib/rbac";
import moment from "moment";
import { toast } from "sonner";

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

export default function Dashboard() {
  const { lang } = useLanguage();
  const t = useTranslation(lang);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const { user: authUser, profile, logout } = useAuth();

  useEffect(() => {
    loadData();
  }, [authUser, profile]);

  const loadData = async () => {
    const me = profile ?? authUser ?? null;
    setUser(me);
    if (!me) {
      setLoading(false);
      return;
    }

    try {
      let data = [];
      const utype = me.user_type || me.role || 'citizen';
      let res;
      if (utype === "citizen" || utype === "user") {
        res = await supabase
          .from("complaints")
          .select("*")
          .eq("user_id", me.id)
          .order("created_at", { ascending: false })
          .limit(50);
        if (res.error) {
          res = await supabase
            .from("complaints")
            .select("*")
            .eq("created_by", me.id)
            .order("created_at", { ascending: false })
            .limit(50);
        }
      } else if (utype === "police" || utype === "special" || utype === "si" || utype === "ci" || utype === "dsp") {
        res = await supabase
          .from("complaints")
          .select("*")
          .or(`assigned_officer.eq.${me.id},assigned_officer.eq.${me.email},assigned_to.eq.${me.id}`)
          .order("created_at", { ascending: false })
          .limit(50);
          
        if (!res.data || res.data.length === 0) {
          res = await supabase
            .from("complaints")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);
        }
      } else if (utype === "lawyer") {
        res = await supabase
          .from("complaints")
          .select("*")
          .eq("assigned_lawyer", me.email)
          .order("created_at", { ascending: false })
          .limit(50);
      } else {
        res = await supabase
          .from("complaints")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
      }
      
      if (res && res.data) {
        data = res.data.map(c => ({
          ...c,
          case_id: c.complaint_number || c.case_id || `NM-${c.id?.slice(0, 8)}`,
          category: c.complaint_type || c.category || "general",
          created_date: c.created_at || c.created_date,
          location: c.location || (c.location_coordinates ? "Coordinates Provided" : "Unknown")
        }));
      }
      setComplaints(data);
    } catch (err) {
      console.error("Error loading data in Dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const c = complaints.find(c => c.id === id);
      const newActionUpdates = [
        ...(c?.action_updates || []),
        { date: new Date().toISOString(), update: `Status changed to ${newStatus}`, by: user.full_name || user.email },
      ];
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
      console.error("Error updating status:", err);
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => ["filed", "under_review"].includes(c.status)).length,
    investigating: complaints.filter(c => ["assigned", "investigating"].includes(c.status)).length,
    resolved: complaints.filter(c => ["resolved", "closed"].includes(c.status)).length,
    escalated: complaints.filter(c => c.is_escalated).length,
  };

  const utype = user?.user_type || user?.role || 'citizen';
  const isOfficer = utype && !["citizen", "user", "lawyer"].includes(utype);
  const isLawyer = utype === 'lawyer';

  // Redirect to dedicated dashboards
  useEffect(() => {
    if (loading) return;
    if (isOfficer) {
      // 3-level routing: police/si → station, dsp/ci → dsp dashboard, dgp/sp/ig/dig/adg → dgp dashboard
      if (["dgp","sp","ig","dig","adg","admin"].includes(utype)) navigate("/dgp-dashboard", { replace: true });
      else if (["dsp"].includes(utype)) navigate("/dsp-dashboard", { replace: true });
      else navigate("/station-dashboard", { replace: true });
    } else if (utype === 'lawyer') navigate("/lawyer-dashboard", { replace: true });
    else if (utype === 'court') navigate("/court-dashboard", { replace: true });
    else navigate("/citizen-dashboard", { replace: true });
  }, [loading, isOfficer, utype]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <RoleFeatureGuide userRole={user?.role === 'admin' ? 'special' : (user?.role || 'citizen')} />

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading font-bold text-2xl">
            {t("welcome")}, {user?.full_name || "User"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {ROLE_LABELS[user?.user_type || user?.role] || (user?.role?.toUpperCase())} • {user?.district || "Andhra Pradesh"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(!isOfficer && !isLawyer) && (
            <Button asChild className="gap-2">
              <Link to="/file-complaint"><Plus className="w-4 h-4" /> {t("fileComplaint")}</Link>
            </Button>
          )}
          {isOfficer && (
            <>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/live-tracking"><MapPin className="w-4 h-4" /> Live Tracking</Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/analytics"><BarChart2 className="w-4 h-4" /> Analytics</Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/legal-documents"><Scale className="w-4 h-4" /> Legal Docs</Link>
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => logout()} className="gap-2">
            <LogOut className="w-4 h-4" /> {t("logout")}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: t("totalCases"), value: stats.total, icon: FileText, color: "text-primary" },
          { label: t("pendingCases"), value: stats.pending, icon: Clock, color: "text-yellow-600" },
          { label: lang === "te" ? "దర్యాప్తులో" : "Investigating", value: stats.investigating, icon: TrendingUp, color: "text-blue-600" },
          { label: t("resolvedCases"), value: stats.resolved, icon: CheckCircle2, color: "text-green-600" },
          { label: lang === "te" ? "ఎస్కలేట్ చేయబడింది" : "Escalated", value: stats.escalated, icon: AlertTriangle, color: "text-red-600" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4 text-center">
                <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                <p className="font-heading font-bold text-2xl">{stat.value}</p>
                <p className="text-muted-foreground text-xs">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Complaints List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{isOfficer ? t("assignedCases") : isLawyer ? "Assigned Cases" : t("myComplaints")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {complaints.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">{t("noComplaints")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border border-border rounded-lg p-4 hover:shadow-sm transition"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">{c.case_id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[c.status] || ""}`}>
                          {c.status?.replace("_", " ")}
                        </span>
                        {c.is_escalated && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                            ESCALATED
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm truncate">{c.title}</h3>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {c.category?.replace("_", " ")} • {c.location} • {moment(c.created_date).fromNow()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOfficer && (
                        <Select
                          value={c.status}
                          onValueChange={(v) => updateStatus(c.id, v)}
                          disabled={updatingId === c.id}
                        >
                          <SelectTrigger className="w-36 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["filed", "under_review", "assigned", "investigating", "escalated", "court_hearing", "resolved", "closed"].map(s => (
                              <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/track-case?id=${c.case_id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}