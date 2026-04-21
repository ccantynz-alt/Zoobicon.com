"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ImagePlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Wand2,
} from "lucide-react";

interface AiImagesPanelProps {
  code: string;
  onApplyImages: (html: string) => void;
}

export default function AiImagesPanel({ code, onApplyImages }: AiImagesPanelProps) {
  const [status, setStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [results, setResults] = useState<{ count: number; providers: string[] } | null>(null);
  const [industry, setIndustry] = useState("");

  // Single image generation
  const [singlePrompt, setSinglePrompt] = useState("");
  const [singleResult, setSingleResult] = useState<string | null>(null);
  const [singleStatus, setSingleStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [singleError, setSingleError] = useState("");

  const handleReplaceAll = async () => {
    if (!code) return;

    setStatus("generating");
    setError("");
    setResults(null);

    try {
      const res = await fetch("/api/generate/ai-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: code, industry: industry || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Image generation failed");
      }

      const data = await res.json();
      setResults({ count: data.imageCount || 0, providers: data.providers || [] });
      setStatus("done");

      if (data.html) {
        onApplyImages(data.html);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  const handleSingleGenerate = async () => {
    if (!singlePrompt.trim()) return;

    setSingleStatus("generating");
    setSingleResult(null);
    setSingleError("");

    try {
      const res = await fetch("/api/generate/ai-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: singlePrompt.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Image generation failed");
      }

      const data = await res.json();
      setSingleResult(data.image?.url || null);
      setSingleStatus("done");
    } catch (err) {
      setSingleError(err instanceof Error ? err.message : "Image generation failed");
      setSingleStatus("error");
    }
  };

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ImagePlus className="w-4 h-4 text-brand-400" />
          AI Image Engine
        </h3>
        <p className="text-xs text-white/50">
          Replace placeholder images with AI-generated or premium stock photos.
        </p>
      </div>

      {/* Provider Status */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { name: "DALL-E 3", key: "OPENAI_API_KEY" },
          { name: "Stability", key: "STABILITY_API_KEY" },
          { name: "Unsplash", key: "UNSPLASH_ACCESS_KEY" },
        ].map((p) => (
          <div key={p.name} className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <span className="text-[10px] text-white/50">{p.name}</span>
          </div>
        ))}
      </div>

      {/* Replace all images in page */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-white/50 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Replace Page Images
        </p>

        <input
          type="text"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="Industry (e.g., real estate, restaurant)"
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-white/50 focus:outline-none focus:border-brand-500/40 transition-colors"
        />

        <button
          onClick={handleReplaceAll}
          disabled={!code || status === "generating"}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-accent-purple text-white text-xs font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {status === "generating" ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Generating images...
            </>
          ) : (
            <>
              <ImagePlus className="w-3.5 h-3.5" />
              Replace All Placeholder Images
            </>
          )}
        </button>

        {status === "done" && results && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-stone-500/10 border border-stone-500/20">
            <CheckCircle2 className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-stone-400 font-medium">
                Replaced {results.count} images
              </p>
              <p className="text-[10px] text-stone-400/60 mt-0.5">
                Providers: {results.providers.join(", ")}
              </p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-stone-500/10 border border-stone-500/20">
            <AlertCircle className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-stone-400">{error}</p>
          </div>
        )}
      </div>

      {/* Single image generation */}
      <div className="space-y-2 pt-3 border-t border-white/[0.06]">
        <p className="text-[10px] uppercase tracking-widest text-white/50 flex items-center gap-1.5">
          <Wand2 className="w-3 h-3" />
          Generate Single Image
        </p>

        <textarea
          value={singlePrompt}
          onChange={(e) => setSinglePrompt(e.target.value)}
          placeholder="Describe the image you want..."
          rows={2}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-white/50 focus:outline-none focus:border-brand-500/40 transition-colors resize-none"
        />

        <button
          onClick={handleSingleGenerate}
          disabled={!singlePrompt.trim() || singleStatus === "generating"}
          className="w-full flex items-center justify-center gap-2 bg-white/[0.06] border border-white/[0.08] text-white text-xs font-medium py-2 rounded-lg hover:bg-white/[0.1] transition-colors disabled:opacity-40"
        >
          {singleStatus === "generating" ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-3.5 h-3.5" />
              Generate Image
            </>
          )}
        </button>

        {singleStatus === "error" && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-stone-500/10 border border-stone-500/20">
            <AlertCircle className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-stone-400">{singleError || "Image generation failed"}</p>
          </div>
        )}

        {singleResult && (
          <div className="rounded-lg overflow-hidden border border-white/[0.08]">
            <div className="relative w-full h-40">
              <Image src={singleResult} alt="AI Generated" fill unoptimized className="object-cover" />
            </div>
            <div className="p-2 bg-white/[0.02]">
              <button
                onClick={() => navigator.clipboard.writeText(singleResult).catch(() => {})}
                className="text-[10px] text-brand-400 hover:text-brand-300 transition-colors"
              >
                Copy URL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
