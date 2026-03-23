'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText, Send, Eye, PenLine, Check, Clock, ChevronRight,
  ArrowLeft, Sparkles, Plus, Search, Filter, MoreVertical,
  DollarSign, Calendar, User, Building, Mail, Download,
  Copy, Trash2, CheckCircle, AlertCircle, XCircle
} from 'lucide-react';

type TabType = 'pipeline' | 'create' | 'templates' | 'signatures';
type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'expired';

interface Proposal {
  id: string;
  title: string;
  client: string;
  clientEmail: string;
  amount: number;
  status: ProposalStatus;
  createdAt: string;
  viewedAt?: string;
  signedAt?: string;
  expiresAt: string;
  sections: string[];
}

const STATUS_CONFIG: Record<ProposalStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'text-white/60', bgColor: 'bg-white/10', icon: <PenLine className="w-3.5 h-3.5" /> },
  sent: { label: 'Sent', color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: <Send className="w-3.5 h-3.5" /> },
  viewed: { label: 'Viewed', color: 'text-amber-400', bgColor: 'bg-amber-500/20', icon: <Eye className="w-3.5 h-3.5" /> },
  signed: { label: 'Signed', color: 'text-green-400', bgColor: 'bg-green-500/20', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  expired: { label: 'Expired', color: 'text-red-400', bgColor: 'bg-red-500/20', icon: <XCircle className="w-3.5 h-3.5" /> },
};

const DEMO_PROPOSALS: Proposal[] = [
  { id: 'p1', title: 'E-Commerce Platform Redesign', client: 'Meridian Retail Group', clientEmail: 'sarah@meridianretail.com', amount: 24500, status: 'signed', createdAt: '2026-03-10', viewedAt: '2026-03-11', signedAt: '2026-03-14', expiresAt: '2026-04-10', sections: ['Executive Summary', 'Scope of Work', 'Timeline', 'Pricing', 'Terms'] },
  { id: 'p2', title: 'SaaS Dashboard MVP Build', client: 'NeuralPath Labs', clientEmail: 'alex@neuralpath.io', amount: 18000, status: 'viewed', createdAt: '2026-03-18', viewedAt: '2026-03-20', expiresAt: '2026-04-18', sections: ['Project Brief', 'Tech Stack', 'Milestones', 'Budget', 'Terms'] },
  { id: 'p3', title: 'Brand Identity & Website Package', client: 'Bloom Wellness Co', clientEmail: 'maya@bloomwellness.com', amount: 8500, status: 'sent', createdAt: '2026-03-20', expiresAt: '2026-04-20', sections: ['Brand Discovery', 'Deliverables', 'Timeline', 'Investment', 'Next Steps'] },
  { id: 'p4', title: 'SEO Optimization Campaign — Q2', client: 'Atlas Financial Services', clientEmail: 'robert@atlasfinancial.com', amount: 12000, status: 'draft', createdAt: '2026-03-22', expiresAt: '2026-04-22', sections: ['Audit Report', 'Strategy', 'KPIs', 'Monthly Deliverables', 'Pricing'] },
  { id: 'p5', title: 'Mobile App Development Proposal', client: 'SwiftServe Logistics', clientEmail: 'jen@swiftserve.com', amount: 45000, status: 'expired', createdAt: '2026-02-01', expiresAt: '2026-03-01', sections: ['Overview', 'Features', 'Architecture', 'Timeline', 'Budget'] },
  { id: 'p6', title: 'Content Marketing Retainer', client: 'GreenLeaf Organics', clientEmail: 'tom@greenleaf.org', amount: 3500, status: 'signed', createdAt: '2026-03-05', viewedAt: '2026-03-06', signedAt: '2026-03-08', expiresAt: '2026-04-05', sections: ['Strategy', 'Content Calendar', 'Deliverables', 'Monthly Fee', 'Terms'] },
];

const TEMPLATES = [
  { name: 'Web Design Proposal', category: 'Design', sections: 6, description: 'Full website design with UX research, wireframes, and development.' },
  { name: 'SEO Campaign Proposal', category: 'Marketing', sections: 5, description: 'On-page and off-page SEO with monthly reporting and KPIs.' },
  { name: 'Social Media Management', category: 'Marketing', sections: 4, description: 'Monthly content creation, scheduling, and analytics.' },
  { name: 'Custom Software Development', category: 'Development', sections: 7, description: 'Full-stack application with architecture, milestones, and testing.' },
  { name: 'Brand Identity Package', category: 'Design', sections: 5, description: 'Logo, color palette, typography, and brand guidelines.' },
  { name: 'E-Commerce Setup', category: 'Development', sections: 6, description: 'Storefront, payment integration, inventory, and shipping.' },
  { name: 'Consulting Engagement', category: 'Strategy', sections: 4, description: 'Strategy sessions, deliverables, and implementation support.' },
  { name: 'Maintenance Retainer', category: 'Support', sections: 3, description: 'Monthly support hours, SLA, and bug fix prioritization.' },
];

export default function ProposalsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('pipeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProposalStatus | 'all'>('all');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [signatureDrawn, setSignatureDrawn] = useState(false);

  const filteredProposals = DEMO_PROPOSALS.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalValue = DEMO_PROPOSALS.reduce((sum, p) => sum + p.amount, 0);
  const signedValue = DEMO_PROPOSALS.filter(p => p.status === 'signed').reduce((sum, p) => sum + p.amount, 0);
  const pendingValue = DEMO_PROPOSALS.filter(p => ['sent', 'viewed'].includes(p.status)).reduce((sum, p) => sum + p.amount, 0);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'pipeline', label: 'Pipeline', icon: <Filter className="w-4 h-4" /> },
    { id: 'create', label: 'AI Create', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'templates', label: 'Templates', icon: <FileText className="w-4 h-4" /> },
    { id: 'signatures', label: 'E-Sign', icon: <PenLine className="w-4 h-4" /> },
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
              <span className="font-semibold">Proposals & Contracts</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/builder" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Builder</Link>
            <Link href="/dashboard" className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors">Dashboard</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Proposals', value: DEMO_PROPOSALS.length, icon: <FileText className="w-5 h-5" />, color: 'text-violet-400' },
            { label: 'Pipeline Value', value: `$${totalValue.toLocaleString()}`, icon: <DollarSign className="w-5 h-5" />, color: 'text-blue-400' },
            { label: 'Won Revenue', value: `$${signedValue.toLocaleString()}`, icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-400' },
            { label: 'Pending', value: `$${pendingValue.toLocaleString()}`, icon: <Clock className="w-5 h-5" />, color: 'text-amber-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/50">{stat.label}</span>
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'pipeline' && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search proposals..." className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
              </div>
              <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                {(['all', 'draft', 'sent', 'viewed', 'signed', 'expired'] as const).map(status => (
                  <button key={status} onClick={() => setFilterStatus(status)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${filterStatus === status ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white'}`}>
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <div className="divide-y divide-white/5">
                {filteredProposals.map(proposal => {
                  const statusConfig = STATUS_CONFIG[proposal.status];
                  return (
                    <div key={proposal.id} onClick={() => setSelectedProposal(selectedProposal?.id === proposal.id ? null : proposal)} className="px-6 py-5 hover:bg-white/5 transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg ${statusConfig.bgColor} flex items-center justify-center ${statusConfig.color}`}>
                          {statusConfig.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-sm truncate">{proposal.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>{statusConfig.label}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-white/40">
                            <span className="flex items-center gap-1"><Building className="w-3 h-3" />{proposal.client}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{proposal.createdAt}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">${proposal.amount.toLocaleString()}</p>
                          <p className="text-xs text-white/40">Expires {proposal.expiresAt}</p>
                        </div>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors"><MoreVertical className="w-4 h-4 text-white/40" /></button>
                      </div>
                      {selectedProposal?.id === proposal.id && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div><p className="text-xs text-white/40">Client Email</p><p className="text-sm mt-0.5">{proposal.clientEmail}</p></div>
                            <div><p className="text-xs text-white/40">Created</p><p className="text-sm mt-0.5">{proposal.createdAt}</p></div>
                            <div><p className="text-xs text-white/40">Viewed</p><p className="text-sm mt-0.5">{proposal.viewedAt || 'Not yet'}</p></div>
                            <div><p className="text-xs text-white/40">Signed</p><p className="text-sm mt-0.5">{proposal.signedAt || 'Not yet'}</p></div>
                          </div>
                          <div className="mb-4">
                            <p className="text-xs text-white/40 mb-2">Sections</p>
                            <div className="flex flex-wrap gap-2">
                              {proposal.sections.map((s, i) => (
                                <span key={i} className="text-xs px-2.5 py-1 bg-white/5 rounded-full text-white/60">{s}</span>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs transition-colors"><Eye className="w-3.5 h-3.5" />Preview</button>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs transition-colors"><Send className="w-3.5 h-3.5" />Send</button>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs transition-colors"><Copy className="w-3.5 h-3.5" />Duplicate</button>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs transition-colors"><Download className="w-3.5 h-3.5" />PDF</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">AI Proposal Generator</h2>
                  <p className="text-sm text-white/50">Describe your project and we will create a professional proposal.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">Client Name</label>
                    <input type="text" placeholder="Company name" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">Client Email</label>
                    <input type="email" placeholder="client@company.com" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">Project Type</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50">
                      <option value="">Select type...</option>
                      <option>Web Design</option>
                      <option>SEO Campaign</option>
                      <option>Software Development</option>
                      <option>Marketing</option>
                      <option>Consulting</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">Budget Range</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50">
                      <option value="">Select range...</option>
                      <option>$1,000 - $5,000</option>
                      <option>$5,000 - $15,000</option>
                      <option>$15,000 - $50,000</option>
                      <option>$50,000+</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">Project Description</label>
                  <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} rows={5} placeholder="Describe the project scope, goals, and requirements. The AI will generate a complete proposal with sections, timeline, and pricing..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 resize-none" />
                </div>
                <button onClick={handleGenerate} disabled={generating} className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/25 disabled:opacity-50">
                  {generating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Proposal</>}
                </button>
              </div>
            </div>

            {/* Pipeline visualization */}
            <div className="mt-8 bg-white/5 rounded-2xl border border-white/10 p-6">
              <h3 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-wider">Proposal Pipeline</h3>
              <div className="flex items-center gap-2">
                {(['draft', 'sent', 'viewed', 'signed'] as ProposalStatus[]).map((status, i) => {
                  const config = STATUS_CONFIG[status];
                  const count = DEMO_PROPOSALS.filter(p => p.status === status).length;
                  return (
                    <React.Fragment key={status}>
                      <div className={`flex-1 p-4 rounded-xl ${config.bgColor} border border-white/5`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={config.color}>{config.icon}</span>
                          <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                        </div>
                        <p className="text-2xl font-bold">{count}</p>
                      </div>
                      {i < 3 && <ChevronRight className="w-5 h-5 text-white/20 flex-shrink-0" />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMPLATES.map((template, i) => (
              <div key={i} className="bg-white/5 rounded-2xl border border-white/10 hover:border-violet-500/50 p-6 transition-all group cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">{template.category}</span>
                  <span className="text-xs text-white/40">{template.sections} sections</span>
                </div>
                <h3 className="font-semibold text-sm mb-2">{template.name}</h3>
                <p className="text-xs text-white/50 leading-relaxed mb-4">{template.description}</p>
                <button className="w-full py-2 bg-white/5 group-hover:bg-violet-600/20 rounded-lg text-xs font-medium text-white/60 group-hover:text-violet-300 transition-all flex items-center justify-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Use Template
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'signatures' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <PenLine className="w-6 h-6 text-violet-400" />
                <div>
                  <h2 className="text-lg font-semibold">E-Signature</h2>
                  <p className="text-sm text-white/50">Legally binding electronic signatures with timestamp.</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-6">
                <h3 className="text-sm font-medium mb-4">Sign Document</h3>
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-1.5">Full Legal Name</label>
                  <input type="text" value={signatureName} onChange={e => setSignatureName(e.target.value)} placeholder="Enter your full name" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Signature</label>
                  <div
                    onClick={() => setSignatureDrawn(true)}
                    className={`h-32 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${signatureDrawn ? 'border-violet-500/50 bg-violet-500/5' : 'border-white/20 hover:border-white/40 bg-white/5'}`}
                  >
                    {signatureDrawn && signatureName ? (
                      <p className="text-3xl font-serif italic text-violet-300">{signatureName}</p>
                    ) : (
                      <p className="text-sm text-white/30">Click to sign</p>
                    )}
                  </div>
                </div>
                {signatureDrawn && (
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-green-400">Signature captured</p>
                      <p className="text-xs text-white/40">Timestamp: {new Date().toISOString()} &middot; IP: 192.168.1.x</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <h3 className="text-sm font-medium mb-4">Recent Signatures</h3>
                <div className="space-y-3">
                  {[
                    { doc: 'E-Commerce Platform Redesign', signer: 'Sarah Chen', date: '2026-03-14 09:23:41 UTC' },
                    { doc: 'Content Marketing Retainer', signer: 'Tom Richards', date: '2026-03-08 14:52:18 UTC' },
                  ].map((sig, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{sig.doc}</p>
                        <p className="text-xs text-white/40">Signed by {sig.signer} &middot; {sig.date}</p>
                      </div>
                      <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><Download className="w-3.5 h-3.5 text-white/40" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-white/10 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-white/40 text-sm">
            Replaces PandaDoc ($49/mo), Proposify ($49/mo), and DocuSign &mdash; <span className="text-violet-400">included free with Zoobicon Pro</span>
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
