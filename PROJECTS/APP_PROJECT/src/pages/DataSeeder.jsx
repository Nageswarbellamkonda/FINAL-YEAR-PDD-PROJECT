import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Database, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import moment from "moment";

const AP_STATIONS = [
  { district: "Visakhapatnam", station: "Dwaraka Nagar PS", mandal: "Visakhapatnam" },
  { district: "Visakhapatnam", station: "MVP Colony PS", mandal: "MVP Colony" },
  { district: "Visakhapatnam", station: "Gajuwaka PS", mandal: "Gajuwaka" },
  { district: "Guntur", station: "Guntur One Town PS", mandal: "Guntur" },
  { district: "Guntur", station: "Guntur Brodipet PS", mandal: "Brodipet" },
  { district: "Krishna", station: "Vijayawada One Town PS", mandal: "Vijayawada" },
  { district: "Krishna", station: "Machilipatnam PS", mandal: "Machilipatnam" },
  { district: "East Godavari", station: "Rajahmundry One Town PS", mandal: "Rajahmundry" },
  { district: "Nellore", station: "Nellore One Town PS", mandal: "Nellore" },
  { district: "Kurnool", station: "Kurnool One Town PS", mandal: "Kurnool" },
];

const CRIME_TITLES = [
  { title: "Mobile phone snatching near bus stand", category: "snatching", priority: "high" },
  { title: "OTP fraud — ₹45,000 lost via UPI scam", category: "cyber_crime", priority: "critical" },
  { title: "Domestic violence complaint", category: "domestic_violence", priority: "high" },
  { title: "Chain snatching at morning walk", category: "snatching", priority: "normal" },
  { title: "Missing teenager — 16 years old", category: "missing_person", priority: "critical" },
  { title: "Narcotics possession near school", category: "narcotics", priority: "high" },
  { title: "Theft of two-wheeler", category: "theft", priority: "normal" },
  { title: "Women harassment at workplace", category: "women_safety", priority: "high" },
  { title: "Online shopping fraud — ₹12,000 loss", category: "cyber_crime", priority: "high" },
  { title: "Traffic accident with injury", category: "traffic", priority: "high" },
  { title: "Bank KYC fraud — ₹1,20,000 lost", category: "otp_fraud", priority: "critical" },
  { title: "Physical assault by neighbor", category: "assault", priority: "normal" },
];

const DUTY_TYPES = ["patrol", "bandobast", "traffic", "investigation", "night_duty", "court_duty"];
const SHIFTS = ["morning", "afternoon", "evening", "night"];

const seedSteps = [
  { key: "complaints", label: "Sample Complaints/Cases (12)" },
  { key: "duties", label: "Duty Assignments (15)" },
  { key: "attendance", label: "Attendance Records (20)" },
  { key: "alerts", label: "Station Alerts (6)" },
  { key: "cyber", label: "Cyber Crime Cases (5)" },
  { key: "women", label: "Women Safety Sessions (3)" },
  { key: "ai", label: "AI Case Summaries (5)" },
];

export default function DataSeeder() {
  const [progress, setProgress] = useState({});
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const markStep = (key, status) => setProgress(p => ({ ...p, [key]: status }));

  const seedComplaints = async () => {
    markStep("complaints", "running");
    const records = CRIME_TITLES.map((c, i) => {
      const station = AP_STATIONS[i % AP_STATIONS.length];
      const statuses = ["filed", "under_review", "assigned", "investigating", "resolved"];
      return {
        complaint_number: `NM-DEMO${String(i + 1).padStart(3, "0")}`,
        title: c.title,
        description: `Complaint regarding: ${c.title}. Filed by citizen at ${station.station}.`,
        complaint_type: c.category,
        priority: c.priority,
        status: statuses[i % statuses.length],
        district: station.district,
        mandal: station.mandal,
        police_station: station.station,
      };
    });
    await supabase.from('complaints').insert(records);
    markStep("complaints", "done");
  };

  const seedDuties = async () => {
    markStep("duties", "running");
    const records = Array.from({ length: 15 }, (_, i) => {
      const station = AP_STATIONS[i % AP_STATIONS.length];
      const dutyDate = moment().add(i % 7 - 3, "days").format("YYYY-MM-DD");
      return {
        duty_type: DUTY_TYPES[i % DUTY_TYPES.length],
        shift: SHIFTS[i % SHIFTS.length],
        start_time: `${dutyDate}T${["06:00", "14:00", "18:00", "22:00"][i % 4]}:00Z`,
        end_time: `${dutyDate}T${["14:00", "22:00", "22:00", "06:00"][i % 4]}:00Z`,
        location: `${station.mandal} Zone ${(i % 3) + 1}`,
        status: ["scheduled", "active", "completed"][i % 3],
        notes: `Regular ${DUTY_TYPES[i % DUTY_TYPES.length]} duty assignment for ${station.station}`,
      };
    });
    await supabase.from('duty_assignments').insert(records);
    markStep("duties", "done");
  };

  const seedAttendance = async () => {
    markStep("attendance", "running");
    const records = Array.from({ length: 20 }, (_, i) => {
      const station = AP_STATIONS[i % AP_STATIONS.length];
      const statuses = ["present", "present", "present", "late", "absent"];
      return {
        shift: SHIFTS[i % SHIFTS.length],
        date: moment().subtract(i % 5, "days").format("YYYY-MM-DD"),
        status: statuses[i % statuses.length],
        verified: i % 5 !== 4,
      };
    });
    await supabase.from('attendances').insert(records);
    markStep("attendance", "done");
  };

  const seedAlerts = async () => {
    markStep("alerts", "running");
    const alertData = [
      { title: "Snatching Alert — Rythu Bazaar Area", message: "Increased snatching incidents near Rythu Bazaar between 7PM-9PM. Citizens advised to stay vigilant.", alert_type: "crime_alert", severity: "high", district: "Visakhapatnam", scope: "district" },
      { title: "Cyber Fraud Warning — OTP Scams", message: "Senior citizens being targeted by OTP scam callers pretending to be bank officials. Do NOT share OTPs.", alert_type: "advisory", severity: "high", district: "Guntur", scope: "district" },
      { title: "Festival Bandobast — Dussehra", message: "Additional police deployment for Dussehra celebrations. Traffic diversions in effect from 4PM.", alert_type: "duty_notice", severity: "medium", district: "Visakhapatnam", scope: "district" },
      { title: "Missing Child Alert", message: "10-year-old child missing from Brodipet area. Fair complexion, wearing blue shirt. Contact 100 immediately.", alert_type: "emergency", severity: "critical", district: "Guntur", scope: "district" },
      { title: "Heavy Rain Advisory", message: "IMD has issued heavy rainfall warning. Officers to exercise caution during night patrol. Emergency teams on standby.", alert_type: "weather", severity: "medium", district: "Krishna", scope: "district" },
      { title: "VIP Movement — NH-16 Regulation", message: "Traffic regulation on NH-16 from 10AM-2PM for state minister's convoy. Alternative routes advised.", alert_type: "news", severity: "low", district: "East Godavari", scope: "district" },
    ];
    const records = alertData.map(a => ({
      type: a.alert_type,
      title: a.title,
      message: a.message,
      severity: a.severity,
      target_audience: { district: a.district }
    }));
    await supabase.from('station_alerts').insert(records);
    markStep("alerts", "done");
  };

  const seedCyberCases = async () => {
    markStep("cyber", "running");
    const records = [
      { fraud_type: "UPI/PhonePe Fraud", amount_lost: 45000, bank_name: "SBI", account_number: "XXXX1234", transaction_id: "UTR202500001", recovery_status: "freeze_confirmed", amount_recovered: 0 },
      { fraud_type: "Bank KYC Fraud", amount_lost: 120000, bank_name: "HDFC Bank", account_number: "XXXX5678", transaction_id: "UTR202500002", recovery_status: "bank_contacted", amount_recovered: 0 },
      { fraud_type: "Online Shopping Fraud", amount_lost: 12000, bank_name: "ICICI Bank", account_number: "XXXX9012", transaction_id: "UTR202500003", recovery_status: "reported", amount_recovered: 0 },
      { fraud_type: "Investment/Ponzi Scheme", amount_lost: 500000, bank_name: "Axis Bank", account_number: "XXXX3456", transaction_id: "UTR202500004", recovery_status: "recovery_initiated", amount_recovered: 150000 },
      { fraud_type: "Job Offer Fraud", amount_lost: 25000, bank_name: "PNB", account_number: "XXXX7890", transaction_id: "UTR202500005", recovery_status: "notified", amount_recovered: 0 },
    ];
    await supabase.from('cyber_crime_reports').insert(records);
    markStep("cyber", "done");
  };

  const seedWomenSafety = async () => {
    markStep("women", "running");
    const records = [
      { session_id: "SAF-DEMO001", start_time: moment().subtract(2, "days").format(), end_time: moment().subtract(2, "days").add(2, "hours").format(), start_location: { lat: 17.65, lng: 83.18 }, end_location: { lat: 17.70, lng: 83.25 }, status: "completed", emergency_triggered: false },
      { session_id: "SAF-DEMO002", start_time: moment().subtract(1, "days").format(), status: "active", emergency_triggered: true, start_location: { lat: 16.53, lng: 80.60 } },
      { session_id: "SAF-DEMO003", start_time: moment().subtract(5, "hours").format(), end_time: moment().subtract(4, "hours").format(), start_location: { lat: 13.63, lng: 79.42 }, status: "completed", emergency_triggered: false }
    ];
    await supabase.from('women_safety_sessions').insert(records);
    markStep("women", "done");
  };

  const seedAISummaries = async () => {
    markStep("ai", "running");
    const { data: complaints } = await supabase.from('complaints').select('id').limit(5);
    if (complaints && complaints.length > 0) {
      const records = complaints.map((c, i) => ({
        complaint_id: c.id,
        summary_text: `AI Summary for case ${i + 1}: The incident requires immediate attention. Key entities identified.`,
        key_entities: { entities: ["suspect", "vehicle", "location"] },
        risk_assessment: ["high", "medium", "low"][i % 3],
        generated_at: moment().format()
      }));
      await supabase.from('ai_case_summaries').insert(records);
    }
    markStep("ai", "done");
  };

  const runSeeder = async () => {
    setRunning(true);
    setProgress({});
    try {
      await seedComplaints();
      await seedDuties();
      await seedAttendance();
      await seedAlerts();
      await seedCyberCases();
      await seedWomenSafety();
      await seedAISummaries();
      setDone(true);
      toast.success("All demo data seeded successfully!");
    } catch (err) {
      toast.error("Error during seeding: " + err.message);
    }
    setRunning(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/admin-panel"><ArrowLeft className="w-4 h-4 mr-1" /> Admin Panel</Link>
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center">
          <Database className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-heading font-bold text-2xl">Demo Data Seeder</h1>
          <p className="text-muted-foreground text-sm">Generate Andhra Pradesh demo data for all modules</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-800 text-sm">Important Note</p>
          <p className="text-amber-700 text-xs mt-1">This will add demo records to your database. Only run once to avoid duplicate data. Admin access required.</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-sm">What will be seeded</CardTitle></CardHeader>
        <CardContent className="pt-0 space-y-3">
          {seedSteps.map(step => (
            <div key={step.key} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                progress[step.key] === "done" ? "bg-green-500" :
                progress[step.key] === "running" ? "bg-blue-500" :
                "bg-muted"
              }`}>
                {progress[step.key] === "done" ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> :
                 progress[step.key] === "running" ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> :
                 <span className="text-muted-foreground text-xs">{seedSteps.indexOf(step) + 1}</span>}
              </div>
              <span className={`text-sm ${progress[step.key] === "done" ? "text-green-700 font-medium" : progress[step.key] === "running" ? "text-blue-700 font-medium" : "text-muted-foreground"}`}>
                {step.label}
              </span>
              {progress[step.key] === "done" && <Badge className="bg-green-100 text-green-700 text-[10px] ml-auto">Done</Badge>}
              {progress[step.key] === "running" && <Badge className="bg-blue-100 text-blue-700 text-[10px] ml-auto">Running...</Badge>}
            </div>
          ))}
        </CardContent>
      </Card>

      {done ? (
        <div className="text-center py-6">
          <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-3" />
          <h2 className="font-heading font-bold text-xl text-green-800">Demo Data Ready!</h2>
          <p className="text-muted-foreground text-sm mt-1 mb-4">All modules are now populated with Andhra Pradesh demo data.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button asChild><Link to="/officer-dashboard">Officer Dashboard</Link></Button>
            <Button asChild variant="outline"><Link to="/unified-dashboard">Unified Command</Link></Button>
            <Button asChild variant="outline"><Link to="/golden-hour-cyber">Cyber Crime</Link></Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={runSeeder}
          disabled={running}
          className="w-full h-12 gap-2 text-base"
        >
          {running ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
          {running ? "Seeding Data..." : "Seed All Demo Data"}
        </Button>
      )}
    </div>
  );
}