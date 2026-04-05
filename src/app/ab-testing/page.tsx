'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FlaskConical,
  Plus,
  Play,
  Pause,
  Check,
  BarChart3,
  ArrowRight,
  Zap,
  TrendingUp,
  Target,
  Eye,
  RefreshCw,
  Sparkles,
  Clock,
  Users,
  AlertCircle,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Trophy,
  Lightbulb,
  X,
  Percent,
  MousePointer2,
  ShoppingCart,
  Mail,
} from 'lucide-react';

type ExperimentStatus = 'running' | 'completed' | 'draft' | 'paused';

interface Experiment {
  id: string;
  name: string;
  hypothesis: string;
  status: ExperimentStatus;
  metric: string;
  variantA: { name: string; value: number; visitors: number };
  variantB: { name: string; value: number; visitors: number };
  confidence: number;
  startDate: string;
  duration: string;
  winner?: 'A' | 'B' | null;
  improvement?: number;
}

const DEMO_EXPERIMENTS: Experiment[] = [
  {
    id: '1', name: 'Hero CTA Button Color', hypothesis: 'Changing the CTA from blue to green will increase signups because green implies "go" and reduces friction.',
    status: 'running', metric: 'Signup Rate',
    variantA: { name: 'Blue Button (Control)', value: 3.2, visitors: 12400 },
    variantB: { name: 'Green Button', value: 3.8, visitors: 12380 },
    confidence: 89, startDate: 'Mar 10, 2026', duration: '13 days',
  },
  {
    id: '2', name: 'Pricing Page Layout', hypothesis: 'A horizontal pricing table will outperform vertical cards because users can compare plans side-by-side.',
    status: 'completed', metric: 'Plan Selection Rate',
    variantA: { name: 'Vertical Cards (Control)', value: 12.1, visitors: 24800 },
    variantB: { name: 'Horizontal Table', value: 14.6, visitors: 24750 },
    confidence: 97, startDate: 'Feb 15, 2026', duration: '28 days', winner: 'B', improvement: 20.7,
  },
  {
    id: '3', name: 'Social Proof Placement', hypothesis: 'Moving testimonials above the fold will increase trust and boost conversions by at least 10%.',
    status: 'running', metric: 'Conversion Rate',
    variantA: { name: 'Below Fold (Control)', value: 4.5, visitors: 8200 },
    variantB: { name: 'Above Fold', value: 5.1, visitors: 8180 },
    confidence: 76, startDate: 'Mar 15, 2026', duration: '8 days',
  },
  {
    id: '4', name: 'Checkout Form Length', hypothesis: 'Reducing checkout fields from 8 to 4 will decrease cart abandonment by removing friction.',
    status: 'completed', metric: 'Checkout Completion',
    variantA: { name: '8 Fields (Control)', value: 34.2, visitors: 15600 },
    variantB: { name: '4 Fields', value: 41.8, visitors: 15550 },
    confidence: 99, startDate: 'Jan 20, 2026', duration: '35 days', winner: 'B', improvement: 22.2,
  },
  {
    id: '5', name: 'Email Subject Line', hypothesis: 'Personalized subject lines with the recipient name will improve open rates vs generic subjects.',
    status: 'paused', metric: 'Open Rate',
    variantA: { name: 'Generic Subject', value: 22.4, visitors: 5000 },
    variantB: { name: 'Personalized Subject', value: 28.1, visitors: 5000 },
    confidence: 92, startDate: 'Mar 1, 2026', duration: '15 days (paused)',
  },
  {
    id: '6', name: 'Feature Page Hero Image', hypothesis: 'A screenshot of the actual product will outperform the abstract illustration hero image.',
    status: 'draft', metric: 'Page Engagement',
    variantA: { name: 'Abstract Illustration', value: 0, visitors: 0 },
    variantB: { name: 'Product Screenshot', value: 0, visitors: 0 },
    confidence: 0, startDate: 'Not started', duration: '-',
  },
];

const AI_SUGGESTIONS = [
  { title: 'Test CTA copy: "Start Free" vs "Build Your Site"', reason: 'Action-specific CTAs convert 28% better than generic ones', impact: 'high', metric: 'Signup Rate' },
  { title: 'Test pricing page: monthly vs annual toggle default', reason: 'Defaulting to annual can increase ARPU by 15-25%', impact: 'high', metric: 'Revenue' },
  { title: 'Test hero: video background vs static image', reason: 'Video heroes increase time-on-page by 88% on average', impact: 'medium', metric: 'Engagement' },
  { title: 'Test nav: sticky vs scroll-away on mobile', reason: 'Sticky navs on mobile improve cross-page navigation by 20%', impact: 'medium', metric: 'Page Views' },
  { title: 'Test form: multi-step vs single-page signup', reason: 'Multi-step forms reduce perceived effort and improve completion', impact: 'high', metric: 'Signup Rate' },
];

const STATUS_CONFIG: Record<ExperimentStatus, { label: string; color: string; icon: typeof Play }> = {
  running: { label: 'Running', color: 'bg-green-500/20 text-green-400', icon: Play },
  completed: { label: 'Completed', color: 'bg-blue-500/20 text-blue-400', icon: Check },
  draft: { label: 'Draft', color: 'bg-gray-500/20 text-gray-400', icon: Clock },
  paused: { label: 'Paused', color: 'bg-yellow-500/20 text-yellow-400', icon: Pause },
};

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${value >= 95 ? 'bg-green-500' : value >= 80 ? 'bg-yellow-500' : 'bg-gray-500'}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs font-medium ${value >= 95 ? 'text-green-400' : value >= 80 ? 'text-yellow-400' : 'text-gray-400'}`}>{value}%</span>
    </div>
  );
}

export default function ABTestingPage() {
  const [activeTab, setActiveTab] = useState<'experiments' | 'create' | 'suggestions'>('experiments');
  const [statusFilter, setStatusFilter] = useState<ExperimentStatus | 'all'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newHypothesis, setNewHypothesis] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = statusFilter === 'all' ? DEMO_EXPERIMENTS : DEMO_EXPERIMENTS.filter(e => e.status === statusFilter);
  const runningCount = DEMO_EXPERIMENTS.filter(e => e.status === 'running').length;
  const completedCount = DEMO_EXPERIMENTS.filter(e => e.status === 'completed').length;
  const avgImprovement = DEMO_EXPERIMENTS.filter(e => e.improvement).reduce((a, e) => a + (e.improvement || 0), 0) / DEMO_EXPERIMENTS.filter(e => e.improvement).length;

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <span className="text-white/70 font-medium">A/B Testing</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/builder" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Builder</Link>
            <Link href="/pricing" className="px-4 py-2 text-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-lg font-medium hover:opacity-90 transition-opacity">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm mb-6">
            <FlaskConical className="w-4 h-4" /> Experimentation Platform
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Test Everything, <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Ship Winners</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Create A/B experiments with visual editors, track statistical significance in real-time, and let AI suggest what to test next.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Running Tests', value: runningCount.toString(), icon: Play, color: 'text-green-400' },
            { label: 'Completed', value: completedCount.toString(), icon: Check, color: 'text-blue-400' },
            { label: 'Avg Improvement', value: `+${avgImprovement.toFixed(1)}%`, icon: TrendingUp, color: 'text-violet-400' },
            { label: 'Total Visitors Tested', value: '132K', icon: Users, color: 'text-fuchsia-400' },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/5">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 mb-8 overflow-x-auto">
          {[
            { id: 'experiments' as const, label: 'Experiments', icon: FlaskConical },
            { id: 'create' as const, label: 'Create Test', icon: Plus },
            { id: 'suggestions' as const, label: 'AI Suggestions', icon: Sparkles },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-violet-500/20 text-violet-400' : 'text-gray-400 hover:text-white'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Experiments */}
        {activeTab === 'experiments' && (
          <div className="space-y-4">
            <div className="flex gap-1 mb-4">
              {(['all', 'running', 'completed', 'paused', 'draft'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs ${statusFilter === s ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                  {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>

            {filtered.map(exp => {
              const status = STATUS_CONFIG[exp.status];
              const expanded = expandedId === exp.id;
              return (
                <div key={exp.id} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                  <button onClick={() => setExpandedId(expanded ? null : exp.id)} className="w-full p-5 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{exp.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs ${status.color}`}>{status.label}</span>
                        {exp.winner && (
                          <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs flex items-center gap-1">
                            <Trophy className="w-3 h-3" /> Variant {exp.winner} wins (+{exp.improvement}%)
                          </span>
                        )}
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </div>
                    <p className="text-xs text-gray-400 mb-3">{exp.hypothesis}</p>

                    {/* Quick stats */}
                    {exp.status !== 'draft' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-xs text-gray-400 mb-1">{exp.variantA.name}</div>
                          <div className="text-xl font-bold">{exp.variantA.value}%</div>
                          <div className="text-xs text-gray-500">{exp.variantA.visitors.toLocaleString()} visitors</div>
                        </div>
                        <div className={`p-3 rounded-lg border ${exp.winner === 'B' ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
                          <div className="text-xs text-gray-400 mb-1">{exp.variantB.name}</div>
                          <div className={`text-xl font-bold ${exp.variantB.value > exp.variantA.value ? 'text-green-400' : exp.variantB.value < exp.variantA.value ? 'text-red-400' : ''}`}>
                            {exp.variantB.value}%
                            {exp.variantB.value > exp.variantA.value && <ArrowUpRight className="w-4 h-4 inline ml-1" />}
                            {exp.variantB.value < exp.variantA.value && <ArrowDownRight className="w-4 h-4 inline ml-1" />}
                          </div>
                          <div className="text-xs text-gray-500">{exp.variantB.visitors.toLocaleString()} visitors</div>
                        </div>
                      </div>
                    )}
                  </button>

                  {expanded && (
                    <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Statistical Significance</h4>
                        <ConfidenceBar value={exp.confidence} />
                        <p className="text-xs text-gray-400 mt-1">
                          {exp.confidence >= 95 ? 'Statistically significant — safe to declare a winner.' : exp.confidence >= 80 ? 'Approaching significance — keep running for more data.' : 'Not yet significant — needs more visitor data.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>Metric: {exp.metric}</span>
                        <span>Started: {exp.startDate}</span>
                        <span>Duration: {exp.duration}</span>
                      </div>
                      <div className="flex gap-2">
                        {exp.status === 'running' && <button onClick={() => {}} className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-medium hover:bg-yellow-500/30"><Pause className="w-3 h-3 inline mr-1" /> Pause</button>}
                        {exp.status === 'paused' && <button onClick={() => {}} className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30"><Play className="w-3 h-3 inline mr-1" /> Resume</button>}
                        {exp.status === 'draft' && <button onClick={() => {}} className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30"><Play className="w-3 h-3 inline mr-1" /> Start Test</button>}
                        {exp.winner && <button onClick={() => {}} className="px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-400 text-xs font-medium hover:bg-violet-500/30"><Zap className="w-3 h-3 inline mr-1" /> Apply Winner</button>}
                        <button onClick={() => {}} className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-400 text-xs hover:bg-white/20"><BarChart3 className="w-3 h-3 inline mr-1" /> Full Report</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Create Test */}
        {activeTab === 'create' && (
          <div className="max-w-2xl space-y-6">
            <div className="p-6 rounded-xl border border-white/10 bg-white/5 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Plus className="w-5 h-5 text-violet-400" /> Create New Experiment</h3>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Experiment Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., Hero CTA Color Test" className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Hypothesis</label>
                <textarea value={newHypothesis} onChange={e => setNewHypothesis(e.target.value)} rows={3}
                  placeholder="If we change [X], then [Y] will happen, because [Z]..."
                  className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 resize-none" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Primary Metric</label>
                  <select className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                    <option>Conversion Rate</option><option>Click Rate</option><option>Signup Rate</option><option>Revenue</option><option>Engagement</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Traffic Split</label>
                  <select className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                    <option>50/50</option><option>70/30</option><option>80/20</option><option>90/10</option>
                  </select>
                </div>
              </div>

              {/* Variant Editor */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Variants</label>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                    <div className="text-xs text-gray-400 mb-2 flex items-center gap-1"><span className="w-4 h-4 rounded bg-blue-500/30 text-blue-400 flex items-center justify-center text-[10px] font-bold">A</span> Control</div>
                    <div className="w-full h-28 rounded-lg bg-white/10 border border-dashed border-white/20 flex items-center justify-center text-xs text-gray-500">
                      Original version (no changes)
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-violet-500/20 bg-violet-500/5">
                    <div className="text-xs text-gray-400 mb-2 flex items-center gap-1"><span className="w-4 h-4 rounded bg-violet-500/30 text-violet-400 flex items-center justify-center text-[10px] font-bold">B</span> Variant</div>
                    <div className="w-full h-28 rounded-lg bg-white/10 border border-dashed border-violet-500/30 flex items-center justify-center text-xs text-gray-500 cursor-pointer hover:border-violet-500/50 transition-colors">
                      <div className="text-center"><Eye className="w-5 h-5 mx-auto mb-1 text-violet-400" /><span>Open Visual Editor</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => {}} className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  <Play className="w-4 h-4" /> Create & Start Test
                </button>
                <button onClick={() => {}} className="px-4 py-2.5 rounded-lg bg-white/10 text-sm hover:bg-white/20 transition-colors">Save as Draft</button>
              </div>
            </div>
          </div>
        )}

        {/* AI Suggestions */}
        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h3 className="font-semibold">AI-Powered Test Suggestions</h3>
              <span className="text-sm text-gray-400">Based on your site analytics and industry benchmarks</span>
            </div>
            {AI_SUGGESTIONS.map((sug, i) => (
              <div key={i} className="p-5 rounded-xl border border-white/10 bg-white/5 hover:border-violet-500/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{sug.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-xs ${sug.impact === 'high' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{sug.impact} impact</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{sug.reason}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500">Metric: {sug.metric}</span>
                      <button onClick={() => {}} className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Create This Test</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => {}} className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-colors flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" /> Generate More Suggestions
            </button>
          </div>
        )}

        {/* Features */}
        <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Eye, title: 'Visual Editor', desc: 'Create variants with a point-and-click visual editor. No code required.' },
            { icon: BarChart3, title: 'Real-Time Stats', desc: 'Watch conversion data flow in real-time with statistical significance tracking.' },
            { icon: Sparkles, title: 'AI Suggestions', desc: 'AI analyzes your site and suggests high-impact tests based on industry benchmarks.' },
            { icon: Target, title: 'Smart Targeting', desc: 'Target experiments by device, location, traffic source, or custom segments.' },
          ].map((f, i) => (
            <div key={i} className="p-6 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-colors">
              <f.icon className="w-8 h-8 text-violet-400 mb-3" />
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 text-center p-12 rounded-2xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/20">
          <h2 className="text-3xl font-bold mb-4">Stop Guessing, Start Testing</h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">Every change is a hypothesis. A/B testing turns opinions into data. Average users see 21% improvement in their first month.</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-semibold hover:opacity-90 transition-opacity">
            Start Testing Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}