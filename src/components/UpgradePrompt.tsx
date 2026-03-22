"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Zap,
  Lock,
  AlertTriangle,
  Check,
  ArrowRight,
  Crown,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { getPlanFeatures, PLAN_PRICES, getOveragePacks } from "@/lib/monetization";

type UpgradeVariant = "quota_exceeded" | "pro_feature" | "generator_locked";

interface UpgradePromptProps {
  variant: UpgradeVariant;
  feature?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface VariantConfig {
  icon: React.ReactNode;
  iconBg: string;
  iconGlow: string;
  title: string;
  description: string;
  ctaLabel: string;
  showOveragePacks: boolean;
}

function getVariantConfig(variant: UpgradeVariant, feature?: string): VariantConfig {
  switch (variant) {
    case "quota_exceeded":
      return {
        icon: <AlertTriangle className="w-6 h-6 text-white" />,
        iconBg: "from-amber-500 to-orange-600",
        iconGlow: "shadow-amber-500/30",
        title: "Monthly build limit reached",
        description:
          "You've used all your builds for this month. Upgrade your plan for more builds, or grab an overage pack to keep going.",
        ctaLabel: "Upgrade Plan",
        showOveragePacks: true,
      };
    case "pro_feature":
      return {
        icon: <Crown className="w-6 h-6 text-white" />,
        iconBg: "from-violet-500 to-purple-600",
        iconGlow: "shadow-violet-500/30",
        title: `${feature || "This feature"} requires Pro`,
        description: `Unlock ${feature || "this feature"} and 40+ other Pro tools with an upgrade. Multi-page sites, full-stack apps, e-commerce, and more.`,
        ctaLabel: "Upgrade to Pro",
        showOveragePacks: false,
      };
    case "generator_locked":
      return {
        icon: <Lock className="w-6 h-6 text-white" />,
        iconBg: "from-cyan-500 to-blue-600",
        iconGlow: "shadow-cyan-500/30",
        title: `${feature || "This generator"} is Pro-only`,
        description: `This specialized generator produces higher-quality output and is available on Pro and Agency plans. Upgrade to access all 43 generators.`,
        ctaLabel: "Unlock Generator",
        showOveragePacks: false,
      };
  }
}

export default function UpgradePrompt({
  variant,
  feature,
  isOpen,
  onClose,
}: UpgradePromptProps) {
  const config = getVariantConfig(variant, feature);
  const features = getPlanFeatures();
  const overagePacks = getOveragePacks();

  // Show a subset of features for the modal
  const highlightFeatures = features.slice(0, 7);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#12121a] overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Decorative glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-60 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative p-6">
              {/* Icon */}
              <div className="flex justify-center mb-5">
                <motion.div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${config.iconBg} shadow-lg ${config.iconGlow}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", damping: 12 }}
                >
                  {config.icon}
                </motion.div>
              </div>

              {/* Title and description */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-white mb-2">
                  {config.title}
                </h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  {config.description}
                </p>
              </div>

              {/* Pro plan card */}
              <motion.div
                className="rounded-xl border border-violet-500/20 bg-violet-500/[0.05] p-4 mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-semibold text-white">
                      Pro Plan
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-white">
                      ${PLAN_PRICES.pro}
                    </span>
                    <span className="text-xs text-white/40">/mo</span>
                  </div>
                </div>

                {/* Feature highlights */}
                <div className="space-y-2">
                  {highlightFeatures.map((f) => (
                    <div key={f.name} className="flex items-center gap-2">
                      <Check
                        className={`w-3.5 h-3.5 flex-shrink-0 ${
                          f.pro === true || (typeof f.pro === "string" && f.pro !== "")
                            ? "text-emerald-400"
                            : "text-white/20"
                        }`}
                      />
                      <span className="text-xs text-white/60">
                        {f.name}
                        {typeof f.pro === "string" && (
                          <span className="text-white/40 ml-1">
                            ({f.pro})
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Overage packs (only for quota_exceeded) */}
              {config.showOveragePacks && (
                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">
                    Or grab an overage pack
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {overagePacks.map((pack) => (
                      <Link
                        key={pack.builds}
                        href={`/pricing?overage=${pack.builds}`}
                        className="flex flex-col items-center p-3 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.15] transition-all text-center"
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span className="text-sm font-bold text-white">
                            {pack.builds}
                          </span>
                        </div>
                        <span className="text-[11px] text-white/40">
                          builds
                        </span>
                        <span className="text-sm font-semibold text-emerald-400 mt-1">
                          ${pack.price}
                        </span>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* CTA buttons */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Link
                  href="/pricing"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30"
                  onClick={onClose}
                >
                  {config.ctaLabel}
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={onClose}
                  className="w-full py-2.5 text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  Not now
                </button>
              </motion.div>

              {/* Guarantee note */}
              <p className="text-center text-[11px] text-white/20 mt-3">
                Cancel anytime. 7-day free trial included.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
