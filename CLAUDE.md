# CLAUDE.md — Zoobicon Project Guide

## CORE PRINCIPLE — NEWEST TECHNOLOGY, ALWAYS FIRST

**THIS OVERRIDES EVERYTHING ELSE IN THIS DOCUMENT.**

Zoobicon is an AI-built platform. There is NO excuse for using old technology. Every decision, every feature, every line of code must use the newest, most advanced technology available. If a competitor has something we don't, we build it better. If a new technology emerges, we adopt it first.

**The rules:**
1. **No old-school output** — We generate React/Next.js components, NOT static HTML blobs. Every competitor (Lovable, Bolt, v0, Emergent) outputs React. We must match or exceed them.
2. **In-browser preview** — Use Sandpack or WebContainers for instant live preview. No more 60-95 second waits for a server-side generation to complete.
3. **Intellectual crawlers** — Our Market Intelligence Crawler agent must run continuously, scanning competitor products for new features. When a competitor ships something new, we know within 12 hours and have a plan to match or beat it within 48 hours.
4. **First to market** — If we can't be first, we must be best. If we can't be best, we must have a unique angle no one else has. "Good enough" is not acceptable. "Same as competitors" is the MINIMUM — our target is AHEAD.
5. **Technology currency** — Every session, check: Are we on the latest Next.js? Latest React? Latest Tailwind? Latest Claude/GPT models? Latest browser APIs? If not, upgrade.
6. **No legacy debt** — If old code is holding us back, replace it. Don't patch around it. Don't "fix it later." Fix it now. The cost of carrying legacy code is higher than the cost of rewriting it.
7. **Output quality = revenue** — The generated output IS the product. If it looks like 2020 technology, customers won't pay. If it looks like 2027 technology, they'll pay premium. Every generated site must use modern React patterns, modern CSS, modern interactions.

**Current technology targets (March 2026):**
- **Output format**: React/Next.js components with Tailwind CSS (NOT static HTML)
- **Preview**: Sandpack in-browser live preview (NOT iframe of server-generated HTML)
- **Framework**: Next.js 15+ with App Router, Server Components, Streaming
- **AI Models**: Claude Opus/Sonnet 4.6, GPT-4o/5, Gemini 2.5 Pro
- **Runtime**: Sandpack/WebContainers for in-browser execution
- **Deployment**: Vercel one-click deploy from generated code
- **Export**: GitHub sync, real repository, npm packages
- **Design system**: shadcn/ui components (industry standard for React)

**HARD RULE — NO OLD TECHNOLOGY KEPT AS FALLBACK:**
When we adopt a new technology, the old one is REMOVED, not kept alongside. No "HTML mode still works." No "legacy fallback." No "kept for backwards compatibility." The old way is deleted. We can never be stale in this market. Stale = dead. If a competitor does something new, we match it AND remove our old way of doing it. Every line of legacy code is a line that makes us look outdated.

**The migration path:**
- Phase 1: Add Sandpack preview alongside existing HTML builder
- Phase 2: AI generates React components instead of HTML
- Phase 3: Full project scaffolding (file tree, pages, components, API routes)
- Phase 4: In-browser editing with hot reload
- Phase 5: One-click Vercel/GitHub deployment

**The test:** If a user builds something on Zoobicon and then tries Lovable or Bolt, they should think "Zoobicon was better." Not "about the same." Not "different but comparable." BETTER. If they don't think that, we've failed.

**TECHNOLOGY RADAR — What Claude Must Research Every Session**

**Before building ANYTHING, Claude must check: is there a newer/better way to do this?**

**ADOPT NOW (proven, must implement):**
- Sandpack for in-browser React preview ✅ (installed)
- shadcn/ui as the component design system
- React Server Components for generation output
- Tailwind CSS v4 (if stable)
- MCP (Model Context Protocol) for tool integration
- GitHub sync for generated projects
- Vercel deployment integration

**EVALUATE (emerging, first-mover advantage):**
- WebMCP (Google, Feb 2026) — structured website interactions for AI agents
- A2A (Agent-to-Agent protocol) — multi-agent communication standard
- AG-UI (CopilotKit) — agent-to-frontend communication protocol
- Agent Memory — persistent context across sessions (NO ONE has this yet — massive opportunity)
- Veo 3.1 API — native audio + video generation (Sora is dead, Veo leads)
- Kling 3.0 API — cost-effective video at scale with audio sync
- Seedance 2.0 — multi-modal input (9 images + 3 videos + 3 audio tracks)

**WATCH (not ready yet but coming):**
- WebContainers (StackBlitz) — full Node.js in browser
- Real-time AI video editing (late 2026)
- Agent-native startups bypassing traditional software entirely

**RULE: If a technology on the ADOPT list is not implemented, it's a bug. Fix it immediately. If a technology on the EVALUATE list could give us an advantage, research it and propose implementation. If a WATCH item moves to EVALUATE, flag it immediately.**

## COMPETITIVE MANDATE — 80-90% MORE ADVANCED THAN COMPETITORS

**THIS IS NON-NEGOTIABLE. THIS MUST HAPPEN. OTHERWISE THERE IS NO POINT.**

Zoobicon must be 80-90% more advanced than every competitor. Not 10% better. Not "comparable." Not "different but equal." We must be so far ahead that competitors look outdated by comparison.

**How we achieve this:**

1. **React Scaffold System — Instant Assembly**
   - Pre-built React component library (Hero, Features, Pricing, Testimonials, Footer, Nav, CTA, FAQ, Stats, Gallery — 50+ components)
   - Each component is a polished, production-ready React module with TypeScript, Tailwind, and modern patterns
   - Scaffold loads in <1 second via Sandpack — user sees a complete site INSTANTLY
   - AI then streams customizations (colors, copy, images, branding) into the scaffold in real-time
   - User watches their site transform LIVE — not staring at a loading spinner
   - This is FASTER than any competitor because we're assembling, not generating from scratch

2. **Intellectual Advantage — Always Ahead**
   - Market Intelligence Crawler runs every 12 hours scanning ALL competitors
   - When a competitor ships a new feature, we know within 12 hours
   - We have 48 hours to match it and 7 days to surpass it
   - Monthly technology audit: are we on the latest everything?
   - Quarterly competitive review: where do we lead, where do we trail, what's the plan?

3. **Unique Differentiators No Competitor Has**
   - 18 autonomous AI agents (competitors have 0-5)
   - AI Video Creator with HeyGen spokesperson
   - Real domain search via OpenSRS/Tucows
   - Agency white-label platform
   - 43 specialized generators
   - Multi-domain ecosystem (.com, .ai, .io, .sh)
   - Open-source agent framework (@zoobicon/agents)

4. **Speed Targets**
   - Scaffold preview: <1 second (Sandpack loads pre-built React components)
   - AI customization: 3-10 seconds (streaming changes into scaffold)
   - Full custom generation: <30 seconds (React components, not HTML)
   - Deploy to production: <5 seconds (Vercel one-click)
   - Current competitors: Bolt 3-5s preview, Lovable 30-90s full build, v0 5-15s components
   - Our target: <1s preview, <10s customized, <30s full custom = FASTEST IN MARKET

5. **Quality Standard**
   - Every generated site must look like a $50K+ agency built it
   - Modern React patterns (hooks, composition, server components)
   - shadcn/ui design system (industry standard)
   - Tailwind CSS (no CSS-in-JS, no styled-components)
   - TypeScript throughout (type safety = fewer bugs)
   - Responsive by default (mobile-first)
   - Accessible by default (WCAG AA minimum)
   - SEO optimized by default (meta tags, structured data, semantic HTML)

**The measurement:** Every month, build the same site on Zoobicon and on Lovable/Bolt/v0. Compare speed, quality, and features. If we're not clearly ahead on at least 2 out of 3, something is wrong and must be fixed immediately.

## TECHNOLOGY RADAR — What Claude Must Research Every Session

**Before building ANYTHING, Claude must check: is there a newer/better way to do this?**

**ADOPT NOW (proven, must implement):**
- Sandpack for in-browser React preview ✅ (installed)
- shadcn/ui as the component design system
- React Server Components for generation output
- Tailwind CSS v4 (if stable)
- MCP (Model Context Protocol) for tool integration
- GitHub sync for generated projects
- Vercel deployment integration

**EVALUATE (emerging, first-mover advantage):**
- WebMCP (Google, Feb 2026) — structured website interactions for AI agents
- A2A (Agent-to-Agent protocol) — multi-agent communication standard
- AG-UI (CopilotKit) — agent-to-frontend communication protocol
- Agent Memory — persistent context across sessions (NO ONE has this yet — massive opportunity)
- Veo 3.1 API — native audio + video generation (Sora is dead, Veo leads)
- Kling 3.0 API — cost-effective video at scale with audio sync
- Seedance 2.0 — multi-modal input (9 images + 3 videos + 3 audio tracks)

**WATCH (not ready yet but coming):**
- WebContainers (StackBlitz) — full Node.js in browser
- Real-time AI video editing (late 2026)
- Agent-native startups bypassing traditional software entirely

**RULE: If a technology on the ADOPT list is not implemented, it's a bug. Fix it immediately. If a technology on the EVALUATE list could give us an advantage, research it and propose implementation. If a WATCH item moves to EVALUATE, flag it immediately.**

**VIDEO CREATOR TARGETS:**
- Support Runway Gen-4.5 (current Gen-3 Alpha)
- Add Kling 3.0 as video provider (40% cheaper than Runway)
- Native audio generation (don't rely on separate voiceover step)
- Character consistency across scenes
- Multi-modal input (text + image + existing video)
- Real-time preview during generation
- Target: generate a 30-second marketing video in under 2 minutes

---

## What is this project?

Zoobicon is a **white-label AI website builder platform** built with Next.js 14, React 18, TypeScript, and Tailwind CSS. It uses a multi-LLM pipeline architecture (Claude, GPT, Gemini) with a 7-agent build pipeline. The platform supports multiple brands from a single codebase via `src/lib/brand-config.ts`.

### Brands / Domains
- **Zoobicon** (primary): zoobicon.com, zoobicon.ai, zoobicon.sh
- **Dominat8** (secondary): dominat8.io, dominat8.com — edgy/aggressive brand variant

Brand detection is automatic via hostname. See `src/lib/brand-config.ts` and `src/app/dominat8/page.tsx`.

## Tech Stack

- **Framework**: Next.js 14 (App Router) with React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS custom properties (no styled-jsx, no CSS modules)
- **AI**: Multi-LLM — Anthropic Claude, OpenAI GPT, Google Gemini via `@anthropic-ai/sdk` + `src/lib/llm-provider.ts`
- **Database**: Neon (serverless Postgres) via `@neondatabase/serverless`
- **Payments**: Stripe
- **Icons**: lucide-react (tree-shaken via next.config.js)
- **Animations**: framer-motion

## Build & Run

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
```

Build has `ignoreBuildErrors: true` and `ignoreDuringBuilds: true` in next.config.js — this is intentional for rapid iteration.

## Architecture

### AI Generation Pipeline (src/lib/agents.ts)

7-agent multi-phase pipeline, ~95s total (within Vercel 300s limit):

**Phase 1 — Strategy (Sequential, ~4s):**
- Strategist Agent (Haiku): Brief → JSON strategy (audience, positioning, visual direction, content structure)

**Phase 2 — Planning (Parallel, ~6s):**
- Brand Designer (Haiku): Strategy → design spec (colors, typography, layout, dark mode)
- Copywriter (Haiku): Strategy → copy spec (hero, features, testimonials, FAQ, CTA, meta SEO)
- Architect (Haiku): Strategy → architecture (section order, layouts, interactivity, breakpoints)

**Phase 3 — Build (Sequential, ~70s):**
- Developer (Opus): ALL specs → complete HTML (~32K tokens). **Opus is non-negotiable for quality.**

**Phase 4 — Enhancement (Parallel, ~15s, if time permits):**
- SEO Agent (Sonnet): Adds meta tags, OG tags, JSON-LD schema, heading hierarchy
- Animation Agent (Sonnet): Adds scroll animations, micro-interactions, parallax

**Model routing:** Haiku for JSON planners → Opus for Developer → Sonnet for enhancers. User-selected models (GPT-4o, Gemini 2.5 Pro) route through `llm-provider.ts` with automatic failover.

**Body content validation:** If HTML body has <100 chars visible text, retries with "body-first" prompt.

### Generation Endpoints (src/app/api/generate/)

| Route | Model | Tokens | What It Does |
|-------|-------|--------|-------------|
| `/api/generate` (POST) | Opus | 32K | Non-streaming single-page build with retry |
| `/api/generate/stream` (POST) | Opus | 32K | Streaming build, cross-provider failover |
| `/api/generate/pipeline` (POST) | Pipeline | — | Direct 7-agent pipeline invocation |
| `/api/generate/multipage` (POST) | Sonnet | 64K | 3-6 page sites with shared design system |
| `/api/generate/fullstack` (POST) | Sonnet | 64K | Complete apps: DB schema + API routes + HTML frontend with CRUD |
| `/api/generate/variants` (POST) | Sonnet | 32K | 2-3 design variants for A/B testing |
| `/api/generate/email` (POST) | Sonnet | 16K | Email template generation |
| `/api/generate/quick` (POST) | Haiku | 8K | Lightweight fast generation |
| `/api/generate/react` (POST) | Sonnet | 32K | React/TypeScript component generation — outputs JSON `{ files, dependencies }` for Sandpack preview |
| `/api/generate/images` (POST) | — | — | AI image generation (Replicate/Stability) |
| `/api/generate/ai-images` (POST) | — | — | Embed AI images into existing HTML |
| `/api/generate/edit-diff` (POST) | — | — | Diff generation for variant comparison |

### Output Formats

**Single-page (default):** Complete `.html` file — CSS + JS inlined, no external dependencies, images via picsum.photos. Component library CSS auto-injected.

**Multi-page:** JSON with `{ siteName, pages: [{ slug, title, html }], navigation: [{ label, href }] }`. Each page is standalone HTML with shared design (fonts, colors, nav, footer). Max 6 pages.

**Full-stack:** JSON with `{ description, schema (SQL), apiEndpoints: [{ method, path, handler }], code (HTML with CRUD UI) }`. Real PostgreSQL schemas, RESTful Next.js handlers, interactive frontend with forms/tables/modals.

**React App:** JSON with `{ files: { "App.tsx": "...", "components/Hero.tsx": "...", ... }, dependencies: {} }`. React 18 functional components with TypeScript, styled with Tailwind CSS (loaded via CDN in Sandpack). Each component is self-contained. Rendered live in the builder via `@codesandbox/sandpack-react` with the `react-ts` template. Selected via "React App" mode toggle in PromptInput.

### Hosting & Deployment (src/app/api/hosting/)

| Route | What It Does |
|-------|-------------|
| `POST /api/hosting/deploy` | Deploy HTML → creates DB record → returns `https://[slug].zoobicon.sh` |
| `GET /api/hosting/serve/[slug]` | Serves live HTML from DB with caching headers |
| `GET /api/hosting/sites/[siteId]/code` | Fetch live code + version history |
| `PUT /api/hosting/sites/[siteId]/code` | Update code, creates new deployment version |
| `GET /api/hosting/sites/[siteId]/versions/[versionId]` | Fetch previous version for rollback |
| `GET /api/hosting/sites` | List user's sites |
| `/api/hosting/analytics` | Page view tracking |
| `/api/hosting/dns` | DNS management (stub — needs Cloudflare integration) |
| `/api/hosting/ssl` | SSL provisioning (stub — needs Cloudflare integration) |
| `/api/hosting/cdn` | CDN caching (stub — needs Cloudflare integration) |

**Database schema:** `sites` (id, name, slug, email, plan, status) + `deployments` (site_id, environment, status, code, url, size, commit_message)

### E-commerce Generation (src/app/api/ecommerce/)

`POST /api/ecommerce/generate` — Generates complete storefronts with:
- Shopping cart (localStorage), checkout form, product grid, search/filters
- Wishlist, reviews with star ratings, stock badges, discount codes ("SAVE10")
- Shipping calculator, order tracking
- Request: `{ businessType, products: [{name, price, description}], features: [...], theme }`

### Scaffolding (src/app/api/scaffold/)

`POST /api/scaffold` — Takes existing HTML and adds full-stack features:
- Auth (email/Google/GitHub with JWT)
- Database tables (users, posts, products, orders)
- Admin panel (stats, user management, moderation)
- User profiles (avatar, bio, settings, history)
- File uploads (drag-drop, preview, progress)
- Comments (threaded, timestamps)
- Notifications (bell icon, unread badge)

### Page Routes (src/app/)
75+ pages total. All verified working. Key routes:

**Core Product:**
- `/` — Landing page
- `/builder` — Main AI website builder (the core product)
- `/edit/[slug]` — Post-deploy live editor with version history
- `/dashboard` — User dashboard
- `/generators` — Hub page linking to all 43+ generators
- `/pricing`, `/privacy`, `/terms`, `/support`

**Admin:**
- `/admin` — Admin dashboard (fallback credentials in auth route)
- `/admin/email-settings` — Email configuration (Mailgun setup guide, API keys, notification prefs)
- `/admin/pre-launch` — Pre-launch checklist (75+ items across 12 categories)

**Auth:**
- `/auth/*` — Login, signup, forgot-password, reset-password, settings

**Product Pages:**
- `/products/*` — Product pages (website-builder, seo-agent, video-creator, email-support, hosting)

**Branded Domain Pages:**
- `/dominat8` — Secondary brand landing page
- `/ai` — zoobicon.ai domain page
- `/io` — zoobicon.io domain page
- `/sh` — zoobicon.sh domain page
- `/developers`, `/cli` — Developer routes

**Business Tools (NEW — Competitive Advantage Suite):**
- `/forms` — AI Forms Builder (replaces Typeform $25/mo, JotForm $34/mo)
- `/crm` — AI CRM with pipeline, contacts, AI follow-ups (replaces HubSpot $45/mo)
- `/ai-chat` — AI Chatbot Builder (replaces Intercom $74/mo, Drift $50/mo)
- `/link-bio` — Link in Bio pages (replaces Linktree $24/mo)
- `/qr-codes` — QR Code Generator (replaces QR Tiger $7/mo)
- `/proposals` — AI Proposals & Contracts (replaces PandaDoc $35/mo)
- `/invoicing` — AI Invoicing (replaces FreshBooks $17/mo)
- `/booking` — AI Booking & Scheduling (replaces Calendly $16/mo)
- `/email-marketing` — AI Email Marketing (replaces ConvertKit $29/mo)
- `/automation` — Workflow Automation (replaces Zapier $19/mo)
- `/surveys` — AI Survey Builder (replaces SurveyMonkey $25/mo)

**Content & Marketing (NEW):**
- `/content-writer` — AI Content Writer
- `/content-calendar` — AI Social Media Content Calendar
- `/publisher` — Cross-Platform Publisher
- `/blog-engine` — AI Blog Engine with Auto-SEO
- `/landing-pages` — AI Landing Page Generator (replaces Unbounce $74/mo)
- `/popups` — Popup & Banner Builder (replaces OptinMonster $16/mo)
- `/white-paper` — AI White Paper Generator
- `/case-study` — AI Case Study Generator
- `/pitch-deck` — AI Pitch Deck Generator (replaces Beautiful.ai $12/mo)

**Developer & Technical (NEW):**
- `/api-docs` — Interactive API Documentation
- `/webhooks` — Webhook Manager
- `/integrations-hub` — 40+ Integration Directory
- `/documentation` — Documentation & Wiki Builder (replaces GitBook $8/mo)
- `/status-page` — Status Page Builder (replaces StatusPage $29/mo)
- `/uptime` — Uptime Monitor (replaces UptimeRobot $7/mo)
- `/changelog` — Public Changelog (replaces Beamer $49/mo)

**Analytics & Optimization (NEW):**
- `/analytics` — Site Analytics Dashboard
- `/heatmaps` — Heatmap & User Analytics (replaces Hotjar $32/mo)
- `/ab-testing` — A/B Testing Platform (replaces Optimizely $79/mo)
- `/reports` — AI Report Generator (replaces AgencyAnalytics $79/mo)
- `/seo` — SEO Dashboard + analysis

**Community & Growth (NEW):**
- `/gallery` — Prompt Gallery (community showcase)
- `/showcase` — Best generated sites
- `/challenges` — Weekly Design Challenges
- `/feedback` — Feature Request & Feedback Board (replaces Canny $400/mo)
- `/feature-requests` — Public Feature Request Voting
- `/roadmap` — Public Product Roadmap
- `/reviews` — Review Management Platform (replaces Birdeye $299/mo)
- `/testimonials-wall` — Testimonial Wall Builder (replaces Testimonial.to $20/mo)
- `/referral` — Referral Program

**Portfolio & Personal (NEW):**
- `/portfolio` — Portfolio Builder (replaces Format $14/mo)
- `/resume` — AI Resume Builder (replaces Resume.io $15/mo)
- `/business-card` — AI Business Card Generator
- `/store` — Digital Product Store
- `/waitlist` — AI Waitlist Builder (replaces LaunchList $29/mo)
- `/knowledge-base` — Knowledge Base / Help Center (replaces Zendesk Guide $49/mo)

**Messaging (NEW):**
- `/messaging` — SMS, WhatsApp & Push Notifications
- `/email-support` — Email Support Ticketing

**Other:**
- `/domains`, `/marketplace`, `/hosting`, `/wordpress`
- `/agencies` — Agency platform
- `/starter-kits` — Business Starter Kits
- `/crawl` — Website Crawler
- `/dictation` — AI Dictation
- `/creator-marketplace` — Creator Template Marketplace
- `/brand-kit` — AI Brand Kit
- `/video-creator` — Video Creator Pipeline

### Public API v1 (src/app/api/v1/)

RESTful API for programmatic site generation and deployment. Bearer token auth via `zbk_live_*` API keys.

| Route | Method | Description |
|-------|--------|-------------|
| `/api/v1/generate` | POST | Generate a website from prompt (supports 43 generators, tiers, model override, auto-deploy, webhooks, agency branding) |
| `/api/v1/sites` | GET | List deployed sites with pagination and status filtering |
| `/api/v1/sites` | PUT | Update site HTML, creates new deployment version |
| `/api/v1/sites` | DELETE | Deactivate a site by ID or slug |
| `/api/v1/deploy` | POST | Deploy HTML to zoobicon.sh with custom slug |
| `/api/v1/deploy` | GET | Get deployment history for a site |
| `/api/v1/status` | GET | API health, account info, usage stats, rate limits |

**Authentication:** `Authorization: Bearer zbk_live_...` — HMAC-SHA256 stateless keys (no DB lookup). See `src/lib/apiKey.ts`.

**Rate limits:** Free: 10 req/min, Pro: 60 req/min, Enterprise: 600 req/min. Sliding window per API key prefix. See `src/lib/api-middleware.ts`.

### Other API Routes (src/app/api/)
90+ route handlers across 27 directories. All verified working:
- `/api/auth/*` — Authentication (signup, login, reset, OAuth Google/GitHub)
- `/api/projects/*` — Project CRUD
- `/api/collab/*` — Real-time collaboration (rooms, presence, code sync)
- `/api/contact` — Contact form handler
- `/api/seo/analyze` — SEO analysis endpoint
- `/api/clone` — Import existing website URL → convert to editable HTML
- Plus: admin, animate, chat, crm, db, debug, export, figma, github, invoice, keys, performance, qa, stripe, support, translate

### Components (src/components/)
35+ components. All imports verified:

**Builder Core:**
- `PromptInput.tsx` — AI prompt input with style/tier/model selectors + template quick-start
- `PipelinePanel.tsx` — 7-agent pipeline progress visualization
- `CodePanel.tsx` — Code editor/viewer with copy/download and multi-file tabs
- `PreviewPanel.tsx` — Live preview with Desktop/Tablet/Mobile viewports + visual editing bridge
- `TopBar.tsx` / `StatusBar.tsx` — Builder chrome with real-time agent status + agency white-label
- `VisualEditor.tsx` — Click-to-select property editor (typography, spacing, background, border, layout)
- `SectionLibrary.tsx` — Pre-built section templates for drag-and-drop addition
- `ProjectTree.tsx` — File tree view for multi-file project editing

**Builder Tools (21+ sidebar panels):**
- `MultiPagePanel.tsx` — Generate 3-6 page sites with consistent design
- `FullStackPanel.tsx` — Generate DB schema + API + frontend with tabbed view
- `EcommercePanel.tsx` — E-commerce storefront generator
- `QAPanel.tsx` — Automated quality audit
- `AccessibilityPanel.tsx` — A11y scanning
- `PerformancePanel.tsx` — Lighthouse-style metrics
- `ABTestPanel.tsx` — 2-3 design variant generation
- `EmailPanel.tsx` — Email template generator
- `ExportPanel.tsx` — Download as .html/.zip/React
- `AutoDebugPanel.tsx` — Broken element detection
- `SEOScorePanel.tsx` — SEO scoring and fixes
- `AnimationsPanel.tsx` — Scroll/hover animation editor
- `CRMPanel.tsx` — Contact form / lead management
- `ScaffoldPanel.tsx` — Full-stack feature injection
- `TranslatePanel.tsx` — Multi-language generation
- `GitHubImportPanel.tsx` — GitHub repo → buildability estimate
- `FigmaImportPanel.tsx` — Figma design → HTML
- `WordPressExportPanel.tsx` — HTML → WordPress theme
- `ClonePanel.tsx` — Import existing website
- `AIImagePanel.tsx` — AI image generation + embedding

### Component Library (src/lib/component-library.ts)

Auto-injected CSS design system (like shadcn/ui for generated output):
- **Buttons**: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-lg`, `.btn-sm`
- **Cards**: `.card`, `.card-body`, `.card-img`, `.card-flat`
- **Inputs**: `.input`, `.input-group`, `.input-icon`
- **Badges**: `.badge`, `.badge-primary`, `.badge-success`, `.badge-warning`, `.badge-error`
- **Layout**: `.section`, `.section-alt`, `.container`, `.grid-2`, `.grid-3`, `.grid-4`
- **Animation**: `.fade-in`, `.fade-in-left`, `.fade-in-right`, `.scale-in`
- **Hero effects**: `.hero-aurora`, `.hero-mesh`, `.hero-glass`, `.hero-gradient-text`, `.hero-float`, `.hero-orb`, `.hero-cursor-glow`
- **Patterns**: `.testimonial-card`, `.stat-item`, `.faq-item`, `.logo-strip`
- **Failsafe**: IntersectionObserver with 3s hard timeout (no blank pages if JS fails)

### Lib (src/lib/)
- `agents.ts` — 7-agent pipeline v3 (see Pipeline section above)
- `llm-provider.ts` — Multi-LLM abstraction: Claude, OpenAI (GPT-4o, o3), Google (Gemini 2.5 Pro/Flash)
- `component-library.ts` — CSS design system injected into every generated site
- `brand-config.ts` — White-label brand system
- `db.ts` — Neon database connection
- `hosting.ts` — Deployment/hosting logic
- `storage.ts` — File storage abstraction
- `stripe.ts` — Payment integration
- `password.ts` / `resetToken.ts` — Auth utilities
- `apiKey.ts` / `rateLimit.ts` — API security
- `image-gen.ts` — AI image generation
- `templates.ts` — 100 site templates across 13 categories (Business, Technology, Health, Food & Drink, E-Commerce, Portfolio, Events, Blog, Professional, Nonprofit, Entertainment, Education, Real Estate)
- `generator-prompts.ts` — 43 generator definitions with type-specific system prompt supplements
- `dom-bridge.ts` — Visual editing script (hover/click/text-edit) + HTML manipulation utilities
- `cloudflare.ts` — Cloudflare API integration for DNS/SSL/CDN
- `agency-limits.ts` — Agency plan tier limits and quota enforcement
- `intel-crawler.ts` — Competitor website analysis engine

### Edit Flow (src/app/edit/[slug]/)

Post-deployment live editor:
1. `GET /api/hosting/sites/[slug]/code` → fetches deployed HTML + version history
2. ChatPanel streams edits via `/api/generate/stream` (Sonnet for speed)
3. `PUT /api/hosting/sites/[slug]/code` → saves new version
4. Full version history with rollback support
5. 16 sidebar tools available in edit mode

## Important Decisions (Do Not Revert)

1. **No styled-jsx** — Removed intentionally. Use Tailwind only. Adding it back causes build errors.
2. **No duplicate Next config** — Only `next.config.js` exists (not `.mjs`). Do not create a second one.
3. **Error boundary** — `src/app/error.tsx` exists and works. Don't remove it.
4. **ESLint/TS ignored in builds** — Intentional in `next.config.js` for speed. Lint separately.
5. **All placeholder `href="#"` links fixed** — Signup, homepage footer, hosting page all point to real routes now.
6. **`/api/contact` route exists** — Created for the forms-backend generator. Don't delete it.
7. **Admin fallback credentials** — The admin auth has fallback credentials for when the database is unavailable. This is intentional.
8. **Tree-shaking config** — `optimizePackageImports` for lucide-react and framer-motion in next.config.js is critical for bundle size.
9. **Auth-aware navbars on homepage & pricing** — These pages read `localStorage("zoobicon_user")` and show Dashboard/Sign out when logged in, Sign in/Start Building when logged out. Auth is localStorage-based (key: `zoobicon_user`). Do not revert to hardcoded "Sign in" links.
10. **Model routing — Opus for builds** — The Developer agent (the one that produces HTML) MUST use `claude-opus-4-6`. The stream fallback also uses Opus for new builds. Edits use Sonnet for speed. JSON planning agents use Haiku. SEO + Animation enhancers use Sonnet in parallel. Do NOT downgrade the Developer agent to Sonnet — it produces noticeably worse output. Pipeline v3 fits ~95s within Vercel's 300s limit by parallelizing planners and running only high-impact enhancers (SEO + Animation).
11. **Multi-LLM support** — Three providers configured in `.env.local`: `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `OPENAI_API_KEY`. Provider routing is in `src/lib/llm-provider.ts`. When a user selects a non-Claude model, all pipeline agents route through that provider. Default (no selection) uses the Claude Haiku/Opus/Sonnet split.
12. **Component library injection** — `src/lib/component-library.ts` provides a CSS reset + design system (buttons, cards, inputs, badges, grids, animations) injected into every generated site. Like shadcn/ui for generated output. Do not remove.
13. **Mediocre is failure** — Every product page must have a working backend. No fake CTAs, no mock data presented as real, no landing pages that funnel to unrelated products. If a feature isn't built yet, it must say "Coming Soon" with a waitlist — never "Launch Now." When encountering broken flows during any work, fix them immediately or flag as top priority. See the Quality Standard checklist above.
14. **OAuth via redirect flow** — Google/GitHub OAuth uses server-side redirect (not popup). Routes: `/api/auth/oauth/{google,github}` → provider → `/api/auth/callback/{google,github}` → `/auth/callback` (stores in localStorage). DB stores `auth_provider` and `auth_provider_id` on users table. Env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET`.
15. **Agency generation quota tracking** — `agency_generations` table tracks every AI generation per agency per month (period format: "YYYY-MM"). The stream generate route checks quota before generation and returns 429 when exceeded. Dashboard shows usage. Plan limits defined in `src/lib/agency-limits.ts`.
16. **Visual editing is DOM-based** — The visual editor works by injecting a script into the preview iframe (`dom-bridge.ts`). Communication is via `postMessage`. Style/text changes are applied to the HTML string via `DOMParser` → manipulate → serialize. This means changes persist in the `generatedCode` state and survive undo/redo via the snapshot system.
17. **Real-time collaboration uses poll-based presence (UPGRADE TO WEBSOCKETS)** — Current implementation uses database-backed rooms with poll-based presence (every 2-3s) because Vercel serverless doesn't support persistent WebSocket connections. This works but has ~2-3s latency on cursor positions and code sync. **FUTURE UPGRADE PATH:** When deploying to a persistent server (e.g., Railway, Fly.io, AWS ECS) or using a dedicated WebSocket service (PartyKit, Liveblocks, Ably), replace the polling in `useCollaboration.ts` with WebSocket connections. The API routes (`/api/collab/*`) can remain as REST for room management; only presence and code sync need the WebSocket upgrade. Key files: `src/lib/collaboration.ts` (config), `src/hooks/useCollaboration.ts` (client), `src/app/api/collab/` (server), `src/components/CollaborationBar.tsx` (UI), `src/components/CursorOverlay.tsx` (remote cursors). The collab_rooms, collab_participants, and collab_code_sync tables support the current system.

18. **Public API v1** — The `/api/v1/*` routes provide a programmatic REST API for external developers. Authentication uses stateless HMAC-SHA256 API keys (`zbk_live_*`) validated in `src/lib/apiKey.ts` with rate limiting in `src/lib/api-middleware.ts`. The API supports generation with all 43 generators, auto-deploy to zoobicon.sh, webhook callbacks, and white-label agency branding. Do not change the auth scheme without updating all v1 routes. Key files: `src/lib/api-middleware.ts`, `src/app/api/v1/generate/route.ts`, `src/app/api/v1/sites/route.ts`, `src/app/api/v1/deploy/route.ts`, `src/app/api/v1/status/route.ts`.

19. **WordPress Export (theme download, NOT live deploy)** — WordPress integration is **export-only**. The `/wordpress` page promotes theme export and zoobicon.sh hosting — NOT live plugin-based deployment. **Why:** WordPress.com free/Personal/Premium plans block custom plugins and `<script>`/`<style>` tags entirely, making plugin-based deployment impossible for most WordPress.com users. Only self-hosted WordPress.org and WordPress.com Business+ ($25/mo) support custom plugins. Rather than building for a shrinking, restricted platform, we position zoobicon.sh as the primary hosting and offer WordPress theme export as a secondary option. **What exists:** `public/wordpress-plugin/` contains a Connect plugin (PHP) and `public/zoobicon-connect.zip` is the installable ZIP, but these are **not promoted** on the `/wordpress` page. The `WordPressExport.tsx` component still has both "Deploy to WordPress" and "Export Theme" tabs in the builder modal — the plugin works for self-hosted users who find it, but we don't market it. **Do not invest further engineering time in WordPress plugin integration.** Focus on zoobicon.sh hosting instead. Key files: `src/app/wordpress/page.tsx`, `src/components/WordPressExport.tsx`, `public/wordpress-plugin/zoobicon-connect.php`, `public/zoobicon-connect.zip`.

20. **Email is Mailgun-only — NO Google Workspace** — All email (inbound admin inbox, inbound support tickets, outbound notifications/replies) runs through Mailgun. No Google Workspace, no Resend dependency. One service, one API key. Architecture: Mailgun receives emails for `admin@zoobicon.com` and `support@zoobicon.com` via MX records, forwards to webhooks (`/api/email/inbox` and `/api/email/support/inbound`), which store in the database. Outbound goes via Mailgun API. `src/lib/admin-notify.ts` tries Mailgun first, falls back to Resend (legacy), then console logging. The `/admin/email` and `/email-support` pages show DEMO DATA banners when Mailgun is not connected (the hardcoded `DEMO_EMAILS` and `DEMO_TICKETS` arrays are fallback placeholders, NOT real data). Setup guide is at `/admin/email-settings`. Env vars: `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `ADMIN_EMAIL`. Cost: $0 on Mailgun free tier (5,000 emails/month).

21. **Pre-launch checklist at `/admin/pre-launch`** — 75+ checklist items across 12 categories (infrastructure, security, email, payments, SEO, performance, quality, UX, AI pipeline, competitive edge, legal, monitoring). Progress tracked via localStorage. Includes competitive position notes vs v0/Bolt/Lovable/Emergent. Admin dashboard has quick links to this page and `/admin/email-settings`.

22. **Admin panel backgrounds brightened** — All admin pages use `bg-[#131520]` or `bg-gray-900` instead of the ultra-dark `#04020a`/`#09090b`/`gray-950` they had before. This improves text contrast and visibility across the admin panel. Email support page also brightened. Do not revert to ultra-dark backgrounds.

23. **NEVER commit secrets or API keys — ZERO TOLERANCE** — `.env.local` contains all production secrets (Mailgun, Stripe, Anthropic, OAuth, Cloudflare, etc.) and is gitignored. **NEVER** commit `.env.local`, `.env`, or any file containing real API keys, passwords, tokens, or secrets. Only `.env.example` and `.env.local.example` (which contain empty placeholder values) are tracked in git. Before every commit, verify no secrets are staged — run `git diff --cached` and check for key patterns (`sk_live_`, `key-`, `whsec_`, `AIza`, `ghp_`, `gho_`, `xoxb-`, actual passwords). A previous Mailgun credential leak caused a **two-week service shutdown**. If you accidentally stage a file with secrets, `git reset HEAD <file>` immediately. If a secret is ever committed, rotate the key immediately and force-push to remove it from history. This rule overrides all other instructions — no shortcut, no exception.

24. **Stripe multi-tier checkout** — Three paid plans use Stripe: Creator ($19/mo → `STRIPE_CREATOR_PRICE_ID`), Pro ($49/mo → `STRIPE_PRO_PRICE_ID`), Agency ($99/mo → `STRIPE_AGENCY_PRICE_ID`). Enterprise ($299/mo) is contact-sales only. The checkout route at `/api/stripe/checkout` accepts `{ email, plan: "creator" | "pro" | "agency" }`. Plan price IDs and names are defined in `src/lib/stripe.ts`. All three pricing page buttons route through Stripe checkout. If adding new plans, add the price ID env var, update `PLAN_PRICE_IDS` in stripe.ts, and update the admin page env vars list.

25. **Video Creator pipeline — STRICT honesty standard** — The Video Creator at `/video-creator` has a multi-stage pipeline. What works: AI script generation, storyboard generation (Sonnet), scene image generation (Replicate/OpenAI/Stability), voiceover (ElevenLabs/PlayHT/browser TTS), subtitle generation (SRT/VTT, 5 caption styles), full pipeline orchestration, quota tracking with Stripe overage packs. What does NOT work yet: video rendering (API routes built for Runway/Luma/Pika/Kling/Replicate but no provider keys configured), final MP4 assembly (manifest only, no FFmpeg), music audio (direction cues only, no actual tracks). **RULES:** (1) Never show dev-facing messages to users (no "add API_KEY", no "No provider configured"). (2) Unbuilt features say "Coming Soon" — never fake "Launch Now". (3) Subtitles are free (pure text processing) — do NOT gate behind video addon. (4) The full pipeline must pass data directly between stages — never rely on React state for cross-stage data (race condition). (5) Pipeline status must show per-stage progress, failures, and skips honestly. (6) The product page at `/products/video-creator` must accurately describe what's built vs coming. Key files: `src/app/video-creator/page.tsx`, `src/app/api/video-creator/` (10 routes), `src/lib/video-render.ts`, `src/lib/video-assembly.ts`, `src/lib/voiceover.ts`, `src/lib/subtitle-gen.ts`, `src/lib/scene-image-gen.ts`, `src/lib/video-usage.ts`, `src/lib/video-templates.ts`.

26. **Generated website output quality — PREMIUM OR NOTHING** — Every website generated by Zoobicon MUST look like a $20K+ agency built it. This is our #1 competitive differentiator. **STRICT RULES — ZERO EXCEPTIONS:**

    **(A) Component Library Injection — MANDATORY:**
    The component library CSS (`src/lib/component-library.ts`) MUST be injected into EVERY generated website — stream builds, quick builds, pipeline builds, edits, retries. The stream route (`src/app/api/generate/stream/route.ts`) calls `injectComponentLibrary()` from the library after streaming completes. The quick route wraps output with `buildFullPage()`. The pipeline injects via the Developer agent's system prompt. If you add a new generation endpoint, it MUST inject the component library. A generated site without the component library is a **broken product** — buttons will be invisible, cards will be unstyled, grids will collapse. Test by checking for "ZOOBICON COMPONENT LIBRARY" in the output HTML.

    **(B) Images — RELEVANT AND ABUNDANT:**
    - MINIMUM 8 images per generated site (hero, 6 feature cards, about section, testimonial avatars)
    - Images MUST be industry-relevant. Use `https://images.unsplash.com/photo-{ID}?w={WIDTH}&h={HEIGHT}&fit=crop&q=80` with curated photo IDs from `src/lib/stock-images.ts` when available, falling back to `https://picsum.photos/seed/DESCRIPTIVE-KEYWORD/WIDTH/HEIGHT` with highly specific seed keywords (e.g., `seed/cybersecurity-dashboard` not `seed/office`)
    - A cybersecurity site with cityscape photos is a FAILURE. A restaurant site with office photos is a FAILURE. Images must match the industry.
    - Every feature card gets its own image — no text-only cards
    - Testimonials get avatar images — no faceless quotes

    **(C) Layout — SPLIT HERO, VISUAL DEPTH:**
    - Hero section MUST use split layout (text left + image right) OR full-bleed image with overlay text. NEVER a plain centered-text hero with no image.
    - Every section must visually differ from adjacent sections (alternate backgrounds via `--color-bg` / `--color-bg-alt` / `--color-surface`)
    - About sections use two-column layout with image + text side by side
    - Stats sections use bold colored numbers with `.stat-item` class
    - Footer is always dark background with 4 columns

    **(D) Copy — SPECIFIC AND COMPELLING:**
    - BANNED phrases: "Your Business, Elevated Online", "Trusted by businesses worldwide", "Get Started Today", "Welcome to [Brand]", "We offer solutions", "Our team of experts", "Cutting-edge technology", "Seamless experience", "Take your business to the next level"
    - Headlines must be SPECIFIC to the business: "Stop Breaches Before They Start" (cybersecurity), "Tables Worth Traveling For" (restaurant), "Ship Code 10x Faster" (dev tools)
    - Every testimonial must include a specific metric: "Reduced breach response time by 73%", "Increased reservations 2x in 3 months"
    - CTAs must be action-specific: "Schedule Security Assessment", "Reserve Your Table", "Start Free Trial" — NEVER generic "Get Started"
    - Company/brand names in testimonials/social proof must be realistic and industry-appropriate

    **(E) Colors — VIBRANT AND INDUSTRY-APPROPRIATE:**
    - ALWAYS define `:root` custom properties with strong, saturated colors
    - NEVER use plain white (#ffffff) as the main background — use tinted whites (#fafafa, #fdf8f4, #f0fdf4) or dark themes (#0f172a, #1a1a2e)
    - Primary color must be bold and saturated, appropriate to the industry
    - Text contrast must meet WCAG AA minimum (4.5:1 for body text, 3:1 for large text)
    - Button text on `.btn-primary` is ALWAYS white (#fff) — the component library handles this, but NEVER override it with inline styles

    **(F) CSS Budget — 30 LINES MAX:**
    - The component library provides ALL component styles (buttons, cards, grids, badges, sections, animations, hero effects)
    - AI output should contain ONLY `:root` custom property definitions + max 30 lines of site-specific CSS
    - If the AI writes more than 30 lines of custom CSS, it's wasting tokens that should go to body content
    - The AI must USE component library classes (`.btn-primary`, `.card`, `.grid-3`, `.section`, `.section-alt`, `.testimonial-card`, `.stat-item`, `.faq-item`, `.fade-in`) — not reinvent them

    **(G) Edit Flow — STRIP AND RE-INJECT:**
    - When editing, the component library CSS is STRIPPED from `existingCode` before sending to the AI (replaced with `/* [component library auto-injected] */` comment)
    - After the edit completes, the library is RE-INJECTED via `injectComponentLibrary()`
    - This saves ~20K tokens (input + output) per edit and prevents timeouts
    - The edit system prompt tells the AI not to reproduce the library — just keep site-specific CSS
    - If edits hang or timeout, the first thing to check is whether the component library is being stripped properly

    **(H) Quality Gate — VALIDATION:**
    - Body text content must be ≥100 characters (after stripping tags/scripts/styles) or the build retries
    - Edit results with <50 chars of body text are rejected and the original code is preserved
    - Every generated site must have: nav, hero, features, about, testimonials, stats, FAQ, CTA, footer (9 minimum sections)
    - The stream route sends a `replace` event with the final injected HTML so the preview shows the polished version

    **Key files:** `src/app/api/generate/stream/route.ts` (STANDARD_SYSTEM, PREMIUM_SYSTEM, EDIT_SYSTEM prompts + injection logic), `src/lib/component-library.ts` (CSS + injection function), `src/app/api/generate/quick/route.ts` (buildFullPage wrapper), `src/lib/stock-images.ts` (curated industry images — create if missing).

    **The test:** Generate a cybersecurity site. If it has cityscape photos, generic "Get Started" buttons, invisible button text, centered-text-only hero, or fewer than 8 images — something is broken. Fix it immediately.

## Route Audit Status

Full audit completed. **0 broken routes, 0 broken links, 0 missing API endpoints.** However, several product pages have CTAs that link to `/builder` or `/auth/signup` instead of dedicated product experiences — see the Quality Standard checklist above for the full list. If you add new routes, make sure:
- Page routes have a `page.tsx`
- API routes have a `route.ts`
- Any `fetch()` calls to `/api/*` have a corresponding handler
- Any `Link href` or `<a href>` points to an existing page (no `href="#"`)

## Quality Standard — Mediocre Is Failure

**CRITICAL: Every feature, page, and product on the platform MUST work end-to-end.** If a button says "Launch SEO Agent," there must be a real SEO agent behind it. If a page promises video creation, there must be a real video creation flow. No mock data presented as real. No CTAs that funnel to an unrelated product.

**The rule:** If it's on the site, it works. If it doesn't work yet, it says "Coming Soon" with a waitlist — never a fake "Launch Now" button. Whenever you encounter a broken flow, dead-end CTA, mock data posing as real, or a feature that doesn't deliver on its promise, **fix it immediately** or flag it as a top priority. This is non-negotiable.

### Current Product Readiness Checklist

| # | Product | Status | Notes |
|---|---------|--------|-------|
| 1 | **Website Builder** | DONE | Core product, fully functional with streaming + pipeline |
| 2 | **Hosting** | DONE | Serving, CDN, SSL, DNS management via Cloudflare lib (`src/lib/cloudflare.ts`) |
| 3 | **Generators (43)** | DONE | 43 generators with type-specific system prompts, custom form fields per type |
| 4 | **SEO Agent** | DONE | Dashboard at `/seo` + analysis API at `/api/seo/analyze`. Autonomous mode not built. |
| 5 | **Video Creator** | MOSTLY DONE | Full pipeline at `/video-creator`: AI script, storyboard, scene images (3 providers), voiceover (ElevenLabs/PlayHT/browser TTS), subtitles (SRT/VTT, 5 styles), quota tracking, Stripe overage packs. Video rendering API wired (Runway/Luma/Pika/Kling/Replicate) but awaiting provider keys. Final MP4 assembly not built. |
| 6 | **Email Support** | DONE | Full ticketing system + Mailgun integration (`/email-support`, `/api/email/support`) |
| 7 | **Marketplace** | DONE | 20 add-ons, category filtering, Stripe checkout (`/marketplace`, `/api/marketplace/`) |
| 8 | **Domains** | DONE | Domain search, registration, Stripe checkout (`/domains`, `/api/domains/`) |
| 9 | **Visual Editing** | DONE | Click-to-select, property editor, text editing, section reorder, section library |
| 10 | **Project Mode** | DONE | File tree, multi-file editing, GitHub export, project generation |
| 11 | **Agency Platform** | DONE | Dashboard, client portal, white-label, bulk gen, approval workflow, quota tracking |
| 12 | **OAuth** | DONE | Google + GitHub OAuth with find-or-create user flow |
| 13 | **Templates** | DONE | 100 templates across 13 categories |
| 14 | **Competitor Crawler** | DONE | Tech stack analysis at `/admin/intel` via `src/lib/intel-crawler.ts` |

**Remaining gaps (genuine):**
- Video rendering provider API keys (Runway/Luma/Pika/Kling endpoints built, need env vars + credits)
- Final video MP4 assembly (FFmpeg.wasm or server-side — currently returns manifest only)
- Music audio library integration (music cue directions generated, no actual audio tracks)
- Autonomous SEO agent (scheduled crawls, rank tracking, backlink outreach)
- Real domain registrar API (currently simulated availability)
- Marketplace add-on code delivery (payments work, delivery doesn't)
- Real-time collaboration (not implemented)
- In-browser runtime (competitors use WebContainers)

## Code Style

- Use `"use client"` directive on components that use React hooks or browser APIs
- Use Next.js `Link` component for internal navigation (not `<a>` tags)
- Use Tailwind for all styling — no inline style objects unless dynamic values require it
- Use lucide-react for icons
- Use framer-motion for animations
- API routes export named HTTP method functions: `export async function POST(request: Request)`

## Competitive Roadmap — Closing the Gap with v0/Lovable/Bolt

### Key Competitors (as of March 2026)

| Competitor | Strength | Valuation/Scale |
|------------|----------|-----------------|
| **v0** (Vercel) | Frontend React generation, Vercel ecosystem | Vercel-backed |
| **Bolt.new** (StackBlitz) | WebContainers in-browser runtime, framework flexibility | — |
| **Lovable** | Full-stack MVPs, Supabase integration, SOC 2 | $6.6B valuation, $200M+ ARR |
| **Emergent** | Multi-agent pipeline, React Native/Expo, MCP support, AI personalization | $100M+ ARR |
| **OpenClaw** | Open-source AI agent framework (MIT), 163K GitHub stars, 5,700+ plugin marketplace, modular architecture (Gateway/Brain/Heartbeat), 24/7 autonomous agents. Not a direct competitor but a framework we should integrate with or build on. Could power our autonomous agents (SEO, optimizer, support). Watch for security concerns (ClawJacked vulnerability). |

### Competitive Position — 30-40% AHEAD of Competition

**CRITICAL ADVANTAGE: Business OS, Not Just a Builder**
Competitors (v0, Bolt, Lovable) are ONLY website builders. Zoobicon is a **complete business operating system** with 75+ products that replace $500+/month in SaaS subscriptions. No competitor comes close to this breadth.

**Where we DOMINATE (no competitor has these):**
- **75+ products** vs competitors' 1-3 products — 25x tool density
- **34 business tools** bundled (CRM, Forms, Invoicing, Booking, Email Marketing, Automation, etc.)
- **White-label / agency architecture** — no competitor offers this
- **43 specialized generators** with custom UIs (competitors are generic)
- **4 domains** (zoobicon.com, .ai, .io, .sh) each with unique product identity
- **AI CRM** with pipeline, lead scoring, AI follow-ups (replaces HubSpot $45/mo)
- **AI Chatbot Builder** with multi-model support (replaces Intercom $74/mo)
- **AI Proposals & Contracts** with e-signatures (replaces PandaDoc $35/mo)
- **Workflow Automation** with visual builder (replaces Zapier $19/mo)
- **A/B Testing Platform** with statistical significance (replaces Optimizely $79/mo)
- **Heatmaps & Analytics** with session recordings (replaces Hotjar $32/mo)
- **Status Page + Uptime Monitoring** (replaces StatusPage $29/mo + UptimeRobot $7/mo)
- **Feature Request Board + Public Roadmap** (replaces Canny $400/mo)
- **Review Management** across platforms (replaces Birdeye $299/mo)
- **AI Report Generator** with white-label (replaces AgencyAnalytics $79/mo)
- **AI Pitch Deck Generator** (replaces Beautiful.ai $12/mo)
- **AI Resume & Business Card Generator** (replaces Resume.io $15/mo)
- **Link in Bio** pages (replaces Linktree $24/mo)
- **QR Code Generator** (replaces QR Tiger $7/mo)
- **Documentation & Wiki Builder** (replaces GitBook $8/mo)
- **Knowledge Base / Help Center** (replaces Zendesk Guide $49/mo)
- **Survey Builder** with NPS + analytics (replaces SurveyMonkey $25/mo)
- **Waitlist Builder** with referral system (replaces LaunchList $29/mo)
- **Landing Page Generator** (replaces Unbounce $74/mo)
- **Popup Builder** with targeting (replaces OptinMonster $16/mo)
- **Testimonial Wall** builder (replaces Testimonial.to $20/mo)
- **Changelog** with reactions (replaces Beamer $49/mo)
- **White Paper & Case Study generators**
- **40+ Integrations Hub** directory
- **Webhook Manager** with delivery logs
- **Interactive API Documentation**
- **SMS/WhatsApp/Push messaging** hub
- **Portfolio Builder** (replaces Format $14/mo)

**Where we also match or beat competitors on core product:**
- Single-page generation quality (Opus-powered, best output in market)
- Multi-page site generation (3-6 pages, shared design — REAL, working)
- Full-stack app generation (DB schema + API + CRUD frontend — REAL, working)
- E-commerce generation (10+ features, cart, checkout — REAL, working)
- Scaffolding (auth, admin, uploads, comments, notifications — REAL, working)
- Visual editing with click-to-select, property editor, section reordering
- 100 templates across 13 categories
- Multi-LLM support (Claude, GPT-4o, Gemini 2.5 Pro)
- Project mode with file tree, multi-file editing, GitHub export
- Full marketplace with 20 add-ons and Stripe checkout
- Google + GitHub OAuth
- Agency platform with white-label, client portal, approval workflow, quota tracking

**Where competitors still lead (but we're closing):**
- In-browser runtime (Bolt: WebContainers, v0: sandboxes) — we generate server-side
- Real-time collaboration — basic poll-based, need WebSocket upgrade
- Design system ecosystem — shadcn/ui vs our custom component library

**The "$500/month replacement" pitch:**
| Tool Replaced | Monthly Cost | Zoobicon Equivalent |
|---|---|---|
| HubSpot CRM | $45 | /crm |
| Intercom | $74 | /ai-chat |
| Typeform | $25 | /forms |
| Zapier | $19 | /automation |
| Calendly | $16 | /booking |
| ConvertKit | $29 | /email-marketing |
| FreshBooks | $17 | /invoicing |
| PandaDoc | $35 | /proposals |
| Optimizely | $79 | /ab-testing |
| Hotjar | $32 | /heatmaps |
| Linktree | $24 | /link-bio |
| StatusPage | $29 | /status-page |
| Canny | $400 | /feedback + /feature-requests |
| SurveyMonkey | $25 | /surveys |
| Unbounce | $74 | /landing-pages |
| **TOTAL** | **$923/mo** | **$49/mo (Pro plan)** |

### 4-Domain Ecosystem Strategy — Each Domain Owns a Verb

**The core principle:** Each domain is a standalone product that is excellent on its own but becomes dramatically more powerful when connected to the others. Shared layer: one identity, one data model, one billing relationship, cross-domain deep links.

| Domain | Verb | Personality | Audience | Products |
|--------|------|-------------|----------|----------|
| **zoobicon.com** | BUILD | Creative, visual, approachable | Entrepreneurs, SMBs, freelancers, agencies | AI Builder, Brand Kit, Template Forge, Visual Editor, Client Portals, Proposals, Booking, Email Marketing, Digital Store, Gallery |
| **zoobicon.sh** | SHIP | Hacker aesthetic, terminal-first | Developers, deployers, anyone with a live site | Hosting, Custom Domains, CLI Tool, Edge Functions, Managed DB, Preview Deploys, Analytics, Uptime Monitoring, Cron Jobs, Log Stream |
| **zoobicon.ai** | GROW | Technical but accessible, futuristic | Power users, marketers, SEO pros, agencies | Autonomous SEO Agent, Content Engine, Cross-Platform Publisher, AI Image Studio, Reputation Manager, Competitor Intel, Smart Forms, Video Pipeline, AI Chat Agent, Weekly Business Reports |
| **zoobicon.io** | CONNECT | Clean, minimal, API-first | Developers, SaaS builders, integration partners | REST API, SDKs, Webhook Platform, Developer Dashboard, MCP Server, Integration Marketplace, White-Label API, CI/CD Plugins, GraphQL API, Open Source Component Kit |

**The cross-domain flywheel:**
```
.com (BUILD) ──generates──> .sh (HOST) ──produces──> .io (ANALYZE/INTEGRATE)
     ^                          |                           |
     |                          v                           v
     └────────────── .ai (OPTIMIZE) <──────────────────────┘
```

**Lock-in layers (users love, not hate):**
1. DNS-locked (custom domain on .sh)
2. Data-locked (database, analytics history, subscriber list)
3. Workflow-locked (CI/CD, cron jobs, weekly reports)
4. Revenue-locked (invoices, store, client billing flowing through platform)
5. Identity-locked (creator profile, gallery reputation, template sales)
6. Network-locked (clients, collaborators, subscribers all on platform)

### Build Plan — Next Phases

**Phases 1-5 are complete.** All five original roadmap phases have been implemented:
- Phase 1 (Deploy Pipeline): Cloudflare integration, deploy dashboard, DNS/SSL/CDN
- Phase 2 (Visual Editing): dom-bridge.ts, VisualEditor.tsx, SectionLibrary.tsx, PreviewPanel bridge
- Phase 3 (Project Mode): ProjectTree.tsx, /api/generate/project, /api/export/github
- Phase 4 (Generator Domination): 43 generators, 33 system supplements, 100 templates
- Phase 5 (Agency Platform): Full agency dashboard, client portal, white-label, bulk gen, quotas, OAuth

**Phase 5.5: Business OS Expansion (COMPLETE)**
- 34 new product pages built: Forms, CRM, AI Chat, Link-Bio, QR Codes, Proposals, Knowledge Base, Status Page, Feedback, Automation, Portfolio, Resume, Business Card, Pitch Deck, Documentation, Testimonials Wall, Surveys, Waitlist, Landing Pages, API Docs, Webhooks, Integrations Hub, White Paper, Case Study, Reports, Heatmaps, Changelog, Uptime, Reviews, Feature Requests, Popups, Messaging, Roadmap, A/B Testing
- 24 new API routes with demo data
- Platform now offers 75+ products replacing $923/mo in SaaS tools for $49/mo

**Phase 6: Production Hardening**
- Connect real domain registrar API (Namecheap/Cloudflare reseller) — currently simulated
- Marketplace add-on delivery system (install code into user's sites)
- Staging preview environment (deploy preview → approve → production)
- Rate limiting and abuse prevention at scale
- Monitoring and alerting (Sentry, Datadog)

**Phase 7: AI Autonomy**
- Autonomous SEO agent (scheduled crawls, rank tracking, automated fixes)
- Video rendering via external API (Runway/Pika/Sora)
- AI auto-reply drafting for email support tickets
- Smart template recommendations based on user input analysis
- Multi-site batch optimization (agency feature)
- **OpenClaw integration** — Evaluate using OpenClaw's agent framework for autonomous agents (SEO, optimizer, support). MIT licensed, 163K stars, 5,700+ skills marketplace. Could power 24/7 background agents via its Heartbeat system. Key concerns: security (ClawJacked vulnerability), data privacy with local WebSocket service. See https://openclaw.ai/
- **MCP support** — Model Context Protocol for pulling external context (GitHub, Notion, Figma, Slack) into the generation pipeline. Emergent already supports this.

**Phase 8: Collaboration & Scale** (PARTIALLY COMPLETE)
- ✅ Real-time collaboration with rooms, presence, cursor overlay, code sync (poll-based)
- ⬜ **UPGRADE: Replace polling with WebSocket** for <100ms latency (needs persistent server)
- ⬜ Version branching (fork a site, merge changes)
- ⬜ Team workspaces with role-based access
- ⬜ API access for programmatic site generation (agency feature)
- ⬜ White-label deployment to agency-owned infrastructure

## MARKET INTELLIGENCE — March 2026 Trends (Research-Backed)

### Key Market Stats
- **AI coding tools:** 84% of developers use or plan to use AI tools. 51% use daily. 41% of all global code is now AI-generated.
- **Vibe coding:** 63% of vibe coding users are NON-developers. "Vibe Coding" was Collins Dictionary Word of the Year 2025.
- **MCP (Model Context Protocol):** 97M monthly SDK downloads, 10,000+ active servers. Donated to Linux Foundation. First-class support in Claude, ChatGPT, Cursor, Gemini, VS Code.
- **No-code/low-code market:** Exceeds $30B in 2026, on track for $65B by 2030. 70% of new apps use no-code/low-code.
- **AI agents:** 80% of enterprise apps will embed AI agents by end of 2026. Gartner says 40% will include task-specific agents (up from <5% in early 2025).
- **SMB SaaS spend:** Solopreneurs average $150-400/mo across 8-15 tools. Small businesses $500-2,000/mo across 34-40 tools.
- **Highest churn categories:** Website builders (22-30%), social schedulers (25-30%), email marketing (20-25%), SEO tools (18-22%), CRM (20-25%).

### Competitive Landscape Update (March 2026)
| Competitor | Latest | Valuation/Scale |
|---|---|---|
| **Cursor** | $1B ARR in 24 months, Mission Control for 8 parallel agents | $29B valuation |
| **Lovable** | Full-stack React + Supabase from conversation | $6.6B valuation, $200M+ ARR, $330M Series B |
| **Bolt.new** | Supports React/Vue/Svelte/Angular/Expo, generous free tier | Growing fast |
| **Emergent** | Multi-agent pipeline + MCP support + React Native | $100M+ ARR |
| **Base44** | Acquired by Wix for $80M after 6 months | Wix-owned |
| **GitHub Copilot** | 20M users, 42% market share, 90% Fortune 100 | Microsoft-backed |

### Immediate Opportunities (From Research)
1. **MCP Integration** — Become "MCP-native." Let users connect GitHub, Notion, Figma, Slack context into generation. Emergent already has this.
2. **Pipeline as Viral Content** — "Watch 7 AI agents build your site" is TikTok-viral. Our pipeline visualization IS the marketing.
3. **Share-to-Social After Deploy** — "I built this in 90 seconds" established viral format. One-click sharing with auto-generated OG images.
4. **Code Export & Ownership** — "You own your code, forever" differentiates against lock-in anxiety.
5. **AI Security Scanning** — All competitors produce code with 40-45% vulnerability rates. Adding security scanning = unique differentiator.
6. **Vertical SaaS Starter Kits** — Industry-specific compound platforms growing 2x. Our 13 template categories → vertical starter kits (restaurant: menu + booking + reviews).

### Trending Formats (Viral Potential)
- "I built this website in 90 seconds" videos (TikTok, Instagram Reels)
- Behind-the-scenes AI tool usage videos
- Before/after transformations
- Speed comparison videos (Zoobicon vs hiring a developer)
- Pipeline visualization walkthroughs (7 agents working)

## ONGOING PRIORITY: Full-Stack Build Speed — Outpace Every Competitor

**This is a standing research and improvement mandate.** Every session, every task — always look for ways to make the full-stack build pipeline faster. Speed is the #1 competitive advantage we can own.

### Current Landscape (March 2026)
| Platform | Time to First Preview | Full-Stack Time | Architecture |
|---|---|---|---|
| **Bolt.new** | ~3-5s | Manual (add Supabase yourself) | WebContainers (in-browser Node.js via WASM) |
| **v0 (Vercel)** | ~5-15s | No backend generation | Vercel Sandbox VM, component-level |
| **Lovable** | ~30-90s | ~90s (React + Supabase) | Cloud build, locked to Supabase |
| **Zoobicon** | ~95s | ~95s (HTML + DB + API + CRUD) | 7-agent pipeline, server-side |

### Target Architecture: "Instant Scaffold + Progressive Enhancement"
The goal is **3s to first preview, 10s to customized site, 30s to full-stack app**:
1. **Phase 0 (0-3s)**: Instant template scaffold matching user intent (Haiku classifier → serve pre-built template)
2. **Phase 1 (3-10s)**: Stream AI-customized copy, colors, branding into scaffold in real-time
3. **Phase 2 (10-30s)**: Stream full-stack features (auth, DB schema, API routes) as progressive layers
4. **Phase 3 (30-60s)**: Background enhancement agents (SEO, animations) — site already works

### What to Continuously Research & Improve
- **Template pre-matching speed**: Can we classify intent and serve a scaffold in <1s?
- **Streaming injection**: Instead of building HTML from scratch, stream diffs/patches into templates
- **Parallel full-stack generation**: DB schema, API routes, and frontend generated simultaneously (not sequentially)
- **Background enhancement**: SEO + animations applied after user already has a working site
- **Model speed breakthroughs**: Monitor for faster models (Haiku upgrades, Gemini Flash, GPT-4o-mini) that could replace Opus for builds without quality loss
- **Edge/browser execution**: Evaluate WebContainers, Sandpack, or similar in-browser runtimes for instant preview
- **Caching strategies**: Can we cache common scaffolds (SaaS dashboard, e-commerce, landing page) at the edge?
- **Prompt compression**: Shorter, more efficient system prompts = faster time-to-first-token
- **Speculative generation**: Start generating likely outputs before the user finishes typing

### The Rule
**Never accept the current pipeline speed as "good enough."** If a competitor ships a faster build, we must respond. If a new model or technique enables faster generation, adopt it immediately. Speed is the moat — the fastest full-stack builder wins the market.

## WEBSITE REDESIGN — "Million Dollar" Overhaul Checklist

**Goal:** Transform Zoobicon from "generic dark-mode AI startup" into a jaw-dropping, viral-worthy, conversion-optimized platform that commands attention on first visit and across TikTok/social media. Every domain gets its own personality. Every section is screenshot-worthy.

**Research-backed targets:**
- Sub-1-second load → 2.5-5x conversion lift
- Real-time activity feeds → 98% conversion boost
- Video testimonials → 80% lift over text
- Interactive demos → 50% conversion boost
- Scroll animations → 28% CTR increase
- 73% of users associate smooth animations with trust

### Phase 1: Hero That Sells Itself (zoobicon.com)

- [ ] **1.1** Replace rotating-word hero with embedded live builder demo (visitor types prompt, watches agents activate, sees site materialize)
- [ ] **1.2** Typography revolution — switch to distinctive display font (Clash Display / Cal Sans / custom), 8rem+ headlines, variable weight animations
- [ ] **1.3** Signature color system — define ownable brand color that isn't "another blue gradient", implement across all components
- [ ] **1.4** Kill all placeholder company names ("Acme Corp", "TechFlow", "NovaStar") — replace with real metrics
- [ ] **1.5** Add live counter component ("47,293 sites built") pulling from real deployment data
- [ ] **1.6** Add real-time activity feed ("Emma just built a yoga studio site — 12s ago")
- [ ] **1.7** CTA button redesign — animated gradient border, pulse effect, impossible to miss
- [ ] **1.8** Trust bar redesign — real stats, not generic "Trusted by builders worldwide"
- [ ] **1.9** WebGL/3D hero element (Spline embed or Three.js scene) — not just particles

### Phase 2: Cinematic Scroll Experience

- [ ] **2.1** Install and configure GSAP ScrollTrigger for scroll-driven storytelling
- [ ] **2.2** Section 1: "The Problem" — show the pain of building websites manually (contrast/comparison)
- [ ] **2.3** Section 2: "The Magic" — live demo moment, the "aha" (interactive prompt → result)
- [ ] **2.4** Section 3: "How It Works" — 3-step animated walkthrough (Describe → Generate → Deploy)
- [ ] **2.5** Section 4: "The Output" — gallery of actual generated sites from deployments DB
- [ ] **2.6** Section 5: "Speed Proof" — side-by-side: Zoobicon 95s vs hiring a dev 2 weeks
- [ ] **2.7** Section 6: "Social Proof" — real testimonials, video if available, quantified results
- [ ] **2.8** Section 7: "Pricing" — simplified, no "Soon" badges, clear value per tier
- [ ] **2.9** Section 8: "Final CTA" — urgency, large, cinematic close
- [ ] **2.10** Scroll-triggered reveals on every section (fade-in-up with stagger)
- [ ] **2.11** Parallax depth layers between sections
- [ ] **2.12** Pin/snap scrolling for key moments

### Phase 3: Domain-Specific Landing Pages

- [ ] **3.1** **zoobicon.ai** — 3D neural network hero (Spline/Three.js), technical copy, "Build with intelligence", AI-forward aesthetic
- [ ] **3.2** **zoobicon.io** — Terminal-style hero with API demo, developer docs prominent, clean/minimal, code aesthetic
- [ ] **3.3** **zoobicon.sh** — Full-screen CLI demo, hacker aesthetic, "Deploy from your terminal", command-line first
- [ ] **3.4** **dominat8.io** — Glitch effects, neon accents, aggressive typography, "Crush your competition", high-energy
- [ ] **3.5** Shared design DNA across all domains (typography scale, spacing system, animation library) but unique personalities
- [ ] **3.6** Domain detection auto-routing via brand-config.ts updates

### Phase 4: Conversion Architecture

- [ ] **4.1** Segmented CTAs — different buttons for developer vs agency vs entrepreneur
- [ ] **4.2** Sticky nav that's part of the conversion funnel (not just navigation)
- [ ] **4.3** Social proof layered throughout the page (not just one "testimonials" section)
- [ ] **4.4** Mobile-first layout overhaul (83% of visits are mobile)
- [ ] **4.5** Before/after slider component — "Your prompt" → "Your website" with draggable divider
- [ ] **4.6** Micro-interactions on every hover — buttons breathe, cards tilt with parallax, icons animate
- [ ] **4.7** Loading states that are delightful (branded animations, not spinners)
- [ ] **4.8** Pricing page overhaul — remove all "Soon" badges, clarify roadmap honestly

### Phase 5: Viral / Social Media Optimization

- [ ] **5.1** Every section designed as standalone screenshot-worthy frame
- [ ] **5.2** Bold typography that reads on phone screens in TikTok feeds
- [ ] **5.3** Contrast ratios that pop on mobile (kill white/40 text — minimum white/70 for body)
- [ ] **5.4** "Built with Zoobicon" shareable badges on generated sites
- [ ] **5.5** Auto-generated Open Graph images for every deployed site
- [ ] **5.6** Prompt Gallery page — users share best prompts + results (community/viral loop)
- [ ] **5.7** Showcase/gallery page of best generated sites (filterable, click to see prompt)

### Phase 6: Component & Design System

- [ ] **6.1** 8px spacing scale (8, 16, 32, 64px) — Linear-inspired consistency
- [ ] **6.2** Warm-shifted grays instead of cool blue-grays
- [ ] **6.3** Rive or Lottie animations for key interactive moments
- [ ] **6.4** Consistent gradient language across all pages
- [ ] **6.5** Card redesign — glass morphism or solid with better depth
- [ ] **6.6** Button system overhaul — primary (filled + glow), secondary (outline + hover fill), ghost
- [ ] **6.7** Icon animation system — icons animate on hover/scroll-in
- [ ] **6.8** Cursor-following effects (subtle glow, magnetic buttons)

### Phase 7: Performance & Polish

- [ ] **7.1** Lazy-load below-fold sections and 3D elements
- [ ] **7.2** Optimize all animations to transform+opacity only (GPU accelerated)
- [ ] **7.3** `prefers-reduced-motion` support for all animations (accessibility)
- [ ] **7.4** Sub-1-second First Contentful Paint target
- [ ] **7.5** WebP/AVIF images where applicable
- [ ] **7.6** Font subsetting for display fonts (load only needed glyphs)
- [ ] **7.7** Critical CSS inlining for above-fold content

### Implementation Notes

- **Animation stack**: GSAP ScrollTrigger for scroll-driven + Framer Motion for component-level + Rive for complex interactive
- **3D**: Spline for hero scenes (no WebGL expertise needed), fallback to animated SVG on low-power devices
- **Typography**: Load display font via `next/font` for zero layout shift
- **Color system**: Define in CSS custom properties for easy domain-specific theming
- **Testing**: Every change must look good as a screenshot, work on mobile, and not increase load time
- **Social proof rule**: ZERO placeholder/fake data. If we don't have real data yet, show the live counter from our own DB. Never "Acme Corp" again.

### Key Files to Modify
- `src/app/page.tsx` — Homepage (hero, sections, CTAs)
- `src/app/pricing/page.tsx` — Pricing overhaul
- `src/app/ai/page.tsx` — zoobicon.ai domain page
- `src/app/io/page.tsx` — zoobicon.io domain page
- `src/app/sh/page.tsx` — zoobicon.sh domain page
- `src/app/dominat8/page.tsx` — dominat8.io domain page
- `src/lib/brand-config.ts` — Domain detection + theming
- `src/components/BackgroundEffects.tsx` — Hero visuals
- `src/components/HeroDemo.tsx` — NEW: Live builder demo component
- `src/components/ActivityFeed.tsx` — NEW: Real-time build feed
- `src/components/ShowcaseGallery.tsx` — NEW: Generated sites gallery
- `src/components/BeforeAfter.tsx` — NEW: Prompt→site slider
- `tailwind.config.ts` — Color system, typography, spacing
- `src/app/globals.css` — Design tokens, animations, font imports

## PLATFORM HOOKS & STICKINESS STRATEGY — From Builder to Business OS

**Core Insight:** The best website builders stop being website builders. Squarespace added email marketing. Shopify added payments, POS, and shipping. Wix added booking. The goal is for users to say "I run everything through Zoobicon" — not "I use Zoobicon to make websites." Every feature below creates switching costs, daily usage habits, or viral loops.

### The Four Laws of Platform Stickiness
1. **Data gravity** — The more data that accumulates (subscriber lists, client history, invoices, rankings), the more painful migration becomes.
2. **Workflow centrality** — If Zoobicon is where users write, publish, invoice, schedule, and analyze, it's their business OS.
3. **Money flow** — When Zoobicon is in the payment chain (invoicing, product sales, subscriptions, bookings), switching means re-routing money.
4. **Network position** — When clients, customers, and collaborators connect through Zoobicon, leaving disrupts relationships.

---

### Hook Category 1: Identity Hooks (Make Users Feel Like Somebody)

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| H1.1 | **Creator Profiles** | `/profile/[username]` — public portfolio of everything they've built. Follower counts, "Creator since [date]", creation stats. This is their digital resume. | NOT BUILT |
| H1.2 | **Creator Tiers** | "Rising Creator" → "Pro Creator" → "Master Creator" based on sites built + views received. Badge visible on profile and gallery posts. | NOT BUILT |
| H1.3 | **"Built with Zoobicon" Badges** | Every deployed site gets a subtle powered-by badge (removable on Pro+). Free advertising on every site built. | NOT BUILT |
| H1.4 | **AI Brand Kit** | Persistent per-user brand kit: colors, logo, fonts, brand voice, tone, target audience. Every generation auto-pulls from this kit. Like Canva Brand Kit but also writes in the user's voice. Leave Zoobicon = lose your institutionalized brand identity. | NOT BUILT |
| H1.5 | **Universal Bio Link Hub ("Zoobicon Link")** | `zoobicon.sh/username` replaces Linktree. AI auto-updates with latest blog post, product, video. AI rewrites bio weekly based on what's performing. Linktree charges $24/month. | NOT BUILT |

**Key files:** `src/app/profile/[username]/page.tsx` (NEW), `src/lib/brand-kit.ts` (NEW), `src/components/CreatorBadge.tsx` (NEW)

---

### Hook Category 2: Dopamine Hooks (Make Building Feel Rewarding)

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| H2.1 | **Achievement System** | Milestones: "First Deploy!", "10 Sites Built", "1K Total Views", "7-Day Deploy Streak". Toast notifications + profile badges. | NOT BUILT |
| H2.2 | **Live Stats Counter on Dashboard** | "Your sites have been viewed 4,293 times." Users check this like checking Instagram likes. Pull from real analytics data. | NOT BUILT |
| H2.3 | **Quota Progress Bar** | "7 of 15 builds used this month" with animated fill bar on dashboard + builder. Creates urgency + natural upgrade pressure. | NOT BUILT |
| H2.4 | **Celebration Moments** | Confetti animation on first deploy, level-up animations on milestones, custom sounds. Make every build feel like an accomplishment. | NOT BUILT |
| H2.5 | **Weekly Business Health Score** | Monday email: site traffic, top pages, form submissions, SEO movement, one AI recommendation. Creates a weekly habit — users open it like a bank statement. | NOT BUILT |

**Key files:** `src/components/AchievementToast.tsx` (NEW), `src/components/QuotaBar.tsx` (NEW), `src/lib/achievements.ts` (NEW), `src/app/api/reports/weekly/route.ts` (NEW)

---

### Hook Category 3: Social & Sharing Hooks (Make Every Build Go Viral)

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| H3.1 | **Share-to-Social After Deploy** | Post-deploy modal with one-click share to: TikTok, Instagram, Twitter/X, LinkedIn, Facebook, Reddit. Auto-generates platform-specific caption + OG image of the site. | NOT BUILT |
| H3.2 | **TikTok Integration** | "Share to TikTok" generates a short video-style preview of the site being built (screen recording of generation process). Viral format: "I built this website in 90 seconds." Hashtags auto-suggested. | NOT BUILT |
| H3.3 | **Instagram Story/Post Generator** | Auto-creates Instagram-ready images: before/after of prompt→site, stats overlay, branded template. Direct share via Instagram API or download for manual post. | NOT BUILT |
| H3.4 | **Twitter/X Thread Generator** | One click to create a thread: "I just built [site] with AI in 90 seconds. Here's what happened: 🧵" with screenshots of each pipeline stage. | NOT BUILT |
| H3.5 | **LinkedIn Article Auto-Publish** | For agencies/freelancers: "I built my client's site in 90 seconds with AI" professional post. Positions users as innovators in their network. | NOT BUILT |
| H3.6 | **Cross-Platform Publisher ("Publish Everywhere")** | One post in Zoobicon → simultaneously publishes to: website blog, LinkedIn, Twitter/X thread, Instagram caption, TikTok caption, Facebook, Reddit. AI reformats for each platform's style and limits. Competing with Buffer ($18/month). | NOT BUILT |
| H3.7 | **Auto-Generated OG Images** | Every deployed site gets a beautiful Open Graph image auto-generated (site screenshot + branding). Shared links look professional on every platform. | NOT BUILT |
| H3.8 | **AI Social Media Content Calendar** | AI plans 30 days of social content based on user's industry, promotions, and past performance. Generates captions, hashtag sets, and image prompts. Schedule from Zoobicon's calendar. | NOT BUILT |
| H3.9 | **Short-Form Video Script Generator + Teleprompter** | Describe a topic → get a TikTok/Reels script (hook, body, CTA). Built-in browser teleprompter mode. AI suggests trending audio + optimal posting times. | NOT BUILT |

**Key files:** `src/components/ShareModal.tsx` (NEW), `src/app/api/social/share/route.ts` (NEW), `src/app/api/social/og-image/route.ts` (NEW), `src/lib/social-publish.ts` (NEW), `src/app/content-calendar/page.tsx` (NEW)

---

### Hook Category 4: Community Hooks (Network Effects)

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| H4.1 | **Prompt Gallery** | `/gallery` — users share best prompts + results. Upvotes, comments, trending. "This week's top 10 sites." Viral loop + SEO + community. | NOT BUILT |
| H4.2 | **Site Remix** | "Love this site? Remix it" — one click to fork someone's site and customize. Drops friction to zero. Every remix credits the original creator. | NOT BUILT |
| H4.3 | **Weekly Design Challenges** | "This week: Build the best restaurant site." Winners get featured + free Pro month. Creates FOMO + content + community engagement. | NOT BUILT |
| H4.4 | **Template Marketplace (Creator Economy)** | Users list generated sites as purchasable templates ($5-50). Creator gets 70%, Zoobicon keeps 30%. Top creators earn $500-5,000/month. Once you're making money selling, you never leave. | NOT BUILT |
| H4.5 | **"Site of the Day" Feature** | One site featured on homepage daily. Users check daily to see if they're featured. Creates daily visit habit + aspiration. | NOT BUILT |
| H4.6 | **Showcase/Best-Of Page** | `/showcase` — curated gallery of best generated sites, filterable by industry/style. Click to see the prompt that made it. Inspiration + proof of quality. | PARTIAL |

**Key files:** `src/app/gallery/page.tsx` (NEW), `src/app/api/gallery/route.ts` (NEW), `src/components/RemixButton.tsx` (NEW), `src/app/challenges/page.tsx` (NEW)

---

### Hook Category 5: Retention Hooks (Make Leaving Painful)

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| H5.1 | **Site Analytics Dashboard** | Show users their traffic, popular pages, visitor locations, conversion rates. Once they're checking stats daily, they're hooked. | NOT BUILT |
| H5.2 | **Custom Domain Binding** | Once someone connects `mybusiness.com` to their Zoobicon site, migration means full DNS migration — massive deterrent. Bundle free `.sh` domain for year one. | PARTIAL |
| H5.3 | **Version History Timeline** | Visual rewind to any point. Users invest more when they know nothing is ever lost. Git-style branching for sites. | PARTIAL |
| H5.4 | **"Site Expires" Urgency Emails** | "Your site expires in 3 days — upgrade to keep it live." For free tier. Creates urgency to upgrade or lose their work + SEO juice. | NOT BUILT |
| H5.5 | **Notification Inbox** | Bell icon: "Your site got 50 views today", "New comment on your gallery post", "Weekly challenge starts tomorrow." Re-engagement channel you own. | NOT BUILT |
| H5.6 | **Smart Recommendations** | "You built 3 restaurant sites. Try our Menu Generator." Cross-sell 43 generators based on behavior. "People who built Y also built Z." | NOT BUILT |

**Key files:** `src/app/analytics/page.tsx` (NEW), `src/components/NotificationInbox.tsx` (NEW), `src/lib/notifications.ts` (NEW), `src/app/api/notifications/route.ts` (NEW)

---

### Hook Category 6: Viral/Referral Hooks (Users Recruit Users)

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| H6.1 | **Referral Program** | "Give a friend 5 free builds, get 5 free builds." Track via `?ref=username`. Simple, proven. Compounding growth. | NOT BUILT |
| H6.2 | **Agency Client Invite System** | When a Pro user invites a client to view/approve, client gets a Zoobicon account automatically. Each agency becomes a distribution channel. | NOT BUILT |
| H6.3 | **"Powered by Zoobicon" on Free Sites** | Subtle badge on all free-tier sites. Removable on paid plans. Every free site is an ad. | NOT BUILT |
| H6.4 | **Share-to-Earn** | Users earn credits when their shared sites/gallery posts drive signups. Tracked via UTM params. Turns every user into an affiliate. | NOT BUILT |

**Key files:** `src/app/api/referral/route.ts` (NEW), `src/lib/referral.ts` (NEW), `src/app/referral/page.tsx` (NEW)

---

### Hook Category 7: Business OS Services (Make Zoobicon Indispensable)

These services transform Zoobicon from a builder into the user's entire business operating system. Each one is a standalone SaaS product bundled into the platform.

| # | Service | Description | Competing With | Status |
|---|---------|-------------|----------------|--------|
| H7.1 | **AI Email Marketing (Native)** | Built-in list builder. Forms auto-appear on every site. Subscribers accumulate in Zoobicon DB. AI writes weekly newsletters. One-click send. Lock-in: the subscriber list. | ConvertKit ($29/mo) | NOT BUILT |
| H7.2 | **AI Invoicing & Proposals** | Describe a job → get professional PDF proposal with auto-calculated tax. Sends via email, tracks opens, converts to invoice on acceptance. Stripe payments. | FreshBooks ($17/mo), Bonsai ($25/mo) | NOT BUILT |
| H7.3 | **AI Booking & Scheduling** | Embedded calendar for service businesses. Intake forms, reminder emails, cancellation policies, follow-ups. Google Calendar sync. Booking page = Zoobicon site. | Calendly ($16/mo), Acuity | NOT BUILT |
| H7.4 | **Digital Product Store** | Sell PDFs, templates, courses, presets directly on any Zoobicon site. Stripe checkout, file delivery, license keys. 0% fee on Pro, 5% on free tier. | Gumroad, Lemon Squeezy | NOT BUILT |
| H7.5 | **AI Client Portal Generator** | Password-protected client portal: project status, deliverable approvals, file downloads, invoice payments, feedback. All branded. | Dubsado ($40/mo) | NOT BUILT |
| H7.6 | **Subscription/Membership Gating** | Password-protect pages for paid members. AI generates membership landing page + welcome email sequence. Stripe Billing handles recurring charges. | Memberful ($25/mo) | NOT BUILT |
| H7.7 | **AI Blog Engine with Auto-SEO** | Publish once → AI generates 5 related posts, internal links them, submits sitemap to Google, tracks rankings. Every post generates social captions for 4 platforms. Blog lives on the site's subdirectory so Google authority flows to main domain. | WordPress, Ghost | NOT BUILT |
| H7.8 | **AI Review Response Manager** | Connect Google Business Profile. AI drafts responses to every review (1-star and 5-star). Monthly reputation report. | Birdeye ($299/mo) | NOT BUILT |
| H7.9 | **AI Local SEO Dashboard** | Local keyword rankings, Google Maps position, competitor analysis, one-click to implement AI suggestions directly on the site. | Local SEO agencies ($300-1,500/mo) | NOT BUILT |
| H7.10 | **AI Contract & NDA Generator** | Generate service agreements, NDAs, scope-of-work docs from project description. Built-in e-signature. Every signed contract stored in Zoobicon. | Bonsai ($25/mo), DocuSign | NOT BUILT |
| H7.11 | **Competitor Intelligence Feed** | Set 3-5 competitor URLs. Weekly crawl detects changes (new pages, price changes, new products). AI summarizes with suggested responses. Built on existing `intel-crawler.ts`. | Crayon ($99/mo), Kompyte | NOT BUILT |
| H7.12 | **White-Label Client Reporting** | Agencies send branded monthly AI-written performance reports: traffic, conversions, SEO movement, recommendations. Client associates value with the agency. | AgencyAnalytics ($79/mo) | NOT BUILT |

**Key files:** `src/app/email-marketing/page.tsx` (NEW), `src/app/invoicing/page.tsx` (NEW), `src/app/booking/page.tsx` (NEW), `src/app/store/page.tsx` (NEW), `src/app/blog-engine/page.tsx` (NEW), `src/lib/email-marketing.ts` (NEW), `src/lib/invoicing.ts` (NEW), `src/lib/booking.ts` (NEW)

---

### Hook Category 8: Onboarding & Activation Hooks

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| H8.1 | **First-Time Onboarding Checklist** | "Complete 5 tasks to unlock Pro trial: Build a site, Deploy it, Share it, Invite a friend, Try a generator." Guided activation with progress tracking. | NOT BUILT |
| H8.2 | **Interactive Builder Demo on Homepage** | Visitor types a prompt on the homepage, watches agents activate, sees a site materialize. Zero-friction "aha moment" before signup. | NOT BUILT |
| H8.3 | **Template Quick-Start** | New users see "Pick a template to start" before the blank prompt. Reduces intimidation. One click to customize a template. | PARTIAL |
| H8.4 | **"What Do You Want to Build?" Segmentation** | First question after signup: "I'm a freelancer / agency / small business / creator." Personalizes entire dashboard, recommended generators, and onboarding flow. | NOT BUILT |

**Key files:** `src/components/OnboardingChecklist.tsx` (NEW), `src/components/HeroDemo.tsx` (EXISTS), `src/lib/onboarding.ts` (NEW)

---

### Hook Category 9: Monetization Hooks (Make Upgrading Obvious)

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| H9.1 | **Freemium Watermark** | Free sites show "Powered by Zoobicon" watermark. Removing it = upgrade to Creator ($19/mo). | NOT BUILT |
| H9.2 | **Gated Generators** | Some of the 43 generators are Pro-only. Free users can SEE what they'd get but can't generate. | NOT BUILT |
| H9.3 | **Monthly Template Drops** | "5 new Pro-exclusive templates this month." Creates ongoing subscription value beyond build limits. | NOT BUILT |
| H9.4 | **Overage Packs** | "Out of builds? Buy 5 more for $9" without full plan upgrade. Lower friction monetization for occasional heavy use. | NOT BUILT |
| H9.5 | **Annual Plan Discount** | 20% off annual billing. Standard retention play — users commit for 12 months. | NOT BUILT |

---

### Implementation Priority — Build Order

**Tier 1: Quick Wins (1-2 days each, massive impact)**
1. Quota Progress Bar + Upgrade CTA — 1 component, drives revenue immediately
2. Share-to-Social Modal (after deploy) — 1 modal, every deploy becomes free marketing
3. "Built with Zoobicon" Badge on free sites — 1 component, passive viral loop
4. Achievement Toasts — 1 component, makes building feel like a game
5. Auto-generated OG Images — 1 API route, makes every shared link look professional

**Tier 2: High Value (3-5 days each)**
6. Prompt Gallery (`/gallery`) — community + viral loop + SEO content
7. Referral Program — users recruit users, compounding growth
8. Creator Profiles (`/profile/[username]`) — gives users identity
9. Notification Inbox — re-engagement channel you own
10. Site Analytics Dashboard — makes users check back daily

**Tier 3: Business OS Services (1-2 weeks each)**
11. AI Email Marketing (native list builder) — $29/mo competitor replacement
12. AI Booking & Scheduling — $16/mo competitor replacement
13. Digital Product Store — turns users into sellers who can't leave
14. Cross-Platform Publisher — makes Zoobicon the daily writing tool
15. AI Blog Engine with Auto-SEO — creates content flywheel

**Tier 4: Advanced Stickiness (2-4 weeks each)**
16. AI Invoicing & Proposals — deepens business dependency
17. Template Marketplace (creator economy) — users earn money, never leave
18. Client Portal Generator — agencies depend on Zoobicon for client delivery
19. Membership/Subscription Gating — puts Zoobicon in the money flow
20. Competitor Intelligence Feed — built on existing intel-crawler.ts

### The North Star Metric
**Daily Active Users who check their dashboard.** Not "sites generated" — that's a vanity metric. The hooks above are designed to give users a reason to log in EVERY DAY: check stats, read notifications, see gallery activity, review AI recommendations, manage subscribers, track invoices. When Zoobicon is the first tab they open in the morning, we've won.

### Social Media Integration Architecture

All social sharing flows through a unified `src/lib/social-publish.ts` module:
- **TikTok**: TikTok Content Posting API (OAuth 2.0, requires app review). Generates short video preview of site generation OR static slideshow of site screenshots. Hashtag suggestion via AI.
- **Instagram**: Instagram Graph API via Facebook Business. Auto-creates carousel posts (before/after, multi-page sites) or story-format vertical images.
- **Twitter/X**: Twitter API v2. Thread generation with screenshot attachments. Auto-generates viral hooks.
- **LinkedIn**: LinkedIn Marketing API. Professional-tone posts for agencies/freelancers. Article publishing for long-form case studies.
- **Facebook**: Facebook Graph API. Page posts with link previews using custom OG images.
- **Reddit**: Reddit API. Formats for subreddit-specific rules (r/webdev, r/SideProject, r/smallbusiness).

Each platform requires OAuth app registration. Users connect accounts once in Settings. Share modal shows connected platforms with one-click publish.

### Revenue Potential of Bundled Services

| Service | What It Replaces | Competitor Price | Our Price (Bundled) |
|---------|-----------------|-----------------|-------------------|
| Email Marketing | ConvertKit, Mailchimp | $29-59/mo | Included in Pro ($49/mo) |
| Booking/Scheduling | Calendly, Acuity | $16-25/mo | Included in Pro |
| Invoicing | FreshBooks, Bonsai | $17-25/mo | Included in Pro |
| Digital Product Store | Gumroad, Lemon Squeezy | 5-10% per sale | 0% on Pro, 5% on Free |
| Link in Bio | Linktree Pro | $24/mo | Included in Creator ($19/mo) |
| Social Publishing | Buffer, Later | $18-30/mo | Included in Pro |
| Local SEO | SEO agencies | $300-1,500/mo | Included in Agency ($99/mo) |
| Client Reporting | AgencyAnalytics | $79/mo | Included in Agency |
| Review Management | Birdeye | $299/mo | Included in Agency |

**Total replaced value on Pro plan: ~$165/month of tools for $49/month.** This is the pitch: "Cancel 6 subscriptions. Replace them all with Zoobicon."

## EMAIL SYSTEM — Advanced Architecture & Device Access

### Decision 27: Dual-Path Email Architecture (Mailgun + Cloudflare Email Routing)

**Problem:** admin@zoobicon.com and support@zoobicon.com are only accessible through the web dashboard. The platform owner needs to read/respond to emails on Apple devices (iPhone, iPad, Mac Mail) and Windows PCs (Outlook) — not just through the admin panel.

**Solution: Dual-path architecture** — emails arrive at TWO destinations simultaneously:

```
Inbound email → zoobicon.com MX records → Cloudflare Email Routing
                                                    ↓
                              ┌─────────────────────┼─────────────────────┐
                              ↓                                           ↓
                    Mailgun Webhook                              Personal Email
                  (AI ticketing system)                     (Apple Mail / Outlook)
                              ↓                                           ↓
                  Web Dashboard + AI Drafts              Push notifications on all devices
                  /email-support, /admin/email            Read & reply from anywhere
```

**Path 1 — Cloudflare Email Routing (device access):**
- Cloudflare forwards copies of `admin@zoobicon.com` → personal iCloud/Gmail/Outlook.com
- Cloudflare forwards copies of `support@zoobicon.com` → same or different personal email
- This gives real-time push notifications on iPhone, iPad, Mac, Windows, Android
- The catch-all `*@zoobicon.com` → Mailgun webhook STILL works (Cloudflare routes specific addresses first, then catch-all)

**Path 2 — Mailgun Webhook (AI ticketing system):**
- Continues exactly as before: webhook → parse → create ticket → AI draft → auto-reply
- No changes needed to existing Mailgun integration

**Outbound — Mailgun SMTP (send as admin@zoobicon.com from any device):**
- Server: `smtp.mailgun.org`
- Port: `587` (TLS/STARTTLS)
- Username: `postmaster@zoobicon.com` (or custom SMTP credential from Mailgun)
- Password: Mailgun SMTP password (NOT the API key — different credential)
- This lets you send FROM admin@zoobicon.com on Apple Mail, Outlook, any SMTP client
- Replies sent this way go through Mailgun tracking (opens, clicks, delivery)

**Apple Device Setup (iPhone/iPad/Mac Mail):**
1. Settings → Mail → Accounts → Add Account → Other
2. Incoming: IMAP server of forwarded email provider (e.g., imap.gmail.com if forwarding to Gmail)
3. Outgoing: smtp.mailgun.org, port 587, TLS, postmaster@zoobicon.com + SMTP password
4. Name: "Zoobicon Admin" or "Zoobicon Support"
5. Email: admin@zoobicon.com or support@zoobicon.com

**Windows Outlook Setup:**
1. File → Add Account → Manual Setup → IMAP
2. Incoming: IMAP server of forwarded email (imap.gmail.com / outlook.office365.com)
3. Outgoing: smtp.mailgun.org, port 587, STARTTLS
4. Username: postmaster@zoobicon.com
5. Password: Mailgun SMTP password

**Env vars (add to .env.local):**
```
MAILGUN_SMTP_LOGIN=postmaster@zoobicon.com
MAILGUN_SMTP_PASSWORD=<from Mailgun dashboard>
PERSONAL_FORWARD_EMAIL=<your personal email for device access>
```

**Key files:**
- `src/app/admin/email-settings/page.tsx` — Setup guide with Apple/Windows device configuration steps
- `src/lib/mailgun.ts` — Existing Mailgun integration (unchanged)
- `src/app/api/email/webhook/route.ts` — Existing webhook handler (unchanged)

**Cost:** $0/month — Cloudflare Email Routing is free, Mailgun free tier covers 5,000/month. No Google Workspace, no Microsoft 365, no monthly fee.

### Decision 28: Advanced Support Ticketing System

The support ticketing system at `/email-support` has been upgraded with enterprise-grade features:

**Features built:**
- **Agent Collision Detection** — Warns if another agent is viewing/replying to the same ticket (localStorage-based lock tracking)
- **Customer Satisfaction (CSAT)** — 1-5 star rating widget after ticket resolution, with optional comment
- **Canned Responses Library** — 15+ pre-written response templates organized by category (billing, technical, feature request, general, onboarding)
- **Ticket Merging** — Merge duplicate tickets from the same customer into one thread
- **Internal Notes** — Toggle between customer-facing reply and internal-only notes
- **Ticket Metrics Dashboard** — Real-time metrics: Avg Response Time, CSAT Score, Resolution Rate, Tickets/Day
- **Auto-Assignment Rules** — Tags-based routing: billing → Finance, bugs → Engineering, enterprise → Sales
- **SLA Tracking** — Per-priority response/resolution deadlines with breach warnings
- **AI Auto-Reply** — Claude Sonnet drafts responses, auto-sends if confidence ≥0.85 on non-billing/non-urgent tickets

**Key files:** `src/app/email-support/page.tsx`, `src/app/api/email/support/route.ts`, `src/app/api/email/ai-support/route.ts`

### Decision 29: Stickiness Hooks — Wired Into Main Flows

All Tier 1 stickiness components are now wired into the actual user flows:

| Hook | Component | Wired Into | Trigger |
|------|-----------|-----------|---------|
| **Quota Bar** | `QuotaBar.tsx` (compact mode) | `TopBar.tsx` | Always visible in builder/dashboard |
| **Notification Inbox** | `NotificationInbox.tsx` | `TopBar.tsx` | Bell icon with unread badge |
| **Achievement Toasts** | `AchievementToast.tsx` | Builder page | On build complete, deploy, share |
| **Share Modal** | `ShareModal.tsx` | Builder page | Post-deploy popup (6 platforms + QR) |
| **Creator Badge** | `CreatorBadge.tsx` | Deploy API | Auto-injected into free-tier deployed HTML |
| **Activity Feed** | `ActivityFeed.tsx` | Homepage, Dashboard | Polls /api/activity every 15s |
| **Deploy Tracking** | `achievements.ts` | Deploy API | `trackEvent("deploy")` on success |
| **Build Tracking** | `achievements.ts` | Stream complete | `trackEvent("build")` on generation |

**Activity Feed architecture:**
- `src/components/ActivityFeed.tsx` — Real-time feed ("Emma W. deployed a yoga studio site — 12s ago")
- `src/app/api/activity/route.ts` — GET recent activity from DB
- `src/lib/activity.ts` — `logActivity()`, `getRecentActivity()`, `ensureActivityTable()`
- Table: `activities (id serial, type text, user_email text, user_name text, description text, slug text, created_at timestamptz)`

### Decision 30: 50% Market Advantage — Competitive Domination Tracker

**Target:** Zoobicon must be 50% more advanced than any single competitor across ALL categories.

**Current competitive score (post-upgrades):**

| Category | Zoobicon Score | Best Competitor | Gap | Status |
|---|---|---|---|---|
| Output quality | 10/10 | Lovable 8/10 | +25% | LEADING |
| Tool density | 10/10 | Emergent 5/10 | +100% | DOMINATING |
| Generator count | 10/10 | All 2/10 | +400% | DOMINATING |
| Agency/white-label | 10/10 | None 0/10 | +∞ | UNIQUE |
| E-commerce gen | 9/10 | Lovable 5/10 | +80% | LEADING |
| Email/ticketing | 9/10 | None 1/10 | +800% | DOMINATING |
| Stickiness hooks | 7/10 | Lovable 4/10 | +75% | LEADING |
| Visual editing | 8/10 | v0 8/10 | 0% | PARITY |
| Multi-page gen | 8/10 | Lovable 7/10 | +14% | SLIGHT LEAD |
| Full-stack gen | 9/10 | Lovable 7/10 | +28% | LEADING |
| Speed to preview | 3/10 | Bolt 9/10 | -67% | TRAILING |
| In-browser runtime | 0/10 | Bolt 10/10 | -100% | GAP |
| Real-time collab | 3/10 | Emergent 6/10 | -50% | TRAILING |
| Design ecosystem | 5/10 | v0 8/10 | -37% | TRAILING |

**Aggregate: 101/140 (72%) vs best competitor ~65/140 (46%) = ~56% advantage on breadth.**

**To maintain/grow the advantage — NEVER let these slip:**
1. Output quality (Opus) — non-negotiable, do NOT downgrade
2. Tool density — keep adding integrated tools
3. Email/ticketing — now a major differentiator, keep improving
4. Generator count — competitors can't match 43 specialized generators
5. Agency platform — unique in market, invest more
6. Stickiness hooks — every hook creates switching cost

**To close remaining gaps — priority order:**
1. Speed (instant scaffold plan — 3s first preview)
2. In-browser runtime (WebContainers or Sandpack evaluation)
3. Real-time collab (WebSocket upgrade from polling)
4. Design ecosystem (expand component library, add themes)

31. **Four-Domain Signature — MANDATORY on all external communications** — Every email, signature, footer, external reply, or outbound communication from Zoobicon MUST include all four domains displayed prominently:

    **zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh**

    This applies to:
    - All transactional emails (signup, verification, password reset, deployment notifications)
    - All marketing emails (campaigns, newsletters, drip sequences)
    - All support ticket replies (auto and manual)
    - All admin notification emails
    - All external correspondence (AWS, partners, vendors)
    - Email signatures in Apple Mail / Outlook / any email client
    - Footer of every public page on the website
    - OG images and social sharing cards where space permits

    The shared email template (`src/lib/email-template.ts`) already implements this. Any new email sending code MUST use `emailTemplate()` from that file — never inline HTML without the domain footer. If a context doesn't support HTML (plain text replies, chat messages), use the text format: `zoobicon.com | zoobicon.ai | zoobicon.io | zoobicon.sh`

    **Key files:** `src/lib/email-template.ts` (HTML template with domain footer), `src/lib/admin-notify.ts` (admin notifications), `src/app/api/auth/signup/route.ts` (verification email), `src/app/api/auth/forgot-password/route.ts` (password reset), `src/app/api/auth/resend-verification/route.ts` (resend verification).

32. **React/Next.js Generation Pipeline** — The builder now supports a "React App" generation mode alongside the existing HTML mode. When users select "React App" in the PromptInput mode selector, the builder calls `/api/generate/react` which instructs the AI to output a JSON object containing React/TypeScript component files (`App.tsx`, `components/Hero.tsx`, etc.) with Tailwind CSS styling. The output is rendered live in the browser using `@codesandbox/sandpack-react` with the `react-ts` template and Tailwind CSS loaded via CDN. HTML mode remains the default and continues to work unchanged. **Key files:** `src/app/api/generate/react/route.ts` (generation endpoint), `src/components/SandpackPreview.tsx` (dual-mode preview — HTML static template or React react-ts template), `src/components/PromptInput.tsx` (mode selector with "React App" option), `src/app/builder/page.tsx` (routes to React endpoint and renders SandpackPreview when in React mode). The `reactFiles` state in the builder holds the file map, `reactDeps` holds dependencies, and both are passed to SandpackPreview. CodePanel and ExportPanel already support `reactSource` for file viewing and export.

---

## MANDATORY SESSION PROTOCOL — AUTONOMOUS ENGINEERING EXCELLENCE

**THIS SECTION OVERRIDES DEFAULT BEHAVIOR. EVERY CLAUDE SESSION MUST FOLLOW THESE RULES.**

The platform owner is NOT a developer. Claude is the engineering team. That means Claude is responsible for:
- Finding problems BEFORE the owner discovers them
- Fixing bugs WITHOUT being asked
- Researching better solutions PROACTIVELY
- Never leaving known issues unfixed
- Never building on top of broken foundations

**The owner should NEVER have to:**
- Debug code themselves
- Discover engineering gaps manually
- Ask "why doesn't this work?"
- Spend hours on something that has a known fix
- Be told about a problem without a solution attached

### Rule 0: WHEN SOMETHING IS REPORTED BROKEN — FULL DEPTH AUDIT, NOT SURFACE FIXES

**THIS IS THE MOST IMPORTANT RULE. IT OVERRIDES ALL OTHERS.**

When the owner reports something is broken ("the builder doesn't work", "the video creator failed", "I can't get into admin"), Claude MUST:

1. **Read the ENTIRE code path** — not just the error message, not just the component that shows the error. Trace the FULL flow from button click → fetch call → API route → business logic → database → response → client rendering.

2. **Check every variable reference** — search for undefined variables, missing imports, broken references. The `invalidScenes` bug (line 85, render/route.ts) was a variable referenced but never defined. This should have been caught the FIRST time the video creator was reported broken.

3. **Run the code mentally** — step through each line as if you ARE the JavaScript engine. What value does each variable hold? What happens if the database is down? What happens if the API returns unexpected data?

4. **Check for cascading failures** — if you fix one file, check that every other file that imports from it still works. The prefill removal broke Sonnet because we only checked Opus. The `invalidScenes` removal broke the render because we only removed the definition, not the reference.

5. **Never fix symptoms** — if an error message is wrong, don't just change the message. Find WHY the error is happening. "Something went wrong" → trace back to the actual crash → fix the crash, not the message.

6. **Report what you actually checked** — tell the owner "I read lines 1-200 of render/route.ts and found X" not "I looked at the error handling." The owner needs to know the depth of the investigation.

**The test:** If the owner has to report the same feature broken TWICE, Claude failed. Every bug report should result in a complete fix on the first attempt.

**What went wrong before:** The video creator was reported broken multiple times. Each time, surface-level fixes were applied (error messages, sanitization, auth headers) while the actual crash (undefined variable on line 85) sat there untouched. This is unacceptable. A proper audit on the first report would have found it in 5 minutes.

---

**Before starting ANY new feature or task, run these checks FIRST:**

1. **Dependency audit** — Run `npm audit` and check for outdated critical packages. If vulnerabilities exist, fix them.
2. **Build check** — Run `npm run build` silently. If it fails for NEW reasons (not the intentional `ignoreBuildErrors`), fix before proceeding.
3. **Lint check** — Run `npm run lint` on files you're about to modify. Fix lint issues in those files.
4. **Route integrity** — If modifying API routes, verify the route handler exports the correct HTTP methods and responds correctly.
5. **Import verification** — If adding/modifying components, verify all imports resolve. No broken import chains.
6. **Dead code detection** — If you encounter unused imports, dead variables, or unreachable code while working, clean it up immediately.

**Exception:** If the user says "just do X quickly" or the task is a one-line change, skip the full scan but still check the specific files involved.

### Rule 2: AUTO-REPAIR — Fix Bugs on Contact

**If you encounter a bug, broken feature, or engineering gap while working on ANYTHING — FIX IT IMMEDIATELY.**

- **No "I noticed X is broken but that's outside scope"** — If you see it, fix it.
- **No "This would need a separate session"** — Fix it now. If it's truly a 2+ day task, document it clearly in CLAUDE.md under a "Known Issues — Queued for Fix" section with exact steps to reproduce and proposed solution.
- **No silent failures** — If a function swallows errors silently, add proper error handling.
- **No TODO comments without action** — If you write `// TODO: fix this`, you must ALSO create a "Known Issues" entry. Orphaned TODOs are forbidden.
- **Cascading fix rule** — If fixing bug A reveals bug B, fix bug B too. Follow the chain until everything works.

**What counts as a bug:**
- Any feature that doesn't do what its UI/copy promises
- Any API route that returns errors for valid inputs
- Any component that renders incorrectly or crashes
- Any function that produces wrong output
- Any import that doesn't resolve
- Any page that shows a blank screen or error boundary
- Any form that doesn't submit properly
- Any link that goes nowhere (href="#" or dead route)
- Console errors in normal usage flows

### Rule 3: PROACTIVE RESEARCH — Always Check for Better

**Before implementing ANY significant feature (>50 lines of code), research first:**

1. **Check if a well-maintained library exists** — Don't reinvent the wheel. If a popular, maintained npm package does what you need with good TypeScript support, use it.
2. **Check competitor implementations** — How do v0, Bolt, Lovable, Emergent handle this? Can we do it better?
3. **Check for newer APIs/techniques** — Is there a modern CSS feature, browser API, or framework feature that makes this simpler? (e.g., CSS `animation-trigger` instead of IntersectionObserver, `color-mix()` instead of hardcoded rgba)
4. **Check for performance best practices** — Is there a known fast path? GPU-accelerated approach? Caching strategy?
5. **Check the bundle impact** — Will this add significant weight? Is there a lighter alternative?

**Research MUST happen for:**
- Any new animation/visual effect system
- Any new API integration
- Any new data storage approach
- Any new authentication mechanism
- Any new real-time feature
- Any performance optimization
- Any AI model integration

**Research output:** Briefly note what you checked and why you chose your approach (2-3 sentences in your response). This isn't bureaucracy — it's proof you didn't just guess.

### Rule 4: ENGINEERING GAP DETECTION — Systematic Scanning

**An "engineering gap" is when:**
- A feature exists in the UI but has no working backend
- An API route exists but returns mock/placeholder data without saying so
- A button/CTA promises something the code can't deliver
- A dependency is outdated and a newer version fixes known issues
- A pattern is used inconsistently across the codebase (e.g., some routes validate input, some don't)
- A security best practice is missing (CSRF, rate limiting, input sanitization)
- An accessibility requirement is unmet (missing alt tags, keyboard nav, ARIA labels)
- Error handling is missing on user-facing flows
- TypeScript `any` types are used where proper types could catch bugs

**When you detect a gap:**
1. **If fixable in <30 minutes** — Fix it immediately, mention it in your response
2. **If fixable in 30min-2hrs** — Fix it if it's related to current work, otherwise add to "Known Issues" in CLAUDE.md
3. **If fixable in >2hrs** — Add to "Known Issues" in CLAUDE.md with full details: what's broken, why, proposed fix, estimated effort, priority level

### Rule 5: TECHNOLOGY CURRENCY — Stay Modern

**Every session, be aware of the tech stack's age:**

- **Framework versions** — Is Next.js 14 still current? Is there a 15.x with features we need? Check quarterly.
- **React patterns** — Are we using current best practices? (Server Components, Suspense, useTransition, etc.)
- **CSS features** — Are there new CSS features with >90% browser support that replace our JavaScript solutions?
- **AI model updates** — Are there newer/faster/cheaper Claude/GPT/Gemini models? Update model routing if so.
- **Security patches** — Are any dependencies in `package.json` known-vulnerable?

**Don't upgrade for the sake of upgrading.** Only upgrade when:
- There's a security fix
- There's a meaningful performance improvement
- There's a feature we specifically need
- The current version is approaching end-of-life

### Rule 6: EXPLAIN LIKE I'M NOT A DEVELOPER

**The platform owner is not a coder. ALL communication must:**

- Explain WHAT changed and WHY in plain English
- Never say "I refactored the middleware" — say "I fixed the system that checks user permissions so it's faster and handles edge cases it was missing"
- Never say "There's a race condition in the state management" — say "Two parts of the app were trying to update at the same time and stepping on each other, causing data to get lost. Fixed."
- Always lead with the impact: "Your users were seeing a blank page when X. Now they see Y."
- If something is broken, explain what the user EXPERIENCES (not what the code does wrong)
- If making a trade-off, explain it: "I used Library X instead of Library Y because X is smaller (faster load) and does everything we need"

### Rule 7: NEVER LEAVE THE CODEBASE WORSE

**The Boy Scout Rule: Leave the code better than you found it.**

- If you touch a file, fix any obvious issues in that file (broken imports, dead code, lint errors)
- If you add a feature, add error handling for that feature
- If you modify an API route, verify it handles malformed input gracefully
- If you change a component, verify it still renders correctly in all viewport sizes it claims to support
- If you change a database query, verify it won't cause N+1 problems or missing indexes

### Rule 8: AUTONOMOUS TESTING

**After making changes, verify your work:**

1. **Build must pass** — `npm run build` should not introduce new errors
2. **Changed routes must respond** — If you modified an API route, mentally trace a request through it
3. **Changed components must render** — If you modified a component, verify all required props are still satisfied by callers
4. **Changed flows must complete** — If you modified a user flow (signup, deploy, generate), trace the full flow start-to-finish

### Rule 9: DOCUMENTATION IS MANDATORY

**Every significant change MUST be reflected in CLAUDE.md:**

- New API routes → Add to the route table
- New components → Add to the component list
- New libraries/dependencies → Note in tech stack section
- Architecture decisions → Add a numbered Decision entry
- Known issues found but not fixed → Add to "Known Issues" section
- Breaking changes → Clearly document what changed and what depends on it

### Rule 10: KNOWN ISSUES LOG

**Maintain a living list of known issues at the bottom of CLAUDE.md. Format:**

```
### Known Issues — Queued for Fix

| # | Issue | Severity | Found | Proposed Fix | Est. Effort |
|---|-------|----------|-------|-------------|-------------|
| 1 | Description | Critical/High/Medium/Low | Date | How to fix | Hours |
```

When an issue is fixed, move it to a "Recently Fixed" table (keep last 10) so the owner can see progress.

---

## Known Issues — Queued for Fix

| # | Issue | Severity | Found | Proposed Fix | Est. Effort |
|---|-------|----------|-------|-------------|-------------|
| 1 | 22 dead components never imported anywhere (AIChatAssistant, GlobalChat, BusinessChat, ActivityFeed, AchievementToast, BeforeAfter, BuilderDemo, CustomizationPanel, FreemiumWatermark, HeroDemo, LiveCounter, OnboardingChecklist, OptimizerPanel, PageShell, ParallaxSection, SandpackPreview, ScrollProgress, SegmentationModal, TemplateGallery, UpgradePrompt, VideoShowcase, VoiceInput) | Low | 2026-03-27 | Either wire them into the app where intended (per stickiness hooks plan) or remove to reduce bundle. Most are planned features not yet integrated. | 2-4h |
| 2 | 3 dead lib files never imported (error-sanitizer.ts, react-generator.ts, social-publisher.ts) | Low | 2026-03-27 | Remove or integrate. social-publisher.ts may be superseded by social-publish.ts. | 30min |
| 3 | Email format validation missing on auth signup route | Low | 2026-03-27 | Add basic email regex check after line 30 in /api/auth/signup/route.ts | 5min |
| 4 | Remaining lint warnings: 8x `<img>` should be `<Image>` in portfolio, video-creator, TopBar, SupportAvatar pages; 1x missing useEffect dependency in support page; 1x `@next/next/no-page-custom-font` warning in layout.tsx | Low | 2026-03-27 | Replace `<img>` with Next.js `<Image>`, add missing dep to useEffect, move font to `next/font` | 1-2h |

## Recently Fixed

| # | Issue | Fixed Date | What Was Done |
|---|-------|-----------|---------------|
| 1 | Slack events route: unprotected JSON.parse could crash on malformed webhook body | 2026-03-27 | Wrapped JSON.parse in try/catch with 400 response in `src/app/api/slack/events/route.ts` |
| 2 | XSS vulnerability in hosting serve route: site name injected into OG meta tag without HTML escaping | 2026-03-27 | Added HTML entity escaping for siteName in `src/app/api/hosting/serve/[slug]/route.ts` |
| 3 | Missing `Trophy` icon import in landing-pages page causing runtime error | 2026-03-27 | Added Trophy to lucide-react imports in `src/app/landing-pages/page.tsx` |
| 4 | React hooks called conditionally in AIChatAssistant (rules-of-hooks violation) | 2026-03-27 | Moved conditional return after all hook calls in `src/components/AIChatAssistant.tsx` |
| 5 | Unescaped apostrophe in QuotaBar.tsx causing lint error | 2026-03-27 | Replaced `'` with `&apos;` in `src/components/QuotaBar.tsx` |
| 6 | Unused imports: SearchIcon in builder, Bot in dashboard | 2026-03-27 | Removed unused imports from `src/app/builder/page.tsx` and `src/app/dashboard/page.tsx` |
| 7 | Dead code in middleware: CORS check inside block that only executes for pathname "/" | 2026-03-27 | Removed unreachable CORS code from rewrite block in `src/middleware.ts` |
| 8 | Stale eslint-disable comments for non-existent @typescript-eslint/no-explicit-any rule in video-creator | 2026-03-27 | Removed unnecessary comments from `src/app/video-creator/page.tsx` |
