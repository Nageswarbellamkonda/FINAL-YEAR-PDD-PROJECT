import { useState, useEffect, useCallback } from "react";
import { fetchPublicNotices, subscribeAlertsRealtime } from "@/lib/alertsSync";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ChevronDown, ChevronUp, AlertTriangle, Search, Star, TreePine, MapPin, ShieldAlert, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function NoticeBoard() {
  const { lang } = useLanguage();
  
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState("all");
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotices = useCallback(async () => {
    try {
      const data = await fetchPublicNotices();
      const mapped = (data || []).map((n) => {
        const type = (n.target_audience?.notice_type || n.alert_type || 'advisory').toLowerCase();
        const sev = (n.severity || 'medium').toLowerCase();

        let badge = n.target_audience?.badge;
        let badgeColor = "bg-blue-100 text-blue-700";
        let color = "bg-blue-50 border-blue-200 text-blue-800";
        let iconColor = "text-blue-600";

        if (type === "missing") {
          badge = badge || "MISSING PERSON";
          badgeColor = "bg-blue-100 text-blue-700";
          color = "bg-blue-50 border-blue-200 text-blue-800";
          iconColor = "text-blue-600";
        } else if (type === "reward") {
          badge = badge || "REWARD ANNOUNCED";
          badgeColor = "bg-amber-100 text-amber-800";
          color = "bg-amber-50 border-amber-200 text-amber-800";
          iconColor = "text-amber-600";
        } else if (type === "naxal" || sev === "critical" || type === "emergency") {
          badge = badge || (sev === "critical" ? "CRITICAL ALERT" : "EMERGENCY");
          badgeColor = "bg-red-100 text-red-700";
          color = "bg-red-50 border-red-200 text-red-800";
          iconColor = "text-red-600";
        } else if (type === "forest") {
          badge = badge || "FOREST ADVISORY";
          badgeColor = "bg-emerald-100 text-emerald-700";
          color = "bg-emerald-50 border-emerald-200 text-emerald-800";
          iconColor = "text-emerald-600";
        } else {
          badge = badge || (n.alert_type ? n.alert_type.toUpperCase().replace('_', ' ') : "PUBLIC NOTICE");
          badgeColor = "bg-slate-100 text-slate-700";
          color = "bg-slate-50 border-slate-200 text-slate-800";
          iconColor = "text-primary";
        }

        return {
          id: n.id,
          type,
          district: n.district || "All AP",
          titleEn: n.title,
          titleTe: n.target_audience?.title_te || n.title,
          descEn: n.message,
          descTe: n.target_audience?.desc_te || n.message,
          badge,
          badgeColor,
          color,
          iconColor,
          date: n.created_at ? n.created_at.split('T')[0] : ''
        };
      });

      setNotices(mapped);
      setError(null);
    } catch (err) {
      console.error("[NoticeBoard] Failed to load notices:", err);
      setError("Failed to load public notices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotices();
    // Subscribe to realtime database changes & broadcasts safely
    let unsubscribe = () => {};
    try {
      unsubscribe = subscribeAlertsRealtime(() => {
        console.log("[NoticeBoard] Realtime update triggered reloading notices");
        loadNotices();
      });
    } catch (err) {
      console.warn("[NoticeBoard] Realtime subscription failed gracefully:", err);
    }

    return () => {
      if (typeof unsubscribe === "function") {
        try {
          unsubscribe();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [loadNotices]);

  const getIcon = (type) => {
    switch (type) {
      case "missing": return Search;
      case "reward": return Star;
      case "naxal":
      case "emergency": return AlertTriangle;
      case "forest": return TreePine;
      case "crime_alert": return ShieldAlert;
      default: return Bell;
    }
  };

  const filters = [
    { key: "all", label: lang === "te" ? "అన్నీ" : "All" },
    { key: "missing", label: lang === "te" ? "నాపత్తా" : "Missing" },
    { key: "reward", label: lang === "te" ? "బహుమతి" : "Rewards" },
    { key: "emergency", label: lang === "te" ? "అత్యవసరం" : "Emergency" },
    { key: "advisory", label: lang === "te" ? "సూచనలు" : "Advisories" },
  ];

  const filtered = filter === "all"
    ? notices
    : notices.filter((n) => {
        if (n.type === filter) return true;
        if (filter === "emergency" && (n.type === "naxal" || n.type === "emergency" || n.type === "crime_alert")) return true;
        if (filter === "advisory" && (n.type === "advisory" || n.type === "forest" || n.type === "cyber_crime")) return true;
        return false;
      });

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
              {lang === "te" ? "AP పోలీసు పబ్లిక్ నోటీసు బోర్డు" : "AP Police Public Notice Board"}
            </h2>
            <p className="text-white/70 text-xs">
              {lang === "te" ? "DSP ద్వారా ప్రత్యక్షంగా ప్రచురించబడిన నోటీసులు" : "Official district & public advisories published by DSP"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full animate-pulse tracking-wide flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
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

      {/* Notices List */}
      <div className="divide-y divide-border max-h-[440px] overflow-y-auto">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs">Loading public notices...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            <p className="text-red-500 mb-1">{error}</p>
            <button onClick={loadNotices} className="text-xs text-primary underline">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">
            <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="font-medium text-foreground">No active public notices in this category</p>
            <p className="text-xs text-muted-foreground mt-1">Check back later for newly published notices from the District Police.</p>
          </div>
        ) : (
          filtered.map((notice) => {
            const Icon = getIcon(notice.type);
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
                          className="text-xs text-muted-foreground mt-2 leading-relaxed overflow-hidden whitespace-pre-wrap"
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