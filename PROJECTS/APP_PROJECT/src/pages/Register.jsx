import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { AUTH_ROLES } from "@/lib/authRouting";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Loader2, Shield, Users, Scale, Gavel, Building2, UserCog, BadgeCheck,
} from "lucide-react";
import { motion } from "framer-motion";

const ROLES = [
  {
    id: AUTH_ROLES.CITIZEN,
    icon: Users,
    color: "bg-blue-600",
    labelEn: "Citizen",
    labelTe: "పౌరుడు",
    descEn: "File complaints, track cases, legal help",
  },
  {
    id: AUTH_ROLES.POLICE_OFFICER,
    icon: Shield,
    color: "bg-primary",
    labelEn: "Police Officer",
    labelTe: "పోలీసు అధికారి",
    descEn: "Officer case & operations dashboard",
  },
  {
    id: AUTH_ROLES.STATION_OFFICER,
    icon: BadgeCheck,
    color: "bg-slate-700",
    labelEn: "Station Officer (SI)",
    labelTe: "స్టేషన్ అధికారి (SI)",
    descEn: "Station operations and duty logs",
  },
  {
    id: AUTH_ROLES.DSP,
    icon: Building2,
    color: "bg-emerald-600",
    labelEn: "DSP / CI",
    labelTe: "DSP / CI",
    descEn: "Sub-division supervision and reports",
  },
  {
    id: AUTH_ROLES.LAWYER,
    icon: Scale,
    color: "bg-violet-600",
    labelEn: "Lawyer",
    labelTe: "న్యాయవాది",
    descEn: "Assigned cases and legal work",
  },
  {
    id: AUTH_ROLES.COURT_OFFICER,
    icon: Gavel,
    color: "bg-amber-700",
    labelEn: "Court Officer",
    labelTe: "కోర్టు అధికారి",
    descEn: "Hearings and court scheduling",
  },
  {
    id: AUTH_ROLES.ADMINISTRATOR,
    icon: UserCog,
    color: "bg-rose-700",
    labelEn: "Administrator",
    labelTe: "నిర్వాహకుడు",
    descEn: "System administration",
  },
  {
    id: AUTH_ROLES.DGP,
    icon: Shield,
    color: "bg-blue-800",
    labelEn: "DGP / Higher Official",
    labelTe: "DGP / ఉన్నత అధికారి",
    descEn: "State-wide operations and monitoring",
  },
  {
    id: AUTH_ROLES.CYBER_OPS,
    icon: Shield,
    color: "bg-teal-800",
    labelEn: "Cyber Ops Officer",
    labelTe: "సైబర్ ఆప్స్ అధికారి",
    descEn: "Cybercrime management",
  },
  {
    id: AUTH_ROLES.SYSTEM_ADMIN,
    icon: UserCog,
    color: "bg-gray-800",
    labelEn: "System Admin",
    labelTe: "సిస్టమ్ అడ్మిన్",
    descEn: "Core platform administration",
  },
];

const PILOT_DATA = {
  Visakhapatnam: {
    mandals: ["Gajuwaka", "Bheemunipatnam", "Anakapalli", "Vizag Urban", "Rushikonda"],
    stations: {
      Gajuwaka: ["Gajuwaka PS", "Steel Plant PS", "Kommadi PS"],
      Bheemunipatnam: ["Bheemunipatnam PS", "Nakkapalli PS"],
      Anakapalli: ["Anakapalli PS", "Yelamanchili PS"],
      "Vizag Urban": ["Town PS Visakhapatnam", "Dwaraka Nagar PS", "MVP Colony PS"],
      Rushikonda: ["Rushikonda PS", "Madhurawada PS"],
    },
  },
  Krishna: {
    mandals: ["Vijayawada Urban", "Benz Circle", "Auto Nagar", "Machilipatnam", "Nandigama"],
    stations: {
      "Vijayawada Urban": ["Vijayawada Town PS", "One Town PS", "Suryaraopet PS"],
      "Benz Circle": ["Benz Circle PS", "Patamata PS"],
      "Auto Nagar": ["Auto Nagar PS", "Gunadala PS"],
      Machilipatnam: ["Machilipatnam Town PS", "Bantumilli PS"],
      Nandigama: ["Nandigama PS", "Tiruvuru PS"],
    },
  },
  Guntur: {
    mandals: ["Guntur Urban", "Brodipet", "Tenali", "Mangalagiri", "Narasaraopet"],
    stations: {
      "Guntur Urban": ["Guntur Town PS", "Arundelpet PS", "Pattabhipuram PS"],
      Brodipet: ["Brodipet PS", "Collectorate PS"],
      Tenali: ["Tenali PS", "Repalle PS"],
      Mangalagiri: ["Mangalagiri PS", "Tadepalle PS"],
      Narasaraopet: ["Narasaraopet PS", "Vinukonda PS"],
    },
  },
  Nellore: {
    mandals: ["Nellore Urban", "Kavali", "Gudur", "Atmakur", "Sullurpeta"],
    stations: {
      "Nellore Urban": ["Nellore Town PS", "Old Town PS", "Santhapet PS"],
      Kavali: ["Kavali PS", "Allur PS"],
      Gudur: ["Gudur PS", "Venkatagiri PS"],
      Atmakur: ["Atmakur PS"],
      Sullurpeta: ["Sullurpeta PS", "Naidupeta PS"],
    },
  },
  Chittoor: {
    mandals: ["Tirupati Urban", "Chittoor Town", "Madanapalle", "Puttur", "Srikalahasti"],
    stations: {
      "Tirupati Urban": ["Tirupati Urban PS", "Alipiri PS", "Tiruchanur PS"],
      "Chittoor Town": ["Chittoor Town PS", "Kuppam PS"],
      Madanapalle: ["Madanapalle PS", "Punganur PS"],
      Puttur: ["Puttur PS", "Nagari PS"],
      Srikalahasti: ["Srikalahasti PS", "Renigunta PS"],
    },
  },
};

const PILOT_DISTRICTS = Object.keys(PILOT_DATA);

const DESIGNATION_MAP = {
  [AUTH_ROLES.CITIZEN]: [],
  [AUTH_ROLES.POLICE_OFFICER]: ["Constable", "Head Constable", "ASI", "SI"],
  [AUTH_ROLES.STATION_OFFICER]: ["Sub-Inspector (SI)", "ASI", "Station House Officer"],
  [AUTH_ROLES.DSP]: ["Deputy Superintendent of Police (DSP)"],
  [AUTH_ROLES.DGP]: ["Director General of Police (DGP)", "Additional DGP", "Inspector General (IG)", "Deputy Inspector General (DIG)"],
  [AUTH_ROLES.CYBER_OPS]: ["Cyber Operations Lead", "Cyber Security Analyst", "Digital Forensics Officer"],
  [AUTH_ROLES.LAWYER]: [],
  [AUTH_ROLES.COURT_OFFICER]: ["Additional District Judge", "Civil Judge", "Magistrate", "Sessions Judge"],
  [AUTH_ROLES.ADMINISTRATOR]: ["System Administrator"],
  [AUTH_ROLES.SYSTEM_ADMIN]: ["Super Admin", "IT Operations Manager"],
};

export default function Register() {
  const { lang } = useLanguage();
  const { signUp } = useAuth();

  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [mandal, setMandal] = useState("");
  const [policeStation, setPoliceStation] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleDistrictChange = (val) => {
    setDistrict(val);
    setMandal("");
    setPoliceStation("");
  };

  const handleMandalChange = (val) => {
    setMandal(val);
    setPoliceStation("");
  };

  const mandalList = district ? PILOT_DATA[district]?.mandals || [] : [];
  const stationList = district && mandal ? PILOT_DATA[district]?.stations?.[mandal] || [] : [];
  const designationList = selectedRole ? DESIGNATION_MAP[selectedRole] || [] : [];

  const isPoliceRole = [AUTH_ROLES.POLICE_OFFICER, AUTH_ROLES.STATION_OFFICER, AUTH_ROLES.DSP, AUTH_ROLES.DGP, AUTH_ROLES.CYBER_OPS].includes(selectedRole);
  const needsDesignation = [AUTH_ROLES.POLICE_OFFICER, AUTH_ROLES.STATION_OFFICER, AUTH_ROLES.DSP, AUTH_ROLES.DGP, AUTH_ROLES.CYBER_OPS, AUTH_ROLES.COURT_OFFICER, AUTH_ROLES.LAWYER, AUTH_ROLES.ADMINISTRATOR, AUTH_ROLES.SYSTEM_ADMIN].includes(selectedRole);
  const needsDepartment = [AUTH_ROLES.POLICE_OFFICER, AUTH_ROLES.STATION_OFFICER, AUTH_ROLES.DSP, AUTH_ROLES.DGP, AUTH_ROLES.CYBER_OPS, AUTH_ROLES.ADMINISTRATOR, AUTH_ROLES.SYSTEM_ADMIN].includes(selectedRole);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedRole) {
      setError(lang === "te" ? "పాత్రను ఎంచుకోండి" : "Please select a role");
      return;
    }
    if (!fullName.trim()) {
      setError(lang === "te" ? "పೂರ್ಣ పేరు అవసరం" : "Full name is required");
      return;
    }
    if (!email.trim()) {
      setError(lang === "te" ? "ఈమెయిల్ అవసరం" : "Email is required");
      return;
    }
    if (!phone.trim()) {
      setError(lang === "te" ? "ఫోన్ నంబర్ అవసరం" : "Mobile number is required");
      return;
    }
    if (password.length < 6) {
      setError(lang === "te" ? "పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి" : "Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError(lang === "te" ? "పాస్‌వర్డ్‌లు సరిపోలడం లేదు" : "Passwords do not match");
      return;
    }
    if (!district.trim()) {
      setError(lang === "te" ? "జిల్లా అవసరం" : "District is required");
      return;
    }
    if (!mandal.trim()) {
      setError(lang === "te" ? "మండలం / తాలూక్ అవసరం" : "Mandal / Taluk is required");
      return;
    }
    if (!address.trim()) {
      setError(lang === "te" ? "చిరునామా అవసరం" : "Address is required");
      return;
    }
    if (isPoliceRole && !policeStation.trim()) {
      setError(lang === "te" ? "పోలీస్ స్టేషన్ అవసరం" : "Police station is required");
      return;
    }
    if (needsDesignation && !designation.trim()) {
      setError(lang === "te" ? "Designation / ర్యాంక్ అవసరం" : "Designation / Rank is required");
      return;
    }
    if (needsDepartment && !department.trim()) {
      setError(lang === "te" ? "విభాగం అవసరం" : "Department is required");
      return;
    }

    setLoading(true);

    const profilePayload = {
      role: selectedRole,
      full_name: fullName.trim(),
      phone: phone.trim(),
      district: district.trim(),
      mandal: mandal.trim(),
      police_station: policeStation.trim() || null,
      department: department.trim() || null,
      designation: designation.trim() || null,
      address: address.trim(),
    };

    const { data, error: signUpError } = await signUp(email, password, profilePayload);
    setLoading(false);

    if (signUpError) {
      console.error("=== REGISTRATION ERROR DEBUG ===");
      console.error("Original error object:", signUpError);
      
      let debugMsg = "";
      if (signUpError.message === '{}' || signUpError.name === 'AuthRetryableFetchError') {
        debugMsg = lang === "te" 
          ? "సర్వర్ లోపం: రిజిస్ట్రేషన్ విఫలమైంది. ఇది బహుశా ఇమెయిల్ పరిమితి (గంటకు 3) దాటడం వల్ల కావచ్చు. దయచేసి తర్వాత ప్రయత్నించండి."
          : "Server Error: Registration failed. If you are using Supabase's default email provider, you may have hit the email rate limit (3 per hour). Please configure a custom SMTP provider in your Supabase dashboard or try again later.";
      } else if (signUpError.message?.includes("already registered")) {
         debugMsg = lang === "te" ? "ఈ ఇమెయిల్ ఇప్పటికే నమోదు చేయబడింది." : "This email is already registered.";
      } else {
        debugMsg = signUpError.message || "Registration failed. Please try again.";
      }

      setError(debugMsg);
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full shadow-lg border-t-4 border-t-secondary">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-slate-800">
              {lang === "te" ? "ఇమెయిల్ ధృవీకరించండి" : "Verify Your Email"}
            </h2>
            <p className="text-slate-600">
              {lang === "te"
                ? `మేము ${email} కు ధృవీకరణ లింక్ పంపాము. లాగిన్ చేసే ముందు మీ ఇమెయిల్‌ను ధృవీకరించండి.`
                : `We sent a verification link to ${email}. You must verify your email before you can log in.`}
            </p>
            <Button asChild className="w-full mt-4 h-12 text-lg">
              <Link to="/login">{lang === "te" ? "లాగిన్ పేజీకి వెళ్ళండి" : "Proceed to Login"}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* LEFT PANEL - INFO & WORKFLOW */}
      <div className="hidden md:flex md:w-1/3 lg:w-2/5 bg-slate-900 text-white p-10 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=800&q=80')] bg-cover bg-center mix-blend-overlay"></div>
        
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition mb-12">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          
          <div className="mb-8">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="NyayaMitra Logo" className="h-16 mb-6" />
            <h1 className="text-3xl font-heading font-bold mb-4 leading-tight">
              NyayaMitra<br/>
              <span className="text-secondary text-xl font-medium">Digital Justice Platform</span>
            </h1>
            <p className="text-slate-300 leading-relaxed text-sm">
              A unified, secure, and transparent ecosystem bridging Citizens, Police, Lawyers, and Courts. Register with your official credentials to access your designated dashboard.
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">The NyayaMitra Workflow</h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                <div className="bg-blue-600/20 text-blue-400 p-2 rounded-md"><Users className="w-5 h-5"/></div>
                <div className="text-sm">
                  <span className="block font-medium">Citizen</span>
                  <span className="text-slate-400 text-xs">Files complaint & tracks status</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                <div className="bg-emerald-600/20 text-emerald-400 p-2 rounded-md"><Shield className="w-5 h-5"/></div>
                <div className="text-sm">
                  <span className="block font-medium">Police Command</span>
                  <span className="text-slate-400 text-xs">Investigates, updates FIR & evidence</span>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                <div className="bg-amber-600/20 text-amber-400 p-2 rounded-md"><Scale className="w-5 h-5"/></div>
                <div className="text-sm">
                  <span className="block font-medium">Legal & Courts</span>
                  <span className="text-slate-400 text-xs">Reviews evidence & delivers justice</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-xs text-slate-500 mt-12">
          &copy; {new Date().getFullYear()} NyayaMitra Enterprise Project. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL - REGISTRATION FORM */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 overflow-y-auto">
        <div className="max-w-2xl w-full mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h2 className="font-heading font-bold text-3xl text-slate-900">
              {lang === "te" ? "రిజిస్టర్" : "Create an Account"}
            </h2>
            <p className="text-slate-600 mt-2">
              {lang === "te" ? "పాత్రను ఎంచుకుని ఖాతా సృష్టించండి. వన్-ఈమెయిల్ పాలసీ వర్తిస్తుంది." : "Select your role to access your dedicated portal. One-email policy applies."}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {ROLES.map((role, i) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md h-full ${
                    selectedRole === role.id
                      ? "ring-2 ring-primary border-primary bg-primary/5 shadow-md"
                      : "hover:border-slate-300 bg-white"
                  }`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <CardContent className="p-4 flex items-start gap-3 h-full">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${role.color}`}>
                      <role.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-semibold text-sm text-slate-900">
                        {lang === "te" ? role.labelTe : role.labelEn}
                      </h3>
                      <p className="text-slate-500 text-xs mt-0.5 leading-tight">{role.descEn}</p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 shrink-0 mt-1 ${
                        selectedRole === role.id ? "border-primary bg-primary" : "border-slate-300"
                      }`}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-slate-200 shadow-sm rounded-xl p-6 md:p-8">
            <div className="space-y-2">
              <Label htmlFor="reg-name">{lang === "te" ? "పూర్తి పేరు *" : "Full Name *"}</Label>
              <Input
                id="reg-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your official name"
                required
                className="bg-slate-50"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reg-email">{lang === "te" ? "ఇమెయిల్ *" : "Official Email *"}</Label>
                <Input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required
                  className="bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-phone">{lang === "te" ? "మొబైల్ నంబర్ *" : "Mobile Number *"}</Label>
                <Input
                  id="reg-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91"
                  required
                  className="bg-slate-50"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reg-password">{lang === "te" ? "పాస్‌వర్డ్ *" : "Password *"}</Label>
                <Input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-confirm">{lang === "te" ? "పాస్‌వర్డ్ నిర్ధారించండి *" : "Confirm Password *"}</Label>
                <Input
                  id="reg-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-slate-50"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
              <h4 className="text-sm font-semibold text-slate-700">Location Details</h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reg-district" className="text-xs">{lang === "te" ? "జిల్లా *" : "District *"}</Label>
                  <Select value={district} onValueChange={handleDistrictChange}>
                    <SelectTrigger id="reg-district" className="bg-white">
                      <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent>
                      {PILOT_DISTRICTS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d === "Krishna" ? "Vijayawada (Krishna)" : d === "Chittoor" ? "Tirupati (Chittoor)" : d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="reg-mandal" className="text-xs">{lang === "te" ? "మండలం / తాలూక్ *" : "Mandal / Taluk *"}</Label>
                  <Select value={mandal} onValueChange={handleMandalChange} disabled={!district}>
                    <SelectTrigger id="reg-mandal" className="bg-white">
                      <SelectValue placeholder="Select Mandal" />
                    </SelectTrigger>
                    <SelectContent>
                      {mandalList.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 mt-3">
                <Label htmlFor="reg-address" className="text-xs">{lang === "te" ? "పూర్తి చిరునామా *" : "Full Address *"}</Label>
                <Input id="reg-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House No, Street, Landmark" className="bg-white" />
              </div>
            </div>

            {(isPoliceRole || needsDepartment || selectedRole === AUTH_ROLES.COURT_OFFICER || selectedRole === AUTH_ROLES.LAWYER) && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                <h4 className="text-sm font-semibold text-slate-700">Professional Details</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  {isPoliceRole && (
                    <div>
                      <Label htmlFor="reg-station" className="text-xs">{lang === "te" ? "పోలీస్ స్టేషన్ *" : "Police Station *"}</Label>
                      <Select value={policeStation} onValueChange={setPoliceStation} disabled={!mandal}>
                        <SelectTrigger id="reg-station" className="bg-white">
                          <SelectValue placeholder="Select Station" />
                        </SelectTrigger>
                        <SelectContent>
                          {stationList.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="reg-department" className="text-xs">
                      {selectedRole === AUTH_ROLES.LAWYER
                        ? lang === 'te'
                          ? 'ఫర్మ్ / చాంబర్ *'
                          : 'Firm / Chamber *'
                        : selectedRole === AUTH_ROLES.COURT_OFFICER
                        ? lang === 'te'
                          ? 'కోర్టు పేరు *'
                          : 'Court Name *'
                        : lang === 'te'
                        ? 'విభాగం *'
                        : 'Department *'}
                    </Label>
                    {selectedRole === AUTH_ROLES.LAWYER || selectedRole === AUTH_ROLES.COURT_OFFICER ? (
                      <Input id="reg-department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder={selectedRole === AUTH_ROLES.LAWYER ? "Enter firm name" : "Enter court name"} className="bg-white" />
                    ) : (
                      <Select value={department} onValueChange={setDepartment}>
                        <SelectTrigger id="reg-department" className="bg-white">
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                          {["general", "narcotics", "cyber_crime", "cid", "traffic", "anti_corruption"].map((d) => (
                            <SelectItem key={d} value={d}>
                              {d.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  {needsDesignation && (
                    <div className="sm:col-span-2">
                      <Label htmlFor="reg-designation" className="text-xs">{lang === "te" ? "Designation / Rank *" : "Designation / Rank *"}</Label>
                      {designationList.length > 0 ? (
                        <Select value={designation} onValueChange={setDesignation}>
                          <SelectTrigger id="reg-designation" className="bg-white">
                            <SelectValue placeholder="Select Designation" />
                          </SelectTrigger>
                          <SelectContent>
                            {designationList.map((d) => (
                              <SelectItem key={d} value={d}>
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input id="reg-designation" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Enter designation" className="bg-white" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
                <p className="text-sm text-red-700 whitespace-pre-wrap font-medium">{typeof error === 'string' ? error : String(error)}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-lg font-medium shadow-sm" disabled={loading || !selectedRole}>
              {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              {lang === "te" ? "ఖాతా సృష్టించండి" : "Create Account"}
            </Button>

            <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-2">
              <p className="text-sm text-slate-500">
                {lang === "te" ? "ఇప్పటికే ఖాతా ఉందా?" : "Already have an account?"}
              </p>
              <Button variant="outline" asChild className="w-full h-10">
                <Link to="/login">
                  {lang === "te" ? "లాగిన్ చేయండి" : "Sign in instead"}
                </Link>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
