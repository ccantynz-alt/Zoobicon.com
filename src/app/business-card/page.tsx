'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Download,
  Sparkles,
  RotateCw,
  Palette,
  Type,
  QrCode,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Link2,
  MessageCircle,
  Building2,
  Printer,
  Share2,
  Copy,
  Check,
  ChevronRight,
  Layers,
  Image,
  Smartphone,
  Briefcase,
  Pen,
} from 'lucide-react';

const TEMPLATES = [
  { id: 'minimal', name: 'Minimal', preview: 'bg-white', accent: '#0a0a12' },
  { id: 'gradient', name: 'Gradient', preview: 'bg-gradient-to-br from-stone-600 to-stone-600', accent: '#8b5cf6' },
  { id: 'dark', name: 'Dark Pro', preview: 'bg-gray-900', accent: '#f59e0b' },
  { id: 'nature', name: 'Nature', preview: 'bg-gradient-to-br from-stone-500 to-stone-600', accent: '#10b981' },
  { id: 'ocean', name: 'Ocean', preview: 'bg-gradient-to-br from-stone-500 to-stone-500', accent: '#3b82f6' },
  { id: 'sunset', name: 'Sunset', preview: 'bg-gradient-to-br from-stone-500 to-stone-500', accent: '#f97316' },
  { id: 'corporate', name: 'Corporate', preview: 'bg-slate-800', accent: '#64748b' },
  { id: 'neon', name: 'Neon', preview: 'bg-black', accent: '#22d3ee' },
];

const DEMO_CARD = {
  name: 'Alex Rivera',
  title: 'Creative Director',
  company: 'Rivera Design Studio',
  email: 'alex@riveradesign.co',
  phone: '+1 (415) 555-0147',
  website: 'riveradesign.co',
  location: 'San Francisco, CA',
  linkedin: 'linkedin.com/in/alexrivera',
  twitter: '@alexrivera',
  tagline: 'Crafting brands that command attention',
};

export default function BusinessCardPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('gradient');
  const [showBack, setShowBack] = useState(false);
  const [card, setCard] = useState(DEMO_CARD);
  const [activeTab, setActiveTab] = useState<'edit' | 'design' | 'qr'>('edit');
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(true);
  const [primaryColor, setPrimaryColor] = useState('#8b5cf6');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [selectedShape, setSelectedShape] = useState('Standard (3.5" x 2")');

  const handleCopyVCard = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen text-white">
      <header className="border-b border-white/10 bg-[#0b1530]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <span className="font-semibold text-white">Business Card Generator</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleCopyVCard} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm">
              {copied ? <Check className="w-4 h-4 text-stone-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy vCard'}
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm">
              <Printer className="w-4 h-4" /> Print Ready
            </button>
            <button onClick={() => {
              const cardEl = document.querySelector('[style*="perspective"]')?.querySelector('[style*="transformStyle"]') as HTMLElement;
              if (!cardEl) return;
              const canvas = document.createElement('canvas');
              canvas.width = 840; canvas.height = 504;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;
              ctx.fillStyle = '#8b5cf6';
              ctx.fillRect(0, 0, 840, 504);
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 36px Inter, sans-serif';
              ctx.fillText(card.name, 48, 80);
              ctx.font = '24px Inter, sans-serif';
              ctx.fillText(card.title, 48, 120);
              ctx.font = '18px Inter, sans-serif';
              ctx.fillText(card.company, 48, 150);
              ctx.fillText(card.email, 48, 400);
              ctx.fillText(card.phone, 48, 430);
              ctx.fillText(card.website, 48, 460);
              const link = document.createElement('a');
              link.download = `${card.name.replace(/\s+/g, '-').toLowerCase()}-business-card.png`;
              link.href = canvas.toDataURL('image/png');
              link.click();
            }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-stone-600 to-stone-600 hover:opacity-90 transition text-sm font-medium">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Card Preview */}
        <div className="mb-10 flex flex-col items-center">
          <div className="relative" style={{ perspective: '1000px' }}>
            <div
              className="w-[420px] h-[252px] rounded-2xl shadow-2xl shadow-stone-500/20 transition-all duration-700 relative cursor-pointer"
              onClick={() => setShowBack(!showBack)}
              style={{ transformStyle: 'preserve-3d', transform: showBack ? 'rotateY(180deg)' : 'rotateY(0)' }}
            >
              {/* Front */}
              <div className={`absolute inset-0 rounded-2xl p-6 ${TEMPLATES.find(t => t.id === selectedTemplate)?.preview || ''} backface-hidden overflow-hidden`}
                style={{ backfaceVisibility: 'hidden' }}
              >
                {selectedTemplate === 'gradient' ? (
                  <div className="h-full flex flex-col justify-between text-white">
                    <div>
                      <h2 className="text-xl font-bold">{card.name}</h2>
                      <p className="text-white/80 text-sm">{card.title}</p>
                      <p className="text-white/60 text-xs mt-0.5">{card.company}</p>
                    </div>
                    <div className="space-y-1 text-xs text-white/80">
                      <p>{card.email}</p>
                      <p>{card.phone}</p>
                      <p>{card.website}</p>
                    </div>
                  </div>
                ) : selectedTemplate === 'minimal' ? (
                  <div className="h-full flex flex-col justify-between text-gray-900">
                    <div>
                      <h2 className="text-xl font-bold">{card.name}</h2>
                      <p className="text-gray-500 text-sm">{card.title} at {card.company}</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="space-y-0.5 text-xs text-gray-600">
                        <p>{card.email}</p>
                        <p>{card.phone}</p>
                      </div>
                      <div className="w-8 h-8 bg-gray-900 rounded" />
                    </div>
                  </div>
                ) : (
                  <div className={`h-full flex flex-col justify-between ${selectedTemplate === 'dark' || selectedTemplate === 'corporate' || selectedTemplate === 'neon' ? 'text-white' : 'text-white'}`}>
                    <div>
                      <h2 className="text-xl font-bold">{card.name}</h2>
                      <p className="opacity-80 text-sm">{card.title}</p>
                      <p className="opacity-60 text-xs mt-0.5">{card.company}</p>
                    </div>
                    <div className="space-y-1 text-xs opacity-80">
                      <p>{card.email}</p>
                      <p>{card.phone}</p>
                      <p>{card.website}</p>
                    </div>
                  </div>
                )}
              </div>
              {/* Back */}
              <div className={`absolute inset-0 rounded-2xl p-6 ${TEMPLATES.find(t => t.id === selectedTemplate)?.preview || ''}`}
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <div className={`h-full flex items-center justify-center ${selectedTemplate === 'minimal' ? 'text-gray-900' : 'text-white'}`}>
                  <div className="text-center">
                    {showQR && <div className="w-24 h-24 mx-auto mb-3 bg-white/20 rounded-xl flex items-center justify-center"><QrCode className="w-16 h-16" /></div>}
                    <p className="font-bold text-lg">{card.company}</p>
                    <p className="text-sm opacity-70 mt-1">{card.tagline}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm text-white/40">
            <RotateCw className="w-4 h-4" /> Click card to flip
          </div>
        </div>

        {/* Templates */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-white/60 mb-3">Design Templates</h3>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`p-3 rounded-xl border transition text-center ${
                  selectedTemplate === t.id ? 'border-stone-500 bg-stone-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className={`w-full h-10 rounded-lg mb-2 ${t.preview}`} />
                <span className="text-xs">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tabs */}
          <div className="lg:col-span-2">
            <div className="flex gap-2 mb-6">
              {[
                { id: 'edit' as const, label: 'Edit Content', icon: Pen },
                { id: 'design' as const, label: 'Customize Design', icon: Palette },
                { id: 'qr' as const, label: 'QR Code', icon: QrCode },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                    activeTab === tab.id ? 'bg-stone-600 text-white' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'edit' && (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                {[
                  { label: 'Full Name', key: 'name', icon: User },
                  { label: 'Job Title', key: 'title', icon: Briefcase },
                  { label: 'Company', key: 'company', icon: Building2 },
                  { label: 'Email', key: 'email', icon: Mail },
                  { label: 'Phone', key: 'phone', icon: Phone },
                  { label: 'Website', key: 'website', icon: Globe },
                  { label: 'Location', key: 'location', icon: MapPin },
                  { label: 'LinkedIn', key: 'linkedin', icon: Link2 },
                  { label: 'MessageCircle', key: 'twitter', icon: MessageCircle },
                  { label: 'Tagline', key: 'tagline', icon: Sparkles },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-xs text-white/40 mb-1 block">{field.label}</label>
                    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10 focus-within:border-stone-500/50">
                      <field.icon className="w-4 h-4 text-white/30" />
                      <input
                        type="text"
                        value={(card as Record<string, string>)[field.key]}
                        onChange={(e) => setCard({ ...card, [field.key]: e.target.value })}
                        className="flex-1 bg-transparent text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'design' && (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                <div>
                  <label className="text-sm font-medium text-white/60 mb-3 block">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent" />
                    <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm w-32 focus:outline-none" />
                    <div className="flex gap-2">
                      {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#f97316'].map((c) => (
                        <button key={c} onClick={() => setPrimaryColor(c)} className="w-8 h-8 rounded-lg border-2 border-transparent hover:border-white/40 transition" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-white/60 mb-3 block">Font Family</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Inter', 'Playfair Display', 'Space Grotesk', 'DM Sans', 'Outfit', 'Sora'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFontFamily(f)}
                        className={`px-4 py-3 rounded-xl border text-sm transition ${fontFamily === f ? 'border-stone-500 bg-stone-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-white/60 mb-3 block">Card Shape</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Standard (3.5" x 2")', 'Square (2.5" x 2.5")', 'Mini (3" x 1.5")'].map((s) => (
                      <button key={s} onClick={() => setSelectedShape(s)} className={`px-4 py-3 rounded-xl border text-sm transition ${selectedShape === s ? 'border-stone-500 bg-stone-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'qr' && (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">QR Code on Back</h3>
                    <p className="text-sm text-white/50">Scan to save contact information</p>
                  </div>
                  <button onClick={() => setShowQR(!showQR)} className={`w-12 h-6 rounded-full transition ${showQR ? 'bg-stone-600' : 'bg-white/20'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${showQR ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {showQR && (
                  <>
                    <div className="flex justify-center">
                      <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center">
                        <QrCode className="w-32 h-32 text-gray-900" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-white/50 mb-2 block">QR Code links to</label>
                      <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none">
                        <option value="vcard">vCard (Contact Info)</option>
                        <option value="website">Website URL</option>
                        <option value="linkedin">LinkedIn Profile</option>
                        <option value="email">Email Address</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Export Panel */}
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="font-semibold mb-4">Export Options</h3>
              <div className="space-y-3">
                {[
                  { label: 'PNG (High Res)', desc: '300 DPI, print-ready', icon: Image },
                  { label: 'PDF (Print)', desc: 'CMYK color profile', icon: CreditCard },
                  { label: 'SVG (Vector)', desc: 'Scalable for any size', icon: Layers },
                  { label: 'Digital Card', desc: 'Share via link or NFC', icon: Smartphone },
                  { label: 'vCard (.vcf)', desc: 'Save to contacts', icon: Share2 },
                ].map((opt) => (
                  <button onClick={() => {}} key={opt.label} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-left">
                    <opt.icon className="w-5 h-5 text-stone-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-white/40">{opt.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/30" />
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-r from-stone-500/10 to-stone-500/10 border border-stone-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-stone-400" />
                <h3 className="font-semibold">AI Generate</h3>
              </div>
              <p className="text-sm text-white/50 mb-4">Describe your brand and AI will design the perfect card</p>
              <textarea placeholder="e.g., Modern tech startup, clean and bold..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-stone-500/50 mb-3" />
              <button onClick={() => alert('AI design generation coming soon')} className="w-full py-3 rounded-xl bg-gradient-to-r from-stone-600 to-stone-600 font-medium text-sm hover:opacity-90 transition flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" /> Generate Design
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="font-semibold mb-3">Print Specifications</h3>
              <div className="space-y-2 text-sm text-white/50">
                <div className="flex justify-between"><span>Size</span><span className="text-white">3.5&quot; x 2&quot;</span></div>
                <div className="flex justify-between"><span>Bleed</span><span className="text-white">0.125&quot;</span></div>
                <div className="flex justify-between"><span>DPI</span><span className="text-white">300</span></div>
                <div className="flex justify-between"><span>Color</span><span className="text-white">CMYK</span></div>
                <div className="flex justify-between"><span>Finish</span><span className="text-white">Matte</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}