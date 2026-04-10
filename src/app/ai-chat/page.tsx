'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Bot,
  Send,
  Settings,
  Sparkles,
  Code,
  Copy,
  Check,
  Palette,
  Globe,
  BarChart3,
  MessageCircle,
  Users,
  Zap,
  Plus,
  ChevronDown,
  Brain,
  Shield,
  Clock,
  ArrowRight,
  Star,
  TrendingUp,
  Eye,
  Hash,
} from 'lucide-react';

const TEMPLATES = [
  { id: 'support', name: 'Customer Support', desc: 'Answer FAQs, troubleshoot issues, collect tickets', icon: '🛟', popular: true },
  { id: 'sales', name: 'Sales Assistant', desc: 'Qualify leads, book demos, share pricing', icon: '💰', popular: true },
  { id: 'faq', name: 'FAQ Bot', desc: 'Answer common questions from your knowledge base', icon: '❓', popular: true },
  { id: 'booking', name: 'Booking Bot', desc: 'Schedule appointments and send confirmations', icon: '📅', popular: false },
  { id: 'onboarding', name: 'Onboarding Bot', desc: 'Guide new users through setup and features', icon: '🚀', popular: false },
  { id: 'product', name: 'Product Recommendation', desc: 'Suggest products based on customer needs', icon: '🎯', popular: false },
  { id: 'feedback', name: 'Feedback Collector', desc: 'Gather reviews, NPS scores, and suggestions', icon: '📝', popular: false },
  { id: 'tech', name: 'Technical Support', desc: 'Debug issues with step-by-step troubleshooting', icon: '🔧', popular: false },
];

const DEMO_CHATBOTS = [
  { id: '1', name: 'Customer Support Bot', model: 'Claude', conversations: 1247, satisfaction: 4.6, status: 'active', leads: 89, avgResponse: '1.2s' },
  { id: '2', name: 'Sales Assistant', model: 'GPT-4o', conversations: 856, satisfaction: 4.3, status: 'active', leads: 234, avgResponse: '1.8s' },
  { id: '3', name: 'FAQ Bot', model: 'Haiku', conversations: 3421, satisfaction: 4.8, status: 'active', leads: 12, avgResponse: '0.4s' },
  { id: '4', name: 'Booking Bot', model: 'Claude', conversations: 567, satisfaction: 4.5, status: 'paused', leads: 156, avgResponse: '1.5s' },
];

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  time: string;
}

export default function AIChatPage() {
  const [tab, setTab] = useState<'builder' | 'templates' | 'analytics' | 'conversations'>('builder');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'bot', content: "Hi! 👋 I'm your AI assistant. How can I help you today?", time: '12:00' },
  ]);
  const [input, setInput] = useState('');
  const [botName, setBotName] = useState('Support Bot');
  const [botModel, setBotModel] = useState('claude');
  const [botPersonality, setBotPersonality] = useState('friendly');
  const [botColor, setBotColor] = useState('#8b5cf6');
  const [greeting, setGreeting] = useState("Hi! 👋 I'm your AI assistant. How can I help you today?");
  const [showEmbed, setShowEmbed] = useState(false);
  const [copied, setCopied] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const responses: Record<string, string> = {
        price: "Our plans start at $19/month for Creator, $49/month for Pro, and $99/month for Agency. Each includes AI website building, hosting, and support. Would you like me to help you choose the right plan?",
        help: "I'd be happy to help! Could you tell me more about what you're looking for? I can assist with building websites, managing your account, technical issues, or general questions about our platform.",
        demo: "Great choice! I can show you how our AI builds a complete website in under 2 minutes. Would you like to try it yourself? Just head to /builder and type a description of the site you want!",
        default: "Thanks for your message! I've noted your inquiry and will make sure you get the best possible answer. Is there anything specific you'd like to know about our platform?"
      };
      const lower = input.toLowerCase();
      let response = responses.default;
      if (lower.includes('price') || lower.includes('cost') || lower.includes('plan')) response = responses.price;
      else if (lower.includes('help') || lower.includes('support')) response = responses.help;
      else if (lower.includes('demo') || lower.includes('show') || lower.includes('try')) response = responses.demo;

      setMessages(prev => [...prev, { role: 'bot', content: response, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 800);
  };

  const embedCode = `<script>\n  window.ZoobiconChat = { botId: "${botName.toLowerCase().replace(/\s+/g, '-')}", color: "${botColor}" };\n</script>\n<script src="https://zoobicon.com/chat/widget.js" async></script>`;

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <div className="flex items-center gap-2"><Bot className="w-5 h-5 text-stone-400" /><span className="font-semibold">AI Chatbot Builder</span></div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/builder" className="px-3 py-1.5 text-sm text-white/60 hover:text-white">Builder</Link>
            <Link href="/knowledge-base" className="px-3 py-1.5 text-sm text-white/60 hover:text-white">Knowledge Base</Link>
            <button onClick={() => setShowEmbed(true)} className="px-4 py-2 bg-stone-600 hover:bg-stone-500 rounded-lg text-sm font-medium flex items-center gap-2"><Code className="w-4 h-4" /> Get Embed Code</button>
          </div>
        </div>
      </header>

      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 flex gap-6">
          {(['builder', 'templates', 'analytics', 'conversations'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors capitalize ${tab === t ? 'border-stone-500 text-stone-400' : 'border-transparent text-white/50 hover:text-white/80'}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {tab === 'builder' && (
          <div className="flex gap-6">
            {/* Config Panel */}
            <div className="w-80 shrink-0 space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-stone-400" /> Bot Configuration</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Bot Name</label>
                    <input value={botName} onChange={e => setBotName(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">AI Model</label>
                    <select value={botModel} onChange={e => setBotModel(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-500">
                      <option value="claude">Claude (Recommended)</option>
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="gemini">Gemini 2.5 Pro</option>
                      <option value="haiku">Claude Haiku (Fast)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Personality</label>
                    <select value={botPersonality} onChange={e => setBotPersonality(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-500">
                      <option value="friendly">Friendly & Casual</option>
                      <option value="professional">Professional</option>
                      <option value="technical">Technical Expert</option>
                      <option value="sales">Sales-oriented</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Greeting Message</label>
                    <textarea value={greeting} onChange={e => setGreeting(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:border-stone-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Widget Color</label>
                    <div className="flex gap-2">
                      {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'].map(c => (
                        <button key={c} onClick={() => setBotColor(c)} className={`w-8 h-8 rounded-full border-2 transition-transform ${botColor === c ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Brain className="w-4 h-4 text-stone-400" /> Knowledge Sources</h3>
                <div className="space-y-2">
                  <button onClick={() => {}} className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-left hover:border-stone-500/30 transition-colors flex items-center gap-2">
                    <Globe className="w-4 h-4 text-stone-400" /> Add Website URL
                  </button>
                  <button onClick={() => {}} className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-left hover:border-stone-500/30 transition-colors flex items-center gap-2">
                    <Hash className="w-4 h-4 text-stone-400" /> Add FAQ Entries
                  </button>
                  <button onClick={() => {}} className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-left hover:border-stone-500/30 transition-colors flex items-center gap-2">
                    <Shield className="w-4 h-4 text-stone-400" /> Set Escalation Rules
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Preview */}
            <div className="flex-1 flex flex-col">
              <h3 className="font-semibold mb-3">Live Preview</h3>
              <div className="flex-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col max-w-md mx-auto w-full">
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 flex items-center gap-3" style={{ backgroundColor: botColor + '20' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: botColor }}>
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{botName}</div>
                    <div className="text-xs text-stone-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-stone-400" /> Online</div>
                  </div>
                </div>

                {/* Messages */}
                <div ref={chatRef} className="flex-1 p-4 space-y-3 overflow-y-auto max-h-96 min-h-[300px]">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-stone-600 text-white rounded-br-sm' : 'bg-white/10 text-white/90 rounded-bl-sm'}`}>
                        {msg.content}
                        <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-white/50' : 'text-white/30'}`}>{msg.time}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="p-3 border-t border-white/10">
                  <div className="flex gap-2">
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-stone-500"
                    />
                    <button onClick={sendMessage} className="w-9 h-9 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: botColor }}>
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {['Pricing', 'Book a demo', 'Get support'].map(q => (
                      <button key={q} onClick={() => { setInput(q); }} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[11px] text-white/50 hover:text-white hover:border-white/30 transition-colors">{q}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'templates' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Chatbot Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {TEMPLATES.map(t => (
                <div key={t.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-stone-500/30 transition-all hover:-translate-y-0.5 cursor-pointer group" onClick={() => { setBotName(t.name); setTab('builder'); }}>
                  <div className="text-3xl mb-3">{t.icon}</div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm group-hover:text-stone-400 transition-colors">{t.name}</h3>
                    {t.popular && <span className="text-[10px] px-1.5 py-0.5 bg-stone-500/20 text-stone-400 rounded">Popular</span>}
                  </div>
                  <p className="text-xs text-white/50">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'analytics' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Conversations', value: '6,091', icon: MessageCircle, change: '+22%' },
                { label: 'Leads Captured', value: '491', icon: Users, change: '+34%' },
                { label: 'Avg Satisfaction', value: '4.6/5', icon: Star, change: '+0.3' },
                { label: 'Avg Response Time', value: '1.2s', icon: Clock, change: '-0.4s' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2"><span className="text-sm text-white/50">{stat.label}</span><Icon className="w-4 h-4 text-white/30" /></div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-stone-400 mt-1">{stat.change}</div>
                  </div>
                );
              })}
            </div>
            <div className="grid gap-4">
              {DEMO_CHATBOTS.map(bot => (
                <div key={bot.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-stone-500/20 flex items-center justify-center"><Bot className="w-5 h-5 text-stone-400" /></div>
                    <div>
                      <h3 className="font-semibold text-sm">{bot.name}</h3>
                      <p className="text-xs text-white/40">Model: {bot.model} • Avg response: {bot.avgResponse}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center"><div className="text-sm font-bold">{bot.conversations.toLocaleString()}</div><div className="text-[10px] text-white/40">Chats</div></div>
                    <div className="text-center"><div className="text-sm font-bold text-stone-400">{bot.leads}</div><div className="text-[10px] text-white/40">Leads</div></div>
                    <div className="text-center"><div className="text-sm font-bold text-stone-400">{bot.satisfaction}</div><div className="text-[10px] text-white/40">Rating</div></div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs ${bot.status === 'active' ? 'bg-stone-500/20 text-stone-400' : 'bg-stone-500/20 text-stone-400'}`}>{bot.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'conversations' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Recent Conversations</h2>
            <div className="space-y-2">
              {[
                { visitor: 'Visitor #4523', topic: 'Pricing inquiry', messages: 8, duration: '3m 12s', satisfaction: 5, time: '10 min ago' },
                { visitor: 'Sarah M.', topic: 'Technical support', messages: 12, duration: '7m 45s', satisfaction: 4, time: '25 min ago' },
                { visitor: 'Visitor #4521', topic: 'Demo request', messages: 5, duration: '2m 30s', satisfaction: 5, time: '1h ago' },
                { visitor: 'Mike W.', topic: 'Feature question', messages: 6, duration: '4m 15s', satisfaction: 3, time: '2h ago' },
                { visitor: 'Visitor #4518', topic: 'Billing issue', messages: 15, duration: '12m 20s', satisfaction: 4, time: '3h ago' },
              ].map((conv, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:border-stone-500/20 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm">{conv.visitor[0]}</div>
                    <div>
                      <div className="text-sm font-medium">{conv.visitor}</div>
                      <div className="text-xs text-white/40">{conv.topic}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-xs text-white/40">{conv.messages} messages</span>
                    <span className="text-xs text-white/40">{conv.duration}</span>
                    <div className="flex">{Array.from({ length: 5 }, (_, j) => <Star key={j} className={`w-3 h-3 ${j < conv.satisfaction ? 'text-stone-400 fill-stone-400' : 'text-white/10'}`} />)}</div>
                    <span className="text-xs text-white/30">{conv.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Embed Modal */}
      {showEmbed && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEmbed(false)}>
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Embed Your Chatbot</h3>
            <p className="text-sm text-white/50 mb-4">Add this code to any website to embed your AI chatbot:</p>
            <div className="relative">
              <pre className="bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-white/70 overflow-x-auto">{embedCode}</pre>
              <button onClick={() => { navigator.clipboard.writeText(embedCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="absolute top-2 right-2 p-1.5 bg-white/10 rounded hover:bg-white/20">
                {copied ? <Check className="w-4 h-4 text-stone-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button onClick={() => setShowEmbed(false)} className="mt-4 w-full py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">Close</button>
          </div>
        </div>
      )}

      <footer className="border-t border-white/10 mt-16 py-8 text-center text-sm text-white/30">
        <p>Zoobicon AI Chat — Replace Intercom ($74/mo), Drift ($50/mo), Tidio ($29/mo). Included in Pro plan.</p>
      </footer>
    </div>
  );
}
