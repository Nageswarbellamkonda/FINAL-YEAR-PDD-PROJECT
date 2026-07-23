import { useLanguage } from "../lib/LanguageContext";

const tickerItems = [
  { en: "🚨 ALERT: Cyber fraud cases rising — Never share OTP | Helpline: 1930", te: "🚨 హెచ్చరిక: సైబర్ మోసం కేసులు పెరుగుతున్నాయి — ఎప్పుడూ OTP షేర్ చేయవద్దు | హెల్ప్‌లైన్: 1930" },
  { en: "📢 MISSING: Ravi Kumar (34), Visakhapatnam — Contact: 0891-2888100", te: "📢 నాపత్తా: రవి కుమార్ (34), విశాఖపట్నం — సంప్రదించండి: 0891-2888100" },
  { en: "⭐ REWARD ₹1,00,000 for information on Krishna district vehicle theft case — Call: 100", te: "⭐ కృష్ణా జిల్లా వాహన దొంగతనం కేసులో సమాచారానికి ₹1,00,000 బహుమతి — కాల్: 100" },
  { en: "🌿 Advisory: Avoid isolated routes in Nallamala forest — Emergency: 100", te: "🌿 సూచన: నల్లమల అడవిలో ఒంటరి మార్గాలు నివారించండి — అత్యవసరం: 100" },
  { en: "👩 SHE Teams 24/7 active in all 13 AP districts — Women helpline: 181", te: "👩 షీ టీమ్స్ అన్ని 13 AP జిల్లాల్లో 24/7 క్రియాశీలంగా ఉన్నాయి — మహిళా హెల్ప్‌లైన్: 181" },
  { en: "💊 Report drug activity anonymously — AP Narcotics Helpline: 1800-425-5555", te: "💊 మాదకద్రవ్య కార్యకలాపాలను అనామకంగా నివేదించండి — AP నార్కోటిక్స్ హెల్ప్‌లైన్: 1800-425-5555" },
  { en: "🚗 Road Safety: Over 60% accidents preventable — Drive responsibly, wear helmets", te: "🚗 రోడ్డు భద్రత: 60% కంటే ఎక్కువ ప్రమాదాలు నివారించదగినవి — హెల్మెట్ ధరించండి" },
  { en: "📱 NYAYA MITRA: File complaints, track cases, access legal aid — All at one place", te: "📱 న్యాయ మిత్ర: ఫిర్యాదులు దాఖలు చేయండి, కేసులు ట్రాక్ చేయండి — అన్నీ ఒకే చోట" },
];

export default function ScrollingTicker() {
  const { lang } = useLanguage();
  const text = tickerItems.map((t) => lang === "te" ? t.te : t.en).join("     •     ");

  return (
    <div className="bg-primary text-white overflow-hidden flex items-center" style={{ height: "36px" }}>
      <div className="flex-shrink-0 bg-red-600 px-4 h-full flex items-center z-10">
        <span className="text-white text-xs font-bold tracking-widest uppercase whitespace-nowrap">
          {lang === "te" ? "📡 LIVE" : "📡 LIVE"}
        </span>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className="ticker-track flex items-center whitespace-nowrap text-xs text-white/90 font-medium">
          <span>{text}</span>
          <span className="mx-8">•</span>
          <span>{text}</span>
        </div>
      </div>
      <style>{`
        .ticker-track {
          animation: ticker-scroll 15s linear infinite;
        }
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}