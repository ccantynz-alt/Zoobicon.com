import { NextRequest, NextResponse } from "next/server";
import { issueApiKey } from "@/lib/api-keys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface IssueBody {
  customerId?: string;
  label?: string;
  scopes?: string[];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (req.headers.get("x-admin") !== "1" && !req.headers.get("x-admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: IssueBody;
  try {
    body = (await req.json()) as IssueBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const customerId = body.customerId?.trim();
  const label = body.label?.trim();
  const scopes = Array.isArray(body.scopes) ? body.scopes : [];

  if (!customerId || !label) {
    return NextResponse.json(
      { error: "customerId and label are required" },
      { status: 400 }
    );
  }

  try {
    const issued = await issueApiKey(customerId, label, scopes);
    return NextResponse.json(issued, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to issue key";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
