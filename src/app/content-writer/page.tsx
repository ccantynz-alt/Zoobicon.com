"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  FileText,
  Copy,
  Download,
  RefreshCw,
  Trash2,
  Plus,
  Clock,
  ChevronLeft,
  Sparkles,
  Check,
  X,
  Menu,
} from "lucide-react";

interface HistoryItem {
  id: string;
  contentType: string;
  topic: string;
  content: string;
  wordCount: number;
  createdAt: string;
}

const CONTENT_TYPES = [
  "Blog Post",
  "Product Description",
  "Email Newsletter",
  "Social Media Post",
  "Landing Page Copy",
  "About Page",
] as const;

const TONES = [
  "Professional",
  "Casual",
  "Playful",
  "Authoritative",
  "Friendly",
] as const;

const LENGTHS = [
  { label: "Short", description: "~200 words" },
  { label: "Medium", description: "~500 words" },
  { label: "Long", description: "1000+ words" },
] as const;

const STORAGE_KEY = "zoobicon_content_history";

export default function ContentWriterPage() {
  const [contentType, setContentType] = useState<string>("Blog Post");
  const [tone, setTone] = useState<string>("Professional");
  const [length, setLength] = useState<string>("Medium");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [keywords, setKeywords] = useState("");

  const [generatedContent, setGeneratedContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const saveHistory = useCallback(
    (items: HistoryItem[]) => {
      setHistory(items);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch {
        // ignore storage errors
      }
    },
    []
  );

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      setError("Please enter a topic or prompt.");
      return;
    }

    setIsGenerating(true);
    setError("");
    setGeneratedContent("");
    setWordCount(0);

    try {
      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType,
          tone,
          length,
          topic: topic.trim(),
          audience: audience.trim() || undefined,
          keywords: keywords.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate content");
      }

      setGeneratedContent(data.content);
      setWordCount(data.wordCount);

      const newItem: HistoryItem = {
        id: Date.now().toString(),
        contentType,
        topic: topic.trim(),
        content: data.content,
        wordCount: data.wordCount,
        createdAt: new Date().toISOString(),
      };

      saveHistory([newItem, ...history].slice(0, 50));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  }, [topic, contentType, tone, length, audience, keywords, history, saveHistory]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = generatedContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generatedContent]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([generatedContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${contentType.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generatedContent, contentType]);

  const handleLoadHistory = useCallback((item: HistoryItem) => {
    setGeneratedContent(item.content);
    setWordCount(item.wordCount);
    setTopic(item.topic);
    setContentType(item.contentType);
    setShowHistory(false);
  }, []);

  const handleDeleteHistory = useCallback(
    (id: string) => {
      saveHistory(history.filter((item) => item.id !== id));
    },
    [history, saveHistory]
  );

  const handleClearHistory = useCallback(() => {
    saveHistory([]);
  }, [saveHistory]);

  const handleNewContent = useCallback(() => {
    setTopic("");
    setAudience("");
    setKeywords("");
    setGeneratedContent("");
    setWordCount(0);
    setError("");
  }, []);

  return (
    <div className="relative min-h-screen bg-gray-900 text-white">
      <BackgroundEffects preset="technical" />
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-900/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="text-sm">Home</span>
            </Link>
            <div className="h-5 w-px bg-gray-700" />
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <h1 className="text-lg font-semibold">Content Writer</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="relative flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
              {history.length > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-500 px-1 text-xs font-medium text-white">
                  {history.length}
                </span>
              )}
            </button>
            <button
              onClick={handleNewContent}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </div>
      </header>

      <CursorGlowTracker />

      <section className="relative">
        <HeroEffects variant="cyan" cursorGlow particles particleCount={35} interactiveGrid aurora beams />
      </section>

      <div className="relative mx-auto flex max-w-7xl">
        {/* History Sidebar */}
        {showHistory && (
          <>
            <div
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
              onClick={() => setShowHistory(false)}
            />
            <aside className="fixed right-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-80 overflow-y-auto border-l border-gray-800 bg-gray-900 p-4 lg:sticky lg:z-auto">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                  History
                </h2>
                <div className="flex items-center gap-2">
                  {history.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      className="text-xs text-red-400 transition-colors hover:text-red-300"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-gray-500 hover:text-white lg:hidden"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {history.length === 0 ? (
                <p className="text-center text-sm text-gray-500">
                  No content generated yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="group cursor-pointer rounded-lg border border-gray-800 bg-gray-800/50 p-3 transition-colors hover:border-gray-700"
                      onClick={() => handleLoadHistory(item)}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-xs text-blue-400">
                          {item.contentType}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteHistory(item.id);
                          }}
                          className="text-gray-600 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mb-1 truncate text-sm text-gray-200">
                        {item.topic}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{item.wordCount} words</span>
                        <span>&middot;</span>
                        <span>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            {/* Configuration Section */}
            <section className="mb-8 rounded-xl border border-gray-800 bg-gray-900 p-6">
              <h2 className="mb-5 text-lg font-semibold">Configure Content</h2>

              {/* Content Type */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-400">
                  Content Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONTENT_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setContentType(type)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${
                        contentType === type
                          ? "border-blue-500 bg-blue-500/10 text-blue-400"
                          : "border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-400">
                  Tone
                </label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${
                        tone === t
                          ? "border-blue-500 bg-blue-500/10 text-blue-400"
                          : "border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Length */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-400">
                  Length
                </label>
                <div className="flex flex-wrap gap-2">
                  {LENGTHS.map((l) => (
                    <button
                      key={l.label}
                      onClick={() => setLength(l.label)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${
                        length === l.label
                          ? "border-blue-500 bg-blue-500/10 text-blue-400"
                          : "border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200"
                      }`}
                    >
                      {l.label}{" "}
                      <span className="text-gray-500">({l.description})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-400">
                  Topic / Prompt <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Write a blog post about the benefits of AI-powered website builders for small businesses..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Optional Fields */}
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-400">
                    Target Audience{" "}
                    <span className="text-gray-600">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g. Small business owners"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-400">
                    Keywords{" "}
                    <span className="text-gray-600">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g. AI, website builder, automation"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Content
                  </>
                )}
              </button>
            </section>

            {/* Error */}
            {error && (
              <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Generated Content */}
            {generatedContent && (
              <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                {/* Toolbar */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">Generated Content</h2>
                    <span className="rounded-full bg-gray-800 px-2.5 py-0.5 text-xs text-gray-400">
                      {wordCount} words
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-400" />
                          <span className="text-green-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:text-white disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`}
                      />
                      Regenerate
                    </button>
                  </div>
                </div>

                {/* Content Display */}
                <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
                  <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-gray-200">
                    {generatedContent}
                  </div>
                </div>
              </section>
            )}

            {/* Empty State */}
            {!generatedContent && !isGenerating && !error && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-800 py-16 text-center">
                <FileText className="mb-4 h-12 w-12 text-gray-700" />
                <h3 className="mb-2 text-lg font-medium text-gray-400">
                  Ready to Write
                </h3>
                <p className="max-w-sm text-sm text-gray-600">
                  Choose your content type, set the tone and length, enter a
                  topic, and hit Generate to create AI-powered content.
                </p>
              </div>
            )}

            {/* Loading State */}
            {isGenerating && !generatedContent && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-gray-800 bg-gray-900 py-16 text-center">
                <RefreshCw className="mb-4 h-10 w-10 animate-spin text-blue-500" />
                <h3 className="mb-2 text-lg font-medium text-gray-300">
                  Generating your {contentType.toLowerCase()}...
                </h3>
                <p className="text-sm text-gray-500">
                  This usually takes 5-15 seconds.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
