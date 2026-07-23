import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from "../lib/LanguageContext";
import { useTranslation } from "../lib/translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, MapPin, Phone, Clock, AlertTriangle, Plus, Trash2, Loader2, CheckCircle2, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet default icon
if (typeof L !== 'undefined' && L.Icon && L.Icon.Default) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

function MapRecenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => { if (lat && lng) map.setView([lat, lng], 15); }, [lat, lng]);
  return null;
}

export default function WomenSafety() {
  const { lang } = useLanguage();
  const t = useTranslation(lang);
  const { user: authUser, profile } = useAuth();
  const [activeSession, setActiveSession] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [location, setLocation] = useState(null);
  const [locError, setLocError] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const watchRef = useRef(null);

  const [form, setForm] = useState({
    companion_name: "",
    companion_phone: "",
    vehicle_number: "",
    destination: "",
    emergency_contacts: [{ name: "", phone: "" }],
  });

  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const addContact = () => setForm(prev => ({ ...prev, emergency_contacts: [...prev.emergency_contacts, { name: "", phone: "" }] }));
  const removeContact = (idx) => setForm(prev => ({ ...prev, emergency_contacts: prev.emergency_contacts.filter((_, i) => i !== idx) }));
  const updateContact = (idx, key, value) => setForm(prev => ({ ...prev, emergency_contacts: prev.emergency_contacts.map((c, i) => i === idx ? { ...c, [key]: value } : c) }));

  const getLocation = () => {
    setLocLoading(true);
    setLocError(null);
    if (!navigator.geolocation) { setLocError("Geolocation not supported"); setLocLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setLocLoading(false);
        toast.success("Location captured successfully!");
      },
      (err) => { setLocError("Location access denied. Please enable GPS."); setLocLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const startWatchingLocation = () => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        if (activeSession) {
          supabase.from('women_safety_sessions').update({
            last_location: `${loc.lat},${loc.lng}`,
          }).eq('id', activeSession.id);
        }
      },
      (err) => console.warn("Watch error:", err),
      { enableHighAccuracy: true, maximumAge: 30000 }
    );
  };

  useEffect(() => {
    return () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current); };
  }, []);

  const startSession = async () => {
    if (!location) { toast.error("Please capture your location first"); return; }
    setLoading(true);
    const user = profile ?? authUser ?? null;
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const { data: session } = await supabase.from('women_safety_sessions').insert([{
      user_id: user?.id,
      user_email: user?.email,
      user_name: user?.full_name || "User",
      user_phone: user?.phone ?? "",
      ...form,
      status: "active",
      otp_code: otp,
      last_checkin: new Date().toISOString(),
      checkin_interval_minutes: 10,
      missed_checkins: 0,
      last_location: `${location.lat},${location.lng}`,
    }]).select().single();
    setActiveSession(session);
    setShowForm(false);
    setLoading(false);
    startWatchingLocation();
    toast.success(lang === "te" ? "భద్రత సెషన్ ప్రారంభమైంది!" : "Safety session started! She Teams are monitoring you.");
  };

  const checkIn = async () => {
    if (!activeSession) return;
    setCheckingIn(true);
    await supabase.from('women_safety_sessions').update({
      last_checkin: new Date().toISOString(),
      status: "active",
      missed_checkins: 0,
      last_location: location ? `${location.lat},${location.lng}` : activeSession.last_location,
    }).eq('id', activeSession.id);
    setActiveSession(prev => ({ ...prev, last_checkin: new Date().toISOString(), missed_checkins: 0 }));
    setCheckingIn(false);
    toast.success(lang === "te" ? "చెక్ ఇన్ విజయవంతం!" : "Check-in successful! Marked safe.");
  };

  const triggerSOS = async () => {
    if (!activeSession) return;
    await supabase.from('women_safety_sessions').update({
      status: "emergency",
      last_location: location ? `${location.lat},${location.lng}` : activeSession.last_location,
    }).eq('id', activeSession.id);
    setActiveSession(prev => ({ ...prev, status: "emergency" }));
    toast.error(lang === "te" ? "SOS హెచ్చరిక పంపబడింది!" : "🚨 SOS Alert sent! She Teams & emergency contacts notified.");
  };

  const endSession = async () => {
    if (!activeSession) return;
    await supabase.from('women_safety_sessions').update({ status: "safe" }).eq('id', activeSession.id);
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    setActiveSession(null);
    toast.success(lang === "te" ? "సెషన్ ముగిసింది. మీరు క్షేమం!" : "Session ended safely!");
  };

  const safetyTips = [
    { en: "Always share your live location with a trusted person when traveling alone", te: "ఒంటరిగా ప్రయాణించేటప్పుడు నమ్మకమైన వ్యక్తితో మీ స్థానాన్ని పంచుకోండి" },
    { en: "Note down the vehicle number when using cabs/autos", te: "క్యాబ్‌లు/ఆటోలు ఉపయోగించేటప్పుడు వాహనం నంబర్ రాసుకోండి" },
    { en: "She Teams helpline: 181 — Available 24/7", te: "షీ టీమ్స్ హెల్ప్‌లైన్: 181 — 24/7 అందుబాటులో" },
    { en: "Trust your instincts. If something feels wrong, seek help immediately", te: "ఏదైనా తప్పుగా అనిపిస్తే, వెంటనే సహాయం కోరండి" },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-pink-600" />
          </div>
          <h1 className="font-heading font-bold text-2xl">{t("womenSafetyTitle")}</h1>
          <p className="text-muted-foreground text-sm mt-1">She Teams — AP Police 24/7</p>
        </div>

        {/* Active Session */}
        {activeSession && (
          <Card className={`mb-6 ${activeSession.status === "emergency" ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50/30"}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
                  {activeSession.status === "emergency"
                    ? <><AlertTriangle className="w-5 h-5 text-red-600" /> EMERGENCY ACTIVE</>
                    : <><CheckCircle2 className="w-5 h-5 text-green-600" /> Session Active — She Teams Monitoring</>
                  }
                </h3>
                <span className="text-xs bg-primary/10 px-2 py-1 rounded font-mono">OTP: {activeSession.otp_code}</span>
              </div>

              {/* Live Map */}
              {location && (
                <div className="rounded-xl overflow-hidden mb-4 border border-border" style={{ height: "220px" }}>
                  <MapContainer center={[location.lat, location.lng]} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapRecenter lat={location.lat} lng={location.lng} />
                    <Marker position={[location.lat, location.lng]}>
                      <Popup>Your live location</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3 mb-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-green-600" />
                  {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : activeSession.destination || "Location pending"}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" /> Check-in every {activeSession.checkin_interval_minutes} min
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={checkIn} disabled={checkingIn} className="bg-green-600 hover:bg-green-700 flex-1">
                  {checkingIn ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  {t("checkIn")} — I'm Safe
                </Button>
                <Button onClick={triggerSOS} variant="destructive" className="flex-1 font-bold animate-pulse">
                  🚨 {t("sos")} ALERT
                </Button>
                <Button onClick={endSession} variant="outline" size="sm">End Session</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Start Session */}
        {!activeSession && !showForm && (
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <Button size="lg" onClick={() => setShowForm(true)} className="bg-pink-600 hover:bg-pink-700 gap-2">
                <Shield className="w-5 h-5" /> {t("startSafetySession")}
              </Button>
              <p className="text-muted-foreground text-xs mt-3">
                {lang === "te" ? "ప్రయాణంలో మీ భద్రత నిర్ధారించుకోండి" : "Ensure your safety while traveling alone at night"}
              </p>
            </CardContent>
          </Card>
        )}

        {showForm && !activeSession && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">{t("startSafetySession")}</CardTitle>
              <CardDescription>{lang === "te" ? "ప్రయాణ వివరాలు నింపండి" : "Fill in your travel details"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Location Capture */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-800 mb-3 flex items-center gap-2">
                  <Navigation className="w-4 h-4" /> Current Location (Required)
                </p>
                {location ? (
                  <div>
                    <div className="rounded-lg overflow-hidden mb-2 border" style={{ height: "160px" }}>
                      <MapContainer center={[location.lat, location.lng]} zoom={14} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[location.lat, location.lng]}>
                          <Popup>Your location</Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                    <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Location captured: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                    </p>
                  </div>
                ) : (
                  <div>
                    {locError && <p className="text-xs text-red-600 mb-2">{locError}</p>}
                    <Button variant="outline" size="sm" onClick={getLocation} disabled={locLoading} className="gap-2">
                      {locLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                      {locLoading ? "Getting location..." : "Capture My Location"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>{t("companionName")}</Label>
                  <Input value={form.companion_name} onChange={(e) => updateField("companion_name", e.target.value)} />
                </div>
                <div>
                  <Label>{t("companionPhone")}</Label>
                  <Input value={form.companion_phone} onChange={(e) => updateField("companion_phone", e.target.value)} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>{t("vehicleNumber")}</Label>
                  <Input placeholder="AP 00 XX 0000" value={form.vehicle_number} onChange={(e) => updateField("vehicle_number", e.target.value)} />
                </div>
                <div>
                  <Label>{t("destination")}</Label>
                  <Input value={form.destination} onChange={(e) => updateField("destination", e.target.value)} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>{t("emergencyContacts")}</Label>
                  <Button size="sm" variant="ghost" onClick={addContact}><Plus className="w-4 h-4 mr-1" /> Add</Button>
                </div>
                {form.emergency_contacts.map((contact, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <Input placeholder={t("name")} value={contact.name} onChange={(e) => updateContact(i, "name", e.target.value)} />
                    <Input placeholder={t("phone")} value={contact.phone} onChange={(e) => updateContact(i, "phone", e.target.value)} />
                    {form.emergency_contacts.length > 1 && (
                      <Button size="icon" variant="ghost" onClick={() => removeContact(i)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button onClick={startSession} disabled={loading || !location} className="flex-1 bg-pink-600 hover:bg-pink-700">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t("startSafetySession")}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>{t("cancel")}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Safety Tips */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-pink-600" />{t("safetyTips")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {safetyTips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-pink-50 rounded-lg">
                  <span className="text-pink-600 font-bold text-sm mt-0.5">{i + 1}.</span>
                  <p className="text-sm text-foreground">{lang === "te" ? tip.te : tip.en}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <a href="/trusted-circle" className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4 hover:shadow-md transition group">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
              <span className="text-white text-lg">❤️</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-rose-800">{lang === "te" ? "నమ్మకమైన సర్కిల్" : "Trusted Circle"}</p>
              <p className="text-xs text-rose-600">{lang === "te" ? "కుటుంబం & మిత్రులను SOS నెట్‌వర్క్‌లో జోడించండి" : "Add family to your emergency SOS network"}</p>
            </div>
          </a>
          <a href="/safe-route" className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 hover:shadow-md transition group">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
              <span className="text-white text-lg">🗺️</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-emerald-800">{lang === "te" ? "సురక్షిత మార్గం" : "Safe Route Navigator"}</p>
              <p className="text-xs text-emerald-600">{lang === "te" ? "నేర ప్రాంతాలు నివారించి సురక్షితంగా ప్రయాణించండి" : "Navigate avoiding high-crime zones"}</p>
            </div>
          </a>
        </div>

        <div className="bg-pink-600 rounded-xl p-6 text-center text-white">
          <h3 className="font-heading font-bold text-xl mb-2">She Teams Helpline</h3>
          <a href="tel:181" className="inline-flex items-center gap-2 text-3xl font-bold">
            <Phone className="w-8 h-8" /> 181
          </a>
          <p className="text-white/80 text-sm mt-2">{lang === "te" ? "24/7 అందుబాటులో" : "Available 24/7 across Andhra Pradesh"}</p>
        </div>
      </motion.div>
    </div>
  );
}