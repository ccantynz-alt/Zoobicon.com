'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LinkIcon,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Palette,
  Share2,
  BarChart3,
  Sparkles,
  Instagram,
  MessageCircle,
  Youtube,
  Music,
  Globe,
  Mail,
  Phone,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Image,
  QrCode,
  DollarSign,
  Copy,
  Check,
  Smartphone,
} from 'lucide-react';

const THEMES = [
  { id: 'dark', name: 'Dark', bg: 'bg-gray-950', text: 'text-white', card: 'bg-white/10' },
  { id: 'gradient', name: 'Gradient', bg: 'bg-gradient-to-b from-violet-950 to-fuchsia-950', text: 'text-white', card: 'bg-white/10' },
  { id: 'neon', name: 'Neon', bg: 'bg-black', text: 'text-green-400', card: 'bg-green-500/10 border-green-500/30' },
  { id: 'minimal', name: 'Minimal', bg: 'bg-white', text: 'text-gray-900', card: 'bg-gray-100' },
  { id: 'glass', name: 'Glass', bg: 'bg-gradient-to-b from-blue-900 to-purple-900', text: 'text-white', card: 'bg-white/10 backdrop-blur' },
  { id: 'retro', name: 'Retro', bg: 'bg-amber-50', text: 'text-amber-900', card: 'bg-amber-100' },
  { id: 'bold', name: 'Bold', bg: 'bg-red-600', text: 'text-white', card: 'bg-white/20' },
  { id: 'nature', name: 'Nature', bg: 'bg-gradient-to-b from-green-900 to-emerald-950', text: 'text-white', card: 'bg-white/10' },
  { id: 'professional', name: 'Professional', bg: 'bg-slate-900', text: 'text-white', card: 'bg-slate-800' },
  { id: 'creative', name: 'Creative', bg: 'bg-gradient-to-b from-pink-500 to-orange-400', text: 'text-white', card: 'bg-white/20' },
  { id: 'brutalist', name: 'Brutalist', bg: 'bg-yellow-300', text: 'text-black', card: 'bg-black text-yellow-300' },
  { id: 'pastel', name: 'Pastel', bg: 'bg-pink-100', text: 'text-pink-900', card: 'bg-white' },
];

interface BioLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  featured: boolean;
}

export default function LinkBioPage() {
  const [tab, setTab] = useState<'editor' | 'themes' | 'analytics'>('editor');
  const [username, setUsername] = useState('yourname');
  const [displayName, setDisplayName] = useState('Your Name');
  const [bio, setBio] = useState('Creator, builder, dreamer ✨');
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [links, setLinks] = useState<BioLink[]>([
    { id: '1', title: 'My Website', url: 'https://example.com', icon: '🌐', featured: true },
    { id: '2', title: 'Latest Blog Post', url: 'https://blog.example.com', icon: '📝', featured: false },
    { id: '3', title: 'Instagram', url: 'https://instagram.com/yourname', icon: '📸', featured: false },
    { id: '4', title: 'YouTube Channel', url: 'https://youtube.com/@yourname', icon: '🎬', featured: false },
    { id: '5', title: 'Buy My Course', url: 'https://course.example.com', icon: '🎓', featured: false },
    { id: '6', title: 'Newsletter', url: 'https://newsletter.example.com', icon: '📧', featured: false },
  ]);
  const [copied, setCopied] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const theme = THEMES.find(t => t.id === selectedTheme) || THEMES[0];

  const addLink = () => {
    setLinks([...links, { id: Date.now().toString(), title: 'New Link', url: 'https://', icon: '🔗', featured: false }]);
  };

  const removeLink = (id: string) => setLinks(links.filter(l => l.id !== id));

  const moveLink = (id: string, dir: 'up' | 'down') => {
    const idx = links.findIndex(l => l.id === id);
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === links.length - 1)) return;
    const newLinks = [...links];
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    [newLinks[idx], newLinks[swapIdx]] = [newLinks[swapIdx], newLinks[idx]];
    setLinks(newLinks);
  };

  const updateLink = (id: string, updates: Partial<BioLink>) => {
    setLinks(links.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const pageUrl = `https://zoobicon.sh/${username}`;

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <div className="flex items-center gap-2"><LinkIcon className="w-5 h-5 text-violet-400" /><span className="font-semibold">Link in Bio</span></div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { navigator.clipboard.writeText(pageUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="px-4 py-2 bg-white/10 rounded-lg text-sm flex items-center gap-2 hover:bg-white/20 transition-colors">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />} {pageUrl}
            </button>
            <button onClick={() => alert('Publishing your link bio page...')} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors">Publish</button>
          </div>
        </div>
      </header>

      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 flex gap-6">
          {(['editor', 'themes', 'analytics'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors capitalize ${tab === t ? 'border-violet-500 text-violet-400' : 'border-transparent text-white/50 hover:text-white/80'}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {tab === 'editor' && (
          <div className="flex gap-8">
            {/* Editor */}
            <div className="flex-1 space-y-4">
              {/* AI Generator */}
              <div className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-xl p-4">
                <div className="flex gap-3">
                  <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Describe your brand and AI will create your link page..." className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
                  <button onClick={() => alert('AI link generation coming soon')} className="px-4 py-2 bg-violet-600 rounded-lg text-sm font-medium flex items-center gap-2"><Sparkles className="w-4 h-4" /> Generate</button>
                </div>
              </div>

              {/* Profile */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="font-semibold mb-3">Profile</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-white/50 mb-1">Username</label><div className="flex"><span className="bg-white/10 border border-r-0 border-white/20 rounded-l-lg px-3 py-2 text-sm text-white/40">zoobicon.sh/</span><input value={username} onChange={e => setUsername(e.target.value)} className="flex-1 bg-white/10 border border-white/20 rounded-r-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500" /></div></div>
                  <div><label className="block text-xs text-white/50 mb-1">Display Name</label><input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500" /></div>
                  <div className="col-span-2"><label className="block text-xs text-white/50 mb-1">Bio</label><textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm h-16 resize-none focus:outline-none focus:border-violet-500" /></div>
                </div>
              </div>

              {/* Links */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Links</h3>
                  <button onClick={addLink} className="px-3 py-1.5 bg-violet-600 rounded-lg text-xs font-medium flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add Link</button>
                </div>
                <div className="space-y-2">
                  {links.map(link => (
                    <div key={link.id} className="flex items-center gap-2 p-2.5 bg-white/5 border border-white/10 rounded-lg group">
                      <GripVertical className="w-4 h-4 text-white/20 cursor-grab" />
                      <span className="text-lg">{link.icon}</span>
                      <input value={link.title} onChange={e => updateLink(link.id, { title: e.target.value })} className="flex-1 bg-transparent text-sm font-medium focus:outline-none" placeholder="Link title" />
                      <input value={link.url} onChange={e => updateLink(link.id, { url: e.target.value })} className="flex-1 bg-transparent text-xs text-white/40 focus:outline-none" placeholder="https://" />
                      <button onClick={() => updateLink(link.id, { featured: !link.featured })} className={`p-1 rounded ${link.featured ? 'text-yellow-400' : 'text-white/20'}`}>★</button>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => moveLink(link.id, 'up')} className="p-1 hover:bg-white/10 rounded"><ArrowUp className="w-3 h-3" /></button>
                        <button onClick={() => moveLink(link.id, 'down')} className="p-1 hover:bg-white/10 rounded"><ArrowDown className="w-3 h-3" /></button>
                        <button onClick={() => removeLink(link.id)} className="p-1 hover:bg-red-500/20 rounded"><Trash2 className="w-3 h-3 text-red-400" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Phone Preview */}
            <div className="w-80 shrink-0">
              <h3 className="font-semibold mb-3 text-center">Preview</h3>
              <div className="mx-auto w-[280px] h-[580px] rounded-[2.5rem] border-4 border-white/20 bg-black overflow-hidden relative">
                <div className="w-20 h-5 bg-black rounded-b-xl absolute top-0 left-1/2 -translate-x-1/2 z-10" />
                <div className={`h-full overflow-y-auto px-5 pt-12 pb-6 ${theme.bg} ${theme.text}`}>
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white">{displayName[0]}</div>
                    <h2 className="text-lg font-bold">{displayName}</h2>
                    <p className="text-sm opacity-70 mt-1">{bio}</p>
                  </div>
                  <div className="space-y-2.5">
                    {links.map(link => (
                      <div key={link.id} className={`${theme.card} rounded-xl p-3 text-center transition-transform hover:scale-[1.02] cursor-pointer ${link.featured ? 'ring-2 ring-violet-500' : 'border border-white/10'}`}>
                        <span className="text-sm font-medium">{link.icon} {link.title}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-[10px] opacity-30 mt-6">zoobicon.sh/{username}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'themes' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Choose a Theme</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {THEMES.map(t => (
                <button key={t.id} onClick={() => setSelectedTheme(t.id)} className={`rounded-xl overflow-hidden border-2 transition-all ${selectedTheme === t.id ? 'border-violet-500 scale-105' : 'border-white/10 hover:border-white/30'}`}>
                  <div className={`${t.bg} ${t.text} p-4 h-40 flex flex-col items-center justify-center`}>
                    <div className="w-10 h-10 rounded-full bg-white/20 mb-2" />
                    <div className="w-20 h-2 rounded bg-current opacity-70 mb-1.5" />
                    <div className="w-16 h-1.5 rounded bg-current opacity-30 mb-3" />
                    <div className={`${t.card} w-24 h-5 rounded-lg`} />
                    <div className={`${t.card} w-24 h-5 rounded-lg mt-1.5`} />
                  </div>
                  <div className="bg-white/5 p-2 text-center text-xs font-medium">{t.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'analytics' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Views', value: '12,453', change: '+34%' },
                { label: 'Total Clicks', value: '8,934', change: '+28%' },
                { label: 'Click Rate', value: '71.7%', change: '+5.2%' },
                { label: 'Unique Visitors', value: '9,821', change: '+22%' },
              ].map((s, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="text-sm text-white/50 mb-1">{s.label}</div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-green-400 mt-1">{s.change}</div>
                </div>
              ))}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Clicks by Link</h3>
              {links.map((link, i) => {
                const clicks = [3200, 2100, 1800, 1200, 400, 234][i] || 100;
                return (
                  <div key={link.id} className="flex items-center gap-3 mb-3">
                    <span className="text-sm w-32 truncate">{link.icon} {link.title}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-end px-2" style={{ width: `${(clicks / 3200) * 100}%` }}>
                        <span className="text-[10px] font-medium">{clicks.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-white/10 mt-16 py-8 text-center text-sm text-white/30">
        <p>Zoobicon Link — Replace Linktree ($24/mo). Free with your Zoobicon account.</p>
      </footer>
    </div>
  );
}
