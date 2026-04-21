/**
 * Daily Comeback Loop
 * ===================
 *
 * Goal: turn first-time triers into daily users via a compounding
 * site-improvement loop competitors don't offer.
 *
 * Every night, for each active Zoobicon site we:
 *   1. Crawl analytics for yesterday's metrics
 *   2. Run SEO audit and auto-fix blocker issues
 *   3. Draft ONE new blog post via the blog generator
 *   4. Check competitors for material changes
 *   5. Compose a morning email summary for the owner
 *
 * Each sub-step runs through Promise.allSettled so a single failure never
 * kills the whole loop. Per Bible Law 8, every failure surfaces an actionable
 * error that lands in the morning email — the user always gets visibility.
 *
 * Sibling modules are dynamically imported so this file compiles even if
 * those modules do not yet exist in the repo.
 */

export interface RunNightlyJobInput {
  siteId: string;
  ownerEmail: string;
  ownerId: string;
}

export type StepStatus = "ok" | "error" | "skipped";

export interface StepResult {
  name: string;
  status: StepStatus;
  result?: unknown;
  error?: string;
}

export interface RunNightlyJobResult {
  siteId: string;
  steps: StepResult[];
  emailSent: boolean;
  summaryHtml: string;
}

export interface DailyStats {
  visits: number;
  uniqueVisitors: number;
  leads: number;
  bounceRate: number;
  topPages: Array<{ path: string; views: number }>;
}

export interface SeoFix {
  issue: string;
  fix: string;
  severity: "low" | "medium" | "high" | "blocker";
}

export interface BlogDraft {
  id: string;
  title: string;
  excerpt: string;
  approveUrl: string;
}

export interface CompetitorChange {
  competitor: string;
  change: string;
  url?: string;
}

export interface ComposeEmailInput {
  siteName: string;
  stats: DailyStats | null;
  seoFixes: SeoFix[];
  blogDraft: BlogDraft | null;
  competitorChanges: CompetitorChange[];
  failures?: StepResult[];
}

export interface ComposedEmail {
  subject: string;
  html: string;
  text: string;
}

interface ActiveSiteRow {
  id: string;
  name: string;
  owner_id: string;
  owner_email: string;
}

/** Safely run a sibling module function via dynamic import. */
async function safeCall<T>(
  name: string,
  loader: () => Promise<T>
): Promise<StepResult> {
  try {
    const result = await loader();
    return { name, status: "ok", result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      name,
      status: "error",
      error: `${name} failed: ${message}. Check that the underlying module/env is configured.`,
    };
  }
}

/**
 * Orchestrate the nightly job for a single site.
 * All sub-steps run in parallel via Promise.allSettled.
 */
export async function runNightlyJob(
  input: RunNightlyJobInput
): Promise<RunNightlyJobResult> {
  const { siteId, ownerEmail, ownerId } = input;

  const stepPromises: Array<Promise<StepResult>> = [
    safeCall<DailyStats>("analytics", async () => {
      const mod = (await import("@/lib/analytics-engine")) as {
        getDailyStats: (args: { siteId: string }) => Promise<DailyStats>;
      };
      return mod.getDailyStats({ siteId });
    }),
    safeCall<{ fixes: SeoFix[] }>("seo", async () => {
      const mod = (await import("@/lib/seo-agent")) as {
        auditSite: (args: { siteId: string }) => Promise<{ issues: SeoFix[] }>;
        autoFix: (args: {
          siteId: string;
          issues: SeoFix[];
        }) => Promise<{ fixes: SeoFix[] }>;
      };
      const audit = await mod.auditSite({ siteId });
      const blockers = audit.issues.filter(
        (i) => i.severity === "blocker" || i.severity === "high"
      );
      return mod.autoFix({ siteId, issues: blockers });
    }),
    safeCall<BlogDraft>("blog", async () => {
      const mod = (await import("@/lib/blog-generator")) as {
        draftPost: (args: {
          siteId: string;
          ownerId: string;
        }) => Promise<BlogDraft>;
      };
      return mod.draftPost({ siteId, ownerId });
    }),
    safeCall<{ changes: CompetitorChange[] }>("competitors", async () => {
      const mod = (await import("@/lib/competitor-monitor")) as {
        diffCompetitors: (args: {
          siteId: string;
        }) => Promise<{ changes: CompetitorChange[] }>;
      };
      return mod.diffCompetitors({ siteId });
    }),
  ];

  const settled = await Promise.allSettled(stepPromises);
  const steps: StepResult[] = settled.map((s, idx) => {
    const fallbackName = ["analytics", "seo", "blog", "competitors"][idx] ?? "step";
    if (s.status === "fulfilled") return s.value;
    return {
      name: fallbackName,
      status: "error",
      error: `Unexpected rejection: ${String(s.reason)}`,
    };
  });

  const analyticsStep = steps.find((s) => s.name === "analytics");
  const seoStep = steps.find((s) => s.name === "seo");
  const blogStep = steps.find((s) => s.name === "blog");
  const compStep = steps.find((s) => s.name === "competitors");

  const stats =
    analyticsStep?.status === "ok" ? (analyticsStep.result as DailyStats) : null;
  const seoFixes =
    seoStep?.status === "ok"
      ? ((seoStep.result as { fixes: SeoFix[] }).fixes ?? [])
      : [];
  const blogDraft =
    blogStep?.status === "ok" ? (blogStep.result as BlogDraft) : null;
  const competitorChanges =
    compStep?.status === "ok"
      ? ((compStep.result as { changes: CompetitorChange[] }).changes ?? [])
      : [];

  const failures = steps.filter((s) => s.status === "error");

  const email = composeEmailSummary({
    siteName: siteId,
    stats,
    seoFixes,
    blogDraft,
    competitorChanges,
    failures,
  });

  let emailSent = false;
  const sendStep = await safeCall("email", async () => {
    const mod = (await import("@/lib/mailgun-client")) as {
      sendEmail: (args: {
        to: string;
        subject: string;
        html: string;
        text: string;
      }) => Promise<unknown>;
    };
    return mod.sendEmail({
      to: ownerEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  });
  steps.push(sendStep);
  if (sendStep.status === "ok") emailSent = true;

  return {
    siteId,
    steps,
    emailSent,
    summaryHtml: email.html,
  };
}

/**
 * Run the nightly job for every active site, capped at 5 concurrent jobs
 * so we don't melt the database or our outbound API quotas.
 */
export async function runAllNightly(): Promise<RunNightlyJobResult[]> {
  let sites: ActiveSiteRow[] = [];
  try {
    const mod = (await import("@/lib/db")) as {
      sql: (
        strings: TemplateStringsArray,
        ...values: unknown[]
      ) => Promise<ActiveSiteRow[]>;
    };
    sites = await mod.sql`
      SELECT id, name, owner_id, owner_email
      FROM sites
      WHERE active = true
    `;
  } catch {
    return [];
  }

  const results: RunNightlyJobResult[] = [];
  const concurrency = 5;
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < sites.length) {
      const idx = cursor++;
      const site = sites[idx];
      if (!site) return;
      const settled = await Promise.allSettled([
        runNightlyJob({
          siteId: site.id,
          ownerEmail: site.owner_email,
          ownerId: site.owner_id,
        }),
      ]);
      const r = settled[0];
      if (r && r.status === "fulfilled") {
        results.push(r.value);
      } else {
        results.push({
          siteId: site.id,
          steps: [
            {
              name: "orchestrator",
              status: "error",
              error: `Nightly job crashed: ${
                r && r.status === "rejected" ? String(r.reason) : "unknown"
              }`,
            },
          ],
          emailSent: false,
          summaryHtml: "",
        });
      }
    }
  }

  const workers: Array<Promise<void>> = [];
  for (let i = 0; i < Math.min(concurrency, sites.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Compose the morning email summary. Inline CSS, dark-mode friendly,
 * Gmail/Outlook compatible.
 */
export function composeEmailSummary(
  input: ComposeEmailInput
): ComposedEmail {
  const {
    siteName,
    stats,
    seoFixes,
    blogDraft,
    competitorChanges,
    failures = [],
  } = input;

  const safeName = escapeHtml(siteName);
  const visits = stats?.visits ?? 0;
  const leads = stats?.leads ?? 0;

  const subject = `Zoobicon morning brief: ${siteName} — ${visits} visits, ${leads} leads, ${seoFixes.length} fixes`;

  const card = (content: string): string =>
    `<div style="background:#0f2148;border:1px solid #232636;border-radius:14px;padding:20px;margin:0 0 16px 0;color:#e6e8ef;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">${content}</div>`;

  const statsBlock = stats
    ? card(`
        <h2 style="margin:0 0 12px 0;font-size:18px;color:#fff;">Yesterday's traffic</h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#9ba3b4;">Visits</td>
            <td style="padding:8px 0;text-align:right;color:#fff;font-weight:600;">${stats.visits}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9ba3b4;">Unique visitors</td>
            <td style="padding:8px 0;text-align:right;color:#fff;font-weight:600;">${stats.uniqueVisitors}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9ba3b4;">Leads</td>
            <td style="padding:8px 0;text-align:right;color:#22c55e;font-weight:700;">${stats.leads}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9ba3b4;">Bounce rate</td>
            <td style="padding:8px 0;text-align:right;color:#fff;font-weight:600;">${stats.bounceRate.toFixed(1)}%</td>
          </tr>
        </table>
      `)
    : card(
        `<h2 style="margin:0 0 8px 0;font-size:18px;color:#fff;">Yesterday's traffic</h2><p style="margin:0;color:#f59e0b;">Analytics unavailable. Check analytics-engine configuration.</p>`
      );

  const seoBlock = card(`
    <h2 style="margin:0 0 12px 0;font-size:18px;color:#fff;">SEO auto-fixes (${seoFixes.length})</h2>
    ${
      seoFixes.length === 0
        ? `<p style="margin:0;color:#9ba3b4;">No blockers found. Site is clean.</p>`
        : `<ul style="margin:0;padding-left:18px;color:#e6e8ef;">${seoFixes
            .map(
              (f) =>
                `<li style="margin:6px 0;"><strong style="color:#fff;">${escapeHtml(f.issue)}</strong> — <span style="color:#9ba3b4;">${escapeHtml(f.fix)}</span></li>`
            )
            .join("")}</ul>`
    }
  `);

  const blogBlock = blogDraft
    ? card(`
        <h2 style="margin:0 0 12px 0;font-size:18px;color:#fff;">New blog draft</h2>
        <p style="margin:0 0 6px 0;font-size:16px;color:#fff;font-weight:600;">${escapeHtml(blogDraft.title)}</p>
        <p style="margin:0 0 14px 0;color:#9ba3b4;">${escapeHtml(blogDraft.excerpt)}</p>
        <a href="${escapeHtml(blogDraft.approveUrl)}" style="display:inline-block;background:linear-gradient(90deg,#6366f1,#a855f7);color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600;">Approve &amp; publish</a>
      `)
    : card(
        `<h2 style="margin:0 0 8px 0;font-size:18px;color:#fff;">New blog draft</h2><p style="margin:0;color:#f59e0b;">Draft generation failed. Check blog-generator.</p>`
      );

  const compBlock = card(`
    <h2 style="margin:0 0 12px 0;font-size:18px;color:#fff;">Competitor watch</h2>
    ${
      competitorChanges.length === 0
        ? `<p style="margin:0;color:#9ba3b4;">No notable competitor moves overnight.</p>`
        : `<ul style="margin:0;padding-left:18px;color:#e6e8ef;">${competitorChanges
            .map(
              (c) =>
                `<li style="margin:6px 0;"><strong style="color:#fff;">${escapeHtml(c.competitor)}</strong> — ${escapeHtml(c.change)}${c.url ? ` <a href="${escapeHtml(c.url)}" style="color:#a855f7;">view</a>` : ""}</li>`
            )
            .join("")}</ul>`
    }
  `);

  const failuresBlock =
    failures.length > 0
      ? card(`
          <h2 style="margin:0 0 12px 0;font-size:18px;color:#f87171;">Steps that need attention</h2>
          <ul style="margin:0;padding-left:18px;color:#fca5a5;">
            ${failures
              .map(
                (f) =>
                  `<li style="margin:6px 0;"><strong style="color:#fff;">${escapeHtml(f.name)}</strong>: ${escapeHtml(f.error ?? "unknown error")}</li>`
              )
              .join("")}
          </ul>
        `)
      : "";

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#0a0b12;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0b12;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:0 16px;">
          <h1 style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#fff;font-size:24px;margin:0 0 6px 0;">Good morning.</h1>
          <p style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#9ba3b4;margin:0 0 20px 0;">Here's what Zoobicon did for <strong style="color:#fff;">${safeName}</strong> overnight.</p>
          ${statsBlock}
          ${seoBlock}
          ${blogBlock}
          ${compBlock}
          ${failuresBlock}
          <p style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#5b6478;font-size:12px;text-align:center;margin:24px 0 0 0;">zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const textLines: string[] = [
    `Zoobicon morning brief — ${siteName}`,
    "",
    stats
      ? `Visits: ${stats.visits} | Unique: ${stats.uniqueVisitors} | Leads: ${stats.leads} | Bounce: ${stats.bounceRate.toFixed(1)}%`
      : "Analytics unavailable.",
    "",
    `SEO fixes applied: ${seoFixes.length}`,
    ...seoFixes.map((f) => `  - ${f.issue}: ${f.fix}`),
    "",
    blogDraft
      ? `New blog draft: ${blogDraft.title}\n  Approve: ${blogDraft.approveUrl}`
      : "Blog draft failed.",
    "",
    `Competitor changes: ${competitorChanges.length}`,
    ...competitorChanges.map((c) => `  - ${c.competitor}: ${c.change}`),
  ];
  if (failures.length > 0) {
    textLines.push("", "Steps needing attention:");
    for (const f of failures) {
      textLines.push(`  - ${f.name}: ${f.error ?? "unknown error"}`);
    }
  }
  textLines.push("", "zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh");

  return { subject, html, text: textLines.join("\n") };
}
