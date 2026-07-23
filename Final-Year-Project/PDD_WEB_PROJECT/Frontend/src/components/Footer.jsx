import { useState } from "react";
import { Shield, Phone, Mail, Linkedin, MapPin, Send } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { useTranslation } from "../lib/translations";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function Footer() {
  const { lang } = useLanguage();
  const t = useTranslation(lang);
  const [fbMsg, setFbMsg] = useState("");
  const [fbRating, setFbRating] = useState(5);
  const [fbSending, setFbSending] = useState(false);

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!fbMsg.trim()) return;
    setFbSending(true);
    
    try {
      const { error } = await supabase.from("feedback").insert([{ 
        message: fbMsg, 
        rating: fbRating, 
        is_public: true 
      }]);
      
      if (error) throw error;
      
      toast.success(lang === "te" ? "అభిప్రాయం పంపబడింది! ధన్యవాదాలు." : "Feedback submitted! Thank you.");
      setFbMsg("");
      setFbRating(5);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      toast.error(lang === "te" ? "పొరపాటు జరిగింది." : "Failed to submit feedback.");
    } finally {
      setFbSending(false);
    }
  };

  return (
    <footer className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* App Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="Nyaya Mitra Logo" className="w-12 h-12 rounded-lg bg-white p-1" />
              <h3 className="font-heading font-bold text-xl">{t("appName")}</h3>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Empowering citizens with digital justice. Making the Andhra Pradesh police system
              accessible, transparent, and efficient for everyone.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">{lang === "te" ? "త్వరిత లింక్లు" : "Quick Links"}</h4>
            <div className="space-y-2 text-white/60 text-sm">
              <Link to="/file-complaint" className="block hover:text-white transition">→ {lang === "te" ? "ఫిర్యాదు దాఖలు" : "File a Complaint"}</Link>
              <Link to="/track-case" className="block hover:text-white transition">→ {lang === "te" ? "కేసు ట్రాక్" : "Track Your Case"}</Link>
              <Link to="/women-safety" className="block hover:text-white transition">→ {lang === "te" ? "మహిళా భద్రత" : "Women Safety"}</Link>
              <Link to="/golden-hour-cyber" className="block hover:text-white transition">→ {lang === "te" ? "సైబర్ ఫ్రాడ్" : "Cyber Fraud Help"}</Link>
              <Link to="/demo-access" className="block hover:text-white transition">→ {lang === "te" ? "డెమో యాక్సెస్" : "Demo Access"}</Link>
            </div>
          </div>

          {/* Feedback Form */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">{lang === "te" ? "అభిప్రాయం" : "Quick Feedback"}</h4>
            <form onSubmit={submitFeedback} className="space-y-2">
              <div className="flex gap-1 mb-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setFbRating(n)}
                    className={`text-lg transition ${n <= fbRating ? "text-yellow-400" : "text-white/20"}`}>★</button>
                ))}
              </div>
              <textarea
                value={fbMsg}
                onChange={e => setFbMsg(e.target.value)}
                placeholder={lang === "te" ? "మీ అభిప్రాయం..." : "Share your feedback..."}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 resize-none h-20 focus:outline-none focus:border-secondary"
              />
              <button type="submit" disabled={fbSending || !fbMsg.trim()}
                className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-white text-xs px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50">
                <Send className="w-3 h-3" />{lang === "te" ? "పంపు" : "Submit Feedback"}
              </button>
            </form>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Contact</h4>
            <div className="space-y-3 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-secondary" />
                <span>+91 100 (Emergency)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-secondary" />
                <span>support@nyayamitra.gov.in</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-secondary mt-0.5" />
                <span>Andhra Pradesh Police HQ, Mangalagiri</span>
              </div>
            </div>
          </div>
        </div>

        {/* Developer Credit */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="text-center">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3">
              {t("developedBy")}
            </p>
            <h4 className="font-heading font-bold text-lg text-secondary">
              NAGESWAR BELLAMKONDA
            </h4>
            <p className="text-white/50 text-sm mt-1">
              (192372005) Student at SIMATS — Saveetha Institute of Medical and Technical Sciences - 602105
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-3 text-white/50 text-xs">
              <a href="tel:7893389556" className="flex items-center gap-1 hover:text-secondary transition">
                <Phone className="w-3 h-3" /> 7893389556
              </a>
              <a href="mailto:nageswarbellamkonda56@gmail.com" className="flex items-center gap-1 hover:text-secondary transition">
                <Mail className="w-3 h-3" /> nageswarbellamkonda56@gmail.com
              </a>
              <a
                href="https://www.linkedin.com/in/nageswar-bellamkonda-0ab6302a0"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-secondary transition"
              >
                <Linkedin className="w-3 h-3" /> LinkedIn
              </a>
            </div>
          </div>

          <p className="text-center text-white/30 text-xs mt-6">
            © {new Date().getFullYear()} NYAYA MITRA. All rights reserved. | Andhra Pradesh Police Digital Initiative
          </p>
        </div>
      </div>
    </footer>
  );
}