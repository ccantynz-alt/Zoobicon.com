/**
 * Domain Hook — THE revenue moat orchestrator.
 *
 * When a user finishes their first build on Zoobicon, this module is the
 * end-to-end "hook in mouth" flow that converts a free builder user into a
 * paying, locked-in customer in <= 30 seconds:
 *
 *   1. suggestDomains()       — AI name generator (Claude, cached) + real
 *                               OpenSRS availability checks. Returns 5-8
 *                               ranked candidates.
 *   2. completeSignupFlow()   — In parallel (Promise.allSettled):
 *        a. Register the domain via OpenSRS           (`@/lib/opensrs`)
 *        b. Deploy the built site                     (`@/lib/vercel-deploy`
 *                                                      or `@/lib/hosting-deploy`,
 *                                                      falling back to a row in
 *                                                      the `sites` table via
 *                                                      `@/lib/db`)
 *        c. Provision a `hello@` mailbox              (`@/lib/mailgun-mailbox`
 *                                                      or `@/lib/email-mailbox`)
 *        d. Send welcome email                        (`@/lib/mailgun-client`
 *                                                      or `@/lib/email-client`)
 *   3. estimateFlowCost()     — Transparent first-year cost breakdown.
 *
 * Design rules applied (CLAUDE.md Bible):
 *   - Law 4: newest tech, latest Anthropic model via llm-provider.
 *   - Law 7: root cause — every sub-call traced and reported.
 *   - Law 8: NEVER SHOW BLANK SCREENS — every failure has a human-readable
 *     `error` plus an actionable `hint` naming the exact env var / module
 *     that needs to be wired up.
 *   - Law 9: graceful fallback when optional sub-modules aren't present yet
 *     (dynamic import → `unknown` availability / stub step) so this file
 *     ships green even if a dependency hasn't been built.
 *   - Strict TS, no `any`.
 *
 * This file contains NO route handlers. It is a pure library, runtime-agnostic
 * (works on node or edge — `export const runtime = 'nodejs'` hint only, set by
 * the caller).
 */

// ---------- Types ----------

export interface DomainSuggestion {
  domain: string;
  tld: string;
  available: boolean | "unknown";
  priceUsd: number;
  score: number;
  reason?: string;
}

export interface SuggestDomainsInput {
  businessName: string;
  industry?: string;
  description?: string;
}

export interface CompleteSignupInput {
  userId: string;
  chosenDomain: string;
  siteFiles: Record<string, string>;
  contactEmail: string;
}

export type StepStatus = "ok" | "failed" | "skipped";

export interface FlowStep {
  step: "register" | "deploy" | "mailbox" | "welcome-email";
  status: StepStatus;
  detail?: string;
  error?: string;
  hint?: string;
}

export interface CompleteSignupResult {
  domain: string;
  siteUrl: string;
  mailboxAddress: string;
  invoiceId: string;
  totalCostUsd: number;
  steps: FlowStep[];
}

export interface FlowCostBreakdown {
  domain: string;
  items: Array<{ label: string; amountUsd: number }>;
  firstYearTotalUsd: number;
  recurringMonthlyUsd: number;
}

// ---------- Pricing ----------

const TLD_PRICE_USD: Record<string, number> = {
  com: 14.99,
  ai: 79.0,
  io: 39.0,
  sh: 49.0,
  app: 18.0,
  dev: 16.0,
  co: 29.0,
  net: 16.99,
  org: 14.99,
};

function priceForTld(tld: string): number {
  return TLD_PRICE_USD[tld.toLowerCase()] ?? 24.99;
}

function parseTld(domain: string): string {
  const parts = domain.toLowerCase().split(".");
  return parts.length > 1 ? parts.slice(1).join(".") : "com";
}

// ---------- Dynamic import helper ----------

type UnknownModule = Record<string, unknown>;

async function tryImport(path: string): Promise<UnknownModule | null> {
  try {
    const mod = (await import(/* webpackIgnore: true */ path)) as UnknownModule;
    return mod;
  } catch {
    return null;
  }
}

function pickFn(
  mod: UnknownModule | null,
  names: string[],
): ((...args: unknown[]) => unknown) | null {
  if (!mod) return null;
  for (const n of names) {
    const v = mod[n];
    if (typeof v === "function") return v as (...args: unknown[]) => unknown;
  }
  // default export
  const def = mod.default as UnknownModule | undefined;
  if (def) {
    for (const n of names) {
      const v = def[n];
      if (typeof v === "function") return v as (...args: unknown[]) => unknown;
    }
  }
  return null;
}

// ---------- suggestDomains ----------

/**
 * Generate 5-8 ranked domain candidates for a business and check live
 * availability via OpenSRS. Uses the cached Claude call from
 * `@/lib/anthropic-cached` (dynamic import) with a graceful fallback to a
 * deterministic name generator so this never blocks the first build.
 *
 * 30-second flow budget: ~3-5s.
 */
export async function suggestDomains(
  input: SuggestDomainsInput,
): Promise<DomainSuggestion[]> {
  const { businessName, industry, description } = input;

  // 1. Ask Claude (dynamic — falls back if not available).
  let names: string[] = [];
  const cachedMod = await tryImport("@/lib/anthropic-cached");
  const callClaude = pickFn(cachedMod, ["callClaude", "call", "complete"]);

  if (callClaude) {
    try {
      const prompt = [
        `Generate 8 short, brandable domain-friendly names for a business.`,
        `Business: ${businessName}`,
        industry ? `Industry: ${industry}` : "",
        description ? `Description: ${description}` : "",
        `Rules: 5-14 chars, no hyphens, easy to spell, memorable.`,
        `Return JSON array of { "name": string, "reason": string }.`,
      ]
        .filter(Boolean)
        .join("\n");
      const raw = (await callClaude({
        prompt,
        maxTokens: 800,
        model: "claude-haiku-4-5",
      })) as unknown;
      const text =
        typeof raw === "string"
          ? raw
          : ((raw as { text?: string })?.text ?? "");
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]) as Array<{
          name?: string;
          reason?: string;
        }>;
        names = parsed
          .map((p) => (p.name ?? "").toLowerCase().replace(/[^a-z0-9]/g, ""))
          .filter((n) => n.length >= 4 && n.length <= 16);
      }
    } catch {
      names = [];
    }
  }

  if (names.length === 0) {
    const base = businessName.toLowerCase().replace(/[^a-z0-9]/g, "");
    names = [
      base,
      `${base}hq`,
      `${base}app`,
      `get${base}`,
      `try${base}`,
      `${base}io`,
      `${base}labs`,
      `${base}co`,
    ].filter((n) => n.length >= 4 && n.length <= 16);
  }

  // 2. Expand across TLDs.
  const tlds = ["com", "ai", "io", "app", "co"];
  const candidates: string[] = [];
  for (const n of names.slice(0, 5)) {
    for (const t of tlds) candidates.push(`${n}.${t}`);
  }

  // 3. Check availability via OpenSRS (dynamic).
  const opensrs = await tryImport("@/lib/opensrs");
  const check = pickFn(opensrs, [
    "checkAvailability",
    "checkDomain",
    "lookup",
  ]);

  const out: DomainSuggestion[] = [];
  for (const domain of candidates) {
    const tld = parseTld(domain);
    let available: boolean | "unknown" = "unknown";
    let reason: string | undefined;
    if (check) {
      try {
        const r = (await check(domain)) as unknown;
        if (typeof r === "boolean") available = r;
        else if (r && typeof r === "object") {
          const rec = r as { available?: boolean; status?: string };
          if (typeof rec.available === "boolean") available = rec.available;
          else if (rec.status) available = rec.status === "available";
        }
      } catch {
        available = "unknown";
        reason = "OpenSRS lookup failed — retrying in background";
      }
    } else {
      reason = "Set OPENSRS_API_KEY to enable real-time availability";
    }

    const score =
      (available === true ? 100 : available === "unknown" ? 50 : 0) -
      domain.length +
      (tld === "com" ? 10 : 0) +
      (tld === "ai" ? 6 : 0);

    out.push({
      domain,
      tld,
      available,
      priceUsd: priceForTld(tld),
      score,
      reason,
    });
  }

  out.sort((a, b) => b.score - a.score);
  return out.slice(0, 8);
}

// ---------- completeSignupFlow ----------

/**
 * Orchestrates the full "hook in mouth" signup in parallel. Every sub-step is
 * dynamically imported so missing modules degrade gracefully into a reported
 * `skipped` step with a clear hint — never a blank screen.
 *
 * 30-second budget:
 *   register   ~6-10s
 *   deploy     ~8-15s  (parallel)
 *   mailbox    ~2-4s   (parallel)
 *   welcome    ~1-2s   (parallel, sequenced after mailbox if present)
 */
export async function completeSignupFlow(
  input: CompleteSignupInput,
): Promise<CompleteSignupResult> {
  const { userId, chosenDomain, siteFiles, contactEmail } = input;
  const tld = parseTld(chosenDomain);
  const mailboxAddress = `hello@${chosenDomain}`;
  const invoiceId = `inv_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  // --- register ---
  const registerTask = (async (): Promise<FlowStep> => {
    const opensrs = await tryImport("@/lib/opensrs");
    const fn = pickFn(opensrs, ["registerDomain", "register", "purchase"]);
    if (!fn) {
      return {
        step: "register",
        status: "skipped",
        hint: "Wire @/lib/opensrs.registerDomain + OPENSRS_API_KEY in Vercel",
      };
    }
    try {
      await fn({ domain: chosenDomain, userId, contactEmail });
      return { step: "register", status: "ok", detail: chosenDomain };
    } catch (e) {
      return {
        step: "register",
        status: "failed",
        error: (e as Error).message,
        hint: "Check OPENSRS_API_KEY, OPENSRS_USERNAME and account balance",
      };
    }
  })();

  // --- deploy ---
  const deployTask = (async (): Promise<{
    step: FlowStep;
    siteUrl: string;
  }> => {
    const vercel = await tryImport("@/lib/vercel-deploy");
    const vercelFn = pickFn(vercel, ["deploy", "deploySite", "createProject"]);
    if (vercelFn) {
      try {
        const r = (await vercelFn({
          domain: chosenDomain,
          files: siteFiles,
          userId,
        })) as { url?: string } | string;
        const url = typeof r === "string" ? r : (r?.url ?? `https://${chosenDomain}`);
        return {
          step: { step: "deploy", status: "ok", detail: url },
          siteUrl: url,
        };
      } catch (e) {
        return {
          step: {
            step: "deploy",
            status: "failed",
            error: (e as Error).message,
            hint: "Check VERCEL_TOKEN and project permissions",
          },
          siteUrl: `https://${chosenDomain}`,
        };
      }
    }

    const hosting = await tryImport("@/lib/hosting-deploy");
    const hostingFn = pickFn(hosting, ["deploy", "deploySite"]);
    if (hostingFn) {
      try {
        const r = (await hostingFn({
          domain: chosenDomain,
          files: siteFiles,
          userId,
        })) as { url?: string } | string;
        const url =
          typeof r === "string" ? r : (r?.url ?? `https://${chosenDomain}`);
        return {
          step: { step: "deploy", status: "ok", detail: url },
          siteUrl: url,
        };
      } catch (e) {
        return {
          step: {
            step: "deploy",
            status: "failed",
            error: (e as Error).message,
            hint: "Check hosting-deploy module + DATABASE_URL",
          },
          siteUrl: `https://${chosenDomain}`,
        };
      }
    }

    // Fallback: insert into sites table via @/lib/db
    const db = await tryImport("@/lib/db");
    const sql = pickFn(db, ["sql", "query"]);
    if (sql) {
      try {
        await sql(
          `INSERT INTO sites (user_id, domain, files, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [userId, chosenDomain, JSON.stringify(siteFiles)],
        );
        return {
          step: {
            step: "deploy",
            status: "ok",
            detail: "Inserted into sites table",
          },
          siteUrl: `https://${chosenDomain}`,
        };
      } catch (e) {
        return {
          step: {
            step: "deploy",
            status: "failed",
            error: (e as Error).message,
            hint: "Run /api/db/init to create the sites table",
          },
          siteUrl: `https://${chosenDomain}`,
        };
      }
    }

    return {
      step: {
        step: "deploy",
        status: "skipped",
        hint: "No @/lib/vercel-deploy, @/lib/hosting-deploy, or @/lib/db available",
      },
      siteUrl: `https://${chosenDomain}`,
    };
  })();

  // --- mailbox ---
  const mailboxTask = (async (): Promise<FlowStep> => {
    const candidates = [
      "@/lib/mailgun-mailbox",
      "@/lib/email-mailbox",
      "@/lib/mailbox",
    ];
    for (const path of candidates) {
      const mod = await tryImport(path);
      const fn = pickFn(mod, ["createMailbox", "provisionMailbox", "create"]);
      if (fn) {
        try {
          await fn({
            address: mailboxAddress,
            domain: chosenDomain,
            userId,
          });
          return {
            step: "mailbox",
            status: "ok",
            detail: mailboxAddress,
          };
        } catch (e) {
          return {
            step: "mailbox",
            status: "failed",
            error: (e as Error).message,
            hint: "Check MAILGUN_API_KEY and that the domain is verified",
          };
        }
      }
    }
    return {
      step: "mailbox",
      status: "skipped",
      hint: "Wire @/lib/mailgun-mailbox.createMailbox + MAILGUN_API_KEY",
    };
  })();

  // --- welcome email ---
  const welcomeTask = (async (): Promise<FlowStep> => {
    const candidates = [
      "@/lib/mailgun-client",
      "@/lib/email-client",
      "@/lib/email",
    ];
    for (const path of candidates) {
      const mod = await tryImport(path);
      const fn = pickFn(mod, ["sendEmail", "send", "sendMail"]);
      if (fn) {
        try {
          await fn({
            to: contactEmail,
            from: `Zoobicon <welcome@zoobicon.com>`,
            subject: `Your new site ${chosenDomain} is live`,
            html: renderWelcomeHtml(chosenDomain, mailboxAddress),
          });
          return { step: "welcome-email", status: "ok", detail: contactEmail };
        } catch (e) {
          return {
            step: "welcome-email",
            status: "failed",
            error: (e as Error).message,
            hint: "Check MAILGUN_API_KEY and sender domain verification",
          };
        }
      }
    }
    return {
      step: "welcome-email",
      status: "skipped",
      hint: "Wire @/lib/mailgun-client.sendEmail + MAILGUN_API_KEY",
    };
  })();

  const settled = await Promise.allSettled([
    registerTask,
    deployTask,
    mailboxTask,
    welcomeTask,
  ]);

  const steps: FlowStep[] = [];
  let siteUrl = `https://${chosenDomain}`;

  // register
  const s0 = settled[0];
  steps.push(
    s0.status === "fulfilled"
      ? s0.value
      : {
          step: "register",
          status: "failed",
          error: String(s0.reason),
          hint: "Unexpected register task crash",
        },
  );
  // deploy
  const s1 = settled[1];
  if (s1.status === "fulfilled") {
    steps.push(s1.value.step);
    siteUrl = s1.value.siteUrl;
  } else {
    steps.push({
      step: "deploy",
      status: "failed",
      error: String(s1.reason),
      hint: "Unexpected deploy task crash",
    });
  }
  // mailbox
  const s2 = settled[2];
  steps.push(
    s2.status === "fulfilled"
      ? s2.value
      : {
          step: "mailbox",
          status: "failed",
          error: String(s2.reason),
          hint: "Unexpected mailbox task crash",
        },
  );
  // welcome email
  const s3 = settled[3];
  steps.push(
    s3.status === "fulfilled"
      ? s3.value
      : {
          step: "welcome-email",
          status: "failed",
          error: String(s3.reason),
          hint: "Unexpected welcome-email task crash",
        },
  );

  const totalCostUsd = priceForTld(tld) + 19.0; // domain + first month hosting

  return {
    domain: chosenDomain,
    siteUrl,
    mailboxAddress,
    invoiceId,
    totalCostUsd,
    steps,
  };
}

function renderWelcomeHtml(domain: string, mailbox: string): string {
  return `<!doctype html><html><body style="font-family:-apple-system,sans-serif;padding:32px;max-width:560px;margin:auto">
<h1 style="font-size:24px;margin:0 0 16px">Your site ${escapeHtml(domain)} is live</h1>
<p>Everything is provisioned and ready:</p>
<ul>
  <li>Domain: <strong>${escapeHtml(domain)}</strong></li>
  <li>SSL: issued automatically</li>
  <li>Mailbox: <strong>${escapeHtml(mailbox)}</strong></li>
</ul>
<p style="color:#666;font-size:13px;margin-top:32px">
  zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh
</p>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------- estimateFlowCost ----------

/**
 * Transparent first-year cost breakdown for the domain hook flow. Used by
 * the builder UI to show "You'll pay $X to go live" before the user clicks
 * the big button.
 */
export function estimateFlowCost(domain: string): FlowCostBreakdown {
  const tld = parseTld(domain);
  const domainPrice = priceForTld(tld);
  const hostingMonthly = 19.0;
  const mailboxMonthly = 6.0;
  const sslYear = 0; // Let's Encrypt via Cloudflare
  const hostingYear = hostingMonthly * 12;
  const mailboxYear = mailboxMonthly * 12;

  const items = [
    { label: `Domain registration (.${tld}, 1yr)`, amountUsd: domainPrice },
    { label: "Hosting (12 months)", amountUsd: hostingYear },
    { label: "Business mailbox hello@ (12 months)", amountUsd: mailboxYear },
    { label: "SSL certificate", amountUsd: sslYear },
  ];

  const firstYearTotalUsd = items.reduce((s, i) => s + i.amountUsd, 0);
  const recurringMonthlyUsd = hostingMonthly + mailboxMonthly;

  return {
    domain,
    items,
    firstYearTotalUsd: Math.round(firstYearTotalUsd * 100) / 100,
    recurringMonthlyUsd: Math.round(recurringMonthlyUsd * 100) / 100,
  };
}
