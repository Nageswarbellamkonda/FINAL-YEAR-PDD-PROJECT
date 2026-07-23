import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Clock, AlertTriangle, Shield, Phone, CreditCard,
  CheckCircle2, ArrowLeft, Loader2, RefreshCw, FileText,
  BanknoteIcon, Lock, RotateCcw, TrendingDown, Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import moment from "moment";

const FRAUD_TYPES = [
  "UPI/PhonePe Fraud", "OTP Scam", "Bank KYC Fraud",
  "Online Shopping Fraud", "Investment/Ponzi Scheme",
  "Job Offer Fraud", "Lottery/Prize Scam", "Loan App Fraud",
  "Romance Scam", "QR Code Fraud", "Phishing", "Other"
];

const BANKS = [
  "SBI", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Bank",
  "PNB", "Union Bank", "Canara Bank", "BOB", "Indian Bank",
  "Yes Bank", "IDBI Bank", "Federal Bank", "Other"
];

const RECOVERY_STAGES = [
  { key: "reported", label: "Fraud Reported", color: "bg-blue-500", done: true },
  { key: "notified", label: "Cyber Cell Notified", color: "bg-indigo-500" },
  { key: "bank_contacted", label: "Bank Contacted", color: "bg-violet-500" },
  { key: "freeze_requested", label: "Account Freeze Requested", color: "bg-orange-500" },
  { key: "freeze_confirmed", label: "Account Frozen", color: "bg-red-500" },
  { key: "hold_placed", label: "Funds on Hold", color: "bg-yellow-500" },
  { key: "recovery_initiated", label: "Recovery Initiated", color: "bg-emerald-500" },
  { key: "recovered", label: "Amount Recovered", color: "bg-green-600" },
];

function CountdownTimer({ fraudTime }) {
  const [remaining, setRemaining] = useState(null);
  const [pct, setPct] = useState(100);

  useEffect(() => {
    const golden = 60 * 60 * 1000; // 1 hour
    const interval = setInterval(() => {
      const elapsed = Date.now() - new Date(fraudTime).getTime();
      const left = Math.max(0, golden - elapsed);
      setRemaining(left);
      setPct(Math.max(0, ((golden - elapsed) / golden) * 100));
    }, 1000);
    return () => clearInterval(interval);
  }, [fraudTime]);

  if (remaining === null) return null;

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const expired = remaining === 0;
  const urgent = remaining < 15 * 60 * 1000;

  return (
    <div className={`rounded-2xl p-5 text-center border-2 ${expired ? "border-gray-300 bg-gray-50" : urgent ? "border-red-400 bg-red-50 animate-pulse" : "border-orange-300 bg-orange-50"}`}>
      <div className="flex items-center justify-center gap-2 mb-3">
        <Clock className={`w-5 h-5 ${expired ? "text-gray-400" : urgent ? "text-red-600" : "text-orange-600"}`} />
        <span className={`font-bold text-sm ${expired ? "text-gray-500" : urgent ? "text-red-700" : "text-orange-700"}`}>
          {expired ? "Golden Hour Expired" : urgent ? "🚨 URGENT — Act Now!" : "⏳ Golden Hour Remaining"}
        </span>
      </div>
      {!expired && (
        <p className={`font-mono font-black text-5xl mb-3 ${urgent ? "text-red-600" : "text-orange-600"}`}>
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </p>
      )}
      {expired && <p className="text-gray-500 text-sm mb-3">Recovery chances are reduced after 1 hour</p>}
      {/* Progress bar */}
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${expired ? "bg-gray-400" : urgent ? "bg-red-500" : "bg-orange-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Act within the first hour to maximize fund recovery chances
      </p>
    </div>
  );
}

export default function GoldenHourCyber() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState("form"); // form | submitted | track
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [trackId, setTrackId] = useState("");
  const [tracked, setTracked] = useState(null);

  const [form, setForm] = useState({
    victim_name: "",
    victim_phone: "",
    victim_email: "",
    fraud_type: "",
    amount_lost: "",
    bank_name: "",
    account_number: "",
    utr_transaction_id: "",
    fraud_account: "",
    fraud_time: new Date().toISOString().slice(0, 16),
    description: "",
    district: "",
  });

  const [submitted, setSubmitted] = useState(null);

  const { user: authUser, profile } = useAuth();

  useEffect(() => {
    (async () => {
      const me = profile ?? authUser ?? null;
      setUser(me);
      setForm(f => ({
        ...f,
        victim_name: me?.full_name || "",
        victim_email: me?.email || "",
        district: me?.district || "",
      }));
      let query = supabase.from('complaints').select('*').eq('complaint_type', 'cyber_crime').order('created_at', { ascending: false }).limit(20);
      if (me?.id) query = query.eq('user_id', me.id);
      const { data } = await query;
      let fetchedCases = data || [];
      setCases(fetchedCases);
      setLoadingCases(false);
    })();
  }, [authUser, profile]);

  const submitReport = async () => {
    if (!form.victim_name || !form.victim_phone || !form.fraud_type || !form.amount_lost) {
      toast.error("Fill all required fields");
      return;
    }
    setLoading(true);

    // Create complaint with cyber crime category
    const caseId = `CYBER-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    try {
      const { data: complaintData, error } = await supabase.from('complaints').insert([{
        complaint_number: caseId,
        title: `Cyber Fraud Report — ${form.fraud_type} — ₹${form.amount_lost}`,
        description: `GOLDEN HOUR CYBER CRIME REPORT\n\nFraud Type: ${form.fraud_type}\nAmount Lost: ₹${form.amount_lost}\nBank: ${form.bank_name}\nAccount: ${form.account_number}\nUTR/Transaction ID: ${form.utr_transaction_id}\nFraud Account: ${form.fraud_account}\nIncident Time: ${form.fraud_time}\n\nDescription: ${form.description}`,
        complaint_type: "cyber_crime",
        priority: "critical",
        status: "filed",
        district: form.district,
        user_id: user?.id,
      }]).select().single();
      if (error) throw error;

      // Also create CyberCrimeReport record for officer dashboard visibility
      await supabase.from('cyber_crime_reports').insert([{
        complaint_id: complaintData?.id,
        fraud_type: form.fraud_type,
        amount_lost: parseFloat(form.amount_lost) || 0,
        bank_name: form.bank_name,
        account_number: form.account_number,
        transaction_id: form.utr_transaction_id,
        recovery_status: "notified",
        amount_recovered: 0,
      }]);

      setSubmitted({ ...complaintData, case_id: caseId, fraud_time: form.fraud_time, amount: form.amount_lost });
    } catch (e) {
      console.error("Backend insert failed", e);
      toast.error("Failed to submit cyber crime report.");
      setLoading(false);
      return;
    }

    setStep("submitted");
    setLoading(false);
    toast.success("🚨 Report filed! Cyber cell notified instantly.");
  };

  const trackCase = async () => {
    if (!trackId.trim()) return;
    const { data: results } = await supabase.from('complaints').select('*').eq('complaint_number', trackId.trim());
    let caseObj = results?.[0] || null;
    

    
    setTracked(caseObj);
  };

  const getStageStatus = (complaint) => {
    if (!complaint) return 0;
    const updates = complaint.action_updates || [];
    if (complaint.status === "resolved") return 7;
    if (updates.some(u => u.update?.toLowerCase().includes("recover"))) return 6;
    if (updates.some(u => u.update?.toLowerCase().includes("hold"))) return 5;
    if (updates.some(u => u.update?.toLowerCase().includes("frozen"))) return 4;
    if (updates.some(u => u.update?.toLowerCase().includes("freeze"))) return 3;
    if (updates.some(u => u.update?.toLowerCase().includes("bank"))) return 2;
    if (complaint.status === "filed") return 1;
    return 1;
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Button asChild variant="ghost" size="sm"><Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link></Button>
        <div className="flex-1">
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            Golden Hour Cyber Crime
          </h1>
          <p className="text-muted-foreground text-sm">Report fraud instantly • 1-hour recovery window • Auto bank freeze</p>
        </div>
      </div>

      {/* Helpline Banner */}
      <div className="bg-red-600 text-white rounded-xl p-4 mb-6 flex flex-wrap items-center gap-3">
        <Phone className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-bold">Cyber Crime National Helpline: <span className="text-2xl">1930</span></p>
          <p className="text-red-100 text-xs">Also report at: cybercrime.gov.in | Available 24/7</p>
        </div>
        <Badge className="bg-white text-red-700 font-bold">FREE</Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "form", label: "Report Fraud", icon: AlertTriangle },
          { key: "track", label: "Track Recovery", icon: Eye },
        ].map(t => (
          <button key={t.key} onClick={() => setStep(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${step === t.key ? "bg-primary text-white shadow" : "bg-muted hover:bg-muted/80"}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* FORM */}
        {step === "form" && (
          <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-5">
              <p className="text-orange-800 font-bold text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" /> Act within 60 minutes for maximum fund recovery!
              </p>
              <p className="text-orange-700 text-xs mt-1">
                The earlier you report, the higher the chance banks can freeze fraudulent accounts before money is withdrawn or transferred.
              </p>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Cyber Fraud Report Form
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {/* Victim Info */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Your Details</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Full Name *</Label>
                      <Input value={form.victim_name} onChange={e => setForm(f => ({ ...f, victim_name: e.target.value }))} placeholder="Your name" />
                    </div>
                    <div>
                      <Label className="text-xs">Phone Number *</Label>
                      <Input value={form.victim_phone} onChange={e => setForm(f => ({ ...f, victim_phone: e.target.value }))} placeholder="10-digit mobile" />
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input value={form.victim_email} onChange={e => setForm(f => ({ ...f, victim_email: e.target.value }))} placeholder="email@example.com" />
                    </div>
                    <div>
                      <Label className="text-xs">District</Label>
                      <Input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} placeholder="e.g., Visakhapatnam" />
                    </div>
                  </div>
                </div>

                {/* Fraud Details */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Fraud Details</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Fraud Type *</Label>
                      <Select value={form.fraud_type} onValueChange={v => setForm(f => ({ ...f, fraud_type: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select fraud type" /></SelectTrigger>
                        <SelectContent>{FRAUD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Amount Lost (₹) *</Label>
                      <Input type="number" value={form.amount_lost} onChange={e => setForm(f => ({ ...f, amount_lost: e.target.value }))} placeholder="e.g., 25000" />
                    </div>
                    <div>
                      <Label className="text-xs">When did fraud happen? *</Label>
                      <Input type="datetime-local" value={form.fraud_time} onChange={e => setForm(f => ({ ...f, fraud_time: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs">UTR / Transaction ID</Label>
                      <Input value={form.utr_transaction_id} onChange={e => setForm(f => ({ ...f, utr_transaction_id: e.target.value }))} placeholder="Transaction reference" />
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Bank / Payment Details</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Your Bank</Label>
                      <Select value={form.bank_name} onValueChange={v => setForm(f => ({ ...f, bank_name: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select your bank" /></SelectTrigger>
                        <SelectContent>{BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Your Account Number</Label>
                      <Input value={form.account_number} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))} placeholder="Last 4 digits safe" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs">Fraudster's Account / UPI ID (if known)</Label>
                      <Input value={form.fraud_account} onChange={e => setForm(f => ({ ...f, fraud_account: e.target.value }))} placeholder="UPI ID, account number, or phone" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Describe what happened *</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Explain how the fraud happened in detail..." className="h-24" />
                </div>

                {/* What happens after */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-blue-800 font-semibold text-xs mb-2">What happens after you submit:</p>
                  <div className="space-y-1">
                    {[
                      "✅ Cyber crime case registered with unique ID",
                      "📡 AP Cyber Cell notified automatically",
                      "🏦 Bank fraud portal alert dispatched",
                      "🔒 Account freeze request initiated",
                      "📱 Track recovery status in real-time",
                    ].map((item, i) => (
                      <p key={i} className="text-blue-700 text-xs">{item}</p>
                    ))}
                  </div>
                </div>

                <Button onClick={submitReport} disabled={loading} className="w-full h-12 text-base gap-2 bg-red-600 hover:bg-red-700">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                  {loading ? "Filing Report..." : "🚨 File Emergency Cyber Crime Report"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* SUBMITTED */}
        {step === "submitted" && submitted && (
          <motion.div key="submitted" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-green-300 mb-6">
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-3" />
                <h2 className="font-heading font-bold text-xl text-green-800 mb-1">Report Filed!</h2>
                <p className="font-mono font-bold text-primary text-lg">{submitted.case_id}</p>
                <p className="text-muted-foreground text-sm mt-1">Save this ID to track your case</p>
              </CardContent>
            </Card>

            <CountdownTimer fraudTime={submitted.fraud_time} />

            <div className="mt-6 space-y-3">
              <h3 className="font-semibold text-sm">Recovery Progress</h3>
              {RECOVERY_STAGES.map((stage, i) => {
                const active = i <= getStageStatus(submitted);
                return (
                  <div key={stage.key} className={`flex items-center gap-3 p-3 rounded-xl border ${active ? "border-green-300 bg-green-50" : "border-border bg-muted/30"}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${active ? stage.color : "bg-gray-200"}`}>
                      {active ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <span className="text-gray-400 text-xs">{i + 1}</span>}
                    </div>
                    <span className={`text-sm font-medium ${active ? "text-green-800" : "text-muted-foreground"}`}>{stage.label}</span>
                    {i === 0 && <Badge className="ml-auto text-[9px] bg-green-600 text-white">DONE</Badge>}
                    {i === 1 && <Badge className="ml-auto text-[9px] bg-blue-600 text-white">IN PROGRESS</Badge>}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              <a href="tel:1930" className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 text-white font-bold text-sm">
                <Phone className="w-4 h-4" /> Call 1930 Now
              </a>
              <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-primary text-primary font-bold text-sm">
                <FileText className="w-4 h-4" /> cybercrime.gov.in
              </a>
            </div>
          </motion.div>
        )}

        {/* TRACK */}
        {step === "track" && (
          <motion.div key="track" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-6">
              <CardContent className="p-5">
                <p className="text-sm font-semibold mb-3">Track Your Cyber Crime Case</p>
                <div className="flex gap-2">
                  <Input value={trackId} onChange={e => setTrackId(e.target.value)} placeholder="Enter Case ID (e.g., CYBER-ABC123)"
                    onKeyDown={e => e.key === "Enter" && trackCase()} />
                  <Button onClick={trackCase} className="shrink-0">Track</Button>
                </div>
              </CardContent>
            </Card>

            {tracked && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="mb-4 border-primary/20">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-mono font-bold text-primary">{tracked.complaint_number || tracked.case_id}</span>
                      <Badge className="bg-blue-100 text-blue-700 text-[10px]">{tracked.status?.replace("_", " ").toUpperCase()}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tracked.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">Filed: {moment(tracked.created_at || tracked.created_date).format("DD MMM YYYY, hh:mm A")}</p>
                  </CardContent>
                </Card>

                <h3 className="font-semibold text-sm mb-3">Recovery Progress</h3>
                {RECOVERY_STAGES.map((stage, i) => {
                  const active = i <= getStageStatus(tracked);
                  return (
                    <div key={stage.key} className={`flex items-center gap-3 p-3 rounded-xl border mb-2 ${active ? "border-green-300 bg-green-50" : "border-border bg-muted/20"}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${active ? stage.color : "bg-gray-200"}`}>
                        {active ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <span className="text-gray-400 text-[10px]">{i + 1}</span>}
                      </div>
                      <span className={`text-sm ${active ? "text-green-800 font-medium" : "text-muted-foreground"}`}>{stage.label}</span>
                    </div>
                  );
                })}

                {tracked.action_updates?.length > 0 && (
                  <Card className="mt-4">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Activity Log</CardTitle></CardHeader>
                    <CardContent className="pt-0 space-y-2 max-h-60 overflow-y-auto">
                      {[...tracked.action_updates].reverse().map((u, i) => (
                        <div key={i} className="text-xs border-l-2 border-primary/30 pl-3">
                          <p className="text-foreground">{u.update}</p>
                          <p className="text-muted-foreground">{moment(u.date).format("DD MMM, hh:mm A")} — {u.by}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {trackId && !tracked && (
              <p className="text-center text-muted-foreground text-sm py-8">No case found with that ID</p>
            )}

            {/* Recent Cases */}
            {!loadingCases && cases.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-semibold mb-3">Your Recent Cyber Crime Cases</p>
                {cases.map(c => (
                  <button key={c.id} onClick={() => setTracked(c)}
                    className="w-full text-left border rounded-xl p-3 mb-2 hover:border-primary/40 transition hover:shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">{c.complaint_number || c.case_id}</span>
                      <Badge className="text-[9px] bg-blue-100 text-blue-700">{c.status}</Badge>
                    </div>
                    <p className="text-sm font-medium truncate mt-0.5">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{moment(c.created_at || c.created_date).fromNow()}</p>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}