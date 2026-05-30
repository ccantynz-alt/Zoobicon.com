/**
 * Competitor catalog for programmatic SEO comparison pages.
 *
 * Each entry produces /compare/[slug] — a long-form, fact-grounded
 * comparison page targeting "[Competitor] alternative" and
 * "[Competitor] vs Zoobicon" queries. The catalog is the single source
 * of truth: feature matrices, pricing, strengths and weaknesses for
 * each competitor all flow through here. Update the doctrine once,
 * 12+ pages refresh on the next build.
 *
 * Why programmatic not hand-written: high-intent search queries
 * ("Lovable alternative", "Bolt vs Zoobicon") have predictable shape.
 * Hand-writing 12 pages takes weeks; data-driving them takes one
 * commit. Each page is still SEO-credible because the data is
 * specific (real ARRs, real pricing, real feature differences) rather
 * than spun.
 *
 * Honesty rule: every "ours" claim must hold up. If we don't ship
 * a feature, the row is false. If a competitor is better at something,
 * we say so. Search engines reward honest comparisons; users punish
 * marketing fluff.
 */

export type FeatureValue = true | false | string;

export interface ComparisonFeature {
  label: string;
  ours: FeatureValue;
  theirs: FeatureValue;
}

export interface PricingTier {
  name: string;
  price: string;
  limits: string;
}

export interface Competitor {
  slug: string;
  name: string;
  tagline: string;
  /** Single sentence the visitor will read in the meta description */
  metaPitch: string;
  /** What they're known for — appears in the hero subhead */
  positioning: string;
  founded: number;
  /** Most recent public funding / ARR datum, with citation source */
  trajectory: string;
  /** What they genuinely do better than us — keep honest */
  strengths: string[];
  /** Where we lead — these become our pitch */
  ourEdge: string[];
  /** Their published pricing tiers */
  pricing: PricingTier[];
  /** Feature-by-feature comparison matrix */
  features: ComparisonFeature[];
  /** FAQ entries — both for users AND for the FAQPage JSON-LD schema */
  faqs: Array<{ q: string; a: string }>;
}

const ZOOBICON_PRICING: PricingTier[] = [
  { name: "Starter", price: "$49/mo", limits: "1 site · 1 domain included" },
  { name: "Pro", price: "$129/mo", limits: "3 sites · 3 domains · Opus 4.7" },
  { name: "Agency", price: "$299/mo", limits: "10 sites · white-label · API access" },
];

const COMMON_OUR_EDGE = [
  "Domain registration baked into the checkout — buy your `.com` in the same Stripe flow as the build (real OpenSRS integration, nobody else has this)",
  "Slot-locked composition + 121-component registry — every section is hand-polished, agency-grade, never generated from scratch",
  "Six visible agents stream live during generation (Strategist, Brand, Architect, Copy, Developer, SEO) — Emergent shows four, most show none",
  "Crontech-delegated infrastructure (auth, hosting, DB, email) — we pour 100% of engineering into builder quality, not reinventing auth",
];

// ─── Lovable ──────────────────────────────────────────────────────────
const lovable: Competitor = {
  slug: "lovable",
  name: "Lovable",
  tagline: "Build apps and websites by chatting with AI",
  metaPitch:
    "Lovable alternative comparison. Zoobicon ships a 121-component registry, domain-in-checkout, and six visible agents — see how they stack up on speed, quality, and price.",
  positioning:
    "$400M ARR full-stack AI app builder that runs Plan Mode, Prompt Queue, and Browser Testing on top of Supabase auto-provisioning.",
  founded: 2024,
  trajectory: "$6.6B valuation (Series B, Dec 2025). $400M ARR by Feb 2026.",
  strengths: [
    "Deep Supabase auto-provisioning — tables, RLS, auth, Edge Functions all wired automatically",
    "Plan Mode and Prompt Queue ship 50 prompts in batch",
    "Massive user base + venture distribution",
  ],
  ourEdge: COMMON_OUR_EDGE,
  pricing: [
    { name: "Free", price: "$0", limits: "5 messages/day" },
    { name: "Starter", price: "$20/mo", limits: "100 messages" },
    { name: "Pro", price: "$50/mo", limits: "Higher limits" },
    { name: "Teams", price: "$100+/mo", limits: "Team seats" },
  ],
  features: [
    { label: "Generates full-stack apps (DB + API + UI)", ours: true, theirs: true },
    { label: "Domain registration in checkout", ours: true, theirs: false },
    { label: "Hand-polished 121-component registry", ours: true, theirs: false },
    { label: "Visible 6-agent streaming UI", ours: true, theirs: false },
    { label: "Supabase auto-provisioning", ours: "Partial", theirs: true },
    { label: "Plan Mode / Prompt Queue", ours: false, theirs: true },
    { label: "Slot-locked composition (no regen for one-line edits)", ours: true, theirs: false },
    { label: "Multi-LLM failover (Claude → GPT → Gemini)", ours: true, theirs: false },
    { label: "Agency white-label tier", ours: true, theirs: false },
    { label: "Free tier", ours: "Demo build", theirs: true },
    { label: "Starting paid price", ours: "$49/mo", theirs: "$20/mo" },
  ],
  faqs: [
    {
      q: "Is Zoobicon a Lovable alternative?",
      a: "Yes — Zoobicon is built for the same job (describe an app, get a working site) but adds domain registration directly inside the build checkout via OpenSRS. Lovable doesn't sell domains; you have to bring your own and wire it separately.",
    },
    {
      q: "Why is Zoobicon more expensive than Lovable's Starter tier?",
      a: "Zoobicon Starter ($49/mo) includes one domain registration plus managed checkout. Lovable's $20/mo Starter doesn't include a domain — by the time you buy one through GoDaddy or Namecheap you're at parity or above.",
    },
    {
      q: "What does Lovable do better than Zoobicon today?",
      a: "Lovable's Supabase auto-provisioning is deeper than ours and they have a massive head start on user base. We close the gap on quality through slot-locked composition and the 121-component registry.",
    },
  ],
};

// ─── Bolt.new ─────────────────────────────────────────────────────────
const bolt: Competitor = {
  slug: "bolt-new",
  name: "Bolt.new",
  tagline: "Prompt-driven dev environment in your browser",
  metaPitch:
    "Bolt.new alternative comparison. See how Zoobicon's domain-in-checkout flow, slot-locked composition, and visible 6-agent UI compare to Bolt's WebContainers and Plan Mode.",
  positioning:
    "$40M ARR StackBlitz spinoff running WebContainers (full Node.js in browser), Plan Mode, and auto-error-fix. 5M+ users.",
  founded: 2024,
  trajectory: "$700M valuation (Series B, Jan 2025). $40M ARR. 5M+ users.",
  strengths: [
    "Sub-5-second first preview thanks to WebContainers",
    "Plan Mode + auto-error-fixing agent",
    "Direct GitHub sync + Figma import",
  ],
  ourEdge: COMMON_OUR_EDGE,
  pricing: [
    { name: "Free", price: "$0", limits: "Daily token cap" },
    { name: "Pro", price: "$20/mo", limits: "Higher limits" },
    { name: "Team", price: "$50+/mo", limits: "Team seats" },
  ],
  features: [
    { label: "First preview <5 seconds", ours: "Pre-warm pending", theirs: true },
    { label: "Full Node.js in browser (WebContainers)", ours: false, theirs: true },
    { label: "Domain registration in checkout", ours: true, theirs: false },
    { label: "Hand-polished 121-component registry", ours: true, theirs: false },
    { label: "Visible 6-agent streaming UI", ours: true, theirs: false },
    { label: "Plan Mode / auto-error-fix", ours: false, theirs: true },
    { label: "GitHub OAuth + push", ours: true, theirs: true },
    { label: "Figma import", ours: false, theirs: true },
    { label: "Agency white-label tier", ours: true, theirs: false },
    { label: "Multi-LLM failover", ours: true, theirs: true },
    { label: "Starting paid price", ours: "$49/mo", theirs: "$20/mo" },
  ],
  faqs: [
    {
      q: "Is Zoobicon faster than Bolt.new?",
      a: "Not yet on first preview — Bolt's WebContainers give them sub-5-second cold starts. Zoobicon's pre-warmed Sandpack approach is closing the gap. Where Zoobicon wins on speed is diff editing: 2-second one-file regenerations vs full rebuilds.",
    },
    {
      q: "Can I import a Figma design into Zoobicon like I can in Bolt?",
      a: "Not directly today. The MCP foundation is in place to wire Figma import in a future release. For now Zoobicon's component registry covers most design patterns without needing an import step.",
    },
    {
      q: "Why use Zoobicon if Bolt is faster?",
      a: "Domain-in-checkout: Bolt doesn't sell domains, you buy them separately. Zoobicon registers your `.com` in the same Stripe flow as the build via OpenSRS — one purchase, live site.",
    },
  ],
};

// ─── v0 (Vercel) ──────────────────────────────────────────────────────
const v0: Competitor = {
  slug: "v0",
  name: "v0 (Vercel)",
  tagline: "Generate React + Tailwind UI from a prompt",
  metaPitch:
    "v0.app alternative. Zoobicon adds domain registration, deploy-anywhere, and a six-agent pipeline. See where v0 still leads and where Zoobicon pulls ahead.",
  positioning:
    "6M+ developers. v0.app expanded from frontend-only into agentic full-stack with DB auto-connect, web search mid-build, and Vercel deploy.",
  founded: 2023,
  trajectory: "Vercel-backed ($3.5B+ valuation). 6M+ developer users.",
  strengths: [
    "Best React/shadcn/ui code quality of any AI builder",
    "Tight Vercel deploy + GitHub sync",
    "Web search mid-build (live data lookups)",
  ],
  ourEdge: [
    ...COMMON_OUR_EDGE,
    "Deploy is platform-agnostic via Crontech — not locked into Vercel hosting",
  ],
  pricing: [
    { name: "Free", price: "$0", limits: "Daily credits" },
    { name: "Premium", price: "$20/mo", limits: "Higher credits" },
    { name: "Team", price: "$30/seat/mo", limits: "Team seats" },
  ],
  features: [
    { label: "Generates React + Tailwind", ours: true, theirs: true },
    { label: "Domain registration in checkout", ours: true, theirs: false },
    { label: "Visible 6-agent streaming UI", ours: true, theirs: false },
    { label: "Hand-polished 121-component registry", ours: true, theirs: "shadcn/ui only" },
    { label: "Web search mid-build", ours: false, theirs: true },
    { label: "Deploys to any host (not Vercel-locked)", ours: true, theirs: false },
    { label: "GitHub OAuth + push", ours: true, theirs: true },
    { label: "Database auto-connect", ours: "Crontech", theirs: true },
    { label: "Multi-LLM failover", ours: true, theirs: false },
    { label: "Agency white-label tier", ours: true, theirs: false },
    { label: "Starting paid price", ours: "$49/mo", theirs: "$20/mo" },
  ],
  faqs: [
    {
      q: "Is v0 better than Zoobicon for React component quality?",
      a: "v0 has an edge on raw shadcn/ui component generation — they helped popularize the pattern. Zoobicon counters with a 121-component registry of hand-polished sections (hero, pricing, features, etc.) that assemble in seconds instead of being regenerated each time.",
    },
    {
      q: "Does Zoobicon lock me to Vercel hosting like v0 does?",
      a: "No. Zoobicon deploys through Crontech, a hosting-agnostic platform. v0's deploy path is tightly integrated with Vercel; if you need different hosting you have to download and deploy manually.",
    },
    {
      q: "Can Zoobicon do everything v0 does?",
      a: "Most of it, plus domain registration which v0 doesn't offer. The one gap is web search mid-build — v0 can pull live data into a generation. That's on our roadmap via MCP.",
    },
  ],
};

// ─── Emergent ─────────────────────────────────────────────────────────
const emergent: Competitor = {
  slug: "emergent",
  name: "Emergent",
  tagline: "Multi-agent AI app builder",
  metaPitch:
    "Emergent alternative. Zoobicon ships 6 visible agents vs Emergent's 4, plus domain-in-checkout and a 121-component registry. Full comparison inside.",
  positioning:
    "$100M ARR. 6M signups, 150K paying. MCP integration LIVE (Notion, GitHub, Figma). Fork Feature for session continuity. Google Play app.",
  founded: 2024,
  trajectory: "$100M ARR by Feb 2026. 6M signups, 150K paying customers.",
  strengths: [
    "MCP integration is LIVE (Notion, GitHub, Figma) — ours is a stub",
    "Fork feature for session continuity",
    "Google Play distribution",
  ],
  ourEdge: [
    "Six visible agents (Strategist, Brand, Architect, Copy, Developer, SEO) vs Emergent's four (Builder/Quality/Deploy/Ops)",
    ...COMMON_OUR_EDGE,
  ],
  pricing: [
    { name: "Free", price: "$0", limits: "10 credits/mo (credits expire)" },
    { name: "Standard", price: "$20/mo", limits: "100 credits" },
    { name: "Pro", price: "$200/mo", limits: "750 credits" },
    { name: "Team", price: "$300/mo", limits: "1,250 shared credits" },
  ],
  features: [
    { label: "Multi-agent visualization", ours: "6 agents", theirs: "4 agents" },
    { label: "Domain registration in checkout", ours: true, theirs: false },
    { label: "Hand-polished 121-component registry", ours: true, theirs: false },
    { label: "MCP integration (Notion, GitHub, Figma)", ours: "Stub", theirs: true },
    { label: "Fork / session continuity", ours: false, theirs: true },
    { label: "Multi-LLM switching", ours: true, theirs: true },
    { label: "Mobile app (Play Store)", ours: false, theirs: true },
    { label: "Slot-locked composition", ours: true, theirs: false },
    { label: "Agency white-label tier", ours: true, theirs: false },
    { label: "Credits expire monthly", ours: false, theirs: true },
    { label: "Starting paid price", ours: "$49/mo (flat)", theirs: "$20/mo (credit-based)" },
  ],
  faqs: [
    {
      q: "How is Zoobicon's multi-agent UI different from Emergent's?",
      a: "Both show agents working. Emergent surfaces four (Builder, Quality, Deploy, Ops). Zoobicon surfaces six named agents (Strategist, Brand Designer, Architect, Copywriter, Developer, SEO) and they stream live during generation with active/done/pending visual states.",
    },
    {
      q: "Why pick Zoobicon's flat $49/mo over Emergent's credit-based pricing?",
      a: "Emergent's credits expire monthly — unused credits don't roll over. Heavy users hit the wall and have to upgrade. Zoobicon's flat tier means predictable monthly cost with no expiry pressure.",
    },
    {
      q: "Does Zoobicon have MCP integration like Emergent?",
      a: "We have the foundation. Emergent shipped real MCP tool connections (Notion, GitHub, Figma). Wiring real MCP tools is on our roadmap — see the URGENT BUILD LIST.",
    },
  ],
};

// ─── Wix ──────────────────────────────────────────────────────────────
const wix: Competitor = {
  slug: "wix",
  name: "Wix",
  tagline: "All-in-one website builder",
  metaPitch:
    "Wix alternative for the AI-first era. Describe a site in one sentence, watch six agents build it, register your domain in the same checkout.",
  positioning:
    "Public Israeli company. Established drag-and-drop builder with 200M+ users and an AI editor (Wix ADI) bolted on.",
  founded: 2006,
  trajectory: "Public (NASDAQ: WIX). $1.6B+ ARR. 200M+ registered users.",
  strengths: [
    "Massive template library (1,000+) and 20-year design polish",
    "Built-in app marketplace (Wix App Market) with hundreds of integrations",
    "Established hosting infrastructure and brand recognition",
  ],
  ourEdge: [
    "Generated from a sentence, not assembled from templates — every site looks bespoke, not Wix-shaped",
    "Code export — leave with your site, never locked into a proprietary builder",
    ...COMMON_OUR_EDGE,
  ],
  pricing: [
    { name: "Free", price: "$0", limits: "Wix-branded subdomain" },
    { name: "Light", price: "$17/mo", limits: "Custom domain" },
    { name: "Core", price: "$29/mo", limits: "Basic eCommerce" },
    { name: "Business", price: "$36/mo", limits: "Full eCommerce" },
  ],
  features: [
    { label: "AI-generated from one prompt", ours: true, theirs: "Wix ADI (legacy)" },
    { label: "Hand-polished React components", ours: true, theirs: false },
    { label: "Domain registration in checkout", ours: true, theirs: true },
    { label: "Code export (own your site)", ours: true, theirs: false },
    { label: "Six visible agents during build", ours: true, theirs: false },
    { label: "App marketplace", ours: false, theirs: true },
    { label: "1,000+ static templates", ours: false, theirs: true },
    { label: "Modern React/Tailwind stack", ours: true, theirs: false },
    { label: "Agency white-label tier", ours: true, theirs: "Wix Studio" },
    { label: "Starting paid price", ours: "$49/mo", theirs: "$17/mo" },
  ],
  faqs: [
    {
      q: "Is Zoobicon a Wix alternative?",
      a: "Yes — for users who want a modern AI-built site instead of a 20-year-old drag-and-drop editor. Wix is template-driven; Zoobicon generates a bespoke site from your description.",
    },
    {
      q: "Can I migrate from Wix to Zoobicon?",
      a: "You can paste your Wix site URL into the builder as inspiration and regenerate a modern React version. Wix's proprietary stack can't be directly exported, so the migration is a rebuild rather than a port.",
    },
    {
      q: "Why is Zoobicon more expensive than Wix's $17 Light tier?",
      a: "Zoobicon Starter ($49) includes domain registration; Wix Light ($17) doesn't include the domain in the first year (it's typically a separate $14.99 charge). Zoobicon also runs on a modern React stack you can export.",
    },
  ],
};

// ─── Squarespace ──────────────────────────────────────────────────────
const squarespace: Competitor = {
  slug: "squarespace",
  name: "Squarespace",
  tagline: "Design-led drag-and-drop builder",
  metaPitch:
    "Squarespace alternative for AI-first websites. Describe a site, watch six agents build it, register the matching domain in one Stripe checkout.",
  positioning:
    "Design-forward template builder. Strong in creator/agency/restaurant verticals. Now bundles AI design assistant.",
  founded: 2003,
  trajectory: "Public (NYSE: SQSP). $1B+ ARR. 4M+ subscribers.",
  strengths: [
    "Iconic editorial template designs — strongest design pedigree in the space",
    "Built-in commerce + booking + member sites",
    "Squarespace Domains is a real ICANN registrar",
  ],
  ourEdge: [
    "Generated bespoke, not selected from a template grid",
    "Same-checkout domain registration via OpenSRS — Squarespace owns the registrar layer but charges full retail",
    ...COMMON_OUR_EDGE,
  ],
  pricing: [
    { name: "Personal", price: "$16/mo", limits: "Basic site" },
    { name: "Business", price: "$23/mo", limits: "Commerce + analytics" },
    { name: "Commerce Basic", price: "$28/mo", limits: "Full e-com" },
    { name: "Commerce Advanced", price: "$52/mo", limits: "Subscriptions + abandoned cart" },
  ],
  features: [
    { label: "AI-generated from one prompt", ours: true, theirs: "AI design assistant" },
    { label: "Hand-polished React components", ours: true, theirs: false },
    { label: "Domain registration in checkout", ours: true, theirs: true },
    { label: "Built-in eCommerce", ours: false, theirs: true },
    { label: "Built-in member sites", ours: false, theirs: true },
    { label: "Code export (own your site)", ours: true, theirs: false },
    { label: "Modern React/Tailwind stack", ours: true, theirs: false },
    { label: "Visible 6-agent UI", ours: true, theirs: false },
    { label: "Agency white-label tier", ours: true, theirs: "Squarespace Circle" },
    { label: "Starting paid price", ours: "$49/mo", theirs: "$16/mo" },
  ],
  faqs: [
    {
      q: "Is Squarespace better than Zoobicon for designers?",
      a: "Squarespace's hand-curated templates set the design bar in the legacy space. Zoobicon counters with a 121-component registry where every section was designed to the same agency bar — and you don't pick a template, you describe and generate.",
    },
    {
      q: "Does Zoobicon do eCommerce like Squarespace?",
      a: "Not as a built-in product surface — Squarespace Commerce is a deep vertical. Zoobicon generates a marketing/checkout site and the eCommerce layer routes through Stripe or integrates via the Crontech infrastructure layer.",
    },
    {
      q: "Why pay $49 for Zoobicon over Squarespace Personal at $16?",
      a: "Squarespace Personal doesn't include a domain after year 1 (it's $20+/yr extra). Zoobicon includes a domain registration in Starter. You also get a modern React codebase you can export and host anywhere.",
    },
  ],
};

// ─── Webflow ──────────────────────────────────────────────────────────
const webflow: Competitor = {
  slug: "webflow",
  name: "Webflow",
  tagline: "Visual builder for production-grade sites",
  metaPitch:
    "Webflow alternative for teams that want AI generation, not drag-and-drop. Zoobicon ships agency-grade React sites from a sentence with the domain bundled in.",
  positioning:
    "Visual no-code builder favoured by agencies. Closest to a real frontend dev environment without writing code. Webflow CMS + Logic for dynamic sites.",
  founded: 2013,
  trajectory: "$4B valuation. 300K+ paying customers, 3.5M+ designers.",
  strengths: [
    "Pixel-perfect visual control — feels like a real dev tool",
    "Webflow CMS for dynamic content",
    "Strong agency ecosystem",
  ],
  ourEdge: [
    "Zero learning curve — describe a site instead of mastering a visual editor",
    "Real domain registration in checkout — Webflow's domain step routes you to GoDaddy",
    ...COMMON_OUR_EDGE,
  ],
  pricing: [
    { name: "Basic", price: "$14/mo", limits: "Static site" },
    { name: "CMS", price: "$23/mo", limits: "Dynamic content" },
    { name: "Business", price: "$39/mo", limits: "High-traffic + member auth" },
    { name: "Enterprise", price: "Custom", limits: "SLA + advanced security" },
  ],
  features: [
    { label: "AI-generated from one prompt", ours: true, theirs: "AI bolt-on" },
    { label: "Hand-polished components", ours: true, theirs: false },
    { label: "Domain registration in checkout", ours: true, theirs: false },
    { label: "Visual editor (post-build)", ours: "Click-to-edit", theirs: true },
    { label: "CMS for dynamic content", ours: "Crontech", theirs: true },
    { label: "Code export", ours: true, theirs: "Paid add-on" },
    { label: "Visible 6-agent UI", ours: true, theirs: false },
    { label: "Modern React/Tailwind stack", ours: true, theirs: false },
    { label: "Agency white-label tier", ours: true, theirs: true },
    { label: "Starting paid price", ours: "$49/mo", theirs: "$14/mo" },
  ],
  faqs: [
    {
      q: "Is Webflow more powerful than Zoobicon?",
      a: "For pixel-perfect visual control of every element, yes. For going from idea to live site in 60 seconds, Zoobicon. Webflow has a learning curve measured in weeks; Zoobicon's is measured in seconds — describe what you want.",
    },
    {
      q: "Can Zoobicon do a CMS-driven site like Webflow?",
      a: "Dynamic content lives in the Crontech database layer we delegate to, not bolted into the builder. For marketing sites and landing pages Zoobicon ships faster; for complex content models Webflow's CMS is still ahead.",
    },
    {
      q: "Is Zoobicon a Webflow alternative for agencies?",
      a: "Yes via the $299/mo Agency tier — white-label, 10 sites, API access. Webflow's agency program is more established but more expensive per seat.",
    },
  ],
};

// ─── Framer ───────────────────────────────────────────────────────────
const framer: Competitor = {
  slug: "framer",
  name: "Framer",
  tagline: "Design tool that publishes to web",
  metaPitch:
    "Framer alternative for AI generation. Describe a site, watch six agents build it, get a production React codebase with the domain registered.",
  positioning:
    "Design-tool DNA. Framer's AI Sites lets designers prompt-generate landing pages and publish from the Framer canvas.",
  founded: 2013,
  trajectory: "$120M+ raised. Strong designer/Figma-adjacent user base.",
  strengths: [
    "Design-tool fluency — best for designers who think in canvases",
    "Strong animation primitives + interaction model",
    "Framer's AI Sites is fast and polished",
  ],
  ourEdge: [
    "Output is a real React codebase you can export, not a Framer-hosted page",
    "Six visible agents (Brand, Copy, Developer, SEO) collaborate during the build, not just one generation pass",
    ...COMMON_OUR_EDGE,
  ],
  pricing: [
    { name: "Free", price: "$0", limits: "Framer subdomain" },
    { name: "Mini", price: "$10/mo", limits: "Custom domain" },
    { name: "Basic", price: "$15/mo", limits: "150 CMS items" },
    { name: "Pro", price: "$25/mo", limits: "1000 CMS items" },
  ],
  features: [
    { label: "AI-generated from one prompt", ours: true, theirs: true },
    { label: "Output is real React code", ours: true, theirs: false },
    { label: "Domain registration in checkout", ours: true, theirs: true },
    { label: "Hand-polished components", ours: true, theirs: true },
    { label: "Visible 6-agent UI", ours: true, theirs: false },
    { label: "Design-tool canvas editor", ours: false, theirs: true },
    { label: "Animation primitives", ours: "Framer Motion", theirs: true },
    { label: "Modern React/Tailwind stack", ours: true, theirs: false },
    { label: "Agency white-label tier", ours: true, theirs: false },
    { label: "Starting paid price", ours: "$49/mo", theirs: "$10/mo" },
  ],
  faqs: [
    {
      q: "Is Framer better for designers than Zoobicon?",
      a: "Framer's canvas + animation tooling is unmatched for designers who think visually. Zoobicon's tradeoff is speed: describe a site in a sentence and ship in 60 seconds without opening a design tool.",
    },
    {
      q: "Can I export my Framer site to React like Zoobicon?",
      a: "Framer locks output to its hosted runtime. Zoobicon outputs a real React/Tailwind codebase you can export and host anywhere — that's a structural moat.",
    },
    {
      q: "Why use Zoobicon over Framer for landing pages?",
      a: "If you can describe what you want better than you can design it on a canvas, Zoobicon wins. Domain-in-checkout means one less tab in the launch flow.",
    },
  ],
};

// ─── Carrd ────────────────────────────────────────────────────────────
const carrd: Competitor = {
  slug: "carrd",
  name: "Carrd",
  tagline: "Simple one-page sites",
  metaPitch:
    "Carrd alternative when you've outgrown one-page sites. Zoobicon generates multi-section React sites with the domain bundled in the checkout.",
  positioning:
    "Single-developer indie product. Ships beautifully simple one-page sites for $19/year. Massive following among indie hackers.",
  founded: 2016,
  trajectory: "Single-founder profitable indie. $19/year pricing.",
  strengths: [
    "Cheapest in the space — $19/year is hard to beat",
    "Single-developer focus, beloved by indie hackers",
    "Truly simple — no AI, no agents, just a one-page builder",
  ],
  ourEdge: [
    "Multi-section sites by default — Carrd is one-page only",
    "AI-generated from a prompt — Carrd is hand-built",
    "Modern React + Tailwind stack vs Carrd's static HTML",
    ...COMMON_OUR_EDGE,
  ],
  pricing: [
    { name: "Free", price: "$0", limits: "Carrd subdomain" },
    { name: "Pro Lite", price: "$9/yr", limits: "Custom domain" },
    { name: "Pro Standard", price: "$19/yr", limits: "Forms + Google Analytics" },
    { name: "Pro Plus", price: "$49/yr", limits: "10 sites + widgets" },
  ],
  features: [
    { label: "AI-generated from one prompt", ours: true, theirs: false },
    { label: "Multi-section / multi-page sites", ours: true, theirs: false },
    { label: "Hand-polished components", ours: true, theirs: "Templates" },
    { label: "Domain registration in checkout", ours: true, theirs: false },
    { label: "Visible 6-agent UI", ours: true, theirs: false },
    { label: "Modern React/Tailwind stack", ours: true, theirs: false },
    { label: "Code export", ours: true, theirs: false },
    { label: "Multi-LLM failover", ours: true, theirs: false },
    { label: "Agency white-label tier", ours: true, theirs: false },
    { label: "Annual price", ours: "$49 + domain", theirs: "$19/yr" },
  ],
  faqs: [
    {
      q: "Should I use Carrd or Zoobicon for a personal landing page?",
      a: "Carrd if you want the cheapest possible one-pager and you'll hand-edit every section. Zoobicon if you want a multi-section site generated from a sentence, with the domain bundled in.",
    },
    {
      q: "Can Zoobicon make a one-page site like Carrd?",
      a: "Yes — just describe a one-page site. The 121-component registry includes hero, features, pricing, CTA, footer sections; the builder will pick the right subset for a one-pager.",
    },
    {
      q: "Why pay Zoobicon's $49/mo over Carrd's $19/year?",
      a: "Different products. Carrd is for indie hackers who want a static one-pager for almost free. Zoobicon is for people who want a full multi-section site generated by AI, domain included, with a modern React codebase they own.",
    },
  ],
};

// ─── Bubble ───────────────────────────────────────────────────────────
const bubble: Competitor = {
  slug: "bubble",
  name: "Bubble",
  tagline: "Visual no-code app builder",
  metaPitch:
    "Bubble alternative for AI-built apps. Skip the visual logic editor — describe your app, watch six agents build it, ship in 60 seconds.",
  positioning:
    "Long-standing no-code platform with a deep visual logic editor and database. Strong in the no-code startup community.",
  founded: 2012,
  trajectory: "$100M+ raised. Largest no-code platform by user count.",
  strengths: [
    "Visual workflow editor — best in the no-code space",
    "Deep marketplace of plugins + templates",
    "Bubble database is mature",
  ],
  ourEdge: [
    "Generated from a prompt vs hand-built workflows — minutes vs weeks",
    "Real React/Tailwind code output you can export and own",
    "Domain-in-checkout — Bubble pushes you to GoDaddy",
    ...COMMON_OUR_EDGE,
  ],
  pricing: [
    { name: "Free", price: "$0", limits: "Bubble subdomain" },
    { name: "Starter", price: "$29/mo", limits: "Limited workload" },
    { name: "Growth", price: "$119/mo", limits: "Multiple apps" },
    { name: "Team", price: "$349/mo", limits: "Team seats" },
  ],
  features: [
    { label: "AI-generated from one prompt", ours: true, theirs: "AI assistant bolt-on" },
    { label: "Visual workflow editor", ours: false, theirs: true },
    { label: "Real React code output", ours: true, theirs: false },
    { label: "Domain registration in checkout", ours: true, theirs: false },
    { label: "Hand-polished components", ours: true, theirs: false },
    { label: "Visible 6-agent UI", ours: true, theirs: false },
    { label: "Marketplace of plugins", ours: false, theirs: true },
    { label: "Database editor", ours: "Crontech", theirs: true },
    { label: "Code export", ours: true, theirs: false },
    { label: "Agency white-label tier", ours: true, theirs: "Bubble Agencies" },
    { label: "Starting paid price", ours: "$49/mo", theirs: "$29/mo" },
  ],
  faqs: [
    {
      q: "Is Bubble more powerful than Zoobicon for apps?",
      a: "For complex stateful apps with deep workflow logic, Bubble's visual editor is more capable today. For marketing sites, landing pages, and simple SaaS frontends, Zoobicon ships faster and outputs cleaner code.",
    },
    {
      q: "Can I move my Bubble app to Zoobicon?",
      a: "Bubble's proprietary runtime can't be directly exported. The migration is a rebuild — paste your Bubble app's URL and Zoobicon's builder can use it as inspiration for a React rewrite.",
    },
    {
      q: "Why use Zoobicon over Bubble for a landing page?",
      a: "Zoobicon will produce the landing page in 60 seconds from one sentence; Bubble requires you to build it visually. Zoobicon also includes the domain registration; Bubble doesn't.",
    },
  ],
};

// ─── Google Stitch ────────────────────────────────────────────────────
const stitch: Competitor = {
  slug: "google-stitch",
  name: "Google Stitch",
  tagline: "Google Labs AI UI generator",
  metaPitch:
    "Google Stitch alternative for production sites. Stitch generates UI exports; Zoobicon generates deployable React sites with the domain registered in checkout.",
  positioning:
    "Free Google Labs product. Natural-language → high-fidelity UI on an infinite canvas. Voice-driven critiques, multi-screen generation, exports to Figma/React/HTML.",
  founded: 2025,
  trajectory: "Free during Labs phase. Google distribution + product DNA.",
  strengths: [
    "Free (during Google Labs phase)",
    "Google distribution + design DNA",
    "Multi-screen generation (5 at once)",
    "Voice-driven design critiques",
  ],
  ourEdge: [
    "Deployable React app vs Stitch's UI export (Stitch doesn't ship a runnable site)",
    "Domain registration baked into checkout",
    "Six visible agents during build vs Stitch's single-shot generation",
    ...COMMON_OUR_EDGE,
  ],
  pricing: [{ name: "Free (Labs)", price: "$0", limits: "Google Labs access" }],
  features: [
    { label: "AI-generated from one prompt", ours: true, theirs: true },
    { label: "Deployable production site", ours: true, theirs: false },
    { label: "Backend / API generation", ours: "Crontech", theirs: false },
    { label: "Domain registration in checkout", ours: true, theirs: false },
    { label: "Voice-driven design critiques", ours: false, theirs: true },
    { label: "Multi-screen generation", ours: true, theirs: true },
    { label: "Hand-polished component registry", ours: true, theirs: false },
    { label: "Code export (React)", ours: true, theirs: true },
    { label: "Visible 6-agent UI", ours: true, theirs: false },
    { label: "Pricing", ours: "$49/mo", theirs: "Free" },
  ],
  faqs: [
    {
      q: "Why pay Zoobicon when Google Stitch is free?",
      a: "Stitch exports UI — it doesn't deploy a working site or handle the backend. Zoobicon outputs a deployable React app with hosting, domain registration, and Stripe checkout all wired through Crontech. Different product category.",
    },
    {
      q: "Is Stitch a real threat to AI website builders?",
      a: "Yes — Google distribution + FREE is a serious wedge. We treat Stitch as a high-priority competitor and audit it monthly. Stitch's gap is the entire deploy + commerce surface.",
    },
    {
      q: "Can I take a Stitch export and bring it to Zoobicon?",
      a: "Stitch can export React + Tailwind. Paste the design or describe what you generated in Stitch and Zoobicon's builder can rebuild it with full deploy + domain flow.",
    },
  ],
};

// ─── Replit Agent ─────────────────────────────────────────────────────
const replit: Competitor = {
  slug: "replit",
  name: "Replit Agent",
  tagline: "AI agent inside the Replit IDE",
  metaPitch:
    "Replit Agent alternative for non-developers. Zoobicon ships a polished site from a sentence; Replit gives you a working agentic dev environment.",
  positioning:
    "Replit's AI agent ships full-stack apps end-to-end. Aimed at developers comfortable in an IDE. Strong on backend / data apps.",
  founded: 2016,
  trajectory: "$1.16B valuation. 22M+ developer users.",
  strengths: [
    "Full Linux dev environment in the browser",
    "Strong backend / data-app generation",
    "Tight integration with Replit hosting + DB",
  ],
  ourEdge: [
    "No IDE knowledge required — describe a site, agents build it, you get a live URL",
    "Visible 6-agent streaming UI vs Replit Agent's linear log output",
    "Domain registration in checkout — Replit doesn't sell domains",
    ...COMMON_OUR_EDGE,
  ],
  pricing: [
    { name: "Free", price: "$0", limits: "Limited Agent runs" },
    { name: "Core", price: "$20/mo", limits: "More Agent credits" },
    { name: "Teams", price: "$35/seat/mo", limits: "Team seats" },
  ],
  features: [
    { label: "AI-generated from one prompt", ours: true, theirs: true },
    { label: "No-IDE UX (write sentence, get site)", ours: true, theirs: false },
    { label: "Domain registration in checkout", ours: true, theirs: false },
    { label: "Hand-polished components", ours: true, theirs: false },
    { label: "Visible 6-agent UI", ours: true, theirs: false },
    { label: "Full Linux dev environment", ours: false, theirs: true },
    { label: "Backend / data-app generation", ours: "Crontech", theirs: true },
    { label: "GitHub OAuth + push", ours: true, theirs: true },
    { label: "Multi-LLM failover", ours: true, theirs: true },
    { label: "Agency white-label tier", ours: true, theirs: false },
    { label: "Starting paid price", ours: "$49/mo", theirs: "$20/mo" },
  ],
  faqs: [
    {
      q: "Is Replit Agent better for developers than Zoobicon?",
      a: "For developers who want full IDE control + backend work, Replit Agent is a stronger fit. For people who'd rather describe a site than write code, Zoobicon ships faster.",
    },
    {
      q: "Can Zoobicon do everything Replit Agent does?",
      a: "Not the deep backend / data-app work — Replit's Linux environment is built for it. Zoobicon's strength is the marketing + commerce frontend, with the backend delegated to Crontech.",
    },
    {
      q: "Why is Zoobicon priced higher than Replit Core?",
      a: "Zoobicon Starter ($49) includes a domain registration; Replit Core ($20) doesn't include any domain at all (you bring your own). Domain inclusive + production deploy via Crontech tighten the bundle.",
    },
  ],
};

// ─── FlutterFlow ──────────────────────────────────────────────────────
const flutterflow: Competitor = {
  slug: "flutterflow",
  name: "FlutterFlow",
  tagline: "Visual builder for Flutter mobile apps",
  metaPitch:
    "FlutterFlow vs Zoobicon: choose mobile-app builder or AI website builder. Different products — see which fits your project.",
  positioning:
    "Builds native iOS + Android Flutter apps from a visual canvas. Strong in the mobile-first startup space.",
  founded: 2020,
  trajectory: "$25M raised. Y Combinator alumnus. 500K+ users.",
  strengths: [
    "Native iOS + Android output via Flutter",
    "App Store / Play Store publishing flow",
    "Tight Firebase integration",
  ],
  ourEdge: [
    "Different product — Zoobicon ships AI-generated websites, FlutterFlow ships mobile apps",
    "For web-first projects, no need to learn Flutter",
    "Domain registration in checkout for web launches",
    ...COMMON_OUR_EDGE,
  ],
  pricing: [
    { name: "Free", price: "$0", limits: "Limited downloads" },
    { name: "Standard", price: "$30/mo", limits: "Unlimited downloads" },
    { name: "Pro", price: "$70/mo", limits: "Custom domains + integrations" },
    { name: "Teams", price: "$70/seat/mo", limits: "Team collaboration" },
  ],
  features: [
    { label: "Output target", ours: "Web (React)", theirs: "Mobile (Flutter)" },
    { label: "AI-generated from one prompt", ours: true, theirs: "AI Gen" },
    { label: "App Store / Play Store deploy", ours: false, theirs: true },
    { label: "Domain registration in checkout", ours: true, theirs: false },
    { label: "Hand-polished components", ours: true, theirs: true },
    { label: "Visible 6-agent UI", ours: true, theirs: false },
    { label: "Code export", ours: true, theirs: true },
    { label: "Modern React/Tailwind stack", ours: true, theirs: "Flutter/Dart" },
    { label: "Agency white-label tier", ours: true, theirs: false },
    { label: "Starting paid price", ours: "$49/mo", theirs: "$30/mo" },
  ],
  faqs: [
    {
      q: "Is FlutterFlow a Zoobicon competitor?",
      a: "Adjacent, not direct — FlutterFlow ships mobile apps, Zoobicon ships websites. Pick FlutterFlow for native iOS/Android; pick Zoobicon for web.",
    },
    {
      q: "Can Zoobicon make a mobile app?",
      a: "Not natively. Zoobicon outputs responsive React websites that work well on mobile browsers. For a native iOS/Android app, FlutterFlow or React Native are better fits.",
    },
    {
      q: "Why is Zoobicon priced similarly to FlutterFlow?",
      a: "Different products in the same approximate price band. Zoobicon's $49 Starter includes a domain registration; FlutterFlow's $30 Standard requires you to bring your own Apple Developer / Google Play accounts.",
    },
  ],
};

// ─── The catalog ──────────────────────────────────────────────────────
export const COMPETITORS: Competitor[] = [
  lovable,
  bolt,
  v0,
  emergent,
  wix,
  squarespace,
  webflow,
  framer,
  carrd,
  bubble,
  stitch,
  replit,
  flutterflow,
];

export function getCompetitor(slug: string): Competitor | undefined {
  return COMPETITORS.find((c) => c.slug === slug);
}

export { ZOOBICON_PRICING };
