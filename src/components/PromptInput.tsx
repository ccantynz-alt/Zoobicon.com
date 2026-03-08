"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Mic, MicOff, Sparkles, Zap, Pencil, Send } from "lucide-react";

interface SpeechResult {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechEvent {
  resultIndex: number;
  results: { length: number; [key: number]: SpeechResult };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export type Tier = "standard" | "premium";

interface PromptInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  tier: Tier;
  onTierChange: (tier: Tier) => void;
  hasExistingCode: boolean;
  editPrompt: string;
  onEditPromptChange: (value: string) => void;
  onEdit: () => void;
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
  tier,
  onTierChange,
  hasExistingCode,
  editPrompt,
  onEditPromptChange,
  onEdit,
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const [isMac, setIsMac] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform: string } };
    const ua = nav.userAgentData?.platform ?? navigator.userAgent ?? "";
    setIsMac(/mac|iphone|ipad/i.test(ua));

    // Check for speech recognition support
    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    setMicSupported(!!SpeechRecognition);

    if (!hasExistingCode) {
      textareaRef.current?.focus();
    }
  }, [hasExistingCode]);

  const createRecognition = useCallback((): SpeechRecognitionInstance | null => {
    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new (SpeechRecognition as new () => SpeechRecognitionInstance)();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    return recognition;
  }, []);

  const toggleMic = useCallback(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = createRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    let finalTranscript = "";

    recognition.onresult = (event: SpeechEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const text = (finalTranscript + interim).trim();
      if (hasExistingCode) {
        onEditPromptChange(text);
      } else {
        onPromptChange(text);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
  }, [isListening, createRecognition, hasExistingCode, onPromptChange, onEditPromptChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onGenerate();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onEdit();
    }
  };

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      {/* Tier toggle */}
      <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06]">
        <button
          onClick={() => onTierChange("standard")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
            tier === "standard"
              ? "bg-white/[0.08] text-white shadow-sm"
              : "text-white/30 hover:text-white/50"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Standard
        </button>
        <button
          onClick={() => onTierChange("premium")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
            tier === "premium"
              ? "bg-gradient-to-r from-brand-500/20 to-accent-purple/20 text-brand-300 border border-brand-500/20 shadow-sm"
              : "text-white/30 hover:text-white/50"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Premium
        </button>
      </div>

      {tier === "premium" && (
        <div className="text-[10px] text-brand-400/60 bg-brand-500/5 border border-brand-500/10 rounded-lg px-3 py-2 leading-relaxed">
          Premium uses advanced prompting for jaw-dropping, agency-quality designs with animations, glass effects, and rich layouts.
        </div>
      )}

      {/* Main textarea */}
      <div className="relative flex-1 min-h-0">
        <textarea
          ref={textareaRef}
          className="w-full h-full min-h-[120px] bg-[#0a0a0f] border border-white/[0.06] text-white/90 text-sm font-mono rounded-xl p-4 pr-12 outline-none transition-colors focus:border-brand-500/50 focus:shadow-glow resize-none placeholder:text-white/20"
          placeholder="Describe the website you want to build..."
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isGenerating}
          maxLength={5000}
        />
        {/* Mic button inside textarea */}
        {micSupported && (
          <button
            onClick={toggleMic}
            disabled={isGenerating}
            className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
              isListening
                ? "bg-red-500/20 text-red-400 animate-pulse"
                : "bg-white/[0.04] text-white/20 hover:text-white/50 hover:bg-white/[0.08]"
            }`}
            title={isListening ? "Stop listening" : "Voice input"}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Character count + shortcut */}
      <div className="flex justify-between items-center text-[10px] text-white/20">
        <span>{prompt.length} / 5000</span>
        <span className="text-brand-400/50">
          {isMac ? "Cmd" : "Ctrl"}+Enter to build
        </span>
      </div>

      {/* Build button */}
      <button
        className={`w-full py-3 rounded-xl text-sm font-bold text-white uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all ${
          tier === "premium"
            ? "bg-gradient-to-r from-brand-500 via-accent-purple to-brand-600 hover:shadow-glow"
            : "btn-gradient"
        }`}
        onClick={onGenerate}
        disabled={isGenerating || !prompt.trim()}
      >
        {isGenerating ? (
          <span className="loading-dots">Generating</span>
        ) : tier === "premium" ? (
          <span className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Build Premium Website
          </span>
        ) : (
          "Build Website"
        )}
      </button>

      {/* Edit section — only when we have generated code */}
      {hasExistingCode && (
        <div className="border-t border-white/[0.06] pt-3 mt-1">
          <div className="flex items-center gap-2 mb-2">
            <Pencil className="w-3 h-3 text-brand-400/50" />
            <span className="text-[10px] uppercase tracking-[2px] text-brand-400/50">
              Edit your website
            </span>
          </div>
          <div className="relative">
            <textarea
              ref={editInputRef}
              className="w-full min-h-[70px] bg-[#0a0a0f] border border-white/[0.06] text-white/90 text-sm font-mono rounded-xl p-3 pr-20 outline-none transition-colors focus:border-brand-500/50 resize-none placeholder:text-white/20"
              placeholder="e.g. Change the hero background to blue, add a pricing section..."
              value={editPrompt}
              onChange={(e) => onEditPromptChange(e.target.value)}
              onKeyDown={handleEditKeyDown}
              disabled={isGenerating}
            />
            <div className="absolute top-2 right-2 flex gap-1">
              {micSupported && (
                <button
                  onClick={toggleMic}
                  disabled={isGenerating}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                    isListening
                      ? "bg-red-500/20 text-red-400 animate-pulse"
                      : "bg-white/[0.04] text-white/20 hover:text-white/50"
                  }`}
                  title={isListening ? "Stop listening" : "Voice input"}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
              )}
              <button
                onClick={onEdit}
                disabled={isGenerating || !editPrompt.trim()}
                className="w-7 h-7 flex items-center justify-center rounded-lg btn-gradient text-white disabled:opacity-30"
                title="Apply edit"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Example prompts — only when no existing code */}
      {!hasExistingCode && (
        <div className="mt-1">
          <span className="text-[10px] uppercase tracking-[2px] text-white/20 block mb-2">
            Try an example
          </span>
          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[160px]">
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
      )}
    </div>
  );
}
