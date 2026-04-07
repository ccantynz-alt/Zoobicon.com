import { NextRequest, NextResponse } from "next/server";
import { createShortLink, listShortLinks } from "@/lib/url-shortener";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", hint: "POST { targetUrl: 'https://...' }" },
      { status: 400 }
    );
  }

  const { targetUrl, createdBy } = (body ?? {}) as {
    targetUrl?: string;
    createdBy?: string;
  };

  if (!targetUrl || typeof targetUrl !== "string") {
    return NextResponse.json(
      {
        error: "Missing required field: targetUrl",
        hint: "POST { targetUrl: 'https://example.com' }",
      },
      { status: 400 }
    );
  }

  try {
    const result = await createShortLink(targetUrl, createdBy);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to create short link", details: message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const createdBy = searchParams.get("createdBy");

  if (!createdBy) {
    return NextResponse.json(
      {
        error: "Missing required parameter: createdBy",
        hint: "GET /api/short?createdBy=user_id",
      },
      { status: 400 }
    );
  }

  try {
    const links = await listShortLinks(createdBy);
    return NextResponse.json({ links }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to list short links", details: message },
      { status: 500 }
    );
  }
}
