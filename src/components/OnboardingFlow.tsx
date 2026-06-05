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
    color: "text-[var(--gold-deep)]",
    bg: "bg-[var(--gold-soft)]",
  },
  {
    id: "store",
    label: "Online Store",
    description: "E-commerce, product catalog, checkout",
    icon: ShoppingBag,
    color: "text-stone-600",
    bg: "bg-stone-100",
  },
  {
    id: "app",
    label: "Web Application",
    description: "SaaS dashboard, admin panel, CRUD app",
    icon: Code,
    color: "text-stone-600",
    bg: "bg-stone-100",
  },
  {
    id: "marketing",
    label: "Marketing Page",
    description: "Email templates, social media, campaigns",
    icon: Megaphone,
    color: "text-stone-600",
    bg: "bg-stone-100",
  },
];

const ROLES = [
  {
    id: "freelancer",
    label: "Solo Creator / Freelancer",
    description: "Building for myself or 1-2 clients",
    icon: User,
    color: "text-[var(--gold-deep)]",
    bg: "bg-[var(--gold-soft)]",
  },
  {
    id: "business-owner",
    label: "Small Business Owner",
    description: "Need a website for my business",
    icon: Briefcase,
    color: "text-stone-600",
    bg: "bg-stone-100",
  },
  {
    id: "agency",
    label: "Agency / Team",
    description: "Building websites for multiple clients",
    icon: Users,
    color: "text-stone-600",
    bg: "bg-stone-100",
  },
  {
    id: "developer",
    label: "Developer",
    description: "Want full control and clean code",
    icon: Terminal,
    color: "text-stone-600",
    bg: "bg-stone-100",
  },
];

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [buildType, setBuildType] = useState("");
  const [role, setRole] = useState("");
  const [direction, setDirection] = useState(1);

  const handleDismiss = useCallback(() => onComplete(null), [onComplete]);

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

  const handleSkip = useCallback(() => onComplete(null), [onComplete]);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  const suggestedPrompt = buildType && role ? getSuggestedPrompt(buildType, role) : "";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.06)] overflow-hidden"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-8 bg-[var(--ink)]"
                    : i < step
                    ? "w-4 bg-[var(--gold)]"
                    : "w-4 bg-stone-200"
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-stone-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 min-h-[400px] relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 0 && (
              <motion.div
                key="step-0"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
              >
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-[var(--ink)] tracking-tight mb-1">
                    What do you want to build?
                  </h2>
                  <p className="text-sm text-[var(--ink-muted)]">
                    Pick one to personalise your experience
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {BUILD_TYPES.map((bt) => (
                    <button
                      key={bt.id}
                      onClick={() => handleBuildTypeSelect(bt.id)}
                      className={`group flex flex-col items-start text-left p-4 rounded-xl border transition-all duration-150 ${
                        buildType === bt.id
                          ? "border-[var(--gold)] bg-[var(--gold-soft)] shadow-sm"
                          : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg ${bt.bg} flex items-center justify-center mb-3`}>
                        <bt.icon className={`w-4.5 h-4.5 ${bt.color}`} />
                      </div>
                      <div className="text-sm font-semibold text-[var(--ink)] mb-0.5">{bt.label}</div>
                      <div className="text-xs text-[var(--ink-muted)] leading-snug">{bt.description}</div>
                    </button>
                  ))}
                </div>
                <div className="text-center mt-4">
                  <button
                    onClick={handleDismiss}
                    className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
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
                transition={{ duration: 0.22, ease: "easeInOut" }}
              >
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-[var(--ink)] tracking-tight mb-1">
                    Who are you?
                  </h2>
                  <p className="text-sm text-[var(--ink-muted)]">
                    This helps us recommend the right tools
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleRoleSelect(r.id)}
                      className={`group flex flex-col items-start text-left p-4 rounded-xl border transition-all duration-150 ${
                        role === r.id
                          ? "border-[var(--gold)] bg-[var(--gold-soft)] shadow-sm"
                          : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg ${r.bg} flex items-center justify-center mb-3`}>
                        <r.icon className={`w-4.5 h-4.5 ${r.color}`} />
                      </div>
                      <div className="text-sm font-semibold text-[var(--ink)] mb-0.5">{r.label}</div>
                      <div className="text-xs text-[var(--ink-muted)] leading-snug">{r.description}</div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => { setDirection(-1); setTimeout(() => setStep(0), 10); }}
                    className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
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
                transition={{ duration: 0.22, ease: "easeInOut" }}
              >
                <div className="text-center mb-5">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--gold-soft)] mb-3">
                    <Sparkles className="w-5 h-5 text-[var(--gold-deep)]" />
                  </div>
                  <h2 className="text-xl font-bold text-[var(--ink)] tracking-tight mb-1">
                    Ready to build!
                  </h2>
                  <p className="text-sm text-[var(--ink-muted)]">
                    We picked a prompt based on your answers
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 mb-4">
                  <div className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wider mb-1.5">
                    Your first build
                  </div>
                  <p className="text-sm text-[var(--ink)] leading-relaxed">
                    &ldquo;{suggestedPrompt}&rdquo;
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={handleBuildNow}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--ink)] text-white font-semibold text-sm hover:bg-[var(--ink-secondary)] transition-colors"
                  >
                    Build This Now
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSkip}
                    className="w-full px-5 py-2.5 rounded-xl border border-stone-200 text-[var(--ink-muted)] font-medium text-sm hover:bg-stone-50 hover:text-[var(--ink)] transition-all"
                  >
                    Skip — I&apos;ll start from scratch
                  </button>
                </div>

                <div className="text-center mt-3">
                  <button
                    onClick={() => { setDirection(-1); setTimeout(() => setStep(1), 10); }}
                    className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
                  >
                    ← Back
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
