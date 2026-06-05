#!/bin/bash
# ─────────────────────────────────────────────────────────────────────
# Zoobicon Production Smoke Tests
# Runs against the LIVE site to verify critical endpoints actually work.
# Usage: ./scripts/smoke-test.sh [base_url]
# Default: https://zoobicon.com
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE="${1:-https://zoobicon.com}"
PASS=0
FAIL=0
WARN=0
FAILURES=""

green() { echo -e "\033[32m✓ $1\033[0m"; }
red() { echo -e "\033[31m✗ $1\033[0m"; }
yellow() { echo -e "\033[33m⚠ $1\033[0m"; }

# Check HTTP status of a page.
# -L follows redirects: the apex domain issues a benign 307 to the canonical
# host (browsers follow it transparently), so without -L every path falsely
# reported 307. We want the FINAL status after redirects.
check_page() {
  local path="$1"
  local expected="${2:-200}"
  local status
  status=$(curl -sL -o /dev/null -w "%{http_code}" --max-time 15 "$BASE$path" 2>/dev/null || echo "000")
  if [ "$status" = "$expected" ]; then
    green "$path → HTTP $status"
    PASS=$((PASS + 1))
  else
    red "$path → HTTP $status (expected $expected)"
    FAIL=$((FAIL + 1))
    FAILURES="$FAILURES\n  - $path: HTTP $status"
  fi
}

# Check API endpoint returns valid JSON with expected field
check_api() {
  local path="$1"
  local field="$2"
  local label="${3:-$path}"
  local response
  response=$(curl -sfL --max-time 15 "$BASE$path" 2>/dev/null || echo "CURL_FAILED")
  if [ "$response" = "CURL_FAILED" ]; then
    red "$label → Connection failed"
    FAIL=$((FAIL + 1))
    FAILURES="$FAILURES\n  - $label: Connection failed"
    return
  fi
  if echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); assert $field" 2>/dev/null; then
    green "$label → OK"
    PASS=$((PASS + 1))
  else
    red "$label → Missing expected field: $field"
    FAIL=$((FAIL + 1))
    FAILURES="$FAILURES\n  - $label: Bad response"
  fi
}

# Check API returns specific JSON value
check_api_value() {
  local path="$1"
  local jq_filter="$2"
  local expected="$3"
  local label="${4:-$path}"
  local response
  response=$(curl -sfL --max-time 15 "$BASE$path" 2>/dev/null || echo "")
  if [ -z "$response" ]; then
    red "$label → No response"
    FAIL=$((FAIL + 1))
    FAILURES="$FAILURES\n  - $label: No response"
    return
  fi
  local actual
  actual=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin)$jq_filter)" 2>/dev/null || echo "PARSE_ERROR")
  if [ "$actual" = "$expected" ]; then
    green "$label → $expected"
    PASS=$((PASS + 1))
  else
    red "$label → Got '$actual', expected '$expected'"
    FAIL=$((FAIL + 1))
    FAILURES="$FAILURES\n  - $label: Got '$actual', expected '$expected'"
  fi
}

echo "═══════════════════════════════════════════════════"
echo "  ZOOBICON SMOKE TESTS — $BASE"
echo "  $(date)"
echo "═══════════════════════════════════════════════════"
echo ""

# ── Critical Pages (must load) ──
# Updated 2026-06-05 — matches post-Rule-32 scope (AI Builder only).
# Removed: /domains + /tools (Rule 32 deleted the standalone domain
# search page and the 12 free-tool pages — they now 404). Removed
# /admin (internal, URL-only; not a public smoke target and its
# unauthenticated status is non-deterministic). Kept the genuinely
# public product surface. /auth/* are editorial-light Crontech-SSO
# stub pages (200 OK).
echo "── Pages ──"
check_page "/"
check_page "/builder"
check_page "/pricing"
check_page "/upgrade"
check_page "/auth/login"
check_page "/auth/signup"
echo ""

# ── API Health Checks ──
echo "── API Health ──"
check_api_value "/api/health" "['status']" "healthy" "Health endpoint"
echo ""

# ── Domain Search (core product) ──
echo "── Domain Search ──"
check_api "/api/domains/search?q=example123test.com" "'results' in d or 'available' in d or 'domains' in d" "Domain search API"
echo ""

# ── Builder Generation (core product) ──
echo "── Builder API ──"
# GET returns 405 because the endpoint is POST-only — proves the
# route exists + auth middleware lets it through.
check_page "/api/generate/react-stream" "405"
# Post-build static validator — same Method-Not-Allowed check.
check_page "/api/builds/validate" "405"
echo ""

# ── Crontech-delegated surfaces ──
# These previously checked /api/auth/* (deleted in Rule 31, Crontech
# owns SSO) and /api/video-creator/* (deleted in Rule 19). No
# replacements needed at this layer — Crontech tests its own surface.
echo ""

# ── Summary ──
TOTAL=$((PASS + FAIL))
echo ""
echo "═══════════════════════════════════════════════════"
if [ "$FAIL" -eq 0 ]; then
  green "ALL $TOTAL TESTS PASSED"
else
  red "$FAIL/$TOTAL TESTS FAILED"
  echo -e "\nFailures:$FAILURES"
fi
echo "═══════════════════════════════════════════════════"

# Exit with failure if any tests failed
[ "$FAIL" -eq 0 ] || exit 1
