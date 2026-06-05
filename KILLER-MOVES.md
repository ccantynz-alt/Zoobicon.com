# 20 KILLER MOVES — How Zoobicon Annihilates the Competition

> **Locked: 2026-05-13.** This is the master list. Every commit ships against
> one of these 20 moves. Every session opens with "which move are we shipping
> today?" If a piece of work doesn't map to a move on this list, the question
> is: should the move list change, or should the work stop?
>
> The 20 are ordered by **launch-readiness impact**, not by glamour. Move #1
> is the single most important thing we can ship; move #20 is the long-game
> moat. The four tiers are roughly the order to execute them.

---

## Tier 0 — Reliability foundation (the things that prevent failure)

The platform cannot launch until every move in Tier 0 ships. These are
non-negotiable. Bolt and Lovable have these — that's WHY their reliability
is acceptable. Without them, Zoobicon's AI builder will look amateur next to
theirs no matter how good the marketing.

### Move #1 — Verification loop (generate → compile → boot → repair)
- **What:** After each component is generated, compile it via `@swc/wasm` in-browser, boot it in a hidden Sandpack instance, detect compile + runtime errors. If error, send the error message + offending code back to Haiku for ONE repair pass, then re-validate. Cap at 2 retries to bound cost.
- **Why competitors can't beat us:** Bolt V2 has this (the "auto-error-fixing agent" — that's their entire V2 launch tagline). Lovable has "Browser Testing" doing similar. Without this we plateau at ~85% build-success rate. With it: ~99%.
- **Deliverable:** New `src/lib/component-verifier.ts` + integration in `react-stream/route.ts:customiseComponent`. Reliability metric on every build logged to Neon.
- **Effort:** 4-6 commits. **Status:** Not started. **Tier:** 0.

### Move #2 — Plan Mode (Lovable-killer)
- **What:** Before any code is generated, Haiku proposes a structured plan: sitemap, sections per page, copy tone, brand kit, integrations needed, sample content. User reviews/edits in a dedicated UI panel. Generation runs against the locked plan with schema validation — if the plan says "5 sections in the hero" the AI cannot ship 4.
- **Why competitors can't beat us:** Lovable 2.0 launched this in April 2026 as their flagship feature. The reason: it kills the "AI went in the wrong direction" problem before any code is written. Without it, users burn 30 seconds of generation only to throw away the output and restart.
- **Deliverable:** New `/api/generate/plan` endpoint returning structured JSON. New `<PlanReviewPanel />` component. `react-stream/route.ts` accepts a `planId` and locks to it.
- **Effort:** 3-4 commits. **Status:** Not started. **Tier:** 0.

### Move #3 — Telemetry + observability (Neon-backed)
- **What:** Every build writes a row: prompt, components selected, models used, tokens consumed per phase, latency per phase, validation rejections, failover triggers, final score. Admin dashboard surfaces failure patterns ("hero-spotlight fails 12% of the time on restaurant prompts"). Cost ceiling per user per day enforced.
- **Why competitors can't beat us:** This is the foundation of every improvement. Lovable/Bolt have this; we collect the data and throw it away. Without it we cannot improve, cannot detect abuse, cannot manage cost.
- **Deliverable:** New `builds` Neon table. `recordBuildTelemetry()` helper. Admin page at `/admin/builds` with failure heatmap.
- **Effort:** 2 commits. **Status:** Not started. **Tier:** 0.

### Move #4 — Real pre-warmed sandbox (kill the 15-second cold start)
- **What:** Current Sandpack pre-warm is cosmetic (deps declared but never referenced — bundler tree-shakes them, audit confirmed 2026-05-13). Fix: ACTUALLY reference each pre-warm dep in the warmup module so the bundler caches them. Plus add `crontech-adapter.ts` wiring for the moment Crontech's API ships. E2B microVMs as third option if Crontech delays.
- **Why competitors can't beat us:** Bolt boots in 3-5 seconds. We boot in 15-20. That's the single biggest UX gap. Speed wins demos. Speed wins enterprise contracts.
- **Deliverable:** Rewritten `SandpackPreview.tsx` warmup with real dep references. CronTech adapter live. Documented fall-back to E2B if needed.
- **Effort:** 2-3 commits. **Status:** Cosmetic version exists; needs rewrite. **Tier:** 0.

### Move #5 — Cost ceiling + abuse detection
- **What:** Per-user-per-day token budget. Soft cap at $X (warn user). Hard cap at $Y (block + email). Detect runaway critique loops (already exists in `runQualityLoop` but no cost guard). Detect prompt-spam abuse (same user firing 50 builds/min).
- **Why competitors can't beat us:** Anthropic and OpenAI bills can vaporise unit economics. Lovable spent $15M/day on Sora before realising their cost model was broken. We get one shot at this; do it before we hit 10k users not after.
- **Deliverable:** New `usage_quota` Neon table. `requireBuildQuota()` middleware in every generation route. Auto-disable + alert at hard cap.
- **Effort:** 2 commits. **Status:** Plan tier limits exist; cost ceiling doesn't. **Tier:** 0.

---

## Tier 1 — Visual quality (table stakes — make the OUTPUT win)

If the output looks like every other AI-built site, the reliability work is
wasted. These three moves push the visual quality bar above what Bolt/Lovable
ship by default.

### Move #6 — Component registry 118 → 250+ with industry variants
- **What:** Current registry has 118 generic components. Expand to 250+ with explicit industry variants: 12 hero variants for SaaS, 12 for restaurants, 12 for agencies, 12 for portfolios, 12 for e-commerce, 12 for startups. Each hand-tuned to $100K+ agency quality.
- **Why competitors can't beat us:** Bolt and Lovable generate components from scratch on every build — they get generic output. We assemble from hand-tuned variants. With 250 variants × 8 categories = 2000 unique site compositions, all production-grade.
- **Deliverable:** New files in `src/lib/component-registry/by-industry/`. Planner extended to prefer industry-matched variants.
- **Effort:** Ongoing (12 commits over 3-4 weeks). **Status:** 118 done. **Tier:** 1.

### Move #7 — Industry-specific system prompts
- **What:** The customiser uses a single system prompt today. Add industry prompts: "restaurant" = sensory language, real dishes, Playfair italic; "SaaS" = benefit-led copy, technical credibility; "agency" = case studies, social proof; "portfolio" = restraint, white space. Detected via the planner.
- **Why competitors can't beat us:** Generic prompts produce generic copy. Industry prompts produce copy that sounds like the human in that industry would write.
- **Deliverable:** Extend `THEME_BRIEFS` in `react-stream/route.ts` with industry overlays. Planner returns `industry` field. Customiser merges theme + industry.
- **Effort:** 1 commit. **Status:** Not started. **Tier:** 1.

### Move #8 — Screenshot regression CI (mobile + a11y)
- **What:** Every commit that touches the registry runs a playwright/gatetest pass: render each component at 375px (mobile) and 1280px (desktop), screenshot-diff against baseline, run axe-core for WCAG AA failures. PR cannot merge if visuals regress.
- **Why competitors can't beat us:** Lovable does not screenshot-diff their components. They occasionally ship components broken on mobile because nobody noticed. We catch it before merge.
- **Deliverable:** New GateTest spec covering all 118+ components. Baseline screenshots committed. CI gate.
- **Effort:** 2-3 commits. **Status:** Not started. **Tier:** 1.

---

## Tier 2 — Unique product moats (asymmetric edges Bolt/Lovable cannot copy in 12 months)

These are the things only we can ship because of our existing product stack.
Each one is a wedge.

### Move #9 — Domain-to-business pipeline (the moat play)
- **What:** Single flow: user types "wedding photographer in Auckland" → AI suggests + checks domain availability → user picks → Stripe checkout → domain registers via OpenSRS → site generates → email forwarding wired → invoicing template created → booking page deployed. **All in one click.** 90 seconds end-to-end.
- **Why competitors can't beat us:** Bolt and Lovable do not have a registrar. They cannot register a domain. They cannot send email from your domain. They cannot generate invoices. We have all four. **Nobody else has this combination on the internet.**
- **Deliverable:** New `/domain-to-business` flow page. Wired through existing OpenSRS + Stripe + builder + email + invoicing endpoints.
- **Effort:** 4-5 commits. **Status:** Components exist; orchestration doesn't. **Tier:** 2.

### Move #10 — Background AI agents activated (every site has 22 agents working)
- **What:** The 22 agents in `src/agents/` are framework-complete but most aren't scheduled or wired to customer sites. Activate: SEO Auto-Fix (weekly crawl + fix), Performance Guardian (daily Lighthouse run + auto-optimise), Content Freshness (alert when site hasn't been updated in 30 days), Competitive Intel (weekly competitor scan in user's industry), Uptime Monitor (5min ping, instant alert).
- **Why competitors can't beat us:** Lovable ships a site, then it's the user's problem. Zoobicon sites have a maintenance team built in. The customer wakes up to "We improved your SEO score from 72 to 89 overnight." This is the recurring-revenue lock-in.
- **Deliverable:** Vercel cron schedule for each agent. Customer-facing notification inbox at `/dashboard/notifications`.
- **Effort:** 3-4 commits. **Status:** Framework exists; scheduling + wiring incomplete. **Tier:** 2.

### Move #11 — Site + launch video combo (one prompt → site AND 30s hero video)
- **What:** When user generates a site, in parallel: generate a 30-second hero video using our own pipeline (Fish Audio S1 voiceover + Hedra Character-3 avatar + Whisper captions). Embed in hero by default. Toggle off if user doesn't want.
- **Why competitors can't beat us:** Nobody else has an AI video pipeline integrated into the builder. HeyGen costs $29/mo standalone; we bundle it for free in the build flow at $0.05/min cost.
- **Deliverable:** Parallel call to `/api/video-creator` from `react-stream/route.ts`. Hero component variant that includes the embedded video.
- **Effort:** 3 commits. **Status:** Video pipeline shipped (May 2026); builder integration not. **Tier:** 2.

### Move #12 — AI Twins integration (selfie → talking-head video)
- **What:** Existing AI Twins product (shipped May 2026, $0.05/min). Wire into builder so a customer can upload a selfie during onboarding, and every page on their site gets a personalised talking-head video introducing the section.
- **Why competitors can't beat us:** Lovable doesn't have a video pipeline. Captions app has AI Twins but no website builder. We have both.
- **Deliverable:** "Add yourself as the host" toggle in builder. Reuse existing AI Twins endpoint.
- **Effort:** 2 commits. **Status:** AI Twins live; builder integration not. **Tier:** 2.

### Move #13 — Multi-language dub baked into every video
- **What:** Already shipped at the video-creator level (May 2026, 50+ languages via Fish Audio S1). Add: when a site is generated, automatically generate the hero video in EVERY language the user lists for SEO targeting. Customer's site serves the right language video based on browser locale.
- **Why competitors can't beat us:** HeyGen does 175 languages but at $29-149/mo. Ours is bundled at $0.05/min. Nobody bundles multi-lang video with the builder.
- **Deliverable:** Site metadata picks up `targetLanguages: string[]`. Build pipeline dubs hero video into each. Site middleware serves locale-matched.
- **Effort:** 2 commits. **Status:** Dub endpoint exists; site integration not. **Tier:** 2.

### Move #14 — Voice-prompt builder (talk → site)
- **What:** Microphone button in the builder prompt input. User speaks their request (Deepgram or browser Web Speech API). Transcribed → fed to planner. Optional: voice clone of THE USER becomes the site's hero voiceover.
- **Why competitors can't beat us:** No other AI builder accepts voice. It's a 30-second UX advantage that demos like science fiction.
- **Deliverable:** `<VoicePromptButton />` in `PromptInput.tsx`. Deepgram integration or Web Speech API fallback.
- **Effort:** 2 commits. **Status:** Not started. **Tier:** 2.

### Move #15 — Visual editor overlay (click element → edit inline)
- **What:** While the preview is rendered in Sandpack, an overlay layer lets the user click any element and edit its text, swap its icon, change its colour, or remove it entirely — without typing a prompt. Changes ship back through `/api/generate/edit` as a targeted diff.
- **Why competitors can't beat us:** Wix has visual editing, AI builders don't. Combining AI generation + visual editing is the holy grail. We are the first to ship it.
- **Deliverable:** New `<VisualEditorLayer />` component over the Sandpack preview. Uses postMessage to inject hover/click outlines. Edit emits to `/api/generate/edit`.
- **Effort:** 5-6 commits. **Status:** Not started; existing `src/components/VisualEditor*` may have foundation. **Tier:** 2.

---

## Tier 3 — Revenue + retention plays

These don't move the AI quality needle, but they're how we monetise the
output and lock customers in.

### Move #16 — Agency white-label dashboard (full wiring)
- **What:** Resellers ($499/mo) get a dashboard to manage their clients, billing, sites, branding, custom domains. Single login owns 20-50 client sites. White-label everything (logo, colour, email sender, billing).
- **Why competitors can't beat us:** Lovable and Bolt do not have white-label. This is our acquisition multiplier — each reseller brings 20-50 end users without us selling individually.
- **Deliverable:** Wire existing `/agencies/dashboard` to real DB. Stripe Connect for sub-billing. Domain mapping per agency.
- **Effort:** 4-5 commits. **Status:** UI exists; wiring incomplete. **Tier:** 3.

### Move #17 — Real Stripe checkout for domains + subscriptions
- **What:** Customer enters card → domain registers via OpenSRS → invoice emailed → renewal automated. Plus subscription billing for the platform (Starter $49 / Pro $129 / Agency $299 / White-label $499).
- **Why competitors can't beat us:** Bolt and Lovable don't sell domains. We do. The recurring revenue from domains + hosting + email + subscription is the moat.
- **Deliverable:** Stripe products created in dashboard. `STRIPE_*_PRICE_ID` set in Vercel. Webhook handler verified.
- **Effort:** 1 commit (mostly Craig's manual task). **Status:** Code shipped; Stripe products not created. **Tier:** 3.

### Move #18 — Public API at `api.zoobicon.ai`
- **What:** Sell our generation pipeline as a paid API to other developers. Endpoints already exist; needs auth keys, docs, billing, rate limits per plan tier.
- **Why competitors can't beat us:** Vercel sells v0 as an API at $20/mo+. We can sell ours bundled with the platform at lower cost. Plus we have video + domains + email — a richer API surface.
- **Deliverable:** Public docs at `/api-docs`. Stripe-billed API keys (`zbk_live_*`). Rate limits per plan. Webhook events.
- **Effort:** 4-5 commits. **Status:** Endpoints exist; billing + docs don't. **Tier:** 3.

### Move #19 — AI Business Assistant (persistent chat on every customer page)
- **What:** Customer dashboard has a persistent chat sidebar. Context-aware: knows their sites, analytics, invoices, subscribers. "How are my sites performing?" → pulls real analytics. "Draft an invoice for $2,500 to Acme Corp" → creates it. "Write a blog post about X" → generates and publishes.
- **Why competitors can't beat us:** Lovable assistant is scoped to the builder only. Ours has the full ecosystem context. Replaces ChatGPT for the customer's business operations.
- **Deliverable:** `<BusinessChat />` component in dashboard layout. Tool-use over CRM + analytics + invoicing + email + builder APIs.
- **Effort:** 4-5 commits. **Status:** Not started. **Tier:** 3.

---

## Tier 4 — Defensive moat

### Move #20 — File NZ provisional patent on the domain-to-business pipeline
- **What:** NZD ~$3,000 for a provisional patent application via AJ Park or Baldwins NZ. Covers the unique sequence: prompt → AI domain search → registration → site generation → email + invoicing wiring. 12 months of priority date to file globally.
- **Why competitors can't beat us:** Once filed, Lovable and Bolt cannot copy the exact pipeline without a licensing arrangement (or a patent fight). Trade-secret discipline (prompts + pipeline config kept in private repo) covers the parts the patent doesn't.
- **Deliverable:** Patent application filed. CLAUDE.md updated with "IP filed" status.
- **Effort:** Craig's task — engage law firm. ~NZD $3K + ~$500-800 patent opinion. **Status:** Recommended in 2026-04 session notes; not yet started. **Tier:** 4.

---

## Execution order

| Phase | Moves | Effort | Why this order |
|---|---|---|---|
| **A. Reliability** (next 2 weeks) | #1, #3, #5 | ~6 commits | Telemetry first to measure improvements. Verification loop is the single biggest reliability win. Cost ceiling protects us at scale. |
| **B. Quality** (parallel) | #4, #6, #7, #8 | ~10 commits | Pre-warm runs in parallel with reliability work. Component expansion is ongoing. |
| **C. Plan Mode + UX** (week 3-4) | #2, #15 | ~10 commits | Plan Mode is high-leverage but needs the foundation in place first. Visual editor is the demo-winner. |
| **D. Moats** (week 4-6) | #9, #10, #11, #12, #13, #14 | ~16 commits | Ecosystem features once the builder is bulletproof. |
| **E. Revenue** (week 6-8) | #16, #17, #18, #19 | ~14 commits | Monetise + retain. |
| **F. Defensive** (parallel, Craig task) | #20 | external | File patent in parallel with development. |

---

## What this list does NOT include (intentionally)

- **A rewrite.** Audit 2026-05-13 confirmed architecture is sound. Rebuild is not on the table.
- **WebContainers licensing.** Decided 2026-05-04 — keep Sandpack, wait for Crontech (CLAUDE.md decision log).
- **Playwright in CI.** Decided 2026-05-05 — GateTest only (we use our own product).
- **Replacing Anthropic as primary.** Rule 4 — Opus 4.7 is canonical for builds.
- **HeyGen integration.** Rule 19 — own video stack only.
- **Dark theme on zoobicon.com.** Rule 29 — editorial-light is the floor.

If a future commit attempts any of these without Craig's written authorization,
it violates §2 of CLAUDE.md.

---

## How to use this doc

1. **Every session opens by re-reading the active tier.** "What move are we shipping?"
2. **Every commit cites a move in its message.** Example: `feat(builder): Move #1 — verification loop step 2 (compile via swc-wasm)`.
3. **When a move ships, mark it ✅ here with the commit SHA.** The next session sees the progress.
4. **If a new threat emerges (competitor ships X, model Y drops), update §6 of CLAUDE.md (Competitive Intelligence) FIRST**, then decide if this list needs to change.

The 20 moves are not sacred. The discipline of having a list IS.
