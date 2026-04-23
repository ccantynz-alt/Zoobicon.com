'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bot,
  Plus,
  BarChart3,
  MessageCircle,
  Users,
  Clock,
  Star,
  Settings,
  Code,
  Copy,
  Check,
  Trash2,
  Pause,
  Play,
  AlertTriangle,
  TrendingUp,
  Globe,
  Shield,
  Zap,
  Brain,
  Send,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

interface ChatbotItem {
  id: string;
  name: string;
  status: 'active' | 'paused';
  conversations: number;
  leads: number;
  satisfaction: number;
  escalations: number;
  avgResponse: string;
  createdAt: string;
  color: string;
}

const DEMO_BOTS: ChatbotItem[] = [
  { id: '1', name: 'Customer Support', status: 'active', conversations: 2847, leads: 189, satisfaction: 4.7, escalations: 23, avgResponse: '0.8s', createdAt: '2026-03-15', color: '#8b5cf6' },
  { id: '2', name: 'Sales Assistant', status: 'active', conversations: 1532, leads: 412, satisfaction: 4.5, escalations: 8, avgResponse: '1.1s', createdAt: '2026-03-20', color: '#3b82f6' },
  { id: '3', name: 'FAQ Bot', status: 'active', conversations: 5241, leads: 67, satisfaction: 4.8, escalations: 3, avgResponse: '0.4s', createdAt: '2026-03-22', color: '#10b981' },
  { id: '4', name: 'Booking Agent', status: 'paused', conversations: 891, leads: 234, satisfaction: 4.4, escalations: 15, avgResponse: '1.3s', createdAt: '2026-03-25', color: '#f59e0b' },
];

export default function ChatbotsPage() {
  const [view, setView] = useState<'dashboard' | 'create'>('dashboard');
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Create form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formGreeting, setFormGreeting] = useState('');
  const [formColor, setFormColor] = useState('#8b5cf6');
  const [formCollectEmail, setFormCollectEmail] = useState(true);
  const [formEscalationEmail, setFormEscalationEmail] = useState('');

  const totalConversations = DEMO_BOTS.reduce((s, b) => s + b.conversations, 0);
  const totalLeads = DEMO_BOTS.reduce((s, b) => s + b.leads, 0);
  const avgSatisfaction = (DEMO_BOTS.reduce((s, b) => s + b.satisfaction, 0) / DEMO_BOTS.length).toFixed(1);
  const totalEscalations = DEMO_BOTS.reduce((s, b) => s + b.escalations, 0);

  const handleCreate = async () => {
    if (!formName || !formDesc) return;
    // In production this calls POST /api/chatbots
    alert(`Chatbot "${formName}" created! In production this would call the API and return an embed code.`);
    setView('dashboard');
  };

  const embedCode = (botId: string) =>
    `<script src="https://zoobicon.com/chat/widget.js" data-bot-id="${botId}" async></script>`;

  return (
    <div className="min-h-screen bg-transparent text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0b1530]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">
              Zoobicon
            </Link>
            <span className="text-white/30">/</span>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-stone-400" />
              <span className="font-semibold">AI Chatbots</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/ai-chat" className="px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors">
              Builder
            </Link>
            <button
              onClick={() => setView('create')}
              className="px-4 py-2 bg-stone-600 hover:bg-stone-500 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Chatbot
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {view === 'dashboard' && (
          <>
            {/* Hero Stats */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Your AI Chatbots</h1>
              <p className="text-white/50">Manage your chatbots, view analytics, and configure escalation rules</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Conversations', value: totalConversations.toLocaleString(), icon: MessageCircle, change: '+18% this week', color: 'text-stone-400' },
                { label: 'Leads Captured', value: totalLeads.toLocaleString(), icon: Users, change: '+34% this week', color: 'text-stone-400' },
                { label: 'Avg Satisfaction', value: `${avgSatisfaction}/5`, icon: Star, change: '+0.2 this month', color: 'text-stone-400' },
                { label: 'Escalations', value: totalEscalations.toString(), icon: AlertTriangle, change: '-12% this week', color: 'text-stone-400' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-white/50">{stat.label}</span>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <div className="text-xs text-stone-400">{stat.change}</div>
                  </div>
                );
              })}
            </div>

            {/* Chatbot List */}
            <div className="space-y-3">
              {DEMO_BOTS.map(bot => (
                <div
                  key={bot.id}
                  className={`bg-white/5 border rounded-xl p-5 transition-all cursor-pointer hover:-translate-y-0.5 ${
                    selectedBot === bot.id ? 'border-stone-500/50 bg-stone-500/5' : 'border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => setSelectedBot(selectedBot === bot.id ? null : bot.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: bot.color + '20' }}>
                        <Bot className="w-6 h-6" style={{ color: bot.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{bot.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            bot.status === 'active' ? 'bg-stone-500/20 text-stone-400' : 'bg-stone-500/20 text-stone-400'
                          }`}>
                            {bot.status}
                          </span>
                        </div>
                        <p className="text-sm text-white/40">Created {bot.createdAt} &middot; Avg response: {bot.avgResponse}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className="text-sm font-bold">{bot.conversations.toLocaleString()}</div>
                        <div className="text-[10px] text-white/40">Conversations</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-stone-400">{bot.leads}</div>
                        <div className="text-[10px] text-white/40">Leads</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-stone-400">{bot.satisfaction}</div>
                        <div className="text-[10px] text-white/40">Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-stone-400">{bot.escalations}</div>
                        <div className="text-[10px] text-white/40">Escalations</div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-white/30 transition-transform ${selectedBot === bot.id ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded Panel */}
                  {selectedBot === bot.id && (
                    <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Embed Code */}
                      <div className="bg-black/20 rounded-lg p-4">
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Code className="w-4 h-4 text-stone-400" /> Embed Code
                        </h4>
                        <pre className="text-[11px] text-white/60 bg-black/30 rounded p-2 overflow-x-auto mb-2">
                          {embedCode(bot.id)}
                        </pre>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(embedCode(bot.id));
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="text-xs px-3 py-1.5 bg-white/10 rounded hover:bg-white/20 flex items-center gap-1 transition-colors"
                        >
                          {copied ? <Check className="w-3 h-3 text-stone-400" /> : <Copy className="w-3 h-3" />}
                          {copied ? 'Copied!' : 'Copy Code'}
                        </button>
                      </div>

                      {/* Quick Actions */}
                      <div className="bg-black/20 rounded-lg p-4">
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Settings className="w-4 h-4 text-stone-400" /> Quick Actions
                        </h4>
                        <div className="space-y-2">
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-left px-3 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10 flex items-center gap-2 transition-colors"
                          >
                            <Brain className="w-4 h-4 text-stone-400" /> Edit Knowledge Base
                          </button>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-left px-3 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10 flex items-center gap-2 transition-colors"
                          >
                            <Shield className="w-4 h-4 text-stone-400" /> Escalation Rules
                          </button>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-left px-3 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10 flex items-center gap-2 transition-colors"
                          >
                            {bot.status === 'active' ? <Pause className="w-4 h-4 text-stone-400" /> : <Play className="w-4 h-4 text-stone-400" />}
                            {bot.status === 'active' ? 'Pause Bot' : 'Activate Bot'}
                          </button>
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="bg-black/20 rounded-lg p-4">
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-stone-400" /> This Week
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-white/50">Conversations</span>
                            <span className="font-medium">{Math.round(bot.conversations * 0.18)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">New leads</span>
                            <span className="font-medium text-stone-400">{Math.round(bot.leads * 0.25)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">Escalations</span>
                            <span className="font-medium text-stone-400">{Math.round(bot.escalations * 0.3)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">Satisfaction</span>
                            <span className="font-medium text-stone-400">{bot.satisfaction}/5</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pricing CTA */}
            <div className="mt-12 bg-gradient-to-r from-stone-900/30 to-stone-900/30 border border-stone-500/20 rounded-2xl p-8 text-center">
              <Sparkles className="w-8 h-8 text-stone-400 mx-auto mb-3" />
              <h2 className="text-2xl font-bold mb-2">Replace Intercom, Drift, and Tidio</h2>
              <p className="text-white/60 max-w-xl mx-auto mb-6">
                Zoobicon AI Chatbots are included in Pro ($49/mo) and Agency ($129/mo) plans.
                Competitors charge $50-74/month for a single chatbot.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/pricing" className="px-6 py-3 bg-stone-600 hover:bg-stone-500 rounded-lg font-medium transition-colors">
                  View Plans
                </Link>
                <Link href="/ai-chat" className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors">
                  Try the Builder
                </Link>
              </div>
            </div>
          </>
        )}

        {view === 'create' && (
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setView('dashboard')} className="text-sm text-white/50 hover:text-white mb-6 flex items-center gap-1">
              &larr; Back to Dashboard
            </button>

            <h1 className="text-2xl font-bold mb-6">Create New Chatbot</h1>

            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Bot className="w-5 h-5 text-stone-400" /> Basic Info
                </h3>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Business Name *</label>
                  <input
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g., Acme Corp"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-stone-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Business Description *</label>
                  <textarea
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    placeholder="What does your business do? What products/services do you offer?"
                    rows={3}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-stone-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Greeting Message</label>
                  <input
                    value={formGreeting}
                    onChange={e => setFormGreeting(e.target.value)}
                    placeholder="Hi! How can I help you today?"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-stone-500"
                  />
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Settings className="w-5 h-5 text-stone-400" /> Configuration
                </h3>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Widget Color</label>
                  <div className="flex gap-3">
                    {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'].map(c => (
                      <button
                        key={c}
                        onClick={() => setFormColor(c)}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          formColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Collect visitor email</label>
                    <p className="text-xs text-white/40">Ask for email before starting conversation</p>
                  </div>
                  <button
                    onClick={() => setFormCollectEmail(!formCollectEmail)}
                    className={`w-11 h-6 rounded-full transition-colors ${formCollectEmail ? 'bg-stone-600' : 'bg-white/20'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${formCollectEmail ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Escalation Email</label>
                  <input
                    value={formEscalationEmail}
                    onChange={e => setFormEscalationEmail(e.target.value)}
                    placeholder="support@yourcompany.com"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-stone-500"
                  />
                  <p className="text-xs text-white/40 mt-1">When the AI can&apos;t help, the conversation is forwarded here</p>
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={!formName || !formDesc}
                className="w-full py-3 bg-stone-600 hover:bg-stone-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Zap className="w-4 h-4" /> Create Chatbot
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-white/10 mt-16 py-8 text-center text-sm text-white/30">
        <p>zoobicon.com &middot; zoobicon.ai &middot; zoobicon.io &middot; zoobicon.sh</p>
      </footer>
    </div>
  );
}
