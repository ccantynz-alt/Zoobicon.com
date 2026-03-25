"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import Link from "next/link";

const STORAGE_KEY = "zoobicon_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      // Small delay so it doesn't flash on initial page load
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept(level: "all" | "essential") {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ level, date: new Date().toISOString() })
    );
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 inset-x-0 z-[9999] p-4 sm:p-6 pointer-events-none"
        >
          <div className="max-w-2xl mx-auto pointer-events-auto rounded-2xl border border-white/[0.08] bg-[#0f0f1a]/95 backdrop-blur-xl shadow-2xl shadow-black/40 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex shrink-0 w-10 h-10 rounded-xl bg-brand-500/10 items-center justify-center mt-0.5">
                <Cookie className="w-5 h-5 text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-white">We use cookies</h3>
                  <button
                    onClick={() => accept("essential")}
                    className="sm:hidden text-white/40 hover:text-white/60 transition-colors"
                    aria-label="Dismiss cookie banner"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-white/50 leading-relaxed mb-4">
                  We use essential cookies to keep the platform running and optional analytics
                  cookies to understand how you use Zoobicon so we can improve it. No cross-site
                  tracking.{" "}
                  <Link
                    href="/privacy"
                    className="text-brand-400 hover:text-brand-300 underline underline-offset-2"
                  >
                    Privacy Policy
                  </Link>
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => accept("all")}
                    className="px-4 py-2 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-400 rounded-lg transition-colors"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={() => accept("essential")}
                    className="px-4 py-2 text-xs font-semibold text-white/70 hover:text-white bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] rounded-lg transition-colors"
                  >
                    Essential Only
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
