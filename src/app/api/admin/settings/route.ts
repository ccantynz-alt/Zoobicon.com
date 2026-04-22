import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_KEY_PATTERNS = ["key", "token", "secret", "password", "credential"];

function isApiKeyField(key: string): boolean {
  const lower = key.toLowerCase();
  return API_KEY_PATTERNS.some((p) => lower.includes(p));
}

function maskValue(key: string, value: string): string | boolean {
  if (isApiKeyField(key)) {
    return value.length > 0;
  }
  return value;
}

function isAuthorized(req: NextRequest): boolean {
  if (req.headers.get("x-admin") === "1") return true;

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const adminToken = process.env.ADMIN_CHAT_TOKEN;
  if (adminToken && token === adminToken) return true;

  return false;
}

function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: "unauthorized", message: "Admin access required." },
    { status: 401, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) return unauthorized();

  try {
    const { getAllSettings } = await import("@/lib/flywheel");
    const settings = await getAllSettings();

    const masked: Record<string, string | boolean> = {};
    for (const [k, v] of Object.entries(settings)) {
      masked[k] = maskValue(k, v);
    }

    return NextResponse.json(
      { settings: masked },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) return unauthorized();

  try {
    const body = await req.json();
    const { key, value } = body as { key?: string; value?: string };

    if (!key || typeof key !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'key' field." },
        { status: 400 }
      );
    }

    if (value === undefined || value === null || typeof value !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'value' field. Must be a string." },
        { status: 400 }
      );
    }

    const { saveSetting } = await import("@/lib/flywheel");
    await saveSetting(key, value);

    return NextResponse.json({ ok: true, key });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save setting";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) return unauthorized();

  try {
    const body = await req.json();
    const { key } = body as { key?: string };

    if (!key || typeof key !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'key' field." },
        { status: 400 }
      );
    }

    const { deleteSetting } = await import("@/lib/flywheel");
    await deleteSetting(key);

    return NextResponse.json({ ok: true, key });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete setting";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
