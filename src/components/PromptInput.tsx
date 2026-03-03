"use client";

import { useState } from "react";

interface PromptInputProps {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

const EXAMPLE_PROMPTS = [
  "A portfolio site for a cyberpunk photographer with neon gallery",
  "A landing page for an AI startup with animated hero section",
  "A restaurant menu page with dark theme and food categories",
  "A personal blog with minimalist design and smooth animations",
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
    <div className="p-4 border-b border-cyber-border">
      <div className="text-cyber-cyan/50 mb-3 font-display text-[10px] uppercase tracking-widest">
        // Describe Your Website
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Tell ZOOBICON what to build..."
        disabled={isGenerating}
        rows={4}
        className="w-full bg-cyber-black/60 border border-cyber-border rounded px-4 py-3 
                   text-sm font-body text-gray-200 placeholder-gray-600 
                   focus:outline-none focus:border-cyber-magenta focus:shadow-[0_0_15px_rgba(255,45,123,0.15)]
                   transition-all resize-none disabled:opacity-50"
      />

      <button
        onClick={handleSubmit}
        disabled={!prompt.trim() || isGenerating}
        className="cyber-btn w-full mt-3 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <span className="animate-pulse">◈ GENERATING...</span>
        ) : (
          "◈ BUILD WEBSITE"
        )}
      </button>

      {/* Example Prompts */}
      <div className="mt-4">
        <div className="text-gray-600 text-[10px] font-display uppercase tracking-widest mb-2">
          // Quick Start
        </div>
        <div className="flex flex-col gap-1.5">
          {EXAMPLE_PROMPTS.map((example, i) => (
            <button
              key={i}
              onClick={() => setPrompt(example)}
              disabled={isGenerating}
              className="text-left text-xs text-cyber-cyan/40 hover:text-cyber-cyan/80 
                         transition-colors font-mono truncate disabled:opacity-30"
            >
              → {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
