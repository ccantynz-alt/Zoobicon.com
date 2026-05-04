/**
 * OpenSRS / Tucows Adapter
 *
 * Thin wrapper that adapts the existing `src/lib/domain-reseller.ts`
 * (registration) and `src/lib/opensrs.ts` (availability via RDAP +
 * OpenSRS LOOKUP) to the provider-agnostic `DomainRegistrar` interface.
 *
 * No business logic lives here — every call delegates to the existing
 * helpers so the OpenSRS hot path is untouched and the live customer's
 * registration flow keeps working bit-for-bit identically.
 *
 * Why a separate adapter file:
 *  - Keeps the new abstraction additive. Nothing in domain-reseller.ts
 *    or opensrs.ts changes shape, so callers that import them directly
 *    keep working.
 *  - Lets us swap implementations later (for example, when ICANN
 *    accreditation lands and we go direct-to-Verisign for .com) without
 *    touching the chain logic.
 */

import {
  registerDomain as registerOpenSRS,
  type DomainRegistration,
} from "@/lib/domain-reseller";
import { checkWithFallback, isOpenSRSConfigured } from "@/lib/opensrs";
import type {
  AvailabilityResult,
  DomainRegistrar,
  RegistrationRequest,
  RegistrationResult,
} from "./types";

// OpenSRS supports basically every gTLD and most ccTLDs. We use "*" so
// the chain always offers OpenSRS first regardless of the TLD requested.
const SUPPORTED: "*" = "*";

export const openSRSRegistrar: DomainRegistrar = {
  name: "opensrs",
  displayName: "Tucows / OpenSRS",
  supportedTlds: SUPPORTED,

  isConfigured(): boolean {
    return isOpenSRSConfigured() && process.env.OPENSRS_ENV === "live";
  },

  async checkAvailability(domain: string): Promise<AvailabilityResult> {
    try {
      const available = await checkWithFallback(domain);
      return {
        domain,
        available,
        source: available === null ? "opensrs+rdap (uncertain)" : "opensrs+rdap",
      };
    } catch (err) {
      return {
        domain,
        available: null,
        source: "opensrs (error)",
        // Surface the reason in the source field so the chain logger
        // can attribute the failure when the next provider takes over.
        currency: undefined,
        wholesalePrice: undefined,
        ...(err instanceof Error ? { error: err.message } : {}),
      } as AvailabilityResult;
    }
  },

  async registerDomain(req: RegistrationRequest): Promise<RegistrationResult> {
    try {
      const dr: DomainRegistration = {
        domain: req.domain,
        period: req.period,
        registrant: req.registrant,
        nameservers: req.nameservers,
        autoRenew: req.autoRenew,
        privacyProtection: req.privacyProtection,
      };
      const result = await registerOpenSRS(dr);
      return {
        success: result.success,
        orderId: result.orderId,
        error: result.error,
        source: "opensrs",
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        source: "opensrs",
      };
    }
  },
};
