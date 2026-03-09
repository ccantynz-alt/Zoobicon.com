"use client";

import { useState } from "react";
import { Layers, Loader2, Eye } from "lucide-react";

interface Variant {
  id: string;
  name: string;
  description: string;
  style: string;
  html: string;
}

export default function VariantsPanel({
  code,
  onApplyVariant,
}: {
  code: string;
  onApplyVariant: (html: string) => void;
}) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const generateVariants = async () => {
    const p = prompt.trim() || "Generate design variants of this website";
    setLoading(true);
    try {
      const res = await fetch("/api/generate/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p, count: 3 }),
      });
      if (res.ok) {
        const data = await res.json();
        setVariants(data.variants || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs text-white/40">
        Generate multiple design variants of your site. Pick the one you like best.
      </p>

      <div>
        <label className="text-xs text-white/50 block mb-1.5">Describe your site</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Modern SaaS landing page for a project management tool"
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500/50 resize-none"
        />
      </div>

      <button
        onClick={generateVariants}
        disabled={loading}
        className="w-full py-2.5 rounded-lg text-sm font-medium bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-colors disabled:opacity-40"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Generating 3 variants...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Layers size={16} /> Generate Variants
          </span>
        )}
      </button>

      {variants.length > 0 && (
        <div className="space-y-2">
          {variants.map((v) => (
            <div
              key={v.id}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selected === v.id
                  ? "bg-brand-500/10 border-brand-500/30"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
              onClick={() => setSelected(v.id)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-white">{v.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                  {v.style}
                </span>
              </div>
              <p className="text-xs text-white/50">{v.description}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onApplyVariant(v.html);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-colors"
                >
                  <Eye size={12} /> Use This
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
