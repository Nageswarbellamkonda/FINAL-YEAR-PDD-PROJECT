import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "../lib/LanguageContext";
import { useTranslation } from "../lib/translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, AlertTriangle, CheckCircle2, Loader2, FileText, ArrowLeft, Stamp, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import moment from "moment";
import CaseChat from "@/components/CaseChat";

const statusColors = {
  filed: "bg-blue-100 text-blue-700 border-blue-300",
  under_review: "bg-yellow-100 text-yellow-700 border-yellow-300",
  assigned: "bg-orange-100 text-orange-700 border-orange-300",
  investigating: "bg-purple-100 text-purple-700 border-purple-300",
  escalated: "bg-red-100 text-red-700 border-red-300",
  court_hearing: "bg-indigo-100 text-indigo-700 border-indigo-300",
  resolved: "bg-green-100 text-green-700 border-green-300",
  closed: "bg-gray-100 text-gray-700 border-gray-300",
};

const priorityColors = {
  low: "bg-green-100 text-green-700",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export default function TrackCase() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = useTranslation(lang);
  const urlParams = new URLSearchParams(window.location.search);
  const [searchId, setSearchId] = useState(urlParams.get("id") || "");
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (urlParams.get("id")) {
      handleSearch();
    }
  }, []);

  const handleSearch = async () => {
    if (!searchId.trim()) return;
    setLoading(true);
    setNotFound(false);
    setComplaint(null);

    const { data: results } = await supabase.from('complaints').select('*').eq('complaint_number', searchId.trim());
    let caseObj = results?.[0] || null;

    if (caseObj) {
      // Ensure it has required updates properties if missing
      if (!caseObj.priority) caseObj.priority = "normal";
      if (!caseObj.status) caseObj.status = "filed";
      if (!caseObj.action_updates) {
        caseObj.action_updates = [
          { update: "Complaint registered in the system.", date: caseObj.created_at || new Date().toISOString(), by: "System" }
        ];
      }
      setComplaint(caseObj);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  };

  const steps = ["filed", "under_review", "assigned", "investigating", "escalated", "court_hearing", "resolved", "closed"];
  const currentStep = complaint ? steps.indexOf(complaint.status) : -1;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm transition">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-2xl">{t("trackCase")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {lang === "te" ? "మీ కేసు ID తో స్థితిని ట్రాక్ చేయండి" : "Track your complaint status with your Case ID"}
          </p>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
              className="flex gap-3"
            >
              <Input
                placeholder={t("searchCaseId")}
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="flex-1 font-mono"
              />
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {lang === "te" ? "శోధించు" : "Search"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {notFound && (
          <Card className="border-destructive/30">
            <CardContent className="p-6 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">{t("noComplaints")}</p>
            </CardContent>
          </Card>
        )}

        {complaint && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Case Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">{complaint.complaint_number || complaint.case_id}</p>
                    <h2 className="font-heading font-bold text-xl mt-1">{complaint.title}</h2>
                    <p className="text-muted-foreground text-sm mt-1">{complaint.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[complaint.status] || ""}`}>
                      {t(complaint.status.replace("_", "")) || complaint.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityColors[complaint.priority] || ""}`}>
                      {t(complaint.priority)} {lang === "te" ? "ప్రాధాన్యత" : "Priority"}
                    </span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 mt-6 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("category")}</p>
                    <p className="font-medium text-sm mt-0.5">{complaint.category?.replace("_", " ")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("location")}</p>
                    <p className="font-medium text-sm mt-0.5">{complaint.location}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("departments")}</p>
                    <p className="font-medium text-sm mt-0.5">{complaint.assigned_department?.replace("_", " ")}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to={`/fir-document?id=${complaint.complaint_number || complaint.case_id}`}
                    className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition shadow-sm">
                    <Stamp className="w-4 h-4" /> Generate Official FIR Document
                  </Link>
                  <button
                    onClick={() => setShowChat(!showChat)}
                    className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground rounded-lg px-4 py-2 text-sm font-semibold hover:bg-secondary/90 transition shadow-sm">
                    <MessageSquare className="w-4 h-4" />
                    {showChat ? "Close Chat" : "Chat with Officer"}
                  </button>
                </div>
                {showChat && (
                  <div className="mt-4">
                    <CaseChat caseId={complaint.complaint_number || complaint.case_id} onClose={() => setShowChat(false)} />
                  </div>
                )}

                {complaint.is_escalated && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <p className="text-red-700 text-sm font-medium">
                      {lang === "te"
                        ? "ఈ కేసు ఎస్కలేట్ చేయబడింది - ఆలస్యం కారణంగా"
                        : "This case has been escalated due to delay in action"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Case Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {steps.map((step, i) => (
                    <div key={step} className="flex items-start gap-4 mb-4 last:mb-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          i <= currentStep ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        }`}>
                          {i <= currentStep ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                        </div>
                        {i < steps.length - 1 && (
                          <div className={`w-0.5 h-8 ${i < currentStep ? "bg-primary" : "bg-border"}`} />
                        )}
                      </div>
                      <div className="pt-1">
                        <p className={`text-sm font-medium ${i <= currentStep ? "text-foreground" : "text-muted-foreground"}`}>
                          {t(step.replace("_", "")) || step.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Updates */}
            {complaint.action_updates?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("recentUpdates")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {complaint.action_updates.map((update, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm">{update.update}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {moment(update.date).format("DD MMM YYYY, hh:mm A")} • {update.by}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notices & Court Orders */}
            {complaint.notices?.length > 0 && (
              <Card className="border-red-200">
                <CardHeader className="bg-red-50/50 pb-3 border-b border-red-100">
                  <CardTitle className="text-base flex items-center gap-2 text-red-900">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    {lang === "te" ? "నోటీసులు మరియు కోర్టు ఉత్తర్వులు" : "Notices & Court Orders"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {complaint.notices.map((notice, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 bg-white border border-red-100 rounded-lg shadow-sm">
                        <Stamp className="w-5 h-5 text-red-600 mt-1" />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-red-900 text-sm">{notice.title}</h4>
                            <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-semibold">{notice.issuer}</span>
                          </div>
                          <p className="text-sm mt-2 text-slate-700 whitespace-pre-wrap">{notice.content}</p>
                          <p className="text-[10px] text-muted-foreground mt-3 pt-2 border-t border-red-50">
                            Issued: {moment(notice.date).format("DD MMM YYYY, hh:mm A")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}