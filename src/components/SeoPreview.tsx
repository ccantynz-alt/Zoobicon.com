"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Globe, Share2 } from "lucide-react";

interface SeoPreviewProps {
  html: string;
}

interface MetaData {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonical: string;
  h1: string;
  h2Count: number;
  imgCount: number;
  imgWithAlt: number;
  hasViewport: boolean;
  hasCharset: boolean;
  hasJsonLd: boolean;
  wordCount: number;
}

function extractMeta(html: string): MetaData {
  const getTag = (pattern: RegExp) => {
    const m = html.match(pattern);
    return m ? m[1].trim() : "";
  };

  const title = getTag(/<title[^>]*>([^<]*)<\/title>/i);
  const description = getTag(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
    || getTag(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i);
  const ogTitle = getTag(/<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i)
    || getTag(/<meta\s+content=["']([^"']*)["']\s+property=["']og:title["']/i);
  const ogDescription = getTag(/<meta\s+property=["']og:description["']\s+content=["']([^"']*)["']/i)
    || getTag(/<meta\s+content=["']([^"']*)["']\s+property=["']og:description["']/i);
  const ogImage = getTag(/<meta\s+property=["']og:image["']\s+content=["']([^"']*)["']/i)
    || getTag(/<meta\s+content=["']([^"']*)["']\s+property=["']og:image["']/i);
  const canonical = getTag(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i);

  const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
  const h1 = h1Match ? h1Match[1].trim() : "";
  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;

  const imgs = html.match(/<img[^>]*>/gi) || [];
  const imgCount = imgs.length;
  const imgWithAlt = imgs.filter(i => /alt=["'][^"']+["']/i.test(i)).length;

  const hasViewport = /name=["']viewport["']/i.test(html);
  const hasCharset = /charset/i.test(html);
  const hasJsonLd = /application\/ld\+json/i.test(html);

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyText = bodyMatch
    ? bodyMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
    : "";
  const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;

  return {
    title, description, ogTitle, ogDescription, ogImage, canonical,
    h1, h2Count, imgCount, imgWithAlt,
    hasViewport, hasCharset, hasJsonLd, wordCount,
  };
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = Math.min(100, (score / max) * 100);
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-white/50 w-8 text-right">{score}/{max}</span>
    </div>
  );
}

export default function SeoPreview({ html }: SeoPreviewProps) {
  const meta = useMemo(() => extractMeta(html), [html]);

  // Calculate SEO score
  const score = useMemo(() => {
    let s = 0;
    if (meta.title) s += meta.title.length <= 60 ? 10 : 5;
    if (meta.description) s += meta.description.length >= 120 && meta.description.length <= 160 ? 10 : 5;
    if (meta.h1) s += 10;
    if (meta.h2Count >= 2) s += 10;
    if (meta.hasViewport) s += 5;
    if (meta.hasCharset) s += 5;
    if (meta.ogTitle) s += 10;
    if (meta.ogDescription) s += 10;
    if (meta.ogImage) s += 10;
    if (meta.hasJsonLd) s += 10;
    if (meta.imgCount > 0 && meta.imgWithAlt === meta.imgCount) s += 5;
    if (meta.wordCount >= 300) s += 5;
    return s;
  }, [meta]);

  if (!html) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-white/50 uppercase tracking-[2px]">No code generated yet</p>
      </div>
    );
  }

  const displayTitle = meta.title || "Untitled Page";
  const displayDesc = meta.description || "No meta description set. Add one for better search rankings.";
  const displayUrl = meta.canonical || "https://example.com";

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* SEO Score */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/80">SEO Score</h2>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400"}`}>
            {score}
          </span>
          <span className="text-xs text-white/50">/100</span>
        </div>
      </div>
      <ScoreBar score={score} max={100} />

      {/* Google Search Preview */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Globe size={14} className="text-white/50" />
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Google Preview</h3>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-lg">
          <div className="text-xs text-[#202124] mb-1 flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[8px] text-white font-bold">Z</span>
            <span className="text-[#4d5156]">{displayUrl}</span>
          </div>
          <h3 className="text-[#1a0dab] text-lg leading-snug hover:underline cursor-pointer mb-1">
            {displayTitle.length > 60 ? displayTitle.slice(0, 57) + "..." : displayTitle}
          </h3>
          <p className="text-sm text-[#4d5156] leading-relaxed">
            {displayDesc.length > 160 ? displayDesc.slice(0, 157) + "..." : displayDesc}
          </p>
        </div>
      </div>

      {/* Social Share Preview */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Share2 size={14} className="text-white/50" />
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Social Card Preview</h3>
        </div>
        <div className="rounded-lg overflow-hidden border border-[#e1e8ed] bg-white shadow">
          {meta.ogImage && (
            <div className="relative w-full h-[160px] bg-gray-200 overflow-hidden">
              <Image src={meta.ogImage} alt="OG Preview" fill unoptimized className="object-cover" />
            </div>
          )}
          <div className="p-3">
            <p className="text-xs text-[#536471] uppercase">{displayUrl.replace(/https?:\/\//, "").split("/")[0]}</p>
            <h4 className="text-sm font-bold text-[#0f1419] mt-0.5">
              {(meta.ogTitle || displayTitle).slice(0, 70)}
            </h4>
            <p className="text-xs text-[#536471] mt-1">
              {(meta.ogDescription || displayDesc).slice(0, 200)}
            </p>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div>
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Checklist</h3>
        <div className="space-y-2">
          {[
            { label: "Title tag", ok: !!meta.title, detail: meta.title ? `${meta.title.length} chars` : "Missing" },
            { label: "Meta description", ok: !!meta.description, detail: meta.description ? `${meta.description.length} chars` : "Missing" },
            { label: "H1 heading", ok: !!meta.h1, detail: meta.h1 || "Missing" },
            { label: "H2 headings", ok: meta.h2Count >= 2, detail: `${meta.h2Count} found` },
            { label: "Open Graph title", ok: !!meta.ogTitle, detail: meta.ogTitle ? "Set" : "Missing" },
            { label: "Open Graph description", ok: !!meta.ogDescription, detail: meta.ogDescription ? "Set" : "Missing" },
            { label: "Open Graph image", ok: !!meta.ogImage, detail: meta.ogImage ? "Set" : "Missing" },
            { label: "JSON-LD schema", ok: meta.hasJsonLd, detail: meta.hasJsonLd ? "Found" : "Missing" },
            { label: "Viewport meta", ok: meta.hasViewport, detail: meta.hasViewport ? "Set" : "Missing" },
            { label: "Image alt tags", ok: meta.imgCount === 0 || meta.imgWithAlt === meta.imgCount, detail: `${meta.imgWithAlt}/${meta.imgCount}` },
            { label: "Content length", ok: meta.wordCount >= 300, detail: `${meta.wordCount} words` },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 text-xs">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.ok ? "bg-emerald-500" : "bg-red-500/70"}`} />
              <span className="text-white/50 flex-1">{item.label}</span>
              <span className={`text-[10px] ${item.ok ? "text-emerald-400/60" : "text-red-400/60"}`}>
                {item.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
