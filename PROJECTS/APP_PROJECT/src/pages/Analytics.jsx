import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, FileText, AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import moment from "moment";

const COLORS = ["#1a237e", "#ff6f00", "#e53935", "#43a047", "#7b1fa2", "#0288d1", "#f57c00"];

export default function Analytics() {
  const [data, setData] = useState({
    trendData: [],
    categoryData: [],
    priorityData: [],
    deptData: [],
    stats: {}
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useRealtimeSync(['complaints'], () => {
    loadData();
  });

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: rpcData, error } = await supabase.rpc('get_analytics_page_data', { days: parseInt(period) });
      if (error) throw error;
      
      if (rpcData) {
        setData({
          trendData: rpcData.trendData || [],
          categoryData: (rpcData.categoryData || []).map(d => ({ ...d, name: d.name || 'Unknown' })),
          priorityData: rpcData.priorityData || [],
          deptData: (rpcData.deptData || []).map(d => ({ ...d, name: d.name || 'Unknown' })),
          stats: rpcData.stats || {}
        });
      }
    } catch (err) {
      console.error("Error loading analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: "Total Cases", value: data.stats.total || 0, icon: FileText, color: "text-primary" },
    { label: "Resolved", value: data.stats.resolved || 0, icon: CheckCircle2, color: "text-green-600" },
    { label: "Pending", value: data.stats.pending || 0, icon: Clock, color: "text-yellow-600" },
    { label: "Escalated", value: data.stats.escalated || 0, icon: AlertTriangle, color: "text-red-600" },
    { label: "Critical", value: data.stats.critical || 0, icon: TrendingUp, color: "text-red-700" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const { trendData, priorityData, categoryData, deptData } = data;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading font-bold text-2xl">Analytics Dashboard</h1>
            <p className="text-muted-foreground text-sm">Crime statistics & case monitoring</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-4 text-center">
                  <s.icon className={`w-6 h-6 mx-auto mb-1 ${s.color}`} />
                  <p className="font-heading font-bold text-2xl">{s.value}</p>
                  <p className="text-muted-foreground text-xs">{s.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Daily Trend */}
          <Card>
            <CardHeader><CardTitle className="text-base">Daily Complaint Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="complaints" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Priority Pie */}
          <Card>
            <CardHeader><CardTitle className="text-base">Priority Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={priorityData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Bar */}
          <Card>
            <CardHeader><CardTitle className="text-base">Complaints by Category</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Department Bar */}
          <Card>
            <CardHeader><CardTitle className="text-base">Cases by Department</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                    {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Status breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-base">Case Status Overview</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}