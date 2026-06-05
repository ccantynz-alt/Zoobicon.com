/**
 * Brand Assets generator — Sprint 3 T6.
 *
 * Takes a BrandSpec (the planner-emitted token sheet from Q4) and
 * derives auxiliary brand assets: favicon SVG, email signature HTML,
 * social card SVGs (OG + Twitter dimensions), and a business card
 * layout SVG.
 *
 * Each generator is a pure function (BrandSpec, options?) → string.
 * No LLM calls, no network — these are template + token
 * substitutions. The website build pipeline already pays the LLM
 * cost; the assets derive "for free" from the BrandSpec.
 *
 * Why this matters: nobody else in the AI builder space generates a
 * brand kit alongside the site. Lovable, Bolt, v0, Emergent — all
 * give you a website and stop. Zoobicon gives you the website + the
 * favicon + the social cards + the email signature + the business
 * card from the same prompt. Total brand kit from one input.
 *
 * Distinct from src/lib/brand-kit.ts which is the localStorage-based
 * brand-identity persistence layer — different concern, different
 * shape.
 */

export interface BrandSpec {
  brandName: string;
  primaryColor: string;
  bgColor: string;
  textPrimary: string;
  textSecondary: string;
  accentColor: string;
  headlineFont: string;
  bodyFont: string;
}

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function initial(brandName: string): string {
  const trimmed = brandName.trim();
  if (!trimmed) return "Z";
  return trimmed[0].toUpperCase();
}

/** Pick a foreground color that contrasts against the given background.
 *  Crude luminance heuristic — good enough for favicon + card use. */
function readableOn(bgHex: string): string {
  const hex = bgHex.replace("#", "");
  if (hex.length < 6) return "#ffffff";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#0a0a0b" : "#ffffff";
}

// ────────────────────────────────────────────────────────────────────
// Favicon — 64x64 SVG with brand initial in a primary-color tile.
// Browsers downscale cleanly to 16/32/48.
// ────────────────────────────────────────────────────────────────────

export function generateFavicon(spec: BrandSpec): string {
  const fg = readableOn(spec.primaryColor);
  const letter = initial(spec.brandName);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="14" fill="${escapeXml(spec.primaryColor)}"/>
  <text x="32" y="44" font-family="${escapeXml(spec.headlineFont)}, system-ui, sans-serif"
        font-size="36" font-weight="700" text-anchor="middle"
        fill="${fg}">${escapeXml(letter)}</text>
</svg>`;
}

// ────────────────────────────────────────────────────────────────────
// Email signature — table-based HTML so it renders in Outlook /
// Gmail / Apple Mail.
// ────────────────────────────────────────────────────────────────────

export function generateEmailSignature(
  spec: BrandSpec,
  options: {
    name?: string;
    role?: string;
    email?: string;
    phone?: string;
    website?: string;
  } = {}
): string {
  const {
    name = "Your Name",
    role = "Your Role",
    email = "you@example.com",
    phone = "",
    website = "yoursite.com",
  } = options;

  return `<table cellspacing="0" cellpadding="0" border="0" style="font-family: ${escapeXml(spec.bodyFont)}, -apple-system, sans-serif; color: ${escapeXml(spec.textPrimary)};">
  <tr>
    <td style="padding-right: 16px; border-right: 3px solid ${escapeXml(spec.primaryColor)};">
      <div style="font-family: ${escapeXml(spec.headlineFont)}, serif; font-size: 18px; font-weight: 600; color: ${escapeXml(spec.textPrimary)};">${escapeXml(spec.brandName)}</div>
    </td>
    <td style="padding-left: 16px; font-size: 13px; line-height: 1.5;">
      <div style="font-weight: 600; color: ${escapeXml(spec.textPrimary)};">${escapeXml(name)}</div>
      <div style="color: ${escapeXml(spec.textSecondary)};">${escapeXml(role)}</div>
      <div style="margin-top: 6px;">
        <a href="mailto:${escapeXml(email)}" style="color: ${escapeXml(spec.accentColor)}; text-decoration: none;">${escapeXml(email)}</a>
        ${phone ? ` &middot; <span style="color: ${escapeXml(spec.textSecondary)};">${escapeXml(phone)}</span>` : ""}
      </div>
      <div style="margin-top: 2px;">
        <a href="https://${escapeXml(website)}" style="color: ${escapeXml(spec.accentColor)}; text-decoration: none;">${escapeXml(website)}</a>
      </div>
    </td>
  </tr>
</table>`;
}

// ────────────────────────────────────────────────────────────────────
// Social card SVG — 1200x630 (OG) or 1200x600 (Twitter).
// ────────────────────────────────────────────────────────────────────

export function generateSocialCard(
  spec: BrandSpec,
  options: { headline?: string; subhead?: string; size?: "og" | "twitter" } = {}
): string {
  const { headline = spec.brandName, subhead = "", size = "og" } = options;
  const dims = size === "twitter" ? { w: 1200, h: 600 } : { w: 1200, h: 630 };
  const fg = readableOn(spec.bgColor);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dims.w} ${dims.h}" width="${dims.w}" height="${dims.h}">
  <rect width="${dims.w}" height="${dims.h}" fill="${escapeXml(spec.bgColor)}"/>
  <rect x="80" y="${dims.h / 2 - 4}" width="60" height="6" fill="${escapeXml(spec.accentColor)}"/>
  <text x="80" y="${dims.h / 2 - 30}" font-family="${escapeXml(spec.headlineFont)}, serif"
        font-size="84" font-weight="700" fill="${fg}">${escapeXml(headline)}</text>
  ${subhead ? `<text x="80" y="${dims.h / 2 + 80}" font-family="${escapeXml(spec.bodyFont)}, sans-serif"
        font-size="36" fill="${fg}" opacity="0.7">${escapeXml(subhead)}</text>` : ""}
  <text x="${dims.w - 80}" y="${dims.h - 60}" font-family="${escapeXml(spec.bodyFont)}, sans-serif"
        font-size="22" text-anchor="end" fill="${fg}" opacity="0.55">${escapeXml(spec.brandName.toLowerCase())}.com</text>
</svg>`;
}

// ────────────────────────────────────────────────────────────────────
// Business card layout — 1050x600 SVG (3.5"x2" @ 300dpi).
// Front face only; back is typically blank or pure logo.
// ────────────────────────────────────────────────────────────────────

export function generateBusinessCard(
  spec: BrandSpec,
  options: {
    name?: string;
    role?: string;
    email?: string;
    phone?: string;
    website?: string;
  } = {}
): string {
  const {
    name = "Your Name",
    role = "Your Role",
    email = "you@example.com",
    phone = "",
    website = "yoursite.com",
  } = options;
  const fg = readableOn(spec.bgColor);
  const letter = initial(spec.brandName);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1050 600" width="1050" height="600">
  <rect width="1050" height="600" fill="${escapeXml(spec.bgColor)}"/>
  <rect x="60" y="60" width="100" height="100" rx="20" fill="${escapeXml(spec.primaryColor)}"/>
  <text x="110" y="125" font-family="${escapeXml(spec.headlineFont)}, serif" font-size="56" font-weight="700"
        text-anchor="middle" fill="${readableOn(spec.primaryColor)}">${escapeXml(letter)}</text>
  <text x="180" y="115" font-family="${escapeXml(spec.headlineFont)}, serif"
        font-size="44" font-weight="600" fill="${fg}">${escapeXml(spec.brandName)}</text>
  <text x="60" y="380" font-family="${escapeXml(spec.bodyFont)}, sans-serif"
        font-size="36" font-weight="600" fill="${fg}">${escapeXml(name)}</text>
  <text x="60" y="424" font-family="${escapeXml(spec.bodyFont)}, sans-serif"
        font-size="22" fill="${fg}" opacity="0.6">${escapeXml(role)}</text>
  <rect x="60" y="450" width="80" height="4" fill="${escapeXml(spec.accentColor)}"/>
  <text x="60" y="500" font-family="${escapeXml(spec.bodyFont)}, sans-serif" font-size="20" fill="${fg}">${escapeXml(email)}</text>
  ${phone ? `<text x="60" y="530" font-family="${escapeXml(spec.bodyFont)}, sans-serif" font-size="20" fill="${fg}">${escapeXml(phone)}</text>` : ""}
  <text x="60" y="${phone ? 560 : 530}" font-family="${escapeXml(spec.bodyFont)}, sans-serif" font-size="20" fill="${escapeXml(spec.accentColor)}">${escapeXml(website)}</text>
</svg>`;
}

// ────────────────────────────────────────────────────────────────────
// Full kit — one call returns every format.
// ────────────────────────────────────────────────────────────────────

export interface BrandAssets {
  favicon: string;
  emailSignature: string;
  socialCardOG: string;
  socialCardTwitter: string;
  businessCard: string;
}

export function generateBrandAssets(
  spec: BrandSpec,
  contactInfo?: {
    name?: string;
    role?: string;
    email?: string;
    phone?: string;
    website?: string;
  }
): BrandAssets {
  return {
    favicon: generateFavicon(spec),
    emailSignature: generateEmailSignature(spec, contactInfo),
    socialCardOG: generateSocialCard(spec, { size: "og" }),
    socialCardTwitter: generateSocialCard(spec, { size: "twitter" }),
    businessCard: generateBusinessCard(spec, contactInfo),
  };
}
