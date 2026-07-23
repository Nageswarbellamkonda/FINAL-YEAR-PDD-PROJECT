import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, BookOpen, Shield, ChevronDown, ChevronUp, Search, FileText, AlertTriangle, Phone, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

const SECTIONS = [
  {
    id: "bns",
    title: "BNS — Bharatiya Nyaya Sanhita, 2023",
    titleTe: "BNS — భారతీయ న్యాయ సంహిత, 2023",
    emoji: "⚖️",
    color: "bg-blue-700",
    replaces: "Replaces: Indian Penal Code (IPC), 1860",
    icon: "📜",
    items: [
      { section: "Sec 103", title: "Murder", desc: "Punishment: Death or life imprisonment + fine. (Previously IPC 302)" },
      { section: "Sec 115", title: "Grievous Hurt", desc: "Voluntarily causing grievous hurt — 7 years imprisonment + fine. (IPC 325)" },
      { section: "Sec 64", title: "Rape", desc: "Rigorous imprisonment min 10 years to life. Stricter penalties for gang rape (life imprisonment/death). (IPC 376)" },
      { section: "Sec 111", title: "Organized Crime", desc: "NEW provision — life imprisonment or death for organized crime syndicates. (Was not in IPC)" },
      { section: "Sec 113", title: "Terrorist Act", desc: "NEW in BNS — death or life imprisonment for acts threatening unity of India." },
      { section: "Sec 79", title: "Kidnapping", desc: "Kidnapping from India or from lawful guardianship — 7 years + fine. (IPC 359-363)" },
      { section: "Sec 317", title: "Cheating & Fraud", desc: "Dishonest inducement to deliver property — 3 years + fine. Cyber fraud covered. (IPC 420)" },
      { section: "Sec 308", title: "Extortion", desc: "Putting person in fear of injury to commit extortion — 3 to 10 years. (IPC 383-389)" },
      { section: "Sec 85", title: "Cruelty by Husband/Relatives", desc: "Dowry harassment / mental cruelty — 3 years + fine. (IPC 498A)" },
      { section: "Sec 351", title: "Criminal Intimidation", desc: "Threatening person to cause alarm — 2 years + fine. (IPC 503-506)" },
      { section: "Sec 318", title: "Cheating by Impersonation", desc: "3 years imprisonment + fine. Important for OTP fraud cases. (IPC 416)" },
      { section: "Sec 356", title: "Defamation", desc: "Publishing false matter to harm reputation — 2 years + fine. (IPC 499-500)" },
      { section: "Sec 27", title: "Community Service Punishment", desc: "NEW — BNS introduces community service as a punishment (not in IPC). For minor offences." },
    ]
  },
  {
    id: "bnss",
    title: "BNSS — Bharatiya Nagarik Suraksha Sanhita, 2023",
    titleTe: "BNSS — భారతీయ నాగరిక సురక్షా సంహిత, 2023",
    emoji: "🛡️",
    color: "bg-indigo-700",
    replaces: "Replaces: Criminal Procedure Code (CrPC), 1973",
    icon: "🔐",
    items: [
      { section: "Sec 173", title: "Zero FIR", desc: "FIR can be filed at ANY police station regardless of jurisdiction. Station must transfer it to the correct one. YOU HAVE THE RIGHT to file FIR anywhere in Andhra Pradesh." },
      { section: "Sec 176", title: "e-FIR (Electronic FIR)", desc: "NEW — FIR can be filed online / electronically. Must be signed within 3 days. Used by Nyaya Mitra platform." },
      { section: "Sec 35", title: "Arrest Rights", desc: "Police MUST inform you of reason for arrest. You have the right to inform a family member. You cannot be arrested without warrant for offences below 3 years (with exceptions)." },
      { section: "Sec 187", title: "Remand Period", desc: "Max police custody: 15 days (was 15 days in CrPC). NEW: Can be split — not necessarily continuous. Total judicial custody extended from 90 to 60 days before bail." },
      { section: "Sec 479", title: "Bail for Undertrials", desc: "Undertrial who has served half the maximum punishment period shall be released on bail. Important right for prisoners." },
      { section: "Sec 105", title: "Attachment of Property", desc: "NEW — Courts can attach property of absconders before conviction. Stronger enforcement." },
      { section: "Sec 530", title: "Trial by Video Conference", desc: "NEW — Trials can be conducted via video conference. Used across AP courts." },
      { section: "Sec 197", title: "Chargesheet Deadline", desc: "Police must file chargesheet within 60 or 90 days (depends on offence). Default = bail." },
      { section: "Sec 53", title: "Medical Examination", desc: "Examination of accused by registered medical practitioner at request of police officer rank SI or above." },
      { section: "Sec 43", title: "Rights During Detention", desc: "Right to legal representation. Right to have lawyer present during interrogation. Right to not be tortured." },
      { section: "Sec 356", title: "Witness Protection", desc: "NEW — Witness identity protection scheme. Can testify anonymously in sensitive cases." },
      { section: "Sec 348", title: "Victim Compensation", desc: "State shall pay compensation to victims even before conviction. AP has Victim Compensation Scheme." },
    ]
  },
  {
    id: "bsa",
    title: "BSA — Bharatiya Sakshya Adhiniyam, 2023",
    titleTe: "BSA — భారతీయ సాక్ష్య అధినియమ్, 2023",
    emoji: "📋",
    color: "bg-violet-700",
    replaces: "Replaces: Indian Evidence Act, 1872",
    icon: "📑",
    items: [
      { section: "Sec 61", title: "Electronic Evidence", desc: "NEW — Electronic records, WhatsApp messages, emails, CCTV footage are primary evidence (not secondary). Admissible without certificate in most cases." },
      { section: "Sec 57", title: "Digital Signatures", desc: "Electronic signatures legally valid as evidence. E-documents carry same weight as paper documents." },
      { section: "Sec 23", title: "Confession to Police", desc: "Confession to police inadmissible UNLESS made before Magistrate. Protects citizens from forced confessions." },
      { section: "Sec 111", title: "Burden of Proof — Accused", desc: "In certain offences (dowry, rape, SC/ST), burden shifts to accused to prove innocence after prosecution establishes prima facie case." },
      { section: "Sec 39", title: "Dying Declaration", desc: "Statement made before death is admissible as evidence. Does not require corroboration if court finds it reliable." },
      { section: "Sec 8", title: "Character of Accused", desc: "Character of accused generally inadmissible. But character of victim in sexual offences is fully inadmissible. Protects survivors." },
    ]
  },
  {
    id: "fundamental",
    title: "Fundamental Rights — Constitution of India",
    titleTe: "ప్రాథమిక హక్కులు — భారత రాజ్యాంగం",
    emoji: "🇮🇳",
    color: "bg-orange-600",
    replaces: "Articles 12–35, Part III of Constitution",
    icon: "⚖️",
    items: [
      { section: "Art. 14", title: "Right to Equality", desc: "All citizens are equal before law. No discrimination by the State. AP police cannot treat citizens differently based on caste, religion, gender." },
      { section: "Art. 19", title: "Right to Freedom", desc: "Freedom of speech, assembly, movement, residence, and profession. You can protest peacefully. Police cannot arrest you for peaceful protest." },
      { section: "Art. 20", title: "Protection in Conviction", desc: "No double jeopardy. No self-incrimination (RIGHT TO SILENCE). No ex-post-facto law. Crucial during police interrogation." },
      { section: "Art. 21", title: "Right to Life & Liberty", desc: "Most important right. No person can be deprived of life/liberty except by procedure established by law. Covers right to fair trial, legal aid, privacy." },
      { section: "Art. 21A", title: "Right to Education", desc: "Free & compulsory education for children aged 6–14 years. AP Govt must provide school within 1 km." },
      { section: "Art. 22", title: "Protection Against Arbitrary Arrest", desc: "Right to be informed of reason for arrest. Right to consult lawyer. Must be produced before magistrate within 24 hours." },
      { section: "Art. 23", title: "Prohibition of Trafficking", desc: "Human trafficking, forced labor (Begar) is a fundamental right violation and criminal offence." },
      { section: "Art. 25", title: "Freedom of Religion", desc: "All persons have right to freely profess, practice, and propagate religion." },
      { section: "Art. 32", title: "Right to Constitutional Remedies", desc: "You can directly approach Supreme Court (or High Court under Art.226) if fundamental rights are violated. Habeas Corpus available if illegally detained." },
    ]
  },
  {
    id: "dpsp",
    title: "Directive Principles & Citizen Duties",
    titleTe: "ఆదేశ సూత్రాలు & పౌర విధులు",
    emoji: "📖",
    color: "bg-green-700",
    replaces: "Part IV (Art 36-51) & Part IVA (Art 51A) — Constitution",
    icon: "🏛️",
    items: [
      { section: "Art 39A", title: "Free Legal Aid", desc: "State must provide free legal aid to citizens who cannot afford it. In AP — District Legal Services Authority (DLSA) provides free lawyers. Call: 08554-255880" },
      { section: "Art 41", title: "Right to Work & Education", desc: "State shall make effective provision for securing right to work, education, and public assistance in unemployment/illness." },
      { section: "Art 47", title: "Prohibition of Drugs", desc: "State shall endeavor to prohibit consumption of intoxicating drinks and drugs injurious to health. Basis for AP excise & narcotics laws." },
      { section: "Art 51A(a)", title: "Duty: Abide by Constitution", desc: "Every citizen shall abide by the Constitution and respect its ideals." },
      { section: "Art 51A(h)", title: "Duty: Scientific Temper", desc: "Develop scientific temper, humanism, spirit of inquiry and reform." },
      { section: "Art 51A(i)", title: "Duty: Protect Public Property", desc: "Safeguard public property and abjure violence. Destruction of public property is a criminal offence." },
    ]
  },
  {
    id: "cyberlaw",
    title: "IT Act & Cyber Laws",
    titleTe: "IT చట్టం & సైబర్ చట్టాలు",
    emoji: "💻",
    color: "bg-slate-700",
    replaces: "Information Technology Act 2000 + Amendments 2008",
    icon: "🔒",
    items: [
      { section: "Sec 66", title: "Computer Related Offences", desc: "Hacking, unauthorized access — 3 years + Rs 5 lakh fine. Report to AP Cyber Crime Police: cybercrime.gov.in or call 1930." },
      { section: "Sec 66C", title: "Identity Theft", desc: "Using another person's identity/password/signature — 3 years + Rs 1 lakh fine. OTP fraud covered here." },
      { section: "Sec 66D", title: "Cheating by Impersonation via Computer", desc: "Fake profiles, phishing — 3 years + Rs 1 lakh fine. Covers fake WhatsApp/social media accounts." },
      { section: "Sec 67", title: "Obscene Material Online", desc: "Publishing/transmitting obscene content — 3 years + Rs 5 lakh (first offence), 5 years + Rs 10 lakh (repeat)." },
      { section: "Sec 67A", title: "Sexually Explicit Content", desc: "Publishing explicit content online — 5 years + fine. Morphed images of women: file complaint at AP Cyber Crime." },
      { section: "Sec 69", title: "Interception of Data", desc: "Government can intercept/monitor data in interest of national security. But requires written order." },
      { section: "Sec 72", title: "Privacy Breach", desc: "If any person who accesses electronic record breaches confidentiality — 2 years + fine. DPDP Act 2023 adds more protection." },
      { section: "DPDP 2023", title: "Digital Personal Data Protection Act 2023", desc: "NEW — Your personal data cannot be processed without consent. Right to erasure, correction of data. Data Fiduciaries must protect your data." },
    ]
  },
  {
    id: "women",
    title: "Women Protection Laws",
    titleTe: "మహిళా రక్షణ చట్టాలు",
    emoji: "👩‍⚖️",
    color: "bg-rose-700",
    replaces: "POCSO, DV Act, SHE Teams, Disha Act (AP)",
    icon: "🌸",
    items: [
      { section: "POCSO 2012", title: "Protection of Children from Sexual Offences", desc: "Offences against children under 18. Strict liability — consent of child is not a defence. Mandatory reporting by any person who knows of such offence." },
      { section: "DV Act 2005", title: "Domestic Violence Act", desc: "Protection order, residence order, monetary relief, custody of children available against domestic violence. AP SHE Teams enforce this." },
      { section: "Disha Act 2019 (AP)", title: "AP Special Law", desc: "AP-specific law for heinous crimes against women. Fast-track courts (21-day trial). Repeat offenders — death penalty. Helpline: 181" },
      { section: "SHE Teams (AP)", title: "AP Police SHE Teams", desc: "Active in all AP districts. Plain-clothes teams patrol public spaces. Report eve-teasing/harassment to 9490617111 or 181." },
      { section: "BNS Sec 74", title: "Stalking", desc: "Following, contacting repeatedly against will of woman — 3 years (first offence), 5 years (repeat). File at nearest PS or online." },
      { section: "BNS Sec 75", title: "Sexual Harassment at Workplace", desc: "Demanding sexual favours in workplace — 3 years + fine. ICC must be constituted in every org with 10+ employees (POSH Act)." },
    ]
  },
  {
    id: "arrestrights",
    title: "Know Your Rights When Arrested",
    titleTe: "అరెస్ట్ అయినప్పుడు మీ హక్కులు",
    emoji: "🚨",
    color: "bg-red-700",
    replaces: "BNSS Sec 35-60 | Constitution Art 21-22",
    icon: "🔍",
    items: [
      { section: "Right 1", title: "Right to Know Reason", desc: "Police MUST tell you WHY you are being arrested. If they don't — ask loudly. Note the time, date, and officer's name/badge number." },
      { section: "Right 2", title: "Right to Inform Someone", desc: "You have the right to inform a family member or friend of your arrest. Police must allow one phone call." },
      { section: "Right 3", title: "Right to Lawyer", desc: "You can consult a lawyer of your choice. If you cannot afford one — the court/DLSA will appoint a free lawyer. Do NOT waive this right." },
      { section: "Right 4", title: "Right to Silence", desc: "You do NOT have to answer any questions that may incriminate you (Art 20(3)). Say: 'I wish to exercise my right to remain silent.'" },
      { section: "Right 5", title: "24-Hour Magistrate Rule", desc: "You MUST be produced before a Magistrate within 24 hours of arrest (Art 22). If not — it is illegal detention. File Habeas Corpus in HC." },
      { section: "Right 6", title: "No Torture or Ill-Treatment", desc: "Any form of physical torture by police is ILLEGAL (D.K. Basu Guidelines, Supreme Court). File complaint at AP Police Complaints Authority." },
      { section: "Right 7", title: "Medical Examination", desc: "You have right to be medically examined at the time of arrest. This protects against false allegations of injuries." },
      { section: "Right 8", title: "Arrest Memo", desc: "Police must prepare an ARREST MEMO signed by a witness. You can refuse to sign if details are wrong." },
      { section: "Right 9", title: "Bail Rights", desc: "For bailable offences — you have right to bail. For non-bailable — apply to Magistrate. Anticipatory bail available before arrest." },
      { section: "Right 10", title: "Women-Specific Rights", desc: "Women can only be arrested by female police officer. Cannot be arrested after sunset and before sunrise except in exceptional circumstances." },
    ]
  }
];

export default function ConstitutionRights() {
  const [search, setSearch] = useState("");
  const [openSections, setOpenSections] = useState({ bns: true });
  const navigate = useNavigate();

  const toggleSection = (id) => setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));

  const filtered = SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item =>
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.desc.toLowerCase().includes(search.toLowerCase()) ||
      item.section.toLowerCase().includes(search.toLowerCase()) ||
      section.title.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(s => !search || s.items.length > 0);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm transition">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="bg-gradient-to-r from-[#1e3a8a] to-[#7c3aed] rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Scale className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-black text-2xl">Constitution & Laws</h1>
              <p className="text-white/80 text-sm font-telugu">రాజ్యాంగం & న్యాయ చట్టాలు</p>
            </div>
          </div>
          <p className="text-white/80 text-sm leading-relaxed">
            Complete guide to India's new criminal laws — BNS, BNSS, BSA (2023), Fundamental Rights, Cyber Laws, Women Protection Laws, and your rights when arrested. 
            Designed for citizens of <strong>Andhra Pradesh</strong>.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {["BNS 2023", "BNSS 2023", "BSA 2023", "Fundamental Rights", "Cyber Laws", "Women Laws", "Arrest Rights"].map(tag => (
              <span key={tag} className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">{tag}</span>
            ))}
          </div>
        </div>

        {/* Emergency Strip */}
        <div className="bg-red-600 text-white rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
          <div className="flex-1 text-sm">
            <strong>Need Legal Help?</strong> AP State Legal Services Authority — Free legal aid for all citizens
          </div>
          <a href="tel:15100" className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white/30 shrink-0">
            <Phone className="w-3 h-3" /> 15100
          </a>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search any law, section, or right..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-11"
          />
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {filtered.map(section => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden border border-border shadow-sm"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition"
              >
                <div className={`w-10 h-10 ${section.color} rounded-xl flex items-center justify-center text-xl shrink-0`}>
                  {section.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-heading font-bold text-sm text-foreground">{section.title}</h2>
                  <p className="text-xs text-muted-foreground">{section.replaces}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">{section.items.length} provisions</span>
                  {openSections[section.id] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {/* Items */}
              <AnimatePresence>
                {openSections[section.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border divide-y divide-border bg-card">
                      {section.items.map((item, i) => (
                        <div key={i} className="px-4 py-3 flex gap-3">
                          <div className="w-16 shrink-0">
                            <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                              {item.section}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground mb-0.5">{item.title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 p-4 bg-muted/40 rounded-xl border border-border text-xs text-muted-foreground text-center">
          <FileText className="w-4 h-4 mx-auto mb-2 text-primary" />
          Information based on BNS, BNSS & BSA enacted in December 2023, effective July 1, 2024. Constitution of India (amended up to 2024). 
          For legal advice, contact <strong>AP Legal Services Authority: 15100</strong> (toll-free).
        </div>
      </motion.div>
    </div>
  );
}