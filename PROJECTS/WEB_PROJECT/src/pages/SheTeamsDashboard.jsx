import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock, Shield, MapPin, Phone, ArrowLeft, Loader2, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";

if (typeof L !== 'undefined' && L.Icon && L.Icon.Default) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

const statusConfig = {
  active: { color: "bg-green-100 text-green-700", label: "Active", icon: CheckCircle2 },
  alert: { color: "bg-yellow-100 text-yellow-700", label: "Alert", icon: AlertTriangle },
  emergency: { color: "bg-red-100 text-red-700 animate-pulse", label: "EMERGENCY", icon: AlertTriangle },
  safe: { color: "bg-gray-100 text-gray-600", label: "Safe/Ended", icon: CheckCircle2 },
};

export default function SheTeamsDashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  const loadSessions = async () => {
    const { data } = await supabase.from('women_safety_sessions').select('*').in('status', ['active', 'alert', 'emergency']).order('updated_at', { ascending: false }).limit(50);
    if (data && data.length) {
      setSessions(data);
    } else {
      const { data: allData } = await supabase.from('women_safety_sessions').select('*').order('updated_at', { ascending: false }).limit(20);
      setSessions(allData || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSessions();
    const channel = supabase.channel('she_teams_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'women_safety_sessions' }, (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new.status === "emergency" && payload.old.status !== "emergency") {
          toast.error(`🚨 EMERGENCY! ${payload.new.user_name} needs immediate help!`, { duration: 10000 });
        }
        loadSessions();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const emergencies = sessions.filter(s => s.status === "emergency");
  const active = sessions.filter(s => s.status === "active");

  const parseLocation = (locStr) => {
    if (!locStr) return null;
    const parts = locStr.split(",");
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    return null;
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-pink-600" /></div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm transition">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
          <Shield className="w-5 h-5 text-pink-600" />
        </div>
        <div>
          <h1 className="font-heading font-bold text-xl">SHE Teams — Live Monitoring Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time women safety session monitoring</p>
        </div>
        <Button size="sm" variant="outline" onClick={loadSessions} className="ml-auto gap-2">
          <Bell className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Sessions", value: active.length, color: "text-green-600", bg: "bg-green-50" },
          { label: "EMERGENCIES", value: emergencies.length, color: "text-red-600", bg: emergencies.length > 0 ? "bg-red-100 animate-pulse" : "bg-red-50" },
          { label: "Total Today", value: sessions.length, color: "text-primary", bg: "bg-primary/5" },
          { label: "Resolved", value: sessions.filter(s => s.status === "safe").length, color: "text-gray-600", bg: "bg-gray-50" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={s.bg}>
              <CardContent className="p-4 text-center">
                <p className={`font-heading font-bold text-3xl ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Emergencies Alert */}
      {emergencies.length > 0 && (
        <div className="bg-red-600 rounded-xl p-4 mb-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
              <AlertTriangle className="w-6 h-6" />
            </motion.div>
            <h2 className="font-bold text-lg">{emergencies.length} ACTIVE EMERGENCY {emergencies.length > 1 ? "ALERTS" : "ALERT"}</h2>
          </div>
          {emergencies.map(s => (
            <div key={s.id} className="bg-white/10 rounded-lg p-3 mb-2 flex items-center justify-between">
              <div>
                <p className="font-semibold">{s.user_name} — {s.user_phone}</p>
                <p className="text-white/80 text-xs">Destination: {s.destination || "Unknown"}</p>
                {s.last_location && <p className="text-white/70 text-xs">Location: {s.last_location}</p>}
              </div>
              <div className="flex gap-2">
                <a href={`tel:${s.user_phone}`} className="bg-white text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Call
                </a>
                <button onClick={() => setSelectedSession(s)} className="bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Track
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sessions List */}
        <div>
          <h2 className="font-heading font-semibold text-base mb-3">Active Sessions</h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {sessions.filter(s => s.status !== "safe").length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No active sessions</div>
            ) : sessions.filter(s => s.status !== "safe").map((s) => {
              const cfg = statusConfig[s.status] || statusConfig.active;
              const Icon = cfg.icon;
              return (
                <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className={`border rounded-xl p-4 cursor-pointer hover:shadow-sm transition ${selectedSession?.id === s.id ? "border-pink-400 bg-pink-50/30" : "border-border"} ${s.status === "emergency" ? "border-red-400 bg-red-50" : ""}`}
                  onClick={() => setSelectedSession(s)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-xs text-muted-foreground">{s.user_name}</span>
                      </div>
                      <p className="text-sm font-medium">{s.user_phone}</p>
                      <p className="text-xs text-muted-foreground">Destination: {s.destination || "Not set"}</p>
                      {s.last_location && (
                        <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />{s.last_location}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <a href={`tel:${s.user_phone}`} onClick={e => e.stopPropagation()}
                        className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center hover:bg-pink-200">
                        <Phone className="w-3.5 h-3.5 text-pink-600" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Live Map */}
        <div>
          <h2 className="font-heading font-semibold text-base mb-3">
            {selectedSession ? `Tracking: ${selectedSession.user_name}` : "Live Location Map"}
          </h2>
          <div className="rounded-xl overflow-hidden border border-border" style={{ height: "500px" }}>
            <MapContainer
              center={selectedSession && parseLocation(selectedSession.last_location)
                ? [parseLocation(selectedSession.last_location).lat, parseLocation(selectedSession.last_location).lng]
                : [15.9, 80.5]}
              zoom={selectedSession && parseLocation(selectedSession.last_location) ? 14 : 7}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {sessions.map(s => {
                const loc = parseLocation(s.last_location);
                if (!loc) return null;
                return (
                  <Marker key={s.id} position={[loc.lat, loc.lng]}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold">{s.user_name}</p>
                        <p>{s.user_phone}</p>
                        <p className={`font-semibold ${s.status === "emergency" ? "text-red-600" : "text-green-600"}`}>
                          Status: {s.status?.toUpperCase()}
                        </p>
                        <p>Destination: {s.destination}</p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}