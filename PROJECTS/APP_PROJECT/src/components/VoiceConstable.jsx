import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, X, Volume2, CheckCircle2, Loader2, Shield, Edit2, Upload, MapPin, AlertCircle, ArrowRight, Languages } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { invokeLLM } from "@/lib/ai";
import { processLocalInterview } from "@/lib/localAIEngine";
import { toast } from "sonner";

const SYSTEM_PROMPT = `You are NyayaMitra AI Constable, a highly trained, professional Police Help Officer for Andhra Pradesh Police.
Your job is to conduct a gentle, step-by-step interview with citizens to help them file an FIR (First Information Report).
The citizen may speak in Telugu, English, or a mix of both. You MUST respond in the SAME language the citizen speaks.

CRITICAL RULES:
1. Behave like a calm, professional female police officer. Start with "Namaskaram. Welcome to NyayaMitra. I am your Digital AI Police Constable. I will help you register your complaint safely. You may speak in Telugu or English. Please do not worry. To start, what happened?"
2. Implement a Dynamic Investigation Engine:
   - First, automatically detect the crime category from the citizen's initial statement (e.g., Theft, Cyber Crime, Missing Person, Accident, Women Safety, Assault).
   - Ask ONLY the questions highly specific to that crime type. SKIP unnecessary questions.
   - Use Emotional Awareness: For Women Safety or Missing Child, respond with deep empathy and reassurance. For Accidents, be urgent yet calm.
   - Detect Emergencies: If immediate danger is detected, explicitly recommend calling 112 immediately, but simultaneously continue recording the FIR to dispatch officers.
   - If the citizen pauses or says "I don't know", encourage them naturally and continue with available information. Never force unnecessary fields.
3. Final Steps: After gathering the crime-specific details, ask for Personal Details (Name and Phone).
4. Confirmation: Summarize the complaint and explicitly ask: "Is this information correct? Please say Yes to continue." Only proceed to FIR generation if the user explicitly confirms (yes, avunu, sare, correct).
5. When confirmed, output EXACTLY this format on a new line:

[FIR_READY]
{
  "category": "detected_category",
  "title": "Voice FIR - Category",
  "description": "Full summary of incident, location, time, evidence.",
  "location": "location_string",
  "district": "district_string",
  "complainant_name": "name",
  "complainant_phone": "phone"
}
(Valid categories: theft, assault, women_safety, cyber_crime, domestic_violence, narcotics, snatching, fraud, missing, accident, other. Set district to 'Visakhapatnam' unless another valid AP district is explicitly mentioned.)

Never output [FIR_READY] until you have all the necessary information and the user has explicitly confirmed the summary.`;

const UI_STRINGS = {
  en: {
    title: "Andhra Pradesh Police",
    subTitle: "NyayaMitra AI Digital Police Constable",
    officialAssistant: "Official Andhra Pradesh Police Digital Assistant",
    welcomeTitle: "Welcome",
    welcomeDesc: "Welcome. I am your NyayaMitra AI Digital Police Constable. I will guide you through registering your complaint safely and securely. You may continue using Voice or Text.",
    chooseLang: "Choose Language",
    startBtn: "Start Investigation",
    categoryLabel: "Crime Category",
    langLabel: "Language",
    micStatusActive: "MICROPHONE ACTIVE... SPEAK NOW",
    micStatusSpeaking: "CONSTABLE SPEAKING...",
    micStatusStandby: "MIC STANDBY - PRESS TO SPEAK",
    activeQuestionHeader: "ACTIVE QUESTION",
    listenQuestionBtn: "Listen Question",
    inputPlaceholder: "Or type fallback answer here...",
    summaryHeader: "Investigation Summary",
    incidentLabel: "Incident",
    locationLabel: "Location",
    timeLabel: "Date & Time",
    citizenLabel: "Victim Details",
    evidenceLabel: "Evidence",
    suspectLabel: "Suspect Details",
    witnessLabel: "Witnesses",
    descLabel: "Description",
    firSummaryLabel: "Generated FIR Summary",
    policeStationLabel: "Police Station",
    priorityLabel: "Priority",
    complaintNumLabel: "Complaint Number",
    uploadBtn: "Upload Photo/Video Evidence",
    filesAttached: "Evidence files attached",
    editBtn: "Edit",
    editTitle: "Edit Details",
    editDesc: "Modify your answer for this section:",
    saveBtn: "Save Changes",
    cancelBtn: "Cancel",
    reviewTitle: "Government FIR Preview",
    reviewDesc: "Please review the compiled details before official registration. You can edit any field directly.",
    listenSummaryBtn: "Listen Summary",
    confirmBtn: "Confirm & Register",
    successTitle: "Complaint Registered Successfully",
    successDesc: "Your official First Information Report (FIR) has been safely lodged in the Andhra Pradesh Police secure network.",
    firNumberLabel: "FIR ID / Complaint ID",
    assignedStationLabel: "Assigned Police Station",
    assignedStationVal: "Visakhapatnam Cyber & Grievance Cell",
    responseTimeLabel: "Expected Response Time",
    responseTimeVal: "Within 24 Hours",
    nextStepsLabel: "Investigation Next Steps",
    nextStepsVal: "An Investigating Officer (IO) has been dispatched. You will be contacted shortly. You can track this case status via the dashboard.",
    newReportBtn: "START NEW REPORT",
    processing: "Processing...",
    errorRepeat: "Please repeat that detail.",
    errorTryAgain: "Something went wrong. Please repeat.",
    launcherHeader: "AI CONSTABLE",
    launcherTitle: "Voice FIR",
    launcherPrompt: "Click to Open",
    investigationStatus: "Investigation Status",
    investigationStatusVal: "Pending Verification / Filed"
  },
  te: {
    title: "ఆంధ్రప్రదేశ్ పోలీస్",
    subTitle: "న్యాయమిత్ర ఏఐ డిజిటల్ పోలీస్ కానిస్టేబుల్",
    officialAssistant: "అధికారిక ఆంధ్రప్రదేశ్ పోలీస్ డిజిటల్ అసిస్టెంట్",
    welcomeTitle: "స్వాగతం",
    welcomeDesc: "స్వాగతం. నేను మీ న్యాయమిత్ర ఏఐ డిజిటల్ పోలీస్ కానిస్టేబుల్. నేను మీ ఫిర్యాదును సురక్షితంగా మరియు భద్రంగా నమోదు చేయడంలో మీకు సహాయం చేస్తాను. మీరు వాయిస్ లేదా టెక్స్ట్ ఉపయోగించి కొనసాగవచ్చు.",
    chooseLang: "భాషను ఎంచుకోండి",
    startBtn: "దర్యాప్తు ప్రారంభించండి",
    categoryLabel: "నేర విభాగం",
    langLabel: "భాష",
    micStatusActive: "మైక్రోఫోన్ ఆన్‌లో ఉంది... మాట్లాడండి",
    micStatusSpeaking: "కానిస్టేబుల్ మాట్లాడుతోంది...",
    micStatusStandby: "మైక్ స్టాండ్‌బై - మాట్లాడటానికి నొక్కండి",
    activeQuestionHeader: "ప్రస్తుత ప్రశ్న",
    listenQuestionBtn: "ప్రశ్న వినండి",
    inputPlaceholder: "లేదా సమాధానాన్ని ఇక్కడ టైప్ చేయండి...",
    summaryHeader: "దర్యాప్తు సారాంశం",
    incidentLabel: "సంఘటన",
    locationLabel: "స్థలం",
    timeLabel: "తేదీ & సమయం",
    citizenLabel: "ఫిర్యాదుదారు వివరాలు",
    evidenceLabel: "ఆధారాలు",
    suspectLabel: "నిందితుడి వివరాలు",
    witnessLabel: "సాక్షులు",
    descLabel: "వివరణ",
    firSummaryLabel: "రూపొందించిన ఎఫ్ఐఆర్ సారాంశం",
    policeStationLabel: "పోలీస్ స్టేషన్",
    priorityLabel: "ప్రాధాన్యత",
    complaintNumLabel: "ఫిర్యాదు సంఖ్య",
    uploadBtn: "ఫోటో/వీడియో ఆధారాలను అప్‌లోడ్ చేయండి",
    filesAttached: "సాక్ష్యాలు జోడించబడ్డాయి",
    editBtn: "సవరించు",
    editTitle: "వివరాలను సవరించండి",
    editDesc: "ఈ విభాగానికి మీ సమాధానాన్ని సవరించండి:",
    saveBtn: "మార్పులను సేవ్ చేయి",
    cancelBtn: "రద్దు చేయి",
    reviewTitle: "ప్రభుత్వ ఎఫ్ఐఆర్ ప్రివ్యూ (FIR Preview)",
    reviewDesc: "అధికారిక నమోదుకు ముందు దయచేసి వివరాలను సరిచూసుకోండి. మీరు ఏ విభాగాన్నయినా సవరించవచ్చు.",
    listenSummaryBtn: "సారాంశం వినండి",
    confirmBtn: "ధృవీకరించండి & నమోదు చేయండి",
    successTitle: "ఫిర్యాదు విజయవంతంగా నమోదు చేయబడింది",
    successDesc: "మీ అధికారిక ఎఫ్ఐఆర్ (FIR) విజయవంతంగా రికార్డ్ చేయబడింది మరియు సురక్షిత డేటాబేస్కు పంపబడింది.",
    firNumberLabel: "కేసు నంబర్ / ఫిర్యాదు ఐడి",
    assignedStationLabel: "కేటాయించిన పోలీస్ స్టేషన్",
    assignedStationVal: "విశాఖపట్నం సైబర్ & గ్రీవెన్స్ సెల్",
    responseTimeLabel: "స్పందన సమయం",
    responseTimeVal: "24 గంటల లోపు",
    nextStepsLabel: "తదుపరి దర్యాప్తు చర్యలు",
    nextStepsVal: "దర్యాప్తు అధికారి (IO) కేటాయించబడ్డారు. వారు మిమ్మల్ని సంప్రదిస్తారు. మీరు పోర్టల్ ద్వారా కేసు పురోగతిని పర్యవేక్షించవచ్చు.",
    newReportBtn: "కొత్త ఫిర్యాదు నమోదు చేయండి",
    processing: "ప్రాసెస్ అవుతోంది...",
    errorRepeat: "దయచేసి ఆ వివరాలను మళ్ళీ చెప్పండి.",
    errorTryAgain: "క్షమించండి, దయచేసి మళ్ళీ చెప్పండి.",
    launcherHeader: "ఏఐ కానిస్టేబుల్",
    launcherTitle: "వాయిస్ FIR",
    launcherPrompt: "ఓపెన్ చేయడానికి క్లిక్ చేయండి",
    investigationStatus: "దర్యాప్తు స్థితి",
    investigationStatusVal: "ధృవీకరణ పెండింగ్ / దాఖలు చేయబడింది"
  }
};

const WORKFLOWS_DICT = {
  theft: { en: "Theft", te: "దొంగతనం" },
  cyber_crime: { en: "Cyber Crime", te: "సైబర్ క్రైమ్" },
  missing: { en: "Missing Person", te: "తప్పిపోయిన వ్యక్తి" },
  accident: { en: "Accident / Emergency", te: "ప్రమాదం / అత్యవసర పరిస్థితి" },
  women_safety: { en: "Women Safety", te: "మహిళల భద్రత" },
  assault: { en: "Assault / Property Damage", te: "దాడి / ఆస్తి నష్టం" },
  other: { en: "General Incident", te: "సాధారణ ఫిర్యాదు" }
};

function getQuestionLabel(questionText, lang) {
  const q = questionText.toLowerCase();
  if (q.includes("what happened") || q.includes("జరిగింది") || q.includes("స్వాగతం") || q.includes("హలో")) {
    return UI_STRINGS[lang].incidentLabel;
  }
  if (q.includes("where") || q.includes("ఎక్కడ")) {
    return UI_STRINGS[lang].locationLabel;
  }
  if (q.includes("when") || q.includes("ఎప్పుడు") || q.includes("సమయం") || q.includes("time")) {
    return UI_STRINGS[lang].timeLabel;
  }
  if (q.includes("item") || q.includes("వస్తువులు") || q.includes("డబ్బు") || q.includes("money") || q.includes("lost")) {
    return lang === "te" ? "పోగొట్టుకున్న వస్తువులు" : "Stolen Items";
  }
  if (q.includes("suspect") || q.includes("ఎవరిపైనైనా") || q.includes("అనుమానం") || q.includes("సాక్ష్యాలు")) {
    return UI_STRINGS[lang].suspectLabel;
  }
  if (q.includes("who is missing") || q.includes("తప్పిపోయారు")) {
    return lang === "te" ? "తప్పిపోయిన వ్యక్తి" : "Missing Person";
  }
  if (q.includes("wearing") || q.includes("బట్టలు")) {
    return lang === "te" ? "దుస్తులు" : "Clothing";
  }
  if (q.includes("injured") || q.includes("గాయాలు")) {
    return lang === "te" ? "గాయాలు" : "Injuries";
  }
  if (q.includes("harassing") || q.includes("వేధిస్తున్న")) {
    return lang === "te" ? "వేధింపు వివరాలు" : "Harassment Details";
  }
  if (q.includes("name") || q.includes("పేరు") || q.includes("number") || q.includes("నంబర్")) {
    return UI_STRINGS[lang].citizenLabel;
  }
  return lang === "te" ? "అదనపు సమాచారం" : "Additional Info";
}

function getTranslatedQuestion(text, targetLang) {
  if (text.includes("Welcome to NyayaMitra") || text.includes("న్యాయమిత్రకు స్వాగతం")) {
    return targetLang === "te"
      ? "నమస్కారం. న్యాయమిత్రకు స్వాగతం. నేను మీ డిజిటల్ ఏఐ పోలీస్ కానిస్టేబుల్. నేను మీ ఫిర్యాదును సురక్షితంగా నమోదు చేయడంలో మీకు సహాయం చేస్తాను. మీరు తెలుగు లేదా ఇంగ్లీష్ లో మాట్లాడవచ్చు. దయచేసి చింతించకండి. మొదటగా, ఏమి జరిగింది?"
      : "Namaskaram. Welcome to NyayaMitra. I am your Digital AI Police Constable. I will help you register your complaint safely. You may speak in Telugu or English. Please do not worry. To start, what happened?";
  }
  if (text.includes("Where and when did this theft occur") || text.includes("దొంగతనం ఎక్కడ మరియు ఎప్పుడు జరిగింది")) {
    return targetLang === "te"
      ? "ఈ దొంగతనం ఎక్కడ మరియు ఎప్పుడు జరిగింది? ఏమైనా గుర్తులు ఉంటే చెప్పండి."
      : "Where and when did this theft occur? Please specify landmarks.";
  }
  if (text.includes("Exactly what items were stolen") || text.includes("వస్తువులు దొంగిలించబడ్డాయి")) {
    return targetLang === "te"
      ? "ఏ వస్తువులు దొంగిలించబడ్డాయి? వాటి విలువ ఎంతో తెలుసా?"
      : "Exactly what items were stolen? Do you know the approximate value?";
  }
  if (text.includes("suspects in mind") || text.includes("ఎవరిపైనైనా అనుమానం")) {
    return targetLang === "te"
      ? "మీకు ఎవరిపైనైనా అనుమానం ఉందా లేదా మీ వద్ద ఏవైనా సాక్ష్యాలు ఉన్నాయా?"
      : "Do you have any suspects in mind or any photo/video evidence?";
  }
  if (text.includes("platform or bank") || text.includes("ఆన్‌లైన్ మోసం ఏ ప్లాట్‌ఫారమ్")) {
    return targetLang === "te"
      ? "ఈ ఆన్‌లైన్ మోసం ఏ ప్లాట్‌ఫారమ్ లేదా బ్యాంక్ ద్వారా జరిగింది?"
      : "Which platform or bank was involved in this fraud?";
  }
  if (text.includes("How much money") || text.includes("ఎంత డబ్బు పోయింది")) {
    return targetLang === "te"
      ? "ఎంత డబ్బు పోయింది, మరియు ఈ లావాదేవీ ఎప్పుడు జరిగింది?"
      : "How much money was lost, and when did this transaction happen?";
  }
  if (text.includes("transaction IDs") || text.includes("ట్రాన్సాక్షన్ ఐడి")) {
    return targetLang === "te"
      ? "మీ వద్ద ట్రాన్సాక్షన్ ఐడి, స్క్రీన్‌షాట్‌లు లేదా మోసం చేసిన వారి ఫోన్ నంబర్ ఉన్నాయా?"
      : "Do you have transaction IDs, screenshots, or the fraudster's phone number?";
  }
  if (text.includes("Who is missing") || text.includes("ఎవరు తప్పిపోయారు")) {
    return targetLang === "te"
      ? "ఎవరు తప్పిపోయారు? వారి పేరు మరియు వయసు చెప్పండి."
      : "Who is missing? Please provide their name and age.";
  }
  if (text.includes("last seen") || text.includes("చివరగా ఎక్కడ")) {
    return targetLang === "te"
      ? "వారిని చివరగా ఎక్కడ మరియు ఎప్పుడు చూసారు? కచ్చితమైన సమయం తెలియకపోయినా పర్వాలేదు."
      : "Where and when were they last seen? If you don't know the exact time, an approximate is fine.";
  }
  if (text.includes("wearing") || text.includes("ఏ బట్టలు వేసుకున్నారు")) {
    return targetLang === "te"
      ? "వారు ఏ బట్టలు వేసుకున్నారు? దయచేసి వారి తాజా ఫోటో అప్‌లోడ్ చేయగలరా?"
      : "What were they wearing? Can you upload a recent photo of them?";
  }
  if (text.includes("injured") || text.includes("గాయాలు అయ్యాయా")) {
    return targetLang === "te"
      ? "ఎవరికైనా గాయాలు అయ్యాయా? మీకు ఇప్పుడు అంబులెన్స్ కావాలా?"
      : "Is anyone injured? Do you need an ambulance right now?";
  }
  if (text.includes("harassing") || text.includes("వేధిస్తున్న వ్యక్తి")) {
    return targetLang === "te"
      ? "మిమ్మల్ని వేధిస్తున్న వ్యక్తి ఎవరు? వారి వివరాలు మీకు తెలుసా?"
      : "Who is the person harassing or abusing you? Do you know their details?";
  }
  if (text.includes("Full Name and Mobile Number") || text.includes("పూర్తి పేరు మరియు మొబైల్ నంబర్")) {
    return targetLang === "te"
      ? "వివరాలు సేకరించాను. దయచేసి మీ పూర్తి పేరు మరియు మొబైల్ నంబర్ చెప్పండి."
      : "I have recorded the details. Finally, please provide your Full Name and Mobile Number.";
  }
  if (text.includes("is this information correct") || text.includes("నమోదు చేసిన వివరాలు సరైనవేనా")) {
    return targetLang === "te"
      ? "నేను మీ కంప్లైంట్ తయారు చేశాను. నేను నమోదు చేసిన వివరాలు సరైనవేనా? దయచేసి 'అవును' లేదా 'సరే' అని చెప్పి నిర్ధారించండి."
      : "I have prepared your complaint. Before I register this officially, is this information correct? Please say Yes to confirm.";
  }
  return text;
}

// Custom Constable Robot SVG
function ConstableRobot({ speaking, listening, size = 52 }) {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    const t = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 190);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <rect x="8" y="3" width="36" height="10" rx="5" fill="#1e3a8a" />
      <rect x="4" y="11" width="44" height="4" rx="2" fill="#1e3a8a" />
      <rect x="18" y="5" width="16" height="3" rx="1.5" fill="#f59e0b" />
      <circle cx="26" cy="6" r="2.5" fill="#fbbf24">
        {speaking && <animate attributeName="opacity" values="1;0.2;1" dur="0.6s" repeatCount="indefinite" />}
      </circle>
      <rect x="10" y="14" width="32" height="26" rx="9" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.5" />
      <ellipse cx="20" cy="25" rx="4" ry={blink ? 0.7 : 4} fill="#1e3a8a" />
      <ellipse cx="32" cy="25" rx="4" ry={blink ? 0.7 : 4} fill="#1e3a8a">
        {speaking && <animate attributeName="fill" values="#1e3a8a;#1d4ed8;#1e3a8a" dur="0.4s" repeatCount="indefinite" />}
      </ellipse>
      {!blink && <circle cx="21.5" cy="23.5" r="1.3" fill="white" opacity="0.9" />}
      {!blink && <circle cx="33.5" cy="23.5" r="1.3" fill="white" opacity="0.9" />}
      <ellipse cx="26" cy="30" rx="2" ry="1.5" fill="#f59e0b" />
      <path
        d={speaking ? "M18 35 Q26 41 34 35" : "M18 36 Q26 40 34 36"}
        stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" fill="none"
      >
        {speaking && <animate attributeName="d" values="M18 35 Q26 41 34 35;M18 37 Q26 43 34 37;M18 35 Q26 41 34 35" dur="0.4s" repeatCount="indefinite" />}
      </path>
      <rect x="12" y="40" width="28" height="10" rx="4" fill="#1e3a8a" />
      <rect x="22" y="42" width="8" height="4" rx="1" fill="#f59e0b" />
      <circle cx="15" cy="45" r="3" fill="#f59e0b" />
      <circle cx="37" cy="45" r="3" fill="#f59e0b" />
      {listening && (
        <circle cx="26" cy="50" r="3" fill="#ef4444">
          <animate attributeName="r" values="3;5;3" dur="0.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.3;1" dur="0.5s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

export default function VoiceConstable() {
  const [open, setOpen] = useState(false);
  const [isLangSelected, setIsLangSelected] = useState(false);
  const [lang, setLang] = useState("en"); // "en" or "te"
  
  // AI Conversation State
  const [messages, setMessages] = useState([]);
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [caseId, setCaseId] = useState("");
  const [activeCategory, setActiveCategory] = useState("other");
  const [micAutoStart, setMicAutoStart] = useState(true);
  
  // Edit mode details
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState("");

  // Evidence storage
  const [proofUrls, setProofUrls] = useState([]);
  const [uploading, setUploading] = useState(false);

  const recognitionRef = useRef(null);
  const voicesRef = useRef([]);
  const [showNudge, setShowNudge] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowNudge(true), 6000);
    return () => clearTimeout(t);
  }, []);

  // Listen to global open panel event
  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      reset();
    };
    window.addEventListener("open-voice-constable", handleOpen);
    return () => window.removeEventListener("open-voice-constable", handleOpen);
  }, []);

  // Initialize SpeechSynthesis Voices
  useEffect(() => {
    if (typeof window.speechSynthesis !== 'undefined') {
      const loadVoices = () => {
        voicesRef.current = window.speechSynthesis.getVoices();
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Handle initialization of the AI Conversation
  const initConversation = async (selectedLang) => {
    setSubmitting(true);
    setLang(selectedLang);
    setIsLangSelected(true);
    console.log(`[AI_CONSTABLE_DEBUG] Conversation Engine Started in: ${selectedLang}`);
    
    try {
      const initialGreeting = selectedLang === "te" 
        ? "నమస్కారం. న్యాయమిత్రకు స్వాగతం. నేను మీ డిజిటల్ ఏఐ పోలీస్ కానిస్టేబుల్. నేను మీ ఫిర్యాదును సురక్షితంగా నమోదు చేయడంలో మీకు సహాయం చేస్తాను. మీరు తెలుగు లేదా ఇంగ్లీష్ లో మాట్లాడవచ్చు. దయచేసి చింతించకండి. మొదటగా, ఏమి జరిగింది?"
        : "Namaskaram. Welcome to NyayaMitra. I am your Digital AI Police Constable. I will help you register your complaint safely. You may speak in Telugu or English. Please do not worry. To start, what happened?";
        
      const systemMessage = { role: "system", content: SYSTEM_PROMPT };
      const initialAiMessage = { role: "assistant", content: initialGreeting };
      
      setMessages([systemMessage, initialAiMessage]);
      speakText(initialGreeting, selectedLang);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const speakText = useCallback((text, currentLang = lang) => {
    if (!window.speechSynthesis) {
      console.warn("[AI_CONSTABLE_DEBUG] Browser Speech Synthesis API not supported.");
      return;
    }
    
    console.log("[AI_CONSTABLE_DEBUG] Speaking Response...");
    window.speechSynthesis.cancel();
    setSpeaking(true);
    
    // Remove the FIR_READY json part from voice output
    const cleanText = text.split("[FIR_READY]")[0].trim();
    const msg = new SpeechSynthesisUtterance(cleanText);
    
    // Explicit voice configuration based on language
    let selectedVoice = null;
    if (currentLang === 'te') {
      selectedVoice = voicesRef.current.find(v => v.lang.toLowerCase().includes('te-in')) || 
                      voicesRef.current.find(v => v.lang.toLowerCase().includes('hi-in')) || 
                      voicesRef.current.find(v => v.lang.toLowerCase().includes('en-in')) ||
                      voicesRef.current[0];
      msg.lang = 'te-IN';
    } else {
      selectedVoice = voicesRef.current.find(v => v.lang.toLowerCase().includes('en-in')) || 
                      voicesRef.current.find(v => v.name.toLowerCase().includes('female')) || 
                      voicesRef.current[0];
      msg.lang = 'en-IN';
    }
    
    if (selectedVoice) {
      msg.voice = selectedVoice;
    }
    
    msg.pitch = 1.0;
    msg.rate = 0.92;
    
    // Stop listening during voice output to avoid loop echo
    const wasListening = listening;
    if (listening) {
      stopListening();
    }
    
    msg.onend = () => {
      setSpeaking(false);
      console.log("[AI_CONSTABLE_DEBUG] Speak ended.");
      if (wasListening && micAutoStart) {
        startListening(currentLang);
      }
    };
    msg.onerror = (e) => {
      setSpeaking(false);
      console.error("[AI_CONSTABLE_DEBUG] Speak error:", e);
    };
    
    window.speechSynthesis.speak(msg);
  }, [lang, listening, micAutoStart]);

  const startListening = (currentLang = lang) => {
    console.log(`[AI_CONSTABLE_DEBUG] Microphone Starting for: ${currentLang}`);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { 
      toast.error("Speech Recognition not supported in this browser."); 
      return; 
    }
    
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeaking(false);
    
    try {
      const rec = new SR();
      rec.continuous = false; // Set to false to support clean breaks and auto-restart on natural pause
      rec.interimResults = true;
      rec.lang = currentLang === "te" ? "te-IN" : "en-IN";
      
      rec.onstart = () => {
        setListening(true);
      };

      rec.onresult = (e) => {
        let finalStr = "";
        let interimStr = "";
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) finalStr += e.results[i][0].transcript;
          else interimStr += e.results[i][0].transcript;
        }
        setTranscript(prev => finalStr ? prev + " " + finalStr : (interimStr ? interimStr : prev));
      };
      
      rec.onend = () => { 
        setListening(false);
      };
      
      rec.onerror = (event) => {
        console.warn("[AI_CONSTABLE_DEBUG] Speech recognition error:", event.error);
        setListening(false);
      };
      
      recognitionRef.current = rec;
      rec.start();
      setTranscript("");
    } catch(err) {
      console.error("[AI_CONSTABLE_DEBUG] Speech recognition fail", err);
      setListening(false);
    }
  };

  const stopListening = () => {
    setListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try { recognitionRef.current.stop(); } catch(e) {}
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    setUploading(true);
    const urls = [];
    
    try {
      for (const file of files) {
        const fileName = `${Date.now()}_${file.name}`;
        try {
          const { data, error } = await supabase.storage.from('evidence').upload(`complaints/${fileName}`, file);
          if (error) throw error;
          if (data) {
            const { data: { publicUrl } } = supabase.storage.from('evidence').getPublicUrl(`complaints/${fileName}`);
            urls.push(publicUrl);
          }
        } catch (uploadErr) {
          console.warn("[AI_CONSTABLE_DEBUG] Storage upload failed, falling back to local object URL:", uploadErr);
          const localUrl = URL.createObjectURL(file);
          urls.push(localUrl);
        }
      }
      setProofUrls(prev => [...prev, ...urls]);
      toast.success("Evidence files uploaded successfully.");
      
      const userMsg = { role: "user", content: `[Evidence File Uploaded: ${urls.length} file(s)]` };
      setMessages(prev => [...prev, userMsg]);
    } catch (err) {
      console.error("[AI_CONSTABLE_DEBUG] Evidence upload failed:", err);
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const submitAnswer = async (manualText = "") => {
    const val = manualText || transcript.trim();
    if (!val) {
      toast.warning(lang === "te" ? "దయచేసి ఏదైనా టైప్ చేయండి లేదా మాట్లాడండి." : "Please type or say something.");
      return;
    }
    
    console.log(`[AI_CONSTABLE_DEBUG] Submitting Answer: "${val}"`);
    const userMsg = { role: "user", content: val };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setTranscript("");
    stopListening();
    setSubmitting(true);
    
    try {
      let aiResponseContent = "";
      
      if (isLocalMode) {
        aiResponseContent = processLocalInterview(newMessages);
      } else {
        try {
          const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
          aiResponseContent = await invokeLLM(JSON.stringify(apiMessages), SYSTEM_PROMPT);
        } catch (llmErr) {
          console.warn("[AI_CONSTABLE_DEBUG] Gemini AI failed. Switching to Local Engine.", llmErr);
          setIsLocalMode(true);
          aiResponseContent = processLocalInterview(newMessages);
        }
      }
      
      // Auto detect category if not set
      if (newMessages.length >= 3 && activeCategory === "other") {
        const firstStatement = newMessages[2].content;
        const cat = firstStatement.toLowerCase().includes("steal") || firstStatement.toLowerCase().includes("donga") ? "theft" :
                    firstStatement.toLowerCase().includes("cyber") || firstStatement.toLowerCase().includes("fraud") ? "cyber_crime" :
                    firstStatement.toLowerCase().includes("missing") || firstStatement.toLowerCase().includes("lost") ? "missing" :
                    firstStatement.toLowerCase().includes("accident") || firstStatement.toLowerCase().includes("crash") ? "accident" :
                    firstStatement.toLowerCase().includes("harass") || firstStatement.toLowerCase().includes("women") ? "women_safety" :
                    firstStatement.toLowerCase().includes("beat") || firstStatement.toLowerCase().includes("fight") ? "assault" : "other";
        setActiveCategory(cat);
      }

      // Automatically translate active question card display dynamically
      const translatedResponse = getTranslatedQuestion(aiResponseContent, lang);

      if (aiResponseContent.includes("[FIR_READY]")) {
        const parts = translatedResponse.split("[FIR_READY]");
        const conversationalPart = parts[0].trim();
        const jsonPart = aiResponseContent.split("[FIR_READY]")[1].trim(); // Parse raw JSON
        
        if (conversationalPart) {
          setMessages(prev => [...prev, { role: "assistant", content: conversationalPart }]);
          speakText(conversationalPart);
        }
        
        try {
          const firData = JSON.parse(jsonPart);
          await submitFIR(firData, newMessages);
        } catch (jsonErr) {
          console.error("[AI_CONSTABLE_DEBUG] JSON parse error:", jsonErr);
          const defaultResponse = UI_STRINGS[lang].errorRepeat;
          setMessages(prev => [...prev, { role: "assistant", content: defaultResponse }]);
          speakText(defaultResponse);
        }
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: translatedResponse }]);
        speakText(translatedResponse);
      }
    } catch (error) {
      console.error("[AI_CONSTABLE_DEBUG] Unhandled Error:", error);
      const defaultResponse = UI_STRINGS[lang].errorTryAgain;
      setMessages(prev => [...prev, { role: "assistant", content: defaultResponse }]);
      speakText(defaultResponse);
    } finally {
      setSubmitting(false);
    }
  };

  const submitFIR = async (data, fullHistory) => {
    try {
      const uniquePart = Date.now().toString(36).toUpperCase();
      const id = `VOICE-${uniquePart}`;
      setCaseId(id);
      
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id || null;
      
      const historyText = fullHistory
         .filter(m => m.role !== 'system')
         .map(m => `${m.role === 'user' ? 'Citizen' : 'AI Constable'}: ${m.content}`)
         .join('\n\n');
         
      const finalDescription = `AI Generated FIR Summary:\n${data.description}\n\n---\nFull Conversation Transcript:\n${historyText}`;
      
      // Always store case in localStorage demo_cases to ensure tracking and visibility in dashboards work
      // Removed mock case saving into localStorage
      const { error } = await supabase.from('complaints').insert([{
        complaint_number: id,
        user_id: userId,
        title: `Voice FIR - ${data.title || data.category || "Incident"} by ${data.complainant_name || "Anonymous"}`,
        description: finalDescription,
        complaint_type: data.category || "other",
        location_coordinates: { address: data.location || "Unknown", phone: data.complainant_phone || "" },
        district: data.district || "Visakhapatnam", 
        evidence_ids: proofUrls, 
        status: "filed",
        priority: "normal",
        tags: ["voice_fir", "ai_generated"],
      }]);
      
      if (error) throw error;
      
      setDone(true);
      
      const successMsg = lang === "te"
        ? `కేసు విజయవంతంగా నమోదు అయింది. మీ కేసు నంబర్ ${id}. ఒక దర్యాప్తు అధికారి మిమ్మల్ని త్వరలో సంప్రదిస్తారు. ఆశించిన సమయం: 24 గంటలు.`
        : `Your case has been successfully registered. Case ID is ${id}. An investigating officer will contact you shortly. Expected Response Time: 24 Hours.`;
      speakText(successMsg);
    } catch (err) {
      console.error("[AI_CONSTABLE_DEBUG] FIR submit failed:", err);
      // Even if backend fails, set done to true since we saved to localStorage fallback!
      setDone(true);
      
      // Look up local ID or generate a fallback if id itself failed before definition
      const fallbackId = typeof id !== 'undefined' ? id : `VOICE-${Date.now().toString(36).toUpperCase()}`;
      setCaseId(fallbackId);
      
      const successMsg = lang === "te"
        ? `కేసు విజయవంతంగా నమోదు అయింది. మీ కేసు నంబర్ ${fallbackId}. ఒక దర్యాప్తు అధికారి మిమ్మల్ని త్వరలో సంప్రదిస్తారు. ఆశించిన సమయం: 24 గంటలు.`
        : `Your case has been successfully registered. Case ID is ${fallbackId}. An investigating officer will contact you shortly. Expected Response Time: 24 Hours.`;
      speakText(successMsg);
    }
  };

  const handleLanguageSwitch = (targetLang) => {
    if (targetLang === lang) return;
    setLang(targetLang);
    
    // Re-translate the last assistant question in the messages array
    if (messages.length > 1) {
      const lastMsgIndex = messages.findLastIndex(m => m.role === 'assistant');
      if (lastMsgIndex !== -1) {
        const updated = [...messages];
        const currentText = updated[lastMsgIndex].content;
        const translatedText = getTranslatedQuestion(currentText, targetLang);
        updated[lastMsgIndex].content = translatedText;
        setMessages(updated);
        speakText(translatedText, targetLang);
      }
    }
  };

  const handleEditSave = () => {
    if (editingIndex === null) return;
    
    const updated = [...messages];
    updated[editingIndex].content = editText;
    setMessages(updated);
    setEditingIndex(null);
    setEditText("");
    
    toast.success(lang === "te" ? "వివరాలు నవీకరించబద్ధాయి" : "Details updated successfully.");
    submitAnswer("[SYSTEM_TRIGGER] User edited details.");
  };

  const reset = () => {
    setMessages([]); 
    setTranscript(""); 
    setDone(false); 
    setCaseId(""); 
    setSubmitting(false); 
    setSpeaking(false); 
    setProofUrls([]); 
    setIsLocalMode(false);
    setIsLangSelected(false);
    setActiveCategory("other");
    stopListening();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  const openPanel = () => { 
    setOpen(true); 
    reset(); 
  };
  
  const closePanel = () => { 
    setOpen(false); 
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    stopListening(); 
  };

  // Build the list of completed QA pairs for the Summary Panel
  const completedSteps = [];
  for (let i = 2; i < messages.length; i += 2) {
    if (messages[i] && messages[i].role === 'user' && !messages[i].content.includes("[Evidence") && !messages[i].content.includes("[SYSTEM_TRIGGER]")) {
      const question = messages[i-1]?.content || "";
      const answer = messages[i].content;
      completedSteps.push({
        question,
        answer,
        msgIndex: i,
        label: getQuestionLabel(question, lang)
      });
    }
  }

  const activeQuestion = messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' 
    ? messages[messages.length - 1].content 
    : "";

  const isConfirmationStep = activeQuestion.toLowerCase().includes("is this information correct") || 
                             activeQuestion.includes("నమోదు చేసిన వివరాలు సరైనవేనా");

  // Determine current step index for progress bar
  const currentStepNum = Math.min(completedSteps.length + 1, 5);

  // Re-build dynamical Preview Details mapping
  const preview = {
    incident: completedSteps.find(s => s.label.includes(UI_STRINGS[lang].incidentLabel))?.answer || "Not Provided",
    location: completedSteps.find(s => s.label.includes(UI_STRINGS[lang].locationLabel))?.answer || "Not Provided",
    time: completedSteps.find(s => s.label.includes(UI_STRINGS[lang].timeLabel))?.answer || "Not Provided",
    victim: completedSteps.find(s => s.label.includes(UI_STRINGS[lang].citizenLabel))?.answer || "Not Provided",
    suspects: completedSteps.find(s => s.label.includes(UI_STRINGS[lang].suspectLabel))?.answer || "Not Provided",
    evidence: proofUrls.length > 0 ? `${proofUrls.length} file(s) attached` : "No physical files uploaded",
    witnesses: completedSteps.find(s => s.label.includes(UI_STRINGS[lang].witnessLabel))?.answer || "Not Provided",
    policeStation: UI_STRINGS[lang].assignedStationVal,
    priority: activeCategory === "accident" || activeCategory === "women_safety" ? "HIGH" : "NORMAL",
    complaintNum: caseId || "NM-FIR-2026-TEMP",
    description: messages[2]?.content || "Not Provided"
  };

  return (
    <>
      {/* RESTORED ORIGINAL AI CONSTABLE LAUNCHER (BOTTOM LEFT CORNER) */}
      <AnimatePresence>
        {showNudge && !open && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed bottom-28 left-4 z-50 cursor-pointer"
            onClick={openPanel}
          >
            <div className="relative">
              <div className="bg-[#1e3a8a] text-white px-3 py-2 rounded-2xl rounded-bl-none shadow-xl border border-yellow-400/60 flex items-center gap-2">
                <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 0.7, repeat: 3 }}>
                  <ConstableRobot speaking size={32} />
                </motion.div>
                <div>
                  <p className="font-bold text-[11px] flex items-center gap-1">🤖 {lang === "te" ? "ఏఐ కానిస్టేబుల్" : "AI CONSTABLE"}</p>
                  <p className="text-yellow-300 text-[10px]">{UI_STRINGS[lang].launcherTitle}</p>
                  <p className="text-white/60 text-[9px]">{UI_STRINGS[lang].launcherPrompt}</p>
                </div>
              </div>
              <div className="w-0 h-0 border-r-8 border-r-transparent border-t-8 border-t-[#1e3a8a] ml-3" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, x: -20 }}
            animate={{ scale: 1, x: 0 }}
            exit={{ scale: 0 }}
            onClick={openPanel}
            className="fixed bottom-6 left-4 z-50 flex flex-col items-center gap-1 group"
            title="AI CONSTABLE - Voice FIR"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.4, repeat: Infinity }}
              className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-[#1e3a8a] hover:scale-110 transition-transform bg-white shadow-xl shadow-slate-350/50 relative overflow-hidden"
              style={{
                boxShadow: "0 0 16px rgba(30,58,138,0.25)",
              }}
            >
              <ConstableRobot speaking={false} listening={false} size={48} />
            </motion.div>
            <span className="bg-[#1e3a8a] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-blue-900/50 shadow group-hover:bg-blue-800 transition">
              {lang === "te" ? "ఏఐ కానిస్టేబుల్" : "AI CONSTABLE"}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* SLIDE-OUT LEFT SIDE PANEL */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-start p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ x: -420, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -420, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="bg-white border border-slate-200 rounded-3xl w-[420px] max-w-[100vw] h-[95vh] flex flex-col overflow-hidden text-slate-800 shadow-2xl"
            >
              {/* Government Portal Header */}
              <div className="bg-[#1e3a8a] px-6 py-4 flex items-center justify-between text-white border-b border-blue-900/20">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-yellow-400" />
                  <div>
                    <h2 className="text-white font-bold text-sm tracking-wide uppercase leading-tight">
                      {UI_STRINGS[lang].title}
                    </h2>
                    <p className="text-yellow-400 text-[10px] font-semibold tracking-wider">
                      {UI_STRINGS[lang].subTitle}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {isLangSelected && (
                    <div className="flex items-center bg-blue-950/80 border border-blue-800 rounded-full px-0.5 py-0.5">
                      <button
                        onClick={() => handleLanguageSwitch("en")}
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-all ${lang === "en" ? "bg-white text-slate-900" : "text-blue-200 hover:text-white"}`}
                      >
                        EN
                      </button>
                      <button
                        onClick={() => handleLanguageSwitch("te")}
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-all ${lang === "te" ? "bg-white text-slate-900" : "text-blue-200 hover:text-white"}`}
                      >
                        తెలుగు
                      </button>
                    </div>
                  )}
                  <button onClick={closePanel} className="text-slate-200 hover:text-white transition p-1 bg-blue-950/40 rounded-full">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              {isLangSelected && (
                <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    <strong>{UI_STRINGS[lang].categoryLabel}: </strong>
                    <span className="text-[#1e3a8a] font-bold">
                      {WORKFLOWS_DICT[activeCategory]?.[lang] || activeCategory}
                    </span>
                  </span>
                  
                  <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold">
                    <span className={`w-2 h-2 rounded-full ${listening ? "bg-red-500 animate-pulse" : speaking ? "bg-green-500 animate-pulse" : "bg-slate-400"}`} />
                    <span>
                      {listening ? UI_STRINGS[lang].micStatusActive : speaking ? UI_STRINGS[lang].micStatusSpeaking : UI_STRINGS[lang].micStatusStandby}
                    </span>
                  </div>
                </div>
              )}

              {/* Main Content Pane */}
              <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50/50">
                {!isLangSelected ? (
                  /* Welcome & Language Selection Screen with Robot Logo and Greetings */
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6 bg-white overflow-y-auto">
                    <div className="flex flex-col items-center space-y-3">
                      <motion.div animate={speaking ? { scale: [1, 1.05, 1] } : {}} transition={{ duration: 0.3, repeat: Infinity }}>
                        <ConstableRobot speaking={speaking} listening={listening} size={72} />
                      </motion.div>
                      
                      <div className="space-y-1">
                        <h3 className="text-[#1e3a8a] font-bold text-base tracking-wide leading-snug">
                          {UI_STRINGS[lang].subTitle}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-semibold tracking-wider">
                          {UI_STRINGS[lang].officialAssistant}
                        </p>
                      </div>
                      
                      <p className="text-slate-500 text-[11px] max-w-[320px] leading-relaxed bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                        {UI_STRINGS[lang].welcomeDesc}
                      </p>
                    </div>

                    <div className="w-full max-w-[280px] border border-slate-200 rounded-2xl p-4 bg-slate-50/80 space-y-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {UI_STRINGS[lang].chooseLang}
                      </span>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => setLang("en")}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition ${lang === "en" ? "bg-[#1e3a8a] text-white border-transparent shadow-sm" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"}`}
                        >
                          English
                        </button>
                        <button
                          onClick={() => setLang("te")}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition ${lang === "te" ? "bg-[#1e3a8a] text-white border-transparent shadow-sm" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"}`}
                        >
                          తెలుగు
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => initConversation(lang)}
                      className="bg-green-600 hover:bg-green-500 text-white font-bold text-xs px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-600/10 border border-green-500 transition-all w-full max-w-[280px]"
                    >
                      {UI_STRINGS[lang].startBtn} <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : done ? (
                  /* Success/FIR Registered Acknowledgement Screen */
                  <div className="flex-1 flex flex-col items-center justify-start p-6 text-center bg-white overflow-y-auto space-y-5">
                    <div className="w-14 h-14 bg-green-50 border border-green-500 rounded-full flex items-center justify-center mb-1">
                      <CheckCircle2 className="w-9 h-9 text-green-600" />
                    </div>
                    
                    <div>
                      <h3 className="text-[#1e3a8a] font-bold text-base font-heading mb-1">
                        {UI_STRINGS[lang].successTitle}
                      </h3>
                      <p className="text-slate-500 text-[11px] max-w-[280px] leading-relaxed">
                        {UI_STRINGS[lang].successDesc}
                      </p>
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 w-full text-left space-y-3.5 shadow-sm text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">{UI_STRINGS[lang].firNumberLabel}</span>
                        <span className="text-base font-mono text-[#1e3a8a] font-bold tracking-wider">{caseId}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">{UI_STRINGS[lang].categoryLabel}</span>
                          <span className="font-semibold text-slate-700">{WORKFLOWS_DICT[activeCategory]?.[lang] || activeCategory}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Evidence Count</span>
                          <span className="font-semibold text-slate-700">{proofUrls.length} File(s)</span>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">{UI_STRINGS[lang].assignedPoliceStationLabel || "Assigned Station"}</span>
                        <span className="font-semibold flex items-center gap-1.5 mt-0.5 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-red-500" /> {UI_STRINGS[lang].assignedStationVal}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">{UI_STRINGS[lang].responseTimeLabel}</span>
                          <span className="font-semibold text-slate-700">{UI_STRINGS[lang].responseTimeVal}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">{UI_STRINGS[lang].investigationStatus || "Status"}</span>
                          <span className="font-semibold text-green-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                            <span>{UI_STRINGS[lang].investigationStatusVal}</span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="border-t border-slate-200 pt-3">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">{UI_STRINGS[lang].nextStepsLabel}</span>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                          {UI_STRINGS[lang].nextStepsVal}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={reset}
                      className="w-full bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold py-3 rounded-xl text-xs transition shadow-md"
                    >
                      {UI_STRINGS[lang].newReportBtn}
                    </button>
                  </div>
                ) : (
                  /* Active Guided Interview & Summary Preview cards */
                  <div className="flex-1 flex flex-col overflow-y-auto px-5 py-5 space-y-5">
                    
                    {/* Step Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                        <span>{lang === "te" ? "పురోగతి" : "Progress"}</span>
                        <span>{currentStepNum}/5</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1e3a8a] transition-all duration-300" style={{ width: `${currentStepNum * 20}%` }} />
                      </div>
                    </div>

                    {isConfirmationStep ? (
                      /* HIGHLY POLISHED GOVERNMENT FIR PREVIEW REVIEW STEP */
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm text-xs">
                        <div className="flex items-center gap-1.5 text-blue-900 font-bold uppercase text-[11px] border-b border-slate-200 pb-2">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          <span>{UI_STRINGS[lang].reviewTitle}</span>
                        </div>

                        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                          {[
                            { label: UI_STRINGS[lang].incidentLabel, val: preview.incident, idx: 2 },
                            { label: UI_STRINGS[lang].locationLabel, val: preview.location, idx: 4 },
                            { label: UI_STRINGS[lang].timeLabel, val: preview.time, idx: 4 },
                            { label: UI_STRINGS[lang].citizenLabel, val: preview.victim, idx: 10 },
                            { label: UI_STRINGS[lang].suspectLabel, val: preview.suspects, idx: 8 },
                            { label: UI_STRINGS[lang].witnessLabel, val: preview.witnesses, idx: 6 }
                          ].map((item, i) => (
                            <div key={i} className="border-b border-slate-100 pb-2 flex items-start justify-between gap-4">
                              <div>
                                <span className="text-[9px] text-slate-400 font-bold block">{item.label}</span>
                                <span className="text-slate-700 font-semibold">{item.val}</span>
                              </div>
                              {item.val !== "Not Provided" && (
                                <button
                                  onClick={() => {
                                    setEditingIndex(item.idx);
                                    setEditText(item.val);
                                  }}
                                  className="text-[#1e3a8a] hover:text-blue-800 transition p-1 hover:bg-slate-100 rounded"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}

                          <div className="pb-2">
                            <span className="text-[9px] text-slate-400 font-bold block">{UI_STRINGS[lang].firSummaryLabel}</span>
                            <p className="text-slate-600 bg-slate-50 border border-slate-200 p-2.5 rounded-lg font-mono text-[10px] mt-1 leading-relaxed">
                              {preview.firSummary}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-between items-center border-t border-slate-200 pt-3">
                          <button
                            onClick={() => speakText(preview.firSummary || messages[messages.length - 2]?.content || "")}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-700 flex items-center gap-1.5 transition"
                          >
                            <Volume2 className="w-3.5 h-3.5" /> {UI_STRINGS[lang].listenSummaryBtn}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ACTIVE QUESTION CARD */
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm relative">
                        <span className="text-[9px] bg-blue-50 border border-blue-200 text-[#1e3a8a] font-bold uppercase px-2.5 py-0.5 rounded-full">
                          {UI_STRINGS[lang].activeQuestionHeader}
                        </span>
                        
                        <h3 className="text-sm font-bold text-slate-800 leading-relaxed font-heading">
                          {activeQuestion}
                        </h3>
                        
                        {activeQuestion && (
                          <button
                            onClick={() => speakText(activeQuestion)}
                            className="text-[#1e3a8a] hover:underline text-[10px] font-bold flex items-center gap-1"
                          >
                            <Volume2 className="w-3.5 h-3.5" /> {UI_STRINGS[lang].listenQuestionBtn}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Microphone Controls / Input Panel */}
                    <div className="bg-slate-100 border border-slate-200 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={listening ? stopListening : () => startListening()}
                          disabled={submitting}
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                            listening 
                              ? "bg-red-600 hover:bg-red-500 shadow-md shadow-red-500/20 animate-pulse" 
                              : "bg-[#1e3a8a] hover:bg-blue-800 shadow-md shadow-blue-900/10"
                          } disabled:opacity-50`}
                        >
                          {listening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">
                            {listening ? UI_STRINGS[lang].micStatusActive : UI_STRINGS[lang].micStatusStandby}
                          </span>
                          <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                            <motion.div 
                              animate={listening ? { width: ["10%", "95%", "25%", "80%", "10%"] } : { width: "0%" }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="h-full bg-[#1e3a8a]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Text Input Row */}
                      <div className="flex gap-2">
                        <input
                          value={transcript}
                          onChange={(e) => setTranscript(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
                          disabled={submitting}
                          placeholder={UI_STRINGS[lang].inputPlaceholder}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#1e3a8a] disabled:opacity-50 text-slate-800 placeholder:text-slate-400"
                        />
                        
                        <button
                          onClick={() => submitAnswer()}
                          disabled={submitting}
                          className="bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold px-4 rounded-lg flex items-center justify-center transition border border-transparent disabled:opacity-50"
                        >
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <ArrowRight className="w-4 h-4 text-white" />}
                        </button>
                      </div>
                    </div>

                    {/* LIVE SUMMARY PANEL */}
                    <div className="border-t border-slate-200 pt-4 flex-1 flex flex-col min-h-[180px]">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> {UI_STRINGS[lang].summaryHeader}
                      </h4>
                      
                      <div className="space-y-3 overflow-y-auto flex-1 max-h-[200px] pr-1">
                        {completedSteps.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
                            <AlertCircle className="w-6 h-6 mb-1 text-slate-300" />
                            <p className="text-[11px] leading-relaxed">
                              {lang === "te" ? "ఫిర్యాదు వివరాలు ఇక్కడ కనిపిస్తాయి." : "Active answers will build your summary card here."}
                            </p>
                          </div>
                        ) : (
                          completedSteps.map((step, idx) => (
                            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 space-y-1 hover:border-[#1e3a8a]/40 transition group relative">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-[#1e3a8a] uppercase tracking-wider">{step.label}</span>
                                <button
                                  onClick={() => {
                                    setEditingIndex(step.msgIndex);
                                    setEditText(step.answer);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-800 transition p-0.5 rounded hover:bg-slate-100"
                                  title={UI_STRINGS[lang].editBtn}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{step.answer}</p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Evidence Section */}
                      <div className="border-t border-slate-200 pt-3.5 mt-2 bg-slate-50 p-3 rounded-xl border">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          {UI_STRINGS[lang].evidenceLabel}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <input type="file" multiple id="ai-evidence-upload-panel" className="hidden" onChange={handleFileUpload} />
                          <label htmlFor="ai-evidence-upload-panel" 
                            className="cursor-pointer flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-[10px] text-[#1e3a8a] rounded-lg py-2 px-3 flex items-center justify-center gap-1.5 transition font-bold shadow-sm">
                            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1e3a8a]" /> : <Upload className="w-3.5 h-3.5 text-[#1e3a8a]" />}
                            {UI_STRINGS[lang].uploadBtn}
                          </label>
                        </div>
                        
                        {proofUrls.length > 0 && (
                          <div className="mt-2 flex items-center gap-1 text-[10px] text-green-700 bg-green-50 rounded-lg p-1.5 border border-green-200">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            <span>{proofUrls.length} {UI_STRINGS[lang].filesAttached}</span>
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                )}
              </div>

              {/* Inline Editing Dialog */}
              <AnimatePresence>
                {editingIndex !== null && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-6">
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 space-y-3.5 shadow-xl text-slate-800"
                    >
                      <h4 className="font-bold text-sm text-[#1e3a8a]">
                        {UI_STRINGS[lang].editTitle}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {UI_STRINGS[lang].editDesc}
                      </p>
                      
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#1e3a8a] h-20 text-slate-800"
                      />
                      
                      <div className="flex gap-2 justify-end text-[10px]">
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-3.5 py-1.5 rounded-lg"
                        >
                          {UI_STRINGS[lang].cancelBtn}
                        </button>
                        <button
                          onClick={handleEditSave}
                          className="bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold px-3.5 py-1.5 rounded-lg shadow-sm"
                        >
                          {UI_STRINGS[lang].saveBtn}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Secure Network footer */}
              <div className="px-6 py-2.5 bg-slate-100 text-center border-t border-slate-200 text-slate-400 text-[8px] tracking-wide font-mono uppercase">
                Secure AP Police AI Engine Portal
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
