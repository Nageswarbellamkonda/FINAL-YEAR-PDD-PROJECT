import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from "../lib/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Shield, AlertTriangle, CheckCircle2, Phone, Eye, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import moment from "moment";

const statusColors = {
  active: "bg-green-100 text-green-700 border-green-300",
  safe: "bg-blue-100 text-blue-700 border-blue-300",
  alert: "bg-yellow-100 text-yellow-700 border-yellow-300",
  emergency: "bg-red-100 text-red-700 border-red-300",
};

export default function LiveTracking() {
  const { lang } = useLanguage();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [mySession, setMySession] = useState(null);
  const [selected, setSelected] = useState(null);

  const { user: authUser, profile } = useAuth();

  useEffect(() => {
    loadData();
    // Real-time subscription
    const channel = supabase.channel('women_safety_sessions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'women_safety_sessions' }, (payload) => {
        if (payload.eventType === 'INSERT') setSessions(prev => [payload.new, ...prev]);
        else if (payload.eventType === 'UPDATE') setSessions(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
        else if (payload.eventType === 'DELETE') setSessions(prev => prev.filter(s => s.id === payload.old.id ? false : true));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [authUser, profile]);

  const loadData = async () => {
    const me = profile ?? authUser ?? null;
    setUser(me);
    const isOfficer = me?.role && !["citizen", "user"].includes(me?.role);
    if (isOfficer) {
      const { data: all } = await supabase.from('women_safety_sessions').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(50);
      const { data: alerts } = await supabase.from('women_safety_sessions').select('*').eq('status', 'emergency').order('created_at', { ascending: false }).limit(20);
      setSessions([...(alerts || []), ...(all || []).filter(s => s.status !== "emergency")]);
    } else {
      const { data: mine } = await supabase.from('women_safety_sessions').select('*').eq('user_email', me?.email).eq('status', 'active').order('created_at', { ascending: false }).limit(1);
      if (mine && mine.length > 0) setMySession(mine[0]);
    }
    setLoading(false);
  };

  const respondToEmergency = async (sessionId) => {
    // We should ideally fetch current action updates and append, but for simplicity we just update status
    await supabase.from('women_safety_sessions').update({
      status: "alert",
    }).eq('id', sessionId);
  };

  const isOfficer = user?.role && !["citizen", "user"].includes(user.role);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-pink-600 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-2xl">
              {isOfficer ? "Live Safety Tracking" : "My Safety Session"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isOfficer ? "Monitor active women safety sessions in real-time" : "Your current active tracking session"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">Live</span>
          </div>
        </div>

        {/* Officer View */}
        {isOfficer && (
          <>
            {/* Emergency alerts first */}
            {sessions.filter(s => s.status === "emergency").length > 0 && (
              <div className="mb-6">
                <h2 className="font-semibold text-destructive flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5" /> EMERGENCY ALERTS
                </h2>
                <div className="space-y-3">
                  {sessions.filter(s => s.status === "emergency").map(session => (
                    <motion.div
                      key={session.id}
                      initial={{ scale: 0.98 }}
                      animate={{ scale: 1 }}
                      className="border-2 border-red-500 bg-red-50 rounded-xl p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-red-700 text-lg">🚨 {session.user_name}</h3>
                          <p className="text-sm text-red-600">{session.user_phone}</p>
                          <p className="text-sm mt-1"><strong>Destination:</strong> {session.destination || "Unknown"}</p>
                          <p className="text-sm"><strong>Vehicle:</strong> {session.vehicle_number || "Unknown"}</p>
                          <p className="text-sm"><strong>Companion:</strong> {session.companion_name} ({session.companion_phone})</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            SOS triggered {moment(session.updated_date).fromNow()}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <a href={`tel:${session.user_phone}`}>
                            <Button size="sm" className="bg-red-600 hover:bg-red-700 gap-1 w-full">
                              <Phone className="w-4 h-4" /> Call Now
                            </Button>
                          </a>
                          <Button size="sm" variant="outline" onClick={() => respondToEmergency(session.id)}>
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Responding
                          </Button>
                        </div>
                      </div>
                      {session.emergency_contacts?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-red-200">
                          <p className="text-xs font-semibold text-red-700 mb-1">Emergency Contacts:</p>
                          <div className="flex flex-wrap gap-2">
                            {session.emergency_contacts.map((c, i) => (
                              <a key={i} href={`tel:${c.phone}`} className="text-xs bg-white border border-red-300 rounded px-2 py-1 text-red-700 hover:bg-red-50">
                                📞 {c.name}: {c.phone}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Sessions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.filter(s => s.status !== "emergency").map(session => (
                <Card key={session.id} className="hover:shadow-md transition cursor-pointer" onClick={() => setSelected(selected?.id === session.id ? null : session)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold">{session.user_name}</p>
                        <p className="text-xs text-muted-foreground">{session.user_phone}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColors[session.status] || ""}`}>
                        {session.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {session.destination || "No destination set"}</div>
                      <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> Last check-in: {moment(session.last_checkin).fromNow()}</div>
                      {session.vehicle_number && <div className="flex items-center gap-1">🚗 {session.vehicle_number}</div>}
                    </div>
                    {selected?.id === session.id && (
                      <div className="mt-3 pt-3 border-t">
                        <a href={`tel:${session.user_phone}`}>
                          <Button size="sm" variant="outline" className="w-full gap-1">
                            <Phone className="w-3 h-3" /> Call {session.user_name}
                          </Button>
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {sessions.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No active safety sessions at this time</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Citizen View */}
        {!isOfficer && (
          <Card>
            <CardContent className="p-6 text-center">
              {mySession ? (
                <div>
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Session Active</h3>
                  <p className="text-muted-foreground text-sm">Your safety session is being monitored by She Teams</p>
                  <div className="mt-4 bg-muted rounded-lg p-4 text-left space-y-2 text-sm">
                    <p><strong>Destination:</strong> {mySession.destination || "Not set"}</p>
                    <p><strong>Vehicle:</strong> {mySession.vehicle_number || "Not set"}</p>
                    <p><strong>OTP Code:</strong> <span className="font-mono font-bold">{mySession.otp_code}</span></p>
                    <p><strong>Last Check-in:</strong> {moment(mySession.last_checkin).fromNow()}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">No active tracking session</p>
                  <Button asChild>
                    <a href="/women-safety">Start Safety Session</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}