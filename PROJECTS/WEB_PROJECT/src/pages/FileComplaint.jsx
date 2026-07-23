import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "../lib/LanguageContext";
import { useTranslation } from "../lib/translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Loader2, FileText, CheckCircle2, ArrowLeft, X, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const categories = [
  { value: "narcotics", labelEn: "Narcotics / Drugs", labelTe: "మాదకద్రవ్యాలు", dept: "narcotics", priority: "high" },
  { value: "snatching", labelEn: "Snatching / Robbery", labelTe: "స్నాచింగ్ / దొంగతనం", dept: "general", priority: "high" },
  { value: "women_safety", labelEn: "Women Safety / Harassment", labelTe: "మహిళా భద్రత / వేధింపులు", dept: "she_teams", priority: "high" },
  { value: "cyber_crime", labelEn: "Cyber Crime", labelTe: "సైబర్ నేరం", dept: "cyber_crime", priority: "high" },
  { value: "otp_fraud", labelEn: "OTP / Financial Fraud", labelTe: "OTP / ఆర్థిక మోసం", dept: "cyber_crime", priority: "high" },
  { value: "theft", labelEn: "Theft / Burglary", labelTe: "దొంగతనం", dept: "general", priority: "normal" },
  { value: "assault", labelEn: "Assault / Violence", labelTe: "దాడి / హింస", dept: "general", priority: "high" },
  { value: "domestic_violence", labelEn: "Domestic Violence", labelTe: "గృహ హింస", dept: "she_teams", priority: "high" },
  { value: "missing_person", labelEn: "Missing Person", labelTe: "తప్పిపోయిన వ్యక్తి", dept: "cid", priority: "high" },
  { value: "traffic", labelEn: "Traffic Violation", labelTe: "ట్రాఫిక్ ఉల్లంఘన", dept: "traffic", priority: "low" },
  { value: "corruption", labelEn: "Corruption", labelTe: "అవినీతి", dept: "anti_corruption", priority: "high" },
  { value: "other", labelEn: "Other", labelTe: "ఇతరం", dept: "general", priority: "normal" },
];

// 5 Pilot Districts only
const PILOT_DISTRICT_DATA = {
  "Visakhapatnam": {
    mandals: ["Gajuwaka","Seethammadhara","Anakapalli","Kommadi","Pedagantyada","Bheemunipatnam","Araku"],
    stations: {
      "Gajuwaka": ["Gajuwaka PS","Bheemunipatnam PS","Malkapuram PS"],
      "Seethammadhara": ["One Town PS","MVP Colony PS","Dwaraka Nagar PS","Rushikonda PS","Gopalapatnam PS"],
      "Anakapalli": ["Anakapalli PS","Chodavaram PS"],
      "Kommadi": ["Kommadi PS"],
      "Pedagantyada": ["Pedagantyada PS"],
      "Bheemunipatnam": ["Bheemunipatnam Coastal PS"],
      "Araku": ["Araku Valley PS","Paderu PS","Lambasingi PS"],
    }
  },
  "Krishna": {
    mandals: ["Vijayawada Central","Ibrahimpatnam","Machilipatnam","Nuzvid"],
    stations: {
      "Vijayawada Central": ["Vijayawada One Town PS","Vijayawada II Town PS","Benz Circle PS","Auto Nagar PS","Gunadala PS","Patamata PS"],
      "Ibrahimpatnam": ["Ibrahimpatnam PS","Mylavaram PS"],
      "Machilipatnam": ["Machilipatnam Town PS","Gudivada PS","Nandigama PS"],
      "Nuzvid": ["Nuzvid PS","Jaggayyapeta PS"],
    }
  },
  "Guntur": {
    mandals: ["Guntur Urban","Tenali","Narasaraopet","Sattenapalle","Ponnur"],
    stations: {
      "Guntur Urban": ["Guntur Town PS","Guntur II Town PS","Mangalagiri PS","Tadepalle PS"],
      "Tenali": ["Tenali Town PS","Repalle PS"],
      "Narasaraopet": ["Narasaraopet PS","Bapatla PS"],
      "Sattenapalle": ["Sattenapalle PS","Vinukonda PS"],
      "Ponnur": ["Ponnur PS"],
    }
  },
  "Nellore": {
    mandals: ["Nellore Urban","Kavali","Gudur","Podalakur","Alluru"],
    stations: {
      "Nellore Urban": ["Nellore Town PS","Nellore II Town PS","Nellore III Town PS"],
      "Kavali": ["Kavali Town PS","Atmakur PS"],
      "Gudur": ["Gudur PS","Sullurpeta PS","Naidupet PS"],
      "Podalakur": ["Podalakur PS"],
      "Alluru": ["Alluru PS"],
    }
  },
  "Chittoor": {
    mandals: ["Tirupati Urban","Tirupati Rural","Chittoor Urban","Madanapalle"],
    stations: {
      "Tirupati Urban": ["Tirupati Town PS","Tirupati Rural PS","Srikalahasti PS","Renigunta PS"],
      "Tirupati Rural": ["Chandragiri PS","Yerpedu PS"],
      "Chittoor Urban": ["Chittoor Town PS","Puttur PS","Kuppam PS"],
      "Madanapalle": ["Madanapalle Town PS","Punganur PS"],
    }
  },
};

function getAutoPriority(category) {
  const cat = categories.find(c => c.value === category);
  return { priority: cat?.priority || "normal", department: cat?.dept || "general" };
}

export default function FileComplaint() {
  const { lang } = useLanguage();
  const t = useTranslation(lang);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    complainant_name: "",
    complainant_phone: "",
    complainant_email: "",
    location: "",
    district: "",
    mandal: "",
    police_station: "",
  });
  const [proofUrls, setProofUrls] = useState([]);
  const [proofFiles, setProofFiles] = useState([]);

  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleDistrictChange = (val) => {
    setForm(prev => ({ ...prev, district: val, mandal: "", police_station: "" }));
  };

  const handleMandalChange = (val) => {
    setForm(prev => ({ ...prev, mandal: val, police_station: "" }));
  };

  const currentMandals = form.district ? (PILOT_DISTRICT_DATA[form.district]?.mandals || []) : [];
  const currentStations = (form.district && form.mandal) ? (PILOT_DISTRICT_DATA[form.district]?.stations[form.mandal] || []) : [];

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    setUploading(true);
    const newProofs = [];
    for (const file of files) {
      const fileName = `${Date.now()}_${file.name}`;
      let finalUrl = "";
      try {
        const { data, error } = await supabase.storage.from('evidence').upload(`complaints/${fileName}`, file);
        if (error) throw error;
        if (data) {
          const { data: { publicUrl } } = supabase.storage.from('evidence').getPublicUrl(`complaints/${fileName}`);
          finalUrl = publicUrl;
        }
      } catch (uploadErr) {
        console.warn("[FILE_COMPLAINT_DEBUG] Storage upload failed, falling back to local object URL:", uploadErr);
        finalUrl = URL.createObjectURL(file);
      }
      if (finalUrl) {
        newProofs.push({ url: finalUrl, name: file.name, type: file.type });
      }
    }
    setProofUrls(prev => [...prev, ...newProofs.map(p => p.url)]);
    setProofFiles(prev => [...prev, ...newProofs]);
    setUploading(false);
    toast.success(lang === "te" ? "ఫైల్‌లు అప్‌లోడ్ అయ్యాయి" : "Files uploaded successfully");
  };

  const removeProof = (index) => {
    setProofFiles(prev => prev.filter((_, i) => i !== index));
    setProofUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.category || !form.complainant_name || !form.complainant_phone || !form.location || !form.district) {
      toast.error(lang === "te" ? "అన్ని అవసరమైన ఫీల్డ్‌లు నింపండి" : "Please fill all required fields (including District)");
      return;
    }
    setLoading(true);

    const { priority, department } = getAutoPriority(form.category);
    const caseId = `NM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const escalationDate = new Date();
    escalationDate.setDate(escalationDate.getDate() + 3);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: complaintData, error } = await supabase.from('complaints').insert([{
        complaint_number: caseId,
        user_id: user?.id,
        title: form.title,
        description: form.description,
        complaint_type: form.category,
        district: form.district,
        police_station: form.police_station,
        location: form.mandal ? `${form.location}, ${form.mandal}` : form.location,
        complainant_name: form.complainant_name,
        complainant_phone: form.complainant_phone,
        priority: priority,
        status: "filed",
        action_updates: [{
          date: new Date().toISOString(),
          update: `Complaint filed. Auto-assigned priority: ${priority}. Department: ${department}`,
          by: "System",
        }],
      }]).select();

      if (error) throw error;
      
      // If there are uploaded proofs, insert them into evidence_files
      if (proofUrls.length > 0 && complaintData && complaintData[0]) {
        const evidenceRecords = proofUrls.map(url => ({
          complaint_id: complaintData[0].id,
          user_id: user?.id,
          file_url: url,
          description: "Attached during complaint filing",
          file_name: url.split('/').pop(),
          evidence_type: "document"
        }));
        await supabase.from('evidence_files').insert(evidenceRecords);
      }
    } catch (e) {
      console.error("Backend insert failed", e);
      toast.error("Failed to file complaint. Please try again.");
      setLoading(false);
      return;
    }

    setSuccess(caseId);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="font-heading font-bold text-2xl text-foreground mb-2">
            {lang === "te" ? "ఫిర్యాదు విజయవంతంగా దాఖలు చేయబడింది!" : "Complaint Filed Successfully!"}
          </h2>
          <p className="text-muted-foreground mb-4">
            {lang === "te" ? "మీ కేసు ID:" : "Your Case ID:"}
          </p>
          <div className="bg-primary/10 rounded-xl p-4 mb-6">
            <p className="font-mono font-bold text-2xl text-primary">{success}</p>
          </div>
          <p className="text-muted-foreground text-sm mb-6">
            {lang === "te"
              ? "దయచేసి ఈ ID ని ట్రాకింగ్ కోసం సేవ్ చేయండి. 3 రోజులలో చర్య తీసుకోకపోతే కేసు ఆటోమేటిక్‌గా ఎస్కలేట్ అవుతుంది."
              : "Save this ID for tracking. If no action is taken within 3 days, the case will auto-escalate."}
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate(`/track-case?id=${success}`)}>
              {t("trackCase")}
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              {t("home")}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm transition">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {t("fileComplaint")}
            </CardTitle>
            <CardDescription>
              {lang === "te"
                ? "మీ ఫిర్యాదు వివరాలను నింపండి. 5 పైలట్ జిల్లాలు: విశాఖపట్నం, విజయవాడ, గుంటూరు, నెల్లూరు, తిరుపతి"
                : "Fill in complaint details. Pilot districts: Visakhapatnam, Vijayawada, Guntur, Nellore, Tirupati"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>{t("name")} *</Label>
                <Input value={form.complainant_name} onChange={(e) => updateField("complainant_name", e.target.value)} />
              </div>
              <div>
                <Label>{t("phone")} *</Label>
                <Input placeholder="+91" value={form.complainant_phone} onChange={(e) => updateField("complainant_phone", e.target.value)} />
              </div>
            </div>

            <div>
              <Label>{t("email")}</Label>
              <Input type="email" value={form.complainant_email} onChange={(e) => updateField("complainant_email", e.target.value)} />
            </div>

            <div>
              <Label>{t("category")} *</Label>
              <Select value={form.category} onValueChange={(v) => updateField("category", v)}>
                <SelectTrigger><SelectValue placeholder={lang === "te" ? "వర్గాన్ని ఎంచుకోండి" : "Select category"} /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {lang === "te" ? cat.labelTe : cat.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t("complaintTitle")} *</Label>
              <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} />
            </div>

            <div>
              <Label>{t("complaintDescription")} *</Label>
              <Textarea rows={4} value={form.description} onChange={(e) => updateField("description", e.target.value)} />
            </div>

            <div>
              <Label>{t("location")} *</Label>
              <Input placeholder="Street/Area/Landmark" value={form.location} onChange={(e) => updateField("location", e.target.value)} />
            </div>

            {/* District → Mandal → Station cascade */}
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <Label>{t("district")} *</Label>
                <Select value={form.district} onValueChange={handleDistrictChange}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select District" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(PILOT_DISTRICT_DATA).map(d => (
                      <SelectItem key={d} value={d}>{d === "Krishna" ? "Vijayawada (Krishna)" : d === "Chittoor" ? "Tirupati (Chittoor)" : d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mandal *</Label>
                <Select value={form.mandal} onValueChange={handleMandalChange} disabled={!form.district}>
                  <SelectTrigger className="h-9"><SelectValue placeholder={form.district ? "Select Mandal" : "Select District first"} /></SelectTrigger>
                  <SelectContent>
                    {currentMandals.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Police Station *</Label>
                <Select value={form.police_station} onValueChange={(v) => updateField("police_station", v)} disabled={!form.mandal}>
                  <SelectTrigger className="h-9"><SelectValue placeholder={form.mandal ? "Select Station" : "Select Mandal first"} /></SelectTrigger>
                  <SelectContent>
                    {currentStations.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Proof Upload */}
            <div>
              <Label>{t("uploadProof")}</Label>
              <div className="mt-2 border-2 border-dashed border-border rounded-xl p-6 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  {lang === "te" ? "ఫోటోలు, వీడియోలు, డాక్యుమెంట్లు" : "Photos, Videos, Documents"}
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="proof-upload"
                />
                <Button variant="outline" size="sm" asChild>
                  <label htmlFor="proof-upload" className="cursor-pointer">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {lang === "te" ? "ఫైల్‌లు ఎంచుకోండి" : "Choose Files"}
                  </label>
                </Button>
              </div>

              {/* Evidence Previews */}
              {proofFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <AnimatePresence>
                    {proofFiles.map((file, i) => (
                      <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        className="relative group rounded-lg border border-border bg-muted/30 overflow-hidden flex flex-col items-center justify-center aspect-square p-2">
                        <button onClick={() => removeProof(i)} type="button"
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center z-10 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                        {file.type.startsWith("image/") ? (
                          <img src={file.url} alt="Proof" className="w-full h-full object-cover rounded-md" />
                        ) : (
                          <div className="flex flex-col items-center text-muted-foreground">
                            <FileText className="w-8 h-8 mb-1" />
                            <span className="text-[10px] text-center truncate w-full px-1">{file.name}</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <Button onClick={handleSubmit} disabled={loading} className="w-full h-12 text-base">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? (lang === "te" ? "సమర్పిస్తోంది..." : "Submitting...") : t("submit")}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}