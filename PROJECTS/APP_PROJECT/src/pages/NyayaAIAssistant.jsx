import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import {
  Brain, Send, ArrowLeft, Shield, Loader2, Zap, FileText,
  TrendingUp, AlertTriangle, Users, Clock, CheckCircle2, Lightbulb, Mic, MicOff, Volume2, Languages, MapPin
} from "lucide-react";
import moment from "moment";
import { invokeLLM } from "@/lib/ai";

const MAIN_CATEGORIES = [
  { id: "file_fir", label: { en: "🚨 File FIR", te: "🚨 ఎఫ్ఐఆర్ నమోదు" }, color: "bg-red-50 hover:bg-red-100 border-red-200" },
  { id: "ai_constable", label: { en: "🤖 AI Constable", te: "🤖 ఏఐ కానిస్టేబుల్" }, color: "bg-blue-50 hover:bg-blue-100 border-blue-200" },
  { id: "track_complaint", label: { en: "📍 Track Complaint", te: "📍 ఫిర్యాదు ట్రాకింగ్" }, color: "bg-amber-50 hover:bg-amber-100 border-amber-200" },
  { id: "women_safety", label: { en: "🛡 Women Safety", te: "🛡 మహిళల భద్రత" }, color: "bg-pink-50 hover:bg-pink-100 border-pink-200" },
  { id: "cyber_crime", label: { en: "💻 Cyber Crime", te: "💻 సైబర్ నేరాలు" }, color: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200" },
  { id: "missing", label: { en: "👤 Missing Person", te: "👤 తప్పిపోయిన వ్యక్తి" }, color: "bg-slate-50 hover:bg-slate-100 border-slate-200" },
  { id: "police_map", label: { en: "🗺 Police Map", te: "🗺 పోలీస్ స్టేషన్ల మ్యాప్" }, color: "bg-green-50 hover:bg-green-100 border-green-200" },
  { id: "my_complaints", label: { en: "📄 My Complaints", te: "📄 నా ఫిర్యాదులు" }, color: "bg-teal-50 hover:bg-teal-100 border-teal-200" },
  { id: "rights", label: { en: "⚖ Know Your Rights", te: "⚖ హక్కుల వివరాలు" }, color: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200" },
  { id: "emergency", label: { en: "📞 Emergency Numbers", te: "📞 అత్యవసర నంబర్లు" }, color: "bg-orange-50 hover:bg-orange-100 border-orange-200" },
  { id: "dash_help", label: { en: "📂 Dashboard Help", te: "📂 డ్యాష్‌బోర్డ్ సహాయం" }, color: "bg-cyan-50 hover:bg-cyan-100 border-cyan-200" },
  { id: "other", label: { en: "❓ Other Questions", te: "❓ ఇతర ప్రశ్నలు" }, color: "bg-purple-50 hover:bg-purple-100 border-purple-200" }
];

const KNOWLEDGE_BASE = {
  en: {
    file_fir: {
      match: ["file fir", "how to file", "file case", "register complaint", "file complaint", "how to register a case", "file an fir", "how do i file an fir"],
      content: "To file an official complaint or First Information Report (FIR) on the NyayaMitra portal, you can use our digital police services.",
      services: "• **AI Constable Voice FIR**: Voice-based registration.\n• **Manual Web FIR**: Standard form-based submission.",
      recommended: "AI Constable Voice FIR (for quick dynamic processing and auto-priority classification).",
      nextStep: "We recommend starting the Voice FIR for faster processing. Which option would you like to use?",
      related: "• [AI Constable], [Track Case], [Dashboard]",
      actions: [
        { label: "Start AI Constable", type: "constable" },
        { label: "Open Manual FIR", link: "/file-complaint" }
      ]
    },
    track_complaint: {
      match: ["track my complaint", "how do i track", "track case", "check status", "complaint status", "check status", "track complaint"],
      content: "Track your registered complaints and monitor the real-time timeline of your cases.",
      services: "• **Search by ID**: Track using your FIR number.\n• **Search by Phone**: Find cases linked to your mobile.\n• **Live Timeline**: View current investigating officer steps.",
      recommended: "Search by FIR ID for precise real-time stage updates.",
      nextStep: "Please click track complaint below to enter the tracking portal.",
      related: "• [My Complaints], [Notifications], [Dashboard]",
      actions: [
        { label: "Track My Complaint", link: "/track-case" }
      ]
    },
    ai_constable: {
      match: ["what is ai constable", "how does the ai constable work", "constable work", "constable function", "constable details", "voice fir details", "ai constable"],
      content: "The AI Digital Police Constable is an automated voice assistant designed to record FIRs securely.",
      services: "• **Voice Investigation**: Guided crime-specific questions.\n• **Evidence Collection**: Live photo/video uploads.\n• **Bilingual Speech**: Seamless Telugu and English dialogue.",
      recommended: "Start AI Constable interview to speak your complaint directly.",
      nextStep: "Would you like to start the AI Constable voice interview now?",
      related: "• [File FIR], [Evidence Upload], [Women Safety]",
      actions: [
        { label: "Start AI Constable", type: "constable" }
      ]
    },
    upload_evidence: {
      match: ["upload evidence", "attach file", "how to upload evidence", "upload proof", "add evidence", "uploading evidence", "evidence upload"],
      content: "All evidence (images, videos, documents) is securely saved in Supabase storage and linked to your FIR.",
      services: "• **Supported Formats**: Photos, Videos, Documents.\n• **Security**: Encrypted and accessible only by investigating officers.\n• **Sync**: Linked automatically to the police dashboard.",
      recommended: "Upload file evidence directly during the Voice FIR interview.",
      nextStep: "Would you like to start filing your report now?",
      related: "• [File FIR], [AI Constable], [Cyber Crime]",
      actions: [
        { label: "Start AI Constable", type: "constable" },
        { label: "Open Manual FIR", link: "/file-complaint" }
      ]
    },
    police_map: {
      match: ["nearest police station", "where is the police station", "police station map", "locate police", "find police station", "police map", "where is the police map"],
      content: "The live AP Police Station Map provides geo-spatial details of all station house offices.",
      services: "• **Find Nearby Station**: Locates stations close to your GPS.\n• **Contact Directory**: Shows phone numbers of active SHOs.\n• **Route Navigation**: Guides you to the station.",
      recommended: "Open the live Map to see details of the nearest Station House Officer.",
      nextStep: "Would you like me to open the Police Map now?",
      related: "• [Emergency Numbers], [Women Safety], [Dashboard]",
      actions: [
        { label: "Open Police Map", link: "/police-stations" }
      ]
    },
    cyber_crime: {
      match: ["cyber crime", "online fraud", "otp scam", "money lost", "cyber help", "what is cyber crime", "upi fraud", "bank fraud", "instagram fraud", "whatsapp fraud", "social media fraud"],
      content: "Cyber banking fraud must be reported immediately to prevent transaction settlement.",
      services: "• **Golden Hour Reporting**: Rapid fraud logging.\n• **Cyber Hotline 1930**: Direct calling link.\n• **Evidence Logging**: File transaction screenshots.",
      recommended: "Report within the **Golden Hour** (first 60 minutes) to increase recovery rates.",
      nextStep: "We recommend accessing the Golden Hour Portal or calling 1930 immediately. What would you like to do?",
      related: "• [Evidence Upload], [Track Case], [Know Your Rights]",
      actions: [
        { label: "Open Cyber Crime Portal", link: "/golden-hour-cyber" },
        { label: "Call Cyber Helpline 1930", tel: "1930" }
      ]
    },
    women_safety: {
      match: ["women safety", "how can women use", "she team", "harassment help", "safety features", "women use"],
      content: "NyayaMitra provides active protection features for women. You can set up your **Trusted Circle** for emergency alerts, view safe travel routes avoiding heatspots via the **Safe Route Map**, or dial **181** (SHE Teams) or **112** for emergencies.",
      nextStep: "Which safety feature would you like to explore?",
      related: "• [Emergency Numbers], [Police Map], [Voice FIR]",
      actions: [
        { label: "Open Women Safety", link: "/trusted-circle" },
        { label: "Safe Route Map", link: "/safe-route" }
      ]
    },
    emergency: {
      match: ["emergency", "sos", "danger", "help", "critical", "ambulance", "police helper", "emergency numbers", "emergency helplines", "100", "112", "181", "1930", "108", "101"],
      content: "🚨 **CRITICAL EMERGENCY LINE DETAILS**",
      services: "• Emergency Helpline: **112 / 100**\n• Women Safety Line (SHE Teams): **181**\n• Cyber Crime Response: **1930**\n• Medical Ambulance: **108**\n• Fire Station: **101**",
      recommended: "Call 112 / 100 immediately if you are in active danger.",
      nextStep: "Please call the helper links below immediately to dispatch police responders.",
      related: "• [Women Safety], [Cyber Crime], [Police Map]",
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
      services: "• **Secure Signup**: Encrypted profiles for citizens.\n• **Multiple Roles**: Citizen, Police, SHO, DSP, Admin.\n• **Authentication**: Fast email & password login setup.",
      recommended: "Choose the 'Citizen' role unless you are a verified police official.",
      nextStep: "Would you like to navigate to the Registration screen?",
      related: "• [Login], [Dashboard Help], [Rights]",
      actions: [
        { label: "Navigate to Register", link: "/register" }
      ]
    },
    login: {
      match: ["how do i log in", "sign in", "login account", "authentication", "how to login", "how do i login"],
      content: "You can sign in using your email and password on the secure Login page.",
      services: "• **Dashboard Redirection**: Automatic routing depending on role.\n• **Session Management**: Keeps profile active securely.\n• **Password Reset**: Fast recovery options.",
      recommended: "Log in to check live cases and receive notifications.",
      nextStep: "Would you like to open the Login page?",
      related: "• [Register], [Dashboard Help], [My Complaints]",
      actions: [
        { label: "Navigate to Login", link: "/login" }
      ]
    },
    after_fir: {
      match: ["what happens after fir", "after fir submission", "fir next steps", "after submit", "after submission"],
      content: "Once registered, the FIR is pushed to the Police dashboard.",
      services: "• **Officer Assignment**: IO verifies details within 24 hours.\n• **Timeline Updates**: Real-time status sync.\n• **Notifications**: Direct dashboard alerts.",
      recommended: "Monitor the dashboard timeline for assigned officer details.",
      nextStep: "Would you like to go to your dashboard to track updates?",
      related: "• [Track Case], [My Complaints], [Rights]",
      actions: [
        { label: "Open Dashboard", link: "/dashboard" }
      ]
    },
    change_language: {
      match: ["change the complaint language", "change language", "telugu mode", "english mode", "bilingual", "complaint language", "change the language"],
      content: "You can toggle the language toggle bar (English / తెలుగు) at the top of the portal.",
      services: "• **Instant UI Switch**: Translates dashboards, menus, and guides.\n• **Bilingual Speech**: Voice narration in the selected language.\n• **FIR Integration**: Generates FIR text correctly.",
      recommended: "Use the language selector at the top-right of this chat box.",
      nextStep: "Which language do you prefer to continue the conversation?",
      related: "• [Rights], [AI Constable], [File FIR]",
      actions: [
        { label: "Start AI Constable", type: "constable" }
      ]
    },
    dash_help: {
      match: ["dashboard help", "dashboards", "how do i access dashboards", "access dashboard", "dashboard access"],
      content: "NyayaMitra supports customized dashboards for different roles.",
      services: "• **Citizen**: File & track cases.\n• **Police & SHO**: Manage duty and write updates.\n• **DSP & DGP**: View visual heatmaps and performance analysis.\n• **Lawyers & Courts**: Digital document submission.",
      recommended: "Open your designated role dashboard to access system features.",
      nextStep: "Would you like me to navigate to your profile dashboard?",
      related: "• [My Complaints], [Track Case], [Rights]",
      actions: [
        { label: "Open Role Dashboard", link: "/dashboard" }
      ]
    },
    missing: {
      match: ["missing person", "missing child", "missing help", "find person"],
      content: "Reporting missing persons or child tracking is treated with critical priority.",
      services: "• **Urgent Report**: Record descriptors and clothes details.\n• **Recent Photo Upload**: Secure image attachment.\n• **Auto-dispatch**: Alert local police stations.",
      recommended: "Use AI Constable Voice FIR to capture all missing person markers quickly.",
      nextStep: "Would you like to start the AI Constable interview for reporting a missing person?",
      related: "• [AI Constable], [Evidence Upload], [Emergency Numbers]",
      actions: [
        { label: "Start AI Constable", type: "constable" },
        { label: "Open Manual FIR", link: "/file-complaint" }
      ]
    },
    my_complaints: {
      match: ["my complaints", "my cases", "show complaints", "my firs"],
      content: "We sync registered cases dynamically from Supabase.",
      services: "• **Timeline tracking**: Review current status of filings.\n• **Documents review**: View generated FIR records.\n• **Officer contacts**: View assigned investigating officer details.",
      recommended: "Check your Citizen Dashboard to review active cases.",
      nextStep: "Click below to review your complaints list on your Citizen Dashboard.",
      related: "• [Track Case], [Notifications], [Dashboard Help]",
      actions: [
        { label: "Open Citizen Dashboard", link: "/citizen-dashboard" }
      ]
    },
    rights: {
      match: ["know your rights", "rights info", "legal rights", "constitution rights"],
      content: "Access legal rights and procedural advice under Indian police guidelines.",
      services: "• **Constitutional Protections**: Fundamental rights information.\n• **Arrest Guidelines**: Legal constraints on police custody.\n• **Filing Procedures**: Official guidelines for registering FIRs.",
      recommended: "Open the rights portal to review your legal rights during police inquiry.",
      nextStep: "Would you like to open the Constitution & Legal Rights portal?",
      related: "• [Dashboard Help], [Track Case], [My Complaints]",
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
      related: "• [ఏఐ కానిస్టేబుల్], [కేసు ట్రాకింగ్], [డ్యాష్‌బోర్డ్]",
      actions: [
        { label: "ఏఐ కానిస్టేబుల్ ప్రారంభించండి", type: "constable" },
        { label: "మాన్యువల్ ఎఫ్ఐఆర్ ఫారమ్", link: "/file-complaint" }
      ]
    },
    track_complaint: {
      match: ["ట్రాక్", "స్థితి", "కేసు స్థితి", "ఎలా ట్రాక్ చేయాలి", "ఫిర్యాదు స్థితి"],
      content: "మీ ఫిర్యాదు పురోగతిని కేస్ ట్రాకింగ్ పేజీలో తెలుసుకోవచ్చు.",
      services: "• **ఐడి ద్వారా శోధన**: ఎఫ్ఐఆర్ ఐడి ఉపయోగించి వెతకండి.\n• **ఫోన్ ద్వారా శోధన**: మొబైల్ నంబర్ ఉపయోగించి వెతకండి.\n• **లైవ్ టైమ్‌లైన్**: కేసు పురోగతిని పర్యవేక్షించండి.",
      recommended: "ఎఫ్ఐఆర్ ఐడి ఉపయోగించి వేగంగా ట్రాక్ చేయండి.",
      nextStep: "దయచేసి మీ కేసును ట్రాక్ చేయడానికి కింద ఉన్న బటన్ క్లిక్ చేయండి.",
      related: "• [నా ఫిర్యాదులు], [నోటిఫికేషన్లు], [డ్యాష్‌బోర్డ్]",
      actions: [
        { label: "నా ఫిర్యాదు ట్రాక్ చేయండి", link: "/track-case" }
      ]
    },
    ai_constable: {
      match: ["ఏఐ కానిస్టేబుల్ అంటే ఏమిటి", "కానిస్టేబుల్ ఎలా పనిచేస్తుంది", "కానిస్టేబుల్ వివరాలు", "ఏఐ కానిస్టేబుల్"],
      content: "మా ఏఐ కానిస్టేబుల్ అనేది వాయిస్ సంభాషణ ద్వారా మీ ఎఫ్ఐఆర్ ను నమోదు చేస్తుంది.",
      services: "• **వాయిస్ దర్యాప్తు**: నేర కేటగిరీని బట్టి ప్రశ్నలు.\n• **ఆధారాల సేకరణ**: ఫోటో/వీడియో సాక్ష్యాల అప్‌లోడ్.\n• **ద్విభాషా సపోర్ట్**: తెలుగు మరియు ఇంగ్లీష్ లో మాట్లాడవచ్చు.",
      recommended: "మాట్లాడి కంప్లైంట్ నమోదు చేయడానికి ఏఐ కానిస్టేబుల్ ను ప్రారంభించండి.",
      nextStep: "మీరు ఏఐ కానిస్టేబుల్ తో సంభాషణను ప్రారంభించాలనుకుంటున్నారా?",
      related: "• [ఎఫ్ఐఆర్ నమోదు], [సాక్ష్యాల అప్‌లోడ్], [మహిళల రక్షణ]",
      actions: [
        { label: "ఏఐ కానిస్టేబుల్ ప్రారంభించండి", type: "constable" }
      ]
    },
    upload_evidence: {
      match: ["సాక్ష్యాలు", "ఫైల్ అప్‌లోడ్", "సాక్ష్యం అప్‌లోడ్", "ఆధారాలు", "ఆధారాలను ఎలా అప్‌లోడ్ చేయాలి"],
      content: "సాక్ష్యాలు (ఫోటోలు, వీడియోలు) సురక్షితంగా సూపాబేస్ స్టోరేజ్‌లో భద్రపరచబడతాయి.",
      services: "• **ఫైల్ ఫార్మాట్లు**: ఫోటోలు, వీడియోలు, పత్రాలు.\n• **భద్రత**: దర్యాప్తు అధికారులు మాత్రమే చూడగలరు.\n• **సింక్**: నేరుగా పోలీస్ డ్యాష్‌బోర్డ్‌లో నిల్వ అవుతాయి.",
      recommended: "వాయిస్ ఎఫ్ఐఆర్ సమయంలో సాక్ష్యాలను నేరుగా అప్‌లోడ్ చేయండి.",
      nextStep: "మీరు ఫిర్యాదును నమోదు చేయాలనుకుంటున్నారా?",
      related: "• [ఎఫ్ఐఆర్ నమోదు], [ఏఐ కానిస్టేబుల్], [సైబర్ క్రైమ్]",
      actions: [
        { label: "ఏఐ కానిస్టేబుల్ ప్రారంభించండి", type: "constable" },
        { label: "మాన్యువల్ ఎఫ్ఐఆర్ ఫారమ్", link: "/file-complaint" }
      ]
    },
    police_map: {
      match: ["పోలీస్ స్టేషన్ ఎక్కడ", "సమీప పోలీస్ స్టేషన్", "మ్యాప్", "లొకేషన్", "పోలీస్ స్టేషన్"],
      content: "ఆంధ్రప్రదేశ్‌లోని సమీప పోలీస్ స్టేషన్లను మ్యాప్ ద్వారా గుర్తించవచ్చు.",
      services: "• **సమీప స్టేషన్**: మీ జీపీఎస్ ఆధారంగా స్టేషన్లు.\n• **ఫోన్ నంబర్లు**: యాక్టివ్ ఎస్హెచ్ఓ వివరాలు.\n• **దారి వివరాలు**: స్టేషన్‌కు మార్గాన్ని చూపుతుంది.",
      recommended: "సమీప స్టేషన్ अधिकारियोंల వివరాలు చూడటానికి మ్యాప్ ఉపయోగించండి.",
      nextStep: "మీ కోసం పోలీస్ స్టేషన్ల మ్యాప్ ఓపెన్ చేయమంటారా?",
      related: "• [అత్యవసర నంబర్లు], [మహిళల రక్షణ], [డ్యాష్‌బోర్డ్]",
      actions: [
        { label: "పోలీస్ మ్యాప్ తెరవండి", link: "/police-stations" }
      ]
    },
    cyber_crime: {
      match: ["సైబర్ క్రైమ్", "ఆన్‌లైన్ మోసం", "బ్యాంకు మోసం", "డబ్బు పోయింది", "సైబర్ క్రైమ్ అంటే ఏమిటి", "యూపీఐ మోసం", "బ్యాంకు మోసాలు", "సోషల్ మీడియా మోసం"],
      content: "సైబర్ మోసానికి గురైనట్లయితే, మొదటి 60 నిమిషాలు (గోల్డెన్ అవర్) చాలా కీలకం.",
      services: "• **గోల్డెన్ అవర్ నివేదిక**: తక్షణ ట్రాన్స్ఫర్ నిలిపివేత.\n• **సైబర్ హెల్ప్‌లైన్ 1930**: డైరెక్ట్ కాల్ లింక్.\n• **ఆధారాల సేకరణ**: ట్రాన్సాక్షన్ స్క్రీన్‌షాట్‌ల అప్‌లోడ్.",
      recommended: "డబ్బును రక్షించుకోవడానికి గోల్డెన్ అవర్ లోపు 1930 కి కాల్ చేయండి.",
      nextStep: "వెنتనే 1930 కాల్ చేయాలని లేదా సైబర్ ఆపరేషన్స్ సెంటర్ ఉపయోగించాలని సిఫార్సు చేస్తున్నాము. మీ నిర్ణయం?",
      related: "• [సాక్ష్యాల అప్‌లోడ్], [కేసు స్థితి], [చట్టపరమైన హక్కులు]",
      actions: [
        { label: "సైబర్ పోర్టల్ తెరవండి", link: "/golden-hour-cyber" },
        { label: "1930 కి కాల్ చేయండి", tel: "1930" }
      ]
    },
    women_safety: {
      match: ["మహిళల రక్షణ", "షీ టీమ్స్", "వేధింపులు", "భద్రత", "మహిళా", "మహిళలు ఎలా ఉపయోగించాలి"],
      content: "మహిళా రక్షణ కోసం నిరంతర సహాయ సేవలు అందుబాటులో ఉన్నాయి.",
      services: "• **ట్రస్టెడ్ సర్కిల్**: అత్యవసర కాంటాక్ట్ అలర్ట్లు.\n• **సేఫ్ రూట్ మ్యాప్**: సురక్షిత ప్రయాణ మార్గాలు.\n• **SHE Teams Helpline**: 181 డైరెక్ట్ కాల్ సదుపాయం.",
      recommended: "అత్యవసర అలర్ట్ల కోసం మీ ట్రస్టెడ్ సర్కిల్ సెట్ చేసుకోండి.",
      nextStep: "ఏ సేవను ఉపయోగించాలనుకుంటున్నారు?",
      related: "• [అత్యవసర నంబర్లు], [పోలీస్ మ్యాప్], [వాయిస్ ఎఫ్ఐఆర్]",
      actions: [
        { label: "మహిళా రక్షణ పోర్టల్", link: "/trusted-circle" },
        { label: "సేఫ్ రూట్ మ్యాప్", link: "/safe-route" }
      ]
    },
    emergency: {
      match: ["అత్యవసర", "ప్రమాదం", "సహాయం", "అంబులెన్స్", "పోలీస్ హెల్ప్", "emergency", "sos", "అత్యవసర నంబర్లు", "అత్యవసర హెల్ప్‌లైన్లు", "100", "112", "181", "1930", "108", "101"],
      content: "🚨 **అత్యవసర హెల్ప్‌లైన్ వివరాలు:**",
      services: "• పోలీస్ అత్యవసర సహాయం: **112 / 100**\n• మహిళా భద్రత (SHE Teams): **181**\n• సైబర్ నేరాల నివేదిక: **1930**\n• అంబులెన్స్ సేవలు: **108**\n• ఫైర్ స్టేషన్: **101**",
      recommended: "ప్రమాదం ఉన్నప్పుడు వెంటనే 100 కి కాల్ చేయండి.",
      nextStep: "దయచేసి అత్యవసర సహాయం కోసం క్రింది నంబర్లకు కాల్ చేయండి.",
      related: "• [మహిళల రక్షణ], [సైబర్ క్రైమ్], [పోలీస్ మ్యాప్]",
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
      services: "• **సురక్షిత రిజిస్ట్రేషన్**: ఎన్క్రిప్టెడ్ ప్రొఫైల్స్.\n• **వివిధ రోల్స్**: సిటిజన్, పోలీస్, SHO, DSP, Admin.\n• **లాగిన్ వివరాలు**: ఈమెయిల్ మరియు మొబైల్ ధృవీకరణ.",
      recommended: "మీరు పోలీస్ అధికారి కాకపోతే 'Citizen' రోల్ ఎంచుకోండి.",
      nextStep: "రిజిస్ట్రేషన్ పేజీకి వెళ్లాలనుకుంటున్నారా?",
      related: "• [లాగిన్], [డ్యాష్‌బోర్డ్ సహాయం], [హక్కులు]",
      actions: [
        { label: "రిజిస్టర్ పేజీకి వెళ్ళు", link: "/register" }
      ]
    },
    login: {
      match: ["లాగిన్", "సైన్ ఇన్", "లాగిన్ అవ్వడం", "లాగిన్ ఎలా అవ్వాలి"],
      content: "మీ ఈమెయిల్ మరియు పాస్‌వర్డ్ తో సురక్షితంగా లాగిన్ అవ్వవచ్చు.",
      services: "• **డ్యాష్‌బోర్డ్ రీడైరెక్ట్**: మీ రోల్ బట్టి హోమ్ పేజీ ఓపెన్ అవుతుంది.\n• **సెషన్ భద్రత**: మీ ఖాతా సురక్షితంగా ఉంటుంది.\n• **పాస్‌వర్డ్ రికవరీ**: మర్చిపోయిన పాస్‌వర్డ్ పునరుద్ధరణ.",
      recommended: "కేసుల వివరాలు మరియు నోటిఫికేషన్లు చూడటానికి లాగిన్ అవ్వండి.",
      nextStep: "లాగిన్ పేజీ ఓపెన్ చేయమంటారా?",
      related: "• [రిజిస్టర్], [డ్యాష్‌బోర్డ్ సహాయం], [నా ఫిర్యాదులు]",
      actions: [
        { label: "లాగిన్ పేజీకి వెళ్ళు", link: "/login" }
      ]
    },
    after_fir: {
      match: ["అప్లికేషన్ అడ్మిన్", "ఎఫ్ఐఆర్ తర్వాత", "సమర్పించిన తర్వాత", "తదుపరి చర్యలు", "ఎఫ్ఐఆర్ దాఖలు చేసిన తర్వాత"],
      content: "ఎఫ్ఐఆర్ దాఖలు చేసిన తర్వాత, దర్యాప్తు ప్రక్రియ ప్రారంభమవుతుంది.",
      services: "• **అధికారి కేటాయింపు**: దర్యాప్తు అధికారి (IO) కేటాయించబడతారు.\n• **టైమ్‌లైన్ పురోగతి**: డ్యాష్‌బోర్డ్‌లో కేసు అప్‌డేట్లు.\n• **నోటిఫికేషన్లు**: కేసు మారినప్పుడల్లా అలర్ట్లు.",
      recommended: "కేటాయించిన అధికారి వివరాల కోసం డ్యాష్‌బోర్డ్ లోని టైమ్‌లైన్ గమనించండి.",
      nextStep: "డ్యాష్‌బోర్డ్ తెరవాలనుకుంటున్నారా?",
      related: "• [కేసు స్థితి], [నా ఫిర్యాదులు], [హక్కులు]",
      actions: [
        { label: "డ్యాష్‌బోర్డ్ తెరవండి", link: "/dashboard" }
      ]
    },
    change_language: {
      match: ["భాషను మార్చడం", "తెలుగు మోడ్", "ఇంగ్లీష్ మోడ్", "భాషను మార్చవచ్చా"],
      content: "స్క్రీన్ పైన ఉన్న లాంగ్వేజ్ బటన్ తో తెలుగు లేదా ఇంగ్లీష్ లోకి మార్చుకోవచ్చు.",
      services: "• **స్విచ్**: డ్యాష్‌బోర్డ్‌లు మరియు హెల్ప్ డెస్క్ తెలుగులోకి మారుతాయి.\n• **ద్విభాషా వాయిస్**: మీతో మాట్లాడే కానిస్టేబుల్ భాష మారుతుంది.\n• **ఎఫ్ఐఆర్ నివేదిక**: రెండు భాషల్లో పిడిఎఫ్ లభ్యత.",
      recommended: "ఈ చాట్ బాక్స్ పైభాగంలో కుడి వైపున ఉన్న 'తెలుగు' బటన్ క్లిక్ చేయండి.",
      nextStep: "ఏ భాషలో దర్యాప్తు కొనసాగించాలనుకుంటున్నారు?",
      related: "• [హక్కులు], [ఏఐ కానిస్టేబుల్], [ఎఫ్ఐఆర్ నమోదు]",
      actions: [
        { label: "ఏఐ కానిస్టేబుల్ ప్రారంభించండి", type: "constable" }
      ]
    },
    dash_help: {
      match: ["డ్యాష్‌బోర్డ్ సహాయం", "డ్యాష్‌బోర్డ్‌లు", "యాక్సెస్ చేయడం", "డ్యాష్‌బోర్డ్ యాక్సెస్"],
      content: "న్యాయమిత్ర వివిధ విభాగాల డ్యాష్‌బోర్డ్‌లను సపోర్ట్ చేస్తుంది.",
      services: "• **సిటిజన్**: కేసులు దాఖలు చేయడం.\n• **పోలీస్ & SHO**: విచారణలు పర్యవేక్షించడం.\n• **DSP & DGP**: క్రైమ్ హీట్ మ్యాప్స్ మరియు గణాంకాలు.\n• **కోర్టు & లాయర్**: డిజిటల్ పత్రాల సమర్పణ.",
      recommended: "మీ రోల్ ఆధారిత అధికారిక డ్యాష్‌బోర్డ్‌ను తెరవండి.",
      nextStep: "మీ అధికారిక డ్యాష్‌బోర్డ్‌ను తెరవాలనుకుంటున్నారా?",
      related: "• [నా ఫిర్యాదులు], [కేసు ట్రాకింగ్], [హక్కులు]",
      actions: [
        { label: "డ్యాష్‌బోర్డ్ తెరవండి", link: "/dashboard" }
      ]
    },
    missing: {
      match: ["తప్పిపోయిన వ్యక్తి", "తప్పిపోయిన పిల్లవాడు", "వ్యక్తి తప్పిపోయాడు"],
      content: "తప్పిపోయిన వ్యక్తులు లేదా పిల్లల వివరాలు అత్యంత ప్రాధాన్యతతో నమోదు చేయబడతాయి.",
      services: "• **వాయిస్ రిపోర్ట్**: వేగంగా హులియా వివరాల నమోదు.\n• **తాజా ఫోటో**: పోర్టల్‌లో ఫోటో జతచేయడం.\n• **పోలీస్ అలర్ట్**: సమీప స్టేషన్లకు వైర్‌లెస్ సందేశాలు.",
      recommended: "వేగంగా హులియా వివరాలు ఇవ్వడానికి ఏఐ కానిస్టేబుల్ వాయిస్ సేవలు ఉపయోగించండి.",
      nextStep: "కేసు నమోదు చేయడానికి ఏఐ కానిస్టేబుల్ ను ప్రారంభించాలా?",
      related: "• [ఏఐ కానిస్టేబుల్], [సాక్ష్యాల అప్‌లోడ్], [అत्यవసర నంబర్లు]",
      actions: [
        { label: "ఏఐ కానిస్టేబుల్ ప్రారంభించండి", type: "constable" },
        { label: "మాన్యువల్ ఎఫ్ఐఆర్ ఫారమ్", link: "/file-complaint" }
      ]
    },
    my_complaints: {
      match: ["నా ఫిర్యాదులు", "నా కేసులు", "నా ఫిర్యాదుల వివరాలు"],
      content: "రిజిస్టర్ అయిన కేసుల వివరాలు డైనమిక్‌గా మీ ఖాతాలో అప్‌డేట్ చేయబడతాయి.",
      services: "• **టైమ్‌లైన్**: విచారణ ఏ దశలో ఉందో చూడండి.\n• **పత్రాలు**: నమోదైన ఎఫ్ఐఆర్ రికార్డులు.\n• **అధికారి సంప్రదింపు**: ఇన్వెస్టిగేషన్ ఆఫీసర్ ఫోన్ నంబర్లు.",
      recommended: "మీ కేసుల ప్రగతిని చూడటానికి సిటిజన్ డ్యాష్‌బోర్డ్ ఓపెన్ చేయండి.",
      nextStep: "మీ ఫిర్యాదులను సమీక్షించడానికి కింద ఉన్న డ్యాష్‌బోర్డ్‌ను తెరవండి.",
      related: "• [కేసు ట్రాకింగ్], [నోటిఫికేషన్లు], [డ్యాష్‌బోర్డ్ సహాయం]",
      actions: [
        { label: "సిటిజన్ డ్యాష్‌బోర్డ్", link: "/citizen-dashboard" }
      ]
    },
    rights: {
      match: ["హక్కుల వివరాలు", "చట్టపరమైన హక్కులు", "నా హక్కులు"],
      content: "భారత రాజ్యాంగం ప్రకారం విచారణల సమయంలో, అరెస్ట్ సమయాలలో మరియు ఫిర్యాదుల నమోదులో మీ ప్రాథమిక చట్టపరమైన హక్కులను తెలుసుకోండి.",
      services: "• **రాజ్యాంగ హక్కులు**: చట్టపరమైన ప్రాథమిక రక్షణలు.\n• **అరెస్ట్ నిబంధనలు**: మహిళలు మరియు సిటిజన్ల అరెస్ట్ గైడ్‌లైన్స్.\n• **స్టేషన్ గైడ్‌లైన్స్**: పోలీస్ స్టేషన్‌లో ఫిర్యాదు హక్కులు.",
      recommended: "విచారణలో మీ రక్షణ కోసం ఈ హక్కుల పోర్టల్ ని చదవండి.",
      nextStep: "మీ ప్రాథమిక హక్కుల పేజీకి వెళ్లాలనుకుంటున్నారా?",
      related: "• [డ్యాష్‌బోర్డ్ సహాయం], [కేసు ట్రాకింగ్], [నా ఫిర్యాదులు]",
      actions: [
        { label: "హక్కుల పేజీకి వెళ్ళు", link: "/constitution-rights" }
      ]
    }
  }
};

function getLocalAssistantResponse(input, lang, complaints, user) {
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
    console.log(`[AI_ASSISTANT_DEBUG] Local Match Found: Key="${bestMatchKey}" Score=${maxScore}`);
    const entry = kb[bestMatchKey];
    let enrichedContent = entry.content;
    
    if (bestMatchKey === "my_complaints" && user && complaints.length > 0) {
      enrichedContent += langKey === "te"
        ? `\n\nమీ ఇటీవల కేసు నంబర్: **${complaints[0].complaint_number}** (స్థితి: ${complaints[0].status || "filed"}).`
        : `\n\nYour latest case number: **${complaints[0].complaint_number}** (Status: ${complaints[0].status || "filed"}).`;
    }
    
    return {
      content: enrichedContent,
      services: entry.services,
      recommended: entry.recommended,
      related: entry.related,
      nextStep: entry.nextStep,
      actions: entry.actions
    };
  }
  
  // Dashboard general fallback query
  if (q.includes("dashboard") || q.includes("డ్యాష్‌బోర్డ్")) {
    const role = user?.user_type || user?.role || "citizen";
    let dashLink = "/dashboard";
    if (role === "police") dashLink = "/officer-dashboard";
    else if (role === "station_house_officer") dashLink = "/station-dashboard";
    else if (role === "dsp") dashLink = "/dsp-dashboard";
    else if (role === "dgp") dashLink = "/dgp-dashboard";
    else if (role === "admin") dashLink = "/admin-panel";
    else if (role === "lawyer") dashLink = "/lawyer-dashboard";
    else if (role === "court") dashLink = "/court-dashboard";
    else if (role === "citizen") dashLink = "/citizen-dashboard";

    const servicesStr = langKey === "te"
      ? "• సిటిజన్ డ్యాష్‌బోర్డ్\n• ఆఫీసర్ డ్యాష్‌బోర్డ్\n• DSP/DGP అనలిటిక్స్"
      : "• Citizen Panel\n• Officer Duty Board\n• DSP/DGP Visual Analytics";
      
    return {
      content: langKey === "te"
        ? `మీ ఖాతా రోల్: **${role.toUpperCase()}**. మీ సంబంధిత అధికారిక డ్యాష్‌బోర్డ్‌ను ఇక్కడ యాక్సెస్ చేయండి.`
        : `Your authenticated role is **${role.toUpperCase()}**. You can access your personalized dashboard below.`,
      services: servicesStr,
      recommended: langKey === "te" ? "డ్యాష్‌బోర్డ్ తెరవండి" : "Open Primary Dashboard Link.",
      related: langKey === "te" ? "• [కేసు ట్రాకింగ్], [నా ఫిర్యాదులు]" : "• [Track Case], [My Complaints]",
      nextStep: langKey === "te" ? "డ్యాష్‌బోర్డ్ ఓపెన్ చేయమంటారా?" : "Would you like me to open the dashboard page?",
      actions: [
        { label: langKey === "te" ? "డ్యాష్‌బోర్డ్ తెరవండి" : "Open Dashboard", link: dashLink }
      ]
    };
  }

  return null;
}

export default function NyayaAIAssistant() {
  const navigate = useNavigate();
  const [lang, setLang] = useState("en"); // "en" or "te"
  const [user, setUser] = useState(null);
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const scrollRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);

  const { user: authUser, profile } = useAuth();

  // Load user data & Supabase sync details
  useEffect(() => {
    (async () => {
      const me = profile ?? authUser ?? null;
      const { data: compsData } = await supabase.from('complaints').select('*').order('created_at', { ascending: false }).limit(20);
      setUser(me);
      setComplaints(compsData || []);
    })();

    // Init speech synthesis & recognition Web APIs
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        sendMessage(transcript);
      };

      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = (e) => {
        console.error("Speech recognition error", e);
        setIsListening(false);
      };
    }
  }, [authUser, profile]);

  // Set greeting on load or language toggle
  useEffect(() => {
    const greeting = lang === "te"
      ? "నమస్కారం! **న్యాయ AI అసిస్టెంట్** కు స్వాగతం.\n\nనేను మీకు న్యాయమిత్రలోని ప్రతి సేవను సులభంగా నావిగేట్ చేయగలను. కింద ఉన్న కేటగిరీలలో ఒకదాన్ని ఎంచుకోండి."
      : "Welcome to **Nyaya AI Assistant**.\n\nI can guide you through every NyayaMitra service. Please select one of our primary service categories below to begin.";
      
    setMessages([
      { 
        role: "assistant", 
        content: greeting, 
        nextStep: lang === "te" ? "నావిగేట్ చేయడానికి కింది కేటగిరీలలో ఒకదాన్ని ఎంచుకోండి:" : "Select a service category card below to proceed:",
        isGreeting: true
      }
    ]);
  }, [lang]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.lang = lang === "te" ? "te-IN" : "en-IN"; 
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        toast.error("Speech recognition not supported in this browser.");
      }
    }
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const plainText = text.replace(/[*#]/g, '');
      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.lang = lang === "te" ? 'te-IN' : 'en-IN';
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAction = (action) => {
    if (action.type === "constable") {
      window.dispatchEvent(new CustomEvent("open-voice-constable"));
    } else if (action.link) {
      navigate(action.link);
    }
  };

  const handleCategorySelect = (catId) => {
    const category = MAIN_CATEGORIES.find(c => c.id === catId);
    if (!category) return;
    
    const userLabel = category.label[lang];
    
    setMessages(prev => [...prev, { role: "user", content: userLabel }]);
    setLoading(true);
    
    setTimeout(() => {
      const kb = KNOWLEDGE_BASE[lang];
      const entry = kb[catId];
      if (entry) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: entry.content,
          services: entry.services,
          recommended: entry.recommended,
          related: entry.related,
          nextStep: entry.nextStep,
          actions: entry.actions
        }]);
        speak(entry.content + " " + entry.nextStep);
      } else {
        const msg = lang === "te" ? "దయచేసి మీ ప్రశ్నను కింద టైప్ చేయండి." : "Please type your questions below.";
        setMessages(prev => [...prev, { role: "assistant", content: msg }]);
        speak(msg);
      }
      setLoading(false);
    }, 400);
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    
    const newMessages = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);
    
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    
    try {
      // 1. Strict Priority: Local Knowledge Engine Check
      const localResponse = getLocalAssistantResponse(msg, lang, complaints, user);
      
      if (localResponse) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: localResponse.content, 
          services: localResponse.services,
          recommended: localResponse.recommended,
          related: localResponse.related,
          nextStep: localResponse.nextStep || "What would you like to do next?",
          actions: localResponse.actions 
        }]);
        speak(localResponse.content + " " + (localResponse.nextStep || ""));
      } else {
        // 2. Fall back to LLM ONLY if offline check does not match
        const role = user?.user_type || user?.role || "citizen";
        const systemPrompt = `You are the NyayaAI Project Assistant for NyayaMitra AP Police Platform.
        Active User Role: ${role.toUpperCase()}
        Language Mode: ${lang === "te" ? "Telugu" : "English"}. Respond strictly in this language.
        Guidelines: Answer questions referring to NyayaMitra pages. Ensure every answer provides:
        1. A direct answer.
        2. A list of available services.
        3. A recommended option.
        4. A next recommended action.
        5. Related services.
        Keep replies short (2-3 sentences). Do not include generic chatbot phrases.`;

        const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
        const responseText = await invokeLLM(JSON.stringify(apiMessages), systemPrompt);
        
        const actions = [];
        const lowerResp = responseText.toLowerCase();
        if (lowerResp.includes("fir") || lowerResp.includes("constable") || lowerResp.includes("కానిస్టేబుల్")) {
          actions.push({ label: lang === "te" ? "ఏఐ కానిస్టేబుల్" : "Start AI Constable", type: "constable" });
        }
        if (lowerResp.includes("track") || lowerResp.includes("status") || lowerResp.includes("ట్రాక్")) {
          actions.push({ label: lang === "te" ? "కేసు ట్రాక్" : "Track Case", link: "/track-case" });
        }
        if (lowerResp.includes("cyber") || lowerResp.includes("సైబర్")) {
          actions.push({ label: lang === "te" ? "సైబర్ పోర్టల్" : "Cyber Portal", link: "/golden-hour-cyber" });
        }

        const nextStepText = lang === "te" 
          ? "మీకు తదుపరి నావిగేషన్‌లో సహాయం కావాలా?"
          : "Would you like me to guide you to the matching workspace?";

        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: responseText, 
          nextStep: nextStepText,
          actions: actions.length > 0 ? actions : undefined 
        }]);
        speak(responseText + " " + nextStepText);
      }
    } catch (err) {
      console.error("[AI_ASSISTANT_DEBUG] Cloud LLM failed, using strict local fallback message:", err);
      // Clean non-responsive fallback message
      const fallbackMsg = lang === "te"
        ? "ఈ అసిస్టెంట్ కేవలం న్యాయమిత్ర సేవల్లో మాత్రమే సహాయపడుతుంది. దయచేసి అందుబాటులో ఉన్న సేవల్లో ఒకదాన్ని ఎంచుకోండి లేదా ప్రాజెక్ట్ పరమైన ప్రశ్న అడగండి."
        : "This assistant specializes in NyayaMitra services. Please choose one of the available services or ask a project-related question.";
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: fallbackMsg,
        nextStep: lang === "te" ? "మీ నిర్ణయం?" : "Which option would you like to use?",
        actions: [
          { label: lang === "te" ? "ఏఐ కానిస్టేబుల్" : "Start AI Constable", type: "constable" },
          { label: lang === "te" ? "కేసు ట్రాక్" : "Track Case", link: "/track-case" }
        ]
      }]);
      speak(fallbackMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatMessage = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Title Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Button asChild variant="ghost" size="sm">
          <Link to={user?.user_type === "police" ? "/officer-dashboard" : "/citizen-dashboard"}>
            <ArrowLeft className="w-4 h-4 mr-1" />{UI_TEXT[lang].backBtn}
          </Link>
        </Button>
        
        <div className="flex-grow">
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2 text-primary">
            <Brain className="w-6 h-6" />
            {UI_TEXT[lang].title}
          </h1>
          <p className="text-muted-foreground text-xs">{UI_TEXT[lang].desc}</p>
        </div>

        {/* Global Language Toggle */}
        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-full p-0.5">
          <button onClick={() => setLang("en")}
            className={`text-xs px-3.5 py-1 rounded-full font-bold transition-all ${lang === "en" ? "bg-primary text-white" : "text-slate-600 hover:text-slate-900"}`}>
            English
          </button>
          <button onClick={() => setLang("te")}
            className={`text-xs px-3.5 py-1 rounded-full font-bold transition-all ${lang === "te" ? "bg-primary text-white" : "text-slate-600 hover:text-slate-900"}`}>
            తెలుగు
          </button>
        </div>

        <Badge className="bg-primary text-white text-xs px-2.5 py-1">{UI_TEXT[lang].badge}</Badge>
      </div>

      {/* Chat window */}
      <Card className="mb-4 shadow-md border-slate-200 overflow-hidden bg-white">
        <CardHeader className="pb-2.5 border-b bg-slate-50">
          <CardTitle className="text-xs flex items-center gap-2 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            {UI_TEXT[lang].activeStatus}
            <span className="text-slate-500 font-normal ml-auto text-[10px] uppercase font-mono">
              {user?.full_name || "Guest Citizen"} • {user?.user_type || "Citizen"}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 flex flex-col">
          {/* Messages Container */}
          <div ref={scrollRef} className="h-[460px] overflow-y-auto p-4 space-y-4 bg-slate-50/20">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className="max-w-[80%] flex flex-col space-y-2">
                    <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-primary text-white rounded-br-sm font-semibold"
                        : "bg-white border border-slate-250 rounded-bl-sm text-slate-700 space-y-2"
                    }`}>
                      <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                      
                      {/* Enforced Government service guidelines details */}
                      {msg.role === "assistant" && msg.services && (
                        <div className="pt-2 border-t border-slate-100 text-slate-600">
                          <strong className="text-[10px] block text-slate-400 uppercase tracking-wider mb-1">
                            {lang === "te" ? "సేవలు అందుబాటులో ఉన్నాయి:" : "Available Services:"}
                          </strong>
                          <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.services) }} />
                        </div>
                      )}

                      {msg.role === "assistant" && msg.recommended && (
                        <div className="pt-1.5 text-slate-600">
                          <strong className="text-[10px] block text-slate-400 uppercase tracking-wider mb-0.5">
                            {lang === "te" ? "సిఫార్సు చేయబడిన సేవ:" : "Recommended Option:"}
                          </strong>
                          <span className="italic font-medium text-[#1e3a8a]">{msg.recommended}</span>
                        </div>
                      )}

                      {msg.role === "assistant" && msg.related && (
                        <div className="pt-1.5 border-t border-slate-100 text-slate-400 text-[10px]">
                          <strong>{lang === "te" ? "సంబంధిత లింకులు:" : "Related Pages:"} </strong>
                          <span>{msg.related}</span>
                        </div>
                      )}

                      {msg.role === "assistant" && msg.nextStep && (
                        <p className="mt-2 pt-2 border-t border-slate-150 font-bold text-slate-800 text-[11px]">
                          👉 {msg.nextStep}
                        </p>
                      )}
                    </div>

                    {/* Category Selection Grid (Welcome state) */}
                    {msg.role === "assistant" && msg.isGreeting && (
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {MAIN_CATEGORIES.map((cat, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleCategorySelect(cat.id)}
                            className={`border text-left p-3 rounded-xl transition font-bold text-[10.5px] shadow-sm flex items-center gap-2 ${cat.color}`}
                          >
                            <span>{cat.label[lang]}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Action buttons mapping */}
                    {msg.role === "assistant" && msg.actions && (
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {msg.actions.map((act, idx) => (
                          act.tel ? (
                            <Button key={idx} asChild size="sm" variant="outline"
                              className="text-[10px] font-bold border-red-400/40 hover:bg-red-50 text-red-600 rounded-lg py-1 px-2.5 h-auto transition shadow-sm">
                              <a href={`tel:${act.tel}`}>
                                📞 {act.label}
                              </a>
                            </Button>
                          ) : (
                            <Button key={idx} onClick={() => handleAction(act)} size="sm" variant="outline"
                              className="text-[10px] font-bold border-primary/40 hover:bg-primary/5 text-primary rounded-lg py-1 px-2.5 h-auto transition shadow-sm">
                              {act.label}
                            </Button>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex gap-1.5 p-3 bg-white border rounded-xl items-center w-16 h-8">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-primary/45 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Interactive Chat controls */}
          <div className="border-t p-3.5 flex gap-2 bg-slate-50">
            <Button
              type="button"
              variant={isListening ? "destructive" : "outline"}
              onClick={toggleListen}
              className="px-3 shrink-0 rounded-lg shadow-sm border-slate-200"
              title="Voice Input"
            >
              {isListening ? <MicOff className="w-4 h-4 animate-pulse text-white" /> : <Mic className="w-4 h-4 text-slate-600" />}
            </Button>
            
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={UI_TEXT[lang].placeholder}
              className="flex-grow text-xs rounded-lg border-slate-200 focus-visible:ring-primary shadow-inner bg-white text-slate-800 placeholder:text-slate-400"
              onKeyDown={e => e.key === "Enter" && !loading && sendMessage()}
              disabled={loading || isListening}
            />
            
            <Button onClick={() => sendMessage()} disabled={!input.trim() || loading} size="sm" className="gap-1 px-4 shrink-0 rounded-lg shadow">
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
            </Button>
            
            {isSpeaking && (
              <Button variant="ghost" onClick={() => { window.speechSynthesis.cancel(); setIsSpeaking(false); }} className="px-2">
                <Volume2 className="w-4 h-4 text-primary animate-pulse" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Prompts Guides */}
      <div className="bg-slate-50 border border-slate-250/60 p-4 rounded-2xl">
        <p className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-primary" />
          {UI_TEXT[lang].quickQuestions}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {QUICK_PROMPTS[lang].map((qp, i) => (
            <button key={i} onClick={() => sendMessage(qp.prompt)} disabled={loading}
              className="flex items-center gap-2 text-left text-[11px] p-3 rounded-xl border border-slate-200 bg-white hover:border-primary/40 hover:bg-primary/5 transition disabled:opacity-50 font-medium text-slate-700 shadow-sm">
              <qp.icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span>{qp.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}