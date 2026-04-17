"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  ShoppingBag,
  Code,
  Megaphone,
  User,
  Briefcase,
  Users,
  Terminal,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";
import { setUserSegment, getSuggestedPrompt } from "@/lib/user-segment";

interface OnboardingFlowProps {
  onComplete: (prompt: string | null) => void;
}

const BUILD_TYPES = [
  {
    id: "business",
    label: "Business Website",
    description: "Landing page, company site, portfolio",
    icon: Globe,
    gradient: "from-brand-500 to-stone-600",
  },
  {
    id: "store",
    label: "Online Store",
    description: "E-commerce, product catalog, checkout",
    icon: ShoppingBag,
    gradient: "from-stone-500 to-stone-600",
  },
  {
    id: "app",
    label: "Web Application",
    description: "SaaS dashboard, admin panel, CRUD app",
    icon: Code,
    gradient: "from-stone-500 to-stone-600",
  },
  {
    id: "marketing",
    label: "Marketing Content",
    description: "Email templates, social media, video",
    icon: Megaphone,
    gradient: "from-stone-500 to-stone-600",
  },
];

const ROLES = [
  {
    id: "freelancer",
    label: "Solo Creator / Freelancer",
    description: "Building for myself or 1-2 clients",
    icon: User,
    gradient: "from-stone-500 to-stone-600",
  },
  {
    id: "business-owner",
    label: "Small Business Owner",
    description: "Need a website for my business",
    icon: Briefcase,
    gradient: "from-stone-500 to-stone-600",
  },
  {
    id: "agency",
    label: "Agency / Team",
    description: "Building websites for multiple clients",
    icon: Users,
    gradient: "from-stone-500 to-stone-600",
  },
  {
    id: "developer",
    label: "Developer",
    description: "Want API access and full control",
    icon: Terminal,
    gradient: "from-stone-500 to-stone-600",
  },
];

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [buildType, setBuildType] = useState("");
  const [role, setRole] = useState("");
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  const handleDismiss = useCallback(() => {
    onComplete(null);
  }, [onComplete]);

  const handleBuildTypeSelect = useCallback((id: string) => {
    setBuildType(id);
    setDirection(1);
    setTimeout(() => setStep(1), 150);
  }, []);

  const handleRoleSelect = useCallback((id: string) => {
    setRole(id);
    setUserSegment(buildType, id);
    setDirection(1);
    setTimeout(() => setStep(2), 150);
  }, [buildType]);

  const handleBuildNow = useCallback(() => {
    const prompt = getSuggestedPrompt(buildType, role);
    onComplete(prompt);
  }, [buildType, role, onComplete]);

  const handleSkip = useCallback(() => {
    onComplete(null);
  }, [onComplete]);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  const suggestedPrompt = buildType && role ? getSuggestedPrompt(buildType, role) : "";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative z-10 w-full max-w-2xl mx-4 bg-[#0c0e14] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-20 p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
          aria-label="Close onboarding"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pt-6 pb-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-8 bg-gradient-to-r from-brand-500 to-accent-purple"
                  : i < step
                  ? "w-4 bg-brand-500/40"
                  : "w-4 bg-white/10"
              }`}
            />
          ))}
        </div>

        {/* Content area */}
        <div className="px-6 pb-6 pt-2 min-h-[420px] relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 0 && (
              <motion.div
                key="step-0"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold tracking-tight mb-2">
                    What do you want to build?
                  </h2>
                  <p className="text-sm text-white/60">
                    Pick one to personalize your experience
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {BUILD_TYPES.map((bt) => (
                    <button
                      key={bt.id}
                      onClick={() => handleBuildTypeSelect(bt.id)}
                      className={`group relative flex flex-col items-center text-center p-6 rounded-xl border transition-all duration-200
                        ${
                          buildType === bt.id
                            ? "border-brand-500/50 bg-brand-500/10"
                            : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                        }`}
                    >
                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${bt.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                      >
                        <bt.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-sm font-semibold mb-1">{bt.label}</div>
                      <div className="text-xs text-white/50">{bt.description}</div>
                    </button>
                  ))}
                </div>
                <div className="text-center mt-5">
                  <button
                    onClick={handleDismiss}
                    className="text-xs text-white/40 hover:text-white/60 transition-colors"
                  >
                    Skip onboarding
                  </button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold tracking-tight mb-2">
                    Who are you?
                  </h2>
                  <p className="text-sm text-white/60">
                    This helps us recommend the right tools
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleRoleSelect(r.id)}
                      className={`group relative flex flex-col items-center text-center p-6 rounded-xl border transition-all duration-200
                        ${
                          role === r.id
                            ? "border-brand-500/50 bg-brand-500/10"
                            : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                        }`}
                    >
                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${r.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                      >
                        <r.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-sm font-semibold mb-1">{r.label}</div>
                      <div className="text-xs text-white/50">{r.description}</div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-5">
                  <button
                    onClick={() => {
                      setDirection(-1);
                      setTimeout(() => setStep(0), 10);
                    }}
                    className="text-xs text-white/40 hover:text-white/60 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="text-xs text-white/40 hover:text-white/60 transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-purple/20 border border-brand-500/20 mb-4">
                    <Sparkles className="w-8 h-8 text-brand-400" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight mb-2">
                    Let&apos;s build your first site!
                  </h2>
                  <p className="text-sm text-white/60">
                    We picked a prompt based on your answers. Ready?
                  </p>
                </div>

                {/* Suggested prompt card */}
                <div className="relative p-5 rounded-xl border border-brand-500/20 bg-brand-500/[0.04] mb-5">
                  <div className="text-xs font-semibold text-brand-400/70 uppercase tracking-wider mb-2">
                    Your first build
                  </div>
                  <p className="text-base text-white/90 leading-relaxed">
                    &ldquo;{suggestedPrompt}&rdquo;
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleBuildNow}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-purple text-white font-semibold text-sm hover:brightness-110 transition-all"
                  >
                    Build This Now
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSkip}
                    className="w-full px-6 py-3 rounded-xl border border-white/[0.08] text-white/60 font-medium text-sm hover:bg-white/[0.04] hover:text-white/80 transition-all"
                  >
                    Skip — I&apos;ll start from scratch
                  </button>
                </div>

                <div className="text-center mt-4">
                  <button
                    onClick={() => {
                      setDirection(-1);
                      setTimeout(() => setStep(1), 10);
                    }}
                    className="text-xs text-white/40 hover:text-white/60 transition-colors"
                  >
                    Back
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
