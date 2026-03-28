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

**STATUS: APPROVED, NOT YET BUILT. This is the #1 engineering priority.**

The current React generation asks the AI to generate 9 complete components as JSON in a single API call. This takes 2-3 minutes and is unreliable (timeouts, partial output, quality issues).

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
| 1 | 22 dead components never imported | Low | 2026-03-27 | Wire in or remove | 2-4h |
| 2 | 3 dead lib files never imported | Low | 2026-03-27 | Remove or integrate | 30min |
| 3 | Email format validation missing on auth signup | Low | 2026-03-27 | Add email regex check | 5min |
| 4 | 8x `<img>` should be `<Image>`, lint warnings | Low | 2026-03-27 | Replace with Next.js Image | 1-2h |

## RECENTLY FIXED

| # | Issue | Fixed | What Was Done |
|---|-------|-------|---------------|
| 1 | Slack events: unprotected JSON.parse could crash | 2026-03-27 | Wrapped in try/catch |
| 2 | XSS in hosting serve route | 2026-03-27 | Added HTML entity escaping for siteName |
| 3 | Missing Trophy icon import in landing-pages | 2026-03-27 | Added to lucide-react imports |
| 4 | React hooks called conditionally in AIChatAssistant | 2026-03-27 | Moved conditional return after all hooks |
| 5 | Unescaped apostrophe in QuotaBar.tsx | 2026-03-27 | Replaced with `&apos;` |

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

**Date last updated:** 2026-03-28
**Current phase:** Phase 1
**Current step:** STEP 1 — Cloudflare Setup

**Completed today:**
- ✅ Confirmed all 5 Zoobicon domains active in Cloudflare
- ✅ Registered zoobicon.app
- ✅ Discovered and reviewed existing technical CLAUDE.md (impressive codebase)
- ✅ Merged technical + business into single master CLAUDE.md

**Blockers:** None

**NEXT ACTION:**
Go to dash.cloudflare.com → click zoobicon.com → find "Email" in left sidebar → click "Email Routing" → Enable it. Takes 3 minutes. That's the next checkbox.

---

*One file. One source of truth. Technical rules in Part 1. Business rules in Part 2. Update the CURRENT STATUS section every evening. Tomorrow-Craig will know exactly where today-Craig left off.*
