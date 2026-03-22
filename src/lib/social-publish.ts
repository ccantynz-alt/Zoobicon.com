// Social publishing utilities for Zoobicon share-to-social system

const SHARE_TEXTS: Record<string, (siteName: string, url: string, buildTime?: number) => string> = {
  tiktok: (siteName, _url, buildTime) =>
    `I just built ${siteName ? `"${siteName}"` : "this website"} in ${buildTime || 90} seconds with AI \u{1F525} #webdesign #ai #zoobicon #builtwithAI #nocode`,

  twitter: (siteName, url, buildTime) =>
    `Just built ${siteName ? `"${siteName}"` : "a website"} with @zoobicon in ${buildTime || 90} seconds. AI-generated, deployed instantly.\n\nCheck it out: ${url}`,

  linkedin: (siteName, url, buildTime) =>
    `I just used AI to build ${siteName ? `"${siteName}"` : "a professional website"} in ${buildTime || 90} seconds \u{2014} from a single text prompt to a fully deployed, live site.\n\nThe AI pipeline handles strategy, design, copywriting, development, SEO optimization, and deployment automatically.\n\nThis is the future of web development.\n\n${url}\n\n#AI #WebDevelopment #NoCode #Zoobicon`,

  facebook: (siteName, _url, buildTime) =>
    `Just built ${siteName ? `"${siteName}"` : "a website"} in ${buildTime || 90} seconds using AI. No coding, no templates \u{2014} just described what I wanted and it built everything. \u{1F680}`,

  reddit: (siteName, _url, buildTime) =>
    `[Show & Tell] I built ${siteName ? `"${siteName}"` : "this website"} in ${buildTime || 90} seconds with AI \u{2014} from prompt to deployed site`,

  instagram: (siteName, _url, buildTime) =>
    `Built ${siteName ? `"${siteName}"` : "this website"} in ${buildTime || 90} seconds with AI \u{2728}\n\nNo coding. No templates. Just described what I wanted and @zoobicon built everything.\n\nStrategy \u{2192} Design \u{2192} Copy \u{2192} Code \u{2192} Deploy \u{2014} all automated.\n\n#webdesign #ai #nocode #zoobicon #builtwithAI #webdevelopment #automation #tech #startup`,
};

/**
 * Generate a share URL for the given platform
 */
export function generateShareUrl(platform: string, url: string, text: string): string {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  switch (platform) {
    case "twitter":
      return `https://twitter.com/intent/tweet?text=${encodedText}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
    case "reddit":
      return `https://reddit.com/submit?url=${encodedUrl}&title=${encodedText}`;
    case "tiktok":
      // TikTok doesn't have a web share URL — copy text to clipboard instead
      return "";
    case "instagram":
      // Instagram doesn't support web share URLs — copy caption instead
      return "";
    default:
      return "";
  }
}

/**
 * Generate platform-specific share text
 */
export function generateShareText(platform: string, siteName: string, url: string, buildTime?: number): string {
  const generator = SHARE_TEXTS[platform];
  if (!generator) return `Check out ${siteName || "my new site"}: ${url}`;
  return generator(siteName, url, buildTime);
}

/**
 * Generate the OG image URL for a deployed site
 */
export function generateOGImageUrl(siteUrl: string): string {
  return `/api/social/og-image?url=${encodeURIComponent(siteUrl)}`;
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for non-secure contexts
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

/**
 * Track share events in localStorage for analytics
 */
export function trackShare(platform: string, siteUrl: string): void {
  try {
    const key = "zoobicon_shares";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.push({
      platform,
      siteUrl,
      timestamp: new Date().toISOString(),
    });
    // Keep last 100 share events
    if (existing.length > 100) existing.splice(0, existing.length - 100);
    localStorage.setItem(key, JSON.stringify(existing));
  } catch {
    // Silent fail — analytics tracking is non-critical
  }
}

/**
 * Get share count from localStorage
 */
export function getShareCount(): number {
  try {
    const existing = JSON.parse(localStorage.getItem("zoobicon_shares") || "[]");
    return existing.length;
  } catch {
    return 0;
  }
}

/**
 * All supported platforms with metadata
 */
export const PLATFORMS = [
  { id: "twitter", name: "Twitter / X", hasWebShare: true },
  { id: "linkedin", name: "LinkedIn", hasWebShare: true },
  { id: "facebook", name: "Facebook", hasWebShare: true },
  { id: "reddit", name: "Reddit", hasWebShare: true },
  { id: "tiktok", name: "TikTok", hasWebShare: false },
  { id: "instagram", name: "Instagram", hasWebShare: false },
] as const;
