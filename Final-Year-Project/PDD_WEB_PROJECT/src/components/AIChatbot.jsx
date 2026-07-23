import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Bot, Loader2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../lib/LanguageContext";
import { useNavigate } from "react-router-dom";
import { invokeLLM } from "@/lib/ai";
import { supabase } from "@/lib/supabase";

// Animated Robot Head
function RobotHead({ talking, size = 36 }) {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    const t = setInterval(() => { setBlink(true); setTimeout(() => setBlink(false), 160); }, 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="18" y="0" width="4" height="7" rx="2" fill="#f59e0b" />
      <rect x="4" y="7" width="32" height="24" rx="7" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1.5" />
      <ellipse cx="14" cy="18" rx="4" ry={blink ? 0.8 : 3.5} fill="#60a5fa" />
      <ellipse cx="26" cy="18" rx="4" ry={blink ? 0.8 : 3.5} fill="#60a5fa">
        {talking && <animate attributeName="fill" values="#60a5fa;#93c5fd;#60a5fa" dur="0.4s" repeatCount="indefinite" />}
      </ellipse>
      <rect x="12" y="25" width="16" height={talking ? 4 : 2.5} rx="1.2" fill={talking ? "#fbbf24" : "#3b82f6"} />
    </svg>
  );
}

const QUICK_QUESTIONS = [
  { icon: "📋", en: "How to file an FIR online?", te: "ఆన్‌లైన్‌లో FIR ఎలా దాఖలు చేయాలి?" },
  { icon: "🛡️", en: "Women safety & SHE Teams", te: "మహిళా భద్రత & షీ టీమ్స్" },
  { icon: "💻", en: "Report cyber crime fraud", te: "సైబర్ నేరం నివేదించండి" },
  { icon: "📞", en: "Emergency helplines", te: "అత్యవసర హెల్ప్‌లైన్లు" },
  { icon: "⚖️", en: "Know my legal rights", te: "నా చట్టపరమైన హక్కులు" },
  { icon: "🔍", en: "Track my case status", te: "నా కేసు స్థితి ట్రాక్ చేయండి" },
];

const KNOWLEDGE_BASE = {
  en: {
    file_fir: {
      match: ["file fir", "how to file", "file case", "register complaint", "file complaint", "how to register a case", "file an fir", "how do i file an fir"],
      content: "To file a complaint or FIR on NyayaMitra, you have two official options:\n\n• **AI Constable Voice FIR**: Voice-based registration.\n• **Manual Web FIR**: Form-based submission.",
      nextStep: "We recommend starting the Voice FIR for faster processing. Which option would you like to use?",
      actions: [
        { label: "Start AI Constable", type: "constable" },
        { label: "Open Manual FIR", link: "/file-complaint" }
      ]
    },
    track_complaint: {
      match: ["track my complaint", "how do i track", "track case", "check status", "complaint status", "check status", "track complaint"],
      content: "Track your registered complaints and monitor the real-time timeline of your cases.",
      services: "• **Search by ID**: Track using your FIR number.\n• **Search by Phone**: Find cases linked to your mobile.\n• **Live Timeline**: View current investigating officer steps.",
      nextStep: "Please click track complaint below to enter the tracking portal.",
      actions: [
        { label: "Track My Complaint", link: "/track-case" }
      ]
    },
    ai_constable: {
      match: ["what is ai constable", "how does the ai constable work", "constable work", "constable function", "constable details", "voice fir details", "ai constable"],
      content: "The AI Digital Police Constable is an automated voice assistant designed to record FIRs securely.",
      services: "• **Voice Investigation**: Guided crime-specific questions.\n• **Evidence Collection**: Live photo/video uploads.\n• **Bilingual Speech**: Seamless Telugu and English dialogue.",
      nextStep: "Would you like to start the AI Constable voice interview now?",
      actions: [
        { label: "Start AI Constable", type: "constable" }
      ]
    },
    upload_evidence: {
      match: ["upload evidence", "attach file", "how to upload evidence", "upload proof", "add evidence", "uploading evidence", "evidence upload"],
      content: "All evidence (images, videos, documents) is securely saved in Supabase storage and linked to your FIR.",
      nextStep: "Would you like to start filing your report now?",
      actions: [
        { label: "Start AI Constable", type: "constable" },
        { label: "Open Manual FIR", link: "/file-complaint" }
      ]
    },
    police_map: {
      match: ["nearest police station", "where is the police station", "police station map", "locate police", "find police station", "police map", "where is the police map"],
      content: "The live AP Police Station Map provides geo-spatial details of all station house offices.",
      nextStep: "Would you like me to open the Police Map now?",
      actions: [
        { label: "Open Police Map", link: "/police-stations" }
      ]
    },
    cyber_crime: {
      match: ["cyber crime", "online fraud", "otp scam", "money lost", "cyber help", "what is cyber crime", "upi fraud", "bank fraud", "instagram fraud", "whatsapp fraud", "social media fraud"],
      content: "Cyber banking fraud must be reported immediately. The **Golden Hour** (first 60 minutes) is crucial to freezing the transfer. Call the cyber emergency line **1930** or report the case via our Golden Hour Portal.",
      nextStep: "We recommend accessing the Golden Hour Portal or calling 1930 immediately. What would you like to do?",
      actions: [
        { label: "Open Cyber Crime Portal", link: "/golden-hour-cyber" },
        { label: "Call Cyber Helpline 1930", tel: "1930" }
      ]
    },
    women_safety: {
      match: ["women safety", "how can women use", "she team", "harassment help", "safety features", "women use"],
      content: "NyayaMitra provides active protection features for women. You can set up your **Trusted Circle** for emergency alerts, view safe travel routes avoiding heatspots via the **Safe Route Map**, or dial **181** (SHE Teams) or **112** for emergencies.",
      nextStep: "Which safety feature would you like to explore?",
      actions: [
        { label: "Open Women Safety", link: "/trusted-circle" },
        { label: "Safe Route Map", link: "/safe-route" }
      ]
    },
    emergency: {
      match: ["emergency", "sos", "danger", "help", "critical", "ambulance", "police helper", "emergency numbers", "emergency helplines", "100", "112", "181", "1930", "108", "101"],
      content: "🚨 **CRITICAL EMERGENCY LINE DETAILS**",
      services: "• Emergency Helpline: **112 / 100**\n• Women Safety Line (SHE Teams): **181**\n• Cyber Crime Response: **1930**\n• Medical Ambulance: **108**\n• Fire Station: **101**",
      nextStep: "Please call the helper links below immediately to dispatch police responders.",
      actions: [
        { label: "Call 100", tel: "100" },
        { label: "Call 112", tel: "112" },
        { label: "Women Safety 181", tel: "181" },
        { label: "Cyber Helpline 1930", tel: "1930" },
        { label: "Ambulance 108", tel: "108" },
        { label: "Fire Station 101", tel: "101" }
      ]
    },
    register: {
      match: ["how do i register", "register account", "sign up", "registration process", "how to register"],
      content: "To create an account, register via the Registration page.",
      nextStep: "Would you like to navigate to the Registration screen?",
      actions: [
        { label: "Navigate to Register", link: "/register" }
      ]
    },
    login: {
      match: ["how do i log in", "sign in", "login account", "authentication", "how to login", "how do i login"],
      content: "You can sign in using your email and password on the secure Login page.",
      nextStep: "Would you like to open the Login page?",
      actions: [
        { label: "Navigate to Login", link: "/login" }
      ]
    },
    after_fir: {
      match: ["what happens after fir", "after fir submission", "fir next steps", "after submit", "after submission"],
      content: "Once registered, the FIR is pushed to the Police dashboard.",
      nextStep: "Would you like to go to your dashboard to track updates?",
      actions: [
        { label: "Open Dashboard", link: "/dashboard" }
      ]
    },
    change_language: {
      match: ["change the complaint language", "change language", "telugu mode", "english mode", "bilingual", "complaint language", "change the language"],
      content: "You can toggle the language toggle bar (English / తెలుగు) at the top of the portal.",
      nextStep: "Which language do you prefer to continue the conversation?",
      actions: [
        { label: "Start AI Constable", type: "constable" }
      ]
    },
    dash_help: {
      match: ["dashboard help", "dashboards", "how do i access dashboards", "access dashboard", "dashboard access"],
      content: "NyayaMitra supports customized dashboards for different roles.",
      nextStep: "Would you like me to navigate to your profile dashboard?",
      actions: [
        { label: "Open Role Dashboard", link: "/dashboard" }
      ]
    },
    missing: {
      match: ["missing person", "missing child", "missing help", "find person"],
      content: "Reporting missing persons or child tracking is treated with critical priority.",
      nextStep: "Would you like to start the AI Constable interview for reporting a missing person?",
      actions: [
        { label: "Start AI Constable", type: "constable" },
        { label: "Open Manual FIR", link: "/file-complaint" }
      ]
    },
    my_complaints: {
      match: ["my complaints", "my cases", "show complaints", "my firs"],
      content: "We sync registered cases dynamically from Supabase.",
      nextStep: "Click below to review your complaints list on your Citizen Dashboard.",
      actions: [
        { label: "Open Citizen Dashboard", link: "/citizen-dashboard" }
      ]
    },
    rights: {
      match: ["know your rights", "rights info", "legal rights", "constitution rights"],
      content: "Access legal rights and procedural advice under Indian police guidelines.",
      nextStep: "Would you like to open the Constitution & Legal Rights portal?",
      actions: [
        { label: "Open Rights Portal", link: "/constitution-rights" }
      ]
    }
  },
  te: {
    file_fir: {
      match: ["ఫిర్యాదు", "ఎఫ్ఐఆర్", "FIR", "ఎలా నమోదు చేయాలి", "నమోదు", "కేసు నమోదు"],
      content: "మీరు రెండు పద్ధతులలో ఎఫ్ఐఆర్ (FIR) నమోదు చేయవచ్చు:",
      services: "• **వాయిస్ ఎఫ్ఐఆర్**: ఏఐ కానిస్టేబుల్ ద్వారా మాట్లాడి నమోదు చేసుకోండి.\n• **మాన్యువల్ ఎఫ్ఐఆర్ ఫారమ్**: మాన్యువల్ వెబ్ ఫారమ్ పూరించండి.",
      recommended: "వేగంగా నమోదు కావడానికి వాయిస్ ఎఫ్ఐఆర్ ఉపయోగించవలసిందిగా సిఫార్సు చేస్తున్నాము.",
      nextStep: "వేగంగా నమోదు కావడానికి వాయిస్ ఎఫ్ఐఆర్ ఉపయోగించవలసిందిగా సిఫార్సు చేస్తున్నాము. మీరు ఏ ఆప్షన్ ఎంచుకుంటారు?",
      actions: [
        { label: "ఏఐ కానిస్టేబుల్ ప్రారంభించండి", type: "constable" },
        { label: "మాన్యువల్ ఎఫ్ఐఆర్ ఫారమ్", link: "/file-complaint" }
      ]
    },
    track_complaint: {
      match: ["ట్రాక్", "స్థితి", "కేసు స్థితి", "ఎలా ట్రాక్ చేయాలి", "ఫిర్యాదు స్థితి"],
      content: "మీ ఫిర్యాదు పురోగతిని కేస్ ట్రాకింగ్ పేజీలో తెలుసుకోవచ్చు.",
      nextStep: "దయచేసి మీ కేసును ట్రాక్ చేయడానికి కింద ఉన్న బటన్ క్లిక్ చేయండి.",
      actions: [
        { label: "నా ఫిర్యాదు ట్రాక్ చేయండి", link: "/track-case" }
      ]
    },
    ai_constable: {
      match: ["ఏఐ కానిస్టేబుల్ అంటే ఏమిటి", "కానిస్టేబుల్ ఎలా పనిచేస్తుంది", "కానిస్టేబుల్ వివరాలు", "ఏఐ కానిస్టేబుల్"],
      content: "మా ఏఐ కానిస్టేబుల్ అనేది వాయిస్ సంభాషణ ద్వారా మీ ఎఫ్ఐఆర్ ను నమోదు చేస్తుంది.",
      nextStep: "మీరు ఏఐ కానిస్టేబుల్ తో సంభాషణను ప్రారంభించాలనుకుంటున్నారా?",
      actions: [
        { label: "ఏఐ కానిస్టేబుల్ ప్రారంభించండి", type: "constable" }
      ]
    },
    upload_evidence: {
      match: ["సాక్ష్యాలు", "ఫైల్ అప్‌లోడ్", "సాక్ష్యం అప్‌లోడ్", "ఆధారాలు", "ఆధారాలను ఎలా అప్‌లోడ్ చేయాలి"],
      content: "సాక్ష్యాలు (ఫోటోలు, వీడియోలు) సురక్షితంగా సూపాబేస్ స్టోరేజ్‌లో భద్రపరచబడతాయి.",
      nextStep: "మీరు ఫిర్యాదును నమోదు చేయాలనుకుంటున్నారా?",
      actions: [
        { label: "ఏఐ కానిస్టేబుల్ ప్రారంభించండి", type: "constable" },
        { label: "మాన్యువల్ ఎఫ్ఐఆర్ ఫారమ్", link: "/file-complaint" }
      ]
    },
    police_map: {
      match: ["పోలీస్ స్టేషన్ ఎక్కడ", "సమీప పోలీస్ స్టేషన్", "మ్యాప్", "లొకేషన్", "పోలీస్ స్టేషన్"],
      content: "ఆంధ్రప్రదేశ్‌లోని సమీప పోలీస్ స్టేషన్లను మ్యాప్ ద్వారా గుర్తించవచ్చు.",
      nextStep: "మీ కోసం పోలీస్ స్టేషన్ల మ్యాప్ ఓపెన్ చేయమంటారా?",
      actions: [
        { label: "పోలీస్ మ్యాప్ తెరవండి", link: "/police-stations" }
      ]
    },
    cyber_crime: {
      match: ["సైబర్ క్రైమ్", "ఆన్‌లైన్ మోసం", "బ్యాంకు మోసం", "డబ్బు పోయింది", "సైబర్ క్రైమ్ అంటే ఏమిటి", "యూపీఐ మోసం", "బ్యాంకు మోసాలు", "సోషల్ మీడియా మోసం"],
      content: "సైబర్ మోసానికి గురైనట్లయితే, మొదటి 60 నిమిషాలు (గోల్డెన్ అవర్) చాలా కీలకం.",
      nextStep: "వెంటనే 1930 కాల్ చేయాలని లేదా సైబర్ ఆపరేషన్స్ సెంటర్ ఉపయోగించాలని సిఫార్సు చేస్తున్నాము. మీ నిర్ణయం?",
      actions: [
        { label: "సైబర్ పోర్టల్ తెరవండి", link: "/golden-hour-cyber" },
        { label: "1930 కి కాల్ చేయండి", tel: "1930" }
      ]
    },
    women_safety: {
      match: ["మహిళల రక్షణ", "షీ టీమ్స్", "వేధింపులు", "భద్రత", "మహిళా", "మహిళలు ఎలా ఉపయోగించాలి"],
      content: "మహిళా రక్షణ కోసం నిరంతర సహాయ సేవలు అందుబాటులో ఉన్నాయి.",
      nextStep: "ఏ సేవను ఉపయోగించాలనుకుంటున్నారు?",
      actions: [
        { label: "మహిళా రక్షణ పోర్టల్", link: "/trusted-circle" },
        { label: "సేఫ్ రూట్ మ్యాప్", link: "/safe-route" }
      ]
    },
    emergency: {
      match: ["అత్యవసర", "ప్రమాదం", "సహాయం", "అంబులెన్స్", "పోలీస్ హెల్ప్", "emergency", "sos", "అత్యవసర నంబర్లు", "అత్యవసర హెల్ప్‌లైన్లు", "100", "112", "181", "1930", "108", "101"],
      content: "🚨 **అత్యవసర హెల్ప్‌లైన్ వివరాలు:**",
      nextStep: "దయచేసి అత్యవసర సహాయం కోసం క్రింది నంబర్లకు కాల్ చేయండి.",
      actions: [
        { label: "కాల్ 100", tel: "100" },
        { label: "కాల్ 112", tel: "112" },
        { label: "మహిళా హెల్ప్‌లైన్ 181", tel: "181" },
        { label: "సైబర్ హెల్ప్‌లైన్ 1930", tel: "1930" },
        { label: "అంబులెన్స్ 108", tel: "108" },
        { label: "ఫైర్ 101", tel: "101" }
      ]
    },
    register: {
      match: ["రిజిస్టర్", "ఖాతా సృష్టించడం", "సైన్ అప్", "రిజిస్ట్రేషన్"],
      content: "మీరు మీ వివరాలతో న్యాయమిత్రలో ఖాతా సృష్టించుకోవచ్చు.",
      nextStep: "రిజిస్ట్రేషన్ పేజీకి వెళ్లాలనుకుంటున్నారా?",
      actions: [
        { label: "రిజిస్టర్ పేజీకి వెళ్ళు", link: "/register" }
      ]
    },
    login: {
      match: ["లాగిన్", "సైన్ ఇన్", "లాగిన్ అవ్వడం", "లాగిన్ ఎలా అవ్వాలి"],
      content: "మీ ఈమెయిల్ మరియు పాస్‌వర్డ్ తో సురక్షితంగా లాగిన్ అవ్వవచ్చు.",
      nextStep: "లాగిన్ పేజీ ఓపెన్ చేయమంటారా?",
      actions: [
        { label: "లాగిన్ పేజీకి వెళ్ళు", link: "/login" }
      ]
    },
    after_fir: {
      match: ["ఎఫ్ఐఆర్ తర్వాత", "సమర్పించిన తర్వాత", "తదుపరి చర్యలు", "ఎఫ్ఐఆర్ దాఖలు చేసిన తర్వాత"],
      content: "ఎఫ్ఐఆర్ దాఖలు చేసిన తర్వాత, దర్యాప్తు ప్రక్రియ ప్రారంభమవుతుంది.",
      nextStep: "డ్యాష్‌బోర్డ్ తెరవాలనుకుంటున్నారా?",
      actions: [
        { label: "డ్యాష్‌బోర్డ్ తెరవండి", link: "/dashboard" }
      ]
    },
    change_language: {
      match: ["భాషను మార్చడం", "తెలుగు మోడ్", "ఇంగ్లీష్ మోడ్", "భాషను మార్చవచ్చా"],
      content: "స్క్రీన్ పైన ఉన్న లాంగ్వేజ్ బటన్ తో తెలుగు లేదా ఇంగ్లీష్ లోకి మార్చుకోవచ్చు.",
      nextStep: "ఏ భాషలో దర్యాప్తు కొనసాగించాలనుకుంటున్నారు?",
      actions: [
        { label: "ఏఐ కానిస్టేబుల్ ప్రారంభించండి", type: "constable" }
      ]
    },
    dash_help: {
      match: ["డ్యాష్‌బోర్డ్ సహాయం", "డ్యాష్‌బోర్డ్‌లు", "యాక్సెస్ చేయడం", "డ్యాష్‌బోర్డ్ యాక్సెస్"],
      content: "న్యాయమిత్ర వివిధ విభాగాల డ్యాష్‌బోర్డ్‌లను సపోర్ట్ చేస్తుంది.",
      nextStep: "మీ అధికారిక డ్యాష్‌బోర్డ్‌ను తెరవాలనుకుంటున్నారా?",
      actions: [
        { label: "డ్యాష్‌బోర్డ్ తెరవండి", link: "/dashboard" }
      ]
    },
    missing: {
      match: ["తప్పిపోయిన వ్యక్తి", "తప్పిపోయిన పిల్లవాడు", "వ్యక్తి తప్పిపోయాడు"],
      content: "తప్పిపోయిన వ్యక్తులు లేదా పిల్లల వివరాలు అత్యంత ప్రాధాన్యతతో నమోదు చేయబడతాయి.",
      nextStep: "కేసు నమోదు చేయడానికి ఏఐ కానిస్టేబుల్ ను ప్రారంభించాలా?",
      actions: [
        { label: "ఏఐ కానిస్టేబుల్ ప్రారంభించండి", type: "constable" },
        { label: "మాన్యువల్ ఎఫ్ఐఆర్ ఫారమ్", link: "/file-complaint" }
      ]
    },
    my_complaints: {
      match: ["నా ఫిర్యాదులు", "నా కేసులు", "నా ఫిర్యాదుల వివరాలు"],
      content: "రిజిస్టర్ అయిన కేసుల వివరాలు డైనమిక్‌గా మీ ఖాతాలో అప్‌డేట్ చేయబడతాయి.",
      nextStep: "మీ ఫిర్యాదులను సమీక్షించడానికి కింద ఉన్న డ్యాష్‌బోర్డ్‌ను తెరవండి.",
      actions: [
        { label: "సిటిజన్ డ్యాష్‌బోర్డ్", link: "/citizen-dashboard" }
      ]
    },
    rights: {
      match: ["హక్కుల వివరాలు", "చట్టపరమైన హక్కులు", "నా హక్కులు"],
      content: "భారత రాజ్యాంగం ప్రకారం విచారణల సమయంలో, అరెస్ట్ సమయాలలో మరియు ఫిర్యాదుల నమోదులో మీ ప్రాథమిక చట్టపరమైన హక్కులను తెలుసుకోండి.",
      nextStep: "మీ ప్రాథమిక హక్కుల పేజీకి వెళ్లాలనుకుంటున్నారా?",
      actions: [
        { label: "హక్కుల పేజీకి వెళ్ళు", link: "/constitution-rights" }
      ]
    }
  }
};

function getLocalAssistantResponse(input, lang) {
  const q = input.toLowerCase().trim();
  const langKey = lang === "te" ? "te" : "en";
  const kb = KNOWLEDGE_BASE[langKey];
  
  let bestMatchKey = null;
  let maxScore = 0;
  
  for (const key of Object.keys(kb)) {
    const entry = kb[key];
    let score = 0;
    
    for (const matchPhrase of entry.match) {
      const tokens = matchPhrase.split(" ");
      if (tokens.every(token => q.includes(token))) {
        score += tokens.length;
      }
    }
    
    if (score > maxScore) {
      maxScore = score;
      bestMatchKey = key;
    }
  }
  
  if (bestMatchKey && maxScore > 0) {
    console.log(`[AI_CHATBOT_DEBUG] Local Match Found: Key="${bestMatchKey}" Score=${maxScore}`);
    const entry = kb[bestMatchKey];
    return {
      content: entry.content,
      services: entry.services,
      recommended: entry.recommended,
      nextStep: entry.nextStep,
      actions: entry.actions
    };
  }
  
  // Dashboard general fallback query
  if (q.includes("dashboard") || q.includes("డ్యాష్‌బోర్డ్")) {
    return {
      content: langKey === "te"
        ? `మీ సంబంధిత అధికారిక డ్యాష్‌బోర్డ్‌ను ఇక్కడ యాక్సెస్ చేయండి.`
        : `You can access your designated dashboard below.`,
      nextStep: langKey === "te" ? "డ్యాష్‌బోర్డ్ ఓపెన్ చేయమంటారా?" : "Would you like me to open the dashboard page?",
      actions: [
        { label: langKey === "te" ? "డ్యాష్‌బోర్డ్ తెరవండి" : "Open Dashboard", link: "/dashboard" }
      ]
    };
  }

  return null;
}

export default function AIChatbot() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatLang, setChatLang] = useState("en");
  const scrollRef = useRef(null);
  const { lang } = useLanguage();

  useEffect(() => { setChatLang(lang); }, [lang]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (open && messages.length === 0) {
      const greeting = chatLang === "te"
        ? "నమస్కారం! నేను **న్యాయ మిత్ర AI** అసిస్టెంట్ 🤖\n\nఫిర్యాదు దాఖలు, కేసు ట్రాకింగ్, మహిళా భద్రత, సైబర్ నేరాలు, చట్టపరమైన హక్కులు — ఏదైనా అడగండి!"
        : "Namaskaram! I'm **NYAYA MITRA AI** 🤖\n\nI can help with complaints, case tracking, women safety, cyber fraud, and your legal rights. What can I help you with?";
      setMessages([{ role: "assistant", content: greeting }]);
    }
  }, [open, chatLang]);

  const handleAction = (action) => {
    if (action.type === "constable") {
      window.dispatchEvent(new CustomEvent("open-voice-constable"));
      setOpen(false);
    } else if (action.link) {
      navigate(action.link);
      setOpen(false);
    }
  };

  const sendMessage = useCallback(async (textOverride) => {
    const userMsg = (textOverride !== undefined ? textOverride : input).trim();
    if (!userMsg || loading) return;
    setInput("");
    
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 600)); // Simulate typing
      
      // 1. Strict Priority: Local Knowledge Engine Check
      const localResponse = getLocalAssistantResponse(userMsg, chatLang);
      
      if (localResponse) {
        let contentWithExtra = localResponse.content;
        if (localResponse.services) {
          contentWithExtra += `\n\n${localResponse.services}`;
        }
        if (localResponse.nextStep) {
          contentWithExtra += `\n\n👉 ${localResponse.nextStep}`;
        }
        
        // Strip markdown asterisks and hashes
        const cleanContent = contentWithExtra.replace(/[*#]/g, '');
        
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: cleanContent,
          actions: localResponse.actions
        }]);
      } else {
        // 2. Fall back to LLM ONLY if offline check does not match
        const systemPrompt = `You are the NyayaAI floating widget assistant for NyayaMitra AP Police Platform.
        Language Mode: ${chatLang === "te" ? "Telugu" : "English"}. Respond strictly in this language.
        Guidelines: Answer questions referring to NyayaMitra pages. If the query refers to filing, tracking or emergency, explain briefly and direct them. Keep replies short (2 sentences max).`;

        const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
        const responseText = await invokeLLM(JSON.stringify(apiMessages), systemPrompt);
        
        // Strip markdown asterisks and hashes
        const cleanResponseText = responseText.replace(/[*#]/g, '');
        
        const actions = [];
        const lowerResp = cleanResponseText.toLowerCase();
        if (lowerResp.includes("fir") || lowerResp.includes("constable") || lowerResp.includes("కానిస్టేబుల్")) {
          actions.push({ label: chatLang === "te" ? "ఏఐ కానిస్టేబుల్" : "Start AI Constable", type: "constable" });
        }
        if (lowerResp.includes("track") || lowerResp.includes("status") || lowerResp.includes("ట్రాక్")) {
          actions.push({ label: chatLang === "te" ? "కేసు ట్రాక్" : "Track Case", link: "/track-case" });
        }
        if (lowerResp.includes("cyber") || lowerResp.includes("సైబర్")) {
          actions.push({ label: chatLang === "te" ? "సైబర్ పోర్టల్" : "Cyber Portal", link: "/golden-hour-cyber" });
        }

        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: cleanResponseText, 
          actions: actions.length > 0 ? actions : undefined 
        }]);
      }
    } catch (err) {
      console.error("[AIChatbot_DEBUG] Fallback failed:", err);
      const fallbackMsg = chatLang === "te"
        ? "క్షమించండి, ఈ అసిస్టెంట్ కేవలం న్యాయమిత్ర సేవల్లో మాత్రమే సహాయపడుతుంది. దయచేసి అందుబాటులో ఉన్న సేవల్లో ఒకదాన్ని ఎంచుకోండి."
        : "This assistant specializes in NyayaMitra services. Please choose one of the available services or ask a project-related question.";
      setMessages(prev => [...prev, { role: "assistant", content: fallbackMsg }]);
    } finally {
      setLoading(false);
    }
  }, [messages, input, chatLang, loading]);

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-4 z-50 cursor-pointer"
            onClick={() => setOpen(true)}
          >
            <div className="relative group">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="bg-gradient-to-r from-blue-900 to-blue-700 text-white pl-2 pr-5 py-2 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-blue-400/30 flex items-center gap-3 hover:shadow-[0_8px_30px_rgba(37,99,235,0.3)] transition-all duration-300 hover:scale-105"
              >
                <div className="relative bg-white/10 p-1.5 rounded-full">
                  <RobotHead talking={false} size={32} />
                  <motion.div
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute top-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-blue-900"
                  />
                </div>
                <div className="text-left py-1">
                  <p className="font-bold text-sm leading-none tracking-wide">AI Assistant</p>
                  <p className="text-blue-200 text-[10px] font-medium mt-1 uppercase tracking-widest">Click to Open</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-4 right-4 z-50 w-[370px] max-w-[calc(100vw-24px)] h-[560px] max-h-[calc(100vh-72px)] bg-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden text-slate-800"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border" style={{ background: "linear-gradient(90deg, #1e3a8a, #1d4ed8)" }}>
              <RobotHead talking={false} size={36} />
              <div className="flex-1 min-w-0 text-left">
                <h3 className="text-white font-bold text-sm">NYAYA MITRA AI</h3>
                <p className="text-blue-200 text-[10px]">● Online • AP Police Smart Assistant</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setChatLang(l => l === "en" ? "te" : "en")}
                  className="text-[10px] px-2 py-1 rounded-full bg-white/15 text-white hover:bg-white/25 font-semibold transition">
                  {chatLang === "en" ? "తె" : "EN"}
                </button>
                <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white p-1 transition ml-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/60">
              {messages.map((msg, i) => (
                <div key={i} className="flex flex-col space-y-1">
                  <div className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-[#1e3a8a] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        <Bot className="w-3.5 h-3.5 text-blue-200" />
                      </div>
                    )}
                    
                    <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm text-left leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#1e3a8a] text-white rounded-br-sm font-semibold"
                        : "bg-white text-foreground border border-border rounded-bl-sm text-slate-700"
                    }`}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                  </div>

                  {/* Render Action Buttons below assistant message */}
                  {msg.role === "assistant" && msg.actions && (
                    <div className="flex flex-wrap gap-1.5 pl-9 pt-1">
                      {msg.actions.map((act, idx) => (
                        act.tel ? (
                          <Button key={idx} asChild size="sm" variant="outline"
                            className="text-[9px] font-bold border-red-400/40 hover:bg-red-50 text-red-650 rounded-lg py-1 px-2.5 h-auto transition shadow-sm">
                            <a href={`tel:${act.tel}`}>
                              📞 {act.label}
                            </a>
                          </Button>
                        ) : (
                          <Button key={idx} onClick={() => handleAction(act)} size="sm" variant="outline"
                            className="text-[9px] font-bold border-primary/40 hover:bg-primary/5 text-primary rounded-lg py-1 px-2.5 h-auto transition shadow-sm">
                            {act.label}
                          </Button>
                        )
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                   <div className="bg-white border border-border rounded-2xl p-3 flex items-center gap-2 shadow-sm rounded-bl-sm">
                     <Loader2 className="w-4 h-4 text-primary animate-spin" />
                     <span className="text-muted-foreground text-xs animate-pulse">NyayaAI is thinking...</span>
                   </div>
                </div>
              )}

              {/* Quick questions */}
              {messages.length <= 1 && !loading && (
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {QUICK_QUESTIONS.map(q => (
                    <button key={q.en}
                      onClick={() => sendMessage(chatLang === "te" ? q.te : q.en)}
                      className="text-left text-[10px] px-2.5 py-2.5 rounded-xl bg-white border border-border hover:border-blue-400 hover:bg-blue-50 transition flex items-center gap-1.5 shadow-sm font-medium text-slate-700">
                      <span>{q.icon}</span>
                      <span className="leading-tight">{chatLang === "te" ? q.te : q.en}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-card">
              <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={chatLang === "te" ? "మీ ప్రశ్న అడగండి..." : "Ask me anything..."}
                  className="flex-grow text-xs rounded-lg bg-white border-slate-200 text-slate-800"
                  disabled={loading}
                />
                <Button type="submit" size="icon" disabled={!input.trim() || loading}
                  className="bg-[#1e3a8a] hover:bg-blue-800 flex-shrink-0 rounded-lg shadow">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
                </Button>
              </form>
              <p className="text-[9px] text-muted-foreground text-center mt-1.5 font-mono uppercase tracking-wider">
                🔒 NYAYA MITRA AI • AP Police Smart Policing Platform
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}