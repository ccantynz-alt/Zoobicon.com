'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import {
  Briefcase,
  Layout,
  Grid3X3,
  Layers,
  BookOpen,
  ChevronRight,
  ArrowLeft,
  Plus,
  Eye,
  Edit3,
  Download,
  Trash2,
  ExternalLink,
  Image,
  Palette,
  Type,
  User,
  Mail,
  Globe,
  MapPin,
  GitFork,
  Link2,
  MessageCircle,
  Settings,
  Sparkles,
  Monitor,
  Tablet,
  Smartphone,
  Copy,
  Check,
  Star,
  Calendar,
  Tag,
} from 'lucide-react';

type TabType = 'projects' | 'about' | 'preview' | 'settings';
type TemplateType = 'grid' | 'masonry' | 'minimal' | 'case-study';
type ViewportType = 'desktop' | 'tablet' | 'mobile';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  tags: string[];
  year: string;
  link?: string;
  featured: boolean;
}

interface AboutInfo {
  name: string;
  title: string;
  bio: string;
  location: string;
  email: string;
  website: string;
  avatar: string;
  socials: { platform: string; url: string }[];
  skills: string[];
}

const TEMPLATES: { id: TemplateType; name: string; description: string; icon: React.ReactNode }[] = [
  { id: 'grid', name: 'Grid', description: 'Clean grid layout with hover effects', icon: <Grid3X3 className="w-5 h-5" /> },
  { id: 'masonry', name: 'Masonry', description: 'Pin-style dynamic layout', icon: <Layers className="w-5 h-5" /> },
  { id: 'minimal', name: 'Minimal', description: 'Whitespace-focused, typography-driven', icon: <Type className="w-5 h-5" /> },
  { id: 'case-study', name: 'Case Study', description: 'Long-form project deep dives', icon: <BookOpen className="w-5 h-5" /> },
];

const DEMO_PROJECTS: Project[] = [
  { id: 'p1', title: 'NeuralPath Dashboard', description: 'A data-driven analytics dashboard for an AI startup. Built with React, D3.js, and a custom design system.', category: 'Web App', image: 'https://picsum.photos/seed/neural-dash/600/400', tags: ['React', 'D3.js', 'TypeScript'], year: '2026', link: 'https://neuralpath.io', featured: true },
  { id: 'p2', title: 'Bloom Wellness Rebrand', description: 'Complete brand identity overhaul including logo, typography, color system, and marketing materials.', category: 'Branding', image: 'https://picsum.photos/seed/bloom-brand/600/400', tags: ['Branding', 'Layers', 'Print'], year: '2026', featured: true },
  { id: 'p3', title: 'SwiftServe Mobile App', description: 'Logistics management mobile app with real-time tracking, route optimization, and driver dispatch.', category: 'Mobile', image: 'https://picsum.photos/seed/swift-mobile/600/400', tags: ['React Native', 'Maps API', 'Node.js'], year: '2025', link: 'https://swiftserve.com', featured: false },
  { id: 'p4', title: 'Atlas Financial Landing Page', description: 'High-converting landing page for a fintech startup, featuring interactive calculators and trust signals.', category: 'Website', image: 'https://picsum.photos/seed/atlas-finance/600/400', tags: ['Next.js', 'Tailwind', 'Framer Motion'], year: '2025', featured: true },
  { id: 'p5', title: 'GreenLeaf E-Commerce', description: 'Full e-commerce storefront with product filtering, cart, checkout, and order tracking.', category: 'E-Commerce', image: 'https://picsum.photos/seed/greenleaf-shop/600/400', tags: ['Shopify', 'Custom Theme', 'Liquid'], year: '2025', featured: false },
  { id: 'p6', title: 'Meridian CRM System', description: 'Custom CRM for a retail group. Contact management, deal pipeline, and automated follow-ups.', category: 'Web App', image: 'https://picsum.photos/seed/meridian-crm/600/400', tags: ['React', 'PostgreSQL', 'REST API'], year: '2024', featured: false },
];

const DEMO_ABOUT: AboutInfo = {
  name: 'Alex Rivera',
  title: 'Full-Stack Designer & Developer',
  bio: 'I design and build digital products that people love. With 8+ years of experience spanning brand identity, web development, and product design, I help startups and growing businesses create memorable digital experiences that drive real results.\n\nCurrently based in San Francisco, available for freelance projects and consulting.',
  location: 'San Francisco, CA',
  email: 'alex@alexrivera.design',
  website: 'alexrivera.design',
  avatar: 'AR',
  socials: [
    { platform: 'GitHub', url: 'github.com/alexrivera' },
    { platform: 'LinkedIn', url: 'linkedin.com/in/alexrivera' },
    { platform: 'MessageCircle', url: 'twitter.com/alexrivera' },
  ],
  skills: ['React', 'Next.js', 'TypeScript', 'Layers', 'Tailwind CSS', 'Node.js', 'PostgreSQL', 'Brand Design', 'UI/UX', 'Motion Design'],
};

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('grid');
  const [viewport, setViewport] = useState<ViewportType>('desktop');
  const [projects, setProjects] = useState(DEMO_PROJECTS);
  const [aboutInfo, setAboutInfo] = useState(DEMO_ABOUT);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  const categories = ['all', ...new Set(projects.map(p => p.category))];
  const filteredProjects = filterCategory === 'all' ? projects : projects.filter(p => p.category === filterCategory);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'projects', label: 'Projects', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'about', label: 'About', icon: <User className="w-4 h-4" /> },
    { id: 'preview', label: 'Preview', icon: <Eye className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
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
              <Briefcase className="w-5 h-5 text-violet-400" />
              <span className="font-semibold">Portfolio Builder</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/builder" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Builder</Link>
            <Link href="/dashboard" className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors">Dashboard</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Template Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {TEMPLATES.map(template => (
            <button key={template.id} onClick={() => setSelectedTemplate(template.id)} className={`p-4 rounded-xl border text-left transition-all ${selectedTemplate === template.id ? 'bg-violet-600/20 border-violet-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={selectedTemplate === template.id ? 'text-violet-400' : 'text-white/40'}>{template.icon}</span>
                <span className="text-sm font-medium">{template.name}</span>
              </div>
              <p className="text-xs text-white/40">{template.description}</p>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-1 bg-white/5 rounded-xl p-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
          {activeTab === 'projects' && (
            <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Add Project
            </button>
          )}
        </div>

        {activeTab === 'projects' && (
          <div>
            <div className="flex gap-2 mb-6">
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filterCategory === cat ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/50 hover:text-white'}`}>{cat}</button>
              ))}
            </div>

            {showAddForm && (
              <div className="bg-white/5 rounded-2xl border border-violet-500/30 p-6 mb-6">
                <h3 className="font-semibold mb-4">Add New Project</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">Project Title</label>
                    <input type="text" placeholder="Project name" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">Category</label>
                    <input type="text" placeholder="e.g., Website, Mobile, Branding" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-1.5">Description</label>
                  <textarea rows={3} placeholder="Describe the project..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 resize-none" />
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">Image URL</label>
                    <input type="text" placeholder="https://..." className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">Live Link</label>
                    <input type="text" placeholder="https://..." className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">Tags (comma-separated)</label>
                    <input type="text" placeholder="React, Next.js, Tailwind" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors">Cancel</button>
                  <button onClick={() => {}} className="px-6 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors">Add Project</button>
                </div>
              </div>
            )}

            <div className={`grid gap-6 ${selectedTemplate === 'minimal' ? 'grid-cols-1 max-w-3xl' : selectedTemplate === 'case-study' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              {filteredProjects.map(project => (
                <div key={project.id} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden group hover:border-white/20 transition-all">
                  <div className="relative aspect-[3/2] bg-white/5 overflow-hidden">
                    <NextImage src={project.image} alt={project.title} className="object-cover group-hover:scale-105 transition-transform duration-500" fill unoptimized />
                    {project.featured && (
                      <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-amber-500/90 rounded-full text-xs font-medium text-black">
                        <Star className="w-3 h-3" /> Featured
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <div className="flex gap-2">
                        <button onClick={() => {}} className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => {}} className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"><Edit3 className="w-4 h-4" /></button>
                        {project.link && <a href={project.link} className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"><ExternalLink className="w-4 h-4" /></a>}
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded-full">{project.category}</span>
                      <span className="text-xs text-white/30">{project.year}</span>
                    </div>
                    <h3 className="font-semibold mb-2">{project.title}</h3>
                    {selectedTemplate !== 'grid' && (
                      <p className="text-sm text-white/50 mb-3 leading-relaxed">{project.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-white/5 rounded-full text-white/40">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-8">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-3xl font-bold">{aboutInfo.avatar}</div>
                <div>
                  <input type="text" value={aboutInfo.name} onChange={e => setAboutInfo(prev => ({ ...prev, name: e.target.value }))} className="text-2xl font-bold bg-transparent border-none outline-none w-full" />
                  <input type="text" value={aboutInfo.title} onChange={e => setAboutInfo(prev => ({ ...prev, title: e.target.value }))} className="text-white/50 bg-transparent border-none outline-none w-full mt-1" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Bio</label>
                  <textarea value={aboutInfo.bio} onChange={e => setAboutInfo(prev => ({ ...prev, bio: e.target.value }))} rows={5} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/50 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5 flex items-center gap-1"><MapPin className="w-3 h-3" />Location</label>
                    <input type="text" value={aboutInfo.location} onChange={e => setAboutInfo(prev => ({ ...prev, location: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5 flex items-center gap-1"><Mail className="w-3 h-3" />Email</label>
                    <input type="email" value={aboutInfo.email} onChange={e => setAboutInfo(prev => ({ ...prev, email: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {aboutInfo.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1.5 bg-violet-600/20 border border-violet-500/30 rounded-lg text-xs text-violet-300">{skill}</span>
                    ))}
                    <button onClick={() => {}} className="px-3 py-1.5 border border-dashed border-white/20 hover:border-violet-500/50 rounded-lg text-xs text-white/40 hover:text-violet-300 transition-colors flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div>
            <div className="flex items-center justify-center gap-2 mb-6">
              {[
                { id: 'desktop' as ViewportType, icon: <Monitor className="w-4 h-4" />, width: '100%' },
                { id: 'tablet' as ViewportType, icon: <Tablet className="w-4 h-4" />, width: '768px' },
                { id: 'mobile' as ViewportType, icon: <Smartphone className="w-4 h-4" />, width: '375px' },
              ].map(vp => (
                <button key={vp.id} onClick={() => setViewport(vp.id)} className={`p-2.5 rounded-lg transition-all ${viewport === vp.id ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/40 hover:text-white'}`}>{vp.icon}</button>
              ))}
            </div>
            <div className="bg-white/5 rounded-2xl border border-white/10 p-8 mx-auto transition-all" style={{ maxWidth: viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '375px' }}>
              {/* Simulated Portfolio Preview */}
              <div className="bg-[#0f0f1a] rounded-xl p-8 min-h-[600px]">
                <nav className="flex items-center justify-between mb-12">
                  <span className="text-xl font-bold">{aboutInfo.name}</span>
                  <div className="flex gap-6 text-sm text-white/50">
                    <span className="text-white">Work</span>
                    <span>About</span>
                    <span>Contact</span>
                  </div>
                </nav>
                <div className="mb-12">
                  <h1 className="text-3xl font-bold mb-3">{aboutInfo.title}</h1>
                  <p className="text-white/50 max-w-md">{aboutInfo.bio.split('\n')[0]}</p>
                </div>
                <div className={`grid gap-4 ${viewport === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {projects.filter(p => p.featured).map(project => (
                    <div key={project.id} className="rounded-xl overflow-hidden bg-white/5">
                      <div className="relative aspect-[3/2] bg-white/5">
                        <NextImage src={project.image} alt={project.title} className="object-cover" fill unoptimized />
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-sm mb-1">{project.title}</h3>
                        <p className="text-xs text-white/40">{project.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <h3 className="font-semibold mb-4">Export Options</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Download HTML', desc: 'Standalone HTML file', icon: <Download className="w-5 h-5" /> },
                  { label: 'Deploy to zoobicon.sh', desc: 'Live portfolio site', icon: <Globe className="w-5 h-5" /> },
                  { label: 'Export as React', desc: 'React components', icon: <Copy className="w-5 h-5" /> },
                  { label: 'Generate PDF', desc: 'Print-ready portfolio', icon: <Briefcase className="w-5 h-5" /> },
                ].map((opt, i) => (
                  <button onClick={() => {}} key={i} className="flex items-center gap-3 p-4 bg-white/5 hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/50 rounded-xl text-left transition-all group">
                    <span className="text-white/40 group-hover:text-violet-400 transition-colors">{opt.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-white/40">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <h3 className="font-semibold mb-4">Theme</h3>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { name: 'Dark', bg: '#0a0a12', fg: '#fff' },
                  { name: 'Light', bg: '#fafafa', fg: '#111' },
                  { name: 'Navy', bg: '#0f172a', fg: '#e2e8f0' },
                  { name: 'Warm', bg: '#1a1412', fg: '#fde8d0' },
                ].map(theme => (
                  <button onClick={() => {}} key={theme.name} className="p-3 rounded-xl border border-white/10 hover:border-violet-500/50 transition-all text-center">
                    <div className="w-full h-12 rounded-lg mb-2" style={{ backgroundColor: theme.bg, border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div className="p-2">
                        <div className="h-1 w-8 rounded-full mx-auto" style={{ backgroundColor: theme.fg }} />
                        <div className="h-1 w-5 rounded-full mx-auto mt-1 opacity-50" style={{ backgroundColor: theme.fg }} />
                      </div>
                    </div>
                    <span className="text-xs">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-white/10 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-white/40 text-sm">
            Replaces Squarespace Portfolio ($16/mo), Behance Pro, and Circle Pro ($5/mo) &mdash; <span className="text-violet-400">included free with Zoobicon Pro</span>
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
