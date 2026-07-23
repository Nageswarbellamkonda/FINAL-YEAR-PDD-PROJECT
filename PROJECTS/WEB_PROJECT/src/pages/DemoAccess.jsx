import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Star, Loader2, ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ROLE_LABELS } from "@/lib/rbac";
import { motion } from "framer-motion";

const DEMO_ACCOUNTS = [
  { email: "dgp@test.com", role: "dgp", name: "DGP Ramesh Kumar", desc: "Full state control — All districts, all data", color: "bg-red-600", icon: "🎖️", redirect: "/dgp-dashboard" },
  { email: "sp@test.com", role: "sp", name: "SP Suresh Reddy", desc: "District-level SP — Visakhapatnam District", color: "bg-primary", icon: "⭐", redirect: "/officer-dashboard" },
  { email: "dsp@test.com", role: "dsp", name: "DSP Priya Sharma", desc: "Sub-division control — Nellore", color: "bg-violet-600", icon: "🔵", redirect: "/officer-dashboard" },
  { email: "ci@test.com", role: "ci", name: "CI Venkat Rao", desc: "Circle Inspector — Visakhapatnam North Circle", color: "bg-blue-600", icon: "🟦", redirect: "/officer-dashboard" },
  { email: "si@test.com", role: "si", name: "SI Lakshmi Devi", desc: "Sub-Inspector — Dwaraka Nagar Station", color: "bg-secondary", icon: "🟩", redirect: "/officer-dashboard" },
  { email: "constable@test.com", role: "police", name: "Constable Raju", desc: "Field constable — Limited access — Visakhapatnam", color: "bg-gray-600", icon: "🟫", redirect: "/officer-dashboard" },
  { email: "lawyer@test.com", role: "lawyer", name: "Adv. Sunitha Rao", desc: "Legal counsel — Cases, petitions, court appearances", color: "bg-emerald-600", icon: "⚖️", redirect: "/lawyer-dashboard" },
  { email: "court@test.com", role: "court", name: "Court Officer", desc: "Judicial case management & hearing dashboard", color: "bg-amber-700", icon: "🏛️", redirect: "/court-dashboard" },
];

const AP_HIERARCHY = [
  { role: "DGP", full: "Director General of Police", scope: "Entire Andhra Pradesh" },
  { role: "ADGP", full: "Additional DG of Police", scope: "Zone / Special wings" },
  { role: "IGP", full: "Inspector General of Police", scope: "Range / Zone" },
  { role: "DIG", full: "Deputy Inspector General", scope: "Range oversight" },
  { role: "SSP/SP", full: "Superintendent of Police", scope: "District" },
  { role: "ASP/DSP", full: "Additional/Deputy SP", scope: "Sub-division" },
  { role: "CI", full: "Circle Inspector", scope: "Circle / Multiple stations" },
  { role: "SI", full: "Sub-Inspector", scope: "Police Station" },
  { role: "ASI", full: "Assistant Sub-Inspector", scope: "Station beat" },
  { role: "HC", full: "Head Constable", scope: "Beat / Patrol zone" },
  { role: "PC", full: "Police Constable", scope: "Field / Beat duty" },
];

export default function DemoAccess() {
  const [loading, setLoading] = useState(null);
  const [showPass, setShowPass] = useState(false);

  const handleDemoLogin = async (account) => {
    setLoading(account.email);
    toast.info(`Redirecting to login — use email: ${account.email} | password: 123`, { duration: 4000 });
    setTimeout(() => {
      window.location.href = "/auth";
      setLoading(null);
    }, 1800);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/auth"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Login</Link>
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-heading font-bold text-2xl">Demo Access</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Explore NYAYA MITRA with pre-configured demo accounts for each role level
          </p>
        </div>

        {/* Password Info */}
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">All demo accounts use the same password</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-amber-700 text-lg font-bold tracking-widest">
                {showPass ? "123" : "•••"}
              </span>
              <button onClick={() => setShowPass(!showPass)} className="text-amber-600 hover:text-amber-800">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Full AP Hierarchy */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-blue-800 font-semibold text-sm mb-3">Andhra Pradesh Police Hierarchy:</p>
          <div className="space-y-1.5">
            {AP_HIERARCHY.map((h, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0 text-[9px]">{i+1}</div>
                <span className="font-semibold text-blue-800 w-16 shrink-0">{h.role}</span>
                <span className="text-blue-700 flex-1">{h.full}</span>
                <span className="text-blue-500 hidden sm:block">{h.scope}</span>
              </div>
            ))}
          </div>
          <p className="text-blue-700 text-xs mt-3 border-t border-blue-200 pt-2">Each higher rank has full visibility into all lower-level data, attendance, duties & case operations.</p>
        </div>

        {/* Demo Accounts */}
        <div className="space-y-3">
          {DEMO_ACCOUNTS.map((account, i) => (
            <motion.div
              key={account.email}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="hover:shadow-md transition-all cursor-pointer border-2 hover:border-primary/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${account.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                      {account.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{account.name}</p>
                        <Badge variant="outline" className="text-[10px]">{ROLE_LABELS[account.role] || account.role.toUpperCase()}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{account.desc}</p>
                      <p className="text-xs font-mono text-muted-foreground mt-1 bg-muted/50 px-2 py-0.5 rounded inline-block">
                        {account.email}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="gap-1 shrink-0"
                      onClick={() => handleDemoLogin(account)}
                      disabled={loading === account.email}
                    >
                      {loading === account.email ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Shield className="w-4 h-4" />
                      )}
                      Login
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-muted/50 rounded-xl p-4">
          <p className="font-semibold text-sm mb-2">How to use Demo Access:</p>
          <ol className="space-y-1 text-xs text-muted-foreground list-decimal list-inside">
            <li>Click "Login" on any demo account above</li>
            <li>You will be redirected to the login page</li>
            <li>Enter the email shown and password: <strong>123</strong></li>
            <li>Complete profile setup if prompted (select the appropriate role)</li>
            <li>Explore the full role-based dashboard and features</li>
          </ol>
        </div>
      </motion.div>
    </div>
  );
}