import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const domain = hostname.split(":")[0]; // strip port for localhost

  let rewritePath: string | null = null;
  let domainLabel = "com";

  if (domain === "zoobicon.ai" || domain.endsWith(".zoobicon.ai")) {
    rewritePath = "/ai";
    domainLabel = "ai";
  } else if (domain === "zoobicon.io" || domain.endsWith(".zoobicon.io")) {
    rewritePath = "/io";
    domainLabel = "io";
  } else if (domain === "zoobicon.sh" || domain.endsWith(".zoobicon.sh")) {
    rewritePath = "/sh";
    domainLabel = "sh";
  }

  // Only rewrite the root path; everything else passes through
  if (rewritePath && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = rewritePath;
    const response = NextResponse.rewrite(url);
    response.headers.set("x-zoobicon-domain", domainLabel);
    return response;
  }

  // Pass through — still tag the domain header
  const response = NextResponse.next();
  response.headers.set("x-zoobicon-domain", domainLabel);
  return response;
}

export const config = {
  matcher: "/",
};
