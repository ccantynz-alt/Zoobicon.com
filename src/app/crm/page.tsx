'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  PieChart,
  LayoutGrid,
  Zap,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Star,
  TrendingUp,
  DollarSign,
  Clock,
  ChevronRight,
  MoreHorizontal,
  Sparkles,
  Filter,
  ArrowUpRight,
  Building2,
  UserPlus,
  Target,
  Activity,
  BarChart3,
  Send,
} from 'lucide-react';

interface Deal {
  id: string;
  contact: string;
  company: string;
  value: number;
  lastActivity: string;
  score: 'hot' | 'warm' | 'cold';
  email: string;
}

interface Stage {
  id: string;
  name: string;
  deals: Deal[];
}

const INITIAL_PIPELINE: Stage[] = [
  { id: 'lead', name: 'Lead', deals: [
    { id: '1', contact: 'Sarah Chen', company: 'TechStart Inc', value: 15000, lastActivity: '2h ago', score: 'hot', email: 'sarah@techstart.io' },
    { id: '2', contact: 'Mike Wilson', company: 'GrowthLabs', value: 8500, lastActivity: '1d ago', score: 'warm', email: 'mike@growthlabs.co' },
    { id: '8', contact: 'Anna Lopez', company: 'DesignHub', value: 5200, lastActivity: '4h ago', score: 'cold', email: 'anna@designhub.io' },
  ]},
  { id: 'qualified', name: 'Qualified', deals: [
    { id: '3', contact: 'Emma Rodriguez', company: 'BrandWise', value: 22000, lastActivity: '3h ago', score: 'hot', email: 'emma@brandwise.com' },
    { id: '9', contact: 'Tom Baker', company: 'Catalyst', value: 18000, lastActivity: '6h ago', score: 'warm', email: 'tom@catalyst.dev' },
  ]},
  { id: 'proposal', name: 'Proposal', deals: [
    { id: '4', contact: 'James Park', company: 'CloudNine', value: 45000, lastActivity: '5h ago', score: 'hot', email: 'james@cloudnine.io' },
    { id: '5', contact: 'Lisa Thompson', company: 'DataFlow', value: 12000, lastActivity: '2d ago', score: 'warm', email: 'lisa@dataflow.com' },
  ]},
  { id: 'negotiation', name: 'Negotiation', deals: [
    { id: '6', contact: 'David Kim', company: 'ScaleUp', value: 67000, lastActivity: '1h ago', score: 'hot', email: 'david@scaleup.co' },
  ]},
  { id: 'won', name: 'Won', deals: [
    { id: '7', contact: 'Rachel Green', company: 'EcoVentures', value: 35000, lastActivity: '1d ago', score: 'hot', email: 'rachel@ecoventures.com' },
    { id: '10', contact: 'Chris Yang', company: 'NexGen AI', value: 52000, lastActivity: '3d ago', score: 'hot', email: 'chris@nexgen.ai' },
  ]},
];

const CONTACTS = [
  { id: '1', name: 'Sarah Chen', email: 'sarah@techstart.io', company: 'TechStart Inc', phone: '+1 (555) 234-5678', tags: ['Enterprise', 'Tech'], lastContact: '2h ago', dealValue: 15000, score: 'hot' as const },
  { id: '2', name: 'Mike Wilson', email: 'mike@growthlabs.co', company: 'GrowthLabs', phone: '+1 (555) 345-6789', tags: ['Startup', 'Marketing'], lastContact: '1d ago', dealValue: 8500, score: 'warm' as const },
  { id: '3', name: 'Emma Rodriguez', email: 'emma@brandwise.com', company: 'BrandWise', phone: '+1 (555) 456-7890', tags: ['Agency', 'Design'], lastContact: '3h ago', dealValue: 22000, score: 'hot' as const },
  { id: '4', name: 'James Park', email: 'james@cloudnine.io', company: 'CloudNine', phone: '+1 (555) 567-8901', tags: ['SaaS', 'Enterprise'], lastContact: '5h ago', dealValue: 45000, score: 'hot' as const },
  { id: '5', name: 'Lisa Thompson', email: 'lisa@dataflow.com', company: 'DataFlow', phone: '+1 (555) 678-9012', tags: ['Data', 'Analytics'], lastContact: '2d ago', dealValue: 12000, score: 'warm' as const },
  { id: '6', name: 'David Kim', email: 'david@scaleup.co', company: 'ScaleUp', phone: '+1 (555) 789-0123', tags: ['Venture', 'Growth'], lastContact: '1h ago', dealValue: 67000, score: 'hot' as const },
  { id: '7', name: 'Rachel Green', email: 'rachel@ecoventures.com', company: 'EcoVentures', phone: '+1 (555) 890-1234', tags: ['Green', 'Startup'], lastContact: '1d ago', dealValue: 35000, score: 'hot' as const },
];

const ACTIVITIES = [
  { id: '1', type: 'email', contact: 'Sarah Chen', desc: 'Sent proposal follow-up', time: '2h ago' },
  { id: '2', type: 'call', contact: 'David Kim', desc: 'Discovery call — 45 min', time: '3h ago' },
  { id: '3', type: 'meeting', contact: 'James Park', desc: 'Quarterly review meeting', time: '5h ago' },
  { id: '4', type: 'note', contact: 'Emma Rodriguez', desc: 'Client wants rush delivery — offered 10% premium', time: '6h ago' },
  { id: '5', type: 'deal', contact: 'Rachel Green', desc: 'Deal moved to Won — $35,000', time: '1d ago' },
  { id: '6', type: 'email', contact: 'Lisa Thompson', desc: 'Sent revised pricing sheet', time: '2d ago' },
  { id: '7', type: 'call', contact: 'Mike Wilson', desc: 'Cold outreach — left voicemail', time: '2d ago' },
];

const AUTOMATIONS = [
  { id: '1', name: 'New lead → Welcome email + CRM entry', trigger: 'form.submitted', active: true, runs: 1234 },
  { id: '2', name: 'No activity 7d → Send reminder', trigger: 'inactivity.7d', active: true, runs: 567 },
  { id: '3', name: 'Deal won → Send thank you + invoice', trigger: 'deal.won', active: true, runs: 89 },
  { id: '4', name: 'New proposal viewed → Slack notification', trigger: 'proposal.viewed', active: false, runs: 234 },
];

export default function CRMPage() {
  const [tab, setTab] = useState<'dashboard' | 'pipeline' | 'contacts' | 'automation'>('dashboard');
  const [pipeline, setPipeline] = useState<Stage[]>(INITIAL_PIPELINE);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [dragDeal, setDragDeal] = useState<{ dealId: string; fromStage: string } | null>(null);
  const [aiFollowUp, setAiFollowUp] = useState<string | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState('');

  const totalPipeline = pipeline.reduce((sum, s) => sum + s.deals.reduce((ds, d) => ds + d.value, 0), 0);
  const wonDeals = pipeline.find(s => s.id === 'won');
  const wonValue = wonDeals ? wonDeals.deals.reduce((sum, d) => sum + d.value, 0) : 0;
  const totalDeals = pipeline.reduce((sum, s) => sum + s.deals.length, 0);

  const handleDragStart = (dealId: string, stageId: string) => {
    setDragDeal({ dealId, fromStage: stageId });
  };

  const handleDrop = (toStageId: string) => {
    if (!dragDeal || dragDeal.fromStage === toStageId) { setDragDeal(null); return; }
    setPipeline(prev => {
      const newPipeline = prev.map(s => ({ ...s, deals: [...s.deals] }));
      const fromStage = newPipeline.find(s => s.id === dragDeal.fromStage);
      const toStage = newPipeline.find(s => s.id === toStageId);
      if (!fromStage || !toStage) return prev;
      const dealIdx = fromStage.deals.findIndex(d => d.id === dragDeal.dealId);
      if (dealIdx === -1) return prev;
      const [deal] = fromStage.deals.splice(dealIdx, 1);
      toStage.deals.push(deal);
      return newPipeline;
    });
    setDragDeal(null);
  };

  const generateFollowUp = (contact: string, company: string) => {
    setAiFollowUp(contact);
    setTimeout(() => {
      setGeneratedEmail(`Hi ${contact.split(' ')[0]},\n\nI wanted to follow up on our recent conversation about your project at ${company}. Based on what you shared, I believe we can deliver exceptional value for your team.\n\nHere are the key next steps I'd recommend:\n\n1. Schedule a 30-minute deep-dive call to finalize requirements\n2. I'll prepare a detailed proposal with timeline and deliverables\n3. We can kick off development within the week\n\nWould you be available for a quick call this Thursday or Friday?\n\nBest regards`);
    }, 1000);
  };

  const scoreColor = (score: string) => score === 'hot' ? 'bg-red-500/20 text-red-400' : score === 'warm' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400';
  const activityIcon = (type: string) => type === 'email' ? Mail : type === 'call' ? Phone : type === 'meeting' ? Calendar : type === 'note' ? MessageSquare : Target;

  const filteredContacts = searchQuery
    ? CONTACTS.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.company.toLowerCase().includes(searchQuery.toLowerCase()))
    : CONTACTS;

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <div className="flex items-center gap-2"><Users className="w-5 h-5 text-violet-400" /><span className="font-semibold">CRM</span></div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/forms" className="px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors">Forms</Link>
            <Link href="/invoicing" className="px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors">Invoicing</Link>
            <Link href="/automation" className="px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors">Automation</Link>
            <button className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"><UserPlus className="w-4 h-4" /> Add Contact</button>
          </div>
        </div>
      </header>

      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 flex gap-6">
          {(['dashboard', 'pipeline', 'contacts', 'automation'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors capitalize ${tab === t ? 'border-violet-500 text-violet-400' : 'border-transparent text-white/50 hover:text-white/80'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard */}
        {tab === 'dashboard' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Pipeline Value', value: `$${(totalPipeline / 1000).toFixed(0)}K`, icon: DollarSign, change: '+23.4%', color: 'violet' },
                { label: 'Won This Month', value: `$${(wonValue / 1000).toFixed(0)}K`, icon: TrendingUp, change: '+45.2%', color: 'green' },
                { label: 'Total Deals', value: totalDeals.toString(), icon: Target, change: '+3', color: 'blue' },
                { label: 'Win Rate', value: '28.4%', icon: PieChart, change: '+4.1%', color: 'fuchsia' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/50">{stat.label}</span>
                      <Icon className="w-4 h-4 text-white/30" />
                    </div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-green-400 mt-1">{stat.change} vs last month</div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Forecast */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-violet-400" /> Revenue Forecast</h3>
                <div className="h-40 flex items-end gap-3">
                  {[35, 42, 58, 67, 72, 87, 95, 82, 91, 105, 118, 132].map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-full rounded-t transition-all ${i < 3 ? 'bg-violet-600' : 'bg-violet-600/40 border border-dashed border-violet-500/30'}`} style={{ height: `${(v / 132) * 100}%` }} />
                      <span className="text-[10px] text-white/30">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Feed */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-violet-400" /> Recent Activity</h3>
                <div className="space-y-3">
                  {ACTIVITIES.slice(0, 5).map(act => {
                    const Icon = activityIcon(act.type);
                    return (
                      <div key={act.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="w-3.5 h-3.5 text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm"><span className="font-medium">{act.contact}</span> — {act.desc}</p>
                          <p className="text-xs text-white/40">{act.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="mt-6 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-xl p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-violet-400" /> AI Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-sm font-medium text-violet-300">High Priority Follow-up</p>
                  <p className="text-sm text-white/60 mt-1">David Kim (ScaleUp) — $67K deal in negotiation. No contact in 24h. Suggest: Send pricing breakdown.</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-300">Hot Lead Alert</p>
                  <p className="text-sm text-white/60 mt-1">Emma Rodriguez (BrandWise) viewed your proposal 3 times today. Score: 94/100. Ready to close.</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-sm font-medium text-orange-300">Risk Warning</p>
                  <p className="text-sm text-white/60 mt-1">Lisa Thompson (DataFlow) hasn&apos;t responded in 2 days. Engagement dropping. Suggest: Offer demo call.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pipeline */}
        {tab === 'pipeline' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Deal Pipeline</h2>
              <div className="flex gap-2">
                <div className="text-sm text-white/50">Total: <span className="text-white font-bold">${(totalPipeline / 1000).toFixed(0)}K</span></div>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {pipeline.map(stage => (
                <div
                  key={stage.id}
                  className="w-72 shrink-0"
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleDrop(stage.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">{stage.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/40">{stage.deals.length}</span>
                      <span className="text-xs text-white/40">${(stage.deals.reduce((s, d) => s + d.value, 0) / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                  <div className="space-y-2 min-h-[200px] bg-white/[0.02] rounded-xl p-2 border border-white/5">
                    {stage.deals.map(deal => (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={() => handleDragStart(deal.id, stage.id)}
                        className="bg-white/5 border border-white/10 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-violet-500/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{deal.contact}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${scoreColor(deal.score)}`}>{deal.score}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
                          <Building2 className="w-3 h-3" /> {deal.company}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-green-400">${deal.value.toLocaleString()}</span>
                          <span className="text-[10px] text-white/30">{deal.lastActivity}</span>
                        </div>
                        <div className="mt-2 flex gap-1">
                          <button onClick={() => generateFollowUp(deal.contact, deal.company)} className="flex-1 py-1 bg-violet-500/20 text-violet-400 rounded text-[10px] hover:bg-violet-500/30 transition-colors flex items-center justify-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> AI Follow-up
                          </button>
                          <button className="p-1 bg-white/5 rounded hover:bg-white/10 transition-colors"><Mail className="w-3 h-3 text-white/40" /></button>
                          <button className="p-1 bg-white/5 rounded hover:bg-white/10 transition-colors"><Phone className="w-3 h-3 text-white/40" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contacts */}
        {tab === 'contacts' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Contacts</h2>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search contacts..." className="pl-9 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm w-64 focus:outline-none focus:border-violet-500" />
                </div>
                <button className="px-3 py-2 bg-white/10 rounded-lg text-sm flex items-center gap-2"><Filter className="w-4 h-4" /> Filter</button>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-3 text-xs text-white/50 font-medium">Contact</th>
                    <th className="text-left px-4 py-3 text-xs text-white/50 font-medium">Company</th>
                    <th className="text-left px-4 py-3 text-xs text-white/50 font-medium">Deal Value</th>
                    <th className="text-left px-4 py-3 text-xs text-white/50 font-medium">Score</th>
                    <th className="text-left px-4 py-3 text-xs text-white/50 font-medium">Last Contact</th>
                    <th className="text-left px-4 py-3 text-xs text-white/50 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map(contact => (
                    <tr key={contact.id} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedContact(selectedContact === contact.id ? null : contact.id)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-sm font-medium text-violet-400">{contact.name[0]}</div>
                          <div>
                            <div className="text-sm font-medium">{contact.name}</div>
                            <div className="text-xs text-white/40">{contact.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70">{contact.company}</td>
                      <td className="px-4 py-3 text-sm font-medium text-green-400">${contact.dealValue.toLocaleString()}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${scoreColor(contact.score)}`}>{contact.score}</span></td>
                      <td className="px-4 py-3 text-sm text-white/50">{contact.lastContact}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><Mail className="w-3.5 h-3.5 text-white/40" /></button>
                          <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><Phone className="w-3.5 h-3.5 text-white/40" /></button>
                          <button onClick={e => { e.stopPropagation(); generateFollowUp(contact.name, contact.company); }} className="p-1.5 hover:bg-violet-500/20 rounded-lg transition-colors"><Sparkles className="w-3.5 h-3.5 text-violet-400" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Automation */}
        {tab === 'automation' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Automations</h2>
              <Link href="/automation" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"><Plus className="w-4 h-4" /> Create Workflow</Link>
            </div>
            <div className="space-y-3">
              {AUTOMATIONS.map(auto => (
                <div key={auto.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between hover:border-violet-500/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${auto.active ? 'bg-green-500/20' : 'bg-white/10'}`}>
                      <Zap className={`w-5 h-5 ${auto.active ? 'text-green-400' : 'text-white/30'}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{auto.name}</h3>
                      <p className="text-xs text-white/40">Trigger: {auto.trigger}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-sm text-white/50">{auto.runs.toLocaleString()} runs</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs ${auto.active ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>{auto.active ? 'Active' : 'Paused'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Follow-up Modal */}
      {aiFollowUp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setAiFollowUp(null); setGeneratedEmail(''); }}>
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><Sparkles className="w-5 h-5 text-violet-400" /> AI Follow-up Email</h3>
            <p className="text-sm text-white/50 mb-4">Generated for {aiFollowUp}</p>
            {generatedEmail ? (
              <div>
                <textarea value={generatedEmail} onChange={e => setGeneratedEmail(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg p-4 text-sm h-48 resize-none focus:outline-none focus:border-violet-500" />
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"><Send className="w-4 h-4" /> Send Email</button>
                  <button className="px-4 py-2.5 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">Copy</button>
                  <button onClick={() => { setAiFollowUp(null); setGeneratedEmail(''); }} className="px-4 py-2.5 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">Close</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full" />
                <span className="ml-3 text-sm text-white/50">Generating personalized email...</span>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="border-t border-white/10 mt-16 py-8 text-center text-sm text-white/30">
        <p>Zoobicon CRM — Replace HubSpot CRM ($45/mo), Pipedrive ($14/mo). Included in Pro plan.</p>
        <div className="flex justify-center gap-6 mt-3">
          <Link href="/forms" className="hover:text-white/60 transition-colors">Forms</Link>
          <Link href="/invoicing" className="hover:text-white/60 transition-colors">Invoicing</Link>
          <Link href="/automation" className="hover:text-white/60 transition-colors">Automation</Link>
          <Link href="/proposals" className="hover:text-white/60 transition-colors">Proposals</Link>
        </div>
      </footer>
    </div>
  );
}
