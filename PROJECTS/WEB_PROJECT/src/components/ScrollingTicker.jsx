import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { fetchSmartCrimeAlerts, subscribeAlertsRealtime } from "@/lib/alertsSync";
import { Link } from "react-router-dom";

const fallbackHelplines = [
  { en: "🚨 AP POLICE EMERGENCY: Dial 100", te: "🚨 AP పోలీసు అత్యవసరం: డయల్ 100" },
  { en: "🛡️ WOMEN SAFETY SHE TEAMS: Dial 181", te: "🛡️ మహిళా భద్రత షీ టీమ్స్: డయల్ 181" },
  { en: "💻 CYBER FRAUD GOLDEN HOUR HELPLINE: Dial 1930", te: "💻 సైబర్ మోసం గోల్డెన్ అవర్ హెల్ప్‌లైన్: డయల్ 1930" },
  { en: "⚖️ NYAYA MITRA: Real-Time Digital Police & Justice Platform", te: "⚖️ న్యాయ మిత్ర: రియల్-టైమ్ డిజిటల్ పోలీసు & న్యాయ వేదిక" }
];

export default function ScrollingTicker() {
  const { lang } = useLanguage();
  const [tickerList, setTickerList] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = useCallback(async () => {
    try {
      const data = await fetchSmartCrimeAlerts();
      if (data && data.length > 0) {
        const formatted = data.map((a) => {
          const sev = (a.severity || "medium").toLowerCase();
          const prefix = sev === "critical"
            ? (lang === "te" ? "🚨 తీవ్రమైన హెచ్చరిక" : "🚨 CRITICAL ALERT")
            : sev === "high"
            ? (lang === "te" ? "🚨 హెచ్చరిక" : "🚨 CRIME ALERT")
            : (lang === "te" ? "📢 పోలీసు సూచన" : "📢 POLICE ADVISORY");

          const dist = a.district && a.district !== "All AP" ? `[${a.district}] ` : "";
          const enText = `${prefix} ${dist}${a.title} — ${a.message}`;
          const teText = a.target_audience?.desc_te
            ? `${prefix} ${dist}${a.target_audience.title_te || a.title} — ${a.target_audience.desc_te}`
            : enText;

          return { en: enText, te: teText };
        });
        setTickerList(formatted);
      } else {
        setTickerList(fallbackHelplines);
      }
    } catch (err) {
      console.warn("[ScrollingTicker] Error loading smart alerts:", err);
      setTickerList(fallbackHelplines);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    loadAlerts();

    let unsubscribe = () => {};
    try {
      unsubscribe = subscribeAlertsRealtime(() => {
        console.log("[ScrollingTicker] Realtime update triggered reloading ticker alerts");
        loadAlerts();
      });
    } catch (err) {
      console.warn("[ScrollingTicker] Realtime subscription failed gracefully:", err);
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
  }, [loadAlerts]);

  const items = tickerList.length > 0 ? tickerList : fallbackHelplines;
  const text = items.map((t) => (lang === "te" ? t.te : t.en)).join("     •     ");

  return (
    <Link
      to="/smart-alerts"
      className="bg-primary text-white overflow-hidden flex items-center hover:opacity-95 transition-opacity cursor-pointer group"
      style={{ height: "36px" }}
      title="Click to view all Smart Crime Alerts"
    >
      <div className="flex-shrink-0 bg-red-600 group-hover:bg-red-700 px-4 h-full flex items-center z-10 shadow-md transition-colors">
        <span className="text-white text-xs font-bold tracking-widest uppercase whitespace-nowrap flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
          {lang === "te" ? "📡 లైవ్ అలెర్ట్స్" : "📡 LIVE ALERTS"}
        </span>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className="ticker-track flex items-center whitespace-nowrap text-xs text-white/95 font-medium tracking-wide">
          <span>{text}</span>
          <span className="mx-8 text-yellow-400 font-bold">•</span>
          <span>{text}</span>
        </div>
      </div>
      <style>{`
        .ticker-track {
          animation: ticker-scroll 22s linear infinite;
        }
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </Link>
  );
}