"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface ToolPreview {
  name: string;
  description: string;
}

const TOP_TOOLS: ToolPreview[] = [
  { name: "search_domains", description: "Real-time domain availability across 50+ TLDs via OpenSRS" },
  { name: "generate_business_names", description: "AI-generated brandable names with availability checking" },
  { name: "generate_site", description: "Full React/Next.js site from a prompt, via the 7-agent pipeline" },
  { name: "generate_video", description: "AI video via Fish Speech + FLUX + OmniHuman on Replicate" },
  { name: "generate_image", description: "High-quality images via FLUX" },
  { name: "transcribe_audio", description: "Whisper transcription with SRT + VTT output" },
  { name: "list_components", description: "Browse the 100-component $100K registry" },
  { name: "deploy_site", description: "One-click deploy to zoobicon.sh with SSL" },
  { name: "get_pricing_tiers", description: "Live subscription pricing for Zoobicon plans" },
  { name: "search_esim_countries", description: "190+ country eSIM data plans" },
  { name: "seo_audit", description: "Crawl and audit any URL for SEO issues" },
  { name: "keyword_research", description: "Search volume and difficulty for keywords" },
  { name: "generate_email", description: "Transactional or marketing email templates" },
  { name: "generate_logo", description: "Brand logo generation with vector export" },
  { name: "clone_voice", description: "Voice cloning from a 10-second sample" },
  { name: "translate_video", description: "Dub a video into 50+ languages" },
  { name: "generate_captions", description: "Auto-caption a video with burnt-in subtitles" },
  { name: "generate_music", description: "Background music via MusicGen" },
  { name: "create_invoice", description: "PDF invoice generation with Stripe payment link" },
  { name: "send_email", description: "Transactional send via Mailgun with SPF/DKIM" },
];

type TabKey = "claude" | "cursor" | "windsurf";

const CONFIGS: Record<TabKey, { label: string; path: string; body: string }> = {
  claude: {
    label: "Claude Desktop",
    path: "~/Library/Application Support/Claude/claude_desktop_config.json",
    body: `{
  "mcpServers": {
    "zoobicon": {
      "url": "https://zoobicon.com/api/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer zbk_live_YOUR_KEY_HERE"
      }
    }
  }
}`,
  },
  cursor: {
    label: "Cursor",
    path: "~/.cursor/mcp.json",
    body: `{
  "mcpServers": {
    "zoobicon": {
      "url": "https://zoobicon.com/api/mcp",
      "type": "http",
      "headers": {
        "Authorization": "Bearer zbk_live_YOUR_KEY_HERE"
      }
    }
  }
}`,
  },
  windsurf: {
    label: "Windsurf",
    path: "~/.codeium/windsurf/mcp_config.json",
    body: `{
  "mcpServers": {
    "zoobicon": {
      "serverUrl": "https://zoobicon.com/api/mcp",
      "headers": {
        "Authorization": "Bearer zbk_live_YOUR_KEY_HERE"
      }
    }
  }
}`,
  },
};

const CURL_DEMO = `curl -X POST https://zoobicon.com/api/mcp \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer zbk_live_YOUR_KEY_HERE" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "search_domains",
      "arguments": { "query": "myagency", "tlds": ["com","ai","io"] }
    }
  }'`;

export default function McpLandingPage(): JSX.Element {
  const [tab, setTab] = useState<TabKey>("claude");
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (key: string, text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,#1e1b4b_0%,#0b0b15_60%)] text-white">
      <div className="max-w-5xl mx-auto px-6 py-20">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-200 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Model Context Protocol · v2025-06-18
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-br from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
            Zoobicon = 75 AI tools<br />for Claude, Cursor & Windsurf
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            One MCP server. Every Zoobicon product as a tool your AI can call. Generate sites,
            search domains, render videos, transcribe audio — all from inside your editor.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <a
              href="/api/mcp/install"
              className="px-5 py-2.5 rounded-lg bg-purple-500 hover:bg-purple-400 transition text-white font-medium"
            >
              Install Guide
            </a>
            <a
              href="/dashboard/api-keys"
              className="px-5 py-2.5 rounded-lg border border-purple-500/40 hover:bg-purple-500/10 transition text-purple-200 font-medium"
            >
              Get API Key
            </a>
          </div>
        </motion.div>

        {/* Tools grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <h2 className="text-2xl font-semibold mb-1">Top 20 exposed tools</h2>
          <p className="text-sm text-gray-500 mb-6">
            A slice of the full registry — your AI client will auto-discover them all.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {TOP_TOOLS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.02 }}
                className="rounded-xl border border-purple-500/20 bg-purple-500/[0.03] p-4 hover:border-purple-500/40 hover:bg-purple-500/[0.06] transition"
              >
                <code className="text-purple-300 text-sm font-mono">{t.name}</code>
                <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">{t.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Install tabs */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <h2 className="text-2xl font-semibold mb-6">Install in 30 seconds</h2>
          <div className="flex gap-2 mb-4">
            {(Object.keys(CONFIGS) as TabKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  tab === key
                    ? "bg-purple-500 text-white"
                    : "bg-purple-500/10 text-purple-200 hover:bg-purple-500/20"
                }`}
              >
                {CONFIGS[key].label}
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-purple-500/25 bg-[#0a0a14] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-purple-500/20 bg-purple-500/5">
              <code className="text-xs text-purple-300">{CONFIGS[tab].path}</code>
              <button
                onClick={() => void copy(tab, CONFIGS[tab].body)}
                className="text-xs px-2.5 py-1 rounded border border-purple-500/30 text-purple-200 hover:bg-purple-500/20 transition"
              >
                {copied === tab ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="p-5 text-sm text-purple-100 overflow-x-auto font-mono leading-relaxed">
              {CONFIGS[tab].body}
            </pre>
          </div>
        </motion.section>

        {/* Live curl demo */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <h2 className="text-2xl font-semibold mb-1">Try it with curl</h2>
          <p className="text-sm text-gray-500 mb-6">
            The MCP endpoint speaks JSON-RPC 2.0 over HTTP. Test directly from your terminal.
          </p>
          <div className="rounded-xl border border-purple-500/25 bg-[#0a0a14] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-purple-500/20 bg-purple-500/5">
              <span className="text-xs text-purple-300">shell</span>
              <button
                onClick={() => void copy("curl", CURL_DEMO)}
                className="text-xs px-2.5 py-1 rounded border border-purple-500/30 text-purple-200 hover:bg-purple-500/20 transition"
              >
                {copied === "curl" ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="p-5 text-sm text-green-300 overflow-x-auto font-mono leading-relaxed">
              {CURL_DEMO}
            </pre>
          </div>
        </motion.section>

        <footer className="pt-10 border-t border-purple-500/15 text-center text-sm text-gray-500">
          zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh
        </footer>
      </div>
    </main>
  );
}
