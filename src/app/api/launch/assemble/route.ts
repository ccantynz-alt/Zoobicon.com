import { NextRequest, NextResponse } from "next/server";
import type { LaunchPlan } from "../plan/route";

/**
 * POST /api/launch/assemble
 *
 * Rung 3 — second step. Takes the plan returned by /api/launch/plan plus
 * the domain the user chose, fans out to Agent B (trademark-global) +
 * Agent C (valuation) + /api/domains/search, and returns a consolidated
 * "launch kit" the /launch page renders as a card set with CTAs.
 *
 * Contract:
 *   Request body:
 *     {
 *       prompt: string,
 *       chosenDomain: string,        // e.g. "auromax.com"
 *       plan: LaunchPlan             // as returned by /api/launch/plan
 *     }
 *   Success 200: LaunchKit
 *   Bad input  : 400 { error }
 *
 * Resilience: every downstream call is `Promise.allSettled` with a 25s
 * AbortController timeout. One enrichment failing (trademark API down,
 * valuation timeout) must NOT block the other two — the UI renders the
 * parts that succeeded and shows "unavailable" on the parts that didn't.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const FETCH_TIMEOUT_MS = 25_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NullableString = string | null;

interface DomainAvailability {
  available: boolean | null;
  price: number | null;
  tld: string;
  confidence: "high" | "low" | "unknown";
  unavailableReason?: string;
}

interface TrademarkSummary {
  status: "clear" | "conflict" | "unknown" | "unavailable";
  registries_checked: string[];
  conflictCount: number;
  notes: NullableString;
  unavailableReason?: string;
}

interface ValuationSummary {
  low: number | null;
  high: number | null;
  midpoint: number | null;
  confidence: "low" | "medium" | "high" | "unknown";
  factors: string[];
  unavailableReason?: string;
}

interface NextStep {
  action: "build-site" | "create-video" | "buy-domain" | "connect-email";
  href: string;
  label: string;
  description: string;
}

interface LaunchKit {
  domain: {
    name: string;
    availability: DomainAvailability;
    trademark: TrademarkSummary;
    valuation: ValuationSummary;
  };
  brand: {
    name: string;
    tagline: string;
    positioning: string;
    concept: string;
  };
  nextSteps: NextStep[];
  meta: {
    assembledAt: string;
    partialFailures: string[];
  };
}

interface RequestBody {
  prompt?: unknown;
  chosenDomain?: unknown;
  plan?: unknown;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const startedAt = Date.now();

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON body. Expected { prompt, chosenDomain, plan }.",
      },
      { status: 400 },
    );
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 1200) : "";
  const chosenDomain = typeof body.chosenDomain === "string" ? body.chosenDomain.trim().toLowerCase() : "";
  const plan = isLaunchPlanLike(body.plan) ? (body.plan as LaunchPlan) : null;

  if (!prompt || prompt.length < 6) {
    return NextResponse.json(
      { error: "prompt is required and must be at least 6 characters." },
      { status: 400 },
    );
  }
  if (!chosenDomain || !/^[a-z0-9-]+\.[a-z]{2,10}$/.test(chosenDomain)) {
    return NextResponse.json(
      {
        error:
          "chosenDomain is required and must look like 'yourbrand.com' (letters, digits, hyphens + TLD).",
      },
      { status: 400 },
    );
  }
  if (!plan) {
    return NextResponse.json(
      {
        error:
          "plan is required. Call /api/launch/plan first and pass its response as the `plan` field.",
      },
      { status: 400 },
    );
  }

  // --- Derive base URL for internal fan-out --------------------------------
  // We call our own API routes over HTTP rather than importing them directly
  // so each enrichment has its own request context + timeout. This keeps the
  // failure domain isolated per call.
  const baseUrl = getBaseUrl(req);
  const [labelRaw, tldRaw] = chosenDomain.split(".");
  const label = labelRaw || "";
  const tld = (tldRaw || "").toLowerCase();
  const brandName = titleCase(label);

  // --- Fan out in parallel with Promise.allSettled --------------------------
  const [searchR, trademarkR, valuationR] = await Promise.allSettled([
    fetchJsonWithTimeout(
      `${baseUrl}/api/domains/search?q=${encodeURIComponent(label)}&tlds=${encodeURIComponent(tld)}`,
      { method: "GET" },
    ),
    fetchJsonWithTimeout(
      `${baseUrl}/api/domains/trademark-global?name=${encodeURIComponent(brandName)}&domain=${encodeURIComponent(
        chosenDomain,
      )}`,
      { method: "GET" },
    ),
    fetchJsonWithTimeout(
      `${baseUrl}/api/domains/valuation?domain=${encodeURIComponent(chosenDomain)}`,
      { method: "GET" },
    ),
  ]);

  const partialFailures: string[] = [];

  // --- Availability --------------------------------------------------------
  const availability: DomainAvailability = (() => {
    if (searchR.status !== "fulfilled") {
      partialFailures.push("availability");
      return {
        available: null,
        price: null,
        tld,
        confidence: "unknown",
        unavailableReason: reasonFromRejected(searchR),
      };
    }
    const payload = searchR.value;
    // The /search endpoint returns { results: [{ domain, available, price, confidence }] }
    const results = Array.isArray(payload?.results) ? payload.results : [];
    const match =
      results.find(
        (r: { domain?: string }) => typeof r.domain === "string" && r.domain.toLowerCase() === chosenDomain,
      ) || results[0];
    if (!match) {
      return {
        available: null,
        price: null,
        tld,
        confidence: "unknown",
        unavailableReason: "Search returned no results for this domain.",
      };
    }
    return {
      available: typeof match.available === "boolean" ? match.available : match.available === null ? null : null,
      price: typeof match.price === "number" ? match.price : null,
      tld,
      confidence: match.confidence === "high" ? "high" : match.confidence === "low" ? "low" : "unknown",
    };
  })();

  // --- Trademark -----------------------------------------------------------
  const trademark: TrademarkSummary = (() => {
    if (trademarkR.status !== "fulfilled") {
      partialFailures.push("trademark");
      return {
        status: "unavailable",
        registries_checked: [],
        conflictCount: 0,
        notes: null,
        unavailableReason: reasonFromRejected(trademarkR),
      };
    }
    const p = trademarkR.value;
    const statusRaw = typeof p?.status === "string" ? p.status.toLowerCase() : "unknown";
    const status: TrademarkSummary["status"] =
      statusRaw === "clear" || statusRaw === "conflict" || statusRaw === "unknown"
        ? (statusRaw as TrademarkSummary["status"])
        : "unknown";
    const registries = Array.isArray(p?.registries_checked)
      ? p.registries_checked.filter((s: unknown): s is string => typeof s === "string")
      : [];
    const conflicts = Array.isArray(p?.conflicts) ? p.conflicts : [];
    return {
      status,
      registries_checked: registries,
      conflictCount: conflicts.length,
      notes: typeof p?.notes === "string" ? p.notes : null,
    };
  })();

  // --- Valuation -----------------------------------------------------------
  const valuation: ValuationSummary = (() => {
    if (valuationR.status !== "fulfilled") {
      partialFailures.push("valuation");
      return {
        low: null,
        high: null,
        midpoint: null,
        confidence: "unknown",
        factors: [],
        unavailableReason: reasonFromRejected(valuationR),
      };
    }
    const v = valuationR.value;
    return {
      low: typeof v?.low === "number" ? v.low : null,
      high: typeof v?.high === "number" ? v.high : null,
      midpoint: typeof v?.midpoint === "number" ? v.midpoint : null,
      confidence:
        v?.confidence === "low" || v?.confidence === "medium" || v?.confidence === "high"
          ? v.confidence
          : "unknown",
      factors: Array.isArray(v?.factors)
        ? v.factors.filter((s: unknown): s is string => typeof s === "string").slice(0, 6)
        : [],
    };
  })();

  // --- Brand metadata from the plan ----------------------------------------
  const tagline = plan.taglines[0] || "Built to ship.";
  const positioning = plan.positioning || "Fastest way from idea to launched product.";
  const concept = plan.concept || prompt;

  // --- Next steps with prefilled CTAs --------------------------------------
  const encPrompt = encodeURIComponent(prompt);
  const encDomain = encodeURIComponent(chosenDomain);
  const encBrand = encodeURIComponent(brandName);

  const nextSteps: NextStep[] = [
    {
      action: "build-site",
      href: `/builder?prompt=${encPrompt}&domain=${encDomain}&brand=${encBrand}`,
      label: "Build your site",
      description: `Open the AI builder with ${brandName} pre-loaded and generate the ${plan.starterSections.length} starter sections.`,
    },
    {
      action: "create-video",
      href: `/video-creator?prompt=${encPrompt}&brand=${encBrand}`,
      label: "Create launch video",
      description: `Generate a 30-second spokesperson video introducing ${brandName} to your first customers.`,
    },
    {
      action: "buy-domain",
      href: `/domains/checkout?domain=${encDomain}`,
      label:
        availability.available === true
          ? `Register ${chosenDomain}`
          : availability.available === false
            ? `${chosenDomain} is taken — see alternatives`
            : `Check ${chosenDomain}`,
      description:
        availability.available === true && availability.price
          ? `Lock it in for $${availability.price.toFixed(2)}/year before somebody else grabs it.`
          : "Secure the domain that anchors your entire brand identity.",
    },
    {
      action: "connect-email",
      href: `/email?domain=${encDomain}`,
      label: "Set up business email",
      description: `Wire up ${plan.emailPrefixes.slice(0, 3).join("@, ")}@${chosenDomain} with SPF + DKIM + DMARC already configured.`,
    },
  ];

  const kit: LaunchKit = {
    domain: {
      name: chosenDomain,
      availability,
      trademark,
      valuation,
    },
    brand: {
      name: brandName,
      tagline,
      positioning,
      concept,
    },
    nextSteps,
    meta: {
      assembledAt: new Date().toISOString(),
      partialFailures,
    },
  };

  console.log(
    `[launch/assemble] OK domain=${chosenDomain} available=${availability.available} trademark=${trademark.status} valuation=${valuation.midpoint ?? "n/a"} partial=${partialFailures.join(",") || "none"} elapsed=${Date.now() - startedAt}ms`,
  );

  return NextResponse.json(kit);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBaseUrl(req: NextRequest): string {
  // Respect the forwarded host Vercel injects when behind their edge proxy.
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;
  if (envUrl) {
    return envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;
  }
  // Fallback: reconstruct from the incoming request.
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

async function fetchJsonWithTimeout(url: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      "content-type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(`${url} responded ${res.status}: ${bodyText.slice(0, 200)}`);
  }
  return res.json();
}

function reasonFromRejected(r: PromiseSettledResult<unknown>): string {
  if (r.status === "fulfilled") return "";
  const err = r.reason;
  if (err instanceof Error) return err.message.slice(0, 200);
  return String(err).slice(0, 200);
}

function titleCase(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function isLaunchPlanLike(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  // any-cast is intentional — we've verified it's an object, and we're about to
  // check the fields we depend on downstream.
  const p = v as any;
  return (
    typeof p.concept === "string" &&
    typeof p.positioning === "string" &&
    Array.isArray(p.taglines) &&
    Array.isArray(p.brandNames) &&
    Array.isArray(p.starterSections) &&
    Array.isArray(p.emailPrefixes)
  );
}
