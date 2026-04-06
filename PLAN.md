# ZOOBICON BATTLE PLAN — LAUNCH DAY

## Mission: From 95s to 3s. From builder to #1. No loose ends.

---

## PHASE 1: INSTANT SCAFFOLD ENGINE (Speed is the moat)
**Goal: 3s first preview → 10s customized site → 30s full-stack app**

### 1A. Template Scaffold System (`src/lib/scaffold-engine.ts`) — NEW
- Build intent classifier using Haiku (<1s): analyzes user prompt → returns category (saas, restaurant, portfolio, ecommerce, blog, agency, etc.)
- Pre-build 15 HTML scaffold templates (one per top category) with component-library CSS already injected
- Each scaffold: complete HTML with placeholder sections (hero, features, pricing, testimonials, footer)
- Serve scaffold INSTANTLY while AI customization streams in background

### 1B. Streaming Patch Architecture (`src/app/api/generate/instant/route.ts`) — NEW
- Phase 0 (0-1s): Haiku classifies intent → serve matching scaffold
- Phase 1 (1-3s): Stream scaffold to client, user sees real site immediately
- Phase 2 (3-10s): Haiku streams copy/color/branding patches into scaffold via SSE
- Phase 3 (10-30s): Sonnet streams full-stack features (auth, DB, API) as progressive layers
- Phase 4 (30-60s): Background — SEO + animations applied silently
- Client receives scaffold first, then progressive patches that update sections in-place

### 1C. Builder Integration (`src/app/builder/page.tsx`)
- Add "Instant Mode" toggle (default ON for new users)
- When instant mode: hit `/api/generate/instant` instead of `/api/generate/stream`
- Preview panel shows scaffold at 1s, progressively enhanced
- Keep classic pipeline as "Premium Mode" for users who want Opus quality
- Show speed comparison: "Instant: 3s first preview" vs "Premium: 95s, highest quality"

### 1D. Scaffold Templates (`src/lib/scaffold-templates.ts`) — NEW
- 15 pre-built HTML scaffolds: SaaS, Restaurant, Portfolio, E-commerce, Blog, Agency, Real Estate, Fitness, Wedding, Nonprofit, Education, Medical, Law, Photography, Startup
- Each scaffold uses component-library.ts classes (btn, card, section, grid, etc.)
- Placeholder text that reads naturally even before AI customization
- Dark mode variant for each
- Mobile-responsive out of the box

---

## PHASE 2: APP BUILDER UPGRADE (Not just websites — full apps)
**Goal: Generate React/Next.js apps, not just HTML**

### 2A. React Output Mode (`src/lib/react-generator.ts`) — NEW
- New output format: instead of single HTML, generate multi-file React project
- Files: `App.tsx`, `components/*.tsx`, `styles/globals.css`, `package.json`
- Uses component-library classes mapped to Tailwind
- Full TypeScript with proper types
- Export as downloadable ZIP or push to GitHub

### 2B. Framework Selector in Builder
- Add framework toggle: HTML (default) | React | Next.js
- HTML: current behavior (single file, instant deploy)
- React: multi-file output with components, hooks, context
- Next.js: App Router structure with pages, layouts, API routes
- Each format deployable to zoobicon.sh or downloadable

### 2C. App Templates (`src/lib/app-templates.ts`) — NEW
- Pre-built app scaffolds: SaaS Dashboard, CRM, Project Manager, Social App, Marketplace, Admin Panel
- Each includes: auth flow, database schema, API routes, CRUD UI
- AI customizes business logic, not boilerplate
- Cuts full-stack generation from 95s to ~15s

### 2D. Enhanced Sandpack Preview — NEW
- Integrate `@codesandbox/sandpack-react` for in-browser React preview
- Users see React apps running live in the browser (like Bolt)
- No server deployment needed for preview
- Hot reload on AI edits
- Falls back to iframe preview for HTML mode

---

## PHASE 3: ALWAYS-ON COMPETITIVE INTELLIGENCE
**Goal: Know what every competitor does before they announce it**

### 3A. Intelligence Database Schema
- `competitor_intel_config` — which competitors to track, crawl intervals
- `competitor_crawl_runs` — timestamped crawl results for trend analysis
- `competitor_crawl_results` — per-URL results with pricing/features/tech diffs
- `competitor_pricing_history` — price changes over time
- `competitor_feature_history` — feature launches/removals timeline
- `competitor_alerts` — triggered alerts for significant changes

### 3B. Scheduled Crawling (`/api/intel/cron/route.ts`) — NEW
- Daily automated crawl of all 7+ competitors (28+ URLs)
- Add to vercel.json cron schedule
- Diff detection: compare current vs previous crawl
- Auto-generate alerts on: price changes, new features, tech stack shifts, new blog posts
- Store everything in DB for trend analysis

### 3C. Market Trend Discovery (`src/lib/market-intel.ts`) — NEW
- Beyond competitor crawling: scan Product Hunt, Hacker News, Reddit r/webdev, Twitter/X
- Detect trending tools, frameworks, and AI capabilities
- AI summarizes: "This week in AI builders: [trend summary]"
- Surface ideas for features users would love
- Feed into admin dashboard as "Market Pulse"

### 3D. Enhanced Admin Intel Dashboard
- Historical trend graphs (feature count, pricing changes over time)
- Competitive positioning radar chart
- Alert timeline with severity levels
- Weekly auto-generated intelligence digest
- "Opportunity Gaps" — features no competitor has that we could build
- Feature comparison matrix (us vs all competitors, auto-updated)

### 3E. Intelligence API (`/api/intel/*`) — NEW
- `GET /api/intel/competitors` — all tracked competitors + latest status
- `GET /api/intel/competitors/[name]/timeline` — change history
- `GET /api/intel/trends` — aggregate market insights
- `GET /api/intel/pricing-matrix` — pricing comparison table
- `GET /api/intel/feature-matrix` — feature comparison grid
- `POST /api/intel/track` — add new competitor to monitor

---

## PHASE 4: STICKINESS FEATURES (Never let them leave)
**Goal: Make Zoobicon the first tab users open every morning**

### 4A. AI Auto-Pilot Mode (`src/lib/auto-pilot.ts`) — NEW
- Background agent that continuously improves user's sites:
  - Weekly SEO audit + auto-fix (meta tags, heading hierarchy, alt text)
  - Monthly performance optimization (image compression, lazy loading)
  - Content freshness alerts ("Your blog hasn't been updated in 30 days")
  - Competitor monitoring for user's industry ("Your competitor added a new feature page")
- Runs via cron, results appear in notification inbox
- Users wake up to: "Auto-Pilot improved your SEO score from 72 to 89 overnight"

### 4B. AI Business Assistant Chat (`src/components/BusinessChat.tsx`) — NEW
- Persistent chat sidebar available on every page
- Context-aware: knows user's sites, analytics, invoices, subscribers
- "How are my sites performing?" → pulls real analytics
- "Draft an invoice for $2,500 to Acme Corp" → creates invoice
- "Write a blog post about [topic]" → generates and publishes
- "What should I post on social media today?" → generates content calendar suggestion
- Competes with ChatGPT but with full business context

### 4C. Smart Notifications Engine Enhancement
- Enhance existing notification system with AI-powered alerts:
  - "Your site traffic spiked 300% — a Reddit post linked to you"
  - "3 new form submissions from your portfolio site"
  - "Your competitor dropped their price — consider a promotion"
  - "Weekly digest: 1,200 views, 23 leads, $450 in invoices paid"
- Push notifications via email + in-app bell

### 4D. One-Click Business Starter Kits — NEW
- "I'm a photographer" → generates: portfolio site + booking page + invoice template + brand kit + social media templates
- "I'm a restaurant owner" → generates: menu site + reservation system + review response templates
- "I'm a freelancer" → generates: portfolio + proposal templates + contract generator + invoice system
- Each kit wires up ALL business OS services in one click
- The ultimate onboarding — user goes from signup to running business in 5 minutes

---

## PHASE 5: CLAUDE.MD COMPLETE OVERHAUL
**Goal: Accurate documentation reflecting actual state**

- Update all "NOT BUILT" markers to reflect reality (67 pages, 149 routes, 64 components)
- Update Product Readiness Checklist with actual status
- Add new features from today's work
- Update competitive comparison with latest data
- Add new architecture docs for scaffold engine, React output, intel system
- Remove outdated "Build Plan" sections for completed phases
- Add today's new phases to roadmap

---

## PHASE 6: PRODUCTION HARDENING
**Goal: Zero broken flows, zero dead ends**

### 6A. Build Verification
- Run `npm run build` — fix any TypeScript/import errors from new files
- Verify all new routes return proper responses
- Test scaffold engine with 5 different prompts
- Verify React output generates valid JSX

### 6B. Integration Testing
- Instant scaffold → progressive enhancement flow end-to-end
- Intel cron → database persistence → dashboard display
- Business starter kit → all services wired correctly
- Share modal → all 5 platforms generate correct content

### 6C. Performance Audit
- Verify scaffold templates load in <1s
- Verify Haiku classification responds in <1s
- Verify streaming patches render progressively
- Verify no new bundle size regressions

---

## EXECUTION ORDER (Dependency-aware)

1. **Scaffold Templates** (1D) — no dependencies, enables everything else
2. **Scaffold Engine** (1A) — needs templates
3. **Instant Generation Route** (1B) — needs engine
4. **Builder Integration** (1C) — needs instant route
5. **React Generator** (2A) — independent, can parallel with 1-4
6. **App Templates** (2C) — independent
7. **Framework Selector** (2B) — needs 2A
8. **Sandpack Preview** (2D) — needs 2A
9. **Intel DB Schema** (3A) — independent
10. **Scheduled Crawling** (3B) — needs 3A
11. **Market Trend Discovery** (3C) — needs 3A
12. **Intel Dashboard Enhancement** (3D) — needs 3B, 3C
13. **Intel API** (3E) — needs 3A
14. **Auto-Pilot** (4A) — independent
15. **Business Chat** (4B) — independent
16. **Smart Notifications** (4C) — enhances existing
17. **Business Starter Kits** (4D) — independent
18. **CLAUDE.md Overhaul** (5) — after all features done
19. **Build + Test** (6) — final step

## PARALLEL TRACKS

**Track A (Speed):** 1D → 1A → 1B → 1C
**Track B (Apps):** 2A + 2C → 2B → 2D
**Track C (Intel):** 3A → 3B + 3C → 3D + 3E
**Track D (Sticky):** 4A + 4B + 4C + 4D

Tracks A-D run in parallel. Phase 5 + 6 run after all tracks complete.
