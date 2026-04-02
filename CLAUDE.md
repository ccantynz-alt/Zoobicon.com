# CLAUDE.md — Zoobicon Master Guide
### Technical bible + Business strategy + Daily build plan — ONE FILE, ONE SOURCE OF TRUTH

---

> **HOW TO USE THIS FILE EVERY MORNING:**
> 1. Scroll to CURRENT STATUS at the very bottom
> 2. Read the "Next action" line
> 3. Open a new Claude session, paste this whole file, say:
>    *"I'm working on Zoobicon. Here is my CLAUDE.md. Continue from where I left off."*
> 4. Claude will know everything. No explanation needed.

---

# PART 1 — TECHNICAL RULES
## These rules govern the codebase. Hard-won. Do not modify without care.

---

## CORE PRINCIPLE — NEWEST TECHNOLOGY, ALWAYS FIRST

**THIS OVERRIDES EVERYTHING ELSE IN THIS DOCUMENT.**

Zoobicon is an AI-built platform. There is NO excuse for using old technology. Every decision, every feature, every line of code must use the newest, most advanced technology available.

**The rules:**
1. **No old-school output** — React/Next.js components only. NOT static HTML blobs.
2. **In-browser preview** — Sandpack or WebContainers. No 60-95 second server-side waits.
3. **Intellectual crawlers** — Market Intelligence Crawler runs continuously. Competitor ships something new → we know within 12 hours → match or beat within 48 hours.
4. **First to market** — If we can't be first, we must be best. "Good enough" is not acceptable.
5. **Technology currency** — Every session: latest Next.js? Latest React? Latest models? If not, upgrade.
6. **No legacy debt** — Old code holding us back gets replaced. Not patched. Replaced.
7. **Output quality = revenue** — Every generated site must look like 2027 technology.

**Current technology targets (March 2026):**
- Output format: React/Next.js + Tailwind CSS (NOT static HTML)
- Preview: Sandpack in-browser live preview
- Framework: Next.js 15+ App Router, Server Components, Streaming
- AI Models: Claude Opus/Sonnet 4.6, GPT-4o/5, Gemini 2.5 Pro
- Runtime: Sandpack/WebContainers for in-browser execution
- Deployment: Vercel one-click from generated code
- Design system: shadcn/ui (industry standard for React)

**HARD RULE — NO OLD TECHNOLOGY KEPT AS FALLBACK:**
When we adopt new technology, the old is REMOVED. Not kept alongside. Deleted. Stale = dead.

**HARD RULE — FINISH WHAT YOU START:**
If something is started, it MUST be finished. No half-built features. No abandoned code paths. No "we'll come back to this later." Every feature, every component, every integration must be completed to production quality before moving on. If a task is too big to finish in one session, document EXACTLY where it was left off in CLAUDE.md with a "NEXT ACTION" line so the next session picks it up immediately. Unfinished code is worse than no code — it creates confusion, conflicts, and technical debt. The rule: START → FINISH → TEST → DEPLOY. No exceptions.

**The test:** If a user builds on Zoobicon then tries Lovable or Bolt, they must think "Zoobicon was BETTER." Not "about the same." BETTER. If they don't think that, we've failed.

---

## TECHNOLOGY RADAR — Check Every Session Before Building Anything

**ADOPT NOW (proven, must implement):**
- Sandpack for in-browser React preview ✅ (installed)
- shadcn/ui as component design system
- React Server Components for generation output
- Tailwind CSS v4 (if stable)
- MCP (Model Context Protocol) for tool integration
- GitHub sync for generated projects
- Vercel deployment integration

**EVALUATE (emerging, first-mover advantage):**
- WebMCP (Google, Feb 2026) — structured website interactions for AI agents
- A2A (Agent-to-Agent protocol) — multi-agent communication standard
- AG-UI (CopilotKit) — agent-to-frontend communication protocol
- Agent Memory — persistent context across sessions (NO ONE has this yet)
- Veo 3.1 API — native audio + video generation
- Kling 3.0 API — cost-effective video at scale
- Seedance 2.0 — multi-modal input

**WATCH (coming):**
- WebContainers (StackBlitz) — full Node.js in browser
- Real-time AI video editing (late 2026)
- Agent-native startups bypassing traditional software

**RULE: ADOPT list not implemented = bug, fix immediately. EVALUATE item could give advantage = research and propose. WATCH item moves to EVALUATE = flag immediately.**

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

## NEXT PRIORITY: Component Registry + Streaming Assembly Architecture

**STATUS: BUILT AND WIRED. 100 components in the registry. Streaming generation active.**

The builder now uses a 100-component registry for instant assembly (<1 second), then AI customizes via streaming SSE.

**The new architecture:**

```
User Prompt
  ↓
AI selects components from registry (Haiku, <2 seconds)
  ↓
Each component streamed to Sandpack as it's customized
  ↓
User sees site building itself live (navbar → hero → features → ...)
  ↓
Total: <30 seconds for a complete, polished site
```

**Component Registry (50+ polished React components):**
- NOT full website templates — individual section components
- Each component is production-ready, beautiful, responsive
- Categories: navbars (5), heroes (5), features (5), testimonials (3), pricing (3), stats (3), FAQ (2), CTAs (3), footers (3), about (3), contact (2), galleries (2), etc.
- Stored as TypeScript string templates in src/lib/component-registry/
- AI SELECTS which components to use, then CUSTOMIZES content only
- Like shadcn/ui but for complete page sections

**Streaming Assembly:**
- SSE stream from /api/generate/react-stream
- Each component sent as a separate SSE event
- Sandpack renders incrementally — site builds in front of the user
- First component visible in <3 seconds
- Full site in <30 seconds

**Why this is better than snapshots:**
- Infinite combinations (100+ components × N arrangements)
- AI chooses the best component for each section
- Customization is per-component (fast) not per-site (slow)
- New components can be added without rebuilding templates
- Quality is consistent because each component is hand-polished

**Component count target: 100+ (NOT 50)**
The owner's words: "If it means creating 100+ then that's what we need to do."
We're going to take customers from the competition. We need to back what we say.

**Component breakdown (100+ total):**
- Navbars: 8 variants (transparent, dark, centered, mega, sticky, minimal, colored, glass)
- Heroes: 10 variants (split, centered, video, gradient, image, animated, minimal, dark, dashboard, stats)
- Features: 8 variants (icon grid, alternating, cards, tabs, bento, timeline, comparison, numbered)
- Testimonials: 6 variants (cards, quote, carousel, video, logos, metrics)
- Pricing: 5 variants (3-tier, 2-tier, toggle, enterprise, comparison)
- Stats: 4 variants (gradient, cards, counters, strip)
- FAQ: 3 variants (accordion, two-column, search)
- CTA: 6 variants (gradient, split, banner, floating, newsletter, app download)
- Footer: 5 variants (4-column, minimal, mega, centered, dark)
- About: 5 variants (split, team, timeline, mission, founder)
- Contact: 4 variants (form+map, simple, split, chat)
- Gallery: 4 variants (masonry, grid, carousel, lightbox)
- Blog: 4 variants (grid, featured, minimal, magazine)
- E-commerce: 6 variants (products, featured, cart, categories, deals, reviews)
- Forms: 4 variants (signup, waitlist, multi-step, survey)
- Misc: 8 variants (logos, comparison, process, integrations, dashboard, screenshots, video, countdown)

**Implementation files:**
- src/lib/component-registry/index.ts — Registry + selection + assembly logic
- src/lib/component-registry/navbars.ts — All navbar variants
- src/lib/component-registry/heroes.ts — All hero variants
- src/lib/component-registry/features.ts — All feature variants
- src/lib/component-registry/testimonials.ts — All testimonial variants
- src/lib/component-registry/pricing.ts — All pricing variants
- src/lib/component-registry/footers.ts — All footer variants
- src/lib/component-registry/extras.ts — Stats, FAQ, CTA, About, Contact, Gallery, Blog, etc.
- src/app/api/generate/react-stream/route.ts — Streaming SSE endpoint
- Update builder to use streaming assembly instead of single JSON call

## TECHNOLOGY RADAR — What Claude Must Research Every Session

**Before building ANYTHING, Claude must check: is there a newer/better way to do this?**

## COMPETITIVE MANDATE — 80-90% MORE ADVANCED THAN COMPETITORS

**Non-negotiable. Otherwise there is no point.**

**Speed targets:**
- Scaffold preview: <1 second (Sandpack pre-built React components)
- AI customization: 3-10 seconds (streaming changes into scaffold)
- Full custom generation: <30 seconds (React components, not HTML)
- Deploy to production: <5 seconds (Vercel one-click)

**Quality standard:**
- Every generated site = $50K+ agency quality
- Modern React patterns (hooks, composition, server components)
- shadcn/ui design system
- Tailwind CSS only (no CSS-in-JS, no styled-components)
- TypeScript throughout
- Responsive mobile-first
- WCAG AA accessible
- SEO optimized by default

**Monthly measurement:** Build same site on Zoobicon vs Lovable/Bolt/v0. Must be clearly ahead on speed, quality, and features. If not — fix immediately.

---

## WHAT IS THIS PROJECT?

Zoobicon is a **white-label AI website builder platform** built with Next.js 14, React 18, TypeScript, and Tailwind CSS. Multi-LLM pipeline (Claude, GPT, Gemini) with 7-agent build pipeline. Supports multiple brands from single codebase via `src/lib/brand-config.ts`.

### Brands / Domains
- **Zoobicon only**: zoobicon.com, zoobicon.ai, zoobicon.sh, zoobicon.io, zoobicon.app
- **Dominat8 is a separate codebase** — separate GitHub repo, separate Vercel, separate Supabase. See DOMINAT8_CLAUDE.md.

## Tech Stack

- **Framework**: Next.js 14 (App Router) with React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS custom properties (no styled-jsx, no CSS modules)
- **AI**: Multi-LLM — Anthropic Claude, OpenAI GPT, Google Gemini via `src/lib/llm-provider.ts`
- **Database**: Neon (serverless Postgres) via `@neondatabase/serverless`
- **Payments**: Stripe
- **Icons**: lucide-react (tree-shaken)
- **Animations**: framer-motion

## Build & Run

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
```

`ignoreBuildErrors: true` and `ignoreDuringBuilds: true` in next.config.js — intentional for rapid iteration.

## Architecture

### AI Generation Pipeline (src/lib/agents.ts)
7-agent multi-phase pipeline, ~95s total (within Vercel 300s limit):

- **Phase 1 — Strategy (~4s):** Strategist Agent (Haiku) → JSON strategy
- **Phase 2 — Planning (~6s, parallel):** Brand Designer + Copywriter + Architect (all Haiku)
- **Phase 3 — Build (~70s):** Developer (Opus) → complete HTML ~32K tokens. **Opus is non-negotiable.**
- **Phase 4 — Enhancement (~15s, parallel):** SEO Agent + Animation Agent (both Sonnet)

### Generation Endpoints (src/app/api/generate/)

| Route | Model | What It Does |
|-------|-------|-------------|
| `/api/generate` POST | Opus | Non-streaming single-page build with retry |
| `/api/generate/stream` POST | Opus | Streaming build, cross-provider failover |
| `/api/generate/pipeline` POST | Pipeline | Direct 7-agent pipeline |
| `/api/generate/multipage` POST | Sonnet | 3-6 page sites |
| `/api/generate/fullstack` POST | Sonnet | DB schema + API routes + frontend |
| `/api/generate/variants` POST | Sonnet | 2-3 design variants |
| `/api/generate/email` POST | Sonnet | Email template generation |
| `/api/generate/quick` POST | Haiku | Lightweight fast generation |
| `/api/generate/react` POST | Sonnet | React/TypeScript — outputs JSON `{ files, dependencies }` for Sandpack |
| `/api/generate/images` POST | — | AI image generation |

### Hosting & Deployment (src/app/api/hosting/)

| Route | What It Does |
|-------|-------------|
| `POST /api/hosting/deploy` | Deploy → DB record → returns `https://[slug].zoobicon.sh` |
| `GET /api/hosting/serve/[slug]` | Serves live HTML from DB |
| `GET/PUT /api/hosting/sites/[siteId]/code` | Fetch/update code + versions |
| `/api/hosting/dns` | DNS management (needs Cloudflare integration) |
| `/api/hosting/ssl` | SSL provisioning (needs Cloudflare integration) |

### Key Library Files (src/lib/)
- `agents.ts` — 7-agent pipeline
- `llm-provider.ts` — Multi-LLM abstraction
- `component-library.ts` — CSS design system injected into every generated site
- `brand-config.ts` — White-label brand system
- `db.ts` — Neon database connection
- `cloudflare.ts` — Cloudflare API integration
- `intel-crawler.ts` — Competitor analysis engine
- `email-template.ts` — Shared email template (always includes 4-domain footer)

---

## IMPORTANT DECISIONS — DO NOT REVERT

1. **No styled-jsx** — Removed. Use Tailwind only. Adding back causes build errors.
2. **No duplicate Next config** — Only `next.config.js`. Never create a second.
3. **ESLint/TS ignored in builds** — Intentional. Lint separately.
4. **Model routing — Opus for builds** — Developer agent MUST use `claude-opus-4-6`. NEVER downgrade to Sonnet. Noticeably worse output.
5. **Multi-LLM** — Three providers: `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `OPENAI_API_KEY`.
6. **Component library injection — MANDATORY** — Every generated site gets it. Without it buttons are invisible. Do not remove.
7. **Email is Mailgun-only — NO Google Workspace** — One service, one API key. No exceptions.
8. **WordPress Export is export-only** — Do not invest further in WordPress plugin. Focus on zoobicon.sh hosting.
9. **NEVER commit secrets or API keys — ZERO TOLERANCE** — Previous Mailgun leak caused two-week shutdown. If accidentally staged: `git reset HEAD <file>` immediately. If committed: rotate key + force-push.
10. **Admin panel backgrounds** — Use `bg-[#131520]` or `bg-gray-900`. Do not revert to ultra-dark.
11. **Four-Domain Signature — MANDATORY on all external communications** — Every email, footer, external reply must show: `zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh`
12. **Video Creator — STRICT honesty** — Never show dev-facing messages to users. Unbuilt features say "Coming Soon." Never fake "Launch Now."
13. **Generated website quality — PREMIUM OR NOTHING** — Every site must look like $20K+ agency built it. Failing this standard = broken product.
14. **Mediocre is failure** — If a feature isn't built yet, "Coming Soon" with waitlist. Never "Launch Now" for unbuilt features.
15. **React/Next.js Generation** — "React App" mode uses Sandpack. HTML mode is default and unchanged.
16. **Auth-aware navbars** — Read `localStorage("zoobicon_user")`. Do not revert to hardcoded "Sign in."
17. **Opus for builds** — Pipeline v3 fits ~95s within Vercel 300s limit via parallelizing planners.
18. **Public API v1** — `/api/v1/*` uses stateless HMAC-SHA256 keys (`zbk_live_*`). Do not change auth scheme without updating all v1 routes.
19. **AI Video Pipeline — OWN STACK, NO HEYGEN** — We build our own video generation pipeline. NEVER depend on HeyGen or any third-party avatar API. Our pipeline uses Replicate (bridge) then self-hosted GPUs: Fish Speech (voice) → FLUX (avatar generation) → SadTalker (lip-sync). We control the stack, we set the pricing, we sell the API. HeyGen code may remain as legacy but is NOT the primary path. `REPLICATE_API_TOKEN` is the required env var. Goal: be the BEST AI video generator on the market — 80-90% ahead of competition. No compromises.
20. **Video Creator — Chat-based flow ONLY** — The video creator at `/video-creator` uses a conversational chat interface. User describes what they want → Claude writes scripts → user approves → video generates. NO storyboard editor, NO font pickers, NO platform selectors. Simple. The old storyboard page lives at `/video-creator/storyboard` and is NOT the default.
21. **No flip-flopping on architecture decisions** — Once a decision is locked in CLAUDE.md, it stays. Don't switch between HeyGen and Replicate. Don't switch between scaffold templates and AI generation. Pick ONE path, commit, ship.
22. **Speed is non-negotiable** — If we can't be the fastest with what's currently available, we BUILD something in parallel to make sure we ARE the fastest. No excuses. No "it takes time." Build a faster path or optimise until we lead.
23. **Backend + Frontend built together** — Every generated app includes a working backend from day one. No frontend-only sites. Auth, database, storage, email — all auto-provisioned. This is what Lovable does. We do it better.
24. **Models stay warm** — Cron job pings Replicate models every 5 minutes. No cold starts. First request hits a warm model. Cost ~$0.50/day is worth saving 60 seconds per customer request.
25. **No timelines, no phases** — Don't say "this week" or "next month." Build everything NOW. The competition doesn't take breaks and neither do we. Foot on the accelerator at all times.
26. **Never ask permission to build** — Craig is running multiple 24/7 businesses. He is NOT the bottleneck. Claude builds, pushes, and keeps going. If something needs building, BUILD IT. Don't ask "should I?" or "want me to?" — just do it. The only time to ask is if a decision could break something already working in production.
27. **Never take your foot off the gas** — Build until the project is complete. No pausing, no waiting, no "I'll do this next session." Every session picks up where the last one left off and keeps building.

---

## MANDATORY SESSION PROTOCOL — CLAUDE IS THE ENGINEERING TEAM

The platform owner is NOT a developer. Claude is responsible for finding problems BEFORE the owner discovers them.

**The owner should NEVER have to:**
- Debug code themselves
- Discover engineering gaps manually
- Ask "why doesn't this work?"
- Be told about a problem without a solution attached

### Rule 0: FULL DEPTH AUDIT when something broken — not surface fixes
Trace FULL code path. Check every variable. Run code mentally. Check cascading failures. Never fix symptoms. If owner reports same feature broken TWICE, Claude failed.

### Rule 1: Pre-task checks
Dependency audit → build check → lint check → route integrity → import verification.

### Rule 2: AUTO-REPAIR — fix bugs on contact
No "that's outside scope." No "separate session." Fix it now or document in Known Issues with exact steps.

### Rule 3: PROACTIVE RESEARCH before any significant feature
Check if library exists. Check competitor implementations. Check newer APIs. Check bundle impact. Note what you checked and why you chose your approach.

### Rule 4: ENGINEERING GAP DETECTION
Feature in UI but no backend = gap. API returns mock data without saying so = gap. Button promises something code can't deliver = gap. Fix or document.

### Rule 5: TECHNOLOGY CURRENCY
Every session be aware of stack's age. Only upgrade for: security fix, meaningful performance improvement, needed feature, or approaching end-of-life.

### Rule 6: EXPLAIN LIKE I'M NOT A DEVELOPER
Plain English always. Never "I refactored the middleware." Say "I fixed the permissions system so it handles edge cases it was missing." Lead with impact to the user.

### Rule 7: BOY SCOUT RULE — leave code better than you found it

### Rule 8: VERIFY after changes — build must pass, routes must respond, components must render

### Rule 9: UPDATE THIS CLAUDE.md for every significant change

### Rule 10: MAINTAIN KNOWN ISSUES LOG below

---

## COMPETITIVE POSITION (March 2026)

| Competitor | Strength | Valuation |
|---|---|---|
| v0 (Vercel) | Frontend React, Vercel ecosystem | Vercel-backed |
| Bolt.new | WebContainers in-browser runtime | Growing |
| Lovable | Full-stack React + Supabase | $6.6B, $200M+ ARR |
| Emergent | Multi-agent + MCP + React Native | $100M+ ARR |

**Where Zoobicon dominates:** 75+ products vs competitors 1-3. 43 generators. Agency white-label (unique). 4-domain ecosystem.

**Where competitors lead (closing):**
- Speed to first preview — Bolt 3-5s vs our 95s (instant scaffold plan targets 3s)
- In-browser runtime — Bolt: WebContainers, we: server-side
- Real-time collab — needs WebSocket upgrade from current polling

**Aggregate position: ~56% advantage on breadth. Target: 80-90% ahead.**

---

## KNOWN ISSUES — QUEUED FOR FIX

| # | Issue | Severity | Found | Proposed Fix | Est. Effort |
|---|-------|----------|-------|-------------|-------------|
| — | No open issues | — | — | — | — |

## RECENTLY FIXED

| # | Issue | Fixed | What Was Done |
|---|-------|-------|---------------|
| 1 | 18 dead components never imported | 2026-03-28 | Removed all 18 unused component files |
| 2 | 4 dead lib files never imported | 2026-03-28 | Removed auto-pilot, error-sanitizer, react-generator, social-publisher |
| 3 | Email format validation missing on auth signup | 2026-03-28 | Added regex validation with onBlur + submit check |
| 4 | 14x `<img>` replaced with Next.js `<Image>` | 2026-03-28 | Updated portfolio, video-creator, agencies, SupportAvatar, TopBar, AiImagesPanel, ShareModal, SeoPreview |
| 5 | Slack events: unprotected JSON.parse could crash | 2026-03-27 | Wrapped in try/catch |
| 6 | XSS in hosting serve route | 2026-03-27 | Added HTML entity escaping for siteName |
| 7 | Missing Trophy icon import in landing-pages | 2026-03-27 | Added to lucide-react imports |
| 8 | React hooks called conditionally in AIChatAssistant | 2026-03-27 | Moved conditional return after all hooks |
| 9 | Unescaped apostrophe in QuotaBar.tsx | 2026-03-27 | Replaced with `&apos;` |

---

---

# PART 2 — BUSINESS STRATEGY & OPERATIONS
## Business model, infrastructure, revenue, daily routine.
## Does NOT override Part 1. Adds context around it.

---

## CRAIG'S MISSION

Replace the 24/7 physical business with Zoobicon. This is the future. Build it like a buyer is watching every day.

**The customer sees:** ONE product. Zoobicon. One login, one invoice, one support number.
**You see:** 8 suppliers on wholesale pricing, none visible to the customer.
**The gap between what they pay and what it costs you is your business.**

---

## ALL ZOOBICON DOMAINS — CONFIRMED IN CLOUDFLARE

| Domain | Purpose | Status |
|---|---|---|
| zoobicon.com ⭐ | Main platform | ✅ Active |
| zoobicon.ai | AI brand identity | ✅ Active |
| zoobicon.io | Developer / API | ✅ Active |
| zoobicon.sh | Technical / hosting | ✅ Active |
| zoobicon.app | Mobile app + admin dashboard | ✅ Registered 2026-03-28 |

**Other domains in Cloudflare (separate projects):**
48co.nz, bookaride.co.nz (7.44k visitors), hibiscustoairport.co.nz (3.22k visitors), ledger.ai (needs setup), verom.ai

---

## SUPPLIER STACK (INVISIBLE TO CUSTOMERS)

| Customer pays for | Powered by | Your cost | Margin |
|---|---|---|---|
| Website hosting | Vercel | ~$0.50-2/cust | ~95% |
| Domain | Tucows (connected) | ~$9 wholesale | ~59% |
| DNS + SSL | Cloudflare (free) | $0 | ~100% |
| Business email | Zoho → Postal (Yr2) | $0-1/cust | ~90%+ |
| Transactional email | Mailgun | ~$0.001/email | ~70% |
| AI auto-reply | Claude API | ~$4-8/cust/mo | ~75% |
| Payments clip | Stripe Connect | Stripe fee only | ~70% |
| Data + analytics | Supabase | ~$0.10/cust | ~90% |

---

## ALL RECURRING REVENUE STREAMS (CLIP THE TICKET)

**Infrastructure (highest margin):**
- Domain registration + renewal: $18-35/yr (cost $9 Tucows)
- DNS management: $5-9/mo (cost $0 Cloudflare)
- Website hosting: $19-49/mo (cost ~$2/mo)
- SSL: bundled (cost $0)

**Email (stickiest):**
- Business email hosting: $6-12/mo per mailbox
- Transactional email: $15-49/mo
- AI auto-reply: $29/mo add-on (cost ~$6 Claude API)

**AI Add-ons (pure margin):**
- AI site maintenance: $29/mo (crawlers watch their site)
- AI SEO monitor: $19/mo (intellectual crawlers)
- AI video + image content: $39/mo (already built)
- AI business analytics: $19/mo (plain English via Claude)

**Commerce (passive):**
- Booking + payments clip: 1.5% per transaction via Stripe Connect
- Domain marketplace: 10-15% commission

---

## PRICING TIERS

| Plan | Price | Includes |
|---|---|---|
| Starter | $49/mo | Site + domain + email (3 mailboxes) + SSL |
| Pro | $129/mo | + AI auto-reply + SEO monitor |
| Agency | $299/mo | + AI video + 5 sites + priority support |
| White-label | $499/mo | Full platform reseller licence |

Each reseller at $499/mo typically brings 20-50 of their own clients. 10 resellers = 200-500 end users without individual selling.

---

## REVENUE TARGETS

| Milestone | Customers | MRR | Team |
|---|---|---|---|
| Escape velocity | 80 | ~$5k/mo | You + AI |
| Full-time justified | 120 | ~$8k/mo | You + AI |
| First hire | 150 | ~$12k/mo | You + VA ($800/mo) |
| Platform sellable | 400 | ~$28k/mo | You + VA + dev |
| Exit ready | 4,000 | ~$290k/mo | Team 4-5 |
| Exit value (realistic) | — | — | $3.5M-$7M |

---

## PHASE 1 BUILD PLAN — DO IN ORDER, ONE CHECKBOX AT A TIME

### STEP 1 — Cloudflare Setup
- [x] All 5 domains in Cloudflare and Active ✅
- [x] zoobicon.app registered 2026-03-28 ✅
- [ ] Enable Email Routing on zoobicon.com → Cloudflare → Email → Email Routing → Enable
- [ ] Set up Zoho Mail mailboxes: hello@ support@ billing@ noreply@ on zoobicon.com
- [ ] Enable SSL Full (Strict) on all 5 domains
- [ ] Point all 5 domains to same Vercel deployment in DNS
- [ ] Fix ledger.ai — showing "Finish setup" in Cloudflare

### STEP 2 — Staging Environments
- [ ] Create Mailgun subaccount: mg-staging.zoobicon.com
- [ ] Create `staging` branch in GitHub
- [ ] Verify Vercel preview deployments active
- [ ] Set `NEXT_PUBLIC_ENV=staging` vs `production`
- [ ] Staging reputation NEVER touches production. Ever.

### STEP 3 — AI Auto-Reply Pipeline
- [ ] Create Cloudflare Worker: `zoobicon-ai-support`
- [ ] Connect Mailgun inbound webhook → Worker URL
- [ ] Write Claude system prompt (product questions only, never mention Claude/AI/Anthropic)
- [ ] Fallback: confidence <80% → routes to human inbox
- [ ] Test 10 sample emails before going live

### STEP 4 — Admin Mobile Dashboard (zoobicon.app)
- [ ] Build `/admin/mobile` — optimised for iPhone/iPad
- [ ] Shows: support emails (Claude handled vs needs human), new signups, MRR today, site health, expiring domains
- [ ] Bookmark to iPhone + iPad home screen (behaves like app)
- [ ] Year 2: wrap in native Expo app for App Store at zoobicon.app

### STEP 5 — Stripe Subscriptions + Billing
- [ ] Set up Stripe Products + Prices for all 4 tiers
- [ ] Build `/pricing` page
- [ ] Build `/onboarding` — domain + site + email set up automatically
- [ ] Connect Stripe webhooks → Supabase
- [ ] Test full signup → payment → dashboard flow

---

## PHASE 2 — AFTER PHASE 1 COMPLETE

**Intellectual Crawlers** — Competitor monitor (12hr), Technology scout (48hr), Customer SEO monitor (paid add-on), Zoobicon health monitor (15min)

**Postal Self-Hosted Email** — Hetzner VPS + Postal, warm IPs over 6-12 months alongside Mailgun

**White-Label Reseller Panel** — Approach 5 NZ/AU agencies as first resellers

**Geographic Expansion** — Pacific Islands → Philippines → Indonesia → Vietnam

---

## EMAIL ON YOUR DEVICES

- **iPhone + iPad:** Spark by Readdle (free) — best Apple email app, handles all accounts
- **Windows:** Zoho Mail web app or connect via IMAP
- **Send as zoobicon.com from any device:** SMTP via Mailgun (smtp.mailgun.org, port 587)
- **Receive on devices:** Cloudflare Email Routing forwards admin@ and support@ to your personal email → Spark picks it up with push notifications

---

## DECISIONS LOG

| Date | Decision | Reason |
|---|---|---|
| 2026-03-28 | AWS rejected — not using | AWS declined account. Cloudflare + Vercel + Hetzner is better architecture anyway. |
| 2026-03-28 | Mailgun for AI auto-reply | Handles 80% of support. Claude API underneath. ~$4-8/mo per customer. |
| 2026-03-28 | Zoho Mail for mailboxes | Free, covers all domains. Switch to Postal self-hosted in Year 2. |
| 2026-03-28 | No SiteGround ever | Old tech. cPanel. PHP. 2005 architecture. Against core principles. |
| 2026-03-28 | White-label at $499/mo | Each reseller brings 20-50 clients. Multiplies acquisition without individual selling. |
| 2026-03-28 | 1.5% transaction clip | Passive. 1,000 customers × $5k/mo = $75k/mo clip. |
| 2026-03-28 | zoobicon.app registered | Mobile admin dashboard. Craig needs full command centre on iPhone/iPad now. |
| 2026-03-28 | Admin dashboard = Phase 1 | Craig runs 24/7 physical business alongside build. Needs mobile command centre urgently. |
| 2026-03-28 | Single CLAUDE.md | Two files = confusion. One file = source of truth. Technical + business merged. |

---

## NOTES TO SELF

- You are building your future. Every hour here moves you away from the 24/7 business that is burning you out.
- Consistency beats perfection. Show up, check this file, do the next unchecked box. That's it.
- You do not need to understand everything at once. Claude knows the full stack. Ask anything.
- When overwhelmed: close everything, open this file, find next unchecked box, do only that.

---

## CURRENT STATUS — UPDATE THIS EVERY EVENING BEFORE STOPPING

**Date last updated:** 2026-03-29
**Current phase:** Phase 1
**Current step:** Builder + Video Creator UI overhaul — CRITICAL PRIORITY

**Completed 2026-03-29 (massive build day):**
- ✅ Fixed all 4 known issues (dead components, dead libs, email validation, img→Image)
- ✅ KILLED HTML OUTPUT — React/Sandpack is the ONLY generation mode
- ✅ Streaming React generation — files appear progressively in preview
- ✅ Fixed Sandpack full-screen preview (was only showing tiny portion)
- ✅ Fixed streaming placeholder stubs (no more module-not-found during generation)
- ✅ Deep audit — 19 broken references fixed, 20,000+ lines dead code removed
- ✅ Built 6 new products: eSIM, VPN, Dictation, Cloud Storage, Booking, + provider layers
- ✅ Built 50 country-specific eSIM SEO pages
- ✅ Built 10 SEO product pages (VPN, eSIM, Dictation, Storage, Booking, Hosting, etc.)
- ✅ Built 12 free SEO tools targeting 11.4M monthly searches
- ✅ Built Business Name Generator (nuclear SEO funnel → domain → website → everything)
- ✅ Built bulletproof resilience layer (retry, circuit breaker, error sanitization)
- ✅ Built Technology Currency Agent (monitors stack, alerts on outdated deps)
- ✅ Built /admin/mobile command centre
- ✅ Built /disclaimers legal page + disclaimers on all comparison tables
- ✅ Added connectivity + cloud infra monitoring to market crawler (Starlink, Celitech, etc.)
- ✅ Retention-optimized pricing across all products
- ✅ Upgraded: Anthropic SDK 0.39→0.80, framer-motion→12.38, Stripe→21.0, lucide-react→1.7

**Products ready to go live (just need API keys):**
| Product | Env Variable Needed |
|---|---|
| eSIM (190+ countries) | CELITECH_API_KEY |
| VPN | WIREGUARD_API_URL + WIREGUARD_API_KEY |
| AI Dictation | DEEPGRAM_API_KEY |
| Cloud Storage | B2_KEY_ID + B2_APP_KEY |
| Booking & Scheduling | CALCOM_API_URL + CALCOM_API_KEY |
| AI Website Builder | ANTHROPIC_API_KEY (already set) |
| Stripe Payments | STRIPE_SECRET_KEY + price IDs |

**CRITICAL — NEXT ACTIONS (in order):**
1. **Builder UI overhaul** — must feel like a $50M product, not a beta. Match Bolt/Lovable quality.
2. **Video Creator UI overhaul** — needs timeline, real-time preview, avatar support
3. **Craig manual tasks:** Zoho Mail setup, Cloudflare email routing, Stripe products
4. **Next.js 14→15 upgrade** (dedicated sprint)
5. **Go live with first customers**

**Blockers:** Builder and Video Creator UI quality not at competitive standard. Must fix before launch.

**MANDATE: 80-90% ahead of competitors. If a user tries Zoobicon then tries Lovable/Bolt, they must think Zoobicon was BETTER. Currently we are NOT there on UI polish. Fix immediately.**

---

## URGENT BUILD LIST — EVERYTHING BELOW MUST BE BUILT. NO EXCEPTIONS.

**Status: CRITICAL PRIORITY. Competition is moving. Every day we don't build this, we fall further behind.**

**The 80-90% rule applies to EVERY item. If a competitor has it, we must have it better.**

### TIER 1: BUILD IMMEDIATELY (blocks revenue and competitiveness)

| # | Task | Why | Competitor reference | Status |
|---|------|-----|---------------------|--------|
| 1 | **Supabase auto-provisioning for generated apps** | Lovable's #1 feature. Generated apps get real Postgres + auth + storage + real-time. Without this we're frontend-only like v0. | Lovable ($6.6B valuation) | Code built, needs SUPABASE_ACCESS_TOKEN |
| 2 | **Wire Supabase into builder generation flow** | Builder must auto-create database + inject client code when generating full-stack apps | Lovable, Bolt | NOT STARTED |
| 3 | **Diff-based editing working end-to-end** | Change one thing in 2-5s instead of regenerating in 30s. This is why Bolt feels fast. | Bolt.new ($40M ARR) | API built at /api/generate/edit, needs UI wiring |
| 4 | **Wire diff editing into builder UI** | "Make the header blue" → only header file regenerates. Chat panel in builder sends edits. | Bolt.new | NOT STARTED |
| 5 | **Video pipeline producing actual videos** | Test every Replicate model, fix failures, produce one real video end-to-end | HeyGen, InVideo | Pipeline code built, UNTESTED |
| 6 | **Auto-captions on generated videos** | Use Whisper on Replicate to transcribe audio → generate SRT → burn into video | Captions app, CapCut | NOT STARTED |
| 7 | **Background music generation** | MusicGen on Replicate. "upbeat corporate" → 30-second track layered onto video | InVideo, CapCut | NOT STARTED |
| 8 | **Stripe payments fully working** | Domain checkout, subscription plans, video credit packs | ALL competitors | Code built, needs Craig to create Stripe products |
| 9 | **Builder streaming — show components as they generate** | Don't wait 30s for all 12 components. Show each one as it completes. | Bolt (3-5s first preview) | Partially working |
| 10 | **MCP integration (Model Context Protocol)** | Let users feed GitHub repos, Figma designs, Notion docs into generation | Emergent, Cursor | NOT STARTED |

### TIER 2: BUILD THIS WEEK (competitive parity)

| # | Task | Why | Competitor reference | Status |
|---|------|-----|---------------------|--------|
| 11 | **AI dubbing — multi-language video** | Fish Speech supports 50+ languages. Generate same video in Spanish/French/Japanese | HeyGen (175 languages) | NOT STARTED |
| 12 | **AI Twins — upload your face, get talking video** | Viral on TikTok. Upload a selfie, AI makes a video of "you" talking | Captions app | NOT STARTED |
| 13 | **Auth generation in every full-stack app** | Login/signup pages, OAuth buttons, session management auto-generated | Lovable, Bolt | Supabase client built, needs UI generation |
| 14 | **One-click deploy generated apps to zoobicon.sh** | Currently works but needs polish. Must be instant and reliable. | Lovable Cloud, Bolt Cloud | PARTIAL |
| 15 | **GitHub sync for generated projects** | Every change committed to Git. Developer can take over at any point. | Lovable, Bolt | Export exists, sync NOT STARTED |
| 16 | **Next.js 14 → 15 upgrade** | Server Components, Partial Prerendering, streaming Suspense boundaries. 30-50% faster page loads. | Industry standard | NOT STARTED |
| 17 | **AG-UI protocol adoption** | Replace custom SSE streaming with standardized protocol. Gets CopilotKit components free. | Google, Microsoft, Oracle adopting | NOT STARTED |
| 18 | **WebContainers evaluation** | Full Node.js in browser. If feasible, replaces Sandpack and matches Bolt's speed. | Bolt.new | NOT STARTED |
| 19 | **Real-time collaborative editing** | Multiple users editing the same site simultaneously | Lovable, v0 | NOT STARTED |
| 20 | **AI chatbot widget for customer sites** | Drop-in chat widget powered by Claude. Every generated site can have AI support. | Nobody has this built-in | NOT STARTED |

### TIER 3: BUILD THIS MONTH (market leadership)

| # | Task | Why | Competitor reference | Status |
|---|------|-----|---------------------|--------|
| 21 | **Self-hosted GPU infrastructure (Hetzner)** | Kill Replicate costs. $0.02/video instead of $0.10. Own the compute. | Internal cost optimization | NOT STARTED |
| 22 | **Public API at api.zoobicon.ai** | Sell video/image/site generation to other developers. Recurring API revenue. | Stripe, Twilio model | Endpoints exist, needs auth + docs + billing |
| 23 | **ICANN registrar accreditation** | Buy domains at cost instead of through OpenSRS. 90%+ margins on domains. | GoDaddy, Namecheap | NOT STARTED |
| 24 | **Own email infrastructure (Postal)** | Kill Mailgun costs. Full control over email delivery. | Internal cost optimization | NOT STARTED |
| 25 | **AI SEO agent that actually works** | Crawl customer sites, find issues, fix them automatically. Competitor monitoring. | Semrush, Ahrefs | DB tables exist, logic NOT STARTED |
| 26 | **CRM with real database** | Currently 100% mock data. Needs Postgres tables and real CRUD. | HubSpot free tier | NOT STARTED |
| 27 | **Email marketing with real backend** | Currently 100% mock data. Needs subscriber management, campaign sending. | ConvertKit, Mailchimp | NOT STARTED |
| 28 | **Invoicing with real backend** | Currently 100% mock data. Needs PDF generation, payment tracking. | FreshBooks, Wave | NOT STARTED |
| 29 | **Analytics with real backend** | Currently localStorage only. Needs server-side event tracking. | Google Analytics, Plausible | NOT STARTED |
| 30 | **Agency white-label dashboard** | Resellers manage their clients, billing, sites from one panel. | Nobody has this | PARTIAL |
| 31 | **AI video editing — smart cuts, transitions** | Auto-edit longer videos into short-form clips. | Opus Clip, Descript | NOT STARTED |
| 32 | **Voice cloning for video** | Clone customer's voice from 10s sample. Their voice, our avatar. | HeyGen, ElevenLabs | Fish Speech supports this, NOT WIRED |
| 33 | **SMS/WhatsApp integration** | Twilio API for notifications, bookings, marketing messages. | Twilio reseller opportunity | NOT STARTED |
| 34 | **AI chatbot builder** | Customers create chatbots for THEIR websites. Powered by Claude. | Intercom, Drift | NOT STARTED |
| 35 | **Mobile app (zoobicon.app)** | Wrap admin dashboard in Expo for App Store presence. | Native mobile gap | NOT STARTED |

### TIER 4: INFRASTRUCTURE OWNERSHIP (the moat)

| # | Task | Why | Status |
|---|------|-----|--------|
| 36 | **Own CDN edge network** | Serve customer sites from edge. Faster than Vercel for our use case. | NOT STARTED |
| 37 | **Own nameservers** | ns1.zoobicon.io, ns2.zoobicon.io. Full DNS control. | NOT STARTED |
| 38 | **Own auth service (auth.zoobicon.io)** | Drop-in auth for generated apps. Like Auth0 but built-in. | NOT STARTED |
| 39 | **Own managed database service (db.zoobicon.io)** | Per-customer Postgres instances. Like Supabase but we own it. | NOT STARTED |
| 40 | **Own file storage (storage.zoobicon.io)** | S3-compatible storage for customer apps. | NOT STARTED |

### CRAIG'S TASKS (manual, can't be automated)

| # | Task | Where | Status |
|---|------|-------|--------|
| C1 | **Merge branch on GitHub** | github.com/ccantynz-alt/Zoobicon.com | BLOCKING EVERYTHING |
| C2 | **Create 3 Stripe products** | dashboard.stripe.com → Products | NOT DONE |
| C3 | **Set OPENSRS_ENV=live in Vercel** | Vercel → Environment Variables | CHECK |
| C4 | **Add SUPABASE_ACCESS_TOKEN to Vercel** | supabase.com → org → management API token | NOT DONE |
| C5 | **Add SUPABASE_ORG_ID to Vercel** | supabase.com → org settings | NOT DONE |
| C6 | **Run /api/db/init** | Visit zoobicon.com/api/db/init once after deploy | NOT DONE |
| C7 | **Book Celitech training** | celitech.com | SCHEDULED (for eSIM) |
| C8 | **Set up Mailgun domain** | app.mailgun.com | CHECK |
| C9 | **Cloudflare email routing** | Cloudflare → zoobicon.com → Email | NOT DONE |
| C10 | **Set up Zoho Mail** | zoho.com/mail | NOT DONE |

---

**TOTAL: 40 build tasks + 10 Craig tasks = 50 items to market dominance.**
**Rule: Every completed item gets marked ✅ with date. Nothing gets removed. Nothing gets forgotten.**
**Rule: 80-90% ahead of competition on EVERY feature. If it's not best-in-class, it's not done.**
**Rule: No flip-flopping. Decisions locked above in IMPORTANT DECISIONS. Build forward only.**

---

## SESSION NOTES — 2026-04-01/02 (CRITICAL SESSION — DO NOT DELETE)

> Craig said: "This is the best feedback I've ever had. Please write everything down."
> Everything below was discussed, decided, or discovered in this session. NOTHING gets lost.

### PRODUCT DECISIONS MADE

1. **Domain Search is our #1 product** — it actually works (real OpenSRS registry checks). No other tool on the internet does it this well. It's the entry point to the entire platform. Market it aggressively with SEO.

2. **Domain search must be FREE** — it's the top of the funnel. Money comes from registration ($12.99+ per domain), hosting ($19-49/mo), email, and the platform subscription. Free search → paid registration → recurring revenue forever.

3. **AI Video Creator uses OUR OWN pipeline** — Fish Speech (voice) → FLUX (avatar) → OmniHuman/SadTalker (lip-sync) via Replicate. NO HeyGen dependency. We control the stack, we set the pricing, we sell the API. This is rule #19 in IMPORTANT DECISIONS.

4. **Video Creator is chat-based → 3-step flow** — Step 1: Describe what you want. Step 2: Pick from 2 script drafts. Step 3: Generate. No storyboard editor. No font pickers. No platform selectors. Simple.

5. **AI Builder generates FULL-STACK working apps** — Contact forms that validate, pricing toggles that work, FAQ accordions that animate, auth that logs in. NOT just pretty pages with fake data. This is what Lovable does. We must match and beat it.

6. **Diff-based editing** — "Change the header to blue" regenerates ONE file in 2-5 seconds, not the whole site in 30. This is what Bolt does. Endpoint at /api/generate/edit using Haiku.

7. **eSIM marked as Coming Soon** — Celitech requires video training before API access. Waitlist page is live. Book the training, get the key, swap the badge.

8. **Every product page needs excitement** — Big hero sections, effects, animations. "The thing is we've got amazing products and we need to showcase them." No more bare pages with a product slapped in the middle.

### COMPETITIVE INTELLIGENCE (March 2026)

**OpenAI killed Sora on March 24, 2026** — burning $15M/day, only $2.1M lifetime revenue. This removes a major competitor from the video space.

**Key competitor capabilities:**
- Lovable: $6.6B valuation, $20M ARR in 2 months. Deep Supabase integration (auto-provisions Postgres + auth + storage + RLS + real-time). This is their moat.
- Bolt.new: $40M ARR in 6 months. WebContainers (full Node.js in browser). Diff-based editing. 3-5 second first preview.
- v0 (Vercel): Frontend-only. No database. 6M+ developers. Best UI code quality but no backend.
- Emergent: 5 specialized agents, Kubernetes pods per project, MCP integration, adaptive learning.
- HeyGen: $100M+ ARR. Avatar IV, LiveAvatar (real-time), 175 languages. $29-149/mo.
- Captions app: 10M downloads. AI Twins viral on TikTok. $10-70/mo.
- CapCut: 300M monthly users. Seedance 2.0 integration. $0-8/mo.
- InVideo AI: Combines Sora 2 + Veo 3.1. $25-100/mo.
- Descript: 6M users. Text-based video editing. Underlord AI editor. $24-65/mo.
- Kling 3.0: Native 4K 60fps. Motion Brush. AI Director.

**Where we lead:**
- 75+ products in one platform (nobody else does this)
- Real domain search with AI name generation (unique)
- Price: $49/mo for everything vs $200+/mo buying separately
- White-label agency platform (nobody else across all products)
- Own video pipeline (10-20x cheaper than HeyGen)

**Where we trail (closing):**
- Builder speed (Bolt 3-5s vs our 20-30s) — diff editing + parallel generation closing this
- Full-stack generation (Lovable auto-provisions Supabase) — we now do this too
- Video quality (untested pipeline) — OmniHuman upgrade done, needs testing
- Real-time collaboration — on build list
- MCP integration — on build list

### ARCHITECTURE DECISIONS

**Backend-as-a-Service (built this session):**
- Every generated app gets lib/backend.ts automatically
- Two modes: Local (localStorage, works in preview) and Supabase (real Postgres, works in production)
- Same API in both modes: signUp, signIn, query, insert, update, remove, uploadFile
- Email reputation protection: content filtering, rate limiting per app, SPF/DKIM/DMARC

**API Gateway (built this session):**
- Unified service router at api.zoobicon.ai (foundation)
- Model warmup cron — pings Replicate models every 5 minutes to prevent cold starts
- Routes: /video, /site, /db, /email, /domains

**Parallel Generation (built this session):**
- Frontend (Sonnet) + Backend schema (Haiku) + SEO metadata (Haiku) run simultaneously
- Total time = longest task, not sum of all tasks
- 30-50% faster than sequential

**Email Reputation Strategy:**
- Layer 1: Content filtering + rate limiting + SPF/DKIM/DMARC
- Layer 2: Separate IP pools (transactional vs marketing vs customer app email)
- Layer 3: Mailgun now → Postal on Hetzner alongside → Full Postal later
- Warmup: 50/day → 500/day → 5000/day over 6-12 weeks

### BUSINESS STRATEGY

**The Untouchable Fortress:**
- Layer 1: Own infrastructure (GPU, registrar, email, CDN, nameservers)
- Layer 2: Platform (single login, customer data lock-in, agency white-label, marketplace)
- Layer 3: AI products (builder, video, domains, SEO, chatbot)
- Layer 4: Recurring revenue (domains, hosting, email, subscriptions, API, transaction clip)

**Revenue model:**
- Domain search = free (entry drug)
- Domain registration = $12.99-79.99/yr (recurring forever)
- Platform subscription = $49-499/mo
- Video API = $0.50-1.00/video (cost $0.10-0.20)
- Agency white-label = $499/mo (each reseller brings 20-50 clients)
- Transaction clip = 1.5% on bookings/payments

**5-Year Path:**
- Year 1: 80-120 customers, $5-12K/mo
- Year 2: Own infrastructure, 5-10 agency resellers, public API. $28-50K/mo
- Year 3: ICANN registrar, 50+ agencies, 1000+ API customers. $100-200K/mo
- Year 4-5: 4000+ customers, $290K+/mo MRR. Exit at $10-24M

**What we can resell (all wholesale API → retail):**
- SSL certificates (Sectigo, $3-8 cost → $19-49 sell)
- Business email (Zoho/MXRoute, $1-2 cost → $6-12 sell)
- SMS/WhatsApp (Twilio, $0.005 cost → $0.03 sell)
- Push notifications (OneSignal, $0-5 cost → $15-29 sell)
- CDN (BunnyCDN, $0.005/GB cost → $0.05/GB sell)
- AI chatbots (Claude API, $0.01 cost → $29-49/mo sell)
- AI image generation (Replicate FLUX, $0.003 cost → $0.10-0.25 sell)
- AI voice cloning (Replicate, $0.01/min cost → $0.50-1.00/min sell)
- Screen recording, PDF generation, QR code API (self-hosted, $0 cost)

### PRODUCTS — HONEST STATUS

**REAL (working end-to-end):**
- AI Website Builder ✅
- Domain Search + AI Name Generator ✅
- 12 Free Tools (client-side) ✅
- Video Creator (3-step flow, needs Replicate pipeline testing) ⚠️

**SHELL (pretty UI, mock data — needs "Coming Soon" or real backend):**
- CRM — 100% hardcoded demo data
- Email Marketing — 100% hardcoded mock
- Analytics — localStorage only
- Invoicing — 100% hardcoded mock
- VPN — needs WireGuard infrastructure
- Cloud Storage — needs Backblaze B2 key
- AI Dictation — needs Deepgram key
- Booking — needs Cal.com key

**COMING SOON (intentionally marked):**
- eSIM — Celitech training required

### CRAIG'S ACCOUNTS

- Primary Claude: cccantynz@gmail.com
- Secondary Claude: ccantyusa@gmail.com (Max plan)
- Can switch between accounts for uninterrupted development
- Each new session: paste CLAUDE.md, say "Continue from where I left off"

### RULES ADDED THIS SESSION (22-25)

22. Speed is non-negotiable — build faster if we can't be fastest
23. Backend + Frontend built together — every app gets real backend
24. Models stay warm — cron pings every 5 min, no cold starts
25. No timelines, no phases — build everything NOW

### KEY QUOTES FROM CRAIG (for context in future sessions)

- "We need to be 80-90% out in front of the competition"
- "If it means creating 100+ then that's what we need to do. We're going to have a big customer base"
- "We don't take our foot off the accelerator — that's what we do"
- "If we can't be the fastest with what's currently available then we build something in parallel"
- "We need to have a strong foothold in this market big enough that we can't be touched"
- "We need to control the narrative"
- "We should be making our own API as well"
- "Nothing ever works" — Builder showed wrong content, video failed to generate, navigation broken on iPad. These must NEVER happen again.
- "Please don't do any chicken scratching" — Stop patching. Do deep audits. Fix root causes.
- "This is the best feedback I've ever had. Please write everything down."

### WHAT WAS BUILT THIS SESSION

1. HeyGen avatar fix — loads real avatars from API
2. Video creator rebuilt — 3-step flow (describe → scripts → generate)
3. Own video pipeline — Fish Speech + FLUX + OmniHuman via Replicate
4. Builder fix — no more "Velocita"/"Launchpad" placeholder content
5. Builder upgrade — generates working interactive apps with state management
6. Diff-based editing — /api/generate/edit (2-5 second edits)
7. Navigation overhaul — 6-column mega menu, works on touch devices
8. Homepage redesign — lighter sections, all products visible, 6-column footer
9. Domain search redesign — full landing page with pricing comparison
10. AI Name Generator — describe business → 20 names with availability check
11. Domain purchase checkout — Stripe integration
12. 6 TLD-specific SEO landing pages with structured data
13. Sitemap updated with 21 new pages
14. HeyGen webhook endpoint
15. Supabase auto-provisioning for generated apps
16. Backend-as-a-Service (auth + database + storage + email)
17. Email reputation protection layer
18. API gateway with model warmup cron
19. Parallel generation engine
20. Visual editor overlay component
21. Auto-captions via Whisper
22. Background music via MusicGen
23. eSIM marked as Coming Soon
24. CLAUDE.md updated with 40-item build list + rules 19-25
