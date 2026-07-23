import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { QrCode, Camera, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

/**
 * QR/Document Scanner component for officer verification
 * Opens a dialog with either camera scan or manual ID entry
 */
export default function QRScanner({ onResult, buttonLabel = "Scan / Verify", variant = "outline" }) {
  const [open, setOpen] = useState(false);
  const [manualId, setManualId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const verifyId = async (id) => {
    const trimmed = id?.trim();
    if (!trimmed) { toast.error("Enter a Case ID or Badge Number"); return; }
    setLoading(true);
    setResult(null);
    try {
      // Try case ID first
      const { data: cases } = await supabase
        .from("complaints")
        .select("*")
        .or(`case_id.eq.${trimmed},complaint_number.eq.${trimmed}`)
        .limit(1);
        
      if (cases && cases.length > 0) {
        const c = cases[0];
        setResult({
          type: "case",
          valid: true,
          title: `Case: ${c.case_id || c.complaint_number}`,
          info: `${c.title} — ${c.status?.replace("_"," ")}`,
          data: c,
        });
        onResult?.(c);
        setLoading(false);
        return;
      }
      // Try attendance/badge
      const { data: att } = await supabase
        .from("attendances")
        .select("*")
        .eq("officer_email", trimmed)
        .order("created_at", { ascending: false })
        .limit(1);
        
      if (att && att.length > 0) {
        const a = att[0];
        setResult({
          type: "officer",
          valid: true,
          title: `Officer: ${a.officer_name}`,
          info: `${a.station} • ${a.district} • Last marked: ${new Date(a.marked_at || a.created_at).toLocaleString()}`,
          data: a,
        });
        onResult?.(a);
        setLoading(false);
        return;
      }
      setResult({ type: "unknown", valid: false, title: "Not Found", info: `No record found for: ${trimmed}` });
    } catch (err) {
      console.error(err);
      setResult({ type: "error", valid: false, title: "Error", info: "Verification failed. Try again." });
    }
    setLoading(false);
  };

  return (
    <>
      <Button variant={variant} size="sm" onClick={() => setOpen(true)} className="gap-2">
        <QrCode className="w-4 h-4" /> {buttonLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" /> ID Verification Scanner
            </DialogTitle>
          </DialogHeader>

          {/* Camera hint */}
          <div className="bg-muted rounded-xl p-6 text-center mb-3">
            <Camera className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Point camera at QR code<br />or enter ID manually below</p>
          </div>

          {/* Manual entry */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter Case ID / Badge No / Email"
              value={manualId}
              onChange={e => setManualId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && verifyId(manualId)}
              className="font-mono text-sm"
            />
            <Button onClick={() => verifyId(manualId)} disabled={loading} className="shrink-0">
              {loading ? "..." : "Verify"}
            </Button>
          </div>

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl p-4 border-2 mt-1 ${result.valid ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
                <div className="flex items-center gap-2 mb-1">
                  {result.valid
                    ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                    : <AlertTriangle className="w-5 h-5 text-red-600" />}
                  <p className={`font-semibold text-sm ${result.valid ? "text-green-800" : "text-red-800"}`}>{result.title}</p>
                </div>
                <p className={`text-xs ${result.valid ? "text-green-700" : "text-red-700"}`}>{result.info}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}