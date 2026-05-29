/**
 * /api/intel/hn/roadmap-md — paste-ready markdown export of triaged
 * + building painkillers, ready to drop into CLAUDE.md URGENT BUILD
 * LIST.
 *
 * Why an endpoint not auto-PR: auto-editing CLAUDE.md from a cron is
 * fraught (merge conflicts, taste-level edits get clobbered, PR
 * noise). This gives Craig + Claude a one-click export that pastes
 * cleanly when the next CLAUDE.md PR happens, without any file-
 * mutation machinery in the loop.
 *
 * GET → text/markdown
 *   ?status=triaged|building|all (default: triaged,building combined)
 *   ?as=json to return { markdown, count } JSON instead
 */

import { NextResponse } from "next/server";
import { ensureHnTables, listRecentPainkillers } from "@/lib/hn-flywheel";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  pain: "🩹 Pain",
  feature: "⭐ Feature gap",
  competitor_weakness: "🎯 Competitor weakness",
  viral_demo: "🚀 Viral demo",
};

export async function GET(request: Request) {
  try {
    await ensureHnTables();
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") || "triaged,building";
    const asJson = searchParams.get("as") === "json";

    const statuses = statusParam.split(",").map((s) => s.trim());

    // Pull both statuses, merge, sort by score
    const lists = await Promise.all(
      statuses.map((s) => listRecentPainkillers(200, s === "all" ? undefined : s))
    );
    const all = lists.flat();

    // Dedupe by id (in case of overlap from the all+specific combo)
    const seen = new Set<string>();
    const items = all
      .filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      })
      .sort((a, b) => b.mentions * b.confidence - a.mentions * a.confidence);

    const today = new Date().toISOString().slice(0, 10);
    const lines: string[] = [];
    lines.push(`### HN-SOURCED PAINKILLERS — auto-export ${today}`);
    lines.push("");
    lines.push(
      `> Exported from \`/admin/intel/hn\` — triaged + building items, ranked by mentions × confidence. Source: Hacker News comment threads on AI builders.`
    );
    lines.push("");

    if (items.length === 0) {
      lines.push(`_No triaged items yet. Open \`/admin/intel/hn\`, click_ **Promote to roadmap** _on the painkillers worth building._`);
    } else {
      lines.push(
        `| # | Type | Competitor | Painkiller | Score | Status | Source |`
      );
      lines.push(`|---|------|-----------|-----------|-------|--------|--------|`);
      items.forEach((p, i) => {
        const score = (p.mentions * p.confidence).toFixed(2);
        const label = TYPE_LABEL[p.type] || p.type;
        // Escape pipe chars in the summary so we don't break the table
        const safeSummary = p.summary.replace(/\|/g, "\\|");
        lines.push(
          `| ${i + 1} | ${label} | ${p.competitor || "—"} | ${safeSummary} | ${score} | ${p.status} | [thread](${p.thread_url}) |`
        );
      });
      lines.push("");
      lines.push(`**${items.length} items.** Run \`GET /api/intel/hn/roadmap-md?as=json\` to refresh.`);
    }

    const markdown = lines.join("\n");

    if (asJson) {
      return NextResponse.json({ markdown, count: items.length });
    }

    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
