"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2 } from "lucide-react";
import {
  VoiceRecognizer,
  isVoiceSupported,
} from "@/lib/voice-recognition";

interface VoiceToBuildButtonProps {
  onTranscript: (text: string) => void;
  size?: "sm" | "md" | "lg";
  placeholder?: string;
  className?: string;
}

const SIZE_MAP = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-20 w-20",
};

const ICON_SIZE = { sm: 18, md: 24, lg: 32 };

export default function VoiceToBuildButton({
  onTranscript,
  size = "md",
  placeholder = "Tap and describe what you want to build",
  className = "",
}: VoiceToBuildButtonProps) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognizerRef = useRef<VoiceRecognizer | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInterimRef = useRef<string>("");

  useEffect(() => {
    setSupported(isVoiceSupported());
  }, []);

  useEffect(() => {
    return () => {
      recognizerRef.current?.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  const armSilenceTimer = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      recognizerRef.current?.stop();
    }, 3000);
  };

  const handleStart = () => {
    setError(null);
    setInterim("");
    lastInterimRef.current = "";

    const recognizer = new VoiceRecognizer({
      onInterim: (text) => {
        if (text !== lastInterimRef.current) {
          lastInterimRef.current = text;
          setInterim(text);
          armSilenceTimer();
        }
      },
      onFinal: (text) => {
        if (text.trim()) onTranscript(text.trim());
      },
      onError: (err) => {
        setError(err);
        setListening(false);
      },
      onEnd: () => {
        setListening(false);
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        setTimeout(() => setInterim(""), 400);
      },
    });

    recognizerRef.current = recognizer;
    recognizer.start();
    setListening(true);
    armSilenceTimer();
  };

  const handleStop = () => {
    recognizerRef.current?.stop();
  };

  if (!supported) return null;

  const dim = SIZE_MAP[size];
  const iconSize = ICON_SIZE[size];

  return (
    <>
      <motion.button
        type="button"
        onClick={listening ? handleStop : handleStart}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={listening ? "Stop recording" : "Start voice input"}
        className={`relative ${dim} rounded-full flex items-center justify-center text-white shadow-lg transition-all ${
          listening
            ? "bg-gradient-to-br from-stone-500 to-stone-600 shadow-stone-500/50"
            : "bg-gradient-to-br from-stone-500 via-stone-500 to-stone-500 hover:shadow-stone-500/50"
        } ${className}`}
      >
        {listening && (
          <>
            <motion.span
              className="absolute inset-0 rounded-full bg-stone-500/40"
              animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.span
              className="absolute inset-0 rounded-full bg-stone-500/30"
              animate={{ scale: [1, 1.9], opacity: [0.5, 0] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.5,
              }}
            />
          </>
        )}
        <span className="relative z-10">
          {listening ? <Square size={iconSize} /> : <Mic size={iconSize} />}
        </span>
      </motion.button>

      <AnimatePresence>
        {listening && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[min(640px,calc(100vw-2rem))]"
          >
            <div className="relative rounded-3xl p-[1.5px] bg-gradient-to-r from-stone-500 via-stone-500 to-stone-500 shadow-2xl shadow-stone-900/40">
              <div className="rounded-3xl bg-navy-950/90 backdrop-blur-xl px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex items-end gap-1 h-10">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1.5 rounded-full bg-gradient-to-t from-stone-400 to-stone-400"
                        animate={{
                          height: ["20%", "100%", "40%", "80%", "30%"],
                        }}
                        transition={{
                          duration: 0.9,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: "easeInOut",
                        }}
                        style={{ height: "40%" }}
                      />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] uppercase tracking-widest text-stone-300/80 font-semibold mb-1">
                      Listening
                    </div>
                    <div className="text-white text-lg leading-snug font-medium truncate">
                      {interim || (
                        <span className="text-slate-400">{placeholder}</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleStop}
                    className="shrink-0 h-11 px-4 rounded-full bg-gradient-to-r from-stone-500 to-stone-600 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-stone-500/30 hover:shadow-stone-500/50 transition-shadow"
                  >
                    <Square size={14} />
                    Stop
                  </button>
                </div>
                {error && (
                  <div className="mt-3 text-xs text-stone-300">{error}</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && !listening && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] rounded-full bg-stone-950/90 border border-stone-500/40 text-stone-200 text-sm px-4 py-2 backdrop-blur-md flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" />
          {error}
        </div>
      )}
    </>
  );
}
