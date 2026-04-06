'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  Sparkles,
  Wrench,
  Bug,
  Tag,
  ThumbsUp,
  Heart,
  Rocket,
  PartyPopper,
  Code,
  Bell,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Filter,
  ChevronDown,
} from 'lucide-react';

type Category = 'all' | 'new' | 'improvement' | 'fix';

interface ChangelogEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  category: 'new' | 'improvement' | 'fix';
  details: string[];
  reactions: { emoji: string; count: number }[];
  version?: string;
}

const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    id: 'mar-20',
    date: 'March 20, 2026',
    title: 'AI Report Generator',
    description: 'Generate beautiful, data-driven reports in seconds. AI analyzes metrics and writes white-labeled insights for agency clients.',
    category: 'new',
    details: ['5 report templates (Performance, SEO, Social, E-Commerce, Client)', 'AI-written insights with actionable recommendations', 'White-label branding for agencies', 'Scheduled auto-send (weekly/monthly)', 'Export as PDF or shareable link'],
    reactions: [{ emoji: '🚀', count: 47 }, { emoji: '❤️', count: 23 }, { emoji: '👏', count: 18 }],
    version: 'v2.14.0',
  },
  {
    id: 'mar-14',
    date: 'March 14, 2026',
    title: 'Session Recordings & Rage Click Detection',
    description: 'Watch real visitor sessions and automatically detect frustration patterns like rage clicks on broken elements.',
    category: 'new',
    details: ['Full session replay with timeline scrubbing', 'Automatic rage click detection with severity ranking', 'Filter recordings by device, country, and behavior', 'Privacy-safe: no PII captured'],
    reactions: [{ emoji: '🔥', count: 62 }, { emoji: '👀', count: 31 }, { emoji: '❤️', count: 19 }],
    version: 'v2.13.0',
  },
  {
    id: 'mar-8',
    date: 'March 8, 2026',
    title: 'Pipeline Speed Boost — 40% Faster Builds',
    description: 'Parallelized planning agents and optimized streaming reduce average build time from 95s to 57s.',
    category: 'improvement',
    details: ['Strategy + Brand + Copy agents now run in parallel', 'Streaming chunk size optimized for faster preview', 'Component library injection deferred to post-stream', 'Haiku upgraded to latest version for planning agents'],
    reactions: [{ emoji: '⚡', count: 89 }, { emoji: '🚀', count: 54 }, { emoji: '❤️', count: 27 }],
    version: 'v2.12.0',
  },
  {
    id: 'feb-28',
    date: 'February 28, 2026',
    title: 'Visual Editor Section Library',
    description: 'Drag pre-built sections (hero, features, pricing, FAQ, testimonials) directly into your site. 40+ section templates.',
    category: 'new',
    details: ['40+ pre-built section templates', '12 categories (Hero, Features, Pricing, FAQ, etc.)', 'One-click insert at any position', 'Auto-matches your site color scheme', 'Mobile responsive out of the box'],
    reactions: [{ emoji: '🎨', count: 38 }, { emoji: '❤️', count: 22 }, { emoji: '👏', count: 15 }],
    version: 'v2.11.0',
  },
  {
    id: 'feb-20',
    date: 'February 20, 2026',
    title: 'Multi-LLM Support — GPT-4o & Gemini 2.5 Pro',
    description: 'Choose your preferred AI model for generation. Claude, GPT-4o, and Gemini 2.5 Pro all available with automatic failover.',
    category: 'new',
    details: ['Model selector in builder prompt bar', 'GPT-4o integration via OpenAI API', 'Gemini 2.5 Pro and Flash via Google AI', 'Automatic failover if primary model is unavailable', 'Per-agent model routing maintained'],
    reactions: [{ emoji: '🤖', count: 71 }, { emoji: '🚀', count: 45 }, { emoji: '❤️', count: 33 }],
    version: 'v2.10.0',
  },
  {
    id: 'feb-12',
    date: 'February 12, 2026',
    title: 'Fixed Mobile Preview Viewport Scaling',
    description: 'Mobile preview in the builder now accurately matches real device dimensions. Previously showed desktop-width content in mobile frame.',
    category: 'fix',
    details: ['Correct viewport meta tag injection in preview iframe', 'Touch event simulation for mobile interactions', 'Fixed scroll position reset on device switch'],
    reactions: [{ emoji: '🙏', count: 29 }, { emoji: '👏', count: 14 }],
    version: 'v2.9.1',
  },
  {
    id: 'feb-5',
    date: 'February 5, 2026',
    title: 'Agency Quota Tracking & Dashboard',
    description: 'Agencies can now track AI generation usage per month with real-time quota bars and overage warnings.',
    category: 'improvement',
    details: ['Per-month generation tracking (agency_generations table)', 'Real-time quota usage bar on agency dashboard', 'Automatic 429 response when quota exceeded', 'Plan limit enforcement (Starter: 50, Growth: 200, Enterprise: unlimited)'],
    reactions: [{ emoji: '📊', count: 18 }, { emoji: '👏', count: 11 }],
    version: 'v2.9.0',
  },
  {
    id: 'jan-28',
    date: 'January 28, 2026',
    title: 'Full-Stack App Generation',
    description: 'Generate complete applications with database schema, API routes, and CRUD frontend from a single prompt.',
    category: 'new',
    details: ['PostgreSQL schema generation', 'RESTful Next.js API route handlers', 'Interactive frontend with forms, tables, modals', 'Real SQL that runs on Neon serverless Postgres', 'Tabbed view: Schema | API | Frontend'],
    reactions: [{ emoji: '🚀', count: 103 }, { emoji: '🔥', count: 67 }, { emoji: '❤️', count: 42 }],
    version: 'v2.8.0',
  },
  {
    id: 'jan-20',
    date: 'January 20, 2026',
    title: 'Fixed Component Library Hero Effects on Safari',
    description: 'Aurora and mesh gradient hero effects now render correctly on Safari/WebKit. Previously showed solid color fallback.',
    category: 'fix',
    details: ['Added -webkit-prefixed gradient properties', 'Fallback for backdrop-filter on older Safari', 'Fixed animation keyframe timing on WebKit'],
    reactions: [{ emoji: '🙏', count: 34 }, { emoji: '🍎', count: 19 }],
    version: 'v2.7.1',
  },
  {
    id: 'jan-10',
    date: 'January 10, 2026',
    title: 'E-Commerce Storefront Generator',
    description: 'Generate complete online stores with shopping cart, checkout, product grids, search, wishlist, and discount codes.',
    category: 'new',
    details: ['Shopping cart with localStorage persistence', 'Checkout form with Stripe integration', 'Product search and category filters', 'Wishlist and star ratings', 'Discount code support (SAVE10)', 'Shipping calculator and order tracking'],
    reactions: [{ emoji: '🛒', count: 56 }, { emoji: '❤️', count: 38 }, { emoji: '💰', count: 29 }],
    version: 'v2.7.0',
  },
];

const CATEGORY_CONFIG = {
  new: { label: 'New', icon: Sparkles, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  improvement: { label: 'Improvement', icon: Wrench, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  fix: { label: 'Fix', icon: Bug, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
};

const EMBED_CODE = `<iframe
  src="https://zoobicon.com/changelog/embed"
  width="100%"
  height="600"
  frameborder="0"
  style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);"
></iframe>`;

export default function ChangelogPage() {
  const [filter, setFilter] = useState<Category>('all');
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({});
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  const filtered = filter === 'all' ? CHANGELOG_ENTRIES : CHANGELOG_ENTRIES.filter(e => e.category === filter);

  const handleReact = (entryId: string, emoji: string) => {
    setReactions(prev => ({
      ...prev,
      [entryId]: { ...prev[entryId], [emoji]: ((prev[entryId]?.[emoji]) || 0) + 1 }
    }));
  };

  const handleSubscribe = () => { if (email) { setSubscribed(true); setEmail(''); } };
  const handleCopy = () => { navigator.clipboard.writeText(EMBED_CODE); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <span className="text-white/70 font-medium">Changelog</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/roadmap" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Roadmap</Link>
            <Link href="/feature-requests" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Feature Requests</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm mb-6">
            <Megaphone className="w-4 h-4" /> Product Updates
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">What&apos;s New</h1>
          <p className="text-lg text-gray-400">The latest features, improvements, and fixes shipped to Zoobicon.</p>
        </div>

        {/* Subscribe + Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 flex gap-2">
            {subscribed ? (
              <div className="flex items-center gap-2 text-green-400 text-sm"><Check className="w-4 h-4" /> Subscribed! You&apos;ll get email updates.</div>
            ) : (
              <>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500" />
                <button onClick={handleSubscribe} className="px-4 py-2 rounded-lg bg-green-600 text-sm font-medium hover:bg-green-500 transition-colors flex items-center gap-1"><Bell className="w-3 h-3" /> Subscribe</button>
              </>
            )}
          </div>
          <div className="flex gap-1 p-1 bg-white/5 rounded-lg border border-white/10">
            {(['all', 'new', 'improvement', 'fix'] as Category[]).map(c => (
              <button key={c} onClick={() => setFilter(c)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${filter === c ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'}`}>
                {c === 'all' ? 'All' : CATEGORY_CONFIG[c].label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-white/10" />
          <div className="space-y-8">
            {filtered.map(entry => {
              const cat = CATEGORY_CONFIG[entry.category];
              return (
                <div key={entry.id} className="relative pl-12">
                  <div className={`absolute left-0 top-1 w-10 h-10 rounded-full border ${cat.color} flex items-center justify-center`}>
                    <cat.icon className="w-4 h-4" />
                  </div>
                  <div className="p-6 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-colors">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${cat.color}`}>{cat.label}</span>
                      {entry.version && <span className="px-2 py-0.5 rounded bg-white/10 text-xs text-gray-400">{entry.version}</span>}
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" />{entry.date}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{entry.title}</h3>
                    <p className="text-sm text-gray-400 mb-3">{entry.description}</p>
                    <ul className="space-y-1.5 mb-4">
                      {entry.details.map((d, i) => (
                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                          <Check className="w-3 h-3 text-green-400 mt-1 flex-shrink-0" /> {d}
                        </li>
                      ))}
                    </ul>
                    {/* Reactions */}
                    <div className="flex flex-wrap gap-2">
                      {entry.reactions.map((r, i) => {
                        const extra = reactions[entry.id]?.[r.emoji] || 0;
                        return (
                          <button key={i} onClick={() => handleReact(entry.id, r.emoji)}
                            className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors">
                            <span>{r.emoji}</span>
                            <span className="text-gray-400">{r.count + extra}</span>
                          </button>
                        );
                      })}
                      {['🎉', '💡', '🙌'].filter(e => !entry.reactions.find(r => r.emoji === e)).map(emoji => (
                        <button key={emoji} onClick={() => handleReact(entry.id, emoji)}
                          className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors opacity-50 hover:opacity-100">
                          <span>{emoji}</span>
                          <span className="text-gray-400">{reactions[entry.id]?.[emoji] || 0}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Embeddable Widget */}
        <div className="mt-16 p-6 rounded-xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><Code className="w-5 h-5 text-green-400" /> Embed This Changelog</h3>
            <button onClick={() => setShowEmbed(!showEmbed)} className="text-sm text-green-400 hover:text-green-300 transition-colors">{showEmbed ? 'Hide' : 'Show'} Code</button>
          </div>
          <p className="text-sm text-gray-400 mb-4">Add a live changelog widget to your own site. Updates automatically when we ship new features.</p>
          {showEmbed && (
            <div className="relative">
              <pre className="p-4 rounded-lg bg-black/50 border border-white/10 text-sm text-green-400 overflow-x-auto">{EMBED_CODE}</pre>
              <button onClick={handleCopy} className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center p-12 rounded-2xl bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/20">
          <h2 className="text-3xl font-bold mb-4">Building the Future of Web Creation</h2>
          <p className="text-gray-400 mb-6">Want to shape what we build next? Submit a feature request or vote on upcoming features.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/feature-requests" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 font-semibold hover:opacity-90 transition-opacity">
              Request a Feature <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/roadmap" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 font-semibold hover:bg-white/5 transition-colors">
              View Roadmap <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}