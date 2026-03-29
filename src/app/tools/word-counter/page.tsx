"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Zap, Type, Copy, Trash2, FileText, Clock, Mic,
  BarChart3, Hash, ArrowRight, Sparkles, ChevronDown,
} from "lucide-react";

/* ── stop words excluded from frequency analysis ── */
const STOP_WORDS = new Set([
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her",
  "she", "or", "an", "will", "my", "one", "all", "would", "there",
  "their", "what", "so", "up", "out", "if", "about", "who", "get",
  "which", "go", "me", "when", "make", "can", "like", "time", "no",
  "just", "him", "know", "take", "people", "into", "year", "your",
  "good", "some", "could", "them", "see", "other", "than", "then",
  "now", "look", "only", "come", "its", "over", "think", "also",
  "back", "after", "use", "two", "how", "our", "work", "first",
  "well", "way", "even", "new", "want", "because", "any", "these",
  "give", "day", "most", "us", "is", "are", "was", "were", "been",
  "has", "had", "did", "does", "am", "being", "more", "very", "much",
]);

/* ── JSON-LD schema ── */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Zoobicon Free Word Counter",
      applicationCategory: "WebApplication",
      operatingSystem: "Any",
      url: "https://zoobicon.com/tools/word-counter",
      description:
        "Free online word counter tool. Get real-time word count, character count, sentence count, paragraph count, reading time, speaking time, and keyword frequency analysis.",
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
          name: "How does the word counter work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Paste or type your text into the editor. The tool instantly counts words, characters, sentences, paragraphs, and calculates reading and speaking time — all in real time with no server calls.",
          },
        },
        {
          "@type": "Question",
          name: "Is the word counter free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, 100% free with no signup, no limits, and no ads. Use it as many times as you like.",
          },
        },
        {
          "@type": "Question",
          name: "How is reading time calculated?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Reading time is based on an average reading speed of 200 words per minute. Speaking time uses 130 words per minute, which is the typical pace for presentations and speeches.",
          },
        },
        {
          "@type": "Question",
          name: "What are the most frequent words?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The tool shows the top 10 most-used words in your text, excluding common stop words like 'the', 'and', 'is'. This helps you spot keyword density and overused terms in your writing.",
          },
        },
      ],
    },
  ],
};

/* ── helpers ── */
function formatTime(minutes: number): string {
  if (minutes < 1) return "< 1 min";
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m} min`;
  return `${m} min ${s}s`;
}

/* ── component ── */
export default function WordCounterPage() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  /* ── derived stats ── */
  const stats = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        words: 0,
        characters: text.length,
        charactersNoSpaces: text.replace(/\s/g, "").length,
        sentences: 0,
        paragraphs: 0,
        avgWordLength: 0,
        readingTime: 0,
        speakingTime: 0,
      };
    }

    const words = trimmed.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const sentences = trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
    const paragraphs = trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length || 1;
    const totalLetters = words.reduce((sum, w) => sum + w.replace(/[^a-zA-Z]/g, "").length, 0);

    return {
      words: wordCount,
      characters: text.length,
      charactersNoSpaces: text.replace(/\s/g, "").length,
      sentences,
      paragraphs,
      avgWordLength: wordCount > 0 ? +(totalLetters / wordCount).toFixed(1) : 0,
      readingTime: wordCount / 200,
      speakingTime: wordCount / 130,
    };
  }, [text]);

  /* ── top 10 frequent words ── */
  const topWords = useMemo(() => {
    if (!text.trim()) return [];
    const freq: Record<string, number> = {};
    const words = text
      .toLowerCase()
      .replace(/[^a-z'\s-]/g, "")
      .split(/\s+/)
      .filter(Boolean);

    for (const w of words) {
      const clean = w.replace(/^['-]+|['-]+$/g, "");
      if (clean.length < 2 || STOP_WORDS.has(clean)) continue;
      freq[clean] = (freq[clean] || 0) + 1;
    }

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [text]);

  const maxFreq = topWords.length > 0 ? topWords[0][1] : 1;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  const handleClear = useCallback(() => {
    setText("");
  }, []);

  /* ── stat cards data ── */
  const cards = [
    { label: "Words", value: stats.words.toLocaleString(), icon: Type, color: "text-violet-400" },
    { label: "Characters", value: stats.characters.toLocaleString(), icon: Hash, color: "text-blue-400", sub: `${stats.charactersNoSpaces.toLocaleString()} without spaces` },
    { label: "Sentences", value: stats.sentences.toLocaleString(), icon: FileText, color: "text-emerald-400" },
    { label: "Paragraphs", value: stats.paragraphs.toLocaleString(), icon: BarChart3, color: "text-amber-400" },
    { label: "Avg Word Length", value: `${stats.avgWordLength}`, icon: Type, color: "text-pink-400", sub: "characters" },
    { label: "Reading Time", value: formatTime(stats.readingTime), icon: Clock, color: "text-cyan-400", sub: "@ 200 wpm" },
    { label: "Speaking Time", value: formatTime(stats.speakingTime), icon: Mic, color: "text-orange-400", sub: "@ 130 wpm" },
  ];

  const faqs = [
    {
      q: "How does the word counter work?",
      a: "Paste or type your text into the editor. The tool instantly counts words, characters, sentences, paragraphs, and calculates reading and speaking time — all in real time with no server calls. Everything runs in your browser.",
    },
    {
      q: "Is the word counter free?",
      a: "Yes, 100% free with no signup, no limits, and no ads. Use it as many times as you like for any type of content — essays, blog posts, social media captions, or professional documents.",
    },
    {
      q: "How is reading time calculated?",
      a: "Reading time is based on an average silent reading speed of 200 words per minute. Speaking time uses 130 words per minute, which is the typical pace for presentations, speeches, and podcasts.",
    },
    {
      q: "What are the most frequent words?",
      a: "The tool shows the top 10 most-used words in your text, excluding common stop words like \"the\", \"and\", \"is\". This helps you spot keyword density, overused terms, and improve the variety of your writing.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Nav */}
      <nav className="border-b border-white/[0.06] bg-[#0a0a12]/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
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

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs font-medium text-violet-300">
              Free — No Signup Required
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-5">
            Free Word{" "}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Counter
            </span>
          </h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Count words, characters, sentences, and paragraphs instantly. Get
            reading time, speaking time, and keyword frequency — all in your
            browser.
          </p>
        </div>

        {/* Textarea + buttons */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here..."
            className="w-full min-h-[260px] bg-transparent text-white/90 text-sm leading-relaxed p-5 resize-y outline-none placeholder:text-white/20 rounded-xl"
            autoFocus
          />
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.06]">
            <span className="text-xs text-white/25">
              {stats.words.toLocaleString()} word{stats.words !== 1 ? "s" : ""}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                disabled={!text}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Copy className="w-3 h-3" />
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={handleClear}
                disabled={!text}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-6">
          {cards.map((c) => (
            <div
              key={c.label}
              className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <c.icon className={`w-4 h-4 ${c.color}`} />
                <span className="text-[11px] text-white/40 uppercase tracking-wider">
                  {c.label}
                </span>
              </div>
              <p className="text-2xl font-bold">{c.value}</p>
              {c.sub && (
                <p className="text-[11px] text-white/25 mt-0.5">{c.sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* Top 10 words */}
        {topWords.length > 0 && (
          <div className="mt-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-400" />
              Top 10 Most Frequent Words
            </h2>
            <div className="space-y-2.5">
              {topWords.map(([word, count], i) => (
                <div key={word} className="flex items-center gap-3">
                  <span className="text-[11px] text-white/25 w-5 text-right shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium w-28 truncate">
                    {word}
                  </span>
                  <div className="flex-1 h-5 rounded bg-white/[0.04] overflow-hidden">
                    <div
                      className="h-full rounded bg-gradient-to-r from-violet-500/40 to-purple-500/30 transition-all duration-300"
                      style={{ width: `${(count / maxFreq) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/30 w-8 text-right shrink-0">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA — upsell to dictation */}
        <div className="mt-12 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20 p-8 text-center">
          <h2 className="text-xl font-bold mb-2">
            Turn Speech Into Text with AI Dictation
          </h2>
          <p className="text-white/40 text-sm max-w-md mx-auto mb-6">
            Stop typing. Speak naturally and let AI transcribe your words in
            real time — then count them instantly here.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/products/dictation"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold text-sm transition-colors"
            >
              <Mic className="w-4 h-4" /> Try AI Dictation
            </Link>
            <Link
              href="/builder"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] font-semibold text-sm transition-colors"
            >
              <ArrowRight className="w-4 h-4" /> Build a Website
            </Link>
          </div>
        </div>

        {/* SEO FAQ */}
        <div className="mt-16 border-t border-white/[0.06] pt-12">
          <h2 className="text-xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3 max-w-2xl mx-auto">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden"
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold hover:bg-white/[0.02] transition-colors"
                >
                  {faq.q}
                  <ChevronDown
                    className={`w-4 h-4 text-white/30 shrink-0 ml-4 transition-transform ${
                      faqOpen === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-4 text-sm text-white/40 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-[10px] text-white/15">
            zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh
          </p>
        </div>
      </div>
    </div>
  );
}
