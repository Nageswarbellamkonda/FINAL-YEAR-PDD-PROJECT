import { useState, useEffect } from "react";
import { invokeLLM } from "@/lib/ai";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Zap, Shield, Users, TrendingUp, Loader2, ArrowLeft, Brain, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const AP_DISTRICTS = ["Visakhapatnam","Guntur","Krishna","East Godavari","West Godavari","Kurnool","Nellore","Prakasam","Chittoor","YSR Kadapa","Anantapur","Srikakulam","Vizianagaram"];

export default function PoliceAIAdvisor() {
  const [district, setDistrict] = useState("Visakhapatnam");
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState(null);
  const [user, setUser] = useState(null);
  const [aiContext, setAiContext] = useState(null);

  const { user: authUser, profile } = useAuth();

  useRealtimeSync(['complaints'], () => {
    fetchContext();
  });

  useEffect(() => {
    fetchContext();
  }, [authUser, profile, district]);

  const fetchContext = async () => {
    const me = profile ?? authUser ?? null;
    setUser(me);
    
    try {
      const { data, error } = await supabase.rpc('get_analytics_page_data', { days: 30, p_district: district });
      if (!error && data) {
        setAiContext(data);
      }
    } catch (err) {
      console.error("Error loading advisor context:", err);
    }
  };

  const generate = async () => {
    setLoading(true);
    setAdvice(null);

    const totalCases = aiContext?.stats?.total || 0;
    const priorityCounts = {
      critical: aiContext?.stats?.critical || 0,
      pending: aiContext?.stats?.pending || 0
    };
    const topCategories = (aiContext?.categoryData || []).slice(0, 5).map(c => [c.name, c.value]);

    const highestCategory = topCategories[0]?.[0] || "general crime";
    const secondCategory = topCategories[1]?.[0] || "cyber fraud";
    const hasCyber = topCategories.some(([c]) => c.includes("cyber"));
    const hasNarcotics = topCategories.some(([c]) => c.includes("narcotics"));
    const hasWomen = topCategories.some(([c]) => c.includes("women") || c.includes("assault"));

    const payload = {
      district,
      total_cases: totalCases,
      priorityCounts,
      topCategories,
      hasCyber,
      hasNarcotics,
      hasWomen
    };

    const prompt = `Generate a Police Strategic Advisory for ${district}. Based on this data: ${JSON.stringify(payload)}.
    Format with the following sections clearly labeled with numbers:
    1. PRIORITY CASES
    2. OFFICER ALLOCATION RECOMMENDATIONS
    3. PATROL ZONES
    4. RESOURCE NEEDS
    5. RISK FORECAST
    Output as plain text that looks like a terminal printout.`;

    try {
      const response = await invokeLLM(prompt, "You are a senior AI strategic advisor for the AP Police Department.");
      setAdvice(response);
    } catch (err) {
      console.error(err);
      toast.error("AI Generation failed. Using fallback.");
      // Fallback
      const advisory = `AI POLICE ADVISORY — ${district.toUpperCase()}
Generated: ${new Date().toLocaleString('en-IN')}

1. PRIORITY CASES (Immediate Attention Required):
   a) ${highestCategory.toUpperCase()} — ${topCategories[0]?.[1] || 0} open cases. Escalate any case pending over 72 hours.
   b) ${secondCategory.toUpperCase()} — Assign dedicated investigating officer if case count > 5.
   c) Critical priority cases (${priorityCounts.critical}) — Require SP-level review within 24 hours.

2. OFFICER ALLOCATION RECOMMENDATIONS:
   • Currently ${priorityCounts.pending} cases are pending in ${district}. Recommend allocating at least ${Math.max(2, Math.ceil(priorityCounts.pending / 5))} additional officers for case clearance.
   • Officers with high active case loads should be relieved of court duty this week.
   • ${hasNarcotics ? "Activate NDPS team for narcotics hotspot surveillance immediately." : "Maintain standard patrol allocation."}

3. PATROL ZONES (Increased Surveillance Today):
   • Bus stands, railway stations, and market areas (high footfall, high theft risk).
   • ${hasWomen ? "Women's college areas and public transit stops — deploy SHE Teams." : "School & college zones — standard patrol."}
   • ${hasCyber ? "Cyber cafes, ATM clusters — alert for skimming devices." : "ATM zones — routine security checks."}

4. RESOURCE NEEDS:
   • CCTV monitoring upgrade recommended for high-footfall zones in ${district}.
   • Mobile patrol vehicles: recommend 2 additional beat vehicles on night duty.
   • Cyber crime: forensic toolkit deployment if not already active.

5. RISK FORECAST (Next 24–48 Hours):
   Based on ${districtData.length} case records for ${district}:
   • ${priorityCounts.critical > 2 ? "⚠️ HIGH ALERT — Multiple critical cases. Expect media attention and SP oversight." : "✅ NORMAL — Maintain standard readiness."}
   • Weekend/festival periods: Increase patrol strength by 30% as preventive measure.
   • Monitor social media for any organized crime or protest alerts in ${district}.

NYAYA MITRA AI Advisory System • AP Police Smart Policing Platform`;
      setAdvice(advisory);
    }
    setLoading(false);
    toast.success("AI advisory generated");
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm"><Link to="/officer-dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link></Button>
        <div className="flex-1">
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" /> Police Decision AI
          </h1>
          <p className="text-muted-foreground text-sm">AI-powered case prioritization & officer allocation recommendations</p>
        </div>
        <Select value={district} onValueChange={setDistrict}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>{AP_DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Situation Overview */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Critical Cases Open", value: priorityCounts.critical, color: "text-red-600 bg-red-50", icon: AlertTriangle },
          { label: "High Priority Open", value: priorityCounts.high, color: "text-orange-600 bg-orange-50", icon: TrendingUp },
          { label: "Total Pending", value: priorityCounts.pending, color: "text-yellow-600 bg-yellow-50", icon: Shield },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card className="hover:shadow-md transition">
              <CardContent className={`p-4 text-center ${s.color}`}>
                <s.icon className="w-5 h-5 mx-auto mb-1" />
                <p className="font-bold text-2xl">{s.value}</p>
                <p className="text-xs font-medium opacity-80">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Top Crimes */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Crime Distribution — {district}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {topCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">No data for this district yet</p>
            ) : topCategories.map(([cat, count], i) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-4">{i+1}.</span>
                <span className="text-sm flex-1 capitalize">{cat.replace(/_/g, " ")}</span>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(count / (topCategories[0]?.[1] || 1)) * 100}%` }} />
                </div>
                <Badge variant="outline" className="text-[10px] min-w-8 text-center">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Button onClick={generate} disabled={loading} className="w-full h-12 text-base gap-2 mb-6">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
        {loading ? "AI Analyzing Operational Data..." : "Generate AI Police Advisory"}
      </Button>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-4 mb-4">
          {[0,1,2,3,4].map(i => (
            <motion.div key={i} animate={{ height: [8, 28, 8] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
              className="w-2 bg-primary rounded-full" />
          ))}
          <span className="text-muted-foreground text-sm ml-2">Processing {districtData.length} case records for {district}...</span>
        </div>
      )}

      {/* AI Advisory Output */}
      <AnimatePresence>
        {advice && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  AI Police Advisory — {district}
                  <Badge className="bg-green-600 text-white text-[9px] ml-auto">AI Generated</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">{advice}</div>
                <div className="mt-4 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    NYAYA MITRA AI Advisory • {district} District • {new Date().toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-muted-foreground">Emergency: 100 | Women: 181 | Cyber: 1930</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}