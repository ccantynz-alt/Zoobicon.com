# Zoobicon Complete Technical Blueprint
## For mirroring this exact build to another Claude session

---

## CORE ARCHITECTURE

### Framework
- **Next.js 14** (App Router) with React 18
- **TypeScript** throughout
- **Tailwind CSS** for all styling
- **Sandpack** (@codesandbox/sandpack-react) for in-browser React preview
- **Monaco Editor** (@monaco-editor/react) for VS Code-like code editing
- **Framer Motion** for animations
- **Lucide React** for icons

### AI Pipeline
- **Multi-LLM**: Anthropic Claude (primary), OpenAI GPT, Google Gemini
- **Current default model**: Claude Sonnet 4.6 (switched from Opus due to 529 overload)
- **Generation format**: React/TypeScript components with Tailwind (NOT HTML)
- **7-agent build pipeline**: Strategist → Brand Designer → Copywriter → Architect → Developer → SEO Agent → Animation Agent

### Database
- **Neon** (serverless Postgres) via `@neondatabase/serverless`
- Tables: users, projects, sites, deployments, usage_tracking, referrals, activities, agent_runs, agent_tasks, market_intel, and more

### Payments
- **Stripe** with 4 tiers: Free ($0), Creator ($19/mo), Pro ($49/mo), Agency ($99/mo)

### Email
- **Mailgun** (primary) with AWS SES fallback
- Shared email template with 4-domain footer signature

### Hosting
- **Vercel** for the platform itself
- **zoobicon.sh** for deployed user sites

---

## BUILD STATS

| Category | Count |
|----------|-------|
| API Routes | 201 |
| Pages | 116 |
| Components | 78 |
| Lib modules | 77 |
| AI Agents | 22 |
| Total files | 500+ |

---

## KEY DEPENDENCIES (package.json)

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "@codesandbox/sandpack-react": "^2.20.0",
    "@monaco-editor/react": "^4.7.0",
    "@neondatabase/serverless": "^1.0.2",
    "framer-motion": "^12.35.1",
    "lucide-react": "^0.577.0",
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "stripe": "^20.4.1"
  }
}
```

---

## GENERATION ARCHITECTURE

### React Output Pipeline (NEW — Primary)

```
User Prompt
  ↓
classifyIndustry(prompt) → "saas" | "agency" | "startup" | etc.
  ↓
getScaffoldForIndustry(industry) → Pre-built React components
  ↓
Sandpack renders scaffold instantly (<1 second)
  ↓
POST /api/generate/react → Claude Sonnet generates custom React components
  ↓
AI output: { files: { "App.tsx": "...", "components/Hero.tsx": "...", ... }, dependencies: {} }
  ↓
Sandpack renders custom components (replaces scaffold)
  ↓
User sees final site in browser (total: <30 seconds)
```

### API Endpoint: /api/generate/react
- Model: Claude Sonnet 4.6 (all users during testing)
- Max tokens: 32,000
- Timeout: 300 seconds (maxDuration), 240 seconds (client)
- Auth: requireAuth + requireVerified
- Output: JSON with `files` (React components) and `dependencies`
- Minimum 9 components: Navbar, Hero, Features, About, Testimonials, Stats, FAQ, CTA, Footer

### Scaffold System (src/lib/react-scaffolds.ts)
- 9 pre-built React components: Nav, Hero Split, Features Grid, Testimonials, Pricing, Stats Bar, FAQ Accordion, CTA, Footer
- 3 industry templates: SaaS, Agency, Startup
- Assembly function: `assembleScaffold(template)` → Sandpack-ready file map
- Industry classifier: `classifyIndustry(prompt)` → keyword-based detection

### Preview: Sandpack (src/components/SandpackPreview.tsx)
- Template: `react-ts`
- External resources: Tailwind CSS via CDN
- Theme: Custom Zoobicon dark theme
- Supports both HTML mode (legacy) and React mode (primary)
- Auto-generates index.tsx entry point if missing

### Code Editor: Monaco (src/components/ReactCodeEditor.tsx)
- VS Code-like in-browser editing
- File tree sidebar
- Syntax highlighting for TypeScript, CSS, JSON
- Dark theme

### GitHub Export: /api/export/github
- Generates complete Next.js 15 project:
  - package.json (Next.js 15, React 19, Tailwind, TypeScript)
  - tsconfig.json, tailwind.config.ts, postcss.config.js
  - src/app/layout.tsx, src/app/page.tsx, src/app/globals.css
  - src/components/* (all generated components)
  - .gitignore, README.md with Vercel deploy button

---

## 22 AUTONOMOUS AI AGENTS

### Agent Framework (src/agents/)
- BaseAgent abstract class with lifecycle, task queue, retry logic
- AgentRegistry with scheduling
- AgentStore interface (InMemory + Postgres implementations)
- Event bus for observability
- Cron: /api/agents/cron runs every 5 minutes

### Agent List

| # | Agent | Schedule | Purpose |
|---|-------|----------|---------|
| 1 | Site Monitor | 24h | Audits deployed sites for quality |
| 2 | Support Responder | 5m | Auto-drafts support ticket replies |
| 3 | Competitive Intel | 12h | Crawls competitors for changes |
| 4 | Email Campaign | 5m | Sends scheduled campaigns |
| 5 | Daily To-Do | Daily | Emails daily summary |
| 6 | Abuse Detector | 10m | Catches spam and abuse |
| 7 | Revenue Monitor | 6h | Tracks revenue, alerts on drops |
| 8 | Quality Auditor | 4h | Checks deployed site quality |
| 9 | Uptime Monitor | 5m | Pings all services |
| 10 | Error Prevention | 2m | Catches API errors |
| 11 | Auto-Healer | 5m | Fixes known issues automatically |
| 12 | Performance Guardian | 15m | Monitors generation speed |
| 13 | Onboarding Watchdog | 1h | Nurtures new users |
| 14 | Billing Guardian | 2h | Prevents payment failures |
| 15 | Security Sentinel | 5m | Blocks brute force/XSS |
| 16 | SEO Auto-Fix | 6h | Fixes SEO issues on deployed sites |
| 17 | Deployment Guardian | 10m | Validates every deployment |
| 18 | Market Crawler | 12h | Crawls 12 competitors for features |

---

## MULTI-DOMAIN ECOSYSTEM

| Domain | Purpose | Route |
|--------|---------|-------|
| zoobicon.com | Primary — Build | / |
| zoobicon.ai | AI-focused | /ai |
| zoobicon.io | Developer/API | /io |
| zoobicon.sh | Hosting/CLI | /sh |
| dominat8.io | Aggressive brand | /dominat8 |
| dominat8.com | Aggressive brand | /dominat8 |

Middleware detects domain → rewrites root path. All domains share the same codebase.

---

## SEO INFRASTRUCTURE

- **120+ pages** with unique metadata (title, description, OG tags)
- **20 country pages** (/us, /uk, /ca, /au, /de, /fr, /es, /it, etc.)
- **10 industry pages** (/for/restaurants, /for/saas, /for/real-estate, etc.)
- **Competitor comparison** (/compare)
- **Domain search marketing** (/domain-search)
- **Structured data**: Organization, SoftwareApplication, FAQPage, BreadcrumbList, Product schemas
- **Hreflang tags** linking all 4 Zoobicon domains
- **Sitemap**: 90+ URLs with country/industry pages
- **Speculation Rules API** for instant page prerendering
- **AutoIndexNow** component for automatic search engine submission
- **llms.txt** for AI search discovery (ChatGPT, Perplexity)
- **ai-plugin.json** for OpenAI plugin manifest
- **View Transitions API** enabled

---

## AUTH & SECURITY

### Auth Guard (src/lib/auth-guard.ts)
- Email/password login + Google/GitHub OAuth
- Email verification required for generation
- Admin/unlimited users skip verification
- Graceful fallback if email_verified column missing from DB
- Plan limits: Free (1 gen/mo), Creator (15), Pro (50), Agency (200)
- Rate limiting per plan tier

### Anti-Crawl Protection
- robots.txt: Only Googlebot, Bingbot, DuckDuckBot allowed
- Blocked: GPTBot, SemrushBot, AhrefsBot, Bytespider, Scrapy, CCBot, etc.
- Middleware: Known scraper user agents get 403 Forbidden
- X-Robots-Tag: noai, noimageai on all responses

### Staging/Production Split
- Environment detection via VERCEL_ENV
- Agents disabled on preview deployments
- Emails logged (not sent) on preview
- Staging banner component on non-production
- PR template with pre-merge checklist

---

## VIDEO CREATOR

### Pipeline
1. **Script Generation** — Claude Sonnet (AI writes the script)
2. **Storyboard** — Claude Sonnet (scenes, camera movements, music cues)
3. **Scene Images** — Replicate FLUX / OpenAI DALL-E / Stability AI
4. **Voiceover** — ElevenLabs / PlayHT / Browser TTS fallback
5. **Subtitles** — SRT/VTT generation (5 caption styles)
6. **Video Rendering** — Runway Gen-3 Alpha (prompt capped at 500 chars)
7. **AI Spokesperson** — HeyGen (8 avatar presets)

### Social Publishing
- Auto-post to TikTok, YouTube Shorts, Instagram Reels
- AI-generated captions and hashtags per platform
- Video series creator (batch 5-30 episodes)

---

## DOMAIN SEARCH

### Real Availability Checking
- **OpenSRS/Tucows** API for real registry lookups
- **DNS fallback** via Google DNS if OpenSRS fails
- Helper: src/lib/opensrs.ts (LOOKUP command, MD5 signature)
- API: /api/domains/search?q=name&tlds=com,ai,io
- UI: /domains — clean search with extension toggles
- Pricing: 13 TLDs from $2.99/yr (xyz) to $79.99/yr (ai)

---

## KEY ENVIRONMENT VARIABLES

```
# AI
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
HEYGEN_API_KEY=
RUNWAY_API_KEY=
REPLICATE_API_TOKEN=
ELEVENLABS_API_KEY=

# Cloud
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=

# App
NEXT_PUBLIC_APP_URL=https://zoobicon.com
ADMIN_NOTIFICATION_EMAIL=
RESET_TOKEN_SECRET=
```

---

## CRITICAL CLAUDE.MD RULES

1. **CORE PRINCIPLE**: Newest technology, always first. No old technology kept as fallback.
2. **COMPETITIVE MANDATE**: 80-90% more advanced than competitors. Non-negotiable.
3. **Rule 0**: Full depth audit on every bug report. Read every line. Never surface fix.
4. **No stale code**: When new tech is adopted, old tech is DELETED.
5. **Technology Radar**: ADOPT/EVALUATE/WATCH lists checked every session.
6. **Output quality = revenue**: Every generated site must look like $50K+ agency built it.
7. **Speed targets**: <1s scaffold, <10s customized, <30s full custom.
8. **Four-domain signature**: zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh on ALL external communications.

---

## FILE STRUCTURE

```
/
├── packages/agents/          # @zoobicon/agents npm package (open-core)
├── public/                   # Static assets
├── src/
│   ├── agents/              # 22 autonomous AI agents
│   │   ├── base.ts          # BaseAgent abstract class
│   │   ├── registry.ts      # Agent registration + scheduling
│   │   ├── store.ts         # Database + InMemory persistence
│   │   ├── index.ts         # All agent imports + registration
│   │   └── *.ts             # Individual agent implementations
│   ├── app/
│   │   ├── admin/           # Admin panel with sidebar (11 pages)
│   │   ├── api/             # 201 API routes
│   │   │   ├── generate/    # AI generation (stream, quick, react, instant, etc.)
│   │   │   ├── video-creator/ # Video pipeline (10 routes)
│   │   │   ├── domains/     # Domain search + registration
│   │   │   ├── auth/        # Login, signup, OAuth, verification
│   │   │   ├── hosting/     # Deploy + serve
│   │   │   ├── agents/      # Agent management + cron
│   │   │   └── ...          # 27 more directories
│   │   ├── builder/         # Main AI builder page
│   │   ├── video-creator/   # Video production pipeline
│   │   ├── domains/         # Domain search page
│   │   ├── [country]/       # 20 country SEO pages
│   │   ├── for/[industry]/  # 10 industry SEO pages
│   │   └── ...              # 100+ more pages
│   ├── components/          # 78 React components
│   │   ├── SandpackPreview.tsx    # In-browser React rendering
│   │   ├── ReactCodeEditor.tsx    # Monaco VS Code editor
│   │   ├── SiteNavigation.tsx     # Mega menu navigation
│   │   ├── PromptInput.tsx        # AI prompt with mode selector
│   │   ├── PreviewPanel.tsx       # Preview with viewport switching
│   │   ├── OnboardingFlow.tsx     # New user segmentation
│   │   ├── ReferralCard.tsx       # Referral system UI
│   │   ├── StagingBanner.tsx      # Preview deployment indicator
│   │   ├── CookieConsent.tsx      # GDPR/CCPA consent
│   │   ├── SpeculationRules.tsx   # Browser prerendering
│   │   ├── AutoIndexNow.tsx       # Search engine submission
│   │   └── ...
│   └── lib/                 # 77 library modules
│       ├── react-scaffolds.ts     # Pre-built React scaffold components
│       ├── opensrs.ts             # OpenSRS/Tucows domain API
│       ├── agents.ts              # 7-agent build pipeline
│       ├── llm-provider.ts        # Multi-LLM abstraction
│       ├── auth-guard.ts          # Authentication + authorization
│       ├── component-library.ts   # CSS design system (for HTML legacy)
│       ├── environment.ts         # Staging/production detection
│       ├── email-template.ts      # Shared email template with domain footer
│       ├── heygen.ts              # HeyGen AI spokesperson
│       ├── video-render.ts        # Runway/Replicate/Luma video rendering
│       ├── voiceover.ts           # ElevenLabs/PlayHT voiceover
│       ├── scene-image-gen.ts     # AI image generation
│       ├── stripe.ts              # Payment integration
│       ├── mailgun.ts             # Email sending
│       ├── db.ts                  # Neon database connection
│       └── ...
├── CLAUDE.md                # Project rules + decisions + architecture
├── next.config.js           # Next.js configuration
├── vercel.json              # Cron jobs + function config
└── package.json             # Dependencies
```

---

## HOW TO REPLICATE THIS BUILD

1. Clone the repository
2. Run `npm install`
3. Copy `.env.local.example` to `.env.local` and fill in API keys
4. Run `npm run dev` for local development
5. Push to GitHub → connect to Vercel for deployment
6. Set environment variables in Vercel dashboard
7. The cron jobs in vercel.json will auto-start the 22 agents

The CLAUDE.md file contains ALL architectural decisions, rules, and context needed for any Claude session to continue development consistently.
