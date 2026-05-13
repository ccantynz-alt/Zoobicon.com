# Changelog

All notable changes to Zoobicon are documented here. Authoritative bug-fix detail lives in `CLAUDE.md` under **RECENTLY FIXED** — this file is the human-readable shipping log.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). Zoobicon ships continuously to production, so we group by month rather than by semver tag.

---

## [Unreleased]

Active development on branch `claude/review-readme-docs-Wr1If`. See `CLAUDE.md` § URGENT BUILD LIST for what's queued.

---

## 2026-05 — Editorial-light palette + sandbox decisions locked

### Changed
- **Rule 29 — editorial-light palette swept site-wide.** 137-file pass replacing every legacy `bg-[#0b1530]` / `text-white/X` / midnight-blue surface with the holdenmercer.com-inspired palette: warm bone background (`#fafaf7`), cream elevated surfaces, near-black ink, hairline rules, deep champagne accent. CSS tokens live at the top of `src/app/globals.css`; a sweeping override layer at the bottom catches unmigrated pages.
- **Tailwind palette rebuild** — killed blue/purple/indigo at the source in `tailwind.config.js` so generated code can't reintroduce them.
- **Builder UI flipped to editorial-light** — readable tier cards, gold-gradient BUILD button, no more harsh black.
- **Header refinement** — bolder cream layer, serif Z monogram, champagne CTA, Admin hidden from public nav.
- **Cookie banner + scroll trap + tighter palette** for real definition.

### Added
- **CI guard for critical deps** — `critical-deps-guard.yml` prevents auto-fix bots from removing required packages.
- **GateTest replaces Playwright in CI** — `.github/workflows/e2e.yml` and the `playwright-e2e` job in `post-deploy.yml` now invoke GateTest against `GATE_TEST_API_URL`. Decision logged: we use our own product.
- **One-click multi-language video dub** — 50+ languages via Fish Audio S1.
- **Domain → brand → site → deploy single flow** — the ecosystem moat play.
- **Site + launch video combo** — one prompt produces both a site AND a 30s hero video.
- **AI Twins viral product page** — selfie → talking-head video, $0.05/min.
- **Hedra Character-3 + Fish Audio S1** in video pipeline with auto-burned captions.
- **Pre-crawled available-domain list** — browse every available `.com` / `.ai` / `.io`.
- **CronTech registered as deploy provider** — wires up the moment credentials are set.

### Fixed
- Reverted GateTest auto-bump that broke `npm install` on main.
- Unified domains page — one AI-driven finder, intent auto-detected.

### Decided (CLAUDE.md decision log)
- **Sandbox runtime:** keep Sandpack, wait for Crontech as production sandbox. No WebContainers license, no e2b/Modal onboarding.
- **E2E tooling:** GateTest only, no Playwright in CI. `@playwright/test` stays in devDependencies for local-dev convenience only.

---

## 2026-04 — Aggressive Opening Protocol + component upgrades

### Added
- **§1.5 Aggressive Opening Protocol** added to CLAUDE.md Iron Law. Converts "be aggressive" from a value (ignorable) into a 5-step procedure every session runs before any code is written.
- **6 next-gen 2026/2027 components** in the registry: `features-bento-grid`, `hero-text-reveal`, `logos-marquee`, `features-spotlight-cards` (cursor-tracking radial gradient), `stats-animated-counter` (IntersectionObserver + requestAnimationFrame), `cta-gradient-border` (rotating conic-gradient with `@property`).
- **Registry audited to 114 components** (prior "60" claim was stale, "100+" marketing copy was directionally correct — real count was 114, now 118).
- **AI Builder cross-provider failover** — both `/api/generate/react-stream` and `/api/generate/edit` now route through `callLLMWithFailover` (Anthropic Haiku → Sonnet → OpenAI → Gemini). Typed `{ok, code, reason, modelUsed}` returns surface real failure reasons instead of returning template scaffolds with "Acme" placeholder copy.
- **AI Name Generator hard-fail mode** — `/api/tools/business-names` now 503s with the exact missing env var, has a 25s AbortController timeout, 2-model fallback (Haiku 4.5 → Sonnet 4.5), and a depth-aware bracket-matching JSON extractor.
- **Sandpack pre-warm made functional** — `customSetup.dependencies` declares lucide-react/framer-motion/clsx/tailwind-merge in idle state, pre-warm app references each library at module level so they bundle ahead of first real prompt. Target: <3s first preview.
- **Scaffolded `webcontainers-adapter.ts`, `gate-test-hook.ts`, `crontech-adapter.ts`** — awaiting external credentials/docs.

### Fixed
- **Video pipeline 100% dead → working** — every Replicate model slug referenced was deprecated or didn't exist. Rebuilt with: 5-slug TTS chain (kokoro-82m → xtts-v2 → bark → openvoice → seamless), 4-slug avatar chain (flux-schnell → flux-dev → sdxl-lightning → sd3), 5-slug lip-sync chain (sadtalker → video-retalking ×2 → wav2lip ×2). Per-model input variants, real progress callback, hardened poll with 5-retry consecutive-failure tracking + 4.5min cap. Captions/music routed through the safety net.
- **AI Name Generator UX dead-end** — 24 names × 5 TLDs = 120 simultaneous RDAP requests overwhelmed public RDAP, all came back null, "No available domains" silent display. Fixed with server-side concurrency limit (4), client worker pool (4), default 12×3 instead of 24×5, RDAP cache (10min TTL), 429 retry with jitter, visible error banner.
- **Homepage build broken** — stray mobile-menu code referencing undefined vars, unclosed `motion.div` / `grid lg:grid-cols-2` wrappers.

### Changed
- **Opus 4.6 → 4.7** for the builder developer agent (Rule 4 update via `npm run audit`).
- **Diff editing improved** — smart context truncation for large projects, 16K max tokens (was 8K), explicit "output complete files" rule, admin auth headers.

---

## 2026-04 — Build pipeline hardening + competitive intelligence

### Added
- **Rule 28: Proactive competitive intelligence** added to IMPORTANT DECISIONS. Every session starts with a web search of all competitors before writing code. Reactive research is failure.
- **§6 Proactive Competitive Intelligence protocol** in CLAUDE.md — find competitor features before Craig does.
- **Automated icon validation** — `scripts/check-icons.js` catches missing/invalid lucide imports at CI time. Eliminates the #1 recurring build error.
- **CI pipeline overhaul** — quality gate → icon check → lint → unit tests → build → GateTest.
- **Domain purchase end-to-end wiring** — contact form → Stripe → OpenSRS → DB.
- **Deep video health check** at `/api/video-creator/health?admin=true&deep=1` — verifies all 16 Replicate model slugs.
- **Builder error visibility** — `receivedFiles` / `receivedDone` tracking with clear error messages. No more silent blank screens.

### Fixed
- **Builder "No React components" root cause** — missing state vars and refs (not patched — fixed at root).
- **Video TTS pipeline dead** — Tortoise TTS 404'd, replaced with 4-model fallback chain.
- **Publisher page text corruption** — restored Instagram/Facebook/Reddit platform names.
- **Dictation CTAs sending logged-in users to signup** — auth-aware CTA buttons check localStorage.

---

## 2026-03 — Component library + product expansion (massive build)

### Added
- **KILLED HTML output mode** — React/Sandpack is the only generation mode.
- **Streaming React generation** — files appear progressively in the preview as they're customised.
- **6 new products built:** eSIM (190+ countries), VPN, AI Dictation, Cloud Storage, Booking, + provider layers.
- **50 country-specific eSIM SEO pages** at `/esim/[country]`.
- **10 SEO product pages** (VPN, eSIM, Dictation, Storage, Booking, Hosting, etc.).
- **12 free SEO tools** targeting 11.4M monthly searches.
- **AI Business Name Generator** — nuclear SEO funnel → domain → website → everything.
- **Bulletproof resilience layer** — retry, circuit breaker, error sanitization.
- **Technology Currency Agent** — monitors stack, alerts on outdated deps.
- **`/admin/mobile` command centre** — Craig's iPhone/iPad mobile admin.
- **`/disclaimers` legal page** + disclaimers on all comparison tables.
- **Connectivity + cloud infra monitoring** added to market crawler (Starlink, Celitech).

### Changed
- **Deep audit pass** — 19 broken references fixed, 20,000+ lines of dead code removed.
- **Sandpack full-screen preview fix** — was only rendering a tiny portion.
- **Anthropic SDK 0.39 → 0.80, framer-motion → 12.38, Stripe → 21.0, lucide-react → 1.7.**

### Fixed
- Fixed all 4 outstanding known issues (dead components, dead libs, email validation, `<img>` → `<Image>`).
- Fixed streaming placeholder stubs (no more module-not-found during generation).
- Retention-optimised pricing across all products.

---

## 2026-03 — Editorial-light groundwork + admin polish

### Added
- **Post-generation editing system** — project persistence, chat memory, section management.
- **Site scanner** — auto-detects near-black backgrounds, currently shows 0 warnings.
- **Gate Test API integration** — module-based response parsing, direct API in CI.

### Changed
- **Gate Test is now non-advisory** — failures block merge.
- **Builder UI simplified** — Advanced mode toggle hides 23 tools for novices.
- **Replaced Supabase with Zoobicon's own backend** for generated sites.
- **Admin dashboard unified** — elegant monochrome palette, no rainbow.

### Fixed
- Near-black backgrounds on 81 pages (27 + 54 in two passes).
- Admin panel — solid opaque backgrounds, no more dark bleed-through.
- Faint admin text — bumped colors and font sizes for readability.
- Merge damage on main — duplicate body tags, spliced homepage, duplicate state vars.

---

## 2026-02 — Multi-LLM + 7-agent pipeline

### Added
- **7-agent build pipeline** in `src/lib/agents.ts` — Strategist → Brand Designer + Copywriter + Architect → Developer (Opus) → SEO + Animation enhancers.
- **Multi-LLM abstraction** at `src/lib/llm-provider.ts` — Anthropic primary, OpenAI + Gemini failover.
- **Public API v1** at `/api/v1/*` — stateless HMAC-SHA256 keys (`zbk_live_*`).

---

## 2026-01 and earlier

Initial platform scaffolding. Core products: AI website builder (Sandpack-based), real OpenSRS-backed domain search, video creator chat flow, Stripe payments, Neon Postgres, Vercel + Cloudflare. Full history is in `git log`.

---

[Unreleased]: https://github.com/ccantynz-alt/Zoobicon.com/compare/main...claude/review-readme-docs-Wr1If
