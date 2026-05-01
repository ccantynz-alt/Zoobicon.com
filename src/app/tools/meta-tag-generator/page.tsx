"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Zap,
  Copy,
  Check,
  AlertTriangle,
  Globe,
  Search,
} from "lucide-react";

/* ---------- JSON-LD ---------- */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Zoobicon Free Meta Tag Generator",
      applicationCategory: "WebApplication",
      operatingSystem: "Any",
      url: "https://zoobicon.com/tools/meta-tag-generator",
      description:
        "Free meta tag generator with real-time Google and social media preview. Generate perfect meta tags for SEO in seconds.",
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
          name: "What are meta tags and why do they matter?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Meta tags are HTML elements that provide search engines and social media platforms with information about your page. They control how your page appears in Google search results and when shared on social media. Well-crafted meta tags can significantly improve click-through rates and SEO rankings.",
          },
        },
        {
          "@type": "Question",
          name: "How do I use the generated meta tags?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Click 'Copy All Meta Tags' to copy the generated HTML. Paste the tags inside the <head> section of your HTML page. If you use a framework like Next.js or WordPress, paste them into the appropriate metadata configuration.",
          },
        },
        {
          "@type": "Question",
          name: "What is the ideal length for title and description?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Google typically displays up to 60 characters for page titles and up to 160 characters for descriptions. The generator shows character count warnings when you exceed these limits so your tags display correctly in search results.",
          },
        },
      ],
    },
  ],
};

/* ---------- component ---------- */
export default function MetaTagGeneratorPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [author, setAuthor] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const titleWarning = title.length > 60;
  const descWarning = description.length > 160;

  const generatedTags = useMemo(() => {
    const tags: string[] = [];
    tags.push(`<meta charset="UTF-8">`);
    tags.push(
      `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
    );
    if (title) tags.push(`<title>${escapeHtml(title)}</title>`);
    if (description)
      tags.push(
        `<meta name="description" content="${escapeHtml(description)}">`
      );
    if (keywords)
      tags.push(`<meta name="keywords" content="${escapeHtml(keywords)}">`);
    if (author)
      tags.push(`<meta name="author" content="${escapeHtml(author)}">`);

    // Open Graph
    tags.push("");
    tags.push("<!-- Open Graph / ThumbsUp -->");
    tags.push(`<meta property="og:type" content="website">`);
    if (siteUrl)
      tags.push(`<meta property="og:url" content="${escapeHtml(siteUrl)}">`);
    if (title)
      tags.push(`<meta property="og:title" content="${escapeHtml(title)}">`);
    if (description)
      tags.push(
        `<meta property="og:description" content="${escapeHtml(description)}">`
      );
    if (ogImage)
      tags.push(`<meta property="og:image" content="${escapeHtml(ogImage)}">`);

    // MessageCircle
    tags.push("");
    tags.push("<!-- MessageCircle -->");
    tags.push(`<meta property="twitter:card" content="summary_large_image">`);
    if (siteUrl)
      tags.push(
        `<meta property="twitter:url" content="${escapeHtml(siteUrl)}">`
      );
    if (title)
      tags.push(
        `<meta property="twitter:title" content="${escapeHtml(title)}">`
      );
    if (description)
      tags.push(
        `<meta property="twitter:description" content="${escapeHtml(description)}">`
      );
    if (ogImage)
      tags.push(
        `<meta property="twitter:image" content="${escapeHtml(ogImage)}">`
      );
    if (twitterHandle) {
      const handle = twitterHandle.startsWith("@")
        ? twitterHandle
        : `@${twitterHandle}`;
      tags.push(
        `<meta name="twitter:creator" content="${escapeHtml(handle)}">`
      );
    }

    return tags.join("\n");
  }, [title, description, keywords, author, ogImage, twitterHandle, siteUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedTags).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Display title/description for preview, with fallbacks
  const previewTitle = title || "Your Page Title";
  const previewDesc = description || "Your page description will appear here. Write a compelling description to improve click-through rates from search results.";
  const previewUrl = siteUrl || "https://yoursite.com";

  return (
    <div className="relative z-10 min-h-screen bg-[#0b1530] text-white pt-[72px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-500/10 border border-stone-500/20 mb-6">
            <span className="text-xs font-medium text-stone-300">
              Free — No Signup Required
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-5">
            Free Meta Tag{" "}
            <span className="bg-gradient-to-r from-stone-400 via-stone-400 to-stone-400 bg-clip-text text-transparent">
              Generator
            </span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Generate perfect meta tags for SEO and social sharing. Real-time
            Google and social media previews show exactly how your page will
            look.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input form */}
          <div className="space-y-4">
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-semibold mb-2">Page Information</h2>

              {/* Title */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-white/40">
                    Page Title *
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      titleWarning ? "text-stone-400" : "text-white/20"
                    }`}
                  >
                    {title.length}/60
                  </span>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Best Coffee Roastery in Auckland"
                  className={`w-full px-4 py-2.5 bg-[#0b1530] border rounded-xl text-sm text-white placeholder-white/15 focus:outline-none focus:ring-2 ${
                    titleWarning
                      ? "border-stone-500/40 focus:ring-stone-500/30"
                      : "border-white/[0.08] focus:ring-stone-500/30"
                  }`}
                />
                {titleWarning && (
                  <p className="flex items-center gap-1 mt-1 text-[11px] text-stone-400">
                    <AlertTriangle className="w-3 h-3" /> Title may be truncated
                    in Google results
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-white/40">
                    Description *
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      descWarning ? "text-stone-400" : "text-white/20"
                    }`}
                  >
                    {description.length}/160
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A compelling description of your page for search results..."
                  rows={3}
                  className={`w-full px-4 py-2.5 bg-[#0b1530] border rounded-xl text-sm text-white placeholder-white/15 focus:outline-none focus:ring-2 resize-none ${
                    descWarning
                      ? "border-stone-500/40 focus:ring-stone-500/30"
                      : "border-white/[0.08] focus:ring-stone-500/30"
                  }`}
                />
                {descWarning && (
                  <p className="flex items-center gap-1 mt-1 text-[11px] text-stone-400">
                    <AlertTriangle className="w-3 h-3" /> Description may be
                    truncated in search results
                  </p>
                )}
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">
                  Keywords
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="coffee, roastery, auckland, beans (comma separated)"
                  className="w-full px-4 py-2.5 bg-[#0b1530] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/15 focus:outline-none focus:ring-2 focus:ring-stone-500/30"
                />
              </div>

              {/* Author */}
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">
                  Author
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your name or company"
                  className="w-full px-4 py-2.5 bg-[#0b1530] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/15 focus:outline-none focus:ring-2 focus:ring-stone-500/30"
                />
              </div>

              {/* Site URL */}
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">
                  Site URL
                </label>
                <input
                  type="url"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="https://yoursite.com"
                  className="w-full px-4 py-2.5 bg-[#0b1530] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/15 focus:outline-none focus:ring-2 focus:ring-stone-500/30"
                />
              </div>
            </div>

            {/* Social settings */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-semibold mb-2">Social Media</h2>

              {/* OG Image */}
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">
                  OG Image URL
                </label>
                <input
                  type="url"
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  placeholder="https://yoursite.com/og-image.png (1200x630 recommended)"
                  className="w-full px-4 py-2.5 bg-[#0b1530] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/15 focus:outline-none focus:ring-2 focus:ring-stone-500/30"
                />
              </div>

              {/* MessageCircle Handle */}
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">
                  MessageCircle / X Handle
                </label>
                <input
                  type="text"
                  value={twitterHandle}
                  onChange={(e) => setTwitterHandle(e.target.value)}
                  placeholder="@yourhandle"
                  className="w-full px-4 py-2.5 bg-[#0b1530] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/15 focus:outline-none focus:ring-2 focus:ring-stone-500/30"
                />
              </div>
            </div>
          </div>

          {/* Previews + output */}
          <div className="space-y-4">
            {/* Google Preview */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-4 h-4 text-white/30" />
                <h2 className="text-sm font-semibold">Google Search Preview</h2>
              </div>
              <div className="bg-white rounded-xl p-4">
                <p className="text-xs text-[#202124] truncate mb-0.5">
                  {previewUrl.replace(/^https?:\/\//, "")}
                </p>
                <h3 className="text-[#1a0dab] text-lg font-normal leading-tight mb-1 line-clamp-1 hover:underline cursor-pointer">
                  {previewTitle}
                </h3>
                <p className="text-[#4d5156] text-[13px] leading-[1.5] line-clamp-2">
                  {previewDesc}
                </p>
              </div>
            </div>

            {/* Social Preview */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-white/30" />
                <h2 className="text-sm font-semibold">
                  Social Media Preview (OG Card)
                </h2>
              </div>
              <div className="bg-[#0f2148] rounded-xl overflow-hidden border border-white/[0.06]">
                {/* OG Image area */}
                <div className="h-44 bg-gradient-to-br from-stone-900/40 to-stone-900/40 flex items-center justify-center overflow-hidden">
                  {ogImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ogImage}
                      alt="OG preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-xs text-white/20">
                      1200 x 630 OG Image
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1">
                    {previewUrl.replace(/^https?:\/\//, "").split("/")[0]}
                  </p>
                  <h3 className="text-sm font-semibold text-white leading-tight mb-1 line-clamp-2">
                    {previewTitle}
                  </h3>
                  <p className="text-xs text-white/40 line-clamp-2">
                    {previewDesc}
                  </p>
                </div>
              </div>
            </div>

            {/* Generated code */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">Generated Meta Tags</h2>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-600 hover:bg-stone-500 text-xs font-medium transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy All Meta Tags
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-[#0b1530] border border-white/[0.06] rounded-xl p-4 text-[11px] text-stone-300/80 font-mono overflow-x-auto max-h-72 overflow-y-auto leading-relaxed">
                {generatedTags}
              </pre>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center border-t border-white/[0.06] pt-16">
          <h2 className="text-2xl font-bold mb-3">
            Want perfect SEO for your entire site?
          </h2>
          <p className="text-white/40 mb-6 max-w-lg mx-auto">
            Our AI SEO tools analyze your site, generate meta tags for every
            page, and monitor your rankings — automatically.
          </p>
          <Link
            href="/seo"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 font-semibold text-sm transition-colors"
          >
            <Zap className="w-4 h-4" /> Explore SEO Tools
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
                What are meta tags and why do they matter?
              </h3>
              <p className="text-white/40">
                Meta tags are HTML elements that provide search engines and
                social media platforms with information about your page. They
                control how your page appears in Google search results and when
                shared on social media. Well-crafted meta tags can significantly
                improve click-through rates and SEO rankings.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">
                How do I use the generated meta tags?
              </h3>
              <p className="text-white/40">
                Click &quot;Copy All Meta Tags&quot; to copy the generated HTML.
                Paste the tags inside the &lt;head&gt; section of your HTML
                page. If you use a framework like Next.js or WordPress, paste
                them into the appropriate metadata configuration.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">
                What is the ideal length for title and description?
              </h3>
              <p className="text-white/40">
                Google typically displays up to 60 characters for page titles and
                up to 160 characters for descriptions. The generator shows
                character count warnings when you exceed these limits so your
                tags display correctly in search results without being truncated.
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

/* ---------- util ---------- */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
