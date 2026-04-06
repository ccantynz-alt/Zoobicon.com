"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Bot,
  Copy,
  Download,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ArrowRight,
  FileCode,
  Zap,
} from "lucide-react";

const BOTS = [
  { id: "Googlebot", label: "Googlebot", desc: "Google Search" },
  { id: "Bingbot", label: "Bingbot", desc: "Microsoft Bing" },
  { id: "Slurp", label: "Slurp", desc: "Yahoo" },
  { id: "DuckDuckBot", label: "DuckDuckBot", desc: "DuckDuckGo" },
  { id: "Baiduspider", label: "Baiduspider", desc: "Baidu (China)" },
  { id: "YandexBot", label: "YandexBot", desc: "Yandex (Russia)" },
  { id: "GPTBot", label: "GPTBot", desc: "OpenAI / ChatGPT" },
  { id: "ChatGPT-User", label: "ChatGPT-User", desc: "ChatGPT Browse" },
  { id: "Google-Extended", label: "Google-Extended", desc: "Google Gemini AI" },
  { id: "CCBot", label: "CCBot", desc: "Common Crawl (AI training)" },
  { id: "anthropic-ai", label: "anthropic-ai", desc: "Anthropic / Claude" },
  { id: "ClaudeBot", label: "ClaudeBot", desc: "Claude Web" },
  { id: "Bytespider", label: "Bytespider", desc: "ByteDance / TikTok" },
  { id: "Applebot", label: "Applebot", desc: "Apple / Siri" },
  { id: "facebookexternalhit", label: "facebookexternalhit", desc: "ThumbsUp" },
  { id: "Twitterbot", label: "Twitterbot", desc: "X / MessageCircle" },
];

interface PathRule {
  id: string;
  path: string;
  action: "Allow" | "Disallow";
}

const PRESETS = {
  allowAll: { name: "Allow All", desc: "Let all bots crawl everything" },
  blockAI: { name: "Block AI Crawlers", desc: "Block AI training bots, allow search engines" },
  blockAll: { name: "Block Everything", desc: "Disallow all crawlers entirely" },
  standardSEO: { name: "Standard SEO", desc: "Best practices for most websites" },
};

function generateRobotsTxt(config: {
  allowAll: boolean;
  blockedBots: string[];
  pathRules: PathRule[];
  sitemapUrl: string;
  crawlDelay: string;
}): string {
  const { allowAll, blockedBots, pathRules, sitemapUrl, crawlDelay } = config;
  let output = "";

  if (allowAll && blockedBots.length === 0 && pathRules.length === 0) {
    output += "User-agent: *\nAllow: /\n";
  } else {
    // Specific bot blocks
    if (blockedBots.length > 0) {
      for (const bot of blockedBots) {
        output += `User-agent: ${bot}\nDisallow: /\n\n`;
      }
    }

    // General rules
    output += "User-agent: *\n";
    if (pathRules.length > 0) {
      for (const rule of pathRules) {
        if (rule.path.trim()) {
          output += `${rule.action}: ${rule.path.trim()}\n`;
        }
      }
    } else {
      output += "Allow: /\n";
    }
  }

  if (crawlDelay && parseInt(crawlDelay) > 0) {
    // Add crawl-delay to the last User-agent block
    output += `Crawl-delay: ${crawlDelay}\n`;
  }

  if (sitemapUrl.trim()) {
    output += `\nSitemap: ${sitemapUrl.trim()}\n`;
  }

  return output.trim();
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Zoobicon Free Robots.txt Generator",
      applicationCategory: "WebApplication",
      operatingSystem: "Any",
      url: "https://zoobicon.com/tools/robots-txt-generator",
      description: "Generate a robots.txt file for your website instantly. Block AI crawlers, configure search engine access, add sitemap references. Free, no signup required.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      creator: { "@type": "Organization", name: "Zoobicon", url: "https://zoobicon.com" },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "What is a robots.txt file?", acceptedAnswer: { "@type": "Answer", text: "A robots.txt file is a text file placed at the root of your website that tells web crawlers and bots which pages they can and cannot access. It's part of the Robots Exclusion Protocol and is respected by most major search engines and AI crawlers." } },
        { "@type": "Question", name: "How do I block AI crawlers from my website?", acceptedAnswer: { "@type": "Answer", text: "Use our 'Block AI Crawlers' preset or manually select AI bots like GPTBot, Google-Extended, CCBot, and anthropic-ai to block them from crawling your content for AI training while still allowing search engines to index your site." } },
        { "@type": "Question", name: "Where do I put the robots.txt file?", acceptedAnswer: { "@type": "Answer", text: "The robots.txt file must be placed at the root of your website domain. For example, if your site is https://example.com, it should be accessible at https://example.com/robots.txt. Upload it via FTP, your hosting file manager, or your deployment pipeline." } },
      ],
    },
  ],
};

export default function RobotsTxtGeneratorPage() {
  const [blockedBots, setBlockedBots] = useState<string[]>([]);
  const [pathRules, setPathRules] = useState<PathRule[]>([]);
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [crawlDelay, setCrawlDelay] = useState("");
  const [copied, setCopied] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const robotsTxt = useMemo(() => {
    return generateRobotsTxt({
      allowAll: blockedBots.length === 0,
      blockedBots,
      pathRules,
      sitemapUrl,
      crawlDelay,
    });
  }, [blockedBots, pathRules, sitemapUrl, crawlDelay]);

  const toggleBot = (id: string) => {
    setBlockedBots(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const addPathRule = () => {
    setPathRules(prev => [...prev, { id: crypto.randomUUID(), path: "", action: "Disallow" }]);
  };

  const removePathRule = (id: string) => {
    setPathRules(prev => prev.filter(r => r.id !== id));
  };

  const updatePathRule = (id: string, field: "path" | "action", value: string) => {
    setPathRules(prev =>
      prev.map(r => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const applyPreset = (preset: keyof typeof PRESETS) => {
    switch (preset) {
      case "allowAll":
        setBlockedBots([]);
        setPathRules([]);
        break;
      case "blockAI":
        setBlockedBots(["GPTBot", "ChatGPT-User", "Google-Extended", "CCBot", "anthropic-ai", "ClaudeBot", "Bytespider"]);
        setPathRules([]);
        break;
      case "blockAll":
        setBlockedBots([]);
        setPathRules([{ id: crypto.randomUUID(), path: "/", action: "Disallow" }]);
        break;
      case "standardSEO":
        setBlockedBots(["GPTBot", "ChatGPT-User", "CCBot", "anthropic-ai", "ClaudeBot", "Bytespider"]);
        setPathRules([
          { id: crypto.randomUUID(), path: "/admin", action: "Disallow" },
          { id: crypto.randomUUID(), path: "/api/", action: "Disallow" },
          { id: crypto.randomUUID(), path: "/private/", action: "Disallow" },
          { id: crypto.randomUUID(), path: "/", action: "Allow" },
        ]);
        break;
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(robotsTxt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([robotsTxt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "robots.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const faqs = [
    { q: "What is a robots.txt file?", a: "A robots.txt file is a plain text file placed at the root of your website that instructs web crawlers which pages they can and cannot access. It is part of the Robots Exclusion Protocol, respected by all major search engines like Google, Bing, and most AI crawlers." },
    { q: "How do I block AI crawlers from training on my content?", a: "Use our 'Block AI Crawlers' preset or manually select bots like GPTBot (OpenAI), Google-Extended (Gemini), CCBot (Common Crawl), and anthropic-ai (Claude). This blocks AI training while still allowing search engines to index your site normally." },
    { q: "Where do I put the robots.txt file?", a: "Place it at the root of your domain so it's accessible at https://yourdomain.com/robots.txt. Upload via FTP, your hosting control panel, or include it in your deployment. For Next.js sites, put it in the public/ folder." },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-indigo-400">Zoo</span>bicon
          </Link>
          <Link href="/tools" className="text-sm text-white/50 hover:text-white transition-colors">
            All Tools
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-4">
            <Bot className="w-3 h-3" /> Free Tool
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Free Robots.txt Generator
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Create a properly formatted robots.txt file in seconds. Block AI crawlers, manage search engine access, and add your sitemap.
          </p>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {(Object.entries(PRESETS) as [keyof typeof PRESETS, typeof PRESETS[keyof typeof PRESETS]][]).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className="bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/30 rounded-2xl p-4 text-left transition-all group"
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-sm font-semibold">{preset.name}</span>
              </div>
              <p className="text-xs text-white/40">{preset.desc}</p>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            {/* Bots */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-400" />
                Block Specific Bots
              </h2>
              <p className="text-xs text-white/40 mb-4">Selected bots will be blocked from crawling your site</p>
              <div className="grid grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-2">
                {BOTS.map(bot => {
                  const active = blockedBots.includes(bot.id);
                  return (
                    <button
                      key={bot.id}
                      onClick={() => toggleBot(bot.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all ${
                        active
                          ? "bg-red-500/10 border-red-500/30 text-red-300"
                          : "bg-white/[0.02] border-white/[0.06] text-white/50 hover:border-white/10"
                      }`}
                    >
                      <div className={`w-3 h-3 rounded border flex items-center justify-center flex-shrink-0 ${
                        active ? "bg-red-500 border-red-500" : "border-white/20"
                      }`}>
                        {active && <Check className="w-2 h-2 text-white" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{bot.label}</div>
                        <div className="text-[10px] text-white/30">{bot.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Path Rules */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-emerald-400" />
                  Path Rules
                </h2>
                <button
                  onClick={addPathRule}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Path
                </button>
              </div>
              {pathRules.length === 0 ? (
                <p className="text-xs text-white/30 text-center py-4">No path rules. All paths are allowed by default.</p>
              ) : (
                <div className="space-y-2">
                  {pathRules.map(rule => (
                    <div key={rule.id} className="flex items-center gap-2">
                      <select
                        value={rule.action}
                        onChange={e => updatePathRule(rule.id, "action", e.target.value)}
                        className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 appearance-none"
                      >
                        <option value="Allow">Allow</option>
                        <option value="Disallow">Disallow</option>
                      </select>
                      <input
                        type="text"
                        value={rule.path}
                        onChange={e => updatePathRule(rule.id, "path", e.target.value)}
                        placeholder="/path/"
                        className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-xs placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                      <button
                        onClick={() => removePathRule(rule.id)}
                        className="p-2 text-white/30 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sitemap & Crawl Delay */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Additional Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Sitemap URL</label>
                  <input
                    type="text"
                    value={sitemapUrl}
                    onChange={e => setSitemapUrl(e.target.value)}
                    placeholder="https://example.com/sitemap.xml"
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Crawl Delay (seconds)</label>
                  <input
                    type="number"
                    value={crawlDelay}
                    onChange={e => setCrawlDelay(e.target.value)}
                    placeholder="0"
                    min="0"
                    max="60"
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                  <p className="text-[10px] text-white/30 mt-1">Optional. Sets minimum seconds between crawler requests. Not supported by all bots.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h2 className="font-semibold text-sm">robots.txt Preview</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 text-xs transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 text-xs transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    robots.txt
                  </button>
                </div>
              </div>
              <pre className="p-6 text-sm text-emerald-300/80 whitespace-pre-wrap font-mono leading-relaxed min-h-[200px]">
                {robotsTxt}
              </pre>
            </div>

            <div className="mt-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5">
              <h3 className="text-sm font-semibold mb-2">How to use</h3>
              <ol className="text-xs text-white/40 space-y-1.5 list-decimal list-inside">
                <li>Configure your settings above or use a preset</li>
                <li>Click &quot;Copy&quot; or &quot;Download&quot; to get the file</li>
                <li>Save it as <code className="text-emerald-400/60 bg-white/[0.04] px-1 py-0.5 rounded">robots.txt</code> at your website root</li>
                <li>Verify at <code className="text-emerald-400/60 bg-white/[0.04] px-1 py-0.5 rounded">yourdomain.com/robots.txt</code></li>
              </ol>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <h3 className="font-semibold text-sm">{faq.q}</h3>
                  {faqOpen === i ? (
                    <ChevronUp className="w-4 h-4 text-white/40 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
                  )}
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-5 pt-0">
                    <p className="text-sm text-white/50 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center bg-gradient-to-br from-emerald-600/10 to-teal-600/10 border border-emerald-500/10 rounded-2xl p-10">
          <h2 className="text-2xl font-bold mb-3">Want to dominate search rankings?</h2>
          <p className="text-white/50 mb-6 max-w-lg mx-auto">
            A robots.txt file is just the start. Our AI SEO tools analyze your entire site and give you actionable improvements.
          </p>
          <Link
            href="/seo"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold transition-colors"
          >
            Explore SEO Tools <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-[10px] text-white/15">zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh</p>
        </div>
      </div>
    </div>
  );
}
