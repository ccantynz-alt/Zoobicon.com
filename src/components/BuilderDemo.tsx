"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Play, RotateCcw } from "lucide-react";

const DEMO_PROMPT = "A modern SaaS landing page for an AI code review tool with dark theme, hero section, features grid, and pricing table";

const DEMO_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeLens AI - Smart Code Review</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #0a0a0f; color: #e0e0e8; }
    .hero { padding: 80px 20px; text-align: center; background: linear-gradient(135deg, #0a0a1a, #1a0a2e); }
    .hero h1 { font-size: 3rem; font-weight: 800; margin-bottom: 16px; background: linear-gradient(135deg, #60a5fa, #60a5fa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero p { font-size: 1.1rem; color: #888; max-width: 500px; margin: 0 auto 32px; }
    .btn { padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 0.95rem; cursor: pointer; border: none; }
    .btn-primary { background: linear-gradient(135deg, #3b82f6, #3b82f6); color: white; }
    .features { padding: 60px 20px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 900px; margin: 0 auto; }
    .feature-card { background: #12121a; border: 1px solid #1e1e2e; border-radius: 16px; padding: 28px; }
    .feature-card h3 { font-size: 1.1rem; margin-bottom: 8px; color: #fff; }
    .feature-card p { font-size: 0.85rem; color: #666; line-height: 1.5; }
    .pricing { padding: 60px 20px; text-align: center; }
    .pricing h2 { font-size: 2rem; font-weight: 800; margin-bottom: 32px; }
    .plans { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
    .plan { background: #12121a; border: 1px solid #1e1e2e; border-radius: 16px; padding: 32px; width: 260px; }
    .plan.featured { border-color: #3b82f6; box-shadow: 0 0 40px -10px rgba(91,124,247,0.3); }
    .plan h3 { margin-bottom: 4px; }
    .price { font-size: 2.5rem; font-weight: 800; margin: 8px 0; }
    .price span { font-size: 1rem; color: #666; font-weight: 400; }
  </style>
</head>
<body>
  <div class="hero">
    <h1>Code Review, Supercharged</h1>
    <p>AI that understands your codebase. Catch bugs, enforce standards, and ship faster.</p>
    <button class="btn btn-primary">Start Free Trial</button>
  </div>
  <div class="features">
    <div class="feature-card">
      <h3>🔍 Smart Analysis</h3>
      <p>Deep code understanding that goes beyond syntax to find logic errors and vulnerabilities.</p>
    </div>
    <div class="feature-card">
      <h3>⚡ Instant Reviews</h3>
      <p>Get comprehensive code reviews in seconds, not hours. Works with every PR automatically.</p>
    </div>
    <div class="feature-card">
      <h3>🛡️ Security First</h3>
      <p>Automatically detects OWASP vulnerabilities, injection risks, and authentication flaws.</p>
    </div>
  </div>
  <div class="pricing">
    <h2>Simple Pricing</h2>
    <div class="plans">
      <div class="plan">
        <h3>Starter</h3>
        <div class="price">Free</div>
        <p style="color:#666;font-size:0.85rem">5 repos • 100 reviews/mo</p>
      </div>
      <div class="plan featured">
        <h3>Pro</h3>
        <div class="price">$29<span>/mo</span></div>
        <p style="color:#666;font-size:0.85rem">Unlimited repos & reviews</p>
      </div>
      <div class="plan">
        <h3>Enterprise</h3>
        <div class="price">Custom</div>
        <p style="color:#666;font-size:0.85rem">SSO • SLA • Dedicated support</p>
      </div>
    </div>
  </div>
</body>
</html>`;

const DEMO_LOG_LINES = [
  { text: "Initializing Zoobicon AI...", delay: 300 },
  { text: "Parsing prompt...", delay: 600 },
  { text: "Selecting design patterns: dark-saas-modern", delay: 1200 },
  { text: "Generating HTML structure...", delay: 1800 },
  { text: "Building CSS (grid, flexbox, gradients)...", delay: 3000 },
  { text: "Adding responsive breakpoints...", delay: 4200 },
  { text: "Optimizing typography (Inter)...", delay: 5000 },
  { text: "Generation complete!", delay: 6500 },
];

export default function BuilderDemo() {
  const [phase, setPhase] = useState<"idle" | "typing" | "generating" | "done">("idle");
  const [displayedPrompt, setDisplayedPrompt] = useState("");
  const [displayedCode, setDisplayedCode] = useState("");
  const [logLines, setLogLines] = useState<string[]>([]);
  const [charCount, setCharCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  const startDemo = () => {
    setPhase("typing");
    setDisplayedPrompt("");
    setDisplayedCode("");
    setLogLines([]);
    setCharCount(0);
    setShowPreview(false);
  };

  // Typing the prompt
  useEffect(() => {
    if (phase !== "typing") return;
    let i = 0;
    const timer = setInterval(() => {
      if (i < DEMO_PROMPT.length) {
        setDisplayedPrompt(DEMO_PROMPT.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
        setTimeout(() => setPhase("generating"), 400);
      }
    }, 25);
    return () => clearInterval(timer);
  }, [phase]);

  // Streaming code
  useEffect(() => {
    if (phase !== "generating") return;
    let i = 0;
    const speed = 3; // chars per tick
    const timer = setInterval(() => {
      if (i < DEMO_CODE.length) {
        const next = Math.min(i + speed, DEMO_CODE.length);
        setDisplayedCode(DEMO_CODE.slice(0, next));
        setCharCount(next);
        i = next;
        if (codeRef.current) {
          codeRef.current.scrollTop = codeRef.current.scrollHeight;
        }
      } else {
        clearInterval(timer);
        setPhase("done");
        setShowPreview(true);
      }
    }, 8);
    return () => clearInterval(timer);
  }, [phase]);

  // Log lines
  useEffect(() => {
    if (phase !== "generating" && phase !== "done") return;
    const timers = DEMO_LOG_LINES.map((line) =>
      setTimeout(() => {
        setLogLines((prev) => [...prev, line.text]);
      }, line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  // Auto-start on mount
  useEffect(() => {
    const timer = setTimeout(startDemo, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="gradient-border rounded-2xl overflow-hidden">
      <div className="bg-dark-300/90 backdrop-blur-xl">
        {/* Browser chrome */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <div className="bg-white/[0.04] rounded-lg px-4 py-1 text-xs text-white/50">
              zoobicon.ai/builder
            </div>
          </div>
          <button
            onClick={startDemo}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/50 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Replay
          </button>
        </div>

        {/* Builder layout */}
        <div className="flex h-[460px] md:h-[520px]">
          {/* Sidebar */}
          <div className="w-[35%] border-r border-white/[0.06] flex flex-col">
            {/* Prompt area */}
            <div className="p-4 border-b border-white/[0.06]">
              <div className="text-[10px] font-medium text-white/50 uppercase tracking-wider mb-2">
                Describe your website
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 min-h-[72px] text-xs text-white/70 leading-relaxed">
                {displayedPrompt}
                {phase === "typing" && (
                  <span className="inline-block w-[2px] h-3.5 bg-brand-400 ml-0.5 animate-pulse" />
                )}
              </div>
              <div className={`mt-2 h-8 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                phase === "generating"
                  ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white"
                  : phase === "done"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                  : "bg-white/[0.04] text-white/50 border border-white/[0.06]"
              }`}>
                {phase === "generating" && <><Sparkles className="w-3 h-3 animate-pulse" /> Generating...</>}
                {phase === "done" && <>✓ Complete</>}
                {(phase === "idle" || phase === "typing") && "Generate"}
              </div>
            </div>

            {/* Build log */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px]">
              <div className="text-[9px] font-medium text-white/15 uppercase tracking-wider mb-1.5">Activity</div>
              {logLines.map((line, i) => (
                <div
                  key={i}
                  className={`py-0.5 animate-fade-in ${
                    line.includes("complete") ? "text-emerald-400" : "text-white/50"
                  }`}
                >
                  <span className="text-white/10 mr-1.5">{String(i + 1).padStart(2, "0")}</span>
                  {line}
                </div>
              ))}
              {phase === "generating" && (
                <div className="text-brand-400/80 animate-pulse py-0.5">
                  <span className="text-white/10 mr-1.5">{String(logLines.length + 1).padStart(2, "0")}</span>
                  Streaming... {charCount.toLocaleString()} chars
                </div>
              )}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col">
            {/* Tab bar */}
            <div className="flex border-b border-white/[0.06] px-1">
              <button
                className={`px-4 py-2 text-[10px] font-medium transition-colors ${
                  showPreview ? "text-brand-400 border-b-2 border-brand-500" : "text-white/50"
                }`}
                onClick={() => setShowPreview(true)}
              >
                Preview
              </button>
              <button
                className={`px-4 py-2 text-[10px] font-medium transition-colors ${
                  !showPreview ? "text-brand-400 border-b-2 border-brand-500" : "text-white/50"
                }`}
                onClick={() => setShowPreview(false)}
              >
                Code
              </button>
              {phase === "generating" && (
                <div className="ml-auto flex items-center gap-1.5 px-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                  <span className="text-[9px] text-brand-400/60 font-mono">{charCount.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-hidden relative">
              {showPreview && phase === "done" ? (
                <iframe
                  srcDoc={DEMO_CODE}
                  title="Demo Preview"
                  className="w-full h-full border-0 bg-white"
                  sandbox="allow-scripts"
                />
              ) : displayedCode ? (
                <pre
                  ref={codeRef}
                  className="h-full overflow-auto p-4 text-[10px] font-mono leading-relaxed text-white/50"
                >
                  <code>{displayedCode}</code>
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full">
                  {phase === "idle" ? (
                    <button
                      onClick={startDemo}
                      className="group flex flex-col items-center gap-3 cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/15 to-brand-400/10 border border-brand-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Play className="w-7 h-7 text-brand-400/80 ml-0.5" />
                      </div>
                      <span className="text-xs text-white/50 group-hover:text-white/50 transition-colors">Watch the demo</span>
                    </button>
                  ) : (
                    <div className="text-center">
                      <Sparkles className="w-8 h-8 text-brand-400/20 mx-auto mb-2 animate-pulse" />
                      <div className="text-xs text-white/50">Preparing...</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-white/[0.06] text-[9px] text-white/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-2.5 h-2.5 text-brand-400" />
            <span>Zoobicon v2.0</span>
          </div>
          <span>{phase === "done" ? `${DEMO_CODE.length.toLocaleString()} chars • Ready` : phase === "generating" ? "Streaming..." : "Ready"}</span>
        </div>
      </div>
    </div>
  );
}
