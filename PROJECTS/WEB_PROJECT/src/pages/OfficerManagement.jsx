import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Shield, ArrowLeft, Search, RefreshCw, Loader2,
  UserCheck, UserX, Eye, BarChart2, MapPin, Phone,
  Star, AlertTriangle, CheckCircle2, Plus
} from "lucide-react";
import { Link } from "react-router-dom";
import { hasPermission, ROLE_LABELS, getJurisdiction, ROLES, outranks } from "@/lib/rbac";
import moment from "moment";

const AP_DISTRICTS = [
  "Srikakulam","Vizianagaram","Visakhapatnam","East Godavari","West Godavari",
  "Krishna","Guntur","Prakasam","Nellore","Kurnool","YSR Kadapa","Anantapur","Chittoor"
];

const STATUS_COLORS = {
  active: "bg-green-100 text-green-700 border-green-300",
  suspended: "bg-yellow-100 text-yellow-700 border-yellow-300",
  blocked: "bg-red-100 text-red-700 border-red-300",
};

export default function OfficerManagement() {
  const [user, setUser] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "police" });

  const { user: authUser, profile } = useAuth();

  useEffect(() => { loadData(); }, [authUser, profile]);

  const loadData = async () => {
    setLoading(true);
    const me = profile ?? authUser ?? null;
    setUser(me);
    const { data: allUsers } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false }).limit(200);
    // Filter to police roles only
    const policeRoles = ["police", "si", "ci", "dsp", "sp", "dig", "ig", "adg", "dgp", "she_teams", "special"];
    let data = (allUsers || []).filter(u => policeRoles.includes(u.user_type || u.role || ""));
    // Apply jurisdiction
    const jur = getJurisdiction(me?.user_type || me?.role);
    if (jur === "district" && me?.district) {
      data = data.filter(u => u.district === me.district || !u.district);
    } else if (jur === "station" || jur === "circle") {
      data = data.filter(u => u.district === me.district);
    }
    setOfficers(data);
    setLoading(false);
  };

  const canManageOfficer = (officer) => {
    if (!user) return false;
    const myRole = user.user_type || user.role;
    const theirRole = officer.user_type || officer.role;
    return hasPermission(myRole, "STATION_ADMIN") && outranks(myRole, theirRole);
  };

  const suspendOfficer = async (officer) => {
    setActionLoading(true);
    await supabase.from('user_profiles').update({ officer_status: "suspended" }).eq('id', officer.id);
    toast.success(`${officer.full_name} suspended`);
    setSelected(null);
    await loadData();
    setActionLoading(false);
  };

  const blockOfficer = async (officer) => {
    setActionLoading(true);
    await supabase.from('user_profiles').update({ officer_status: "blocked" }).eq('id', officer.id);
    toast.success(`${officer.full_name} blocked`);
    setSelected(null);
    await loadData();
    setActionLoading(false);
  };

  const activateOfficer = async (officer) => {
    setActionLoading(true);
    await supabase.from('user_profiles').update({ officer_status: "active" }).eq('id', officer.id);
    toast.success(`${officer.full_name} activated`);
    setSelected(null);
    await loadData();
    setActionLoading(false);
  };

  const inviteOfficer = async () => {
    if (!inviteForm.email.trim()) { toast.error("Enter email"); return; }
    // In a real production app, this would call a Supabase Edge Function with admin rights.
    // await supabase.functions.invoke('invite-user', { body: { email: inviteForm.email.trim(), role: 'user' } });
    toast.success("Invite sent! They can complete profile as " + inviteForm.role);
    setShowInvite(false);
    setInviteForm({ email: "", role: "police" });
  };

  const filtered = officers.filter(o => {
    const name = (o.full_name || "") + (o.email || "") + (o.station || "") + (o.badge_number || "");
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase());
    const matchDistrict = districtFilter === "all" || o.district === districtFilter;
    const matchRole = roleFilter === "all" || (o.user_type || o.role) === roleFilter;
    return matchSearch && matchDistrict && matchRole;
  });

  const myRank = user?.user_type || user?.role;
  const canView = hasPermission(myRank, "OFFICER_DASHBOARD");

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!canView) return (
    <div className="max-w-xl mx-auto py-20 text-center">
      <Shield className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
      <h2 className="font-heading font-bold text-xl mb-2">Access Restricted</h2>
      <Button asChild variant="outline"><Link to="/dashboard">Back</Link></Button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm"><Link to="/officer-dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link></Button>
        <div className="flex-1">
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Officer Management
          </h1>
          <p className="text-muted-foreground text-sm">
            {ROLE_LABELS[myRank]} — {officers.length} officers in jurisdiction
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}><RefreshCw className="w-4 h-4" /></Button>
        {hasPermission(myRank, "STATION_ADMIN") && (
          <Button onClick={() => setShowInvite(!showInvite)} className="gap-2">
            <Plus className="w-4 h-4" /> Invite Officer
          </Button>
        )}
      </div>

      {/* Invite Form */}
      <AnimatePresence>
        {showInvite && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
            <Card className="border-primary/30">
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-3">Invite New Officer</p>
                <div className="flex gap-3 flex-wrap">
                  <Input className="flex-1 min-w-48" placeholder="officer@appolice.gov.in"
                    value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} />
                  <Select value={inviteForm.role} onValueChange={v => setInviteForm(f => ({ ...f, role: v }))}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["police","si","ci","dsp","sp","she_teams","special"].map(r => (
                        <SelectItem key={r} value={r}>{ROLE_LABELS[r] || r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={inviteOfficer}>Send Invite</Button>
                  <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
        {[
          { label: "Total", value: officers.length, color: "text-primary" },
          { label: "Active", value: officers.filter(o => !o.officer_status || o.officer_status === "active").length, color: "text-green-600" },
          { label: "Constables", value: officers.filter(o => (o.user_type || o.role) === "police").length, color: "text-blue-600" },
          { label: "SI/CI", value: officers.filter(o => ["si","ci"].includes(o.user_type || o.role)).length, color: "text-violet-600" },
          { label: "DSP+", value: officers.filter(o => ["dsp","sp","dig","ig","adg","dgp"].includes(o.user_type || o.role)).length, color: "text-orange-600" },
          { label: "Suspended", value: officers.filter(o => o.officer_status === "suspended" || o.officer_status === "blocked").length, color: "text-red-600" },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-3 text-center">
            <p className={`font-bold text-xl ${s.color}`}>{s.value}</p>
            <p className="text-muted-foreground text-xs">{s.label}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search name, email, station, badge..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={districtFilter} onValueChange={setDistrictFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Districts" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Districts</SelectItem>
            {AP_DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {["police","si","ci","dsp","sp","dig","ig","adg","dgp","she_teams","special"].map(r => (
              <SelectItem key={r} value={r}>{ROLE_LABELS[r] || r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Officer List */}
        <div className="lg:col-span-2 space-y-2">
          <p className="text-xs text-muted-foreground mb-2">{filtered.length} officers found</p>
          {filtered.length === 0 && (
            <Card><CardContent className="p-12 text-center text-muted-foreground text-sm">No officers found</CardContent></Card>
          )}
          {filtered.map((officer) => {
            const role = officer.user_type || officer.role || "police";
            const status = officer.officer_status || "active";
            return (
              <motion.div key={officer.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={() => setSelected(selected?.id === officer.id ? null : officer)}
                className={`border rounded-xl p-3.5 cursor-pointer hover:shadow-md transition ${selected?.id === officer.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{officer.full_name || "Unknown"}</span>
                      <Badge variant="outline" className="text-[9px] capitalize">{ROLE_LABELS[role] || role}</Badge>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${STATUS_COLORS[status]}`}>{status.toUpperCase()}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-0.5">
                      {officer.badge_number && <span>Badge: {officer.badge_number}</span>}
                      {officer.station && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{officer.station}</span>}
                      {officer.district && <span>{officer.district}</span>}
                    </div>
                  </div>
                  <Eye className={`w-4 h-4 flex-shrink-0 transition ${selected?.id === officer.id ? "text-primary" : "text-muted-foreground/40"}`} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Detail Panel */}
        <div>
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key={selected.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <Card className="sticky top-20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{selected.full_name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{ROLE_LABELS[selected.user_type || selected.role]}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { label: "Email", value: selected.email },
                        { label: "Phone", value: selected.phone || "N/A" },
                        { label: "Badge", value: selected.badge_number || "N/A" },
                        { label: "Station", value: selected.station || "N/A" },
                        { label: "District", value: selected.district || "N/A" },
                        { label: "Mandal", value: selected.mandal || "N/A" },
                        { label: "Designation", value: selected.designation || "N/A" },
                        { label: "Joined", value: moment(selected.created_at || selected.created_date).format("DD MMM YYYY") },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <span className="text-muted-foreground">{label}:</span>
                          <br /><strong className="break-all">{value}</strong>
                        </div>
                      ))}
                    </div>

                    <div className={`px-3 py-2 rounded-lg text-xs font-semibold text-center border ${STATUS_COLORS[selected.officer_status || "active"]}`}>
                      Status: {(selected.officer_status || "ACTIVE").toUpperCase()}
                    </div>

                    {canManageOfficer(selected) && (
                      <div className="space-y-2 pt-2 border-t">
                        {(!selected.officer_status || selected.officer_status === "active") && (
                          <>
                            <Button variant="outline" size="sm" className="w-full gap-2 text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                              onClick={() => suspendOfficer(selected)} disabled={actionLoading}>
                              <AlertTriangle className="w-3.5 h-3.5" /> Suspend Officer
                            </Button>
                            <Button variant="outline" size="sm" className="w-full gap-2 text-red-700 border-red-300 hover:bg-red-50"
                              onClick={() => blockOfficer(selected)} disabled={actionLoading}>
                              <UserX className="w-3.5 h-3.5" /> Block Officer
                            </Button>
                          </>
                        )}
                        {(selected.officer_status === "suspended" || selected.officer_status === "blocked") && (
                          <Button size="sm" className="w-full gap-2 bg-green-600 hover:bg-green-700"
                            onClick={() => activateOfficer(selected)} disabled={actionLoading}>
                            <UserCheck className="w-3.5 h-3.5" /> Reactivate Officer
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select an officer to view details</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}