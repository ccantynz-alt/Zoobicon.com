'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Link2,
  Wifi,
  Contact,
  Mail,
  Phone,
  MessageSquare,
  Palette,
  Download,
  Copy,
  Grid3X3,
  Image,
  Layers,
  Zap,
  ChevronRight,
  Check,
  Settings,
  Eye,
  LayoutGrid,
  FileText,
  ArrowLeft,
  Sparkles,
  Package,
} from 'lucide-react';

type QRType = 'url' | 'wifi' | 'vcard' | 'email' | 'phone' | 'sms';
type TabType = 'generator' | 'templates' | 'batch' | 'history';
type CornerStyle = 'square' | 'rounded' | 'dots' | 'diamond';

interface QRConfig {
  type: QRType;
  data: Record<string, string>;
  fgColor: string;
  bgColor: string;
  cornerStyle: CornerStyle;
  logoEnabled: boolean;
  size: number;
}

const QR_TYPES: { id: QRType; label: string; icon: React.ReactNode; fields: { key: string; label: string; placeholder: string; type?: string }[] }[] = [
  { id: 'url', label: 'URL', icon: <Link2 className="w-5 h-5" />, fields: [{ key: 'url', label: 'Website URL', placeholder: 'https://example.com' }] },
  { id: 'wifi', label: 'WiFi', icon: <Wifi className="w-5 h-5" />, fields: [{ key: 'ssid', label: 'Network Name', placeholder: 'MyWiFi' }, { key: 'password', label: 'Password', placeholder: 'Enter password' }, { key: 'encryption', label: 'Encryption', placeholder: 'WPA/WPA2' }] },
  { id: 'vcard', label: 'vCard', icon: <Contact className="w-5 h-5" />, fields: [{ key: 'name', label: 'Full Name', placeholder: 'John Doe' }, { key: 'email', label: 'Email', placeholder: 'john@example.com' }, { key: 'phone', label: 'Phone', placeholder: '+1 555-0123' }, { key: 'company', label: 'Company', placeholder: 'Acme Inc' }] },
  { id: 'email', label: 'Email', icon: <Mail className="w-5 h-5" />, fields: [{ key: 'to', label: 'To', placeholder: 'hello@example.com' }, { key: 'subject', label: 'Subject', placeholder: 'Hello!' }, { key: 'body', label: 'Body', placeholder: 'Message body...' }] },
  { id: 'phone', label: 'Phone', icon: <Phone className="w-5 h-5" />, fields: [{ key: 'number', label: 'Phone Number', placeholder: '+1 555-0123' }] },
  { id: 'sms', label: 'SMS', icon: <MessageSquare className="w-5 h-5" />, fields: [{ key: 'number', label: 'Phone Number', placeholder: '+1 555-0123' }, { key: 'message', label: 'Message', placeholder: 'Your message...' }] },
];

const TEMPLATES = [
  { name: 'Restaurant Menu', type: 'url' as QRType, fg: '#D4451A', bg: '#FFF8F0', corner: 'rounded' as CornerStyle },
  { name: 'Business Card', type: 'vcard' as QRType, fg: '#1A365D', bg: '#FFFFFF', corner: 'square' as CornerStyle },
  { name: 'WiFi Guest', type: 'wifi' as QRType, fg: '#2D8CFF', bg: '#F0F8FF', corner: 'dots' as CornerStyle },
  { name: 'Event Ticket', type: 'url' as QRType, fg: '#6B21A8', bg: '#FAF5FF', corner: 'diamond' as CornerStyle },
  { name: 'Product Packaging', type: 'url' as QRType, fg: '#065F46', bg: '#ECFDF5', corner: 'rounded' as CornerStyle },
  { name: 'Social Media', type: 'url' as QRType, fg: '#E11D48', bg: '#FFF1F2', corner: 'dots' as CornerStyle },
];

const HISTORY = [
  { name: 'Company Website', type: 'url', date: '2026-03-22', scans: 1247 },
  { name: 'Office WiFi', type: 'wifi', date: '2026-03-20', scans: 89 },
  { name: 'CEO Contact Card', type: 'vcard', date: '2026-03-18', scans: 342 },
  { name: 'Support Email', type: 'email', date: '2026-03-15', scans: 56 },
  { name: 'Product Landing Page', type: 'url', date: '2026-03-12', scans: 2103 },
];

function SimulatedQR({ config }: { config: QRConfig }) {
  const gridSize = 25;
  const cellSize = config.size / gridSize;
  // Deterministic pseudo-random QR pattern based on type
  const seed = config.type.charCodeAt(0) + (config.data[Object.keys(config.data)[0]] || '').length;
  const cells: boolean[][] = [];
  for (let r = 0; r < gridSize; r++) {
    cells[r] = [];
    for (let c = 0; c < gridSize; c++) {
      // Always fill finder patterns (3 corners)
      const inTopLeft = r < 7 && c < 7;
      const inTopRight = r < 7 && c >= gridSize - 7;
      const inBottomLeft = r >= gridSize - 7 && c < 7;
      if (inTopLeft || inTopRight || inBottomLeft) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6 ||
          (inTopRight && (c === gridSize - 1 || c === gridSize - 7)) ||
          (inBottomLeft && (r === gridSize - 1 || r === gridSize - 7));
        const isInner = (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
          (inTopRight && r >= 2 && r <= 4 && c >= gridSize - 5 && c <= gridSize - 3) ||
          (inBottomLeft && r >= gridSize - 5 && r <= gridSize - 3 && c >= 2 && c <= 4);
        cells[r][c] = isOuter || isInner;
      } else {
        cells[r][c] = ((r * 7 + c * 13 + seed) % 3) !== 0;
      }
    }
  }

  const getRadius = () => {
    switch (config.cornerStyle) {
      case 'rounded': return cellSize * 0.4;
      case 'dots': return cellSize * 0.5;
      case 'diamond': return 0;
      default: return 0;
    }
  };

  return (
    <div className="flex items-center justify-center">
      <svg width={config.size} height={config.size} viewBox={`0 0 ${config.size} ${config.size}`}>
        <rect width={config.size} height={config.size} fill={config.bgColor} rx="8" />
        {cells.map((row, r) =>
          row.map((filled, c) => {
            if (!filled) return null;
            const x = c * cellSize;
            const y = r * cellSize;
            if (config.cornerStyle === 'dots') {
              return <circle key={`${r}-${c}`} cx={x + cellSize / 2} cy={y + cellSize / 2} r={cellSize * 0.4} fill={config.fgColor} />;
            }
            if (config.cornerStyle === 'diamond') {
              const cx = x + cellSize / 2;
              const cy = y + cellSize / 2;
              const s = cellSize * 0.45;
              return <polygon key={`${r}-${c}`} points={`${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`} fill={config.fgColor} />;
            }
            return <rect key={`${r}-${c}`} x={x} y={y} width={cellSize} height={cellSize} rx={getRadius()} fill={config.fgColor} />;
          })
        )}
        {config.logoEnabled && (
          <g>
            <rect x={config.size / 2 - 24} y={config.size / 2 - 24} width={48} height={48} rx={8} fill={config.bgColor} stroke={config.fgColor} strokeWidth={2} />
            <text x={config.size / 2} y={config.size / 2 + 6} textAnchor="middle" fontSize="16" fontWeight="bold" fill={config.fgColor}>Z</text>
          </g>
        )}
      </svg>
    </div>
  );
}

export default function QRCodesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('generator');
  const [config, setConfig] = useState<QRConfig>({
    type: 'url',
    data: { url: 'https://zoobicon.com' },
    fgColor: '#8B5CF6',
    bgColor: '#FFFFFF',
    cornerStyle: 'rounded',
    logoEnabled: true,
    size: 240,
  });
  const [copied, setCopied] = useState(false);
  const [batchUrls, setBatchUrls] = useState('https://zoobicon.com\nhttps://zoobicon.ai\nhttps://zoobicon.sh');

  const currentType = QR_TYPES.find(t => t.id === config.type)!;

  const handleTypeChange = (type: QRType) => {
    setConfig(prev => ({ ...prev, type, data: {} }));
  };

  const handleFieldChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, data: { ...prev.data, [key]: value } }));
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'generator', label: 'Generator', icon: <QrCode className="w-4 h-4" /> },
    { id: 'templates', label: 'Templates', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'batch', label: 'Batch', icon: <Package className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0b1530]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-bold text-lg bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">Zoobicon</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-white/30" />
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-stone-400" />
              <span className="font-semibold">QR Code Generator</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/builder" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Builder</Link>
            <Link href="/dashboard" className="px-4 py-2 text-sm bg-stone-600 hover:bg-stone-500 rounded-lg transition-colors">Dashboard</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-stone-600 text-white shadow-lg shadow-stone-600/25'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'generator' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Type Selector + Fields */}
            <div className="space-y-6">
              {/* QR Type */}
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <h3 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-wider">QR Type</h3>
                <div className="grid grid-cols-3 gap-2">
                  {QR_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => handleTypeChange(type.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl text-xs font-medium transition-all ${
                        config.type === type.id
                          ? 'bg-stone-600/20 border border-stone-500/50 text-stone-300'
                          : 'bg-white/5 border border-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {type.icon}
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Fields */}
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <h3 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-wider">Content</h3>
                <div className="space-y-4">
                  {currentType.fields.map(field => (
                    <div key={field.key}>
                      <label className="block text-sm text-white/70 mb-1.5">{field.label}</label>
                      <input
                        type={field.type || 'text'}
                        value={config.data[field.key] || ''}
                        onChange={e => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-stone-500/50 focus:ring-1 focus:ring-stone-500/25 transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Center: Preview */}
            <div className="flex flex-col items-center gap-6">
              <div className="bg-white/5 rounded-2xl border border-white/10 p-8 w-full flex flex-col items-center">
                <h3 className="text-sm font-medium text-white/60 mb-6 uppercase tracking-wider">Preview</h3>
                <div className="bg-white rounded-2xl p-6 shadow-2xl shadow-stone-500/10">
                  <SimulatedQR config={config} />
                </div>
                <div className="mt-6 flex gap-3">
                  <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm transition-colors">
                    {copied ? <Check className="w-4 h-4 text-stone-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button onClick={() => {}} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm transition-colors">
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 w-full">
                <h3 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-wider">Download</h3>
                <div className="grid grid-cols-3 gap-3">
                  {['PNG', 'SVG', 'PDF'].map(format => (
                    <button onClick={() => {}}
                      key={format}
                      className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-stone-600/20 border border-white/10 hover:border-stone-500/50 rounded-xl text-sm transition-all group"
                    >
                      <Download className="w-5 h-5 text-white/40 group-hover:text-stone-400 transition-colors" />
                      <span className="font-medium">{format}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Customization */}
            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <h3 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Colors
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">Foreground</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={config.fgColor}
                        onChange={e => setConfig(prev => ({ ...prev, fgColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={config.fgColor}
                        onChange={e => setConfig(prev => ({ ...prev, fgColor: e.target.value }))}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-stone-500/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">Background</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={config.bgColor}
                        onChange={e => setConfig(prev => ({ ...prev, bgColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={config.bgColor}
                        onChange={e => setConfig(prev => ({ ...prev, bgColor: e.target.value }))}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-stone-500/50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <h3 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Style
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Corner Style</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['square', 'rounded', 'dots', 'diamond'] as CornerStyle[]).map(style => (
                        <button
                          key={style}
                          onClick={() => setConfig(prev => ({ ...prev, cornerStyle: style }))}
                          className={`p-2.5 rounded-lg text-xs font-medium capitalize transition-all ${
                            config.cornerStyle === style
                              ? 'bg-stone-600/20 border border-stone-500/50 text-stone-300'
                              : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Center Logo</span>
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, logoEnabled: !prev.logoEnabled }))}
                      className={`w-11 h-6 rounded-full transition-colors ${config.logoEnabled ? 'bg-stone-600' : 'bg-white/20'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${config.logoEnabled ? 'translate-x-5.5 ml-[22px]' : 'translate-x-0.5 ml-[2px]'}`} />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Size: {config.size}px</label>
                    <input
                      type="range"
                      min={120}
                      max={400}
                      value={config.size}
                      onChange={e => setConfig(prev => ({ ...prev, size: parseInt(e.target.value) }))}
                      className="w-full accent-stone-500"
                    />
                  </div>
                </div>
              </div>

              <button onClick={() => {}} className="w-full py-3 bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-stone-600/25">
                <Sparkles className="w-4 h-4" />
                Generate QR Code
              </button>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEMPLATES.map((template, i) => (
              <button
                key={i}
                onClick={() => setConfig(prev => ({ ...prev, type: template.type, fgColor: template.fg, bgColor: template.bg, cornerStyle: template.corner }))}
                className="bg-white/5 rounded-2xl border border-white/10 hover:border-stone-500/50 p-6 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{template.name}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60 capitalize">{template.type}</span>
                </div>
                <div className="bg-white rounded-xl p-4 flex items-center justify-center mb-4">
                  <SimulatedQR config={{ ...config, type: template.type, fgColor: template.fg, bgColor: template.bg, cornerStyle: template.corner, size: 160 }} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: template.fg }} />
                  <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: template.bg }} />
                  <span className="text-xs text-white/40 ml-auto capitalize">{template.corner} corners</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'batch' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Package className="w-6 h-6 text-stone-400" />
                <div>
                  <h2 className="text-lg font-semibold">Batch QR Generation</h2>
                  <p className="text-sm text-white/50">Generate multiple QR codes at once. Enter one URL per line.</p>
                </div>
              </div>
              <textarea
                value={batchUrls}
                onChange={e => setBatchUrls(e.target.value)}
                rows={8}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-stone-500/50 focus:ring-1 focus:ring-stone-500/25 font-mono transition-all mb-4"
                placeholder="https://example.com&#10;https://another-site.com"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">{batchUrls.split('\n').filter(l => l.trim()).length} URLs detected</span>
                <button onClick={() => {}} className="flex items-center gap-2 px-6 py-2.5 bg-stone-600 hover:bg-stone-500 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-stone-600/25">
                  <Zap className="w-4 h-4" />
                  Generate All
                </button>
              </div>
              <div className="mt-8 border-t border-white/10 pt-6">
                <h3 className="text-sm font-medium text-white/60 mb-4">Batch Options</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <label className="text-sm text-white/70">Format</label>
                    <select className="mt-2 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                      <option value="png">PNG (Raster)</option>
                      <option value="svg">SVG (Vector)</option>
                      <option value="pdf">PDF (Print)</option>
                    </select>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <label className="text-sm text-white/70">Output</label>
                    <select className="mt-2 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                      <option value="zip">ZIP Archive</option>
                      <option value="individual">Individual Files</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="font-semibold">Recent QR Codes</h2>
                <span className="text-sm text-white/50">{HISTORY.length} codes</span>
              </div>
              <div className="divide-y divide-white/5">
                {HISTORY.map((item, i) => (
                  <div key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-stone-600/20 flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-stone-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-white/40">{item.date} &middot; {item.type.toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-stone-400">{item.scans.toLocaleString()}</p>
                      <p className="text-xs text-white/40">scans</p>
                    </div>
                    <button onClick={() => {}} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <Download className="w-4 h-4 text-white/40" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-white/40 text-sm">
            Replaces QR Code Monkey, QR Tiger, and Beaconstac &mdash; <span className="text-stone-400">included free with Zoobicon Pro</span>
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
