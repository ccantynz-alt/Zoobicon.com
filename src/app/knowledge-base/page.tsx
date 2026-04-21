'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Plus,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  FolderOpen,
  FileText,
  Eye,
  Edit3,
  Clock,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Tag,
  Users,
  BarChart3,
  Star,
  MessageSquare,
  Hash,
  Bookmark,
  Globe,
} from 'lucide-react';

type TabType = 'browse' | 'editor' | 'analytics';

interface Article {
  id: string;
  title: string;
  category: string;
  content: string;
  author: string;
  updatedAt: string;
  views: number;
  helpful: number;
  notHelpful: number;
  tags: string[];
  status: 'published' | 'draft';
}

interface Category {
  name: string;
  icon: React.ReactNode;
  count: number;
  color: string;
}

const CATEGORIES: Category[] = [
  { name: 'Getting Started', icon: <Star className="w-4 h-4" />, count: 8, color: 'text-stone-400' },
  { name: 'How-To Guides', icon: <BookOpen className="w-4 h-4" />, count: 14, color: 'text-stone-400' },
  { name: 'FAQ', icon: <MessageSquare className="w-4 h-4" />, count: 22, color: 'text-stone-400' },
  { name: 'API Documentation', icon: <Hash className="w-4 h-4" />, count: 11, color: 'text-stone-400' },
  { name: 'Troubleshooting', icon: <FileText className="w-4 h-4" />, count: 9, color: 'text-stone-400' },
  { name: 'Best Practices', icon: <ThumbsUp className="w-4 h-4" />, count: 6, color: 'text-stone-400' },
];

const DEMO_ARTICLES: Article[] = [
  { id: 'a1', title: 'Getting Started with Zoobicon', category: 'Getting Started', content: 'Welcome to Zoobicon! This guide walks you through creating your first AI-generated website in under 2 minutes.\n\n## Step 1: Open the Builder\nNavigate to the Builder page and enter a description of the website you want.\n\n## Step 2: Choose Your Model\nSelect from Claude, GPT-4o, or Gemini for generation.\n\n## Step 3: Generate\nClick Generate and watch as our 7-agent pipeline creates your site.\n\n## Step 4: Deploy\nOne click deploys to zoobicon.sh with a custom subdomain.', author: 'Zoobicon Team', updatedAt: '2026-03-22', views: 4521, helpful: 312, notHelpful: 8, tags: ['onboarding', 'basics'], status: 'published' },
  { id: 'a2', title: 'How to Customize Generated Websites', category: 'How-To Guides', content: 'After generating a site, use the visual editor to customize colors, text, images, and layout.\n\n## Visual Editor\nClick any element to select it. Use the property panel to change styles.\n\n## AI Chat Edits\nDescribe changes in natural language and the AI will apply them.\n\n## Code Editor\nFor advanced users, edit the HTML/CSS directly in the code panel.', author: 'Sarah Chen', updatedAt: '2026-03-20', views: 2847, helpful: 198, notHelpful: 12, tags: ['customization', 'editor'], status: 'published' },
  { id: 'a3', title: 'What file formats can I export?', category: 'FAQ', content: 'Zoobicon supports exporting in multiple formats:\n\n- **HTML** — Single standalone file\n- **ZIP** — All assets bundled\n- **React** — Converted to React components\n- **WordPress** — Theme export\n- **PDF** — For offline viewing', author: 'Support Team', updatedAt: '2026-03-19', views: 1632, helpful: 145, notHelpful: 3, tags: ['export', 'formats'], status: 'published' },
  { id: 'a4', title: 'API Authentication Guide', category: 'API Documentation', content: 'All API requests require a Bearer token in the Authorization header.\n\n```\nAuthorization: Bearer zbk_live_your_key_here\n```\n\n## Getting Your API Key\n1. Go to Dashboard > Settings > API Keys\n2. Click Generate New Key\n3. Copy and store securely\n\n## Rate Limits\n- Free: 10 req/min\n- Pro: 60 req/min\n- Enterprise: 600 req/min', author: 'Dev Team', updatedAt: '2026-03-18', views: 3201, helpful: 267, notHelpful: 5, tags: ['api', 'auth', 'security'], status: 'published' },
  { id: 'a5', title: 'Troubleshooting Deployment Failures', category: 'Troubleshooting', content: 'If your deployment fails, check these common issues:\n\n## 1. HTML Validation\nEnsure your HTML is valid and well-formed.\n\n## 2. File Size\nMaximum deployment size is 10MB.\n\n## 3. Slug Conflicts\nChoose a unique subdomain slug.\n\n## 4. Rate Limiting\nWait 60 seconds between deployments on free tier.', author: 'Support Team', updatedAt: '2026-03-17', views: 987, helpful: 89, notHelpful: 7, tags: ['deployment', 'errors'], status: 'published' },
  { id: 'a6', title: 'Multi-Page Site Generation Best Practices', category: 'Best Practices', content: 'Tips for generating high-quality multi-page sites:\n\n## Be Specific\nDescribe each page purpose clearly in your prompt.\n\n## Consistent Branding\nThe AI maintains design consistency across pages automatically.\n\n## Navigation\nNavigation is auto-generated. Max 6 pages per site.\n\n## Performance\nEach page is optimized with lazy-loading images.', author: 'Alex Rivera', updatedAt: '2026-03-15', views: 1456, helpful: 134, notHelpful: 4, tags: ['multipage', 'quality'], status: 'published' },
  { id: 'a7', title: 'Using the 43 Specialized Generators', category: 'How-To Guides', content: 'Zoobicon offers 43 specialized generators, each with custom UI fields and optimized prompts.\n\n## Finding Generators\nVisit /generators to browse all available types.\n\n## Custom Fields\nEach generator has type-specific input fields.\n\n## Output Quality\nSpecialized generators produce better output than generic prompts.', author: 'Zoobicon Team', updatedAt: '2026-03-14', views: 2103, helpful: 187, notHelpful: 6, tags: ['generators', 'specialized'], status: 'published' },
  { id: 'a8', title: 'Setting Up Custom Domains', category: 'How-To Guides', content: 'Connect your own domain to a Zoobicon-hosted site.\n\n## DNS Configuration\nAdd a CNAME record pointing to zoobicon.sh.\n\n## SSL Certificate\nSSL is automatically provisioned via Cloudflare.\n\n## Verification\nAllow up to 24 hours for DNS propagation.', author: 'Support Team', updatedAt: '2026-03-12', views: 1891, helpful: 156, notHelpful: 9, tags: ['domains', 'dns', 'ssl'], status: 'published' },
];

export default function KnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
  const [aiGeneratePrompt, setAiGeneratePrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  const filteredArticles = DEMO_ARTICLES.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || article.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleArticle = (id: string) => {
    const next = new Set(expandedArticles);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedArticles(next);
  };

  const handleGenerate = () => { setGenerating(true); setTimeout(() => setGenerating(false), 2000); };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'browse', label: 'Browse', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'editor', label: 'AI Writer', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  ];

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
              <BookOpen className="w-5 h-5 text-stone-400" />
              <span className="font-semibold">Knowledge Base</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/builder" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Builder</Link>
            <Link href="/dashboard" className="px-4 py-2 text-sm bg-stone-600 hover:bg-stone-500 rounded-lg transition-colors">Dashboard</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search articles, guides, and documentation..." className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-base text-white placeholder-white/30 focus:outline-none focus:border-stone-500/50 focus:ring-2 focus:ring-stone-500/10 transition-all" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-stone-600 text-white shadow-lg shadow-stone-600/25' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'browse' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Categories */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-white/60 mb-3 uppercase tracking-wider">Categories</h3>
              <button onClick={() => setSelectedCategory(null)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${!selectedCategory ? 'bg-stone-600/20 border border-stone-500/50 text-stone-300' : 'bg-white/5 border border-white/5 text-white/60 hover:bg-white/10'}`}>
                <Globe className="w-4 h-4" />
                <span>All Articles</span>
                <span className="ml-auto text-xs opacity-60">{DEMO_ARTICLES.length}</span>
              </button>
              {CATEGORIES.map(cat => (
                <button key={cat.name} onClick={() => setSelectedCategory(cat.name)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${selectedCategory === cat.name ? 'bg-stone-600/20 border border-stone-500/50 text-stone-300' : 'bg-white/5 border border-white/5 text-white/60 hover:bg-white/10'}`}>
                  <span className={cat.color}>{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span className="ml-auto text-xs opacity-60">{cat.count}</span>
                </button>
              ))}
            </div>

            {/* Articles List */}
            <div className="lg:col-span-3 space-y-3">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-white/50">{filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} found</p>
              </div>
              {filteredArticles.map(article => (
                <div key={article.id} className="bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                  <button onClick={() => toggleArticle(article.id)} className="w-full px-6 py-5 text-left flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-sm">{article.title}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-stone-500/20 text-stone-300">{article.category}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{article.author}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.updatedAt}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{article.views.toLocaleString()} views</span>
                      </div>
                    </div>
                    {expandedArticles.has(article.id) ? <ChevronUp className="w-5 h-5 text-white/30" /> : <ChevronDown className="w-5 h-5 text-white/30" />}
                  </button>
                  {expandedArticles.has(article.id) && (
                    <div className="px-6 pb-6 border-t border-white/5 pt-4">
                      <div className="prose prose-invert prose-sm max-w-none">
                        {article.content.split('\n').map((line, i) => {
                          if (line.startsWith('## ')) return <h3 key={i} className="text-base font-semibold mt-4 mb-2 text-white">{line.replace('## ', '')}</h3>;
                          if (line.startsWith('```')) return <div key={i} className="bg-black/30 rounded-lg p-3 font-mono text-xs text-stone-400 my-2">{line.replace(/```/g, '')}</div>;
                          if (line.startsWith('- **')) return <p key={i} className="text-sm text-white/70 ml-4 my-1">{line}</p>;
                          if (line.trim()) return <p key={i} className="text-sm text-white/60 leading-relaxed">{line}</p>;
                          return <br key={i} />;
                        })}
                      </div>
                      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/5">
                        <span className="text-xs text-white/40">Was this helpful?</span>
                        <button onClick={() => {}} className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-stone-500/20 rounded-lg text-xs text-white/60 hover:text-stone-400 transition-all">
                          <ThumbsUp className="w-3.5 h-3.5" /> {article.helpful}
                        </button>
                        <button onClick={() => {}} className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-stone-500/20 rounded-lg text-xs text-white/60 hover:text-stone-400 transition-all">
                          <ThumbsDown className="w-3.5 h-3.5" /> {article.notHelpful}
                        </button>
                        <div className="ml-auto flex items-center gap-2">
                          {article.tags.map(tag => (
                            <span key={tag} className="text-xs px-2 py-0.5 bg-white/5 rounded-full text-white/40 flex items-center gap-1"><Tag className="w-2.5 h-2.5" />{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-600 to-stone-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">AI Article Generator</h2>
                  <p className="text-sm text-white/50">Generate comprehensive knowledge base articles with AI.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">Article Title</label>
                  <input type="text" placeholder="e.g., How to Set Up Email Notifications" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-stone-500/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">Category</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-stone-500/50">
                      {CATEGORIES.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">Tone</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-stone-500/50">
                      <option>Professional</option>
                      <option>Casual</option>
                      <option>Technical</option>
                      <option>Friendly</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">Topic Description</label>
                  <textarea value={aiGeneratePrompt} onChange={e => setAiGeneratePrompt(e.target.value)} rows={4} placeholder="Describe what the article should cover. Include key points, target audience, and any specific sections needed..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-stone-500/50 resize-none" />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Include Sections</label>
                  <div className="flex flex-wrap gap-2">
                    {['Introduction', 'Step-by-Step', 'Screenshots', 'Code Examples', 'FAQ', 'Troubleshooting', 'Related Articles'].map(section => (
                      <button onClick={() => {}} key={section} className="px-3 py-1.5 bg-white/5 hover:bg-stone-600/20 border border-white/10 hover:border-stone-500/50 rounded-lg text-xs text-white/60 hover:text-stone-300 transition-all">{section}</button>
                    ))}
                  </div>
                </div>
                <button onClick={handleGenerate} disabled={generating} className="w-full py-3 bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-stone-600/25 disabled:opacity-50">
                  {generating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating Article...</> : <><Sparkles className="w-4 h-4" /> Generate Article</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Articles', value: DEMO_ARTICLES.length, change: '+3 this month' },
                { label: 'Total Views', value: '16.6K', change: '+24% vs last month' },
                { label: 'Avg. Helpfulness', value: '96.2%', change: '+1.8%' },
                { label: 'Search Success', value: '89%', change: '+5%' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-5">
                  <p className="text-sm text-white/50 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-stone-400 mt-1">{stat.change}</p>
                </div>
              ))}
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <h3 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-wider">Top Articles by Views</h3>
              <div className="space-y-3">
                {[...DEMO_ARTICLES].sort((a, b) => b.views - a.views).map((article, i) => (
                  <div key={article.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                    <span className="text-lg font-bold text-white/20 w-8 text-center">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{article.title}</p>
                      <p className="text-xs text-white/40">{article.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{article.views.toLocaleString()}</p>
                      <p className="text-xs text-white/40">views</p>
                    </div>
                    <div className="w-24">
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-stone-500 rounded-full" style={{ width: `${(article.views / 4521) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-white/10 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-white/40 text-sm">
            Replaces Zendesk Guide ($49/mo), HelpScout ($20/mo), and Notion wikis &mdash; <span className="text-stone-400">included free with Zoobicon Pro</span>
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
