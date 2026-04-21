'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Book,
  Code,
  Play,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Key,
  Shield,
  Clock,
  Zap,
  Search,
  Globe,
  Lock,
  AlertTriangle,
  Terminal,
  FileJson,
  Send,
  ExternalLink,
  Hash,
  Layers,
  Server,
  Database,
  Wifi,
  ArrowRight,
} from 'lucide-react';

const ENDPOINTS = [
  {
    group: 'Generation',
    endpoints: [
      { method: 'POST', path: '/api/v1/generate', desc: 'Generate a website from a text prompt', auth: true },
      { method: 'POST', path: '/api/v1/generate/stream', desc: 'Stream website generation in real-time', auth: true },
      { method: 'POST', path: '/api/v1/generate/multipage', desc: 'Generate a multi-page website (3-6 pages)', auth: true },
      { method: 'POST', path: '/api/v1/generate/fullstack', desc: 'Generate full-stack app with DB + API + UI', auth: true },
    ],
  },
  {
    group: 'Sites',
    endpoints: [
      { method: 'GET', path: '/api/v1/sites', desc: 'List all deployed sites', auth: true },
      { method: 'PUT', path: '/api/v1/sites', desc: 'Update site HTML code', auth: true },
      { method: 'DELETE', path: '/api/v1/sites', desc: 'Deactivate a site by ID or slug', auth: true },
    ],
  },
  {
    group: 'Deployment',
    endpoints: [
      { method: 'POST', path: '/api/v1/deploy', desc: 'Deploy HTML to zoobicon.sh', auth: true },
      { method: 'GET', path: '/api/v1/deploy', desc: 'Get deployment history for a site', auth: true },
    ],
  },
  {
    group: 'Status',
    endpoints: [
      { method: 'GET', path: '/api/v1/status', desc: 'API health, account info, usage stats', auth: false },
    ],
  },
];

const CODE_EXAMPLES: Record<string, Record<string, string>> = {
  curl: {
    generate: `curl -X POST https://api.zoobicon.com/v1/generate \\
  -H "Authorization: Bearer zbk_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "A modern SaaS landing page for a project management tool",
    "generator": "landing-page",
    "tier": "premium",
    "auto_deploy": true
  }'`,
    list: `curl https://api.zoobicon.com/v1/sites \\
  -H "Authorization: Bearer zbk_live_your_api_key"`,
  },
  javascript: {
    generate: `const response = await fetch('https://api.zoobicon.com/v1/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer zbk_live_your_api_key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'A modern SaaS landing page for a project management tool',
    generator: 'landing-page',
    tier: 'premium',
    auto_deploy: true,
  }),
});

const data = await response.json();
console.log(data.url); // https://your-site.zoobicon.sh`,
    list: `const response = await fetch('https://api.zoobicon.com/v1/sites', {
  headers: { 'Authorization': 'Bearer zbk_live_your_api_key' },
});
const { sites } = await response.json();`,
  },
  python: {
    generate: `import requests

response = requests.post(
    'https://api.zoobicon.com/v1/generate',
    headers={
        'Authorization': 'Bearer zbk_live_your_api_key',
        'Content-Type': 'application/json',
    },
    json={
        'prompt': 'A modern SaaS landing page for a project management tool',
        'generator': 'landing-page',
        'tier': 'premium',
        'auto_deploy': True,
    }
)

data = response.json()
print(data['url'])  # https://your-site.zoobicon.sh`,
    list: `import requests

response = requests.get(
    'https://api.zoobicon.com/v1/sites',
    headers={'Authorization': 'Bearer zbk_live_your_api_key'}
)
sites = response.json()['sites']`,
  },
  php: {
    generate: `$ch = curl_init('https://api.zoobicon.com/v1/generate');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer zbk_live_your_api_key',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'prompt' => 'A modern SaaS landing page for a project management tool',
        'generator' => 'landing-page',
        'tier' => 'premium',
        'auto_deploy' => true,
    ]),
]);
$response = json_decode(curl_exec($ch), true);
echo $response['url'];`,
    list: `$ch = curl_init('https://api.zoobicon.com/v1/sites');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer zbk_live_your_api_key',
    ],
]);
$sites = json_decode(curl_exec($ch), true)['sites'];`,
  },
  ruby: {
    generate: `require 'net/http'
require 'json'

uri = URI('https://api.zoobicon.com/v1/generate')
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true

request = Net::HTTP::Post.new(uri)
request['Authorization'] = 'Bearer zbk_live_your_api_key'
request['Content-Type'] = 'application/json'
request.body = {
  prompt: 'A modern SaaS landing page for a project management tool',
  generator: 'landing-page',
  tier: 'premium',
  auto_deploy: true
}.to_json

response = http.request(request)
data = JSON.parse(response.body)
puts data['url']`,
    list: `require 'net/http'
require 'json'

uri = URI('https://api.zoobicon.com/v1/sites')
request = Net::HTTP::Get.new(uri)
request['Authorization'] = 'Bearer zbk_live_your_api_key'

http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true
response = http.request(request)
sites = JSON.parse(response.body)['sites']`,
  },
};

const methodColors: Record<string, string> = {
  GET: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
};

type Lang = 'curl' | 'javascript' | 'python' | 'php' | 'ruby';

export default function ApiDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('/api/v1/generate');
  const [selectedLang, setSelectedLang] = useState<Lang>('javascript');
  const [copied, setCopied] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Generation', 'Sites', 'Deployment', 'Status']);
  const [tryItBody, setTryItBody] = useState(`{
  "prompt": "A cybersecurity company landing page",
  "generator": "landing-page",
  "tier": "premium"
}`);
  const [tryItResponse, setTryItResponse] = useState('');
  const [sending, setSending] = useState(false);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTryIt = () => {
    setSending(true);
    setTimeout(() => {
      setTryItResponse(JSON.stringify({
        success: true,
        id: 'gen_' + Math.random().toString(36).slice(2, 10),
        url: 'https://cyber-shield.zoobicon.sh',
        html: '<!DOCTYPE html>...',
        metadata: { generator: 'landing-page', tier: 'premium', model: 'claude-opus-4-6', tokens_used: 28450, generation_time_ms: 12340 }
      }, null, 2));
      setSending(false);
    }, 2000);
  };

  const codeExample = (selectedEndpoint === '/api/v1/sites' || selectedEndpoint.includes('GET'))
    ? CODE_EXAMPLES[selectedLang]?.list || ''
    : CODE_EXAMPLES[selectedLang]?.generate || '';

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <span className="font-semibold text-white">API Documentation</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/settings" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm">
              <Key className="w-4 h-4" /> API Keys
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-2">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="text" placeholder="Search endpoints..." className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
              </div>

              {/* Quick Links */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
                <h4 className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Quick Links</h4>
                <div className="space-y-1.5">
                  {[
                    { label: 'Authentication', icon: Lock },
                    { label: 'Rate Limits', icon: Clock },
                    { label: 'Error Codes', icon: AlertTriangle },
                  ].map((link) => (
                    <button key={link.label} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition">
                      <link.icon className="w-4 h-4" /> {link.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Endpoint Groups */}
              {ENDPOINTS.map((group) => (
                <div key={group.group}>
                  <button onClick={() => toggleGroup(group.group)} className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-white/60 hover:text-white transition">
                    {group.group}
                    {expandedGroups.includes(group.group) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {expandedGroups.includes(group.group) && (
                    <div className="ml-2 space-y-0.5">
                      {group.endpoints.map((ep) => (
                        <button
                          key={ep.path + ep.method}
                          onClick={() => setSelectedEndpoint(ep.path)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition ${
                            selectedEndpoint === ep.path ? 'bg-violet-600/20 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${methodColors[ep.method]}`}>{ep.method}</span>
                          <span className="truncate">{ep.path.replace('/api/v1', '')}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Auth Section */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-bold">Authentication</h2>
              </div>
              <p className="text-sm text-white/60 mb-4">
                All API requests require a Bearer token in the Authorization header. Get your API key from the dashboard.
              </p>
              <div className="bg-black/50 rounded-xl p-4 font-mono text-sm mb-4">
                <span className="text-white/40">Authorization:</span> <span className="text-emerald-400">Bearer zbk_live_your_api_key</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { plan: 'Free', limit: '10 req/min', color: 'text-white/60' },
                  { plan: 'Pro', limit: '60 req/min', color: 'text-violet-400' },
                  { plan: 'Enterprise', limit: '600 req/min', color: 'text-amber-400' },
                ].map((tier) => (
                  <div key={tier.plan} className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                    <p className={`font-medium text-sm ${tier.color}`}>{tier.plan}</p>
                    <p className="text-xs text-white/40 mt-1">{tier.limit}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Code Examples */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Code Examples</h2>
                <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                  {(['curl', 'javascript', 'python', 'php', 'ruby'] as Lang[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLang(lang)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${selectedLang === lang ? 'bg-violet-600' : 'hover:bg-white/10'}`}
                    >
                      {lang === 'curl' ? 'cURL' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <pre className="bg-black/50 rounded-xl p-4 text-sm overflow-x-auto">
                  <code className="text-green-400">{codeExample}</code>
                </pre>
                <button
                  onClick={() => handleCopy(codeExample)}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Try It */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Play className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-bold">Try It</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Request Body</label>
                  <textarea
                    value={tryItBody}
                    onChange={(e) => setTryItBody(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono resize-none h-48 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                  <button
                    onClick={handleTryIt}
                    disabled={sending}
                    className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-medium text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sending ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Request</>}
                  </button>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Response</label>
                  <pre className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono h-48 overflow-auto">
                    <code className={tryItResponse ? 'text-emerald-400' : 'text-white/20'}>
                      {tryItResponse || '// Response will appear here...'}
                    </code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Error Codes */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h2 className="text-lg font-bold mb-4">Error Codes</h2>
              <div className="space-y-2">
                {[
                  { code: 400, label: 'Bad Request', desc: 'Invalid request body or missing required fields' },
                  { code: 401, label: 'Unauthorized', desc: 'Missing or invalid API key' },
                  { code: 403, label: 'Forbidden', desc: 'API key does not have access to this resource' },
                  { code: 429, label: 'Rate Limited', desc: 'Too many requests. Check Retry-After header.' },
                  { code: 500, label: 'Server Error', desc: 'Internal error. Contact support if persistent.' },
                ].map((err) => (
                  <div key={err.code} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className={`px-2 py-0.5 rounded font-mono text-sm font-bold ${
                      err.code < 500 ? (err.code < 400 ? 'text-emerald-400' : 'text-amber-400') : 'text-red-400'
                    }`}>{err.code}</span>
                    <span className="font-medium text-sm w-32">{err.label}</span>
                    <span className="text-sm text-white/50">{err.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}