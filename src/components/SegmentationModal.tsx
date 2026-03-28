"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Building2, Store, Sparkles, X } from "lucide-react";
import { setUserSegment } from "@/lib/onboarding";

interface SegmentationModalProps {
  isOpen: boolean;
  onClose: (segment?: string) => void;
}

interface SegmentOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  glowColor: string;
}

const SEGMENTS: SegmentOption[] = [
  {
    id: "freelancer",
    label: "I'm a Freelancer",
    description: "I build sites for clients",
    icon: <Briefcase className="w-6 h-6" />,
    gradient: "from-amber-500 to-orange-600",
    glowColor: "shadow-amber-500/20",
  },
  {
    id: "agency",
    label: "I run an Agency",
    description: "I need white-label tools",
    icon: <Building2 className="w-6 h-6" />,
    gradient: "from-violet-500 to-purple-600",
    glowColor: "shadow-violet-500/20",
  },
  {
    id: "business",
    label: "I'm a Small Business",
    description: "I need a website for my business",
    icon: <Store className="w-6 h-6" />,
    gradient: "from-cyan-500 to-blue-600",
    glowColor: "shadow-cyan-500/20",
  },
  {
    id: "creator",
    label: "I'm a Creator",
    description: "I want to build my online presence",
    icon: <Sparkles className="w-6 h-6" />,
    gradient: "from-pink-500 to-rose-600",
    glowColor: "shadow-pink-500/20",
  },
];

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 25, stiffness: 300 },
  },
  exit: { opacity: 0, scale: 0.9, y: 20 },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.08, duration: 0.3 },
  }),
};

export default function SegmentationModal({
  isOpen,
  onClose,
}: SegmentationModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleSelect = (segmentId: string) => {
    setSelected(segmentId);
    setUserSegment(segmentId);

    // Brief delay to show selection before closing
    setIsClosing(true);
    setTimeout(() => {
      onClose(segmentId);
      setIsClosing(false);
      setSelected(null);
    }, 400);
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleSkip}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#12121a] overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Decorative gradient orbs */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="relative p-8">
              {/* Header */}
              <motion.div
                className="text-center mb-8"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-2xl font-bold text-white mb-2">
                  What brings you to Zoobicon?
                </h2>
                <p className="text-sm text-white/50">
                  We&apos;ll personalize your experience based on your goals
                </p>
              </motion.div>

              {/* Segment cards */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {SEGMENTS.map((segment, idx) => {
                  const isSelected = selected === segment.id;

                  return (
                    <motion.button
                      key={segment.id}
                      custom={idx}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      onClick={() => !isClosing && handleSelect(segment.id)}
                      disabled={isClosing}
                      className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border transition-all duration-200 text-center group ${
                        isSelected
                          ? "border-violet-500/50 bg-violet-500/10 scale-[0.97]"
                          : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
                      }`}
                    >
                      {/* Icon container */}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${segment.gradient} shadow-lg ${segment.glowColor} transition-transform group-hover:scale-110`}
                      >
                        <div className="text-white">{segment.icon}</div>
                      </div>

                      {/* Text */}
                      <div>
                        <p className="text-sm font-semibold text-white/90 mb-0.5">
                          {segment.label}
                        </p>
                        <p className="text-xs text-white/40">
                          {segment.description}
                        </p>
                      </div>

                      {/* Selection indicator */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            className="absolute inset-0 rounded-xl border-2 border-violet-400 pointer-events-none"
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                          />
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>

              {/* Skip link */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <button
                  onClick={handleSkip}
                  className="text-xs text-white/30 hover:text-white/50 transition-colors underline underline-offset-2"
                >
                  Skip for now
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
