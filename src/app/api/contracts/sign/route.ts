import { NextResponse } from "next/server";
import { eSign } from "@/lib/contract-generator";

export const runtime = "nodejs";

interface SignBody {
  contractId?: string;
  signerEmail?: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Missing required env var: DATABASE_URL" },
      { status: 503 }
    );
  }
  let body: SignBody;
  try {
    body = (await req.json()) as SignBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.contractId || !body.signerEmail) {
    return NextResponse.json(
      { error: "contractId and signerEmail required" },
      { status: 400 }
    );
  }
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    undefined;
  try {
    const result = await eSign({
      contractId: body.contractId,
      signerEmail: body.signerEmail,
      ip,
    });
    return NextResponse.json({ signature: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
