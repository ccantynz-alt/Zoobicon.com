"use client";

/**
 * ZOOBICON — Standalone world-class homepage (deep-ink dark edition).
 *
 * Fully self-contained greenfield build. No dependency on the project's
 * legacy design tokens or the globals.css override layer — every colour is
 * hardcoded via Tailwind arbitrary values so this file can be lifted,
 * reviewed at /preview, and swapped into src/app/page.tsx wholesale.
 *
 * Aesthetic: Stripe / Linear-grade deep ink. Near-black canvas, glassy
 * elevated surfaces, hairline borders, restrained radial glows, fine grid
 * textures, crisp near-white display type, and ONE electric-lime signature
 * accent (#d4f24e, text on lime #161d05) so the brand stays distinctive
 * rather than generic SaaS blue.
 *
 * Type: Plus Jakarta Sans 800 display, Inter body, JetBrains Mono code —
 * all loaded globally in layout.tsx.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Scoped style — fonts, keyframes, reveal-on-scroll, hidden global chrome.
   `body:has(#zb-home)` retires the global nav/footer/backdrop on this route
   so this homepage's own chrome is the only chrome, and paints the page
   near-black before the bundle loads.
   ────────────────────────────────────────────────────────────────────────── */
const SCOPED_CSS = `
/* Hide ALL global chrome on this route — the Coming Soon / Maintenance /
   Staging banners, nav, footer, backdrop, cookie consent — anything that
   isn't this page's own #zb-home wrapper. The previous rule only caught
   <nav>/<footer>, so the sand/gold Coming Soon banner (a <div>) bled through. */
body:has(#zb-home) > *:not(#zb-home):not(:has(#zb-home)) { display: none !important; }
body:has(#zb-home) { background: #08080b !important; }

#zb-home, #zb-home * { box-sizing: border-box; }
#zb-home ::selection { background: #d4f24e; color: #161d05; }
.zbx-d { font-family: 'Plus Jakarta Sans','Inter',system-ui,sans-serif; font-weight: 800; letter-spacing: -0.04em; line-height: 0.98; }
.zbx-d-tight { font-family: 'Plus Jakarta Sans','Inter',system-ui,sans-serif; font-weight: 700; letter-spacing: -0.03em; }
.zbx-b { font-family: 'Inter',system-ui,-apple-system,sans-serif; }
.zbx-m { font-family: 'JetBrains Mono',ui-monospace,'SF Mono',Menlo,monospace; }

.zbx-reveal { opacity: 0; transform: translateY(26px); transition: opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1); will-change: opacity, transform; }
.zbx-reveal.zbx-in { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  .zbx-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
  .zbx-anim { animation: none !important; }
}

@keyframes zbx-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes zbx-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes zbx-blink { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
@keyframes zbx-glow { 0%,100% { opacity: .35; } 50% { opacity: .75; } }
@keyframes zbx-shimmer { 100% { transform: translateX(220%); } }
@keyframes zbx-drop { 0% { opacity: 0; transform: translateY(10px) scale(.98); } 100% { opacity: 1; transform: none; } }
@keyframes zbx-spin { to { transform: rotate(360deg); } }

.zbx-marquee-track { animation: zbx-marquee 34s linear infinite; }
.zbx-float { animation: zbx-float 6s ease-in-out infinite; }
.zbx-cursor { animation: zbx-blink 1s step-end infinite; }
.zbx-drop { animation: zbx-drop .45s cubic-bezier(.16,1,.3,1) both; }
.zbx-grid-fade { -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 38%, #000 38%, transparent 100%); mask-image: radial-gradient(ellipse 80% 70% at 50% 38%, #000 38%, transparent 100%); }
.zbx-scroll-hide::-webkit-scrollbar { display: none; }
.zbx-scroll-hide { scrollbar-width: none; }
.zbx-link-underline { background-image: linear-gradient(#d4f24e,#d4f24e); background-size: 0% 1.5px; background-position: 0 100%; background-repeat: no-repeat; transition: background-size .3s cubic-bezier(.16,1,.3,1); }
.zbx-link-underline:hover { background-size: 100% 1.5px; }
/* subtle top sheen on glass cards */
.zbx-card { background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015)); }
.zbx-card-hover { transition: border-color .3s, transform .3s, box-shadow .3s; }
.zbx-card-hover:hover { border-color: rgba(255,255,255,0.16); transform: translateY(-4px); box-shadow: 0 24px 50px -24px rgba(0,0,0,0.8); }

/* ── Neutralize the legacy globals.css editorial-light override layer ──────────
   The bottom of globals.css (the old Rule 29 "sand & gold" system) repaints
   EVERY text-white / bg-white / border-white utility to dark ink/sand with
   !important — which is why the headlines and card titles were rendering
   near-black on this dark page. We re-assert each utility under the #zb-home
   ID: ID+class specificity outranks the global bare-class selectors, so these
   win even though both carry !important. This keeps the page fully dark-mode
   no matter what the global override does — including after it's promoted to /. */
#zb-home { color: #fff !important; }
#zb-home .text-white { color: #fff !important; }
#zb-home .text-white\\/80 { color: rgba(255,255,255,.80) !important; }
#zb-home .text-white\\/75 { color: rgba(255,255,255,.75) !important; }
#zb-home .text-white\\/70 { color: rgba(255,255,255,.70) !important; }
#zb-home .text-white\\/65 { color: rgba(255,255,255,.65) !important; }
#zb-home .text-white\\/60 { color: rgba(255,255,255,.60) !important; }
#zb-home .text-white\\/55 { color: rgba(255,255,255,.55) !important; }
#zb-home .text-white\\/50 { color: rgba(255,255,255,.50) !important; }
#zb-home .text-white\\/45 { color: rgba(255,255,255,.45) !important; }
#zb-home .text-white\\/40 { color: rgba(255,255,255,.40) !important; }
#zb-home .text-white\\/35 { color: rgba(255,255,255,.35) !important; }
#zb-home .text-white\\/30 { color: rgba(255,255,255,.30) !important; }
#zb-home .text-white\\/20 { color: rgba(255,255,255,.20) !important; }
#zb-home .bg-white { background-color: #fff !important; }
#zb-home .bg-white\\/80 { background-color: rgba(255,255,255,.80) !important; }
#zb-home .bg-white\\/40 { background-color: rgba(255,255,255,.40) !important; }
#zb-home .bg-white\\/30 { background-color: rgba(255,255,255,.30) !important; }
#zb-home .bg-white\\/25 { background-color: rgba(255,255,255,.25) !important; }
#zb-home .bg-white\\/20 { background-color: rgba(255,255,255,.20) !important; }
#zb-home .bg-white\\/15 { background-color: rgba(255,255,255,.15) !important; }
#zb-home .bg-white\\/10 { background-color: rgba(255,255,255,.10) !important; }
#zb-home .bg-white\\/8  { background-color: rgba(255,255,255,.08) !important; }
#zb-home .bg-white\\/5  { background-color: rgba(255,255,255,.05) !important; }
#zb-home .border-white\\/15 { border-color: rgba(255,255,255,.15) !important; }
#zb-home .border-white\\/12 { border-color: rgba(255,255,255,.12) !important; }
#zb-home .border-white\\/10 { border-color: rgba(255,255,255,.10) !important; }
#zb-home .border-white\\/8  { border-color: rgba(255,255,255,.08) !important; }
#zb-home .from-white { --tw-gradient-from: #fff var(--tw-gradient-from-position) !important; --tw-gradient-to: rgba(255,255,255,0) var(--tw-gradient-to-position) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
#zb-home .via-white\\/12 { --tw-gradient-to: rgba(255,255,255,0) var(--tw-gradient-to-position) !important; --tw-gradient-stops: var(--tw-gradient-from), rgba(255,255,255,.12) var(--tw-gradient-via-position), var(--tw-gradient-to) !important; }
#zb-home .via-white\\/10 { --tw-gradient-to: rgba(255,255,255,0) var(--tw-gradient-to-position) !important; --tw-gradient-stops: var(--tw-gradient-from), rgba(255,255,255,.10) var(--tw-gradient-via-position), var(--tw-gradient-to) !important; }
`;

/* ── reveal-on-scroll: one observer for the whole page ───────────────────── */
function useReveal() {
  useEffect(() => {
    const root = document.getElementById("zb-home");
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>(".zbx-reveal"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("zbx-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("zbx-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ── inline icon set (no dependency) ─────────────────────────────────────── */
type IconProps = { className?: string };
const I = {
  bolt: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} aria-hidden>
      <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  arrow: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  play: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} aria-hidden>
      <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 8.5 16 12l-6 3.5v-7Z" fill="currentColor" />
    </svg>
  ),
  check: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} aria-hidden>
      <path d="m5 12.5 4.2 4.5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  layers: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} aria-hidden>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m3 13 9 5 9-5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  gauge: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} aria-hidden>
      <path d="M4 18a8 8 0 1 1 16 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 18 16 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  chat: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} aria-hidden>
      <path d="M4 5h16v11H9l-5 4V5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  globe: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  shield: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} aria-hidden>
      <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  code: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} aria-hidden>
      <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  spark: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} aria-hidden>
      <path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  chevron: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} aria-hidden>
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/* ── brand wordmark ──────────────────────────────────────────────────────── */
function Wordmark() {
  return (
    <a href="/" className="group inline-flex items-center gap-2.5 select-none">
      <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#d4f24e]">
        <span className="zbx-d text-[15px] text-[#161d05]">z</span>
      </span>
      <span className="zbx-d-tight text-[18px] text-white">zoobicon</span>
    </a>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   FLOATING NAVIGATION
   ══════════════════════════════════════════════════════════════════════════ */
const PLATFORM_MENU = [
  { icon: I.spark, title: "AI Builder", body: "Describe it — six agents ship a real React site in ~60s." },
  { icon: I.layers, title: "Component Registry", body: "118 slot-locked sections, every one agency-grade." },
  { icon: I.chat, title: "Chat Editing", body: "“Make the hero darker” re-renders in ~2 seconds." },
  { icon: I.globe, title: "Hosting & Domains", body: "Live URL + custom domain provisioned at deploy." },
];
const DOCS_MENU = [
  { title: "Quickstart", body: "Your first site in five minutes." },
  { title: "Prompting guide", body: "How to brief the agents like a creative director." },
  { title: "Export & self-host", body: "Take the React + Tailwind codebase anywhere." },
  { title: "API reference", body: "Programmatic builds on the Agency tier." },
];

function FloatingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<null | "platform" | "docs">(null);
  const [mobile, setMobile] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={navRef} className="fixed inset-x-0 top-0 z-[120] flex justify-center px-4 pt-3 sm:pt-4">
      <div
        className={`zbx-b w-full max-w-6xl rounded-2xl border transition-all duration-300 ${
          scrolled || open
            ? "border-white/10 bg-[#0c0c10]/80 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
        onMouseLeave={() => setOpen(null)}
      >
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-5">
          <Wordmark />

          {/* desktop links */}
          <nav className="hidden items-center gap-1 md:flex">
            <button
              onMouseEnter={() => setOpen("platform")}
              onClick={() => setOpen(open === "platform" ? null : "platform")}
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors ${
                open === "platform" ? "text-white" : "text-white/60 hover:text-white"
              }`}
            >
              Platform <I.chevron className={`h-3.5 w-3.5 transition-transform ${open === "platform" ? "rotate-180" : ""}`} />
            </button>
            <button
              onMouseEnter={() => setOpen("docs")}
              onClick={() => setOpen(open === "docs" ? null : "docs")}
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors ${
                open === "docs" ? "text-white" : "text-white/60 hover:text-white"
              }`}
            >
              Docs <I.chevron className={`h-3.5 w-3.5 transition-transform ${open === "docs" ? "rotate-180" : ""}`} />
            </button>
            <a href="/pricing" onMouseEnter={() => setOpen(null)} className="rounded-lg px-3 py-2 text-[14px] font-medium text-white/60 transition-colors hover:text-white">
              Pricing
            </a>
          </nav>

          {/* desktop ctas */}
          <div className="hidden items-center gap-2 md:flex">
            <a href="/auth/login" className="rounded-lg px-3 py-2 text-[14px] font-medium text-white/60 transition-colors hover:text-white">
              Sign in
            </a>
            <a
              href="/builder"
              className="group inline-flex items-center gap-1.5 rounded-lg bg-[#d4f24e] px-4 py-2 text-[14px] font-bold text-[#161d05] transition-transform hover:-translate-y-0.5"
            >
              Start building
              <I.arrow className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          {/* mobile toggle */}
          <button onClick={() => setMobile((v) => !v)} className="md:hidden rounded-lg p-2 text-white" aria-label="Menu">
            <div className="flex flex-col gap-1.5">
              <span className={`h-0.5 w-5 bg-current transition-transform ${mobile ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`h-0.5 w-5 bg-current transition-opacity ${mobile ? "opacity-0" : ""}`} />
              <span className={`h-0.5 w-5 bg-current transition-transform ${mobile ? "-translate-y-2 -rotate-45" : ""}`} />
            </div>
          </button>
        </div>

        {/* desktop mega dropdown */}
        {open && (
          <div className="zbx-drop hidden border-t border-white/10 p-3 md:block">
            {open === "platform" ? (
              <div className="grid grid-cols-2 gap-1">
                {PLATFORM_MENU.map((m) => (
                  <a key={m.title} href="/builder" className="group flex gap-3 rounded-xl p-3 transition-colors hover:bg-white/5">
                    <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-white/[0.06] text-[#d4f24e] ring-1 ring-white/10">
                      <m.icon className="h-[18px] w-[18px]" />
                    </span>
                    <span>
                      <span className="block text-[14px] font-semibold text-white">{m.title}</span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-white/50">{m.body}</span>
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {DOCS_MENU.map((m) => (
                  <a key={m.title} href="/builder" className="group rounded-xl p-3 transition-colors hover:bg-white/5">
                    <span className="block text-[14px] font-semibold text-white">{m.title}</span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-white/50">{m.body}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* mobile sheet */}
        {mobile && (
          <div className="zbx-drop border-t border-white/10 p-3 md:hidden">
            {["Platform", "Docs", "Pricing"].map((l) => (
              <a key={l} href={l === "Pricing" ? "/pricing" : "/builder"} className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-white">
                {l}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 px-1">
              <a href="/auth/login" className="rounded-lg border border-white/15 px-4 py-2.5 text-center text-[14px] font-semibold text-white">
                Sign in
              </a>
              <a href="/builder" className="rounded-lg bg-[#d4f24e] px-4 py-2.5 text-center text-[14px] font-bold text-[#161d05]">
                Start building
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   HERO + animated builder mockup
   ══════════════════════════════════════════════════════════════════════════ */
const HERO_SECTIONS = ["Navbar", "Hero", "Feature grid", "Pricing", "Footer"];

function BuilderMockup() {
  const [built, setBuilt] = useState(0);
  const [phase, setPhase] = useState<"typing" | "building" | "live">("typing");

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      t = setTimeout(() => setPhase("building"), 1400);
    } else if (phase === "building") {
      if (built < HERO_SECTIONS.length) {
        t = setTimeout(() => setBuilt((b) => b + 1), 560);
      } else {
        t = setTimeout(() => setPhase("live"), 700);
      }
    } else {
      t = setTimeout(() => {
        setBuilt(0);
        setPhase("typing");
      }, 3200);
    }
    return () => clearTimeout(t);
  }, [phase, built]);

  return (
    <div className="zbx-float relative w-full max-w-[520px]">
      <div className="zbx-anim pointer-events-none absolute -inset-6 -z-10 rounded-[32px] bg-[#d4f24e]/15 blur-3xl" style={{ animation: "zbx-glow 5s ease-in-out infinite" }} />
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e12] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <div className="ml-3 flex h-6 flex-1 items-center rounded-md bg-white/5 px-3">
            <span className="zbx-m text-[11px] text-white/40">zoobicon.com/builder</span>
          </div>
          <span className={`zbx-m rounded-md px-2 py-1 text-[10px] font-medium ${phase === "live" ? "bg-[#d4f24e] text-[#161d05]" : "bg-white/10 text-white/50"}`}>
            {phase === "live" ? "● LIVE" : "building"}
          </span>
        </div>

        <div className="grid grid-cols-[120px_1fr]">
          {/* prompt rail */}
          <div className="border-r border-white/10 p-3">
            <div className="zbx-m text-[10px] uppercase tracking-wider text-white/30">Prompt</div>
            <div className="mt-2 rounded-lg bg-white/5 p-2.5 text-[11px] leading-snug text-white/70">
              A bold landing page for a fintech app called Nova
              {phase === "typing" && <span className="zbx-cursor ml-0.5 inline-block h-3 w-[2px] translate-y-0.5 bg-[#d4f24e]" />}
            </div>
            <div className="mt-3 space-y-1.5">
              {HERO_SECTIONS.map((s, i) => (
                <div key={s} className="flex items-center gap-1.5">
                  <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-[4px] ${i < built ? "bg-[#d4f24e] text-[#161d05]" : "bg-white/10 text-transparent"}`}>
                    <I.check className="h-2.5 w-2.5" />
                  </span>
                  <span className={`text-[10px] ${i < built ? "text-white/70" : "text-white/30"}`}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* live canvas */}
          <div className="relative min-h-[260px] bg-[#08080b] p-3">
            {phase === "building" && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animation: "zbx-shimmer 1.4s ease-in-out infinite" }} />
              </div>
            )}
            <div className="space-y-2.5">
              {built >= 1 && (
                <div className="zbx-drop flex items-center justify-between rounded-lg bg-white/5 px-2.5 py-1.5">
                  <div className="h-2 w-10 rounded bg-[#d4f24e]" />
                  <div className="flex gap-1.5">{[0, 1, 2].map((k) => <div key={k} className="h-2 w-6 rounded bg-white/15" />)}</div>
                </div>
              )}
              {built >= 2 && (
                <div className="zbx-drop rounded-lg bg-gradient-to-br from-white/[0.07] to-transparent p-3">
                  <div className="h-3 w-3/4 rounded bg-white/80" />
                  <div className="mt-1.5 h-3 w-1/2 rounded bg-[#d4f24e]" />
                  <div className="mt-2.5 h-1.5 w-full rounded bg-white/15" />
                  <div className="mt-1 h-1.5 w-4/5 rounded bg-white/15" />
                  <div className="mt-2.5 inline-flex h-5 items-center rounded-md bg-[#d4f24e] px-2 text-[8px] font-bold text-[#161d05]">Get started</div>
                </div>
              )}
              {built >= 3 && (
                <div className="zbx-drop grid grid-cols-3 gap-1.5">
                  {[0, 1, 2].map((k) => (
                    <div key={k} className="rounded-lg bg-white/5 p-2">
                      <div className="h-4 w-4 rounded bg-[#d4f24e]/70" />
                      <div className="mt-1.5 h-1.5 w-full rounded bg-white/20" />
                      <div className="mt-1 h-1.5 w-2/3 rounded bg-white/15" />
                    </div>
                  ))}
                </div>
              )}
              {built >= 4 && (
                <div className="zbx-drop flex gap-1.5">
                  {[0, 1, 2].map((k) => (
                    <div key={k} className={`flex-1 rounded-lg p-2 ${k === 1 ? "bg-[#d4f24e]/15 ring-1 ring-[#d4f24e]/40" : "bg-white/5"}`}>
                      <div className="h-3 w-8 rounded bg-white/40" />
                      <div className="mt-1 h-1.5 w-full rounded bg-white/15" />
                    </div>
                  ))}
                </div>
              )}
              {built >= 5 && (
                <div className="zbx-drop flex items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-1.5">
                  <div className="h-2 w-8 rounded bg-white/30" />
                  <div className="flex gap-1">{[0, 1, 2, 3].map((k) => <div key={k} className="h-2 w-2 rounded-full bg-white/20" />)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* floating deploy chip */}
      <div className={`absolute -bottom-4 -right-3 flex items-center gap-2 rounded-xl border border-white/10 bg-[#13131a] px-3 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.5)] transition-all duration-500 ${phase === "live" ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#d4f24e] text-[#161d05]">
          <I.globe className="h-3.5 w-3.5" />
        </span>
        <span className="zbx-b">
          <span className="block text-[11px] font-semibold leading-none text-white">Deployed</span>
          <span className="zbx-m block text-[10px] text-white/45">nova.zoobicon.app</span>
        </span>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 sm:pt-32">
      {/* grid texture */}
      <div
        className="zbx-grid-fade pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-[-60px] h-[460px] w-[760px] -translate-x-1/2 rounded-full bg-[#d4f24e]/10 blur-[130px]" />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 pb-20 sm:pb-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        {/* copy */}
        <div className="zbx-reveal">
          <a href="/builder" className="zbx-b inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 py-1.5 pl-1.5 pr-3.5 text-[13px] text-white/80 backdrop-blur">
            <span className="rounded-full bg-[#d4f24e] px-2 py-0.5 text-[11px] font-bold text-[#161d05]">NEW</span>
            Streaming preview — first paint in under 2 seconds
            <I.arrow className="h-3.5 w-3.5 text-[#d4f24e]" />
          </a>

          <h1 className="zbx-d mt-6 text-[44px] text-white sm:text-[60px] lg:text-[68px]">
            Describe it.
            <br />
            Watch it build.
            <br />
            <span className="relative inline-block">
              <span className="relative z-10 text-[#d4f24e]">Ship it.</span>
            </span>
          </h1>

          <p className="zbx-b mt-6 max-w-xl text-[17px] leading-relaxed text-white/60 sm:text-[19px]">
            Zoobicon is the AI website builder that ships a <span className="text-white">production-ready React site</span> — not a throwaway export. Six agents collaborate live in your browser, assemble from 118 agency-grade components, and hand you a real codebase with hosting and a domain in the same flow.
          </p>

          <div className="zbx-b mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="/builder"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#d4f24e] px-6 py-3.5 text-[16px] font-bold text-[#161d05] shadow-[0_8px_30px_rgba(212,242,78,0.28)] transition-transform hover:-translate-y-0.5"
            >
              Start building free
              <I.arrow className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="/builder"
              className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/5 px-6 py-3.5 text-[16px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
            >
              <I.play className="h-[18px] w-[18px] text-[#d4f24e]" />
              Watch a 60-second build
            </a>
          </div>

          <div className="zbx-b mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-white/45">
            <span className="inline-flex items-center gap-1.5"><I.check className="h-4 w-4 text-[#d4f24e]" /> No credit card</span>
            <span className="inline-flex items-center gap-1.5"><I.check className="h-4 w-4 text-[#d4f24e]" /> Export the real code</span>
            <span className="inline-flex items-center gap-1.5"><I.check className="h-4 w-4 text-[#d4f24e]" /> Live URL in one click</span>
          </div>
        </div>

        {/* mockup */}
        <div className="zbx-reveal flex justify-center lg:justify-end" style={{ transitionDelay: "120ms" }}>
          <BuilderMockup />
        </div>
      </div>

      {/* niche marquee — honest: categories, not fake customer logos */}
      <div className="relative border-y border-white/8 py-5">
        <p className="zbx-b mb-3 text-center text-[12px] uppercase tracking-[0.22em] text-white/35">One prompt builds any of these</p>
        <div className="zbx-scroll-hide relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
          <div className="zbx-marquee-track flex w-max gap-3">
            {[...NICHES, ...NICHES].map((n, i) => (
              <span key={i} className="zbx-m whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[13px] text-white/55">
                {n}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const NICHES = [
  "SaaS landing page", "Restaurant", "Photographer portfolio", "Law firm", "Fitness coach",
  "E-commerce store", "Real estate", "Dental clinic", "Startup pitch", "Agency", "Hotel",
  "Newsletter", "Course launch", "Nonprofit", "Personal brand",
];

/* ══════════════════════════════════════════════════════════════════════════
   CORE PIPELINE — six-agent orchestration (the actual differentiator)
   ══════════════════════════════════════════════════════════════════════════ */
const AGENTS = [
  { name: "Strategist", role: "Reads intent, picks the page architecture" },
  { name: "Brand Designer", role: "Palette, type pairing, visual tone" },
  { name: "Architect", role: "Selects slot-locked sections from the registry" },
  { name: "Copywriter", role: "Writes conversion copy for every block" },
  { name: "Developer", role: "Assembles real React + Tailwind, hydrates live" },
  { name: "SEO Agent", role: "Meta, schema, semantic structure, a11y" },
];

function Pipeline() {
  return (
    <section className="relative py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
      <div className="mx-auto max-w-6xl px-5">
        <div className="zbx-reveal mx-auto max-w-2xl text-center">
          <span className="zbx-b inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-wider text-white/70">
            <I.spark className="h-3.5 w-3.5 text-[#d4f24e]" /> The pipeline
          </span>
          <h2 className="zbx-d mt-5 text-[34px] text-white sm:text-[46px]">
            Not one model guessing.
            <br />
            <span className="text-[#d4f24e]">Six agents collaborating.</span>
          </h2>
          <p className="zbx-b mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-white/60">
            Single-shot builders dump one blob and hope. Zoobicon runs a coordinated team — each agent does one job well, and the work streams into your preview as it lands.
          </p>
        </div>

        <div className="zbx-reveal mt-14" style={{ transitionDelay: "80ms" }}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AGENTS.map((a, i) => (
              <div
                key={a.name}
                className="zbx-card zbx-card-hover group relative overflow-hidden rounded-2xl border border-white/10 p-5"
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#d4f24e]/0 blur-2xl transition-colors duration-500 group-hover:bg-[#d4f24e]/20" />
                <div className="flex items-center justify-between">
                  <span className="zbx-m text-[12px] font-medium text-white/35">AGENT {String(i + 1).padStart(2, "0")}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d4f24e] text-[#161d05]">
                    <span className="zbx-d text-[13px]">{i + 1}</span>
                  </span>
                </div>
                <h3 className="zbx-d-tight mt-4 text-[20px] text-white">{a.name}</h3>
                <p className="zbx-b mt-1.5 text-[14px] leading-snug text-white/55">{a.role}</p>
              </div>
            ))}
          </div>

          {/* result bar */}
          <div className="mt-3 flex flex-col items-stretch gap-3 overflow-hidden rounded-2xl border border-[#d4f24e]/30 bg-[#d4f24e]/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4f24e] text-[#161d05]">
                <I.bolt className="h-5 w-5" />
              </span>
              <div>
                <p className="zbx-d-tight text-[18px] text-white">A production-ready site — in ~60 seconds</p>
                <p className="zbx-b text-[14px] text-white/55">Streamed section-by-section, hydrated to real interactive React.</p>
              </div>
            </div>
            <a href="/builder" className="zbx-b inline-flex flex-none items-center justify-center gap-1.5 rounded-xl bg-[#d4f24e] px-5 py-2.5 text-[15px] font-bold text-[#161d05] transition-transform hover:-translate-y-0.5">
              See it run <I.arrow className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   FEATURES BENTO MATRIX
   ══════════════════════════════════════════════════════════════════════════ */
function Bento() {
  return (
    <section className="pb-24 sm:pb-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="zbx-reveal mx-auto mb-12 max-w-2xl text-center">
          <h2 className="zbx-d text-[34px] text-white sm:text-[46px]">Everything serious builders ask for</h2>
          <p className="zbx-b mx-auto mt-4 max-w-lg text-[17px] text-white/60">
            Speed, real code, and a finish that looks like a $100K agency built it — without the agency.
          </p>
        </div>

        <div className="zbx-reveal grid grid-cols-1 gap-3 md:grid-cols-6 md:grid-rows-2">
          {/* big — registry */}
          <div className="zbx-card group relative overflow-hidden rounded-3xl border border-white/10 p-7 md:col-span-3 md:row-span-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4f24e] text-[#161d05]">
              <I.layers className="h-[22px] w-[22px]" />
            </span>
            <h3 className="zbx-d-tight mt-5 text-[24px] text-white">118-component registry, slot-locked</h3>
            <p className="zbx-b mt-2 max-w-md text-[15px] leading-relaxed text-white/55">
              Every site is assembled from hand-built, agency-grade sections — bento grids, spotlight cards, animated stats. The AI fills the copy; it can&apos;t break the layout. Consistent quality, every single build.
            </p>
            <div className="mt-6 grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, k) => (
                <div key={k} className={`h-12 rounded-lg border border-white/10 ${k % 3 === 0 ? "bg-[#d4f24e]/20" : k % 3 === 1 ? "bg-white/[0.06]" : "bg-white/[0.03]"}`}>
                  <div className={`m-2 h-1.5 w-1/2 rounded ${k % 3 === 0 ? "bg-[#d4f24e]" : "bg-white/25"}`} />
                </div>
              ))}
            </div>
          </div>

          {/* perf */}
          <div className="zbx-card rounded-3xl border border-white/10 p-7 md:col-span-3">
            <div className="flex items-start justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-[#d4f24e] ring-1 ring-white/10">
                <I.gauge className="h-[22px] w-[22px]" />
              </span>
              <div className="text-right">
                <p className="zbx-d text-[40px] leading-none text-[#d4f24e]">&lt;2s</p>
                <p className="zbx-b text-[13px] text-white/50">first paint</p>
              </div>
            </div>
            <h3 className="zbx-d-tight mt-5 text-[22px] text-white">Streaming, not spinning</h3>
            <p className="zbx-b mt-2 text-[15px] leading-relaxed text-white/55">
              The page renders from base components instantly, then each section hot-swaps as the AI tailors it. You never stare at a loader.
            </p>
          </div>

          {/* chat edit */}
          <div className="zbx-card rounded-3xl border border-white/10 p-7 md:col-span-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-[#d4f24e] ring-1 ring-white/10">
              <I.chat className="h-[22px] w-[22px]" />
            </span>
            <h3 className="zbx-d-tight mt-5 text-[22px] text-white">Edit by chatting</h3>
            <p className="zbx-b mt-2 text-[15px] leading-relaxed text-white/55">
              &ldquo;Make the hero darker.&rdquo; &ldquo;Punchier pricing copy.&rdquo; One section re-renders in ~2 seconds — no full rebuild, no lost work.
            </p>
          </div>
        </div>

        {/* second row — three even cards */}
        <div className="zbx-reveal mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3" style={{ transitionDelay: "60ms" }}>
          {[
            { icon: I.code, t: "Real, exportable code", b: "React + Tailwind you own. Export and self-host anywhere — zero lock-in." },
            { icon: I.globe, t: "Domain in checkout", b: "Buy the matching domain in the same flow. Hosting + SSL provisioned at deploy." },
            { icon: I.shield, t: "Shipped to last", b: "Multi-judge critique regenerates weak sections before you ever see them." },
          ].map((c) => (
            <div key={c.t} className="zbx-card zbx-card-hover group rounded-3xl border border-white/10 p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-white/80 ring-1 ring-white/10 transition-colors group-hover:bg-[#d4f24e] group-hover:text-[#161d05]">
                <c.icon className="h-[22px] w-[22px]" />
              </span>
              <h3 className="zbx-d-tight mt-5 text-[19px] text-white">{c.t}</h3>
              <p className="zbx-b mt-2 text-[14px] leading-relaxed text-white/55">{c.b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   INTERACTIVE PLAYGROUND — pick a brief, run the build, see the preview
   ══════════════════════════════════════════════════════════════════════════ */
type Preset = {
  id: string;
  label: string;
  prompt: string;
  accent: string;
  title: string;
  tagline: string;
  cta: string;
  log: string[];
};

const PRESETS: Preset[] = [
  {
    id: "saas",
    label: "SaaS",
    prompt: "A bold landing page for Nova, an AI analytics platform for product teams.",
    accent: "#d4f24e",
    title: "Ship features your users actually use.",
    tagline: "Nova turns product analytics into one clear next move.",
    cta: "Start free",
    log: [
      "strategist  ▸ intent: B2B SaaS · goal: trial signups",
      "designer    ▸ palette: ink + electric lime · type: Jakarta/Inter",
      "architect   ▸ sections: nav · hero · logos · bento · pricing · cta",
      "copywriter  ▸ 7 blocks written · headline A/B scored",
      "developer   ▸ assembled 14 components · hydrated ✓",
      "seo         ▸ schema + meta + a11y pass ✓",
    ],
  },
  {
    id: "restaurant",
    label: "Restaurant",
    prompt: "An elegant site for Saffron, a modern Indian restaurant with online booking.",
    accent: "#f2a93b",
    title: "Modern Indian, served with intention.",
    tagline: "Saffron — seasonal plates, natural wine, a table waiting for you.",
    cta: "Book a table",
    log: [
      "strategist  ▸ intent: local hospitality · goal: reservations",
      "designer    ▸ palette: charcoal + saffron · warm serif accents",
      "architect   ▸ sections: nav · hero · menu · gallery · booking · map",
      "copywriter  ▸ menu voice tuned · booking CTA sharpened",
      "developer   ▸ assembled 12 components · hydrated ✓",
      "seo         ▸ LocalBusiness schema + hours + geo ✓",
    ],
  },
  {
    id: "portfolio",
    label: "Portfolio",
    prompt: "A striking portfolio for Mara Lee, a product designer, with case studies.",
    accent: "#7c9cff",
    title: "Design that earns the second look.",
    tagline: "Mara Lee — product design for teams who sweat the details.",
    cta: "View work",
    log: [
      "strategist  ▸ intent: personal brand · goal: inbound leads",
      "designer    ▸ palette: ink + indigo · editorial whitespace",
      "architect   ▸ sections: nav · hero · work grid · about · contact",
      "copywriter  ▸ case-study summaries · contact CTA written",
      "developer   ▸ assembled 11 components · hydrated ✓",
      "seo         ▸ Person schema + OG cards + sitemap ✓",
    ],
  },
];

function Playground() {
  const [active, setActive] = useState(0);
  const [tab, setTab] = useState<"build" | "preview">("preview");
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<number>(PRESETS[0].log.length);
  const preset = PRESETS[active];
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const run = useCallback((idx: number) => {
    clearTimers();
    setActive(idx);
    setTab("build");
    setRunning(true);
    setLines(0);
    const p = PRESETS[idx];
    p.log.forEach((_, i) => {
      timers.current.push(
        setTimeout(() => {
          setLines(i + 1);
          if (i === p.log.length - 1) {
            timers.current.push(
              setTimeout(() => {
                setRunning(false);
                setTab("preview");
              }, 650)
            );
          }
        }, 480 * (i + 1))
      );
    });
  }, []);

  useEffect(() => () => clearTimers(), []);

  return (
    <section className="relative py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
      <div className="mx-auto max-w-6xl px-5">
        <div className="zbx-reveal mx-auto mb-12 max-w-2xl text-center">
          <span className="zbx-b inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-wider text-white/70">
            <I.play className="h-3.5 w-3.5 text-[#d4f24e]" /> Live playground
          </span>
          <h2 className="zbx-d mt-5 text-[34px] text-white sm:text-[46px]">Try a build right here</h2>
          <p className="zbx-b mx-auto mt-4 max-w-lg text-[17px] text-white/60">
            Pick a brief, hit generate, and watch the agents work. This is the real flow — just sped up for the demo.
          </p>
        </div>

        <div className="zbx-reveal overflow-hidden rounded-3xl border border-white/10 bg-[#0e0e12] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.8)]">
          {/* brief picker */}
          <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center">
            <span className="zbx-m text-[11px] uppercase tracking-wider text-white/35">Brief</span>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => run(i)}
                  className={`zbx-b rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    active === i ? "bg-[#d4f24e] text-[#161d05]" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => run(active)}
              disabled={running}
              className="zbx-b ml-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-4 py-1.5 text-[13px] font-bold text-[#0b0b0d] transition-opacity disabled:opacity-50"
            >
              {running ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-[#0b0b0d]/30 border-t-[#0b0b0d]" style={{ animation: "zbx-spin .7s linear infinite" }} />
                  Building…
                </>
              ) : (
                <>
                  <I.bolt className="h-4 w-4" /> Generate
                </>
              )}
            </button>
          </div>

          {/* prompt line */}
          <div className="border-b border-white/10 px-4 py-3">
            <p className="zbx-m text-[13px] leading-snug text-white/70">
              <span className="text-[#d4f24e]">prompt&gt;</span> {preset.prompt}
            </p>
          </div>

          {/* tabs */}
          <div className="flex border-b border-white/10">
            {(["preview", "build"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`zbx-b relative px-5 py-2.5 text-[13px] font-medium capitalize transition-colors ${
                  tab === t ? "text-white" : "text-white/40 hover:text-white/70"
                }`}
              >
                {t === "build" ? "Build log" : "Live preview"}
                {tab === t && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[#d4f24e]" />}
              </button>
            ))}
          </div>

          {/* panel */}
          <div className="min-h-[340px]">
            {tab === "build" ? (
              <div className="zbx-m p-5 text-[13px] leading-relaxed">
                <p className="text-white/30">$ zoobicon build --stream</p>
                {preset.log.slice(0, lines).map((l, i) => (
                  <p key={i} className="zbx-drop mt-1.5 text-white/75">
                    <span className="text-[#d4f24e]">✓</span> {l}
                  </p>
                ))}
                {running && lines < preset.log.length && (
                  <p className="mt-1.5 text-white/40">
                    <span className="zbx-cursor inline-block">▌</span>
                  </p>
                )}
                {!running && lines === preset.log.length && (
                  <p className="zbx-drop mt-3 inline-flex items-center gap-2 rounded-lg bg-[#d4f24e]/15 px-3 py-1.5 text-[#d4f24e]">
                    <I.check className="h-4 w-4" /> Build complete — deployed to preview
                  </p>
                )}
              </div>
            ) : (
              <PreviewMock preset={preset} />
            )}
          </div>
        </div>
        <p className="zbx-b mt-4 text-center text-[13px] text-white/40">
          Like what you see?{" "}
          <a href="/builder" className="zbx-link-underline font-semibold text-[#d4f24e]">
            Build the real thing →
          </a>
        </p>
      </div>
    </section>
  );
}

function PreviewMock({ preset }: { preset: Preset }) {
  return (
    <div className="p-4">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#08080b]">
        <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.03] px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <div className="zbx-m ml-2 flex h-5 flex-1 items-center rounded bg-white/5 px-2 text-[10px] text-white/40">
            {preset.id}.zoobicon.app
          </div>
        </div>
        {/* rendered hero */}
        <div className="relative px-5 py-6 sm:px-8 sm:py-9">
          <div className="flex items-center justify-between">
            <span className="zbx-d-tight text-[14px] text-white">{preset.label}.</span>
            <div className="hidden gap-3 sm:flex">
              {["Product", "Pricing", "About"].map((x) => (
                <span key={x} className="zbx-b text-[11px] text-white/45">{x}</span>
              ))}
              <span className="zbx-b rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ background: preset.accent, color: "#161d05" }}>
                {preset.cta}
              </span>
            </div>
          </div>
          <div className="mt-6 max-w-md">
            <h3 className="zbx-d text-[26px] leading-[1.04] text-white sm:text-[32px]">{preset.title}</h3>
            <p className="zbx-b mt-3 text-[13px] leading-snug text-white/55">{preset.tagline}</p>
            <div className="mt-5 flex gap-2">
              <span className="zbx-b inline-flex items-center rounded-lg px-3.5 py-2 text-[12px] font-bold" style={{ background: preset.accent, color: "#161d05" }}>
                {preset.cta}
              </span>
              <span className="zbx-b inline-flex items-center rounded-lg border border-white/15 px-3.5 py-2 text-[12px] font-semibold text-white">
                Learn more
              </span>
            </div>
          </div>
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full blur-3xl" style={{ background: preset.accent, opacity: 0.16 }} />
        </div>
        {/* feature strip */}
        <div className="grid grid-cols-3 gap-px bg-white/10">
          {[0, 1, 2].map((k) => (
            <div key={k} className="bg-[#08080b] p-4">
              <div className="h-7 w-7 rounded-lg" style={{ background: `${preset.accent}33` }}>
                <div className="m-1.5 h-1 w-1/2 rounded" style={{ background: preset.accent }} />
              </div>
              <div className="mt-3 h-2 w-3/4 rounded bg-white/15" />
              <div className="mt-1.5 h-1.5 w-full rounded bg-white/8" />
              <div className="mt-1 h-1.5 w-2/3 rounded bg-white/8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ENTERPRISE TRUST — defensible infra pledges + headline stats
   ══════════════════════════════════════════════════════════════════════════ */
const STATS = [
  { v: "6", l: "AI agents per build" },
  { v: "118", l: "agency-grade components" },
  { v: "~60s", l: "to first deploy" },
  { v: "<2s", l: "streaming first paint" },
];
const PLEDGES = [
  { icon: I.shield, t: "Encrypted by default", b: "Free, automatic SSL on every site and custom domain — encrypted in transit, always." },
  { icon: I.globe, t: "Edge-delivered hosting", b: "Sites deploy to a global CDN at the click of a button. Fast everywhere, no config." },
  { icon: I.code, t: "Your code, no lock-in", b: "Export the full React + Tailwind codebase anytime and host it wherever you like." },
  { icon: I.layers, t: "Built for agencies", b: "White-label workspace, multi-site management, and API access on the Agency tier." },
];

function Enterprise() {
  return (
    <section className="relative py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
      <div className="mx-auto max-w-6xl px-5">
        {/* stats */}
        <div className="zbx-reveal grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.l} className="bg-[#08080b] px-6 py-8 text-center">
              <p className="zbx-d text-[40px] text-[#d4f24e] sm:text-[52px]">{s.v}</p>
              <p className="zbx-b mt-1 text-[13px] text-white/55">{s.l}</p>
            </div>
          ))}
        </div>

        {/* pledge block */}
        <div className="zbx-reveal mt-16 grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14" style={{ transitionDelay: "60ms" }}>
          <div>
            <span className="zbx-b inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-wider text-white/70">
              <I.shield className="h-3.5 w-3.5 text-[#d4f24e]" /> Infrastructure pledge
            </span>
            <h2 className="zbx-d mt-5 text-[32px] text-white sm:text-[42px]">
              Build fast.
              <br />
              Own what you ship.
            </h2>
            <p className="zbx-b mt-5 max-w-md text-[16px] leading-relaxed text-white/60">
              Zoobicon runs on managed infrastructure so you never touch a server — but the output is a real codebase you can take with you. No proprietary runtime, no hostage situation.
            </p>
            <a href="/pricing" className="zbx-b mt-7 inline-flex items-center gap-2 rounded-xl bg-[#d4f24e] px-5 py-3 text-[15px] font-bold text-[#161d05] transition-transform hover:-translate-y-0.5">
              See plans & pricing <I.arrow className="h-4 w-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PLEDGES.map((p) => (
              <div key={p.t} className="zbx-card rounded-2xl border border-white/10 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-[#d4f24e] ring-1 ring-white/10">
                  <p.icon className="h-5 w-5" />
                </span>
                <h3 className="zbx-d-tight mt-4 text-[17px] text-white">{p.t}</h3>
                <p className="zbx-b mt-1.5 text-[14px] leading-snug text-white/55">{p.b}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   FINAL CTA
   ══════════════════════════════════════════════════════════════════════════ */
function FinalCTA() {
  return (
    <section className="px-5 pb-24 sm:pb-28">
      <div className="zbx-reveal relative mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0e0e12] px-6 py-16 text-center sm:px-10 sm:py-20">
        <div
          className="zbx-grid-fade pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[520px] -translate-x-1/2 rounded-full bg-[#d4f24e]/14 blur-[100px]" />
        <div className="relative">
          <h2 className="zbx-d mx-auto max-w-2xl text-[36px] text-white sm:text-[56px]">
            Your next site is one
            <br />
            <span className="text-[#d4f24e]">sentence</span> away.
          </h2>
          <p className="zbx-b mx-auto mt-5 max-w-lg text-[17px] text-white/60">
            Describe what you want. Watch six agents build it. Ship it with a domain — all in the next few minutes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/builder"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#d4f24e] px-7 py-3.5 text-[16px] font-bold text-[#161d05] shadow-[0_8px_30px_rgba(212,242,78,0.28)] transition-transform hover:-translate-y-0.5"
            >
              Start building free
              <I.arrow className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" />
            </a>
            <a href="/pricing" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/5 px-7 py-3.5 text-[16px] font-semibold text-white transition-colors hover:bg-white/10">
              Compare plans
            </a>
          </div>
          <p className="zbx-b mt-5 text-[13px] text-white/40">No credit card · Free to start · Export your code anytime</p>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   FOOTER
   ══════════════════════════════════════════════════════════════════════════ */
const FOOTER_COLS: { h: string; links: { label: string; href: string }[] }[] = [
  {
    h: "Platform",
    links: [
      { label: "AI Builder", href: "/builder" },
      { label: "Component registry", href: "/builder" },
      { label: "Chat editing", href: "/builder" },
      { label: "Hosting & domains", href: "/builder" },
    ],
  },
  {
    h: "Use cases",
    links: [
      { label: "SaaS landing pages", href: "/builder" },
      { label: "Portfolios", href: "/builder" },
      { label: "Restaurants", href: "/builder" },
      { label: "Agencies", href: "/agencies" },
    ],
  },
  {
    h: "Resources",
    links: [
      { label: "Quickstart", href: "/builder" },
      { label: "Prompting guide", href: "/builder" },
      { label: "Compare", href: "/compare" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    h: "Company",
    links: [
      { label: "About", href: "/" },
      { label: "Changelog", href: "/changelog" },
      { label: "Acceptable use", href: "/acceptable-use" },
      { label: "Disclaimers", href: "/disclaimers" },
    ],
  },
];

function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-6">
          {/* brand col */}
          <div className="col-span-2">
            <Wordmark />
            <p className="zbx-b mt-4 max-w-xs text-[14px] leading-relaxed text-white/45">
              The AI website builder for people who want a real site, not a toy. Describe it, watch it build, ship it.
            </p>
            <a
              href="/builder"
              className="zbx-b mt-5 inline-flex items-center gap-1.5 rounded-lg bg-[#d4f24e] px-4 py-2 text-[14px] font-bold text-[#161d05] transition-transform hover:-translate-y-0.5"
            >
              Start building <I.arrow className="h-4 w-4" />
            </a>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.h}>
              <h4 className="zbx-b text-[12px] font-semibold uppercase tracking-wider text-white/40">{col.h}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="zbx-b text-[14px] text-white/65 transition-colors hover:text-[#d4f24e]">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-7 sm:flex-row sm:items-center">
          <p className="zbx-b text-[13px] text-white/40">© {new Date().getFullYear()} Zoobicon. All rights reserved.</p>
          <div className="zbx-m flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-white/40">
            <a href="https://zoobicon.com" className="zbx-link-underline hover:text-white/70">zoobicon.com</a>
            <span className="text-white/20">·</span>
            <a href="https://zoobicon.ai" className="zbx-link-underline hover:text-white/70">zoobicon.ai</a>
            <span className="text-white/20">·</span>
            <a href="https://zoobicon.io" className="zbx-link-underline hover:text-white/70">zoobicon.io</a>
            <span className="text-white/20">·</span>
            <a href="https://zoobicon.sh" className="zbx-link-underline hover:text-white/70">zoobicon.sh</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════════════════════ */
export default function PreviewHomePage() {
  useReveal();
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SCOPED_CSS }} />
      <div id="zb-home" className="zbx-b min-h-screen bg-[#08080b] text-white antialiased">
        <FloatingNav />
        <main>
          <Hero />
          <Pipeline />
          <Bento />
          <Playground />
          <Enterprise />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </>
  );
}
