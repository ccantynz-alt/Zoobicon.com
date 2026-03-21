"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Sparkles,
  Monitor,
  Wrench,
  Rocket,
  ChevronRight,
  X,
} from "lucide-react";

const STORAGE_KEY = "zoobicon_tour_completed";

interface TooltipStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  /** CSS selector for the target element */
  selector: string;
  /** Where the tooltip appears relative to the target */
  position: "bottom" | "top" | "left" | "right";
}

const STEPS: TooltipStep[] = [
  {
    id: "prompt",
    title: "Describe Your Site",
    description:
      "Type what you want to build. Include your business type, preferred style, and key features for the best results.",
    icon: MessageSquare,
    selector: 'textarea[placeholder*="Describe"], textarea[placeholder*="describe"], [data-tour="prompt"]',
    position: "bottom",
  },
  {
    id: "generate",
    title: "Generate with AI",
    description:
      "Hit Generate and our 7-agent pipeline will build your site in about 60 seconds. You can watch each agent work in real time.",
    icon: Sparkles,
    selector: 'button:has(.lucide-sparkles), [data-tour="generate"]',
    position: "bottom",
  },
  {
    id: "preview",
    title: "Live Preview",
    description:
      "Your generated site appears here instantly. Switch between desktop, tablet, and mobile views to check responsiveness.",
    icon: Monitor,
    selector: '[data-tour="preview"], .flex-1.overflow-hidden.relative',
    position: "left",
  },
  {
    id: "tools",
    title: "Sidebar Tools",
    description:
      "21+ tools at your fingertips: SEO audit, visual editor, multi-page generator, e-commerce, accessibility checker, and more.",
    icon: Wrench,
    selector: '[data-tour="tools"], .w-12.flex.flex-col',
    position: "left",
  },
  {
    id: "deploy",
    title: "Deploy to the Web",
    description:
      "When you are happy with your site, deploy it to a live URL with one click. You can keep editing after deployment.",
    icon: Rocket,
    selector: '[data-tour="deploy"], button:has(.lucide-rocket)',
    position: "bottom",
  },
];

interface OnboardingTooltipsProps {
  /** Whether the welcome modal has been dismissed */
  active: boolean;
}

export function shouldShowTour(): boolean {
  if (typeof window === "undefined") return false;
  return !localStorage.getItem(STORAGE_KEY);
}

export function dismissTour(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, "true");
}

export default function OnboardingTooltips({ active }: OnboardingTooltipsProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{
    top: number;
    left: number;
    arrowDir: "top" | "bottom" | "left" | "right";
  }>({ top: 0, left: 0, arrowDir: "top" });
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Show the tour after a short delay once active
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(timer);
  }, [active]);

  const positionTooltip = useCallback(() => {
    const step = STEPS[currentStep];
    if (!step) return;

    // Try each selector in the comma-separated list
    const selectors = step.selector.split(",").map((s) => s.trim());
    let target: Element | null = null;
    for (const sel of selectors) {
      try {
        target = document.querySelector(sel);
        if (target) break;
      } catch {
        // Invalid selector, skip
      }
    }

    if (!target) {
      // Fallback: center of screen
      setTooltipPos({
        top: window.innerHeight / 2 - 80,
        left: window.innerWidth / 2 - 160,
        arrowDir: "top",
      });
      return;
    }

    const rect = target.getBoundingClientRect();
    const tooltipW = 320;
    const tooltipH = 180;
    const gap = 12;

    let top = 0;
    let left = 0;
    let arrowDir: "top" | "bottom" | "left" | "right" = "top";

    switch (step.position) {
      case "bottom":
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        arrowDir = "top";
        break;
      case "top":
        top = rect.top - tooltipH - gap;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        arrowDir = "bottom";
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.left - tooltipW - gap;
        arrowDir = "right";
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.right + gap;
        arrowDir = "left";
        break;
    }

    // Clamp within viewport
    left = Math.max(12, Math.min(left, window.innerWidth - tooltipW - 12));
    top = Math.max(12, Math.min(top, window.innerHeight - tooltipH - 12));

    setTooltipPos({ top, left, arrowDir });
  }, [currentStep]);

  useEffect(() => {
    if (!visible) return;
    positionTooltip();
    window.addEventListener("resize", positionTooltip);
    return () => window.removeEventListener("resize", positionTooltip);
  }, [visible, currentStep, positionTooltip]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleSkip();
    }
  };

  const handleSkip = () => {
    setVisible(false);
    dismissTour();
  };

  if (!active || !visible) return null;

  const step = STEPS[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === STEPS.length - 1;

  const arrowClasses: Record<string, string> = {
    top: "left-1/2 -translate-x-1/2 -top-2 border-l-transparent border-r-transparent border-t-transparent border-b-zinc-800",
    bottom:
      "left-1/2 -translate-x-1/2 -bottom-2 border-l-transparent border-r-transparent border-b-transparent border-t-zinc-800",
    left: "top-1/2 -translate-y-1/2 -left-2 border-t-transparent border-b-transparent border-l-transparent border-r-zinc-800",
    right:
      "top-1/2 -translate-y-1/2 -right-2 border-t-transparent border-b-transparent border-r-transparent border-l-zinc-800",
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        ref={tooltipRef}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="fixed z-[60] w-[320px]"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        {/* Arrow */}
        <div
          className={`absolute w-0 h-0 border-[8px] ${arrowClasses[tooltipPos.arrowDir]}`}
        />

        {/* Tooltip body */}
        <div className="bg-zinc-800 border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400">
              <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white">{step.title}</h3>
            </div>
            <button
              onClick={handleSkip}
              className="flex-shrink-0 p-1 rounded text-white/50 hover:text-white/60 transition-colors"
              aria-label="Close tour"
            >
              <X size={14} />
            </button>
          </div>

          {/* Description */}
          <p className="px-4 pb-3 text-xs text-white/50 leading-relaxed">
            {step.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-zinc-800/80">
            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === currentStep
                      ? "bg-blue-400"
                      : i < currentStep
                      ? "bg-blue-400/40"
                      : "bg-white/15"
                  }`}
                />
              ))}
              <span className="ml-2 text-[10px] text-white/50">
                {currentStep + 1}/{STEPS.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSkip}
                className="text-[11px] text-white/50 hover:text-white/50 transition-colors"
              >
                Skip Tour
              </button>
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition-colors"
              >
                {isLast ? "Done" : "Next"}
                {!isLast && <ChevronRight size={12} />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
