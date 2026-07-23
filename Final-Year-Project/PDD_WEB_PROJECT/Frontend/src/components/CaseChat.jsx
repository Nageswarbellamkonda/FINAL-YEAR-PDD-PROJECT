import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/lib/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare, Shield, User, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import moment from "moment";

/**
 * CaseChat — embeddable chat widget for any case
 * Props: caseId (string), complainant, assignedOfficer (emails), onClose
 */
export default function CaseChat({ caseId, onClose }) {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const { user: authUser, profile } = useAuth();

  useEffect(() => {
    // Populate local user state from AuthContext (profile preferred)
    setUser(profile ?? authUser ?? null);
  }, [authUser, profile]);

  useEffect(() => {
    if (!caseId) return;
    loadMessages();
    const channel = supabase.channel(`chat-${caseId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'citizen_chats', filter: `case_id=eq.${caseId}` },
        (payload) => loadMessages()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [caseId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const loadMessages = async () => {
    if (!caseId) return;
    const { data: msgs } = await supabase
      .from('citizen_chats')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (msgs) setMessages(msgs);
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || sending || !user) return;
    setSending(true);
    const utype = user?.user_type || user?.role || "citizen";
    const isPolice = !["citizen", "user", "lawyer"].includes(utype);
    await supabase.from('citizen_chats').insert([{
      case_id: caseId,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      sender_role: isPolice ? "police" : "citizen",
      message: input.trim(),
      read: false,
    }]);
    setInput("");
    setSending(false);
  };

  return (
    <div className="flex flex-col border border-border rounded-xl overflow-hidden bg-white shadow-lg" style={{ height: 420 }}>
      {/* Header */}
      <div className="flex items-center justify-between bg-primary px-4 py-2.5">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-semibold">Case Chat — {caseId}</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-muted-foreground text-xs">No messages yet. Start the conversation.</p>
          </div>
        )}
        <AnimatePresence>
          {messages.map((msg, i) => {
            const isMe = msg.sender_email === user?.email;
            const isPoliceMsg = msg.sender_role === "police";
            return (
              <motion.div key={msg.id || i}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                {!isMe && (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isPoliceMsg ? "bg-primary" : "bg-muted"}`}>
                    {isPoliceMsg ? <Shield className="w-3 h-3 text-white" /> : <User className="w-3 h-3 text-muted-foreground" />}
                  </div>
                )}
                <div className={`max-w-[80%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <p className="text-[10px] text-muted-foreground mb-0.5">
                    {isMe ? "You" : msg.sender_name}
                    {isPoliceMsg && !isMe && <span className="ml-1 text-primary font-semibold">• Officer</span>}
                  </p>
                  <div className={`rounded-2xl px-3 py-2 text-xs ${
                    isMe ? "bg-primary text-white rounded-br-sm" :
                    isPoliceMsg ? "bg-blue-50 border border-blue-200 text-blue-900 rounded-bl-sm" :
                    "bg-white border border-border rounded-bl-sm"
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

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2 p-2 border-t border-border bg-white">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          className="h-8 text-xs flex-1"
          disabled={sending}
        />
        <Button type="submit" size="sm" disabled={!input.trim() || sending} className="h-8 px-3">
          {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
        </Button>
      </form>
    </div>
  );
}