'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plug,
  Search,
  Filter,
  Check,
  ExternalLink,
  Settings,
  Zap,
  Plus,
  Star,
  ChevronRight,
  Grid3X3,
  List,
  ArrowRight,
  MessageSquare,
  Mail,
  Users,
  CreditCard,
  Cloud,
  FolderKanban,
  Share2,
  BarChart3,
  Code,
  Sparkles,
  Megaphone,
  Database,
  Globe,
  Shield,
  CheckCircle2,
  X,
  AlertCircle,
  Wifi,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', name: 'All', icon: Grid3X3 },
  { id: 'communication', name: 'Communication', icon: MessageSquare },
  { id: 'email', name: 'Email', icon: Mail },
  { id: 'crm', name: 'CRM', icon: Users },
  { id: 'payments', name: 'Payments', icon: CreditCard },
  { id: 'cloud', name: 'Cloud', icon: Cloud },
  { id: 'pm', name: 'Project Mgmt', icon: FolderKanban },
  { id: 'social', name: 'Social', icon: Share2 },
  { id: 'analytics', name: 'Analytics', icon: BarChart3 },
  { id: 'dev', name: 'Developer', icon: Code },
  { id: 'ai', name: 'AI', icon: Sparkles },
  { id: 'marketing', name: 'Marketing', icon: Megaphone },
  { id: 'database', name: 'Database', icon: Database },
];

const INTEGRATIONS = [
  // Communication
  { id: 1, name: 'Hash', desc: 'Send notifications and updates to Hash channels', category: 'communication', connected: true, popular: true, color: '#4A154B' },
  { id: 2, name: 'MessageSquare', desc: 'Post build notifications to MessageSquare servers', category: 'communication', connected: false, popular: true, color: '#5865F2' },
  { id: 3, name: 'Microsoft Teams', desc: 'Integrate with Teams for collaboration', category: 'communication', connected: false, popular: false, color: '#6264A7' },
  { id: 4, name: 'Twilio', desc: 'SMS notifications for deployments', category: 'communication', connected: false, popular: false, color: '#F22F46' },
  // Email
  { id: 5, name: 'Mailgun', desc: 'Transactional email delivery', category: 'email', connected: true, popular: true, color: '#F06B66' },
  { id: 6, name: 'SendGrid', desc: 'Email campaigns and notifications', category: 'email', connected: false, popular: true, color: '#1A82E2' },
  { id: 7, name: 'Mailchimp', desc: 'Email marketing automation', category: 'email', connected: false, popular: true, color: '#FFE01B' },
  { id: 8, name: 'ConvertKit', desc: 'Creator-focused email marketing', category: 'email', connected: false, popular: false, color: '#FB6970' },
  // CRM
  { id: 9, name: 'HubSpot', desc: 'CRM, marketing, and sales automation', category: 'crm', connected: false, popular: true, color: '#FF7A59' },
  { id: 10, name: 'Salesforce', desc: 'Enterprise CRM integration', category: 'crm', connected: false, popular: true, color: '#00A1E0' },
  { id: 11, name: 'Pipedrive', desc: 'Sales pipeline management', category: 'crm', connected: false, popular: false, color: '#1B1B1D' },
  // Payments
  { id: 12, name: 'Stripe', desc: 'Payment processing and subscriptions', category: 'payments', connected: true, popular: true, color: '#635BFF' },
  { id: 13, name: 'PayPal', desc: 'Accept PayPal payments', category: 'payments', connected: false, popular: true, color: '#003087' },
  { id: 14, name: 'Lemonsqueezy', desc: 'Digital product payments', category: 'payments', connected: false, popular: false, color: '#FFC233' },
  // Cloud
  { id: 15, name: 'Cloudflare', desc: 'CDN, DNS, and SSL management', category: 'cloud', connected: true, popular: true, color: '#F6821F' },
  { id: 16, name: 'AWS S3', desc: 'File storage and static hosting', category: 'cloud', connected: false, popular: true, color: '#FF9900' },
  { id: 17, name: 'Vercel', desc: 'Deploy to Vercel infrastructure', category: 'cloud', connected: false, popular: true, color: '#000000' },
  { id: 18, name: 'Netlify', desc: 'JAMstack deployment', category: 'cloud', connected: false, popular: false, color: '#00C7B7' },
  // PM
  { id: 19, name: 'Jira', desc: 'Issue tracking and project management', category: 'pm', connected: false, popular: true, color: '#0052CC' },
  { id: 20, name: 'Linear', desc: 'Modern issue tracking', category: 'pm', connected: false, popular: true, color: '#5E6AD2' },
  { id: 21, name: 'Notion', desc: 'Documentation and knowledge base', category: 'pm', connected: false, popular: true, color: '#000000' },
  { id: 22, name: 'Asana', desc: 'Task and project management', category: 'pm', connected: false, popular: false, color: '#F06A6A' },
  // Social
  { id: 23, name: 'MessageCircle/X', desc: 'Auto-post deployments to X', category: 'social', connected: false, popular: true, color: '#1DA1F2' },
  { id: 24, name: 'LinkedIn', desc: 'Share professional updates', category: 'social', connected: false, popular: false, color: '#0A66C2' },
  { id: 25, name: 'Camera', desc: 'Auto-generate social images', category: 'social', connected: false, popular: false, color: '#E4405F' },
  { id: 26, name: 'ThumbsUp', desc: 'Page updates and marketing', category: 'social', connected: false, popular: false, color: '#1877F2' },
  // Analytics
  { id: 27, name: 'Google Analytics', desc: 'Website traffic analytics', category: 'analytics', connected: true, popular: true, color: '#E37400' },
  { id: 28, name: 'Plausible', desc: 'Privacy-friendly analytics', category: 'analytics', connected: false, popular: false, color: '#5850EC' },
  { id: 29, name: 'Mixpanel', desc: 'Product analytics and insights', category: 'analytics', connected: false, popular: true, color: '#7856FF' },
  { id: 30, name: 'Hotjar', desc: 'Heatmaps and session recordings', category: 'analytics', connected: false, popular: false, color: '#FD3A5C' },
  // Dev
  { id: 31, name: 'GitHub', desc: 'Code repos, CI/CD, and deployments', category: 'dev', connected: true, popular: true, color: '#181717' },
  { id: 32, name: 'GitLab', desc: 'DevOps platform integration', category: 'dev', connected: false, popular: false, color: '#FC6D26' },
  { id: 33, name: 'Sentry', desc: 'Error tracking and monitoring', category: 'dev', connected: false, popular: true, color: '#362D59' },
  { id: 34, name: 'Datadog', desc: 'Monitoring and alerting', category: 'dev', connected: false, popular: false, color: '#632CA6' },
  // AI
  { id: 35, name: 'OpenAI', desc: 'GPT-4o model access', category: 'ai', connected: true, popular: true, color: '#412991' },
  { id: 36, name: 'Anthropic', desc: 'Claude model access', category: 'ai', connected: true, popular: true, color: '#D4A27F' },
  { id: 37, name: 'Google AI', desc: 'Gemini model access', category: 'ai', connected: true, popular: true, color: '#4285F4' },
  { id: 38, name: 'Replicate', desc: 'Image and video generation', category: 'ai', connected: false, popular: false, color: '#3D3D3D' },
  // Marketing
  { id: 39, name: 'Google Ads', desc: 'Ad campaign integration', category: 'marketing', connected: false, popular: true, color: '#4285F4' },
  { id: 40, name: 'Meta Ads', desc: 'ThumbsUp and Camera ads', category: 'marketing', connected: false, popular: false, color: '#0081FB' },
  // Database
  { id: 41, name: 'Neon', desc: 'Serverless Postgres database', category: 'database', connected: true, popular: true, color: '#00E699' },
  { id: 42, name: 'Supabase', desc: 'Open source Firebase alternative', category: 'database', connected: false, popular: true, color: '#3ECF8E' },
  { id: 43, name: 'PlanetScale', desc: 'Serverless MySQL platform', category: 'database', connected: false, popular: false, color: '#000000' },
  { id: 44, name: 'MongoDB', desc: 'NoSQL document database', category: 'database', connected: false, popular: false, color: '#47A248' },
];

export default function IntegrationsHubPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [connectingId, setConnectingId] = useState<number | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<typeof INTEGRATIONS[0] | null>(null);

  const filtered = useMemo(() => {
    return INTEGRATIONS.filter((i) => {
      const matchCat = selectedCategory === 'all' || i.category === selectedCategory;
      const matchSearch = !searchQuery || i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const connectedCount = INTEGRATIONS.filter(i => i.connected).length;

  const handleConnect = (integration: typeof INTEGRATIONS[0]) => {
    setSelectedIntegration(integration);
    setShowConnectModal(true);
  };

  const handleStartConnect = () => {
    if (!selectedIntegration) return;
    setConnectingId(selectedIntegration.id);
    setShowConnectModal(false);
    setTimeout(() => setConnectingId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <span className="font-semibold text-white">Integrations Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/40">{connectedCount} connected</span>
            <Link href="/webhooks" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm">
              <Zap className="w-4 h-4" /> Webhooks
            </Link>
          </div>
        </div>
      </header>

      {/* Connect Modal */}
      {showConnectModal && selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#12121f] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: selectedIntegration.color }}>
                  {selectedIntegration.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-lg">Connect {selectedIntegration.name}</h3>
                  <p className="text-sm text-white/40">{selectedIntegration.desc}</p>
                </div>
              </div>
              <button onClick={() => setShowConnectModal(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h4 className="text-sm font-medium mb-2">This integration will:</h4>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Read your account information</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Send notifications on your behalf</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Access relevant project data</li>
                </ul>
              </div>
              <div>
                <label className="text-sm text-white/50 mb-1 block">API Key (optional)</label>
                <input type="password" placeholder="Enter API key..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConnectModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm font-medium">Cancel</button>
              <button onClick={handleStartConnect} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 transition text-sm font-medium flex items-center justify-center gap-2">
                <Plug className="w-4 h-4" /> Connect
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search 44 integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg overflow-hidden border border-white/10">
              <button onClick={() => setViewMode('grid')} className={`px-3 py-2 transition ${viewMode === 'grid' ? 'bg-violet-600' : 'bg-white/5 hover:bg-white/10'}`}><Grid3X3 className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-2 transition ${viewMode === 'list' ? 'bg-violet-600' : 'bg-white/5 hover:bg-white/10'}`}><List className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                selectedCategory === cat.id ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <cat.icon className="w-4 h-4" /> {cat.name}
              {cat.id === 'all' && <span className="text-xs opacity-60">{INTEGRATIONS.length}</span>}
            </button>
          ))}
        </div>

        {/* Connected Section */}
        {selectedCategory === 'all' && !searchQuery && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-white/40 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Connected ({connectedCount})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {INTEGRATIONS.filter(i => i.connected).map((integration) => (
                <div key={integration.id} className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: integration.color }}>
                    {integration.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{integration.name}</p>
                    <p className="text-xs text-emerald-400 flex items-center gap-1"><Wifi className="w-3 h-3" /> Connected</p>
                  </div>
                  <button className="p-1.5 hover:bg-white/10 rounded-lg"><Settings className="w-4 h-4 text-white/30" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Integration Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.filter(i => selectedCategory !== 'all' || !i.connected || searchQuery).map((integration) => (
              <div key={integration.id} className={`p-5 rounded-2xl border transition hover:border-violet-500/30 ${integration.connected ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: integration.color }}>
                    {integration.name[0]}
                  </div>
                  {integration.popular && <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">Popular</span>}
                </div>
                <h3 className="font-semibold text-sm mb-1">{integration.name}</h3>
                <p className="text-xs text-white/40 mb-4 line-clamp-2">{integration.desc}</p>
                {integration.connected ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Connected</span>
                    <button className="text-xs text-white/40 hover:text-white flex items-center gap-1"><Settings className="w-3 h-3" /> Settings</button>
                  </div>
                ) : connectingId === integration.id ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-violet-400">
                    <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                    Connecting...
                  </div>
                ) : (
                  <button onClick={() => handleConnect(integration)} className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Connect
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((integration) => (
              <div key={integration.id} className={`flex items-center gap-4 px-5 py-4 rounded-xl border transition ${integration.connected ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: integration.color }}>
                  {integration.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{integration.name}</p>
                    {integration.popular && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                  </div>
                  <p className="text-xs text-white/40 truncate">{integration.desc}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-white/40">{CATEGORIES.find(c => c.id === integration.category)?.name}</span>
                {integration.connected ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Connected</span>
                ) : (
                  <button onClick={() => handleConnect(integration)} className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition">Connect</button>
                )}
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-12 h-12 mx-auto text-white/20 mb-3" />
            <p className="text-white/40">No integrations found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
}