# Zoobicon Technical Blueprint

> **Purpose:** mirror this exact build into a new Claude session, or onboard a new engineer in 30 minutes.
> **Last reconciled with reality:** 2026-05-13.
> **Authoritative source for live decisions:** `CLAUDE.md`. If this file disagrees with `CLAUDE.md`, `CLAUDE.md` wins.

---

## CORE ARCHITECTURE

### Framework
- **Next.js 14.2** (App Router, Server Components, streaming SSR) — Vercel deploys to `iad1`
- **React 18.3** with TypeScript 5.9 (strict — no `any` without an inline comment)
- **Tailwind CSS 3.4** for all styling — no styled-jsx, no CSS-in-JS, no CSS modules
- **Sandpack** (`@codesandbox/sandpack-react` 2.20) for in-browser React preview — pre-warmed at idle
- **Monaco Editor** (`@monaco-editor/react` 4.7) for in-browser code editing
- **Framer Motion 12.38** for animations
- **lucide-react 1.7** for icons (tree-shaken, validated by `scripts/check-icons.js`)

### AI pipeline
- **Multi-LLM:** Anthropic primary, OpenAI + Gemini failover via `src/lib/llm-provider.ts` → `callLLMWithFailover`.
- **Canonical builder model: `claude-opus-4-7`** (Rule 4 in `CLAUDE.md` — non-negotiable, never downgrade). Haiku for intent classification + planning; Sonnet for enhancers and edit endpoint.
- **Output format:** React + TypeScript + Tailwind components — never static HTML. Anything in this repo that still says "HTML output" is legacy.
- **7-agent pipeline** in `src/lib/agents.ts`: Strategist → Brand Designer + Copywriter + Architect (parallel) → Developer (Opus 4.7) → SEO + Animation enhancers (parallel). Foundation file is 51KB; UI currently calls `/api/generate/react-stream` directly rather than `/api/generate/pipeline`.

### Database
- **Neon serverless Postgres** via `@neondatabase/serverless`
- Tables include: `users`, `projects`, `sites`, `deployments`, `usage_tracking`, `referrals`, `activities`, `agent_runs`, `agent_tasks`, `market_intel`, `domain_registrations`, plus more
- Bootstrap via `/api/db/init` (idempotent, Craig runs once post-deploy)

### Payments
- **Stripe 21.0** — Starter ($49), Pro ($129), Agency ($299), White-label ($499). Plus pay-per-domain checkout and video credit packs.

### Email
- **Mailgun** is the only email provider (Rule 7 in `CLAUDE.md` — never add Google Workspace).
- Cloudflare Email Routing forwards `admin@` and `support@` to a Zoho inbox.
- Shared template at `src/lib/email-template.ts` includes the mandatory 4-domain signature: `zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh`.

### Hosting
- **Vercel** for the platform (iad1 region).
- **`*.zoobicon.sh`** for customer-deployed sites (served by `GET /api/hosting/serve/[slug]`).
- **Cloudflare** for DNS + SSL across all 5 Zoobicon domains.

### Video pipeline (Rule 19 — own stack, NO HeyGen as primary)
1. **TTS** — Fish Audio S1 (currently #1 on TTS-Arena2, beats ElevenLabs), with ElevenLabs / Cartesia Sonic-3 fallback. Multi-language dub supports 50+ languages.
2. **Avatar** — Hedra Character-3 (sub-100ms real-time, $0.05/min) is the upgrade target; current chain runs FLUX-Schnell → FLUX-Dev → SDXL-Lightning → SD3 on Replicate.
3. **Lip-sync** — SadTalker → Video-Retalking (×2 variants) → Wav2Lip (×2 variants) chain on Replicate.
4. **Captions** — Whisper on Replicate → SRT → burned into final clip.
5. **B-roll** — Veo 3.1 / Seedance 2.0 / Kling 3.0 via fal.ai. Runway Gen-4 as professional tier.

HeyGen integration files (`src/lib/heygen.ts`) remain as legacy and are **not** the primary path.

---

## REAL BUILD STATS (audited 2026-05-13)

| Category | Count | How to verify |
|---|---|---|
| Pages | **165** | `find src/app -name "page.tsx" \| wc -l` |
| API routes | **576** | `find src/app/api -name "route.ts" \| wc -l` |
| Layouts | **87** | `find src/app -name "layout.tsx" \| wc -l` |
| Lib modules | **254** | `find src/lib -name "*.ts" -not -name "*.d.ts" \| wc -l` |
| Shared components | **77** | `find src/components -name "*.tsx" \| wc -l` |
| Registry components | **118** | `grep -rh "registerComponent(" src/lib/component-registry/ \| wc -l` |

Earlier copies of this file claimed 116 pages / 201 routes / 78 components / 77 lib. All stale. Always re-count before quoting.

---

## KEY DEPENDENCIES (package.json — audited 2026-05-13)

| Package | Version | Notes |
|---|---|---|
| `next` | ^14.2.0 | Vercel runs 14.2.x. Do **not** add Next 15/16-only config keys (e.g. `turbopack`). |
| `react` | ^18.3.0 | React 19 upgrade is a §2 authorization decision. |
| `typescript` | 5.9.3 | |
| `tailwindcss` | ^3.4.0 | v4 is on EVALUATE — not adopted. |
| `@anthropic-ai/sdk` | ^0.80.0 | Was 0.39 in March 2026; upgraded to 0.80. |
| `stripe` | ^21.0.1 | Was 20.4; upgraded to 21.0. |
| `framer-motion` | ^12.38.0 | |
| `lucide-react` | ^1.7.0 | Validated by `scripts/check-icons.js` pre-push. |
| `@codesandbox/sandpack-react` | ^2.20.0 | Pre-warmed in `src/components/SandpackPreview.tsx`. |
| `@monaco-editor/react` | ^4.7.0 | |
| `@neondatabase/serverless` | ^1.0.2 | |

`ignoreBuildErrors: true` and `ignoreDuringBuilds: true` are intentional in `next.config.js` — they exist because some legacy files have ESLint issues that are tracked but not yet fixed. Lint runs as a separate CI step. Do not remove without fixing the underlying lints in `src/app/api/marketplace/install/route.ts` and `src/app/builder/page.tsx`.

---

## GENERATION ARCHITECTURE

### React-stream pipeline (primary path)

```
User prompt
  → POST /api/generate/react-stream
  → Haiku classifies intent + selects components from the 118-item registry (~1s)
  → For each selected component:
      → customizeComponent() runs callLLMWithFailover (Haiku → Sonnet → OpenAI → Gemini)
      → component streamed to client as an SSE event with typed {ok, code, reason, modelUsed}
      → Sandpack renders progressively in browser
  → First component visible <3s (with Sandpack pre-warm), full site <30s
```

Failure paths are surfaced — `customizeComponent` returns `{ok: false, reason, failedSections}` rather than swallowing errors and falling back to placeholder templates. This was the Law 8/9 violation fixed on 2026-04-08.

### Diff editing (`/api/generate/edit`)

```
User: "make the header blue"
  → /api/generate/edit POST with current files + edit prompt
  → Smart context truncation for large projects
  → Anthropic Haiku → Sonnet → OpenAI → Gemini failover chain
  → Returns only changed files (typically 1-2)
  → Builder merges into existing file map → Sandpack hot-reloads
  → Total: 2-5 seconds
```

Wired into both `PromptInput` and `ChatPanel` in the builder. Admin users get an `x-admin` header for unlimited access.

### Component registry (`src/lib/component-registry/`)

118 React section components, split across:

| File | Components | Notes |
|---|---|---|
| `heroes.ts` | 12 | Includes `hero-text-reveal` (word-by-word blur animation) |
| `navbars.ts` | 8 | Scroll-aware, glass, mega menu variants |
| `features.ts` | 9 | Includes `features-bento-grid` and `features-spotlight-cards` (cursor-tracking) |
| `testimonials.ts` | 6 | Aggregate ratings, featured cards |
| `footers.ts` | 7 | Luxury, mega, SaaS-gradient |
| `extras.ts` | 27 | Stats (animated counter), FAQ, CTA (gradient-border), about, contact, gallery, blog, logos-marquee |
| `sections.ts` | 49 | Catch-all for less-categorised sections |

Every component is registered with `registerComponent({ id, category, code, ... })` and selected by Haiku at build time. Adding a new component is a matter of dropping a `registerComponent` call into the relevant file.

### Sandpack preview (`src/components/SandpackPreview.tsx`)
- Template: `react-ts`
- External CSS: Tailwind via CDN
- Pre-warm path declares `lucide-react`, `framer-motion`, `clsx`, `tailwind-merge` in `customSetup.dependencies` during idle so they bundle before the first real prompt.
- Theme: editorial-light (Rule 29) — bone background, cream surfaces, near-black ink, champagne accent.

---

## AUTONOMOUS AI AGENTS

The `src/agents/` framework supports background agents (BaseAgent + AgentRegistry + AgentStore + event bus, cron-driven via `/api/agents/cron`). Active agents include site monitor, support responder, competitive intel, email campaign sender, abuse detector, revenue monitor, quality auditor, uptime monitor, error prevention, auto-healer, performance guardian, onboarding watchdog, billing guardian, security sentinel, SEO auto-fix, deployment guardian, market crawler.

**Note:** `src/lib/agents.ts` (the 51KB 7-agent build pipeline) and the agent framework in `src/agents/` are different things. The build pipeline is per-request and synchronous; the framework agents are scheduled background workers. Both exist. Don't confuse them.

---

## MULTI-DOMAIN ECOSYSTEM

| Domain | Purpose | Status |
|---|---|---|
| `zoobicon.com` | Primary platform | Active |
| `zoobicon.ai` | AI brand identity | Active |
| `zoobicon.io` | Developer + public API | Active |
| `zoobicon.sh` | Customer site hosting | Active |
| `zoobicon.app` | Mobile admin command centre | Active (registered 2026-03-28) |

Middleware in `src/middleware.ts` detects the host header and rewrites the root path. All five share this codebase.

**Dominat8 is a separate repo.** Do not add `/dominat8` routes here. See `DOMINAT8_CLAUDE.md` (in the Dominat8 repo) for that codebase.

---

## SEO INFRASTRUCTURE

- 165 pages with unique metadata (title, description, OG tags)
- 50 country-specific eSIM pages at `/esim/[country]`
- 10 industry pages at `/for/[industry]`
- Competitor comparison at `/compare`
- Domain search marketing at `/domains` and 6 TLD-specific landing pages
- Structured data: Organization, SoftwareApplication, FAQPage, BreadcrumbList, Product
- Hreflang tags linking all 4 Zoobicon brand domains
- Sitemap with 90+ URLs
- Speculation Rules API for instant page prerendering
- `AutoIndexNow` component for automatic search-engine submission
- `llms.txt` for AI search discovery (ChatGPT, Perplexity)
- `ai-plugin.json` for OpenAI plugin manifest
- View Transitions API enabled

---

## AUTH & SECURITY

### Auth guard (`src/lib/auth-guard.ts`)
- Email/password + Google OAuth + GitHub OAuth
- Email verification required for generation (admin/unlimited users skip)
- Graceful fallback if `email_verified` column is missing from DB
- Plan limits per tier: Free 1/mo, Creator 15, Pro 50, Agency 200
- Rate limiting per plan tier

### Anti-crawl protection
- `robots.txt` allows only Googlebot, Bingbot, DuckDuckBot
- Blocked: GPTBot, SemrushBot, AhrefsBot, Bytespider, Scrapy, CCBot, others
- Middleware returns 403 for known scraper user agents
- `X-Robots-Tag: noai, noimageai` on all responses

### Staging/production split
- Detected via `VERCEL_ENV`
- Background agents disabled on preview deployments
- Emails logged (not sent) on preview
- Staging banner on non-production
- PR template with pre-merge checklist

### Public API v1 (`/api/v1/*`)
- Stateless HMAC-SHA256 keys (`zbk_live_*`)
- Do not change the auth scheme without updating every v1 route

---

## DOMAIN SEARCH

- **OpenSRS / Tucows** wholesale for real registry lookups (`LOOKUP` command, MD5 signature in `src/lib/opensrs.ts`).
- **DNS fallback** via Google DNS / RDAP if OpenSRS fails.
- Server-side concurrency limit of 4 parallel RDAP calls per `/api/domains/search` batch.
- Client worker pool of 4 concurrent search calls.
- Default 12 names × 3 TLDs (com/ai/io) = 36 checks (not 24×5=120 which got rate-limited).
- RDAP cache with 10-minute TTL.
- 429 retry with jitter.
- Visible red error banner when all checks return unknown (Law 8 fix from 2026-04-08).

---

## ENVIRONMENT VARIABLES

```
# AI (at least one required)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_AI_API_KEY=

# Database
DATABASE_URL=

# Payments
STRIPE_SECRET_KEY=
STRIPE_CREATOR_PRICE_ID=
STRIPE_PRO_PRICE_ID=
STRIPE_AGENCY_PRICE_ID=
STRIPE_WEBHOOK_SECRET=

# Email
MAILGUN_API_KEY=
MAILGUN_DOMAIN=

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_OAUTH_CLIENT_ID=
GITHUB_OAUTH_CLIENT_SECRET=

# Domains
OPENSRS_API_KEY=
OPENSRS_RESELLER_USER=
OPENSRS_ENV=live

# Video
REPLICATE_API_TOKEN=
FAL_KEY=
ELEVENLABS_API_KEY=

# Cloud
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=

# Optional product backends
CELITECH_API_KEY=          # eSIM (currently Coming Soon without)
DEEPGRAM_API_KEY=          # AI Dictation
SUPABASE_ACCESS_TOKEN=     # Auto-provision DBs for generated apps

# CI
GATE_TEST_API_URL=
GATE_TEST_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://zoobicon.com
ADMIN_NOTIFICATION_EMAIL=
RESET_TOKEN_SECRET=
```

`HEYGEN_API_KEY` and `RUNWAY_API_KEY` are no longer required — Rule 19 made the video pipeline self-owned.

---

## CRITICAL DECISIONS FROM `CLAUDE.md`

These cannot be reversed without explicit written authorization from Craig (§2 in `CLAUDE.md`). The full list is 29 numbered rules; the ones that most often get challenged:

1. **Rule 4 — Opus for builds.** Developer agent uses `claude-opus-4-7`. Never downgrade to Sonnet or older Opus. The Anthropic SDK version (0.80) is updated independently.
2. **Rule 6 — Component library injection is mandatory.** Every generated site gets `src/lib/component-library.ts` CSS. Without it, buttons render invisible.
3. **Rule 7 — Email is Mailgun-only.** No Google Workspace, no SendGrid, no SES.
4. **Rule 9 — Never commit secrets.** A previous Mailgun leak caused a two-week shutdown.
5. **Rule 11 — Four-domain signature** on every external communication.
6. **Rule 19 — Own video stack.** No HeyGen as primary path.
7. **Rule 21 — No flip-flopping on architecture.** Once a decision is locked in `CLAUDE.md`, it stays.
8. **Rule 26 — Never ask permission to build.** Craig is not the bottleneck. Build, push, keep going.
9. **Rule 28 — Proactive competitive intelligence is mandatory.** Web search competitors before writing code each session.
10. **Rule 29 — Editorial-light palette.** No dark surfaces, no midnight blue. Reference: holdenmercer.com.

The 80-90% rule applies to every shippable feature: if a competitor has it, we have it better or it's not done.

---

## FILE STRUCTURE

```
/
├── packages/agents/                # @zoobicon/agents npm package (open-core)
├── public/                         # Static assets
├── src/
│   ├── agents/                     # Autonomous AI agents framework
│   │   ├── base.ts                 # BaseAgent abstract class
│   │   ├── registry.ts             # Registration + scheduling
│   │   ├── store.ts                # Postgres + InMemory persistence
│   │   ├── index.ts                # All agent imports
│   │   └── *.ts                    # Individual agents
│   ├── app/
│   │   ├── admin/                  # 16+ admin pages + mobile command centre
│   │   ├── api/                    # 576 API routes
│   │   │   ├── generate/           # AI generation (react, react-stream, edit, pipeline, images)
│   │   │   ├── video-creator/      # Script, voiceover, render, chat
│   │   │   ├── domains/            # Search, register, checkout, manage, DNS
│   │   │   ├── auth/               # Login, signup, OAuth, password reset
│   │   │   ├── hosting/            # Deploy, serve, DNS, SSL, CDN
│   │   │   ├── stripe/             # Checkout, portal, webhook
│   │   │   ├── agents/             # Agent management + cron
│   │   │   ├── intel/              # Competitor + technology crawlers
│   │   │   ├── v1/                 # Public API (HMAC-SHA256)
│   │   │   └── ...                 # Many more
│   │   ├── builder/                # AI website builder
│   │   ├── video-creator/          # 3-step chat-based video creator
│   │   ├── domains/                # Domain search + TLD landing pages
│   │   ├── esim/[country]/         # 50 country-specific SEO pages
│   │   ├── for/[industry]/         # Industry SEO pages
│   │   ├── tools/                  # 12 free SEO tools
│   │   ├── products/               # 10 product pages
│   │   └── auth/                   # Login, signup, OAuth pages
│   ├── components/                 # 77 shared React components
│   │   ├── SandpackPreview.tsx     # Pre-warmed in-browser React preview
│   │   ├── ReactCodeEditor.tsx     # Monaco editor
│   │   ├── SiteNavigation.tsx      # Editorial-light header
│   │   ├── PromptInput.tsx         # Builder prompt + edit
│   │   ├── ChatPanel.tsx           # Builder chat (also routes edits)
│   │   ├── PreviewPanel.tsx        # Viewport switching
│   │   ├── GitHubSyncPanel.tsx     # OAuth + create/push/update
│   │   ├── CookieConsent.tsx       # GDPR/CCPA
│   │   └── ...
│   └── lib/                        # 254 modules
│       ├── agents.ts               # 7-agent build pipeline (51KB)
│       ├── llm-provider.ts         # Multi-LLM abstraction
│       ├── component-registry/     # 118 React section components
│       ├── scaffold-engine.ts      # Instant-scaffold pre-build
│       ├── templates.ts            # Template library
│       ├── opensrs.ts              # OpenSRS/Tucows domain API
│       ├── auth-guard.ts           # Authentication + authorization
│       ├── component-library.ts    # CSS design system (mandatory injection)
│       ├── brand-config.ts         # White-label brand system
│       ├── environment.ts          # Staging/production detection
│       ├── email-template.ts       # Shared email + 4-domain signature
│       ├── video-pipeline.ts       # Own video stack
│       ├── stripe.ts               # Payments
│       ├── mailgun.ts              # Transactional email
│       ├── db.ts                   # Neon connection
│       ├── webcontainers-adapter.ts# Scaffolded — awaiting StackBlitz license
│       ├── crontech-adapter.ts     # Scaffolded — awaiting API docs
│       ├── gate-test-hook.ts       # Browser AI test agent
│       └── ...
├── e2e/                            # GateTest specs (NOT Playwright)
├── tests/                          # Vitest unit (7 files, 180+ cases)
├── scripts/
│   ├── check-icons.js              # Pre-push lucide validator
│   └── claude-md-audit.js          # `npm run audit` — CLAUDE.md freshness
├── .github/workflows/
│   ├── ci.yml                      # quality gate → icon check → lint → unit → build → GateTest
│   ├── post-deploy.yml             # Smoke + GateTest against production
│   └── critical-deps-guard.yml     # Prevents auto-fix bots from removing required deps
├── CLAUDE.md                       # Operating doctrine — source of truth
├── README.md                       # Public landing page for the repo
├── CHANGELOG.md                    # Human-readable shipping log
├── PRODUCT_ROADMAP.md              # Task-level backlog with statuses
├── ZOOBICON-BLUEPRINT.md           # This file
├── next.config.js
├── vercel.json                     # Cron jobs + function config
└── package.json
```

---

## HOW TO REPLICATE THIS BUILD

1. Clone the repository.
2. `npm install`.
3. Copy `.env.local.example` to `.env.local` and fill in the variables above.
4. `npm run dev` for local development (http://localhost:3000).
5. Push to GitHub → connect to Vercel for deployment.
6. Set environment variables in the Vercel dashboard.
7. After first deploy: visit `/api/db/init` once to provision the Neon tables.
8. Cron jobs in `vercel.json` auto-start the background agents and model warmup.

`CLAUDE.md` contains the full operating doctrine — the Iron Law, the §2 authorization list, the 29 locked decisions, the URGENT BUILD LIST, the violations log, and the live repo status. Any Claude session in this repo should open it before writing code.
