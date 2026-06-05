#!/bin/bash
# ─────────────────────────────────────────────────────────────────────
# Zoobicon DEEP AUDIT — catch broken code BEFORE it ships.
#
# Why this exists (Craig, 2026-06-05): "we seem to fix one thing and then
# find out after everything's pushed that there's another thing broken —
# are we not able to run a deep audit?"
#
# Root cause of the whack-a-mole: next.config.js has
# `ignoreBuildErrors: true` + `ignoreDuringBuilds: true`, so `npm run
# build` passes even with TypeScript errors, broken imports, and lint
# failures. A green build proves almost nothing. This script runs the
# gates the build SKIPS and separates real, ship-breaking problems from
# low-severity strictness noise.
#
# Usage:   bash scripts/deep-audit.sh
# Exit:    0 = no CRITICAL issues; 1 = CRITICAL issues found (do not push)
#
# CRITICAL (blocks push — these crash production):
#   - next build fails (syntax / unresolved import)
#   - check-icons fails (invalid lucide import → build error)
#   - TS2305 / TS2307 in src/  (imports a name/module that doesn't exist —
#     resolves to `undefined` at runtime → "X is not a function" crash.
#     This is the EXACT bug that broke /api/scaffold etc.)
#   - crypto.subtle used in the in-browser preview runtime (throws inside
#     srcdoc iframes on iOS Safari → blank preview. The months-long bug.)
#
# WARNING (reported, not blocking — a backlog to burn down):
#   - other TypeScript errors in ship code (null checks, type mismatches)
#   - test failures
#   - @ts-ignore / eslint-disable (errors hidden instead of fixed)
# ─────────────────────────────────────────────────────────────────────
set -uo pipefail
cd "$(dirname "$0")/.."

bold() { printf "\033[1m%s\033[0m\n" "$1"; }
red()  { printf "\033[31m%s\033[0m\n" "$1"; }
grn()  { printf "\033[32m%s\033[0m\n" "$1"; }
ylw()  { printf "\033[33m%s\033[0m\n" "$1"; }
CRIT=0
WARN=0
TMP="$(mktemp -d)"

echo "═══════════════════════════════════════════════════════════════"
bold "  ZOOBICON DEEP AUDIT — $(date)"
echo "  Running the gates that 'npm run build' silently skips."
echo "═══════════════════════════════════════════════════════════════"

# ── 1. Icon validation (cheap, catches a top recurring build error) ──
bold "[1/5] Icon imports (lucide-react)"
if node scripts/check-icons.js > "$TMP/icons.log" 2>&1; then
  grn "  ✓ all icon imports valid"
else
  red "  ✗ CRITICAL: invalid lucide-react import(s) — would break the build"
  tail -5 "$TMP/icons.log" | sed 's/^/    /'
  CRIT=$((CRIT + 1))
fi

# ── 2. TypeScript typecheck (the gate the build IGNORES) ──
bold "[2/5] TypeScript typecheck (tsc --noEmit)"
npx tsc --noEmit > "$TMP/tsc.log" 2>&1 || true
TS_TOTAL=$(grep -c 'error TS' "$TMP/tsc.log" || true)
# Broken imports in shipping code = runtime crashes. This is the critical class.
BROKEN_IMPORTS=$(grep 'error TS' "$TMP/tsc.log" | grep -E '^src/' | grep -E 'TS2305|TS2307' || true)
BROKEN_COUNT=$(printf "%s" "$BROKEN_IMPORTS" | grep -c . || true)
SHIP_TS=$(grep 'error TS' "$TMP/tsc.log" | grep -cE '^src/(app|components|lib)/' || true)
echo "    total type errors: $TS_TOTAL   |   in ship code (src/app,components,lib): $SHIP_TS"
if [ "$BROKEN_COUNT" -gt 0 ]; then
  red "  ✗ CRITICAL: $BROKEN_COUNT broken import(s) in src/ — these crash at runtime:"
  printf "%s\n" "$BROKEN_IMPORTS" | sed 's/^/    /'
  CRIT=$((CRIT + 1))
else
  grn "  ✓ no broken imports (TS2305/TS2307) in src/"
fi
if [ "$SHIP_TS" -gt 0 ]; then
  ylw "  ⚠ $SHIP_TS non-critical type error(s) in ship code (backlog — burn down):"
  grep 'error TS' "$TMP/tsc.log" | grep -E '^src/(app|components|lib)/' | grep -vE 'TS2305|TS2307' | head -8 | sed 's/^/    /'
  WARN=$((WARN + 1))
fi

# ── 3. Runtime footguns (won't show in a build OR typecheck) ──
bold "[3/5] Runtime footguns (browser-only / SDK pitfalls)"
# crypto.subtle inside the preview runtime = blank preview on iOS Safari.
CRYPTO_HITS=$(grep -rnE 'crypto\.subtle' src/components/ 2>/dev/null | grep -vE '//|/\*|\*' || true)
if [ -n "$CRYPTO_HITS" ]; then
  red "  ✗ CRITICAL: crypto.subtle in a client component (throws in srcdoc iframes on iOS Safari):"
  printf "%s\n" "$CRYPTO_HITS" | sed 's/^/    /'
  CRIT=$((CRIT + 1))
else
  grn "  ✓ no crypto.subtle in client components"
fi
# Anthropic SDK: response.content[0] assumes a text block (CLAUDE.md rule).
CONTENT0=$(grep -rnE '\.content\[0\]' src/ 2>/dev/null | grep -vE '//' | wc -l | tr -d ' ')
[ "$CONTENT0" -gt 0 ] && { ylw "  ⚠ $CONTENT0 use(s) of .content[0] (use .find(b => b.type==='text') instead)"; WARN=$((WARN + 1)); } || grn "  ✓ no .content[0] patterns"
# Hidden errors.
SUPPRESS=$(grep -rnE '@ts-ignore|eslint-disable' src/ 2>/dev/null | wc -l | tr -d ' ')
[ "$SUPPRESS" -gt 0 ] && ylw "  ⚠ $SUPPRESS @ts-ignore/eslint-disable (errors hidden, not fixed)" || grn "  ✓ no @ts-ignore/eslint-disable in src/"

# ── 4. Tests ──
bold "[4/5] Test suite (vitest)"
npm run test > "$TMP/test.log" 2>&1 || true
TEST_LINE=$(grep -E '^[[:space:]]*Tests[[:space:]]' "$TMP/test.log" | tail -1)
FILE_LINE=$(grep -E '^[[:space:]]*Test Files[[:space:]]' "$TMP/test.log" | tail -1)
echo "    ${FILE_LINE:-Test Files: ?}"
echo "    ${TEST_LINE:-Tests: ?}"
if echo "$TEST_LINE" | grep -q 'failed'; then
  ylw "  ⚠ test failures present (backlog):"
  grep -E '×|FAIL ' "$TMP/test.log" | head -8 | sed 's/^/    /'
  WARN=$((WARN + 1))
else
  grn "  ✓ all tests pass"
fi

# ── 5. Production build (the hard deploy gate) ──
bold "[5/5] Production build (next build)"
if npm run build > "$TMP/build.log" 2>&1; then
  PAGES=$(grep -oE 'Generating static pages \([0-9]+/[0-9]+\)' "$TMP/build.log" | tail -1)
  grn "  ✓ build succeeded   ${PAGES}"
else
  red "  ✗ CRITICAL: build FAILED — production cannot deploy"
  grep -E 'Failed to compile|Syntax Error|Error:' "$TMP/build.log" | head -8 | sed 's/^/    /'
  CRIT=$((CRIT + 1))
fi

# ── Verdict ──
echo "═══════════════════════════════════════════════════════════════"
if [ "$CRIT" -gt 0 ]; then
  red "  VERDICT: $CRIT CRITICAL issue group(s) — DO NOT PUSH until fixed."
  echo "  ($WARN warning group(s) logged as backlog.)"
  echo "═══════════════════════════════════════════════════════════════"
  rm -rf "$TMP"
  exit 1
else
  grn "  VERDICT: no critical issues. Safe to push."
  [ "$WARN" -gt 0 ] && ylw "  ($WARN warning group(s) — backlog to burn down, not blocking.)"
  echo "═══════════════════════════════════════════════════════════════"
  rm -rf "$TMP"
  exit 0
fi
