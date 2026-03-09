"use client";

import { useState } from "react";
import { Globe, ArrowRight, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

interface ClonePanelProps {
  onClone: (html: string) => void;
}

export default function ClonePanel({ onClone }: ClonePanelProps) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "analyzing" | "building" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [tier, setTier] = useState<"standard" | "premium">("premium");

  const handleClone = async () => {
    if (!url.trim()) return;

    setStatus("analyzing");
    setError("");
    setAnalysis("");

    try {
      const res = await fetch("/api/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), upgradeTier: tier }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Clone failed");
      }

      setStatus("building");
      const data = await res.json();
      setAnalysis(data.sourceHost);
      setStatus("done");
      onClone(data.html);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Globe className="w-4 h-4 text-brand-400" />
          Website Cloner
        </h3>
        <p className="text-xs text-white/30">
          Paste any URL and we&apos;ll rebuild it as a premium, modern website.
        </p>
      </div>

      {/* URL Input */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/40 transition-colors"
            onKeyDown={(e) => e.key === "Enter" && handleClone()}
          />
        </div>

        {/* Tier Selection */}
        <div className="flex gap-2">
          <button
            onClick={() => setTier("standard")}
            className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
              tier === "standard"
                ? "bg-white/[0.06] border-white/[0.12] text-white"
                : "border-white/[0.04] text-white/30 hover:text-white/50"
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setTier("premium")}
            className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors flex items-center justify-center gap-1 ${
              tier === "premium"
                ? "bg-brand-500/10 border-brand-500/30 text-brand-400"
                : "border-white/[0.04] text-white/30 hover:text-white/50"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Premium
          </button>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleClone}
        disabled={!url.trim() || status === "analyzing" || status === "building"}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-accent-purple text-white text-sm font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === "analyzing" || status === "building" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {status === "analyzing" ? "Analyzing website..." : "Rebuilding as premium..."}
          </>
        ) : (
          <>
            <ArrowRight className="w-4 h-4" />
            Clone &amp; Upgrade
          </>
        )}
      </button>

      {/* Status */}
      {status === "done" && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-emerald-400 font-medium">Clone complete</p>
            <p className="text-[10px] text-emerald-400/60 mt-0.5">
              Rebuilt {analysis} as a premium website. Check the preview.
            </p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-red-400 font-medium">Clone failed</p>
            <p className="text-[10px] text-red-400/60 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="space-y-2 pt-2 border-t border-white/[0.06]">
        <p className="text-[10px] uppercase tracking-widest text-white/20">How it works</p>
        <div className="space-y-1.5">
          {[
            "Fetches and analyzes the target website",
            "Extracts content, structure, and brand identity",
            "Rebuilds with premium design and modern code",
            "Adds animations, responsive design, and polish",
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[8px] text-brand-400 font-bold">{i + 1}</span>
              </div>
              <span className="text-[11px] text-white/30">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
