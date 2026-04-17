"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { ReactNode } from "react";

interface InstantRevealStageProps {
  label: string;
  done: boolean;
  children?: ReactNode;
}

export default function InstantRevealStage({
  label,
  done,
  children,
}: InstantRevealStageProps): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            done
              ? "bg-gradient-to-br from-stone-400 to-stone-600"
              : "bg-white/5 border border-white/10"
          }`}
        >
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Check className="h-4 w-4 text-white" strokeWidth={3} />
              </motion.div>
            ) : (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 className="h-4 w-4 animate-spin text-white/60" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <span
          className={`text-sm font-medium tracking-tight ${
            done ? "text-white" : "text-white/60"
          }`}
        >
          {label}
        </span>
      </div>
      {children ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: done ? 1 : 0, height: done ? "auto" : 0 }}
          transition={{ duration: 0.5, delay: done ? 0.1 : 0 }}
          className="overflow-hidden"
        >
          <div className="mt-4">{children}</div>
        </motion.div>
      ) : null}
    </motion.div>
  );
}
