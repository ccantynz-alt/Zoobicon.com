"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, Wifi, Circle } from "lucide-react";

interface SupportAvatarProps {
  isSpeaking: boolean;
  size?: "sm" | "lg";
}

// Swap this URL for any photo you prefer — just keep ?w=400&h=400&fit=crop&crop=face
const ZOES_PHOTO =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face&auto=format&q=80";

export default function SupportAvatar({ isSpeaking, size = "lg" }: SupportAvatarProps) {
  const [ripple, setRipple] = useState(0);

  // Ripple pulse when speaking
  useEffect(() => {
    if (!isSpeaking) return;
    const id = setInterval(() => setRipple((r) => r + 1), 1200);
    return () => clearInterval(id);
  }, [isSpeaking]);

  if (size === "sm") {
    return (
      <div className="relative w-10 h-10 flex-shrink-0">
        {/* Speaking ring */}
        {isSpeaking && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-emerald-400/60"
            animate={{ scale: [1, 1.18, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <div
          className="w-10 h-10 rounded-xl overflow-hidden border border-white/10"
          style={{ boxShadow: isSpeaking ? "0 0 12px rgba(52,211,153,0.35)" : undefined }}
        >
          <img
            src={ZOES_PHOTO}
            alt="Zoe"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
        {isSpeaking && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-dark-400">
            <motion.div
              className="w-full h-full rounded-full bg-emerald-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-[280px]">
      {/* Ambient glow behind card */}
      <div
        className="absolute inset-0 rounded-2xl blur-2xl transition-all duration-700"
        style={{
          background: isSpeaking
            ? "radial-gradient(ellipse at 50% 60%, rgba(16,185,129,0.18) 0%, rgba(99,102,241,0.10) 60%, transparent 100%)"
            : "radial-gradient(ellipse at 50% 60%, rgba(99,102,241,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-b from-dark-200/90 to-dark-300/90 backdrop-blur-xl overflow-hidden shadow-2xl">
        {/* Top webcam bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-dark-400/60">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full bg-emerald-400"
              animate={{ opacity: isSpeaking ? [1, 0.5, 1] : 1 }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <span className="text-[10px] text-white/50 font-semibold tracking-widest">LIVE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-white/50" />
            <span className="text-[10px] text-white/50 font-mono">HD</span>
          </div>
          <div className="flex gap-1">
            {["bg-red-500/40", "bg-amber-500/40", "bg-emerald-500/40"].map((c) => (
              <div key={c} className={`w-2 h-2 rounded-full ${c}`} />
            ))}
          </div>
        </div>

        {/* Photo area */}
        <div className="relative flex items-center justify-center py-8 px-6 overflow-hidden">
          {/* Soft bokeh background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-950/25 via-dark-300/50 to-indigo-950/30" />
            <div className="absolute top-0 right-0 w-40 h-full bg-gradient-to-l from-amber-800/10 to-transparent" />
            {/* Soft bokeh blobs */}
            <div className="absolute top-6 left-6 w-16 h-16 rounded-full bg-amber-600/8 blur-xl" />
            <div className="absolute bottom-8 right-8 w-20 h-20 rounded-full bg-indigo-600/8 blur-xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-brand-500/5 blur-2xl" />
          </div>

          {/* Photo with animated ring */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Outer speaking ripple */}
            <AnimatePresence>
              {isSpeaking && (
                <motion.div
                  key={ripple}
                  className="absolute inset-0 rounded-full border-2 border-emerald-400/40"
                  style={{ width: 148, height: 148, top: "50%", left: "50%", x: "-50%", y: "-50%" }}
                  initial={{ scale: 0.9, opacity: 0.8 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1.2, ease: "easeOut" as const }}
                />
              )}
            </AnimatePresence>

            {/* Speaking ring glow */}
            <motion.div
              className="absolute rounded-full"
              style={{ width: 140, height: 140, top: "50%", left: "50%", x: "-50%", y: "-50%" }}
              animate={{
                boxShadow: isSpeaking
                  ? [
                      "0 0 0 3px rgba(52,211,153,0.5), 0 0 24px rgba(52,211,153,0.25)",
                      "0 0 0 5px rgba(52,211,153,0.7), 0 0 40px rgba(52,211,153,0.35)",
                      "0 0 0 3px rgba(52,211,153,0.5), 0 0 24px rgba(52,211,153,0.25)",
                    ]
                  : "0 0 0 2px rgba(255,255,255,0.08), 0 0 0px rgba(52,211,153,0)",
              }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Photo circle */}
            <motion.div
              className="relative rounded-full overflow-hidden"
              style={{ width: 136, height: 136 }}
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <img
                src={ZOES_PHOTO}
                alt="Zoe — Zoobicon AI Support"
                className="w-full h-full object-cover object-top"
                draggable={false}
                style={{ filter: "brightness(1.05) saturate(1.08)" }}
              />
              {/* Subtle warm overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-amber-900/10 to-transparent pointer-events-none" />
            </motion.div>

            {/* Name tag below photo */}
            <motion.div
              className="mt-4 px-3 py-1.5 rounded-full bg-dark-400/80 border border-white/[0.08] backdrop-blur-sm"
              animate={{ opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${isSpeaking ? "bg-emerald-400" : "bg-emerald-500/50"}`} />
                <span className="text-xs font-semibold text-white/70">Zoe</span>
                <span className="text-[10px] text-white/50">AI Support</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom nameplate */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.06] bg-dark-400/40">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500/30 to-accent-purple/30 border border-brand-500/20 flex items-center justify-center">
              <Headphones className="w-3 h-3 text-brand-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white/80">Zoe</div>
              <div className="text-[9px] text-white/50">Zoobicon AI Support</div>
            </div>
          </div>

          {/* Speaking waveform */}
          <div className="flex items-center gap-1.5">
            {isSpeaking ? (
              <div className="flex items-end gap-0.5 h-4">
                {[0.5, 1, 0.7, 1.2, 0.6, 1, 0.4].map((delay, i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 bg-emerald-400 rounded-full"
                    animate={{ height: [3, 12 * delay, 3] }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.08,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-end gap-0.5 h-4">
                {[3, 3, 3, 3, 3, 3, 3].map((h, i) => (
                  <div key={i} className="w-0.5 rounded-full bg-white/10" style={{ height: h }} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monitor stand */}
      <div className="flex justify-center mt-0">
        <div className="w-20 h-3 bg-gradient-to-b from-dark-200 to-dark-300 rounded-b-lg border-x border-b border-white/[0.04]" />
      </div>
      <div className="flex justify-center -mt-0.5">
        <div className="w-32 h-2 bg-dark-300 rounded-full border border-white/[0.04]" />
      </div>
    </div>
  );
}
