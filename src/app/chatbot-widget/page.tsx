"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check, ExternalLink, Sparkles } from "lucide-react";

/**
 * Chatbot Widget Configuration — customers configure their widget and
 * get a one-line embed code to paste on their own site.
 */
export default function ChatbotWidgetPage() {
  const [botName, setBotName] = useState("Assistant");
  const [color, setColor] = useState("#6d5dfc");
  const [context, setContext] = useState(
    "We're a small business that provides professional services. We pride ourselves on fast response times and friendly support."
  );
  const [siteId, setSiteId] = useState("");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("https://zoobicon.com");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
      // Generate a random site ID once
      const stored = localStorage.getItem("zbc_chatbot_site_id");
      if (stored) {
        setSiteId(stored);
      } else {
        const newId = "site_" + Math.random().toString(36).slice(2, 10);
        localStorage.setItem("zbc_chatbot_site_id", newId);
        setSiteId(newId);
      }
      // Load saved config
      try {
        const saved = localStorage.getItem("zbc_chatbot_config");
        if (saved) {
          const cfg = JSON.parse(saved);
          if (cfg.botName) setBotName(cfg.botName);
          if (cfg.color) setColor(cfg.color);
          if (cfg.context) setContext(cfg.context);
        }
      } catch { /* ignore */ }
    }
  }, []);

  // Save config on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "zbc_chatbot_config",
          JSON.stringify({ botName, color, context })
        );
      } catch { /* ignore */ }
    }
  }, [botName, color, context]);

  const escapedContext = context.replace(/"/g, "&quot;");
  const embedCode = `<script src="${origin}/widget.js"
  data-site-id="${siteId}"
  data-bot-name="${botName}"
  data-color="${color}"
  data-context="${escapedContext}"
  data-api="${origin}">
</script>`;

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d17] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#131520]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Home
            </Link>
            <div className="w-px h-5 bg-white/10" />
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#6d5dfc]" />
              AI Chatbot Widget
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h2 className="text-3xl font-bold mb-3">Drop-in AI chat for your website</h2>
          <p className="text-white/60 max-w-2xl">
            Configure your AI chatbot below and paste the embed code on any website.
            One line of code. Your bot goes live instantly, powered by Claude.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Config panel */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Bot name</label>
              <input
                type="text"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#131520] border border-white/10 rounded-lg focus:outline-none focus:border-[#6d5dfc]"
                placeholder="Assistant"
              />
              <p className="text-xs text-white/40 mt-1">
                Shown in the chat header. Customers see this name.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Primary color</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-14 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-[#131520] border border-white/10 rounded-lg focus:outline-none focus:border-[#6d5dfc] font-mono text-sm"
                  placeholder="#6d5dfc"
                />
              </div>
              <p className="text-xs text-white/40 mt-1">
                Used for the chat button and user message bubbles.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Business context</label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={8}
                className="w-full px-4 py-2.5 bg-[#131520] border border-white/10 rounded-lg focus:outline-none focus:border-[#6d5dfc] resize-none"
                placeholder="Describe your business, products, hours, policies, FAQ..."
              />
              <p className="text-xs text-white/40 mt-1">
                The AI uses this to answer customer questions. Include pricing,
                hours, policies, contact info — anything customers ask about.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Site ID</label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#131520] border border-white/10 rounded-lg">
                <code className="text-sm text-white/60 font-mono flex-1">{siteId}</code>
              </div>
              <p className="text-xs text-white/40 mt-1">
                Your unique widget identifier. Don&apos;t share this publicly.
              </p>
            </div>
          </div>

          {/* Preview + embed code */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Preview</label>
              <div className="relative rounded-lg border border-white/10 bg-[#131520] h-[320px] overflow-hidden">
                <div className="absolute inset-0 p-6 text-white/20 text-sm">
                  <div className="text-xs uppercase tracking-wider mb-2">Your website</div>
                  <div className="h-2 w-48 bg-white/5 rounded mb-2" />
                  <div className="h-2 w-64 bg-white/5 rounded mb-2" />
                  <div className="h-2 w-40 bg-white/5 rounded" />
                </div>
                {/* Mock chat button */}
                <div className="absolute bottom-5 right-5">
                  <button
                    className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
                    style={{ background: color }}
                  >
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                    </svg>
                  </button>
                </div>
                {/* Mock chat panel */}
                <div className="absolute bottom-24 right-5 w-72 bg-white rounded-2xl shadow-xl overflow-hidden">
                  <div
                    className="px-4 py-3 text-white font-semibold text-sm"
                    style={{ background: color }}
                  >
                    {botName}
                  </div>
                  <div className="p-3 bg-gray-50 h-36 overflow-hidden">
                    <div className="inline-block max-w-[80%] bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-gray-800">
                      Hi! How can I help you today?
                    </div>
                  </div>
                  <div className="px-3 py-2 border-t border-gray-200 bg-white">
                    <div className="h-7 bg-gray-100 rounded-full px-3 flex items-center text-xs text-gray-400">
                      Type your message...
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Embed code</label>
              <div className="relative">
                <pre className="bg-[#131520] border border-white/10 rounded-lg p-4 text-xs font-mono text-white/80 overflow-x-auto whitespace-pre">{embedCode}</pre>
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-xs transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-stone-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-white/40 mt-2">
                Paste this before the closing <code className="text-white/60">&lt;/body&gt;</code> tag on any page where you want the chatbot.
              </p>
            </div>

            <div className="bg-[#6d5dfc]/10 border border-[#6d5dfc]/30 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-[#6d5dfc]" />
                Quick integrations
              </h3>
              <p className="text-xs text-white/60 mb-3">
                Drop the embed code into any of these platforms:
              </p>
              <ul className="text-xs text-white/60 space-y-1">
                <li>• WordPress: Appearance → Theme Editor → footer.php</li>
                <li>• Shopify: Online Store → Themes → Edit code → theme.liquid</li>
                <li>• Squarespace: Settings → Advanced → Code Injection → Footer</li>
                <li>• Wix: Settings → Custom Code → Add Custom Code</li>
                <li>• Webflow: Project Settings → Custom Code → Footer Code</li>
                <li>• Any HTML site: paste before <code>&lt;/body&gt;</code></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
