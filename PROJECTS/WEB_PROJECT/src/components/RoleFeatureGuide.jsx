import { Shield, FileText, Search, MapPin, BarChart2, Scale, Users, Star, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const roleFeatures = {
  citizen: {
    label: "Citizen",
    icon: Users,
    color: "bg-blue-600",
    features: [
      { icon: FileText, label: "File Complaint", desc: "Register any crime or incident online", to: "/file-complaint" },
      { icon: Search, label: "Track Case", desc: "Check your case status with Case ID", to: "/track-case" },
      { icon: Shield, label: "Women Safety", desc: "Start safety session, SOS alerts", to: "/women-safety" },
      { icon: MapPin, label: "Live Tracking", desc: "Monitor your safety session", to: "/live-tracking" },
    ],
  },
  police: {
    label: "Police Officer",
    icon: Shield,
    color: "bg-primary",
    features: [
      { icon: FileText, label: "Manage Cases", desc: "View & update assigned complaints", to: "/dashboard" },
      { icon: MapPin, label: "Live Tracking", desc: "Monitor active women safety sessions", to: "/live-tracking" },
      { icon: Scale, label: "Legal Documents", desc: "Generate FIR, chargesheet, petitions", to: "/legal-documents" },
      { icon: BarChart2, label: "Analytics", desc: "Crime statistics & case reports", to: "/analytics" },
    ],
  },
  special: {
    label: "Special Officer (SI/CI/DSP/DGP)",
    icon: Star,
    color: "bg-secondary",
    features: [
      { icon: BarChart2, label: "Analytics Dashboard", desc: "Full crime analytics & trends", to: "/analytics" },
      { icon: MapPin, label: "Live Tracking", desc: "All active safety sessions statewide", to: "/live-tracking" },
      { icon: Scale, label: "Legal Documents", desc: "Generate official legal documents", to: "/legal-documents" },
      { icon: FileText, label: "All Cases", desc: "View & escalate all complaints", to: "/dashboard" },
    ],
  },
  lawyer: {
    label: "Lawyer",
    icon: Scale,
    color: "bg-violet-600",
    features: [
      { icon: FileText, label: "Assigned Cases", desc: "Review cases assigned to you", to: "/dashboard" },
      { icon: Scale, label: "Legal Documents", desc: "Draft petitions & court submissions", to: "/legal-documents" },
      { icon: Search, label: "Track Case", desc: "Check case progress & court dates", to: "/track-case" },
    ],
  },
};

export default function RoleFeatureGuide({ userRole }) {
  const role = roleFeatures[userRole] || roleFeatures.citizen;
  const Icon = role.icon;

  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg ${role.color} flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          Your Access: {role.label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 gap-2">
          {role.features.map((f, i) => (
            <Link
              key={i}
              to={f.to}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-accent transition group"
            >
              <f.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium group-hover:text-primary transition">{f.label}</p>
                <p className="text-xs text-muted-foreground truncate">{f.desc}</p>
              </div>
              <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}