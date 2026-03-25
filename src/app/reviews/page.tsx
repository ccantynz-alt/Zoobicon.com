'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Star, MessageSquare, TrendingUp, Send, Sparkles, Globe,
  ArrowRight, ThumbsUp, ThumbsDown, Copy, Check, Filter,
  BarChart3, RefreshCw, Bell, ExternalLink, Zap, Clock,
  Users, ChevronDown, Code, Shield
} from 'lucide-react';

interface Review {
  id: string;
  platform: 'google' | 'yelp' | 'g2' | 'trustpilot';
  author: string;
  rating: number;
  text: string;
  date: string;
  replied: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
}

const PLATFORMS = {
  google: { name: 'Google', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  yelp: { name: 'Yelp', color: 'text-red-400', bg: 'bg-red-500/20' },
  g2: { name: 'G2', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  trustpilot: { name: 'TrustPilot', color: 'text-green-400', bg: 'bg-green-500/20' },
};

const DEMO_REVIEWS: Review[] = [
  { id: '1', platform: 'google', author: 'Sarah Mitchell', rating: 5, text: 'Absolutely blown away by how fast I got a professional website. Generated a full e-commerce store in under 2 minutes. The AI understood exactly what I needed.', date: '2 hours ago', replied: false, sentiment: 'positive' },
  { id: '2', platform: 'trustpilot', author: 'James Chen', rating: 5, text: 'Best AI website builder I\'ve tried. The multi-page generation is a game changer — got a 5-page site with consistent branding across all pages.', date: '5 hours ago', replied: true, sentiment: 'positive' },
  { id: '3', platform: 'g2', author: 'Maria Rodriguez', rating: 4, text: 'Great tool for rapid prototyping. The visual editor needs some polish but the generation quality is excellent. Agency white-label is exactly what we needed.', date: '1 day ago', replied: false, sentiment: 'positive' },
  { id: '4', platform: 'yelp', author: 'David Park', rating: 2, text: 'Site looked great on desktop but the mobile version had some layout issues. Had to manually fix the nav menu. Support was helpful though.', date: '2 days ago', replied: false, sentiment: 'negative' },
  { id: '5', platform: 'google', author: 'Emily Watson', rating: 5, text: 'I\'ve saved $15,000 this year by using Zoobicon instead of hiring freelancers. The full-stack generation with database is incredible.', date: '3 days ago', replied: true, sentiment: 'positive' },
  { id: '6', platform: 'g2', author: 'Alex Kowalski', rating: 3, text: 'Good concept but takes longer than advertised. The 90-second claim is more like 2-3 minutes for complex sites. Quality is good though.', date: '4 days ago', replied: false, sentiment: 'neutral' },
  { id: '7', platform: 'trustpilot', author: 'Lisa Thompson', rating: 5, text: 'The 43 specialized generators are amazing. Used the restaurant generator and it knew exactly what sections a restaurant site needs.', date: '5 days ago', replied: true, sentiment: 'positive' },
  { id: '8', platform: 'google', author: 'Robert Kim', rating: 1, text: 'Couldn\'t get the custom domain to work. Documentation was unclear. Ended up going back to WordPress after wasting 3 hours.', date: '1 week ago', replied: false, sentiment: 'negative' },
];

const STAR_DISTRIBUTION = [
  { stars: 5, count: 847, pct: 68 },
  { stars: 4, count: 224, pct: 18 },
  { stars: 3, count: 99, pct: 8 },
  { stars: 2, count: 50, pct: 4 },
  { stars: 1, count: 25, pct: 2 },
];

const AI_RESPONSES: Record<string, string> = {
  '1': 'Thank you so much, Sarah! We\'re thrilled you loved the e-commerce generation. Our AI is specifically trained to understand business needs and create relevant, conversion-optimized stores. If you ever need help customizing further, our visual editor makes it easy!',
  '4': 'Hi David, thank you for the feedback. We\'re sorry about the mobile layout issues — we take responsive design seriously. We\'ve recently improved our mobile generation pipeline. Could you share your site URL? We\'d love to help fix those nav issues directly.',
  '6': 'Hi Alex, thanks for the honest review. You\'re right that complex multi-section sites can take 2-3 minutes — our 90-second average is for standard single-page sites. We\'re actively working on our "Instant Scaffold" architecture to get preview times under 3 seconds.',
  '8': 'Robert, we apologize for the frustrating experience. Custom domain setup requires DNS changes that can take up to 48 hours to propagate. We\'ve since improved our documentation with step-by-step screenshots. We\'d love to help you try again — reach out to support@zoobicon.com.',
};

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5'} ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState<'reviews' | 'analytics' | 'request' | 'widget'>('reviews');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [generatingResponse, setGeneratingResponse] = useState<string | null>(null);
  const [aiResponses, setAiResponses] = useState<Record<string, string>>({});
  const [requestEmail, setRequestEmail] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const filtered = platformFilter === 'all' ? DEMO_REVIEWS : DEMO_REVIEWS.filter(r => r.platform === platformFilter);
  const avgRating = (DEMO_REVIEWS.reduce((a, r) => a + r.rating, 0) / DEMO_REVIEWS.length).toFixed(1);

  const handleGenerateResponse = (reviewId: string) => {
    setGeneratingResponse(reviewId);
    setTimeout(() => {
      setAiResponses(prev => ({ ...prev, [reviewId]: AI_RESPONSES[reviewId] || 'Thank you for your review! We appreciate your feedback and are always working to improve Zoobicon.' }));
      setGeneratingResponse(null);
    }, 1500);
  };

  const widgetCode = `<script src="https://cdn.zoobicon.com/reviews-widget.js"
  data-site-id="YOUR_SITE_ID"
  data-layout="carousel"
  data-theme="dark"
  async></script>`;

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <span className="text-white/70 font-medium">Review Manager</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/builder" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Builder</Link>
            <Link href="/pricing" className="px-4 py-2 text-sm bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg font-medium hover:opacity-90 transition-opacity">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm mb-6">
            <Star className="w-4 h-4 fill-yellow-400" /> Review Management
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Every Review, <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">One Dashboard</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Aggregate reviews from Google, Yelp, G2, and TrustPilot. AI generates perfect responses in seconds. Turn feedback into growth.
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-center">
            <div className="text-3xl font-bold text-yellow-400">{avgRating}</div>
            <Stars rating={Math.round(Number(avgRating))} size="lg" />
            <div className="text-xs text-gray-400 mt-1">Average Rating</div>
          </div>
          <div className="p-4 rounded-xl border border-white/10 bg-white/5">
            <div className="text-2xl font-bold">1,245</div>
            <div className="text-xs text-gray-400">Total Reviews</div>
          </div>
          <div className="p-4 rounded-xl border border-white/10 bg-white/5">
            <div className="text-2xl font-bold text-green-400">+12</div>
            <div className="text-xs text-gray-400">This Week</div>
          </div>
          <div className="p-4 rounded-xl border border-white/10 bg-white/5">
            <div className="text-2xl font-bold">87%</div>
            <div className="text-xs text-gray-400">Response Rate</div>
          </div>
          <div className="p-4 rounded-xl border border-white/10 bg-white/5">
            <div className="text-2xl font-bold text-blue-400">4</div>
            <div className="text-xs text-gray-400">Platforms</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 mb-8 overflow-x-auto">
          {[
            { id: 'reviews' as const, label: 'Reviews', icon: MessageSquare },
            { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
            { id: 'request' as const, label: 'Request Reviews', icon: Send },
            { id: 'widget' as const, label: 'Embed Widget', icon: Code },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400 hover:text-white'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-400">Filter:</span>
              {['all', 'google', 'yelp', 'g2', 'trustpilot'].map(p => (
                <button key={p} onClick={() => setPlatformFilter(p)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${platformFilter === p ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'}`}>
                  {p === 'all' ? 'All' : PLATFORMS[p as keyof typeof PLATFORMS].name}
                </button>
              ))}
            </div>

            {filtered.map(review => {
              const platform = PLATFORMS[review.platform];
              return (
                <div key={review.id} className="p-5 rounded-xl border border-white/10 bg-white/5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {review.author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-sm">{review.author}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${platform.bg} ${platform.color}`}>{platform.name}</span>
                        <span className="text-xs text-gray-500">{review.date}</span>
                        {review.replied && <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs">Replied</span>}
                      </div>
                      <Stars rating={review.rating} />
                      <p className="text-sm text-gray-300 mt-2">{review.text}</p>

                      {/* AI Response */}
                      {aiResponses[review.id] ? (
                        <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-3 h-3 text-blue-400" />
                            <span className="text-xs text-blue-400 font-medium">AI-Generated Response</span>
                          </div>
                          <p className="text-sm text-gray-300">{aiResponses[review.id]}</p>
                          <div className="flex gap-2 mt-2">
                            <button className="px-3 py-1 rounded bg-blue-600 text-xs font-medium hover:bg-blue-500 transition-colors flex items-center gap-1"><Send className="w-3 h-3" /> Send</button>
                            <button className="px-3 py-1 rounded bg-white/10 text-xs hover:bg-white/20 transition-colors">Edit</button>
                          </div>
                        </div>
                      ) : !review.replied && (
                        <button onClick={() => handleGenerateResponse(review.id)} disabled={generatingResponse === review.id}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-white/10 text-xs font-medium hover:bg-white/20 transition-colors flex items-center gap-1 disabled:opacity-50">
                          {generatingResponse === review.id ? <><RefreshCw className="w-3 h-3 animate-spin" /> Generating...</> : <><Sparkles className="w-3 h-3 text-yellow-400" /> Generate AI Response</>}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border border-white/10 bg-white/5">
                <h3 className="font-semibold mb-4">Rating Distribution</h3>
                {STAR_DISTRIBUTION.map(d => (
                  <div key={d.stars} className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1 w-12">
                      <span className="text-sm">{d.stars}</span>
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    </div>
                    <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${d.pct}%` }} />
                    </div>
                    <span className="text-sm text-gray-400 w-12 text-right">{d.count}</span>
                  </div>
                ))}
              </div>
              <div className="p-6 rounded-xl border border-white/10 bg-white/5">
                <h3 className="font-semibold mb-4">Rating Trend (6 months)</h3>
                <div className="flex items-end gap-2 h-32">
                  {[4.1, 4.0, 4.2, 4.3, 4.2, 4.4].map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-yellow-400 font-medium">{v}</span>
                      <div className="w-full bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t" style={{ height: `${((v - 3.5) / 1.5) * 100}%` }} />
                      <span className="text-xs text-gray-500">{['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 rounded-xl border border-white/10 bg-white/5">
              <h3 className="font-semibold mb-4">Sentiment Analysis</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Positive', pct: 74, color: 'bg-green-500', textColor: 'text-green-400' },
                  { label: 'Neutral', pct: 18, color: 'bg-yellow-500', textColor: 'text-yellow-400' },
                  { label: 'Negative', pct: 8, color: 'bg-red-500', textColor: 'text-red-400' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className={`text-3xl font-bold ${s.textColor}`}>{s.pct}%</div>
                    <div className="text-sm text-gray-400 mb-2">{s.label}</div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Request Reviews Tab */}
        {activeTab === 'request' && (
          <div className="max-w-2xl space-y-6">
            <div className="p-6 rounded-xl border border-white/10 bg-white/5 space-y-4">
              <h3 className="font-semibold">Send Review Request</h3>
              <p className="text-sm text-gray-400">Send a personalized email asking customers to leave a review. AI customizes the message based on their purchase history.</p>
              <div className="space-y-3">
                <input value={requestEmail} onChange={e => setRequestEmail(e.target.value)} placeholder="customer@example.com" className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500" />
                <select className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                  <option>Send to Google</option><option>Send to TrustPilot</option><option>Send to G2</option><option>Send to Yelp</option>
                </select>
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-gray-500 mb-1">Preview:</p>
                  <p className="text-sm text-gray-300">Hi there! Thank you for choosing Zoobicon. We&apos;d love to hear about your experience. Could you take a moment to share your feedback? Your review helps us improve and helps others discover us. [Review Link]</p>
                </div>
                <button onClick={() => { setRequestSent(true); setTimeout(() => setRequestSent(false), 3000); }}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-yellow-600 to-orange-600 font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  {requestSent ? <><Check className="w-4 h-4" /> Sent!</> : <><Send className="w-4 h-4" /> Send Review Request</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Widget Tab */}
        {activeTab === 'widget' && (
          <div className="max-w-2xl space-y-6">
            <div className="p-6 rounded-xl border border-white/10 bg-white/5 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Code className="w-5 h-5 text-yellow-400" /> Embed Review Widget</h3>
              <p className="text-sm text-gray-400">Display your best reviews on any website with a single embed code.</p>
              <div className="relative">
                <pre className="p-4 rounded-lg bg-black/50 border border-white/10 text-sm text-green-400 overflow-x-auto">{widgetCode}</pre>
                <button onClick={() => { navigator.clipboard.writeText(widgetCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['Carousel', 'Grid', 'List'].map(layout => (
                  <button key={layout} className="p-3 rounded-lg border border-white/10 bg-white/5 text-sm text-center hover:border-yellow-500/30 transition-colors">{layout}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-20 text-center p-12 rounded-2xl bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/20">
          <h2 className="text-3xl font-bold mb-4">Turn Reviews Into Revenue</h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">Respond to every review with AI, request 5-star reviews automatically, and showcase social proof on your site.</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-orange-600 font-semibold hover:opacity-90 transition-opacity">
            Start Managing Reviews <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}