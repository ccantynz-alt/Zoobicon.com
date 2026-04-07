"use client";

// DomainHookModal — high-conversion post-build domain capture
// TODO: wire DomainHookModal into builder (open after successful generation,
// pass siteName derived from the generated project + generatedFiles for deploy).

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Check,
  Sparkles,
  ArrowRight,
  Loader2,
  Mail,
  Rocket,
  X,
} from "lucide-react";

interface Suggestion {
  domain: string;
  tld: string;
  available: boolean;
  unknown?: boolean;
  price: number;
  recommended: boolean;
}

interface DomainHookModalProps {
  open: boolean;
  onClose: () => void;
  siteName: string;
  generatedFiles?: Record<string, string>;
  onRegister?: (domain: string) => void;
}

export default function DomainHookModal({
  open,
  onClose,
  siteName,
  generatedFiles,
  onRegister,
}: DomainHookModalProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [registering, setRegistering] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !siteName) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/domain-hook/suggest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ siteName }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setSuggestions(data?.suggestions || []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load domain suggestions. Try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, siteName]);

  async function handleRegister(s: Suggestion) {
    if (!s.available) return;
    setRegistering(s.domain);
    setError(null);
    try {
      let email = "";
      try {
        const u = JSON.parse(localStorage.getItem("zoobicon_user") || "{}");
        email = u?.email || "";
      } catch {}

      const [name, ...rest] = s.domain.split(".");
      const tld = rest.join(".");

      const res = await fetch("/api/domains/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          domains: [{ name, tld }],
          registrant: { email },
          years: 1,
        }),
      });
      const data = await res.json();
      if (data?.checkoutUrl) {
        onRegister?.(s.domain);
        window.location.href = data.checkoutUrl;
        return;
      }
      setError(data?.error || "Checkout failed. Please try again.");
    } catch {
      setError("Checkout failed. Please try again.");
    } finally {
      setRegistering(null);
    }
  }

  const recommended = suggestions.find((s) => s.recommended) || suggestions[0];
  const alternates = suggestions.filter((s) => s !== recommended).slice(0, 7);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Animated glow orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-purple-600/30 blur-3xl"
              animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl"
              animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", damping: 24, stiffness: 240 }}
            className="relative w-full max-w-3xl"
          >
            {/* Gradient border wrapper */}
            <div className="relative rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 p-[1.5px] shadow-2xl">
              <div className="relative rounded-2xl bg-[#0b0d14] text-white">
                {/* Close */}
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Header */}
                <div className="border-b border-white/10 px-8 pt-8 pb-6">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-white/80">
                    <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                    Your site is live — claim the domain
                  </div>
                  <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                    Lock in{" "}
                    <span className="bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                      {recommended?.domain || `${siteName}.com`}
                    </span>
                  </h2>
                  <p className="mt-2 max-w-xl text-sm text-white/60">
                    Register the domain, deploy your site, and turn on business email
                    in one step. No DNS wrangling. No hosting setup.
                  </p>
                </div>

                {/* Body */}
                <div className="px-8 py-6">
                  {loading && (
                    <div className="flex items-center justify-center py-12 text-white/60">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Checking availability across 8 TLDs…
                    </div>
                  )}

                  {!loading && recommended && (
                    <div className="mb-6 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02]">
                      <div className="flex items-center justify-between gap-4 p-5">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg">
                            <Globe className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-semibold">{recommended.domain}</span>
                              {recommended.available && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
                                  <Check className="h-3 w-3" /> Available
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-sm text-white/50">
                              ${recommended.price.toFixed(2)}/year · Renews automatically
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRegister(recommended)}
                          disabled={!recommended.available || registering === recommended.domain}
                          className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {registering === recommended.domain ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              Register + Deploy + Email
                              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                            </>
                          )}
                        </button>
                      </div>

                      {/* 3-step preview */}
                      <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 text-xs">
                        <div className="flex items-center gap-2 p-4 text-white/70">
                          <Globe className="h-4 w-4 text-purple-300" />
                          <span>
                            <span className="font-medium text-white">Register</span>
                            <span className="block text-white/40">${recommended.price.toFixed(2)}/yr</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 p-4 text-white/70">
                          <Rocket className="h-4 w-4 text-blue-300" />
                          <span>
                            <span className="font-medium text-white">Deploy</span>
                            <span className="block text-white/40">Free on zoobicon.sh</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 p-4 text-white/70">
                          <Mail className="h-4 w-4 text-cyan-300" />
                          <span>
                            <span className="font-medium text-white">Email</span>
                            <span className="block text-white/40">3 mailboxes free</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {!loading && alternates.length > 0 && (
                    <div>
                      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                        Other options
                      </div>
                      <div className="space-y-2">
                        {alternates.map((s) => (
                          <div
                            key={s.domain}
                            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 transition hover:border-white/20 hover:bg-white/[0.04]"
                          >
                            <div className="flex items-center gap-3">
                              <Globe className="h-4 w-4 text-white/40" />
                              <span className="font-medium">{s.domain}</span>
                              {s.available ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                                  <Check className="h-2.5 w-2.5" /> Available
                                </span>
                              ) : s.unknown ? (
                                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/40">
                                  Checking…
                                </span>
                              ) : (
                                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300">
                                  Taken
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-white/60">
                                ${s.price.toFixed(2)}/yr
                              </span>
                              <button
                                onClick={() => handleRegister(s)}
                                disabled={!s.available || registering === s.domain}
                                className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {registering === s.domain ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    Register
                                    <ArrowRight className="h-3 w-3" />
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!loading && suggestions.length === 0 && (
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-white/60">
                      No suggestions available right now. Try a different site name.
                    </div>
                  )}

                  {error && (
                    <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {error}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-white/10 px-8 py-4 text-xs text-white/40">
                  <span>Authoritative RDAP availability · Powered by OpenSRS</span>
                  <button
                    onClick={onClose}
                    className="font-medium text-white/60 transition hover:text-white"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
