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

- [ ] **Q1** ⏳ **Agent contract hardening** — system prompts enforce WCAG AA contrast, non-empty CTAs, mobile breakpoints, semantic HTML, JSON-LD by default. One prompt rewrite kills 80% of quality bugs.
- [ ] **S1 + I1 + I3** ⏳ **Self-host preview deps under `/vendor/`** — React, ReactDOM, Babel, lucide-react, framer-motion, clsx, tailwind-merge served from zoobicon.com. Eliminates esm.sh + Babel CDN dependencies in one move.
- [ ] **Q3** ⏳ **Component registry slot contract** — every component declares its required slots; generation can't ship a component with an empty required slot.
- [ ] **Q4** ⏳ **Brand-coherence token sheet** — Brand Designer agent emits a palette + typography token sheet that the Developer agent must reference. Kills cream-on-cream and font drift globally.
- [ ] **S2** ⏳ **Content-hash transpile cache** — once a file is Babel-transpiled, cache the Blob URL by SHA-256 of source. Re-render in milliseconds.
- [ ] **S3** ⏳ **Pre-warm the iframe** — load Babel + React + registry into a hidden iframe on `/builder` mount, before user types. Sub-2s first preview.
- [ ] **I2** ⏳ **Finish Sandpack migration** — EscapeHatchPreview is the default; make Sandpack removable.

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

- **2026-05-30** — `BUILDER-MASTER-PLAN.md` written and committed (this doc)
