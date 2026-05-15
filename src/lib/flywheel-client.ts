/**
 * Flywheel client-side event flusher — KILLER-MOVES-BUILDER.md #B26c.
 *
 * Captures every meaningful user interaction in the builder and
 * batch-flushes to /api/flywheel/capture so the server-side flywheel
 * has real data to mine.
 *
 * Buffer + flush strategy:
 *   - Events accumulate in a module-local queue
 *   - Flushed on a 2-second debounce after any event, OR
 *   - Flushed on page-unload via navigator.sendBeacon (best-effort)
 *   - Flushed on explicit flush() call (e.g. before navigation)
 *   - Buffer capped at 200 — exceeding cap forces immediate flush
 *
 * Each flush is one HTTP request, not N. Even an active typing session
 * (5-15 events/sec) generates < 1 request/second.
 *
 * Session id: stored in sessionStorage so it survives across builds
 * within the same browser tab — lets the server stitch "user tried
 * 3 prompts before deploying" into a single session.
 */

const ENDPOINT = "/api/flywheel/capture";
const FLUSH_DEBOUNCE_MS = 2000;
const FLUSH_HARD_CAP = 200;
const SESSION_STORAGE_KEY = "zoobicon_flywheel_session";

type FlywheelEventType =
  | "prompt_typing"
  | "prompt_submit"
  | "components_picked"
  | "build_complete"
  | "build_failed"
  | "edit_request"
  | "edit_complete"
  | "preview_dwell"
  | "regenerate"
  | "deploy";

interface QueuedEvent {
  buildId: string;
  sessionId: string;
  type: FlywheelEventType;
  payload: Record<string, unknown>;
}

let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let unloadBound = false;

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      id = `s-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return `s-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}

function bindUnload(): void {
  if (unloadBound || typeof window === "undefined") return;
  unloadBound = true;
  // beforeunload is the standard fire-and-forget point. sendBeacon
  // is the right transport — survives the page-tear-down race.
  window.addEventListener("beforeunload", () => {
    flushSync();
  });
  // pagehide handles mobile + bfcache navigation more reliably.
  window.addEventListener("pagehide", () => {
    flushSync();
  });
}

/**
 * Capture an event. Cheap: just enqueues + schedules a debounced flush.
 */
export function captureFlywheelEvent(
  buildId: string,
  type: FlywheelEventType,
  payload: Record<string, unknown> = {},
): void {
  if (!buildId) return;
  bindUnload();

  queue.push({
    buildId,
    sessionId: getSessionId(),
    type,
    payload,
  });

  if (queue.length >= FLUSH_HARD_CAP) {
    void flushAsync();
    return;
  }

  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    void flushAsync();
  }, FLUSH_DEBOUNCE_MS);
}

/**
 * Async flush — used by the debounced path. Failures are silently
 * retried on the next flush (the queue is drained only after a
 * successful response).
 */
async function flushAsync(): Promise<void> {
  if (queue.length === 0) return;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  const batch = queue.slice();
  queue = [];
  try {
    const userEmail = readUserEmail();
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(userEmail ? { "x-user-email": userEmail } : {}),
      },
      body: JSON.stringify({ events: batch }),
      // Don't block the UI on this — fire-and-forget intent.
      keepalive: true,
    });
    if (!res.ok) {
      // Re-queue the events for the next flush attempt.
      queue.unshift(...batch);
    }
  } catch {
    // Network error — keep the events for the next flush.
    queue.unshift(...batch);
  }
}

/**
 * Sync flush via sendBeacon — used on page-unload. Fire-and-forget.
 * If sendBeacon isn't available (older browsers), drops silently.
 */
function flushSync(): void {
  if (queue.length === 0) return;
  if (typeof navigator === "undefined" || !navigator.sendBeacon) return;
  const batch = queue.slice();
  queue = [];
  try {
    const body = JSON.stringify({ events: batch });
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(ENDPOINT, blob);
  } catch {
    // Last-resort path — best effort only.
  }
}

function readUserEmail(): string | null {
  try {
    const raw = window.localStorage.getItem("zoobicon_user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    return typeof u?.email === "string" ? u.email : null;
  } catch {
    return null;
  }
}

/** Force-flush — call before navigation or explicit checkpoints. */
export function flushFlywheel(): Promise<void> {
  return flushAsync();
}

/** Reset the in-memory queue (for tests). */
export function _resetFlywheelClient(): void {
  queue = [];
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;
}
