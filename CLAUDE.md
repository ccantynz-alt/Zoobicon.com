# CLAUDE.md — Zoobicon Master Guide
### Technical bible + Business strategy + Daily build plan — ONE FILE, ONE SOURCE OF TRUTH

---

# 🔒 THE IRON LAW — READ THIS BEFORE YOU TOUCH ANYTHING

> **This section is THE BIBLE. Everything below it is supporting scripture.**
> **Before every build. Before every commit. Before every decision.**
> **If what you are about to do violates THE IRON LAW, STOP.**
> **No exceptions. No "this one time." No "it's faster if I just…".**

## 0A. CLAUDE.md IS A SNAPSHOT, NOT A CEILING

> **This rule sits above everything. It is the kill-switch for stagnation.**

CLAUDE.md is a static file. The AI landscape is not. Models ship weekly. Competitors ship daily. Dependencies age. **If CLAUDE.md contradicts current reality, reality wins.** The correct response to a stale section is not "follow the stale rule" — it is "update the bible in this session, then proceed."

**Procedure, not a value (values get ignored):**
1. **Every session opens with `npm run audit`.** The script (`scripts/claude-md-audit.js`) traffic-lights model pins, "Last updated" stamps, competitor-section freshness, and — with `npm run audit:deep` — npm majors behind stable.
2. **Every finding gets triaged before code is written.** 🔴 = must fix this session (update CLAUDE.md, then act on the finding). 🟠 = fix this session if time. 🟢 = clear.
3. **Upgrading a pin is Claude's job, not Craig's.** If the audit says "claude-opus-4-6 is stale — canonical is claude-opus-4-7," Claude updates the rule and every code reference to it in the same commit. No asking. No flip-flop. Reality wins.
4. **CLAUDE.md updates ship alongside feature commits.** When a session ends, if the bible hasn't been touched, something was probably missed. At minimum the "Last updated" stamp on LIVE REPO STATUS gets bumped.

**Exception:** the §2 authorization list still applies. Claude doesn't silently swap Anthropic → OpenAI as the primary provider just because a new model shipped. Model *pins within the Anthropic family* (Opus 4.6 → 4.7) are a Claude update. Strategy-level reversals ("drop Claude") are Craig's call.

The quality bar is not "match what CLAUDE.md says." The quality bar is "be the most advanced on earth." CLAUDE.md is the record of that target — not the cap on it.

## 0. THE SINGLE PURPOSE
Zoobicon exists to **dominate and annihilate every competitor in the AI Website Builder space — Lovable, Bolt, v0, Emergent, Google Stitch.** Per Rule 32 (2026-05-27), this is our ONE product. Not "compete with." Not "be comparable to." **Dominate. Annihilate.** Our wedge is the domain-in-checkout flow that no competitor has + slot-locked composition + Crontech-delegated infra letting us pour 100% of engineering into builder quality. If a decision doesn't move us toward AI Builder domination, it is the wrong decision.

Craig is the boss. Craig runs a 24/7 physical business. Craig cannot monitor every commit. Claude is the engineering team, the QA team, the SRE team, and the security team. Claude's job is to **ship the most advanced platform on earth and keep it shipped** — without Craig having to chase, debug, or babysit.

## 1. THE BIBLE RULE — READ CLAUDE.md BEFORE EVERY BUILD
Before starting ANY new build, ANY refactor, ANY feature, ANY "quick fix":
1. Re-read THE IRON LAW (this section).
2. Re-read LIVE REPO STATUS below.
3. Re-read IMPORTANT DECISIONS (rules 1–36).
4. Re-read KNOWN ISSUES and RECENTLY FIXED.
5. Only then write code.

Failure to consult CLAUDE.md is the #1 cause of scattergun work. **Scattergun work is forbidden.** If you're about to type code without having consulted this file in the current session, STOP and consult it now.

## 1.5 THE AGGRESSIVE OPENING PROTOCOL — FORCING FUNCTION, NOT A VALUE

> **Craig's words (April 11): "I ask Claude what we need to do to be aggressive in our building and I don't get any of that response."**
> **Root cause: "be aggressive" is a VALUE. Values get ignored. PROCEDURES get followed.**
> **This section is the procedure. It runs at the START of every session, BEFORE the user types anything beyond "continue."**

**At the start of every session, BEFORE asking "what would you like me to do," Claude MUST run this protocol:**

### STEP 1 — Gap Analysis (2 minutes, internal)
Scan LIVE REPO STATUS and URGENT BUILD LIST. Identify:
- What is BROKEN right now that blocks revenue (Tier 0 items)
- What is INCOMPLETE that leaves revenue on the table
- What competitors shipped in the last 48 hours that we don't have
- What Craig tasks are blocking everything else

### STEP 2 — Top 5 Moves (written, user-visible)
Output a numbered list of the 5 highest-leverage moves available RIGHT NOW, in this format:
```
1. [impact] [move] — why it matters, effort estimate (S/M/L), blockers
2. ...
```
Impact labels: 🔴 blocks revenue · 🟠 closes competitive gap · 🟡 quality/polish · 🟢 infrastructure

### STEP 3 — Start on #1 Automatically
Do NOT ask "which one?" Start on move #1 immediately. If #1 is blocked by a Craig task, start on the highest unblocked item. Tell Craig what's blocking #1 in one line, then proceed.

### STEP 4 — Commit-Ready Work Only
Every session must end with something pushable. No "I researched this" sessions. No "I'll finish next time" sessions. If a move is too big for one session, pick a smaller move that actually ships.

### STEP 5 — Update CLAUDE.md Before Ending
Before ending the session, add what shipped to RECENTLY FIXED, move completed items from URGENT BUILD LIST to DONE, and write the "NEXT ACTION" line for the next session.

**Why this exists:** Claude's default mode is reactive — answer the question, wait for the next one. Fine for research assistants. Catastrophic for an engineering team building a $10M platform while the owner runs a 24/7 physical business. This protocol converts "be aggressive" from a value (ignorable) into a procedure (enforceable). Every step has a concrete deliverable. If Claude skips any step, Craig can point at the step and say "you skipped it" — which is the only way behaviour changes.

## 2. AUTHORIZATION — WHAT REQUIRES CRAIG'S EXPLICIT APPROVAL

**Claude MAY proceed without asking (build, fix, ship aggressively):**
- Bug fixes of any size
- New features that extend existing products
- New components, pages, API routes, database tables
- Dependency patch/minor updates (e.g. 14.2.3 → 14.2.9)
- Refactors that don't change architecture or public contracts
- CI/test/lint improvements
- Content, copy, SEO, documentation
- Infrastructure-as-code inside existing providers (Vercel, Neon, Cloudflare)
- Security hardening (XSS, injection, content[0] patterns, race conditions)
- Performance work
- Replacing mock/shell backends with real ones
- Anything listed in URGENT BUILD LIST below

**Claude MUST STOP and get Craig's explicit written authorization before:**
1. **Major version dependency upgrades** — Next.js major (14 → 15), React major (18 → 19), TypeScript major, Tailwind major. These break APIs.
2. **Removing or replacing the core product (AI Website Builder)** — the builder itself, its generation pipeline, its component registry, its preview surface (Sandpack), its checkout flow (including OpenSRS domain registration wired into it), or its pricing tiers. Per Rule 32, the builder is the only product Zoobicon sells; any change that breaks it or removes a piece of its end-to-end flow needs Craig's authorization.
3. **Changing the framework** (Next.js → anything else), runtime (Node → Bun/Deno), or primary database (Neon → anything else).
4. **Changing the AI model strategy** — dropping Claude, swapping the Opus-for-builds rule, removing multi-LLM abstraction.
5. **Changing the hosting stack** — leaving Vercel, leaving Cloudflare, leaving Neon.
6. **Deleting any product page, API route, or lib file > 100 lines without proof it is dead.**
7. **Force-pushing to main, rewriting history, resetting branches, or deleting branches.**
8. **Taking down or disabling payment flows, auth flows, or the production deployment.**
9. **Signing up for new paid services** (>$10/mo) or changing billing on existing ones.
10. **Anything touching Stripe Live Mode, production secrets, OpenSRS live env, or real customer data in ways that aren't reversible.**
11. **Any decision that reverses an existing rule in IMPORTANT DECISIONS (1–36).** Rules don't get flipped without Craig saying "flip it."
12. **Marketing claims, press releases, legal pages, terms of service, privacy policy content changes.**
13. **Creating a new GitHub repo, Vercel project, or domain.**
14. **Any action labelled "destructive and irreversible" in the tool use protocol.**

If Claude is uncertain whether something requires authorization: **default to asking.** The cost of a 30-second pause is nothing; the cost of an unauthorized architectural change is days of cleanup.

**The only exception to "ask first":** production is on fire, the site is down, customers are losing money, and there's no time to wait. In that case: fix, document in KNOWN ISSUES, tell Craig what happened.

## 3. AGGRESSION MANDATES — NON-NEGOTIABLE

### 3.1 Aggressive Software
- **Latest stable always.** Every session: check `package.json` age. Upgrade any dependency that is >1 major version behind stable. Old tech is a bug — treat it as one.
- **No legacy fallbacks.** When we adopt new tech, the old is DELETED, not kept "just in case." Dead code is debt. Debt compounds. Kill it.
- **No "we'll upgrade later."** Later is the graveyard of ambitious projects. Upgrade now or it never happens.
- **React/Next.js only for output.** Static HTML output is 2015 technology. We ship React components into Sandpack, full stop.
- **TypeScript everywhere.** No JS files. No `any` unless there's a one-line comment explaining why.

### 3.2 Aggressive Architecture
- **Streaming everywhere.** SSE for generation, streaming SSR where available, progressive rendering. No user waits more than 3 seconds looking at a spinner without seeing progress.
- **Edge-first.** Vercel edge runtime for anything that doesn't need Node. Cloudflare Workers for webhooks. Neon's serverless driver for DB.
- **In-browser runtimes.** Sandpack for preview. WebContainers evaluation is mandatory every quarter.
- **Fallback chains on every external call.** AI: Claude → GPT → Gemini. TTS: 4-model chain. Domain: OpenSRS → RDAP → DNS. One provider failing must never take down a feature.
- **Every backend call has a timeout.** `AbortSignal.timeout()` is mandatory on every `fetch` to a third-party service. No hanging requests.
- **Every destructive DB op is idempotent.** `ON CONFLICT DO UPDATE` with status-preserving `CASE` guards. No status regressions on webhook retries.

### 3.3 Aggressive Components
- **$100K+ agency quality or it doesn't ship.** Every component in the registry must look like a top-tier design agency built it. Animated, responsive, accessible, modern, luxurious.
- **2026/2027 patterns only.** Bento grids. Spotlight cards. Text reveal. Scroll-linked animations. Cursor-tracking effects. Infinite marquees. Gradient borders. Static 2024 components are banned.
- **118 components in the registry as of 2026-05-13** (up from 114 on 2026-04-11, was claimed at 60 in stale rows). Target: 150+ by end of Q2. Every component assembled from the registry, not generated from scratch.
- **Mobile-first, WCAG AA, SEO-optimized by default.** If a component fails on mobile, it ships broken. If it has 3:1 contrast, it fails WCAG. Neither is acceptable.

### 3.4 Aggressive Procedures
- **Every push passes CI locally first.** `node scripts/check-icons.js && npm run build` is mandatory before `git push`. No exceptions.
- **Root cause only.** No patching. Trace full code paths. Fix the cause, not the symptom. If the same bug is reported twice, Claude failed.
- **Deep audit on every "broken" report.** When Craig says "X is broken," dispatch parallel Explore agents, audit the full stack (UI + API + lib + DB + external service), then fix ALL root causes in one commit. Never one-bug-at-a-time.
- **Every UI state shows a clear message.** Blank screens are forbidden. "No results" is insufficient — say WHY (missing API key, rate limit, DB down, bad input). Every `catch` branch writes a user-visible error.
- **All fixes go to main (or the designated session branch).** No orphan feature branches. Feature branches are for NEW features only.
- **NEVER ASK — JUST BUILD** (see rule 26). The only exception is the authorization list in §2 above.

### 3.5 Aggressive Speed
- **First preview <3 seconds.** Pre-warmed Sandpack. Pre-bundled components. Warm AI models (cron pings every 5 min). If we're not faster than Bolt, we build something in parallel until we are.
- **Diff edits 2–5 seconds.** Never regenerate a whole site for a one-line change. Only touched files re-stream.
- **Full custom build <30 seconds.** Parallel planners, Opus developer, parallel enhancement phase.
- **Deploy <5 seconds.** One click. No config. No staging dance.

## 4. ANNIHILATION TARGETS — WHO WE ARE BEATING

### A. AI BUILDER COMPETITORS
| Competitor | ARR/Value | Latest (April 2026) | Our edge | ALERT |
|---|---|---|---|---|
| Lovable | $400M ARR, $6.6B | **Lovable 2.0**: Plan Mode, Prompt Queue (batch 50), Browser Testing (auto QA), expanding beyond apps into data analysis + presentations + marketing | Slot-locked composition + 118-component registry + domain registration baked into the build checkout (OpenSRS — they don't have this). | They're becoming a general-purpose AI work platform |
| Bolt.new | $40M ARR, 5M users | **Bolt V2**: Plan Mode, auto-DB creation, auto-error-fixing agent, Figma import, Team Templates, Opus 4.6. Handles 1000x larger projects. Native auth + payments + SEO + storage. | Domain bought in the same flow as the build; Crontech-backed hosting/auth/DB means we don't reinvent those layers and can pour all engineering into builder quality. | **CRITICAL: Bolt now has full-stack. Our speed must beat theirs.** |
| v0 (Vercel) | 6M devs, $3.5B+ | **v0.app**: Full agentic builder now. Auto-connects DBs, web search mid-build, multi-step planning, deploys to Vercel, syncs GitHub. No longer frontend-only. | Domain registration inside the build flow (unique). They have Vercel lock-in. | They closed the backend gap too |
| Emergent | $100M ARR, 6M signups | **MCP integration LIVE** (Notion, GitHub, Figma). Fork Feature for session continuity. Multi-LLM switching. Google Play app. | Domain-in-checkout funnel + Crontech-delegated infra. | **MCP is live. We have a stub. Ship it.** |
| **Google Stitch** ⚠️ NEW | FREE (Google Labs) | Natural language → high-fidelity UI. Infinite canvas, voice-driven design critiques, multi-screen gen (5 at once), DESIGN.md export, Figma/React/HTML export. Currently FREE. | Domain registration + deployable React (not just UI export). Stitch is UI-only, no backend, no deploy. | **HIGH THREAT: Google distribution + FREE. Monthly comparison mandatory.** |

### B. AI VIDEO COMPETITORS
| Competitor | ARR/Value/Users | What they do | Our edge | What to steal |
|---|---|---|---|---|
| **Filmora (Wondershare)** | ~$200M rev, $1.75B mkt cap, **100M users** | Desktop editor + AI Mate copilot. Sora 2 + Veo 3.1. Voice cloning w/ emotion. $50/yr. | They EDIT, we GENERATE. No API, no white-label, desktop-only. | Voice cloning emotion control, AI Mate UX, burned-in captions |
| **HeyGen** | $100M+ ARR, $500M+ | Avatar IV, LiveAvatar (real-time), 175 languages, $29-149/mo | Our pipeline 10-20x cheaper. We bundle with builder+domains+hosting. | Multi-language dubbing, avatar quality bar |
| **Hedra** ⚠️ NEW | Growing fast | **Character-3: sub-100ms real-time avatars at $0.05/min** (15x cheaper than HeyGen). Up to 10-min videos. API in private beta (Node.js SDK + REST + LiveKit). | We can USE their API as our primary avatar engine. | **CRITICAL: Evaluate replacing our SadTalker chain with Hedra Character-3. $0.05/min is game-changing.** |
| **Captions app** | 10M downloads | AI Twins (face upload → talking video). Viral TikTok. $10-70/mo. | We build AI Twins with Fish Speech + FLUX. They're mobile-only. | AI Twins feature, viral social model |
| **CapCut (ByteDance)** | 300M MAU | Free editor + **Seedance 2.0** (4 input modalities: text/image/audio/video simultaneously, phoneme-level lip-sync 8+ languages, ~$0.05/5s clip via fal.ai). | They're an editor. No spokesperson videos. No ecosystem. | **Seedance 2.0 multi-modal input. Add to our pipeline via fal.ai.** |
| **InVideo AI** | Growing fast | Sora 2 + Veo 3.1 text-to-video, $25-100/mo | We do spokesperson talking heads. They do stock compilations. | Multi-scene storyboard assembly |
| **Descript** | 6M users, $65M raised | Text-based editing (edit transcript = edit video), Underlord AI, $24-65/mo | We generate, they edit. Different product. | Text-based editing UX |
| **Runway** | $4B valuation | Gen-4 up to **60s continuous 4K**. API at $0.01/credit. Enterprise API. $12-76/mo. | We use their models via fal.ai as B-roll. | 60s 4K as our B-roll quality target |
| ~~Sora (OpenAI)~~ | **DEAD** | ~~Shutting down April 26, 2026. App dead. API dead Sept 24.~~ Burned $15M/day, made $2.1M total. Users dropped from 1M to <500K. Disney killed $150M deal. | **POSITIVE: Major competitor exits. Their users need a new home.** | Capture displaced Sora users |

### B2. AI VIDEO MODELS (what powers the pipeline)
| Model | Provider | Status April 2026 | Cost | Notes |
|---|---|---|---|---|
| **Fish Audio S1** ⚠️ | Fish Audio | **#1 on TTS-Arena2, beats ElevenLabs.** 48 emotion tags, 5 tone tags, 10 special tags. | $15/M chars (80% cheaper than ElevenLabs) | **UPGRADE PATH: Same provider we use. S1 is the new model. Switch immediately.** |
| **Hedra Character-3** ⚠️ | Hedra | Sub-100ms real-time avatars, 10-min videos, API private beta | $0.05/min (15x cheaper than alternatives) | **Evaluate as primary avatar engine** |
| **Seedance 2.0** ⚠️ | ByteDance/fal.ai | 4-modality input, phoneme lip-sync, 8+ languages | ~$0.05/5s clip | **Add to video pipeline via fal.ai** |
| **Wan 2.7** ⚠️ | Alibaba/Replicate | 1080p, 15s, native audio sync, first-and-last-frame control. Open source. **Already on Replicate.** | Free (open source) | **Add to B-roll chain immediately — it's on Replicate already** |
| **Cartesia Sonic-3** | Cartesia | 90ms TTFA (4x faster), 15s voice cloning | 1/5th ElevenLabs cost | Worth adding as low-latency TTS fallback |
| ElevenLabs v3 | ElevenLabs | 70+ languages, audio emotion tags | Premium pricing | English leader but Fish S1 now beats on quality |
| Veo 3.1 | Google/fal.ai | Best B-roll quality | $0.20-0.40/s | Our premium B-roll tier |
| Runway Gen-4 | Runway/fal.ai | 60s continuous 4K | $0.01/credit | Professional tier |
| Kling 3.0 | Kuaishou/fal.ai | Native 4K 60fps, cheapest | $0.029-0.10/s | Our budget B-roll tier |

### B3. KEY INTEL
- **Sora is DEAD (April 26, 2026).** Their displaced users are looking for alternatives. We should capture them.
- **Fish Audio S1 is now #1 TTS, beating ElevenLabs.** We already use Fish Speech. Upgrade to S1 = same provider, better model, 80% cheaper.
- **Hedra Character-3 at $0.05/min could replace our entire lip-sync chain.** Evaluate immediately.
- **Replicate acquired by Cloudflare (Nov 2025).** Our Replicate dependency is now MORE reliable, not less.
- **Seedance 2.0 + Wan 2.7 are both available via fal.ai/Replicate.** Free models we should add to our pipeline TODAY.

### C. DOMAIN/HOSTING COMPETITORS
| Competitor | ARR/Value | Our edge |
|---|---|---|
| GoDaddy/Namecheap | billions | Real-time AI domain generation + bundled builder + hosting. |

**The rule: 80–90% ahead on every axis. If we're not clearly ahead on speed, quality, or features in a monthly comparison build, fix it immediately — that week.**

## 5. THE ONE-LINE MISSION
> **Ship the most advanced, most reliable, most beautiful, most profitable white-label AI platform on earth — and never let a competitor catch up.**

Everything below this line is in service of that mission. If anything below this line contradicts this line, this line wins.

---

## 6. PROACTIVE COMPETITIVE INTELLIGENCE — MANDATORY EVERY SESSION

> **Craig's words: "Why is it not until I find it that we do something about it?"**
> **This section exists because reactive research is FAILURE. We must be proactive.**
> **If Craig finds a competitor feature before Claude does, Claude failed.**

### THE RULE: FIND IT BEFORE CRAIG DOES

Every session, BEFORE writing any code, Claude MUST run a proactive competitive scan:

1. **Web search all competitors in §4 ANNIHILATION TARGETS** — What shipped in the last 48 hours? New features? New models? New pricing? New viral moments?
2. **Web search "AI video generator 2026" + "AI website builder 2026" + "AI avatar generator 2026"** — Who's new? Who launched? Who went viral? Who raised funding?
3. **Check Product Hunt, Hacker News, TechCrunch, The Verge** — Any new AI builder or AI video tool trending?
4. **Check Replicate trending models, fal.ai new models, Hugging Face trending** — Any new model that's better than what we use?
5. **Check Twitter/X for "AI video" + "AI website builder" viral posts** — What's getting attention? What demos are blowing up?

### WHAT TO DO WITH FINDINGS

- **New competitor found:** Add to §4 ANNIHILATION TARGETS immediately. Include: name, ARR/users, what they do, our edge, what to steal.
- **Existing competitor shipped new feature:** Update their row in §4. Add to URGENT BUILD LIST if we don't have it.
- **New AI model dropped that's better than what we use:** Update the pipeline. Swap the model. Don't wait.
- **Viral demo of something we can't do:** Flag to Craig with "COMPETITIVE ALERT" and build it that session.
- **Nothing new found:** Document "Competitive scan [date]: no new threats" so we know it was checked.

### SCAN FREQUENCY

| Trigger | Action |
|---|---|
| **Every new session** | Full competitive scan before ANY code is written |
| **Before building any video feature** | Scan HeyGen, Filmora, Captions, CapCut, Runway, InVideo, Descript — what's their latest? |
| **Before building any builder feature** | Scan Lovable, Bolt, v0, Emergent — what shipped this week? |
| **Craig mentions a competitor** | IMMEDIATE deep dive. Add to kill list. Identify what to steal/beat. |
| **Craig says "I saw something on the internet"** | Claude FAILED the proactive scan. Fix the gap, update CLAUDE.md, apologize. |

### OUTPUT QUALITY BAR IS SET BY THE MARKET

The quality bar for every feature is NOT "better than yesterday." It is:
- **Video output:** Must match or beat HeyGen Avatar IV + Filmora's Sora 2/Veo 3.1 output
- **Builder output:** Must match or beat Lovable's full-stack polish + Bolt's preview speed
- **Voice:** Must match or beat ElevenLabs v3 fidelity + Filmora's emotion-controlled voice cloning
- **Captions:** Must match or beat CapCut's auto-caption quality (burned in, styled, animated)

If our output doesn't match the market leader in that category, **it is not done.** Ship it as "beta" with a clear upgrade path, or don't ship it at all.

### RESEARCH IS NOT OPTIONAL — IT IS STEP 1

The old pattern: build → Craig finds something better → scramble to match.
The new pattern: **scan → identify the bar → build to that bar → ship → scan again.**

No more "we have Fish Speech" when ElevenLabs v3 exists.
No more "we have Replicate models" when fal.ai has Veo 3.1 + Sora 2.
No more "we have auto-captions planned" when CapCut ships them free to 300M users.

**Find it. Flag it. Build it. Before Craig has to.**

---

## 🧭 SESSION PROTOCOL — EVERY NEW CLAUDE SESSION

**Mandatory opening ritual before any work:**

1. **Read THE IRON LAW** (section above). Do not skip.
2. **Read LIVE REPO STATUS** (below). Know what's built, what's broken, what's next.
3. **Run PROACTIVE COMPETITIVE SCAN** (§6 above). Web search all competitors. Log findings. Update CLAUDE.md if anything new.
4. **Check the authorization list** (§2). Is anything I'm about to do on that list? If yes → stop and ask Craig.
5. **Check KNOWN ISSUES.** Is the user's request already on the list? If yes, work from there.
6. **Check RECENTLY FIXED.** Don't re-break something that was just fixed.
7. **Run `git status` and `git log -5`.** Know where the branch is.
8. **Only then start work.**

**Mandatory closing ritual before ending a session:**

1. **Build passes locally** (`npm run build`).
2. **All changes committed and pushed** to the session branch.
3. **CLAUDE.md updated** — any new decisions, new known issues, new competitive findings, new completed tasks.
4. **Next action line written** — so the next session picks up without guessing.
5. **No half-finished features on disk.** Either finish, revert, or document clearly.
6. **Competitive scan logged** — "Scanned [date]: [findings or 'no new threats']".

## ⚖️ DECISION ESCALATION MATRIX

| Situation | Action |
|---|---|
| Bug found in existing feature | Fix it. Ship it. Log in RECENTLY FIXED. |
| Request for new feature that extends existing product | Build it. Ship it. |
| Request matches something in URGENT BUILD LIST | Build it. Ship it. Mark completed. |
| Request conflicts with an IMPORTANT DECISION rule | STOP. Ask Craig. Don't flip the rule alone. |
| Request is in the §2 authorization list | STOP. Ask Craig. |
| Production is down, customers affected, no time | Fix immediately. Document after. Tell Craig. |
| Uncertain whether authorized | Default to asking. Pause cost is zero. Wrong action cost is days. |
| Found a security vulnerability | Fix immediately, regardless of scope. Report to Craig. |
| Found an architectural flaw mid-build | Log in KNOWN ISSUES with severity. Continue current task. Surface to Craig. |

## 🚨 FORBIDDEN ACTIONS — INSTANT HALT

These are never allowed under any circumstance without Craig explicitly saying "do it":

1. `git push --force` to main
2. `git reset --hard` on shared branches
3. `rm -rf` on anything outside the current working tree
4. Committing secrets, API keys, or `.env*` files
5. Skipping hooks (`--no-verify`, `--no-gpg-sign`) when they fail
6. Dropping database tables in production
7. Deleting customer data
8. Calling Stripe Live Mode APIs in a way that creates real charges
9. Calling OpenSRS Live env to register a domain without Craig's knowledge
10. Disabling tests, CI, or lint to make a push go through
11. Adding `// @ts-ignore` or `// eslint-disable` to hide errors instead of fixing them
12. Reverting an IMPORTANT DECISION rule without written authorization
13. Taking the production site offline
14. Unsubscribing from or downgrading any paid service
15. Replying to customers or press on behalf of Zoobicon

## 📋 BEFORE EVERY COMMIT — THE CHECKLIST

```
[ ] THE IRON LAW consulted this session
[ ] Change is not on the §2 authorization list (or Craig said yes)
[ ] `node scripts/check-icons.js` passes
[ ] `npm run build` passes (470+ pages green)
[ ] No new blank screens — every error path shows a message
[ ] No new silent catches — every catch logs AND surfaces
[ ] No new `response.content[0]` patterns — use `.find(b => b.type === "text")`
[ ] No new ternary precedence bugs (`X || Y ? A : B` without parens)
[ ] No new fetch without `AbortSignal.timeout()`
[ ] No new DB upserts that regress status
[ ] Commit message explains WHY, not just WHAT
[ ] CLAUDE.md updated if a decision was made or a major task completed
```

---

> **HOW TO USE THIS FILE EVERY MORNING:**
> 1. Read THE BIBLE above — top to bottom, every single law.
> 2. Read LIVE REPO STATUS below — it tells you exactly what's built, what's broken, what's next.
> 3. Run the PRE-BUILD CHECKLIST mentally before any action.
> 4. If multi-file: spawn parallel agents in ONE message per the PARALLEL AGENT PROTOCOL.
> 5. Open a new Claude session, paste this whole file, say:
>    *"I'm working on Zoobicon. Here is my CLAUDE.md. I have read the bible. Continue from where I left off."*
> 6. Claude will know everything. No explanation needed.

---

# LIVE REPO STATUS — READ THIS FIRST
## Last updated: 2026-06-05 (V2 builder rebuild: streaming + live + edit loop) | Build: GREEN (245/245) | Scope: AI WEBSITE BUILDER ONLY (Rule 32) | Branch: claude/elegant-volta-jXSm2

**THE V2 BUILDER IS NOW THE REAL PRODUCT (3 PRs this session).** Strategic framing for "kick the competition's arse" = four pillars: (1) reliable generation ✅ registry+slot-locked, (2) fast first paint ✅, (3) live interactive output ✅, (4) conversational edit loop ✅ — full-stack via Crontech is the only pillar still open. What shipped:
- **#424 progressive streaming** — `/api/v2/build/stream` (SSE) renders the complete $100K-registry page from base components instantly (~1-2s, no AI), streamed section-by-section into the iframe, then AI-tailors each section's copy in the background and hot-swaps it via postMessage. First paint beats Bolt's 3-5s. + theme-aware **serif display headings** (Playfair) for editorial/portfolio/restaurant/professional/agency.
- **#425 live preview** — sections now **hydrate into real interactive React** mounted OVER the static render. Server does the TS+JSX compile (`compileComponentToModule`) so the browser runs NO Babel; the streaming shell carries an importmap (react/react-dom/lucide-react/framer-motion via esm.sh) + a hydration runtime that imports each section as a Blob module and `createRoot`-mounts it. **Static render is a guaranteed floor** — any failure (React won't load, esm.sh down, module won't import, component throws on mount OR in an effect) is caught by a per-section boundary that restores the captured static HTML. Hydration can only enhance, never regress. iframe gained `allow-same-origin`.
- **edit loop** — `/api/v2/edit` (this commit). User says "make the hero darker" / "update the pricing" → `routeEdit` picks the target section (deterministic keyword/synonym match first; Haiku classification fallback, ≤8 tokens, Rule 35-compliant — classification only, never edits code) → `editSection` (Sonnet) rewrites just that one section → server renders+compiles → client hot-swaps it via the existing postMessage path + updates its held source so edits stack. ~one Sonnet call, no rebuild. The client now holds each section's live source `code`+`category` (streamed in the build). Ambiguous/page-wide edits return a clear "name a section" ask instead of mangling the page.

All gates green (build 245/245, critical-code-guard clear, tsc clean on changed files, 13/13 v2 tests). **NEXT ACTION:** (a) **full-stack / Crontech pressure-test** — the biggest open pillar; verify the Crontech API can actually provision auth+DB+forms before we promise it, then wire "describe a business → working app" into V2; (b) deploy/save off the final `result.html`; (c) global/multi-section edits ("make everything use a blue accent"); (d) click-to-select a section in the preview to target edits without naming; (e) port streaming+live+edit onto the main `/builder` page once proven on `/v2`.

**NEXT ACTION:** Big reliability + quality session (2026-06-05, 7 PRs merged). **THE real preview-crash root cause is fixed** — `crypto.subtle` was used in the EscapeHatchPreview transpile cache, and `window.crypto.subtle` is unavailable in srcdoc iframes on iOS Safari, so it threw synchronously and blanked the preview on Craig's iPad *every build* (PR #412 — replaced with a synchronous FNV hash). Also shipped: 3-layer preview fault isolation (#406), URL-clone funnel on the homepage hero (#406), +4 slot-locked templates — stats/testimonials/cta/faq (#406), a **deep-audit tool** `npm run audit:code` + fixed 3 crashing API routes + removed dead code/tests (#413), a **CI hard-gate** (`scripts/critical-code-guard.js`) that blocks broken imports + the crypto footgun from ever merging again (#414), and the **closed critique→repair loop** — the slot-locked builder now regenerates sections the multi-judge panel flags, reverting if it doesn't improve (#415). **Verify on iPad:** close+reopen zoobicon.com, run a build — preview should render. **Known backlog (non-crashing):** ~75 low-severity TS warnings + 10 real test failures (llm-provider, slot-locked-assembler #each, qstash, api-bank) — run `npm run audit:code` to see them. Next: burn down that test backlog; wire the critique-repair loop onto the default react-stream path; MCP integration; Tier 0F Stripe products (Craig task).

### CRONTECH PIVOT (RULE 31) — STATUS
- §1 AUTH — DONE (1fbcb40). auth-guard.ts is a Crontech-SSO shim.
- §2 PAYMENTS — STRIPE STAYS (5060535 amendment) — direct AI Builder purchase.
- §3 EMAIL — DONE (7962fee). admin-notify, audit-middleware are stubs.
- §4 HOSTING + DEPLOY — DONE (fd128db). Cloudflare/Vercel/Supabase/WebContainers libs deleted.
- §5 CDN/EDGE — DONE with §4.
- §6 STORAGE — DONE (73eb0aa).
- §7 SMS/Discord/Slack/Push — DONE (a6d43de).
- §8 eSIM/VPN provider layer — DONE (73eb0aa). Marketing pages kept.
- §9 BOOKING — DONE (73eb0aa).
- §10-12, 14 CRM/Invoicing/Email Marketing/Contracts/Support/Analytics/Audit — DONE (e3988e1).
- §13 CRON JOBS — DONE (7e71c4e). Vercel crons array removed; HTTP endpoints survive.
- §15 BACKGROUND AGENTS — DONE (da26551). Infra agents unregistered.
- §16 PUBLIC API v1 — DONE (1fbcb40). Entire /api/v1/* surface deleted.
- §17 zoobicon.sh — DONE (7e71c4e). Removed from middleware/brand/robots/sitemap.
- UI SWEEP — DONE (6342760 + 1cff11c). Deleted ~340 files: 50 orphan top-level pages, 13 sunset product/admin pages, ~100 orphan API routes, /developers, /api-docs, /documentation, /.well-known/ai-plugin.json. Mass sed swept all dead hrefs (/auth/*, /dashboard, /hosting, /products/{esim,vpn,hosting,cloud-storage,dictation,dubbing,email-support,booking}, /email-marketing, /crm, /analytics, /booking, /invoicing, /admin/{health,email,usage,support,operations,etc.}). SiteNavigation now 4 columns (Build/Domains/Free Tools/Scale). SiteFooter Scale column rebuilt. AdminShell sidebar simplified to 5 sections. Sitemap rewritten 78 → 47 URLs. Robots disallow list simplified to /admin /api /edit.
- Pending: DB table migration plan, positioning + pricing copy refresh in ZOOBICON-SPEC.md.

### QUICK FACTS (post-Crontech sweep 2026-05-17)
- **67 pages** (was 165) | **178 API routes** (was 576) | **43 layouts** | **237 lib files** | **79 shared components** | **118 registry components**
- **45 API top-level dirs** (was 146) — only AI Builder + Video + Domains + Free Tools + admin + cron + intel + stripe + support survive
- **Pure scope (Rule 32, 2026-05-27):** **AI Website Builder. That's it.** Domain registration via OpenSRS is a feature of the builder checkout (not a product). Video retired (Rule 19). 12 Free Tools to be deleted (Rule 32 punchlist). Infra delegated to Crontech (Rule 31). One product, one input box, one CTA.
- **Framework:** Next.js 14.2 + React 18.3 + TypeScript + Tailwind CSS 3.4
- **AI:** Anthropic SDK 0.80, multi-LLM (Claude/GPT/Gemini) via `src/lib/llm-provider.ts`
- **DB:** Neon serverless Postgres via `@neondatabase/serverless`
- **Payments:** Stripe 21.0 | **Icons:** lucide-react 1.7 | **Animation:** framer-motion 12.38
- **Preview:** Sandpack in-browser React preview
- **Build command:** `npm run build` | **Dev:** `npm run dev` | **Tests:** `npm run test`
- **E2E:** `npx playwright test` (Playwright 1.56, 60+ test cases)
- **Deploy:** Vercel (iad1 region), 9 cron jobs configured

### CORE PRODUCT STATUS

| Feature | Status | Key Files | What Works | What's Missing |
|---------|--------|-----------|------------|----------------|
| **AI Website Builder** (THE PRODUCT) | WORKING | `src/app/builder/page.tsx`, `src/lib/agents.ts`, `src/app/api/generate/react-stream/route.ts` | React generation via Sandpack, streaming SSE, 118-component registry, slot-locked composition, diff editing wired | Crontech wire-up for sandbox + Stripe products for direct purchase + OpenSRS domain-buy step inside builder finalize flow |
| **Domain Registration** (FEATURE OF BUILDER, NOT A PRODUCT) | WORKING (backend) / TO-DELETE (frontend) | `src/lib/opensrs.ts`, `src/app/api/domains/*` (keep), `src/app/domains/page.tsx` (delete per Rule 32), TLD landing pages (delete) | Real OpenSRS registry checks + AI name generator API — to be wired into builder checkout | Delete `/domains` standalone page; wire domain-buy into builder finalize step |
| **Pricing** | WORKING | `src/app/pricing/page.tsx`, `src/lib/stripe.ts` | Direct AI Builder purchase via Stripe (Rule 31 amendment — Stripe stays) | Craig: create Stripe products + price IDs; copy update to describe builder tiers + included domain registrations |
| **Auth** | CRONTECH SSO | `src/lib/auth-guard.ts` (shim) | `authenticateRequest()` reads `x-crontech-token` claims, anonymous fallthrough | Crontech SSO endpoint wire-up |
| **Email** | CRONTECH | `src/lib/admin-notify.ts` (no-op stub) | Stubs return early; Crontech BLK-030 owns delivery | Crontech email ingest wire-up |
| **Hosting** | CRONTECH | — | Deleted /api/hosting/*, /api/deploy/vercel, /hosting/* | Crontech BLK-040 owns hosting |
| **Audit Logs** | CRONTECH | `src/lib/audit-middleware.ts` (no-op stub) | Stripe webhook still calls auditLog — no-op until Crontech audit ingest wired |
| ~~**AI Video Creator**~~ | RETIRED (Rule 19, 2026-05-26) | — | Pipeline, pages, API routes deleted; MCP handler returns "feature retired" | Out of scope. Only revives as a separate focused product per Rule 19. |
| ~~**12 Free Tools**~~ | TO-DELETE (Rule 32, 2026-05-27) | `src/app/tools/*/page.tsx` | All client-side, currently still on disk | Delete `src/app/tools/*` + remove from nav/footer/sitemap/robots |
| ~~**Domain Search (standalone)**~~ | TO-DELETE (Rule 32) | `src/app/domains/page.tsx` + TLD pages | Currently live, must come down | Delete standalone pages; OpenSRS lives on as builder-checkout backend only |
| **Admin Dashboard** | WORKING (internal only) | `src/app/admin/*/page.tsx` | Mobile command centre, agents view | Internal tool — not part of public product surface |

### BUILD PIPELINE
```
User Prompt → Haiku classifies intent (<1s) → Select from 100-component registry
  → Stream components via SSE (/api/generate/react-stream)
  → Sandpack renders progressively in browser
  → Full site in <30 seconds
```
**Key pipeline files:**
- `src/lib/agents.ts` (51KB) — 7-agent orchestration
- `src/lib/generator-prompts.ts` (82KB) — prompt templates
- `src/lib/scaffold-engine.ts` (49KB) — scaffold system
- `src/lib/component-registry/index.ts` — 100 components
- `src/lib/templates.ts` (108KB) — template library

### ENV VARS NEEDED (Craig must set in Vercel)
| Variable | For | Status |
|----------|-----|--------|
| ANTHROPIC_API_KEY | AI generation | SET |
| DATABASE_URL | Neon Postgres | CHECK |
| STRIPE_SECRET_KEY | Payments (kept per Rule 31 amendment) | CHECK |
| STRIPE_WEBHOOK_SECRET | Stripe webhooks | NOT SET |
| OPENSRS_API_KEY | Domain registration (revenue stream) | CHECK |
| REPLICATE_API_TOKEN | Video pipeline | ✅ SET |
| **CRONTECH_PAT** | **Project hand-off to Crontech for hosting** | **NOT SET (mocked)** |
| CRONTECH_API_BASE | Crontech API base URL (default https://api.crontech.ai) | OPTIONAL |
| **EMAIL_SEND_TOKEN** | **Crontech email service bearer token** | **NOT SET (stubbed)** |
| EMAIL_FROM | Sender address (default: Zoobicon <noreply@mail.zoobicon.com>) | NOT SET |
| CRONTECH_EMAIL_TENANT_ID | Tenant slug for Crontech email service (default: zoobicon) | OPTIONAL |
| EMAIL_SEND_WEBHOOK_SECRET | HMAC secret for /api/email-send/webhook delivery events | NOT SET |
| ADMIN_NOTIFY_EMAIL | Recipient for admin alert emails (default: admin@zoobicon.com) | NOT SET |
| FAL_KEY | Video fallback chain | NOT SET |
| ELEVENLABS_API_KEY | Voice fallback chain | NOT SET |

### WHAT TO BUILD NEXT (priority order)
1. ~~**Wire diff editing into builder UI**~~ ✅ DONE — PromptInput + ChatPanel both call `/api/generate/edit`, merge changed files, Sandpack auto-updates. Improved: smart context truncation, 16K tokens, admin auth headers.
2. **Pre-warm Sandpack for instant preview** — load Sandpack on page load before user submits prompt, pre-bundle components. Target: <3s first preview (currently ~20-30s).
3. **Fix builder streaming** — components should appear one-by-one, not all at once
4. **Deepen Supabase auto-provisioning** — match Lovable's auto-tables, auto-RLS, auto-auth. Code exists in `src/lib/supabase-provisioner.ts`
5. ~~**GitHub sync**~~ ✅ DONE — full OAuth connect, create repo, push files, sync updates, status check. Wired into builder via GitHubSyncPanel.
6. **Stripe checkout flow** — pricing page exists, needs real Stripe product IDs + webhook handler
7. **MCP integration** — foundation at `/api/mcp/route.ts`, needs real tool connections. Emergent has this.
8. **Video pipeline testing** — code exists, REPLICATE_API_TOKEN is set, needs end-to-end test
9. **Deploy polish** — one-click deploy works but needs UX improvements

### CRITICAL PATHS (file → file dependencies)
```
Builder:     src/app/builder/page.tsx → /api/generate/react-stream → src/lib/agents.ts → src/lib/llm-provider.ts
Domains:     src/app/domains/page.tsx → /api/domains/search → src/lib/opensrs.ts
Video:       src/app/video-creator/page.tsx → /api/video-creator/chat → src/lib/video-pipeline.ts
Hosting:     src/app/builder/page.tsx → /api/hosting/deploy → src/lib/db.ts
Auth:        src/app/auth/*/page.tsx → /api/auth/* → src/lib/db.ts
Payments:    src/app/pricing/page.tsx → /api/stripe/checkout → src/lib/stripe.ts
```

### DIRECTORY MAP
```
src/
  app/                    # 165 pages, 576 API routes, 87 layouts
    api/                  # All backend endpoints
      generate/           # AI generation (react, react-stream, edit, pipeline, images)
      hosting/            # Deploy, serve, DNS, SSL, CDN
      domains/            # Search, register, checkout, manage, DNS
      auth/               # Login, signup, OAuth, password reset
      stripe/             # Checkout, portal, webhook
      video-creator/      # Generate, script, voiceover, render, chat
      email/              # Send, inbox, support, marketing
      intel/              # Competitor crawling, technology tracking
      v1/                 # Public API (booking, eSIM, VPN, storage, video)
    builder/              # AI website builder — THE PRODUCT
    pricing/              # Builder subscription tiers (Starter/Pro/Agency)
    admin/                # Internal admin dashboard (not part of public product)
    auth/                 # Login, signup, OAuth (Crontech SSO shim per Rule 31)
    # DELETED per Rule 19: video-creator/
    # TO-DELETE per Rule 32: domains/ (standalone page), tools/ (12 free tools), products/ (10 product pages)
  lib/                    # 254 helper modules
    agents.ts             # 7-agent pipeline (51KB)
    llm-provider.ts       # Multi-LLM abstraction
    component-registry/   # 118 React components for assembly (all $100K+ quality, 6 next-gen)
    scaffold-engine.ts    # Instant scaffold system
    templates.ts          # Template library (108KB)
    stripe.ts             # Stripe integration
    opensrs.ts            # Domain registration
    db.ts                 # Neon database
    video-pipeline.ts     # Own video pipeline (Fish Speech + FLUX + OmniHuman)
  components/             # Shared React components
e2e/                      # Playwright E2E tests (60+ cases)
tests/                    # Vitest unit tests (7 files, 180+ cases)
.github/workflows/        # CI (ci.yml) + E2E (e2e.yml)
```

---

# PART 1 — TECHNICAL RULES
## These rules govern the codebase. Hard-won. Do not modify without care.

---

## CORE PRINCIPLE — NEWEST TECHNOLOGY, ALWAYS FIRST

**THIS OVERRIDES EVERYTHING ELSE IN THIS DOCUMENT.**

Zoobicon is an AI-built platform. There is NO excuse for using old technology. Every decision, every feature, every line of code must use the newest, most advanced technology available.

**The rules:**
1. **No old-school output** — React/Next.js components only. NOT static HTML blobs.
2. **In-browser preview** — Sandpack or WebContainers. No 60-95 second server-side waits.
3. **Intellectual crawlers** — Market Intelligence Crawler runs continuously. Competitor ships something new → we know within 12 hours → match or beat within 48 hours.
4. **First to market** — If we can't be first, we must be best. "Good enough" is not acceptable.
5. **Technology currency** — Every session: latest Next.js? Latest React? Latest models? If not, upgrade.
6. **No legacy debt** — Old code holding us back gets replaced. Not patched. Replaced.
7. **Output quality = revenue** — Every generated site must look like 2027 technology.

**Current technology targets (March 2026):**
- Output format: React/Next.js + Tailwind CSS (NOT static HTML)
- Preview: Sandpack in-browser live preview
- Framework: Next.js 15+ App Router, Server Components, Streaming
- AI Models: Claude Opus/Sonnet 4.6, GPT-4o/5, Gemini 2.5 Pro
- Runtime: Sandpack/WebContainers for in-browser execution
- Deployment: Vercel one-click from generated code
- Design system: shadcn/ui (industry standard for React)

**HARD RULE — NO OLD TECHNOLOGY KEPT AS FALLBACK:**
When we adopt new technology, the old is REMOVED. Not kept alongside. Deleted. Stale = dead.

**HARD RULE — FINISH WHAT YOU START:**
If something is started, it MUST be finished. No half-built features. No abandoned code paths. No "we'll come back to this later." Every feature, every component, every integration must be completed to production quality before moving on. If a task is too big to finish in one session, document EXACTLY where it was left off in CLAUDE.md with a "NEXT ACTION" line so the next session picks it up immediately. Unfinished code is worse than no code — it creates confusion, conflicts, and technical debt. The rule: START → FINISH → TEST → DEPLOY. No exceptions.

**The test:** If a user builds on Zoobicon then tries Lovable or Bolt, they must think "Zoobicon was BETTER." Not "about the same." BETTER. If they don't think that, we've failed.

---

## TECHNOLOGY RADAR — Check Every Session Before Building Anything

**ADOPT NOW (proven, must implement):**
- Sandpack for in-browser React preview ✅ (installed)
- shadcn/ui as component design system
- React Server Components for generation output
- Tailwind CSS v4 (if stable)
- MCP (Model Context Protocol) for tool integration
- GitHub sync for generated projects
- Vercel deployment integration

**EVALUATE (emerging, first-mover advantage):**
- WebMCP (Google, Feb 2026) — structured website interactions for AI agents
- A2A (Agent-to-Agent protocol) — multi-agent communication standard
- AG-UI (CopilotKit) — agent-to-frontend communication protocol
- Agent Memory — persistent context across sessions (NO ONE has this yet)
- Veo 3.1 API — native audio + video generation
- Kling 3.0 API — cost-effective video at scale
- Seedance 2.0 — multi-modal input

**WATCH (coming):**
- WebContainers (StackBlitz) — full Node.js in browser
- Real-time AI video editing (late 2026)
- Agent-native startups bypassing traditional software

**RULE: ADOPT list not implemented = bug, fix immediately. EVALUATE item could give advantage = research and propose. WATCH item moves to EVALUATE = flag immediately.**

## COMPETITIVE MANDATE — 80-90% MORE ADVANCED THAN COMPETITORS

**THIS IS NON-NEGOTIABLE. THIS MUST HAPPEN. OTHERWISE THERE IS NO POINT.**

Zoobicon must be 80-90% more advanced than every competitor. Not 10% better. Not "comparable." Not "different but equal." We must be so far ahead that competitors look outdated by comparison.

**How we achieve this:**

1. **React Scaffold System — Instant Assembly**
   - Pre-built React component library (Hero, Features, Pricing, Testimonials, Footer, Nav, CTA, FAQ, Stats, Gallery — 50+ components)
   - Each component is a polished, production-ready React module with TypeScript, Tailwind, and modern patterns
   - Scaffold loads in <1 second via Sandpack — user sees a complete site INSTANTLY
   - AI then streams customizations (colors, copy, images, branding) into the scaffold in real-time
   - User watches their site transform LIVE — not staring at a loading spinner
   - This is FASTER than any competitor because we're assembling, not generating from scratch

2. **Intellectual Advantage — Always Ahead**
   - Market Intelligence Crawler runs every 12 hours scanning ALL competitors
   - When a competitor ships a new feature, we know within 12 hours
   - We have 48 hours to match it and 7 days to surpass it
   - Monthly technology audit: are we on the latest everything?
   - Quarterly competitive review: where do we lead, where do we trail, what's the plan?

3. **Unique Differentiators No Competitor Has**
   - 18 autonomous AI agents (competitors have 0-5)
   - AI Video Creator with HeyGen spokesperson
   - Real domain search via OpenSRS/Tucows
   - Agency white-label platform
   - 43 specialized generators
   - Multi-domain ecosystem (.com, .ai, .io, .sh)
   - Open-source agent framework (@zoobicon/agents)

4. **Speed Targets**
   - Scaffold preview: <1 second (Sandpack loads pre-built React components)
   - AI customization: 3-10 seconds (streaming changes into scaffold)
   - Full custom generation: <30 seconds (React components, not HTML)
   - Deploy to production: <5 seconds (Vercel one-click)
   - Current competitors: Bolt 3-5s preview, Lovable 30-90s full build, v0 5-15s components
   - Our target: <1s preview, <10s customized, <30s full custom = FASTEST IN MARKET

5. **Quality Standard**
   - Every generated site must look like a $50K+ agency built it
   - Modern React patterns (hooks, composition, server components)
   - shadcn/ui design system (industry standard)
   - Tailwind CSS (no CSS-in-JS, no styled-components)
   - TypeScript throughout (type safety = fewer bugs)
   - Responsive by default (mobile-first)
   - Accessible by default (WCAG AA minimum)
   - SEO optimized by default (meta tags, structured data, semantic HTML)

**The measurement:** Every month, build the same site on Zoobicon and on Lovable/Bolt/v0. Compare speed, quality, and features. If we're not clearly ahead on at least 2 out of 3, something is wrong and must be fixed immediately.

## NEXT PRIORITY: Component Registry + Streaming Assembly Architecture

**STATUS: BUILT AND WIRED. 100 components in the registry. Streaming generation active.**

The builder now uses a 100-component registry for instant assembly (<1 second), then AI customizes via streaming SSE.

**The new architecture:**

```
User Prompt
  ↓
AI selects components from registry (Haiku, <2 seconds)
  ↓
Each component streamed to Sandpack as it's customized
  ↓
User sees site building itself live (navbar → hero → features → ...)
  ↓
Total: <30 seconds for a complete, polished site
```

**Component Registry (50+ polished React components):**
- NOT full website templates — individual section components
- Each component is production-ready, beautiful, responsive
- Categories: navbars (5), heroes (5), features (5), testimonials (3), pricing (3), stats (3), FAQ (2), CTAs (3), footers (3), about (3), contact (2), galleries (2), etc.
- Stored as TypeScript string templates in src/lib/component-registry/
- AI SELECTS which components to use, then CUSTOMIZES content only
- Like shadcn/ui but for complete page sections

**Streaming Assembly:**
- SSE stream from /api/generate/react-stream
- Each component sent as a separate SSE event
- Sandpack renders incrementally — site builds in front of the user
- First component visible in <3 seconds
- Full site in <30 seconds

**Why this is better than snapshots:**
- Infinite combinations (100+ components × N arrangements)
- AI chooses the best component for each section
- Customization is per-component (fast) not per-site (slow)
- New components can be added without rebuilding templates
- Quality is consistent because each component is hand-polished

**Component count target: 100+ (NOT 50)**
The owner's words: "If it means creating 100+ then that's what we need to do."
We're going to take customers from the competition. We need to back what we say.

**Component breakdown (100+ total):**
- Navbars: 8 variants (transparent, dark, centered, mega, sticky, minimal, colored, glass)
- Heroes: 10 variants (split, centered, video, gradient, image, animated, minimal, dark, dashboard, stats)
- Features: 8 variants (icon grid, alternating, cards, tabs, bento, timeline, comparison, numbered)
- Testimonials: 6 variants (cards, quote, carousel, video, logos, metrics)
- Pricing: 5 variants (3-tier, 2-tier, toggle, enterprise, comparison)
- Stats: 4 variants (gradient, cards, counters, strip)
- FAQ: 3 variants (accordion, two-column, search)
- CTA: 6 variants (gradient, split, banner, floating, newsletter, app download)
- Footer: 5 variants (4-column, minimal, mega, centered, dark)
- About: 5 variants (split, team, timeline, mission, founder)
- Contact: 4 variants (form+map, simple, split, chat)
- Gallery: 4 variants (masonry, grid, carousel, lightbox)
- Blog: 4 variants (grid, featured, minimal, magazine)
- E-commerce: 6 variants (products, featured, cart, categories, deals, reviews)
- Forms: 4 variants (signup, waitlist, multi-step, survey)
- Misc: 8 variants (logos, comparison, process, integrations, dashboard, screenshots, video, countdown)

**Implementation files:**
- src/lib/component-registry/index.ts — Registry + selection + assembly logic
- src/lib/component-registry/navbars.ts — All navbar variants
- src/lib/component-registry/heroes.ts — All hero variants
- src/lib/component-registry/features.ts — All feature variants
- src/lib/component-registry/testimonials.ts — All testimonial variants
- src/lib/component-registry/pricing.ts — All pricing variants
- src/lib/component-registry/footers.ts — All footer variants
- src/lib/component-registry/extras.ts — Stats, FAQ, CTA, About, Contact, Gallery, Blog, etc.
- src/app/api/generate/react-stream/route.ts — Streaming SSE endpoint
- Update builder to use streaming assembly instead of single JSON call

## TECHNOLOGY RADAR — What Claude Must Research Every Session

**Before building ANYTHING, Claude must check: is there a newer/better way to do this?**

## COMPETITIVE MANDATE — 80-90% MORE ADVANCED THAN COMPETITORS

**Non-negotiable. Otherwise there is no point.**

**Speed targets:**
- Scaffold preview: <1 second (Sandpack pre-built React components)
- AI customization: 3-10 seconds (streaming changes into scaffold)
- Full custom generation: <30 seconds (React components, not HTML)
- Deploy to production: <5 seconds (Vercel one-click)

**Quality standard:**
- Every generated site = $50K+ agency quality
- Modern React patterns (hooks, composition, server components)
- shadcn/ui design system
- Tailwind CSS only (no CSS-in-JS, no styled-components)
- TypeScript throughout
- Responsive mobile-first
- WCAG AA accessible
- SEO optimized by default

**Monthly measurement:** Build same site on Zoobicon vs Lovable/Bolt/v0. Must be clearly ahead on speed, quality, and features. If not — fix immediately.

---

## WHAT IS THIS PROJECT?

Zoobicon is a **white-label AI website builder platform** built with Next.js 14, React 18, TypeScript, and Tailwind CSS. Multi-LLM pipeline (Claude, GPT, Gemini) with 7-agent build pipeline. Supports multiple brands from single codebase via `src/lib/brand-config.ts`.

### Brands / Domains
- **Zoobicon only**: zoobicon.com, zoobicon.ai, zoobicon.sh, zoobicon.io, zoobicon.app
- **Dominat8 is a separate codebase** — separate GitHub repo, separate Vercel, separate Supabase. See DOMINAT8_CLAUDE.md.

## Tech Stack

- **Framework**: Next.js 14 (App Router) with React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS custom properties (no styled-jsx, no CSS modules)
- **AI**: Multi-LLM — Anthropic Claude, OpenAI GPT, Google Gemini via `src/lib/llm-provider.ts`
- **Database**: Neon (serverless Postgres) via `@neondatabase/serverless`
- **Payments**: Stripe
- **Icons**: lucide-react (tree-shaken)
- **Animations**: framer-motion

## Build & Run

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
```

`ignoreBuildErrors: true` and `ignoreDuringBuilds: true` in next.config.js — intentional for rapid iteration.

## Architecture

### AI Generation Pipeline (src/lib/agents.ts)
7-agent multi-phase pipeline, ~95s total (within Vercel 300s limit):

- **Phase 1 — Strategy (~4s):** Strategist Agent (Haiku) → JSON strategy
- **Phase 2 — Planning (~6s, parallel):** Brand Designer + Copywriter + Architect (all Haiku)
- **Phase 3 — Build (~70s):** Developer (Opus) → complete HTML ~32K tokens. **Opus is non-negotiable.**
- **Phase 4 — Enhancement (~15s, parallel):** SEO Agent + Animation Agent (both Sonnet)

### Generation Endpoints (src/app/api/generate/)

| Route | Model | What It Does |
|-------|-------|-------------|
| `/api/generate` POST | Opus | Non-streaming single-page build with retry |
| `/api/generate/stream` POST | Opus | Streaming build, cross-provider failover |
| `/api/generate/pipeline` POST | Pipeline | Direct 7-agent pipeline |
| `/api/generate/multipage` POST | Sonnet | 3-6 page sites |
| `/api/generate/fullstack` POST | Sonnet | DB schema + API routes + frontend |
| `/api/generate/variants` POST | Sonnet | 2-3 design variants |
| `/api/generate/email` POST | Sonnet | Email template generation |
| `/api/generate/quick` POST | Haiku | Lightweight fast generation |
| `/api/generate/react` POST | Sonnet | React/TypeScript — outputs JSON `{ files, dependencies }` for Sandpack |
| `/api/generate/images` POST | — | AI image generation |

### Hosting & Deployment (src/app/api/hosting/)

| Route | What It Does |
|-------|-------------|
| `POST /api/hosting/deploy` | Deploy → DB record → returns `https://[slug].zoobicon.sh` |
| `GET /api/hosting/serve/[slug]` | Serves live HTML from DB |
| `GET/PUT /api/hosting/sites/[siteId]/code` | Fetch/update code + versions |
| `/api/hosting/dns` | DNS management (needs Cloudflare integration) |
| `/api/hosting/ssl` | SSL provisioning (needs Cloudflare integration) |

### Key Library Files (src/lib/)
- `agents.ts` — 7-agent pipeline
- `llm-provider.ts` — Multi-LLM abstraction
- `component-library.ts` — CSS design system injected into every generated site
- `brand-config.ts` — White-label brand system
- `db.ts` — Neon database connection
- `cloudflare.ts` — Cloudflare API integration
- `intel-crawler.ts` — Competitor analysis engine
- `email-template.ts` — Shared email template (always includes 4-domain footer)

---

## IMPORTANT DECISIONS — DO NOT REVERT

1. **No styled-jsx** — Removed. Use Tailwind only. Adding back causes build errors.
2. **No duplicate Next config** — Only `next.config.js`. Never create a second.
3. **ESLint/TS ignored in builds** — Intentional. Lint separately.
4. **Model routing — Sonnet for component generation, Opus for pipeline** — The react-stream component customiser uses `claude-sonnet-4-6` (confirmed by Craig 2026-05-28: "Sonnet is better coding"). Sonnet 4.6 outperforms Opus on structured code generation tasks and is 5x cheaper. Opus-4-7 remains canonical for the 7-agent pipeline (agents.ts, Developer phase) where reasoning depth matters more than code precision.
5. **Multi-LLM** — Three providers: `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `OPENAI_API_KEY`.
6. **Component library injection — MANDATORY** — Every generated site gets it. Without it buttons are invisible. Do not remove.
7. **Email is Mailgun-only — NO Google Workspace** — One service, one API key. No exceptions.
8. **WordPress Export is export-only** — Do not invest further in WordPress plugin. Focus on zoobicon.sh hosting.
9. **NEVER commit secrets or API keys — ZERO TOLERANCE** — Previous Mailgun leak caused two-week shutdown. If accidentally staged: `git reset HEAD <file>` immediately. If committed: rotate key + force-push.
10. **Admin panel backgrounds** — Use `bg-[#131520]` or `bg-gray-900`. Do not revert to ultra-dark.
11. **Four-Domain Signature — MANDATORY on all external communications** — Every email, footer, external reply must show: `zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh`
12. **Video Creator — STRICT honesty** — Never show dev-facing messages to users. Unbuilt features say "Coming Soon." Never fake "Launch Now."
13. **Generated website quality — PREMIUM OR NOTHING** — Every site must look like $20K+ agency built it. Failing this standard = broken product.
14. **Mediocre is failure** — If a feature isn't built yet, "Coming Soon" with waitlist. Never "Launch Now" for unbuilt features.
15. **React/Next.js Generation** — "React App" mode uses Sandpack. HTML mode is default and unchanged.
16. **Auth-aware navbars** — Read `localStorage("zoobicon_user")`. Do not revert to hardcoded "Sign in."
17. **Sonnet for component generation, Opus for 7-agent pipeline** — react-stream uses Sonnet 4.6 for component customisation (better structured code, 5x cheaper). The 7-agent pipeline (agents.ts) retains Opus-4-7 for the Developer phase. Pipeline v3 fits ~95s within Vercel 300s limit via parallelizing planners.
18. **Public API v1** — `/api/v1/*` uses stateless HMAC-SHA256 keys (`zbk_live_*`). Do not change auth scheme without updating all v1 routes.
19. **~~AI Video Pipeline — OWN STACK, NO HEYGEN~~ RETIRED 2026-05-26.** Craig: *"Cut it out"* — quality bar (HeyGen-grade) wasn't reachable as a side feature, competitors (Lovable/Bolt/v0) ship without video and win anyway, and craig's own testing confirmed output quality was rubbish. Decision: AI Video Creator is **not a launch product**. All video pages, API routes (`/api/video-creator/*`, `/api/generate/launch-video`, `/api/generate/from-image`, `/api/video/*`), lib files (`src/lib/video-*.ts`, `launch-video-script.ts`), and the dependent UI (LaunchVideoPolaroid, AutoplayVideo, VideoSeriesPanel, SocialPublishPanel) deleted in commit cut-video-2026-05-26. The `zoobicon.generate_video` and `zoobicon.generate_voiceover` MCP tools remain registered but handler returns "feature retired" so the MCP catalog change is reversible. Marketing surface (homepage hero, nav, pricing tiers, comparison-data, llms.txt, sitemap, layout.tsx JSON-LD, support chat scope, founder's note) all updated to drop video as a product. The Zoobicon launch scope is now **AI Website Builder + Domain Search + 12 Free Tools**. If video comes back later, it ships as a separate focused product (its own URL, its own pricing) — not bolted onto the builder.
20. **Video Creator — Chat-based flow ONLY** — The video creator at `/video-creator` uses a conversational chat interface. User describes what they want → Claude writes scripts → user approves → video generates. NO storyboard editor, NO font pickers, NO platform selectors. Simple. The old storyboard page lives at `/video-creator/storyboard` and is NOT the default.
21. **No flip-flopping on architecture decisions** — Once a decision is locked in CLAUDE.md, it stays. Don't switch between HeyGen and Replicate. Don't switch between scaffold templates and AI generation. Pick ONE path, commit, ship.
22. **Speed is non-negotiable** — If we can't be the fastest with what's currently available, we BUILD something in parallel to make sure we ARE the fastest. No excuses. No "it takes time." Build a faster path or optimise until we lead.
23. **Backend + Frontend built together** — Every generated app includes a working backend from day one. No frontend-only sites. Auth, database, storage, email — all auto-provisioned. This is what Lovable does. We do it better.
24. **Models stay warm** — Cron job pings Replicate models every 5 minutes. No cold starts. First request hits a warm model. Cost ~$0.50/day is worth saving 60 seconds per customer request.
25. **No timelines, no phases** — Don't say "this week" or "next month." Build everything NOW. The competition doesn't take breaks and neither do we. Foot on the accelerator at all times.
26. **Never ask permission to build** — Craig is running multiple 24/7 businesses. He is NOT the bottleneck. Claude builds, pushes, and keeps going. If something needs building, BUILD IT. Don't ask "should I?" or "want me to?" — just do it. The only time to ask is if a decision could break something already working in production.
27. **Never take your foot off the gas** — Build until the project is complete. No pausing, no waiting, no "I'll do this next session." Every session picks up where the last one left off and keeps building.
28. **Proactive competitive intelligence is MANDATORY** — Every session starts with a web search of all competitors before writing any code. If Craig finds a competitor or feature before Claude does, Claude failed. The output quality bar is set by the market leader in each category, not by what we had yesterday. Reactive research is failure. Proactive research is survival. See §6 for the full protocol.
29. **⚠️ SUPERSEDED 2026-06-09 BY RULE 37 — THE EDITORIAL-LIGHT STANDARD (reversed 2026-05-04 — was Filmora dark)** — *Craig explicitly overrode this rule on 2026-06-09: "you don't need to worry about Rule 29 I override that I want something better i'm sick of looking at that broken site that hasn't worked in months." The gold/cream editorial-light look is no longer the site's primary direction — see Rule 37 (ZOOBICON BOLD). The `--paper`/`--ink`/`--gold` tokens and the override layer at the bottom of `globals.css` stay in place ONLY so legacy/un-migrated pages keep rendering coherently while they're moved onto the new `--zb-*` system page-by-page.* Original (now historical) directive: *"take a look at holdenmercer.com beautiful design i would like this for zoobicon which is to dark — please change no more dark."* The reference is **holdenmercer.com** — warm bone background (`#fafaf7`), elevated cream surfaces (`#f4f3ed`), near-black text (`#0a0a0b`), warm hairline borders (`#e8e6dc`), a single deep champagne accent (`#c9a961`), display headlines set in **Playfair Display** italic (we keep Fraunces as a fallback), body in **Inter**, monospace in **JetBrains Mono**. Editorial / private-bank / Sotheby's vibe — generous whitespace, hairline rules, restrained shadows, subtle gold accents. CSS tokens live at the top of `src/app/globals.css` as `--paper` / `--paper-elevated` / `--ink` / `--ink-secondary` / `--ink-muted` / `--rule` / `--gold` / `--gold-deep` and a sweeping override layer at the bottom of that file flips every legacy `bg-[#0b1530]` / `text-white/X` / `border-white/[0.0X]` reference to the new palette so unmigrated pages still ship coherent. **No dark surfaces. No midnight blue. No champagne-on-black panels.** Buttons fill with `var(--ink)` on `var(--paper)` (or outline). Cards are `var(--paper-elevated)` with a 1px `var(--rule)` border. **Every single page on zoobicon.com** — homepage, builder, video-creator, pricing, domains, tools, auth, products, admin-public-facing, every SEO page, every blog, every legal page — must clear this bar. The previous Filmora dark direction is retired and must not be reintroduced. This rule is the floor — it cannot be lowered without Craig's explicit written override.

30. **THE STRATEGY DOCS ARE THE CONTRACT — NO PER-COMMIT CONFIRMATION** (added 2026-05-13). Craig's words: *"How do we get you to continuously build without stopping and asking for permission — that's dumb, we know what we have to do, we've got a game plan."* The three strategy docs at the repo root — `KILLER-MOVES.md` (20 platform-wide moves), `KILLER-MOVES-BUILDER.md` (20 builder-specific moves B1-B20), and `INNOVATIONS.md` (six original architectural ideas) — are pre-authorized work. **Claude executes moves in order without per-commit confirmation.** AskUserQuestion is reserved for: (a) items on the §2 authorization list, (b) genuine ambiguity that re-reading CLAUDE.md doesn't resolve, (c) destructive irreversible actions, (d) feedback on user-facing UX where Craig's taste is the only acceptable arbiter (palette choices, copy tone). Asking "should I start B1?" / "want me to also do X?" / "ready for me to commit?" / offering 4-option choice menus on locked moves is a Rule 26 violation AND a Rule 30 violation. The procedural form (not a value): every commit cites a move from the locked list in the message. If a piece of work doesn't map to a move, either it shouldn't ship, or the move list needs to be updated FIRST, then the work proceeds. Brief status updates between commits are encouraged; permission requests are not.

31. **SCOPE-TIGHTENING TO AI BUILDER + AI VIDEO ONLY — INFRA DELEGATED TO CRONTECH** (added 2026-05-17, amended 2026-05-17, scope narrowed further by Rule 32 on 2026-05-27). Craig pasted a 600-line `ZOOBICON-REMOVE-LIST.md` directive. Zoobicon becomes a pure AI Builder + AI Video Creator. Every piece of infrastructure (auth, hosting, DB-for-customer-sites, email, CDN, storage, custom domains, SMS, cron, rate limiting, analytics, audit logs, support inbox) is delegated to Crontech via its public API. The complete spec is locked in `ZOOBICON-REMOVE-LIST.md` at the repo root — that doc is the authoritative migration plan and supersedes prior assumptions that Zoobicon owns these layers. **This supersedes Rule 7** (email is no longer Mailgun-only; email becomes Crontech-only via the Crontech BLK-030 endpoint, which is itself Mailgun-shape compatible so SDK code is unchanged). It also supersedes implicit assumptions in earlier rules that Zoobicon owns Vercel hosting for customer sites (still owns Vercel for the Zoobicon app itself), Cloudflare DNS/SSL for `*.zoobicon.sh` (zoobicon.sh sunsets — customer sites move to `<username>.crontech.app`). **STRIPE STAYS IN ZOOBICON** — Craig's amendment 2026-05-17: *"Sorry Stripe we need to keep because people still need to purchase the AI builder section from us."* Subscription tier purchases (Starter $49 / Pro $129 / Agency $299) + domain checkout + video credit packs all continue to bill via Stripe directly. Only Stripe Connect for agency reseller payouts ($499 white-label tier) routes through Crontech unified billing. §2 of the remove list is amended accordingly. **DELETION GATE: no module/route/table/env var on the remove list is actually deleted until the corresponding Crontech endpoint is verified live in production via the checklist at the top of `ZOOBICON-REMOVE-LIST.md`.** Partial migration is OK. Half-migration with broken Zoobicon is not. The remove list explicitly defines a 4-tier deletion order (Tier A = trivial swaps, Tier B = flagged migrations with 7-day soak, Tier C = money/auth never-deletes-same-day, Tier D = product sunsets needing customer notice). Architectural innovations (Slot-Locked Composition, Predictive Pre-Generation, Component-Graph, Hot-Swap Live Upgrades, Multi-Judge Critique, Build-Output Caching) all stay in Zoobicon — they are Zoobicon's moat and don't touch infrastructure. Revenue-generating bits stay: Stripe direct purchases (KEEP), OpenSRS domain registration (KEEP), `registered_domains` table (KEEP), agency white-label tier (KEEP).

32. **SCOPE LOCK — AI WEBSITE BUILDER ONLY** (added 2026-05-27, amended by Rule 33 on 2026-05-30). Craig's words: *"I think we should just be at AI Builder now."* Third and final narrowing. Rule 19 (2026-05-26) retired AI Video. Rule 31 (2026-05-17) delegated infra to Crontech. **This rule retires Domain Search as a standalone product and the 12 Free Tools as marketed products.** Zoobicon sells ONE thing: the AI Website Builder. Homepage says "AI Website Builder." Nav has one product item. Pricing page sells one product (Starter / Pro / Agency tiers all gated to builder usage + included domain registrations). Domain registration via OpenSRS **survives as a backend integration wired into the builder checkout** — when a user generates a site, they buy the matching domain in the same flow. There is no `/domains` standalone page, no `/tools/*` SEO pages, no "products" nav menu, no marketing copy implying we sell anything but the builder. **Deletion punchlist for next session:** (a) delete `src/app/domains/page.tsx` and the TLD landing pages, (b) delete `src/app/tools/*` (all 12 free tools), (c) remove `/domains` and `/tools/*` from nav/footer/sitemap/robots, (d) **KEEP** `src/lib/opensrs.ts` + `src/app/api/domains/*` API routes (used by the builder checkout), (e) wire the domain-buy step into the builder finalize flow, (f) rewrite homepage hero copy to "AI Website Builder. Describe it. Ship it." with one input box and one CTA, (g) update pricing copy so the three tiers describe builder usage + included domain registrations. **This supersedes Rule 19's launch scope** ("AI Website Builder + Domain Search + 12 Free Tools" → just AI Website Builder) and **supersedes Rule 31's pure-scope line** ("AI Builder + AI Video Creator" → just AI Builder; video stays retired per Rule 19). The Emergent/Lovable lesson: one product, one input box, one CTA. Confused visitors don't pay. The architectural moats (slot-locked composition, predictive pre-gen, component-graph, hot-swap live upgrades, multi-judge critique, build-output caching) all stay — they were never products, they're how the builder wins. Revenue lines that stay (because they're attached to the builder, not separate products): domain registration via OpenSRS in the builder checkout, Stripe direct purchase of builder tiers, agency white-label tier ($499/mo).

33. **AI BUILDER ONLY — ALL INFRASTRUCTURE VIA CRONTECH API (no Zoobicon-owned domain checkout)** (added 2026-05-30, amended by Rule 34 on 2026-05-30). Craig's words: *"we need to remove the hosting and the domain search and stuff. It just needs to be an AI builder. It's going to be sitting on top of Crontech via API. So that platform will have all the resources we need. That's the whole point."* **This amends Rule 32 — the "domain registration via OpenSRS survives as a backend integration wired into the builder checkout" carve-out is RETIRED.** Zoobicon now genuinely has zero infrastructure ownership: no Zoobicon-owned domain checkout UI, no Zoobicon-owned hosting deploy UI, no `/admin/domains` registry list. When a Zoobicon-built site needs a custom domain, Crontech's project provisioning API handles it. Builder pricing tiers (Starter $49 / Pro $129 / Agency $299) stay — the tier names are quotas on Zoobicon builds, and any included custom-domain count is fulfilled via the Crontech API call that provisions the project. **Removals shipped in this session:** (a) `DomainHookModal` trigger removed from `src/app/builder/page.tsx` finalize flow, (b) `src/components/DomainHookModal.tsx` deleted, (c) `src/app/admin/domains/page.tsx` deleted along with `/api/admin/domains` UI surface, (d) "Domains" link removed from `/admin` + `/admin/mobile` Quick Actions, (e) SEO `/compare/[competitor]` pages updated — "Domain registration in checkout" feature rows flipped to "Crontech-provisioned custom domain" (still our edge — most competitors don't bundle hosting/domain provisioning into a single platform either), (f) homepage + footer + pricing copy updated to drop direct-purchase domain language. **Kept (for now):** `src/lib/opensrs.ts` and `/api/domains/*` API routes — they're a no-UI backend integration layer that Crontech (or a future direct integration) could call into. Stale and deletable later if confirmed unused; not worth ripping out same-session given they have zero surface today. **Why this matters:** the Rule 32 doctrine still implied Zoobicon owned a piece of the domain commerce flow (OpenSRS + Stripe). In practice that flow was never going to be best-in-class against ICANN registrars and would always be a maintenance tax. By collapsing entirely onto Crontech's API, every Zoobicon engineering hour goes into builder quality — the actual moat. Per Rule 0A the doctrine adapts to reality: Crontech is the platform; Zoobicon is the AI Builder shipped on top of it.

35. **SONNET IS THE ONLY GENERATION MODEL — HAIKU IS BANNED FROM SITE BUILDING** (added 2026-05-31). Craig's words: *"I've never asked for Haiku."* Haiku (`claude-haiku-4-5`) must NEVER be used in any API route that generates, customises, or edits a user's website components. The only permitted models for site generation are `claude-sonnet-4-6` (component customisation, slot fills, edits — all generation routes) and `claude-opus-4-7` (7-agent pipeline Developer phase only, when user explicitly selects "Full" pipeline mode). Haiku remains permitted ONLY for: (a) intent classification pre-flight calls (≤50 token outputs), (b) the HN flywheel comment extraction (internal cron, not user-facing), (c) health/ping checks. Any PR that introduces `claude-haiku` into a generation route is a Rule 35 violation and must be blocked. The root cause of this rule: a field-name mismatch (`body.tier` vs `body.mode`) silently defaulted every build to Haiku for an unknown period. Fixed in PR #402 by hardcoding `mode = "premium"` in react-stream and swapping slot-stream to Sonnet. Do not reintroduce conditional model selection based on a "tier" or "standard/premium" toggle — Sonnet runs for everyone, always.

36. **ADVANCED FUNNELS + CRONTECH CATALOG INSIDE ZOOBICON** (added 2026-05-30). Craig's words: *"what happens if there isn't existing company that's wanting to upgrade their website and they don't know anything all they've got is a URL — why can't we use the URL and make an advanced copy of their website... we need to explore all the advanced avenues we can where it comes to AI website building because there's so many ways we could be clipping the ticket."* Plus follow-up: *"once Zoobicon is connected via API the Customer can go shopping and add anything that they want from the Crontech website."* **Two strategic moves locked in:** (1) **URL clone-and-upgrade onboarding** — `/upgrade` route ships in this session. Visitor pastes their existing site URL → Zoobicon fetches public HTML → extracts brand colors, fonts, headings, sections, tech stack, plus an "improvements we'll make" list → composes a rich prompt for the existing react-stream pipeline → "Build the modernized version" CTA prefills the builder. Architecture: `src/lib/seo/url-extractor.ts` (regex-based extraction — no cheerio dep, edge-friendly), `/api/upgrade/analyze` (POST URL → returns extraction + composed prompt + builderHref), `/upgrade/page.tsx` (UI). Honest reporting: we tell the user exactly what we found (and what we missed on SPA-heavy sites). Brand-preserving regeneration: their colors + fonts + section names feed forward into the new build. **Future onboarding funnels still to ship** — screenshot upload → site, LinkedIn URL → portfolio, email signature → microsite, "domain available" landing → build for it, competitor monitor → diff-and-rebuild, AI site audit → improvements list. Each gives a different high-intent entry point with the same downstream pipeline. (2) **Crontech catalog inside Zoobicon (in-app marketplace)** — once a Zoobicon-built site is connected via API to Crontech, the customer browses Crontech's add-on catalog from inside the Zoobicon dashboard: extra custom domains, hosting tier upgrades, premium SSL, dedicated CDN, more email mailboxes, etc. The catalog is rendered from Crontech's API; checkout routes through Zoobicon's UI (Stripe billing); provisioning happens via Crontech's API on success. Customer never leaves zoobicon.com. **Both platforms stay their own brand** — this is API integration, not white-label, not redirect, not embed. **Each add-on clips the ticket** — Zoobicon takes a margin on every Crontech upsell. Not built in this session; doctrine locked, surface to construct: `/dashboard/marketplace` route + `/api/crontech/catalog` proxy + Stripe checkout wrapping Crontech provisioning calls. **Why this matters:** the URL upgrade funnel converts visitors who otherwise wouldn't have started (no idea what to type in a blank prompt). The in-app catalog converts the second sale — and the third, and the fourth — without giving up the user to Crontech's brand. Combined, they turn Zoobicon from "AI website builder" into "the AI front door to Crontech infrastructure," which is the actual business model.

37. **ZOOBICON BOLD — THE WEBSITE IS THE SALES DRIVER (overrides Rule 29)** (added 2026-06-09). Craig's words: *"how do we make zoobicon look like [klaviyo.com] ... we should be able to make something even better than this. This is what sell. We don't have to stick with the gold, you don't need to worry about Rule 29 I override that. I want something better, I'm sick of looking at that broken site that hasn't worked in months ... we want to sell this product and we need the website to be the driver."* The reference Craig admired is **klaviyo.com** (bold, confident, high-contrast — bright warm-white canvas + near-black statement sections + one saturated accent + big bold display type). The mandate is **not to copy Klaviyo but to beat it.** **The locked direction — ZOOBICON BOLD:** (a) **Palette** — a bright warm-white canvas `--zb-bg #faf9f5`, near-black statement sections `--zb-ink #0b0b0d`, and ONE electric-lime signature accent `--zb-accent #d4f24e` (with `--zb-accent-ink #161d05` for legible text on lime). No gold lock, no Playfair, no champagne. The accent is used as: marker-highlight on display words over light (`.zb-mark`), lime text/glow over dark, and lime fills on CTAs. (b) **Type** — bold display in **Plus Jakarta Sans 800** (already loaded in `layout.tsx`), tight `-0.04em` tracking, via `.zb-display`. Body stays Inter. (c) **Rhythm** — alternate bright content sections with near-black statement bands for confident contrast (the Klaviyo punch). (d) **Tokens + classes** live at the TOP of `globals.css` under the `--zb-*` namespace and `.zb-*` classes, deliberately separate from the legacy `--paper`/`--ink`/`--gold` system so the old editorial-light override layer at the bottom of the file can never repaint them. **Shipped this session (homepage as proof-of-concept):** new `--zb-*` design system in `globals.css`; rewrote `src/components/HeroBuilder.tsx` as a near-black statement hero (lime accent, big Jakarta headline) whose primary CTA **routes reliably to `/builder`** instead of running the inline SSE stream that has been failing for months — reliability over theatre, because the homepage's job is to convert; rewrote `src/app/page.tsx` with the bright/dark section rhythm (feature bento, dark how-it-works, founder's note, pricing, dark final CTA). **Still to migrate (next sessions, page-by-page onto `--zb-*`):** the builder UI, pricing page, `/upgrade`, auth, SEO/compare pages, nav + footer. Each migration replaces `text-white`/`--gold`/`--paper` usage with the `--zb-*` system and removes reliance on the override layer; when the last page is migrated, the override layer and legacy tokens can be deleted. **This is the floor, not the ceiling (Rule 0A):** the bar is "more premium and higher-converting than klaviyo.com," re-evaluated as competitors ship. Only Craig reverses this (same authority that set it).

---

## MANDATORY SESSION PROTOCOL — CLAUDE IS THE ENGINEERING TEAM

The platform owner is NOT a developer. Claude is responsible for finding problems BEFORE the owner discovers them.

**The owner should NEVER have to:**
- Debug code themselves
- Discover engineering gaps manually
- Ask "why doesn't this work?"
- Be told about a problem without a solution attached

### Rule 0: FULL DEPTH AUDIT when something broken — not surface fixes
Trace FULL code path. Check every variable. Run code mentally. Check cascading failures. Never fix symptoms. If owner reports same feature broken TWICE, Claude failed.

### Rule 1: Pre-task checks
Dependency audit → build check → lint check → route integrity → import verification.

### Rule 2: AUTO-REPAIR — fix bugs on contact
No "that's outside scope." No "separate session." Fix it now or document in Known Issues with exact steps.

### Rule 3: PROACTIVE RESEARCH before any significant feature
Check if library exists. Check competitor implementations. Check newer APIs. Check bundle impact. Note what you checked and why you chose your approach.

### Rule 4: ENGINEERING GAP DETECTION
Feature in UI but no backend = gap. API returns mock data without saying so = gap. Button promises something code can't deliver = gap. Fix or document.

### Rule 5: TECHNOLOGY CURRENCY
Every session be aware of stack's age. Only upgrade for: security fix, meaningful performance improvement, needed feature, or approaching end-of-life.

### Rule 6: EXPLAIN LIKE I'M NOT A DEVELOPER
Plain English always. Never "I refactored the middleware." Say "I fixed the permissions system so it handles edge cases it was missing." Lead with impact to the user.

### Rule 7: BOY SCOUT RULE — leave code better than you found it

### Rule 8: VERIFY after changes — build must pass, routes must respond, components must render

### Rule 9: UPDATE THIS CLAUDE.md for every significant change

### Rule 10: MAINTAIN KNOWN ISSUES LOG below

---

## COMPETITIVE POSITION (April 2026) — VERIFIED DATA

| Competitor | Strength | Valuation | ARR | Users | Pricing |
|---|---|---|---|---|---|
| **Lovable** | Full-stack React + deep Supabase auto-provisioning | **$6.6B** (Series B, Dec 2025, $330M raised) | **$400M+** (Feb 2026) | Millions | $20-100/mo |
| **Bolt.new** | WebContainers in-browser runtime, multi-model (Claude/GPT/Gemini) | **$700M** (Series B, Jan 2025, $105.5M raised) | **$40M** (Mar 2025) | 5M+ | $0-20/mo |
| **Emergent** | Multi-agent (Builder/Quality/Deploy/Ops), MCP integration | Unknown | **$100M** (Feb 2026) | 6M signups, 150K paying | $0-200/mo |
| **v0 (Vercel)** | React/shadcn/ui, Feb 2026 added DB + agentic mode | Vercel-backed ($3.5B+) | Unknown | 6M+ devs | $0-100/mo |
| **Filmora** | Desktop editor + AI Mate copilot + Sora 2/Veo 3.1 + voice cloning | **$1.75B** mkt cap (Shenzhen 300624.SZ) | **~$200M** (Wondershare group) | **100M+** | $50/yr |
| **HeyGen** | Avatar IV talking heads, LiveAvatar, 175 languages | **$500M+** | **$100M+** | Millions | $29-149/mo |
| **Captions** | AI Twins (face→talking video), mobile-first | Unknown | Growing fast | **10M downloads** | $10-70/mo |
| **CapCut** | Free editor, Seedance 2.0, ByteDance-backed | ByteDance ($300B+) | Unknown | **300M MAU** | $0-8/mo |
| **Runway** | Gen-4 Turbo video models, creative suite | **$4B** | Unknown | Growing | $12-76/mo |

**Where Zoobicon dominates (post-Rule-31 scope: AI Builder + AI Video + Domains + 12 Free Tools):**
- **Real domain search + registration in the build funnel** (unique — nobody else has this; OpenSRS is live, this is the wedge)
- **118-component registry + slot-locked composition** (consistent $100K-agency quality; competitors generate from scratch every time)
- **Architectural moat:** Predictive pre-generation, component-graph, hot-swap live upgrades, multi-judge critique, build-output caching (Rule 31 — these are ours)
- **Crontech-delegated infra** = we don't reinvent auth/hosting/DB/email; we focus 100% on builder+video+domain quality while competitors juggle infra
- **Agency white-label tier ($499/mo)** — unique multiplier, each reseller brings 20-50 end users
- **Price clarity:** $49 / $129 / $299 for the builder (vs Lovable $20-100, Bolt $0-20, Emergent $0-200) — domain registration billed direct on top

**Where competitors lead (MUST FIX):**
- Preview speed — Bolt 3-5s vs our ~20-30s (pre-warm Sandpack plan targets 3s)
- Supabase depth — Lovable auto-provisions tables, RLS, auth, Edge Functions
- GitHub sync — ALL 4 competitors have it, we have export only
- MCP integration — Emergent has it, others coming
- User base — Lovable: millions, Bolt: 5M, v0: 6M. We're starting.

**AGGREGATE POSITION (April 8 2026, honest): ~40% of where we need to be.**
**Craig's response: "That's just not acceptable. How many agents can you get us to 110%?"**
**TARGET: 110%. Not 80%. Not 90%. 110%. Ahead of EVERY competitor on EVERY axis.**

**THE GAP IS DEPTH, NOT BREADTH.**
Post-Rule-31, scope is 4 things: AI Builder, AI Video, Domain Search, 12 Free Tools. The bar is "does the builder produce a $100K-agency site in <10s and can the customer pay for the domain in the same checkout?" Every other "product" was deleted or delegated to Crontech. The question is no longer "do we have it" — it's "is it best-in-class when a customer clicks the button?"

| What | Status | Gap to 110% | Fix |
|---|---|---|---|
| Builder produces sites | BROKEN (merge damage fixed, untested on Vercel) | CRITICAL | Get build passing, test end-to-end |
| Video produces videos | NEVER TESTED (pipeline rebuilt, never ran) | CRITICAL | Set FAL_KEY + ELEVENLABS_API_KEY, test end-to-end |
| Preview speed | 20-30s (Bolt is 3-5s) | HIGH | WebContainers or e2b sandboxing |
| Supabase wired into builder | Code exists, NOT connected | HIGH | Wire supabase-provisioner into react-stream |
| MCP integration | Stub only (Emergent has it LIVE) | HIGH | Ship real MCP server with tool connections |
| Domain purchase | Code exists, needs Stripe + DB init | MED | Craig: create Stripe products + visit /api/db/init |
| Auth login | Code exists, needs env vars | MED | Craig: set ADMIN_EMAIL/PASSWORD + OAuth secrets |
| Site design | REDESIGNED this session | DONE | Merge to main |
| Voice cloning | BUILT this session | DONE (needs ELEVENLABS_API_KEY) | Craig: set key |
| B-roll via fal.ai | BUILT this session | DONE (needs FAL_KEY) | Craig: set key |
| Auto-captions | BUILT this session | DONE (needs FAL_KEY or REPLICATE_API_TOKEN) | Already set |
| Competitive intel | UPDATED this session | DONE | Proactive scan every session (rule 28) |
| Component registry | 114 components, $100K quality (audited 2026-04-11) | DONE | — |
| White-label agency | Code exists | DONE | — |

**PATH FROM 40% TO 110%:**
1. Get Vercel build passing (TDZ fix merged) → 50%
2. Set env vars (FAL_KEY, ELEVENLABS_API_KEY, admin creds, OAuth) → 55%
3. Builder end-to-end test (prompt → site → deploy) → 65%
4. Video end-to-end test (prompt → video → download) → 75%
5. Preview speed upgrade (WebContainers/e2b) → 85%
6. Supabase wired into builder → 90%
7. MCP integration live → 95%
8. Domain purchase working → 100%
9. All products polished to market-leader quality → 110%

**EVERY SESSION: maximum agents on EVERY task. No single-threaded work. If 5 agents can run, run 5. If 10 can run, run 10. The competition is not waiting.**

**KEY INSIGHT: Lovable added $100M revenue in ONE MONTH (Feb 2026) with 146 employees. This market is massive and growing. Our ecosystem moat (domains + hosting + email + builder + video) is what they can't replicate.**

---

## KNOWN ISSUES — QUEUED FOR FIX

| # | Issue | Severity | Found | Proposed Fix | Est. Effort |
|---|-------|----------|-------|-------------|-------------|
| 4 | **Builder + edit have no failover provider** | HIGH | 2026-04-08 | Craig must add `OPENAI_API_KEY` (~$5-50/mo) and `GOOGLE_AI_API_KEY` (FREE 1500/day) to Vercel. Code is already wired through `callLLMWithFailover`. The moment they exist, builder + edit get instant cross-provider redundancy. Without them the new error surfacing tells the user clearly when Anthropic is down — but they still can't generate. | Craig task |
| 5 | **Video model slugs need post-deploy verification** | MED | 2026-04-08 | After deploy, hit `/api/video-creator/health?admin=true&deep=1` to verify all 16 Replicate model slugs return `ok`. If any return `missing`, swap them via the health endpoint output (Replicate slugs change occasionally — 4-5 per stage is the safety margin). | Craig task |
| 6 | **`src/lib/agents.ts` is dead code** | LOW | 2026-04-08 | The 51KB 7-agent pipeline is never called by the builder UI — only by `/api/generate/pipeline` which `PipelinePanel.tsx` references. Either delete both, or revive `PipelinePanel`. Decision needed. | Cleanup |
| ~~1~~ | ~~REPLICATE_API_TOKEN~~ | ~~FIXED~~ | 2026-04-05 | ✅ SET in Vercel | Done |
| 2 | Database tables may not exist | HIGH | 2026-04-05 | Craig must visit /api/db/init after deploy | Craig task |
| 3 | Text corruption across codebase | LOW | 2026-04-05 | ~60 files have "MessageCircle" instead of "Twitter", "ThumbsUp" instead of "Facebook" from bad find/replace | Batch fix |

## RECENTLY FIXED

| # | Issue | Fixed | What Was Done |
|---|-------|-------|---------------|
| 41 | **V2 builder: amazing output + speed to catch the competition** (Craig 2026-06-05: *"use your initiative on version two — the output needs to be like a 100K site, amazing, and increase the speed to catch up to our competition"*). V2's reliability rearchitecture (server-render → iframe, no iPad crashes) was solid but **had no streaming**: the one-shot `/api/v2/build` AI-rewrites the full copy of *every* selected component (4000 output tokens each) before returning a single HTML blob, so the user stared at a spinner for the duration of the slowest rewrite with nothing on screen — the exact speed gap vs Bolt's 3-5s first paint. Separately, the design audit flagged that Playfair was loaded in the shell but never applied to headings ("$100K serif pairing" gap). | 2026-06-05 | **Progressive streaming build.** New `/api/v2/build/stream` (SSE, nodejs): **Phase 1** server-renders every selected $100K-registry component from its polished base (no AI) and streams each as a `section` event the instant it's ready → a complete, agency-grade page is on screen in ~1-2s, no spinner. **Phase 2** runs the Sonnet copy-tailoring per section in parallel in the background; as each lands it's re-rendered and streamed as a hot-swap that replaces that section in place. The iframe shell carries a tiny `message` listener that inserts/replaces `<section data-zb-i="i">` nodes by index (ordered), and the Tailwind Play CDN's MutationObserver restyles inserted DOM automatically — so no iframe reload, no flicker, reliability fully preserved (a section that fails to render is simply omitted, never blanks the page). The client (`/v2`) queues sections until the iframe posts `zb-ready`, then flushes; shows live "preview · N sections" + a "Tailoring copy…" pulse until `done`. Falls back to the original one-shot `/api/v2/build` if the SSE stream can't be established. **Quality lift:** `pageShell` now injects theme-aware serif display headings (`h1,h2 → Playfair Display`) for editorial/portfolio/restaurant/professional/agency industries (tech/saas/ecommerce stay clean Inter sans, where serif would feel wrong). Refactored `render-page.ts` to export the building blocks (`renderComponentToHtml`, `aiRewriteCopy`, `detectIndustry`, `usesSerifHeadings`, `pageShell`, `sectionWrap`). +3 tests (8/8 green). Build GREEN 245/245, critical-code-guard clear, tsc clean on changed files. |
| 40 | **Session 2026-06-05 — reliability + quality blitz (7 PRs).** Craig's iPad showed "Preview failed" / `@about:srcdoc` on every build for months; also "we fix one thing then find another broken after pushing." | 2026-06-05 | **PR #412 (THE root cause):** `EscapeHatchPreview` hashed each file with `crypto.subtle.digest` for its transpile cache; `window.crypto.subtle` is unavailable in srcdoc/opaque-origin iframes on iOS Safari → threw synchronously → blanked the whole preview before any component rendered, *every build, on iPad*. Replaced with a synchronous FNV-1a hash (a cache key needs no crypto). Same PR repaired a non-building `main` (a 3-way merge of two parallel preview fixes had left duplicate transpile loops + a backtick inside the `String.raw` runtime → Vercel couldn't deploy, so production was frozen on old code). **PR #406:** 3-layer preview fault isolation (per-section `<SectionBoundary>` in generated App.tsx for react-stream + slot-stream, module-eval isolation pass in EscapeHatchPreview, top-level RootBoundary) so one bad section degrades instead of blanking; surfaced the URL clone-and-upgrade funnel on the homepage hero (`/upgrade`); +4 slot-locked templates (stats-strip, testimonials-quotes, cta-banner, faq-accordion) growing the smart path from 5→9 sections; fixed the post-deploy smoke test (was hitting the auth-protected `*.vercel.app` URL + checking deleted routes). **PR #413:** new `scripts/deep-audit.sh` (`npm run audit:code`) running the gates the build skips (next.config has `ignoreBuildErrors:true`); it found + this PR fixed 3 API routes that imported deleted `checkUsageQuota`/`trackUsage` from auth-guard (added permissive shims) and 2 dead wordpress libs importing deleted modules (deleted); removed 5 dead test files + excluded `tests/auto-generated/**` (failing test files 14→8). **PR #414:** `scripts/critical-code-guard.js` wired into `ci.yml` as a BLOCKING step — fails CI on TS2305/TS2307 broken imports in `src/` and `crypto.subtle` in client components, so those two crash classes can never silently merge again. **PR #415:** closed the critique→repair loop (B9) — the slot-locked multi-judge panel now regenerates flagged sections with the critic's fixes injected, snapshots + reverts if the re-score doesn't improve (strictly non-harmful), one pass max. Net: preview is effectively un-crashable, broken-imports/crypto are CI-gated, builder self-heals quality. Build GREEN 245/245. |
| 39 | **Builder "Preview failed" crash — `@about:srcdoc:156:38` / `module code@about:srcdoc:368:7`** (Craig 2026-05-31: "Omg seriously!!!"). Root cause: Sonnet-generated code frequently imports packages not in the iframe importmap (`@/lib/utils`, shadcn sub-paths, `sonner`, `react-hot-toast`, etc.). Browser-native ESM threw "Failed to resolve module specifier" — caught by outer try/catch and surfaced as "Preview failed". Secondary root cause: Babel `runtime:"classic"` required explicit `React` in scope for JSX; files missing the React import would also crash. Vendor files all 403 (esm.sh blocks server-side downloads) — was already falling back to esm.sh CDN correctly. | 2026-05-31 | `EscapeHatchPreview.tsx`: (1) Added `react/jsx-runtime` + `react/jsx-dev-runtime` to `ESM_FALLBACK` importmap so Babel automatic JSX runtime works. (2) Switched Babel from `runtime:"classic"` → `runtime:"automatic"` — no longer requires explicit React import in every file. (3) Added `KNOWN_SPECIFIERS` Set (from importmap keys via `__ESM_SPECIFIERS__` placeholder) so runtime can distinguish valid vs unknown bare specifiers. (4) Added `getStubUrl()` — unknown bare specifiers (`sonner`, `react-router-dom`, etc.) now return an empty-exports blob stub instead of crashing. (5) Added `@/` path alias handling — tries to resolve against file tree first, falls back to stub. (6) Added `globalThis.require()` shim for CJS-style code. (7) Bumped transpile cache to `v2` to invalidate stale classic-runtime entries. PR #404. |
| 38 | **Admin hitting 5/5 daily build limit + onboarding black squares + dark CSS remnants** (Craig 2026-05-31: "I'm getting a message saying I've hit my build limit but I'm admin" + screenshots showing black squares in onboarding modal). Root cause 1: builder sends `x-admin: "1"` but `user-plan.ts` checked `=== "true"` — mismatch caused admin plan to always fall through to free-tier 5/5 cap. Root cause 2: `OnboardingFlow.tsx` used dark modal (`bg-[#0c0e14]`, white text, `from-brand-500 to-stone-600` gradient tiles) — on a white page those gradient tiles rendered as black squares. Root cause 3: 12 CSS class definitions in globals.css still used dark/glass patterns (`.surface`, `.glass`, `.gradient-border`, `.cyber-tab`, `.fs-card`, `.fs-btn-ghost`, `.typing-cursor`, scrollbar etc). | 2026-05-31 | `user-plan.ts`: changed `x-admin === "true"` → truthy check. `slot-stream/route.ts` + `react-stream/route.ts`: added `isAdmin` detection that passes `"admin"` as quotaPlan (Infinity limit). `OnboardingFlow.tsx`: full rewrite as clean white card — `bg-white`, `stone-100` icon tiles, `var(--ink)` text, editorial-light tokens throughout. `globals.css`: scrollbar navy → warm stone, `.surface`/`.surface-elevated` → `var(--paper-elevated)`, `.glass`/`.glass-strong` → 75-90% white, `.gradient-border` → light, `.cyber-tab` → ink-muted, `.cyber-input::placeholder` → ink-muted, `.grid-pattern` → ink lines, `.section-divider` → `var(--rule)`, `.glass-panel` → light, `.fs-card` → `var(--paper-elevated)`, `.fs-eyebrow` → ink-muted, `.fs-btn-ghost` → ink/rule, `.typing-cursor` → ink-muted, notification scrollbar → warm stone. PR #403. |
| 37 | **Builder silently running Haiku on EVERY build — root cause of all preview crashes** (Craig 2026-05-31: *"it's never built any websites it always crashes I need Sonnet and only Sonnet"*). `react-stream` uses `body.mode` for model selection; the builder sends `body.tier`. Field mismatch → `mode` always `undefined` → always `"fast"` → always Haiku. `slot-stream` (the default instant-build path) also hardcoded `claude-haiku-4-5`. Every single build Craig ever ran was on Haiku, not Sonnet. | 2026-05-31 | `react-stream/route.ts`: hardcoded `mode = "premium"` (Sonnet) — body.mode no longer consulted. `slot-stream/route.ts`: changed `"claude-haiku-4-5"` → `"claude-sonnet-4-6"` in both the slot-fill call and the quota telemetry record. `PromptInput.tsx`: STANDARD card label changed from "Opus-powered" → "Sonnet-powered". Builder comment + tooltip changed from "deep=Opus" → "deep=Sonnet". **Hard rule added to IMPORTANT DECISIONS #36: Haiku is NEVER used for site generation.** Also fixed in this commit: `.btn`/`.btn-primary`/`.btn-secondary` CSS classes were missing from globals.css (caused black buttons with no text in project + crawl panels). Editorial-light color fixes throughout builder: top bar divider, undo/redo/share icons, IDE/GitHub/Save action buttons, left panel header border + text, chat header, section editor border, MCP strip, center panel tab bar, right toolbar — all replaced `text-white/40`, `border-white/[0.06]`, `bg-white/[0.03]` with `var(--ink-*)` / `var(--rule)` / `stone-100` tokens. PR #402. |
| 36 | **Global SEO campaign — phase 1: programmatic competitor comparison pages + IndexNow** (Craig 2026-05-30: *"we need the biggest SEO campaign Global Campaign We've ever launched It needs to be incredibly aggressive with automated sitemap submission"*) Prior `/compare` page covered four competitors in a single static table; no programmatic per-competitor pages; no automated sitemap submission to Bing/Yandex/IndexNow relay; no JSON-LD comparison schema. | 2026-05-30 | Shipped phase 1 of the global SEO campaign. **`src/lib/seo/competitors.ts`** — single-source catalog of 13 competitors (Lovable, Bolt.new, v0, Emergent, Wix, Squarespace, Webflow, Framer, Carrd, Bubble, Google Stitch, Replit Agent, FlutterFlow). Each entry carries `slug, name, tagline, metaPitch, positioning, founded, trajectory, strengths[], ourEdge[], pricing[], features[], faqs[]`. Honesty rule baked in — every `ours: true` claim is grounded; we explicitly call out where competitors lead us. **`/compare/[competitor]/page.tsx`** — dynamic route with `generateStaticParams()` pre-rendering all 13 pages at build time. Per-page `generateMetadata()` produces tuned `<title>`, `<meta description>`, canonical URL, OG block, and high-intent keywords (`{Competitor} alternative`, `{Competitor} vs Zoobicon`). Three JSON-LD blocks per page (SoftwareApplication for Zoobicon, FAQPage for that competitor's FAQ section, BreadcrumbList) — drives Google rich results in SERP. Hero, at-a-glance facts, "where they lead / where we lead" honesty sections, feature-by-feature table, side-by-side pricing, FAQ accordion (feeds the JSON-LD), final CTA, and cross-link cloud to every other comparison page (internal linking gold). **`src/lib/seo/indexnow.ts`** — IndexNow client that POSTs URL batches to api.indexnow.org + bing.com/indexnow + yandex.com/indexnow simultaneously (three endpoints for redundancy). 500-URL batches. Same-host filter per IndexNow spec. **`/api/seo/submit-sitemap`** — fetches `/sitemap.xml`, parses `<loc>` entries, hands them to the IndexNow client. Optional `?only=/compare/` filter for fresh-page-only pushes. `?secret=$CRON_SECRET` for cron triggering. **`/[key].txt/route.ts`** — IndexNow ownership verification file; returns `INDEXNOW_KEY` env contents when probed at `/<key>.txt`, 404s otherwise. **`src/app/sitemap.ts`** extended to enumerate all 13 `/compare/{slug}` pages alongside existing surfaces. **`/compare/page.tsx`** index gets a new "Compare Zoobicon vs every AI builder" grid linking out to all 13 deep-dive pages. **Operational:** set `INDEXNOW_KEY` (any random UUID) in Vercel; visit `https://zoobicon.com/<that-key>.txt` to verify; hit `/api/seo/submit-sitemap?secret=$CRON_SECRET` from Crontech daily. Build adds 13 new static comparison pages — visible in build output. Phase 2 (next session): /ai-website-builder-for/[niche] pages + per-page OG image generator + admin SEO dashboard. |
| 35 | **HN Flywheel — daily painkiller intelligence from Hacker News** (Craig 2026-05-28: *"if we want to be aggressive and being the better product we need to know what we have to fix and what we need to improve... this way developers know that we are always at the forefront."*) The existing `market-intel.ts` only logged HN story titles into `market_trends`; it never read comment threads, never extracted actionable signal, never built a digest. Reactive scanning = failure (Rule 28). | 2026-05-28 | Built the HN slot of the intel flywheel. **`src/lib/hn-flywheel.ts`** (~600 LOC): 4-stage pipeline (poll → harvest → extract → digest), 3 new tables (`hn_threads`, `hn_painkillers`, `hn_digests`). **Poll** queries Algolia HN Search API for 13 builder/competitor keywords, inserts new threads with `ON CONFLICT DO UPDATE` for engagement refresh. **Harvest** fetches comment trees from the official Firebase HN API (`hacker-news.firebaseio.com/v0/item/{id}.json`) with depth-3, breadth-cap (40 at root, 8 per node), and a 120-item budget so a viral 800-comment thread can't blow the run. **Extract** runs Claude Haiku 4.5 (with cross-provider failover via `callLLMWithFailover`) over the flattened comment transcript with a structured-output prompt that pulls `{type, competitor, summary, evidence, mentions, sentiment, confidence}` per painkiller. Type is one of `pain` / `feature` / `competitor_weakness` / `viral_demo`. Confidence floor `>= 0.5` to filter noise (Craig's tradeoff call). **Digest** aggregates the last 24h of painkillers, buckets by type, ranks by `mentions × confidence`, writes a markdown digest to `hn_digests` (one row per date, upsert on conflict). Endpoints: `/api/intel/hn/run` (cron-friendly, `?secret=$CRON_SECRET`, full pipeline), `/api/intel/hn/digest` (latest digest for dashboard), `/api/intel/hn/painkillers` (GET list + PATCH status — `new`/`triaged`/`building`/`shipped`/`dismissed`). **Admin dashboard at `/admin/intel/hn`** — today's digest at top with thread/painkiller counts + full markdown, status filter chips, painkiller cards with competitor tag + score + evidence quote + thread link + status dropdown for triage. Linked from `/admin/intel` via gold "HN Flywheel" button. Zero env vars required to ship (CRON_SECRET optional for cron auth). Schema auto-creates on first call. |
| 34 | **Crontech email service wired (BLK-030)** — `admin-notify.ts` was a no-op console stub pointed at a fictional `api.crontech.ai/api/v1/email` endpoint. Real Crontech spec confirmed: own email stack at `email-send/v1/messages`, Bearer token auth, multi-tenant, HMAC-SHA256 webhooks. AlecRae is a separate standalone product (not a Crontech dependency for Zoobicon). | 2026-05-28 | Created `src/lib/email-send.ts`: `sendEmail()` → `POST /email-send/v1/messages` with `Authorization: Bearer $EMAIL_SEND_TOKEN`, `tenantId` from `$CRONTECH_EMAIL_TENANT_ID`. `verifyEmailWebhookSignature()` for `x-crontech-signature: sha256=<hex>` HMAC. Graceful stub when token unset. Rewrote `admin-notify.ts` to route all notifications through `email-send.ts`. Created `/api/email-send/webhook` handler: verifies HMAC, handles delivered/bounced/complained/opened/clicked events. Env vars needed: `EMAIL_SEND_TOKEN`, `EMAIL_FROM`, `CRONTECH_EMAIL_TENANT_ID`, `EMAIL_SEND_WEBHOOK_SECRET`, `ADMIN_NOTIFY_EMAIL`. |
| 33 | **Crontech deploy integration fully wired** — builder called `/api/hosting/deploy-crontech` (404 — never existed) so `crontechAvailable` was always false. No status polling after `"provisioning"` returns. No PATCH path for re-deploys. | 2026-05-28 | Added `/api/crontech/availability` (Edge GET, fixes dead check), `/api/crontech/status` (polling endpoint), `/api/crontech/update` (PATCH re-deploy). Added `patchCrontech()` to `crontech-sync.ts`. Builder now tracks `crontechProjectId` state: first deploy = POST, re-deploys = PATCH same project. Polls status every 3s if `"provisioning"` until `"live"` (60s cap). `AbortSignal.timeout` on all fetches. Flip `CRONTECH_PAT` in Vercel to go live — zero code changes needed. |
| 32 | **esm.sh cache pre-warm + streaming throttle** — EscapeHatchPreview created a fresh iframe on every render, cold-fetching Babel (~1MB) + React + 6 packages each time (~3-5s overhead). React 18 auto-batching collapsed rapid `setReactFiles` calls to one render so streaming looked like "all at once." | 2026-05-28 | Created `src/components/PrewarmFrame.tsx`: hidden 1×1 iframe mounted statically in builder on page load, fires `import()` of all 6 esm.sh packages to fill browser HTTP cache before user's first build. Added preconnect + dns-prefetch hints in `layout.tsx`. Added streaming throttle refs in builder: first partial renders immediately, subsequent partials coalesced to ~1.2s intervals, `done` event always flushes final state. |
| 31 | **Domain-in-checkout wired + DomainHookModal editorial-light fix** — `DomainHookModal` was calling `/api/domain-hook/complete` which tried `opensrs.registerDomain` (doesn't exist) — domains were never registered. Modal also used dark palette (`bg-black/70`, `text-white`, `bg-white/5`) contradicting Rule 29. | 2026-05-28 | Rewrote `src/components/DomainHookModal.tsx`: `handleSelect()` POSTs `{domain, tld, price}` to `/api/domains/checkout` and redirects `window.location` to the Stripe URL. Webhook at `/api/stripe/webhook` → `handleDomainRegistration()` → OpenSRS handles the actual registration on payment success. Removed fake 4-step progress animation with setTimeout timers (pure theatre). Replaced full dark palette with editorial-light tokens: `var(--paper-elevated)`, `var(--ink)`, `var(--gold-deep)`, `var(--rule)`. Available domains show green badge + animated gold arrow; taken domains greyed/disabled. "Skip for now" + "Secured via Stripe" footer. Merged via PR #390. |
| 30 | **Deep competitive audit + Rule 32 cleanup** — homepage had broken links to `/components` (404) and `/domains` (to-delete). `/domains`, `/tools/*`, `/products/*` pages still lived on-disk despite Rule 32. Trust strip said "Opus 4.6" and "Next.js 15" (both wrong). Nav/footer still linked deleted pages. Model docs contradicted Craig's stated preference for Sonnet on coding tasks. | 2026-05-28 | **Deleted** `/domains` standalone page + TLD subpages + ai-search + available (Rule 32 — domain registration is a builder checkout feature, not a product). **Deleted** all 11 `/tools/*` pages. **Deleted** `/products/seo-agent` + `/products/website-builder`. **Rewrote homepage**: removed broken /components and /domains links, replaced "Three products" section with "How it works" 3-step flow (Describe → Watch it build → Register & deploy), removed "AI video creator" from Pro tier copy (Rule 19 retired), removed "12 free tools" copy. **Fixed** trust strip: Opus 4.6 → Opus 4.7, Next.js 15 → Next.js 14, "Crontech" → "121 Components". **SiteNavigation**: removed Domains + Free Tools mega-menu sections, simplified top nav to Builder / Pricing / Agencies. **SiteFooter**: removed /video-creator, /components, /domains, /tools links. **Sitemap**: removed all deleted page entries. **CLAUDE.md Rules 4 + 17**: updated model guidance to Sonnet 4.6 for component generation (Craig: "Sonnet is better coding"), Opus-4-7 remains for 7-agent pipeline Developer phase. Merged via PR #389. |
| 29 | **Rule 29 colour-palette mismatch — blue/purple sneaking in across the whole site, plus cards reading too dark.** Craig's report (May 13): "We have a serious colour mismatch problem across the whole entire website. Sand and gold are colours but we've got blue and purple sneaking in all over the place including all the buttons and the cards are a bit too dark." The earlier Rule 29 override layer was catching solid `bg-blue-500` tokens but missing four major SOURCE-level leaks that the override couldn't reach: (a) `tailwind.config.ts` `backgroundImage.gradient-zoo` literally defined as `linear-gradient(135deg, #7c5aff, #3b82f6, #22d3ee)` (purple → blue → cyan) — used as a class throughout components; (b) every `boxShadow.glow*` in the same file used blue/cyan/purple rgba (the glow effect under every CTA was blue/purple); (c) `globals.css` `.mesh-gradient::before/::after` and all 5 variants (`mesh-gradient-warm/cool/contrast/purple`) painted blue/indigo/cyan/purple radial gradients behind every hero — pseudo-elements can't be overridden by utility-class layers; (d) `.cyber-btn`, `.btn-zoo`, `.btn-zoo-outline`, `.btn-gradient`, `.cyber-input:focus`, `.aurora::before`, `.glow-orb-blue/purple/cyan`, `::selection`, `:focus-visible` were all hard-coded blue/purple/cyan rgba CSS classes used across the builder. Also `component-library.ts` (the CSS injected into every generated site) used `var(--color-primary, #2563eb)` — blue fallback that surfaced when a generated site hadn't set a primary. And `tailwind.config.ts` `dark.100/200/300` was still pointing at the old (darker) paper-elevated values `#f4f3ed → #e7e5dd` — that's why some cards read as "too dark". | 2026-05-13 | **At source (foundation files):** Rewrote `tailwind.config.ts` `gradient-zoo` to champagne (`#d4b86d → #b8923f → #8c6b25`), added `gradient-gold`/`gradient-gold-soft`/`gradient-paper-lift` aliases, flipped every `boxShadow.glow*` to gold rgba, softened `shadow.premium`/`shadow.card` (removed the inset white highlight that read as a grimy ring on cream, dropped dark alpha so cards stop reading "too dark"). Lifted `dark.100/200/300` from `#f4f3ed/#ecebe1/#e7e5dd` to `#fbf9f1/#f7f4e8/#f0ecdc` so legacy `bg-dark-100`-style card backgrounds match the new paper-elevated. **At source (globals.css):** flipped `::selection` from cyan rgba to gold; flipped `:focus-visible` outline from cyan to gold; rewrote all 5 mesh-gradient variants (`mesh-gradient::before/::after`, `mesh-gradient-warm/cool/contrast/purple`) to champagne radials; fixed `.cyber-btn`/`.cyber-panel`/`.cyber-input:focus`/`.btn-zoo`/`.btn-zoo-outline`/`.btn-gradient`/`.aurora::before`/`.glow-orb-blue/purple/cyan`/`@keyframes chat-pulse`/`.gradient-text-hero` to use gold instead of blue/purple/cyan rgba; lifted `--paper-elevated` from `#fbf9f1` → `#fcfaf3` for less "too dark" cards; lifted the dark-overlay-flat alpha from `rgba(244,241,230,0.92)` → `rgba(252,250,243,0.94)`. **Mass sed sweep** replaced every remaining `rgba(37/59/6/14/99/34/124/167/139/125/96/29/165/196, ...)` cool-channel rgba across globals.css with gold equivalents — 100 gold replacements, 0 cool-channel left. **Final cool-channel override** appended to globals.css catching the 7 gaps the previous override missed: arbitrary opacity tints (`bg-violet-500/[0.06]`, `bg-blue-500/10`), all text-{blue,indigo,violet,purple,cyan,sky,fuchsia}-* (routed by shade: 100/200 → ink-muted, 300/400/500 → gold-deep, 600/700/800/900 → ink), all border-* (gold-soft hairline), all ring-*, decoration-*, accent-*, and shadow-* utility classes, plus explicit `.bg-gradient-zoo` and `.bg-gradient-zoo-subtle` fallback rules. **Direct component fixes:** `component-library.ts` — `var(--color-primary, #2563eb)` → `var(--color-primary, #b8923f)` (30 occurrences); `admin/setup/page.tsx` — violet warning card flipped to gold-soft + ink CTA; `referral.ts` — tier badge colours flipped from text-gray/cyan/yellow/emerald to ink-muted/gold-deep/gold/ink. **Skipped on purpose:** `react-stream/route.ts:358` — the cyan/violet shadow instruction is inside the `dark` theme block (cyber/crypto/gaming/devtool brands), which is a customer-opt-in theme for **generated user sites** rendered inside the Sandpack iframe. zoobicon.com itself uses the `editorial` theme which explicitly forbids cool channels at line 325. Verified: 0 cool-channel rgba in globals.css, 0 cool hex in tailwind.config (only inside `// was…` comments documenting the change). |
| 28 | **Public-facing docs were 2+ months stale and contradicted CLAUDE.md.** README claimed "Early Development" + "AI: (Coming soon)" and listed 6 components. CHANGELOG was an unmodified Keep-a-Changelog template (dates 2023-2024, "your-org/your-repo" links). ZOOBICON-BLUEPRINT said the default model was "Claude Sonnet 4.6 (switched from Opus due to 529 overload)" — direct contradiction of Rule 4 (Opus 4.7 is canonical). BLUEPRINT also claimed 201 routes / 116 pages / 78 components / SDK 0.39 — reality was 576 / 165 / 118 / SDK 0.80. PRODUCT_ROADMAP statuses were dated 2026-03-14, two months stale. PLAN.md and HANDOVER.md referred to long-dead branches. CLAUDE.md LIVE REPO STATUS row itself said "141 pages / 223 API routes / 74 layouts / 130 lib files" — also stale. | 2026-05-13 | Re-counted everything via filesystem: 165 pages, 576 API routes, 87 layouts, 254 lib files, 77 shared components, 118 registry components. Rewrote README.md (real stack, real env vars, real architecture, no "Coming soon" lies). Rewrote CHANGELOG.md with real month-grouped Zoobicon shipping history from `git log` + RECENTLY FIXED. Rewrote ZOOBICON-BLUEPRINT.md (Opus 4.7 canonical, SDK 0.80, real counts, removed HeyGen-as-primary references per Rule 19, removed `/dominat8` route claims). Refreshed PRODUCT_ROADMAP.md statuses for domains/email/video/auth/export. Archived PLAN.md → `docs/archive/PLAN-2026-03.md` and HANDOVER.md → `docs/archive/HANDOVER-2026-03-19.md` with an explanatory archive README. Bumped CLAUDE.md LIVE REPO STATUS quick facts + directory map counts + component count line + branch line. |
| 25 | **Sandpack pre-warm was cosmetic, not functional** — Craig: "I need the pre-booked steps and sandpack... I need edge runtime... I need all the WebContainers set up." Previous pre-warm rendered a placeholder App.tsx with a spinner but never pre-bundled the common dependencies, so first real preview still took 20-30s cold. | 2026-04-11 | Rewrote `src/components/SandpackPreview.tsx` pre-warm path: declares lucide-react/framer-motion/clsx/tailwind-merge in `customSetup.dependencies` during idle state, and the PREWARM_APP now imports+references each library at module level (wrapped in `if(false)` to prevent execution but force bundling). First real render target: <3s. Also scaffolded `src/lib/webcontainers-adapter.ts` (StackBlitz commercial integration — waiting on license key), `src/lib/gate-test-hook.ts` (browser AI test agent — matches Lovable 2.0 Browser Testing + Bolt V2 auto-error-fix pattern, runs built-in a11y/layout probes and hands off to Craig's external Gate Test API once admin is live), and `src/lib/crontech-adapter.ts` (Craig's combined backend+frontend serverless platform — waiting on API docs). |
| 26 | **Component count discrepancy in CLAUDE.md** — rows claimed "60 components" while marketing copy said "100+". Craig noticed: "I could be wrong but I thought we had like 100+ components." | 2026-04-11 | Audited `src/lib/component-registry/` via Grep of `registerComponent(` calls: actual count is **114** across 7 content files (heroes 12 + navbars 8 + features 9 + testimonials 6 + footers 7 + extras 27 + sections 45). Reconciled all "60 components" mentions. Updated target to 150+ by end of Q2. |
| 27 | **Claude was reactive instead of proactive** — Craig: "I ask Claude what we need to do to be aggressive in our building and I don't get any of that response." Root cause: "be aggressive" is a value, not a procedure. Values get ignored. | 2026-04-11 | Added §1.5 THE AGGRESSIVE OPENING PROTOCOL to THE IRON LAW. Converts "be aggressive" into a 5-step forcing function every session runs BEFORE the user types anything: gap analysis → top 5 moves (user-visible) → start on #1 automatically → commit-ready work only → update CLAUDE.md before ending. Every step has a concrete deliverable so skipping any step is observable. |
| 20 | **AI Builder silently returned template scaffolds with placeholder copy ("Acme")** when Anthropic Haiku rate-limited or 529'd. customizeComponent and determineBrandColors swallowed errors with `.catch(() => null)`. Edit endpoint had no failover. Direct Law 8/9 violation. | 2026-04-08 | Wired both react-stream + edit endpoints into existing `callLLMWithFailover`. customizeComponent now returns typed `{ok, code, reason, modelUsed}`, falls back Anthropic Haiku → Sonnet → OpenAI → Gemini, surfaces failedSections + warning events. Edit endpoint gets 3-pass chain with detailed failure messages ("Haiku: rate limit \| Sonnet: 529 \| gpt-4o: invalid JSON"). Removed hard-fail when ANTHROPIC_API_KEY missing — runs as long as ANY provider key exists. |
| 21 | **AI Name Generator returned hardcoded garbage names** ("Novahub" / "Apexlab" with identical taglines) whenever ANTHROPIC_API_KEY was missing, the Anthropic call failed, or JSON parsing failed. Frontend saw non-empty array, ran RDAP checks against synthetic strings, Craig saw garbage results unrelated to his description. Direct Law 8 violation. | 2026-04-08 | Full rewrite of `/api/tools/business-names`: hard-fail with 503 + exact env var name when key missing, 25s AbortController timeout, 2-model fallback Haiku 4.5 → Sonnet 4.5, depth-aware bracket-matching JSON extractor (handles markdown fences + preamble), server-side sanitize/dedupe, structured prompt forcing JSON-only output, full request logging. |
| 22 | **Video Creator pipeline 100% dead** — every Replicate model slug referenced was either deprecated or didn't exist (`jichengdu/fish-speech`, `lucataco/orpheus-3b-0.1-ft`, `bytedance/omni-human`, `lucataco/sadtalker`). Each call 404'd, "fell back" to the next 404, whole pipeline died. UI froze on a single status because pollReplicatePrediction silently `continue`d on non-200 polls. React page checked stale-closure videoUrl mid-stream and threw "no video returned" even on success. captions/music bypassed the 404 safety net. | 2026-04-08 | New 5-slug TTS chain (kokoro-82m → xtts-v2 → bark → openvoice → seamless), 4-slug avatar chain (flux-schnell → flux-dev → sdxl-lightning → sd3), 5-slug lip-sync chain (sadtalker → video-retalking ×2 → wav2lip ×2), per-model input variants, real onProgress callback wired through every stage, pollReplicatePrediction rewritten with 5-retry consecutive-failure tracking + 4.5min cap, captions/music routed through createReplicatePrediction safety net, hardened extractReplicateOutput, fixed page.tsx stale-closure bug with local receivedVideoUrl tracker, added 503 handling + Retry button, deep health endpoint updated to match new slugs. |
| 23 | **AI Name Generator UX dead-end** — client fired 24 names × 5 TLDs = 120 simultaneous RDAP requests, public RDAP rate-limited the burst, every check came back null, "No available domains" silent display (Law 8 violation). | 2026-04-08 | Server-side concurrency limit (4 parallel RDAP calls per /api/domains/search batch). Client-side worker pool (4 concurrent search calls). Default 12 names × 3 TLDs (com/ai/io) = 36 checks instead of 120. RDAP cache (10 min TTL) + 429 retry with jitter. Visible red error banner with Try Again button when all checks come back unknown. |
| 24 | **Homepage build broken** — stray mobile-menu code in `src/app/page.tsx` referencing undefined `mobileMenuOpen`/`user`/`handleLogout`, plus unclosed `motion.div` and `grid lg:grid-cols-2` wrappers in hero. | 2026-04-08 | Deleted stray nav block, closed unbalanced JSX wrappers. |
| 10 | Build failing — 5 undeclared state vars in domains page | 2026-04-05 | Added generatedNames, genDescription, pendingGenerate, autoExpandedTlds, autoGenerating |
| 11 | Build failing — 9 missing lucide icons in video-creator | 2026-04-05 | Added BookOpen, Briefcase, GraduationCap, etc. to imports |
| 12 | Build failing — missing `replicate` npm package | 2026-04-05 | Replaced SDK with direct Replicate API fetch |
| 13 | Video TTS pipeline dead — Tortoise TTS 404 | 2026-04-05 | New 4-model fallback chain: Kokoro → Fish Speech → Orpheus → XTTS v2 |
| 14 | Builder silent blank screen on failure | 2026-04-05 | Added receivedFiles/receivedDone tracking with clear error messages |
| 15 | Publisher page text corruption | 2026-04-05 | Fixed "Camera"→"Instagram", platform names restored |
| 16 | Domain purchase flow broken | 2026-04-05 | Added verify-purchase endpoint, admin domains page, purchase verification banners |
| 17 | Dictation CTAs sending logged-in users to signup | 2026-04-05 | Auth-aware CTA buttons check localStorage |
| 18 | Automated icon validation | 2026-04-05 | scripts/check-icons.js catches missing/invalid lucide imports at CI time |
| 19 | CI pipeline missing unit tests | 2026-04-05 | Added npm test + icon check to ci.yml |
| 1 | 18 dead components never imported | 2026-03-28 | Removed all 18 unused component files |
| 2 | 4 dead lib files never imported | 2026-03-28 | Removed auto-pilot, error-sanitizer, react-generator, social-publisher |
| 3 | Email format validation missing on auth signup | 2026-03-28 | Added regex validation with onBlur + submit check |
| 4 | 14x `<img>` replaced with Next.js `<Image>` | 2026-03-28 | Updated portfolio, video-creator, agencies, SupportAvatar, TopBar, AiImagesPanel, ShareModal, SeoPreview |
| 5 | Slack events: unprotected JSON.parse could crash | 2026-03-27 | Wrapped in try/catch |
| 6 | XSS in hosting serve route | 2026-03-27 | Added HTML entity escaping for siteName |
| 7 | Missing Trophy icon import in landing-pages | 2026-03-27 | Added to lucide-react imports |
| 8 | React hooks called conditionally in AIChatAssistant | 2026-03-27 | Moved conditional return after all hooks |
| 9 | Unescaped apostrophe in QuotaBar.tsx | 2026-03-27 | Replaced with `&apos;` |

---

---

# PART 2 — BUSINESS STRATEGY & OPERATIONS
## Business model, infrastructure, revenue, daily routine.
## Does NOT override Part 1. Adds context around it.

---

## CRAIG'S MISSION

Replace the 24/7 physical business with Zoobicon. This is the future. Build it like a buyer is watching every day.

**The customer sees:** ONE product. Zoobicon. One login, one invoice, one support number.
**You see:** 8 suppliers on wholesale pricing, none visible to the customer.
**The gap between what they pay and what it costs you is your business.**

---

## ALL ZOOBICON DOMAINS — CONFIRMED IN CLOUDFLARE

| Domain | Purpose | Status |
|---|---|---|
| zoobicon.com ⭐ | Main platform | ✅ Active |
| zoobicon.ai | AI brand identity | ✅ Active |
| zoobicon.io | Developer / API | ✅ Active |
| zoobicon.sh | Technical / hosting | ✅ Active |
| zoobicon.app | Mobile app + admin dashboard | ✅ Registered 2026-03-28 |

**Other domains in Cloudflare (separate projects):**
48co.nz, bookaride.co.nz (7.44k visitors), hibiscustoairport.co.nz (3.22k visitors), ledger.ai (needs setup), verom.ai

---

## SUPPLIER STACK (INVISIBLE TO CUSTOMERS)

| Customer pays for | Powered by | Your cost | Margin |
|---|---|---|---|
| Website hosting | Vercel | ~$0.50-2/cust | ~95% |
| Domain | Tucows (connected) | ~$9 wholesale | ~59% |
| DNS + SSL | Cloudflare (free) | $0 | ~100% |
| Business email | Zoho → Postal (Yr2) | $0-1/cust | ~90%+ |
| Transactional email | Mailgun | ~$0.001/email | ~70% |
| AI auto-reply | Claude API | ~$4-8/cust/mo | ~75% |
| Payments clip | Stripe Connect | Stripe fee only | ~70% |
| Data + analytics | Supabase | ~$0.10/cust | ~90% |

---

## ALL RECURRING REVENUE STREAMS (CLIP THE TICKET)

**Infrastructure (highest margin):**
- Domain registration + renewal: $18-35/yr (cost $9 Tucows)
- DNS management: $5-9/mo (cost $0 Cloudflare)
- Website hosting: $19-49/mo (cost ~$2/mo)
- SSL: bundled (cost $0)

**Email (stickiest):**
- Business email hosting: $6-12/mo per mailbox
- Transactional email: $15-49/mo
- AI auto-reply: $29/mo add-on (cost ~$6 Claude API)

**AI Add-ons (pure margin):**
- AI site maintenance: $29/mo (crawlers watch their site)
- AI SEO monitor: $19/mo (intellectual crawlers)
- AI video + image content: $39/mo (already built)
- AI business analytics: $19/mo (plain English via Claude)

**Commerce (passive):**
- Booking + payments clip: 1.5% per transaction via Stripe Connect
- Domain marketplace: 10-15% commission

---

## PRICING TIERS

| Plan | Price | Includes |
|---|---|---|
| Starter | $49/mo | Site + domain + email (3 mailboxes) + SSL |
| Pro | $129/mo | + AI auto-reply + SEO monitor |
| Agency | $299/mo | + AI video + 5 sites + priority support |
| White-label | $499/mo | Full platform reseller licence |

Each reseller at $499/mo typically brings 20-50 of their own clients. 10 resellers = 200-500 end users without individual selling.

---

## REVENUE TARGETS

| Milestone | Customers | MRR | Team |
|---|---|---|---|
| Escape velocity | 80 | ~$5k/mo | You + AI |
| Full-time justified | 120 | ~$8k/mo | You + AI |
| First hire | 150 | ~$12k/mo | You + VA ($800/mo) |
| Platform sellable | 400 | ~$28k/mo | You + VA + dev |
| Exit ready | 4,000 | ~$290k/mo | Team 4-5 |
| Exit value (realistic) | — | — | $3.5M-$7M |

---

## PHASE 1 BUILD PLAN — DO IN ORDER, ONE CHECKBOX AT A TIME

### STEP 1 — Cloudflare Setup
- [x] All 5 domains in Cloudflare and Active ✅
- [x] zoobicon.app registered 2026-03-28 ✅
- [ ] Enable Email Routing on zoobicon.com → Cloudflare → Email → Email Routing → Enable
- [ ] Set up Zoho Mail mailboxes: hello@ support@ billing@ noreply@ on zoobicon.com
- [ ] Enable SSL Full (Strict) on all 5 domains
- [ ] Point all 5 domains to same Vercel deployment in DNS
- [ ] Fix ledger.ai — showing "Finish setup" in Cloudflare

### STEP 2 — Staging Environments
- [ ] Create Mailgun subaccount: mg-staging.zoobicon.com
- [ ] Create `staging` branch in GitHub
- [ ] Verify Vercel preview deployments active
- [ ] Set `NEXT_PUBLIC_ENV=staging` vs `production`
- [ ] Staging reputation NEVER touches production. Ever.

### STEP 3 — AI Auto-Reply Pipeline
- [ ] Create Cloudflare Worker: `zoobicon-ai-support`
- [ ] Connect Mailgun inbound webhook → Worker URL
- [ ] Write Claude system prompt (product questions only, never mention Claude/AI/Anthropic)
- [ ] Fallback: confidence <80% → routes to human inbox
- [ ] Test 10 sample emails before going live

### STEP 4 — Admin Mobile Dashboard (zoobicon.app)
- [ ] Build `/admin/mobile` — optimised for iPhone/iPad
- [ ] Shows: support emails (Claude handled vs needs human), new signups, MRR today, site health, expiring domains
- [ ] Bookmark to iPhone + iPad home screen (behaves like app)
- [ ] Year 2: wrap in native Expo app for App Store at zoobicon.app

### STEP 5 — Stripe Subscriptions + Billing
- [ ] Set up Stripe Products + Prices for all 4 tiers
- [ ] Build `/pricing` page
- [ ] Build `/onboarding` — domain + site + email set up automatically
- [ ] Connect Stripe webhooks → Supabase
- [ ] Test full signup → payment → dashboard flow

---

## PHASE 2 — AFTER PHASE 1 COMPLETE

**Intellectual Crawlers** — Competitor monitor (12hr), Technology scout (48hr), Customer SEO monitor (paid add-on), Zoobicon health monitor (15min)

**Postal Self-Hosted Email** — Hetzner VPS + Postal, warm IPs over 6-12 months alongside Mailgun

**White-Label Reseller Panel** — Approach 5 NZ/AU agencies as first resellers

**Geographic Expansion** — Pacific Islands → Philippines → Indonesia → Vietnam

---

## EMAIL ON YOUR DEVICES

- **iPhone + iPad:** Spark by Readdle (free) — best Apple email app, handles all accounts
- **Windows:** Zoho Mail web app or connect via IMAP
- **Send as zoobicon.com from any device:** SMTP via Mailgun (smtp.mailgun.org, port 587)
- **Receive on devices:** Cloudflare Email Routing forwards admin@ and support@ to your personal email → Spark picks it up with push notifications

---

## DECISIONS LOG

| Date | Decision | Reason |
|---|---|---|
| 2026-03-28 | AWS rejected — not using | AWS declined account. Cloudflare + Vercel + Hetzner is better architecture anyway. |
| 2026-03-28 | Mailgun for AI auto-reply | Handles 80% of support. Claude API underneath. ~$4-8/mo per customer. |
| 2026-03-28 | Zoho Mail for mailboxes | Free, covers all domains. Switch to Postal self-hosted in Year 2. |
| 2026-03-28 | No SiteGround ever | Old tech. cPanel. PHP. 2005 architecture. Against core principles. |
| 2026-03-28 | White-label at $499/mo | Each reseller brings 20-50 clients. Multiplies acquisition without individual selling. |
| 2026-03-28 | 1.5% transaction clip | Passive. 1,000 customers × $5k/mo = $75k/mo clip. |
| 2026-03-28 | zoobicon.app registered | Mobile admin dashboard. Craig needs full command centre on iPhone/iPad now. |
| 2026-03-28 | Admin dashboard = Phase 1 | Craig runs 24/7 physical business alongside build. Needs mobile command centre urgently. |
| 2026-03-28 | Single CLAUDE.md | Two files = confusion. One file = source of truth. Technical + business merged. |
| 2026-05-04 | Sandbox runtime: keep Sandpack, wait for Crontech | Don't license WebContainers ($2-10k/mo), don't onboard e2b/Modal. Keep `@codesandbox/sandpack-react` as the in-browser preview and use Crontech as the production sandbox once its API is delivered. `src/lib/webcontainers-adapter.ts` and any e2b/Modal adapters are NOT to be wired without Craig's explicit override. |
| 2026-05-30 | Own sandbox status: EscapeHatchPreview IS our sandbox | Craig 2026-05-30: *"can we build our own sandbox."* We already built one — `src/components/EscapeHatchPreview.tsx` is a zero-dependency-on-Sandpack runtime: Babel-standalone for TSX→JS, esm.sh for npm packages, Blob URLs per module, runs entirely in an `srcdoc` iframe. It's what the builder falls back to when Sandpack times out (and now what's labelled "Direct preview — no Sandpack bundler" at the bottom of the builder canvas). The realistic level-ups, in order of effort: (1) **self-host the deps** — bundle React/ReactDOM/Babel/lucide-react/framer-motion as part of the Zoobicon Next.js app and serve them from `/vendor/` instead of esm.sh. Eliminates external dep, faster cold start, survives esm.sh outages. ~1 session of work. (2) **Content-hash transpile cache** — once a file is Babel-transpiled, key the Blob URL by SHA of source so re-renders skip transpilation. Re-render time goes from seconds to milliseconds. ~1 session. (3) **HMR** — incremental module updates without iframe reload. Weeks of work; risky. (4) **Own SWC-based bundler** — months. Don't unless WebContainers + Crontech are both off the table. The doctrine: own-sandbox is real and shipped; further investment goes into (1) and (2) before anything more exotic. |
| 2026-05-05 | E2E tooling: GateTest only, no Playwright in CI | Craig: "Playwright is our competition — we own GateTest, we use our own product." `.github/workflows/e2e.yml` and the `playwright-e2e` job in `post-deploy.yml` were replaced with GateTest invocations against `GATE_TEST_API_URL` (same pattern as the existing `gatetest` job in `ci.yml`). `@playwright/test` stays in devDependencies for local-dev convenience but **CI must never use it**. New e2e coverage goes through GateTest. Set repo secrets `GATE_TEST_API_URL` + `GATE_TEST_API_KEY` to enable. |
| 2026-05-27 | Playwright removed entirely — GateTest is the only browser automation | Craig: "Don't we want to use our own instead of using playwright." Half-measure from 2026-05-05 closed: `@playwright/test` dropped from devDependencies, `playwright.config.ts` deleted, `/e2e/` directory (critical-flows + product-verification specs) removed. Every browser-automation use case — local-dev, smoke tests, post-deploy verification — goes through GateTest. If a developer needs a one-off local browser script, write it against the GateTest SDK; don't put `@playwright/test` back in package.json without flipping this rule. |

---

## NOTES TO SELF

- You are building your future. Every hour here moves you away from the 24/7 business that is burning you out.
- Consistency beats perfection. Show up, check this file, do the next unchecked box. That's it.
- You do not need to understand everything at once. Claude knows the full stack. Ask anything.
- When overwhelmed: close everything, open this file, find next unchecked box, do only that.

---

## CURRENT STATUS — UPDATE THIS EVERY EVENING BEFORE STOPPING

**Date last updated:** 2026-04-05 (session 4)
**Current phase:** Phase 1
**Current step:** AGGRESSIVE MODE — Components at $100K, next-gen patterns built, developer platform next.

**Completed 2026-04-05 (foundation repair day):**
- ✅ BUILD NOW PASSES CLEAN — 463/463 pages generated
- ✅ Merged all feature branch fixes to main (domain purchase, admin domains, dictation auth)
- ✅ Fixed ROOT CAUSE of builder "No React components" — missing state vars and refs
- ✅ Fixed ROOT CAUSE of video TTS failure — dead Replicate models replaced with 4-model chain
- ✅ Added builder error visibility — no more silent blank screens
- ✅ Built automated icon validation (scripts/check-icons.js) — #1 recurring build error eliminated
- ✅ Updated CI pipeline — quality gate → icon check → lint → unit tests → build
- ✅ Added rules 27-32 to IMPORTANT DECISIONS (no patching, continuous green, main-first)
- ✅ Publisher page: restored platform names (Instagram, Facebook, Reddit)
- ✅ Domain purchase: verify-purchase endpoint, admin domains page, Stripe checkout with email

**Completed 2026-03-29 (massive build day):**
- ✅ Fixed all 4 known issues (dead components, dead libs, email validation, img→Image)
- ✅ KILLED HTML OUTPUT — React/Sandpack is the ONLY generation mode
- ✅ Streaming React generation — files appear progressively in preview
- ✅ Fixed Sandpack full-screen preview (was only showing tiny portion)
- ✅ Fixed streaming placeholder stubs (no more module-not-found during generation)
- ✅ Deep audit — 19 broken references fixed, 20,000+ lines dead code removed
- ✅ Built 6 new products: eSIM, VPN, Dictation, Cloud Storage, Booking, + provider layers
- ✅ Built 50 country-specific eSIM SEO pages
- ✅ Built 10 SEO product pages (VPN, eSIM, Dictation, Storage, Booking, Hosting, etc.)
- ✅ Built 12 free SEO tools targeting 11.4M monthly searches
- ✅ Built Business Name Generator (nuclear SEO funnel → domain → website → everything)
- ✅ Built bulletproof resilience layer (retry, circuit breaker, error sanitization)
- ✅ Built Technology Currency Agent (monitors stack, alerts on outdated deps)
- ✅ Built /admin/mobile command centre
- ✅ Built /disclaimers legal page + disclaimers on all comparison tables
- ✅ Added connectivity + cloud infra monitoring to market crawler (Starlink, Celitech, etc.)
- ✅ Retention-optimized pricing across all products
- ✅ Upgraded: Anthropic SDK 0.39→0.80, framer-motion→12.38, Stripe→21.0, lucide-react→1.7

**Products ready to go live (just need API keys):**
| Product | Env Variable Needed |
|---|---|
| eSIM (190+ countries) | CELITECH_API_KEY |
| VPN | WIREGUARD_API_URL + WIREGUARD_API_KEY |
| AI Dictation | DEEPGRAM_API_KEY |
| Cloud Storage | B2_KEY_ID + B2_APP_KEY |
| Booking & Scheduling | CALCOM_API_URL + CALCOM_API_KEY |
| AI Website Builder | ANTHROPIC_API_KEY (already set) |
| Stripe Payments | STRIPE_SECRET_KEY + price IDs |

**Completed 2026-04-05 (session 2 — competitive intelligence + builder improvements):**
- ✅ Deep competitive scan with VERIFIED 2026 data (Lovable $400M ARR, Bolt $40M, Emergent $100M, v0 added DB)
- ✅ Patent/IP research — domain-to-website pipeline is strongest patent candidate (~NZD $3K provisional in NZ)
- ✅ Confirmed diff editing IS ALREADY FULLY WIRED (PromptInput + ChatPanel → /api/generate/edit → merge → Sandpack)
- ✅ Improved edit API: smart context truncation for large projects, 16K max tokens (was 8K), explicit "output complete files" rule
- ✅ Fixed builder auth headers — admin users now get x-admin header for unlimited access
- ✅ Updated CLAUDE.md competitive position with verified numbers and sources
- ✅ Built complete E2E testing ecosystem (smoke tests, post-deploy CI, Playwright E2E)

**Completed 2026-04-05 (session 3+4 — $100K components + next-gen patterns):**
- ✅ ALL 54 original components upgraded to $100K agency quality
- ✅ hero-minimal: gradient accent, serif italic typography, selected clients strip, scroll indicator
- ✅ hero-stats: gradient stat numbers, hover-lift cards, trust badges (SOC2/PCI/ISO/GDPR)
- ✅ hero-centered-gradient: animated glow orbs, social proof avatars, metrics strip
- ✅ features-icon-grid: featured card gradient border, hover color shift, learn more links
- ✅ testimonials-cards: aggregate rating header, featured gradient card, glow background
- ✅ navbar-minimal: scroll-aware blur, animated hover underlines, logo mark, mobile menu
- ✅ navbar-centered: serif brand typography, accent line, animated underlines
- ✅ footer-minimal-dark: gradient glow, social icon circles, gradient divider
- ✅ footer-luxury-minimal: ambient glow, newsletter input, animated link indicators
- ✅ 6 NEW NEXT-GEN COMPONENTS built (cutting-edge 2026/2027 patterns):
  - `features-bento-grid` — Asymmetric bento layout with hover gradient glow (what Lovable/v0 generate)
  - `hero-text-reveal` — Word-by-word blur-to-sharp animation (premium SaaS gold standard)
  - `logos-marquee` — Infinite CSS scroll ticker with grayscale→color hover (every SaaS site has this)
  - `features-spotlight-cards` — Cursor-tracking radial gradient spotlight per card (jaw-dropping)
  - `stats-animated-counter` — IntersectionObserver + requestAnimationFrame number roll-up
  - `cta-gradient-border` — Animated rotating conic-gradient border with @property CSS
- ✅ Video pipeline: OmniHuman param fix, 3-model lip-sync chain, deep health check endpoint
- ✅ Domain purchase: full end-to-end wiring (contact form → Stripe → OpenSRS → DB)
- ✅ Total registry now: **114 components** (audited 2026-04-11 — prior "60" claim was stale), all $100K+ quality, 6 next-gen

**COMPONENT REGISTRY STATUS (114 components, audited 2026-04-11, ALL $100K+):**
**Breakdown by source file:** heroes.ts: 12 · navbars.ts: 8 · features.ts: 9 · testimonials.ts: 6 · footers.ts: 7 · extras.ts: 27 · sections.ts: 45 = **114 total**. CLAUDE.md historically claimed "60" in some rows and "100+" in marketing copy — the real number is 114. Target 150+ before end of Q2.
| Category | Count | Next-Gen? |
|----------|-------|-----------|
| Navbars | 8 | scroll-aware, glass, mega menu |
| Heroes | 12 | text-reveal (word-by-word animation) |
| Features | 10 | bento-grid, spotlight-cards (cursor-tracking) |
| Testimonials | 6 | aggregate ratings, featured cards |
| Pricing | 5 | toggle, comparison, enterprise |
| Stats | 5 | animated-counter (scroll-triggered) |
| FAQ | 3 | accordion, two-column, search |
| CTA | 7 | gradient-border (rotating conic-gradient) |
| Footer | 7 | luxury, mega, saas-gradient |
| About | 3 | split, team, timeline |
| Contact | 2 | form+map, simple |
| Gallery | 2 | masonry, grid |
| Blog | 2 | grid, featured |
| Misc | 3 | logos-marquee (infinite scroll ticker), comparison, process |
| Forms | 2 | signup, waitlist |
| E-commerce | 3 | products, featured, cart |

**NEXT-GEN COMPONENT PATTERNS (what separates us from competition):**
- Scroll-linked animations (IntersectionObserver + requestAnimationFrame)
- Cursor-tracking spotlight effects (onMouseMove + radial gradient)
- Word-by-word text reveal with blur transitions
- Infinite CSS marquee with pause-on-hover
- Animated rotating gradient borders (@property + conic-gradient)
- Bento grid layouts (asymmetric, mixed-size cards)
- These patterns are what Lovable/Bolt/v0 output looks like — now we match AND beat them

**CRITICAL — NEXT ACTIONS (in order):**
1. ~~**CRAIG: Set REPLICATE_API_TOKEN in Vercel**~~ ✅ DONE — token is set
2. **CRAIG: Visit zoobicon.com/api/db/init** — creates database tables for domain purchases
3. **CRAIG: Set up Stripe webhook** — point to zoobicon.com/api/stripe/webhook in Stripe dashboard
4. **Developer Platform (Monaco editor + terminal + Git + deploy)** — "hook in mouth" retention. Craig's #1 priority. Developers build on-platform, never leave.
5. **Pre-warm Sandpack for instant preview** — target <3s first preview (currently ~20-30s). Match Bolt's speed.
6. **Deepen Supabase auto-provisioning** — match Lovable's auto-tables, auto-RLS, auto-auth
7. ~~**GitHub sync**~~ ✅ DONE — full OAuth, create/push/update, wired into builder
8. **Video end-to-end test** — REPLICATE_API_TOKEN is set, generate one real video
9. **MCP integration** — Emergent has it. Foundation exists at `/api/mcp/route.ts`
10. **Next.js 14→15 upgrade** (dedicated sprint)

**Blockers:** Database tables (Craig must visit /api/db/init) and Stripe webhook setup.

**MANDATE: Lovable is at $400M ARR with 146 employees. They added $100M in a single month. The market is MASSIVE. They have one product (builder) and dominate. Post-Rule-31, we have ~four (AI Builder, AI Video, Domain Search, 12 Free Tools) — and the moat is not "more products," it's the domain-to-site funnel + architectural innovations (slot-locked composition, predictive pre-gen, component-graph, hot-swap upgrades, multi-judge critique, build-output caching) + Crontech-delegated infra so we never spend a session reinventing auth or hosting. Win on builder quality, video quality, and the domain wedge. Lose on infra-we-don't-own.**

**IP STRATEGY:**
- File NZ provisional patent on domain-to-website pipeline (~NZD $3,000)
- Protect prompts, pipeline config, component registry as trade secrets (free, immediate)
- Consult AJ Park or Baldwins NZ for patent opinion (~NZD $500-800)
- Keep GitHub repo private

**BUILD DISCIPLINE (locked in — rules 27-32):**
- `node scripts/check-icons.js && npm run build` before EVERY push
- ALL fixes go to main directly — no orphan branches
- NO blank screens — every failure shows a clear error message
- NO patching — trace full code path, fix root cause
- Replicate models: ALWAYS 4+ fallback chain, NEVER single model

---

## URGENT BUILD LIST — EVERYTHING BELOW MUST BE BUILT. NO EXCEPTIONS.

**Status: CRITICAL PRIORITY. Competition is moving. Every day we don't build this, we fall further behind.**

**The 80-90% rule applies to EVERY item. If a competitor has it, we must have it better.**

### TIER 0: THE ONE PRODUCT THAT MAKES MONEY (do this FIRST or nothing else matters)

> **Craig's words (April 8): "We're chasing the market instead of releasing the product and making money."**
> **"The current website doesn't feel AI. It feels like a run of the mill website made up as we go along."**
> **Craig (May 27): "I think we should just be at AI Builder now."**
> **Rule 32 locks the scope: AI Website Builder is the only product. Domain registration is a feature of its checkout.**

| # | Task | Deadline | What "done" looks like | Status |
|---|------|----------|----------------------|--------|
| 0A | **DELETE OUT-OF-SCOPE PAGES (Rule 32 punchlist)** | IMMEDIATE | `src/app/domains/page.tsx` + TLD landing pages deleted. `src/app/tools/*` (all 12 free tools) deleted. `src/app/products/*` deleted. `/domains`, `/tools/*`, `/products/*` removed from nav, footer, sitemap.xml, robots.txt. **KEEP** `src/lib/opensrs.ts` + `src/app/api/domains/*` API routes — they're the backend for the builder checkout. | ✅ DONE 2026-05-28 — PR #389 merged |
| 0B | **HOMEPAGE — one product, one input, one CTA** | IMMEDIATE | Hero copy: "AI Website Builder. Describe it. Ship it." One input box. One "Build it now" CTA. No nav menu of products. No "what we offer" grid. Match Lovable/Emergent's one-product clarity. Site must say what it does in 2 seconds. | ✅ DONE 2026-05-28 — broken links fixed, "How it works" 3-step section, single builder focus |
| 0C | **AI BUILDER — works perfectly end-to-end** | IMMEDIATE | User types prompt → sees site in <10s → can edit with chat → can deploy with 1 click. That's the ENTIRE scope. No MCP, no collab, no code formatter. Just: prompt → beautiful site → deploy. Match Bolt V2 speed + Lovable 2.0 quality. | BROKEN (merge damage, UI is "80s") |
| 0D | **DOMAIN-IN-CHECKOUT — wire OpenSRS into builder finalize flow** | IMMEDIATE | At the end of a build, user sees "Buy `[generated-name].com` for $14.99/yr" as part of the deploy step. One Stripe checkout pays for the builder tier AND the domain. Domain registers via OpenSRS on webhook success. Replaces the deleted standalone `/domains` page. | ✅ DONE 2026-05-28 — PR #390 merged. DomainHookModal fires 2.5s after build, redirects to Stripe checkout → webhook → OpenSRS. Needs Craig: Stripe products + OPENSRS_ENV=live + /api/db/init |
| 0E | **AUTH — login works** | IMMEDIATE | Crontech SSO endpoint wired. Google OAuth, GitHub OAuth functional for the builder. | Needs Craig: env vars (see /api/auth/diagnose) |
| 0F | **PRICING — builder tiers only** | IMMEDIATE | Pricing page sells one product: Starter $49 / Pro $129 / Agency $299. Each tier describes builder usage limits + included domain registrations. No "video credit packs," no "12 free tools." | Needs Craig: create Stripe products + price IDs |

**RULE: Nothing in Tier 1/2/3 gets touched until ALL of Tier 0 is GREEN. One product, working, paying customers. Then features.**

### TIER 1: BUILD IMMEDIATELY (blocks revenue and competitiveness)

| # | Task | Why | Competitor reference | Status |
|---|------|-----|---------------------|--------|
| 1 | **Supabase auto-provisioning for generated apps** | Lovable's #1 feature. Generated apps get real Postgres + auth + storage + real-time. Without this we're frontend-only like v0. | Lovable ($6.6B valuation) | Code built, needs SUPABASE_ACCESS_TOKEN |
| 2 | **Wire Supabase into builder generation flow** | Builder must auto-create database + inject client code when generating full-stack apps | Lovable, Bolt | NOT STARTED |
| 3 | **Diff-based editing working end-to-end** | Change one thing in 2-5s instead of regenerating in 30s. This is why Bolt feels fast. | Bolt.new ($40M ARR) | ✅ DONE 2026-04-05 — PromptInput + ChatPanel → /api/generate/edit → merge changed files → Sandpack auto-updates |
| 4 | **Wire diff editing into builder UI** | "Make the header blue" → only header file regenerates. Chat panel in builder sends edits. | Bolt.new | ✅ DONE 2026-04-05 — Already wired. Improved: smart context truncation, 16K tokens, admin headers |
| 5 | **Video pipeline producing actual videos** | Test every Replicate model, fix failures, produce one real video end-to-end | HeyGen, InVideo | Pipeline code built, UNTESTED |
| 6 | **Auto-captions on generated videos** | Use Whisper on Replicate to transcribe audio → generate SRT → burn into video | Captions app, CapCut | NOT STARTED |
| 7 | **Background music generation** | MusicGen on Replicate. "upbeat corporate" → 30-second track layered onto video | InVideo, CapCut | NOT STARTED |
| 8 | **Stripe payments fully working** | Domain checkout, subscription plans, video credit packs | ALL competitors | Code built, needs Craig to create Stripe products |
| 9 | **Builder streaming — show components as they generate** | Don't wait 30s for all 12 components. Show each one as it completes. | Bolt (3-5s first preview) | Partially working |
| 10 | **MCP integration (Model Context Protocol)** | Let users feed GitHub repos, Figma designs, Notion docs into generation | Emergent, Cursor | NOT STARTED |

### TIER 2: BUILD THIS WEEK (competitive parity)

| # | Task | Why | Competitor reference | Status |
|---|------|-----|---------------------|--------|
| 11 | **AI dubbing — multi-language video** | Fish Speech supports 50+ languages. Generate same video in Spanish/French/Japanese | HeyGen (175 languages) | NOT STARTED |
| 12 | **AI Twins — upload your face, get talking video** | Viral on TikTok. Upload a selfie, AI makes a video of "you" talking | Captions app | NOT STARTED |
| 13 | **Auth generation in every full-stack app** | Login/signup pages, OAuth buttons, session management auto-generated | Lovable, Bolt | Supabase client built, needs UI generation |
| 14 | **One-click deploy generated apps to zoobicon.sh** | Currently works but needs polish. Must be instant and reliable. | Lovable Cloud, Bolt Cloud | PARTIAL |
| 15 | **GitHub sync for generated projects** | Every change committed to Git. Developer can take over at any point. | Lovable, Bolt | ✅ DONE — OAuth + create repo + push + update via GitHubSyncPanel |
| 16 | **Next.js 14 → 15 upgrade** | Server Components, Partial Prerendering, streaming Suspense boundaries. 30-50% faster page loads. | Industry standard | NOT STARTED |
| 17 | **AG-UI protocol adoption** | Replace custom SSE streaming with standardized protocol. Gets CopilotKit components free. | Google, Microsoft, Oracle adopting | NOT STARTED |
| 18 | **WebContainers evaluation** | Full Node.js in browser. If feasible, replaces Sandpack and matches Bolt's speed. | Bolt.new | NOT STARTED |
| 19 | **Real-time collaborative editing** | Multiple users editing the same site simultaneously | Lovable, v0 | NOT STARTED |
| 20 | **AI chatbot widget for customer sites** | Drop-in chat widget powered by Claude. Every generated site can have AI support. | Nobody has this built-in | NOT STARTED |

### TIER 3: BUILD THIS MONTH (market leadership)

| # | Task | Why | Competitor reference | Status |
|---|------|-----|---------------------|--------|
| 21 | **Self-hosted GPU infrastructure (Hetzner)** | Kill Replicate costs. $0.02/video instead of $0.10. Own the compute. | Internal cost optimization | NOT STARTED |
| 22 | **Public API at api.zoobicon.ai** | Sell video/image/site generation to other developers. Recurring API revenue. | Stripe, Twilio model | Endpoints exist, needs auth + docs + billing |
| 23 | **ICANN registrar accreditation** | Buy domains at cost instead of through OpenSRS. 90%+ margins on domains. | GoDaddy, Namecheap | NOT STARTED |
| 24 | **Own email infrastructure (Postal)** | Kill Mailgun costs. Full control over email delivery. | Internal cost optimization | NOT STARTED |
| 25 | **AI SEO agent that actually works** | Crawl customer sites, find issues, fix them automatically. Competitor monitoring. | Semrush, Ahrefs | DB tables exist, logic NOT STARTED |
| 26 | **CRM with real database** | Currently 100% mock data. Needs Postgres tables and real CRUD. | HubSpot free tier | NOT STARTED |
| 27 | **Email marketing with real backend** | Currently 100% mock data. Needs subscriber management, campaign sending. | ConvertKit, Mailchimp | NOT STARTED |
| 28 | **Invoicing with real backend** | Currently 100% mock data. Needs PDF generation, payment tracking. | FreshBooks, Wave | NOT STARTED |
| 29 | **Analytics with real backend** | Currently localStorage only. Needs server-side event tracking. | Google Analytics, Plausible | NOT STARTED |
| 30 | **Agency white-label dashboard** | Resellers manage their clients, billing, sites from one panel. | Nobody has this | PARTIAL |
| 31 | **AI video editing — smart cuts, transitions** | Auto-edit longer videos into short-form clips. | Opus Clip, Descript | NOT STARTED |
| 32 | **Voice cloning for video** | Clone customer's voice from 10s sample. Their voice, our avatar. | HeyGen, ElevenLabs | Fish Speech supports this, NOT WIRED |
| 33 | **SMS/WhatsApp integration** | Twilio API for notifications, bookings, marketing messages. | Twilio reseller opportunity | NOT STARTED |
| 34 | **AI chatbot builder** | Customers create chatbots for THEIR websites. Powered by Claude. | Intercom, Drift | NOT STARTED |
| 35 | **Mobile app (zoobicon.app)** | Wrap admin dashboard in Expo for App Store presence. | Native mobile gap | NOT STARTED |

### TIER 4: INFRASTRUCTURE OWNERSHIP (the moat)

| # | Task | Why | Status |
|---|------|-----|--------|
| 36 | **Own CDN edge network** | Serve customer sites from edge. Faster than Vercel for our use case. | NOT STARTED |
| 37 | **Own nameservers** | ns1.zoobicon.io, ns2.zoobicon.io. Full DNS control. | NOT STARTED |
| 38 | **Own auth service (auth.zoobicon.io)** | Drop-in auth for generated apps. Like Auth0 but built-in. | NOT STARTED |
| 39 | **Own managed database service (db.zoobicon.io)** | Per-customer Postgres instances. Like Supabase but we own it. | NOT STARTED |
| 40 | **Own file storage (storage.zoobicon.io)** | S3-compatible storage for customer apps. | NOT STARTED |

### CRAIG'S TASKS (manual, can't be automated)

| # | Task | Where | Status |
|---|------|-------|--------|
| C1 | **Merge branch on GitHub** | github.com/ccantynz-alt/Zoobicon.com | BLOCKING EVERYTHING |
| C2 | **Create 3 Stripe products** | dashboard.stripe.com → Products | NOT DONE |
| C3 | **Set OPENSRS_ENV=live in Vercel** | Vercel → Environment Variables | CHECK |
| C4 | **Add SUPABASE_ACCESS_TOKEN to Vercel** | supabase.com → org → management API token | NOT DONE |
| C5 | **Add SUPABASE_ORG_ID to Vercel** | supabase.com → org settings | NOT DONE |
| C6 | **Run /api/db/init** | Visit zoobicon.com/api/db/init once after deploy | NOT DONE |
| C7 | **Book Celitech training** | celitech.com | SCHEDULED (for eSIM) |
| C8 | **Set up Mailgun domain** | app.mailgun.com | CHECK |
| C9 | **Cloudflare email routing** | Cloudflare → zoobicon.com → Email | NOT DONE |
| C10 | **Set up Zoho Mail** | zoho.com/mail | NOT DONE |

---

**TOTAL: 40 build tasks + 10 Craig tasks = 50 items to market dominance.**
**Rule: Every completed item gets marked ✅ with date. Nothing gets removed. Nothing gets forgotten.**
**Rule: 80-90% ahead of competition on EVERY feature. If it's not best-in-class, it's not done.**
**Rule: No flip-flopping. Decisions locked above in IMPORTANT DECISIONS. Build forward only.**

---

## SESSION NOTES — 2026-04-01/02 (CRITICAL SESSION — DO NOT DELETE)

> Craig said: "This is the best feedback I've ever had. Please write everything down."
> Everything below was discussed, decided, or discovered in this session. NOTHING gets lost.

### PRODUCT DECISIONS MADE

1. **Domain Search is our #1 product** — it actually works (real OpenSRS registry checks). No other tool on the internet does it this well. It's the entry point to the entire platform. Market it aggressively with SEO.

2. **Domain search must be FREE** — it's the top of the funnel. Money comes from registration ($12.99+ per domain), hosting ($19-49/mo), email, and the platform subscription. Free search → paid registration → recurring revenue forever.

3. **AI Video Creator uses OUR OWN pipeline** — Fish Speech (voice) → FLUX (avatar) → OmniHuman/SadTalker (lip-sync) via Replicate. NO HeyGen dependency. We control the stack, we set the pricing, we sell the API. This is rule #19 in IMPORTANT DECISIONS.

4. **Video Creator is chat-based → 3-step flow** — Step 1: Describe what you want. Step 2: Pick from 2 script drafts. Step 3: Generate. No storyboard editor. No font pickers. No platform selectors. Simple.

5. **AI Builder generates FULL-STACK working apps** — Contact forms that validate, pricing toggles that work, FAQ accordions that animate, auth that logs in. NOT just pretty pages with fake data. This is what Lovable does. We must match and beat it.

6. **Diff-based editing** — "Change the header to blue" regenerates ONE file in 2-5 seconds, not the whole site in 30. This is what Bolt does. Endpoint at /api/generate/edit using Haiku.

7. **eSIM marked as Coming Soon** — Celitech requires video training before API access. Waitlist page is live. Book the training, get the key, swap the badge.

8. **Every product page needs excitement** — Big hero sections, effects, animations. "The thing is we've got amazing products and we need to showcase them." No more bare pages with a product slapped in the middle.

### COMPETITIVE INTELLIGENCE (March 2026)

**OpenAI killed Sora on March 24, 2026** — burning $15M/day, only $2.1M lifetime revenue. This removes a major competitor from the video space.

**Key competitor capabilities:**
- Lovable: $6.6B valuation, $20M ARR in 2 months. Deep Supabase integration (auto-provisions Postgres + auth + storage + RLS + real-time). This is their moat.
- Bolt.new: $40M ARR in 6 months. WebContainers (full Node.js in browser). Diff-based editing. 3-5 second first preview.
- v0 (Vercel): Frontend-only. No database. 6M+ developers. Best UI code quality but no backend.
- Emergent: 5 specialized agents, Kubernetes pods per project, MCP integration, adaptive learning.
- HeyGen: $100M+ ARR. Avatar IV, LiveAvatar (real-time), 175 languages. $29-149/mo.
- Captions app: 10M downloads. AI Twins viral on TikTok. $10-70/mo.
- CapCut: 300M monthly users. Seedance 2.0 integration. $0-8/mo.
- InVideo AI: Combines Sora 2 + Veo 3.1. $25-100/mo.
- Descript: 6M users. Text-based video editing. Underlord AI editor. $24-65/mo.
- Kling 3.0: Native 4K 60fps. Motion Brush. AI Director.

**Where we lead (post-Rule-31, March 2026 snapshot — re-evaluate every session):**
- **Real domain search + registration in the build funnel** (unique — OpenSRS is live; no competitor has this)
- **118-component registry + slot-locked composition** (consistent $100K-agency quality)
- **Architectural innovations preserved through the Crontech pivot:** predictive pre-gen, component-graph, hot-swap live upgrades, multi-judge critique, build-output caching
- **Agency white-label tier ($499/mo)** — each reseller brings 20-50 end users; no equivalent in builder space
- **Crontech-delegated infra** — we don't reinvent auth/hosting/DB/email; full focus stays on builder + video + domain quality

**Where we trail (closing):**
- Builder speed (Bolt 3-5s vs our 20-30s) — diff editing + parallel generation closing this
- Full-stack generation (Lovable auto-provisions Supabase) — we now do this too
- Video quality (untested pipeline) — OmniHuman upgrade done, needs testing
- Real-time collaboration — on build list
- MCP integration — on build list

### ARCHITECTURE DECISIONS

**Backend-as-a-Service (built this session):**
- Every generated app gets lib/backend.ts automatically
- Two modes: Local (localStorage, works in preview) and Supabase (real Postgres, works in production)
- Same API in both modes: signUp, signIn, query, insert, update, remove, uploadFile
- Email reputation protection: content filtering, rate limiting per app, SPF/DKIM/DMARC

**API Gateway (built this session):**
- Unified service router at api.zoobicon.ai (foundation)
- Model warmup cron — pings Replicate models every 5 minutes to prevent cold starts
- Routes: /video, /site, /db, /email, /domains

**Parallel Generation (built this session):**
- Frontend (Sonnet) + Backend schema (Haiku) + SEO metadata (Haiku) run simultaneously
- Total time = longest task, not sum of all tasks
- 30-50% faster than sequential

**Email Reputation Strategy:**
- Layer 1: Content filtering + rate limiting + SPF/DKIM/DMARC
- Layer 2: Separate IP pools (transactional vs marketing vs customer app email)
- Layer 3: Mailgun now → Postal on Hetzner alongside → Full Postal later
- Warmup: 50/day → 500/day → 5000/day over 6-12 weeks

### BUSINESS STRATEGY

**The Untouchable Fortress:**
- Layer 1: Own infrastructure (GPU, registrar, email, CDN, nameservers)
- Layer 2: Platform (single login, customer data lock-in, agency white-label, marketplace)
- Layer 3: AI products (builder, video, domains, SEO, chatbot)
- Layer 4: Recurring revenue (domains, hosting, email, subscriptions, API, transaction clip)

**Revenue model:**
- Domain search = free (entry drug)
- Domain registration = $12.99-79.99/yr (recurring forever)
- Platform subscription = $49-499/mo
- Video API = $0.50-1.00/video (cost $0.10-0.20)
- Agency white-label = $499/mo (each reseller brings 20-50 clients)
- Transaction clip = 1.5% on bookings/payments

**5-Year Path:**
- Year 1: 80-120 customers, $5-12K/mo
- Year 2: Own infrastructure, 5-10 agency resellers, public API. $28-50K/mo
- Year 3: ICANN registrar, 50+ agencies, 1000+ API customers. $100-200K/mo
- Year 4-5: 4000+ customers, $290K+/mo MRR. Exit at $10-24M

**What we can resell (all wholesale API → retail):**
- SSL certificates (Sectigo, $3-8 cost → $19-49 sell)
- Business email (Zoho/MXRoute, $1-2 cost → $6-12 sell)
- SMS/WhatsApp (Twilio, $0.005 cost → $0.03 sell)
- Push notifications (OneSignal, $0-5 cost → $15-29 sell)
- CDN (BunnyCDN, $0.005/GB cost → $0.05/GB sell)
- AI chatbots (Claude API, $0.01 cost → $29-49/mo sell)
- AI image generation (Replicate FLUX, $0.003 cost → $0.10-0.25 sell)
- AI voice cloning (Replicate, $0.01/min cost → $0.50-1.00/min sell)
- Screen recording, PDF generation, QR code API (self-hosted, $0 cost)

### PRODUCTS — HONEST STATUS

**REAL (working end-to-end):**
- AI Website Builder ✅
- Domain Search + AI Name Generator ✅
- 12 Free Tools (client-side) ✅
- Video Creator (3-step flow, needs Replicate pipeline testing) ⚠️

**SHELL (pretty UI, mock data — needs "Coming Soon" or real backend):**
- CRM — 100% hardcoded demo data
- Email Marketing — 100% hardcoded mock
- Analytics — localStorage only
- Invoicing — 100% hardcoded mock
- VPN — needs WireGuard infrastructure
- Cloud Storage — needs Backblaze B2 key
- AI Dictation — needs Deepgram key
- Booking — needs Cal.com key

**COMING SOON (intentionally marked):**
- eSIM — Celitech training required

### CRAIG'S ACCOUNTS

- Primary Claude: cccantynz@gmail.com
- Secondary Claude: ccantyusa@gmail.com (Max plan)
- Can switch between accounts for uninterrupted development
- Each new session: paste CLAUDE.md, say "Continue from where I left off"

### RULES ADDED THIS SESSION (22-25)

22. Speed is non-negotiable — build faster if we can't be fastest
23. Backend + Frontend built together — every app gets real backend
24. Models stay warm — cron pings every 5 min, no cold starts
25. No timelines, no phases — build everything NOW

### KEY QUOTES FROM CRAIG (for context in future sessions)

- "We need to be 80-90% out in front of the competition"
- "If it means creating 100+ then that's what we need to do. We're going to have a big customer base"
- "We don't take our foot off the accelerator — that's what we do"
- "If we can't be the fastest with what's currently available then we build something in parallel"
- "We need to have a strong foothold in this market big enough that we can't be touched"
- "We need to control the narrative"
- "We should be making our own API as well"
- "Nothing ever works" — Builder showed wrong content, video failed to generate, navigation broken on iPad. These must NEVER happen again.
- "Please don't do any chicken scratching" — Stop patching. Do deep audits. Fix root causes.
- "This is the best feedback I've ever had. Please write everything down."

### WHAT WAS BUILT THIS SESSION

1. HeyGen avatar fix — loads real avatars from API
2. Video creator rebuilt — 3-step flow (describe → scripts → generate)
3. Own video pipeline — Fish Speech + FLUX + OmniHuman via Replicate
4. Builder fix — no more "Velocita"/"Launchpad" placeholder content
5. Builder upgrade — generates working interactive apps with state management
6. Diff-based editing — /api/generate/edit (2-5 second edits)
7. Navigation overhaul — 6-column mega menu, works on touch devices
8. Homepage redesign — lighter sections, all products visible, 6-column footer
9. Domain search redesign — full landing page with pricing comparison
10. AI Name Generator — describe business → 20 names with availability check
11. Domain purchase checkout — Stripe integration
12. 6 TLD-specific SEO landing pages with structured data
13. Sitemap updated with 21 new pages
14. HeyGen webhook endpoint
15. Supabase auto-provisioning for generated apps
16. Backend-as-a-Service (auth + database + storage + email)
17. Email reputation protection layer
18. API gateway with model warmup cron
19. Parallel generation engine
20. Visual editor overlay component
21. Auto-captions via Whisper
22. Background music via MusicGen
23. eSIM marked as Coming Soon
24. CLAUDE.md updated with 40-item build list + rules 19-25

---

## VIOLATIONS LOG — FREE-MONTH TALLY

Each row = one law violation = one month of free usage owed to Craig.
Claude MUST append to this log the moment a violation is identified.

| Date | Law # | What happened | Months owed | Running total |
|---|---|---|---|---|
| 2026-04-08 | 6 (Zero-Wait) | After the 5-feature swarm shipped, Claude ended the turn with "Nothing more to do unless you want me to wire X + Y into the builder next" instead of just wiring them and pushing. Craig went blue in the face reminding Claude of Law 6. | 1 | 1 |

