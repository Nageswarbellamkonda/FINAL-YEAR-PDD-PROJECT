import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { MapPin, CheckCircle2, AlertTriangle, Loader2, Clock, Calendar, Shield, ArrowLeft, XCircle, Navigation, RefreshCw } from "lucide-react";
import { STATES_DATA } from "../data/policeStations";

// Lock to AP Pilot Districts only
const AP_ONLY_DATA = STATES_DATA["Andhra Pradesh"];
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import moment from "moment";

// Haversine distance in meters
function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Known AP police station coordinates (lat, lng)
const STATION_COORDS = {
  "gajuwaka ps": { lat: 17.6789, lng: 83.2083 },
  "bheemunipatnam ps": { lat: 17.8903, lng: 83.4582 },
  "town ps visakhapatnam": { lat: 17.6916, lng: 83.2132 },
  "dwaraka nagar ps": { lat: 17.7284, lng: 83.3153 },
  "mvp colony ps": { lat: 17.7425, lng: 83.3334 },
  "rushikonda ps": { lat: 17.7734, lng: 83.3789 },
  "anakapalli ps": { lat: 17.6912, lng: 82.9985 },
  "vijayawada town ps": { lat: 16.5062, lng: 80.6480 },
  "benz circle ps": { lat: 16.5193, lng: 80.6311 },
  "auto nagar ps": { lat: 16.5134, lng: 80.6023 },
  "guntur town ps": { lat: 16.3067, lng: 80.4365 },
  "brodipet ps": { lat: 16.3015, lng: 80.4402 },
  "arundelpet ps": { lat: 16.3062, lng: 80.4523 },
  "mangalagiri ps": { lat: 16.4296, lng: 80.5567 },
  "tenali ps": { lat: 16.2424, lng: 80.6404 },
  "tirupati urban ps": { lat: 13.6288, lng: 79.4192 },
  "nellore town ps": { lat: 14.4426, lng: 79.9865 },
  "kurnool town ps": { lat: 15.8281, lng: 78.0373 },
  "rajahmundry town ps": { lat: 17.0005, lng: 81.8040 },
  "kakinada urban ps": { lat: 16.9342, lng: 82.2475 },
  "ongole town ps": { lat: 15.5057, lng: 80.0499 },
  "kadapa town ps": { lat: 14.4673, lng: 78.8242 },
  "anantapur town ps": { lat: 14.6819, lng: 77.6006 },
  "srikakulam town ps": { lat: 18.2949, lng: 83.8938 },
  "vizianagaram town ps": { lat: 18.1066, lng: 83.3956 },
  "eluru urban ps": { lat: 16.7107, lng: 81.0952 },
  "machilipatnam town ps": { lat: 16.1875, lng: 81.1389 },
  "chittoor town ps": { lat: 13.2172, lng: 79.1003 },
  // District HQ fallbacks
  "visakhapatnam": { lat: 17.6868, lng: 83.2185 },
  "east godavari": { lat: 17.0, lng: 81.8 },
  "west godavari": { lat: 16.9, lng: 81.35 },
  "krishna": { lat: 16.55, lng: 80.65 },
  "guntur": { lat: 16.3, lng: 80.45 },
  "prakasam": { lat: 15.5, lng: 79.8 },
  "nellore": { lat: 14.45, lng: 79.98 },
  "chittoor": { lat: 13.6, lng: 79.1 },
  "ysr kadapa": { lat: 14.47, lng: 78.82 },
  "kurnool": { lat: 15.83, lng: 78.05 },
  "anantapur": { lat: 14.68, lng: 77.6 },
  "srikakulam": { lat: 18.3, lng: 83.9 },
  "vizianagaram": { lat: 18.1, lng: 83.4 },
};

// Build flat lookup from STATES_DATA
const STATION_COORDS_MAP = {};
Object.entries(STATES_DATA).forEach(([state, sd]) => {
  Object.entries(sd.districts).forEach(([district, dd]) => {
    Object.entries(dd.circles).forEach(([circle, cd]) => {
      Object.entries(cd.mandals).forEach(([mandal, stations]) => {
        stations.forEach(st => {
          STATION_COORDS_MAP[st.name.toLowerCase()] = { lat: st.lat, lng: st.lng, name: st.name, district, phone: st.phone };
        });
      });
    });
  });
});

function findStationCoords(stationName) {
  const lower = (stationName || "").toLowerCase().trim();
  if (STATION_COORDS_MAP[lower]) return STATION_COORDS_MAP[lower];
  for (const key of Object.keys(STATION_COORDS_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return STATION_COORDS_MAP[key];
  }
  return null;
}

// Build hierarchical dropdown — AP Pilot Districts only (no state selector)
const AP_DISTRICTS = Object.keys(AP_ONLY_DATA?.districts || {});
function getCircles(district) { return district ? Object.keys(AP_ONLY_DATA?.districts?.[district]?.circles || {}) : []; }
function getMandals(district, circle) { return (district && circle) ? Object.keys(AP_ONLY_DATA?.districts?.[district]?.circles?.[circle]?.mandals || {}) : []; }
function getStations(district, circle, mandal) {
  if (!district || !circle || !mandal) return [];
  return AP_ONLY_DATA?.districts?.[district]?.circles?.[circle]?.mandals?.[mandal] || [];
}

const ATTENDANCE_RADIUS_METERS = 100;
const shifts = ["morning", "afternoon", "evening", "night"];
const shiftLabels = { morning: "🌅 Morning (6AM-2PM)", afternoon: "☀️ Afternoon (2PM-10PM)", evening: "🌆 Evening (6PM-10PM)", night: "🌙 Night (10PM-6AM)" };

export default function AttendanceSystem() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [shift, setShift] = useState("morning");
  const [gpsLocation, setGpsLocation] = useState(null);
  const [stationCoords, setStationCoords] = useState(null);
  const [distance, setDistance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [locationError, setLocationError] = useState(null);
  // Hierarchical station selector — AP only, no state
  const [selDistrict, setSelDistrict] = useState("");
  const [selCircle, setSelCircle] = useState("");
  const [selMandal, setSelMandal] = useState("");
  const [selStation, setSelStation] = useState("");

  const handleStationSelect = (stationName) => {
    setSelStation(stationName);
    const coords = findStationCoords(stationName);
    setStationCoords(coords);
    setDistance(null);
    setGpsLocation(null);
  };

  const { user: authUser, profile } = useAuth();

  useEffect(() => { loadData(); }, [authUser, profile]);

  const loadData = async () => {
    const me = profile ?? authUser ?? null;
    setUser(me);
    const utype = me?.user_type || me?.role || "";
    if (!["police", "special", "si", "ci", "dsp", "sp", "dig", "ig", "dgp", "she_teams"].includes(utype)) {
      setLoading(false);
      return;
    }
    // Find station coordinates
    const coords = findStationCoords(me?.station, me?.district);
    setStationCoords(coords);
    // Load today's attendance
    const today = moment().format("YYYY-MM-DD");
    const { data: records = [] } = await supabase.from('attendances').select('*').eq('officer_email', me?.email).order('created_at', { ascending: false }).limit(30);
    setAttendanceHistory(records);
    const todayRec = records.find(r => moment(r.marked_at).format("YYYY-MM-DD") === today);
    setTodayRecord(todayRec || null);
    setLoading(false);
  };

  const getLocation = () => {
    setGpsLoading(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported on this device");
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
        setGpsLocation(loc);
        if (stationCoords) {
          const dist = calcDistance(loc.lat, loc.lng, stationCoords.lat, stationCoords.lng);
          setDistance(Math.round(dist));
        }
        setGpsLoading(false);
      },
      (err) => {
        setLocationError("Could not get your location: " + err.message);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const markAttendance = async () => {
    if (!gpsLocation) { toast.error("Please get your GPS location first"); return; }
    if (!stationCoords) { toast.error("Your station coordinates are not registered. Contact admin."); return; }
    if (distance > ATTENDANCE_RADIUS_METERS) {
      toast.error(`You are ${distance}m away from your station. Must be within ${ATTENDANCE_RADIUS_METERS}m.`);
      return;
    }
    if (todayRecord) { toast.error("Attendance already marked for today"); return; }

    setMarking(true);
    const now = new Date().toISOString();
    const isLate = checkIfLate(shift, now);
    await supabase.from('attendances').insert([{
      officer_email: user.email,
      officer_name: user.full_name || user.email,
      station: effectiveStation || "Unknown",
      district: user.district || "Unknown",
      shift,
      status: isLate ? "late" : "present",
      marked_at: now,
      latitude: gpsLocation.lat,
      longitude: gpsLocation.lng,
      distance_meters: distance,
      location_verified: true,
      role: user.user_type || user.role || "officer",
      remarks: `Marked via GPS. Accuracy: ${Math.round(gpsLocation.accuracy || 0)}m`,
    }]);
    toast.success("✅ Attendance marked successfully!");
    setMarking(false);
    loadData();
  };

  function checkIfLate(shift, isoDate) {
    const hour = new Date(isoDate).getHours();
    if (shift === "morning") return hour > 6;
    if (shift === "afternoon") return hour > 14;
    if (shift === "evening") return hour > 18;
    if (shift === "night") return hour > 22;
    return false;
  }

  const withinRadius = distance !== null && distance <= ATTENDANCE_RADIUS_METERS;
  const effectiveStation = selStation || user?.station || "";

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const isOfficer = ["police", "special", "si", "ci", "dsp", "sp", "dig", "ig", "dgp", "she_teams", "admin"].includes((user?.user_type || user?.role || "").toLowerCase());

  if (!isOfficer) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <Shield className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="font-heading font-bold text-xl mb-2">Officers Only</h2>
        <p className="text-muted-foreground mb-4">Attendance system is available for police officers only.</p>
        <Button asChild variant="outline"><Link to="/dashboard">Back to Dashboard</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Button asChild variant="ghost" size="sm"><Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link></Button>
        <div className="flex-1">
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" /> GPS Attendance System
          </h1>
          <p className="text-muted-foreground text-sm">Strictly within 100m of selected police station • GPS verified</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      {/* Officer Info Card */}
      <Card className="mb-5 border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center">
          <div className="flex-1">
            <p className="font-semibold">{user?.full_name || "Officer"}</p>
            <p className="text-sm text-muted-foreground">{(user?.user_type || user?.role || "").toUpperCase()} • {user?.designation || ""} • {user?.station || "No station set"}</p>
            <p className="text-xs text-muted-foreground">{user?.district || "No district"} District • Badge: {user?.badge_number || "N/A"}</p>
          </div>
          {todayRecord ? (
            <Badge className="bg-green-600 text-white">✅ Present Today ({todayRecord.shift})</Badge>
          ) : (
            <Badge variant="outline" className="text-orange-600 border-orange-300">⏳ Not Marked Today</Badge>
          )}
        </CardContent>
      </Card>

      {/* Hierarchical Station Selector */}
      <Card className="mb-5 border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-600" /> Select Your Duty Station
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="bg-blue-100 rounded-lg px-3 py-2 text-xs text-blue-800 font-medium mb-2">
            📍 AP Pilot Districts: Visakhapatnam · Vijayawada (Krishna) · Guntur · Nellore · Tirupati (Chittoor)
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {/* District */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">District</label>
              <Select value={selDistrict} onValueChange={v => { setSelDistrict(v); setSelCircle(""); setSelMandal(""); handleStationSelect(""); }}>
                <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Select District" /></SelectTrigger>
                <SelectContent>{AP_DISTRICTS.map(d => <SelectItem key={d} value={d}>{d === "Krishna" ? "Vijayawada (Krishna)" : d === "Chittoor" ? "Tirupati (Chittoor)" : d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Circle */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Circle</label>
              <Select value={selCircle} onValueChange={v => { setSelCircle(v); setSelMandal(""); handleStationSelect(""); }} disabled={!selDistrict}>
                <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Select Circle" /></SelectTrigger>
                <SelectContent>{getCircles(selDistrict).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Mandal */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Mandal / Area</label>
              <Select value={selMandal} onValueChange={v => { setSelMandal(v); handleStationSelect(""); }} disabled={!selCircle}>
                <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Select Mandal" /></SelectTrigger>
                <SelectContent>{getMandals(selDistrict, selCircle).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {/* Police Station */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Police Station *</label>
            <Select value={selStation} onValueChange={handleStationSelect} disabled={!selMandal}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select Police Station" /></SelectTrigger>
              <SelectContent>
                {getStations(selDistrict, selCircle, selMandal).map(st => (
                  <SelectItem key={st.name} value={st.name}>{st.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {stationCoords && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs">
              <p className="text-green-800 font-semibold">✅ Station: {effectiveStation}</p>
              <p className="text-green-700">📍 Coords: {stationCoords.lat.toFixed(5)}, {stationCoords.lng.toFixed(5)}</p>
              <p className="text-green-600">📞 {stationCoords.phone || "N/A"}</p>
              <p className="text-blue-700 font-medium mt-1">⚠️ You must be within {ATTENDANCE_RADIUS_METERS}m of this station to mark attendance.</p>
            </div>
          )}
          {!stationCoords && selStation && (
            <p className="text-orange-600 text-xs flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Coordinates not found for this station. Contact admin.</p>
          )}
        </CardContent>
      </Card>

      {/* Mark Attendance */}
      {!todayRecord && (
        <Card className="mb-5">
          <CardHeader>
            <CardTitle className="text-base">Mark Today's Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Shift Select */}
            <div>
              <label className="text-sm font-medium mb-2 block">Select Shift *</label>
              <div className="grid grid-cols-2 gap-2">
                {shifts.map(s => (
                  <button key={s} onClick={() => setShift(s)}
                    className={`p-3 rounded-xl border text-sm font-medium text-left transition ${shift === s ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50"}`}>
                    {shiftLabels[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Get Location */}
            <div>
              <Button onClick={getLocation} disabled={gpsLoading} variant="outline" className="w-full gap-2">
                {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                {gpsLoading ? "Getting Location..." : "Get My Current Location"}
              </Button>
              {locationError && (
                <p className="text-destructive text-xs mt-2 flex items-center gap-1"><XCircle className="w-3 h-3" /> {locationError}</p>
              )}
            </div>

            {/* Location Result */}
            {gpsLocation && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl p-4 border-2 ${withinRadius ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"}`}>
                <div className="flex items-center gap-2 mb-2">
                  {withinRadius ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                  <span className={`font-semibold text-sm ${withinRadius ? "text-green-700" : "text-red-700"}`}>
                    {withinRadius ? `✅ Within range! (${distance}m from station)` : `❌ Too far! (${distance}m — need within ${ATTENDANCE_RADIUS_METERS}m)`}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Your GPS: {gpsLocation.lat.toFixed(5)}, {gpsLocation.lng.toFixed(5)}</p>
                <p className="text-xs text-muted-foreground">Accuracy: ±{Math.round(gpsLocation.accuracy || 0)}m</p>
              </motion.div>
            )}

            <Button onClick={markAttendance} disabled={!gpsLocation || !withinRadius || marking || !stationCoords}
              className="w-full h-12 text-base gap-2">
              {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {marking ? "Marking Attendance..." : "Mark Attendance"}
            </Button>
            {gpsLocation && !withinRadius && (
              <p className="text-center text-xs text-red-600">⚠️ You must physically be at your station ({user?.station}) to mark attendance.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Today marked success */}
      {todayRecord && (
        <Card className="mb-5 border-green-300 bg-green-50">
          <CardContent className="p-5 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <p className="font-semibold text-green-800">Attendance Marked for Today!</p>
            <p className="text-sm text-green-700 mt-1">
              {shiftLabels[todayRecord.shift]} • {moment(todayRecord.marked_at).format("hh:mm A")} • {todayRecord.distance_meters}m from station
            </p>
            <Badge className={`mt-2 ${todayRecord.status === "present" ? "bg-green-600" : "bg-yellow-600"} text-white`}>
              {todayRecord.status?.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Attendance History (Last 30 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceHistory.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">No attendance records found</p>
          ) : (
            <div className="space-y-2">
              {attendanceHistory.map(r => (
                <div key={r.id} className="flex items-center justify-between border border-border rounded-lg p-3 text-sm">
                  <div>
                    <p className="font-medium">{moment(r.marked_at).format("ddd, DD MMM YYYY")}</p>
                    <p className="text-xs text-muted-foreground">{shiftLabels[r.shift]} • {r.station} • {r.distance_meters}m</p>
                  </div>
                  <Badge className={r.status === "present" ? "bg-green-100 text-green-700 border-green-300" : r.status === "late" ? "bg-yellow-100 text-yellow-700 border-yellow-300" : "bg-red-100 text-red-700 border-red-300"} variant="outline">
                    {r.status?.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}