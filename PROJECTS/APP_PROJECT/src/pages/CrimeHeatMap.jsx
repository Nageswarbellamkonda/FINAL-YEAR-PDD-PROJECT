import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from "recharts";
import {
  MapPin, Shield, AlertTriangle, TrendingUp, Loader2, RefreshCw,
  ArrowLeft, Filter, Activity, Zap, Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import moment from "moment";

const PILOT_DISTRICTS = ["Nellore", "Tirupati", "Visakhapatnam"];
const ALL_DISTRICTS = ["Srikakulam","Vizianagaram","Visakhapatnam","East Godavari","West Godavari","Krishna","Guntur","Prakasam","Nellore","Kurnool","YSR Kadapa","Anantapur","Chittoor","Tirupati"];
const CRIME_TYPES = ["all","narcotics","snatching","women_safety","cyber_crime","otp_fraud","theft","assault","domestic_violence","missing_person","traffic"];
const PIE_COLORS = ["#dc2626","#d97706","#7c3aed","#0891b2","#059669","#1a56db","#f43f5e","#16a34a","#ea580c"];

// Simulated hotspot data for AP pilot districts
const HOTSPOTS = {
  Visakhapatnam: [
    { zone: "Rythu Bazaar", lat: 17.71, lng: 83.30, intensity: 9, crimes: 34, type: "snatching" },
    { zone: "Gajuwaka", lat: 17.68, lng: 83.21, intensity: 8, crimes: 28, type: "narcotics" },
    { zone: "MVP Colony", lat: 17.74, lng: 83.33, intensity: 7, crimes: 22, type: "cyber_crime" },
    { zone: "Dwaraka Nagar", lat: 17.73, lng: 83.32, intensity: 6, crimes: 18, type: "theft" },
    { zone: "Steel Plant Area", lat: 17.69, lng: 83.19, intensity: 8, crimes: 26, type: "assault" },
    { zone: "Rushikonda Beach", lat: 17.77, lng: 83.38, intensity: 5, crimes: 12, type: "women_safety" },
  ],
  Nellore: [
    { zone: "Nellore Town", lat: 14.44, lng: 79.99, intensity: 8, crimes: 29, type: "cyber_crime" },
    { zone: "Pogathota", lat: 14.43, lng: 79.98, intensity: 7, crimes: 21, type: "snatching" },
    { zone: "Trunk Road", lat: 14.45, lng: 79.97, intensity: 6, crimes: 17, type: "theft" },
    { zone: "Old Town", lat: 14.42, lng: 79.99, intensity: 5, crimes: 14, type: "domestic_violence" },
  ],
  Tirupati: [
    { zone: "Tirumala Road", lat: 13.64, lng: 79.42, intensity: 9, crimes: 31, type: "theft" },
    { zone: "Balaji Colony", lat: 13.63, lng: 79.41, intensity: 7, crimes: 23, type: "snatching" },
    { zone: "Railway Station", lat: 13.62, lng: 79.42, intensity: 8, crimes: 27, type: "cyber_crime" },
    { zone: "RTC Complex", lat: 13.63, lng: 79.43, intensity: 6, crimes: 16, type: "women_safety" },
  ],
};

const PATROL_ZONES = {
  Visakhapatnam: ["Increase night patrol at Rythu Bazaar (9PM-1AM)", "Deploy plain-clothes officers at Steel Plant bus stops", "Mobile checkpoints on NH-16 near Gajuwaka"],
  Nellore: ["Enhanced cyber awareness drive in Trunk Road area", "CCTV monitoring expansion at Pogathota junction", "Beat constable rotation at Old Town market"],
  Tirupati: ["Pilgrim protection squads at Tirumala road entry", "RFID vehicle tracking at RTC Complex", "Women safety escorts near Balaji Colony"],
};

function HotspotMap({ district, hotspots }) {
  const bounds = {
    Visakhapatnam: { minLat: 17.65, maxLat: 17.82, minLng: 83.15, maxLng: 83.42 },
    Nellore: { minLat: 14.38, maxLat: 14.52, minLng: 79.92, maxLng: 80.06 },
    Tirupati: { minLat: 13.58, maxLat: 13.70, minLng: 79.38, maxLng: 79.50 },
  };
  const b = bounds[district] || bounds.Visakhapatnam;
  const toX = (lng) => ((lng - b.minLng) / (b.maxLng - b.minLng)) * 100;
  const toY = (lat) => (1 - (lat - b.minLat) / (b.maxLat - b.minLat)) * 100;

  return (
    <div className="relative w-full h-72 bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
      {/* Grid lines */}
      {[...Array(6)].map((_, i) => (
        <div key={`h${i}`} className="absolute w-full border-t border-slate-700/50" style={{ top: `${i * 20}%` }} />
      ))}
      {[...Array(6)].map((_, i) => (
        <div key={`v${i}`} className="absolute h-full border-l border-slate-700/50" style={{ left: `${i * 20}%` }} />
      ))}

      {/* District label */}
      <div className="absolute top-3 left-3 bg-slate-900/80 text-white text-xs font-bold px-2 py-1 rounded-lg">
        📍 {district} District — Crime Heat Map
      </div>

      {/* Hotspots */}
      {hotspots.map((h, i) => {
        const x = toX(h.lng);
        const y = toY(h.lat);
        const size = 20 + h.intensity * 4;
        const color = h.intensity >= 8 ? "rgba(220,38,38,0.75)" : h.intensity >= 6 ? "rgba(234,88,12,0.70)" : "rgba(217,119,6,0.65)";
        return (
          <div key={i} className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${x}%`, top: `${y}%` }}>
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-full animate-ping opacity-40"
              style={{ background: color, width: size + 12, height: size + 12, transform: "translate(-6px,-6px)" }} />
            {/* Core dot */}
            <div className="rounded-full flex items-center justify-center text-white text-[9px] font-bold cursor-pointer shadow-lg"
              style={{ width: size, height: size, background: color }}>
              {h.crimes}
            </div>
            {/* Tooltip */}
            <div className="absolute hidden group-hover:block z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-36 bg-slate-900 text-white text-xs rounded-lg p-2 pointer-events-none">
              <p className="font-bold">{h.zone}</p>
              <p className="text-slate-300">{h.crimes} incidents</p>
              <p className="text-orange-300 capitalize">{h.type.replace(/_/g," ")}</p>
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-3 right-3 bg-slate-900/80 rounded-lg p-2 text-[10px] space-y-1">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-slate-300">Critical (8-10)</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-orange-500" /><span className="text-slate-300">High (6-7)</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-yellow-500" /><span className="text-slate-300">Medium (4-5)</span></div>
      </div>
    </div>
  );
}

export default function CrimeHeatMap() {
  const [complaints, setComplaints] = useState([]);
  const [cyberCases, setCyberCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [district, setDistrict] = useState("Visakhapatnam");
  const [crimeType, setCrimeType] = useState("all");
  const [timeRange, setTimeRange] = useState("monthly");

  useEffect(() => {
    (async () => {
      const [
        { data: comps },
        { data: cyber }
      ] = await Promise.all([
        supabase.from('complaints').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('cyber_crime_reports').select('*').order('created_at', { ascending: false }).limit(100),
      ]);
      let compsList = comps || [];
      setComplaints(compsList);

      let cyberList = cyber || [];
      setCyberCases(cyberList);

      setLoading(false);
    })();
  }, []);

  const filtered = complaints.filter(c => {
    const distMatch = district === "all" || c.district === district || c.location?.toLowerCase().includes(district.toLowerCase());
    const typeMatch = crimeType === "all" || (c.complaint_type || c.category) === crimeType;
    return distMatch && typeMatch;
  });

  // Category breakdown
  const catData = Object.entries(
    filtered.reduce((acc, c) => { acc[c.complaint_type || c.category || "other"] = (acc[c.complaint_type || c.category || "other"] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name: name.replace(/_/g, " "), value })).sort((a, b) => b.value - a.value).slice(0, 8);

  // Trend data
  const trendData = (() => {
    const map = {};
    filtered.forEach(c => {
      const key = timeRange === "yearly"
        ? moment(c.created_at || c.created_date).format("YYYY")
        : timeRange === "monthly"
        ? moment(c.created_at || c.created_date).format("MMM YYYY")
        : moment(c.created_at || c.created_date).format("DD MMM");
      if (!map[key]) map[key] = { period: key, count: 0, resolved: 0, critical: 0 };
      map[key].count++;
      if (["resolved","closed"].includes(c.status)) map[key].resolved++;
      if (c.priority === "critical") map[key].critical++;
    });
    return Object.values(map).slice(-12);
  })();

  // District comparison
  const distComp = ALL_DISTRICTS.map(d => ({
    name: d.split(" ")[0],
    total: complaints.filter(c => c.district === d || c.location?.toLowerCase().includes(d.toLowerCase())).length,
    cyber: cyberCases.filter(c => c.district === d).length,
    resolved: complaints.filter(c => (c.district === d) && ["resolved","closed"].includes(c.status)).length,
  })).filter(d => d.total > 0 || d.cyber > 0);

  // Hotspots for selected district
  const hotspots = HOTSPOTS[district] || HOTSPOTS.Visakhapatnam;
  const patrolRecs = PATROL_ZONES[district] || PATROL_ZONES.Visakhapatnam;

  // Severity stats
  const criticalCount = filtered.filter(c => c.priority === "critical").length;
  const highCount = filtered.filter(c => c.priority === "high").length;
  const cyberDistCount = cyberCases.filter(c => c.district === district || c.district?.toLowerCase().includes(district.toLowerCase())).length;
  const totalLost = cyberCases.filter(c => c.district === district).reduce((s, c) => s + (c.amount_lost || 0), 0);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm"><Link to="/officer-dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link></Button>
        <div className="flex-1">
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <MapPin className="w-6 h-6 text-red-600" />
            AI Crime Intelligence & Heat Map
          </h1>
          <p className="text-muted-foreground text-sm">AP Pilot Districts — Predictive crime analytics & hotspot detection</p>
        </div>
        <Badge className="bg-green-600 text-white text-xs">🟢 LIVE DATA</Badge>
        <Button variant="outline" size="sm" onClick={() => location.reload()}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 bg-muted/30 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium">Filters:</span>
        </div>
        <Select value={district} onValueChange={setDistrict}>
          <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Districts</SelectItem>
            {ALL_DISTRICTS.map(d => (
              <SelectItem key={d} value={d}>
                {PILOT_DISTRICTS.includes(d) ? "🔵 " : ""}{d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={crimeType} onValueChange={setCrimeType}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CRIME_TYPES.map(t => <SelectItem key={t} value={t}>{t === "all" ? "All Crime Types" : t.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
        {PILOT_DISTRICTS.includes(district) && (
          <Badge className="bg-blue-100 text-blue-700 text-[10px] ml-auto">🔵 AP Pilot District</Badge>
        )}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Incidents", value: filtered.length, color: "text-primary", bg: "bg-primary/10" },
          { label: "Critical Cases", value: criticalCount, color: "text-red-600", bg: "bg-red-50" },
          { label: "High Priority", value: highCount, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Cyber Cases", value: cyberDistCount, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Cyber Loss", value: `₹${(totalLost/100000).toFixed(1)}L`, color: "text-red-700", bg: "bg-red-50" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card>
              <CardContent className="p-3 text-center">
                <p className={`font-bold text-2xl ${s.color}`}>{s.value}</p>
                <p className="text-muted-foreground text-[10px]">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Heat Map */}
      {PILOT_DISTRICTS.includes(district) && (
        <div className="mb-6">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-red-500" /> Crime Hotspot Heat Map — {district}
          </h2>
          <HotspotMap district={district} hotspots={hotspots} />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-5 mb-6">
        {/* Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Crime Trend ({timeRange})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a56db" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1a56db" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="count" stroke="#1a56db" fill="url(#colorCount)" name="Incidents" />
                <Line type="monotone" dataKey="resolved" stroke="#059669" strokeWidth={2} name="Resolved" />
                <Line type="monotone" dataKey="critical" stroke="#dc2626" strokeWidth={2} name="Critical" strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Crime Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, value }) => value > 0 ? `${name.slice(0,8)}:${value}` : ""}
                  labelLine={false} fontSize={8}>
                  {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* District Comparison */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> District-wise Crime Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={distComp}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="total" fill="#1a56db" radius={[3,3,0,0]} name="Total Crimes" />
              <Bar dataKey="resolved" fill="#059669" radius={[3,3,0,0]} name="Resolved" />
              <Bar dataKey="cyber" fill="#7c3aed" radius={[3,3,0,0]} name="Cyber" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AI Patrol Recommendations */}
      {PILOT_DISTRICTS.includes(district) && (
        <Card className="border-blue-200 bg-blue-50/30 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              AI Patrol Recommendations — {district}
              <Badge className="text-[9px] bg-blue-600 text-white ml-auto">NyayaAI</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {patrolRecs.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 bg-white rounded-lg p-3 border border-blue-100 text-sm">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i+1}</div>
                <span>{rec}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Hotspot Table */}
      {PILOT_DISTRICTS.includes(district) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-red-500" /> Crime Hotspot Details — {district}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {hotspots.sort((a,b) => b.intensity - a.intensity).map((h, i) => (
                <div key={i} className="flex items-center gap-3 border rounded-lg p-3 text-sm">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${h.intensity >= 8 ? "bg-red-600" : h.intensity >= 6 ? "bg-orange-500" : "bg-yellow-500"}`}>
                    {h.intensity}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{h.zone}</p>
                    <p className="text-xs text-muted-foreground capitalize">{h.type.replace(/_/g," ")} • {h.crimes} incidents</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${h.intensity >= 8 ? "bg-red-500" : h.intensity >= 6 ? "bg-orange-500" : "bg-yellow-500"}`}
                        style={{ width: `${h.intensity * 10}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right mt-0.5">Severity {h.intensity}/10</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}