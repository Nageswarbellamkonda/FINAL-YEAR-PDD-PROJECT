import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ChevronDown, ChevronUp, AlertTriangle, Search, Star, TreePine, MapPin } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const defaultNotices = [
  {
    id: 1,
    type: "missing",
    icon: Search,
    color: "bg-blue-50 border-blue-200 text-blue-800",
    iconColor: "text-blue-600",
    badge: "MISSING PERSON",
    badgeColor: "bg-blue-100 text-blue-700",
    district: "Visakhapatnam",
    titleEn: "Missing: Ravi Kumar, 34 yrs — Visakhapatnam",
    titleTe: "నాపత్తా: రవి కుమార్, 34 సం. — విశాఖపట్నం",
    descEn: "Missing since 15-Mar-2026. Last seen near Rythu Bazaar, Gajuwaka. Height: 5'7\", fair complexion. Contact: 0891-2888100 or nearest police station.",
    descTe: "15-మార్చ్-2026 నుండి నాపత్తా. చివరిగా గాజువాక రైతు బజార్ సమీపంలో చూశారు. ఎత్తు: 5'7\". సంప్రదించండి: 0891-2888100.",
    date: "2026-03-20",
  },
  {
    id: 2,
    type: "reward",
    icon: Star,
    color: "bg-yellow-50 border-yellow-200 text-yellow-800",
    iconColor: "text-yellow-600",
    badge: "REWARD ANNOUNCED",
    badgeColor: "bg-yellow-100 text-yellow-700",
    district: "Kurnool",
    titleEn: "₹50,000 Reward — Information on Kurnool Bank Robbery Suspects",
    titleTe: "₹50,000 బహుమతి — కర్నూలు బ్యాంక్ దోపిడీ నిందితులపై సమాచారానికి",
    descEn: "AP Police announces ₹50,000 reward for credible information leading to arrest of 3 suspects in State Bank robbery at Nandyal, Kurnool. Informers identity protected. Call: 1090.",
    descTe: "నందాల, కర్నూలులో స్టేట్ బ్యాంక్ దోపిడీలో 3 నిందితుల అరెస్ట్ కు దారితీసే నమ్మకమైన సమాచారానికి AP పోలీసులు ₹50,000 బహుమతి ప్రకటిస్తున్నారు. కాల్: 1090.",
    date: "2026-03-18",
  }
];

export default function NoticeBoard() {
  const { lang } = useLanguage();
  
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState("all");
  const [notices, setNotices] = useState(defaultNotices);
  
  // Load dynamic notices
  useRealtimeSync(['public_notices'], () => {
    loadNotices();
  });

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      const { data, error } = await supabase.from('public_notices').select('*').order('created_at', { ascending: false });
      if (data && !error) {
        // Map snake_case from DB to camelCase used in UI
        const mapped = data.map(n => ({
          id: n.id,
          type: n.type,
          district: n.district,
          titleEn: n.title_en,
          titleTe: n.title_te || n.title_en,
          descEn: n.desc_en,
          descTe: n.desc_te || n.desc_en,
          badge: n.badge,
          badgeColor: n.badge_color,
          color: n.color,
          iconColor: n.icon_color,
          date: n.created_at?.split('T')[0]
        }));
        setNotices([...mapped, ...defaultNotices]);
      }
    } catch (err) {
      console.error("Failed to load public notices:", err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "missing": return Search;
      case "reward": return Star;
      case "naxal": return AlertTriangle;
      case "forest": return TreePine;
      default: return Bell;
    }
  };

  const filters = [
    { key: "all", label: lang === "te" ? "అన్నీ" : "All" },
    { key: "missing", label: lang === "te" ? "నాపత్తా" : "Missing" },
    { key: "reward", label: lang === "te" ? "బహుమతి" : "Rewards" },
    { key: "naxal", label: lang === "te" ? "నక్సల్" : "Naxal Alert" },
    { key: "forest", label: lang === "te" ? "అడవి" : "Forest" },
  ];

  const filtered = filter === "all" ? notices : notices.filter((n) => n.type === filter);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden relative">
      {/* Header */}
      <div className="bg-primary px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-heading font-bold text-base">
              {lang === "te" ? "AP పోలీసు నోటీసు బోర్డు" : "AP Police Public Notice Board"}
            </h2>
            <p className="text-white/70 text-xs">
              {lang === "te" ? "13 జిల్లాల్లో పబ్లిక్ సూచనలు" : "Public advisories & alerts"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-secondary text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse tracking-wide">
            LIVE
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 border-b border-border flex gap-2 overflow-x-auto scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
              filter === f.key
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notices */}
      <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No notices found for this category.</div>
        ) : (
          filtered.map((notice) => {
            const Icon = notice.icon || getIcon(notice.type);
            const isOpen = expanded === notice.id;
            return (
              <motion.div
                key={notice.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 cursor-pointer hover:bg-muted/30 transition ${isOpen ? "bg-muted/20" : ""}`}
                onClick={() => setExpanded(isOpen ? null : notice.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${notice.color}`}>
                    <Icon className={`w-4 h-4 ${notice.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${notice.badgeColor}`}>
                        {notice.badge}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MapPin className="w-3 h-3" />{notice.district}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{notice.date}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground leading-snug">
                      {lang === "te" ? notice.titleTe : notice.titleEn}
                    </p>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="text-xs text-muted-foreground mt-2 leading-relaxed overflow-hidden"
                        >
                          {lang === "te" ? notice.descTe : notice.descEn}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

    </div>
  );
}