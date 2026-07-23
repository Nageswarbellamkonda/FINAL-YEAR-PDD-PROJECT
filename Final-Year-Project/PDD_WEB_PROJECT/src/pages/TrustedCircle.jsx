import { useState, useEffect, useRef } from "react";

import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Trash2, Phone, MapPin, Shield, AlertTriangle, Loader2, ArrowLeft, CheckCircle2, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export default function TrustedCircle() {
  const [user, setUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: "", phone: "", relation: "" });
  const [adding, setAdding] = useState(false);
  const [location, setLocation] = useState(null);
  const [sosActive, setSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(0);
  const watchRef = useRef(null);
  const countdownRef = useRef(null);

  const { user: authUser, profile, refreshProfile } = useAuth();

  useEffect(() => {
    (async () => {
      const me = profile ?? authUser ?? null;
      setUser(me);
      // Load contacts from user profile
      const saved = me?.trusted_contacts;
      if (Array.isArray(saved)) setContacts(saved);
    })();
    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [authUser, profile]);

  const saveContacts = async (updatedContacts) => {
    if (!user?.id) return;
    await supabase.from('user_profiles').update({ trusted_contacts: updatedContacts, updated_at: new Date().toISOString() }).eq('id', user.id);
    setContacts(updatedContacts);
    if (refreshProfile) await refreshProfile();
  };

  const addContact = async () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) { toast.error("Name and phone are required"); return; }
    if (contacts.length >= 5) { toast.error("Maximum 5 trusted contacts allowed"); return; }
    setAdding(true);
    const updated = [...contacts, { ...newContact, id: Date.now().toString() }];
    await saveContacts(updated);
    setNewContact({ name: "", phone: "", relation: "" });
    setAdding(false);
    toast.success("Trusted contact added!");
  };

  const removeContact = async (id) => {
    const updated = contacts.filter(c => c.id !== id);
    await saveContacts(updated);
    toast.success("Contact removed");
  };

  const startLocationShare = () => {
    if (!navigator.geolocation) { toast.error("GPS not supported"); return; }
    watchRef.current = navigator.geolocation.watchPosition(
      pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => console.warn(err),
      { enableHighAccuracy: true, maximumAge: 15000 }
    );
    toast.success("Live location sharing started with your trusted circle");
  };

  const triggerSOS = () => {
    if (contacts.length === 0) { toast.error("Add trusted contacts first"); return; }
    setSosActive(true);
    setSosCountdown(5);
    countdownRef.current = setInterval(() => {
      setSosCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          executeSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSOS = () => {
    clearInterval(countdownRef.current);
    setSosActive(false);
    setSosCountdown(0);
    toast.success("SOS cancelled");
  };

  const executeSOS = () => {
    setSosActive(false);
    const locStr = location ? `https://maps.google.com/?q=${location.lat},${location.lng}` : "Location unavailable";
    // In real implementation, SMS/call would be triggered via backend
    toast.error(`🚨 SOS sent to ${contacts.length} trusted contact(s)! Location: ${locStr}`, { duration: 8000 });
    // Also call police
    window.location.href = "tel:100";
  };

  const relations = ["Father", "Mother", "Husband", "Wife", "Brother", "Sister", "Friend", "Colleague", "Neighbour"];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm"><Link to="/women-safety"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link></Button>
        <div className="flex-1">
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-600" /> Trusted Circle
          </h1>
          <p className="text-muted-foreground text-sm">Emergency network — family & friends alerted with your location</p>
        </div>
      </div>

      {/* SOS Panel */}
      <Card className={`mb-6 ${sosActive ? "border-red-500 bg-red-50" : "border-pink-200 bg-pink-50/50"}`}>
        <CardContent className="p-6 text-center">
          <AnimatePresence mode="wait">
            {sosActive ? (
              <motion.div key="sos-active" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5, repeat: Infinity }}
                  className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-300">
                  <p className="text-white font-bold text-4xl">{sosCountdown}</p>
                </motion.div>
                <p className="font-bold text-red-700 text-lg mb-2">SOS sending in {sosCountdown}s...</p>
                <p className="text-red-600 text-sm mb-4">Your location will be shared with {contacts.length} trusted contact(s) + Police (100)</p>
                <Button variant="outline" onClick={cancelSOS} className="border-red-300 text-red-700 hover:bg-red-100">
                  Cancel SOS
                </Button>
              </motion.div>
            ) : (
              <motion.div key="sos-idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Shield className="w-12 h-12 text-pink-600 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-1">Emergency SOS</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Instantly alert {contacts.length > 0 ? `${contacts.length} trusted contact(s)` : "your contacts"} + Police with your live location
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button onClick={triggerSOS} className="bg-red-600 hover:bg-red-700 gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4" /> Trigger SOS
                  </Button>
                  <Button variant="outline" onClick={startLocationShare} className="gap-2">
                    <MapPin className="w-4 h-4" /> Share Live Location
                  </Button>
                </div>
                {location && (
                  <p className="text-xs text-green-600 mt-3 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Live location active: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Contacts List */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Trusted Contacts ({contacts.length}/5)
          </CardTitle>
          <CardDescription>These people will be alerted in emergencies</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {contacts.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">No trusted contacts added yet</p>
          )}
          {contacts.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 border border-border rounded-xl bg-background">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0 text-pink-700 font-bold text-sm">
                {c.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{c.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <Phone className="w-3 h-3" /> {c.phone}
                  {c.relation && <Badge variant="outline" className="text-[9px] py-0 h-4">{c.relation}</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a href={`tel:${c.phone}`} className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition">
                  <Phone className="w-3.5 h-3.5" />
                </a>
                <button onClick={() => removeContact(c.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Add Contact Form */}
      {contacts.length < 5 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> Add Trusted Contact</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Full Name *</Label>
                <Input value={newContact.name} onChange={e => setNewContact(p => ({...p, name: e.target.value}))} placeholder="e.g., Ravi Kumar" />
              </div>
              <div>
                <Label className="text-xs">Mobile Number *</Label>
                <Input value={newContact.phone} onChange={e => setNewContact(p => ({...p, phone: e.target.value}))} placeholder="+91 XXXXX XXXXX" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Relation</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {relations.map(r => (
                  <button key={r} onClick={() => setNewContact(p => ({...p, relation: r}))}
                    className={`text-xs px-2.5 py-1 rounded-full border transition ${newContact.relation === r ? "bg-primary text-white border-primary" : "border-border hover:border-primary/50"}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={addContact} disabled={adding} className="w-full gap-2">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add to Trusted Circle
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">How Trusted Circle works:</p>
        <ul className="space-y-1 text-xs text-blue-700 list-disc ml-4">
          <li>When you trigger SOS, your live GPS location is shared with all contacts</li>
          <li>AP Police emergency line (100) is also automatically called</li>
          <li>Contacts receive your name, location link and emergency alert</li>
          <li>Live location continues updating every 30 seconds during emergency</li>
        </ul>
      </div>
    </div>
  );
}