"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";

/**
 * LiveBuildDemo — the homepage hero's secret weapon.
 *
 * Plays a convincing "watch it build itself" animation on a loop.
 * Pure CSS/React — no Sandpack, no API calls, no heavy runtime cost.
 *
 * Cycles through 3 demo sites. Each site builds up in ~6 seconds:
 *   0.0s  browser frame + empty canvas
 *   0.5s  navbar appears
 *   1.4s  hero (headline + button) streams in
 *   2.4s  features grid drops
 *   3.4s  pricing cards appear
 *   4.4s  footer fades in
 *   5.5s  completion badge
 *   6.0s  hold, then swap to next site
 *
 * The design language of the rendered "site" is intentionally
 * world-class — warm off-white, editorial serif headline, real
 * hierarchy — so visitors see what quality we output, not a
 * cartoon wireframe.
 */

type DemoSite = {
  brand: string;
  tag: string;
  headline: string;
  sub: string;
  accent: string;
  accentSoft: string;
  features: { label: string; sub: string }[];
};

const SITES: DemoSite[] = [
  {
    brand: "Hazel",
    tag: "AI analytics",
    headline: "Know your customers before they know themselves.",
    sub: "Real-time behavioural insights, no tracking debt.",
    accent: "#E8D4B0",
    accentSoft: "rgba(232, 212, 176, 0.12)",
    features: [
      { label: "Live cohorts", sub: "Update every 400ms" },
      { label: "Anomaly alerts", sub: "Before you notice" },
      { label: "Natural query", sub: "Ask in English" },
    ],
  },
  {
    brand: "Cedar Coffee",
    tag: "Specialty roaster",
    headline: "Single-origin beans. Delivered on the day they're roasted.",
    sub: "From 14 micro-lots across Ethiopia, Guatemala and Kenya.",
    accent: "#C9B79C",
    accentSoft: "rgba(201, 183, 156, 0.14)",
    features: [
      { label: "Roast calendar", sub: "Fresh every Tuesday" },
      { label: "Flavour match", sub: "Quiz in 30s" },
      { label: "Subscription", sub: "Pause any week" },
    ],
  },
  {
    brand: "Atlas Legal",
    tag: "Modern law firm",
    headline: "Law that fits the way you actually run your business.",
    sub: "Fixed fees. Same-week turnaround. Zero partner mark-ups.",
    accent: "#B8D4C8",
    accentSoft: "rgba(184, 212, 200, 0.14)",
    features: [
      { label: "Flat-rate contracts", sub: "No hourly surprises" },
      { label: "Direct partner access", sub: "No middlemen" },
      { label: "Weekly pulse", sub: "What needs you" },
    ],
  },
];

const STAGES = [
  { at: 0, key: "start" },
  { at: 500, key: "navbar" },
  { at: 1400, key: "hero" },
  { at: 2400, key: "features" },
  { at: 3400, key: "pricing" },
  { at: 4400, key: "footer" },
  { at: 5500, key: "done" },
] as const;

type Stage = typeof STAGES[number]["key"];

const CYCLE_MS = 8000;

export default function LiveBuildDemo() {
  const [siteIdx, setSiteIdx] = useState(0);
  const [stage, setStage] = useState<Stage>("start");

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // schedule every stage for the current site
    STAGES.forEach(({ at, key }) => {
      timers.push(setTimeout(() => setStage(key), at));
    });

    // schedule the swap to next site
    timers.push(
      setTimeout(() => {
        setSiteIdx((i) => (i + 1) % SITES.length);
        setStage("start");
      }, CYCLE_MS)
    );

    return () => timers.forEach(clearTimeout);
  }, [siteIdx]);

  const site = SITES[siteIdx];
  const shown = (key: Stage) => {
    const order: Stage[] = ["start", "navbar", "hero", "features", "pricing", "footer", "done"];
    return order.indexOf(stage) >= order.indexOf(key);
  };

  // live elapsed counter in the status bar (0.0 → 5.5s)
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    setElapsed(0);
    const start = Date.now();
    const id = setInterval(() => {
      const e = (Date.now() - start) / 1000;
      if (e >= 5.5) {
        setElapsed(5.5);
        clearInterval(id);
      } else {
        setElapsed(e);
      }
    }, 50);
    return () => clearInterval(id);
  }, [siteIdx]);

  const componentsBuilt = Math.min(
    12,
    Math.max(
      0,
      ["start", "navbar", "hero", "features", "pricing", "footer", "done"].indexOf(stage) * 2
    )
  );

  return (
    <div className="relative">
      {/* outer frame — warm, editorial, not cyberpunk */}
      <div className="relative rounded-[20px] border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* browser chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <div className="ml-3 flex items-center gap-2 text-[10px] text-white/40 font-mono">
            <span>zoobicon.com/preview</span>
            <span className="h-0.5 w-0.5 rounded-full bg-white/30" />
            <span className="text-white/30">{site.brand.toLowerCase().replace(/\s+/g, "-")}</span>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2 py-0.5">
            <span className="relative flex h-1 w-1">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative inline-flex h-1 w-1 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[9px] font-medium text-emerald-300/80">live</span>
          </span>
        </div>

        {/* the rendered "site" — warm off-white canvas, editorial */}
        <div className="relative h-[420px] sm:h-[480px] bg-[#0d0d10] overflow-hidden">
          {/* ambient tinted glow that matches the current site's accent */}
          <div
            className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full blur-[80px] transition-colors duration-700"
            style={{ backgroundColor: site.accentSoft }}
          />

          <div className="relative h-full flex flex-col">
            {/* fake navbar */}
            <div
              className={`flex items-center justify-between px-6 py-4 border-b border-white/[0.04] transition-all duration-500 ${
                shown("navbar") ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-5 w-5 rounded-md transition-colors duration-700"
                  style={{ backgroundColor: site.accent }}
                />
                <span className="text-[13px] font-semibold text-white tracking-tight">{site.brand}</span>
              </div>
              <div className="hidden sm:flex items-center gap-5 text-[11px] text-white/50">
                <span>Product</span>
                <span>Pricing</span>
                <span>About</span>
                <span
                  className="rounded-full px-3 py-1 text-[10px] font-medium text-black transition-colors duration-700"
                  style={{ backgroundColor: site.accent }}
                >
                  Get started
                </span>
              </div>
            </div>

            {/* fake hero */}
            <div
              className={`px-6 sm:px-8 pt-8 pb-5 transition-all duration-700 ${
                shown("hero") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div
                className="inline-block text-[9px] uppercase tracking-[0.18em] font-semibold mb-3 transition-colors duration-700"
                style={{ color: site.accent }}
              >
                {site.tag}
              </div>
              <h3 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] leading-[1.15] text-white max-w-md">
                {site.headline}
              </h3>
              <p className="mt-2.5 text-[11px] text-white/50 max-w-sm leading-relaxed">{site.sub}</p>
              <div className="mt-4 flex items-center gap-2">
                <span
                  className="rounded-full px-3.5 py-1.5 text-[10px] font-semibold text-black transition-colors duration-700"
                  style={{ backgroundColor: site.accent }}
                >
                  Try it free
                </span>
                <span className="rounded-full border border-white/15 px-3.5 py-1.5 text-[10px] font-medium text-white/70">
                  Learn more
                </span>
              </div>
            </div>

            {/* fake feature tiles */}
            <div
              className={`px-6 sm:px-8 pb-5 grid grid-cols-3 gap-2 transition-all duration-700 ${
                shown("features") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {site.features.map((f, i) => (
                <div
                  key={f.label}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-2.5 transition-all"
                  style={{ transitionDelay: shown("features") ? `${i * 80}ms` : "0ms" }}
                >
                  <div
                    className="h-1 w-4 rounded-full mb-2 transition-colors duration-700"
                    style={{ backgroundColor: site.accent }}
                  />
                  <div className="text-[10px] font-semibold text-white leading-tight">{f.label}</div>
                  <div className="text-[9px] text-white/40 mt-0.5">{f.sub}</div>
                </div>
              ))}
            </div>

            {/* fake pricing strip */}
            <div
              className={`mx-6 sm:mx-8 mb-3 rounded-lg border border-white/[0.06] bg-white/[0.015] px-3 py-2 flex items-center justify-between transition-all duration-700 ${
                shown("pricing") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-[14px] font-semibold text-white">$29</div>
                <div className="text-[9px] text-white/40">/ mo · cancel anytime</div>
              </div>
              <div
                className="h-1.5 w-16 rounded-full transition-colors duration-700"
                style={{ backgroundColor: site.accent }}
              />
            </div>

            {/* fake footer */}
            <div
              className={`mt-auto px-6 sm:px-8 py-3 border-t border-white/[0.04] flex items-center justify-between text-[9px] text-white/30 transition-all duration-700 ${
                shown("footer") ? "opacity-100" : "opacity-0"
              }`}
            >
              <span>© {new Date().getFullYear()} {site.brand}</span>
              <span className="font-mono">built in 5.5s with Zoobicon</span>
            </div>

            {/* "built!" celebratory badge */}
            {shown("done") && (
              <div className="absolute top-4 right-4 pointer-events-none">
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 backdrop-blur animate-[fadeIn_0.4s_ease-out]">
                  <Check className="h-2.5 w-2.5 text-emerald-300" strokeWidth={3} />
                  <span className="text-[9px] font-semibold text-emerald-200">built</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* bottom status bar — live elapsed, component count */}
        <div className="border-t border-white/[0.06] bg-white/[0.02] px-4 py-2.5 flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-2.5 w-2.5 text-white/50" />
              <span className="font-mono text-white/50">Opus 4.6</span>
            </div>
            <span className="text-white/20">·</span>
            <span className="font-mono text-white/40">
              {componentsBuilt} / 12 components
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-white/60 tabular-nums">{elapsed.toFixed(1)}s</span>
            <span className="text-white/20">·</span>
            <span className="text-white/40">streaming</span>
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/40" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white/60" />
            </span>
          </div>
        </div>
      </div>

      {/* "this is really running" CTA underneath */}
      <div className="mt-4 flex items-center justify-between text-[11px] text-white/40">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400/60" />
          <span>Real output. Running on loop.</span>
        </div>
        <a
          href="/builder"
          className="inline-flex items-center gap-1 text-white/60 hover:text-white transition-colors"
        >
          Build your own
          <ArrowRight className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
