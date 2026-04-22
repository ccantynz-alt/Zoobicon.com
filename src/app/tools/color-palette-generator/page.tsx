"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  Copy,
  Check,
  RefreshCw,
  Lock,
  Unlock,
  Download,
} from "lucide-react";

/* ---------- types ---------- */
type HarmonyMode = "random" | "analogous" | "complementary" | "triadic" | "monochromatic";

interface PaletteColor {
  hex: string;
  locked: boolean;
}

/* ---------- color math helpers ---------- */
function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.min(100, Math.max(0, s)) / 100;
  l = Math.min(100, Math.max(0, l)) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn),
    min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function randomHex(): string {
  return (
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")
  );
}

function randRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateHarmony(mode: HarmonyMode, count: number): string[] {
  const baseH = randRange(0, 359);
  const baseS = randRange(50, 90);
  const baseL = randRange(40, 65);

  switch (mode) {
    case "analogous":
      return Array.from({ length: count }, (_, i) => {
        const offset = (i - Math.floor(count / 2)) * 30;
        return hslToHex(baseH + offset, baseS + randRange(-10, 10), baseL + randRange(-10, 10));
      });
    case "complementary": {
      const colors: string[] = [];
      for (let i = 0; i < count; i++) {
        const h = i % 2 === 0 ? baseH : baseH + 180;
        colors.push(hslToHex(h + randRange(-15, 15), baseS + randRange(-10, 10), baseL + (i * 6 - 12)));
      }
      return colors;
    }
    case "triadic": {
      const colors: string[] = [];
      for (let i = 0; i < count; i++) {
        const h = baseH + (i % 3) * 120;
        colors.push(hslToHex(h + randRange(-10, 10), baseS + randRange(-10, 10), baseL + randRange(-15, 15)));
      }
      return colors;
    }
    case "monochromatic":
      return Array.from({ length: count }, (_, i) => {
        const l = 25 + (i * 50) / (count - 1);
        return hslToHex(baseH, baseS + randRange(-5, 5), l);
      });
    default:
      return Array.from({ length: count }, () => randomHex());
  }
}

function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/* ---------- JSON-LD ---------- */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Zoobicon Free Color Palette Generator",
      applicationCategory: "WebApplication",
      operatingSystem: "Any",
      url: "https://zoobicon.com/tools/color-palette-generator",
      description:
        "Free color palette generator with harmony modes, lock colors, copy hex codes, and export as CSS variables or Tailwind config.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      creator: {
        "@type": "Organization",
        name: "Zoobicon",
        url: "https://zoobicon.com",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How does the color palette generator work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The generator creates harmonious 5-color palettes using color theory. Choose a harmony mode (analogous, complementary, triadic, or monochromatic) and click Generate. Lock any colors you like to keep them when generating new ones.",
          },
        },
        {
          "@type": "Question",
          name: "Can I export the palette for my project?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Export your palette as CSS custom properties (variables) or as a Tailwind CSS configuration object. Click the export button and paste directly into your project.",
          },
        },
        {
          "@type": "Question",
          name: "Is this tool free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Completely free, no signup required. Everything runs in your browser. Generate unlimited palettes and export as many as you need.",
          },
        },
      ],
    },
  ],
};

/* ---------- component ---------- */
export default function ColorPaletteGeneratorPage() {
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [mode, setMode] = useState<HarmonyMode>("random");
  const [copied, setCopied] = useState<string | null>(null);
  const [exportMode, setExportMode] = useState<"css" | "tailwind" | null>(null);
  const [exportCopied, setExportCopied] = useState(false);

  const generate = useCallback(() => {
    const newColors = generateHarmony(mode, 5);
    setPalette((prev) => {
      if (prev.length === 0) {
        return newColors.map((hex) => ({ hex, locked: false }));
      }
      return prev.map((c, i) =>
        c.locked ? c : { hex: newColors[i] || randomHex(), locked: false }
      );
    });
  }, [mode]);

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleLock = (index: number) => {
    setPalette((prev) =>
      prev.map((c, i) => (i === index ? { ...c, locked: !c.locked } : c))
    );
  };

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex).catch(() => {});
    setCopied(hex);
    setTimeout(() => setCopied(null), 1500);
  };

  const getCssExport = () => {
    const lines = palette.map(
      (c, i) => `  --color-${i + 1}: ${c.hex};`
    );
    return `:root {\n${lines.join("\n")}\n}`;
  };

  const getTailwindExport = () => {
    const entries = palette
      .map((c, i) => `      '${i + 1}': '${c.hex}',`)
      .join("\n");
    return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        palette: {\n${entries}\n        },\n      },\n    },\n  },\n};`;
  };

  const copyExport = () => {
    const text = exportMode === "tailwind" ? getTailwindExport() : getCssExport();
    navigator.clipboard.writeText(text).catch(() => {});
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 2000);
  };

  const modes: { value: HarmonyMode; label: string }[] = [
    { value: "random", label: "Random" },
    { value: "analogous", label: "Analogous" },
    { value: "complementary", label: "Complementary" },
    { value: "triadic", label: "Triadic" },
    { value: "monochromatic", label: "Monochromatic" },
  ];

  return (
    <div className="min-h-screen bg-[#0b1530] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Nav */}
      <nav className="border-b border-white/[0.06] bg-[#0a0a12]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold">Zoobicon</span>
          </Link>
          <div className="flex gap-3 text-xs text-white/40">
            <Link href="/tools" className="hover:text-white/60">
              All Tools
            </Link>
            <Link href="/builder" className="hover:text-white/60">
              Website Builder
            </Link>
            <Link
              href="/auth/signup"
              className="text-brand-400 hover:text-brand-300"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-500/10 border border-stone-500/20 mb-6">
            <span className="text-xs font-medium text-stone-300">
              Free — No Signup Required
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-5">
            Free Color Palette{" "}
            <span className="bg-gradient-to-r from-stone-400 via-stone-400 to-stone-400 bg-clip-text text-transparent">
              Generator
            </span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Generate beautiful color palettes with harmony modes. Lock your
            favorites, copy hex codes, and export as CSS or Tailwind config.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs text-white/30 uppercase tracking-wider mr-1">
            Mode:
          </span>
          {modes.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                mode === m.value
                  ? "bg-stone-600 text-white"
                  : "bg-white/[0.04] text-white/40 hover:bg-white/[0.08]"
              }`}
            >
              {m.label}
            </button>
          ))}
          <button
            onClick={generate}
            className="ml-auto inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 text-sm font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Generate New Palette
          </button>
        </div>

        {/* Palette swatches */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-8">
          {palette.map((color, i) => {
            const { r, g, b } = hexToRgb(color.hex);
            const isLight = luminance(color.hex) > 0.55;
            const textColor = isLight ? "text-black/70" : "text-white/90";
            const subtextColor = isLight ? "text-black/40" : "text-white/50";
            const btnHover = isLight
              ? "hover:bg-black/10"
              : "hover:bg-white/10";

            return (
              <div
                key={i}
                className="rounded-2xl overflow-hidden border border-white/[0.08] flex flex-col"
              >
                {/* Color swatch */}
                <div
                  className="h-40 sm:h-52 flex flex-col items-center justify-center relative cursor-pointer group"
                  style={{ backgroundColor: color.hex }}
                  onClick={() => copyHex(color.hex)}
                >
                  {/* Lock button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLock(i);
                    }}
                    className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all ${btnHover} ${
                      color.locked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {color.locked ? (
                      <Lock className={`w-4 h-4 ${textColor}`} />
                    ) : (
                      <Unlock className={`w-4 h-4 ${textColor}`} />
                    )}
                  </button>

                  {/* Hex display */}
                  <span className={`text-lg font-bold font-mono ${textColor}`}>
                    {color.hex.toUpperCase()}
                  </span>
                  <span className={`text-xs font-mono mt-1 ${subtextColor}`}>
                    rgb({r}, {g}, {b})
                  </span>

                  {/* Copy feedback */}
                  {copied === color.hex && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                      <span className="flex items-center gap-1 text-white font-semibold text-sm">
                        <Check className="w-4 h-4" /> Copied
                      </span>
                    </div>
                  )}
                </div>

                {/* Info bar */}
                <div className="bg-[#0e0e1a] px-3 py-2 flex items-center justify-between">
                  <span className="text-[11px] text-white/30 font-mono">
                    Color {i + 1}
                  </span>
                  <button
                    onClick={() => copyHex(color.hex)}
                    className="text-white/30 hover:text-white/60 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Export section */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Export Palette</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setExportMode("css")}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  exportMode === "css"
                    ? "bg-stone-600 text-white"
                    : "bg-white/[0.04] text-white/40 hover:bg-white/[0.08]"
                }`}
              >
                CSS Variables
              </button>
              <button
                onClick={() => setExportMode("tailwind")}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  exportMode === "tailwind"
                    ? "bg-stone-600 text-white"
                    : "bg-white/[0.04] text-white/40 hover:bg-white/[0.08]"
                }`}
              >
                Tailwind Config
              </button>
            </div>
          </div>

          {exportMode && (
            <div className="relative">
              <pre className="bg-[#0b1530] border border-white/[0.06] rounded-xl p-4 text-xs text-stone-300/80 font-mono overflow-x-auto">
                {exportMode === "tailwind"
                  ? getTailwindExport()
                  : getCssExport()}
              </pre>
              <button
                onClick={copyExport}
                className="absolute top-3 right-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.06] text-xs text-white/50 hover:bg-white/[0.1] transition-colors"
              >
                {exportCopied ? (
                  <>
                    <Check className="w-3 h-3 text-stone-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy
                  </>
                )}
              </button>
            </div>
          )}

          {!exportMode && (
            <p className="text-xs text-white/20">
              Choose an export format above to see the code.
            </p>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center border-t border-white/[0.06] pt-16">
          <h2 className="text-2xl font-bold mb-3">
            Love your palette? Use it in a website.
          </h2>
          <p className="text-white/40 mb-6 max-w-lg mx-auto">
            Build a beautiful website with your custom colors in under 60
            seconds. AI handles the design — you just describe what you want.
          </p>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 font-semibold text-sm transition-colors"
          >
            <Zap className="w-4 h-4" /> Design Your Website Free
          </Link>
        </div>

        {/* FAQ */}
        <div className="mt-16 border-t border-white/[0.06] pt-12">
          <h2 className="text-xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6 max-w-2xl mx-auto text-sm">
            <div>
              <h3 className="font-semibold mb-1">
                How does the color palette generator work?
              </h3>
              <p className="text-white/40">
                The generator creates harmonious 5-color palettes using color
                theory. Choose a harmony mode — analogous, complementary,
                triadic, or monochromatic — and click Generate. Lock any colors
                you like to keep them when generating new ones.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">
                Can I export the palette for my project?
              </h3>
              <p className="text-white/40">
                Yes. Export your palette as CSS custom properties (variables) or
                as a Tailwind CSS configuration object. Click the export format,
                copy the code, and paste directly into your project.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Is this tool free?</h3>
              <p className="text-white/40">
                Completely free, no signup required. Everything runs in your
                browser. Generate unlimited palettes and export as many as you
                need.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-[10px] text-white/15">
            zoobicon.com &middot; zoobicon.ai &middot; zoobicon.io &middot;
            zoobicon.sh
          </p>
        </div>
      </div>
    </div>
  );
}
