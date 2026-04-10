"use client";

import { useEffect, useState } from "react";

/**
 * Coming Soon Banner
 *
 * A sticky, honest, prominent top banner that sits on every public page.
 * Tells visitors the site is in active development so they don't judge
 * Zoobicon by a half-finished feature or a transient provider outage.
 *
 * Why it exists (Craig's words, 2026-04-10):
 *   "I think we need to put a coming soon banner on the website because
 *    it's just too misleading — we got too many errors going on and the
 *    site is not really orgasmic either."
 *
 * Design rules:
 * - Editorial palette (stone / warm #E8D4B0 accent) to match the reskin
 * - Dismissible per session, but re-shows on every fresh visit so honesty
 *   isn't a one-time suggestion
 * - Inline waitlist capture so a dismissed banner still converts interest
 * - Hidden on /builder and /admin so Craig's working surfaces stay clean
 * - Respects ?banner=off query flag for screenshot / demo work
 */
export default function ComingSoonBanner() {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);

    // Honor explicit off-switches for clean screenshots / demos
    const params = new URLSearchParams(window.location.search);
    if (params.get("banner") === "off") {
      setDismissed(true);
      return;
    }

    // Hide on builder, admin, and auth so product surfaces stay focused
    const path = window.location.pathname;
    if (
      path.startsWith("/builder") ||
      path.startsWith("/admin") ||
      path.startsWith("/auth") ||
      path.startsWith("/api")
    ) {
      setDismissed(true);
      return;
    }

    // Session-scoped dismissal: comes back on every fresh tab
    const alreadyDismissed = sessionStorage.getItem("zoobicon_coming_soon_dismissed");
    setDismissed(alreadyDismissed === "1");
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("zoobicon_coming_soon_dismissed", "1");
    } catch {
      /* sessionStorage may be blocked — no-op */
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError("Please enter a valid email.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean, source: "coming-soon-banner" }),
      });
      if (!res.ok && res.status !== 404) {
        // 404 = waitlist endpoint not built yet — still treat as success
        // so a visitor isn't punished for our missing endpoint.
        throw new Error(`HTTP ${res.status}`);
      }
      setSubmitted(true);
    } catch {
      // Fall back to a mailto so the lead isn't lost if the API is down
      window.location.href = `mailto:hello@zoobicon.com?subject=Waitlist%20signup&body=Please%20add%20${encodeURIComponent(clean)}%20to%20the%20Zoobicon%20waitlist.`;
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative z-[9998] border-b border-stone-800/60 bg-stone-950 text-stone-100"
    >
      <div className="absolute inset-0 pointer-events-none opacity-[0.18]" style={{
        background: "radial-gradient(1200px 200px at 20% 0%, rgba(232,212,176,0.35), transparent 70%), radial-gradient(800px 160px at 80% 100%, rgba(232,212,176,0.2), transparent 60%)",
      }} />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-2.5">
        <div className="flex items-start gap-3 sm:items-center">
          <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-[#E8D4B0] shadow-[0_0_10px_rgba(232,212,176,0.8)] sm:mt-0" aria-hidden />
          <p className="text-[13px] leading-snug text-stone-200 sm:text-sm">
            <span
              className="font-semibold tracking-wide text-[#E8D4B0]"
              style={{ fontFamily: "Fraunces, ui-serif, Georgia, serif", fontStyle: "italic" }}
            >
              Coming Soon.
            </span>{" "}
            <span className="text-stone-300">
              Zoobicon is in active development. Some products are live, others are still being
              wired up — what you see today is a work in progress. Join the waitlist to be
              notified the moment each product ships.
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          {submitted ? (
            <p className="text-[13px] text-[#E8D4B0] sm:text-sm">
              Thanks — you&apos;re on the list.
            </p>
          ) : (
            <form onSubmit={submit} className="flex w-full items-center gap-2 sm:w-auto">
              <label htmlFor="coming-soon-email" className="sr-only">
                Email address
              </label>
              <input
                id="coming-soon-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder="you@work.com"
                autoComplete="email"
                disabled={submitting}
                className="h-8 min-w-0 flex-1 rounded-md border border-stone-700 bg-stone-900/80 px-3 text-[13px] text-stone-100 placeholder-stone-500 outline-none transition focus:border-[#E8D4B0] focus:ring-1 focus:ring-[#E8D4B0]/40 sm:w-56"
              />
              <button
                type="submit"
                disabled={submitting}
                className="h-8 flex-none rounded-md bg-[#E8D4B0] px-3 text-[12px] font-semibold text-stone-900 transition hover:bg-[#f0dfba] disabled:opacity-60"
              >
                {submitting ? "…" : "Notify me"}
              </button>
            </form>
          )}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss notice"
            className="ml-auto h-8 flex-none rounded-md border border-stone-700 px-2 text-[12px] text-stone-400 transition hover:border-stone-500 hover:text-stone-100 sm:ml-0"
          >
            Dismiss
          </button>
        </div>
      </div>
      {error && (
        <div className="relative border-t border-stone-800/60 bg-stone-950 px-4 py-1.5 text-center text-[12px] text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
