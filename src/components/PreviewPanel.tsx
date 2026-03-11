"use client";

import { useMemo, useRef, useEffect, useState } from "react";

interface PreviewPanelProps {
  html: string;
  isGenerating: boolean;
}

/** Particle field — scattered glowing dots across the entire canvas */
function ParticleField({ count, speed }: { count: number; speed: number }) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1.5 + Math.random() * 3,
      delay: Math.random() * 6,
      duration: (3 + Math.random() * 5) / speed,
      drift: 15 + Math.random() * 40,
      opacity: 0.2 + Math.random() * 0.5,
      hue: 195 + Math.random() * 35,
    }));
  }, [count, speed]);

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `hsl(${p.hue}, 85%, 65%)`,
            boxShadow: `0 0 ${p.size * 4}px hsla(${p.hue}, 85%, 65%, 0.7)`,
            animation: `particle-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
            opacity: p.opacity,
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </>
  );
}

/** Rising light streaks that move upward like energy being created */
function RisingStreaks({ count, speed }: { count: number; speed: number }) {
  const streaks = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 5 + Math.random() * 90,
      width: 1 + Math.random() * 2,
      height: 40 + Math.random() * 120,
      delay: Math.random() * 8,
      duration: (4 + Math.random() * 6) / speed,
      hue: 200 + Math.random() * 30,
      opacity: 0.06 + Math.random() * 0.14,
    }));
  }, [count, speed]);

  return (
    <>
      {streaks.map((s) => (
        <div
          key={s.id}
          className="absolute"
          style={{
            left: `${s.x}%`,
            bottom: "-20%",
            width: s.width,
            height: s.height,
            background: `linear-gradient(to top, transparent, hsla(${s.hue}, 80%, 60%, ${s.opacity}), transparent)`,
            animation: `streak-rise ${s.duration}s ease-in-out ${s.delay}s infinite`,
            filter: "blur(1px)",
          }}
        />
      ))}
    </>
  );
}

/** Full-screen atmospheric idle background */
function IdleAtmosphere() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base deep gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 100%, #0c1a30 0%, #080c18 40%, #0a0a0f 70%)",
        }}
      />

      {/* Large aurora sweep — top */}
      <div
        className="absolute w-[180%] h-[400px] -left-[40%] top-[5%]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.10) 15%, rgba(14,165,233,0.15) 35%, rgba(0,180,255,0.12) 55%, rgba(59,130,246,0.08) 75%, transparent 100%)",
          filter: "blur(50px)",
          animation: "aurora-drift-1 16s ease-in-out infinite",
          transform: "rotate(-3deg)",
        }}
      />

      {/* Aurora sweep — mid */}
      <div
        className="absolute w-[160%] h-[350px] -left-[30%] top-[30%]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(0,180,255,0.08) 20%, rgba(37,99,235,0.14) 45%, rgba(96,165,250,0.10) 65%, rgba(0,220,255,0.06) 85%, transparent 100%)",
          filter: "blur(60px)",
          animation: "aurora-drift-2 20s ease-in-out infinite",
          transform: "rotate(2deg)",
        }}
      />

      {/* Aurora sweep — bottom */}
      <div
        className="absolute w-[150%] h-[300px] -left-[25%] bottom-[5%]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.08) 25%, rgba(14,165,233,0.12) 50%, rgba(37,99,235,0.07) 75%, transparent 100%)",
          filter: "blur(55px)",
          animation: "aurora-drift-3 14s ease-in-out infinite",
          transform: "rotate(-1.5deg)",
        }}
      />

      {/* Floating orb — left side */}
      <div
        className="absolute w-[300px] h-[300px] top-[20%] left-[10%]"
        style={{
          background: "radial-gradient(circle, rgba(37,99,235,0.10) 0%, transparent 60%)",
          filter: "blur(40px)",
          animation: "orb-float-1 12s ease-in-out infinite",
        }}
      />

      {/* Floating orb — right side */}
      <div
        className="absolute w-[250px] h-[250px] top-[40%] right-[15%]"
        style={{
          background: "radial-gradient(circle, rgba(0,200,255,0.08) 0%, transparent 60%)",
          filter: "blur(40px)",
          animation: "orb-float-2 15s ease-in-out infinite",
        }}
      />

      {/* Particles */}
      <ParticleField count={40} speed={1} />

      {/* Gentle rising streaks */}
      <RisingStreaks count={8} speed={0.7} />

      {/* Horizontal light lines */}
      <div
        className="absolute top-[25%] left-0 w-full h-[1px]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(96,165,250,0.15) 25%, rgba(0,200,255,0.25) 50%, rgba(96,165,250,0.15) 75%, transparent 100%)",
          animation: "line-glow 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-[60%] left-0 w-full h-[1px]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.12) 20%, rgba(14,165,233,0.20) 50%, rgba(37,99,235,0.12) 80%, transparent 100%)",
          animation: "line-glow 10s ease-in-out 4s infinite",
        }}
      />

      {/* Bottom blue pool glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[45%]"
        style={{
          background: "linear-gradient(to top, rgba(37,99,235,0.06) 0%, rgba(14,165,233,0.02) 50%, transparent 100%)",
          animation: "bottom-breathe 10s ease-in-out infinite",
        }}
      />
    </div>
  );
}

/** Full-screen generating atmosphere — intense, alive, energetic */
function GeneratingAtmosphere() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base — warmer, more alive */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, #0d1f3c 0%, #080e1e 50%, #0a0a0f 80%)",
        }}
      />

      {/* Aurora band 1 — FAST, BRIGHT */}
      <div
        className="absolute w-[200%] h-[400px] -left-[50%] top-[0%]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.18) 10%, rgba(14,165,233,0.28) 25%, rgba(0,220,255,0.22) 40%, rgba(59,130,246,0.16) 60%, rgba(37,99,235,0.12) 80%, transparent 100%)",
          filter: "blur(40px)",
          animation: "aurora-gen-1 6s ease-in-out infinite",
          transform: "rotate(-4deg)",
        }}
      />

      {/* Aurora band 2 — mid, wider, counter-direction */}
      <div
        className="absolute w-[180%] h-[380px] -left-[40%] top-[25%]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(0,200,255,0.14) 15%, rgba(37,99,235,0.24) 35%, rgba(96,165,250,0.18) 55%, rgba(0,240,255,0.12) 75%, transparent 100%)",
          filter: "blur(45px)",
          animation: "aurora-gen-2 8s ease-in-out infinite",
          transform: "rotate(3deg)",
        }}
      />

      {/* Aurora band 3 — bottom, warm blue wash */}
      <div
        className="absolute w-[170%] h-[350px] -left-[35%] bottom-[0%]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.14) 20%, rgba(14,165,233,0.22) 40%, rgba(0,180,255,0.18) 60%, rgba(37,99,235,0.10) 80%, transparent 100%)",
          filter: "blur(50px)",
          animation: "aurora-gen-3 5s ease-in-out infinite",
          transform: "rotate(-2deg)",
        }}
      />

      {/* Pulsing central glow — like a forge */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(37,99,235,0.12) 0%, rgba(14,165,233,0.04) 30%, transparent 60%)",
          animation: "core-pulse 2.5s ease-in-out infinite",
        }}
      />

      {/* Fast-moving orbs */}
      <div
        className="absolute w-[350px] h-[350px] top-[10%] left-[5%]"
        style={{
          background: "radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 50%)",
          filter: "blur(30px)",
          animation: "orb-gen-1 4s ease-in-out infinite",
        }}
      />
      <div
        className="absolute w-[300px] h-[300px] top-[30%] right-[5%]"
        style={{
          background: "radial-gradient(circle, rgba(0,200,255,0.12) 0%, transparent 50%)",
          filter: "blur(30px)",
          animation: "orb-gen-2 5s ease-in-out infinite",
        }}
      />
      <div
        className="absolute w-[280px] h-[280px] bottom-[10%] left-[30%]"
        style={{
          background: "radial-gradient(circle, rgba(96,165,250,0.10) 0%, transparent 50%)",
          filter: "blur(30px)",
          animation: "orb-gen-3 3.5s ease-in-out infinite",
        }}
      />

      {/* LOTS of particles, FAST */}
      <ParticleField count={80} speed={2.5} />

      {/* Rising energy streaks — fast, plentiful */}
      <RisingStreaks count={20} speed={2} />

      {/* Energy wave pulses — horizontal bands washing across */}
      <div
        className="absolute top-[15%] left-0 w-full h-[3px]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(96,165,250,0.3) 25%, rgba(0,240,255,0.5) 50%, rgba(96,165,250,0.3) 75%, transparent 100%)",
          animation: "energy-wave 2.5s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-[40%] left-0 w-full h-[3px]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.25) 20%, rgba(14,165,233,0.40) 50%, rgba(37,99,235,0.25) 80%, transparent 100%)",
          animation: "energy-wave 3.5s ease-in-out 0.8s infinite",
        }}
      />
      <div
        className="absolute top-[65%] left-0 w-full h-[3px]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(0,200,255,0.20) 15%, rgba(59,130,246,0.35) 50%, rgba(0,200,255,0.20) 85%, transparent 100%)",
          animation: "energy-wave 3s ease-in-out 1.6s infinite",
        }}
      />
      <div
        className="absolute top-[85%] left-0 w-full h-[2px]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(96,165,250,0.20) 30%, rgba(0,220,255,0.30) 50%, rgba(96,165,250,0.20) 70%, transparent 100%)",
          animation: "energy-wave 2.8s ease-in-out 2.2s infinite",
        }}
      />

      {/* Bottom glow — intensified */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[50%]"
        style={{
          background: "linear-gradient(to top, rgba(37,99,235,0.12) 0%, rgba(14,165,233,0.04) 40%, transparent 100%)",
          animation: "bottom-breathe-fast 4s ease-in-out infinite",
        }}
      />
    </div>
  );
}

/**
 * Nuclear visibility failsafe — injected into EVERY srcDoc.
 *
 * Two-layer approach:
 * 1. CSS: Forces body and all children visible with !important rules
 * 2. JS: After 1.5s, UNCONDITIONALLY sets every single element to
 *    opacity:1, visibility:visible, transform:none — no checks, no conditions.
 *    This is a sledgehammer, but it guarantees no blank pages.
 */
const VISIBILITY_FAILSAFE = `
<style id="zbcn-failsafe">
  /* Layer 1: CSS nuclear override — ensures nothing can hide body or its children */
  html, body {
    opacity: 1 !important;
    visibility: visible !important;
    display: block !important;
    min-height: 100vh !important;
    color-scheme: light !important;
  }
  /* Force all sections and content containers visible */
  body > *, body section, body header, body main, body footer,
  body article, body div, body aside {
    opacity: 1 !important;
    visibility: visible !important;
  }
</style>
<script>
(function(){
  // Layer 2: JS brute force — NO getComputedStyle, NO conditions, just force everything
  function nukeHidden() {
    try {
      var els = document.querySelectorAll('body, body *');
      for (var i = 0; i < els.length; i++) {
        var t = els[i].tagName;
        if (t === 'SCRIPT' || t === 'STYLE' || t === 'META' || t === 'LINK') continue;
        var s = els[i].style;
        s.setProperty('opacity', '1', 'important');
        s.setProperty('visibility', 'visible', 'important');
        // Only reset transform on non-nav elements (preserve nav positioning)
        if (t !== 'NAV' && !els[i].closest('nav')) {
          s.setProperty('transform', 'none', 'important');
        }
        // Add visible class for component library
        els[i].classList.add('visible');
      }
    } catch(e) { console.warn('[zbcn-failsafe]', e); }
  }

  // Run at multiple intervals
  setTimeout(nukeHidden, 1500);
  setTimeout(nukeHidden, 3500);
})();
</script>`;

export default function PreviewPanel({ html, isGenerating }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [blankDetected, setBlankDetected] = useState(false);

  // Extract body text to validate content exists
  const bodyTextLength = useMemo(() => {
    if (!html) return 0;
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (!bodyMatch) return 0;
    return bodyMatch[1]
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .length;
  }, [html]);

  // Inject visibility failsafe into every srcDoc to prevent blank white pages
  const srcDoc = useMemo(() => {
    if (!html) return "";
    let doc = html;
    // Inject failsafe before </body> if present, otherwise append
    if (doc.includes("</body>")) {
      doc = doc.replace(/<\/body>/i, VISIBILITY_FAILSAFE + "\n</body>");
    } else if (doc.includes("</html>")) {
      doc = doc.replace(/<\/html>/i, VISIBILITY_FAILSAFE + "\n</html>");
    } else {
      doc = doc + VISIBILITY_FAILSAFE;
    }
    return doc;
  }, [html]);

  // Reset blank detection when html changes
  useEffect(() => {
    setBlankDetected(false);
  }, [html]);

  // Detect blank iframe content after load
  useEffect(() => {
    if (!html || isGenerating) return;
    const timer = setTimeout(() => {
      try {
        const iframe = iframeRef.current;
        if (!iframe) return;
        const doc = iframe.contentDocument;
        if (!doc || !doc.body) return;
        // Check if body has any visible text content
        const bodyText = (doc.body.innerText || "").trim();
        if (bodyText.length < 20) {
          console.warn("[PreviewPanel] Blank page detected — body text length:", bodyText.length);
          setBlankDetected(true);
        }
      } catch {
        // Cross-origin issues, skip detection
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [html, isGenerating]);

  const sharedStyles = `
    @keyframes particle-float {
      0%, 100% {
        transform: translateY(0) translateX(0);
      }
      25% {
        transform: translateY(calc(var(--drift) * -1)) translateX(calc(var(--drift) * 0.5));
        opacity: 0.8;
      }
      50% {
        transform: translateY(calc(var(--drift) * -0.5)) translateX(calc(var(--drift) * -0.3));
        opacity: 0.15;
      }
      75% {
        transform: translateY(calc(var(--drift) * 0.3)) translateX(calc(var(--drift) * -0.8));
        opacity: 0.7;
      }
    }
    @keyframes streak-rise {
      0% { transform: translateY(0); opacity: 0; }
      20% { opacity: 1; }
      80% { opacity: 1; }
      100% { transform: translateY(-120vh); opacity: 0; }
    }
    @keyframes aurora-drift-1 {
      0%, 100% { transform: rotate(-3deg) translateX(-60px); }
      50% { transform: rotate(-3deg) translateX(100px); }
    }
    @keyframes aurora-drift-2 {
      0%, 100% { transform: rotate(2deg) translateX(40px); }
      50% { transform: rotate(2deg) translateX(-80px); }
    }
    @keyframes aurora-drift-3 {
      0%, 100% { transform: rotate(-1.5deg) translateX(-40px) scaleY(1); }
      50% { transform: rotate(-1.5deg) translateX(60px) scaleY(1.4); }
    }
    @keyframes aurora-gen-1 {
      0%, 100% { transform: rotate(-4deg) translateX(-80px); opacity: 0.6; }
      50% { transform: rotate(-4deg) translateX(150px); opacity: 1; }
    }
    @keyframes aurora-gen-2 {
      0%, 100% { transform: rotate(3deg) translateX(60px); opacity: 0.5; }
      50% { transform: rotate(3deg) translateX(-120px); opacity: 1; }
    }
    @keyframes aurora-gen-3 {
      0%, 100% { transform: rotate(-2deg) translateX(-50px) scaleY(1); opacity: 0.6; }
      50% { transform: rotate(-2deg) translateX(100px) scaleY(1.5); opacity: 1; }
    }
    @keyframes orb-float-1 {
      0%, 100% { transform: translate(0, 0); }
      33% { transform: translate(40px, -30px); }
      66% { transform: translate(-20px, 20px); }
    }
    @keyframes orb-float-2 {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(-30px, -40px); }
    }
    @keyframes orb-gen-1 {
      0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
      50% { transform: translate(60px, -40px) scale(1.3); opacity: 1; }
    }
    @keyframes orb-gen-2 {
      0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
      50% { transform: translate(-50px, 30px) scale(1.2); opacity: 1; }
    }
    @keyframes orb-gen-3 {
      0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
      50% { transform: translate(30px, -50px) scale(1.4); opacity: 1; }
    }
    @keyframes line-glow {
      0%, 100% { opacity: 0.2; transform: scaleX(0.7); }
      50% { opacity: 1; transform: scaleX(1); }
    }
    @keyframes bottom-breathe {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
    @keyframes bottom-breathe-fast {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
    @keyframes energy-wave {
      0% { opacity: 0; transform: scaleX(0.2) translateX(-40%); }
      50% { opacity: 1; transform: scaleX(1) translateX(0); }
      100% { opacity: 0; transform: scaleX(0.2) translateX(40%); }
    }
    @keyframes core-pulse {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.15); }
    }
    @keyframes text-shimmer {
      0% { background-position: 0% 50%; }
      100% { background-position: 300% 50%; }
    }
    @keyframes text-breathe {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
  `;

  if (isGenerating) {
    return (
      <div className="relative h-full overflow-hidden">
        <GeneratingAtmosphere />

        {/* Text centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <p
            className="text-lg font-bold uppercase tracking-[8px]"
            style={{
              background: "linear-gradient(90deg, #60a5fa, #00ddff, #3b82f6, #60a5fa)",
              backgroundSize: "300% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "text-shimmer 2s linear infinite",
              filter: "drop-shadow(0 0 20px rgba(37,99,235,0.4))",
            }}
          >
            Creating
          </p>
          <p
            className="text-[11px] text-blue-300/40 mt-4 tracking-[3px] uppercase"
            style={{ animation: "text-breathe 3s ease-in-out infinite" }}
          >
            AI agents building your site
          </p>
        </div>

        <style>{sharedStyles}</style>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="relative h-full overflow-hidden">
        <IdleAtmosphere />

        {/* Centered text — floating over the atmosphere */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <p
              className="text-sm uppercase tracking-[6px] mb-3"
              style={{
                background: "linear-gradient(90deg, rgba(96,165,250,0.5), rgba(0,200,255,0.6), rgba(96,165,250,0.5))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Ready to build
            </p>
            <p className="text-xs text-blue-300/20 leading-relaxed max-w-xs mx-auto">
              Describe your website and watch it come to life
            </p>
          </div>
        </div>

        <style>{sharedStyles}</style>
      </div>
    );
  }

  // Safety check — if html exists but doesn't look like valid HTML, show diagnostic
  const looksLikeHtml = srcDoc.includes("<html") || srcDoc.includes("<!doctype") || srcDoc.includes("<!DOCTYPE");

  if (!looksLikeHtml && srcDoc.length > 0) {
    return (
      <div className="h-full overflow-auto bg-gray-950 p-6">
        <div className="bg-yellow-900/30 border border-yellow-600/40 rounded-lg p-4 mb-4">
          <p className="text-yellow-300 text-sm font-medium mb-2">Preview Issue — Generated output is not valid HTML</p>
          <p className="text-yellow-200/60 text-xs">The AI returned text that doesn&apos;t appear to be a complete HTML document. First 200 characters shown below:</p>
        </div>
        <pre className="text-xs text-blue-300/70 whitespace-pre-wrap break-all font-mono">{srcDoc.substring(0, 500)}</pre>
      </div>
    );
  }

  // Safety check — if body has no visible text content, show diagnostic instead of blank white
  if (html && bodyTextLength < 50) {
    return (
      <div className="h-full overflow-auto bg-gray-950 p-6">
        <div className="bg-red-900/30 border border-red-600/40 rounded-lg p-4 mb-4">
          <p className="text-red-300 text-sm font-medium mb-2">Generation incomplete — empty page detected</p>
          <p className="text-red-200/60 text-xs mb-3">
            The AI generated HTML structure ({html.length.toLocaleString()} chars) but the body has very little visible text content ({bodyTextLength} chars).
            This usually means the AI produced CSS/JS but forgot the actual page content.
          </p>
          <p className="text-red-200/60 text-xs">Try clicking &quot;New Site&quot; and generating again, or switch to the Code tab to inspect the output.</p>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Raw HTML (first 1000 chars)</p>
          <pre className="text-[11px] text-blue-300/50 whitespace-pre-wrap break-all font-mono leading-relaxed">{html.substring(0, 1000)}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <iframe
        ref={iframeRef}
        srcDoc={srcDoc}
        className="w-full h-full border-0 bg-white"
        title="Website preview"
        sandbox="allow-scripts allow-same-origin"
      />
      {blankDetected && (
        <div className="absolute bottom-4 left-4 right-4 bg-yellow-900/90 border border-yellow-600/50 rounded-lg p-3 backdrop-blur-sm z-10">
          <p className="text-yellow-300 text-xs font-medium mb-1">Preview may be blank</p>
          <p className="text-yellow-200/60 text-[10px] mb-2">
            The generated site appears empty. This can happen when AI-generated animations hide content.
          </p>
          <button
            onClick={() => {
              try {
                const doc = iframeRef.current?.contentDocument;
                if (doc?.body) {
                  const all = doc.body.querySelectorAll("*");
                  all.forEach((el: Element) => {
                    const htmlEl = el as HTMLElement;
                    htmlEl.style.setProperty("opacity", "1", "important");
                    htmlEl.style.setProperty("visibility", "visible", "important");
                    htmlEl.style.setProperty("transform", "none", "important");
                    const cs = window.getComputedStyle(htmlEl);
                    if (cs.display === "none") htmlEl.style.setProperty("display", "block", "important");
                  });
                  setBlankDetected(false);
                }
              } catch { /* cross-origin */ }
            }}
            className="text-[10px] px-3 py-1 rounded bg-yellow-600/30 text-yellow-200 hover:bg-yellow-600/50 transition-colors"
          >
            Force Show Content
          </button>
        </div>
      )}
    </div>
  );
}
