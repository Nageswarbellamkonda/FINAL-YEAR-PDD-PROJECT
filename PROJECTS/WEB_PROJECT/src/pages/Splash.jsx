import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

const APP_LOGO = import.meta.env.BASE_URL + "logo.png";

export default function Splash({ onComplete }) {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min((elapsed / 20000) * 100, 100));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(() => setPhase(3), 2200);
    const t4 = setTimeout(() => onComplete(), 20000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-[#0f172a] via-[#1e3a8a] to-[#0f172a] flex flex-col items-center justify-center overflow-hidden">
      {/* Dynamic Moving Background (Video-like) */}
      <motion.div
        animate={{ 
          backgroundPosition: ["0% 0%", "100% 100%", "0% 100%", "100% 0%"],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 opacity-30"
        style={{ 
          backgroundImage: "radial-gradient(circle at 20% 30%, rgba(56, 189, 248, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.4) 0%, transparent 50%)", 
          backgroundSize: "200% 200%" 
        }}
      />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-20" />
      
      {/* Moving Vertical Lines / Data Streams */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-[2px] bg-gradient-to-b from-transparent via-sky-400/40 to-transparent"
          style={{ left: `${(i + 1) * 8}%`, top: "-100%", bottom: "-100%" }}
          animate={{ y: ["-50%", "50%"] }}
          transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, ease: "linear", delay: Math.random() * 2 }}
        />
      ))}

      {/* Elegant Glowing Aura */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: [0.8, 1.2, 0.9], opacity: [0, 0.5, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[90px]"
      />

      {/* Logo Container */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: phase >= 0 ? 1 : 0.9, opacity: phase >= 0 ? 1 : 0, y: phase >= 0 ? 0 : 30 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="relative p-2 rounded-full bg-white/5 border border-white/10 shadow-2xl backdrop-blur-sm">
          <img src={APP_LOGO} alt="Govt Logo" className="w-36 h-36 rounded-full bg-white object-contain border-4 border-white shadow-inner" />
          
          {/* Subtle Outer Ring */}
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 rounded-full border border-sky-300/30 border-t-sky-300/80"
          />
        </div>
      </motion.div>

      {/* App Name */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : 15 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="text-center mt-12 z-10"
      >
        <h1 className="text-white font-serif font-bold text-5xl tracking-[0.1em] drop-shadow-lg mb-2">
          NYAYA MITRA
        </h1>
        <div className="flex items-center justify-center gap-4">
          <div className="h-[1px] w-12 bg-white/40" />
          <p className="text-sky-200 font-medium text-xl tracking-widest">
            న్యాయ మిత్ర
          </p>
          <div className="h-[1px] w-12 bg-white/40" />
        </div>
      </motion.div>

      {/* Tagline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 2 ? 1 : 0 }}
        transition={{ duration: 1 }}
        className="mt-8 z-10"
      >
        <p className="text-white/70 text-sm tracking-[0.25em] uppercase font-medium">
          Official Justice & Safety Portal
        </p>
      </motion.div>

      {/* Elegant Progress Line */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 2 ? 1 : 0 }}
        className="absolute bottom-32 z-10 w-64"
      >
        <div className="w-full h-[2px] bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-400 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-center mt-2">
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Initializing System</span>
        </div>
      </motion.div>

      {/* Developer Credit */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: phase >= 3 ? 1 : 0, y: phase >= 3 ? 0 : 20 }}
        transition={{ duration: 1.2 }}
        className="absolute bottom-8 z-10 text-center"
      >
        <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">
          Developed by
        </p>
        <p className="text-white text-base font-bold tracking-[0.15em] drop-shadow-md">
          NAGESWAR BELLAMKONDA
        </p>
      </motion.div>

    </div>
  );
}