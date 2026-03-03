"use client";

import { useState } from "react";

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
    <div className="p-4 border-b border-gray-200">
      <label className="block text-xs font-medium text-gray-500 mb-2">
        Describe your website
      </label>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="A modern landing page for a SaaS product..."
        disabled={isGenerating}
        rows={4}
        className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5
                   text-sm text-gray-900 placeholder-gray-400
                   focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400
                   transition-all resize-none disabled:opacity-50"
      />

      <button
        onClick={handleSubmit}
        disabled={!prompt.trim() || isGenerating}
        className="w-full mt-3 px-4 py-2.5 text-sm font-medium text-white
                   bg-brand-600 hover:bg-brand-700 rounded-lg
                   transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isGenerating ? "Generating..." : "Generate website"}
      </button>

      <div className="mt-4">
        <div className="text-[11px] font-medium text-gray-400 mb-2">
          Try an example
        </div>
        <div className="flex flex-col gap-1">
          {EXAMPLE_PROMPTS.map((example, i) => (
            <button
              key={i}
              onClick={() => setPrompt(example)}
              disabled={isGenerating}
              className="text-left text-xs text-gray-400 hover:text-brand-600
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
