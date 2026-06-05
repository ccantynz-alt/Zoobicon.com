# Zoobicon Product Roadmap & Master Checklist

> **Last reconciled with CLAUDE.md:** 2026-05-13
> **Principle:** Mediocre is failure. Every feature on the site must work end-to-end.
> **Authoritative source:** `CLAUDE.md` (LIVE REPO STATUS + URGENT BUILD LIST + RECENTLY FIXED).
> If this file disagrees with `CLAUDE.md`, `CLAUDE.md` wins and this file gets corrected in the same session.

---

## Section 1: Product Backend Completion

These products have landing pages but lack working backends. Priority order: top to bottom.

### 1.1 Generators (32 types) — HIGHEST PRIORITY
**Status:** DONE (routing) — Generator routing with type-specific prompts built. URL param pre-fills builder.
**Why first:** Extends core product with minimal new infrastructure

| # | Task | Status |
|---|------|--------|
| 1 | Create `/api/generate/[type]/route.ts` dynamic route handler | DONE (2026-03-14) — routes through existing pipeline |
| 2 | Write type-specific system prompts for each generator category | DONE (2026-03-14) — `src/lib/generator-prompts.ts` |
| 3 | Pre-populate builder prompt when user clicks a generator card | DONE (2026-03-14) — `/builder?generator={id}` URL param |
| 4 | Add example outputs/thumbnails for each generator on hub page | TODO |
| 5 | Add generator-specific constraints (e.g., restaurant → menu sections, portfolio → gallery) | DONE (2026-03-14) — in generator prompts |
| 6 | Route Enhancement Agents (Animation, SEO, Dark Mode, Forms, Integrations) through existing pipeline enhancers | TODO |
| 7 | Test all 32 generators produce quality output | TODO |

### 1.2 SEO Agent — HIGH PRIORITY
**Status:** DONE — Full dashboard at `/seo` with 4 views (Dashboard, Analyze, Keywords, History)
**Why second:** Existing analysis endpoint provides foundation

| # | Task | Status |
|---|------|--------|
| 1 | Build SEO Agent dashboard page at `/seo` | DONE (2026-03-14) — `src/app/seo/page.tsx` |
| 2 | Connect to existing `/api/seo/analyze` for on-demand audits | DONE (2026-03-14) |
| 3 | Add keyword research via AI (use Claude to suggest keywords for a business type) | DONE (2026-03-14) — Keywords tab |
| 4 | Add auto-fix mode: take SEO audit results → feed back to pipeline → regenerate improved HTML | TODO |
| 5 | Add competitor URL input: fetch + analyze competitor SEO, suggest improvements | TODO |
| 6 | Build SEO score tracking over time (store audit results in DB) | TODO — needs DB tables |
| 7 | Update product page CTAs to link to real dashboard | DONE (2026-03-14) — links to `/seo` |

### 1.3 Hosting Completion — MEDIUM PRIORITY
**Status:** PARTIAL — Deploy + DB storage works, serving layer incomplete

| # | Task | Status |
|---|------|--------|
| 1 | Verify `/api/hosting/serve` actually serves deployed sites at `*.zoobicon.sh` | TODO |
| 2 | Implement SSL auto-provisioning or verify Vercel handles it | TODO |
| 3 | Build custom domain mapping (CNAME verification flow) | TODO |
| 4 | Add CDN cache headers to served content | TODO |
| 5 | Build deployment history UI with rollback buttons | TODO |
| 6 | Add staging environment toggle in dashboard | TODO |
| 7 | Implement basic analytics (page views, unique visitors) via lightweight tracking | TODO |

### 1.4 Marketplace — MEDIUM PRIORITY
**Status:** NOT BUILT — Mock data, localStorage "installs", no real purchases

| # | Task | Status |
|---|------|--------|
| 1 | Create `marketplace_items` DB table (id, name, category, price, type, stripe_price_id, asset_url) | TODO |
| 2 | Build `/api/marketplace` CRUD endpoints | TODO |
| 3 | Wire Stripe checkout for paid marketplace items (extend existing `/api/stripe/checkout`) | TODO |
| 4 | Build add-on delivery system (inject template/component into user's project after purchase) | TODO |
| 5 | Replace hardcoded mock data with real DB queries | TODO |
| 6 | Add developer submission flow for community add-ons | TODO |
| 7 | Add reviews/ratings system | TODO |

### 1.5 Domains — WORKING (top of the revenue funnel)
**Status:** DONE — OpenSRS/Tucows wired, AI name generator live, Stripe checkout working, RDAP fallback hardened. Needs Craig's Stripe products + `OPENSRS_ENV=live` to take real registrations.

| # | Task | Status |
|---|------|--------|
| 1 | Choose registrar API (Cloudflare Registrar, Namecheap reseller, or Porkbun) | DONE — OpenSRS/Tucows wholesale (`src/lib/opensrs.ts`) |
| 2 | Build `/api/domains/search` — real TLD availability check | DONE — OpenSRS LOOKUP + RDAP fallback, 4-concurrent limit, 10-min cache |
| 3 | Build `/api/domains/register` — real domain purchase flow | DONE — end-to-end wiring with contact form → Stripe → OpenSRS → DB |
| 4 | Wire Stripe for domain purchases | DONE — needs Craig to create Stripe products + price IDs |
| 5 | Build DNS management UI (A records, CNAME, MX) | PARTIAL — `/api/hosting/dns` exists, UI workflow needs polish |
| 6 | Auto-connect purchased domain to hosted site | TODO |
| 7 | Replace mock search results with real API calls | DONE — pre-crawled available-domain list shipped 2026-05 |
| 8 | AI Name Generator — describe business → names with availability | DONE — Haiku 4.5 → Sonnet 4.5 fallback, 503 hard-fail when key missing |

### 1.6 Email Support — PARTIAL
**Status:** Mailgun wired for transactional. Inbox + AI auto-reply still need building.
**Decision lock:** Mailgun-only — never add Google Workspace or SendGrid (Rule 7).

| # | Task | Status |
|---|------|--------|
| 1 | Choose email provider | DONE — Mailgun (transactional), Cloudflare Email Routing → Zoho for receiving |
| 2 | Build `/api/email/inbox` — fetch real emails via provider API | TODO |
| 3 | Build `/api/email/send` — send replies | DONE — Mailgun API integrated |
| 4 | Integrate AI auto-reply (Cloudflare Worker → Mailgun webhook → Claude) | TODO — designed in `CLAUDE.md` § Phase 1 Step 3, not yet shipped |
| 5 | Build ticketing system (DB table: tickets with status, priority, assignee) | TODO |
| 6 | Replace mock inbox data with real email feed | TODO |
| 7 | Add notification system (new ticket alerts) | TODO |
| 8 | Shared email template with 4-domain signature footer (Rule 11) | DONE — `src/lib/email-template.ts` |

### 1.7 Video Creator — PIPELINE BUILT, NEEDS END-TO-END TEST
**Status:** Own pipeline (Rule 19) — Fish Audio S1 → FLUX / Hedra Character-3 → SadTalker/Video-Retalking/Wav2Lip → Whisper captions. Pipeline code rebuilt 2026-04-08; needs one successful end-to-end production run.

| # | Task | Status |
|---|------|--------|
| 1 | Choose video API | DONE — Own pipeline via Replicate + fal.ai. No HeyGen as primary (Rule 19). Sora is dead (April 26, 2026). |
| 2 | Build `/api/video-creator/*` — text-to-video generation | DONE — chat, script, voiceover, render endpoints all live |
| 3 | Build video editor/preview UI | DONE — 3-step chat-based flow at `/video-creator` |
| 4 | Add format presets (TikTok 9:16, YouTube 16:9, Instagram 1:1) | TODO |
| 5 | Add AI music/sound integration (MusicGen on Replicate) | TODO — endpoint stub exists |
| 6 | Wire Stripe for video generation credits | TODO |
| 7 | Replace landing page vapor CTAs with real flow | DONE — chat-based flow shipped |
| 8 | Multi-language dub (Fish Audio S1, 50+ languages) | DONE — shipped 2026-05 |
| 9 | Auto-captions burned in (Whisper) | DONE — shipped 2026-04 |
| 10 | AI Twins viral page (selfie → talking head) | DONE — shipped 2026-05, $0.05/min |
| 11 | Voice cloning (Fish Speech / ElevenLabs fallback) | DONE — needs ELEVENLABS_API_KEY for premium tier |
| 12 | B-roll via fal.ai (Veo 3.1 / Seedance 2.0 / Kling 3.0) | DONE — needs FAL_KEY |
| 13 | Deep health endpoint `/api/video-creator/health?admin=true&deep=1` | DONE — verifies all 16 model slugs |
| 14 | Hedra Character-3 as primary avatar engine ($0.05/min real-time) | EVALUATING — currently FLUX chain on Replicate |

---

## Section 2: Builder Polish & UX

The core builder works but needs polish to compete with market leaders.

### 2.1 Onboarding — CRITICAL
**Current:** DONE — Welcome modal + template gallery + generator routing all live

| # | Task | Status |
|---|------|--------|
| 1 | Add welcome modal for first-time users (what Zoobicon does, 3-step overview) | DONE (2026-03-14) — `WelcomeModal.tsx` |
| 2 | Add template gallery picker (15+ templates exposed in builder UI) | DONE (2026-03-14) — `TemplateGallery.tsx` |
| 3 | Add interactive tooltips for tier toggle, model selector, and pipeline panel | TODO |
| 4 | Add "Getting Started" video or animated walkthrough | TODO — needs video production |
| 5 | Add industry/use-case selector that pre-fills prompt | DONE (2026-03-14) — generator routing via URL params |
| 6 | Show example output previews before user builds | TODO |

### 2.2 Pre-Generation Customization — HIGH
**Current:** DONE — Color, typography, layout, and section controls live

| # | Task | Status |
|---|------|--------|
| 1 | Add color palette picker (preset palettes + custom) | DONE (2026-03-14) — `CustomizationPanel.tsx` |
| 2 | Add typography selector (modern, classic, playful, corporate) | DONE (2026-03-14) |
| 3 | Add layout style toggle (hero-first, feature-grid, storytelling, minimal) | DONE (2026-03-14) |
| 4 | Add section selector (which of the 11 sections to include/exclude) | DONE (2026-03-14) — 8 toggleable sections |
| 5 | Add industry dropdown that auto-suggests relevant content | TODO |
| 6 | Add multi-page toggle (homepage + about + contact + pricing) | TODO |

### 2.3 Preview & Testing — HIGH
**Current:** DONE — Responsive preview with device toolbar

| # | Task | Status |
|---|------|--------|
| 1 | Add responsive preview toolbar (mobile / tablet / desktop breakpoints) | DONE (2026-03-14) — `PreviewPanel.tsx` device toolbar |
| 2 | Add Lighthouse-style score badge on preview (Performance, SEO, Accessibility) | TODO |
| 3 | Add "View Full Page" mode (expand preview to full screen) | TODO |
| 4 | Add side-by-side comparison (before/after edit) | TODO |

### 2.4 Post-Generation Editing — MEDIUM
**Current:** PARTIAL — Diff view done, visual editing still TODO

| # | Task | Status |
|---|------|--------|
| 1 | Add click-to-select element editing (click element in preview → edit its text/style) | TODO |
| 2 | Add section drag-and-drop reordering | TODO |
| 3 | Add diff view for version history (highlight what changed) | DONE (2026-03-14) — `DiffPanel.tsx` with LCS algorithm |
| 4 | Add undo/redo buttons (not just version rollback) | TODO |
| 5 | Add quick actions bar (change colors, fonts, add section, remove section) | TODO |

### 2.5 Export & Deployment — MOSTLY DONE
**Current:** GitHub sync working end-to-end. One-click deploy to `*.zoobicon.sh` working. React export via `/api/export/github`.

| # | Task | Status |
|---|------|--------|
| 1 | Add one-click deploy to Vercel/Netlify (OAuth flow) | DONE — `/api/hosting/deploy` → `https://[slug].zoobicon.sh` |
| 2 | Add GitHub push (create repo + push generated code) | DONE — full OAuth + create repo + push files + sync updates via `GitHubSyncPanel` |
| 3 | Add download as ZIP with proper file structure | DONE — `/api/export/github` generates full Next.js 14 project |
| 4 | Verify React/Next.js export produces runnable project | DONE — exported projects include package.json, tsconfig, tailwind config |
| 5 | Add Vue/Svelte export options | TODO — low priority, React-first is the strategy |
| 6 | CronTech as deploy provider (Craig's own platform) | SCAFFOLDED — `src/lib/crontech-adapter.ts`, awaiting Craig's API docs |

### 2.6 Design Quality — ONGOING
**Current:** Component library provides good baseline

| # | Task | Status |
|---|------|--------|
| 1 | Add dark mode support to component library | TODO |
| 2 | Add more animation presets (parallax, morphing backgrounds, hover effects) | TODO |
| 3 | Add custom illustration/icon integration (beyond lucide-react) | TODO |
| 4 | Add glassmorphism, neumorphism, bento grid layout options | TODO |
| 5 | Improve mobile menu (hamburger → slide-out with smooth animation) | TODO |

---

## Section 3: Platform Features

### 3.1 Collaboration — NOT STARTED
| # | Task | Status |
|---|------|--------|
| 1 | Add project sharing via link (read-only or edit) | TODO |
| 2 | Add team/workspace support (multiple users per account) | TODO |
| 3 | Add commenting on generated sites (point-and-click feedback) | TODO |
| 4 | Add activity log (who edited what, when) | TODO |

### 3.2 Analytics & Insights — DONE (UI)
| # | Task | Status |
|---|------|--------|
| 1 | Add per-project analytics (page views, visitors, bounce rate) | DONE (2026-03-14) — `src/app/analytics/page.tsx` |
| 2 | Add SEO score trends (track score over time after edits) | DONE (2026-03-14) — chart in analytics dashboard |
| 3 | Add generation stats (tokens used, cost estimate, time) | DONE (2026-03-14) — generation history tab |
| 4 | Add dashboard-level analytics (total projects, total deploys, uptime) | DONE (2026-03-14) — overview cards |

### 3.3 Authentication & User Management — MOSTLY DONE
| # | Task | Status |
|---|------|--------|
| 1 | Audit localStorage auth for security (currently `zoobicon_user` key) | DONE — auth-aware navbars read `localStorage("zoobicon_user")` per Rule 16, server-side auth via `src/lib/auth-guard.ts` |
| 2 | Add OAuth providers (Google, GitHub) for faster signup | DONE — both wired in `/api/auth/oauth/google` and `/api/auth/oauth/github`, needs Craig to set OAuth client IDs/secrets |
| 3 | Add email verification flow | DONE — `email_verified` column, verify endpoint, graceful fallback if column missing |
| 4 | Add account deletion / data export (GDPR) | TODO |
| 5 | Add usage quotas per plan tier | DONE — `src/lib/auth-guard.ts` enforces Free 1/mo, Creator 15, Pro 50, Agency 200 |
| 6 | Admin diagnostics endpoint | DONE — `/api/auth/diagnose` reports which env vars are missing |

### 3.4 Developer Platform (zoobicon.io) — NEEDS VERIFICATION
| # | Task | Status |
|---|------|--------|
| 1 | Verify all documented API endpoints actually work | TODO |
| 2 | Build interactive API playground (try endpoints in-browser) | TODO |
| 3 | Generate OpenAPI spec from route handlers | TODO |
| 4 | Verify API key generation and management works | TODO |
| 5 | Add webhook support for async generation events | TODO |
| 6 | Verify rate limiting works per plan tier | TODO |

### 3.5 CLI (zoobicon.sh) — NEEDS VERIFICATION
| # | Task | Status |
|---|------|--------|
| 1 | Verify `zoobicon-cli` npm package exists and installs | TODO |
| 2 | Test all documented CLI commands (init, generate, deploy, edit, etc.) | TODO |
| 3 | Add GitHub Actions integration (verify YAML examples work) | TODO |
| 4 | Add GitLab CI integration | TODO |

---

## Section 4: Domain-Specific Tasks

### 4.1 zoobicon.com (Hub)
| # | Task | Status |
|---|------|--------|
| 1 | Ensure all product cards link to real working products (not just `/builder`) | DONE (2026-03-14) — CTAs fixed |
| 2 | Fix any product cards that promise features that don't exist | DONE (2026-03-14) — fake stats removed |
| 3 | Add real customer testimonials (or mark as "Beta" if none yet) | TODO — needs real users |

### 4.2 zoobicon.ai (AI Creation)
| # | Task | Status |
|---|------|--------|
| 1 | Verify live demo section works (calls `/api/generate` correctly) | TODO |
| 2 | Only list AI tools that actually work (remove or mark "Coming Soon" for vapor tools) | DONE (2026-03-14) — Video Creator marked Coming Soon, fake SLA removed |
| 3 | Add real generation examples with before/after | TODO |

### 4.3 zoobicon.sh (CLI/Deploy)
| # | Task | Status |
|---|------|--------|
| 1 | Verify all terminal commands in animated demo are real | TODO |
| 2 | Link to real GitHub repo (currently placeholder) | DONE (2026-03-14) — dead link disabled |
| 3 | Add real installation instructions that work | TODO — needs npm package published |

### 4.4 zoobicon.io (Developer API)
| # | Task | Status |
|---|------|--------|
| 1 | Test all 5 documented API endpoints | TODO |
| 2 | Verify code examples (curl, JavaScript, Python) work | TODO |
| 3 | Add link to real API docs or OpenAPI spec | DONE (2026-03-14) — SDKs/GitHub Actions marked coming soon |

### 4.5 dominat8.io/com — MOVED OUT OF THIS REPO
Dominat8 is now a separate codebase with its own GitHub repo, Vercel project, and Supabase. See `DOMINAT8_CLAUDE.md` in that repo. Do not add `/dominat8` routes to this codebase.

---

## Section 5: Competitive Analysis (vs 10 Market Competitors)

*Researched March 2026: Wix AI, Squarespace Blueprint, Framer AI, Hostinger, Durable, 10Web, Relume, v0 (Vercel), Bolt.new, Lovable.dev*

### 5.1 Critical Gaps (Table-stakes every competitor has)

| # | Feature | Who Has It | Zoobicon Status | Priority |
|---|---------|-----------|-----------------|----------|
| 1 | **Drag-and-drop visual editor** | Wix, Squarespace, Framer, Hostinger | MISSING — code panel + preview only | HIGH (biggest UX gap vs mainstream builders) |
| 2 | **Mobile preview simulator** | All 10 competitors | DONE (2026-03-14) — responsive toolbar | CLOSED |
| 3 | **Template gallery with previews** | All 10 competitors (Wix: 2,500+, Hostinger: 170+) | DONE (2026-03-14) — 12 templates exposed in builder | CLOSED |
| 4 | **Built-in analytics dashboard** | Wix, Squarespace, Framer, Hostinger, Durable, Bolt | DONE (2026-03-14) — `/analytics` dashboard | CLOSED |
| 5 | **Functional e-commerce** (products, cart, checkout) | Wix (full), Squarespace (full), Hostinger, 10Web (WooCommerce) | PARTIAL — API endpoint exists, no product dashboard | MEDIUM |
| 6 | **AI content/blog writer** (standalone) | Wix, Squarespace, Framer, Hostinger, Durable | MISSING — pipeline generates copy but no standalone tool | MEDIUM |
| 7 | **Custom domain connection** (working flow) | All 10 competitors | PARTIAL — hosting API exists, UI workflow incomplete | CRITICAL |
| 8 | **SSL/CDN fully operational** | All 10 competitors (out of box) | PARTIAL — APIs exist, not battle-tested | CRITICAL |

### 5.2 Zoobicon's Unique Advantages (Defend & Amplify)

| # | Feature | Competitor Comparison | Status |
|---|---------|----------------------|--------|
| 1 | **7-agent pipeline with transparency** | No competitor shows AI agent workflow to users | DONE — unique |
| 2 | **Multi-LLM model choice** (Claude/GPT-4o/o3/Gemini) | Only Bolt.new has model selector; no one matches breadth | DONE — unique |
| 3 | **Code export** (HTML, React, Next.js, WordPress, GitHub) | Wix/Squarespace/Framer/Hostinger/Durable lock you in. Only Bolt + Lovable also export | DONE — major differentiator |
| 4 | **White-label / multi-brand** | Zero competitors offer white-label rebranding | DONE — unique |
| 5 | **Website cloning** (`/api/clone`) | Only 10Web also offers this | DONE — rare |
| 6 | **Developer API + CLI** | v0 has limited API; no competitor has CLI | DONE — unique |
| 7 | **Voice input for prompts** | No competitor has this | DONE — unique |
| 8 | **32+ generator types** | No competitor matches breadth (Wix has ~10 AI tools) | PARTIAL — need type-specific backends |
| 9 | **Opus-quality code generation** | Competitors use cheaper models; Opus output is noticeably higher quality | DONE — quality edge |
| 10 | **Client handoff / agency workflow** | Only Relume targets agencies similarly, but doesn't generate finished sites | DONE — differentiator |

### 5.3 High-Priority Gaps (Competitors shipping, we should evaluate)

| # | Feature | Who Has It | Impact | Zoobicon Status |
|---|---------|-----------|--------|-----------------|
| 1 | **AI Visibility / AIO tracking** (how site appears in ChatGPT/Gemini/Perplexity) | Wix (new, novel) | Forward-looking differentiator | NOT BUILT |
| 2 | **Real-time collaborative editing** | Wix, Squarespace, Framer | Important for teams/agencies | NOT BUILT |
| 3 | **AI logo / brand identity generator** | Wix, Squarespace, Durable | Quick win using existing image-gen | NOT BUILT |
| 4 | **AI email marketing campaigns** | Wix, Hostinger (Reach), Durable | Listed on pricing page but NOT BUILT | CREDIBILITY RISK |
| 5 | **Mobile app / PWA builder** | Wix (app builder), Lovable (mobile builder) | Emerging capability | NOT BUILT |
| 6 | **CMS / blog management** | Wix, Squarespace, Framer | Common for content sites | NOT BUILT |
| 7 | **Booking / scheduling** | Wix, Squarespace | Vertical-specific | NOT BUILT |
| 8 | **In-app domain purchasing** | Squarespace, Hostinger, Durable, Bolt.new | Convenience feature | NOT BUILT |

### 5.4 Pricing Comparison (April 2026 verified)

| Builder | Free | Entry | Mid | High | White-label |
|---------|------|-------|-----|------|-----------|
| **Zoobicon** | Free (1 gen/mo) | $49/mo Starter | $129/mo Pro | $299/mo Agency | $499/mo |
| **Wix** | Free (branded) | $17/mo Light | $29/mo Core | $36/mo Business | $159/mo Elite |
| **Squarespace** | 14-day trial | $16/mo Basic | $23/mo Core | $39/mo Plus | $99/mo Advanced |
| **Framer** | Free (branded) | $10/mo Basic | $30/mo Pro | $100/mo Scale | Custom |
| **Hostinger** | No free | $2.99/mo Starter | $4.99/mo Business | $7.99/mo Cloud | — |
| **Lovable** ($400M ARR, $6.6B) | Free (5/day) | $25/mo Pro | $50/mo Business | $100/mo Scale | Custom |
| **Bolt.new** ($40M ARR, $700M) | Free (limited) | $20/mo Pro | $50/mo Pro 50 | $200/mo | Custom |
| **v0 (Vercel)** (6M devs) | Free ($5 credits) | $20/mo Premium | $30/user Team | — | Custom |
| **Emergent** ($100M ARR) | Free | $30/mo | $100/mo | $200/mo | Custom |
| **HeyGen** (video) | Free | $29/mo Creator | $89/mo Team | $149/mo+ | Enterprise |
| **Filmora** ($1.75B mkt cap) | Free (watermark) | $50/yr | — | — | — |

Zoobicon's pricing is positioned as an ecosystem play (everything bundled — domains + hosting + email + builder + video) rather than feature-by-feature competition. The $499/mo white-label tier has no direct competitor.

**CREDIBILITY NOTE:** Features listed on the pricing page must match reality. Anything not yet built must say "Coming Soon" with a waitlist (Rule 14). Currently safe; previous "Acme" placeholder regression on builder failure was fixed 2026-04-08 (`callLLMWithFailover` chain now surfaces real failure reasons instead of falling back to template scaffolds).

---

## Priority Execution Order

### Phase 1 — Stop the Bleeding ~~(Week 1-2)~~ COMPLETED 2026-03-14
*Fix credibility issues and expose what already exists*
1. ~~Expose template gallery in builder UI~~ DONE
2. ~~Add onboarding welcome modal for first-time users~~ DONE
3. ~~Add responsive preview toolbar (mobile/tablet/desktop)~~ DONE
4. ~~Fix ALL product page CTAs — if backend doesn't exist, change to "Coming Soon" + waitlist~~ DONE
5. ~~Audit pricing page — remove or mark "Coming Soon" on features not yet built~~ DONE
6. ~~Verify all 5 domain pages don't overpromise~~ DONE

### Phase 2 — Make Products Real ~~(Week 3-6)~~ MOSTLY COMPLETE 2026-03-14
*Build the backends that product pages promise*
7. ~~Build generator routing (type-specific prompts through pipeline)~~ DONE
8. ~~Build SEO Agent dashboard (extend existing `/api/seo/analyze`)~~ DONE
9. Complete hosting serving layer (SSL, CDN, custom domains) — TODO (needs infrastructure)
10. ~~Add pre-generation customization controls (colors, typography, industry)~~ DONE
11. ~~Add diff view for version history~~ DONE
12. ~~Build analytics dashboard (page views, SEO trends, generation stats)~~ DONE

### Phase 3 — Platform Maturity (Week 7-10)
*Close competitive gaps*
13. Build marketplace backend with Stripe
14. Build domain registration integration
15. Add OAuth (Google, GitHub) for faster auth
16. Add collaboration features (sharing, commenting)
17. Add AI content/blog writer (extend pipeline for standalone content)
18. Add AI logo/brand kit generator (use existing image-gen API)

### Phase 4 — Advanced Features (Week 11+)
*Differentiate and expand*
19. Build email support system
20. Build video creator integration
21. Add drag-and-drop visual editing (biggest engineering effort)
22. Add CMS/blog management
23. Add e-commerce dashboard (products, cart, checkout)
24. Evaluate AI visibility tracking (Wix-style AIO)

---

## Tracking

When a task is completed, change its status from `TODO` to `DONE` and add the date.
When a task is blocked, change to `BLOCKED` and add a note explaining why.
When a task is in progress, change to `IN PROGRESS`.
