/**
 * Domain Registrar Abstraction — Provider-Agnostic Interface
 *
 * Until now the registration path called OpenSRS directly via
 * `src/lib/domain-reseller.ts`. If OpenSRS goes down, has a quota
 * problem, or refuses a TLD it doesn't support, we have no fallback
 * and customers can't register.
 *
 * Per CLAUDE.md §3.2 ("Fallback chains on every external call"), every
 * outbound provider must have at least one alternative. This module
 * defines the shared interface so OpenSRS, CentralNic, and any future
 * registrar all look the same to callers — and the chain helper in
 * `index.ts` walks providers until one succeeds.
 *
 * Design notes:
 *  - `isConfigured()` is synchronous and cheap. The chain skips
 *    unconfigured providers without making a network call.
 *  - `checkAvailability` returns `available: null` when the provider
 *    can't determine availability (timeout, rate limit). Callers can
 *    then ask the next provider rather than treating null as taken.
 *  - `registerDomain` returns `success: false` with `error` populated
 *    on failure. The chain captures the error from each provider so
 *    the final user-visible error can list every attempt.
 */

export interface ContactInfo {
  firstName: string;
  lastName: string;
  organization?: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string; // ISO 3166-1 alpha-2
}

export interface RegistrationRequest {
  domain: string;
  period: number; // years
  registrant: ContactInfo;
  nameservers?: string[];
  autoRenew?: boolean;
  privacyProtection?: boolean;
}

export interface AvailabilityResult {
  domain: string;
  /** true=free, false=taken, null=unknown (timeout / rate-limit / unsupported TLD) */
  available: boolean | null;
  premium?: boolean;
  /** Wholesale price as quoted by the provider, when known. Caller decides retail markup. */
  wholesalePrice?: number;
  currency?: string;
  source: string; // "opensrs", "centralnic", "rdap-fallback", etc
}

export interface RegistrationResult {
  success: boolean;
  orderId?: string;
  error?: string;
  source: string;
}

export interface DomainRegistrar {
  /** Stable provider identifier, lowercase. Used in logs and source fields. */
  readonly name: string;
  /** Human-readable label for error messages. */
  readonly displayName: string;
  /** True if all required env vars are set. Cheap check, no network. */
  isConfigured(): boolean;
  /** Comma-separated list of TLDs this provider supports, or "*" for all. */
  readonly supportedTlds: string[] | "*";
  /** Look up availability for a single FQDN. Must not throw — return source: "name" with available: null on internal error. */
  checkAvailability(domain: string): Promise<AvailabilityResult>;
  /** Register a domain. Must not throw — return success: false with error populated on failure. */
  registerDomain(req: RegistrationRequest): Promise<RegistrationResult>;
}

export interface ChainAttempt {
  provider: string;
  success: boolean;
  error?: string;
  durationMs: number;
}

export interface ChainedRegistrationResult extends RegistrationResult {
  attempts: ChainAttempt[];
}
