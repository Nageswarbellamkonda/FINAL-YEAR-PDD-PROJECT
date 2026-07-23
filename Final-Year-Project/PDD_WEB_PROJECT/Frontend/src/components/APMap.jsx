import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AP_POLICE_STATIONS, DISTRICT_CENTERS } from "../data/policeStations";
import { Search, MapPin, Navigation, Phone, X, Locate, Building2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

// Fix leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function stationIcon(isSelected, isNearest) {
  const color = isSelected ? "#1d4ed8" : isNearest ? "#16a34a" : "#1e3a8a";
  const size = isSelected ? 36 : isNearest ? 32 : 28;
  return L.divIcon({
    html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
      <span style="transform:rotate(45deg);font-size:${size < 30 ? 10 : 13}px;">🏢</span>
    </div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

function userIcon() {
  return L.divIcon({
    html: `<div style="background:#ef4444;width:20px;height:20px;border-radius:50%;border:4px solid white;box-shadow:0 0 0 3px rgba(239,68,68,0.4),0 2px 8px rgba(0,0,0,0.3);animation:pulse 2s infinite;"></div>`,
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

const CRIME_HOTSPOTS = [];



const CHECKPOSTS = [
  { lat: 17.65, lng: 83.18, name: "Gajuwaka Checkpost", type: "Checkpost" },
  { lat: 16.53, lng: 80.60, name: "Bhavanipuram Checkpost", type: "Checkpost" }
];

function FlyTo({ lat, lng, zoom = 14 }) {
  const map = useMap();
  useEffect(() => { if (lat && lng) map.flyTo([lat, lng], zoom, { animate: true, duration: 1.2 }); }, [lat, lng]);
  return null;
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function APMap() {
  const [search, setSearch] = useState("");
  const [userLoc, setUserLoc] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [selected, setSelected] = useState(null);
  const [nearest, setNearest] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [mapLayer, setMapLayer] = useState("streets");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapData, setHeatmapData] = useState(CRIME_HOTSPOTS);

  const [showCheckposts, setShowCheckposts] = useState(false);
  const [districtFilter, setDistrictFilter] = useState("All");

  useEffect(() => {
    async function loadHeatmapData() {
      try {
        const { data: dbCases } = await supabase.from('complaints').select('*').limit(200);
        const compsList = dbCases || [];
        
        const dynamicHotspots = compsList
          .filter(c => c.location_coordinates?.lat || c.lat)
          .map(c => ({
            lat: parseFloat(c.location_coordinates?.lat || c.lat),
            lng: parseFloat(c.location_coordinates?.lng || c.lng),
            intensity: 0.9,
            label: `${c.complaint_type || c.category || 'Incident'} — ${c.status || 'Active'}`
          }));

        setHeatmapData(dynamicHotspots);
      } catch (err) {
        console.error("Failed to load map incidents:", err);
      }
    }
    loadHeatmapData();
  }, []);

  const allDistricts = [...new Set(AP_POLICE_STATIONS.map(s => s.district))].sort();
  const districts = ["All", ...allDistricts];

  const filteredStations = AP_POLICE_STATIONS.filter(s => {
    if (!s || s.lat == null || s.lng == null) return false;
    const matchesDistrict = districtFilter === "All" || s.district === districtFilter;
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.district.toLowerCase().includes(search.toLowerCase());
    return matchesDistrict && matchesSearch;
  });

  const getLocation = () => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(loc);
        setFlyTarget({ ...loc, zoom: 13 });
        // Find nearest station
        let minDist = Infinity, nearestStation = null;
        AP_POLICE_STATIONS.forEach(s => {
          const d = haversine(loc.lat, loc.lng, s.lat, s.lng);
          if (d < minDist) { minDist = d; nearestStation = { ...s, distKm: d.toFixed(1) }; }
        });
        setNearest(nearestStation);
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true }
    );
  };

  const handleStationClick = (station) => {
    setSelected(station);
    setFlyTarget({ lat: station.lat, lng: station.lng, zoom: 15 });
  };

  const getDirections = (station) => {
    if (userLoc) {
      window.open(`https://www.google.com/maps/dir/${userLoc.lat},${userLoc.lng}/${station.lat},${station.lng}`, "_blank");
    } else {
      window.open(`https://www.google.com/maps/search/${encodeURIComponent(station.name + ' ' + station.district)}`, "_blank");
    }
  };

  const tileUrls = {
    streets: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    dark: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-lg ap-map-container">
      {/* Back button + fullscreen */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-800">
        <button onClick={() => window.history.back()} className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-medium transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <span className="text-white/40 text-xs flex-1">Andhra Pradesh Police Stations Map</span>
        <button onClick={() => { const el = document.querySelector('.ap-map-container'); if (el?.requestFullscreen) el.requestFullscreen(); }} className="text-white/70 hover:text-white text-xs">
          ⛶ Fullscreen
        </button>
        <button onClick={() => { setFlyTarget({ lat: 16.5, lng: 80.6, zoom: 6 }); setSelected(null); }} className="text-white/70 hover:text-white text-xs">
          🔄 Reset
        </button>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1d4ed8] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <MapPin className="w-5 h-5 text-white shrink-0" />
            <h2 className="text-white font-heading font-bold text-base truncate">Andhra Pradesh Police — Interactive Map</h2>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {Object.keys(tileUrls).map(layer => (
              <button key={layer} onClick={() => setMapLayer(layer)}
                className={`px-2 py-1 rounded text-xs font-medium transition capitalize ${mapLayer === layer ? "bg-white text-[#1e3a8a]" : "bg-white/15 text-white hover:bg-white/25"}`}>
                {layer}
              </button>
            ))}
            <button onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-2 py-1 rounded text-xs font-medium transition ${showHeatmap ? "bg-orange-400 text-white" : "bg-white/15 text-white hover:bg-white/25"}`}>
              🔥 Heatmap
            </button>

            <button onClick={() => setShowCheckposts(!showCheckposts)}
              className={`px-2 py-1 rounded text-xs font-medium transition ${showCheckposts ? "bg-sky-500 text-white" : "bg-white/15 text-white hover:bg-white/25"}`}>
              🚧 Checkposts
            </button>
          </div>
        </div>

        {/* Search + Filter Row */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/60" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search station or district..."
              className="w-full pl-8 pr-3 py-1.5 bg-white/15 text-white placeholder-white/60 rounded-lg text-xs border border-white/20 focus:outline-none focus:bg-white/20"
            />
          </div>
          <select value={districtFilter} onChange={e => { setDistrictFilter(e.target.value); if (e.target.value !== "All") setFlyTarget({ ...DISTRICT_CENTERS[e.target.value], zoom: 10 }); }}
            className="bg-white/15 text-white rounded-lg px-2 py-1.5 text-xs border border-white/20 focus:outline-none">
            {districts.map(d => <option key={d} value={d} className="text-slate-800">{d}</option>)}
          </select>
          <button onClick={getLocation} disabled={gpsLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-medium transition border border-white/20">
            <Locate className={`w-3.5 h-3.5 ${gpsLoading ? "animate-spin" : ""}`} />
            {gpsLoading ? "Locating..." : "My Location"}
          </button>
        </div>
      </div>

      {/* Nearest Station Banner */}
      {nearest && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-green-600 text-white px-4 py-2 flex items-center gap-2 text-sm">
          <Building2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">Nearest: {nearest.name}</span>
          <span className="text-green-200">({nearest?.distKm} km away)</span>
          <button onClick={() => handleStationClick(nearest)} className="ml-auto text-xs underline hover:no-underline">View on map →</button>
          <button onClick={() => getDirections(nearest)} className="text-xs bg-white/20 px-2 py-0.5 rounded hover:bg-white/30 flex items-center gap-1">
            <Navigation className="w-3 h-3" /> Navigate
          </button>
        </motion.div>
      )}

      {/* Map */}
      <div style={{ height: "440px" }}>
        <MapContainer center={[15.9, 79.5]} zoom={7} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
          <TileLayer url={tileUrls[mapLayer]} attribution="&copy; OpenStreetMap contributors &copy; CARTO" maxZoom={19} />

          {flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} zoom={flyTarget.zoom} />}

          {/* Crime Heatmap Circles */}
          {showHeatmap && heatmapData.map((h, i) => (
            <CircleMarker key={`heatmap-${i}`} center={[h.lat, h.lng]}
              radius={30 + (h.intensity || 0.5) * 30}
              pathOptions={{
                color: "transparent",
                fillColor: (h.intensity || 0.5) > 0.7 ? "#dc2626" : (h.intensity || 0.5) > 0.5 ? "#f97316" : "#eab308",
                fillOpacity: 0.25,
              }}>
              <Popup><div className="text-xs font-medium">{h.label}</div></Popup>
            </CircleMarker>
          ))}


          {/* Checkposts */}
          {showCheckposts && CHECKPOSTS.map((h, i) => (
            <Marker key={`checkpost-${i}`} position={[h.lat, h.lng]}>
              <Popup><div className="text-xs font-medium text-sky-700">🚧 {h.name}</div></Popup>
            </Marker>
          ))}

          {/* Police Station Markers */}
          {filteredStations.map((station, idx) => (
            <Marker
              key={station.id || `station-${idx}`}
              position={[station.lat, station.lng]}
              icon={stationIcon(selected?.id === station.id, nearest?.id === station.id)}
              eventHandlers={{ click: () => handleStationClick(station) }}
            >
              <Popup maxWidth={280}>
                <div className="min-w-[220px] font-sans">
                  <div className="font-bold text-sm text-blue-800 mb-0.5">🏢 {station.name}</div>
                  <div className="text-xs text-gray-600 mb-0.5">📍 {station.address}</div>
                  <div className="text-xs text-gray-500 mb-2">{station.circle}, {station.district}</div>
                  <a href={`tel:${station.phone}`} className="flex items-center gap-1 text-xs text-blue-600 font-medium mb-2 hover:underline">
                    <Phone className="w-3 h-3" /> {station.phone}
                  </a>
                  <button onClick={() => getDirections(station)}
                    className="w-full flex items-center justify-center gap-1.5 bg-blue-700 text-white rounded px-2 py-1.5 text-xs font-medium hover:bg-blue-800">
                    <Navigation className="w-3 h-3" /> Get Directions
                  </button>
                  {nearest?.id === station.id && (
                    <div className="mt-1.5 text-center text-xs text-green-700 font-medium bg-green-50 rounded py-0.5">
                      ✅ Nearest to you ({nearest?.distKm} km)
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* User Location */}
          {userLoc && (
            <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon()}>
              <Popup>
                <div className="text-xs font-medium text-red-700">📍 Your Location</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{userLoc.lat.toFixed(5)}, {userLoc.lng.toFixed(5)}</div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Selected Station Detail Panel */}
      {selected && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 border-t border-border bg-gradient-to-r from-blue-50 to-slate-50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-heading font-bold text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> {selected.name}
              </h3>
              <p className="text-sm text-muted-foreground">{selected.address}</p>
              <p className="text-xs text-muted-foreground">{selected.circle} • {selected.district} District</p>
              <a href={`tel:${selected.phone}`} className="text-sm text-primary font-semibold mt-1 flex items-center gap-1 hover:underline">
                <Phone className="w-3.5 h-3.5" /> {selected.phone}
              </a>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button onClick={() => getDirections(selected)}
                className="flex items-center gap-1.5 bg-primary text-white rounded-lg px-3 py-2 text-xs font-medium hover:bg-primary/90 transition">
                <Navigation className="w-3.5 h-3.5" /> Navigate
              </button>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs justify-center">
                <X className="w-3.5 h-3.5" /> Close
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Footer Legend */}
      <div className="px-4 py-2 bg-slate-50 border-t border-border flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">🔵 Police Station</span>
        <span className="flex items-center gap-1.5">🟢 Nearest Station</span>
        <span className="flex items-center gap-1.5">🔴 Your Location</span>
        {showHeatmap && <>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500/60 inline-block" /> High Crime</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-400/60 inline-block" /> Medium</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-400/60 inline-block" /> Low</span>
        </>}
        <span className="ml-auto">{filteredStations.length} stations shown</span>
      </div>
    </div>
  );
}