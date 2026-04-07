import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  runComebackForSite,
  buildComebackEmail,
  type ComebackReport,
} from "@/lib/daily-comeback";
import { sendViaMailgun } from "@/lib/mailgun";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  // Auth check — Vercel cron sends Authorization: Bearer ${CRON_SECRET}
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  // Query recently deployed sites — gracefully handle missing table / no DB
  let sites: Array<{
    id: string;
    slug: string;
    name: string;
    owner_email: string;
    html: string | null;
  }> = [];
  try {
    const rows = (await sql`
      SELECT id, slug, name, owner_email, html
      FROM sites
      WHERE created_at > NOW() - INTERVAL '30 days'
        AND owner_email IS NOT NULL
      LIMIT 100
    `) as any[];
    sites = rows || [];
  } catch (err: any) {
    console.warn(
      "[daily-comeback] DB unavailable or sites table missing:",
      err?.message || err
    );
    return NextResponse.json({
      ok: true,
      processed: 0,
      note: "DB unavailable",
    });
  }

  let succeeded = 0;
  let failed = 0;
  const reports: Array<{
    siteId: string;
    siteName: string;
    improvementCount: number;
    emailSent: boolean;
  }> = [];

  for (const site of sites) {
    try {
      const siteUrl = `https://${site.slug}.zoobicon.sh`;
      const report: ComebackReport = await runComebackForSite({
        id: site.id,
        name: site.name || site.slug,
        url: siteUrl,
        ownerEmail: site.owner_email,
        html: site.html || undefined,
      });

      let emailSent = false;
      if (process.env.MAILGUN_API_KEY) {
        try {
          const email = await buildComebackEmail(report);
          const result = await sendViaMailgun({
            from: "Zoobicon Comeback <comeback@zoobicon.com>",
            to: report.ownerEmail,
            subject: email.subject,
            html: email.html,
            text: email.text,
            tags: ["daily-comeback"],
          });
          emailSent = result.success;
          if (!result.success) {
            console.warn(
              `[daily-comeback] mailgun failed for ${report.ownerEmail}: ${result.error}`
            );
          }
        } catch (mailErr: any) {
          console.warn(
            `[daily-comeback] mailgun threw for ${report.ownerEmail}:`,
            mailErr?.message || mailErr
          );
        }
      } else {
        console.log(
          "[daily-comeback] MAILGUN_API_KEY not set — skipping email for",
          report.ownerEmail
        );
      }

      // Best-effort store of the report (table may not exist — ignore)
      try {
        await sql`
          INSERT INTO comeback_reports (site_id, owner_email, improvements, email_sent, run_at)
          VALUES (${site.id}, ${report.ownerEmail}, ${JSON.stringify(report.improvements)}, ${emailSent}, NOW())
        `;
      } catch {
        /* table may not exist; ignore */
      }

      succeeded++;
      reports.push({
        siteId: site.id,
        siteName: report.siteName,
        improvementCount: report.improvements.length,
        emailSent,
      });
    } catch (err: any) {
      failed++;
      console.error(
        `[daily-comeback] failed for site ${site.id}:`,
        err?.message || err
      );
    }
  }

  return NextResponse.json({
    ok: true,
    processed: sites.length,
    succeeded,
    failed,
    reports,
  });
}
