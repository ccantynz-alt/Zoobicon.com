"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  X,
  Rocket,
  Globe,
  Share2,
  UserPlus,
  Wand2,
  PartyPopper,
  Crown,
} from "lucide-react";
import Link from "next/link";
import {
  getOnboardingState,
  completeOnboardingStep,
  dismissOnboarding,
  isOnboardingComplete,
  type OnboardingState,
} from "@/lib/onboarding";

interface OnboardingChecklistProps {
  className?: string;
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  actionLabel: string;
  actionHref: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "create_site",
    title: "Create your first site",
    description: "Describe what you want and watch AI build it",
    icon: <Rocket className="w-4 h-4" />,
    actionLabel: "Go to Builder",
    actionHref: "/builder",
  },
  {
    id: "deploy_site",
    title: "Deploy your site",
    description: "Publish your site live on zoobicon.sh",
    icon: <Globe className="w-4 h-4" />,
    actionLabel: "Deploy",
    actionHref: "/builder",
  },
  {
    id: "share_site",
    title: "Share with the world",
    description: "Show off what you built on social media",
    icon: <Share2 className="w-4 h-4" />,
    actionLabel: "Share",
    actionHref: "/dashboard",
  },
  {
    id: "invite_friend",
    title: "Invite a friend",
    description: "Give a friend 5 free builds, get 5 back",
    icon: <UserPlus className="w-4 h-4" />,
    actionLabel: "Invite",
    actionHref: "/referral",
  },
  {
    id: "try_generator",
    title: "Try a generator",
    description: "Explore 43 specialized site generators",
    icon: <Wand2 className="w-4 h-4" />,
    actionLabel: "Browse Generators",
    actionHref: "/generators",
  },
];

// SVG circular progress ring
function ProgressRing({
  progress,
  size = 44,
  strokeWidth = 3,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#progressGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Confetti micro-animation for completed items
function ConfettiBurst({ show }: { show: boolean }) {
  if (!show) return null;

  const particles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    angle: (i / 6) * 360,
    color: ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ec4899", "#3b82f6"][i],
  }));

  return (
    <AnimatePresence>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1 h-1 rounded-full"
          style={{ backgroundColor: p.color }}
          initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          animate={{
            opacity: 0,
            scale: 0,
            x: Math.cos((p.angle * Math.PI) / 180) * 20,
            y: Math.sin((p.angle * Math.PI) / 180) * 20,
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
    </AnimatePresence>
  );
}

export default function OnboardingChecklist({
  className = "",
}: OnboardingChecklistProps) {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [recentlyCompleted, setRecentlyCompleted] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const loadState = useCallback(() => {
    const s = getOnboardingState();
    setState(s);
    return s;
  }, []);

  useEffect(() => {
    setMounted(true);
    loadState();

    // Listen for onboarding step completions from other parts of the app
    const handler = (e: CustomEvent) => {
      const step = e.detail?.step;
      if (step) {
        completeOnboardingStep(step);
        setRecentlyCompleted(step);
        setTimeout(() => setRecentlyCompleted(null), 1000);
        const newState = loadState();

        // Check if all steps just completed
        if (newState.completed.length >= CHECKLIST_ITEMS.length && !showCelebration) {
          setShowCelebration(true);
        }
      }
    };

    window.addEventListener("zoobicon:onboarding" as string, handler as EventListener);
    return () => {
      window.removeEventListener("zoobicon:onboarding" as string, handler as EventListener);
    };
  }, [loadState, showCelebration]);

  if (!mounted || !state) return null;

  // Don't show if dismissed or all complete (and celebration dismissed)
  if (state.dismissed) return null;
  if (isOnboardingComplete() && !showCelebration) return null;

  const completedCount = state.completed.length;
  const totalCount = CHECKLIST_ITEMS.length;
  const progress = (completedCount / totalCount) * 100;

  const handleDismiss = () => {
    dismissOnboarding();
    setState({ ...state, dismissed: true });
  };

  const handleComplete = (stepId: string) => {
    completeOnboardingStep(stepId);
    setRecentlyCompleted(stepId);
    setTimeout(() => setRecentlyCompleted(null), 1000);
    const newState = loadState();

    if (newState && newState.completed.length >= totalCount) {
      setTimeout(() => setShowCelebration(true), 600);
    }
  };

  return (
    <>
      {/* Celebration Modal */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-md mx-4 p-8 rounded-2xl border border-white/10 bg-[#12121a] text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
            >
              {/* Decorative glow */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl" />

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 10 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 mb-4 shadow-lg shadow-violet-500/30"
              >
                <PartyPopper className="w-8 h-8 text-white" />
              </motion.div>

              <motion.h2
                className="text-2xl font-bold text-white mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Pro Trial Unlocked!
              </motion.h2>

              <motion.p
                className="text-white/60 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                You&apos;ve completed all onboarding steps. Enjoy{" "}
                <span className="text-violet-400 font-semibold">7 days of Pro features</span>{" "}
                for free — unlimited generators, multi-page sites, and more.
              </motion.p>

              <motion.div
                className="flex items-center justify-center gap-2 mb-6 px-4 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Crown className="w-4 h-4 text-violet-400" />
                <span className="text-sm text-violet-300 font-medium">
                  Pro Trial active for 7 days
                </span>
              </motion.div>

              <motion.div
                className="flex gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Link
                  href="/builder"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-600/20"
                  onClick={() => {
                    setShowCelebration(false);
                    handleDismiss();
                  }}
                >
                  Start Building
                </Link>
                <button
                  onClick={() => {
                    setShowCelebration(false);
                    handleDismiss();
                  }}
                  className="px-4 py-3 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Checklist Panel */}
      <motion.div
        className={`fixed bottom-20 right-4 z-50 w-80 ${className}`}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="rounded-2xl border border-white/[0.08] bg-[#12121a]/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
          {/* Header — always visible */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors"
          >
            <div className="relative">
              <ProgressRing progress={progress} />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                {completedCount}/{totalCount}
              </span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white/90">
                Complete your setup
              </p>
              <p className="text-xs text-white/40">
                {completedCount === totalCount
                  ? "All done!"
                  : `${totalCount - completedCount} steps remaining`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {expanded ? (
                <ChevronDown className="w-4 h-4 text-white/40" />
              ) : (
                <ChevronUp className="w-4 h-4 text-white/40" />
              )}
            </div>
          </button>

          {/* Expandable content */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                {/* Progress bar */}
                <div className="px-4 pb-3">
                  <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Checklist items */}
                <div className="px-2 pb-2 max-h-[320px] overflow-y-auto">
                  {CHECKLIST_ITEMS.map((item, idx) => {
                    const isCompleted = state.completed.includes(item.id);
                    const isRecentlyDone = recentlyCompleted === item.id;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`relative flex items-start gap-3 p-3 rounded-xl transition-colors ${
                          isCompleted
                            ? "bg-emerald-500/[0.04]"
                            : "hover:bg-white/[0.03]"
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => !isCompleted && handleComplete(item.id)}
                          className="mt-0.5 flex-shrink-0 relative"
                          disabled={isCompleted}
                        >
                          {isCompleted ? (
                            <motion.div
                              initial={isRecentlyDone ? { scale: 0 } : { scale: 1 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", damping: 10 }}
                            >
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            </motion.div>
                          ) : (
                            <Circle className="w-5 h-5 text-white/20 hover:text-white/40 transition-colors" />
                          )}
                          <ConfettiBurst show={isRecentlyDone} />
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium transition-all ${
                              isCompleted
                                ? "text-white/40 line-through"
                                : "text-white/90"
                            }`}
                          >
                            {item.title}
                          </p>
                          <p className="text-xs text-white/30 mt-0.5">
                            {item.description}
                          </p>
                        </div>

                        {/* Action button */}
                        {!isCompleted && (
                          <Link
                            href={item.actionHref}
                            className="flex-shrink-0 mt-0.5 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-[11px] font-medium text-white/60 hover:text-white/90 transition-all"
                          >
                            {item.actionLabel}
                          </Link>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Dismiss */}
                <div className="px-4 py-3 border-t border-white/[0.06]">
                  <button
                    onClick={handleDismiss}
                    className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/50 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    I&apos;ll do this later
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
