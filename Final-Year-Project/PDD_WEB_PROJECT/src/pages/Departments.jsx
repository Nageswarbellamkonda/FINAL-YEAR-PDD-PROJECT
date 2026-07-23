import { useLanguage } from "../lib/LanguageContext";
import { useTranslation } from "../lib/translations";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Shield, Globe, Search, Car, Scale, Users, Siren, Phone, ArrowLeft, Eye, Flame, AlertTriangle, Briefcase } from "lucide-react";
import { motion } from "framer-motion";

const departments = [
  {
    id: "general",
    icon: Shield,
    color: "bg-blue-600",
    nameEn: "General Police",
    nameTe: "సాధారణ పోలీసు",
    descEn: "Handles all general law and order issues, theft, assault, and public disturbances across the state.",
    descTe: "రాష్ట్రవ్యాప్తంగా అన్ని సాధారణ శాంతిభద్రతల సమస్యలు, దొంగతనం, దాడి మరియు ప్రజా అలజడిని నిర్వహిస్తుంది.",
    helpline: "100",
    email: "generalps@appolice.gov.in",
    website: "https://www.appolice.gov.in",
    officers: 12400,
    stations: 371,
  },
  {
    id: "narcotics",
    icon: Siren,
    color: "bg-red-600",
    nameEn: "Narcotics Division",
    nameTe: "మాదకద్రవ్యాల విభాగం",
    descEn: "Combats drug trafficking and substance abuse. Report drug activities for immediate action.",
    descTe: "మాదకద్రవ్యాల అక్రమ రవాణా మరియు మాదక ద్రవ్యాల వినియోగాన్ని ఎదుర్కొంటుంది.",
    helpline: "100",
    email: "narcotics@appolice.gov.in",
    officers: 1200,
    stations: 42,
  },
  {
    id: "she_teams",
    icon: Users,
    color: "bg-pink-600",
    nameEn: "She Teams",
    nameTe: "షీ టీమ్స్",
    descEn: "Dedicated women safety teams for harassment prevention, stalking, and women-related crimes.",
    descTe: "వేధింపుల నివారణ, స్టాకింగ్ మరియు మహిళలకు సంబంధించిన నేరాల కోసం అంకితమైన మహిళా భద్రత బృందాలు.",
    helpline: "181",
    email: "sheteams@appolice.gov.in",
    officers: 3400,
    stations: 100,
  },
  {
    id: "cyber_crime",
    icon: Globe,
    color: "bg-emerald-600",
    nameEn: "Cyber Crime Division",
    nameTe: "సైబర్ నేరాల విభాగం",
    descEn: "Investigates online fraud, phishing, identity theft, social media crimes, and OTP scams.",
    descTe: "ఆన్‌లైన్ మోసాలు, ఫిషింగ్, గుర్తింపు దొంగతనం, సోషల్ మీడియా నేరాలు మరియు OTP స్కామ్‌లను దర్యాప్తు చేస్తుంది.",
    helpline: "1930",
    email: "cybercrime@appolice.gov.in",
    officers: 850,
    stations: 26,
  },
  {
    id: "cid",
    icon: Search,
    color: "bg-violet-600",
    nameEn: "CID (Criminal Investigation)",
    nameTe: "CID (క్రిమినల్ దర్యాప్తు)",
    descEn: "Handles serious and complex criminal cases requiring specialized investigation.",
    descTe: "ప్రత్యేక దర్యాప్తు అవసరమయ్యే తీవ్రమైన మరియు క్లిష్టమైన క్రిమినల్ కేసులను నిర్వహిస్తుంది.",
    helpline: "100",
    email: "cid@appolice.gov.in",
    officers: 2100,
    stations: 64,
  },
  {
    id: "traffic",
    icon: Car,
    color: "bg-amber-600",
    nameEn: "Traffic Police",
    nameTe: "ట్రాఫిక్ పోలీసు",
    descEn: "Manages traffic violations, road safety, and accident investigations.",
    descTe: "ట్రాఫిక్ ఉల్లంఘనలు, రోడ్ భద్రత మరియు ప్రమాద దర్యాప్తులను నిర్వహిస్తుంది.",
    helpline: "100",
    email: "traffic@appolice.gov.in",
    officers: 4500,
    stations: 120,
  },
  {
    id: "anti_corruption",
    icon: Scale,
    color: "bg-indigo-600",
    nameEn: "Anti-Corruption Bureau (ACB)",
    nameTe: "అవినీతి వ్యతిరేక బ్యూరో (ACB)",
    descEn: "Investigates corruption, bribery, and trap operations against public officials in AP.",
    descTe: "AP లో ప్రభుత్వ అధికారులపై అవినీతి, లంచం కేసులను దర్యాప్తు చేస్తుంది.",
    helpline: "1064",
    email: "acb@appolice.gov.in",
    officers: 560,
    stations: 18,
  },
  {
    id: "cbi",
    icon: Briefcase,
    color: "bg-slate-700",
    nameEn: "CBI — Central Bureau of Investigation",
    nameTe: "CBI — కేంద్రీయ దర్యాప్తు బ్యూరో",
    descEn: "Central agency for high-profile criminal cases, senior official corruption. AP Liaison office: Vijayawada.",
    descTe: "అధిక-ప్రొఫైల్ కేసులు, సీనియర్ అధికారుల అవినీతి విషయాల కేంద్ర సంస్థ.",
    helpline: "1800-11-2345",
    email: "sp.ap@cbi.gov.in",
    officers: 120,
    stations: 3,
  },
  {
    id: "intelligence",
    icon: Eye,
    color: "bg-gray-700",
    nameEn: "Intelligence Wing (SIB)",
    nameTe: "ఇంటెలిజెన్స్ విభాగం (SIB)",
    descEn: "State Intelligence Bureau — monitors internal security, extremism, and sensitive matters across AP.",
    descTe: "రాష్ట్ర ఇంటెలిజెన్స్ బ్యూరో — AP అంతటా భద్రత పర్యవేక్షిస్తుంది.",
    helpline: "100",
    email: "sib@appolice.gov.in",
    officers: 980,
    stations: 26,
  },
  {
    id: "fire",
    icon: Flame,
    color: "bg-orange-700",
    nameEn: "Fire & Emergency Services (AP)",
    nameTe: "అగ్నిమాపక & అత్యవసర సేవలు",
    descEn: "AP Fire Department — fire fighting, rescue operations, disaster response across all 13 districts.",
    descTe: "AP అగ్నిమాపక విభాగం — 13 జిల్లాలలో అగ్నిమాపక, రక్షణ, విపత్తు స్పందన.",
    helpline: "101",
    email: "fire@ap.gov.in",
    officers: 3200,
    stations: 72,
  },
  {
    id: "grp",
    icon: Shield,
    color: "bg-cyan-700",
    nameEn: "Railway Police (GRP)",
    nameTe: "రైల్వే పోలీసు (GRP)",
    descEn: "Government Railway Police — security at AP railway stations, anti-theft and passenger safety.",
    descTe: "AP రైల్వే స్టేషన్లలో భద్రత, దొంగతనం వ్యతిరేక చర్యలు.",
    helpline: "1512",
    email: "grp@appolice.gov.in",
    officers: 890,
    stations: 34,
  },
  {
    id: "vigilance",
    icon: AlertTriangle,
    color: "bg-yellow-700",
    nameEn: "Vigilance & Enforcement (V&E)",
    nameTe: "విజిలెన్స్ & ఎన్‌ఫోర్స్‌మెంట్",
    descEn: "Checks on illegal shops, unauthorized constructions, encroachments, and public nuisance control in AP.",
    descTe: "అక్రమ దుకాణాలు, అనధికార నిర్మాణాలు, ఆక్రమణలు నియంత్రణ.",
    helpline: "14400",
    email: "ve@ap.gov.in",
    officers: 420,
    stations: 13,
  },
];

export default function Departments() {
  const { lang } = useLanguage();
  const t = useTranslation(lang);
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm transition">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>
      <div className="text-center mb-10">
        <h1 className="font-heading font-bold text-3xl">{t("departments")}</h1>
        <p className="text-muted-foreground text-sm mt-2">
          {lang === "te"
            ? "ఆంధ్రప్రదేశ్ పోలీసు విభాగాలు"
            : "Andhra Pradesh Police Departments & Divisions"}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {departments.map((dept, i) => (
          <motion.div
            key={dept.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="hover:shadow-lg transition-shadow h-full">
              <CardContent className="p-0 overflow-hidden">
                {/* Top color strip */}
                <div className={`h-1.5 w-full ${dept.color}`} />
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${dept.color} shrink-0 shadow-md`}>
                      <dept.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading font-bold text-base">
                        {lang === "te" ? dept.nameTe : dept.nameEn}
                      </h3>
                      <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                        {lang === "te" ? dept.descTe : dept.descEn}
                      </p>
                    </div>
                  </div>
                  {/* Stats row */}
                  {dept.officers && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-muted rounded-lg p-2 text-center">
                        <p className="font-bold text-sm text-foreground">{dept.officers?.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">Officers</p>
                      </div>
                      <div className="bg-muted rounded-lg p-2 text-center">
                        <p className="font-bold text-sm text-foreground">{dept.stations}</p>
                        <p className="text-[10px] text-muted-foreground">Units/Stations</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <a href={`tel:${dept.helpline}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-secondary transition px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/10">
                      <Phone className="w-3 h-3" /> {dept.helpline}
                    </a>
                    {dept.email && (
                      <a href={`mailto:${dept.email}`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition px-2 py-1.5 bg-muted rounded-lg">
                        ✉️ Email
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}