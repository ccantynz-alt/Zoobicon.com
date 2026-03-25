"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Auto-submits the current page to IndexNow for instant search engine indexing.
 * Runs once per page visit. Debounced to avoid spam.
 */
export default function AutoIndexNow() {
  const pathname = usePathname();

  useEffect(() => {
    // Only submit public pages, not admin/auth/API
    if (pathname.startsWith("/admin") || pathname.startsWith("/auth") ||
        pathname.startsWith("/api") || pathname.startsWith("/dashboard") ||
        pathname.startsWith("/edit")) return;

    // Debounce: only submit once per page per session
    const key = `indexnow:${pathname}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    // Fire and forget — don't block rendering
    fetch("/api/seo/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: [`${window.location.origin}${pathname}`] }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
