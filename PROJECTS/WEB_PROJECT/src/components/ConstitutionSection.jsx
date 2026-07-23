import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronDown, ChevronRight, Scale, Shield, Gavel, FileText, Eye, Heart, Users } from "lucide-react";

const LAW_SECTIONS = [
  {
    id: "fundamental",
    icon: Shield,
    color: "from-blue-700 to-blue-900",
    badge: "Part III",
    titleEn: "Fundamental Rights",
    titleTe: "ప్రాథమిక హక్కులు",
    articles: [
      { art: "Art. 14", title: "Right to Equality", desc: "Equality before law & equal protection of laws. NO discrimination by state.", crime: "File RTI / Writ Petition in HC" },
      { art: "Art. 19", title: "Freedom of Speech", desc: "Freedom of speech, expression, movement, and occupation.", crime: "File complaint u/s IPC 500 if defamed" },
      { art: "Art. 21", title: "Right to Life", desc: "No person shall be deprived of life/personal liberty except procedure established by law.", crime: "Habeas Corpus, Section 302 IPC for murder" },
      { art: "Art. 22", title: "Protection from Arrest", desc: "Cannot be detained without being told the grounds. Right to consult a lawyer.", crime: "File complaint if illegally detained" },
    ]
  },
  {
    id: "women",
    icon: Heart,
    color: "from-pink-600 to-rose-800",
    badge: "Special Acts",
    titleEn: "Women & Child Protection Laws",
    titleTe: "మహిళా & శిశు రక్షణ చట్టాలు",
    articles: [
      { art: "POCSO Act", title: "Child Sexual Abuse", desc: "Protection of Children from Sexual Offences — mandatory reporting, special courts.", crime: "Report to Police Station, Childline 1098" },
      { art: "IPC 354", title: "Assault / Outraging Modesty", desc: "1-5 years imprisonment for assault or criminal force against a woman.", crime: "File FIR at nearest PS, call 181 (She Teams)" },
      { art: "IPC 376", title: "Rape", desc: "Minimum 10 years rigorous imprisonment, may extend to life imprisonment or death.", crime: "File FIR immediately, call 100, DISHA 181" },
      { art: "Dowry Act", title: "Dowry Prohibition", desc: "Dowry Prohibition Act 1961 — giving/taking dowry is a punishable offence.", crime: "IPC 498A + Dowry Prohibition Act" },
    ]
  },
  {
    id: "cyber",
    icon: Eye,
    color: "from-emerald-600 to-teal-800",
    badge: "IT Act 2000",
    titleEn: "Cyber Crime Laws",
    titleTe: "సైబర్ నేర చట్టాలు",
    articles: [
      { art: "IT Act 66C", title: "Identity Theft", desc: "Fraudulently using another's digital signature — up to 3 years + ₹1 lakh fine.", crime: "Report to Cyber Crime Cell 1930" },
      { art: "IT Act 66D", title: "Cheating by Impersonation", desc: "Cheating using computer resources — up to 3 years + ₹1 lakh fine.", crime: "Cyber Crime Complaint / 1930" },
      { art: "IT Act 67", title: "Publishing Obscene Content", desc: "Publishing obscene material electronically — up to 3 years + ₹5 lakh fine.", crime: "Cyber Crime PS complaint" },
      { art: "IPC 420", title: "OTP / Online Fraud", desc: "Cheating and dishonestly inducing delivery of property — up to 7 years imprisonment.", crime: "File FIR + Cyber Crime 1930" },
    ]
  },
  {
    id: "criminal",
    icon: Gavel,
    color: "from-orange-600 to-amber-800",
    badge: "IPC / CRPC",
    titleEn: "Criminal Law — Key Sections",
    titleTe: "క్రిమినల్ చట్టం — ముఖ్యమైన సెక్షన్లు",
    articles: [
      { art: "IPC 302", title: "Murder", desc: "Life imprisonment or death penalty. Cognizable, non-bailable offence.", crime: "FIR at PS, Homicide squad investigates" },
      { art: "IPC 379", title: "Theft", desc: "Imprisonment up to 3 years and/or fine. Cognizable offence.", crime: "FIR at nearest Police Station" },
      { art: "IPC 323", title: "Assault / Hurt", desc: "Voluntarily causing hurt — up to 1 year imprisonment or ₹1000 fine.", crime: "File Complaint / FIR at Police Station" },
      { art: "IPC 406", title: "Criminal Breach of Trust", desc: "Misappropriation of entrusted property — up to 3 years imprisonment.", crime: "File FIR + Section 420 if fraud" },
    ]
  },
  {
    id: "civil",
    icon: Scale,
    color: "from-violet-600 to-purple-900",
    badge: "Civil Rights",
    titleEn: "Consumer & Civil Rights",
    titleTe: "వినియోగదారు & పౌర హక్కులు",
    articles: [
      { art: "Consumer Protection Act", title: "Consumer Rights", desc: "Right to seek redressal against unfair trade practices. File complaint in Consumer Forum.", crime: "Consumer Forum / NCDRC" },
      { art: "RTI Act 2005", title: "Right to Information", desc: "Any citizen can request information from any public authority within 30 days.", crime: "File RTI with Public Information Officer" },
      { art: "PCR Act", title: "Anti-Untouchability", desc: "Protection of Civil Rights Act — practice of untouchability is punishable.", crime: "File complaint with SC/ST Cell" },
      { art: "SC/ST Act", title: "Atrocity Prevention", desc: "Scheduled Castes and Tribes (Prevention of Atrocities) Act — special protection.", crime: "FIR at PS / SC-ST Cell" },
    ]
  },
  {
    id: "property",
    icon: FileText,
    color: "from-slate-600 to-slate-800",
    badge: "Property",
    titleEn: "Property & Land Laws",
    titleTe: "ఆస్తి & భూమి చట్టాలు",
    articles: [
      { art: "IPC 441", title: "Criminal Trespass", desc: "Entering property to commit offence or intimidate occupants — up to 3 months.", crime: "File FIR / Complaint at PS" },
      { art: "IPC 447", title: "Trespass Punishment", desc: "Criminal trespass punishment — up to 3 months or ₹500 fine or both.", crime: "File Complaint at Police Station" },
      { art: "Registration Act", title: "Property Registration", desc: "All immovable property transactions > ₹100 must be registered.", crime: "Contact Sub-Registrar / Civil Court" },
      { art: "RERA Act", title: "Real Estate Regulation", desc: "Builder must register project. File complaint if delayed possession.", crime: "RERA Regulatory Authority complaint" },
    ]
  },
];

export default function ConstitutionSection({ lang = "en" }) {
  const [activeTab, setActiveTab] = useState(LAW_SECTIONS[0].id);

  const activeSection = LAW_SECTIONS.find(s => s.id === activeTab);

  return (
    <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden relative max-w-7xl mx-auto my-6">
      {/* Blue Header */}
      <div className="bg-primary px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-heading font-bold text-base">
              {lang === "te" ? "భారత సంవిధానం & చట్టాలు" : "Constitution & Laws — Know Your Rights"}
            </h2>
            <p className="text-white/70 text-xs">
              {lang === "te" ? "ఏ చట్టం కింద కేసు దాఖలు చేయాలో తెలుసుకోండి" : "Comprehensive digital repository of fundamental rights and laws"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[600px]">
        {/* Left Sidebar - Categories */}
        <div className="w-full lg:w-1/3 flex flex-col border-r border-border bg-muted/20 overflow-y-auto">
          {LAW_SECTIONS.map((section, idx) => (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={`text-left p-4 flex items-center justify-between transition-all duration-300 border-b border-border/50 ${
                activeTab === section.id
                  ? `bg-primary/5 border-l-4 border-l-primary`
                  : "hover:bg-muted/50 border-l-4 border-l-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === section.id ? 'bg-primary/20' : 'bg-primary/10'}`}>
                  <section.icon className={`w-5 h-5 ${activeTab === section.id ? 'text-primary' : 'text-primary/70'}`} />
                </div>
                <div>
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block mb-0.5 ${activeTab === section.id ? 'text-primary' : 'text-muted-foreground'}`}>{section.badge}</span>
                  <h3 className={`font-bold text-sm ${activeTab === section.id ? 'text-foreground' : 'text-muted-foreground'}`}>{lang === "te" ? section.titleTe : section.titleEn}</h3>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 ${activeTab === section.id ? 'text-primary' : 'text-muted-foreground/30'}`} />
            </button>
          ))}
        </div>

        {/* Right Content - Full Article View */}
        <div className="w-full lg:w-2/3 p-6 overflow-y-auto bg-background">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="border-b border-border pb-4 mb-6">
                <h3 className="font-heading font-black text-2xl text-foreground">
                  {lang === "te" ? activeSection.titleTe : activeSection.titleEn}
                </h3>
                <p className="text-muted-foreground mt-1 text-sm font-mono">{activeSection.badge}</p>
              </div>

              {activeSection.articles.map((article, i) => (
                <div key={i} className="bg-card border border-border/50 rounded-xl p-5 shadow-sm mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20">{article.art}</span>
                    <h4 className="font-bold text-sm text-sky-900">{article.title}</h4>
                  </div>
                  
                  <div className="max-w-none mb-4">
                    <p className="text-xs text-sky-800/80 mt-1 leading-relaxed">
                      {article.desc}
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border/50 bg-muted/20 -mx-5 -mb-5 p-5 rounded-b-xl flex items-start gap-3">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700 flex-shrink-0">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-emerald-700 mb-1">Legal Action / How to File</h5>
                      <p className="text-sm text-muted-foreground">{article.crime}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}