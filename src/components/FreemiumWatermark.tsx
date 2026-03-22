"use client";

import { Zap } from "lucide-react";

interface FreemiumWatermarkProps {
  siteSlug?: string;
  className?: string;
}

/**
 * "Powered by Zoobicon" watermark for free-tier deployed sites.
 *
 * React component version for use in Next.js pages.
 * For injecting into raw HTML output, use `getWatermarkHTML()`.
 */
export default function FreemiumWatermark({
  siteSlug,
  className = "",
}: FreemiumWatermarkProps) {
  const utm = siteSlug
    ? `?utm_source=watermark&utm_medium=site&utm_campaign=${encodeURIComponent(siteSlug)}`
    : "?utm_source=watermark&utm_medium=site";

  return (
    <a
      href={`https://zoobicon.com${utm}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-3 right-3 z-[9999] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-black/60 transition-all text-xs font-medium shadow-lg no-underline ${className}`}
      style={{ textDecoration: "none" }}
    >
      <Zap className="w-3 h-3" />
      <span>Powered by Zoobicon</span>
    </a>
  );
}

/**
 * Returns injectable HTML string for the watermark.
 * Injected into generated HTML for free-tier users before serving.
 * Only injected when user plan is "free".
 */
export function getWatermarkHTML(siteSlug: string): string {
  const utm = `?utm_source=watermark&utm_medium=site&utm_campaign=${encodeURIComponent(siteSlug)}`;

  return `<!-- Zoobicon Watermark -->
<a
  href="https://zoobicon.com${utm}"
  target="_blank"
  rel="noopener noreferrer"
  style="
    position: fixed;
    bottom: 12px;
    right: 12px;
    z-index: 9999;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 9999px;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.5);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  "
  onmouseover="this.style.color='rgba(255,255,255,0.8)';this.style.background='rgba(0,0,0,0.6)'"
  onmouseout="this.style.color='rgba(255,255,255,0.5)';this.style.background='rgba(0,0,0,0.4)'"
>
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  <span>Powered by Zoobicon</span>
</a>`;
}
