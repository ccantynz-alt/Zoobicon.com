import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  const name = request.nextUrl.searchParams.get("name") || "My Website";

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Extract display URL (strip protocol)
  const displayUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  // Truncate name if too long
  const truncatedName = name.length > 40 ? name.slice(0, 37) + "..." : name;

  // Generate a branded SVG OG image (1200x630 — standard OG dimensions)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a12;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#0f1029;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0a0a12;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#06b6d4;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#06b6d4;stop-opacity:0.15" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:0.15" />
    </linearGradient>
    <filter id="blur1">
      <feGaussianBlur in="SourceGraphic" stdDeviation="60" />
    </filter>
    <filter id="blur2">
      <feGaussianBlur in="SourceGraphic" stdDeviation="40" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)" />

  <!-- Ambient glow orbs -->
  <circle cx="200" cy="150" r="200" fill="#06b6d4" opacity="0.07" filter="url(#blur1)" />
  <circle cx="1000" cy="480" r="250" fill="#8b5cf6" opacity="0.07" filter="url(#blur1)" />
  <circle cx="600" cy="315" r="180" fill="#06b6d4" opacity="0.04" filter="url(#blur2)" />

  <!-- Subtle grid pattern -->
  <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" stroke-width="0.3" opacity="0.05" />
  </pattern>
  <rect width="1200" height="630" fill="url(#grid)" />

  <!-- Top accent line -->
  <rect x="0" y="0" width="1200" height="3" fill="url(#accent)" />

  <!-- Card background -->
  <rect x="80" y="100" width="1040" height="430" rx="24" fill="#0f1029" opacity="0.6" stroke="white" stroke-opacity="0.08" stroke-width="1" />

  <!-- Site name -->
  <text x="600" y="240" text-anchor="middle" fill="white" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="52">${escapeXml(truncatedName)}</text>

  <!-- URL -->
  <text x="600" y="300" text-anchor="middle" fill="#06b6d4" font-family="ui-monospace, monospace" font-weight="500" font-size="24">${escapeXml(displayUrl)}</text>

  <!-- Divider -->
  <rect x="450" y="340" width="300" height="1" fill="url(#accent)" opacity="0.4" />

  <!-- "Built with AI" badge -->
  <rect x="440" y="370" width="320" height="44" rx="22" fill="white" fill-opacity="0.06" stroke="white" stroke-opacity="0.1" stroke-width="1" />
  <text x="600" y="399" text-anchor="middle" fill="#a1a1aa" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="18">Built with AI in seconds</text>

  <!-- Zoobicon branding -->
  <text x="600" y="480" text-anchor="middle" fill="white" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="28" letter-spacing="2">ZOOBICON</text>
  <text x="600" y="508" text-anchor="middle" fill="#71717a" font-family="system-ui, -apple-system, sans-serif" font-weight="400" font-size="15">zoobicon.com</text>

  <!-- Bottom accent line -->
  <rect x="0" y="627" width="1200" height="3" fill="url(#accent)" />
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
