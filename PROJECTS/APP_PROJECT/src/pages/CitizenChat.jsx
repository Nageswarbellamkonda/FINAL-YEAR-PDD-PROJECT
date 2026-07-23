import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from "../lib/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, MessageSquare, ArrowLeft, Shield, User, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import moment from "moment";

// Entity: CitizenChat
// Fields: case_id, sender_email, sender_name, sender_role (citizen/police), message, read (boolean)

export default function CitizenChat() {
  const { lang } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [caseId, setCaseId] = useState("");
  const [activeCase, setActiveCase] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [searching, setSearching] = useState(false);
  const scrollRef = useRef(null);

  const { user: authUser, profile } = useAuth();

  useEffect(() => {
    // populate local user state from AuthContext
    setUser(profile ?? authUser ?? null);
    setLoading(false);
  }, [authUser, profile]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Real-time subscribe
  useEffect(() => {
    if (!activeCase) return;
    loadMessages();
    const channel = supabase.channel(`citizen-chat-${activeCase.complaint_number}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'case_messages', filter: `complaint_id=eq.${activeCase.id}` }, () => {
        loadMessages();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeCase]);

  const loadMessages = async () => {
    if (!activeCase) return;
    const { data: msgs } = await supabase.from('case_messages')
      .select('*, sender:user_profiles(id, email, full_name, role)')
      .eq('complaint_id', activeCase.id)
      .order('created_at', { ascending: true })
      .limit(100);
    setMessages(msgs || []);
  };

  const searchCase = async () => {
    if (!caseId.trim()) return;
    setSearching(true);
    const cleanId = caseId.replace(/\s+/g, '').toUpperCase();
    
    let active = null;
    try {
      const { data: results } = await supabase.from('complaints').select('*').eq('complaint_number', cleanId);
      active = results?.[0] || null;
    } catch (err) {
      console.error(err);
    }
    if (!active) {
      toast.error("Case ID not found in database.");
    } else {
      setActiveCase(active);
    }
    setSearching(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeCase || sending || !user?.id) return;
    setSending(true);
    await supabase.from('case_messages').insert([{
      complaint_id: activeCase.id,
      sender_id: user.id,
      message: input.trim(),
    }]);
    setInput("");
    setSending(false);
    loadMessages();
  };

  const utype = user?.user_type || user?.role || "citizen";
  const isPolice = user && !["citizen", "user", "lawyer"].includes(utype);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm"><Link to={isPolice ? "/officer-dashboard" : "/dashboard"}><ArrowLeft className="w-4 h-4 mr-1" />Back</Link></Button>
        <div className="flex-1">
          <h1 className="font-heading font-bold text-xl flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            {lang === "te" ? "పౌర-పోలీసు చాట్" : "Citizen-Police Chat"}
          </h1>
          <p className="text-muted-foreground text-xs">
            {lang === "te" ? "మీ కేసు ID తో నేరుగా పోలీసులతో మాట్లాడండి" : "Communicate directly with your assigned officer using Case ID"}
          </p>
        </div>
      </div>

      {/* Case search */}
      {!activeCase && (
        <Card className="mb-5">
          <CardHeader>
            <CardTitle className="text-base">
              {lang === "te" ? "కేసు నంబర్ నమోదు చేయండి" : "Enter Your Case ID"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="e.g. NM-ABC123"
                value={caseId}
                onChange={e => setCaseId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && searchCase()}
                className="font-mono"
              />
              <Button onClick={searchCase} disabled={searching} className="gap-2">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {lang === "te" ? "వెతకండి" : "Find Case"}
              </Button>
            </div>
            {isPolice && (
              <p className="text-xs text-muted-foreground mt-3">
                As an officer, enter any case ID assigned to you or your station.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active chat */}
      {activeCase && (
        <>
          {/* Case header */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-xs text-primary font-bold">{activeCase.complaint_number}</p>
              <p className="font-semibold text-sm truncate">{activeCase.title}</p>
              <p className="text-xs text-muted-foreground">{activeCase.complainant_name || "Unknown"} • {activeCase.district || "Unknown"}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className={`text-[10px] ${activeCase.status === "resolved" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`} variant="outline">
                {activeCase.status?.replace(/_/g, " ")}
              </Badge>
              <button onClick={() => { setActiveCase(null); setMessages([]); setCaseId(""); }}
                className="text-[10px] text-muted-foreground hover:text-destructive transition">
                Change case
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="h-[360px] overflow-y-auto border border-border rounded-xl bg-slate-50/50 p-3 space-y-3 mb-3">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  {lang === "te" ? "ఇంకా సందేశాలు లేవు. మొదట మాట్లాడండి!" : "No messages yet. Start the conversation!"}
                </p>
              </div>
            )}
            <AnimatePresence>
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === user?.id;
                const senderRole = msg.sender?.role || "citizen";
                const isPoliceMsg = !["citizen", "user", "lawyer"].includes(senderRole);
                const senderName = msg.sender?.full_name || "User";
                return (
                  <motion.div key={msg.id || i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                    {!isMe && (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isPoliceMsg ? "bg-primary" : "bg-muted"}`}>
                        {isPoliceMsg ? <Shield className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                    )}
                    <div className={`max-w-[78%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      <p className={`text-[10px] mb-0.5 ${isMe ? "text-right" : ""} text-muted-foreground`}>
                        {isMe ? "You" : senderName}
                        {isPoliceMsg && !isMe && <span className="ml-1 text-primary font-semibold">• Officer</span>}
                      </p>
                      <div className={`rounded-2xl px-3.5 py-2 text-sm ${
                        isMe
                          ? "bg-primary text-white rounded-br-sm"
                          : isPoliceMsg
                          ? "bg-blue-50 border border-blue-200 text-blue-900 rounded-bl-sm"
                          : "bg-white border border-border rounded-bl-sm"
                      }`}>
                        {msg.message}
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {moment(msg.created_at || msg.created_date).format("hh:mm A")}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Send message */}
          <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={lang === "te" ? "సందేశం టైప్ చేయండి..." : "Type your message..."}
              className="flex-1"
              disabled={sending}
            />
            <Button type="submit" disabled={!input.trim() || sending} className="gap-2">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {lang === "te" ? "పంపు" : "Send"}
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            🔒 {lang === "te" ? "సందేశాలు ఎంక్రిప్ట్ చేయబడ్డాయి" : "Messages are encrypted and visible only to you and the assigned officer"}
          </p>
        </>
      )}

      {/* Info */}
      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        {[
          { icon: "🔒", title: "Secure & Private", desc: "Messages visible only to you and your assigned officer" },
          { icon: "⏱️", title: "24/7 Available", desc: "Officers respond within duty hours. Emergencies: call 100" },
        ].map((item, i) => (
          <div key={i} className="bg-muted/50 rounded-xl p-3 flex items-start gap-2.5">
            <span className="text-xl">{item.icon}</span>
            <div>
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}