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
import { hasPermission, isOfficerRole, ROLE_LABELS, getJurisdiction, normalizeRole } from "@/lib/rbac";
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
    police_station: "", district: "",
    geo_lat: "", geo_lng: "", geo_radius_m: 500,
  });

  const canAssign = user && hasPermission(user.user_type || user.role, "ASSIGN_DUTY");
  const jurisdiction = user ? getJurisdiction(user.user_type || user.role) : "station";

  const { user: authUser, profile } = useAuth();

  const parseDuty = (d) => {
    let extra = {};
    if (d.notes) {
      try {
        if (typeof d.notes === 'string' && d.notes.trim().startsWith('{')) {
          extra = JSON.parse(d.notes);
        } else if (typeof d.notes === 'object' && d.notes !== null) {
          extra = d.notes;
        }
      } catch (e) {
        // Plain text notes
      }
    }
    return {
      ...d,
      duty_type: d.duty_type || extra.duty_type || 'patrol',
      shift: d.shift || extra.shift || 'morning',
      duty_date: d.duty_date || extra.duty_date || (d.created_at ? d.created_at.slice(0, 10) : ''),
      start_time: d.start_time || extra.start_time || '',
      end_time: d.end_time || extra.end_time || '',
      instructions: extra.text || extra.original_notes || extra.special_instructions || (typeof d.notes === 'string' && !d.notes.trim().startsWith('{') ? d.notes : ''),
    };
  };

  useEffect(() => {
    loadData();
    // Realtime sync for duties
    const channel = supabase.channel('duty-mgmt-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'duty_assignments' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dateFilter, authUser, profile]);

  const loadData = async () => {
    setLoading(true);
    const me = profile ?? authUser ?? null;
    setUser(me);
    const role = normalizeRole(me?.user_type || me?.role || "citizen");
    const myStation = me?.police_station || me?.station;

    try {
      let query = supabase.from('duty_assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (["admin", "dgp", "adg", "ig", "dig"].includes(role)) {
        query = query.limit(100);
      } else if (["sp", "dsp"].includes(role)) {
        if (me?.district) query = query.eq('district', me.district);
        query = query.limit(100);
      } else if (["ci", "si"].includes(role)) {
        if (myStation && me?.email) {
          query = query.or(`officer_email.eq.${me.email},police_station.eq.${myStation}`);
        } else if (me?.district && me?.email) {
          query = query.or(`officer_email.eq.${me.email},district.eq.${me.district}`);
        } else if (me?.email) {
          query = query.eq('officer_email', me.email);
        }
        query = query.limit(50);
      } else {
        query = query.eq('officer_email', me?.email).limit(50);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching duties in DutyManagement:", error);
      }
      const rawDuties = data || [];
      const parsed = rawDuties.map(parseDuty);
      setDuties(parsed);
    } catch (err) {
      console.error("Unexpected error in DutyManagement loadData:", err);
      setDuties([]);
    } finally {
      setLoading(false);
    }
  };

  const assignDuty = async () => {
    if (!form.officer_email || !form.duty_type) {
      toast.error("Officer email and duty type are required");
      return;
    }
    setSaving(true);
    try {
      let officerName = form.officer_name;
      let officerDistrict = form.district || user?.district || '';
      let officerStation = form.police_station || user?.police_station || user?.station || '';

      const { data: officer } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', form.officer_email.trim())
        .maybeSingle();

      if (officer) {
        officerName = officerName || officer.full_name;
        if (!officerDistrict) officerDistrict = officer.district || '';
        if (!officerStation) officerStation = officer.police_station || officer.station || '';
      }

      const notesPayload = JSON.stringify({
        duty_type: form.duty_type,
        shift: form.shift,
        duty_date: form.duty_date,
        start_time: `${form.duty_date}T${form.start_time}:00Z`,
        end_time: `${form.duty_date}T${form.end_time}:00Z`,
        text: form.notes || '',
        assigned_by: user?.email || user?.full_name || 'Higher Official',
      });

      const { error: insertErr } = await supabase.from('duty_assignments').insert([{
        officer_email: form.officer_email.trim(),
        officer_name: officerName || form.officer_email.trim(),
        district: officerDistrict,
        police_station: officerStation,
        location: form.location || 'Assigned Beat / Zone',
        status: "scheduled",
        notes: notesPayload,
      }]);

      if (insertErr) {
        console.error("Failed to assign duty:", insertErr);
        toast.error("Failed to assign duty: " + insertErr.message);
        return;
      }

      toast.success("Duty assigned successfully!");
      setShowForm(false);
      setForm(p => ({ ...p, location: "", notes: "" }));
      loadData();
    } catch (err) {
      console.error("Error assigning duty:", err);
      toast.error("An unexpected error occurred while assigning duty");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const { error } = await supabase.from('duty_assignments').update({ status }).eq('id', id);
      if (error) throw error;
      toast.success(`Duty marked as ${status}`);
      loadData();
    } catch (err) {
      console.error("Error updating duty status:", err);
      toast.error("Failed to update status");
    }
  };

  const deleteDuty = async (id) => {
    try {
      const { error } = await supabase.from('duty_assignments').delete().eq('id', id);
      if (error) throw error;
      toast.success("Duty removed");
      loadData();
    } catch (err) {
      console.error("Error deleting duty:", err);
      toast.error("Failed to delete duty");
    }
  };

  const filteredDuties = dateFilter
    ? duties.filter(d => !d.duty_date || d.duty_date === dateFilter || d.created_at?.slice(0, 10) === dateFilter)
    : duties;

  const displayDuties = filteredDuties.length > 0 ? filteredDuties : duties;

  const myDuties = displayDuties.filter(d => d.officer_email === user?.email);
  const otherDuties = displayDuties.filter(d => d.officer_email !== user?.email);

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
                    onClick={() => setForm(p => ({
                      ...p,
                      officer_email: user.email,
                      officer_name: user.full_name || "",
                      police_station: user.police_station || user.station || "",
                      district: user.district || ""
                    }))}
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
                    <Label className="text-xs">Police Station</Label>
                    <Input value={form.police_station} onChange={e => setForm(p => ({...p, police_station: e.target.value}))} placeholder="e.g. MVP Colony PS, Alipiri PS" />
                  </div>
                  <div>
                    <Label className="text-xs">District</Label>
                    <Input value={form.district} onChange={e => setForm(p => ({...p, district: e.target.value}))} placeholder="e.g. Visakhapatnam, Tirupati" />
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
  const displayTime = duty.start_time
    ? (duty.start_time.includes('T') ? `${moment(duty.start_time).format("HH:mm")}–${moment(duty.end_time).format("HH:mm")}` : `${duty.start_time}–${duty.end_time}`)
    : "";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className={`border rounded-xl p-3.5 ${isOwn ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${STATUS_COLORS[duty.status] || ""}`}>{duty.status}</span>
            <Badge variant="outline" className="text-[10px] capitalize">{duty.duty_type?.replace("_"," ")}</Badge>
            {duty.shift && <Badge variant="outline" className="text-[10px]">{SHIFT_LABELS[duty.shift]?.split(" ")[0] || duty.shift} {SHIFT_LABELS[duty.shift]?.split(" ")[1] || ""}</Badge>}
          </div>
          <p className="font-medium text-sm">{duty.officer_name || duty.officer_email || "Assigned Officer"}</p>
          <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-0.5">
            {duty.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{duty.location}</span>}
            {displayTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{displayTime}</span>}
            {(duty.police_station || duty.district) && <span>{duty.police_station ? `${duty.police_station} • ` : ""}{duty.district || ""}</span>}
          </div>
          {duty.instructions && <p className="text-xs text-muted-foreground mt-1 italic">{duty.instructions}</p>}
        </div>
        {(canManage || isOwn) && (
          <div className="flex gap-1.5 flex-shrink-0">
            {duty.status === "scheduled" && (
              <button onClick={() => onStatus(duty.id, "active")} className="text-[10px] px-2 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition font-medium">Activate</button>
            )}
            {duty.status === "active" && (
              <button onClick={() => onStatus(duty.id, "completed")} className="text-[10px] px-2 py-1 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition font-medium">Complete</button>
            )}
            {canManage && (
              <button onClick={() => onDelete(duty.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition" title="Delete Duty">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}