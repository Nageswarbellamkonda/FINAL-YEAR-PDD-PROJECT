import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { hasPermission, isOfficerRole, ROLE_LABELS, getJurisdiction } from "@/lib/rbac";
import { Calendar, Shield, Plus, ArrowLeft, Loader2, CheckCircle2, Clock, MapPin, Trash2, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import moment from "moment";

const DUTY_TYPES = ["patrol","bandobast","vip_security","traffic","investigation","court_duty","night_duty","emergency"];
const SHIFTS = ["morning","afternoon","evening","night"];
const SHIFT_LABELS = { morning:"🌅 Morning (6AM–2PM)", afternoon:"☀️ Afternoon (2PM–10PM)", evening:"🌆 Evening (6PM–10PM)", night:"🌙 Night (10PM–6AM)" };
const STATUS_COLORS = { scheduled:"bg-blue-100 text-blue-700", active:"bg-green-100 text-green-700", completed:"bg-gray-100 text-gray-600", cancelled:"bg-red-100 text-red-700" };

export default function DutyManagement() {
  const [user, setUser] = useState(null);
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [dateFilter, setDateFilter] = useState(moment().format("YYYY-MM-DD"));
  const [form, setForm] = useState({
    officer_email: "", officer_name: "", duty_type: "patrol",
    duty_date: moment().format("YYYY-MM-DD"), shift: "morning",
    start_time: "06:00", end_time: "14:00", location: "", notes: "",
    geo_lat: "", geo_lng: "", geo_radius_m: 500,
  });

  const canAssign = user && hasPermission(user.user_type || user.role, "ASSIGN_DUTY");
  const jurisdiction = user ? getJurisdiction(user.user_type || user.role) : "station";

  const { user: authUser, profile } = useAuth();

  useEffect(() => { loadData(); }, [dateFilter, authUser, profile]);

  const loadData = async () => {
    setLoading(true);
    const me = profile ?? authUser ?? null;
    setUser(me);
    const role = me?.user_type || me?.role || "citizen";
    let query = supabase.from('duty_assignments')
      .select('*, officer:user_profiles!duty_assignments_officer_id_fkey(id, email, full_name, role)')
      .order('created_at', { ascending: false })
      .gte('start_time', `${dateFilter}T00:00:00Z`)
      .lte('start_time', `${dateFilter}T23:59:59Z`);

    if (["admin","dgp","adg","ig","dig"].includes(role)) {
      query = query.limit(100);
    } else if (["sp","dsp"].includes(role)) {
      query = query.limit(100);
    } else if (role === "ci") {
      query = query.limit(50);
    } else if (role === "si") {
      if (!me?.station) query = query.eq('officer_id', me?.id);
      query = query.limit(50);
    } else {
      query = query.eq('officer_id', me?.id).limit(30);
    }
    const { data = [] } = await query;
    setDuties(data || []);
    setLoading(false);
  };

  const assignDuty = async () => {
    if (!form.officer_email || !form.duty_type) { toast.error("Officer email and duty type are required"); return; }
    setSaving(true);
    const { data: officer } = await supabase.from('user_profiles').select('id').eq('email', form.officer_email).single();
    if (!officer?.id) { toast.error("Officer not found"); setSaving(false); return; }

    await supabase.from('duty_assignments').insert([{
      officer_id: officer.id,
      assigned_by: user.id,
      duty_type: form.duty_type,
      shift: form.shift,
      location: form.location,
      start_time: `${form.duty_date}T${form.start_time}:00Z`,
      end_time: `${form.duty_date}T${form.end_time}:00Z`,
      status: "scheduled",
      notes: form.notes,
    }]);
    toast.success("Duty assigned successfully!");
    setShowForm(false);
    setSaving(false);
    loadData();
  };

  const updateStatus = async (id, status) => {
    await supabase.from('duty_assignments').update({ status }).eq('id', id);
    toast.success("Duty status updated");
    loadData();
  };

  const deleteDuty = async (id) => {
    await supabase.from('duty_assignments').delete().eq('id', id);
    toast.success("Duty removed");
    loadData();
  };

  const myDuties = duties.filter(d => d.officer?.email === user?.email || d.officer_id === user?.id);
  const otherDuties = duties.filter(d => d.officer?.email !== user?.email && d.officer_id !== user?.id);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!isOfficerRole(user?.user_type || user?.role)) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <Shield className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="font-heading font-bold text-xl mb-2">Officers Only</h2>
        <Button asChild variant="outline"><Link to="/dashboard">Back to Dashboard</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm"><Link to="/officer-dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link></Button>
        <div className="flex-1">
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" /> Duty Management System
          </h1>
          <p className="text-muted-foreground text-sm">
            {ROLE_LABELS[user?.user_type || user?.role] || "Officer"} • {user?.station || user?.district}
          </p>
        </div>
        <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-40" />
        <Button variant="outline" size="sm" onClick={loadData}><RefreshCw className="w-4 h-4" /></Button>
        {canAssign && (
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" /> Assign Duty
          </Button>
        )}
      </div>

      {/* Assign Duty Form */}
      <AnimatePresence>
        {showForm && canAssign && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  Assign New Duty
                  <button
                    onClick={() => setForm(p => ({...p, officer_email: user.email, officer_name: user.full_name || ""}))}
                    className="text-[10px] px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition font-medium"
                  >
                    + Use My Details
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <Label className="text-xs">Officer Email *</Label>
                    <Input value={form.officer_email} onChange={e => setForm(p => ({...p, officer_email: e.target.value}))} placeholder="officer@appolice.gov.in" />
                  </div>
                  <div>
                    <Label className="text-xs">Officer Name</Label>
                    <Input value={form.officer_name} onChange={e => setForm(p => ({...p, officer_name: e.target.value}))} placeholder="Full name" />
                  </div>
                  <div>
                    <Label className="text-xs">Duty Type *</Label>
                    <Select value={form.duty_type} onValueChange={v => setForm(p => ({...p, duty_type: v}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{DUTY_TYPES.map(d => <SelectItem key={d} value={d}>{d.replace("_"," ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Shift</Label>
                    <Select value={form.shift} onValueChange={v => setForm(p => ({...p, shift: v}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SHIFTS.map(s => <SelectItem key={s} value={s}>{SHIFT_LABELS[s]}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Duty Date</Label>
                    <Input type="date" value={form.duty_date} onChange={e => setForm(p => ({...p, duty_date: e.target.value}))} />
                  </div>
                  <div>
                    <Label className="text-xs">Duty Location / Zone</Label>
                    <Input value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} placeholder="e.g., Market area, Highway NH-16" />
                  </div>
                  <div>
                    <Label className="text-xs">Start Time</Label>
                    <Input type="time" value={form.start_time} onChange={e => setForm(p => ({...p, start_time: e.target.value}))} />
                  </div>
                  <div>
                    <Label className="text-xs">End Time</Label>
                    <Input type="time" value={form.end_time} onChange={e => setForm(p => ({...p, end_time: e.target.value}))} />
                  </div>
                </div>
                <div className="mb-3">
                  <Label className="text-xs">Special Instructions</Label>
                  <Textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} placeholder="Additional duty instructions..." className="h-16" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={assignDuty} disabled={saving} className="flex-1">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Assign Duty
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Duties */}
      {myDuties.length > 0 && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> My Assigned Duties — {dateFilter}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {myDuties.map(d => (
              <DutyCard key={d.id} duty={d} isOwn={true} canManage={canAssign} onStatus={updateStatus} onDelete={deleteDuty} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* All / Station Duties */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            {jurisdiction === "all" ? "All Duties" : jurisdiction === "district" ? "District Duties" : "Station Duties"} — {dateFilter}
            <Badge variant="outline" className="ml-auto text-[10px]">{otherDuties.length + myDuties.length} total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {duties.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">No duties assigned for {dateFilter}</p>
          ) : (
            <div className="space-y-2">
              {otherDuties.map(d => (
                <DutyCard key={d.id} duty={d} isOwn={false} canManage={canAssign} onStatus={updateStatus} onDelete={deleteDuty} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DutyCard({ duty, isOwn, canManage, onStatus, onDelete }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className={`border rounded-xl p-3.5 ${isOwn ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${STATUS_COLORS[duty.status] || ""}`}>{duty.status}</span>
            <Badge variant="outline" className="text-[10px] capitalize">{duty.duty_type?.replace("_"," ")}</Badge>
            <Badge variant="outline" className="text-[10px]">{SHIFT_LABELS[duty.shift]?.split(" ")[0]} {SHIFT_LABELS[duty.shift]?.split(" ")[1] || ""}</Badge>
          </div>
          <p className="font-medium text-sm">{duty.officer?.full_name || duty.officer?.email || duty.officer_id}</p>
          <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-0.5">
            {duty.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{duty.location}</span>}
            {duty.start_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{moment(duty.start_time).format("HH:mm")}–{moment(duty.end_time).format("HH:mm")}</span>}
            {duty.station && <span>{duty.station}</span>}
          </div>
          {duty.notes && <p className="text-xs text-muted-foreground mt-1 italic">{duty.notes}</p>}
        </div>
        {canManage && (
          <div className="flex gap-1.5 flex-shrink-0">
            {duty.status === "scheduled" && (
              <button onClick={() => onStatus(duty.id, "active")} className="text-[10px] px-2 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition font-medium">Activate</button>
            )}
            {duty.status === "active" && (
              <button onClick={() => onStatus(duty.id, "completed")} className="text-[10px] px-2 py-1 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition font-medium">Complete</button>
            )}
            <button onClick={() => onDelete(duty.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}