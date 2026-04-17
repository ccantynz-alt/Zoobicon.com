"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  Copy,
  Check,
  Minimize2,
  Maximize2,
  AlertCircle,
} from "lucide-react";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Zoobicon Free JSON Formatter",
      applicationCategory: "WebApplication",
      operatingSystem: "Any",
      url: "https://zoobicon.com/tools/json-formatter",
      description:
        "Free online JSON formatter and validator. Beautify, minify, and validate JSON instantly in your browser.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      creator: {
        "@type": "Organization",
        name: "Zoobicon",
        url: "https://zoobicon.com",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How does the JSON formatter work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Paste or type your JSON into the input panel. The formatter automatically validates and beautifies your JSON with 2-space indentation in real time. Invalid JSON is highlighted with a red border and a clear error message so you can fix it instantly.",
          },
        },
        {
          "@type": "Question",
          name: "Is this JSON formatter free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, completely free with no signup required. Everything runs in your browser — your data never leaves your device.",
          },
        },
        {
          "@type": "Question",
          name: "Can I minify JSON with this tool?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Click the Minify button to compress your JSON to a single line with no whitespace. This is useful for reducing payload size in API requests and configuration files.",
          },
        },
      ],
    },
  ],
};

export default function JsonFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [minified, setMinified] = useState(false);

  const formatJson = useCallback(
    (raw: string, shouldMinify: boolean) => {
      if (!raw.trim()) {
        setOutput("");
        setError("");
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        setOutput(
          shouldMinify
            ? JSON.stringify(parsed)
            : JSON.stringify(parsed, null, 2)
        );
        setError("");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Invalid JSON";
        setError(msg);
        setOutput("");
      }
    },
    []
  );

  useEffect(() => {
    formatJson(input, minified);
  }, [input, minified, formatJson]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMinify = () => {
    setMinified(true);
  };

  const handleBeautify = () => {
    setMinified(false);
  };

  const handleSampleJson = () => {
    const sample = JSON.stringify(
      {
        name: "Zoobicon",
        version: "2.0",
        description: "AI Website Builder",
        features: ["React Generation", "Multi-LLM Pipeline", "One-Click Deploy"],
        pricing: { starter: 49, pro: 129, agency: 299 },
        active: true,
      },
      null,
      2
    );
    setInput(sample);
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Nav */}
      <nav className="border-b border-white/[0.06] bg-[#0a0a12]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold">Zoobicon</span>
          </Link>
          <div className="flex gap-3 text-xs text-white/40">
            <Link href="/tools" className="hover:text-white/60">
              All Tools
            </Link>
            <Link href="/builder" className="hover:text-white/60">
              Website Builder
            </Link>
            <Link
              href="/auth/signup"
              className="text-brand-400 hover:text-brand-300"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-500/10 border border-stone-500/20 mb-6">
            <span className="text-xs font-medium text-stone-300">
              Free — No Signup Required
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-5">
            Free JSON{" "}
            <span className="bg-gradient-to-r from-stone-400 via-stone-400 to-stone-400 bg-clip-text text-transparent">
              Formatter
            </span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Paste your JSON, get it formatted instantly. Beautify, minify, and
            validate — all in your browser, nothing sent to a server.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            onClick={handleBeautify}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              !minified
                ? "bg-stone-600 text-white"
                : "bg-white/[0.04] text-white/40 hover:bg-white/[0.08]"
            }`}
          >
            <Maximize2 className="w-3 h-3" /> Beautify
          </button>
          <button
            onClick={handleMinify}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              minified
                ? "bg-stone-600 text-white"
                : "bg-white/[0.04] text-white/40 hover:bg-white/[0.08]"
            }`}
          >
            <Minimize2 className="w-3 h-3" /> Minify
          </button>
          <button
            onClick={handleCopy}
            disabled={!output}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-white/[0.04] text-white/40 hover:bg-white/[0.08] disabled:opacity-30 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-stone-400" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Copy Output
              </>
            )}
          </button>
          <button
            onClick={handleSampleJson}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-white/[0.04] text-white/40 hover:bg-white/[0.08] transition-all ml-auto"
          >
            Load Sample
          </button>
        </div>

        {/* Editor panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Input */}
          <div className="relative">
            <label className="block text-xs font-medium text-white/30 mb-2 uppercase tracking-wider">
              Input
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='{"paste": "your JSON here"}'
              spellCheck={false}
              className={`w-full h-[420px] px-4 py-3 bg-[#0e0e1a] border rounded-2xl text-sm text-white/90 font-mono placeholder-white/15 focus:outline-none focus:ring-2 resize-none ${
                error && input.trim()
                  ? "border-stone-500/60 focus:ring-stone-500/30"
                  : "border-white/[0.08] focus:ring-stone-500/30 focus:border-stone-500/30"
              }`}
            />
            {input.trim() && (
              <span className="absolute top-8 right-3 text-[10px] text-white/20">
                {input.length} chars
              </span>
            )}
          </div>

          {/* Output */}
          <div className="relative">
            <label className="block text-xs font-medium text-white/30 mb-2 uppercase tracking-wider">
              Output
            </label>
            <textarea
              value={output}
              readOnly
              placeholder="Formatted JSON will appear here..."
              spellCheck={false}
              className="w-full h-[420px] px-4 py-3 bg-[#0e0e1a] border border-white/[0.08] rounded-2xl text-sm text-stone-300/90 font-mono placeholder-white/15 focus:outline-none resize-none"
            />
            {output && (
              <span className="absolute top-8 right-3 text-[10px] text-white/20">
                {output.length} chars
              </span>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && input.trim() && (
          <div className="flex items-start gap-2 p-4 rounded-xl bg-stone-500/10 border border-stone-500/20 mb-8">
            <AlertCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-stone-400">Invalid JSON</p>
              <p className="text-xs text-stone-400/70 mt-0.5 font-mono">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-16 text-center border-t border-white/[0.06] pt-16">
          <h2 className="text-2xl font-bold mb-3">
            Need a website for your API project?
          </h2>
          <p className="text-white/40 mb-6 max-w-lg mx-auto">
            Build a professional developer portfolio or API documentation site in
            under 60 seconds with AI.
          </p>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 font-semibold text-sm transition-colors"
          >
            <Zap className="w-4 h-4" /> Build Your Website Free
          </Link>
        </div>

        {/* FAQ */}
        <div className="mt-16 border-t border-white/[0.06] pt-12">
          <h2 className="text-xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6 max-w-2xl mx-auto text-sm">
            <div>
              <h3 className="font-semibold mb-1">
                How does the JSON formatter work?
              </h3>
              <p className="text-white/40">
                Paste or type your JSON into the input panel. The formatter
                automatically validates and beautifies your JSON with 2-space
                indentation in real time. Invalid JSON is highlighted with a red
                border and a clear error message so you can fix it instantly.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">
                Is this JSON formatter free?
              </h3>
              <p className="text-white/40">
                Yes, completely free with no signup required. Everything runs
                entirely in your browser — your data never leaves your device.
                No data is sent to any server.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">
                Can I minify JSON with this tool?
              </h3>
              <p className="text-white/40">
                Yes. Click the Minify button to compress your JSON to a single
                line with all whitespace removed. This is useful for reducing
                payload size in API requests and configuration files. Switch back
                to Beautify at any time.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-[10px] text-white/15">
            zoobicon.com &middot; zoobicon.ai &middot; zoobicon.io &middot;
            zoobicon.sh
          </p>
        </div>
      </div>
    </div>
  );
}
