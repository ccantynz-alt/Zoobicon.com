"use client";

import { Palette, Type, Layout, Layers } from "lucide-react";

export interface CustomizationOptions {
  palette: string;
  typography: string;
  layout: string;
  sections: string[];
  customColors?: { primary: string; accent: string };
}

const PALETTES = [
  { id: "professional", label: "Professional", colors: ["#1e3a5f", "#ffffff", "#6b7280"] },
  { id: "vibrant", label: "Vibrant", colors: ["#7c3aed", "#ec4899", "#f97316"] },
  { id: "nature", label: "Nature", colors: ["#166534", "#78350f", "#fef3c7"] },
  { id: "tech", label: "Tech", colors: ["#0f172a", "#2563eb", "#06b6d4"] },
  { id: "custom", label: "Custom", colors: [] },
];

const TYPOGRAPHY_OPTIONS = [
  { id: "modern", label: "Modern", desc: "Clean sans-serif" },
  { id: "classic", label: "Classic", desc: "Serif headings, sans body" },
  { id: "playful", label: "Playful", desc: "Rounded, fun" },
  { id: "corporate", label: "Corporate", desc: "Strict, professional" },
];

const LAYOUT_OPTIONS = [
  { id: "hero-first", label: "Hero-first", desc: "Big hero, features, CTA" },
  { id: "storytelling", label: "Storytelling", desc: "Scrolling narrative" },
  { id: "feature-grid", label: "Feature-grid", desc: "Grid-heavy, compact" },
  { id: "minimal", label: "Minimal", desc: "Whitespace, simple" },
];

const ALL_SECTIONS = [
  "Hero",
  "Features",
  "About",
  "Testimonials",
  "Pricing",
  "FAQ",
  "Contact",
  "Footer",
];

interface CustomizationPanelProps {
  options: CustomizationOptions;
  onChange: (options: CustomizationOptions) => void;
}

export const DEFAULT_CUSTOMIZATION: CustomizationOptions = {
  palette: "professional",
  typography: "modern",
  layout: "hero-first",
  sections: [...ALL_SECTIONS],
};

export function buildCustomizationSuffix(options: CustomizationOptions): string {
  const paletteInfo = PALETTES.find((p) => p.id === options.palette);
  let paletteDesc = "";
  if (options.palette === "custom" && options.customColors) {
    paletteDesc = `Custom color palette (primary: ${options.customColors.primary}, accent: ${options.customColors.accent})`;
  } else if (paletteInfo) {
    const colorNames: Record<string, string> = {
      professional: "navy/white/gray",
      vibrant: "purple/pink/orange",
      nature: "green/brown/cream",
      tech: "dark/blue/cyan",
    };
    paletteDesc = `${paletteInfo.label} color palette (${colorNames[options.palette] || ""})`;
  }

  const typoInfo = TYPOGRAPHY_OPTIONS.find((t) => t.id === options.typography);
  const layoutInfo = LAYOUT_OPTIONS.find((l) => l.id === options.layout);

  const parts = [
    `Style preferences: ${paletteDesc}`,
    `${typoInfo?.label || "Modern"} typography`,
    `${layoutInfo?.label || "Hero-first"} layout`,
  ];

  const includedSections = options.sections;
  if (includedSections.length < ALL_SECTIONS.length) {
    parts.push(`Include sections: ${includedSections.join(", ")}`);
  }

  return parts.join(", ") + ".";
}

export default function CustomizationPanel({ options, onChange }: CustomizationPanelProps) {
  const update = (partial: Partial<CustomizationOptions>) => {
    onChange({ ...options, ...partial });
  };

  const toggleSection = (section: string) => {
    const current = options.sections;
    if (current.includes(section)) {
      update({ sections: current.filter((s) => s !== section) });
    } else {
      update({ sections: [...current, section] });
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      {/* Color Palette */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Palette className="w-3 h-3 text-brand-400/60" />
          <span className="text-[10px] uppercase tracking-[1.5px] text-white/50">Color Palette</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              onClick={() => update({ palette: p.id })}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] transition-all ${
                options.palette === p.id
                  ? "bg-brand-500/15 border border-brand-500/30 text-brand-300"
                  : "bg-white/[0.03] border border-white/[0.06] text-white/50 hover:border-white/10 hover:text-white/70"
              }`}
            >
              {p.colors.length > 0 && (
                <span className="flex gap-0.5">
                  {p.colors.map((c, i) => (
                    <span
                      key={i}
                      className="w-2.5 h-2.5 rounded-full border border-white/10"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </span>
              )}
              {p.label}
            </button>
          ))}
        </div>
        {/* Custom color pickers */}
        {options.palette === "custom" && (
          <div className="flex gap-3 mt-2">
            <label className="flex items-center gap-2">
              <span className="text-[10px] text-white/50">Primary</span>
              <input
                type="color"
                value={options.customColors?.primary || "#2563eb"}
                onChange={(e) =>
                  update({
                    customColors: {
                      primary: e.target.value,
                      accent: options.customColors?.accent || "#06b6d4",
                    },
                  })
                }
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-[10px] text-white/50">Accent</span>
              <input
                type="color"
                value={options.customColors?.accent || "#06b6d4"}
                onChange={(e) =>
                  update({
                    customColors: {
                      primary: options.customColors?.primary || "#2563eb",
                      accent: e.target.value,
                    },
                  })
                }
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              />
            </label>
          </div>
        )}
      </div>

      {/* Typography */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Type className="w-3 h-3 text-brand-400/60" />
          <span className="text-[10px] uppercase tracking-[1.5px] text-white/50">Typography</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {TYPOGRAPHY_OPTIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => update({ typography: t.id })}
              className={`flex flex-col items-start px-2.5 py-1.5 rounded-lg text-left transition-all ${
                options.typography === t.id
                  ? "bg-brand-500/15 border border-brand-500/30"
                  : "bg-white/[0.03] border border-white/[0.06] hover:border-white/10"
              }`}
            >
              <span className={`text-[11px] ${options.typography === t.id ? "text-brand-300" : "text-white/60"}`}>
                {t.label}
              </span>
              <span className={`text-[9px] ${options.typography === t.id ? "text-brand-300/50" : "text-white/50"}`}>
                {t.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Layout */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Layout className="w-3 h-3 text-brand-400/60" />
          <span className="text-[10px] uppercase tracking-[1.5px] text-white/50">Layout Style</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {LAYOUT_OPTIONS.map((l) => (
            <button
              key={l.id}
              onClick={() => update({ layout: l.id })}
              className={`flex flex-col items-start px-2.5 py-1.5 rounded-lg text-left transition-all ${
                options.layout === l.id
                  ? "bg-brand-500/15 border border-brand-500/30"
                  : "bg-white/[0.03] border border-white/[0.06] hover:border-white/10"
              }`}
            >
              <span className={`text-[11px] ${options.layout === l.id ? "text-brand-300" : "text-white/60"}`}>
                {l.label}
              </span>
              <span className={`text-[9px] ${options.layout === l.id ? "text-brand-300/50" : "text-white/50"}`}>
                {l.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Layers className="w-3 h-3 text-brand-400/60" />
          <span className="text-[10px] uppercase tracking-[1.5px] text-white/50">Sections</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_SECTIONS.map((section) => {
            const active = options.sections.includes(section);
            return (
              <button
                key={section}
                onClick={() => toggleSection(section)}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                  active
                    ? "bg-brand-500/15 border border-brand-500/30 text-brand-300"
                    : "bg-white/[0.03] border border-white/[0.06] text-white/50 hover:border-white/10 hover:text-white/50"
                }`}
              >
                {section}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
