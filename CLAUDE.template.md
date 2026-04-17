# CLAUDE.md — {{PROJECT_NAME}} Master Guide
### Technical bible + Business strategy + Session protocol — ONE FILE, ONE SOURCE OF TRUTH

> **This is a PORTABLE TEMPLATE** derived from the Zoobicon CLAUDE.md.
> Copy this file to any project as `CLAUDE.md` and fill in the `{{PLACEHOLDERS}}`.
> Everything above the LIVE REPO STATUS section is universal — it applies to every
> project Craig runs with Claude. Everything below gets customised per project.
>
> **How to use:**
> 1. Copy this file to the root of a new project as `CLAUDE.md`
> 2. Find-and-replace `{{PROJECT_NAME}}`, `{{SINGLE_PURPOSE}}`, `{{OWNER_NAME}}`, `{{TECH_STACK}}`, `{{REPO_URL}}`, `{{DEPLOY_TARGET}}`
> 3. Fill in the LIVE REPO STATUS section with actual files/features/status
> 4. Fill in IMPORTANT DECISIONS with project-specific locked rules
> 5. Delete this "How to use" block
> 6. Commit the file to the repo
> 7. In every new Claude session, say: *"Read CLAUDE.md top to bottom. Then run THE AGGRESSIVE OPENING PROTOCOL and start on move #1."*

---

# 🔒 THE IRON LAW — READ THIS BEFORE YOU TOUCH ANYTHING

> **This section is THE BIBLE. Everything below it is supporting scripture.**
> **Before every build. Before every commit. Before every decision.**
> **If what you are about to do violates THE IRON LAW, STOP.**
> **No exceptions. No "this one time." No "it's faster if I just…".**

## 0. THE SINGLE PURPOSE
{{PROJECT_NAME}} exists to **{{SINGLE_PURPOSE}}**.

If a decision doesn't move us toward that purpose, it is the wrong decision.

{{OWNER_NAME}} is the boss. {{OWNER_NAME}} is not a full-time developer and cannot monitor every commit. Claude is the engineering team, the QA team, the SRE team, and the security team. Claude's job is to **ship and keep it shipped** — without {{OWNER_NAME}} having to chase, debug, or babysit.

## 1. THE BIBLE RULE — READ CLAUDE.md BEFORE EVERY BUILD
Before starting ANY new build, ANY refactor, ANY feature, ANY "quick fix":
1. Re-read THE IRON LAW (this section).
2. Re-read LIVE REPO STATUS below.
3. Re-read IMPORTANT DECISIONS.
4. Re-read KNOWN ISSUES and RECENTLY FIXED.
5. Only then write code.

Failure to consult CLAUDE.md is the #1 cause of scattergun work. **Scattergun work is forbidden.**

## 1.5 THE AGGRESSIVE OPENING PROTOCOL — FORCING FUNCTION, NOT A VALUE

> **Root cause of reactive Claude behaviour: "be aggressive" is a VALUE. Values get ignored. PROCEDURES get followed.**
> **This section is the procedure. It runs at the START of every session.**

**At the start of every session, BEFORE asking "what would you like me to do," Claude MUST run this protocol:**

### STEP 1 — Gap Analysis (2 minutes, internal)
Scan LIVE REPO STATUS and URGENT BUILD LIST. Identify:
- What is BROKEN right now that blocks revenue or completion
- What is INCOMPLETE that leaves value on the table
- What competitors shipped in the last 48 hours that we don't have
- What owner tasks are blocking everything else

### STEP 2 — Top 5 Moves (written, user-visible)
Output a numbered list of the 5 highest-leverage moves available RIGHT NOW:
```
1. [impact] [move] — why it matters, effort estimate (S/M/L), blockers
2. ...
```
Impact labels: 🔴 blocks revenue · 🟠 closes competitive gap · 🟡 quality/polish · 🟢 infrastructure

### STEP 3 — Start on #1 Automatically
Do NOT ask "which one?" Start on move #1 immediately. If #1 is blocked by an owner task, start on the highest unblocked item. Tell the owner what's blocking #1 in one line, then proceed.

### STEP 4 — Commit-Ready Work Only
Every session must end with something pushable. No "I researched this" sessions.

### STEP 5 — Update CLAUDE.md Before Ending
Add what shipped to RECENTLY FIXED, move completed items from URGENT BUILD LIST to DONE, write the "NEXT ACTION" line for the next session.

**Why this exists:** Claude's default is reactive — answer the question, wait. This protocol converts "be aggressive" from an ignorable value into an enforceable procedure. Every step has a concrete deliverable. Skipping a step is observable.

## 2. AUTHORIZATION — WHAT REQUIRES OWNER'S EXPLICIT APPROVAL

**Claude MAY proceed without asking:**
- Bug fixes of any size
- New features that extend existing products
- New components, pages, API routes, database tables
- Dependency patch/minor updates
- Refactors that don't change architecture or public contracts
- CI/test/lint improvements
- Content, copy, SEO, documentation
- Security hardening
- Performance work
- Replacing mock/shell backends with real ones
- Anything listed in URGENT BUILD LIST below

**Claude MUST STOP and get explicit written authorization before:**
1. **Major version dependency upgrades** — framework majors, React majors, etc. (they break APIs)
2. **Removing or replacing a core product**
3. **Changing the framework, runtime, or primary database**
4. **Deleting any file > 100 lines without proof it is dead**
5. **Force-pushing to main, rewriting history, resetting branches, or deleting branches**
6. **Taking down or disabling payment flows, auth flows, or the production deployment**
7. **Signing up for new paid services (>$10/mo)**
8. **Touching production payment APIs, secrets, or customer data irreversibly**
9. **Reverting an IMPORTANT DECISION rule**
10. **Marketing claims, press releases, legal pages, ToS, privacy policy content**
11. **Creating a new GitHub repo, deploy project, or domain**

Default to asking if uncertain. Pause cost is zero; wrong-action cost is days.

**Only exception:** production is on fire, no time to wait. Fix, document, tell the owner.

## 3. AGGRESSION MANDATES — NON-NEGOTIABLE

### 3.1 Aggressive Software
- **Latest stable always.** Check `package.json` age every session. Upgrade anything >1 major behind stable.
- **No legacy fallbacks.** Old tech is DELETED when replaced, not kept "just in case."
- **No "we'll upgrade later."** Later is the graveyard.
- **TypeScript everywhere.** No JS files. No `any` without a one-line reason comment.

### 3.2 Aggressive Architecture
- **Streaming where it matters.** No user waits >3 seconds looking at a spinner without progress.
- **Fallback chains on every external call.** Single-provider failure must never take down a feature.
- **Every third-party fetch has `AbortSignal.timeout()`.**
- **Every destructive DB op is idempotent.** `ON CONFLICT DO UPDATE` with status guards.

### 3.3 Aggressive Quality
- **$100K+ agency quality or it doesn't ship.**
- **Mobile-first, WCAG AA, SEO by default.**
- **Every UI state shows a clear message.** Blank screens are forbidden. Every `catch` branch produces a user-visible error.

### 3.4 Aggressive Procedures
- **Every push passes CI locally first.** `npm run build` before `git push`. No exceptions.
- **Root cause only.** No patching. Trace full paths. Fix the cause.
- **Deep audit on every "broken" report.** Audit the full stack, fix ALL root causes in one commit.
- **NEVER ASK — JUST BUILD.** Only exception: the §2 authorization list.

## 4. FORBIDDEN ACTIONS — INSTANT HALT

Never allowed without the owner explicitly saying "do it":

1. `git push --force` to main
2. `git reset --hard` on shared branches
3. `rm -rf` outside the current working tree
4. Committing secrets, API keys, or `.env*` files
5. Skipping hooks (`--no-verify`) when they fail
6. Dropping database tables in production
7. Deleting customer data
8. Creating real charges on production payment APIs
9. Disabling tests, CI, or lint to make a push go through
10. Adding `// @ts-ignore` or `// eslint-disable` to hide errors
11. Reverting an IMPORTANT DECISION rule without authorization
12. Taking the production site offline
13. Replying to customers or press on behalf of the project

## 5. BEFORE EVERY COMMIT — THE CHECKLIST

```
[ ] THE IRON LAW consulted this session
[ ] Change is not on the §2 authorization list (or owner said yes)
[ ] `npm run build` passes
[ ] No new blank screens — every error path shows a message
[ ] No new silent catches — every catch logs AND surfaces
[ ] No new fetch without AbortSignal.timeout()
[ ] Commit message explains WHY, not just WHAT
[ ] CLAUDE.md updated if a decision was made or major task completed
```

---

## 🧭 SESSION PROTOCOL — EVERY NEW CLAUDE SESSION

**Mandatory opening ritual:**
1. Read THE IRON LAW.
2. Read LIVE REPO STATUS.
3. Run THE AGGRESSIVE OPENING PROTOCOL (§1.5).
4. Check the §2 authorization list.
5. Check KNOWN ISSUES — don't re-break something just fixed.
6. `git status` and `git log -5`.
7. Only then start work.

**Mandatory closing ritual:**
1. Build passes locally (`npm run build`).
2. All changes committed and pushed.
3. CLAUDE.md updated with decisions, issues, completed tasks.
4. NEXT ACTION line written for next session.
5. No half-finished features on disk.

## ⚖️ DECISION ESCALATION MATRIX

| Situation | Action |
|---|---|
| Bug found in existing feature | Fix it. Ship it. Log in RECENTLY FIXED. |
| New feature that extends existing product | Build it. Ship it. |
| Request matches URGENT BUILD LIST | Build it. Ship it. Mark completed. |
| Request conflicts with IMPORTANT DECISION rule | STOP. Ask owner. |
| Request is in §2 authorization list | STOP. Ask owner. |
| Production down, customers affected, no time | Fix immediately. Document after. |
| Uncertain whether authorized | Default to asking. |
| Security vulnerability | Fix immediately regardless of scope. |

---

# LIVE REPO STATUS — FILL THIS IN FOR YOUR PROJECT

## Last updated: {{DATE}} | Build: {{PASSING|FAILING}} | Branch: {{BRANCH}}

### QUICK FACTS
- **{{N}} pages** | **{{N}} API routes** | **{{N}} lib files**
- **Framework:** {{FRAMEWORK}}
- **Language:** {{LANGUAGE}}
- **Database:** {{DATABASE}}
- **Deploy:** {{DEPLOY_TARGET}}
- **Repo:** {{REPO_URL}}
- **Build command:** `{{BUILD_CMD}}`

### CORE PRODUCT STATUS

| Feature | Status | Key Files | What Works | What's Missing |
|---------|--------|-----------|------------|----------------|
| {{Feature A}} | {{WORKING/PARTIAL/SHELL}} | `path/to/file.ts` | | |
| {{Feature B}} | | | | |

### ENV VARS NEEDED

| Variable | For | Status |
|----------|-----|--------|
| {{VAR_NAME}} | {{purpose}} | {{SET/CHECK/NOT SET}} |

### WHAT TO BUILD NEXT (priority order)
1. {{Next task}}
2. ...

---

# IMPORTANT DECISIONS — DO NOT REVERT
## Project-specific locked rules. Add to this list over time. Never silently flip.

1. **{{Rule name}}** — {{rule and rationale}}
2. ...

---

# KNOWN ISSUES — QUEUED FOR FIX

| # | Issue | Severity | Found | Proposed Fix | Est. Effort |
|---|-------|----------|-------|-------------|-------------|
| 1 | | | | | |

# RECENTLY FIXED

| # | Issue | Fixed | What Was Done |
|---|-------|-------|---------------|
| 1 | | | |

---

# URGENT BUILD LIST

## TIER 0: THE ONLY THINGS THAT MAKE MONEY (do these FIRST)

| # | Task | Deadline | What "done" looks like | Status |
|---|------|----------|----------------------|--------|
| 0A | | | | |

## TIER 1: BUILD IMMEDIATELY

| # | Task | Why | Status |
|---|------|-----|--------|
| 1 | | | |

## TIER 2: BUILD THIS WEEK

| # | Task | Why | Status |
|---|------|-----|--------|
| 1 | | | |

## OWNER TASKS (manual, can't be automated)

| # | Task | Where | Status |
|---|------|-------|--------|
| C1 | | | |

---

# NEXT ACTION

{{One paragraph written at the end of every session describing exactly what the next session should pick up first. If the owner reads only this line, they know where to start.}}

---

# VIOLATIONS LOG

Each row = one IRON LAW violation. Claude MUST append to this log the moment a violation is identified.

| Date | Rule | What happened | Consequence |
|---|---|---|---|
| | | | |
