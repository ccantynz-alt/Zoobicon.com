import { NextResponse } from "next/server";
import {
  scoreLead,
  classifyLead,
  upsertLead,
  recommendNextAction,
  type Lead,
} from "@/lib/lead-scoring";

export const runtime = "nodejs";

interface ScoreRequestBody {
  email: string;
  name?: string;
  company?: string;
  title?: string;
  metadata?: Record<string, unknown>;
  persist?: boolean;
  recommend?: boolean;
}

export async function POST(req: Request): Promise<Response> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL is not set" },
      { status: 503 }
    );
  }
  let body: ScoreRequestBody;
  try {
    body = (await req.json()) as ScoreRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.email || typeof body.email !== "string") {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const partial: Pick<Lead, "email"> & Partial<Lead> = {
    email: body.email,
    name: body.name ?? null,
    company: body.company ?? null,
    title: body.title ?? null,
    metadata: (body.metadata as Lead["metadata"]) || {},
  };

  const score = scoreLead({ lead: partial });
  const classification = classifyLead(score);

  if (body.persist) {
    try {
      const lead = await upsertLead(partial);
      let recommendation = null;
      if (body.recommend) {
        recommendation = await recommendNextAction(lead);
      }
      return NextResponse.json({ lead, recommendation });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "DB error" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ score, classification });
}
