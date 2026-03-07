"use client";

import { useRef, useEffect } from "react";

interface PromptInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const EXAMPLE_PROMPTS = [
  "A landing page for a cybersecurity startup with dark theme and neon accents",
  "A personal portfolio for a photographer with a minimal, elegant layout",
  "A retro-futuristic dashboard showing weather data with animated charts",
  "A restaurant menu page with a warm, rustic aesthetic and food photography",
  "A SaaS pricing page with three tiers, toggle for monthly/annual, and FAQ section",
];

export default function PromptInput({
  prompt,
  onPromptChange,
  onGenerate,
  isGenerating,
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onGenerate();
    }
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        className="cyber-input flex-1 min-h-[120px]"
        placeholder="Describe the website you want to build..."
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isGenerating}
        maxLength={5000}
      />

      {/* Character count */}
      <div className="flex justify-between items-center text-[10px] text-cyber-border">
        <span>{prompt.length} / 5000</span>
        <span className="text-cyber-cyan/40">
          {navigator.platform?.includes("Mac") ? "Cmd" : "Ctrl"}+Enter to
          build
        </span>
      </div>

      {/* Build button */}
      <button
        className="cyber-btn w-full"
        onClick={onGenerate}
        disabled={isGenerating || !prompt.trim()}
      >
        {isGenerating ? (
          <span className="loading-dots">Generating</span>
        ) : (
          "Build Website"
        )}
      </button>

      {/* Example prompts */}
      <div className="mt-2">
        <span className="text-[10px] uppercase tracking-[2px] text-cyber-border block mb-2">
          Try an example
        </span>
        <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[200px]">
          {EXAMPLE_PROMPTS.map((example, i) => (
            <button
              key={i}
              className="text-left text-xs text-cyber-cyan/50 hover:text-cyber-cyan transition-colors p-2 rounded hover:bg-cyber-panel/50 leading-relaxed"
              onClick={() => onPromptChange(example)}
              disabled={isGenerating}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
