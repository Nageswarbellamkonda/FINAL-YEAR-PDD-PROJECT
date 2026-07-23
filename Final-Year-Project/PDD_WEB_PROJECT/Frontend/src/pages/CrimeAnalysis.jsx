import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend
} from "recharts";
import { Brain, TrendingUp, AlertTriangle, ArrowLeft, Loader2, RefreshCw, BarChart2, MapPin, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import moment from "moment";
import ReactMarkdown from "react-markdown";
import { invokeLLM } from "@/lib/ai";

const COLORS = ["#dc2626", "#d97706", "#0891b2", "#059669", "#7c3aed", "#1a56db", "#f43f5e", "#84cc16"];

export default function CrimeAnalysis() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState("");
  const [period, setPeriod] = useState("30");
  const [user, setUser] = useState(null);

  const { user: authUser, profile } = useAuth();

  useEffect(() => {
    loadData();
  }, [authUser, profile]);

  const loadData = async () => {
    const me = profile ?? authUser ?? null;
    setUser(me);
    const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false }).limit(200);
    setComplaints(data || []);
    setLoading(false);
  };

  const filtered = complaints.filter(c => {
    const days = parseInt(period);
    return moment(c.created_at || c.created_date).isAfter(moment().subtract(days, "days"));
  });

  // Category breakdown
  const categoryData = Object.entries(
    filtered.reduce((acc, c) => { acc[c.complaint_type || c.category || "other"] = (acc[c.complaint_type || c.category || "other"] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name: name.replace(/_/g, " "), value })).sort((a, b) => b.value - a.value);

  // District breakdown
  const districtData = Object.entries(
    filtered.reduce((acc, c) => { acc[c.district || "Unknown"] = (acc[c.district || "Unknown"] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  // Status breakdown
  const statusData = Object.entries(
    filtered.reduce((acc, c) => { acc[c.status || "filed"] = (acc[c.status || "filed"] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

  // Daily trend (last 30 days)
  const trendData = Array.from({ length: Math.min(parseInt(period), 30) }, (_, i) => {
    const date = moment().subtract(i, "days").format("MM/DD");
    const count = filtered.filter(c => moment(c.created_at || c.created_date).format("MM/DD") === date).length;
    return { date, count };
  }).reverse();

  // Priority
  const priorityData = [
    { name: "Critical", value: filtered.filter(c => c.priority === "critical").length, color: "#dc2626" },
    { name: "High", value: filtered.filter(c => c.priority === "high").length, color: "#d97706" },
    { name: "Normal", value: filtered.filter(c => c.priority === "normal").length, color: "#0891b2" },
    { name: "Low", value: filtered.filter(c => c.priority === "low").length, color: "#059669" },
  ].filter(p => p.value > 0);

  const stats = {
    total: filtered.length,
    critical: filtered.filter(c => c.priority === "critical").length,
    escalated: filtered.filter(c => c.is_escalated).length,
    resolved: filtered.filter(c => ["resolved", "closed"].includes(c.status)).length,
    resolutionRate: filtered.length > 0 ? Math.round((filtered.filter(c => ["resolved", "closed"].includes(c.status)).length / filtered.length) * 100) : 0,
  };

  const runAIAnalysis = async () => {
    setAiLoading(true);
    setAiInsights("");

    try {
      const top3Cat = categoryData.slice(0, 3);
      const top3Dist = districtData.slice(0, 3);
      
      const summaryPayload = {
        period: `${period} days`,
        total_cases: stats.total,
        resolution_rate: stats.resolutionRate,
        critical_open: stats.critical,
        top_categories: top3Cat,
        top_districts: top3Dist,
      };

      const systemPrompt = "You are the NyayaMitra AI Crime Intelligence Engine for the AP Police. Analyze the provided statistical JSON data and return a professional markdown report detailing:\n1. Key Crime Patterns & Trends\n2. Hotspot Districts / Areas of Concern\n3. Likely Causes\n4. Operational Recommendations for AP Police\n5. Predictive Forecast (Next 30 Days)\n6. Resource Allocation Suggestions\nFormat beautifully with headers, bold text, and bullet points. Never hallucinate data outside of the provided JSON payload.";

      const result = await invokeLLM(JSON.stringify(summaryPayload), systemPrompt);
      setAiInsights(result);
    } catch (error) {
      console.error(error);
      setAiInsights("⚠️ Error: Unable to reach NyayaAI analytics servers. Please try again later.");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm"><Link to="/officer-dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link></Button>
        <div className="flex-1">
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Brain className="w-6 h-6 text-violet-600" /> AI Crime Pattern Analysis
          </h1>
          <p className="text-muted-foreground text-sm">Advanced analytics and AI-powered crime intelligence for AP Police</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last 1 year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadData}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Cases", value: stats.total, color: "text-primary", bg: "bg-primary/10" },
          { label: "Critical Cases", value: stats.critical, color: "text-red-600", bg: "bg-red-50" },
          { label: "Escalated", value: stats.escalated, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Resolved", value: stats.resolved, color: "text-green-600", bg: "bg-green-50" },
          { label: "Resolution %", value: `${stats.resolutionRate}%`, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={`${s.bg} border-0`}>
              <CardContent className="p-4 text-center">
                <p className={`font-heading font-bold text-2xl ${s.color}`}>{s.value}</p>
                <p className="text-muted-foreground text-xs mt-1">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-600" /> Daily Case Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#1a56db" strokeWidth={2} dot={false} name="Cases" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><MapPin className="w-4 h-4 text-red-600" /> Cases by District</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={districtData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 9 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Cases">
                  {districtData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-purple-600" /> Crime Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData.slice(0, 8)} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 9 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#7c3aed" name="Cases" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-600" /> Priority Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name}:${value}`} labelLine={false} fontSize={10}>
                  {priorityData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><BarChart2 className="w-4 h-4 text-teal-600" /> Case Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={75} dataKey="value" labelLine={false} fontSize={9}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend formatter={(value) => <span style={{ fontSize: 9 }}>{value}</span>} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-600" /> AI Pattern Analysis & Intelligence Report
            </CardTitle>
            <Button onClick={runAIAnalysis} disabled={aiLoading} className="gap-2 bg-violet-600 hover:bg-violet-700">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {aiLoading ? "Analyzing..." : "Run AI Analysis"}
            </Button>
          </div>
          {aiLoading && <p className="text-xs text-muted-foreground">Analyzing crime data patterns — please wait...</p>}
        </CardHeader>
        <CardContent>
          {aiInsights ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="prose prose-sm max-w-none bg-violet-50 rounded-xl p-4 border border-violet-200">
              <ReactMarkdown>{aiInsights}</ReactMarkdown>
            </motion.div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm">Click "Run AI Analysis" to generate crime patterns, hotspot detection, and strategic recommendations.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}