'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  Send,
  Clock,
  Calendar,
  Palette,
  Building2,
  ArrowRight,
  Check,
  Globe,
  ShoppingCart,
  Users,
  Search,
  ChevronDown,
  Star,
  Zap,
  Eye,
  RefreshCw,
  Lock,
} from 'lucide-react';

const REPORT_TEMPLATES = [
  { id: 'performance', name: 'Performance Report', icon: TrendingUp, color: 'from-stone-500 to-stone-500', description: 'Traffic, conversions, bounce rate, page speed metrics', sections: ['Traffic Overview', 'Top Pages', 'Conversion Funnel', 'Speed Metrics', 'Recommendations'] },
  { id: 'seo', name: 'SEO Report', icon: Search, color: 'from-stone-500 to-stone-500', description: 'Rankings, backlinks, keyword performance, technical SEO', sections: ['Keyword Rankings', 'Backlink Profile', 'Technical Audit', 'Content Gaps', 'Action Items'] },
  { id: 'social', name: 'Social Media Report', icon: Globe, color: 'from-stone-500 to-stone-500', description: 'Engagement, reach, follower growth, top posts', sections: ['Platform Overview', 'Engagement Metrics', 'Follower Growth', 'Top Content', 'Competitor Comparison'] },
  { id: 'ecommerce', name: 'E-Commerce Report', icon: ShoppingCart, color: 'from-stone-500 to-stone-500', description: 'Revenue, AOV, cart abandonment, product performance', sections: ['Revenue Summary', 'Product Performance', 'Cart Analytics', 'Customer Segments', 'Forecast'] },
  { id: 'client', name: 'Client Report', icon: Users, color: 'from-stone-500 to-stone-500', description: 'White-label monthly report for agency clients', sections: ['Executive Summary', 'KPI Dashboard', 'Work Completed', 'Results & ROI', 'Next Month Plan'] },
];

const DEMO_INSIGHTS = [
  { metric: 'Organic Traffic', value: '+23.4%', trend: 'up', detail: 'Month over month growth driven by blog content strategy' },
  { metric: 'Conversion Rate', value: '3.8%', trend: 'up', detail: 'Up from 2.9% after landing page optimization' },
  { metric: 'Bounce Rate', value: '41.2%', trend: 'down', detail: 'Improved by 8% with better page load times' },
  { metric: 'Avg Session Duration', value: '4m 32s', trend: 'up', detail: 'Interactive content keeping visitors engaged longer' },
  { metric: 'Top Keyword', value: '"ai website builder"', trend: 'up', detail: 'Moved from position 12 to position 4' },
  { metric: 'Revenue', value: '$47,290', trend: 'up', detail: 'Record month, 31% above target' },
];

const SCHEDULE_OPTIONS = ['Weekly (Monday)', 'Bi-weekly', 'Monthly (1st)', 'Quarterly'];

function BarChartWidget({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((v, i) => (
        <div key={i} className={`flex-1 rounded-t bg-gradient-to-t ${color} opacity-80 hover:opacity-100 transition-opacity`} style={{ height: `${(v / max) * 100}%` }} />
      ))}
    </div>
  );
}

function PieChartWidget({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((a, b) => a + b.value, 0);
  let cum = 0;
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-24 h-24 rounded-full" style={{ background: `conic-gradient(${segments.map(s => { const start = cum; cum += (s.value / total) * 360; return `${s.color} ${start}deg ${cum}deg`; }).join(', ')})` }}>
        <div className="absolute inset-3 rounded-full" />
      </div>
      <div className="space-y-1">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            <span className="text-gray-400">{s.label}</span>
            <span className="text-white font-medium">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChartWidget({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 80 - 10}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-full h-24" preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
      <polyline fill={`${color}22`} stroke="none" points={`0,100 ${points} 100,100`} />
    </svg>
  );
}

export default function ReportsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState(REPORT_TEMPLATES[0]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [schedule, setSchedule] = useState('');
  const [whiteLabel, setWhiteLabel] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setGenerated(false);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2500);
  };

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0b1530]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <span className="text-white/70 font-medium">AI Reports</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/builder" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Builder</Link>
            <Link href="/pricing" className="px-4 py-2 text-sm bg-gradient-to-r from-stone-600 to-stone-600 rounded-lg font-medium hover:opacity-90 transition-opacity">Upgrade to Pro</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-500/10 border border-stone-500/20 text-stone-400 text-sm mb-6">
            <FileText className="w-4 h-4" /> AI-Powered Reporting
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Reports That Write <span className="bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">Themselves</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Generate beautiful, data-driven reports in seconds. AI analyzes your metrics, writes insights, and delivers white-labeled reports to clients on schedule.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Template Selector */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-stone-400" /> Report Templates</h2>
            {REPORT_TEMPLATES.map(t => (
              <button key={t.id} onClick={() => { setSelectedTemplate(t); setGenerated(false); }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedTemplate.id === t.id ? 'border-stone-500/50 bg-stone-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center`}>
                    <t.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">{t.name}</span>
                </div>
                <p className="text-sm text-gray-400">{t.description}</p>
              </button>
            ))}
          </div>

          {/* Report Builder */}
          <div className="lg:col-span-2 space-y-6">
            {/* Config */}
            <div className="p-6 rounded-xl border border-white/10 bg-white/5 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedTemplate.color} flex items-center justify-center`}>
                  <selectedTemplate.icon className="w-4 h-4 text-white" />
                </div>
                {selectedTemplate.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.sections.map(s => (
                  <span key={s} className="px-3 py-1 rounded-full bg-white/10 text-xs text-gray-300">{s}</span>
                ))}
              </div>

              {/* Options Row */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Date Range</label>
                  <select className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                    <option>Last 30 days</option>
                    <option>Last 7 days</option>
                    <option>Last 90 days</option>
                    <option>Custom range</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Site</label>
                  <select className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                    <option>mystore.zoobicon.sh</option>
                    <option>portfolio.zoobicon.sh</option>
                    <option>agency-client.com</option>
                  </select>
                </div>
              </div>

              {/* White-label Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-stone-400" />
                  <span className="text-sm">White-label for agency</span>
                </div>
                <button onClick={() => setWhiteLabel(!whiteLabel)}
                  className={`w-10 h-5 rounded-full transition-colors ${whiteLabel ? 'bg-stone-500' : 'bg-white/20'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${whiteLabel ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {whiteLabel && (
                <div className="grid sm:grid-cols-2 gap-4 p-3 rounded-lg bg-stone-500/10 border border-stone-500/20">
                  <input placeholder="Agency name" className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500" />
                  <input placeholder="Logo URL" className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500" />
                </div>
              )}

              {/* Schedule */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-stone-400" />
                  <span className="text-sm">Schedule auto-send</span>
                </div>
                <button onClick={() => setShowSchedule(!showSchedule)}
                  className={`w-10 h-5 rounded-full transition-colors ${showSchedule ? 'bg-stone-500' : 'bg-white/20'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${showSchedule ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {showSchedule && (
                <div className="grid sm:grid-cols-2 gap-4 p-3 rounded-lg bg-stone-500/10 border border-stone-500/20">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Frequency</label>
                    <select value={schedule} onChange={e => setSchedule(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                      {SCHEDULE_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Send to</label>
                    <input placeholder="client@example.com" className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500" />
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button onClick={handleGenerate} disabled={generating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-stone-600 to-stone-600 font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                {generating ? <><RefreshCw className="w-4 h-4 animate-spin" /> AI is writing your report...</> : <><Zap className="w-4 h-4" /> Generate Report</>}
              </button>
            </div>

            {/* Generated Report Preview */}
            {generated && (
              <div className="p-6 rounded-xl border border-white/10 bg-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{selectedTemplate.name} — February 2026</h3>
                  <div className="flex gap-2">
                    <button onClick={() => {}} className="px-3 py-1.5 rounded-lg bg-white/10 text-sm hover:bg-white/20 transition-colors flex items-center gap-1"><Download className="w-3 h-3" /> PDF</button>
                    <button onClick={() => {}} className="px-3 py-1.5 rounded-lg bg-white/10 text-sm hover:bg-white/20 transition-colors flex items-center gap-1"><Send className="w-3 h-3" /> Send</button>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-gray-400 mb-2">Traffic (Last 30 Days)</p>
                    <LineChartWidget data={[420, 380, 510, 490, 620, 580, 710, 690, 780, 820, 750, 890]} color="#3b82f6" />
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-gray-400 mb-2">Revenue by Channel</p>
                    <PieChartWidget segments={[
                      { label: 'Organic', value: 45, color: '#3b82f6' },
                      { label: 'Paid', value: 28, color: '#8b5cf6' },
                      { label: 'Referral', value: 17, color: '#10b981' },
                      { label: 'Direct', value: 10, color: '#f59e0b' },
                    ]} />
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-gray-400 mb-2">Conversions by Day</p>
                    <BarChartWidget data={[12, 18, 15, 22, 28, 24, 31, 19, 26, 33, 29, 35]} color="from-stone-500 to-stone-500" />
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-gray-400 mb-2">Page Load Time (ms)</p>
                    <LineChartWidget data={[1200, 1100, 980, 1050, 920, 880, 850, 810, 790, 770, 740, 720]} color="#10b981" />
                  </div>
                </div>

                {/* AI Insights */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-stone-400" /> AI-Generated Insights</h4>
                  <div className="space-y-3">
                    {DEMO_INSIGHTS.map((insight, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                        <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${insight.trend === 'up' ? 'bg-stone-500/20 text-stone-400' : 'bg-stone-500/20 text-stone-400'}`}>
                          {insight.trend === 'up' ? '↑' : '↓'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{insight.metric}</span>
                            <span className={`text-sm font-bold ${insight.trend === 'up' ? 'text-stone-400' : 'text-stone-400'}`}>{insight.value}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{insight.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Zap, title: 'AI Insights', desc: 'AI analyzes your data and writes human-readable insights with actionable recommendations' },
            { icon: Palette, title: 'White-Label', desc: 'Replace branding with your agency logo, colors, and domain for client-ready reports' },
            { icon: Clock, title: 'Auto-Schedule', desc: 'Set it and forget it. Reports generate and send to clients weekly or monthly' },
            { icon: Download, title: 'Export Anywhere', desc: 'Download as PDF, share via link, or embed in your client portal' },
          ].map((f, i) => (
            <div key={i} className="p-6 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-colors">
              <f.icon className="w-8 h-8 text-stone-400 mb-3" />
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 text-center p-12 rounded-2xl bg-gradient-to-br from-stone-600/20 to-stone-600/20 border border-stone-500/20">
          <h2 className="text-3xl font-bold mb-4">Stop Writing Reports Manually</h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">AI generates beautiful, data-driven reports in seconds. Included free on Pro and Agency plans.</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-stone-600 to-stone-600 font-semibold hover:opacity-90 transition-opacity">
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}