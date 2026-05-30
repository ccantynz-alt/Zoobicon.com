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

- [ ] **Q2 + T3** ⏳ **Post-generation critique + auto-fix loop** — QA agent reads the rendered DOM, detects issues, Developer agent runs a fix pass. Lovable's Browser Testing + Bolt V2's auto-error-fix in one move.
- [ ] **T2** ⏳ **Plan Mode + Prompt Queue** — batch 50 changes, preview diffs, apply selectively. Lovable parity.
- [ ] **T8** ⏳ **Industry-aware defaults** — niche pages drive builder defaults when user picks an industry.

---

## SPRINT 3 — COMPETITOR TERROR MOVES

- [ ] **T1** ⏳ **AI Site Audit Agent** — `/audit` route. Paste URL → perf + SEO + accessibility + conversion audit → fix list → rebuild CTA. Extends `/upgrade`.
- [ ] **T5** ⏳ **Voice-to-Site** — harden the existing VoiceToBuildButton end-to-end.
- [ ] **T6** ⏳ **Multi-format generation** — one prompt → site + email signature + social cards + business card + favicon + OG images. Total brand kit from one input.

---

## SPRINT 4 — DEPTH

- [ ] **T4** ⏳ **Real MCP integration** — GitHub repo import, Figma frame import, Notion content import.
- [ ] **T7** ⏳ **Real-time multi-user collaboration** — two people editing the same site simultaneously.
- [ ] **T9** ⏳ **Fork / Session continuity** — every prompt is a branch point.

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

- **2026-05-30** — ✅ I2 Sandpack migration confirmed complete — EscapeHatch is the default; Sandpack is opt-in only
- **2026-05-30** — ✅ Q3 Slot contract validation — validateCustomisedComponent + ONE auto-repair pass with detected issues as fix-list
- **2026-05-30** — ✅ Q4 Brand-coherence token sheet — planner emits full BrandSpec (palette + typography), injected into every customiseComponent call as a hard "use only these tokens" contract
- **2026-05-30** — ✅ S3 Pre-warm iframe — PrewarmFrame updated to manifest-driven hybrid URLs (matches EscapeHatchPreview); HTTP cache fills hit the same /vendor/ paths the real preview uses
- **2026-05-30** — ✅ S2 Content-hash transpile cache — localStorage cache keyed by SHA-256 of (path + source), LRU sweep at 200, hit-rate logged
- **2026-05-30** — ✅ S1+I1+I3 Self-host preview deps — vendor-sync prebuild script + manifest-driven hybrid ESM map in EscapeHatchPreview, esm.sh removed from runtime hot path
- **2026-05-30** — ✅ Q1 Agent contract hardening — QUALITY CONTRACT block added to CUSTOMISER_SYSTEM_BASE in react-stream route, warm preset tightened with explicit guidance against the Prestige Properties cream-on-cream bug class
- **2026-05-30** — `BUILDER-MASTER-PLAN.md` written and committed (this doc)
