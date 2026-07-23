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
import { hasPermission, ROLE_LABELS, getJurisdiction } from "@/lib/rbac";
import { Bell, Plus, ArrowLeft, Loader2, Trash2, Shield, AlertTriangle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import moment from "moment";

const AP_DISTRICTS = ["All AP","Srikakulam","Vizianagaram","Visakhapatnam","East Godavari","West Godavari","Krishna","Guntur","Prakasam","Nellore","Kurnool","YSR Kadapa","Anantapur","Chittoor"];
const ALERT_TYPES = ["crime_alert","duty_notice","emergency","news","advisory","weather"];
const SEV_COLORS = { low:"bg-green-100 text-green-700", medium:"bg-yellow-100 text-yellow-700", high:"bg-orange-100 text-orange-700", critical:"bg-red-100 text-red-700" };

export default function AlertsAdmin() {
  const [user, setUser] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", message: "", alert_type: "crime_alert", severity: "medium", scope: "district",
    district: "", station: ""
  });

  const { user: authUser, profile } = useAuth();

  useEffect(() => { loadData(); }, [authUser, profile]);

  const loadData = async () => {
    setLoading(true);
    const me = profile ?? authUser ?? null;
    setUser(me);
    const role = me?.user_type || me?.role;
    const jur = getJurisdiction(role);
    let query = supabase.from('station_alerts').select('*').order('created_at', { ascending: false }).limit(100);
    if (jur !== "all" && me?.district) {
      query = query.eq('district', me.district).limit(50);
    }
    const { data = [] } = await query;
    setAlerts(data || []);
    setLoading(false);
  };

  const canPublish = user && (
    hasPermission(user.user_type || user.role, "PUBLISH_DISTRICT_ALERT") ||
    hasPermission(user.user_type || user.role, "PUBLISH_STATION_ALERT")
  );

  const publishAlert = async () => {
    if (!form.title.trim() || !form.message.trim()) { toast.error("Title and message are required"); return; }
    if (form.scope === "district" && !hasPermission(user.user_type || user.role, "PUBLISH_DISTRICT_ALERT")) {
      toast.error("You don't have permission to publish district-level alerts");
      return;
    }
    setSaving(true);
    await supabase.from('station_alerts').insert([{
      ...form,
      district: form.district || user.district,
      station: form.station || user.station,
      published_by: user.email,
      publisher_role: user.user_type || user.role,
      publisher_name: user.full_name || user.email,
      is_active: true,
    }]);
    toast.success("Alert published successfully!");
    setSaving(false);
    setShowForm(false);
    setForm({ title:"", message:"", alert_type:"crime_alert", severity:"medium", scope:"district", district:"", station:"" });
    loadData();
  };

  const toggleAlert = async (id, is_active) => {
    await supabase.from('station_alerts').update({ is_active: !is_active }).eq('id', id);
    toast.success(is_active ? "Alert deactivated" : "Alert activated");
    loadData();
  };

  const deleteAlert = async (id) => {
    await supabase.from('station_alerts').delete().eq('id', id);
    toast.success("Alert deleted");
    loadData();
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!canPublish && alerts.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <Shield className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="font-heading font-bold text-xl mb-2">Access Restricted</h2>
        <p className="text-muted-foreground mb-4">Alert management is for DSP rank and above.</p>
        <Button asChild variant="outline"><Link to="/officer-dashboard">Back</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm"><Link to="/officer-dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link></Button>
        <div className="flex-1">
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" /> Alerts & Notices Management
          </h1>
          <p className="text-muted-foreground text-sm">
            {ROLE_LABELS[user?.user_type || user?.role]} — Publish crime alerts, duty notices & emergencies
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}><RefreshCw className="w-4 h-4" /></Button>
        {canPublish && (
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" /> New Alert
          </Button>
        )}
      </div>

      {/* Publish Form */}
      <AnimatePresence>
        {showForm && canPublish && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
            <Card className="border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-600" /> Publish New Alert</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Alert Title *</Label>
                    <Input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="e.g., Increased snatching near Bus Stand" />
                  </div>
                  <div>
                    <Label className="text-xs">Alert Type</Label>
                    <Select value={form.alert_type} onValueChange={v => setForm(p => ({...p, alert_type: v}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ALERT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace("_"," ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Severity</Label>
                    <Select value={form.severity} onValueChange={v => setForm(p => ({...p, severity: v}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["low","medium","high","critical"].map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Scope</Label>
                    <Select value={form.scope} onValueChange={v => setForm(p => ({...p, scope: v}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {hasPermission(user?.user_type || user?.role, "PUBLISH_DISTRICT_ALERT") && <SelectItem value="all">All AP</SelectItem>}
                        {hasPermission(user?.user_type || user?.role, "PUBLISH_DISTRICT_ALERT") && <SelectItem value="district">District Level</SelectItem>}
                        <SelectItem value="station">Station Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.scope !== "all" && (
                    <div>
                      <Label className="text-xs">District</Label>
                      <Select value={form.district || user?.district || ""} onValueChange={v => setForm(p => ({...p, district: v}))}>
                        <SelectTrigger><SelectValue placeholder="Select District" /></SelectTrigger>
                        <SelectContent>{AP_DISTRICTS.slice(1).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs">Alert Message *</Label>
                  <Textarea value={form.message} onChange={e => setForm(p => ({...p, message: e.target.value}))} placeholder="Describe the alert, advisory, or notice in detail..." className="h-20" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={publishAlert} disabled={saving} className="flex-1 bg-red-600 hover:bg-red-700">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
                    Publish Alert
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No alerts published yet</CardContent></Card>
        )}
        {alerts.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className={`${!a.is_active ? "opacity-50" : ""} ${a.severity === "critical" ? "border-red-300" : a.severity === "high" ? "border-orange-300" : "border-border"}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${SEV_COLORS[a.severity]}`}>{a.severity?.toUpperCase()}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">{a.alert_type?.replace("_"," ")}</Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">{a.scope}</Badge>
                      {a.district && <span className="text-[10px] text-muted-foreground">{a.district}</span>}
                      {!a.is_active && <Badge variant="outline" className="text-[10px] text-gray-500">INACTIVE</Badge>}
                    </div>
                    <h3 className="font-semibold text-sm">{a.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{a.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      By {a.publisher_name || a.published_by} ({a.publisher_role?.toUpperCase()}) • {moment(a.created_at).fromNow()}
                    </p>
                  </div>
                  {canPublish && (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => toggleAlert(a.id, a.is_active)}
                        className={`text-[10px] px-2 py-1 rounded-lg font-medium transition ${a.is_active ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}>
                        {a.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button onClick={() => deleteAlert(a.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}