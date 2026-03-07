"use client";

import { useState } from "react";

export default function PromptBuilder() {
  const [prompt, setPrompt] = useState("");
  const [isBuilding, setIsBuilding] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const examplePrompts = [
    "A portfolio site for a futuristic architect",
    "A SaaS landing page for a quantum computing startup",
    "An e-commerce store for holographic sneakers",
    "A blog for an interstellar travel journalist",
  ];

  const handleBuild = () => {
    if (!prompt.trim()) return;
    setIsBuilding(true);
    setResult(null);
    // Simulated AI build (real AI coming soon)
    setTimeout(() => {
      setIsBuilding(false);
      setResult(
        "Your website is being generated! AI integration coming soon — stay tuned."
      );
    }, 2000);
  };

  return (
    <section
      id="builder"
      className="max-w-4xl mx-auto px-6 py-24 flex flex-col items-center gap-8"
    >
      <div className="w-full glass rounded-3xl p-8 border border-violet-500/20 animate-pulse-glow">
        <p className="text-xs text-violet-400 font-mono uppercase tracking-widest mb-4">
          ✦ AI Builder — Early Access
        </p>
        <div className="flex flex-col gap-4">
          <textarea
            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 resize-none text-base leading-relaxed transition-all"
            rows={3}
            placeholder="Describe your dream website in plain English…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) handleBuild();
            }}
          />
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500">
              ⌘/Ctrl + Enter to build
            </span>
            <button
              onClick={handleBuild}
              disabled={!prompt.trim() || isBuilding}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-500 animate-gradient hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-opacity"
            >
              {isBuilding ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Building…
                </>
              ) : (
                <>✦ Build with AI</>
              )}
            </button>
          </div>
        </div>

        {result && (
          <div className="mt-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm">
            {result}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {examplePrompts.map((example) => (
          <button
            key={example}
            onClick={() => setPrompt(example)}
            className="text-xs text-slate-400 hover:text-white border border-white/8 hover:border-violet-500/40 bg-white/3 hover:bg-violet-500/10 px-3 py-2 rounded-full transition-all"
          >
            {example}
          </button>
        ))}
      </div>
    </section>
  );
}
