import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Shield, FileText, Search, MapPin, Building2, MessageSquare, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const steps = [
  {
    icon: "🙏",
    title: "Welcome to NYAYA MITRA",
    titleTe: "న్యాయ మిత్రకు స్వాగతం",
    desc: "Your Digital Justice Companion for Andhra Pradesh. This app connects citizens directly with AP Police services — 24/7, free, and secure. Powered by AI.",
    descTe: "ఆంధ్రప్రదేశ్ కోసం మీ డిజిటల్ న్యాయ సహచరుడు. ఈ యాప్ పౌరులను AP పోలీసు సేవలతో నేరుగా అనుసంధానిస్తుంది — 24/7, ఉచిత మరియు సురక్షితం.",
    color: "bg-primary",
  },
  {
    icon: "📋",
    title: "File a Complaint (FIR)",
    titleTe: "ఫిర్యాదు దాఖలు చేయండి",
    desc: "Report theft, cyber fraud, women harassment, narcotics, domestic violence & more online. AI auto-assigns your case to the right department. Get a unique Case ID instantly.",
    descTe: "దొంగతనం, సైబర్ మోసం, మహిళా వేధింపు, మాదకద్రవ్యాలు, గృహ హింస ఆన్‌లైన్‌లో నివేదించండి. AI మీ కేసు సరైన విభాగానికి పంపిస్తుంది.",
    color: "bg-blue-600",
    feature: "Quick Actions → File Complaint",
  },
  {
    icon: "👮",
    title: "AI Voice Constable",
    titleTe: "AI వాయిస్ కానిస్టేబుల్",
    desc: "Can't type? Use our AI Voice Constable! Tap the 👮 button on the left, speak in Telugu or English, and file your FIR by voice. Works for rural & illiterate citizens too.",
    descTe: "టైప్ చేయలేరా? AI వాయిస్ కానిస్టేబుల్ ఉపయోగించండి! ఎడమ వైపున 👮 బటన్ నొక్కి, తెలుగులో మాట్లాడి FIR దాఖలు చేయండి.",
    color: "bg-indigo-700",
    feature: "Left side 👮 floating button",
  },
  {
    icon: "👩‍⚖️",
    title: "Women Safety — SHE Teams",
    titleTe: "మహిళా భద్రత — షీ టీమ్స్",
    desc: "Activate safety session when traveling alone. Share live location, set check-in intervals, emergency contacts, and trigger SOS instantly. AP SHE Teams & TS Bharosa respond 24/7.",
    descTe: "ఒంటరిగా ప్రయాణించేటప్పుడు సేఫ్టీ సెషన్ ప్రారంభించండి. SOS నొక్కితే అత్యవసర సంప్రదింపులకు తక్షణ హెచ్చరిక వెళ్తుంది.",
    color: "bg-pink-600",
    feature: "Quick Actions → Women Safety",
  },
  {
    icon: "🗺️",
    title: "Police Station Finder",
    titleTe: "పోలీసు స్టేషన్ ఫైండర్",
    desc: "Interactive map with ALL Andhra Pradesh police stations. Press 'My Location' to find nearest station. One click for directions and phone number.",
    descTe: "ఆంధ్రప్రదేశ్ అన్ని పోలీసు స్టేషన్ల ఇంటరాక్టివ్ మ్యాప్. 'My Location' నొక్కి మీకు దగ్గరలో ఉన్న స్టేషన్ కనుగొనండి.",
    color: "bg-teal-600",
    feature: "Home → AP Police Interactive Map",
  },
  {
    icon: "⚖️",
    title: "Know Your Rights (BNSS)",
    titleTe: "మీ హక్కులు తెలుసుకోండి",
    desc: "Full guide on India's new BNSS (Bharatiya Nyaya Sanhita), BNSS, BSA. Know your rights when arrested, how to file FIR, bail rights, and constitutional protections.",
    descTe: "కొత్త BNSS, BNS చట్టాల పూర్తి గైడ్. అరెస్టయినప్పుడు మీ హక్కులు, FIR ఎలా దాఖలు చేయాలి, బెయిల్ హక్కులు తెలుసుకోండి.",
    color: "bg-amber-700",
    feature: "Home → Know Your Rights section",
  },
  {
    icon: "🏛️",
    title: "All Police Departments",
    titleTe: "అన్ని పోలీసు విభాగాలు",
    desc: "Access AP Narcotics, Cyber Crime, CID, SHE Teams, Traffic, and Anti-Corruption. Each department has dedicated helplines and case dashboards.",
    descTe: "AP నార్కోటిక్స్, సైబర్ క్రైమ్, CID, షీ టీమ్స్, ట్రాఫిక్ విభాగాలను యాక్సెస్ చేయండి. ప్రతి విభాగానికి హెల్ప్‌లైన్లు ఉన్నాయి.",
    color: "bg-emerald-600",
    feature: "Quick Actions → Departments",
  },
];

export default function FirstTimeGuide({ lang = "en" }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const hasSeenGuide = sessionStorage.getItem("nyayamitra_guide_never");
    if (!hasSeenGuide) {
      sessionStorage.setItem("nyayamitra_guide_never", "1");
      const timer = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const close = () => {
    sessionStorage.setItem("nyayamitra_guide_never", "1");
    setOpen(false);
    setStep(0);
  };

  const current = steps[step];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.85, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 40 }}
            className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className={`${current.color} p-6 text-center relative`}>
              <button onClick={close} className="absolute top-3 right-3 text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <div className="text-5xl mb-3">{current.icon}</div>
              <h2 className="text-white font-heading font-bold text-xl">
                {lang === "te" ? current.titleTe : current.title}
              </h2>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-foreground text-sm leading-relaxed text-center">
                {lang === "te" ? current.descTe : current.desc}
              </p>
              {current.feature && (
                <div className="mt-4 bg-muted rounded-lg px-4 py-2.5 text-center">
                  <p className="text-xs text-muted-foreground font-medium">📍 Find it: <span className="text-primary font-semibold">{current.feature}</span></p>
                </div>
              )}

              {/* Step dots */}
              <div className="flex justify-center gap-2 mt-5 mb-4">
                {steps.map((_, i) => (
                  <button key={i} onClick={() => setStep(i)}
                    className={`h-2 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"}`}
                  />
                ))}
              </div>

              <div className="flex gap-3">
                {step > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)} className="gap-1">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </Button>
                )}
                {step < steps.length - 1 ? (
                  <Button className="flex-1 gap-1" onClick={() => setStep(s => s + 1)}>
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button className="flex-1" onClick={close}>
                    Get Started! 🚀
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-end mt-3">
                <button onClick={close} className="text-xs text-primary hover:underline font-medium transition">
                  {lang === "te" ? "దాటవేయి →" : "Skip tour →"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}