'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Presentation,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Plus,
  ChevronLeft,
  Play,
  Download,
  Copy,
  Maximize2,
  Minimize2,
  Target,
  Lightbulb,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Rocket,
  Eye,
  Settings,
  Layout,
  Palette,
  Image,
  Type,
  Globe,
  Zap,
  Check,
  Star,
  PieChart,
  ArrowUpRight,
} from 'lucide-react';

type TabType = 'editor' | 'generate' | 'themes' | 'present';
type SlideType = 'title' | 'problem' | 'solution' | 'market' | 'traction' | 'business-model' | 'team' | 'ask' | 'custom';

interface Slide {
  id: string;
  type: SlideType;
  title: string;
  content: Record<string, string | string[]>;
  bgColor: string;
  accentColor: string;
}

interface DeckTheme {
  id: string;
  name: string;
  bg: string;
  text: string;
  accent: string;
  secondaryBg: string;
}

const SLIDE_TYPE_CONFIG: Record<SlideType, { label: string; icon: React.ReactNode; description: string }> = {
  'title': { label: 'Title Slide', icon: <Presentation className="w-4 h-4" />, description: 'Company name, tagline, and founding date' },
  'problem': { label: 'Problem', icon: <Target className="w-4 h-4" />, description: 'The pain point you are solving' },
  'solution': { label: 'Solution', icon: <Lightbulb className="w-4 h-4" />, description: 'How your product solves it' },
  'market': { label: 'Market Size', icon: <PieChart className="w-4 h-4" />, description: 'TAM, SAM, SOM analysis' },
  'traction': { label: 'Traction', icon: <TrendingUp className="w-4 h-4" />, description: 'Key metrics and growth' },
  'business-model': { label: 'Business Model', icon: <DollarSign className="w-4 h-4" />, description: 'How you make money' },
  'team': { label: 'Team', icon: <Users className="w-4 h-4" />, description: 'Founding team and advisors' },
  'ask': { label: 'The Ask', icon: <Rocket className="w-4 h-4" />, description: 'Funding amount and use of funds' },
  'custom': { label: 'Custom', icon: <Layout className="w-4 h-4" />, description: 'Free-form content slide' },
};

const THEMES: DeckTheme[] = [
  { id: 'yc', name: 'YC Classic', bg: '#FFFFFF', text: '#1A1A1A', accent: '#FF6600', secondaryBg: '#FFF7F0' },
  { id: 'sequoia', name: 'Sequoia', bg: '#0D1117', text: '#F0F6FC', accent: '#58A6FF', secondaryBg: '#161B22' },
  { id: 'creative', name: 'Creative', bg: '#1A0B2E', text: '#F8F0FF', accent: '#A855F7', secondaryBg: '#2D1B4E' },
  { id: 'minimal', name: 'Minimal', bg: '#FAFAFA', text: '#333333', accent: '#000000', secondaryBg: '#F0F0F0' },
  { id: 'modern', name: 'Modern Dark', bg: '#0A0A12', text: '#FFFFFF', accent: '#22D3EE', secondaryBg: '#1A1A2E' },
  { id: 'warm', name: 'Warm Earth', bg: '#1C1410', text: '#FDE8D0', accent: '#F59E0B', secondaryBg: '#2A1F18' },
];

const DEMO_SLIDES: Slide[] = [
  { id: 's1', type: 'title', title: 'Zoobicon', content: { tagline: 'AI Website Builder That Ships in 90 Seconds', subtitle: 'Seed Round — March 2026', founded: '2025' }, bgColor: '#0A0A12', accentColor: '#8B5CF6' },
  { id: 's2', type: 'problem', title: 'The Problem', content: { headline: 'Building a website still takes 2-6 weeks', points: ['Small businesses pay $5,000-$50,000 for a custom site', '68% of freelancers spend 40%+ of their time on repetitive web work', 'Existing "AI builders" produce generic, unusable output'] }, bgColor: '#0A0A12', accentColor: '#EF4444' },
  { id: 's3', type: 'solution', title: 'The Solution', content: { headline: 'Describe it. Get a $20K-quality site in 90 seconds.', points: ['7-agent AI pipeline with Claude Opus for premium output', '43 specialized generators (not one-size-fits-all)', 'One-click deploy to custom subdomain with SSL'], demo: 'Live demo: zoobicon.com/builder' }, bgColor: '#0A0A12', accentColor: '#22C55E' },
  { id: 's4', type: 'market', title: 'Market Opportunity', content: { tam: '$13.2B', tamLabel: 'Global Website Builder Market (2026)', sam: '$4.1B', samLabel: 'SMB + Freelancer Segment', som: '$82M', somLabel: 'Year 3 Target (2% SAM)' }, bgColor: '#0A0A12', accentColor: '#3B82F6' },
  { id: 's5', type: 'traction', title: 'Traction', content: { metrics: ['47,293 sites generated', '$18.2K MRR (growing 34% MoM)', '12,400 registered users', '89% generation success rate', '4.7/5 user satisfaction score'], timeline: 'Since launch: January 2026' }, bgColor: '#0A0A12', accentColor: '#8B5CF6' },
  { id: 's6', type: 'business-model', title: 'Business Model', content: { headline: 'SaaS + Usage-Based Hybrid', tiers: ['Free: 3 builds/month', 'Creator ($19/mo): 15 builds + custom domains', 'Pro ($49/mo): Unlimited + API access + all tools', 'Agency ($99/mo): White-label + client portal + bulk gen'], arpu: 'Current ARPU: $34/mo' }, bgColor: '#0A0A12', accentColor: '#F59E0B' },
  { id: 's7', type: 'team', title: 'Team', content: { members: ['CEO — 10yr product leader (ex-Stripe)', 'CTO — Former AI research at DeepMind', 'Head of Design — Led design at Layers', 'Head of Growth — Scaled Vercel to $100M ARR'] }, bgColor: '#0A0A12', accentColor: '#8B5CF6' },
  { id: 's8', type: 'ask', title: 'The Ask', content: { amount: '$4M Seed Round', use: ['40% — Engineering (hire 6 engineers)', '25% — AI compute costs (Anthropic, GPU)', '20% — Sales & Marketing', '15% — Operations & Legal'], timeline: 'Runway: 18 months to Series A' }, bgColor: '#0A0A12', accentColor: '#8B5CF6' },
];

function SlidePreview({ slide, isActive, theme }: { slide: Slide; isActive: boolean; theme: DeckTheme }) {
  const bg = theme.bg;
  const text = theme.text;
  const accent = theme.accent;

  return (
    <div className="w-full aspect-[16/9] rounded-lg overflow-hidden" style={{ backgroundColor: bg, color: text }}>
      <div className="w-full h-full p-6 flex flex-col justify-center">
        {slide.type === 'title' && (
          <div className="text-center">
            <h1 className="text-2xl md:text-4xl font-bold mb-2" style={{ color: accent }}>{slide.title}</h1>
            <p className="text-sm md:text-lg opacity-80">{slide.content.tagline as string}</p>
            <p className="text-xs md:text-sm opacity-50 mt-4">{slide.content.subtitle as string}</p>
          </div>
        )}
        {slide.type === 'problem' && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: accent }}>{slide.title}</h2>
            <p className="text-base md:text-lg font-medium mb-4 opacity-90">{slide.content.headline as string}</p>
            <ul className="space-y-2">
              {(slide.content.points as string[])?.map((point, i) => (
                <li key={i} className="text-xs md:text-sm opacity-70 flex items-start gap-2">
                  <span style={{ color: accent }} className="mt-0.5">*</span>{point}
                </li>
              ))}
            </ul>
          </div>
        )}
        {slide.type === 'solution' && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: accent }}>{slide.title}</h2>
            <p className="text-base md:text-lg font-medium mb-4 opacity-90">{slide.content.headline as string}</p>
            <ul className="space-y-2">
              {(slide.content.points as string[])?.map((point, i) => (
                <li key={i} className="text-xs md:text-sm opacity-70 flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: accent }} />{point}
                </li>
              ))}
            </ul>
          </div>
        )}
        {slide.type === 'market' && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-6" style={{ color: accent }}>{slide.title}</h2>
            <div className="grid grid-cols-3 gap-4">
              {['tam', 'sam', 'som'].map(key => (
                <div key={key} className="text-center p-3 rounded-lg" style={{ backgroundColor: theme.secondaryBg }}>
                  <p className="text-xl md:text-3xl font-bold" style={{ color: accent }}>{slide.content[key] as string}</p>
                  <p className="text-[10px] md:text-xs opacity-50 mt-1 uppercase">{key}</p>
                  <p className="text-[10px] md:text-xs opacity-40 mt-0.5">{slide.content[`${key}Label`] as string}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {slide.type === 'traction' && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: accent }}>{slide.title}</h2>
            <div className="space-y-2">
              {(slide.content.metrics as string[])?.map((metric, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ backgroundColor: theme.secondaryBg }}>
                  <ArrowUpRight className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />
                  <span className="text-xs md:text-sm">{metric}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {slide.type === 'business-model' && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: accent }}>{slide.title}</h2>
            <p className="text-sm opacity-80 mb-4">{slide.content.headline as string}</p>
            <div className="space-y-1.5">
              {(slide.content.tiers as string[])?.map((tier, i) => (
                <div key={i} className="text-xs md:text-sm opacity-70 p-2 rounded-lg" style={{ backgroundColor: theme.secondaryBg }}>{tier}</div>
              ))}
            </div>
          </div>
        )}
        {slide.type === 'team' && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-6" style={{ color: accent }}>{slide.title}</h2>
            <div className="grid grid-cols-2 gap-3">
              {(slide.content.members as string[])?.map((member, i) => {
                const [role, ...desc] = member.split(' — ');
                return (
                  <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: theme.secondaryBg }}>
                    <p className="text-xs md:text-sm font-medium" style={{ color: accent }}>{role}</p>
                    <p className="text-[10px] md:text-xs opacity-50 mt-0.5">{desc.join(' — ')}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {slide.type === 'ask' && (
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: accent }}>{slide.title}</h2>
            <p className="text-2xl md:text-4xl font-bold mb-6">{slide.content.amount as string}</p>
            <div className="text-left max-w-sm mx-auto space-y-1.5">
              {(slide.content.use as string[])?.map((item, i) => (
                <p key={i} className="text-xs md:text-sm opacity-70">{item}</p>
              ))}
            </div>
            <p className="text-xs opacity-40 mt-4">{slide.content.timeline as string}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PitchDeckPage() {
  const [activeTab, setActiveTab] = useState<TabType>('editor');
  const [slides] = useState(DEMO_SLIDES);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<DeckTheme>(THEMES[2]);
  const [isPresenting, setIsPresenting] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => { setGenerating(true); setTimeout(() => setGenerating(false), 3000); };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'editor', label: 'Editor', icon: <Layout className="w-4 h-4" /> },
    { id: 'generate', label: 'AI Generate', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'themes', label: 'Themes', icon: <Palette className="w-4 h-4" /> },
    { id: 'present', label: 'Present', icon: <Play className="w-4 h-4" /> },
  ];

  if (isPresenting) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: selectedTheme.bg }}>
        <button onClick={() => setIsPresenting(false)} className="absolute top-4 right-4 p-2 rounded-lg bg-black/20 hover:bg-black/40 text-white/60 hover:text-white z-10 transition-colors">
          <Minimize2 className="w-5 h-5" />
        </button>
        <div className="w-full max-w-5xl px-8">
          <SlidePreview slide={slides[currentSlide]} isActive theme={selectedTheme} />
        </div>
        <div className="absolute bottom-8 flex items-center gap-4">
          <button onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0} className="p-2 rounded-lg bg-black/20 hover:bg-black/40 text-white/60 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm" style={{ color: selectedTheme.text }}>{currentSlide + 1} / {slides.length}</span>
          <button onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))} disabled={currentSlide === slides.length - 1} className="p-2 rounded-lg bg-black/20 hover:bg-black/40 text-white/60 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-bold text-lg bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">Zoobicon</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-white/30" />
            <div className="flex items-center gap-2">
              <Presentation className="w-5 h-5 text-stone-400" />
              <span className="font-semibold">Pitch Deck</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsPresenting(true)} className="flex items-center gap-2 px-4 py-2 bg-stone-600 hover:bg-stone-500 rounded-lg text-sm font-medium transition-colors">
              <Play className="w-4 h-4" /> Present
            </button>
            <Link href="/dashboard" className="px-4 py-2 text-sm bg-stone-600 hover:bg-stone-500 rounded-lg transition-colors">Dashboard</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-stone-600 text-white shadow-lg shadow-stone-600/25' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Slide Navigator */}
            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-2">
              {slides.map((slide, i) => {
                const cfg = SLIDE_TYPE_CONFIG[slide.type];
                return (
                  <button key={slide.id} onClick={() => setCurrentSlide(i)} className={`w-full text-left rounded-xl overflow-hidden border transition-all ${currentSlide === i ? 'border-stone-500/50 ring-2 ring-stone-500/20' : 'border-white/10 hover:border-white/20'}`}>
                    <div className="aspect-[16/9] scale-100">
                      <SlidePreview slide={slide} isActive={currentSlide === i} theme={selectedTheme} />
                    </div>
                    <div className="p-2 bg-white/5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white/30">{cfg.icon}</span>
                        <span className="text-xs font-medium truncate">{slide.title}</span>
                        <span className="text-[10px] text-white/20 ml-auto">{i + 1}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
              <button onClick={() => {}} className="w-full p-4 rounded-xl border-2 border-dashed border-white/20 hover:border-stone-500/50 text-center text-sm text-white/30 hover:text-stone-400 transition-all flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Slide
              </button>
            </div>

            {/* Main Preview */}
            <div className="lg:col-span-3">
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-white/50">{currentSlide + 1} / {slides.length}</span>
                    <button onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))} disabled={currentSlide === slides.length - 1} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"><Copy className="w-4 h-4 text-white/40" /></button>
                    <button onClick={() => setIsPresenting(true)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"><Maximize2 className="w-4 h-4 text-white/40" /></button>
                  </div>
                </div>
                <SlidePreview slide={slides[currentSlide]} isActive theme={selectedTheme} />
              </div>

              {/* Download Options */}
              <div className="mt-4 flex gap-3">
                {['PDF', 'PPTX', 'Google Slides', 'Images'].map(format => (
                  <button onClick={() => {}} key={format} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white/60 hover:text-white transition-all">
                    <Download className="w-4 h-4" /> {format}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'generate' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-600 to-stone-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">AI Deck Generator</h2>
                  <p className="text-sm text-white/50">Describe your startup and we will generate a complete investor deck.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">Company Name</label>
                    <input type="text" placeholder="Your startup" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-stone-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">Stage</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-stone-500/50">
                      <option>Pre-Seed</option>
                      <option>Seed</option>
                      <option>Series A</option>
                      <option>Series B+</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">What does your company do?</label>
                  <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} rows={5} placeholder="We are building an AI-powered platform that... Our target customers are... We differentiate by..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-stone-500/50 resize-none" />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Slide Types to Include</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(SLIDE_TYPE_CONFIG).filter(([k]) => k !== 'custom').map(([key, cfg]) => (
                      <button onClick={() => {}} key={key} className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-600/20 border border-stone-500/30 rounded-lg text-xs text-stone-300 hover:bg-stone-600/30 transition-colors">
                        {cfg.icon} {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleGenerate} disabled={generating} className="w-full py-3 bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-stone-600/25 disabled:opacity-50">
                  {generating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating Deck...</> : <><Sparkles className="w-4 h-4" /> Generate Pitch Deck</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'themes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {THEMES.map(theme => (
              <button key={theme.id} onClick={() => setSelectedTheme(theme)} className={`rounded-2xl overflow-hidden border transition-all ${selectedTheme.id === theme.id ? 'border-stone-500/50 ring-2 ring-stone-500/20' : 'border-white/10 hover:border-white/20'}`}>
                <div className="aspect-[16/9] p-6 flex flex-col justify-center" style={{ backgroundColor: theme.bg }}>
                  <h3 className="text-xl font-bold mb-1" style={{ color: theme.accent }}>Slide Title</h3>
                  <p className="text-sm opacity-60" style={{ color: theme.text }}>Supporting text and details</p>
                  <div className="flex gap-2 mt-4">
                    <div className="w-16 h-2 rounded-full" style={{ backgroundColor: theme.accent }} />
                    <div className="w-12 h-2 rounded-full opacity-30" style={{ backgroundColor: theme.text }} />
                  </div>
                </div>
                <div className="p-4 bg-white/5 flex items-center justify-between">
                  <span className="text-sm font-medium">{theme.name}</span>
                  {selectedTheme.id === theme.id && <Check className="w-4 h-4 text-stone-400" />}
                </div>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'present' && (
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-12">
              <Presentation className="w-16 h-16 text-stone-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-3">Ready to Present</h2>
              <p className="text-white/50 mb-8 max-w-md mx-auto">Your deck has {slides.length} slides using the {selectedTheme.name} theme. Press the button below to enter full-screen presentation mode.</p>
              <button onClick={() => { setCurrentSlide(0); setIsPresenting(true); }} className="px-8 py-4 bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 rounded-xl font-medium text-lg transition-all shadow-lg shadow-stone-600/25 flex items-center gap-3 mx-auto">
                <Play className="w-5 h-5" /> Start Presentation
              </button>
              <p className="text-xs text-white/30 mt-4">Use arrow keys or click to navigate slides. Press Esc to exit.</p>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-white/10 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-white/40 text-sm">
            Replaces Pitch.com ($8/mo), Beautiful.ai ($12/mo), and Slidebean ($29/mo) &mdash; <span className="text-stone-400">included free with Zoobicon Pro</span>
          </p>
          <div className="flex items-center justify-center gap-6 mt-4">
            <Link href="/pricing" className="text-sm text-white/50 hover:text-white transition-colors">Pricing</Link>
            <Link href="/builder" className="text-sm text-white/50 hover:text-white transition-colors">Builder</Link>
            <Link href="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
