import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../lib/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Users, Scale, Gavel, ArrowLeft, Building2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

// 5 pilot districts for DSP selection
const PILOT_DISTRICTS = [
  "Visakhapatnam",
  "Krishna (Vijayawada)",
  "Guntur",
  "Nellore",
  "Chittoor (Tirupati)",
];

const BASE_ROLES = [
  {
    id: "citizen",
    icon: Users,
    color: "bg-blue-600",
    labelEn: "Citizen / Public",
    labelTe: "పౌరుడు",
    descEn: "File complaints, track cases, access legal help",
    descTe: "ఫిర్యాదులు చేయండి, కేసులను ట్రాక్ చేయండి",
    hasSub: false,
  },
  {
    id: "police_station",
    icon: Shield,
    color: "bg-primary",
    labelEn: "Police Station Officer",
    labelTe: "పోలీసు స్టేషన్ అధికారి",
    descEn: "SI / Constable / Head Constable — Manage station cases",
    descTe: "SI / కానిస్టేబుల్ — స్టేషన్ కేసులు నిర్వహించండి",
    hasSub: false,
  },
  {
    id: "dsp",
    icon: Building2,
    color: "bg-indigo-700",
    labelEn: "DSP / District Officer",
    labelTe: "DSP / జిల్లా అధికారి",
    descEn: "Deputy SP — District-wide oversight (select your district)",
    descTe: "డిప్యూటీ SP — జిల్లా పర్యవేక్షణ",
    hasSub: true,
  },
  {
    id: "dgp",
    icon: Shield,
    color: "bg-rose-700",
    labelEn: "DGP / Senior Command",
    labelTe: "DGP / సీనియర్ కమాండ్",
    descEn: "SP / DIG / IG / ADG / DGP — State-wide command center",
    descTe: "SP / DIG / IG / ADG / DGP — రాష్ట్ర కమాండ్",
    hasSub: false,
  },
  {
    id: "lawyer",
    icon: Scale,
    color: "bg-violet-600",
    labelEn: "Lawyer / Advocate",
    labelTe: "న్యాయవాది",
    descEn: "Assigned cases, legal consultation, document drafting",
    descTe: "కేటాయించిన కేసులను సమీక్షించండి",
    hasSub: false,
  },
  {
    id: "court",
    icon: Gavel,
    color: "bg-amber-700",
    labelEn: "Court Officer / Judge",
    labelTe: "న్యాయస్థాన అధికారి",
    descEn: "Cause list, hearing scheduling, court orders",
    descTe: "కోర్టు వినికిడులు, ఆదేశాలు నిర్వహణ",
    hasSub: false,
  },
];

export default function AuthPortal() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Map from our simplified role IDs to actual user_type values
  const roleToUserType = {
    citizen: "citizen",
    police_station: "police",
    dsp: "dsp",
    dgp: "dgp",
    lawyer: "lawyer",
    court: "court",
  };

  const handleAuth = async (e) => {
    e?.preventDefault();
    if (!canProceed || !email.trim() || !password) return;

    setLoading(true);
    setError("");

    const roleParam = roleToUserType[selectedRole] || selectedRole;
    let params = `role=${roleParam}`;
    if (selectedRole === "dsp" && selectedDistrict) {
      params += `&district=${encodeURIComponent(selectedDistrict)}`;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message || (lang === "te" ? "లాగిన్ విఫలమైంది" : "Login failed"));
      return;
    }

    // Registration/complete-profile flow removed — redirect user to login for post-registration checks
    navigate('/login');
  };

  const canProceed = selectedRole && (selectedRole !== "dsp" || selectedDistrict);
  const canSubmit = canProceed && email.trim() && password && !loading;

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <button
        onClick={() => window.history.length > 1 ? window.history.back() : (window.location.href = "/")}
        className="fixed top-20 left-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground bg-card border border-border rounded-lg px-3 py-2 shadow-sm transition z-40"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="max-w-2xl w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="font-heading font-bold text-3xl text-foreground">
            {lang === "te" ? "లాగిన్ / నమోదు" : "Login / Register"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {lang === "te"
              ? "మీ పాత్రను ఎంచుకుని లాగిన్ చేయండి"
              : "Select your role to access NYAYA MITRA"}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {BASE_ROLES.map((role, i) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedRole === role.id
                    ? "ring-2 ring-secondary border-secondary shadow-lg"
                    : "hover:border-primary/30"
                }`}
                onClick={() => {
                  setSelectedRole(role.id);
                  if (role.id !== "dsp") setSelectedDistrict(null);
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role.color}`}>
                      <role.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold text-sm">
                        {lang === "te" ? role.labelTe : role.labelEn}
                      </h3>
                      <p className="text-muted-foreground text-xs mt-1">
                        {lang === "te" ? role.descTe : role.descEn}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                        selectedRole === role.id ? "border-secondary bg-secondary" : "border-border"
                      }`}
                    >
                      {selectedRole === role.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* DSP District sub-selector */}
              {role.id === "dsp" && selectedRole === "dsp" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-2 bg-indigo-50 border border-indigo-200 rounded-xl p-3"
                >
                  <p className="text-xs font-semibold text-indigo-700 mb-2">
                    🏛️ Select Your District (Pilot Area):
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {PILOT_DISTRICTS.map((d) => (
                      <button
                        key={d}
                        onClick={(e) => { e.stopPropagation(); setSelectedDistrict(d); }}
                        className={`text-left text-xs px-3 py-2 rounded-lg border transition font-medium ${
                          selectedDistrict === d
                            ? "bg-indigo-700 text-white border-indigo-700"
                            : "bg-white text-indigo-800 border-indigo-200 hover:bg-indigo-100"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onSubmit={handleAuth}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="auth-email">{lang === "te" ? "ఇమెయిల్" : "Email"}</Label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={lang === "te" ? "మీ ఇమెయిల్" : "you@example.com"}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-password">{lang === "te" ? "పాస్‌వర్డ్" : "Password"}</Label>
            <Input
              id="auth-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-lg h-14 gap-2"
            disabled={!canSubmit}
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {lang === "te" ? "లాగిన్ చేయండి" : "Login"}
          </Button>
          {!canProceed && selectedRole === "dsp" && (
            <p className="text-center text-amber-600 text-xs">⚠️ Please select your district to continue</p>
          )}
          <p className="text-center text-muted-foreground text-xs">
            {lang === "te" ? "ఇమెయిల్ మరియు పాస్‌వర్డ్‌తో సురక్షిత లాగిన్" : "Secure login with email and password"}
          </p>
        </motion.form>
      </div>
    </div>
  );
}
