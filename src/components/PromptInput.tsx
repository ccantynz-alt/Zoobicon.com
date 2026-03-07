"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

interface PromptInputProps {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

const EXAMPLE_PROMPTS = [
  "A portfolio site for a photographer with a grid gallery",
  "A landing page for an AI startup with a hero section",
  "A restaurant menu page with food categories and pricing",
  "A personal blog with a minimalist design",
];

export default function PromptInput({ onGenerate, isGenerating }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return;
    onGenerate(prompt.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 border-b border-white/[0.06]">
      <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">
        Describe your website
      </label>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="A modern landing page for a SaaS product..."
        disabled={isGenerating}
        rows={4}
        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3.5 py-2.5
                   text-sm text-white/90 placeholder-white/20
                   focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/30
                   transition-all resize-none disabled:opacity-50"
      />

      <button
        onClick={handleSubmit}
        disabled={!prompt.trim() || isGenerating}
        className="w-full mt-3 px-4 py-2.5 text-sm font-semibold text-white
                   btn-gradient rounded-xl flex items-center justify-center gap-2
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Sparkles className="w-4 h-4" />
        <span>{isGenerating ? "Generating..." : "Generate Website"}</span>
      </button>

      <div className="mt-4">
        <div className="text-[11px] font-medium text-white/20 mb-2 uppercase tracking-wider">
          Try an example
        </div>
        <div className="flex flex-col gap-1">
          {EXAMPLE_PROMPTS.map((example, i) => (
            <button
              key={i}
              onClick={() => setPrompt(example)}
              disabled={isGenerating}
              className="text-left text-xs text-white/25 hover:text-brand-400
                         transition-colors truncate disabled:opacity-30"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
