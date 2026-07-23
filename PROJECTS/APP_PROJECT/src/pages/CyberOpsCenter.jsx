import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Zap, Shield, TrendingUp, AlertTriangle, CheckCircle2, Clock,
  Search, RefreshCw, Phone, DollarSign, ChevronRight, ArrowLeft, Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import moment from "moment";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const RECOVERY_STAGES = [
  { value: "reported", label: "Reported", color: "bg-gray-500" },
  { value: "notified", label: "Notified to Bank", color: "bg-blue-500" },
  { value: "bank_contacted", label: "Bank Contacted", color: "bg-yellow-500" },
  { value: "freeze_requested", label: "Freeze Requested", color: "bg-orange-500" },
  { value: "freeze_confirmed", label: "Freeze Confirmed", color: "bg-purple-500" },
  { value: "recovery_initiated", label: "Recovery Initiated", color: "bg-indigo-500" },
  { value: "recovered", label: "Recovered ✓", color: "bg-green-600" },
  { value: "failed", label: "Failed", color: "bg-red-600" },
];

const FRAUD_COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#10b981", "#6366f1"];

export default function CyberOpsCenter() {
  const [user, setUser] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  const DISTRICTS = ["Visakhapatnam", "Nellore", "Tirupati", "Guntur", "Krishna", "East Godavari", "West Godavari"];

  const { user: authUser, profile } = useAuth();

  useEffect(() => {
    loadData();
  }, [authUser, profile]);

  const loadData = async () => {
    const me = profile ?? authUser ?? null;
    setUser(me);
    const { data } = await supabase.from('cyber_crime_reports').select('*').order('created_at', { ascending: false }).limit(100);
    let casesData = data || [];
    // Fallback removed, relying completely on Supabase
    setCases(casesData);
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    await supabase.from('cyber_crime_reports').update({ recovery_status: status }).eq('id', id);
    toast.success("Status updated");
    setCases(prev => prev.map(c => c.id === id ? { ...c, recovery_status: status } : c));
    setUpdatingId(null);
  };

  const filtered = cases.filter(c => {
    const matchSearch = !search || c.victim_name?.toLowerCase().includes(search.toLowerCase()) || c.case_id?.toLowerCase().includes(search.toLowerCase()) || c.fraud_type?.toLowerCase().includes(search.toLowerCase());
    const matchDistrict = filterDistrict === "all" || c.district === filterDistrict;
    const matchStatus = filterStatus === "all" || c.recovery_status === filterStatus;
    return matchSearch && matchDistrict && matchStatus;
  });

  // Analytics
  const totalLost = cases.reduce((s, c) => s + (c.amount_lost || 0), 0);
  const totalRecovered = cases.reduce((s, c) => s + (c.amount_recovered || 0), 0);
  const fraudTypeData = Object.entries(
    cases.reduce((acc, c) => { acc[c.fraud_type || "Unknown"] = (acc[c.fraud_type || "Unknown"] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name: name.length > 16 ? name.slice(0, 16) + "…" : name, value }));

  const districtData = Object.entries(
    cases.reduce((acc, c) => { acc[c.district || "Unknown"] = (acc[c.district || "Unknown"] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/officer-dashboard"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Link>
          </Button>
          <div className="w-12 h-12 rounded-xl bg-yellow-600 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl">Cyber Crime Operations Center</h1>
            <p className="text-muted-foreground text-xs">Real-time fraud monitoring & recovery tracking — AP Pilot Districts</p>
          </div>
        </div>
        <Button onClick={loadData} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Cases", value: cases.length, icon: AlertTriangle, color: "text-primary", bg: "bg-primary/10" },
          { label: "Amount Lost", value: `₹${(totalLost / 100000).toFixed(1)}L`, icon: DollarSign, color: "text-red-600", bg: "bg-red-50" },
          { label: "Amount Recovered", value: `₹${(totalRecovered / 100000).toFixed(1)}L`, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { label: "Recovery Rate", value: totalLost > 0 ? `${Math.round((totalRecovered / totalLost) * 100)}%` : "0%", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center mb-2`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <p className="font-bold text-xl">{kpi.value}</p>
                <p className="text-muted-foreground text-xs">{kpi.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Fraud Type Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={fraudTypeData} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, value }) => `${value}`}>
                  {fraudTypeData.map((_, i) => <Cell key={i} fill={FRAUD_COLORS[i % FRAUD_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">District-wise Cases</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={districtData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search victim, case ID, fraud type..." className="pl-9 text-sm" />
        </div>
        <Select value={filterDistrict} onValueChange={setFilterDistrict}>
          <SelectTrigger className="w-36"><SelectValue placeholder="District" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Districts</SelectItem>
            {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {RECOVERY_STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Cases Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Cyber Fraud Cases ({filtered.length})</span>
            <span className="text-muted-foreground font-normal text-xs">Golden Hour: Report within 60 min for max recovery</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 border-b">
                <tr>
                  {["Case ID", "Victim", "Fraud Type", "District", "Amount Lost", "Recovery Status", "Reported"].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium text-muted-foreground">{h}</th>
                  ))}
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const stage = RECOVERY_STAGES.find(s => s.value === c.recovery_status);
                  return (
                    <tr key={c.id} className={`border-b hover:bg-muted/30 transition ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{c.case_id || c.id.slice(0, 8)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{c.victim_name}</div>
                        <div className="text-muted-foreground">{c.victim_phone}</div>
                      </td>
                      <td className="px-4 py-3">{c.fraud_type}</td>
                      <td className="px-4 py-3">{c.district}</td>
                      <td className="px-4 py-3 font-semibold text-red-600">₹{c.amount_lost?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Select value={c.recovery_status || "reported"} onValueChange={(v) => updateStatus(c.id, v)}
                          disabled={updatingId === c.id}>
                          <SelectTrigger className="w-40 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RECOVERY_STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{moment(c.created_at || c.created_date).fromNow()}</td>
                      <td className="px-4 py-3">
                        {c.victim_phone && (
                          <a href={`tel:${c.victim_phone}`} className="text-primary hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3" /> Call
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">No cases match your filters</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Golden Hour Emergency Box */}
      <Card className="border-yellow-400 bg-yellow-50">
        <CardContent className="p-4 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="font-bold text-yellow-900">⚡ Golden Hour Protocol Active</p>
              <p className="text-yellow-700 text-xs">Cyber Helpline: 1930 • Bank Coordination within 1 hour maximizes fund recovery</p>
            </div>
          </div>
          <a href="tel:1930" className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-yellow-700 transition">
            📞 Call 1930
          </a>
        </CardContent>
      </Card>
    </div>
  );
}