/**
 * POST /api/v2/edit — apply one conversational edit to a built V2 page.
 *
 * Body: { instruction, sections: [{ index, category, code }], targetIndex? }
 *   - instruction: e.g. "make the hero darker", "change the headline to X",
 *     "add a second button to the CTA"
 *   - sections: the page's current sections (the client holds the live code
 *     from the build stream and sends it back, so edits stack on the real
 *     current version, not a re-derivation).
 *   - targetIndex: optional — set when the user clicked a section in the
 *     preview (point-and-edit). Skips instruction routing entirely.
 *
 * Returns: { ok, index, category, html, js, code }
 *   The caller hot-swaps section `index` (the streaming iframe already knows
 *   how) — no full rebuild, ~one Sonnet call, a couple of seconds.
 *
 * On an ambiguous / page-wide instruction we return ok:false with a clear ask
 * rather than guessing and mangling the page.
 *
 * Runtime is nodejs (react-dom/server + the TypeScript transpiler need it).
 */

import { NextRequest } from "next/server";
import {
  renderComponentToHtml,
  compileComponentToModule,
  sectionWrap,
  normalizePageLinks,
} from "@/lib/v2/render-page";
import { routeEdit, editSection, type EditSection } from "@/lib/v2/edit-section";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest): Promise<Response> {
  let body: { instruction?: string; sections?: EditSection[]; targetIndex?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const instruction = (body.instruction || "").trim();
  const sections = Array.isArray(body.sections) ? body.sections : [];
  if (!instruction) {
    return Response.json({ ok: false, error: "Tell me what to change." }, { status: 400 });
  }
  if (sections.length === 0) {
    return Response.json({ ok: false, error: "No page to edit yet — build one first." }, { status: 400 });
  }

  const hasKey = Boolean(
    process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_AI_API_KEY,
  );
  if (!hasKey) {
    return Response.json(
      { ok: false, error: "Editing needs an AI key configured (ANTHROPIC_API_KEY)." },
      { status: 503 },
    );
  }

  try {
    // A clicked section (point-and-edit) beats instruction routing.
    const picked =
      typeof body.targetIndex === "number" && sections.some((s) => s.index === body.targetIndex)
        ? body.targetIndex
        : null;
    const index = picked !== null ? picked : await routeEdit(instruction, sections);
    if (index < 0) {
      return Response.json({
        ok: false,
        needsTarget: true,
        error: "Which part should I change? Name a section — e.g. “the hero”, “the pricing”, “the footer”.",
      });
    }
    const target = sections.find((s) => s.index === index);
    if (!target) {
      return Response.json({ ok: false, error: "Couldn't locate that section." }, { status: 400 });
    }

    const edited = await editSection(instruction, target.code, target.category);
    if (!edited) {
      return Response.json(
        { ok: false, error: "I couldn't apply that edit cleanly — try rephrasing, or be more specific." },
        { status: 422 },
      );
    }

    // Render + compile the edited section. If the edit produced code that
    // can't render, report it (and leave the page untouched) rather than
    // shipping a broken swap.
    let html: string;
    try {
      html = await renderComponentToHtml(edited);
    } catch {
      return Response.json(
        { ok: false, error: "That edit produced code that wouldn't render — the section is unchanged. Try rephrasing." },
        { status: 422 },
      );
    }
    let js: string | undefined;
    try {
      js = compileComponentToModule(edited);
    } catch {
      js = undefined; // section will still hot-swap as static
    }

    // Same link repair + anchor id as the build stream, so an edited section
    // keeps working in-page links and stays a valid anchor target.
    const presentCategories = new Set(sections.map((s) => s.category));
    return Response.json({
      ok: true,
      index,
      category: target.category,
      html: sectionWrap(index, normalizePageLinks(html, presentCategories), target.category),
      js,
      code: edited,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Edit failed unexpectedly.";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
