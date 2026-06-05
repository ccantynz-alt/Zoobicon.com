"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cookie,
  X,
} from "lucide-react";
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
          <div
            className="max-w-2xl mx-auto pointer-events-auto rounded-2xl p-5 sm:p-6"
            style={{
              background: "var(--paper-elevated)",
              border: "1px solid var(--rule-strong)",
              boxShadow: "var(--shadow-2)",
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="hidden sm:flex shrink-0 w-10 h-10 rounded-xl items-center justify-center mt-0.5"
                style={{ background: "var(--gold-soft)", border: "1px solid var(--gold)" }}
              >
                <Cookie className="w-5 h-5" style={{ color: "var(--gold-deep)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold" style={{ color: "var(--ink)" }}>We use cookies</h3>
                  <button
                    onClick={() => accept("essential")}
                    className="sm:hidden transition-colors"
                    style={{ color: "var(--ink-muted)" }}
                    aria-label="Dismiss cookie banner"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--ink-secondary)" }}>
                  We use essential cookies to keep the platform running and optional analytics
                  cookies to understand how you use Zoobicon so we can improve it. No cross-site
                  tracking.{" "}
                  <Link
                    href="/privacy"
                    className="underline underline-offset-2"
                    style={{ color: "var(--gold-deep)" }}
                  >
                    Privacy Policy
                  </Link>
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => accept("all")}
                    className="px-4 py-2 text-xs font-semibold rounded-lg transition-all hover:-translate-y-0.5"
                    style={{
                      background: "var(--ink)",
                      color: "var(--paper)",
                      boxShadow: "0 6px 18px -8px rgba(10,10,11,0.35)",
                    }}
                  >
                    Accept All
                  </button>
                  <button
                    onClick={() => accept("essential")}
                    className="px-4 py-2 text-xs font-semibold rounded-lg transition-colors"
                    style={{
                      color: "var(--ink-secondary)",
                      background: "var(--paper)",
                      border: "1px solid var(--rule-strong)",
                    }}
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
