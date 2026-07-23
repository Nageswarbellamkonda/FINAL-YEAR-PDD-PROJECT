import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import {
  Users, Calendar, Shield, Loader2, ArrowLeft, RefreshCw,
  CheckCircle2, AlertTriangle, Clock, Activity, MapPin, TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { hasPermission } from "@/lib/rbac";
import moment from "moment";

const AP_DISTRICTS = ["Visakhapatnam","Nellore","Tirupati","Guntur","Krishna","East Godavari","Kurnool","Anantapur"];
const PIE_COLORS = ["#059669","#d97706","#dc2626","#1a56db"];
const SHIFT_COLORS = { morning: "bg-yellow-100 text-yellow-800", afternoon: "bg-orange-100 text-orange-800", evening: "bg-blue-100 text-blue-800", night: "bg-slate-100 text-slate-800" };

export default function WorkforceMonitor() {
  const { user: authUser, profile } = useAuth();
  const [user, setUser] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [districtFilter, setDistrictFilter] = useState("all");
  const [dateRange, setDateRange] = useState("today");

  useEffect(() => { loadData(); }, [districtFilter, dateRange]);

  const loadData = async () => {
    setLoading(true);
    const me = profile ?? authUser ?? null;
    setUser(me);
    const role = me?.user_type || me?.role;

    if (!hasPermission(role, "VIEW_ALL_ATTENDANCE") && !hasPermission(role, "MANAGE_ATTENDANCE")) {
      setLoading(false);
      return;
    }

    const startDate = dateRange === "today"
      ? moment().format("YYYY-MM-DD")
      : dateRange === "week"
      ? moment().subtract(7, "days").toISOString()
      : moment().subtract(30, "days").toISOString();

    const [attRes, dtsRes] = await Promise.all([
      supabase.from('attendance').select('*').order('created_at', { ascending: false }).limit(300),
      supabase.from('duty_assignments').select('*').order('created_at', { ascending: false }).limit(200),
    ]);
    const att = attRes.data || [];
    const dts = dtsRes.data || [];

    setAttendance(att);
    setDuties(dts);
    setLoading(false);
  };

  const role = user?.user_type || user?.role || "";

  const canView = hasPermission(role, "VIEW_ALL_ATTENDANCE") || hasPermission(role, "MANAGE_ATTENDANCE");

  if (!canView && !loading) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <Shield className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="font-heading font-bold text-xl mb-2">Access Restricted</h2>
        <p className="text-muted-foreground mb-4">Workforce monitoring requires DSP level access or above.</p>
        <Button asChild variant="outline"><Link to="/officer-dashboard">Back</Link></Button>
      </div>
    );
  }

  // Filter attendance
  const filtAtt = attendance.filter(r => {
    const distMatch = districtFilter === "all" || r.district === districtFilter;
    const dateMatch = dateRange === "today"
      ? moment(r.marked_at).format("YYYY-MM-DD") === moment().format("YYYY-MM-DD")
      : dateRange === "week"
      ? moment(r.marked_at).isAfter(moment().subtract(7, "days"))
      : true;
    return distMatch && dateMatch;
  });

  const filtDuties = duties.filter(d => {
    const distMatch = districtFilter === "all" || d.district === districtFilter;
    const dateMatch = dateRange === "today"
      ? d.duty_date === moment().format("YYYY-MM-DD")
      : dateRange === "week"
      ? moment(d.duty_date).isAfter(moment().subtract(7, "days"))
      : true;
    return distMatch && dateMatch;
  });

  // Stats
  const presentCount = filtAtt.filter(r => r.status === "present").length;
  const lateCount = filtAtt.filter(r => r.status === "late").length;
  const absentCount = filtAtt.filter(r => r.status === "absent").length;
  const totalMarked = filtAtt.length;

  const activeToday = filtDuties.filter(d => d.status === "active").length;
  const scheduledToday = filtDuties.filter(d => d.status === "scheduled").length;

  // District breakdown
  const districtAtt = AP_DISTRICTS.map(d => ({
    name: d.split(" ")[0],
    present: attendance.filter(r => r.district === d && r.status === "present").length,
    late: attendance.filter(r => r.district === d && r.status === "late").length,
    absent: attendance.filter(r => r.district === d && r.status === "absent").length,
  })).filter(d => d.present + d.late + d.absent > 0);

  // Shift distribution
  const shiftData = [
    { name: "Morning", value: filtAtt.filter(r => r.shift === "morning").length },
    { name: "Afternoon", value: filtAtt.filter(r => r.shift === "afternoon").length },
    { name: "Evening", value: filtAtt.filter(r => r.shift === "evening").length },
    { name: "Night", value: filtAtt.filter(r => r.shift === "night").length },
  ].filter(s => s.value > 0);

  // Duty type distribution
  const dutyTypes = Object.entries(
    filtDuties.reduce((a, d) => { a[d.duty_type || "patrol"] = (a[d.duty_type || "patrol"] || 0) + 1; return a; }, {})
  ).map(([name, value]) => ({ name: name.replace(/_/g," "), value }));

  // Anomaly detection (late/absent patterns)
  const anomalies = filtAtt.filter(r => r.status === "late" || r.status === "absent").slice(0, 5);

  // Daily trend (last 7 days)
  const dailyTrend = [...Array(7)].map((_, i) => {
    const date = moment().subtract(6 - i, "days");
    const dayAtt = attendance.filter(r => moment(r.marked_at).format("YYYY-MM-DD") === date.format("YYYY-MM-DD"));
    return {
      day: date.format("DD/MM"),
      present: dayAtt.filter(r => r.status === "present").length,
      late: dayAtt.filter(r => r.status === "late").length,
    };
  });

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm"><Link to="/officer-dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link></Button>
        <div className="flex-1">
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> AI Workforce Monitor
          </h1>
          <p className="text-muted-foreground text-sm">Attendance analytics, duty tracking & officer activity dashboard</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={districtFilter} onValueChange={setDistrictFilter}>
          <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="All Districts" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Districts</SelectItem>
            {AP_DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total Marked", value: totalMarked, icon: Users, color: "text-primary", bg: "bg-primary/10" },
          { label: "Present", value: presentCount, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { label: "Late", value: lateCount, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Absent", value: absentCount, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
          { label: "Active Duties", value: activeToday, icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Scheduled", value: scheduledToday, icon: Calendar, color: "text-violet-600", bg: "bg-violet-50" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
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

      {/* Charts */}
      <div className="grid md:grid-cols-3 gap-5 mb-6">
        {/* Daily Trend */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> 7-Day Attendance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="present" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} name="Present" />
                <Line type="monotone" dataKey="late" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} name="Late" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Shift Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Shift Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={shiftData} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                  label={({ name, value }) => `${name}:${value}`} labelLine={false} fontSize={9}>
                  {shiftData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* District Attendance */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> District-wise Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={districtAtt}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="present" fill="#059669" radius={[3,3,0,0]} name="Present" />
              <Bar dataKey="late" fill="#d97706" radius={[3,3,0,0]} name="Late" />
              <Bar dataKey="absent" fill="#dc2626" radius={[3,3,0,0]} name="Absent" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        {/* AI Anomaly Detection */}
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" /> AI Anomaly Alerts
              <Badge className="text-[9px] bg-orange-600 text-white ml-auto">NyayaAI</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {anomalies.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">No anomalies detected ✅</p>
            ) : (
              <div className="space-y-2">
                {anomalies.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white rounded-lg p-2.5 border border-orange-100 text-xs">
                    <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${r.status === "late" ? "bg-yellow-500" : "bg-red-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{r.officer_name || r.officer_email}</p>
                      <p className="text-muted-foreground">{r.station} • {r.district}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={r.status === "late" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"} variant="outline">
                        {r.status?.toUpperCase()}
                      </Badge>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{moment(r.marked_at).format("hh:mm A")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Duty Assignment Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Duty Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {dutyTypes.slice(0, 6).map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs capitalize text-muted-foreground w-28 truncate">{d.name}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary/70 rounded-full transition-all"
                    style={{ width: `${(d.value / Math.max(...dutyTypes.map(t => t.value))) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold w-6 text-right">{d.value}</span>
              </div>
            ))}
            {dutyTypes.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">No duty data</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}