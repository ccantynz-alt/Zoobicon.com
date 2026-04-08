import { NextResponse } from "next/server";
import { getWebContainerConfig } from "@/lib/webcontainers-preview";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const config = getWebContainerConfig();
  return NextResponse.json({
    "Cross-Origin-Opener-Policy": config.coopHeader,
    "Cross-Origin-Embedder-Policy": config.coepHeader,
    note:
      "Apply these headers on the page that hosts the WebContainers iframe. " +
      "Required for SharedArrayBuffer / cross-origin isolation.",
  });
}
