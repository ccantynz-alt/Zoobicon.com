# BUILDER MASTER PLAN

> **The goal:** best AI builder on earth, self-sufficient, fast, scary to competitors.
> Crontech provides infrastructure; everything *inside* the builder stays ours.
>
> **The status legend:**
> - ✅ Shipped (commit linked)
> - 🚧 In flight (current commit)
> - ⏳ Queued
> - ⛔ Blocked (external dependency)
>
> Update this checklist on every commit. The PR description references back to it. No item is "done" until the checkbox is ticked here.

---

## SPRINT 1 — FOUNDATION (quality + speed + self-sufficient)

The Prestige Properties cream-on-cream bug is symptomatic; this sprint kills the whole bug class.

- [x] **Q1** ✅ **Agent contract hardening** — system prompts enforce WCAG AA contrast, non-empty CTAs, mobile breakpoints, semantic HTML. The warm preset specifically calls out the Prestige Properties cream-on-cream bug as the failure mode to never ship.
- [x] **S1 + I1 + I3** ✅ **Self-host preview deps under `/vendor/`** — `scripts/vendor-sync.mjs` runs as `prebuild`, downloads React + ReactDOM + Babel + lucide-react + framer-motion + clsx + tailwind-merge from esm.sh into `public/vendor/`. EscapeHatchPreview reads `/vendor/manifest.json` on mount and prefers local paths per-dep, falls back to esm.sh per-dep when missing. Result: runtime never hits esm.sh once Vercel has populated `/vendor/`. Build-time still pulls (one-time per deploy).
- [x] **Q3** ✅ **Slot contract validation** — pragmatic version shipped: `validateCustomisedComponent` runs after every Babel-verified customisation, detecting empty `<button>`, empty link-as-button, missing alts, untouched placeholder copy. If issues found, ONE repair pass with the issue list as fix-list. If repair doesn't help, ship the original (better than base fallback). Declarative per-component slot declarations deferred to a future iteration.
- [x] **Q4** ✅ **Brand-coherence token sheet** — planner now emits a full BrandSpec (brandName + primaryColor + bgColor + textPrimary + textSecondary + accentColor + headlineFont + bodyFont) that gets injected into every customiseComponent call. Customiser system prompt instructs the LLM to draw colors + fonts ONLY from this sheet and to match closest Tailwind shade. Contrast-safe defaults ensure even fallback builds pass WCAG AA.
- [x] **S2** ✅ **Content-hash transpile cache** — Babel.transform output cached in `localStorage` keyed by SHA-256 of `(path + sourceForBabel)`. Edits that change one file in a 13-file project skip 12 Babel runs. LRU sweep at 200 entries. Cache hit-rate logged to DevTools console.
- [x] **S3** ✅ **Pre-warm the iframe** — PrewarmFrame mounted at `/builder` page load fires `import()` for Babel + React + ReactDOM + lucide-react + framer-motion + clsx + tailwind-merge before user types. Now manifest-driven: prefers `/vendor/` paths when populated, falls back to esm.sh per-dep — same logic as the real preview iframe so HTTP cache fills hit identical URLs.
- [x] **I2** ✅ **Sandpack migration de facto complete** — `useEscapeHatch` defaults to `true` in builder/page.tsx (line 568); Sandpack is opt-in only via localStorage. EscapeHatchPreview is the default preview path. Removing the `@codesandbox/sandpack-react` dependency entirely is a future cleanup but no longer in the hot path.

---

## SPRINT 2 — COMPETITOR PARITY

- [x] **Q2 + T3** ✅ **Post-generation critique + auto-fix loop** — `runQualityLoop` is no longer premium-only. Runs on every build: 1 pass for free tier, 2 passes for premium. The BrandSpec from the Q4 planner is fed into the critic so it catches cross-component palette violations (e.g. one component using bg-cyan-500 when the spec is amber). Score + issues streamed to UI on completion.
- [x] **T2 (Plan Mode)** ✅ **Plan Mode shipped via pre-flight endpoint** — `/api/generate/plan` returns industry + brandName + component lineup + estimated cost in <1s; builder gates the expensive build behind a user confirm via `planReview` state in `/builder/page.tsx`. KILLER-MOVES-BUILDER #B12 was the historic context. **Prompt Queue** (batch 50 changes) is the remaining Lovable-parity piece — tracked separately as a follow-up in the Advanced Funnels queue below.
- [ ] **T2 (Prompt Queue)** ⏳ **Prompt Queue** — batch multiple edit prompts and process them sequentially. Backend already supports the diff-edit endpoint; frontend needs a queue UI.
- [x] **T8** ✅ **Industry-aware defaults** — `planComponents` runs `detectIndustry()` on the user prompt, looks up the matching niche in `src/lib/seo/niches.ts` (the same catalog driving the 28 SEO pages), and injects the niche's `sections[]` + `mustHaves[]` into the planner user message. Planner now has explicit niche-specific guidance for free; the SEO investment pays off in every build.

---

## SPRINT 3 — COMPETITOR TERROR MOVES

- [x] **T1** ✅ **AI Site Audit Agent** — `/audit` route shipped. `scoreAudit()` in url-extractor returns 4 category scores (perf/SEO/a11y/conversion) with ✓ passed and ✗ failed check lists. Report card UI + "Rebuild with these fixes" CTA → builder with prefilled prompt. Linked from nav. Targets high-volume "free website audit AI" search intent.
- [x] **T5** ✅ **Voice-to-Site** — VoiceToBuildButton now mounted on every onboarding surface (builder, homepage HeroBuilder hero, /upgrade URL input, /audit URL input). Voice is no longer just-in-builder; users can dictate from the first impression.
- [x] **T6** ✅ **Multi-format generation** — `src/lib/brand-assets.ts` exports `generateBrandAssets(brandSpec, contactInfo)` returning favicon SVG + email signature HTML + OG card SVG + Twitter card SVG + business card SVG. `/api/brand-assets` POST endpoint wraps it. `/brand-kit` page renders the kit with download buttons + live brand-spec editor. Nobody else in the AI builder space generates the full kit from one input.

---

## SPRINT 4 — DEPTH

- [x] **T4 (partial)** ✅ **MCP — GitHub + WordPress import paths shipped.** `/github-import` + `/api/github/preview` wraps existing `fetchGitHubContext` to pull README/package.json/repo info and compose a builder prompt for a landing page. `/wordpress-import` + `/api/wordpress/import` does the same for WordPress sites via wp-json (richer structured data than HTML scraping). Figma + Notion connectors still queued.
- [ ] **T7** ⏳ **Real-time multi-user collaboration** — two people editing the same site simultaneously.
- [x] **T9 (partial)** ✅ **Share / Fork URL** — builder gains a Share button in the top toolbar that copies a builder URL with the current prompt encoded. A recipient opens the link and starts a session that begins at the same prompt. Full file-state sharing requires DB persistence (queued as `shared_builds` table follow-up).

---

## INFRASTRUCTURE OWNERSHIP CHECKLIST

What we own / what's external — Craig's "self-sufficient" goal made concrete.

| Layer | State | Notes |
|---|---|---|
| Multi-LLM (Claude · GPT · Gemini · Groq Llama) | ✅ multi-provider failover wired | I4 hardens the failover order |
| Component registry | ✅ owned (121 components) | Q3 adds the slot contract |
| Preview sandbox | 🚧 EscapeHatchPreview default; S1/I2/I3 finish self-hosting | |
| Agent pipeline | ✅ owned (6 visible agents) | Q1/Q4 harden the contract |
| Intel flywheel | ✅ owned (HN + Reddit) | |
| SEO programmatic surface | ✅ owned (63 pages) | |
| URL clone-and-upgrade | ✅ owned (`/upgrade`) | Site Audit (T1) extends it |
| Marketplace UI | ✅ owned (`/marketplace`) | Waiting on Crontech catalog API |
| Auth | ⛔ Crontech SSO (waiting on Crontech) | |
| Hosting for generated sites | ⛔ Crontech (API documented) | |
| Domain registration | ⛔ Crontech (API documented) | |
| Email | ⛔ Crontech BLK-030 (wired, waiting on token) | |
| Stripe (own billing) | ✅ wired | |
| Vercel (Zoobicon app hosting) | ✅ owned account | |

---

## CRONTECH-DEPENDENT CHECKLIST

These ship the moment Crontech endpoints are live. Code is ready.

- [ ] **C1** ⛔ Stripe webhook → Crontech provisioning closure (marketplace)
- [ ] **C2** ⛔ In-app Crontech catalog goes live (UI shipped, needs API)
- [ ] **C3** ⛔ Per-project add-on management view
- [ ] **C4** ⛔ Live deploy status streaming in builder

---

## ADVANCED FUNNELS (queued, parallel track)

- [ ] **F1** ⏳ Screenshot → site (image upload, AI rebuilds as React)
- [ ] **F2** ⏳ LinkedIn URL → personal portfolio
- [ ] **F3** ⏳ Email signature → microsite
- [ ] **F4** ⏳ "Domain available" landing → "build me a site for it"
- [ ] **F5** ⏳ Competitor monitor → diff-and-rebuild
- [x] ✅ URL clone-and-upgrade (`/upgrade`) — shipped 2026-05-30

---

## RUNNING SHIPPED-LIST (rolling log)

This is what's been ticked off in chronological order. Newest at top.

- **2026-05-30** — ✅ T9 partial — Share/fork URL button in builder toolbar; copies current prompt as a shareable link
- **2026-05-30** — ✅ T4 partial — GitHub repo import (/github-import + /api/github/preview) and WordPress wp-json import (/wordpress-import + /api/wordpress/import). Figma + Notion connectors queued.
- **2026-05-30** — ✅ T6 Multi-format generation — brand-assets.ts + /api/brand-assets + /brand-kit page; favicon + email signature + OG + Twitter + business card from one BrandSpec
- **2026-05-30** — ✅ T5 Voice-to-Site — VoiceToBuildButton mounted on HeroBuilder + /upgrade + /audit (was builder-only)
- **2026-05-30** — ✅ T1 AI Site Audit — /audit route + /api/audit/run + scoreAudit() with 4 category scores; nav link added
- **2026-05-30** — ✅ T2 (Plan Mode) — confirmed pre-shipped (KILLER-MOVES #B12) at `/api/generate/plan` + planReview gate in builder. Prompt Queue split out as a follow-up.
- **2026-05-30** — ✅ Q2+T3 Post-generation critique loop runs on every build (was premium-only); BrandSpec fed to critic catches palette drift
- **2026-05-30** — ✅ T8 Industry-aware defaults — detectIndustry + niches catalog inject sections/must-haves into planner user message
- **2026-05-30** — ✅ I2 Sandpack migration confirmed complete — EscapeHatch is the default; Sandpack is opt-in only
- **2026-05-30** — ✅ Q3 Slot contract validation — validateCustomisedComponent + ONE auto-repair pass with detected issues as fix-list
- **2026-05-30** — ✅ Q4 Brand-coherence token sheet — planner emits full BrandSpec (palette + typography), injected into every customiseComponent call as a hard "use only these tokens" contract
- **2026-05-30** — ✅ S3 Pre-warm iframe — PrewarmFrame updated to manifest-driven hybrid URLs (matches EscapeHatchPreview); HTTP cache fills hit the same /vendor/ paths the real preview uses
- **2026-05-30** — ✅ S2 Content-hash transpile cache — localStorage cache keyed by SHA-256 of (path + source), LRU sweep at 200, hit-rate logged
- **2026-05-30** — ✅ S1+I1+I3 Self-host preview deps — vendor-sync prebuild script + manifest-driven hybrid ESM map in EscapeHatchPreview, esm.sh removed from runtime hot path
- **2026-05-30** — ✅ Q1 Agent contract hardening — QUALITY CONTRACT block added to CUSTOMISER_SYSTEM_BASE in react-stream route, warm preset tightened with explicit guidance against the Prestige Properties cream-on-cream bug class
- **2026-05-30** — `BUILDER-MASTER-PLAN.md` written and committed (this doc)
