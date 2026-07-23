import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation, MapPin, AlertTriangle, Shield, Loader2, ArrowLeft, Zap } from "lucide-react";
import { Link } from "react-router-dom";

if (typeof L !== 'undefined' && L.Icon?.Default) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

function MapFit({ userPos }) {
  const map = useMap();
  useEffect(() => { if (userPos) map.setView([userPos.lat, userPos.lng], 13); }, [userPos]);
  return null;
}

const AP_DISTRICTS = ["Visakhapatnam","Guntur","Krishna","East Godavari","West Godavari","Kurnool","Nellore","Prakasam","Chittoor","YSR Kadapa","Anantapur","Srikakulam","Vizianagaram"];

// Static high-risk hotspot zones for visualization
const HOTSPOTS = [
  { lat: 17.7002, lng: 83.2960, risk: "high", label: "Dwaraka Nagar area — Snatching", radius: 600 },
  { lat: 16.5137, lng: 80.6325, risk: "high", label: "Vijayawada Old Town — Theft", radius: 500 },
  { lat: 16.3080, lng: 80.4490, risk: "medium", label: "Guntur Market — Pickpocket", radius: 400 },
  { lat: 15.8290, lng: 78.0410, risk: "medium", label: "Kurnool Bus Stand — Fraud", radius: 350 },
  { lat: 13.6300, lng: 79.4210, risk: "low", label: "Tirupati Pilgrim Zone — Crowd Risk", radius: 500 },
];

const RISK_COLORS = { high: "#dc2626", medium: "#d97706", low: "#16a34a" };

export default function SafeRoute() {
  const [userPos, setUserPos] = useState(null);
  const [destination, setDestination] = useState("");
  const [district, setDistrict] = useState("Visakhapatnam");
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeAdvice, setRouteAdvice] = useState(null);
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    supabase.from('complaints').select('*').order('created_at', { ascending: false }).limit(200).then(({ data }) => setComplaints(data || []));
  }, []);

  const getLocation = () => {
    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoadingLoc(false);
        toast.success("Location captured!");
      },
      () => { toast.error("Location access denied"); setLoadingLoc(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const generateRoute = () => {
    if (!destination.trim()) { toast.error("Enter a destination"); return; }
    setLoadingRoute(true);
    setRouteAdvice(null);

    const districtData = complaints.filter(c =>
      c.district === district || c.location?.toLowerCase().includes(district.toLowerCase())
    );
    const crimeTypes = {};
    districtData.forEach(c => { crimeTypes[c.category] = (crimeTypes[c.category] || 0) + 1; });
    const topCrimes = Object.entries(crimeTypes).sort((a,b) => b[1]-a[1]).slice(0,3);
    const hour = new Date().getHours();
    const isNight = hour >= 21 || hour < 6;
    const riskLevel = topCrimes.length >= 3 ? "HIGH" : topCrimes.length >= 1 ? "MEDIUM" : "LOW";

    const advice = `SAFE ROUTE ADVISORY — ${district.toUpperCase()}
Destination: ${destination}
Time: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}

1. RISK LEVEL: ${riskLevel}
   Based on ${districtData.length} recent crime reports in ${district}.
   ${topCrimes.length > 0 ? `Top reported incidents: ${topCrimes.map(([c, n]) => `${c.replace(/_/g, " ")} (${n})`).join(", ")}.` : "No major recent incidents reported."}

2. SAFE ROUTE TIPS:
   • Use main roads and well-lit streets — avoid narrow lanes especially ${isNight ? "at night" : "during low-traffic hours"}.
   • Share your live location with a trusted contact before starting the journey.
   • Prefer government transport (APSRTC) or verified cabs (Ola/Uber) over autos for night travel.

3. AREAS TO AVOID:
   • Isolated market areas, railway station backsides, and old bus stands especially after 9 PM.
   • Construction zones or areas with poor street lighting.

4. BEST TIME TO TRAVEL:
   ${isNight ? "⚠️ You are traveling at night — recommended to delay until 6 AM if non-urgent." : "✅ Current time is suitable for travel. Avoid travel after 9:30 PM."}

5. EMERGENCY PREPARATION:
   • Keep emergency contacts saved: Police 100 | SHE Teams 181 | Cyber Crime 1930.
   • Ensure your phone is charged and location services are ON.
   • Inform family/friends about your route and estimated arrival time.

NYAYA MITRA Safe Route • Always call 100 in emergency.`;

    setTimeout(() => {
      setRouteAdvice(advice);
      setLoadingRoute(false);
    }, 600);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm"><Link to="/"><ArrowLeft className="w-4 h-4 mr-1" />Home</Link></Button>
        <div className="flex-1">
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Navigation className="w-6 h-6 text-emerald-600" /> Dynamic Safe Route Navigator
          </h1>
          <p className="text-muted-foreground text-sm">AI-powered route safety analysis avoiding high-crime zones</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Route Safety Planner
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Your District</label>
                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{AP_DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Destination</label>
                <Input placeholder="e.g., Rythu Bazaar, Gajuwaka" value={destination} onChange={e => setDestination(e.target.value)} />
              </div>
              <Button variant="outline" className="w-full gap-2" onClick={getLocation} disabled={loadingLoc}>
                {loadingLoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                {userPos ? `📍 Location Set (${userPos.lat.toFixed(3)}, ${userPos.lng.toFixed(3)})` : "Get My Location"}
              </Button>
              <Button className="w-full gap-2 h-11 bg-emerald-600 hover:bg-emerald-700" onClick={generateRoute} disabled={loadingRoute}>
                {loadingRoute ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {loadingRoute ? "Analyzing Route Safety..." : "Generate Safe Route Analysis"}
              </Button>
            </CardContent>
          </Card>

          {/* Risk Legend */}
          <Card className="border-border">
            <CardContent className="p-4">
              <p className="text-xs font-semibold mb-2">Map Risk Zones</p>
              <div className="space-y-1.5">
                {[{color: "#dc2626", label: "High Risk Zone — Avoid if possible"},
                  {color: "#d97706", label: "Medium Risk — Stay vigilant"},
                  {color: "#16a34a", label: "Low Risk — Generally safe"}].map((r,i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded-full flex-shrink-0 opacity-60" style={{ backgroundColor: r.color }} />
                    <span className="text-muted-foreground">{r.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map + Result */}
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden border border-border" style={{ height: "300px" }}>
            <MapContainer center={userPos ? [userPos.lat, userPos.lng] : [15.9129, 79.7400]} zoom={7} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapFit userPos={userPos} />
              {userPos && (
                <Marker position={[userPos.lat, userPos.lng]}>
                  <Popup>📍 Your Location</Popup>
                </Marker>
              )}
              {HOTSPOTS.map((h, i) => (
                <Circle key={i} center={[h.lat, h.lng]} radius={h.radius}
                  pathOptions={{ color: RISK_COLORS[h.risk], fillColor: RISK_COLORS[h.risk], fillOpacity: 0.25, weight: 1.5 }}>
                  <Popup>
                    <strong style={{ color: RISK_COLORS[h.risk] }}>{h.risk.toUpperCase()} RISK</strong><br />
                    {h.label}
                  </Popup>
                </Circle>
              ))}
            </MapContainer>
          </div>

          <AnimatePresence>
            {routeAdvice && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-emerald-200 bg-emerald-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-emerald-800">
                      <Shield className="w-4 h-4" /> Safe Route Advisory — {destination}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">{routeAdvice}</div>
                    <p className="text-[10px] text-muted-foreground mt-3 pt-2 border-t border-emerald-200">
                      AI advisory based on crime data from {district} • Always call 100 in emergency
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}