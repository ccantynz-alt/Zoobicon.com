'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText, Search, ChevronRight, ArrowLeft, Sparkles, Plus,
  BookOpen, Code, AlertCircle, Info, CheckCircle, Copy,
  ChevronDown, ChevronUp, Clock, Edit3, Eye, Globe, Hash,
  Layers, Tag, Users, GitBranch, Terminal, ExternalLink,
  FolderOpen, File, Settings, Zap
} from 'lucide-react';

type TabType = 'docs' | 'editor' | 'versions' | 'generate';

interface DocSection {
  id: string;
  title: string;
  slug: string;
  icon: React.ReactNode;
  children: DocArticle[];
}

interface DocArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  updatedAt: string;
  author: string;
}

const DOC_TREE: DocSection[] = [
  {
    id: 's1', title: 'Getting Started', slug: 'getting-started', icon: <Zap className="w-4 h-4" />,
    children: [
      { id: 'a1', title: 'Introduction', slug: 'introduction', content: '# Introduction\n\nWelcome to the Zoobicon documentation. This guide covers everything you need to know about building and deploying AI-generated websites.\n\n## What is Zoobicon?\n\nZoobicon is an AI website builder that generates production-ready websites in under 90 seconds using a 7-agent pipeline.\n\n## Quick Start\n\n1. Navigate to the [Builder](/builder)\n2. Enter a description of your website\n3. Click Generate\n4. Deploy with one click\n\n> **Tip:** Be specific in your descriptions for better results.', updatedAt: '2026-03-22', author: 'Team' },
      { id: 'a2', title: 'Installation & Setup', slug: 'installation', content: '# Installation & Setup\n\n## System Requirements\n\n- Node.js 18+\n- npm or yarn\n- Modern browser (Chrome, Firefox, Safari, Edge)\n\n## Quick Install\n\n```bash\nnpm create zoobicon-app my-project\ncd my-project\nnpm run dev\n```\n\n## Environment Variables\n\nCreate a `.env.local` file with your API key:\n\n```\nZOOBICON_API_KEY=zbk_live_your_key\n```\n\n## Configuration\n\nEdit `zoobicon.config.ts` to customize defaults.', updatedAt: '2026-03-20', author: 'Team' },
      { id: 'a3', title: 'Your First Website', slug: 'first-website', content: '# Your First Website\n\n## Step 1: Open the Builder\n\nGo to [zoobicon.com/builder](/builder) and sign in.\n\n## Step 2: Write Your Prompt\n\nExample: "A modern cybersecurity consulting firm with dark theme, hero section, services grid, team section, and contact form."\n\n## Step 3: Choose Settings\n\n- **Model:** Claude Opus (recommended)\n- **Tier:** Premium\n- **Style:** Modern\n\n## Step 4: Generate\n\nClick "Generate" and watch the 7-agent pipeline create your site.\n\n## Step 5: Deploy\n\nClick "Deploy" to publish to `your-site.zoobicon.sh`.', updatedAt: '2026-03-18', author: 'Team' },
    ]
  },
  {
    id: 's2', title: 'API Reference', slug: 'api', icon: <Terminal className="w-4 h-4" />,
    children: [
      { id: 'a4', title: 'Authentication', slug: 'auth', content: '# Authentication\n\nAll API requests require a Bearer token.\n\n```\nAuthorization: Bearer zbk_live_your_key_here\n```\n\n## Getting an API Key\n\n1. Go to Dashboard > Settings > API Keys\n2. Click "Generate New Key"\n3. Copy and store securely\n\n> **Warning:** Never expose your API key in client-side code.\n\n## Rate Limits\n\n| Plan | Limit |\n|------|-------|\n| Free | 10 req/min |\n| Pro | 60 req/min |\n| Enterprise | 600 req/min |', updatedAt: '2026-03-22', author: 'Dev Team' },
      { id: 'a5', title: 'Generate Endpoint', slug: 'generate', content: '# POST /api/v1/generate\n\nGenerate a website from a prompt.\n\n## Request\n\n```json\n{\n  "prompt": "A modern landing page for a SaaS product",\n  "generator": "landing-page",\n  "tier": "premium",\n  "model": "claude-opus",\n  "autoDeploy": true\n}\n```\n\n## Response\n\n```json\n{\n  "id": "gen_abc123",\n  "status": "completed",\n  "html": "<!DOCTYPE html>...",\n  "deployUrl": "https://my-site.zoobicon.sh",\n  "tokensUsed": 28400,\n  "generationTime": 92.4\n}\n```', updatedAt: '2026-03-21', author: 'Dev Team' },
      { id: 'a6', title: 'Sites Endpoint', slug: 'sites', content: '# Sites API\n\n## GET /api/v1/sites\n\nList all deployed sites.\n\n```bash\ncurl -H "Authorization: Bearer zbk_live_xxx" \\\n  https://zoobicon.com/api/v1/sites\n```\n\n## PUT /api/v1/sites\n\nUpdate a deployed site.\n\n```json\n{\n  "siteId": "site_abc123",\n  "html": "<!DOCTYPE html>...updated code..."\n}\n```\n\n## DELETE /api/v1/sites\n\nDeactivate a site.\n\n```json\n{\n  "siteId": "site_abc123"\n}\n```', updatedAt: '2026-03-20', author: 'Dev Team' },
      { id: 'a7', title: 'Deploy Endpoint', slug: 'deploy', content: '# Deploy API\n\n## POST /api/v1/deploy\n\nDeploy HTML to zoobicon.sh.\n\n```json\n{\n  "html": "<!DOCTYPE html>...",\n  "slug": "my-awesome-site",\n  "name": "My Awesome Site"\n}\n```\n\n## Response\n\n```json\n{\n  "success": true,\n  "url": "https://my-awesome-site.zoobicon.sh",\n  "siteId": "site_xyz789"\n}\n```\n\n> **Note:** Slugs must be unique. If taken, a numeric suffix is appended.', updatedAt: '2026-03-19', author: 'Dev Team' },
    ]
  },
  {
    id: 's3', title: 'Guides', slug: 'guides', icon: <BookOpen className="w-4 h-4" />,
    children: [
      { id: 'a8', title: 'Custom Domains', slug: 'custom-domains', content: '# Custom Domains\n\n## Setting Up a Custom Domain\n\n1. Go to your site dashboard\n2. Click "Domains" tab\n3. Enter your domain\n4. Add the DNS records shown\n\n## DNS Configuration\n\nAdd a CNAME record:\n\n```\nType: CNAME\nName: www (or @)\nValue: zoobicon.sh\n```\n\n## SSL\n\nSSL certificates are automatically provisioned via Cloudflare within minutes of DNS verification.\n\n> **Tip:** DNS propagation can take up to 24 hours.', updatedAt: '2026-03-18', author: 'Team' },
      { id: 'a9', title: 'Multi-Page Sites', slug: 'multipage', content: '# Multi-Page Sites\n\n## Overview\n\nGenerate up to 6 interconnected pages with shared navigation, design system, and footer.\n\n## Usage\n\n```json\n{\n  "prompt": "A SaaS website",\n  "pages": [\n    "Home - hero, features, pricing",\n    "About - team, mission, story",\n    "Pricing - 3 tiers",\n    "Contact - form, map, info"\n  ]\n}\n```\n\n## Output\n\nEach page receives:\n- Consistent header/nav\n- Shared fonts and colors\n- Cross-linked navigation\n- Shared footer', updatedAt: '2026-03-16', author: 'Team' },
    ]
  },
  {
    id: 's4', title: 'Components', slug: 'components', icon: <Layers className="w-4 h-4" />,
    children: [
      { id: 'a10', title: 'Component Library', slug: 'component-library', content: '# Component Library\n\nEvery generated site includes the Zoobicon Component Library — a CSS design system similar to shadcn/ui.\n\n## Available Classes\n\n### Buttons\n- `.btn` — Base button\n- `.btn-primary` — Primary action\n- `.btn-secondary` — Secondary action\n- `.btn-ghost` — Ghost/transparent\n\n### Cards\n- `.card` — Card container\n- `.card-body` — Card content\n- `.card-flat` — No shadow variant\n\n### Layout\n- `.section` — Page section\n- `.section-alt` — Alternate background\n- `.grid-2`, `.grid-3`, `.grid-4` — Grid layouts\n\n### Animations\n- `.fade-in` — Fade in on scroll\n- `.fade-in-left` — Slide in from left\n- `.scale-in` — Scale up on scroll', updatedAt: '2026-03-15', author: 'Team' },
    ]
  },
];

function renderContent(content: string) {
  return content.split('\n').map((line, i) => {
    if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mt-6 mb-3 text-white">{line.replace('# ', '')}</h1>;
    if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold mt-5 mb-2 text-white">{line.replace('## ', '')}</h2>;
    if (line.startsWith('### ')) return <h3 key={i} className="text-base font-medium mt-4 mb-2 text-white/90">{line.replace('### ', '')}</h3>;
    if (line.startsWith('```')) {
      const lang = line.replace('```', '').trim();
      if (lang) return <div key={i} className="text-[10px] text-white/30 mt-3 mb-0.5 font-mono">{lang}</div>;
      return null;
    }
    if (line.startsWith('> **')) return <div key={i} className="flex items-start gap-2 p-3 my-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-200"><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" /><span>{line.replace('> ', '')}</span></div>;
    if (line.startsWith('> ')) return <div key={i} className="flex items-start gap-2 p-3 my-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-200"><Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" /><span>{line.replace('> ', '')}</span></div>;
    if (line.startsWith('| ')) return <p key={i} className="text-sm text-white/60 font-mono">{line}</p>;
    if (line.startsWith('- ')) return <p key={i} className="text-sm text-white/60 ml-4 my-0.5 flex items-start gap-2"><span className="text-violet-400 mt-1">*</span>{line.replace('- ', '')}</p>;
    if (line.match(/^\d+\. /)) return <p key={i} className="text-sm text-white/60 ml-4 my-0.5">{line}</p>;
    if (line.trim() === '') return <br key={i} />;
    return <p key={i} className="text-sm text-white/60 leading-relaxed">{line}</p>;
  });
}

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('docs');
  const [selectedSection, setSelectedSection] = useState(DOC_TREE[0].id);
  const [selectedArticle, setSelectedArticle] = useState<DocArticle>(DOC_TREE[0].children[0]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(DOC_TREE.map(s => s.id)));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('v2.4.0');
  const [generating, setGenerating] = useState(false);
  const [docPrompt, setDocPrompt] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    const next = new Set(expandedSections);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedSections(next);
  };

  const handleCopy = (text: string) => { setCopied(text); setTimeout(() => setCopied(null), 2000); };
  const handleGenerate = () => { setGenerating(true); setTimeout(() => setGenerating(false), 2500); };

  const allArticles = DOC_TREE.flatMap(s => s.children);
  const filteredArticles = searchQuery
    ? allArticles.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const versions = ['v2.4.0', 'v2.3.0', 'v2.2.1', 'v2.1.0', 'v2.0.0', 'v1.9.0'];

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'docs', label: 'Documentation', icon: <FileText className="w-4 h-4" /> },
    { id: 'editor', label: 'Editor', icon: <Edit3 className="w-4 h-4" /> },
    { id: 'versions', label: 'Versions', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'generate', label: 'AI Generate', icon: <Sparkles className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-bold text-lg bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Zoobicon</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-white/30" />
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-400" />
              <span className="font-semibold">Documentation</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select value={selectedVersion} onChange={e => setSelectedVersion(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none">
              {versions.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <Link href="/builder" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Builder</Link>
            <Link href="/dashboard" className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors">Dashboard</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="relative max-w-2xl mx-auto mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search documentation..." className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-base text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all" />
          {searchQuery && filteredArticles.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-[#12121e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-10">
              {filteredArticles.map(article => (
                <button key={article.id} onClick={() => { setSelectedArticle(article); setSearchQuery(''); }} className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3">
                  <FileText className="w-4 h-4 text-white/30" />
                  <div>
                    <p className="text-sm font-medium">{article.title}</p>
                    <p className="text-xs text-white/30">{article.slug}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'docs' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="space-y-1">
              {DOC_TREE.map(section => (
                <div key={section.id}>
                  <button onClick={() => toggleSection(section.id)} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 transition-colors">
                    <span className="text-white/40">{section.icon}</span>
                    <span className="flex-1 text-left">{section.title}</span>
                    {expandedSections.has(section.id) ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
                  </button>
                  {expandedSections.has(section.id) && (
                    <div className="ml-5 border-l border-white/10 pl-3 space-y-0.5 mb-2">
                      {section.children.map(article => (
                        <button key={article.id} onClick={() => setSelectedArticle(article)} className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all ${selectedArticle.id === article.id ? 'bg-violet-600/20 text-violet-300' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                          {article.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <div className="bg-white/5 rounded-2xl border border-white/10 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-white/30 mb-2">
                      {DOC_TREE.find(s => s.children.find(a => a.id === selectedArticle.id))?.title}
                      <ChevronRight className="w-3 h-3" />
                      {selectedArticle.title}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/30">
                    <Clock className="w-3 h-3" /> Updated {selectedArticle.updatedAt}
                    <span>&middot;</span>
                    <Users className="w-3 h-3" /> {selectedArticle.author}
                  </div>
                </div>
                <div className="prose prose-invert max-w-none">
                  {renderContent(selectedArticle.content)}
                </div>
                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/50 transition-colors flex items-center gap-1"><Edit3 className="w-3 h-3" /> Edit Page</button>
                    <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/50 transition-colors flex items-center gap-1"><ExternalLink className="w-3 h-3" /> View on GitHub</button>
                  </div>
                  <p className="text-xs text-white/20">Was this page helpful?</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Editing: {selectedArticle.title}</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs transition-colors">Preview</button>
                  <button className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs transition-colors">Save</button>
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                {['Heading', 'Bold', 'Code', 'Link', 'List', 'Callout', 'Image', 'Table'].map(btn => (
                  <button key={btn} className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded text-xs text-white/50 transition-colors">{btn}</button>
                ))}
              </div>
              <textarea defaultValue={selectedArticle.content} rows={20} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-violet-500/50 resize-none leading-relaxed" />
            </div>
          </div>
        )}

        {activeTab === 'versions' && (
          <div className="max-w-3xl mx-auto space-y-4">
            {versions.map((version, i) => (
              <div key={version} className={`bg-white/5 rounded-2xl border p-6 transition-all ${version === selectedVersion ? 'border-violet-500/50' : 'border-white/10'}`}>
                <div className="flex items-center gap-3">
                  <GitBranch className="w-5 h-5 text-violet-400" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{version}</h3>
                      {i === 0 && <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">Latest</span>}
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">Released {new Date(2026, 2, 22 - i * 14).toISOString().split('T')[0]}</p>
                  </div>
                  <button onClick={() => setSelectedVersion(version)} className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${version === selectedVersion ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
                    {version === selectedVersion ? 'Current' : 'Switch'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'generate' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">AI Documentation Generator</h2>
                  <p className="text-sm text-white/50">Describe a feature or API endpoint and get comprehensive docs.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">Document Title</label>
                  <input type="text" placeholder="e.g., Webhook Integration Guide" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">Section</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50">
                      {DOC_TREE.map(s => <option key={s.id}>{s.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">Type</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50">
                      <option>Guide</option>
                      <option>API Reference</option>
                      <option>Tutorial</option>
                      <option>Changelog</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">Description</label>
                  <textarea value={docPrompt} onChange={e => setDocPrompt(e.target.value)} rows={4} placeholder="Describe what this documentation should cover..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 resize-none" />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Include</label>
                  <div className="flex flex-wrap gap-2">
                    {['Code Examples', 'API Tables', 'Callout Boxes', 'Step-by-Step', 'Diagrams', 'FAQ'].map(item => (
                      <button key={item} className="px-3 py-1.5 bg-white/5 hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/50 rounded-lg text-xs text-white/60 hover:text-violet-300 transition-all">{item}</button>
                    ))}
                  </div>
                </div>
                <button onClick={handleGenerate} disabled={generating} className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/25 disabled:opacity-50">
                  {generating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Documentation</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-white/10 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-white/40 text-sm">
            Replaces GitBook ($8/mo), ReadMe ($99/mo), and Notion wikis &mdash; <span className="text-violet-400">included free with Zoobicon Pro</span>
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
