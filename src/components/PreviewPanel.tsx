"use client";

import { useMemo, useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import {
  Monitor,
  Tablet,
  Smartphone,
  Play,
} from "lucide-react";
import { injectVisualEditingScript } from "@/lib/dom-bridge";
import type { SelectedElement, BridgeMessage } from "@/lib/dom-bridge";

const SandpackPreview = lazy(() => import("@/components/SandpackPreview"));

type PreviewMode = "iframe" | "sandpack";

interface PreviewPanelProps {
  html: string;
  isGenerating: boolean;
  visualEditMode?: boolean;
  previewMode?: PreviewMode;
  onElementSelected?: (element: SelectedElement | null) => void;
  onElementHover?: (element: SelectedElement | null) => void;
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
          background: "radial-gradient(ellipse at 50% 100%, #0c1a30 0%, #080c18 40%, #0a1628 70%)",
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
          background: "radial-gradient(ellipse at 50% 50%, #0d1f3c 0%, #080e1e 50%, #0a1628 80%)",
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

type ViewportMode = "desktop" | "tablet" | "mobile";

const viewportConfig: Record<ViewportMode, { width: string; icon: typeof Monitor; label: string }> = {
  desktop: { width: "100%", icon: Monitor, label: "Desktop" },
  tablet: { width: "768px", icon: Tablet, label: "Tablet" },
  mobile: { width: "375px", icon: Smartphone, label: "Mobile" },
};

export default function PreviewPanel({
  html,
  isGenerating,
  visualEditMode = false,
  previewMode: previewModeProp = "iframe",
  onElementSelected,
  onElementHover,
}: PreviewPanelProps) {
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [activePreviewMode, setActivePreviewMode] = useState<PreviewMode>(previewModeProp);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for postMessage from the iframe when visual editing is active
  useEffect(() => {
    if (!visualEditMode) return;

    function handleMessage(event: MessageEvent) {
      const data = event.data as BridgeMessage;
      if (!data || !data.type) return;

      switch (data.type) {
        case "element-selected":
          onElementSelected?.(data.element);
          break;
        case "element-hover":
          onElementHover?.(data.element);
          break;
        case "text-updated":
          // Text was updated inline in the iframe — parent can handle syncing
          break;
        case "visual-editing-enabled":
          // Visual editing script loaded successfully
          break;
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [visualEditMode, onElementSelected, onElementHover]);

  // Send style/text changes to iframe via postMessage
  const sendToIframe = useCallback(
    (message: Record<string, unknown>) => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(message, "*");
      }
    },
    []
  );

  // Prepare HTML with visual editing script injected when in edit mode
  const previewHtml = useMemo(() => {
    if (!html || !visualEditMode) return html;
    return injectVisualEditingScript(html);
  }, [html, visualEditMode]);

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

  if (isGenerating && !html) {
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
            className="text-[11px] text-stone-300/40 mt-4 tracking-[3px] uppercase"
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
            <p className="text-xs text-stone-300/20 leading-relaxed max-w-xs mx-auto">
              Describe your website and watch it come to life
            </p>
          </div>
        </div>

        <style>{sharedStyles}</style>
      </div>
    );
  }

  // Safety check — if html exists but doesn't look like valid HTML, show diagnostic
  // Skip this check during generation — streamed chunks may not have full HTML structure yet
  const looksLikeHtml = html.includes("<html") || html.includes("<!doctype") || html.includes("<!DOCTYPE") || html.includes("<body") || html.includes("<nav") || html.includes("<section");

  if (!looksLikeHtml && html.length > 0 && !isGenerating) {
    return (
      <div className="h-full overflow-auto bg-navy-950 p-6">
        <div className="bg-stone-900/30 border border-stone-600/40 rounded-lg p-4 mb-4">
          <p className="text-stone-300 text-sm font-medium mb-2">Preview Issue — Generated output is not valid HTML</p>
          <p className="text-stone-200/60 text-xs">The AI returned text that doesn&apos;t appear to be a complete HTML document. First 200 characters shown below:</p>
        </div>
        <pre className="text-xs text-stone-300/70 whitespace-pre-wrap break-all font-mono">{html.substring(0, 500)}</pre>
      </div>
    );
  }

  // Safety check — if body has no visible text content, show diagnostic instead of blank white
  // ONLY show diagnostic when generation is COMPLETE. During generation the server may be retrying
  // and will send a "replace" event with the final HTML — showing the error prematurely scares users.
  if (html && bodyTextLength < 50 && !isGenerating) {
    // Detect likely causes from the HTML content
    const hasHead = /<head/i.test(html);
    const hasBody = /<body/i.test(html);
    const hasStyle = /<style/i.test(html);
    const hasScript = /<script/i.test(html);
    const htmlLen = html.length;

    let likelyCause = "";
    if (!hasBody) {
      likelyCause = "The HTML has no <body> tag at all. This usually means the AI model returned an incomplete response — it may have been cut off due to token limits or the API key may lack access to the selected model (Opus).";
    } else if (hasStyle && htmlLen > 500) {
      likelyCause = "The HTML contains CSS but the <body> is empty. The AI spent all its tokens on styling and never got to the page content.";
    } else if (htmlLen < 200) {
      likelyCause = "The HTML is very short (" + htmlLen + " chars). The AI returned almost nothing — this often means the API key is invalid, rate-limited, or doesn't have access to the model being used.";
    } else {
      likelyCause = "The AI generated some HTML but the body lacks visible text content.";
    }

    return (
      <div className="h-full overflow-auto bg-navy-950 p-6">
        <div className="bg-stone-900/30 border border-stone-600/40 rounded-lg p-4 mb-4">
          <p className="text-stone-300 text-sm font-medium mb-2">Generation incomplete — empty page detected</p>
          <p className="text-stone-200/60 text-xs mb-3">
            {likelyCause}
          </p>
          <div className="bg-stone-950/50 rounded p-3 mb-3">
            <p className="text-[10px] text-stone-300/60 uppercase tracking-wider mb-2">Diagnostics</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-stone-200/50 font-mono">
              <span>Total HTML:</span><span>{htmlLen.toLocaleString()} chars</span>
              <span>Body text:</span><span>{bodyTextLength} chars</span>
              <span>Has &lt;head&gt;:</span><span>{hasHead ? "yes" : "NO"}</span>
              <span>Has &lt;body&gt;:</span><span>{hasBody ? "yes" : "NO"}</span>
              <span>Has &lt;style&gt;:</span><span>{hasStyle ? "yes" : "no"}</span>
              <span>Has &lt;script&gt;:</span><span>{hasScript ? "yes" : "no"}</span>
            </div>
          </div>
          <p className="text-stone-200/60 text-xs">
            <strong className="text-stone-300/80">Next steps:</strong> Visit <code className="text-stone-300/70 bg-stone-950/50 px-1 rounded">/api/health</code> to check if your API key and models are working. Then try &quot;New Site&quot; again.
          </p>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Raw HTML (first 1000 chars)</p>
          <pre className="text-[11px] text-stone-300/50 whitespace-pre-wrap break-all font-mono leading-relaxed">{html.substring(0, 1000)}</pre>
        </div>
      </div>
    );
  }

  // During generation, if HTML has empty body (server is retrying), show optimizing state
  if (html && bodyTextLength < 50 && isGenerating) {
    return (
      <div className="relative h-full overflow-hidden">
        <GeneratingAtmosphere />
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
            Optimizing
          </p>
          <p
            className="text-[11px] text-stone-300/40 mt-4 tracking-[3px] uppercase"
            style={{ animation: "text-breathe 3s ease-in-out infinite" }}
          >
            Enhancing content quality
          </p>
        </div>
        <style>{sharedStyles}</style>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Device toolbar */}
      <div className="flex items-center gap-1 px-3 bg-gray-900/50 border-b border-white/5" style={{ height: 32, minHeight: 32 }}>
        {(Object.keys(viewportConfig) as ViewportMode[]).map((mode) => {
          const config = viewportConfig[mode];
          const Icon = config.icon;
          const isActive = viewport === mode;
          return (
            <button
              key={mode}
              onClick={() => setViewport(mode)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition-colors duration-150 ${
                isActive
                  ? "text-stone-400"
                  : "text-white/50 hover:text-white/70"
              }`}
              title={config.label}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{config.label}</span>
            </button>
          );
        })}
        {/* Separator */}
        <div className="w-px h-4 bg-white/10 mx-1" />

        {/* Sandpack hot-reload toggle */}
        <button
          onClick={() => setActivePreviewMode(activePreviewMode === "iframe" ? "sandpack" : "iframe")}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition-colors duration-150 ${
            activePreviewMode === "sandpack"
              ? "text-stone-400"
              : "text-white/50 hover:text-white/70"
          }`}
          title={activePreviewMode === "sandpack" ? "Switch to iframe preview" : "Switch to Sandpack hot-reload preview"}
        >
          <Play size={12} />
          <span className="hidden sm:inline">Hot Reload</span>
        </button>

        {visualEditMode && (
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-pulse" />
            <span className="text-[10px] text-stone-400/70 uppercase tracking-wider font-medium">
              Visual Edit
            </span>
          </div>
        )}
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-hidden bg-navy-950 flex items-start justify-center">
        {activePreviewMode === "sandpack" ? (
          <div className="w-full h-full">
            <Suspense
              fallback={
                <div className="h-full flex items-center justify-center bg-[#0f2148] text-white/40 text-sm">
                  Loading Sandpack...
                </div>
              }
            >
              <SandpackPreview html={previewHtml} />
            </Suspense>
          </div>
        ) : (
          <div
            className={`h-full transition-all duration-300 ease-in-out ${
              viewport !== "desktop"
                ? "my-0 border-x border-white/10 rounded-md shadow-lg shadow-black/30"
                : ""
            }`}
            style={{
              width: viewportConfig[viewport].width,
              maxWidth: "100%",
            }}
          >
            <iframe
              ref={iframeRef}
              srcDoc={previewHtml}
              className="w-full h-full border-0 bg-white"
              title="Website preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}
      </div>
    </div>
  );
}
