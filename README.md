# Zoobicon

**The white-label AI platform. Domains, hosting, builder, video, email — one login, one bill, one ecosystem.**

Zoobicon is a multi-product AI platform: an AI website builder that ships React/Next.js apps to production, an AI video pipeline that produces talking-head videos with cloned voices, a real OpenSRS-backed domain search and registrar, integrated hosting at `*.zoobicon.sh`, plus 75+ ancillary products (CRM, email marketing, invoicing, analytics, 12 free SEO tools, 50 country eSIM pages, agency white-label).

The goal is not to compete with Lovable, Bolt, v0 or HeyGen — it is to make every one of them irrelevant by selling all of it bundled at one price.

---

## What's in this repo

- **165 pages** (App Router) — public marketing, builder, video creator, 16+ admin pages, 50 country eSIM pages, 10 product pages, 12 free tools
- **576 API routes** — AI generation (10+ endpoints), hosting/deploy/serve, domain search/register, auth/OAuth, Stripe checkout + webhooks, video pipeline, public API v1
- **254 lib modules** — 7-agent pipeline, multi-LLM abstraction, 118-component registry, scaffold engine, OpenSRS client, Stripe wrapper, Neon DB layer
- **118 components** in the assembly registry — every section ($100K+ agency quality, 2026/2027 patterns)
- **9 Vercel cron jobs** — model warmup, competitor intel crawl, etc.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14.2 (App Router, Server Components, streaming SSR) |
| Language | TypeScript 5.9 (strict, no `any` unless commented) |
| Styling | Tailwind CSS 3.4 — no styled-jsx, no CSS-in-JS |
| AI | Anthropic SDK 0.80 (Opus 4.7 for builds, Haiku/Sonnet for planning), OpenAI + Gemini failover via `src/lib/llm-provider.ts` |
| Database | Neon serverless Postgres via `@neondatabase/serverless` |
| Payments | Stripe 21.0 |
| Hosting | Vercel (iad1 region) for the platform, `*.zoobicon.sh` for customer sites |
| Domains | OpenSRS / Tucows wholesale |
| Email | Mailgun (transactional) + Cloudflare Email Routing → Zoho |
| Video | Fish Audio S1 (TTS) → Hedra Character-3 / FLUX (avatar) → SadTalker (lip-sync) — own pipeline, no HeyGen dependency |
| Preview | Sandpack (`@codesandbox/sandpack-react`) — in-browser React preview |
| Animation | Framer Motion 12.38 |
| Icons | lucide-react 1.7 (tree-shaken, validated by `scripts/check-icons.js`) |
| Tests | Vitest unit + GateTest CI E2E (we own GateTest — we use our own product) |

## Status

Production. Build is green (470+ pages compile). The platform is shipping changes daily — see `CHANGELOG.md` for what landed when, and `CLAUDE.md` for the live operating doctrine.

## Local development

```bash
git clone https://github.com/ccantynz-alt/Zoobicon.com.git
cd Zoobicon.com
npm install
npm run dev           # http://localhost:3000
npm run build         # production build (must pass before push)
node scripts/check-icons.js   # mandatory before push — catches missing lucide imports
npm test              # vitest unit tests
```

### Required environment variables

Set in Vercel (or `.env.local` for dev). Without these, the corresponding feature degrades gracefully with a user-visible "needs API key" message — it does not silently fail.

| Variable | Used by | Required? |
|---|---|---|
| `ANTHROPIC_API_KEY` | Builder, video script, edit endpoint | Yes (primary AI) |
| `OPENAI_API_KEY` | LLM failover when Anthropic is overloaded | Recommended |
| `GOOGLE_AI_API_KEY` | LLM failover (free 1500/day) | Recommended |
| `DATABASE_URL` | Neon Postgres | Yes (visit `/api/db/init` once to provision tables) |
| `STRIPE_SECRET_KEY` + price IDs | Domain checkout, subscriptions | Yes for payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification | Yes for payments |
| `OPENSRS_API_KEY` | Domain registration | Yes for domain product |
| `REPLICATE_API_TOKEN` | Video pipeline (Fish, FLUX, SadTalker) | Yes for video |
| `FAL_KEY` | Veo 3.1 / Seedance B-roll, fal.ai TTS | Recommended for video |
| `ELEVENLABS_API_KEY` | Voice cloning fallback | Recommended for video |
| `MAILGUN_API_KEY` | Transactional email | Yes for email |
| `CELITECH_API_KEY` | eSIM product | Optional (Coming Soon without it) |
| `DEEPGRAM_API_KEY` | AI Dictation | Optional |
| `SUPABASE_ACCESS_TOKEN` | Auto-provision DBs for generated apps | Optional (feature degrades) |
| `GATE_TEST_API_URL` + `GATE_TEST_API_KEY` | CI E2E | Optional (CI degrades, build still passes) |

## How a build happens (the short version)

```
User prompt
  → Haiku classifies intent + selects components from 118-component registry (~1s)
  → /api/generate/react-stream streams customised components via SSE
  → Sandpack renders progressively in the browser (first component <3s, full site <30s)
  → User clicks Deploy → /api/hosting/deploy → live at https://[slug].zoobicon.sh
```

Diff edits ("make the header blue") regenerate one file in 2–5 seconds via `/api/generate/edit` — they don't re-run the full pipeline.

Full architecture and decision history is in `CLAUDE.md`. The 7-agent pipeline detail is in `ZOOBICON-BLUEPRINT.md`.

## Repository layout

```
src/
  app/                        # 165 pages, 576 API routes, 87 layouts
    api/
      generate/               # AI generation: react, react-stream, edit, pipeline, images
      hosting/                # Deploy, serve, DNS, SSL, CDN
      domains/                # Search, register, checkout, manage, DNS
      auth/                   # Login, signup, OAuth, password reset
      stripe/                 # Checkout, portal, webhook
      video-creator/          # Script, voiceover, render, chat
      v1/                     # Public API (HMAC-SHA256, zbk_live_* keys)
    builder/                  # AI website builder UI
    video-creator/            # 3-step chat-based video creator
    domains/                  # Domain search + TLD landing pages
    admin/                    # 16+ admin pages + mobile command centre
    tools/                    # 12 free SEO tools
    products/                 # 10 product pages
    esim/[country]/           # 50 country-specific SEO pages
  lib/                        # 254 modules
    agents.ts                 # 7-agent pipeline orchestration
    llm-provider.ts           # Multi-LLM (Anthropic → OpenAI → Gemini failover)
    component-registry/       # 118 React section components
    scaffold-engine.ts        # Instant-scaffold pre-build
    templates.ts              # Template library
    opensrs.ts                # Domain registration
    stripe.ts                 # Stripe integration
    db.ts                     # Neon connection
    video-pipeline.ts         # Own video stack (Fish + FLUX + SadTalker)
  components/                 # 77 shared React components
e2e/                          # GateTest specs (NOT Playwright — see decision log in CLAUDE.md)
tests/                        # Vitest unit tests
scripts/
  check-icons.js              # Pre-push lucide icon validator
  claude-md-audit.js          # CLAUDE.md freshness audit (npm run audit)
.github/workflows/
  ci.yml                      # quality gate → icon check → lint → unit → build → GateTest
  post-deploy.yml             # Post-deploy smoke + GateTest against production
```

## Brands

This repo serves the Zoobicon family only:
- `zoobicon.com` — main platform
- `zoobicon.ai` — AI brand identity
- `zoobicon.io` — developer / public API
- `zoobicon.sh` — customer site hosting
- `zoobicon.app` — mobile admin command centre

Dominat8 is a separate repo with its own deployment. Do not cross the streams.

## Operating doctrine

`CLAUDE.md` is the operating doctrine: the Iron Law, the §2 authorization list, 29 locked decisions, the urgent build list, and the live repo status. Read it before touching anything.

Highlights of what cannot be changed without explicit authorization:
- Opus 4.7 is the canonical builder model — never downgrade
- Mailgun is the only email provider — never add Google Workspace
- The video pipeline is owned end-to-end — never depend on HeyGen as primary
- Editorial-light palette (Rule 29) — no dark surfaces, no midnight blue
- GateTest is our E2E tool — Playwright stays in devDependencies for local convenience but CI never uses it

## Contributing

This is a private commercial project. Issues and PRs are not currently accepted from external contributors.

## License

Proprietary. All rights reserved.

---

*Built by AI. Operated by Claude. Owned by Craig.*
