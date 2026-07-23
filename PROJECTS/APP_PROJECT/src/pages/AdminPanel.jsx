import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Users, Shield, Trash2, Search, RefreshCw, Edit2, CheckCircle2, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ROLE_LABELS } from "@/lib/rbac";
import moment from "moment";

const AP_DISTRICTS = [
  "Visakhapatnam","Vizianagaram","Srikakulam","Kakinada","East Godavari",
  "West Godavari","Krishna","Guntur","Prakasam","Nellore","Kurnool",
  "Anantapur","Kadapa","Chittoor","Tirupati"
];

const ALL_ROLES = ["dgp","sp","dsp","ci","si","police","she_teams","lawyer","court","citizen","admin"];

export default function AdminPanel() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ complaints: 0, duties: 0, alerts: 0 });

  const { user: authUser, profile } = useAuth();

  useEffect(() => { loadAll(); }, [authUser, profile]);

  const loadAll = async () => {
    const me = profile ?? authUser ?? null;
    setUser(me);
    if (!me) {
      setLoading(false);
      return;
    }
    const role = me.user_type || me.role || "";
    if (!["admin", "dgp"].includes(role)) {
      toast.error("Access denied. Admin/DGP only.");
      navigate("/officer-dashboard");
      return;
    }
    try {
      // 1. Fetch user profiles
      let allUsers = [];
      const { data: usersData } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (usersData) allUsers = usersData;
      setUsers(allUsers);

      // 2. Fetch counts (using limit 1 or simply count query if supported)
      let complaintsCount = 0;
      let dutiesCount = 0;
      let alertsCount = 0;

      const [compsRes, dutiesRes, alertsRes] = await Promise.all([
        supabase.from("complaints").select("id", { count: "exact" }).limit(1),
        supabase.from("duty_assignments").select("id", { count: "exact" }).limit(1),
        supabase.from("station_alerts").select("id", { count: "exact" }).limit(1)
      ]);

      if (!compsRes.error && compsRes.count !== null) complaintsCount = compsRes.count;
      if (!dutiesRes.error && dutiesRes.count !== null) dutiesCount = dutiesRes.count;
      if (!alertsRes.error && alertsRes.count !== null) alertsCount = alertsRes.count;

      setStats({ complaints: complaintsCount, duties: dutiesCount, alerts: alertsCount });
    } catch (err) {
      console.error("Error loading data in AdminPanel:", err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (u) => {
    setEditingUser(u.id);
    setEditData({
      user_type: u.user_type || u.role || "citizen",
      district: u.district || "",
      station: u.police_station || u.station || "",
      designation: u.designation || "",
    });
  };

  const saveEdit = async (userId) => {
    setSaving(true);
    try {
      // Map station key back to what matches user_profiles schema columns
      // Complete schema has police_station TEXT, district TEXT, designation TEXT, role VARCHAR
      const updateData = {
        role: editData.user_type,
        user_type: editData.user_type,
        district: editData.district,
        police_station: editData.station,
        designation: editData.designation
      };
      
      const { error } = await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("id", userId);
      if (error) throw error;
      toast.success("User updated");
      setEditingUser(null);
      loadAll();
    } catch (err) {
      console.error("Error updating user:", err);
      toast.error("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    (u.user_type || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-heading font-bold text-2xl">System Admin Panel</h1>
          <p className="text-muted-foreground text-sm">Manage users, roles, and system data</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Users", value: users.length, color: "text-primary" },
          { label: "Officers", value: users.filter(u => ["dgp","sp","dsp","ci","si","police"].includes(u.user_type)).length, color: "text-blue-600" },
          { label: "Total Cases", value: stats.complaints, color: "text-orange-600" },
          { label: "Active Alerts", value: stats.alerts, color: "text-red-600" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <p className={`font-bold text-2xl ${s.color}`}>{s.value}</p>
              <p className="text-muted-foreground text-xs">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Navigation */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-sm">Quick Access — All Dashboards</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {[
              { to: "/officer-dashboard", label: "Officer Dashboard" },
              { to: "/dgp-dashboard", label: "DGP Command" },
              { to: "/unified-dashboard", label: "Unified Dashboard" },
              { to: "/performance-dashboard", label: "Performance" },
              { to: "/case-management", label: "Case Management" },
              { to: "/duty-management", label: "Duty Management" },
              { to: "/alerts-admin", label: "Alerts Admin" },
              { to: "/officer-management", label: "Officer Management" },
              { to: "/analytics", label: "Analytics" },
              { to: "/attendance", label: "Attendance" },
              { to: "/activity-log", label: "Activity Log" },
              { to: "/golden-hour-cyber", label: "Cyber Crime" },
              { to: "/data-seeder", label: "🌱 Seed Demo Data" },
            ].map((item, i) => (
              <Button key={i} asChild variant="outline" size="sm">
                <Link to={item.to}>{item.label}</Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> User Management ({users.length})
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 w-64 h-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={loadAll} className="gap-1">
                <RefreshCw className="w-4 h-4" /> Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {filtered.map(u => (
              <div key={u.id} className="border rounded-lg p-3">
                {editingUser === u.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold text-sm">{u.full_name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Role</p>
                        <Select value={editData.user_type} onValueChange={v => setEditData(d => ({ ...d, user_type: v }))}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ALL_ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r] || r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">District</p>
                        <Select value={editData.district} onValueChange={v => setEditData(d => ({ ...d, district: v }))}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {AP_DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Station</p>
                        <Input value={editData.station} onChange={e => setEditData(d => ({ ...d, station: e.target.value }))} className="h-8 text-xs" placeholder="Station name" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Designation</p>
                        <Input value={editData.designation} onChange={e => setEditData(d => ({ ...d, designation: e.target.value }))} className="h-8 text-xs" placeholder="e.g., SI" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(u.id)} disabled={saving} className="gap-1 h-8">
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingUser(null)} className="h-8">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-xs font-bold">{(u.full_name || u.email || "U")[0].toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{u.full_name || "—"}</p>
                        <Badge variant="outline" className="text-[10px]">{ROLE_LABELS[u.user_type] || u.user_type || "citizen"}</Badge>
                        {u.district && <Badge variant="secondary" className="text-[10px]">{u.district}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{u.email} • {u.station || "No station"} • Joined {moment(u.created_date).format("DD MMM YYYY")}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => startEdit(u)} className="gap-1 h-7">
                      <Edit2 className="w-3 h-3" /> Edit
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">No users found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}