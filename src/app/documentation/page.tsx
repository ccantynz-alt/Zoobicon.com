'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Search, Plus, ChevronRight, ChevronDown, FileText, Code, AlertTriangle, Info, Sparkles, ExternalLink, ThumbsUp, ThumbsDown, Edit3, Globe, Tag, Clock } from 'lucide-react';

interface DocPage { id: string; title: string; slug: string; category: string; content: string; }

const DEMO_DOCS: DocPage[] = [
  { id: '1', title: 'Introduction', slug: 'intro', category: 'Getting Started', content: '# Introduction\n\nWelcome to the Zoobicon API documentation. This guide covers everything you need to generate websites, deploy them, and manage your sites programmatically.\n\n## Quick Start\n\n1. Get your API key from the dashboard\n2. Make your first API call\n3. Deploy your generated site\n\n## Base URL\n\n```\nhttps://zoobicon.com/api/v1\n```\n\nAll API requests require authentication via Bearer token.' },
  { id: '2', title: 'Authentication', slug: 'auth', category: 'Getting Started', content: '# Authentication\n\nAll API requests require a Bearer token in the Authorization header.\n\n```bash\ncurl -H "Authorization: Bearer zbk_live_xxx" \\\n  https://zoobicon.com/api/v1/status\n```\n\n## Getting Your API Key\n\n1. Go to Dashboard → Settings → API Keys\n2. Click "Generate New Key"\n3. Copy and store securely\n\n> **Warning:** Never expose your API key in client-side code.' },
  { id: '3', title: 'Generate Website', slug: 'generate', category: 'Endpoints', content: '# Generate Website\n\n`POST /api/v1/generate`\n\nGenerate a complete website from a text prompt.\n\n## Request Body\n\n```json\n{\n  "prompt": "A modern SaaS landing page for a project management tool",\n  "generator": "landing-page",\n  "tier": "premium",\n  "autoDeploy": true\n}\n```\n\n## Response\n\n```json\n{\n  "id": "gen_abc123",\n  "html": "<!DOCTYPE html>...",\n  "deployUrl": "https://pmtool.zoobicon.sh",\n  "tokensUsed": 32000\n}\n```' },
  { id: '4', title: 'List Sites', slug: 'list-sites', category: 'Endpoints', content: '# List Sites\n\n`GET /api/v1/sites`\n\nReturns a paginated list of your deployed sites.\n\n## Query Parameters\n\n| Param | Type | Description |\n|-------|------|-------------|\n| page | number | Page number (default: 1) |\n| limit | number | Items per page (default: 20) |\n| status | string | Filter: active, paused, deleted |' },
  { id: '5', title: 'Deploy', slug: 'deploy', category: 'Endpoints', content: '# Deploy\n\n`POST /api/v1/deploy`\n\nDeploy HTML to zoobicon.sh.\n\n## Request Body\n\n```json\n{\n  "html": "<!DOCTYPE html>...",\n  "slug": "my-awesome-site",\n  "name": "My Site"\n}\n```' },
  { id: '6', title: 'Rate Limits', slug: 'rate-limits', category: 'Reference', content: '# Rate Limits\n\n| Plan | Requests/min | Generations/mo |\n|------|-------------|----------------|\n| Free | 10 | 50 |\n| Pro | 60 | 500 |\n| Enterprise | 600 | Unlimited |' },
  { id: '7', title: 'Error Codes', slug: 'errors', category: 'Reference', content: '# Error Codes\n\n| Code | Meaning |\n|------|---------|\n| 400 | Bad Request — Invalid parameters |\n| 401 | Unauthorized — Invalid API key |\n| 403 | Forbidden — Plan limit exceeded |\n| 429 | Rate Limited — Too many requests |\n| 500 | Server Error — Try again |' },
  { id: '8', title: 'Webhooks', slug: 'webhooks', category: 'Reference', content: '# Webhooks\n\nReceive real-time notifications when events occur.\n\n## Events\n\n- `site.deployed` — A site was deployed\n- `generation.completed` — Generation finished\n- `generation.failed` — Generation failed\n\n## Payload\n\n```json\n{\n  "event": "site.deployed",\n  "data": { "siteId": "...", "url": "..." },\n  "timestamp": "2026-03-23T12:00:00Z"\n}\n```' },
];

const CATEGORIES = ['Getting Started', 'Endpoints', 'Reference', 'SDKs'];

export default function DocumentationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(DEMO_DOCS[0]);
  const [expandedCats, setExpandedCats] = useState<string[]>(CATEGORIES);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const filteredDocs = searchQuery
    ? DEMO_DOCS.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : DEMO_DOCS;

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold mb-4 mt-8 first:mt-0">{line.slice(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mb-3 mt-6">{line.slice(3)}</h2>;
      if (line.startsWith('```')) return <div key={i} className="bg-black/30 border border-white/10 rounded-lg px-4 py-0.5 font-mono text-sm text-green-400">{line.slice(3)}</div>;
      if (line.startsWith('> **Warning')) return <div key={i} className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex gap-2 my-2"><AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" /><span className="text-sm text-orange-300">{line.slice(2)}</span></div>;
      if (line.startsWith('| ')) return <div key={i} className="font-mono text-sm text-white/70 bg-white/5 px-3 py-1 border-b border-white/5">{line}</div>;
      if (line.startsWith('- ')) return <li key={i} className="text-white/70 ml-4 text-sm mb-1">{line.slice(2)}</li>;
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="text-white/70 text-sm mb-2">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <div className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-violet-400" /><span className="font-semibold">Documentation</span></div>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search docs..." className="pl-9 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm w-64 focus:outline-none focus:border-violet-500" />
            </div>
            <Link href="/api-docs" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium flex items-center gap-2"><Code className="w-4 h-4" /> API Reference</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <nav className="w-64 shrink-0 border-r border-white/10 p-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          {CATEGORIES.map(cat => (
            <div key={cat} className="mb-2">
              <button onClick={() => toggleCat(cat)} className="flex items-center gap-1.5 w-full text-left text-sm font-medium text-white/70 hover:text-white py-1.5 transition-colors">
                {expandedCats.includes(cat) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                {cat}
              </button>
              {expandedCats.includes(cat) && (
                <div className="ml-4 space-y-0.5">
                  {filteredDocs.filter(d => d.category === cat).map(doc => (
                    <button key={doc.id} onClick={() => setSelectedDoc(doc)} className={`block w-full text-left text-sm py-1.5 px-2 rounded transition-colors ${selectedDoc.id === doc.id ? 'text-violet-400 bg-violet-500/10' : 'text-white/50 hover:text-white/80'}`}>
                      {doc.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="mt-6 pt-4 border-t border-white/10">
            <button className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"><Sparkles className="w-4 h-4" /> AI Doc Generator</button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8 min-h-[80vh]">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
              <span>{selectedDoc.category}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white/70">{selectedDoc.title}</span>
            </div>

            {isEditing ? (
              <div>
                <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-6 font-mono text-sm h-96 resize-none focus:outline-none focus:border-violet-500" />
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-violet-600 rounded-lg text-sm">Save</button>
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-white/10 rounded-lg text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none">
                {renderContent(selectedDoc.content)}
              </div>
            )}

            {/* Feedback */}
            <div className="mt-12 pt-6 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/50">Was this helpful?</span>
                <button className="p-2 hover:bg-green-500/10 rounded-lg transition-colors"><ThumbsUp className="w-4 h-4 text-white/40 hover:text-green-400" /></button>
                <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"><ThumbsDown className="w-4 h-4 text-white/40 hover:text-red-400" /></button>
              </div>
              <button onClick={() => { setEditContent(selectedDoc.content); setIsEditing(true); }} className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors"><Edit3 className="w-3.5 h-3.5" /> Edit this page</button>
            </div>
          </div>
        </main>
      </div>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-white/30">
        <p>Zoobicon Documentation — Replace GitBook ($8/mo), ReadMe ($99/mo). Included in your plan.</p>
      </footer>
    </div>
  );
}
