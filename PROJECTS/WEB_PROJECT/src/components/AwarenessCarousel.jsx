import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=1400&h=600&fit=crop&q=95",
    titleEn: "Digital Arrest Scams — Stay Alert",
    titleTe: "డిజిటల్ అరెస్ట్ మోసాలు — అప్రమత్తంగా ఉండండి",
    descEn: "No police officer will 'digitally arrest' you via video call or ask for money to drop charges. Report such calls immediately.",
    descTe: "వీడియో కాల్ ద్వారా పోలీసులు మిమ్మల్ని 'డిజిటల్ అరెస్టు' చేయరు. అటువంటి కాల్స్ వస్తే వెంటనే నివేదించండి.",
    color: "from-red-950/95 via-red-900/70",
    tag: "SCAM ALERT",
  },
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1400&h=600&fit=crop&q=95",
    titleEn: "Cyber Crime — Stay Safe Online",
    titleTe: "సైబర్ నేరం — ఆన్‌లైన్‌లో సురక్షితంగా ఉండండి",
    descEn: "Lost money to online fraud? Report immediately to the Cyber Crime Helpline 1930 for the best chance of recovery.",
    descTe: "ఆన్‌లైన్ మోసంలో డబ్బు పోయిందా? సైబర్ హెల్ప్‌లైన్ 1930 కు వెంటనే నివేదించండి.",
    color: "from-emerald-950/95 via-teal-900/70",
    tag: "CYBER SECURITY",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1400&h=600&fit=crop&q=95",
    titleEn: "SHE Teams — Women Safety First",
    titleTe: "షీ టీమ్స్ — మహిళా భద్రత అగ్రప్రాధాన్యత",
    descEn: "Dial 181 or use Nyaya Mitra SOS. AP SHE Teams respond within minutes with 24/7 patrol in all districts.",
    descTe: "181 కు కాల్ చేయండి లేదా SOS నొక్కండి. AP షీ టీమ్స్ నిమిషాల్లోనే స్పందిస్తాయి.",
    color: "from-rose-900/95 via-pink-900/70",
    tag: "WOMEN SAFETY",
  },
  {
    id: 7,
    image: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=1400&h=600&fit=crop&q=95",
    titleEn: "Child Safety — Protect Our Future",
    titleTe: "బాలల భద్రత — మన భవిష్యత్తును కాపాడండి",
    descEn: "Witnessing child abuse or illegal child labor? Call 1098 immediately. Your proactive report can save a life.",
    descTe: "బాలల వేధింపుల గురించి వెంటనే 1098 కు కాల్ చేయండి. మీ నివేదిక ఒకరి జీవితాన్ని కాపాడుతుంది.",
    color: "from-sky-950/95 via-cyan-900/70",
    tag: "CHILD SAFETY",
  },
  {
    id: 10,
    image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1400&h=600&fit=crop&q=95",
    titleEn: "DRIVE SAFETY — Follow Traffic Rules",
    titleTe: "డ్రైవ్ సేఫ్టీ — ట్రాఫిక్ నియమాలను పాటించండి",
    descEn: "Always wear seatbelts and helmets. Never drink and drive. Your safety is in your hands.",
    descTe: "ఎల్లప్పుడూ సీటుబెల్టులు మరియు హెల్మెట్లు ధరించండి. మద్యం సేవించి వాహనం నడపకండి.",
    color: "from-amber-950/95 via-yellow-900/70",
    tag: "DRIVE SAFETY",
  }
];

export default function AwarenessCarousel() {
  const [current, setCurrent] = useState(0);
  const { lang } = useLanguage();

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];

  return (
    <div className="relative w-full h-[400px] md:h-[480px] overflow-hidden rounded-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <img
            src={slide.image}
            alt={slide.titleEn}
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.color} to-transparent`} />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-xl px-8 md:px-12">
              <span className="inline-block px-3 py-1 bg-secondary text-white text-xs font-bold tracking-widest rounded-full mb-4">
                {slide.tag}
              </span>
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white font-heading font-bold text-2xl md:text-4xl leading-tight mb-3"
              >
                {lang === "te" ? slide.titleTe : slide.titleEn}
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-white/80 text-sm md:text-base leading-relaxed"
              >
                {lang === "te" ? slide.descTe : slide.descEn}
              </motion.p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? "w-8 bg-secondary" : "w-2 bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}