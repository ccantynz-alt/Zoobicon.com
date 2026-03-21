"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie } from "lucide-react";
import Link from "next/link";

const STORAGE_KEY = "zoobicon_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function accept(level: "all" | "essential") {
    localStorage.setItem(STORAGE_KEY, level);
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
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-gray-900/95 backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-4 sm:flex-row sm:gap-6 sm:py-3">
            <div className="flex flex-1 items-center gap-3 text-sm text-zinc-300">
              <Cookie className="hidden h-5 w-5 shrink-0 text-purple-400 sm:block" />
              <p>
                We use cookies to improve your experience and analyze site traffic.{" "}
                <Link href="/privacy" className="underline underline-offset-2 hover:text-white">
                  Privacy Policy
                </Link>
              </p>
            </div>

            <div className="flex shrink-0 gap-3">
              <button
                onClick={() => accept("essential")}
                className="rounded-lg border border-white/20 px-4 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:border-white/40 hover:text-white"
              >
                Essential Only
              </button>
              <button
                onClick={() => accept("all")}
                className="rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 px-4 py-1.5 text-sm font-medium text-white shadow-lg shadow-purple-500/20 transition-opacity hover:opacity-90"
              >
                Accept All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
