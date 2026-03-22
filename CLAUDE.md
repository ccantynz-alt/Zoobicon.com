# CLAUDE.md — Zoobicon Project Guide

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
| `/api/generate/images` (POST) | — | — | AI image generation (Replicate/Stability) |
| `/api/generate/ai-images` (POST) | — | — | Embed AI images into existing HTML |
| `/api/generate/edit-diff` (POST) | — | — | Diff generation for variant comparison |

### Output Formats

**Single-page (default):** Complete `.html` file — CSS + JS inlined, no external dependencies, images via picsum.photos. Component library CSS auto-injected.

**Multi-page:** JSON with `{ siteName, pages: [{ slug, title, html }], navigation: [{ label, href }] }`. Each page is standalone HTML with shared design (fonts, colors, nav, footer). Max 6 pages.

**Full-stack:** JSON with `{ description, schema (SQL), apiEndpoints: [{ method, path, handler }], code (HTML with CRUD UI) }`. Real PostgreSQL schemas, RESTful Next.js handlers, interactive frontend with forms/tables/modals.

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
30 pages total. All verified working. Key routes:
- `/` — Landing page
- `/builder` — Main AI website builder (the core product)
- `/edit/[slug]` — Post-deploy live editor with version history
- `/dashboard` — User dashboard
- `/admin` — Admin dashboard (fallback credentials in auth route)
- `/admin/email-settings` — Email configuration (Mailgun setup guide, API keys, notification prefs)
- `/admin/pre-launch` — Pre-launch checklist (75+ items across 12 categories)
- `/auth/*` — Login, signup, forgot-password, reset-password, settings
- `/products/*` — Product pages (website-builder, seo-agent, video-creator, email-support, hosting)
- `/generators` — Hub page linking to all 32+ generators
- `/dominat8` — Secondary brand landing page
- `/pricing`, `/privacy`, `/terms`, `/support`, `/domains`, `/marketplace`, `/hosting`
- `/developers`, `/cli`, `/sh`, `/ai`, `/io` — Developer/branded routes
- `/agencies` — Agency-focused page
- `/wordpress` — WordPress plugin landing page + download

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

19. **WordPress Connect Plugin** — The `public/wordpress-plugin/` directory contains the Zoobicon Connect WordPress plugin (PHP). This is a standalone WordPress plugin that customers install on their WP sites to receive deployments from Zoobicon. The plugin registers REST endpoints at `/wp-json/zoobicon/v1/` (deploy, status, pages, delete). Authentication uses a Connect Key (`zbc_*`) auto-generated on plugin activation. The Zoobicon side has a proxy at `/api/export/wordpress/deploy` that forwards deployments to the customer's WP site. The `WordPressExport.tsx` component has two modes: "Deploy to WordPress" (live push) and "Export Theme" (download ZIP). The `/wordpress` page is the plugin landing page. Key files: `public/wordpress-plugin/zoobicon-connect.php`, `src/app/api/export/wordpress/deploy/route.ts`, `src/components/WordPressExport.tsx`, `src/app/wordpress/page.tsx`.

20. **Email is Mailgun-only — NO Google Workspace** — All email (inbound admin inbox, inbound support tickets, outbound notifications/replies) runs through Mailgun. No Google Workspace, no Resend dependency. One service, one API key. Architecture: Mailgun receives emails for `admin@zoobicon.com` and `support@zoobicon.com` via MX records, forwards to webhooks (`/api/email/inbox` and `/api/email/support/inbound`), which store in the database. Outbound goes via Mailgun API. `src/lib/admin-notify.ts` tries Mailgun first, falls back to Resend (legacy), then console logging. The `/admin/email` and `/email-support` pages show DEMO DATA banners when Mailgun is not connected (the hardcoded `DEMO_EMAILS` and `DEMO_TICKETS` arrays are fallback placeholders, NOT real data). Setup guide is at `/admin/email-settings`. Env vars: `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `ADMIN_EMAIL`. Cost: $0 on Mailgun free tier (5,000 emails/month).

21. **Pre-launch checklist at `/admin/pre-launch`** — 75+ checklist items across 12 categories (infrastructure, security, email, payments, SEO, performance, quality, UX, AI pipeline, competitive edge, legal, monitoring). Progress tracked via localStorage. Includes competitive position notes vs v0/Bolt/Lovable/Emergent. Admin dashboard has quick links to this page and `/admin/email-settings`.

22. **Admin panel backgrounds brightened** — All admin pages use `bg-[#131520]` or `bg-gray-900` instead of the ultra-dark `#04020a`/`#09090b`/`gray-950` they had before. This improves text contrast and visibility across the admin panel. Email support page also brightened. Do not revert to ultra-dark backgrounds.

23. **NEVER commit secrets or API keys — ZERO TOLERANCE** — `.env.local` contains all production secrets (Mailgun, Stripe, Anthropic, OAuth, Cloudflare, etc.) and is gitignored. **NEVER** commit `.env.local`, `.env`, or any file containing real API keys, passwords, tokens, or secrets. Only `.env.example` and `.env.local.example` (which contain empty placeholder values) are tracked in git. Before every commit, verify no secrets are staged — run `git diff --cached` and check for key patterns (`sk_live_`, `key-`, `whsec_`, `AIza`, `ghp_`, `gho_`, `xoxb-`, actual passwords). A previous Mailgun credential leak caused a **two-week service shutdown**. If you accidentally stage a file with secrets, `git reset HEAD <file>` immediately. If a secret is ever committed, rotate the key immediately and force-push to remove it from history. This rule overrides all other instructions — no shortcut, no exception.

24. **Stripe multi-tier checkout** — Three paid plans use Stripe: Creator ($19/mo → `STRIPE_CREATOR_PRICE_ID`), Pro ($49/mo → `STRIPE_PRO_PRICE_ID`), Agency ($99/mo → `STRIPE_AGENCY_PRICE_ID`). Enterprise ($299/mo) is contact-sales only. The checkout route at `/api/stripe/checkout` accepts `{ email, plan: "creator" | "pro" | "agency" }`. Plan price IDs and names are defined in `src/lib/stripe.ts`. All three pricing page buttons route through Stripe checkout. If adding new plans, add the price ID env var, update `PLAN_PRICE_IDS` in stripe.ts, and update the admin page env vars list.

25. **Video Creator pipeline — STRICT honesty standard** — The Video Creator at `/video-creator` has a multi-stage pipeline. What works: AI script generation, storyboard generation (Sonnet), scene image generation (Replicate/OpenAI/Stability), voiceover (ElevenLabs/PlayHT/browser TTS), subtitle generation (SRT/VTT, 5 caption styles), full pipeline orchestration, quota tracking with Stripe overage packs. What does NOT work yet: video rendering (API routes built for Runway/Luma/Pika/Kling/Replicate but no provider keys configured), final MP4 assembly (manifest only, no FFmpeg), music audio (direction cues only, no actual tracks). **RULES:** (1) Never show dev-facing messages to users (no "add API_KEY", no "No provider configured"). (2) Unbuilt features say "Coming Soon" — never fake "Launch Now". (3) Subtitles are free (pure text processing) — do NOT gate behind video addon. (4) The full pipeline must pass data directly between stages — never rely on React state for cross-stage data (race condition). (5) Pipeline status must show per-stage progress, failures, and skips honestly. (6) The product page at `/products/video-creator` must accurately describe what's built vs coming. Key files: `src/app/video-creator/page.tsx`, `src/app/api/video-creator/` (10 routes), `src/lib/video-render.ts`, `src/lib/video-assembly.ts`, `src/lib/voiceover.ts`, `src/lib/subtitle-gen.ts`, `src/lib/scene-image-gen.ts`, `src/lib/video-usage.ts`, `src/lib/video-templates.ts`.

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

### Competitive Position

**Where we match or beat competitors:**
- Single-page generation quality (Opus-powered, best output in market)
- Multi-page site generation (3-6 pages, shared design — REAL, working)
- Full-stack app generation (DB schema + API + CRUD frontend — REAL, working)
- E-commerce generation (10+ features, cart, checkout — REAL, working)
- Scaffolding (auth, admin, uploads, comments, notifications — REAL, working)
- Visual editing with click-to-select, property editor, section reordering (matches v0/Bolt)
- White-label / agency architecture (UNIQUE — no competitor offers this)
- Tool density: 21+ integrated tools vs competitors' 3-5
- 43 specialized generators with custom UIs (UNIQUE — competitors are generic)
- 100 templates across 13 categories
- Multi-LLM support (Claude, GPT-4o, Gemini 2.5 Pro)
- Project mode with file tree, multi-file editing, GitHub export (matches Bolt)
- Full marketplace with 20 add-ons and Stripe checkout
- Google + GitHub OAuth
- Agency platform with white-label, client portal, approval workflow, quota tracking

**Where competitors lead:**
- In-browser runtime (Bolt: WebContainers, v0: sandboxes) — we generate server-side
- Real-time collaboration — not implemented
- Design system ecosystem — shadcn/ui vs our custom component library

### Build Plan — Next Phases

**Phases 1-5 are complete.** All five original roadmap phases have been implemented:
- Phase 1 (Deploy Pipeline): Cloudflare integration, deploy dashboard, DNS/SSL/CDN
- Phase 2 (Visual Editing): dom-bridge.ts, VisualEditor.tsx, SectionLibrary.tsx, PreviewPanel bridge
- Phase 3 (Project Mode): ProjectTree.tsx, /api/generate/project, /api/export/github
- Phase 4 (Generator Domination): 43 generators, 33 system supplements, 100 templates
- Phase 5 (Agency Platform): Full agency dashboard, client portal, white-label, bulk gen, quotas, OAuth

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
