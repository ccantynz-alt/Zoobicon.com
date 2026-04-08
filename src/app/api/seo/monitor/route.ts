import { NextRequest, NextResponse } from "next/server";
import { auditSite, SeoAuditResult } from "@/lib/seo-agent";

export const maxDuration = 30;

interface MonitorResult {
  url: string;
  ok: boolean;
  audit?: SeoAuditResult;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET;
    if (secret) {
      const auth = req.headers.get("authorization") || "";
      if (auth !== `Bearer ${secret}`) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json().catch(() => ({}));
    const urls: unknown = body?.urls;
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ ok: false, error: "urls must be a non-empty array" }, { status: 400 });
    }
    if (urls.length > 10) {
      return NextResponse.json({ ok: false, error: "Maximum 10 urls per request" }, { status: 400 });
    }
    const list: string[] = [];
    for (const u of urls) {
      if (typeof u !== "string") {
        return NextResponse.json({ ok: false, error: "All urls must be strings" }, { status: 400 });
      }
      try {
        const parsed = new URL(u);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("bad protocol");
        list.push(parsed.toString());
      } catch {
        return NextResponse.json({ ok: false, error: `Invalid url: ${u}` }, { status: 400 });
      }
    }

    const settled = await Promise.allSettled(list.map((url) => auditSite({ url })));
    const results: MonitorResult[] = settled.map((r, i) => {
      if (r.status === "fulfilled") {
        return { url: list[i], ok: true, audit: r.value };
      }
      return { url: list[i], ok: false, error: (r.reason as Error)?.message || "Unknown error" };
    });

    return NextResponse.json({ ok: true, results });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
