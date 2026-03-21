"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Cpu, Rocket, X } from "lucide-react";

interface WelcomeModalProps {
  onClose: () => void;
  onBrowseTemplates?: () => void;
}

const STORAGE_KEY = "zoobicon_onboarded";

const steps = [
  {
    icon: MessageSquare,
    title: "Describe",
    description:
      "Tell the AI what you want. Be specific about your business, style, and features.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    icon: Cpu,
    title: "Build",
    description:
      "Our 7-agent pipeline creates your site in ~60 seconds. Watch it happen live.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  {
    icon: Rocket,
    title: "Ship",
    description:
      "Edit with AI chat, then deploy to a live URL with one click.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
];

export function shouldShowWelcomeModal(): boolean {
  if (typeof window === "undefined") return false;
  return !localStorage.getItem(STORAGE_KEY);
}

export function dismissWelcomeModal(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, "true");
}

export default function WelcomeModal({ onClose, onBrowseTemplates }: WelcomeModalProps) {
  const [visible, setVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  useEffect(() => {
    // Trigger fade-in on mount
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleDismiss = () => {
    if (dontShowAgain) {
      dismissWelcomeModal();
    }
    setVisible(false);
    setTimeout(onClose, 200);
  };

  const handleStartBuilding = () => {
    handleDismiss();
    // Focus the prompt textarea after modal closes
    setTimeout(() => {
      const textarea = document.querySelector<HTMLTextAreaElement>(
        'textarea[placeholder*="Describe"]'
      );
      textarea?.focus();
    }, 250);
  };

  const handleBrowseTemplates = () => {
    handleDismiss();
    onBrowseTemplates?.();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-lg bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 transition-all duration-200 ${
          visible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-white/50 hover:text-white/60 hover:bg-white/5 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-xl font-semibold text-white">
            Welcome to Zoobicon
          </h2>
          <p className="mt-1 text-sm text-white/50">
            Build a production-ready website in three steps.
          </p>
        </div>

        {/* Steps */}
        <div className="px-6 py-4 space-y-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className={`flex items-start gap-4 p-4 rounded-xl border ${step.border} ${step.bg}`}
              >
                <div
                  className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg ${step.bg} ${step.color}`}
                >
                  <Icon size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">
                      Step {i + 1}
                    </span>
                    <span className={`text-sm font-semibold ${step.color}`}>
                      {step.title}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-white/50 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2">
          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleBrowseTemplates}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-sm font-medium text-white/60 hover:text-white hover:border-white/20 hover:bg-white/5 transition-colors"
            >
              Browse Templates
            </button>
            <button
              onClick={handleStartBuilding}
              className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white transition-colors"
            >
              Start Building
            </button>
          </div>

          {/* Don't show again */}
          <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/30 focus:ring-offset-0"
            />
            <span className="text-xs text-white/50">
              Don&apos;t show this again
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
