"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Mic, MicOff, Sparkles, Zap, Pencil, Send, Check, ChevronDown, Cpu, LayoutTemplate, SlidersHorizontal } from "lucide-react";
import TemplateGallery from "./TemplateGallery";
import CustomizationPanel, {
  DEFAULT_CUSTOMIZATION,
  buildCustomizationSuffix,
  type CustomizationOptions,
} from "./CustomizationPanel";

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

export interface AIModel {
  provider: string;
  id: string;
  label: string;
  tier: string;
}

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
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  availableModels?: AIModel[];
}

const EXAMPLE_PROMPTS = [
  "A landing page for a cybersecurity startup with dark theme and neon accents",
  "A personal portfolio for a photographer with a minimal, elegant layout",
  "A retro-futuristic dashboard showing weather data with animated charts",
  "A restaurant menu page with a warm, rustic aesthetic and food photography",
  "A SaaS pricing page with three tiers, toggle for monthly/annual, and FAQ section",
];

const STANDARD_FEATURES = ["Opus-powered", "Responsive", "Fast single-pass"];
const PREMIUM_FEATURES = ["10-agent pipeline", "Animations", "SEO + Forms", "React export"];

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
  selectedModel,
  onModelChange,
  availableModels,
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const [isMac, setIsMac] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [customization, setCustomization] = useState<CustomizationOptions>(DEFAULT_CUSTOMIZATION);
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

  const handleGenerateWithCustomization = useCallback(() => {
    if (showCustomization) {
      const suffix = buildCustomizationSuffix(customization);
      const currentPrompt = prompt.trim();
      if (currentPrompt && !currentPrompt.includes("Style preferences:")) {
        onPromptChange(currentPrompt + "\n\n" + suffix);
      }
      setTimeout(() => onGenerate(), 0);
    } else {
      onGenerate();
    }
  }, [showCustomization, customization, prompt, onPromptChange, onGenerate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerateWithCustomization();
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
      {/* Tier toggle — visually distinctive cards */}
      <div className="grid grid-cols-2 gap-2">
        {/* Standard tier card */}
        <button
          onClick={() => onTierChange("standard")}
          className={`relative group flex flex-col items-start p-3 rounded-xl text-left transition-all duration-300 overflow-hidden ${
            tier === "standard"
              ? "bg-white/[0.08] border-2 border-white/20 shadow-lg"
              : "bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10"
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
              tier === "standard" ? "bg-white/15" : "bg-white/[0.06]"
            }`}>
              <Zap className={`w-3.5 h-3.5 ${tier === "standard" ? "text-white" : "text-white/30"}`} />
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${
              tier === "standard" ? "text-white" : "text-white/30"
            }`}>
              Standard
            </span>
          </div>
          <div className="flex flex-col gap-0.5 mt-1">
            {STANDARD_FEATURES.map((f) => (
              <span key={f} className={`text-[9px] flex items-center gap-1 ${
                tier === "standard" ? "text-white/50" : "text-white/15"
              }`}>
                <Check className="w-2.5 h-2.5" />{f}
              </span>
            ))}
          </div>
          {tier === "standard" && (
            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white/60" />
          )}
        </button>

        {/* Premium tier card */}
        <button
          onClick={() => onTierChange("premium")}
          className={`relative group flex flex-col items-start p-3 rounded-xl text-left transition-all duration-300 overflow-hidden ${
            tier === "premium"
              ? "border-2 border-brand-500/40 shadow-lg shadow-brand-500/10"
              : "bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-brand-500/20"
          }`}
          style={tier === "premium" ? {
            background: "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(59,130,246,0.08), rgba(0,200,255,0.05))",
          } : undefined}
        >
          {/* Animated shimmer on premium when selected */}
          {tier === "premium" && (
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(37,99,235,0.3), transparent)",
                backgroundSize: "200% 100%",
                animation: "premium-shimmer 3s linear infinite",
              }}
            />
          )}
          <div className="relative flex items-center gap-2 mb-1.5">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
              tier === "premium"
                ? "bg-gradient-to-br from-brand-500/30 to-accent-cyan/20"
                : "bg-white/[0.06]"
            }`}>
              <Sparkles className={`w-3.5 h-3.5 ${
                tier === "premium" ? "text-brand-300" : "text-white/30"
              }`} />
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${
              tier === "premium" ? "text-brand-300" : "text-white/30"
            }`}>
              Premium
            </span>
          </div>
          <div className="relative flex flex-col gap-0.5 mt-1">
            {PREMIUM_FEATURES.map((f) => (
              <span key={f} className={`text-[9px] flex items-center gap-1 ${
                tier === "premium" ? "text-brand-300/60" : "text-white/15"
              }`}>
                <Check className="w-2.5 h-2.5" />{f}
              </span>
            ))}
          </div>
          {tier === "premium" && (
            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-400/80" />
          )}
        </button>
      </div>

      <style>{`
        @keyframes premium-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* Model selector */}
      {availableModels && availableModels.length > 0 && onModelChange && (
        <div className="relative">
          <button
            onClick={() => setShowModelPicker(!showModelPicker)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Cpu className="w-3.5 h-3.5 text-brand-400/60 flex-shrink-0" />
              <span className="text-[10px] uppercase tracking-wider text-white/40 flex-shrink-0">Model</span>
              <span className="text-xs text-white/70 truncate">
                {availableModels.find(m => m.id === selectedModel)?.label || "Auto (Opus Build)"}
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition-transform ${showModelPicker ? "rotate-180" : ""}`} />
          </button>
          {showModelPicker && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#12121a] border border-white/[0.08] rounded-lg shadow-2xl z-50 max-h-[240px] overflow-y-auto">
              {(["claude", "openai", "gemini"] as const).map(provider => {
                const providerModels = availableModels.filter(m => m.provider === provider);
                if (providerModels.length === 0) return null;
                return (
                  <div key={provider}>
                    <div className="px-3 py-1.5 text-[9px] uppercase tracking-widest text-white/20 border-b border-white/[0.04]">
                      {provider === "claude" ? "Anthropic" : provider === "openai" ? "OpenAI" : "Google"}
                    </div>
                    {providerModels.map(model => (
                      <button
                        key={model.id}
                        onClick={() => { onModelChange(model.id); setShowModelPicker(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/[0.04] transition-colors ${
                          selectedModel === model.id ? "bg-brand-500/10" : ""
                        }`}
                      >
                        <span className={`text-xs ${selectedModel === model.id ? "text-brand-400" : "text-white/60"}`}>
                          {model.label}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                          model.tier === "premium" ? "bg-amber-500/10 text-amber-400/60" :
                          model.tier === "fast" ? "bg-emerald-500/10 text-emerald-400/60" :
                          "bg-blue-500/10 text-blue-400/60"
                        }`}>
                          {model.tier}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Customization toggle + panel */}
      {!hasExistingCode && (
        <>
          <button
            onClick={() => setShowCustomization(!showCustomization)}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-colors text-left ${
              showCustomization
                ? "bg-brand-500/10 border border-brand-500/20"
                : "bg-white/[0.03] border border-white/[0.06] hover:border-white/10"
            }`}
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className={`w-3.5 h-3.5 ${showCustomization ? "text-brand-400" : "text-white/30"}`} />
              <span className={`text-[10px] uppercase tracking-wider ${showCustomization ? "text-brand-300" : "text-white/40"}`}>
                Customize Style
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCustomization ? "rotate-180 text-brand-400" : "text-white/30"}`} />
          </button>
          {showCustomization && (
            <CustomizationPanel options={customization} onChange={setCustomization} />
          )}
        </>
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
          maxLength={20000}
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
        <span>{prompt.length.toLocaleString()} / 20,000</span>
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
        onClick={handleGenerateWithCustomization}
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

      {/* Example prompts + Browse Templates — only when no existing code */}
      {!hasExistingCode && (
        <div className="mt-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-[2px] text-white/20">
              Try an example
            </span>
            <button
              onClick={() => setShowTemplateGallery(true)}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium text-brand-400/60 hover:text-brand-400 bg-brand-500/[0.06] hover:bg-brand-500/[0.12] border border-brand-500/10 hover:border-brand-500/25 transition-all disabled:opacity-40"
            >
              <LayoutTemplate className="w-3 h-3" />
              Browse Templates
            </button>
          </div>
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

      {/* Template gallery modal */}
      {showTemplateGallery && (
        <TemplateGallery
          onSelectTemplate={(templatePrompt) => {
            onPromptChange(templatePrompt);
            setShowTemplateGallery(false);
          }}
          onClose={() => setShowTemplateGallery(false)}
        />
      )}
    </div>
  );
}
