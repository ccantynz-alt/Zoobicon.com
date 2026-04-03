'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Phone,
  Bell,
  Send,
  Users,
  BarChart3,
  ArrowRight,
  Zap,
  Clock,
  Search,
  Plus,
  Check,
  Filter,
  Globe,
  Smartphone,
  Inbox,
  Bot,
  Settings,
  ChevronDown,
  Mail,
  Hash,
  Megaphone,
  RefreshCw,
  X,
  Eye,
  Star,
} from 'lucide-react';

type Channel = 'all' | 'sms' | 'whatsapp' | 'push' | 'telegram';

interface Message {
  id: string;
  channel: 'sms' | 'whatsapp' | 'push' | 'telegram';
  from: string;
  preview: string;
  time: string;
  unread: boolean;
  avatar: string;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  channels: ('sms' | 'whatsapp' | 'push' | 'telegram')[];
  lastMessage: string;
  tags: string[];
}

interface Automation {
  id: string;
  name: string;
  trigger: string;
  channel: string;
  status: 'active' | 'draft' | 'paused';
  sent: number;
  openRate: number;
}

const CHANNEL_CONFIG = {
  sms: { name: 'SMS', icon: Phone, color: 'text-green-400', bg: 'bg-green-500/20', gradient: 'from-green-500 to-emerald-500' },
  whatsapp: { name: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/20', gradient: 'from-emerald-500 to-teal-500' },
  push: { name: 'Push', icon: Bell, color: 'text-blue-400', bg: 'bg-blue-500/20', gradient: 'from-blue-500 to-indigo-500' },
  telegram: { name: 'Telegram', icon: Send, color: 'text-cyan-400', bg: 'bg-cyan-500/20', gradient: 'from-cyan-500 to-blue-500' },
};

const DEMO_MESSAGES: Message[] = [
  { id: '1', channel: 'whatsapp', from: 'Sarah Mitchell', preview: 'Hi! I was wondering about the pricing for the agency plan. Can you send me details?', time: '2 min ago', unread: true, avatar: 'SM' },
  { id: '2', channel: 'sms', from: '+1 (555) 234-5678', preview: 'Your site is live! Check it out at https://mystore.zoobicon.sh', time: '15 min ago', unread: true, avatar: '📱' },
  { id: '3', channel: 'telegram', from: 'DevTeam Bot', preview: 'Build #4291 completed successfully. 3 new deploys today.', time: '32 min ago', unread: false, avatar: '🤖' },
  { id: '4', channel: 'push', from: 'James Chen', preview: 'Left a 5-star review on G2. Thank you for the amazing product!', time: '1 hr ago', unread: false, avatar: 'JC' },
  { id: '5', channel: 'whatsapp', from: 'Maria Rodriguez', preview: 'The white-label setup is working perfectly for our clients. Quick question about custom domains...', time: '2 hr ago', unread: false, avatar: 'MR' },
  { id: '6', channel: 'sms', from: '+1 (555) 876-5432', preview: 'Reminder: Your trial expires in 3 days. Upgrade to keep your sites live.', time: '3 hr ago', unread: false, avatar: '📱' },
  { id: '7', channel: 'push', from: 'System', preview: 'New signup from your referral link! You earned 5 free builds.', time: '5 hr ago', unread: false, avatar: '🎉' },
  { id: '8', channel: 'telegram', from: 'Analytics Bot', preview: 'Weekly report: 12,400 total page views across your 8 sites. Top: portfolio.zoobicon.sh', time: '6 hr ago', unread: false, avatar: '📊' },
];

const DEMO_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Sarah Mitchell', phone: '+1 (555) 123-4567', channels: ['whatsapp', 'sms'], lastMessage: '2 min ago', tags: ['lead', 'agency'] },
  { id: 'c2', name: 'James Chen', phone: '+1 (555) 234-5678', channels: ['push', 'sms'], lastMessage: '1 hr ago', tags: ['customer', 'pro'] },
  { id: 'c3', name: 'Maria Rodriguez', phone: '+1 (555) 345-6789', channels: ['whatsapp', 'telegram'], lastMessage: '2 hr ago', tags: ['customer', 'agency'] },
  { id: 'c4', name: 'David Park', phone: '+1 (555) 456-7890', channels: ['sms'], lastMessage: '1 day ago', tags: ['lead'] },
  { id: 'c5', name: 'Emily Watson', phone: '+1 (555) 567-8901', channels: ['whatsapp', 'push', 'telegram'], lastMessage: '2 days ago', tags: ['customer', 'enterprise'] },
  { id: 'c6', name: 'Alex Kowalski', phone: '+44 7911 123456', channels: ['whatsapp', 'sms'], lastMessage: '3 days ago', tags: ['lead', 'eu'] },
];

const DEMO_AUTOMATIONS: Automation[] = [
  { id: 'a1', name: 'Welcome Sequence', trigger: 'New signup', channel: 'WhatsApp + SMS', status: 'active', sent: 4291, openRate: 78 },
  { id: 'a2', name: 'Trial Expiry Reminder', trigger: '3 days before trial ends', channel: 'SMS + Push', status: 'active', sent: 1820, openRate: 62 },
  { id: 'a3', name: 'Review Request', trigger: '7 days after first deploy', channel: 'WhatsApp', status: 'active', sent: 3450, openRate: 45 },
  { id: 'a4', name: 'Win-back Campaign', trigger: '30 days inactive', channel: 'SMS', status: 'paused', sent: 890, openRate: 18 },
  { id: 'a5', name: 'Feature Announcement', trigger: 'Manual trigger', channel: 'Push + Telegram', status: 'draft', sent: 0, openRate: 0 },
];

export default function MessagingPage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'broadcast' | 'automations' | 'contacts' | 'analytics'>('inbox');
  const [channelFilter, setChannelFilter] = useState<Channel>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [broadcastChannel, setBroadcastChannel] = useState<'sms' | 'whatsapp' | 'push' | 'telegram'>('sms');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const filteredMessages = channelFilter === 'all' ? DEMO_MESSAGES : DEMO_MESSAGES.filter(m => m.channel === channelFilter);
  const unreadCount = DEMO_MESSAGES.filter(m => m.unread).length;

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <span className="text-white/70 font-medium">Messaging</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/builder" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Builder</Link>
            <Link href="/pricing" className="px-4 py-2 text-sm bg-gradient-to-r from-green-600 to-teal-600 rounded-lg font-medium hover:opacity-90 transition-opacity">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm mb-6">
            <MessageSquare className="w-4 h-4" /> Unified Messaging
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            SMS, WhatsApp, Push & Telegram — <span className="bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">One Inbox</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Reach customers on every channel. Unified inbox, broadcast messaging, automation sequences, and AI-powered responses.
          </p>
        </div>

        {/* Channel Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(CHANNEL_CONFIG).map(([key, ch]) => (
            <div key={key} className="p-4 rounded-xl border border-white/10 bg-white/5">
              <div className={`w-8 h-8 rounded-lg ${ch.bg} flex items-center justify-center mb-2`}>
                <ch.icon className={`w-4 h-4 ${ch.color}`} />
              </div>
              <div className="text-lg font-bold">{ch.name}</div>
              <div className="text-xs text-gray-400">
                {key === 'sms' ? '2,340 contacts' : key === 'whatsapp' ? '1,890 contacts' : key === 'push' ? '4,120 subscribers' : '980 members'}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 mb-8 overflow-x-auto">
          {[
            { id: 'inbox' as const, label: 'Inbox', icon: Inbox, badge: unreadCount },
            { id: 'broadcast' as const, label: 'Broadcast', icon: Megaphone },
            { id: 'automations' as const, label: 'Automations', icon: Bot },
            { id: 'contacts' as const, label: 'Contacts', icon: Users },
            { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:text-white'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
              {t.badge && <span className="px-1.5 py-0.5 rounded-full bg-green-500 text-white text-xs">{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* Inbox */}
        {activeTab === 'inbox' && (
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-2">
              <div className="flex gap-1 p-1 bg-white/5 rounded-lg mb-3">
                {(['all', 'sms', 'whatsapp', 'push', 'telegram'] as Channel[]).map(c => (
                  <button key={c} onClick={() => setChannelFilter(c)}
                    className={`px-2 py-1 rounded text-xs ${channelFilter === c ? 'bg-white/15 text-white' : 'text-gray-500'}`}>
                    {c === 'all' ? 'All' : CHANNEL_CONFIG[c].name}
                  </button>
                ))}
              </div>
              {filteredMessages.map(msg => {
                const ch = CHANNEL_CONFIG[msg.channel];
                return (
                  <button key={msg.id} onClick={() => setSelectedMessage(msg)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${selectedMessage?.id === msg.id ? 'border-green-500/50 bg-green-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-xs font-bold flex-shrink-0">{msg.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${msg.unread ? 'text-white' : 'text-gray-400'}`}>{msg.from}</span>
                          <span className="text-xs text-gray-500">{msg.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ch.icon className={`w-3 h-3 ${ch.color} flex-shrink-0`} />
                          <p className="text-xs text-gray-400 truncate">{msg.preview}</p>
                        </div>
                      </div>
                      {msg.unread && <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Message Detail */}
            <div className="lg:col-span-3">
              {selectedMessage ? (
                <div className="p-6 rounded-xl border border-white/10 bg-white/5 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center font-bold">{selectedMessage.avatar}</div>
                    <div>
                      <div className="font-medium">{selectedMessage.from}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        {(() => { const ch = CHANNEL_CONFIG[selectedMessage.channel]; return <><ch.icon className={`w-3 h-3 ${ch.color}`} />{ch.name}</>; })()}
                        &middot; {selectedMessage.time}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3 mb-4">
                    <div className="flex justify-start">
                      <div className="max-w-[80%] p-3 rounded-2xl rounded-tl-sm bg-white/10 text-sm">{selectedMessage.preview}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type a reply..." className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500" />
                    <button onClick={() => {}} className="px-4 py-2 rounded-lg bg-green-600 text-sm font-medium hover:bg-green-500 transition-colors flex items-center gap-1"><Send className="w-4 h-4" /></button>
                    <button onClick={() => {}} className="px-4 py-2 rounded-lg bg-white/10 text-sm hover:bg-white/20 transition-colors flex items-center gap-1"><Zap className="w-4 h-4 text-yellow-400" /> AI</button>
                  </div>
                </div>
              ) : (
                <div className="p-12 rounded-xl border border-white/10 bg-white/5 h-full flex items-center justify-center text-center">
                  <div><Inbox className="w-12 h-12 text-gray-600 mx-auto mb-3" /><p className="text-gray-500">Select a conversation</p></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Broadcast */}
        {activeTab === 'broadcast' && (
          <div className="max-w-2xl space-y-6">
            <div className="p-6 rounded-xl border border-white/10 bg-white/5 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Megaphone className="w-5 h-5 text-green-400" /> Send Broadcast</h3>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Channel</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.entries(CHANNEL_CONFIG) as [string, typeof CHANNEL_CONFIG.sms][]).map(([key, ch]) => (
                    <button key={key} onClick={() => setBroadcastChannel(key as any)}
                      className={`p-3 rounded-lg border text-center transition-all ${broadcastChannel === key ? `border-green-500/50 ${ch.bg}` : 'border-white/10 bg-white/5'}`}>
                      <ch.icon className={`w-5 h-5 mx-auto mb-1 ${ch.color}`} />
                      <span className="text-xs">{ch.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Audience</label>
                <select className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                  <option>All contacts ({broadcastChannel === 'sms' ? '2,340' : broadcastChannel === 'whatsapp' ? '1,890' : broadcastChannel === 'push' ? '4,120' : '980'})</option>
                  <option>Pro customers only</option><option>Leads only</option><option>Custom segment</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Message</label>
                <textarea value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} rows={4}
                  placeholder={`Type your ${CHANNEL_CONFIG[broadcastChannel].name} message...`}
                  className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 resize-none" />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">{broadcastMessage.length} characters</span>
                  <button onClick={() => {}} className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"><Zap className="w-3 h-3" /> AI Write</button>
                </div>
              </div>
              <button onClick={() => { setBroadcastSent(true); setTimeout(() => setBroadcastSent(false), 3000); }}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-teal-600 font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                {broadcastSent ? <><Check className="w-4 h-4" /> Broadcast Sent!</> : <><Send className="w-4 h-4" /> Send Broadcast</>}
              </button>
            </div>
          </div>
        )}

        {/* Automations */}
        {activeTab === 'automations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Automation Sequences</h3>
              <button onClick={() => {}} className="px-4 py-2 rounded-lg bg-green-600 text-sm font-medium hover:bg-green-500 transition-colors flex items-center gap-1"><Plus className="w-4 h-4" /> New Automation</button>
            </div>
            {DEMO_AUTOMATIONS.map(auto => (
              <div key={auto.id} className="p-4 rounded-xl border border-white/10 bg-white/5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{auto.name}</h4>
                  <span className={`px-2 py-0.5 rounded text-xs ${auto.status === 'active' ? 'bg-green-500/20 text-green-400' : auto.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>{auto.status}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {auto.trigger}</span>
                  <span>{auto.channel}</span>
                  <span>{auto.sent.toLocaleString()} sent</span>
                  {auto.openRate > 0 && <span>{auto.openRate}% open rate</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contacts */}
        {activeTab === 'contacts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{DEMO_CONTACTS.length} Contacts</h3>
              <button onClick={() => {}} className="px-4 py-2 rounded-lg bg-green-600 text-sm font-medium hover:bg-green-500 transition-colors flex items-center gap-1"><Plus className="w-4 h-4" /> Add Contact</button>
            </div>
            {DEMO_CONTACTS.map(contact => (
              <div key={contact.id} className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-sm font-bold">{contact.name.split(' ').map(n => n[0]).join('')}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{contact.name}</div>
                  <div className="text-xs text-gray-500">{contact.phone}</div>
                </div>
                <div className="flex gap-1">
                  {contact.channels.map(ch => {
                    const config = CHANNEL_CONFIG[ch];
                    return <div key={ch} className={`w-6 h-6 rounded ${config.bg} flex items-center justify-center`}><config.icon className={`w-3 h-3 ${config.color}`} /></div>;
                  })}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {contact.tags.map(tag => <span key={tag} className="px-2 py-0.5 rounded bg-white/10 text-xs text-gray-400">{tag}</span>)}
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">{contact.lastMessage}</span>
              </div>
            ))}
          </div>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(CHANNEL_CONFIG).map(([key, ch]) => (
              <div key={key} className="p-6 rounded-xl border border-white/10 bg-white/5">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-lg ${ch.bg} flex items-center justify-center`}><ch.icon className={`w-4 h-4 ${ch.color}`} /></div>
                  <h4 className="font-semibold">{ch.name}</h4>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Sent', value: key === 'sms' ? '12.4K' : key === 'whatsapp' ? '8.9K' : key === 'push' ? '24.1K' : '3.2K' },
                    { label: 'Delivered', value: key === 'sms' ? '98%' : key === 'whatsapp' ? '99%' : key === 'push' ? '94%' : '97%' },
                    { label: 'Open Rate', value: key === 'sms' ? '78%' : key === 'whatsapp' ? '85%' : key === 'push' ? '42%' : '62%' },
                  ].map((stat, i) => (
                    <div key={i} className="text-center">
                      <div className="text-lg font-bold">{stat.value}</div>
                      <div className="text-xs text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-20 text-center p-12 rounded-2xl bg-gradient-to-br from-green-600/20 to-teal-600/20 border border-green-500/20">
          <h2 className="text-3xl font-bold mb-4">Reach Every Customer, Every Channel</h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">SMS, WhatsApp, Push, and Telegram in one unified inbox. Automate sequences, broadcast updates, and manage contacts.</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 font-semibold hover:opacity-90 transition-opacity">
            Start Messaging Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}