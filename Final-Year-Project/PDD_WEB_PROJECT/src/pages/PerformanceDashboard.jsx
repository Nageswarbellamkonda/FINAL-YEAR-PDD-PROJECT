import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { Trophy, TrendingUp, Clock, CheckCircle2, AlertTriangle, Shield, Loader2, ArrowLeft, Star } from "lucide-react";
import { Link } from "react-router-dom";
import moment from "moment";

const AP_DISTRICTS = ["All Districts","Srikakulam","Vizianagaram","Visakhapatnam","East Godavari","West Godavari","Krishna","Guntur","Prakasam","Nellore","Kurnool","YSR Kadapa","Anantapur","Chittoor"];
const COLORS = ["#1a56db","#059669","#d97706","#dc2626","#7c3aed","#0891b2","#f43f5e","#16a34a"];

export default function PerformanceDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [district, setDistrict] = useState("All Districts");
  const [user, setUser] = useState(null);

  const { user: authUser, profile } = useAuth();

  useEffect(() => {
    (async () => {
      const me = profile ?? authUser ?? null;
      setUser(me);
      const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false }).limit(500);
      let compsList = data || [];

      setComplaints(compsList);
      setLoading(false);
    })();
  }, [authUser, profile]);

  const filtered = district === "All Districts"
    ? complaints
    : complaints.filter(c => c.district === district || c.location?.toLowerCase().includes(district.toLowerCase()));

  // Officer performance metrics
  const officerMap = {};
  filtered.forEach(c => {
    if (!c.assigned_officer) return;
    if (!officerMap[c.assigned_officer]) {
      officerMap[c.assigned_officer] = { email: c.assigned_officer, total: 0, resolved: 0, pending: 0, avgResponseDays: [] };
    }
    officerMap[c.assigned_officer].total++;
    if (["resolved", "closed"].includes(c.status)) {
      officerMap[c.assigned_officer].resolved++;
      const days = moment(c.updated_at || c.updated_date).diff(moment(c.created_at || c.created_date), "days");
      officerMap[c.assigned_officer].avgResponseDays.push(days);
    } else {
      officerMap[c.assigned_officer].pending++;
    }
  });

  const officers = Object.values(officerMap).map(o => ({
    ...o,
    resolutionRate: o.total ? Math.round((o.resolved / o.total) * 100) : 0,
    avgDays: o.avgResponseDays.length ? Math.round(o.avgResponseDays.reduce((a, b) => a + b, 0) / o.avgResponseDays.length) : 0,
    score: o.total ? Math.round((o.resolved / o.total) * 100) - (o.avgDays || 0) : 0,
  })).sort((a, b) => b.score - a.score).slice(0, 10);

  // Category breakdown
  const catData = Object.entries(
    filtered.reduce((acc, c) => { acc[c.category || "other"] = (acc[c.category || "other"] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name: name.replace(/_/g, " "), value })).sort((a, b) => b.value - a.value).slice(0, 8);

  // Monthly trend
  const monthlyData = {};
  filtered.forEach(c => {
    const month = moment(c.created_at || c.created_date).format("MMM YY");
    if (!monthlyData[month]) monthlyData[month] = { month, filed: 0, resolved: 0 };
    monthlyData[month].filed++;
    if (["resolved", "closed"].includes(c.status)) monthlyData[month].resolved++;
  });
  const trend = Object.values(monthlyData).slice(-6);

  // Overall stats
  const totalResolved = filtered.filter(c => ["resolved", "closed"].includes(c.status)).length;
  const totalPending = filtered.filter(c => ["filed", "under_review"].includes(c.status)).length;
  const criticalOpen = filtered.filter(c => c.priority === "critical" && !["resolved", "closed"].includes(c.status)).length;
  const resolutionRate = filtered.length ? Math.round((totalResolved / filtered.length) * 100) : 0;

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm"><Link to="/officer-dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link></Button>
        <div className="flex-1">
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" /> Police Performance Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">Case metrics, officer rankings & resolution analytics</p>
        </div>
        <Select value={district} onValueChange={setDistrict}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>{AP_DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Cases", value: filtered.length, icon: Shield, color: "text-primary" },
          { label: "Resolution Rate", value: `${resolutionRate}%`, icon: CheckCircle2, color: "text-green-600" },
          { label: "Pending", value: totalPending, icon: Clock, color: "text-yellow-600" },
          { label: "Critical Open", value: criticalOpen, icon: AlertTriangle, color: "text-red-600" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card className="hover:shadow-md transition">
              <CardContent className="p-4 text-center">
                <s.icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} />
                <p className={`font-bold text-2xl ${s.color}`}>{s.value}</p>
                <p className="text-muted-foreground text-xs">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Monthly Case Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="filed" fill="#1a56db" radius={[3,3,0,0]} name="Filed" />
                <Bar dataKey="resolved" fill="#059669" radius={[3,3,0,0]} name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Crime Categories</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={catData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 9 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[0,3,3,0]}>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Officer Rankings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" /> Officer Performance Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {officers.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">No officer data available yet</p>
          ) : (
            <div className="space-y-2">
              {officers.map((o, i) => (
                <motion.div key={o.email} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="flex flex-wrap items-center gap-3 border border-border rounded-xl p-4 hover:shadow-sm transition">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    i === 0 ? "bg-yellow-100 text-yellow-700" :
                    i === 1 ? "bg-gray-100 text-gray-600" :
                    i === 2 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{o.email}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Total: <strong className="text-foreground">{o.total}</strong></span>
                      <span>Resolved: <strong className="text-green-600">{o.resolved}</strong></span>
                      <span>Pending: <strong className="text-yellow-600">{o.pending}</strong></span>
                      <span>Avg: <strong className="text-foreground">{o.avgDays}d</strong></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${o.resolutionRate}%` }} />
                    </div>
                    <Badge className={`text-[10px] ${o.resolutionRate >= 70 ? "bg-green-600" : o.resolutionRate >= 40 ? "bg-yellow-600" : "bg-red-600"} text-white`}>
                      {o.resolutionRate}%
                    </Badge>
                    {i < 3 && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
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