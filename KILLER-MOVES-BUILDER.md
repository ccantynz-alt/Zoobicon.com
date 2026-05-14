# 20 Killer Moves to Annihilate the AI-Builder Competition

> **Locked: 2026-05-13.** Sister doc to `KILLER-MOVES.md` (platform-wide
> moves) and `INNOVATIONS.md` (six original architectural ideas).
>
> This list is scoped narrowly to the AI BUILDER itself — what makes our
> generation pipeline faster, more reliable, and produce better output
> than Bolt, Lovable, v0, and anyone who shows up next.
>
> If `KILLER-MOVES.md` is the platform-strategy backbone, this is the
> builder-strategy backbone. Every commit that touches generation,
> Sandpack, the registry, the customizer, or the failover layer should
> cite a move from THIS list.

---

## Tier 0 — Reliability + Speed Foundation (everything else builds on these)

### B1 — Slot-Locked Composition (Innovation #1)
AI never generates code. Each registry component is a template with named slots + JSON schema. AI produces structured JSON; server assembles deterministically.
- **Beats them how:** Bolt/Lovable verify free-form code post-hoc; we make broken output structurally impossible.
- **Metric:** Structural correctness 100%. Speed 3-5x faster per component. Tokens -70%. Repair cost 50x cheaper.
- **Effort:** 1-2 weeks. **Status:** Designed. Not started.

### B2 — Generate → Compile → Boot → Repair verification loop
For any component still going through code-gen (the 20% slot-locked can't cover), compile in-browser via `@swc/wasm`, boot in a hidden Sandpack instance, capture errors, send error+code back to Haiku for ONE repair pass.
- **Beats them how:** This is Bolt V2's "auto-error-fixing agent" — table stakes if we don't have slot-locked covering the case.
- **Metric:** 90% → 97% reliability on free-form path.
- **Effort:** 4-6 commits. **Status:** Not started.

### B3 — Predictive pre-generation (Innovation #2)
While user types, Haiku predicts intent, pre-warms registry rows, pre-customises navbar (almost always the same). On submit, we fast-forward.
- **Beats them how:** Their preview = build pane. They can't speculatively preview. We can.
- **Metric:** First paint <2s perceived.
- **Effort:** 2 commits. **Status:** Not started.

### B4 — Real Sandpack pre-warm (kill the cosmetic version)
Audit confirmed current pre-warm declares deps but never references them — bundler tree-shakes. Fix: ACTUALLY reference each warmup dep so the bundler caches them. Plus wire CronTech adapter for the moment its API ships.
- **Beats them how:** Bolt boots in 3-5s. We currently boot in 15-20. Closes the speed gap.
- **Metric:** First-real-render <3s, currently ~18s.
- **Effort:** 2 commits. **Status:** Cosmetic version exists; rewrite needed.

### B5 — Telemetry-driven improvement (Move #3, shipped foundation 2026-05-13)
Every build logged: prompt, components, models, tokens, latency, failures. Failure patterns become regression tests. Weak components get redesigned. Slow models get demoted.
- **Beats them how:** They have it. Until 2026-05-13 we collected the data and threw it away.
- **Metric:** Identifies the bottom 10% of components per quarter; replace them.
- **Effort:** Foundation shipped (`commit 3d30e30`). React-stream wiring next.

### B6 — Per-user cost ceiling + abuse detection (Move #5, shipped foundation 2026-05-13)
Daily token budget per plan tier. Soft cap warns; hard cap blocks. Detect runaway critique loops and prompt-spam attacks.
- **Beats them how:** Lovable burned through millions before they noticed. We get one shot at this; do it before scale.
- **Metric:** No single user can cost >$X/day without manual override.
- **Effort:** Foundation shipped (`commit 3d30e30`). Middleware wiring next.

---

## Tier 1 — Output Quality (make the SITE win)

### B7 — Component registry 118 → 250 with industry variants
12 hero variants per industry: SaaS / restaurant / agency / portfolio / startup / e-commerce / fitness / wedding / legal / medical / education / real-estate. Each hand-tuned.
- **Beats them how:** They generate from scratch and get generic output. We assemble from hand-tuned variants with 250 × 8 = 2000 unique compositions, all production-grade.
- **Metric:** Generated sites pass a blind designer judgement test against Lovable/Bolt outputs at >70%.
- **Effort:** Ongoing — 12 commits over 3-4 weeks.

### B8 — Industry-specific system prompts overlay
Restaurant = sensory + Playfair italic. SaaS = benefit-led + technical credibility. Agency = case studies + social proof. Detected by the planner.
- **Beats them how:** Generic prompts produce generic copy. Industry prompts produce copy the actual operator would write.
- **Effort:** 1 commit.

### B9 — Multi-judge panel critique (Innovation #5)
Typography critic + Copy critic + Layout critic, all Haiku, parallel. Targeted repair on flagged axis only.
- **Beats them how:** Lovable runs one big Sonnet critic. Three small specialists cost less AND catch more.
- **Metric:** Critique cost -80%. Issues caught +30%.
- **Effort:** 3 commits.

### B10 — Screenshot regression CI + axe-core a11y gate
Every registry change renders at 375px + 1280px, diffs against baseline, runs axe-core. PR can't merge on regression.
- **Beats them how:** Lovable doesn't screenshot-diff. They ship mobile-broken components occasionally.
- **Effort:** 2-3 commits via GateTest.

### B11 — Component-graph builds (Innovation #3)
Components declare slot dependencies as a DAG. Brand kit generated ONCE; navbar+hero+footer reference it. No more "8K users in testimonials, 12K in stats" drift.
- **Beats them how:** Their parallel-flat architecture duplicates context. DAG is structurally consistent.
- **Metric:** Token cost -60% on multi-section builds. Zero cross-component data drift.
- **Effort:** 2-3 commits (requires Slot-Locked first).

---

## Tier 2 — Differentiation (we have it, they don't)

### B12 — Plan Mode + user-editable plan (Innovation parallel to Lovable)
Before generation, Haiku proposes structured plan: sitemap, sections per page, copy tone, integrations. User reviews/edits. Generation locks to plan with schema validation.
- **Beats them how:** Lovable 2.0 has this; we don't yet. Match table stakes for complex multi-page builds.
- **Effort:** 3-4 commits.

### B13 — Site + 30-second hero video combo (one prompt)
When generating a site, in parallel generate a 30s talking-head hero video via our pipeline (Fish Audio S1 + Hedra Character-3 + Whisper captions). Embedded in hero by default.
- **Beats them how:** No competitor bundles AI video with the AI builder. HeyGen costs $29-149/mo standalone; ours bundles at $0.05/min.
- **Effort:** 3 commits (video pipeline already shipped May 2026).

### B14 — AI Twins host integration (selfie → personalised host)
Customer uploads selfie during onboarding. Every page gets a personalised AI-generated talking-head video introducing the section.
- **Beats them how:** Captions app has AI Twins, no website builder. We have both.
- **Effort:** 2 commits.

### B15 — Multi-language hero video dub (50+ languages, baked into output)
Hero video automatically dubbed in every target language declared in site metadata. Locale middleware serves the right one.
- **Beats them how:** HeyGen does 175 languages at premium prices. We bundle 50+ at $0.05/min.
- **Effort:** 2 commits (dub endpoint already shipped May 2026).

### B16 — Voice prompts (talk → site)
Microphone button in PromptInput. Web Speech API → Deepgram fallback. Optional: clone the user's voice for the site's hero voiceover.
- **Beats them how:** No other AI builder accepts voice input. 30-second UX advantage that demos like science fiction.
- **Effort:** 2 commits.

### B17 — Visual editor overlay (click → edit, no prompt)
Overlay on the Sandpack preview. Click any element → edit text / swap icon / change colour / remove. Changes ship as targeted diff via `/api/generate/edit` or (post-Slot-Locked) slot mutations.
- **Beats them how:** Wix has visual editing, AI builders don't. Combining AI gen + visual edit = the holy grail.
- **Metric:** 5-second edits where prompts take 30s.
- **Effort:** 5-6 commits.

---

## Tier 3 — Recurring lock-in (sites that never get stale)

### B18 — Hot-Swap Live Component Upgrades (Innovation #4)
Customer's deployed site pulls templates from our CDN at render time. We improve `hero-spotlight` v2 → v3 → all customer sites auto-upgrade overnight without the customer touching anything. Slot values preserved.
- **Beats them how:** Lovable deploys a frozen site. Ours improves while the customer sleeps. This is the LIFETIME VALUE moat.
- **Marketing line:** *"Your competitor's AI-built site is frozen in time. Yours improves every week."*
- **Effort:** 5-6 commits (requires Slot-Locked first).

### B19 — Build-output caching at the JSON layer (Innovation #6)
Hash `(normalised_prompt + brand + theme + industry)` → cached slot-fill JSON. 30%+ cache hit rate at scale. Re-customise only the brand-specific slots.
- **Beats them how:** Free-form code is too unique to cache; JSON is trivially cacheable.
- **Metric:** $30k/day cost advantage vs Bolt at 1M builds/day.
- **Effort:** 2-3 commits (requires Slot-Locked first).

### B20 — Auto-improvement agents on every deployed site
The 22 agents in `src/agents/` activated: SEO Auto-Fix runs weekly, Performance Guardian runs daily, Content Freshness alerts at 30 days, Competitive Intel scans the user's industry weekly. Customer wakes up to "We improved your SEO score 72 → 89 overnight."
- **Beats them how:** Bolt and Lovable ship sites and walk away. Ours have a maintenance team built in. This is the recurring-revenue lock-in.
- **Effort:** 3-4 commits (framework exists, scheduling + per-site wiring incomplete).

---

## Tier 4 — Capacity (the "API bank" that lets us serve 1M builds/day)

Craig (2026-05-14): *"There must be a way of building up an API bank
storage to allow for the heavy load and flywheel system… we should be
able to wipe this competition."* Yes. Eight layers compose into an
architecture Bolt and Lovable structurally cannot match because they
single-vendor on Anthropic.

### B21 — Proactive multi-provider sharding (the API bank)
Distribute requests across Anthropic + OpenAI + Gemini PROACTIVELY before any rate-limit hits — not reactively via failover. Per-provider rate-budget tracking with a sliding-minute window. Picker chooses the provider with the most headroom on every call.
- **Beats them how:** Single-vendor on Anthropic means a 4000-RPM ceiling. Three providers in parallel = 14000+ RPM effective capacity with the same code path. They can't copy this without re-architecting their failover.
- **Deliverable:** `src/lib/api-bank.ts` (shipped this session), tests, integration into slot-stream's hot path.
- **Status:** ✅ Library shipped. Slot-stream wiring next.

### B22 — Multi-tenant Anthropic key pool
Run 5 separate Anthropic org accounts. Round-robin across them. Each gets its own Tier-4 rate limit. 5 × 4000 RPM = 20k RPM headroom on Anthropic alone, on top of B21's cross-provider distribution.
- **Beats them how:** Lovable and Bolt run on a single Anthropic org. Their effective ceiling is whatever one org tier provides. We multiply by N.
- **Deliverable:** Pool config + key rotation in `api-bank.ts`. Craig task: open 4 more Anthropic orgs at $5k/mo committed-spend tier each.
- **Status:** Pool architecture lives in `api-bank.ts`; needs Craig to fund the additional orgs.

### B23 — Overnight prebuild factory
Cron job runs at off-peak hours generating slot-fills for the most common (industry × theme × prompt-pattern) combinations and seeding the slot-fill cache. By morning, ~70% of inbound customer prompts hit cache with zero API cost.
- **Beats them how:** Bolt and Lovable can't cache free-form code outputs. Our JSON slot-fills are trivially cacheable. The prebuild factory is a pure cost-shifter — moves API spend to off-peak when rate limits are abundant.
- **Deliverable:** `/api/cron/prebuild-factory` Vercel cron + seed list of (industry × theme × prompt-pattern) triples + bulk slot-fill generator.
- **Status:** Queued. Foundation in B19 cache module.

### B24 — Open-source model fallback (Groq Llama 3.3 70B)
When Anthropic + OpenAI + Gemini all sideline, fall back to Llama 3.3 70B on Groq. ~$0.20/M tokens (cheaper than Haiku), ~750 tokens/second (faster than Anthropic). For the slot-fill job (structured JSON output from a schema), Llama is "good enough."
- **Beats them how:** Bolt and Lovable have no public-cloud fallback. We have a 4th-line provider that doesn't share rate-limits with the big-three.
- **Deliverable:** Groq provider in `llm-provider.ts` + budget config in `api-bank.ts`.
- **Status:** Queued.

### B25 — Self-hosted Llama on Hetzner GPU bank
Final tier. Own the compute. 2 × Hetzner H100 nodes = ~$3000/month for ~80 RPS sustained Llama 3.3 70B inference. At 1M builds/day average, that's $0 marginal API cost — only fixed infrastructure cost.
- **Beats them how:** Per-build cost trends to $0 as volume grows. They pay per token forever; we pay per server. Eventually we cross over and our unit economics dominate.
- **Deliverable:** Terraform for Hetzner H100s + vLLM serving Llama 3.3 + provider integration in `llm-provider.ts`.
- **Status:** Queued. Decision point: when monthly Anthropic+OpenAI+Gemini bill crosses ~$5000.

---

## Combined impact at full execution

| Axis | Bolt/Lovable today | Zoobicon after all 20 moves |
|---|---|---|
| Structural correctness | ~95% | **~99.5%** |
| First paint | 3-5s (Bolt) / 8-12s (Lovable) | **<2s** (predictive + real pre-warm) |
| Full build | 25-30s | **8-12s** |
| Cost per build | ~$0.05 | **~$0.02** at scale (caching) |
| Repair cost when error | $0.05 (regenerate full file) | **$0.001** (regenerate one slot) |
| Site quality vs $50K agency | "Pretty good for AI" | **Indistinguishable** |
| Site quality 12 months later | "Frozen in time" | **Improved every week** |
| Cross-component consistency | "Mostly OK" | **Structural via DAG** |
| Industry-specificity | Generic SaaS-flavoured | **12 hand-tuned variants per industry** |
| A11y compliance | Best-effort | **CI-gated, axe-core verified** |
| Mobile correctness | Best-effort | **Screenshot-regression CI** |
| Voice input | None | **Talk → site** |
| Visual editing | None | **Click → edit overlay** |
| Hero video | None | **30s talking head, multi-language** |
| Personalised host | None | **AI Twin from your selfie** |
| Backend wiring | Generated stubs | **Auto-provisioned (Supabase + own backend)** |
| Cost telemetry | None | **Full per-build observability** |
| Abuse protection | Rate-limit only | **Cost ceiling per plan tier** |

**At full execution, Zoobicon's AI builder is not 110% better than the competition. It's a different category of product.**

---

## Execution order (referenced commits)

**Foundation already shipped:**
- ✅ Phase 1 validator (`717e778`) — blocks broken AI output
- ✅ Phase 2 surface-failures (`399ef11`) — user sees every failure
- ✅ Move #3+#5 foundation (`3d30e30`) — telemetry + quota libraries

**Next 4 weeks (in order):**
1. **Week 1:** B5 react-stream wiring (telemetry on every build) → B6 quota middleware (refuse builds over hard cap)
2. **Week 1-2:** B1 Slot-Locked Composition — rewrite 30 highest-traffic components, ship behind feature flag, A/B test
3. **Week 2:** B4 real Sandpack pre-warm (fix cosmetic version) + B3 predictive pre-generation
4. **Week 2-3:** B12 Plan Mode + B8 industry-prompt overlays
5. **Week 3:** B9 multi-judge critique + B2 verification loop (for non-slot path)
6. **Week 3-4:** B11 component-graph builds + B7 industry-variant components (parallel content work)
7. **Week 4:** B10 screenshot CI + axe-core gate
8. **Week 4-5:** B17 visual editor overlay
9. **Week 5:** B19 build-output caching (requires B1) + B18 hot-swap live upgrades (requires B1)
10. **Week 5-6:** B13 site+video combo + B14 AI Twins + B15 multi-language dub
11. **Week 6:** B16 voice prompts + B20 auto-improvement agents activated

---

## The pitch (one paragraph, for marketing)

> Most AI builders teach the AI to write code. We taught the AI to fill in the
> blanks of hand-crafted templates. Sites that cannot break. Builds in eight
> seconds. Hero videos in fifty languages. Personalised AI hosts from a single
> selfie. Sites that improve every week without you touching them. While our
> competitors verify their AI's broken output, ours has nothing to verify —
> the structure was perfect before the AI ever saw it.

That's the story. The 20 moves above are how we earn the right to tell it.
