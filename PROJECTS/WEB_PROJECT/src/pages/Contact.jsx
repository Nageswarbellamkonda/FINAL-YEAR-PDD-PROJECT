import { useLanguage } from "../lib/LanguageContext";
import { useTranslation } from "../lib/translations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MapPin, Clock, Globe, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import EmergencyBanner from "../components/EmergencyBanner";

const offices = [
  {
    name: "AP Police Headquarters",
    address: "Mangalagiri, Guntur District, Andhra Pradesh",
    phone: "0866-2974555",
    email: "dgpap@appolice.gov.in",
    hours: "24/7",
  },
  {
    name: "AP State Human Rights Commission",
    address: "Vijayawada, Krishna District",
    phone: "0866-2479665",
    email: "apshrc@ap.gov.in",
    hours: "10:00 AM - 5:00 PM",
  },
];

const importantLinks = [
  { name: "AP Police Official Website", url: "https://www.appolice.gov.in", desc: "Official portal" },
  { name: "AP State Portal", url: "https://www.ap.gov.in", desc: "Government of AP" },
  { name: "National Cyber Crime Portal", url: "https://cybercrime.gov.in", desc: "Report cyber crime" },
  { name: "e-FIR Andhra Pradesh", url: "https://www.appolice.gov.in", desc: "File e-FIR online" },
];

export default function Contact() {
  const { lang } = useLanguage();
  const t = useTranslation(lang);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-10">
          <h1 className="font-heading font-bold text-3xl">{t("contact")}</h1>
          <p className="text-muted-foreground text-sm mt-2">
            {lang === "te"
              ? "సహాయం మరియు సంప్రదింపు వివరాలు"
              : "Get help & contact information"}
          </p>
        </div>

        {/* Emergency */}
        <div className="mb-8">
          <EmergencyBanner />
        </div>

        {/* Offices */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          {offices.map((office, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-heading font-semibold">{office.name}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                      <span>{office.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary" />
                      <a href={`tel:${office.phone}`} className="hover:text-primary transition">{office.phone}</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      <a href={`mailto:${office.email}`} className="hover:text-primary transition">{office.email}</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{office.hours}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Important Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              {lang === "te" ? "ముఖ్యమైన లింక్‌లు" : "Important Links"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {importantLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-accent transition group"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  <div>
                    <p className="text-sm font-medium group-hover:text-primary transition">{link.name}</p>
                    <p className="text-xs text-muted-foreground">{link.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}