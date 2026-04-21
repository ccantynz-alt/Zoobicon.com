"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Wand2, Rocket, Check, Loader2, ArrowRight, Building2 } from "lucide-react";
import BackgroundEffects from "@/components/BackgroundEffects";

type Step = "form" | "building" | "ready" | "error";

const THEATRE_MESSAGES = [
  { icon: Sparkles, text: "Crafting your strategy..." },
  { icon: Wand2, text: "Designing your hero section..." },
  { icon: Wand2, text: "Writing your copy..." },
  { icon: Rocket, text: "Building your pages..." },
  { icon: Sparkles, text: "Polishing the details..." },
];

export default function InstantOnboardingPage() {
  const [step, setStep] = useState<Step>("form");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [jobId, setJobId] = useState<string | null>(null);
  const [magicLinkUrl, setMagicLinkUrl] = useState<string | null>(null);
  const [theatreIndex, setTheatreIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const theatreRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (theatreRef.current) clearInterval(theatreRef.current);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (businessName.trim().length < 3) {
      setFormError("Tell us your business name (at least 3 characters).");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/onboarding/instant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          email: email.trim(),
          location: location.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Could not start. Please try again.");
        setSubmitting(false);
        return;
      }

      setJobId(data.jobId);
      setMagicLinkUrl(data.magicLinkUrl);
      setStep("building");
      setSubmitting(false);

      // Theatre messages
      theatreRef.current = setInterval(() => {
        setTheatreIndex((i) => (i + 1) % THEATRE_MESSAGES.length);
      }, 2500);

      // Real polling
      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/onboarding/instant?jobId=${data.jobId}`);
          const j = await r.json();
          if (j.status === "ready") {
            if (pollRef.current) clearInterval(pollRef.current);
            if (theatreRef.current) clearInterval(theatreRef.current);
            setStep("ready");
          } else if (j.status === "error") {
            if (pollRef.current) clearInterval(pollRef.current);
            if (theatreRef.current) clearInterval(theatreRef.current);
            setErrorMessage(j.error || "Something went wrong.");
            setStep("error");
          }
        } catch {
          // Keep polling
        }
      }, 3000);
    } catch {
      setFormError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0a0b14] text-white overflow-hidden">
      <BackgroundEffects />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 sm:py-24">
        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/70 mb-6">
                  <Sparkles className="w-4 h-4 text-stone-400" />
                  Instant onboarding
                </div>
                <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-balance bg-gradient-to-br from-white via-white to-stone-300 bg-clip-text text-transparent mb-6">
                  Your website,<br />already built.
                </h1>
                <p className="text-xl text-white/60 max-w-2xl mx-auto text-balance">
                  Type your business name. By the time you finish reading this sentence, your site is being built. Sign in and it&apos;s waiting for you.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="max-w-2xl mx-auto bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-xl space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    What&apos;s your business called?
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Bob's Plumbing"
                      className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-lg text-white placeholder:text-white/30 focus:outline-none focus:border-stone-400 transition"
                      maxLength={80}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Your email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:border-stone-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Location <span className="text-white/30">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Auckland"
                      className="w-full px-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:border-stone-400 transition"
                    />
                  </div>
                </div>

                {formError && (
                  <div className="text-sm text-stone-300 bg-stone-500/10 border border-stone-500/20 rounded-xl px-4 py-3">
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full group relative inline-flex items-center justify-center gap-3 px-6 py-5 rounded-2xl bg-gradient-to-r from-stone-500 to-stone-500 text-white font-semibold text-lg shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      Build my site now
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-white/50">
                  Free. No credit card. 30 seconds.
                </p>
              </form>
            </motion.div>
          )}

          {step === "building" && (
            <motion.div
              key="building"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-stone-500/20 to-stone-500/20 border border-stone-400/30 mb-8">
                <Loader2 className="w-10 h-10 text-stone-300 animate-spin" />
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance mb-4 bg-gradient-to-br from-white to-stone-300 bg-clip-text text-transparent">
                Building {businessName}
              </h2>
              <p className="text-white/60 text-lg mb-12">
                Hang tight. Your site is assembling itself right now.
              </p>

              <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-xl space-y-4 text-left">
                {THEATRE_MESSAGES.map((msg, i) => {
                  const Icon = msg.icon;
                  const isActive = i === theatreIndex;
                  const isPast = i < theatreIndex;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{
                        opacity: isActive ? 1 : isPast ? 0.5 : 0.25,
                        x: 0,
                      }}
                      transition={{ duration: 0.4 }}
                      className="flex items-center gap-4"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                          isActive
                            ? "bg-stone-500/20 border-stone-400/50"
                            : isPast
                            ? "bg-stone-500/10 border-stone-400/30"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        {isPast ? (
                          <Check className="w-5 h-5 text-stone-400" />
                        ) : (
                          <Icon className={`w-5 h-5 ${isActive ? "text-stone-300" : "text-white/40"}`} />
                        )}
                      </div>
                      <span className={`text-lg ${isActive ? "text-white" : "text-white/60"}`}>
                        {msg.text}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              <p className="text-sm text-white/40 mt-8">
                We already started. You can close this tab and come back — we&apos;ll email you when it&apos;s ready.
              </p>
            </motion.div>
          )}

          {step === "ready" && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-stone-400 to-stone-500 mb-8 shadow-[0_0_60px_rgba(16,185,129,0.5)]"
              >
                <Check className="w-12 h-12 text-white" strokeWidth={3} />
              </motion.div>

              <h2 className="text-5xl sm:text-6xl font-bold tracking-tight text-balance mb-4 bg-gradient-to-br from-white to-stone-300 bg-clip-text text-transparent">
                Your site is ready.
              </h2>
              <p className="text-xl text-white/60 mb-10 text-balance">
                We already built it. Just sign in to see.
              </p>

              <div className="space-y-4">
                <a
                  href={`/builder?onboarding=${jobId}`}
                  className="group inline-flex w-full items-center justify-center gap-3 px-8 py-6 rounded-2xl bg-gradient-to-r from-stone-400 to-stone-500 text-white font-bold text-xl shadow-[0_0_50px_rgba(16,185,129,0.5)] hover:shadow-[0_0_70px_rgba(16,185,129,0.7)] transition-all"
                >
                  View my site
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </a>

                {magicLinkUrl && (
                  <a
                    href={magicLinkUrl}
                    className="block text-white/60 hover:text-white text-sm underline underline-offset-4 transition"
                  >
                    Save it to your account
                  </a>
                )}
              </div>
            </motion.div>
          )}

          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-2xl mx-auto text-center"
            >
              <h2 className="text-4xl font-bold tracking-tight mb-4 text-stone-300">
                Something went wrong.
              </h2>
              <p className="text-white/60 mb-8">{errorMessage}</p>
              <button
                onClick={() => {
                  setStep("form");
                  setErrorMessage(null);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 transition"
              >
                Try again
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
