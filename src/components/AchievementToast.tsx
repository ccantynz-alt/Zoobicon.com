"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Zap,
  Hammer,
  Building2,
  Crown,
  Globe,
  Upload,
  Share2,
  Flame,
  Eye,
  TrendingUp,
  GitFork,
  Trophy,
  X,
} from "lucide-react";
import type { Achievement } from "@/lib/achievements";
import { trackEvent, checkAchievements, getUserStats } from "@/lib/achievements";

/* ------------------------------------------------------------------ */
/* Icon map                                                            */
/* ------------------------------------------------------------------ */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket, Zap, Hammer, Building2, Crown, Globe, Upload,
  Share2, Flame, Eye, TrendingUp, GitFork,
};

function AchievementIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] || Trophy;
  return <Icon className={className} />;
}

/* ------------------------------------------------------------------ */
/* Confetti burst (CSS-only particles)                                 */
/* ------------------------------------------------------------------ */
function ConfettiBurst() {
  const particles = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * 360;
    const distance = 40 + Math.random() * 60;
    const size = 4 + Math.random() * 4;
    const colors = ["#6d3bff", "#22d3ee", "#f59e0b", "#ef4444", "#10b981", "#ec4899", "#3b82f6"];
    const color = colors[i % colors.length];
    const dx = Math.cos((angle * Math.PI) / 180) * distance;
    const dy = Math.sin((angle * Math.PI) / 180) * distance;
    const rotation = Math.random() * 720 - 360;

    return (
      <motion.div
        key={i}
        className="absolute rounded-sm"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          top: "50%",
          left: "50%",
        }}
        initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
        animate={{
          x: dx,
          y: dy,
          opacity: 0,
          scale: 0.2,
          rotate: rotation,
        }}
        transition={{ duration: 0.8 + Math.random() * 0.4, ease: "easeOut" }}
      />
    );
  });

  return <div className="absolute inset-0 pointer-events-none overflow-visible">{particles}</div>;
}

/* ------------------------------------------------------------------ */
/* Single toast card                                                    */
/* ------------------------------------------------------------------ */
function ToastCard({
  achievement,
  onDismiss,
}: {
  achievement: Achievement;
  onDismiss: () => void;
}) {
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const duration = 5000;
    const interval = 50;
    const step = (interval / duration) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev - step;
        if (next <= 0) {
          clearInterval(timerRef.current);
          onDismiss();
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timerRef.current);
  }, [onDismiss]);

  const showConfetti = achievement.confetti;

  return (
    <motion.div
      layout
      initial={{ x: 80, opacity: 0, scale: 0.9 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 80, opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className="relative w-80 rounded-xl border border-amber-500/20 bg-[#12121a]/95 backdrop-blur-xl shadow-2xl shadow-amber-500/10 overflow-hidden"
    >
      {/* Confetti layer */}
      {showConfetti && (
        <div className="absolute top-6 left-10 z-10">
          <ConfettiBurst />
        </div>
      )}

      <div className="relative z-20 p-4 flex items-start gap-3">
        {/* Gold badge icon with glow */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <AchievementIcon name={achievement.icon} className="w-5 h-5 text-white" />
          </div>
          {/* Glow ring */}
          <div className="absolute -inset-1 rounded-xl bg-amber-400/20 blur-sm -z-10" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-amber-400/80 uppercase tracking-wider mb-0.5">
            Achievement Unlocked
          </p>
          <p className="text-sm font-semibold text-white/90 truncate">
            {achievement.title}
          </p>
          <p className="text-xs text-white/50 mt-0.5">
            {achievement.description}
          </p>
        </div>

        <button
          onClick={() => {
            clearInterval(timerRef.current);
            onDismiss();
          }}
          className="flex-shrink-0 p-1 rounded-md hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="h-0.5 bg-white/[0.04]">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-500/60 to-amber-400/60"
          initial={{ width: "100%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.05, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Toast container (renders portal-style at bottom-right)              */
/* ------------------------------------------------------------------ */
export function AchievementToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Achievement[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((achievement) => (
          <div key={achievement.id} className="pointer-events-auto">
            <ToastCard
              achievement={achievement}
              onDismiss={() => onDismiss(achievement.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* useAchievements hook                                                */
/* ------------------------------------------------------------------ */
export function useAchievements() {
  const [toasts, setToasts] = useState<Achievement[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const triggerCheck = useCallback((event: string, count?: number) => {
    const { newAchievements } = trackEvent(event, count);
    if (newAchievements.length > 0) {
      setToasts((prev) => {
        // Avoid duplicates
        const existingIds = new Set(prev.map((t) => t.id));
        const fresh = newAchievements.filter((a) => !existingIds.has(a.id));
        return [...prev, ...fresh];
      });
    }
  }, []);

  /** Check achievements against current stats without incrementing anything */
  const recheckAll = useCallback(() => {
    const stats = getUserStats();
    const newAchievements = checkAchievements(stats);
    if (newAchievements.length > 0) {
      setToasts((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const fresh = newAchievements.filter((a) => !existingIds.has(a.id));
        return [...prev, ...fresh];
      });
    }
  }, []);

  return { toasts, triggerCheck, recheckAll, dismiss };
}

/* ------------------------------------------------------------------ */
/* Default export: standalone toast manager for layout-level mounting   */
/* ------------------------------------------------------------------ */
export default function AchievementToast() {
  const { toasts, dismiss } = useAchievements();
  return <AchievementToastContainer toasts={toasts} onDismiss={dismiss} />;
}
