/**
 * Resilience Layer — Bulletproof Error Handling
 *
 * Double-layer protection: every external API call goes through this.
 * Customer NEVER sees raw errors. Either it works, or it fails gracefully.
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Circuit breaker (stops hammering a dead service)
 * - Fallback responses (degraded mode > error mode)
 * - Error sanitization (internal details never leak to customer)
 * - Request timeout enforcement
 * - Rate limiting protection
 * - Full error logging for admin debugging
 */

// ─── Error Sanitization ──────────────────────────────────
// NEVER expose internal errors to customers

const CUSTOMER_MESSAGES: Record<string, string> = {
  NETWORK: "We're having trouble connecting right now. Please try again in a moment.",
  TIMEOUT: "This is taking longer than expected. Please try again.",
  RATE_LIMIT: "We're handling a lot of requests right now. Please wait a moment and try again.",
  PROVIDER_DOWN: "This service is temporarily unavailable. We're on it — please try again shortly.",
  VALIDATION: "Please check your input and try again.",
  AUTH: "Please sign in to continue.",
  NOT_FOUND: "The resource you're looking for doesn't exist.",
  PAYMENT: "There was an issue processing your payment. Please try again or contact support.",
  UNKNOWN: "Something unexpected happened. Please try again. If this continues, contact support.",
};

export type ErrorCategory = keyof typeof CUSTOMER_MESSAGES;

export class SafeError extends Error {
  public readonly category: ErrorCategory;
  public readonly customerMessage: string;
  public readonly internalMessage: string;
  public readonly statusCode: number;
  public readonly retryable: boolean;

  constructor(opts: {
    category: ErrorCategory;
    internalMessage: string;
    statusCode?: number;
    retryable?: boolean;
  }) {
    const customerMessage = CUSTOMER_MESSAGES[opts.category] || CUSTOMER_MESSAGES.UNKNOWN;
    super(customerMessage);
    this.category = opts.category;
    this.customerMessage = customerMessage;
    this.internalMessage = opts.internalMessage;
    this.statusCode = opts.statusCode || 500;
    this.retryable = opts.retryable ?? false;
  }
}

/**
 * Classify a raw error into a safe category.
 * Logs the real error internally, returns a clean customer-facing error.
 */
export function classifyError(err: unknown): SafeError {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  if (lower.includes("fetch failed") || lower.includes("econnrefused") || lower.includes("enotfound") || lower.includes("network")) {
    return new SafeError({ category: "NETWORK", internalMessage: msg, retryable: true });
  }
  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("deadline")) {
    return new SafeError({ category: "TIMEOUT", internalMessage: msg, retryable: true });
  }
  if (lower.includes("429") || lower.includes("rate limit") || lower.includes("too many")) {
    return new SafeError({ category: "RATE_LIMIT", internalMessage: msg, statusCode: 429, retryable: true });
  }
  if (lower.includes("401") || lower.includes("403") || lower.includes("unauthorized") || lower.includes("forbidden")) {
    return new SafeError({ category: "AUTH", internalMessage: msg, statusCode: 401 });
  }
  if (lower.includes("404") || lower.includes("not found")) {
    return new SafeError({ category: "NOT_FOUND", internalMessage: msg, statusCode: 404 });
  }
  if (lower.includes("payment") || lower.includes("card") || lower.includes("stripe")) {
    return new SafeError({ category: "PAYMENT", internalMessage: msg, statusCode: 402 });
  }
  if (lower.includes("invalid") || lower.includes("required") || lower.includes("missing") || lower.includes("validation")) {
    return new SafeError({ category: "VALIDATION", internalMessage: msg, statusCode: 400 });
  }

  return new SafeError({ category: "UNKNOWN", internalMessage: msg });
}

// ─── Retry with Exponential Backoff ──────────────────────

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
  onRetry?: (attempt: number, error: unknown) => void;
}

export async function withRetry<T>(
  fn: (signal?: AbortSignal) => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 500, maxDelayMs = 10000, timeoutMs = 30000, onRetry } = opts;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Enforce timeout
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const result = await fn(controller.signal);
        clearTimeout(timer);
        return result;
      } catch (err) {
        clearTimeout(timer);
        throw err;
      }
    } catch (err) {
      const safe = classifyError(err);

      // Don't retry non-retryable errors
      if (!safe.retryable || attempt === maxRetries) {
        throw safe;
      }

      // Exponential backoff with jitter
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt) + Math.random() * 200, maxDelayMs);
      onRetry?.(attempt + 1, err);
      console.warn(`[Resilience] Retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms: ${safe.internalMessage}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  // Should never reach here, but just in case
  throw new SafeError({ category: "UNKNOWN", internalMessage: "Max retries exhausted" });
}

// ─── Circuit Breaker ─────────────────────────────────────
// Stops calling a service that's clearly down

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: "closed" | "open" | "half-open";
}

const circuits = new Map<string, CircuitBreakerState>();

const CIRCUIT_THRESHOLD = 5;        // Open after 5 consecutive failures
const CIRCUIT_RESET_MS = 60_000;    // Try again after 60 seconds

export function getCircuitState(service: string): CircuitBreakerState {
  if (!circuits.has(service)) {
    circuits.set(service, { failures: 0, lastFailure: 0, state: "closed" });
  }
  const state = circuits.get(service)!;

  // Auto-recover: if enough time has passed, move to half-open
  if (state.state === "open" && Date.now() - state.lastFailure > CIRCUIT_RESET_MS) {
    state.state = "half-open";
  }

  return state;
}

export function recordSuccess(service: string) {
  const state = getCircuitState(service);
  state.failures = 0;
  state.state = "closed";
}

export function recordFailure(service: string) {
  const state = getCircuitState(service);
  state.failures++;
  state.lastFailure = Date.now();
  if (state.failures >= CIRCUIT_THRESHOLD) {
    state.state = "open";
    console.error(`[CircuitBreaker] ${service} OPEN — ${state.failures} consecutive failures`);
  }
}

export function isCircuitOpen(service: string): boolean {
  return getCircuitState(service).state === "open";
}

/**
 * Execute a function with circuit breaker protection.
 * If the circuit is open, immediately returns the fallback.
 */
export async function withCircuitBreaker<T>(
  service: string,
  fn: () => Promise<T>,
  fallback: T | (() => T | Promise<T>),
): Promise<T> {
  const state = getCircuitState(service);

  if (state.state === "open") {
    console.warn(`[CircuitBreaker] ${service} is OPEN — using fallback`);
    return typeof fallback === "function" ? (fallback as () => T | Promise<T>)() : fallback;
  }

  try {
    const result = await fn();
    recordSuccess(service);
    return result;
  } catch (err) {
    recordFailure(service);
    console.error(`[CircuitBreaker] ${service} failed (${state.failures}/${CIRCUIT_THRESHOLD}):`, err);

    // If circuit just opened, use fallback
    if (state.failures >= CIRCUIT_THRESHOLD) {
      return typeof fallback === "function" ? (fallback as () => T | Promise<T>)() : fallback;
    }
    throw err;
  }
}

// ─── Safe API Handler Wrapper ────────────────────────────
// Wraps any API route handler with full protection

import { NextResponse } from "next/server";

export function safeApiResponse(error: unknown): NextResponse {
  const safe = error instanceof SafeError ? error : classifyError(error);

  // Log the real error for admin debugging
  console.error(`[API Error] ${safe.category}: ${safe.internalMessage}`);

  // Return clean customer-facing error
  return NextResponse.json(
    {
      success: false,
      error: safe.customerMessage,
      code: safe.category,
      retryable: safe.retryable,
    },
    { status: safe.statusCode },
  );
}

/**
 * Wrap an async handler so it never throws an unhandled error.
 * The customer always gets a clean JSON response.
 */
export function safeHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
): (...args: T) => Promise<NextResponse> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (err) {
      return safeApiResponse(err);
    }
  };
}

// ─── Validation Helpers ──────────────────────────────────

export function requireField(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  if (!value || (typeof value === "string" && !value.trim())) {
    throw new SafeError({
      category: "VALIDATION",
      internalMessage: `Missing required field: ${field}`,
      statusCode: 400,
    });
  }
  return String(value);
}

export function requireEmail(body: Record<string, unknown>, field = "email"): string {
  const value = requireField(body, field);
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(value)) {
    throw new SafeError({
      category: "VALIDATION",
      internalMessage: `Invalid email format: ${value}`,
      statusCode: 400,
    });
  }
  return value;
}

// ─── Health Check Types ──────────────────────────────────

export interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "down";
  latencyMs?: number;
  lastChecked: string;
  error?: string;
  circuitState: "closed" | "open" | "half-open";
}

/**
 * Check health of a service by calling a lightweight endpoint.
 */
export async function checkServiceHealth(
  name: string,
  checkFn: () => Promise<void>,
  timeoutMs = 5000,
): Promise<ServiceHealth> {
  const start = Date.now();
  const circuit = getCircuitState(name);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    await checkFn();
    clearTimeout(timer);

    return {
      name,
      status: circuit.state === "half-open" ? "degraded" : "healthy",
      latencyMs: Date.now() - start,
      lastChecked: new Date().toISOString(),
      circuitState: circuit.state,
    };
  } catch (err) {
    return {
      name,
      status: circuit.state === "open" ? "down" : "degraded",
      latencyMs: Date.now() - start,
      lastChecked: new Date().toISOString(),
      error: err instanceof Error ? err.message : String(err),
      circuitState: circuit.state,
    };
  }
}

// ─── Export All ──────────────────────────────────────────

export { CUSTOMER_MESSAGES };
