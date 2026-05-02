// Competitor comparison data for /vs/[name] pages.
//
// Editorial rule: be honest. Our credibility on the comparison page comes from
// acknowledging where the competitor genuinely leads. We win on ecosystem
// breadth and bundled pricing — those facts are strong enough to win without
// needing to fudge anything else.
//
// Numbers are sourced from CLAUDE.md (kept current via the audit script). If
// the audit flags any of these as stale, update here in the same commit.

export type FeatureSide = "us" | "them" | "both" | "neither";

export interface FeatureRow {
  feature: string;
  us: FeatureSide | string;
  them: FeatureSide | string;
}

export interface PricingTier {
  name: string;
  price: string;
  highlights: string[];
}

export interface CompetitorComparison {
  // Identity
  slug: string;                  // "lovable" — matches the route segment
  name: string;                  // "Lovable" — human display name
  url: string;                   // "https://lovable.dev"
  category: string;              // "AI Website Builder"

  // SEO
  metaTitle: string;
  metaDescription: string;

  // Stats strip (from CLAUDE.md verified numbers)
  stats: {
    arr?: string;
    users?: string;
    valuation?: string;
    founded?: string;
    employees?: string;
  };

  // Hero
  tagline: string;               // One-liner about them
  ourPitch: string;              // One-liner about why we're a better fit

  // Honest analysis
  whatTheyDo: string;            // 2-3 sentence paragraph
  theirStrengths: string[];      // 3-5 bullets — be honest
  ourStrengths: string[];        // 5-7 bullets — where we genuinely lead

  // Feature matrix
  features: FeatureRow[];

  // Pricing
  ourTiers: PricingTier[];
  theirTiers: PricingTier[];

  // Closing
  verdict: string;               // 2-3 sentences

  // Best-fit recommendation — for whom each product is the right call
  whenToPickThem: string;
  whenToPickUs: string;
}

const ZOOBICON_TIERS: PricingTier[] = [
  {
    name: "Starter",
    price: "$49 / mo",
    highlights: ["AI builder", "1 domain", "3 mailboxes", "SSL + CDN", "zoobicon.sh hosting"],
  },
  {
    name: "Pro",
    price: "$129 / mo",
    highlights: ["Everything in Starter", "AI auto-reply", "AI video creator", "SEO monitor", "5 sites"],
  },
  {
    name: "Agency",
    price: "$299 / mo",
    highlights: ["Everything in Pro", "20 sites", "Priority support", "Bulk operations", "Client portal"],
  },
  {
    name: "White-label",
    price: "$499 / mo",
    highlights: ["Full reseller licence", "Custom branding", "Unlimited end users", "Margin on every product"],
  },
];

export const COMPARISONS: Record<string, CompetitorComparison> = {
  lovable: {
    slug: "lovable",
    name: "Lovable",
    url: "https://lovable.dev",
    category: "AI Website Builder",
    metaTitle: "Zoobicon vs Lovable — AI Website Builder Comparison (2026)",
    metaDescription:
      "Honest 2026 comparison of Zoobicon and Lovable. Lovable hit $400M ARR by polishing one product. Zoobicon bundles 75+ products into one platform at a fraction of the cost. See feature-by-feature analysis.",
    stats: {
      arr: "$400M ARR (Feb 2026)",
      valuation: "$6.6B (Series B, Dec 2025)",
      employees: "146 employees",
      users: "Millions",
    },
    tagline: "Full-stack React apps with deep Supabase auto-provisioning. Lovable 2.0 added Plan Mode, Prompt Queue, and Browser Testing.",
    ourPitch:
      "Same builder quality, plus real domain registration, AI video creator, agency white-label, hosting, and email — bundled at $49/mo instead of buying each separately.",
    whatTheyDo:
      "Lovable is a focused AI website builder that generates production-ready React apps with auto-provisioned Supabase backends — Postgres, auth, RLS, storage, real-time. Their 2026 push beyond apps into data analysis, presentations, and marketing makes them an expanding general-purpose AI work platform.",
    theirStrengths: [
      "Deep Supabase auto-provisioning is genuinely best-in-class — tables, auth, RLS, Edge Functions all wired automatically",
      "Lovable 2.0's Browser Testing auto-QA is a real differentiator versus Bolt and v0",
      "Plan Mode + Prompt Queue (batch up to 50 prompts) ships work fast",
      "Mature post-generation editing experience and multiplayer collaboration",
      "Massive distribution — millions of users, $400M ARR, $6.6B valuation",
    ],
    ourStrengths: [
      "75+ products in one platform vs Lovable's single-product focus",
      "Real domain search + registration via OpenSRS — Lovable has no domain layer at all",
      "Own AI video pipeline (Fish Audio S1 + Hedra Character-3) — Lovable has no video product",
      "Bundled email, hosting, SSL, CDN at one $49/mo price vs $200+/mo buying each",
      "Agency white-label tier ($499/mo) — Lovable doesn't sell to resellers",
      "100-name AI domain finder with style filters, brand scoring, social handle availability — Lovable can't even register a domain",
      "Open-source agent framework (@zoobicon/agents) — Lovable's stack is closed",
    ],
    features: [
      { feature: "AI website generation", us: "both", them: "both" },
      { feature: "Full-stack apps with database", us: "both", them: "both" },
      { feature: "Auto-Supabase provisioning", us: "both", them: "them" },
      { feature: "Real domain search + registration", us: "us", them: "neither" },
      { feature: "AI domain name generator (100 names, scored)", us: "us", them: "neither" },
      { feature: "AI video creator (spokesperson + voice cloning)", us: "us", them: "neither" },
      { feature: "Bundled hosting + SSL + CDN", us: "us", them: "neither" },
      { feature: "Bundled business email", us: "us", them: "neither" },
      { feature: "Agency white-label platform", us: "us", them: "neither" },
      { feature: "GitHub sync", us: "both", them: "both" },
      { feature: "One-click deploy", us: "both", them: "both" },
      { feature: "Browser-based auto-QA testing", us: "neither", them: "them" },
      { feature: "Plan Mode (multi-step planning)", us: "neither", them: "them" },
      { feature: "Real-time collaborative editing", us: "neither", them: "them" },
    ],
    ourTiers: ZOOBICON_TIERS,
    theirTiers: [
      { name: "Free", price: "$0", highlights: ["5 daily messages", "Public projects", "Community support"] },
      { name: "Pro", price: "$25 / mo", highlights: ["100 monthly messages", "Private projects", "Custom domains"] },
      { name: "Teams", price: "$30 / user / mo", highlights: ["Centralised billing", "Workspace", "Team library"] },
      { name: "Business", price: "$50 / user / mo", highlights: ["SSO", "SOC2", "Custom workspaces"] },
    ],
    verdict:
      "Lovable is the right call if all you need is the best-in-class single-product experience and you're happy paying separately for domains, hosting, email, and video. Zoobicon is the right call if you want one login, one bill, and one ecosystem covering every layer a modern business actually runs on — at roughly a quarter of the all-in cost.",
    whenToPickThem: "You only need a website builder, you're already paying separately for domains/hosting/email, and you want the absolute best Supabase auto-provisioning available.",
    whenToPickUs: "You want one platform that handles website + domain + hosting + email + video + agency reselling, at a single subscription price, with no juggling between five vendors.",
  },

  bolt: {
    slug: "bolt",
    name: "Bolt.new",
    url: "https://bolt.new",
    category: "AI Website Builder",
    metaTitle: "Zoobicon vs Bolt.new — AI Website Builder Comparison (2026)",
    metaDescription:
      "Honest 2026 comparison of Zoobicon and Bolt.new. Bolt has the fastest in-browser preview thanks to WebContainers. Zoobicon delivers a 75-product ecosystem and real domain + video + email at a single bundled price.",
    stats: {
      arr: "$40M ARR (Mar 2025)",
      valuation: "$700M (Series B, Jan 2025)",
      users: "5M+",
    },
    tagline: "Instant in-browser preview powered by StackBlitz WebContainers. Bolt V2 added Plan Mode, auto-DB creation, auto-error-fixing.",
    ourPitch:
      "Match Bolt's preview quality, beat them on ecosystem — domains, video, email, hosting, and white-label agency all included at $49/mo.",
    whatTheyDo:
      "Bolt.new runs full Node.js in the browser via StackBlitz's WebContainers — no server round-trip for preview. Bolt V2 closed the full-stack gap with Lovable: native auth, payments, SEO, storage, Figma import, multi-model, and an auto-error-fixing agent.",
    theirStrengths: [
      "Fastest preview in the market — 3–5s first render via WebContainers",
      "Full Node.js in the browser means real backend behaviour in preview, not stubs",
      "Bolt V2 handles 1000× larger projects than V1 with the auto-error-fixing agent",
      "Multi-model (Claude, GPT, Gemini) gives them broader fallback than single-provider competitors",
      "Strong free tier and developer mind-share (5M+ users)",
    ],
    ourStrengths: [
      "75+ products in one platform vs Bolt's single-product focus",
      "Real domain search + registration via OpenSRS — Bolt has no domain layer",
      "Own AI video pipeline with voice cloning + auto-captions — Bolt has no video",
      "Bundled hosting, SSL, CDN, business email at $49/mo all-in",
      "Agency white-label tier ($499/mo) for resellers — Bolt doesn't sell to agencies",
      "100-name AI domain finder with brand scoring + social handle availability + USPTO trademark check",
      "Self-hosted in-browser preview via Sandpack — same speed target, no StackBlitz dependency",
    ],
    features: [
      { feature: "AI website generation", us: "both", them: "both" },
      { feature: "In-browser live preview", us: "both", them: "both" },
      { feature: "Full Node.js in browser (WebContainers)", us: "neither", them: "them" },
      { feature: "Real domain search + registration", us: "us", them: "neither" },
      { feature: "AI domain name generator", us: "us", them: "neither" },
      { feature: "AI video creator", us: "us", them: "neither" },
      { feature: "Bundled hosting + SSL + CDN", us: "us", them: "neither" },
      { feature: "Bundled business email", us: "us", them: "neither" },
      { feature: "Agency white-label platform", us: "us", them: "neither" },
      { feature: "Multi-model AI (Claude / GPT / Gemini)", us: "both", them: "both" },
      { feature: "Auto-error-fixing agent", us: "neither", them: "them" },
      { feature: "GitHub sync", us: "both", them: "both" },
      { feature: "One-click deploy", us: "both", them: "both" },
    ],
    ourTiers: ZOOBICON_TIERS,
    theirTiers: [
      { name: "Free", price: "$0", highlights: ["Free daily tokens", "Limited messages"] },
      { name: "Pro", price: "$20 / mo", highlights: ["10M tokens", "Private projects"] },
      { name: "Pro 50", price: "$50 / mo", highlights: ["26M tokens"] },
      { name: "Pro 100", price: "$100 / mo", highlights: ["55M tokens"] },
    ],
    verdict:
      "Bolt is the right call if you only need the fastest in-browser preview for a single React app, and you're comfortable paying separately for domains, hosting, and email. Zoobicon matches Bolt's preview goal AND ships the full surrounding ecosystem at one bundled price — so you're never picking between five tools.",
    whenToPickThem: "You're a solo developer who wants the fastest possible iteration on one app and you don't care about domains/email/video.",
    whenToPickUs: "You want a single platform that handles every operational layer of a modern business — site + domain + hosting + email + video — at one price.",
  },

  v0: {
    slug: "v0",
    name: "v0 (Vercel)",
    url: "https://v0.app",
    category: "AI UI Generator",
    metaTitle: "Zoobicon vs v0 — Vercel AI Builder Comparison (2026)",
    metaDescription:
      "Honest 2026 comparison of Zoobicon and v0.app. v0 is the polished UI generator backed by Vercel and locked into their stack. Zoobicon is the multi-product ecosystem covering domains, video, email, and hosting.",
    stats: {
      users: "6M+ developers",
      valuation: "Backed by Vercel ($3.5B+)",
    },
    tagline: "Vercel's AI builder with shadcn/ui code quality. v0.app added agentic mode, web search mid-build, GitHub sync, and Vercel deploy.",
    ourPitch:
      "Same React/shadcn quality with no Vercel lock-in, plus real domain registration, AI video, white-label agency, and a 75-product ecosystem.",
    whatTheyDo:
      "v0 generates React + shadcn/ui code — it's known for the highest UI code quality among the major builders. The 2026 push to v0.app added agentic multi-step planning, web search during generation, automatic database connection, and tight GitHub + Vercel deploy integration.",
    theirStrengths: [
      "Best-in-class UI code quality — shadcn/ui patterns, clean React, excellent Tailwind",
      "Tight Vercel integration — one-click deploy, GitHub sync, edge functions, KV/Postgres",
      "6M+ developer audience and Vercel distribution",
      "Agentic mode now plans multi-step builds (not just one-shot UI)",
      "Genuinely useful for Vercel-stack teams already paying for the platform",
    ],
    ourStrengths: [
      "No Vercel lock-in — deploy anywhere, including our own zoobicon.sh hosting",
      "75+ products in one platform vs v0's single-product focus",
      "Real domain search + registration via OpenSRS — v0 has no domain layer",
      "Own AI video pipeline with voice cloning + auto-captions — v0 has no video",
      "Agency white-label tier ($499/mo) — v0 doesn't sell to resellers",
      "Bundled email, hosting, SSL, CDN at $49/mo all-in",
      "Multi-model AI (Claude / GPT / Gemini) — v0 is Anthropic-only",
    ],
    features: [
      { feature: "AI UI / website generation", us: "both", them: "both" },
      { feature: "shadcn/ui code output", us: "both", them: "both" },
      { feature: "Vercel one-click deploy", us: "neither", them: "them" },
      { feature: "Deploy anywhere (Vercel, AWS, self-host)", us: "us", them: "neither" },
      { feature: "Real domain search + registration", us: "us", them: "neither" },
      { feature: "AI domain name generator", us: "us", them: "neither" },
      { feature: "AI video creator", us: "us", them: "neither" },
      { feature: "Bundled hosting + SSL + CDN", us: "us", them: "neither" },
      { feature: "Bundled business email", us: "us", them: "neither" },
      { feature: "Agency white-label", us: "us", them: "neither" },
      { feature: "Multi-model AI", us: "us", them: "neither" },
      { feature: "GitHub sync", us: "both", them: "both" },
    ],
    ourTiers: ZOOBICON_TIERS,
    theirTiers: [
      { name: "Free", price: "$0", highlights: ["Daily message credits", "Public chats"] },
      { name: "Premium", price: "$20 / mo", highlights: ["More messages", "Higher limits"] },
      { name: "Team", price: "$30 / user / mo", highlights: ["Team workspace", "Shared chats"] },
      { name: "Enterprise", price: "Custom", highlights: ["SSO", "Priority"] },
    ],
    verdict:
      "v0 is the right call if you're already on Vercel, want the cleanest shadcn/ui output, and don't need anything outside the React layer. Zoobicon delivers the same UI quality plus everything around it — the 75-product ecosystem that lets you actually run a business.",
    whenToPickThem: "You're a Vercel-stack engineer building a React app inside their ecosystem and you don't need domains, email, or video.",
    whenToPickUs: "You want UI generation AND every operational layer that surrounds it — domains, hosting, email, video, agency tooling — at one price.",
  },

  heygen: {
    slug: "heygen",
    name: "HeyGen",
    url: "https://heygen.com",
    category: "AI Video Generator",
    metaTitle: "Zoobicon vs HeyGen — AI Video Generator Comparison (2026)",
    metaDescription:
      "Honest 2026 comparison of Zoobicon and HeyGen. HeyGen leads avatar quality and language coverage. Zoobicon's pipeline is 10–20× cheaper and bundles video with website, domain, hosting, and email.",
    stats: {
      arr: "$100M+ ARR",
      valuation: "$500M+",
      users: "Millions",
    },
    tagline: "Avatar IV talking heads, LiveAvatar real-time, 175 languages. The leader in spokesperson AI video.",
    ourPitch:
      "Match HeyGen's quality at 10–20× lower per-video cost via Hedra Character-3 + Fish Audio S1 — and bundle video with website builder, domains, hosting, and email at $49/mo.",
    whatTheyDo:
      "HeyGen pioneered the spokesperson AI video category — Avatar IV produces studio-quality talking heads, LiveAvatar enables real-time avatars for sales calls and demos, and they support 175 languages with native lip-sync. They're the quality leader, priced accordingly.",
    theirStrengths: [
      "Avatar IV is the visual quality benchmark — facial micro-expressions are state of the art",
      "175 languages with proper lip-sync — broadest language coverage in the market",
      "LiveAvatar (real-time talking avatar) is a unique enterprise feature",
      "Largest training dataset of consenting actors in the industry",
      "$100M+ ARR with mature enterprise sales motion",
    ],
    ourStrengths: [
      "Hedra Character-3 integration — sub-100ms avatars at $0.05/min (15× cheaper than HeyGen)",
      "Fish Audio S1 — currently #1 on TTS-Arena, beats ElevenLabs, 80% cheaper",
      "Own pipeline (no third-party avatar API dependency) — control quality and pricing",
      "Bundle video with website builder, domains, hosting, email at $49/mo",
      "75+ products in one ecosystem vs HeyGen's single-product focus",
      "Public API at api.zoobicon.ai — resell our pipeline to other developers",
      "Agency white-label tier — HeyGen Enterprise doesn't license to resellers",
      "Auto-captions, B-roll generation, voice cloning all included — no add-on pricing",
    ],
    features: [
      { feature: "Spokesperson talking-head video", us: "both", them: "both" },
      { feature: "Real-time avatars (LiveAvatar)", us: "neither", them: "them" },
      { feature: "175+ language coverage", us: "neither", them: "them" },
      { feature: "Voice cloning from short sample", us: "both", them: "both" },
      { feature: "Auto-captions burned into video", us: "us", them: "them" },
      { feature: "AI background music (MusicGen)", us: "us", them: "neither" },
      { feature: "B-roll generation (Veo / Kling)", us: "us", them: "neither" },
      { feature: "$0.05/min via Hedra Character-3", us: "us", them: "neither" },
      { feature: "Bundled with website builder", us: "us", them: "neither" },
      { feature: "Bundled with domain + hosting + email", us: "us", them: "neither" },
      { feature: "White-label / reseller tier", us: "us", them: "neither" },
      { feature: "Public API for developers", us: "us", them: "us" },
    ],
    ourTiers: ZOOBICON_TIERS,
    theirTiers: [
      { name: "Free", price: "$0", highlights: ["3 minutes / month", "Watermark", "Limited avatars"] },
      { name: "Creator", price: "$29 / mo", highlights: ["15 minutes / month", "No watermark"] },
      { name: "Team", price: "$89 / mo / user", highlights: ["30 minutes / user / month"] },
      { name: "Enterprise", price: "$149+ / mo", highlights: ["Custom seats", "Custom avatars"] },
    ],
    verdict:
      "HeyGen is the right call if you're a large enterprise that needs the absolute peak of avatar fidelity and you have the budget to match. Zoobicon delivers 90% of HeyGen's output quality at a fraction of the cost — and bundles the video pipeline with the website, domain, hosting, and email layers a real business actually needs.",
    whenToPickThem: "You're an enterprise where peak avatar fidelity is the only metric that matters and the price doesn't.",
    whenToPickUs: "You want professional spokesperson video as part of an integrated business platform — not as a $149/mo line item on top of five other SaaS bills.",
  },
};
