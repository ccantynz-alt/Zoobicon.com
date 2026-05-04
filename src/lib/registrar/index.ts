/**
 * Registrar Chain — Multi-Provider Fallback for Domain Operations
 *
 * Public entry point for the registrar abstraction. Callers should import
 * from here, not from individual provider files, so the wiring stays
 * configuration-driven:
 *
 *   import { registerWithFallback } from "@/lib/registrar";
 *   const result = await registerWithFallback({ domain, period, registrant });
 *   if (!result.success) {
 *     // result.attempts has every provider that was tried, with reason
 *   }
 *
 * Order is OpenSRS first, then CentralNic. Rationale:
 *  - OpenSRS is the existing live provider — if it works, we keep the
 *    same data flowing to the same registry, no surprises.
 *  - CentralNic is the failover. It activates the moment its env vars
 *    are set; until then it's skipped and the chain behaves identically
 *    to the previous OpenSRS-only path.
 *  - Future providers (ICANN-direct, OpenProvider, Realtime Register)
 *    drop into the PROVIDERS array below.
 *
 * Failure semantics:
 *  - If the FIRST configured provider succeeds → result.success = true.
 *  - If every configured provider fails → result.success = false,
 *    result.error = a flattened summary listing each provider's reason.
 *  - If NO provider is configured → result.success = false with a
 *    setup-instruction error. This is the only path that hits the
 *    503-equivalent ("registry not configured") behaviour callers
 *    previously got from `domain-reseller.ts` directly.
 */

import { openSRSRegistrar } from "./opensrs-adapter";
import { centralNicRegistrar } from "./centralnic";
import type {
  AvailabilityResult,
  ChainAttempt,
  ChainedRegistrationResult,
  DomainRegistrar,
  RegistrationRequest,
} from "./types";

export type {
  AvailabilityResult,
  ChainAttempt,
  ChainedRegistrationResult,
  ContactInfo,
  DomainRegistrar,
  RegistrationRequest,
  RegistrationResult,
} from "./types";

/**
 * Provider order. First match wins on success; failures fall through to
 * the next configured provider. Add new registrars here.
 */
export const PROVIDERS: DomainRegistrar[] = [
  openSRSRegistrar,
  centralNicRegistrar,
];

export function configuredProviders(): DomainRegistrar[] {
  return PROVIDERS.filter((p) => p.isConfigured());
}

/**
 * Register a domain across the chain. Skips providers that aren't
 * configured. Returns the first success, or a structured failure with
 * one entry per attempt so the caller can surface a useful error.
 */
export async function registerWithFallback(
  req: RegistrationRequest,
): Promise<ChainedRegistrationResult> {
  const attempts: ChainAttempt[] = [];
  const skipped: string[] = [];

  for (const provider of PROVIDERS) {
    if (!provider.isConfigured()) {
      skipped.push(provider.displayName);
      continue;
    }

    const startedAt = Date.now();
    let result;
    try {
      result = await provider.registerDomain(req);
    } catch (err) {
      result = {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        source: provider.name,
      };
    }
    const durationMs = Date.now() - startedAt;
    attempts.push({
      provider: provider.name,
      success: result.success,
      error: result.error,
      durationMs,
    });

    if (result.success) {
      return { ...result, attempts };
    }
    console.warn(
      `[registrar-chain] ${provider.displayName} failed for ${req.domain}: ${result.error}. ` +
        `Trying next provider.`,
    );
  }

  // Every configured provider failed (or none was configured).
  if (attempts.length === 0) {
    return {
      success: false,
      error:
        `No domain registrar is configured. Set OPENSRS_API_KEY + OPENSRS_RESELLER_USER ` +
        `(OPENSRS_ENV=live) or CENTRALNIC_API_KEY in Vercel → Project → Environment Variables, ` +
        `then redeploy.${skipped.length ? ` Providers checked: ${skipped.join(", ")}.` : ""}`,
      source: "chain",
      attempts,
    };
  }

  const summary = attempts
    .map((a) => `${a.provider}=${a.error || "unknown"}`)
    .join(" · ");
  return {
    success: false,
    error: `All registrars failed: ${summary}`,
    source: "chain",
    attempts,
  };
}

/**
 * Look up availability across providers, stopping at the first definitive
 * answer. Used by routes that want a registrar-quoted price (CentralNic
 * returns wholesale prices in CheckDomain) rather than just an RDAP
 * yes/no. RDAP-only callers should keep using `checkWithFallback` from
 * `lib/opensrs.ts` — it's faster.
 */
export async function checkAvailabilityWithFallback(
  domain: string,
): Promise<AvailabilityResult> {
  const attempts: string[] = [];
  for (const provider of PROVIDERS) {
    if (!provider.isConfigured()) continue;
    let result: AvailabilityResult;
    try {
      result = await provider.checkAvailability(domain);
    } catch (err) {
      result = {
        domain,
        available: null,
        source: `${provider.name} (threw: ${err instanceof Error ? err.message : "unknown"})`,
      };
    }
    attempts.push(result.source);
    if (result.available !== null) return result;
  }
  return {
    domain,
    available: null,
    source: attempts.length ? `chain failed: ${attempts.join(" → ")}` : "no providers configured",
  };
}
