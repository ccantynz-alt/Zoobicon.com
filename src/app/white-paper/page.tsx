'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Download,
  Sparkles,
  Wand2,
  BookOpen,
  Edit3,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Lock,
  Mail,
  Check,
  Copy,
  Settings,
  Layers,
  BarChart3,
  TrendingUp,
  Lightbulb,
  Target,
  Users,
  ArrowRight,
  Star,
  Clock,
  Zap,
  Globe,
} from 'lucide-react';

const TEMPLATE_LIBRARY = [
  { id: 'tech-trends', name: 'Technology Trends Report', desc: 'Analyze emerging tech trends with data-driven insights', category: 'Technology', pages: '12-15', color: 'from-violet-500 to-blue-500' },
  { id: 'market-analysis', name: 'Market Analysis', desc: 'Comprehensive market size, competition, and opportunity mapping', category: 'Business', pages: '15-20', color: 'from-emerald-500 to-teal-500' },
  { id: 'research-paper', name: 'Research Paper', desc: 'Academic-style research with methodology and findings', category: 'Research', pages: '20-25', color: 'from-blue-500 to-cyan-500' },
  { id: 'industry-report', name: 'Industry Report', desc: 'State of the industry overview with benchmarks', category: 'Industry', pages: '10-12', color: 'from-amber-500 to-orange-500' },
  { id: 'best-practices', name: 'Best Practices Guide', desc: 'Actionable guide with expert recommendations', category: 'Strategy', pages: '8-10', color: 'from-pink-500 to-rose-500' },
  { id: 'roi-analysis', name: 'ROI Analysis', desc: 'Cost-benefit analysis with financial projections', category: 'Finance', pages: '10-15', color: 'from-green-500 to-emerald-500' },
];

const DEFAULT_SECTIONS = [
  { id: 's1', title: 'Executive Summary', content: 'A high-level overview of the key findings, recommendations, and conclusions presented in this white paper.', expanded: true },
  { id: 's2', title: 'The Problem', content: 'Organizations face increasing challenges in adopting AI-powered tools while maintaining data security and regulatory compliance. Traditional approaches fail to scale.', expanded: false },
  { id: 's3', title: 'Market Analysis', content: 'The global AI website builder market is projected to reach $4.2B by 2028, growing at 24.3% CAGR. Key drivers include no-code adoption and SMB digital transformation.', expanded: false },
  { id: 's4', title: 'Our Approach', content: 'A multi-agent pipeline architecture that combines specialized AI models for different aspects of website generation, achieving premium output quality in under 2 minutes.', expanded: false },
  { id: 's5', title: 'Case Studies', content: 'Three real-world implementations demonstrating 340% improvement in time-to-market, 47% increase in conversion rates, and $2.4M additional ARR.', expanded: false },
  { id: 's6', title: 'Data & Methodology', content: 'Analysis of 10,000+ generated websites across 43 categories, using A/B testing with statistical significance (p < 0.05) to validate quality metrics.', expanded: false },
  { id: 's7', title: 'Key Findings', content: 'AI-generated websites match or exceed human-built quality in 78% of blind evaluations. Generation time averages 95 seconds vs. 2-3 weeks for traditional development.', expanded: false },
  { id: 's8', title: 'Conclusions & Recommendations', content: 'Organizations should adopt AI-first website strategies now to capture early-mover advantage. The technology is mature enough for production use across all industries.', expanded: false },
];

export default function WhitePaperPage() {
  const [activeTab, setActiveTab] = useState<'generator' | 'templates' | 'editor' | 'gate'>('generator');
  const [topic, setTopic] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [audience, setAudience] = useState('C-Suite & Decision Makers');
  const [generating, setGenerating] = useState(false);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [gateEnabled, setGateEnabled] = useState(true);
  const [gateEmail, setGateEmail] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const handleGenerate = () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setActiveTab('editor');
    }, 3000);
  };

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, expanded: !s.expanded } : s));
  };

  const handleCopyEmbed = () => {
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <span className="font-semibold text-white">White Paper Generator</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm">
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 transition text-sm font-medium">
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { id: 'generator' as const, label: 'AI Generator', icon: Wand2 },
            { id: 'templates' as const, label: 'Templates', icon: Layers },
            { id: 'editor' as const, label: 'Section Editor', icon: Edit3 },
            { id: 'gate' as const, label: 'Lead Gate', icon: Lock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === tab.id ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* AI Generator */}
        {activeTab === 'generator' && (
          <div className="max-w-3xl mx-auto">
            <div className="p-8 rounded-2xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center">
                  <Wand2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">AI White Paper Generator</h2>
                  <p className="text-sm text-white/50">Generate a comprehensive white paper from a topic description</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/50 mb-1 block">Topic / Thesis</label>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., How AI-powered website builders are disrupting the $200B web development industry, and why enterprises should adopt them in 2026."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/50 mb-1 block">Industry</label>
                    <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none">
                      <option>Technology</option>
                      <option>Healthcare</option>
                      <option>Finance</option>
                      <option>E-commerce</option>
                      <option>Education</option>
                      <option>Real Estate</option>
                      <option>Manufacturing</option>
                      <option>SaaS</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-white/50 mb-1 block">Target Audience</label>
                    <select value={audience} onChange={(e) => setAudience(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none">
                      <option>C-Suite & Decision Makers</option>
                      <option>Technical Leaders</option>
                      <option>Marketing Professionals</option>
                      <option>Developers</option>
                      <option>Investors</option>
                      <option>General Business</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-white/50 mb-1 block">Tone & Style</label>
                  <div className="flex gap-2">
                    {['Authoritative', 'Data-driven', 'Conversational', 'Academic'].map((tone) => (
                      <button key={tone} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-violet-500/30 text-xs transition">{tone}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-white/50 mb-1 block">Target Length</label>
                  <div className="flex gap-2">
                    {['5-8 pages', '10-15 pages', '15-20 pages', '20+ pages'].map((len) => (
                      <button key={len} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-violet-500/30 text-xs transition">{len}</button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating White Paper...</>
                  ) : (
                    <><Sparkles className="w-5 h-5" /> Generate White Paper</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Templates */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEMPLATE_LIBRARY.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`p-6 rounded-2xl border cursor-pointer transition ${
                  selectedTemplate === t.id ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 bg-white/5 hover:border-violet-500/30'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${t.color} flex items-center justify-center mb-4`}>
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-1">{t.name}</h3>
                <p className="text-sm text-white/40 mb-3">{t.desc}</p>
                <div className="flex items-center justify-between text-xs text-white/30">
                  <span className="px-2 py-0.5 rounded-full bg-white/5">{t.category}</span>
                  <span>{t.pages} pages</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Section Editor */}
        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Sections</h3>
                <button className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"><Plus className="w-4 h-4" /> Add Section</button>
              </div>
              {sections.map((section, i) => (
                <div key={section.id} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                  <button onClick={() => toggleSection(section.id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition">
                    <GripVertical className="w-4 h-4 text-white/20 cursor-grab" />
                    <span className="w-6 h-6 rounded-full bg-violet-600/20 text-violet-400 text-xs flex items-center justify-center font-medium">{i + 1}</span>
                    <span className="text-sm font-medium flex-1 text-left">{section.title}</span>
                    {section.expanded ? <ChevronDown className="w-4 h-4 text-white/30" /> : <ChevronRight className="w-4 h-4 text-white/30" />}
                  </button>
                  {section.expanded && (
                    <div className="px-4 pb-4">
                      <textarea
                        value={section.content}
                        onChange={(e) => setSections(prev => prev.map(s => s.id === section.id ? { ...s, content: e.target.value } : s))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <button className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"><Sparkles className="w-3 h-3" /> AI Expand</button>
                        <button className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60"><Trash2 className="w-3 h-3" /> Remove</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className="sticky top-24">
              <div className="p-1 rounded-2xl bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20">
                <div className="bg-white rounded-xl p-8 text-black min-h-[600px]">
                  <div className="text-center mb-8 pb-8 border-b border-gray-200">
                    <p className="text-violet-600 text-xs font-medium uppercase tracking-widest mb-2">White Paper</p>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">How AI Website Builders Are Disrupting the $200B Web Development Industry</h1>
                    <p className="text-sm text-gray-500">Published March 2026 | {industry} | {sections.length} sections</p>
                  </div>
                  <div className="space-y-4">
                    {sections.slice(0, 4).map((section, i) => (
                      <div key={section.id}>
                        <h2 className="text-sm font-bold text-gray-900 mb-1">{i + 1}. {section.title}</h2>
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{section.content}</p>
                      </div>
                    ))}
                    <p className="text-xs text-gray-400 italic">... {sections.length - 4} more sections</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lead Gate */}
        {activeTab === 'gate' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-violet-400" />
                    <h3 className="font-semibold">Email Gate</h3>
                  </div>
                  <button onClick={() => setGateEnabled(!gateEnabled)} className={`w-12 h-6 rounded-full transition ${gateEnabled ? 'bg-violet-600' : 'bg-white/20'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${gateEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <p className="text-sm text-white/50 mb-4">Require an email address before allowing white paper download. Captures leads automatically.</p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Gate Headline</label>
                    <input type="text" defaultValue="Download the full white paper" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Gate Description</label>
                    <input type="text" defaultValue="Enter your email to receive the complete PDF with all data and analysis." className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Button Text</label>
                    <input type="text" defaultValue="Get Free Download" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Show preview (first 2 pages)</span>
                    <div className="w-12 h-6 rounded-full bg-violet-600 cursor-pointer">
                      <div className="w-5 h-5 rounded-full bg-white translate-x-6" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Add to email list</span>
                    <div className="w-12 h-6 rounded-full bg-violet-600 cursor-pointer">
                      <div className="w-5 h-5 rounded-full bg-white translate-x-6" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="font-semibold mb-3">Embed Code</h3>
                <div className="bg-black/50 rounded-xl p-3 font-mono text-xs text-green-400 mb-3">
                  {`<iframe src="https://zoobicon.com/embed/wp/demo123" width="100%" height="600"></iframe>`}
                </div>
                <button onClick={handleCopyEmbed} className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300">
                  {copiedEmbed ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedEmbed ? 'Copied!' : 'Copy Embed Code'}
                </button>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="font-semibold mb-3">Lead Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-white/40">Total Downloads</p>
                    <p className="text-2xl font-bold text-violet-400">847</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Email Captures</p>
                    <p className="text-2xl font-bold text-emerald-400">623</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Conversion Rate</p>
                    <p className="text-2xl font-bold text-amber-400">73.6%</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Shares</p>
                    <p className="text-2xl font-bold text-blue-400">142</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Gate Preview */}
            <div className="sticky top-24">
              <div className="p-1 rounded-2xl bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20">
                <div className="bg-[#0f0f1a] rounded-xl p-8 min-h-[500px] flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-transparent to-transparent rounded-xl z-10" />
                  <div className="absolute top-6 left-6 right-6 opacity-30 z-0">
                    <div className="h-4 bg-white/10 rounded mb-2 w-3/4" />
                    <div className="h-3 bg-white/5 rounded mb-1 w-full" />
                    <div className="h-3 bg-white/5 rounded mb-1 w-full" />
                    <div className="h-3 bg-white/5 rounded mb-4 w-2/3" />
                    <div className="h-4 bg-white/10 rounded mb-2 w-1/2" />
                    <div className="h-3 bg-white/5 rounded mb-1 w-full" />
                    <div className="h-3 bg-white/5 rounded mb-1 w-full" />
                  </div>
                  <div className="relative z-20 text-center max-w-sm">
                    <Lock className="w-12 h-12 mx-auto mb-4 text-violet-400" />
                    <h3 className="text-xl font-bold mb-2">Download the full white paper</h3>
                    <p className="text-sm text-white/50 mb-6">Enter your email to receive the complete PDF with all data and analysis.</p>
                    <div className="space-y-3">
                      <input
                        type="email"
                        value={gateEmail}
                        onChange={(e) => setGateEmail(e.target.value)}
                        placeholder="your@company.com"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-center"
                      />
                      <button className="w-full py-3 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 font-medium text-sm hover:opacity-90 transition flex items-center justify-center gap-2">
                        <Download className="w-4 h-4" /> Get Free Download
                      </button>
                      <p className="text-xs text-white/30">No spam. Unsubscribe anytime.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}