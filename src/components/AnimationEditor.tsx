"use client";

import { useState } from "react";
import {
  Wand2,
  Play,
  Pause,
  Trash2,
  Plus,
  ChevronDown,
  Loader2,
  Sparkles,
  MoveUp,
  MoveDown,
  MoveLeft,
  MoveRight,
  RotateCw,
  ZoomIn,
} from "lucide-react";

interface AnimationConfig {
  selector: string;
  type: string;
  options: {
    duration?: number;
    delay?: number;
    easing?: string;
  };
}

interface AnimationEditorProps {
  code: string;
  onApplyAnimations: (animatedCode: string) => void;
}

interface AnimationItem {
  name: string;
  type: string;
  icon: React.ReactNode;
  description: string;
  category: "Entrance" | "Scroll" | "Hover" | "Background" | "Text";
}

interface Preset {
  name: string;
  description: string;
  animations: AnimationConfig[];
}

const ANIMATION_LIBRARY: AnimationItem[] = [
  {
    name: "Fade In",
    type: "fadeIn",
    icon: <Sparkles size={18} />,
    description: "Smoothly fade element into view",
    category: "Entrance",
  },
  {
    name: "Slide Up",
    type: "slideUp",
    icon: <MoveUp size={18} />,
    description: "Slide element up from below",
    category: "Entrance",
  },
  {
    name: "Slide Down",
    type: "slideDown",
    icon: <MoveDown size={18} />,
    description: "Slide element down from above",
    category: "Entrance",
  },
  {
    name: "Slide Left",
    type: "slideLeft",
    icon: <MoveLeft size={18} />,
    description: "Slide element in from the right",
    category: "Entrance",
  },
  {
    name: "Slide Right",
    type: "slideRight",
    icon: <MoveRight size={18} />,
    description: "Slide element in from the left",
    category: "Entrance",
  },
  {
    name: "Scale In",
    type: "scaleIn",
    icon: <ZoomIn size={18} />,
    description: "Scale element from small to full size",
    category: "Entrance",
  },
  {
    name: "Bounce",
    type: "bounce",
    icon: <Play size={18} />,
    description: "Bouncy entrance animation",
    category: "Entrance",
  },
  {
    name: "Rotate",
    type: "rotate",
    icon: <RotateCw size={18} />,
    description: "Rotate element into position",
    category: "Entrance",
  },
  {
    name: "Parallax",
    type: "parallax",
    icon: <MoveUp size={18} />,
    description: "Depth effect on scroll movement",
    category: "Scroll",
  },
  {
    name: "Scroll Reveal",
    type: "scrollReveal",
    icon: <Wand2 size={18} />,
    description: "Reveal elements as you scroll",
    category: "Scroll",
  },
  {
    name: "Stagger",
    type: "stagger",
    icon: <Plus size={18} />,
    description: "Animate children in sequence",
    category: "Scroll",
  },
  {
    name: "Morph Background",
    type: "morphBackground",
    icon: <Sparkles size={18} />,
    description: "Smooth background color transitions",
    category: "Background",
  },
  {
    name: "Typewriter",
    type: "typewriter",
    icon: <Pause size={18} />,
    description: "Text appears character by character",
    category: "Text",
  },
  {
    name: "Count Up",
    type: "countUp",
    icon: <Plus size={18} />,
    description: "Numbers animate counting upward",
    category: "Text",
  },
];

const PRESETS: Preset[] = [
  {
    name: "Subtle Professional",
    description: "Gentle fades and slides for a polished look",
    animations: [
      {
        selector: "header, nav",
        type: "fadeIn",
        options: { duration: 0.6, delay: 0, easing: "ease-out" },
      },
      {
        selector: "section",
        type: "slideUp",
        options: { duration: 0.5, delay: 0.1, easing: "ease-out" },
      },
      {
        selector: "h1, h2, h3",
        type: "fadeIn",
        options: { duration: 0.4, delay: 0.2, easing: "ease" },
      },
      {
        selector: "footer",
        type: "fadeIn",
        options: { duration: 0.5, delay: 0, easing: "ease" },
      },
    ],
  },
  {
    name: "Bold & Dynamic",
    description: "Bounces, scales, and rotations for impact",
    animations: [
      {
        selector: "header",
        type: "slideDown",
        options: { duration: 0.6, delay: 0, easing: "ease-out" },
      },
      {
        selector: "section",
        type: "scaleIn",
        options: { duration: 0.5, delay: 0.1, easing: "ease-in-out" },
      },
      {
        selector: "h1",
        type: "bounce",
        options: { duration: 0.8, delay: 0.2, easing: "ease" },
      },
      {
        selector: "button, .btn, a.cta",
        type: "rotate",
        options: { duration: 0.4, delay: 0.3, easing: "ease-out" },
      },
    ],
  },
  {
    name: "Parallax Storytelling",
    description: "Scroll-driven parallax effects for immersive pages",
    animations: [
      {
        selector: "section",
        type: "parallax",
        options: { duration: 1, delay: 0, easing: "ease" },
      },
      {
        selector: "h1, h2",
        type: "scrollReveal",
        options: { duration: 0.6, delay: 0.1, easing: "ease-out" },
      },
      {
        selector: "img, picture",
        type: "scaleIn",
        options: { duration: 0.7, delay: 0.2, easing: "ease-out" },
      },
      {
        selector: "p",
        type: "fadeIn",
        options: { duration: 0.5, delay: 0.15, easing: "ease" },
      },
    ],
  },
  {
    name: "Minimal Elegance",
    description: "Simple opacity transitions for a clean feel",
    animations: [
      {
        selector: "section",
        type: "fadeIn",
        options: { duration: 0.8, delay: 0, easing: "ease" },
      },
      {
        selector: "h1, h2, h3",
        type: "fadeIn",
        options: { duration: 0.6, delay: 0.1, easing: "ease" },
      },
      {
        selector: "p, li",
        type: "fadeIn",
        options: { duration: 0.5, delay: 0.15, easing: "ease" },
      },
    ],
  },
];

const CATEGORIES = ["Entrance", "Scroll", "Hover", "Background", "Text"] as const;

const EASING_OPTIONS = [
  { label: "Ease", value: "ease" },
  { label: "Ease In", value: "ease-in" },
  { label: "Ease Out", value: "ease-out" },
  { label: "Ease In-Out", value: "ease-in-out" },
  { label: "Cubic Bezier", value: "cubic-bezier(0.4, 0, 0.2, 1)" },
];

export default function AnimationEditor({
  code,
  onApplyAnimations,
}: AnimationEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<AnimationConfig[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("Entrance");
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);

  // Custom builder state
  const [customType, setCustomType] = useState("fadeIn");
  const [customSelector, setCustomSelector] = useState("");
  const [applyToAll, setApplyToAll] = useState(false);
  const [customDuration, setCustomDuration] = useState(0.5);
  const [customDelay, setCustomDelay] = useState(0);
  const [customEasing, setCustomEasing] = useState("ease");

  const addToQueue = (type: string, selector?: string) => {
    const anim: AnimationConfig = {
      selector: selector || (applyToAll ? "section, div, header, footer" : customSelector || "section"),
      type,
      options: {
        duration: customDuration,
        delay: customDelay,
        easing: customEasing,
      },
    };
    setQueue((prev) => [...prev, anim]);
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const applyPreset = (preset: Preset) => {
    setQueue(preset.animations);
  };

  const handleApplyAll = async () => {
    if (queue.length === 0) {
      setError("Add at least one animation to the queue");
      return;
    }

    if (!code.trim()) {
      setError("No code to animate");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/animate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, animations: queue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to apply animations");
      }

      onApplyAnimations(data.animatedCode);
      setQueue([]);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-stone-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-500"
      >
        <Wand2 size={16} />
        Add Animations
      </button>
    );
  }

  const filteredAnimations = ANIMATION_LIBRARY.filter(
    (a) => a.category === activeCategory
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Wand2 size={18} className="text-stone-400" />
          <h2 className="text-sm font-semibold">Animation Editor</h2>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-xs text-white/50 transition-colors hover:text-white"
        >
          Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Presets */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
            Animation Presets
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="rounded-lg border border-white/10 bg-white/5 p-3 text-left transition-all hover:border-stone-500/50 hover:bg-white/10"
              >
                <div className="flex items-center gap-1.5 text-sm font-medium text-stone-300">
                  <Sparkles size={14} />
                  {preset.name}
                </div>
                <p className="mt-1 text-xs text-white/50">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Animation Library */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
            Animation Library
          </h3>
          {/* Category Tabs */}
          <div className="mb-3 flex gap-1 overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-stone-600 text-white"
                    : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {/* Animation Grid */}
          <div className="grid grid-cols-2 gap-2">
            {filteredAnimations.map((anim) => (
              <button
                key={anim.type}
                onClick={() => addToQueue(anim.type)}
                className="group flex items-start gap-2.5 rounded-lg border border-white/10 bg-white/5 p-3 text-left transition-all hover:border-stone-500/50 hover:bg-white/10"
              >
                <div className="mt-0.5 shrink-0 text-stone-400 group-hover:text-stone-300">
                  {anim.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white/90">
                    {anim.name}
                  </div>
                  <p className="mt-0.5 text-xs text-white/50 leading-tight">
                    {anim.description}
                  </p>
                </div>
              </button>
            ))}
            {filteredAnimations.length === 0 && (
              <p className="col-span-2 py-4 text-center text-xs text-white/50">
                No animations in this category yet
              </p>
            )}
          </div>
        </div>

        {/* Custom Animation Builder */}
        <div>
          <button
            onClick={() => setShowCustomBuilder(!showCustomBuilder)}
            className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <span className="flex items-center gap-2">
              <Plus size={14} />
              Custom Animation Builder
            </span>
            <ChevronDown
              size={14}
              className={`transition-transform ${showCustomBuilder ? "rotate-180" : ""}`}
            />
          </button>

          {showCustomBuilder && (
            <div className="mt-2 space-y-3 rounded-lg border border-white/10 bg-white/5 p-3">
              {/* Animation Type */}
              <div>
                <label className="mb-1 block text-xs text-white/50">
                  Animation Type
                </label>
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-stone-500"
                >
                  {ANIMATION_LIBRARY.map((a) => (
                    <option key={a.type} value={a.type}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector */}
              <div>
                <label className="mb-1 block text-xs text-white/50">
                  CSS Selector
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={applyToAll ? "Apply to all sections" : customSelector}
                    onChange={(e) => {
                      setApplyToAll(false);
                      setCustomSelector(e.target.value);
                    }}
                    disabled={applyToAll}
                    placeholder="e.g., .hero, #about, section"
                    className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder-white/50 outline-none focus:border-stone-500 disabled:opacity-50"
                  />
                  <button
                    onClick={() => setApplyToAll(!applyToAll)}
                    className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      applyToAll
                        ? "bg-stone-600 text-white"
                        : "bg-white/10 text-white/50 hover:text-white"
                    }`}
                  >
                    All Sections
                  </button>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="mb-1 flex items-center justify-between text-xs text-white/50">
                  <span>Duration</span>
                  <span className="text-stone-300">{customDuration}s</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(parseFloat(e.target.value))}
                  className="w-full accent-stone-500"
                />
              </div>

              {/* Delay */}
              <div>
                <label className="mb-1 flex items-center justify-between text-xs text-white/50">
                  <span>Delay</span>
                  <span className="text-stone-300">{customDelay}s</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={customDelay}
                  onChange={(e) => setCustomDelay(parseFloat(e.target.value))}
                  className="w-full accent-stone-500"
                />
              </div>

              {/* Easing */}
              <div>
                <label className="mb-1 block text-xs text-white/50">
                  Easing
                </label>
                <select
                  value={customEasing}
                  onChange={(e) => setCustomEasing(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-stone-500"
                >
                  {EASING_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Button */}
              <button
                onClick={() => addToQueue(customType)}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-stone-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-500"
              >
                <Plus size={14} />
                Add Animation
              </button>
            </div>
          )}
        </div>

        {/* Queued Animations */}
        {queue.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
              Queued Animations ({queue.length})
            </h3>
            <div className="space-y-1.5">
              {queue.map((anim, index) => {
                const libItem = ANIMATION_LIBRARY.find(
                  (a) => a.type === anim.type
                );
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-white/80">
                        {libItem?.name || anim.type}
                      </div>
                      <div className="truncate text-xs text-white/50">
                        {anim.selector} &middot; {anim.options.duration}s
                        {anim.options.delay ? ` +${anim.options.delay}s delay` : ""}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromQueue(index)}
                      className="ml-2 shrink-0 text-white/50 transition-colors hover:text-stone-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-md border border-stone-500/30 bg-stone-500/10 px-3 py-2 text-xs text-stone-300">
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        <button
          onClick={handleApplyAll}
          disabled={isLoading || queue.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Applying Animations...
            </>
          ) : (
            <>
              <Wand2 size={16} />
              Apply All Animations
            </>
          )}
        </button>
      </div>
    </div>
  );
}
