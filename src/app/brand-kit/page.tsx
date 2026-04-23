"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Palette,
  Type,
  Upload,
  Sliders,
  Target,
  Eye,
  Save,
  Download,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  Globe,
  LayoutDashboard,
  LogOut,
  Settings,
  RefreshCw,
} from "lucide-react";
import {
  getBrandKit,
  saveBrandKit,
  getDefaultBrandKit,
  suggestColors,
  generateVoiceSample,
  exportBrandKit,
  importBrandKit,
  type BrandKit,
} from "@/lib/brand-kit";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

type Tab = "colors" | "typography" | "voice" | "audience" | "preview";

const FONT_OPTIONS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Nunito",
  "Playfair Display", "Merriweather", "DM Sans", "Space Grotesk", "Clash Display",
  "Cal Sans", "Bricolage Grotesque", "Geist",
];

const SCALE_OPTIONS: { value: "compact" | "default" | "spacious"; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "default", label: "Default" },
  { value: "spacious", label: "Spacious" },
];

const INDUSTRY_OPTIONS = [
  "Technology", "Healthcare", "Finance", "Education", "Food & Drink",
  "Fashion", "Fitness", "Real Estate", "Creative Agency", "Legal",
  "Nonprofit", "E-Commerce", "SaaS", "Consulting", "Entertainment",
];

export default function BrandKitPage() {
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  const [kit, setKit] = useState<BrandKit>(getDefaultBrandKit());
  const [tab, setTab] = useState<Tab>("colors");
  const [saved, setSaved] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);
  const [voiceSample, setVoiceSample] = useState("");
  const [importText, setImportText] = useState("");

  useEffect(() => {
    const stored = getBrandKit();
    if (stored) setKit(stored);
  }, []);

  useEffect(() => {
    setVoiceSample(generateVoiceSample(kit));
  }, [kit.voice.tone, kit.voice.formality, kit.voice.complexity, kit.logo?.text, kit.audience.industry]);

  const handleSave = () => {
    saveBrandKit(kit);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const def = getDefaultBrandKit();
    setKit(def);
    saveBrandKit(def);
  };

  const handleExport = () => {
    const json = exportBrandKit(kit);
    navigator.clipboard.writeText(json);
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 2000);
  };

  const handleImport = () => {
    try {
      const imported = importBrandKit(importText);
      setKit(imported);
      saveBrandKit(imported);
      setImportText("");
    } catch {
      alert("Invalid brand kit JSON");
    }
  };

  const handleSuggestColors = () => {
    if (!kit.audience.industry) return;
    const suggested = suggestColors(kit.audience.industry);
    setKit({ ...kit, colors: { ...kit.colors, ...suggested } });
  };

  const updateColor = (key: keyof BrandKit["colors"], value: string) => {
    setKit({ ...kit, colors: { ...kit.colors, [key]: value } });
  };

  const updateVoice = (key: keyof BrandKit["voice"], value: number | string[]) => {
    setKit({ ...kit, voice: { ...kit.voice, [key]: value } });
  };

  const COLOR_FIELDS: { key: keyof BrandKit["colors"]; label: string }[] = [
    { key: "primary", label: "Primary" },
    { key: "secondary", label: "Secondary" },
    { key: "accent", label: "Accent" },
    { key: "background", label: "Background" },
    { key: "text", label: "Text" },
  ];

  const VOICE_SLIDERS: { key: "tone" | "formality" | "complexity"; label: string; low: string; high: string }[] = [
    { key: "tone", label: "Tone", low: "Professional", high: "Casual" },
    { key: "formality", label: "Formality", low: "Serious", high: "Playful" },
    { key: "complexity", label: "Complexity", low: "Technical", high: "Simple" },
  ];

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "colors", label: "Colors", icon: Palette },
    { key: "typography", label: "Typography", icon: Type },
    { key: "voice", label: "Brand Voice", icon: Sliders },
    { key: "audience", label: "Audience", icon: Target },
    { key: "preview", label: "Preview", icon: Eye },
  ];

  return (
    <div className="min-h-screen text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1530]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="text-xl font-bold tracking-tight bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">Zoobicon</Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5"><LayoutDashboard className="w-3.5 h-3.5" /> Dashboard</Link>
            {user ? (
              <button onClick={() => { try { localStorage.removeItem("zoobicon_user"); } catch {} setUser(null); }} className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5"><LogOut className="w-3.5 h-3.5" /> Sign out</button>
            ) : (
              <Link href="/auth/login" className="text-sm text-white/60 hover:text-white transition-colors">Sign in</Link>
            )}
          </div>
        </div>
      </nav>

      <header className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-600/10 via-stone-600/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-16 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-stone-500 to-stone-600"><Palette className="w-6 h-6" /></div>
              <span className="text-sm font-medium text-white/50 uppercase tracking-wider">Identity</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
              <span className="bg-gradient-to-r from-stone-400 via-stone-400 to-stone-400 bg-clip-text text-transparent">AI Brand Kit</span>
            </h1>
            <p className="text-lg text-white/50 max-w-2xl">Your brand identity, everywhere — automatically. Define your colors, voice, and audience once. Every AI generation pulls from your kit.</p>
          </motion.div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Action Bar */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-white/50 cursor-pointer">
              <input
                type="checkbox"
                checked={kit.appliedToAll}
                onChange={(e) => setKit({ ...kit, appliedToAll: e.target.checked })}
                className="rounded border-white/20 bg-white/5 text-stone-500 focus:ring-stone-500/50"
              />
              Apply to All Sites
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={handleReset} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <button onClick={handleExport} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
              {exportCopied ? <Check className="w-3.5 h-3.5 text-stone-400" /> : <Copy className="w-3.5 h-3.5" />}
              {exportCopied ? "Copied!" : "Export"}
            </button>
            <button onClick={handleSave} className="px-5 py-2 bg-gradient-to-r from-stone-500 to-stone-600 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? "Saved!" : "Save Kit"}
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 pb-1">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-1.5 ${tab === t.key ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* Colors */}
        {tab === "colors" && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Brand Colors</h3>
                {kit.audience.industry && (
                  <button onClick={handleSuggestColors} className="text-sm text-stone-400 hover:text-stone-300 flex items-center gap-1">
                    <Sparkles className="w-4 h-4" /> Suggest for {kit.audience.industry}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {COLOR_FIELDS.map((f) => (
                  <div key={f.key}>
                    <label className="text-sm text-white/50 block mb-2">{f.label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={kit.colors[f.key]}
                        onChange={(e) => updateColor(f.key, e.target.value)}
                        className="w-12 h-12 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={kit.colors[f.key]}
                        onChange={(e) => updateColor(f.key, e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-stone-500/50"
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* Color Preview Strip */}
              <div className="flex mt-6 rounded-xl overflow-hidden h-12">
                {COLOR_FIELDS.map((f) => (
                  <div key={f.key} className="flex-1" style={{ backgroundColor: kit.colors[f.key] }} />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Typography */}
        {tab === "typography" && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-6">Typography</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-white/50 block mb-2">Heading Font</label>
                  <select
                    value={kit.typography.headingFont}
                    onChange={(e) => setKit({ ...kit, typography: { ...kit.typography, headingFont: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-stone-500/50"
                  >
                    {FONT_OPTIONS.map((f) => <option key={f} value={f} className="bg-[#0f2148]">{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-white/50 block mb-2">Body Font</label>
                  <select
                    value={kit.typography.bodyFont}
                    onChange={(e) => setKit({ ...kit, typography: { ...kit.typography, bodyFont: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-stone-500/50"
                  >
                    {FONT_OPTIONS.map((f) => <option key={f} value={f} className="bg-[#0f2148]">{f}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-6">
                <label className="text-sm text-white/50 block mb-2">Type Scale</label>
                <div className="flex gap-2">
                  {SCALE_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setKit({ ...kit, typography: { ...kit.typography, scale: s.value } })}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        kit.typography.scale === s.value ? "bg-stone-500/20 text-stone-400 border border-stone-500/30" : "bg-white/5 text-white/50 border border-white/10 hover:text-white/70"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Preview */}
              <div className="mt-6 bg-[#0f2148] border border-white/10 rounded-xl p-6" style={{ fontFamily: kit.typography.bodyFont }}>
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: kit.typography.headingFont }}>Heading Preview</h2>
                <h3 className="text-lg font-semibold mb-2 text-white/70" style={{ fontFamily: kit.typography.headingFont }}>Subheading Preview</h3>
                <p className="text-sm text-white/50">This is body text using {kit.typography.bodyFont}. It demonstrates how your content will look with the selected typography settings.</p>
              </div>
            </motion.div>

            {/* Logo */}
            <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Logo / Brand Name</h3>
              <div className="mb-4">
                <label className="text-sm text-white/50 block mb-2">Brand Name</label>
                <input
                  value={kit.logo?.text || ""}
                  onChange={(e) => setKit({ ...kit, logo: { ...kit.logo, text: e.target.value } })}
                  placeholder="My Brand"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-stone-500/50"
                />
              </div>
              <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center">
                <Upload className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-sm text-white/30">Drop your logo here or click to upload</p>
                <p className="text-xs text-white/20 mt-1">SVG, PNG, or JPG (max 2MB)</p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Brand Voice */}
        {tab === "voice" && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-6">Brand Voice</h3>
              <div className="space-y-6">
                {VOICE_SLIDERS.map((s) => (
                  <div key={s.key}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">{s.label}</label>
                      <span className="text-xs text-white/30">{kit.voice[s.key]}/100</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/40 w-24">{s.low}</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={kit.voice[s.key]}
                        onChange={(e) => updateVoice(s.key, Number(e.target.value))}
                        className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-stone-500"
                      />
                      <span className="text-xs text-white/40 w-24 text-right">{s.high}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <label className="text-sm text-white/50 block mb-2">Brand Keywords</label>
                <input
                  value={kit.voice.keywords.join(", ")}
                  onChange={(e) => updateVoice("keywords", e.target.value.split(",").map((k) => k.trim()).filter(Boolean) as unknown as string[])}
                  placeholder="e.g. innovative, fast, reliable, premium"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-stone-500/50"
                />
              </div>
            </motion.div>

            {/* Voice Sample */}
            <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Voice Sample</h3>
                <button onClick={() => setVoiceSample(generateVoiceSample(kit))} className="text-sm text-stone-400 hover:text-stone-300 flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                </button>
              </div>
              <div className="bg-[#0f2148] border border-white/10 rounded-xl p-5">
                <p className="text-sm text-white/70 leading-relaxed italic">&ldquo;{voiceSample}&rdquo;</p>
              </div>
              <p className="text-xs text-white/30 mt-2">This is how AI will write content for your brand. Adjust the sliders to change the voice.</p>
            </motion.div>
          </motion.div>
        )}

        {/* Audience */}
        {tab === "audience" && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-semibold">Target Audience</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-white/50 block mb-2">Industry</label>
                <select
                  value={kit.audience.industry}
                  onChange={(e) => setKit({ ...kit, audience: { ...kit.audience, industry: e.target.value } })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-stone-500/50"
                >
                  <option value="" className="bg-[#0f2148]">Select industry...</option>
                  {INDUSTRY_OPTIONS.map((i) => <option key={i} value={i} className="bg-[#0f2148]">{i}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-white/50 block mb-2">Age Range</label>
                <input
                  value={kit.audience.ageRange}
                  onChange={(e) => setKit({ ...kit, audience: { ...kit.audience, ageRange: e.target.value } })}
                  placeholder="e.g. 25-45"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-stone-500/50"
                />
              </div>
              <div>
                <label className="text-sm text-white/50 block mb-2">Location</label>
                <input
                  value={kit.audience.location}
                  onChange={(e) => setKit({ ...kit, audience: { ...kit.audience, location: e.target.value } })}
                  placeholder="e.g. United States, Global"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-stone-500/50"
                />
              </div>
              <div>
                <label className="text-sm text-white/50 block mb-2">Audience Description</label>
                <textarea
                  value={kit.audience.description}
                  onChange={(e) => setKit({ ...kit, audience: { ...kit.audience, description: e.target.value } })}
                  placeholder="Describe your ideal customer..."
                  className="w-full h-[46px] bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-stone-500/50"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Preview */}
        {tab === "preview" && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={fadeUp} className="rounded-2xl overflow-hidden border border-white/10" style={{ backgroundColor: kit.colors.background }}>
              {/* Mock site header */}
              <div className="p-6 border-b" style={{ borderColor: `${kit.colors.text}15` }}>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold" style={{ color: kit.colors.primary, fontFamily: kit.typography.headingFont }}>
                    {kit.logo?.text || "My Brand"}
                  </span>
                  <div className="flex gap-4">
                    {["Home", "About", "Services", "Contact"].map((item) => (
                      <span key={item} className="text-sm" style={{ color: `${kit.colors.text}80`, fontFamily: kit.typography.bodyFont }}>{item}</span>
                    ))}
                  </div>
                </div>
              </div>
              {/* Hero */}
              <div className="p-12 text-center">
                <h1 className="text-4xl font-extrabold mb-4" style={{ color: kit.colors.text, fontFamily: kit.typography.headingFont }}>
                  Welcome to {kit.logo?.text || "My Brand"}
                </h1>
                <p className="text-lg mb-6 max-w-xl mx-auto" style={{ color: `${kit.colors.text}70`, fontFamily: kit.typography.bodyFont }}>
                  Building the future, one pixel at a time. Let us help you create something extraordinary.
                </p>
                <button onClick={() => {}}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: kit.colors.primary }}
                >
                  Get Started
                </button>
                <button onClick={() => {}}
                  className="px-6 py-3 rounded-xl text-sm font-semibold ml-3 border"
                  style={{ color: kit.colors.secondary, borderColor: kit.colors.secondary }}
                >
                  Learn More
                </button>
              </div>
              {/* Feature Cards */}
              <div className="grid grid-cols-3 gap-4 p-6">
                {["Fast", "Reliable", "Scalable"].map((feat) => (
                  <div key={feat} className="p-5 rounded-xl" style={{ backgroundColor: `${kit.colors.primary}10`, border: `1px solid ${kit.colors.primary}20` }}>
                    <div className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center" style={{ backgroundColor: kit.colors.accent }}>
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1" style={{ color: kit.colors.text, fontFamily: kit.typography.headingFont }}>{feat}</h3>
                    <p className="text-xs" style={{ color: `${kit.colors.text}50`, fontFamily: kit.typography.bodyFont }}>
                      A powerful feature that sets your brand apart from the competition.
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Import */}
            <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-3">Import Brand Kit</h3>
              <p className="text-sm text-white/40 mb-3">Paste exported JSON to import a brand kit.</p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste brand kit JSON here..."
                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white font-mono placeholder:text-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-stone-500/50"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10 transition-colors disabled:opacity-40 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Import
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </main>

      <footer className="border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/30">&copy; {new Date().getFullYear()} Zoobicon. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-white/30 hover:text-white/60 transition-colors">Privacy</Link>
            <Link href="/terms" className="text-sm text-white/30 hover:text-white/60 transition-colors">Terms</Link>
            <Link href="/support" className="text-sm text-white/30 hover:text-white/60 transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
