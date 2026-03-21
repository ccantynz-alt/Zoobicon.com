"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  MousePointer2,
  Rocket,
  PartyPopper,
  X,
} from "lucide-react";

const STORAGE_KEY = "zoobicon_first_build_celebrated";

export function shouldShowBuildSuccess(): boolean {
  if (typeof window === "undefined") return false;
  return !localStorage.getItem(STORAGE_KEY);
}

export function dismissBuildSuccess(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, "true");
}

interface BuildSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: "chat" | "visual" | "deploy") => void;
}

const NEXT_STEPS = [
  {
    action: "chat" as const,
    icon: MessageSquare,
    title: "Edit with AI Chat",
    description: "Tell the AI what to change and watch it update live.",
    color: "blue",
    gradient: "from-blue-500/20 to-blue-600/5",
    border: "border-blue-500/20 hover:border-blue-500/40",
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-400",
  },
  {
    action: "visual" as const,
    icon: MousePointer2,
    title: "Visual Editor",
    description: "Click any element to edit colors, fonts, spacing, and text.",
    color: "purple",
    gradient: "from-purple-500/20 to-purple-600/5",
    border: "border-purple-500/20 hover:border-purple-500/40",
    iconBg: "bg-purple-500/15",
    iconColor: "text-purple-400",
  },
  {
    action: "deploy" as const,
    icon: Rocket,
    title: "Deploy to Web",
    description: "Publish to a live URL in one click. Edit anytime after.",
    color: "emerald",
    gradient: "from-emerald-500/20 to-emerald-600/5",
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
  },
];

/** Generate confetti particle styles */
function useConfetti(count: number) {
  const [particles, setParticles] = useState<
    { id: number; x: number; color: string; delay: number; duration: number; size: number }[]
  >([]);

  useEffect(() => {
    const colors = [
      "#3b82f6",
      "#8b5cf6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#ec4899",
      "#06b6d4",
      "#f97316",
    ];
    const items = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.8,
      duration: 1.5 + Math.random() * 1.5,
      size: 4 + Math.random() * 6,
    }));
    setParticles(items);
  }, [count]);

  return particles;
}

export default function BuildSuccessModal({
  isOpen,
  onClose,
  onAction,
}: BuildSuccessModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const confetti = useConfetti(40);

  const handleClose = () => {
    if (dontShowAgain) {
      dismissBuildSuccess();
    }
    onClose();
  };

  const handleAction = (action: "chat" | "visual" | "deploy") => {
    if (dontShowAgain) {
      dismissBuildSuccess();
    }
    onAction(action);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
          >
            {/* Confetti layer */}
            <div className="absolute inset-x-0 top-0 h-32 overflow-hidden pointer-events-none">
              {confetti.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ y: -20, opacity: 1, rotate: 0 }}
                  animate={{
                    y: 140,
                    opacity: 0,
                    rotate: Math.random() > 0.5 ? 360 : -360,
                  }}
                  transition={{
                    duration: p.duration,
                    delay: p.delay,
                    ease: "easeOut",
                  }}
                  className="absolute rounded-sm"
                  style={{
                    left: `${p.x}%`,
                    width: p.size,
                    height: p.size * (0.6 + Math.random() * 0.8),
                    backgroundColor: p.color,
                  }}
                />
              ))}
            </div>

            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-white/50 hover:text-white/60 hover:bg-white/5 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="relative px-6 pt-8 pb-2 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  damping: 12,
                  stiffness: 200,
                  delay: 0.15,
                }}
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 mb-4"
              >
                <PartyPopper size={28} className="text-blue-400" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-xl font-semibold text-white"
              >
                Your site is ready!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-1.5 text-sm text-white/50"
              >
                Great work. Here is what you can do next.
              </motion.p>
            </div>

            {/* Next Steps */}
            <div className="px-6 py-4 space-y-2.5">
              {NEXT_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.button
                    key={step.action}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    onClick={() => handleAction(step.action)}
                    className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl border ${step.border} bg-gradient-to-r ${step.gradient} text-left transition-all hover:scale-[1.01] active:scale-[0.99]`}
                  >
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-lg ${step.iconBg} flex items-center justify-center ${step.iconColor}`}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">
                        {step.title}
                      </p>
                      <p className="text-xs text-white/50 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-2 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/30 focus:ring-offset-0"
                />
                <span className="text-xs text-white/50">
                  Don&apos;t show again
                </span>
              </label>

              <button
                onClick={handleClose}
                className="text-xs text-white/50 hover:text-white/50 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
