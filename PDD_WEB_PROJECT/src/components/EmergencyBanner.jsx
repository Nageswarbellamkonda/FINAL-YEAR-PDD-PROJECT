import { AlertTriangle, Shield, Wifi, Siren, ShieldAlert, Ambulance, MonitorCheck, Baby, Pill, TrafficCone, Building, Scale, HeartHandshake, Flame, FileText } from "lucide-react";
import { motion } from "framer-motion";

const HELPLINES = [
  { label: "Police Emergency", number: "100", icon: Siren, color: "bg-red-700", desc: "AP Police 24/7" },
  { label: "Women Helpline", number: "181", icon: ShieldAlert, color: "bg-rose-700", desc: "AP SHE Teams" },
  { label: "Ambulance", number: "108", icon: Ambulance, color: "bg-orange-600", desc: "Medical Emergency" },
  { label: "Cyber Crime", number: "1930", icon: MonitorCheck, color: "bg-slate-700", desc: "Online Fraud" },
  { label: "Child Helpline", number: "1098", icon: Baby, color: "bg-amber-700", desc: "CHILDLINE India" },
  { label: "Narcotics", number: "1800-425-5555", icon: Pill, color: "bg-purple-800", desc: "Free Helpline" },
  { label: "AP Traffic Police", number: "9100-194-194", icon: TrafficCone, color: "bg-yellow-700", desc: "Andhra Pradesh" },
  { label: "AP DGP Control", number: "0863-2340001", icon: Building, color: "bg-blue-800", desc: "AP Headquarters" },
  { label: "AP Anti-Corruption", number: "14400", icon: Scale, color: "bg-green-800", desc: "ACB Andhra Pradesh" },
  { label: "AP Senior Citizens", number: "1090", icon: HeartHandshake, color: "bg-indigo-700", desc: "Elder Care AP" },
  { label: "AP Fire Service", number: "101", icon: Flame, color: "bg-red-600", desc: "Fire Emergency" },
  { label: "Legal Aid (AP)", number: "15100", icon: FileText, color: "bg-teal-700", desc: "APSLSA Free Aid" },
];

export default function EmergencyBanner() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1d4ed8] px-5 py-3">
        <div className="flex items-center gap-3 mb-1">
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <AlertTriangle className="w-5 h-5 text-yellow-300" />
          </motion.div>
          <h3 className="text-white font-heading font-bold text-sm tracking-wide flex-1">
            EMERGENCY HELPLINES — ANDHRA PRADESH POLICE
          </h3>
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-green-400"
            />
            <span className="text-white/80 text-xs">LIVE 24/7</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-card p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {HELPLINES.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.a
              key={item.label}
              href={`tel:${item.number}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group flex items-center gap-3 bg-background rounded-xl p-3 border border-border hover:border-blue-300 hover:shadow-md transition-all duration-200"
            >
              <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium truncate">{item.label}</p>
                <p className="font-bold text-sm text-foreground group-hover:text-blue-700 transition-colors">{item.number}</p>
                <p className="text-[9px] text-muted-foreground/70">{item.desc}</p>
              </div>
            </motion.a>
          );
        })}
      </div>

      {/* Footer */}
      <div className="bg-muted/40 px-5 py-2.5 flex items-center gap-2 border-t border-border">
        <Shield className="w-3.5 h-3.5 text-primary" />
        <p className="text-xs text-muted-foreground">
          All helplines are <strong>toll-free</strong> and operational across Andhra Pradesh
        </p>
        <Wifi className="w-3.5 h-3.5 text-green-500 ml-auto flex-shrink-0" />
      </div>
    </div>
  );
}