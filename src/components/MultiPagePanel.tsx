"use client";

import { useState } from "react";
import { FileText, Loader2, Plus, X, Eye } from "lucide-react";

interface Page {
  slug: string;
  title: string;
  html: string;
}

interface MultiPageResult {
  siteName: string;
  pages: Page[];
  navigation: Array<{ label: string; href: string }>;
}

export default function MultiPagePanel({
  onApplyPage,
}: {
  onApplyPage: (html: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [pages, setPages] = useState<string[]>([]);
  const [newPage, setNewPage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MultiPageResult | null>(null);
  const [selectedPage, setSelectedPage] = useState<number>(0);

  const addPage = () => {
    if (newPage.trim() && pages.length < 6) {
      setPages([...pages, newPage.trim()]);
      setNewPage("");
    }
  };

  const removePage = (index: number) => {
    setPages(pages.filter((_, i) => i !== index));
  };

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/generate/multipage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          ...(pages.length > 0 ? { pages } : {}),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setSelectedPage(0);
        if (data.pages?.[0]?.html) {
          onApplyPage(data.pages[0].html);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs text-white/40">
        Generate a complete multi-page website from a single prompt. AI determines the best pages or you can specify them.
      </p>

      <div>
        <label className="text-xs text-white/50 block mb-1.5">Describe your website</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A dental clinic website with booking functionality"
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500/50 resize-none"
        />
      </div>

      <div>
        <label className="text-xs text-white/50 block mb-1.5">
          Pages (optional — AI will choose if empty)
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {pages.map((page, i) => (
            <span
              key={i}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-brand-500/20 text-brand-400 text-xs"
            >
              {page}
              <button onClick={() => removePage(i)} className="hover:text-white">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        {pages.length < 6 && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newPage}
              onChange={(e) => setNewPage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPage()}
              placeholder="e.g., About, Services, Contact"
              className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-500/50"
            />
            <button
              onClick={addPage}
              className="px-2 py-1.5 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>

      <button
        onClick={generate}
        disabled={!prompt.trim() || loading}
        className="w-full py-2.5 rounded-lg text-sm font-medium bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-colors disabled:opacity-40"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Generating multi-page site...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <FileText size={16} /> Generate Multi-Page Site
          </span>
        )}
      </button>

      {result && result.pages.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-white/40 uppercase tracking-wider">
            {result.siteName} — {result.pages.length} pages
          </div>
          {result.pages.map((page, i) => (
            <div
              key={page.slug}
              className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                selectedPage === i
                  ? "bg-brand-500/10 border-brand-500/30"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
              onClick={() => {
                setSelectedPage(i);
                onApplyPage(page.html);
              }}
            >
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-white/40" />
                <div>
                  <div className="text-sm text-white font-medium">{page.title}</div>
                  <div className="text-[10px] text-white/30">/{page.slug === "index" ? "" : page.slug}</div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPage(i);
                  onApplyPage(page.html);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-colors"
              >
                <Eye size={12} /> View
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
