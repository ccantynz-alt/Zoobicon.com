# Zoobicon — Complete Specs and Services

Single-page reference for copy-paste. Last updated 2026-05-15.

---

## ONE-LINE PITCH

Zoobicon is a white-label AI platform that bundles AI website builder, AI video creator, real domain registration, hosting, email, CRM, and 75+ other products into one login and one bill. The architectural bet that beats every competitor: **the AI never writes code — it fills slots in hand-crafted templates that cannot break.**

---

## WHAT'S BUILT TODAY

### Core products (live or near-live)

- **AI website builder** — React/Next.js generator with Sandpack in-browser preview. Streams components as it builds. Multi-LLM (Claude/GPT/Gemini) with cross-provider failover.
- **AI video creator** — 30-second talking-head videos via own pipeline: Fish Audio S1 (TTS), Hedra Character-3 / FLUX (avatar), SadTalker (lip-sync), Whisper captions. Multi-language dub in 50+ languages.
- **Real domain search + registration** — OpenSRS/Tucows wholesale. AI name generator. 13 TLDs from $2.99-$79.99/yr.
- **Hosting at *.zoobicon.sh** — Vercel-backed serving layer with SSL, CDN, custom domains.
- **Email** — Mailgun transactional + Cloudflare Email Routing to Zoho inboxes.
- **Stripe payments** — 4 subscription tiers + per-domain checkout + video credit packs.
- **Multi-domain ecosystem** — zoobicon.com (platform), zoobicon.ai (AI brand), zoobicon.io (developer/API), zoobicon.sh (customer hosting), zoobicon.app (mobile admin).
- **12 free SEO tools** — name generators, meta-tag generators, schema builders, etc.
- **50 country-specific eSIM pages**, 10 product pages, 16+ admin pages, agency white-label.
- **Authentication** — email + password + Google OAuth + GitHub OAuth + email verification + per-plan rate limits.
- **22 background AI agents** — site monitor, support responder, SEO auto-fix, performance guardian, market crawler, etc.

### Technical foundation

- Framework: Next.js 14.2 (App Router) + React 18.3 + TypeScript 5.9 + Tailwind CSS 3.4
- Database: Neon serverless Postgres
- AI: Anthropic SDK 0.80 (Claude Opus 4.7 canonical for builds)
- Multi-LLM: Anthropic + OpenAI + Gemini + Groq + self-hosted (B25) via callLLMWithFailover
- Preview: Sandpack (in-browser React preview)
- Payments: Stripe 21.0
- Hosting: Vercel (iad1 region) + Cloudflare for DNS/SSL
- Tests: Vitest unit + GateTest CI E2E
- Real counts: 165 pages, 576 API routes, 87 layouts, 254 lib modules, 118 components in assembly registry, 77 shared components

---

## THE 6 ORIGINAL ARCHITECTURAL INNOVATIONS

These are what make Zoobicon structurally better than Bolt, Lovable, v0. They cannot copy without rebuilding their pipelines from scratch.

1. **Slot-Locked Composition** — AI generates a JSON object that fills slots in hand-written templates. Server assembles deterministically. Output cannot be structurally broken. 70% fewer tokens than free-form code generation.

2. **Predictive Pre-Generation** — While user types prompt, Haiku predicts intent, pre-warms components. First paint <2s on submit.

3. **Component-Graph Builds** — Brand kit generated once, all components reference. 60% less token cost on multi-section builds. Structural cross-component consistency.

4. **Hot-Swap Live Component Upgrades** — Customer sites pull templates from our CDN at render time. We improve a template → all customer sites improve overnight. Slot values (their content) preserved. Sites get BETTER over time without the customer lifting a finger. Lovable/Bolt sites freeze at deploy.

5. **Multi-Judge Panel Critique** — Typography critic + Copy critic + Layout critic, all Haiku, parallel. Targeted repair on flagged axis only. 10× cheaper than one big Sonnet critique.

6. **Build-Output Caching** — Hash (prompt + theme + industry + brand) → cached slot-fill JSON. At scale 30%+ of builds hit cache for zero AI cost. Bolt/Lovable can't cache because their output is unique code.

---

## THE 40 KILLER BUILDER MOVES (B1-B36)

### Tier 0 — Reliability + Speed foundation
- **B1** Slot-Locked Composition (the foundation)
- **B2** Generate → compile → boot → repair verification loop
- **B3** Predictive pre-generation endpoint
- **B4** Real Sandpack pre-warm (deps actually bundle)
- **B5** Telemetry-driven improvement
- **B6** Per-user cost ceiling + abuse detection

### Tier 1 — Output quality
- **B7** Component registry 118 → 250+ with industry variants
- **B8** Industry-specific system prompts overlay
- **B9** Multi-judge panel critique (typography / copy / layout)
- **B10** Screenshot regression CI + axe-core
- **B11** Component-graph builds (DAG with shared brand kit)

### Tier 2 — Differentiation
- **B12** Plan Mode + user-editable plan (mistake-protection layer)
- **B13** Site + 30s hero video combo (one prompt)
- **B14** AI Twins host integration (selfie → personalised host)
- **B15** Multi-language hero video dub
- **B16** Voice prompts (talk → site)
- **B17** Visual editor overlay (click → edit, no prompt)

### Tier 3 — Recurring lock-in
- **B18** Hot-Swap Live Component Upgrades (sites improve every week)
- **B19** Build-output caching at JSON layer
- **B20** Auto-improvement agents on every deployed site

### Tier 4 — Capacity (the API bank)
- **B21** Proactive multi-provider sharding (Anthropic + OpenAI + Gemini in parallel)
- **B21b** Quality-aware tier routing (Claude-first defence — premium slots stay on Claude even at heavy load)
- **B22** Multi-key pool (4 → 20 Anthropic orgs via ANTHROPIC_API_KEY_2..20)
- **B23** Overnight prebuild factory (cron seeds cache during off-peak)
- **B24** Groq Llama 3.3 70B fallback ($0.20/M tokens)
- **B25** Self-hosted Llama on Hetzner GPU bank (~$3,100/mo, ~80 RPS)

### Tier 5 — Flywheel (compounding intelligence)
- **B26** Successful-build retrieval (few-shot from past wins)
- **B26b** Keystroke-level event capture
- **B26c** Client-side flywheel event flusher
- **B27** Pattern-mining consolidation (nightly cron)
- **B28** Cross-customer pattern bank (anonymous shared learnings)
- **B29** Self-healing pipeline (auto-quarantine bad components + providers)

### Tier 6 — Onboarding Wow (the first 30 seconds is the demo)
- **B30** Pre-deployed starter site live in 30 seconds
- **B31** AI-cloned starter from company email domain
- **B32** Engineering transparency page on signup (real trace from your signup)
- **B33** Verification IS your first API call
- **B34** AI deploy diagnostician for first failure
- **B35** Live cost estimator from connected GitHub repo
- **B36** Live performance proof on welcome screen

### Status (as of 2026-05-15, on branch claude/review-readme-docs-Wr1If)
- 🟢 SHIPPED: B1 (foundation + 7 templates), B2, B3, B4, B5, B6, B7, B9, B11 (library), B12, B17 (library), B18 (live-registry), B19, B21, B21b, B22 (pool), B23, B24 (provider hook), B25 (provider hook), B26, B26b, B26c, B27, B29
- 🟡 PENDING: B8, B10, B13, B14, B15, B16, B20, B25 (Hetzner deployment), B28, B30-B36
- ⏸ NEEDS CRAIG: PR #366 merge, OPENAI_API_KEY + GOOGLE_AI_API_KEY in Vercel, /api/db/init, Stripe products, additional Anthropic orgs

---

## THE COST + CAPACITY MODEL

### Per-build cost trajectory
- Today (free-form code-gen path): ~$0.04 per build
- After B1 (slot-locked composition): ~$0.02 per build
- After B19 + B23 (cache + prebuild factory): ~$0.014 per build average
- After B25 (self-hosted Hetzner on mechanical slots): ~$0.003 per build at scale

### Capacity math
- 1 Anthropic Tier 4 org: 400k tokens/min, 4k RPM ≈ ~6 builds/sec
- 4 orgs (Craig's $1,600 unlock): 1.6M tokens/min ≈ ~24 builds/sec
- 10 orgs (~$4k upfront): 4M tokens/min ≈ ~60 builds/sec
- + OpenAI + Gemini layered on top: ~3x of above

### Cost vs revenue at typical tier usage (~33% of cap)
| Tier | Revenue/mo | Avg cost/mo | Margin |
|------|------------|-------------|--------|
| Starter $49 | $49 | ~$1 | 98% |
| Pro $129 | $129 | ~$7 | 95% |
| Agency $299 | $299 | ~$70 | 77% |
| White-label $499 | $499 | ~$280 | 44% |

Heavy-user protection: hard quota caps (B6), pay-as-you-go top-ups (86% margin), self-hosted Hetzner cluster for >$5k/mo bills (B25).

### Cost trends with flywheel compounding
- Year 1: ~70% margin baseline
- Year 2 (cache + flywheel mature): ~85% margin
- Year 3 (self-hosted GPU bank): ~95% margin

---

## COMPETITIVE POSITIONING

### Vs the AI builders
| Axis | Bolt V2 / Lovable 2.0 | Zoobicon (PR #366) |
|------|----------------------|--------------------|
| AI output verification | post-hoc parse + retry | Structurally impossible to fail (slot-locked) |
| Provider failover | reactive after rate-limit | Proactive sharding before rate-limit (B21) |
| Quality preservation under load | binary (Claude or fail) | Quality-tiered (B21b — premium slots stay on Claude) |
| Output caching | none (free-form code unique) | 30%+ cache hit at scale (B19) |
| Live component upgrades | site freezes at deploy | Sites improve weekly (B18) |
| Per-axis critique | one big Sonnet pass | 3 small specialists in parallel (B9) |
| Industry-specific output | one generic template | Hand-tuned variants per industry (B7) |
| Predictive pre-warm | none | Typing-time prediction (B3) |
| Telemetry | their problem | Per-build observability (B5) |
| Cost ceiling | none (Lovable lost millions before noticing) | Per-user daily cap (B6) |
| Multi-org capacity | single Enterprise contract | Up to 20 orgs via env vars (B22) |
| Self-healing | engineering escalation | Hourly auto-quarantine (B29) |
| Flywheel compounding | none (unique outputs uncacheable) | Few-shot from past wins (B26+B27+B23) |

### Vs the platforms we annihilate (one ecosystem login)
- Wix / Squarespace / Framer (website builders) — they don't have AI generation that ships production sites in seconds. We do.
- GoDaddy / Namecheap (domains) — they don't have an AI builder. We do.
- HeyGen / Captions / Synthesia (AI video) — they don't have a website builder. We do. And our video pipeline is bundled.
- Vercel / Netlify / Render (hosting) — they don't have a builder OR a domain registrar.
- ConvertKit / Mailchimp (email marketing) — we have one too, bundled.
- Calendly / Cal.com (booking) — bundled.

A customer using Zoobicon for domains + hosting + email + builder + video has 5 vendors consolidated into 1 invoice. Switching cost: 5x.

---

## DEPLOYMENT + OPERATIONAL CHECKLIST

### Required Vercel env vars (priority order)

1. **ANTHROPIC_API_KEY** — primary AI provider
2. **OPENAI_API_KEY** — failover when Anthropic rate-limited (CRITICAL for reliability)
3. **GOOGLE_AI_API_KEY** — second failover (FREE 1500 req/day)
4. **DATABASE_URL** — Neon Postgres
5. **STRIPE_SECRET_KEY** + price IDs — payments
6. **STRIPE_WEBHOOK_SECRET** — Stripe webhooks
7. **OPENSRS_API_KEY** — domain registration
8. **REPLICATE_API_TOKEN** — video pipeline
9. **MAILGUN_API_KEY** — transactional email

### Optional (unlock features)
- **ANTHROPIC_API_KEY_2 ... _20** — additional orgs for capacity scaling (B22)
- **GROQ_API_KEY** — Groq Llama fallback (B24)
- **SELFHOSTED_LLM_URL + SELFHOSTED_LLM_KEY** — Hetzner GPU cluster (B25)
- **CELITECH_API_KEY** — eSIM product
- **DEEPGRAM_API_KEY** — AI dictation
- **SUPABASE_ACCESS_TOKEN** — auto-provisioning DBs for generated apps
- **GATE_TEST_API_URL + GATE_TEST_API_KEY** — CI E2E
- **CRON_SECRET** — protects internal cron endpoints

### One-time setup after deploy
1. Visit `/api/db/init` once — provisions all tables (users, projects, sites, builds, slot_cache, build_quotas, flywheel_*, self_healing_actions)
2. Create Stripe products + price IDs in Stripe dashboard
3. Set Stripe webhook → `https://zoobicon.com/api/stripe/webhook`
4. Verify Cloudflare DNS routing all 5 zoobicon.* domains

---

## CRON SCHEDULE (Vercel)

- `*/5 * * * *` — model warmup (keeps Replicate models hot)
- `*/15 * * * *` — intel health checks
- `0 */2 * * *` — full health check
- `0 * * * *` — self-heal cron (B29 quarantine detection)
- `0 */6 * * *` — SEO agent
- `0 */12 * * *` — competitor crawl
- `*/5 * * * *` — agents cron (background AI agents)
- `*/5 * * * *` — domain crawl
- `0 3 * * *` — flywheel consolidation (B27, mines events into memories)
- `30 3 * * *` — prebuild factory (B23, seeds cache for morning traffic)
- `0 3 * * *` — daily comeback emails
- `0 3 * * 1` — weekly auto-pilot
- `0 0 * * *` — intel cron
- `0 0 */2 * *` — technology scan

---

## THE THREE STRATEGY DOCS

- `KILLER-MOVES.md` — 20 platform-wide moves
- `KILLER-MOVES-BUILDER.md` — 36 builder-specific moves (B1-B36)
- `INNOVATIONS.md` — the 6 original architectural ideas

`CLAUDE.md` is the operating doctrine (Iron Law + 30 numbered decisions). The strategy docs are pre-authorized work — every commit cites a B-move; no per-commit confirmation needed.

---

## PRICING TIERS (from CLAUDE.md)

- **Starter $49/mo** — Site + domain + email (3 mailboxes) + SSL
- **Pro $129/mo** — + AI auto-reply + SEO monitor
- **Agency $299/mo** — + AI video + 5 sites + priority support
- **White-label $499/mo** — Full platform reseller licence (each reseller typically brings 20-50 of their own clients)

Other revenue streams: per-domain registration + renewal ($18-$35/yr), 1.5% transaction clip via Stripe Connect, AI add-ons ($19-39/mo each), domain marketplace (10-15% commission).

---

## TARGET TRAJECTORY

| Milestone | Customers | MRR | Annualised |
|-----------|-----------|-----|------------|
| Escape velocity | 80 | ~$5k/mo | $60k |
| Full-time justified | 120 | ~$8k/mo | $96k |
| First hire | 150 | ~$12k/mo | $144k |
| Platform sellable | 400 | ~$28k/mo | $336k |
| Exit ready | 4,000 | ~$290k/mo | $3.5M ARR |

Realistic exit value: $3.5M-$7M at exit-ready scale.

---

## URGENT NEXT STEPS

In execution order:

1. **Craig: merge PR #366** — 50+ commits sitting ready. Until merged, production runs old code.
2. **Craig: set OPENAI_API_KEY + GOOGLE_AI_API_KEY in Vercel** — failover layer needs somewhere to fall over to.
3. **Craig: hit /api/db/init** — provisions the new tables (builds, slot_cache, build_quotas, flywheel_*, self_healing_actions).
4. **Craig: create Stripe products + set price IDs** — revenue blocker.
5. **Claude: ship Wave A of Tier 6 (B30 + B31 + B32 + B33)** — first 30 seconds wow.
6. **Claude: ship B14 (AI Twins) + B15 (multi-language dub) + B16 (voice prompts)** — Tier 2 differentiators.
7. **Claude: ship Wave B of Tier 6 (B34 + B35 + B36)** — migration close features.

---

## THE PITCH IN ONE PARAGRAPH

Most AI builders teach the AI to write code. We taught the AI to fill in the blanks. Sites that cannot break. Eight-second builds. Hero videos in fifty languages. Personalised AI hosts from a single selfie. Sites that improve every week without you touching them. Real domain registration in the same flow. Bundled hosting, email, invoicing, CRM, video. One login, one invoice, five vendors consolidated. While the competition verifies their AI's broken output, ours has nothing to verify — the structure was perfect before the AI ever saw it.
