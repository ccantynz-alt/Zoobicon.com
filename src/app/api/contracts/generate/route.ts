import { NextResponse } from "next/server";
import {
  generateContract,
  type ContractType,
  type ContractParty,
} from "@/lib/contract-generator";

export const runtime = "nodejs";

interface GenerateBody {
  type?: ContractType;
  parties?: ContractParty[];
  terms?: Record<string, string | number | boolean>;
  userId?: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.ANTHROPIC_API_KEY || !process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Missing required env vars: ANTHROPIC_API_KEY, DATABASE_URL" },
      { status: 503 }
    );
  }
  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.type || !Array.isArray(body.parties) || !body.terms) {
    return NextResponse.json(
      { error: "type, parties, terms required" },
      { status: 400 }
    );
  }
  try {
    const contract = await generateContract({
      type: body.type,
      parties: body.parties,
      terms: body.terms,
      userId: body.userId,
    });
    return NextResponse.json({ contract });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
