"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, Wifi } from "lucide-react";

interface SupportAvatarProps {
  isSpeaking: boolean;
  size?: "sm" | "lg";
}

export default function SupportAvatar({ isSpeaking, size = "lg" }: SupportAvatarProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthFrame, setMouthFrame] = useState(0);

  // Blinking animation
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };
    const interval = setInterval(() => {
      if (Math.random() > 0.3) blink();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Speaking mouth animation
  useEffect(() => {
    if (!isSpeaking) {
      setMouthFrame(0);
      return;
    }
    const interval = setInterval(() => {
      setMouthFrame((prev) => (prev + 1) % 4);
    }, 120);
    return () => clearInterval(interval);
  }, [isSpeaking]);

  const isLarge = size === "lg";
  const svgSize = isLarge ? 200 : 48;
  const scale = isLarge ? 1 : 0.24;

  return (
    <div className={`relative ${isLarge ? "w-[280px]" : "w-10"}`}>
      {/* Office desk scene - only for large */}
      {isLarge && (
        <div className="relative">
          {/* Monitor/frame */}
          <div className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-b from-dark-200/80 to-dark-300/80 backdrop-blur-xl overflow-hidden shadow-2xl">
            {/* Webcam bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-dark-400/50">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-emerald-500 animate-pulse" : "bg-emerald-500"}`} />
                <span className="text-[10px] text-white/30 font-medium">LIVE</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3 h-3 text-white/20" />
                <span className="text-[10px] text-white/20">HD</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
              </div>
            </div>

            {/* Avatar scene */}
            <div className="relative flex items-center justify-center py-6 px-4">
              {/* Blurred office background */}
              <div className="absolute inset-0 overflow-hidden">
                {/* Warm office lighting */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-950/30 via-dark-300/60 to-dark-400/80" />
                {/* Window light */}
                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-amber-900/15 to-transparent" />
                {/* Bookshelf blur */}
                <div className="absolute top-4 left-4 w-16 h-24 rounded-lg bg-amber-950/20 blur-sm" />
                <div className="absolute top-6 left-6 w-12 h-3 rounded bg-amber-800/15 blur-[2px]" />
                <div className="absolute top-11 left-6 w-12 h-3 rounded bg-amber-800/10 blur-[2px]" />
                <div className="absolute top-16 left-6 w-12 h-3 rounded bg-amber-800/15 blur-[2px]" />
                {/* Plant */}
                <div className="absolute bottom-8 right-6 w-8 h-12 rounded-full bg-emerald-900/15 blur-sm" />
                <div className="absolute bottom-4 right-8 w-4 h-4 rounded bg-amber-900/15 blur-sm" />
                {/* Desk lamp glow */}
                <div className="absolute top-2 right-16 w-20 h-20 rounded-full bg-amber-500/5 blur-xl" />
              </div>

              {/* Character SVG */}
              <div className="relative z-10">
                <svg
                  width={svgSize}
                  height={svgSize * 1.2}
                  viewBox="0 0 200 240"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Shoulders / Top of body */}
                  <ellipse cx="100" cy="225" rx="70" ry="25" fill="#1a1a2e" />
                  <ellipse cx="100" cy="222" rx="65" ry="22" fill="#2a2a4a" />
                  {/* Collar / neckline */}
                  <path d="M75 210 L100 220 L125 210" stroke="#3a3a5a" strokeWidth="1.5" fill="none" />

                  {/* Neck */}
                  <rect x="90" y="185" width="20" height="30" rx="8" fill="#F5D0A9" />
                  <rect x="92" y="185" width="16" height="30" rx="7" fill="#FADDBA" />

                  {/* Head shape */}
                  <ellipse cx="100" cy="120" rx="52" ry="65" fill="#F5D0A9" />
                  <ellipse cx="100" cy="118" rx="50" ry="63" fill="#FADDBA" />

                  {/* Hair - back layer */}
                  <ellipse cx="100" cy="85" rx="55" ry="52" fill="#D4A843" />
                  <ellipse cx="100" cy="82" rx="53" ry="50" fill="#E0B84E" />

                  {/* Hair - top */}
                  <path
                    d="M48 95 Q50 55 100 48 Q150 55 152 95"
                    fill="#E0B84E"
                  />
                  <path
                    d="M50 95 Q52 58 100 50 Q148 58 150 95"
                    fill="#ECC85C"
                  />

                  {/* Hair - side strands left */}
                  <path
                    d="M48 95 Q42 120 44 155 Q46 170 52 175"
                    stroke="#D4A843"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M50 95 Q44 118 46 152 Q48 167 53 172"
                    stroke="#E0B84E"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                  />

                  {/* Hair - side strands right */}
                  <path
                    d="M152 95 Q158 120 156 155 Q154 170 148 175"
                    stroke="#D4A843"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M150 95 Q156 118 154 152 Q152 167 147 172"
                    stroke="#E0B84E"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                  />

                  {/* Hair shine */}
                  <path
                    d="M70 65 Q85 55 105 58"
                    stroke="#F5E08C"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.5"
                  />

                  {/* Ears */}
                  <ellipse cx="50" cy="120" rx="7" ry="10" fill="#F5D0A9" />
                  <ellipse cx="150" cy="120" rx="7" ry="10" fill="#F5D0A9" />

                  {/* Eyebrows */}
                  <path
                    d="M70 98 Q80 93 90 96"
                    stroke="#C09030"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M110 96 Q120 93 130 98"
                    stroke="#C09030"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                  />

                  {/* Eyes */}
                  {isBlinking ? (
                    <>
                      {/* Closed eyes */}
                      <path d="M72 112 Q80 115 88 112" stroke="#4A3520" strokeWidth="2" fill="none" strokeLinecap="round" />
                      <path d="M112 112 Q120 115 128 112" stroke="#4A3520" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </>
                  ) : (
                    <>
                      {/* Eye whites */}
                      <ellipse cx="80" cy="112" rx="10" ry="8" fill="white" />
                      <ellipse cx="120" cy="112" rx="10" ry="8" fill="white" />
                      {/* Iris */}
                      <circle cx="80" cy="112" r="5.5" fill="#4A90D9" />
                      <circle cx="120" cy="112" r="5.5" fill="#4A90D9" />
                      {/* Pupil */}
                      <circle cx="80" cy="112" r="2.8" fill="#1a1a2e" />
                      <circle cx="120" cy="112" r="2.8" fill="#1a1a2e" />
                      {/* Eye shine */}
                      <circle cx="82" cy="110" r="1.8" fill="white" opacity="0.9" />
                      <circle cx="122" cy="110" r="1.8" fill="white" opacity="0.9" />
                      {/* Lower eyelash accent */}
                      <path d="M70 114 Q80 118 90 114" stroke="#4A3520" strokeWidth="0.8" fill="none" opacity="0.3" />
                      <path d="M110 114 Q120 118 130 114" stroke="#4A3520" strokeWidth="0.8" fill="none" opacity="0.3" />
                      {/* Upper lashes */}
                      <path d="M70 107 Q80 104 90 107" stroke="#4A3520" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                      <path d="M110 107 Q120 104 130 107" stroke="#4A3520" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    </>
                  )}

                  {/* Nose */}
                  <path
                    d="M98 125 Q100 130 102 125"
                    stroke="#E0B89A"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                  />

                  {/* Mouth */}
                  {isSpeaking ? (
                    <>
                      {/* Speaking animation */}
                      {mouthFrame === 0 && (
                        <ellipse cx="100" cy="145" rx="8" ry="3" fill="#D4756A" />
                      )}
                      {mouthFrame === 1 && (
                        <ellipse cx="100" cy="145" rx="7" ry="5" fill="#D4756A" />
                      )}
                      {mouthFrame === 2 && (
                        <ellipse cx="100" cy="145" rx="9" ry="4" fill="#D4756A" />
                      )}
                      {mouthFrame === 3 && (
                        <ellipse cx="100" cy="145" rx="6" ry="2.5" fill="#D4756A" />
                      )}
                      {/* Teeth hint */}
                      {(mouthFrame === 1 || mouthFrame === 2) && (
                        <ellipse cx="100" cy="143" rx="5" ry="2" fill="white" opacity="0.7" />
                      )}
                    </>
                  ) : (
                    <>
                      {/* Smile */}
                      <path
                        d="M88 142 Q100 155 112 142"
                        stroke="#D4756A"
                        strokeWidth="2.5"
                        fill="none"
                        strokeLinecap="round"
                      />
                      {/* Lip color */}
                      <path
                        d="M90 143 Q100 152 110 143"
                        fill="#E88B80"
                        opacity="0.4"
                      />
                    </>
                  )}

                  {/* Blush */}
                  <circle cx="68" cy="132" r="8" fill="#FFB5A7" opacity="0.2" />
                  <circle cx="132" cy="132" r="8" fill="#FFB5A7" opacity="0.2" />

                  {/* Headset */}
                  <path
                    d="M48 105 Q48 70 100 65 Q152 70 152 105"
                    stroke="#3a3a5a"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M48 105 Q48 72 100 67 Q152 72 152 105"
                    stroke="#4a4a6a"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  {/* Left ear cup */}
                  <rect x="40" y="100" width="16" height="24" rx="6" fill="#2a2a4a" stroke="#3a3a5a" strokeWidth="1" />
                  <rect x="42" y="104" width="12" height="16" rx="4" fill="#1a1a2e" />
                  {/* Right ear cup */}
                  <rect x="144" y="100" width="16" height="24" rx="6" fill="#2a2a4a" stroke="#3a3a5a" strokeWidth="1" />
                  <rect x="146" y="104" width="12" height="16" rx="4" fill="#1a1a2e" />
                  {/* Microphone arm */}
                  <path
                    d="M44 118 Q30 130 35 148 Q38 155 45 155"
                    stroke="#3a3a5a"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                  {/* Mic */}
                  <circle cx="45" cy="155" r="5" fill="#2a2a4a" stroke="#3a3a5a" strokeWidth="1" />
                  <circle cx="45" cy="155" r="2.5" fill={isSpeaking ? "#4ADE80" : "#3a3a5a"}>
                    {isSpeaking && (
                      <animate attributeName="opacity" values="1;0.4;1" dur="0.8s" repeatCount="indefinite" />
                    )}
                  </circle>
                </svg>

                {/* Subtle breathing animation */}
                <motion.div
                  className="absolute inset-0"
                  animate={{ y: [0, -1.5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>

            {/* Name plate */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.06] bg-dark-400/30">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500/30 to-accent-purple/30 border border-brand-500/20 flex items-center justify-center">
                  <Headphones className="w-3 h-3 text-brand-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white/80">Zoe</div>
                  <div className="text-[9px] text-white/30">Zoobicon AI Support</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {isSpeaking && (
                  <div className="flex items-center gap-0.5">
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="w-0.5 bg-emerald-500 rounded-full"
                        animate={{ height: [3, 10, 3] }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                )}
                <div className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-emerald-500" : "bg-emerald-500/50"}`} />
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
      )}

      {/* Small inline avatar for chat messages */}
      {!isLarge && (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-900/20 to-brand-500/20 border border-amber-500/15 flex items-center justify-center overflow-hidden relative">
          <svg width="32" height="38" viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Simplified small avatar */}
            <ellipse cx="100" cy="225" rx="70" ry="25" fill="#2a2a4a" />
            <rect x="90" y="185" width="20" height="30" rx="8" fill="#FADDBA" />
            <ellipse cx="100" cy="120" rx="50" ry="63" fill="#FADDBA" />
            <ellipse cx="100" cy="82" rx="53" ry="50" fill="#E0B84E" />
            <path d="M50 95 Q52 58 100 50 Q148 58 150 95" fill="#ECC85C" />
            <path d="M50 95 Q44 118 46 152 Q48 167 53 172" stroke="#E0B84E" strokeWidth="8" fill="none" strokeLinecap="round" />
            <path d="M150 95 Q156 118 154 152 Q152 167 147 172" stroke="#E0B84E" strokeWidth="8" fill="none" strokeLinecap="round" />
            {isBlinking ? (
              <>
                <path d="M72 112 Q80 115 88 112" stroke="#4A3520" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M112 112 Q120 115 128 112" stroke="#4A3520" strokeWidth="3" fill="none" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="80" cy="112" rx="10" ry="8" fill="white" />
                <ellipse cx="120" cy="112" rx="10" ry="8" fill="white" />
                <circle cx="80" cy="112" r="5.5" fill="#4A90D9" />
                <circle cx="120" cy="112" r="5.5" fill="#4A90D9" />
                <circle cx="80" cy="112" r="2.8" fill="#1a1a2e" />
                <circle cx="120" cy="112" r="2.8" fill="#1a1a2e" />
                <circle cx="82" cy="110" r="2" fill="white" opacity="0.9" />
                <circle cx="122" cy="110" r="2" fill="white" opacity="0.9" />
              </>
            )}
            <path d="M88 142 Q100 155 112 142" stroke="#D4756A" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="68" cy="132" r="8" fill="#FFB5A7" opacity="0.25" />
            <circle cx="132" cy="132" r="8" fill="#FFB5A7" opacity="0.25" />
          </svg>
          {isSpeaking && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0">
              <motion.div
                className="h-full w-full bg-emerald-500/30"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
