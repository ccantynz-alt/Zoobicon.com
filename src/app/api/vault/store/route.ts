import { NextResponse } from "next/server";
import {
  storeSecret,
  VaultUnavailableError,
  type SecretType,
} from "@/lib/password-vault";

export const runtime = "nodejs";

const VALID_TYPES: readonly SecretType[] = [
  "api_key",
  "password",
  "token",
  "certificate",
  "note",
];

interface Body {
  userId?: unknown;
  name?: unknown;
  value?: unknown;
  type?: unknown;
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as Body;
    const { userId, name, value, type } = body;
    if (
      typeof userId !== "string" ||
      typeof name !== "string" ||
      typeof value !== "string" ||
      typeof type !== "string"
    ) {
      return NextResponse.json(
        { error: "userId, name, value, type required as strings" },
        { status: 400 },
      );
    }
    if (!VALID_TYPES.includes(type as SecretType)) {
      return NextResponse.json(
        { error: `type must be one of ${VALID_TYPES.join(", ")}` },
        { status: 400 },
      );
    }
    const record = await storeSecret({
      userId,
      name,
      value,
      type: type as SecretType,
    });
    return NextResponse.json({ secret: record });
  } catch (err) {
    if (err instanceof VaultUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
