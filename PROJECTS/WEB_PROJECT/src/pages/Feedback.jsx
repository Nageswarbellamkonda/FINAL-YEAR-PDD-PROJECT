import { useState, useEffect } from "react";
import { Star, Send, CheckCircle2, ArrowLeft, MessageSquare, ThumbsUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import moment from "moment";

const features = [
  "Complaint Filing", "Case Tracking", "Women Safety", "AI Chatbot",
  "Police Departments Info", "Legal Documents", "Overall Experience",
];

const starLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
const starColors = ["", "text-red-500", "text-orange-500", "text-yellow-500", "text-lime-500", "text-green-500"];

export default function Feedback() {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [selectedFeature, setSelectedFeature] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);

  useEffect(() => { loadFeedbacks(); }, []);

  const loadFeedbacks = async () => {
    const { data } = await supabase.from('feedback').select('*').eq('is_public', true).order('created_at', { ascending: false }).limit(50);
    setFeedbacks(data || []);
    setLoadingFeedbacks(false);
  };

  const handleSubmit = async () => {
    if (!rating || !message.trim()) {
      toast.error("Please provide a rating and feedback message");
      return;
    }
    setLoading(true);
    await supabase.from('feedback').insert([{
      name: name.trim() || "Anonymous",
      rating,
      feature: selectedFeature || "General",
      message: message.trim(),
      is_public: true,
    }]);
    setLoading(false);
    setSubmitted(true);
    toast.success("Thank you for your feedback!");
    loadFeedbacks();
  };

  const avgRating = feedbacks.length > 0 ? (feedbacks.reduce((a, f) => a + (f.rating || 0), 0) / feedbacks.length).toFixed(1) : "0.0";

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm transition">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Submit Form */}
      {!submitted ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> Rate Your Experience
              </CardTitle>
              <p className="text-sm text-muted-foreground">Help us improve NYAYA MITRA — Your feedback matters!</p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Star Rating */}
              <div>
                <Label className="mb-2 block">Overall Rating *</Label>
                <div className="flex gap-2 items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)} onClick={() => setRating(star)} className="transition-transform hover:scale-110">
                      <Star className={`w-9 h-9 transition-colors ${star <= (hover || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                    </button>
                  ))}
                  {(hover || rating) > 0 && (
                    <span className={`ml-2 text-sm font-semibold ${starColors[hover || rating]}`}>{starLabels[hover || rating]}</span>
                  )}
                </div>
              </div>

              {/* Feature */}
              <div>
                <Label className="mb-2 block">Which feature are you rating?</Label>
                <div className="flex flex-wrap gap-2">
                  {features.map((f) => (
                    <button key={f} onClick={() => setSelectedFeature(selectedFeature === f ? "" : f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${selectedFeature === f ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <Label>Your Name (optional)</Label>
                <Input placeholder="Anonymous" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              </div>

              {/* Message */}
              <div>
                <Label>Your Feedback *</Label>
                <Textarea placeholder="Tell us what you liked, what can be improved, or any issues you faced..." value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="mt-1" />
              </div>

              <Button onClick={handleSubmit} disabled={loading} className="w-full gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {loading ? "Submitting..." : "Submit Feedback"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="text-center py-10 mb-8">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="font-heading font-bold text-2xl mb-2">Thank You!</h2>
          <p className="text-muted-foreground mb-4">Your feedback helps us improve NYAYA MITRA for all citizens of Andhra Pradesh.</p>
          <Button onClick={() => setSubmitted(false)} variant="outline" className="mr-2">Submit Another</Button>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
        </motion.div>
      )}

      {/* Public Feedback Board */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-primary" /> Community Feedback Board
          </h2>
          {feedbacks.length > 0 && (
            <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1.5">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-bold text-sm">{avgRating}</span>
              <span className="text-xs text-muted-foreground">({feedbacks.length} reviews)</span>
            </div>
          )}
        </div>

        {loadingFeedbacks ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No feedback yet. Be the first to rate!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedbacks.map((f, i) => (
              <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-bold text-sm">{(f.name || "A")[0].toUpperCase()}</span>
                          </div>
                          <span className="font-semibold text-sm">{f.name || "Anonymous"}</span>
                          {f.feature && f.feature !== "General" && (
                            <span className="px-2 py-0.5 bg-accent text-accent-foreground rounded-full text-[10px] font-medium">{f.feature}</span>
                          )}
                        </div>
                        <p className="text-sm text-foreground leading-relaxed ml-10">{f.message}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= (f.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{moment(f.created_at || f.created_date).fromNow()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}