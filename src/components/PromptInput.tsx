"use client";

import { useRef, useEffect, useState } from "react";

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
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // Detect macOS/iOS for keyboard shortcut label
    const nav = navigator as Navigator & { userAgentData?: { platform: string } };
    const ua = nav.userAgentData?.platform ?? navigator.userAgent ?? "";
    setIsMac(/mac|iphone|ipad/i.test(ua));
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
        className="flex-1 min-h-[120px] bg-[#0a0a0f] border border-white/[0.06] text-white/90 text-sm font-mono rounded-xl p-4 outline-none transition-colors focus:border-brand-500/50 focus:shadow-glow resize-none placeholder:text-white/20"
        placeholder="Describe the website you want to build..."
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isGenerating}
        maxLength={5000}
      />

      {/* Character count */}
      <div className="flex justify-between items-center text-[10px] text-white/20">
        <span>{prompt.length} / 5000</span>
        <span className="text-brand-400/50">
          {isMac ? "Cmd" : "Ctrl"}+Enter to build
        </span>
      </div>

      {/* Build button */}
      <button
        className="btn-gradient w-full py-3 rounded-xl text-sm font-bold text-white uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
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
        <span className="text-[10px] uppercase tracking-[2px] text-white/20 block mb-2">
          Try an example
        </span>
        <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[200px]">
          {EXAMPLE_PROMPTS.map((example, i) => (
            <button
              key={i}
              className="text-left text-xs text-brand-400/50 hover:text-brand-400 transition-colors p-2 rounded-lg hover:bg-white/[0.03] leading-relaxed"
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
