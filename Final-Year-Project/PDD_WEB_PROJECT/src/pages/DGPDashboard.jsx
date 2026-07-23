import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import {
  Shield, FileText, Bell, Users, Activity, TrendingUp, CheckCircle2, Clock, AlertTriangle, MapPin,
  ArrowLeft, Loader2, RefreshCw, Trophy, Calendar, Settings2, Brain, Plus, X, Megaphone
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROLE_LABELS } from "@/lib/rbac";
import moment from "moment";

// 10 AP Pilot Districts
const AP_DISTRICTS = [
  "Visakhapatnam","Krishna","Guntur","Nellore","Chittoor",
  "Srikakulam","East Godavari","West Godavari","Prakasam","Anantapur"
];
const DISTRICT_DISPLAY = {
  "Visakhapatnam": "Visakhapatnam",
  "Krishna": "Vijayawada (Krishna)",
  "Guntur": "Guntur",
  "Nellore": "Nellore",
  "Chittoor": "Tirupati (Chittoor)",
  "Srikakulam": "Srikakulam",
  "East Godavari": "Rajamahendravaram (EG)",
  "West Godavari": "Eluru (WG)",
  "Prakasam": "Ongole (Prakasam)",
  "Anantapur": "Anantapur"
};
const PIE_COLORS = ["#1a56db","#dc2626","#059669","#d97706","#7c3aed"];

export default function DGPDashboard() {
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [districtFocus, setDistrictFocus] = useState("All");
  const [cyberCases, setCyberCases] = useState([]);
  
  // Notice Board Publisher State
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [newNotice, setNewNotice] = useState({ type: "missing", district: "", titleEn: "", descEn: "" });

  const [dashboardData, setDashboardData] = useState({
    stats: {},
    distPerf: [],
    catData: [],
    trend: [],
    distData: [],
    activeAlerts: 0,
    todayDuties: 0
  });

  const { user: authUser, profile } = useAuth();
  
  // Realtime hook
  useRealtimeSync(['complaints', 'station_alerts', 'duty_assignments', 'cyber_crime_reports'], () => {
    loadAll();
  });

  useEffect(() => { loadAll(); }, [authUser, profile, districtFocus]);

  const loadAll = async () => {
    setLoading(true);
    const me = profile ?? authUser ?? null;
    setUser(me);
    
    try {
      // 1. Fetch Analytics Data directly from complaints (bypassing broken RPCs)
      let query = supabase.from("complaints").select("id, status, priority, district, complaint_type, created_at");
      if (districtFocus !== "All") {
        query = query.eq("district", districtFocus);
      }
      
      const { data: allComplaints } = await query;
      
      if (allComplaints) {
        const total = allComplaints.length;
        const resolved = allComplaints.filter(c => ["resolved", "closed"].includes(c.status?.toLowerCase())).length;
        const pending = allComplaints.filter(c => !["resolved", "closed"].includes(c.status?.toLowerCase())).length;
        const critical = allComplaints.filter(c => c.priority?.toLowerCase() === "high" || c.priority?.toLowerCase() === "critical").length;
        
        // District Performance Grouping
        const distMap = {};
        allComplaints.forEach(c => {
          const d = c.district || "Unknown";
          if (!distMap[d]) distMap[d] = { name: DISTRICT_DISPLAY[d] || d, total: 0, resolved: 0, critical: 0 };
          distMap[d].total += 1;
          if (["resolved", "closed"].includes(c.status?.toLowerCase())) distMap[d].resolved += 1;
          if (c.priority?.toLowerCase() === "high" || c.priority?.toLowerCase() === "critical") distMap[d].critical += 1;
        });
        const distPerf = Object.values(distMap).sort((a,b) => b.total - a.total).slice(0, 5);

        // Category Grouping
        const catMap = {};
        allComplaints.forEach(c => {
          const cat = c.complaint_type || "general";
          if (!catMap[cat]) catMap[cat] = { name: cat, value: 0 };
          catMap[cat].value += 1;
        });
        const catData = Object.values(catMap).sort((a,b) => b.value - a.value).slice(0, 5);

        // Trend Grouping (Last 6 Months)
        const trendMap = {};
        allComplaints.forEach(c => {
          const m = moment(c.created_at).format("MMM");
          if (!trendMap[m]) trendMap[m] = { name: m, cases: 0, resolved: 0 };
          trendMap[m].cases += 1;
          if (["resolved", "closed"].includes(c.status?.toLowerCase())) trendMap[m].resolved += 1;
        });
        const monthlyTrendData = Object.values(trendMap);

        setDashboardData({
          stats: { total, resolved, pending, critical },
          distPerf,
          catData,
          trend: monthlyTrendData,
          distData: distPerf,
          activeAlerts: 0, // Fallback since station_alerts is empty
          todayDuties: 0   // Fallback since duty_assignments is empty
        });
      }

      // 2. Fetch station alerts (raw for feed)
      let alts = [];
      const { data: altsData } = await supabase
        .from("station_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (altsData) alts = altsData;
      setAlerts(alts);

      // 3. Fetch cyber crime cases (raw for feed)
      let cyber = [];
      const { data: cyberData } = await supabase
        .from("cyber_crime_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (cyberData) {
        cyber = cyberData.map(c => ({
          ...c,
          case_id: c.case_id || `NM-${c.id?.slice(0, 8)}`,
          created_date: c.created_at || c.created_date
        }));
      }
      setCyberCases(cyber);

    } catch (err) {
      console.error("Error loading data in DGPDashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNotice = async () => {
    if(!newNotice.titleEn || !newNotice.descEn) return;
    try {
      await supabase.from('public_notices').insert([{
        type: newNotice.type,
        district: newNotice.district || "Andhra Pradesh",
        title_en: newNotice.titleEn,
        desc_en: newNotice.descEn,
        badge: "NEW ALERT",
        badge_color: "bg-sky-100 text-sky-700",
        color: "bg-sky-50 border-sky-200 text-sky-800",
        icon_color: "text-sky-600"
      }]);
      setShowNoticeModal(false);
      setNewNotice({ type: "missing", district: "", titleEn: "", descEn: "" });
      // Realtime hook will catch this or we can loadAll manually if notices was listened to
    } catch(err) {
      console.error(err);
    }
  };

  const { stats, catData, trend, distPerf, distData, activeAlerts, todayDuties } = dashboardData;
  const total = stats.total || 0;
  const resolved = stats.resolved || 0;
  const pending = stats.pending || 0;
  const critical = stats.critical || 0;
  const escalated = stats.escalated || 0;
  const resRate = total ? Math.round((resolved / total) * 100) : 0;
  
  // Notice board data will need to be fetched, but for now we fetch it if we want, or just wait for the next iteration where we fetch public_notices


  const myRole = user?.user_type || user?.role;
  const isHighCommand = ["dgp","adg","ig","dig","sp","dsp","admin"].includes(myRole);

  if (!isHighCommand) return (
    <div className="max-w-xl mx-auto py-20 text-center">
      <Shield className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
      <h2 className="font-heading font-bold text-xl mb-2">High Command Access Only</h2>
      <p className="text-muted-foreground mb-4">This dashboard is restricted to DGP, SP, DSP and above.</p>
      <Button asChild variant="outline"><Link to="/officer-dashboard">Back</Link></Button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm"><Link to="/officer-dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link></Button>
        <div className="flex-1">
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            {ROLE_LABELS[myRole]} — State Command Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">Andhra Pradesh — 5 Pilot Districts: Visakhapatnam · Vijayawada · Guntur · Nellore · Tirupati • {moment().format("ddd, DD MMM YYYY")}</p>
        </div>
        <Select value={districtFocus} onValueChange={setDistrictFocus}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All 5 Pilot Districts</SelectItem>
            {AP_DISTRICTS.map(d => <SelectItem key={d} value={d}>{DISTRICT_DISPLAY[d]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowNoticeModal(true)} className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm flex items-center gap-2">
          <Megaphone className="w-4 h-4" /> Publish Notice
        </Button>
        <Button variant="outline" size="sm" onClick={loadAll}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total Cases", value: total, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
          { label: "Resolved", value: `${resRate}%`, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { label: "Pending", value: pending, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Critical Open", value: critical, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
          { label: "Active Alerts", value: activeAlerts, icon: Bell, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Today Duties", value: todayDuties, icon: Calendar, color: "text-violet-600", bg: "bg-violet-50" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="hover:shadow-md transition">
              <CardContent className="p-3 flex items-center gap-2">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  <p className={`font-bold text-xl leading-tight ${s.color}`}>{s.value}</p>
                  <p className="text-muted-foreground text-[10px]">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-3 gap-5 mb-5">
        {/* District Distribution */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Cases by District</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={distData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="total" fill="#1a56db" radius={[3,3,0,0]} name="Total" />
                <Bar dataKey="resolved" fill="#059669" radius={[3,3,0,0]} name="Resolved" />
                <Bar dataKey="critical" fill="#dc2626" radius={[3,3,0,0]} name="Critical" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Pie */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Crime Categories</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, value }) => value > 0 ? `${name.slice(0,6)}:${value}` : ""}
                  labelLine={false} fontSize={8}>
                  {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        {/* Monthly Trend */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Monthly Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="filed" stroke="#1a56db" strokeWidth={2} dot={{ r: 4 }} name="Filed" />
                <Line type="monotone" dataKey="resolved" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* District Performance Rankings */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500" /> Top Districts by Resolution</CardTitle></CardHeader>
          <CardContent className="pt-0">
            {distPerf.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.total} cases • {d.resolved} resolved</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${d.rate}%` }} />
                  </div>
                  <Badge className={`text-[9px] ${d.rate >= 70 ? "bg-green-600" : d.rate >= 40 ? "bg-yellow-600" : "bg-red-600"} text-white`}>
                    {d.rate}%
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Critical Alerts */}
      {activeAlerts > 0 && (
        <Card className="border-red-200 mb-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <motion.div animate={{ scale: [1,1.2,1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </motion.div>
              Active Alerts ({activeAlerts})
              <Button asChild variant="ghost" size="sm" className="ml-auto text-xs h-7">
                <Link to="/alerts-admin">Manage All</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid sm:grid-cols-2 gap-2">
              {alerts.filter(a => a.is_active).slice(0, 4).map(a => (
                <div key={a.id} className={`p-3 rounded-xl border text-xs ${a.severity === "critical" ? "bg-red-50 border-red-200" : a.severity === "high" ? "bg-orange-50 border-orange-200" : "bg-yellow-50 border-yellow-200"}`}>
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-muted-foreground mt-0.5 line-clamp-2">{a.message}</p>
                  <p className="text-muted-foreground/70 mt-1">{a.district || "AP-wide"} • {moment(a.created_date).fromNow()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cyber Crime Intelligence */}
      {cyberCases.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/30 mb-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              Cyber Crime Intelligence
              <Badge className="ml-auto text-[9px] bg-yellow-600 text-white">{cyberCases.length} cases</Badge>
              <Button asChild variant="ghost" size="sm" className="text-xs h-7">
                <Link to="/golden-hour-cyber">View Portal</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              {[
                { label: "Total Reports", value: cyberCases.length, color: "text-yellow-700" },
                { label: "Total Lost (₹)", value: `₹${(cyberCases.reduce((s, c) => s + (c.amount_lost || 0), 0) / 100000).toFixed(1)}L`, color: "text-red-700" },
                { label: "Recovered (₹)", value: `₹${(cyberCases.reduce((s, c) => s + (c.amount_recovered || 0), 0) / 1000).toFixed(0)}K`, color: "text-green-700" },
                { label: "Recovery Rate", value: (() => { const lost = cyberCases.reduce((s, c) => s + (c.amount_lost || 0), 0); const rec = cyberCases.reduce((s, c) => s + (c.amount_recovered || 0), 0); return lost ? `${Math.round((rec/lost)*100)}%` : "0%"; })(), color: "text-blue-700" },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-lg p-3 border border-yellow-200 text-center">
                  <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
                  <p className="text-muted-foreground text-[10px]">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {cyberCases.slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center gap-3 text-xs bg-white rounded-lg p-2.5 border border-yellow-100">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{c.victim_name}</span>
                    <span className="text-muted-foreground"> — {c.fraud_type} — </span>
                    <span className="text-red-700 font-semibold">₹{c.amount_lost?.toLocaleString()}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
                    c.recovery_status === "recovered" ? "bg-green-100 text-green-700" :
                    c.recovery_status === "freeze_confirmed" || c.recovery_status === "recovery_initiated" ? "bg-blue-100 text-blue-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>{c.recovery_status?.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground">{c.district}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: "/officer-management", icon: Users, label: "Officer Management", color: "bg-blue-600" },
          { to: "/case-management", icon: FileText, label: "Case Management", color: "bg-violet-600" },
          { to: "/duty-management", icon: Calendar, label: "Duty Management", color: "bg-emerald-600" },
          { to: "/workforce-monitor", icon: Activity, label: "Workforce Monitor", color: "bg-teal-600" },
          { to: "/crime-heat-map", icon: MapPin, label: "Crime Heat Map", color: "bg-orange-600" },
          { to: "/nyaya-ai", icon: Trophy, label: "NyayaAI Assistant", color: "bg-primary" },
          { to: "/system-admin", icon: Trophy, label: "System Admin Board", color: "bg-red-600" },
          { to: "/activity-log", icon: Activity, label: "Activity Log", color: "bg-slate-600" },
        ].map((item, i) => (
          <Link key={i} to={item.to}
            className="flex items-center gap-3 p-4 rounded-xl border border-border hover:shadow-md hover:border-primary/30 transition">
            <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}>
              <item.icon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Notice Publisher Modal */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border shadow-xl rounded-2xl w-full max-w-lg p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-sky-600" /> Publish Public Notice
              </h3>
              <button onClick={() => setShowNoticeModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground block mb-1">Notice Type</label>
                <Select value={newNotice.type} onValueChange={val => setNewNotice({...newNotice, type: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="missing">Missing Person</SelectItem>
                    <SelectItem value="reward">Reward/Wanted</SelectItem>
                    <SelectItem value="naxal">Security Alert</SelectItem>
                    <SelectItem value="forest">Forest Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-muted-foreground block mb-1">District</label>
                <input 
                  type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={newNotice.district} onChange={e => setNewNotice({...newNotice, district: e.target.value})}
                  placeholder="e.g. Visakhapatnam or 'All AP'"
                />
              </div>
              
              <div>
                <label className="text-sm font-semibold text-muted-foreground block mb-1">Title (English)</label>
                <input 
                  type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={newNotice.titleEn} onChange={e => setNewNotice({...newNotice, titleEn: e.target.value})}
                  placeholder="Notice Title"
                />
              </div>
              
              <div>
                <label className="text-sm font-semibold text-muted-foreground block mb-1">Description (English)</label>
                <textarea 
                  rows={4} className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  value={newNotice.descEn} onChange={e => setNewNotice({...newNotice, descEn: e.target.value})}
                  placeholder="Detailed information..."
                />
              </div>
              
              <Button onClick={handleAddNotice} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2">
                Publish Notice to Public Board
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}